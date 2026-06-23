/* =================================================================
   app.js — assemblage de la maquette
   -----------------------------------------------------------------
   • Génère les cartes d'épisode à partir de PODCAST_EPISODES
     (chacune reçoit automatiquement le design + sa pochette animée).
   • Gère le lecteur sticky (lecture, pause, forme d'onde, temps).
   • Gère la démo de publication : un formulaire qui ajoute un épisode
     stylé instantanément — pour montrer « publier = design appliqué ».
   ================================================================= */

(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const audioEl = $("#audio");
  const engine = new window.AudioEngine(audioEl);

  // État de lecture
  const state = { index: null, playing: false, useFake: false, fakeStart: 0, fakeDur: 0 };
  const visualizers = []; // { el, vis } par épisode

  const episodes = window.PODCAST_EPISODES.slice();

  /* ---------- utilitaires ---------- */
  function parseDuration(str) {
    const m = /(\d+)\s*min/.exec(str || "");
    return m ? parseInt(m[1], 10) * 60 : 25 * 60;
  }
  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ":" + String(s).padStart(2, "0");
  }
  function monogram(title) {
    const w = title.replace(/[«»",.:]/g, "").split(/\s+/).filter(Boolean);
    return ((w[0] || "S")[0] + (w[1] || w[0] || "E")[0]).toUpperCase();
  }

  /* ---------- rendu d'une carte ---------- */
  function buildCard(ep, idx, isNew) {
    const card = document.createElement("article");
    card.className = "ep-card" + (isNew ? " ep-card--new" : "");
    card.dataset.index = idx;
    card.innerHTML = `
      <div class="ep-card__cover">
        <canvas width="480" height="300" aria-hidden="true"></canvas>
        <span class="ep-card__num">Épisode ${ep.number}</span>
        <span class="ep-card__seal">${monogram(ep.title)}</span>
      </div>
      <div class="ep-card__body">
        <h3 class="ep-card__title">${ep.title}</h3>
        <p class="ep-card__desc">${ep.description || ""}</p>
        <div class="ep-card__foot">
          <span class="ep-card__meta">${ep.duration || ""}</span>
          <button class="ep-play" type="button">
            <span aria-hidden="true">▶</span> Écouter
          </button>
        </div>
      </div>`;

    const canvas = $("canvas", card);
    const vis = new window.Visualizer(canvas, engine, { seed: ep.number, bars: 56 });
    vis.start();
    visualizers[idx] = { el: card, vis };

    $(".ep-play", card).addEventListener("click", () => playEpisode(idx));
    return card;
  }

  function renderAll() {
    const grid = $("#episodes-grid");
    grid.innerHTML = "";
    episodes.forEach((ep, i) => grid.appendChild(buildCard(ep, i)));
    observeCards();
  }

  // N'anime que les pochettes visibles (performance).
  function observeCards() {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const idx = +e.target.dataset.index;
        if (visualizers[idx]) visualizers[idx].vis.setVisible(e.isIntersecting);
      });
    }, { rootMargin: "120px" });
    document.querySelectorAll(".ep-card").forEach((c) => io.observe(c));
  }

  /* ---------- lecteur ---------- */
  const player = $("#player");
  const playerCanvas = $("#player-canvas");
  const playerVis = new window.Visualizer(playerCanvas, engine, { seed: 0, bars: 40 });
  const wave = new window.WaveStrip($("#player-wave"), engine, getProgress);

  function getProgress() {
    if (state.useFake) {
      if (!state.playing) return state._fakeFrozen || 0;
      return Math.min(1, (performance.now() - state.fakeStart) / 1000 / state.fakeDur);
    }
    return audioEl.duration ? audioEl.currentTime / audioEl.duration : 0;
  }
  function currentTimeSec() {
    if (state.useFake) return getProgress() * state.fakeDur;
    return audioEl.currentTime || 0;
  }

  function playEpisode(idx) {
    const ep = episodes[idx];
    state.index = idx;

    engine.init();
    engine.resume();

    // UI lecteur
    player.hidden = false;
    $("#player-title").textContent = ep.title;
    $("#player-meta").textContent = "Épisode " + ep.number + " · " + (ep.duration || "");
    playerVis.setSeed(ep.number);
    playerVis.start();
    wave.start();

    document.querySelectorAll(".ep-card").forEach((c) =>
      c.classList.toggle("is-playing", +c.dataset.index === idx));

    if (ep.audio) {
      state.useFake = false;
      audioEl.src = ep.audio;
      engine.connectMedia();
      audioEl.play().then(() => {
        engine.playing = true; state.playing = true; updateToggle();
      }).catch(() => startFake(ep)); // lecture refusée → on bascule en démo
    } else {
      startFake(ep);
    }
  }

  function startFake(ep) {
    state.useFake = true;
    state.fakeDur = parseDuration(ep.duration);
    state.fakeStart = performance.now();
    state._fakeFrozen = 0;
    engine.playing = true; state.playing = true;
    updateToggle();
  }

  function togglePlay() {
    if (state.index === null) return;
    if (state.useFake) {
      if (state.playing) {
        state._fakeFrozen = getProgress();
        state.playing = false; engine.playing = false;
      } else {
        state.fakeStart = performance.now() - state._fakeFrozen * state.fakeDur * 1000;
        state.playing = true; engine.playing = true;
      }
    } else {
      if (audioEl.paused) { audioEl.play(); engine.playing = true; state.playing = true; }
      else { audioEl.pause(); engine.playing = false; state.playing = false; }
    }
    updateToggle();
  }

  function updateToggle() {
    $("#player-toggle").textContent = state.playing ? "❚❚" : "▶";
  }

  function closePlayer() {
    audioEl.pause();
    state.playing = false; engine.playing = false;
    player.hidden = true;
    playerVis.stop(); wave.stop();
    document.querySelectorAll(".ep-card.is-playing").forEach((c) => c.classList.remove("is-playing"));
    state.index = null;
  }

  // horloge d'affichage + fin de lecture
  setInterval(() => {
    if (state.index === null || !state.playing) return;
    $("#player-time").textContent = fmt(currentTimeSec());
    if (state.useFake && getProgress() >= 1) { state.playing = false; engine.playing = false; updateToggle(); }
  }, 250);

  audioEl.addEventListener("ended", () => { state.playing = false; engine.playing = false; updateToggle(); });
  audioEl.addEventListener("timeupdate", () => { if (!state.useFake) $("#player-time").textContent = fmt(audioEl.currentTime); });

  $("#player-toggle").addEventListener("click", togglePlay);
  $("#player-close").addEventListener("click", closePlayer);

  // clic sur la forme d'onde = navigation
  $("#player-wave").addEventListener("click", (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (state.useFake) {
      state.fakeStart = performance.now() - ratio * state.fakeDur * 1000;
      state._fakeFrozen = ratio;
    } else if (audioEl.duration) {
      audioEl.currentTime = ratio * audioEl.duration;
    }
  });

  /* ---------- hero ---------- */
  const heroVis = new window.Visualizer($("#hero-cover .cover__canvas"), engine, { seed: 1, bars: 72 });
  heroVis.start();
  $("#hero-play").addEventListener("click", () => playEpisode(0));
  // synchronise le médaillon du hero
  $(".cover__monogram").textContent = monogram(episodes[0].title);

  /* ---------- démo de publication ---------- */
  $("#publish-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const file = f.audio.files[0];
    const ep = {
      number: parseInt(f.number.value, 10) || (episodes.length + 1),
      title: f.title.value.trim() || "Nouvel épisode",
      duration: f.duration.value.trim() || "—",
      date: new Date().toISOString().slice(0, 10),
      description: f.description.value.trim() || "Épisode publié à l'instant — le design s'est appliqué tout seul.",
      audio: file ? URL.createObjectURL(file) : ""
    };
    episodes.unshift(ep);

    // ré-indexe et ré-affiche (le nouvel épisode arrive en tête, animé)
    visualizers.forEach((v) => v && v.vis.stop());
    visualizers.length = 0;
    const grid = $("#episodes-grid");
    grid.innerHTML = "";
    episodes.forEach((item, i) => grid.appendChild(buildCard(item, i, i === 0)));
    observeCards();

    f.reset();
    toast("Publié ✦ Le design s'est appliqué automatiquement");
    document.getElementById("episodes").scrollIntoView({ behavior: "smooth" });
  });

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  /* ---------- init ---------- */
  renderAll();
})();
