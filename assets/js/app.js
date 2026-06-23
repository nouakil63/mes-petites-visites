/* =================================================================
   app.js — assemblage de la plateforme
   -----------------------------------------------------------------
   • Grille d'épisodes générée depuis PODCAST_EPISODES (+ publiés).
   • Clic sur un épisode → POP-UP avec la pochette animée au rythme
     de la parole (RingWave) et les contrôles de lecture.
   • Lecteur réduit (barre) quand le pop-up est fermé pendant l'écoute.
   • Section « Le tableau décrypté » : points cliquables sur l'œuvre.
   ================================================================= */

(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const PAD = (n) => String(n).padStart(2, "0");

  /* ---------- données ---------- */
  function loadEpisodes() {
    let pub = [];
    try { pub = JSON.parse(localStorage.getItem("mpv_episodes") || "[]"); } catch (e) {}
    return pub.concat(window.PODCAST_EPISODES.slice());
  }
  let episodes = loadEpisodes();

  /* ---------- tableau (multi-extensions) ---------- */
  const painting = new Image();
  (function resolve(i) {
    const names = ["assets/img/eugenie.jpg", "assets/img/eugenie.jpeg", "assets/img/eugenie.png", "assets/img/eugenie.webp"];
    if (i >= names.length) return;
    const probe = new Image();
    probe.onload = () => {
      painting.src = names[i];
      document.documentElement.style.setProperty("--painting", 'url("' + names[i] + '")');
    };
    probe.onerror = () => resolve(i + 1);
    probe.src = names[i];
  })(0);

  /* ---------- audio ---------- */
  const audioEl = $("#audio");
  const engine = new window.AudioEngine(audioEl);
  const ring = new window.RingWave($("#modal-canvas"), engine, { image: painting, bars: 15 });
  const state = { index: null, playing: false, useFake: false, fakeStart: 0, fakeDur: 0, frozen: 0 };
  let lastFocus = null;

  const parseDur = (s) => {
    const m = String(s || "").split(":");
    if (m.length === 2) return (+m[0]) * 60 + (+m[1]);
    const x = /(\d+)\s*min/.exec(s || ""); return x ? +x[1] * 60 : 14 * 60;
  };
  const fmt = (sec) => { if (!isFinite(sec) || sec < 0) sec = 0; return PAD(Math.floor(sec / 60)) + ":" + PAD(Math.floor(sec % 60)); };
  function setIcon(btn, name) { const u = btn && btn.querySelector("use"); if (u) { u.setAttribute("href", "#" + name); try { u.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + name); } catch (e) {} } }

  /* ---------- grille ---------- */
  function coverStyle(ep) {
    const pos = (ep.pos == null ? 50 : ep.pos) + "%";
    return 'background-image: var(--painting, none); background-position: ' + pos + ' 28%;';
  }
  function buildCard(ep, idx, isNew) {
    const li = document.createElement("article");
    li.className = "card reveal" + (isNew ? " is-new" : "");
    li.tabIndex = 0; li.setAttribute("role", "button");
    li.setAttribute("aria-label", "Écouter : " + ep.title);
    li.dataset.index = idx;
    li.innerHTML =
      '<div class="card__cover" style="' + coverStyle(ep) + '">' +
        '<span class="card__cat">' + ep.category + '</span>' +
        '<span class="card__dur">' + ep.duration + '</span>' +
        '<span class="card__play"><svg class="ico"><use href="#i-play"/></svg></span>' +
      '</div>' +
      '<div class="card__body">' +
        '<span class="card__num">Épisode ' + ep.number + '</span>' +
        '<h3 class="card__title">' + ep.title + '</h3>' +
        '<p class="card__desc">' + ep.description + '</p>' +
      '</div>';
    const open = () => playEpisode(idx, true);
    li.addEventListener("click", open);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    return li;
  }
  function renderGrid() {
    const grid = $("#grid"); grid.innerHTML = "";
    episodes.forEach((ep, i) => grid.appendChild(buildCard(ep, i, ep._new)));
    episodes.forEach((ep) => { if (ep._new) delete ep._new; });
    observeReveal();
  }

  /* ---------- à la une ---------- */
  function renderFeatured() {
    const ep = episodes[0];
    $("#feat-cover").style.cssText = coverStyle(ep);
    $("#feat-cat").textContent = "Épisode " + ep.number + " · " + ep.category;
    $("#feat-title").textContent = ep.title;
    $("#feat-desc").textContent = ep.description;
  }

  /* ---------- lecture ---------- */
  function getProgress() {
    if (state.useFake) return state.playing ? Math.min(1, (performance.now() - state.fakeStart) / 1000 / state.fakeDur) : state.frozen;
    return audioEl.duration ? audioEl.currentTime / audioEl.duration : 0;
  }
  const curSec = () => state.useFake ? getProgress() * state.fakeDur : (audioEl.currentTime || 0);
  const totSec = () => state.useFake ? state.fakeDur : (audioEl.duration || parseDur(episodes[state.index] && episodes[state.index].duration));

  function playEpisode(idx, openIt) {
    const ep = episodes[idx];
    const switching = state.index !== idx;
    state.index = idx;
    engine.init(); engine.resume();

    // contenu pop-up + barre
    $("#m-cat").textContent = "Épisode " + ep.number + " · " + ep.category;
    $("#m-title").textContent = ep.title;
    $("#m-desc").textContent = ep.description;
    $("#bar-title").textContent = ep.title;
    $("#bar-cat").textContent = "Épisode " + ep.number + " · " + ep.category;
    $("#bar-thumb").style.cssText = coverStyle(ep);
    ring.setImage(painting);

    $$(".card").forEach((c) => c.classList.toggle("is-playing", +c.dataset.index === idx));

    if (switching || !state.playing) {
      if (ep.audio) {
        state.useFake = false; audioEl.src = ep.audio; engine.connectMedia();
        audioEl.play().then(() => { engine.playing = true; state.playing = true; reflect(); }).catch(() => startFake(ep));
      } else { startFake(ep); }
    }
    $("#m-tot").textContent = fmt(totSec());
    if (openIt) openModal(); else showBar();
  }
  function startFake(ep) {
    state.useFake = true; state.fakeDur = parseDur(ep.duration);
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
  function skip(delta) {
    const ratio = Math.max(0, Math.min(1, (curSec() + delta) / totSec()));
    seek(ratio);
  }
  function seek(ratio) {
    if (state.useFake) { state.fakeStart = performance.now() - ratio * state.fakeDur * 1000; state.frozen = ratio; }
    else if (audioEl.duration) audioEl.currentTime = ratio * audioEl.duration;
    updateProgress();
  }
  function reflect() {
    setIcon($("#m-toggle"), state.playing ? "i-pause" : "i-play");
    setIcon($("#bar-toggle"), state.playing ? "i-pause" : "i-play");
    $("#bar").classList.toggle("is-on", state.playing || state.index !== null);
  }
  function updateProgress() {
    const p = getProgress() * 100;
    $("#m-fill").style.width = p + "%";
    $("#bar-fill").style.width = p + "%";
    $("#m-cur").textContent = fmt(curSec());
    $("#m-tot").textContent = fmt(totSec());
  }
  setInterval(() => {
    if (state.index === null) return;
    updateProgress();
    if (state.playing && state.useFake && getProgress() >= 1) { state.playing = false; engine.playing = false; reflect(); }
  }, 200);
  audioEl.addEventListener("ended", () => { state.playing = false; engine.playing = false; reflect(); });

  /* ---------- pop-up ---------- */
  const modal = $("#modal");
  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.documentElement.style.overflow = "hidden";
    ring.fit(); ring.start();
    requestAnimationFrame(() => { modal.classList.add("is-open"); $("#m-close").focus(); });
  }
  function closeModal() {
    modal.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    setTimeout(() => { modal.hidden = true; ring.stop(); }, 320);
    if (state.index !== null) showBar();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function showBar() { $("#bar").classList.add("is-on"); }
  function hideBar() { $("#bar").classList.remove("is-on"); }

  $$("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  $("#m-toggle").addEventListener("click", togglePlay);
  $("#m-back").addEventListener("click", () => skip(-15));
  $("#m-fwd").addEventListener("click", () => skip(15));
  $("#m-track").addEventListener("click", (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    seek((e.clientX - r.left) / r.width);
  });

  /* ---------- barre réduite ---------- */
  $("#bar-toggle").addEventListener("click", togglePlay);
  $("#bar-open").addEventListener("click", openModal);
  $("#bar-close").addEventListener("click", () => {
    audioEl.pause(); state.playing = false; engine.playing = false; state.index = null;
    hideBar(); $$(".card.is-playing").forEach((c) => c.classList.remove("is-playing"));
  });

  /* ---------- raccourcis ---------- */
  $("#hero-listen").addEventListener("click", () => playEpisode(0, true));
  $("#feat-play").addEventListener("click", () => playEpisode(0, true));

  /* ---------- tableau décrypté (points) ---------- */
  $$(".hotspot").forEach((h) => {
    h.addEventListener("click", () => {
      const active = h.classList.contains("is-active");
      $$(".hotspot").forEach((x) => x.classList.remove("is-active"));
      const cap = $("#tableau-cap");
      if (active) { h.classList.remove("is-active"); cap.classList.remove("is-show"); return; }
      h.classList.add("is-active");
      $("#cap-title").textContent = h.dataset.title || "";
      $("#cap-text").textContent = h.dataset.cap || "";
      cap.classList.add("is-show");
    });
  });

  /* ---------- révélation au défilement ---------- */
  let io;
  function observeReveal() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach((e) => e.classList.add("is-in")); return; }
    if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "-6% 0px" });
    $$(".reveal:not(.is-in)").forEach((e) => io.observe(e));
  }

  /* ---------- navbar à l'ombre ---------- */
  const nav = $(".navbar");
  addEventListener("scroll", () => nav.classList.toggle("is-scrolled", scrollY > 24), { passive: true });

  /* ---------- init ---------- */
  renderFeatured();
  renderGrid();
  observeReveal();
})();
