/* =================================================================
   app.js — assemblage de la page
   -----------------------------------------------------------------
   • Charge le tableau et le sertit dans les médaillons animés.
   • Construit l'index des épisodes (les épisodes publiés depuis
     l'« Espace de publication » sont lus dans localStorage et
     s'affichent ici, déjà mis en page — le design suit tout seul).
   • Gère le lecteur, l'épisode « à l'écoute » et la révélation au
     défilement.
   ================================================================= */

(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const PAD = (n) => String(n).padStart(2, "0");

  /* ---------- données ---------- */
  function loadEpisodes() {
    let published = [];
    try { published = JSON.parse(localStorage.getItem("mpv_episodes") || "[]"); } catch (e) {}
    return published.concat(window.PODCAST_EPISODES.slice());
  }
  let episodes = loadEpisodes();

  /* ---------- tableau (médaillon + hero) ---------- */
  // On accepte plusieurs extensions : déposez simplement assets/img/eugenie.(jpg|png|…)
  const painting = new Image();
  (function resolvePainting(i) {
    const names = ["assets/img/eugenie.jpg", "assets/img/eugenie.jpeg", "assets/img/eugenie.png", "assets/img/eugenie.webp"];
    if (i >= names.length) return; // pas de toile : repli sur le vert sombre du tableau
    const probe = new Image();
    probe.onload = () => {
      painting.src = names[i];
      document.documentElement.style.setProperty("--painting", 'url("' + names[i] + '")');
    };
    probe.onerror = () => resolvePainting(i + 1);
    probe.src = names[i];
  })(0);

  /* ---------- audio ---------- */
  const audioEl = $("#audio");
  const engine = new window.AudioEngine(audioEl);
  const state = { index: null, playing: false, useFake: false, fakeStart: 0, fakeDur: 0, frozen: 0 };

  /* ---------- visualiseurs ---------- */
  const featureVis = new window.Visualizer($("#feature-canvas"), engine, { seed: 1, bars: 84, image: painting });
  featureVis.start();
  const playerVis = new window.Visualizer($("#player-canvas"), engine, { seed: 1, bars: 32, image: painting });
  const wave = new window.WaveStrip($("#player-wave"), engine, getProgress);
  const rowVis = {};

  /* ---------- utilitaires ---------- */
  const parseDuration = (s) => { const m = /(\d+)\s*min/.exec(s || ""); return m ? +m[1] * 60 : 25 * 60; };
  const fmt = (sec) => { if (!isFinite(sec) || sec < 0) sec = 0; return Math.floor(sec / 60) + ":" + PAD(Math.floor(sec % 60)); };
  function setIcon(btn, name) { const u = btn.querySelector("use"); if (u) { u.setAttribute("href", "#" + name); u.setAttributeNS && u.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + name); } }

  /* ---------- index des épisodes ---------- */
  function renderIndex() {
    const ol = $("#index");
    ol.innerHTML = "";
    Object.keys(rowVis).forEach((k) => rowVis[k].stop()); for (const k in rowVis) delete rowVis[k];
    episodes.forEach((ep, i) => ol.appendChild(buildEntry(ep, i, ep._new)));
  }
  function buildEntry(ep, idx, isNew) {
    const li = document.createElement("li");
    li.className = "entry" + (isNew ? " is-new" : "");
    li.dataset.index = idx;
    li.innerHTML = `
      <div class="entry__num"><span>${PAD(ep.number)}</span><canvas width="128" height="128" aria-hidden="true"></canvas></div>
      <div class="entry__body">
        <h3 class="entry__title">${ep.title}</h3>
        <p class="entry__dek">${ep.description || ""}</p>
      </div>
      <span class="entry__dur">${ep.duration || ""}</span>
      <button class="entry__play" type="button" aria-label="Écouter : ${ep.title}">
        <svg class="ico"><use href="#i-play"/></svg>
      </button>`;
    $(".entry__play", li).addEventListener("click", () => playEpisode(idx));
    if (ep._new) delete ep._new;
    return li;
  }

  /* ---------- épisode « à l'écoute » ---------- */
  function setFeature(ep) {
    $("#feature-title").textContent = ep.title;
    $("#feature-meta").textContent = "Épisode " + ep.number + " · " + (ep.duration || "");
    $("#feature-dek").textContent = ep.description || "";
    featureVis.setSeed(ep.number);
  }

  /* ---------- lecture ---------- */
  function getProgress() {
    if (state.useFake) return state.playing ? Math.min(1, (performance.now() - state.fakeStart) / 1000 / state.fakeDur) : state.frozen;
    return audioEl.duration ? audioEl.currentTime / audioEl.duration : 0;
  }
  const currentTimeSec = () => state.useFake ? getProgress() * state.fakeDur : (audioEl.currentTime || 0);

  function playEpisode(idx) {
    const ep = episodes[idx];
    state.index = idx;
    engine.init(); engine.resume();
    setFeature(ep);

    // lecteur
    $("#player").hidden = false;
    $("#player-title").textContent = ep.title;
    $("#player-meta").textContent = "Épisode " + ep.number + " · " + (ep.duration || "");
    playerVis.fit(); wave.fit(); // le lecteur était masqué : on (re)mesure les canvas
    playerVis.setSeed(ep.number); playerVis.start(); wave.start();

    // états de ligne
    document.querySelectorAll(".entry").forEach((e) => {
      const on = +e.dataset.index === idx;
      e.classList.toggle("is-playing", on);
      const k = e.dataset.index;
      if (on) {
        if (!rowVis[k]) rowVis[k] = new window.Visualizer($("canvas", $(".entry__num", e)), engine, { seed: ep.number, bars: 40, image: painting });
        rowVis[k].start();
      } else if (rowVis[k]) { rowVis[k].stop(); }
    });

    if (ep.audio) {
      state.useFake = false;
      audioEl.src = ep.audio; engine.connectMedia();
      audioEl.play().then(() => { engine.playing = true; state.playing = true; reflect(); }).catch(() => startFake(ep));
    } else { startFake(ep); }
  }
  function startFake(ep) {
    state.useFake = true; state.fakeDur = parseDuration(ep.duration);
    state.fakeStart = performance.now(); state.frozen = 0;
    engine.playing = true; state.playing = true; reflect();
  }
  function togglePlay() {
    if (state.index === null) return;
    if (state.useFake) {
      if (state.playing) { state.frozen = getProgress(); state.playing = false; engine.playing = false; }
      else { state.fakeStart = performance.now() - state.frozen * state.fakeDur * 1000; state.playing = true; engine.playing = true; }
    } else {
      if (audioEl.paused) { audioEl.play(); engine.playing = true; state.playing = true; }
      else { audioEl.pause(); engine.playing = false; state.playing = false; }
    }
    reflect();
  }
  function reflect() { setIcon($("#player-toggle"), state.playing ? "i-pause" : "i-play"); }
  function closePlayer() {
    audioEl.pause(); state.playing = false; engine.playing = false;
    $("#player").hidden = true; playerVis.stop(); wave.stop();
    document.querySelectorAll(".entry.is-playing").forEach((e) => { e.classList.remove("is-playing"); if (rowVis[e.dataset.index]) rowVis[e.dataset.index].stop(); });
    state.index = null;
  }

  setInterval(() => {
    if (state.index === null || !state.playing) return;
    $("#player-time").textContent = fmt(currentTimeSec());
    if (state.useFake && getProgress() >= 1) { state.playing = false; engine.playing = false; reflect(); }
  }, 250);
  audioEl.addEventListener("ended", () => { state.playing = false; engine.playing = false; reflect(); });
  audioEl.addEventListener("timeupdate", () => { if (!state.useFake) $("#player-time").textContent = fmt(audioEl.currentTime); });

  $("#player-toggle").addEventListener("click", togglePlay);
  $("#player-close").addEventListener("click", closePlayer);
  $("#player-wave-wrap").addEventListener("click", (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    if (state.useFake) { state.fakeStart = performance.now() - ratio * state.fakeDur * 1000; state.frozen = ratio; }
    else if (audioEl.duration) audioEl.currentTime = ratio * audioEl.duration;
  });

  /* ---------- raccourcis hero / feature ---------- */
  $("#hero-listen").addEventListener("click", () => playEpisode(0));
  $("#feature-listen").addEventListener("click", () => playEpisode(0));

  /* ---------- révélation au défilement ---------- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "-8% 0px" });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  } else { document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in")); }

  /* ---------- masthead à l'ombre au défilement ---------- */
  const mast = $(".masthead");
  addEventListener("scroll", () => mast.classList.toggle("is-scrolled", scrollY > 8), { passive: true });

  /* ---------- init ---------- */
  setFeature(episodes[0]);
  $("#hero-listen-txt").textContent = "Écouter l'épisode " + episodes[0].number;
  renderIndex();
})();
