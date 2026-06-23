/* =================================================================
   visualizer.js — l'animation « au rythme de la parole »
   -----------------------------------------------------------------
   Deux briques :
     • AudioEngine  : fournit le spectre sonore. S'il y a un vrai fichier
                      audio en lecture, il utilise la Web Audio API
                      (AnalyserNode). Sinon, il simule une cadence de
                      parole pour que la maquette s'anime quand même.
     • Visualizer   : dessine la pochette circulaire animée — ondes
                      concentriques + égaliseur en couronne + médaillon
                      qui pulse (inspiré de l'exemple Napoleonica).
     • WaveStrip    : la forme d'onde linéaire du lecteur en bas de page.

   Tout est en <canvas> pour rester fluide, et respecte
   prefers-reduced-motion.
   ================================================================= */

(function () {
  "use strict";

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Palettes « univers du tableau » — quelques variantes en harmonie.
  const PALETTES = [
    { a: "#2E9E86", b: "#E7CE8C", c: "#E4A9AE" }, // émeraude / or / rose
    { a: "#1E6B57", b: "#C9A24B", c: "#8E9679" }, // sapin / or / sauge
    { a: "#3C5A86", b: "#E7CE8C", c: "#2E9E86" }, // ruban bleu / or / émeraude
    { a: "#2E9E86", b: "#F4ECD6", c: "#C76E78" }  // émeraude / ivoire / rose profond
  ];

  /* --------------------------------------------------------------
     AudioEngine : une seule instance partagée pour toute la page.
     -------------------------------------------------------------- */
  class AudioEngine {
    constructor(audioEl) {
      this.audio = audioEl;
      this.ctx = null;
      this.analyser = null;
      this.source = null;
      this.bins = null;
      this.connected = false;
      this.playing = false;     // un vrai média est-il en lecture ?
      this._t = Math.random() * 100;
      this._smooth = new Float32Array(128);
      this._last = performance.now();
    }

    // Créé au premier geste utilisateur (politique navigateur).
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.8;
        this.bins = new Uint8Array(this.analyser.frequencyBinCount);
      } catch (e) { /* pas de Web Audio : on reste en simulation */ }
    }

    connectMedia() {
      if (!this.ctx || this.connected) return;
      try {
        this.source = this.ctx.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.connected = true;
      } catch (e) { /* source déjà connectée ou bloquée : simulation */ }
    }

    resume() { if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); }

    // Renvoie un spectre normalisé (0..1) de longueur `count`, lissé.
    sample(count) {
      const now = performance.now();
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now;
      this._t += dt;

      const out = new Float32Array(count);
      let real = false;

      if (this.analyser && this.playing && !this.audio.paused) {
        this.analyser.getByteFrequencyData(this.bins);
        let sum = 0;
        for (let i = 0; i < this.bins.length; i++) sum += this.bins[i];
        if (sum > 30) {
          real = true;
          // ré-échantillonnage des bins utiles vers `count`
          const usable = Math.floor(this.bins.length * 0.7);
          for (let i = 0; i < count; i++) {
            const idx = Math.floor((i / count) * usable);
            out[i] = this.bins[idx] / 255;
          }
        }
      }

      if (!real) this._simulate(out, count);

      // lissage temporel
      for (let i = 0; i < count; i++) {
        const s = this._smooth[i] || 0;
        this._smooth[i] = s + (out[i] - s) * (real ? 0.5 : 0.25);
        out[i] = this._smooth[i];
      }
      return out;
    }

    // Cadence de parole synthétique : syllabes + pauses entre mots.
    _simulate(out, count) {
      const t = this._t;
      const idle = !this.playing;
      // enveloppe syllabique (~3,4 syll/s) + respiration lente
      const syll = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 3.4);
      const breath = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.45 + 1.1);
      const gate = Math.max(0, breath - 0.2);
      let env = syll * gate;
      env = idle ? 0.12 + env * 0.10 : 0.25 + env * 0.75;

      for (let i = 0; i < count; i++) {
        const f = i / count;
        // forme spectrale : grave dominant, deux « formants »
        const shape = Math.exp(-f * 2.4) * (1 + 0.6 * Math.exp(-Math.pow((f - 0.18) / 0.08, 2))
                                              + 0.4 * Math.exp(-Math.pow((f - 0.42) / 0.10, 2)));
        const n = 0.6 + 0.4 * this._noise(i * 1.7 + t * 6.0);
        out[i] = Math.min(1, env * shape * n);
      }
    }

    _noise(x) { const s = Math.sin(x * 12.9898) * 43758.5453; return (s - Math.floor(s)); }

    get level() {
      let m = 0;
      for (let i = 0; i < this._smooth.length; i++) m = Math.max(m, this._smooth[i]);
      return m;
    }
  }

  /* --------------------------------------------------------------
     Visualizer : pochette circulaire animée.
     -------------------------------------------------------------- */
  class Visualizer {
    constructor(canvas, engine, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.engine = engine;
      this.bars = opts.bars || 64;
      this.palette = PALETTES[(opts.seed || 0) % PALETTES.length];
      this.ripples = [];
      this._lastBeat = 0;
      this._raf = null;
      this._visible = true;
      this._dpr = Math.min(2, window.devicePixelRatio || 1);
      this.fit();
      window.addEventListener("resize", () => this.fit());
    }

    fit() {
      const r = this.canvas.getBoundingClientRect();
      const w = r.width || this.canvas.width, h = r.height || this.canvas.height;
      this.canvas.width = w * this._dpr;
      this.canvas.height = h * this._dpr;
      this.w = w; this.h = h;
    }

    start() { if (!this._raf) this._loop(); }
    stop() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; }
    setVisible(v) { this._visible = v; }
    setSeed(seed) { this.palette = PALETTES[seed % PALETTES.length]; }

    _loop() {
      this._raf = requestAnimationFrame(() => this._loop());
      if (this._visible) this._draw();
    }

    _draw() {
      const ctx = this.ctx, dpr = this._dpr, w = this.w, h = this.h;
      const cx = (w / 2) * dpr, cy = (h / 2) * dpr;
      const R = Math.min(w, h) * 0.5 * dpr;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const spec = this.engine.sample(this.bars);
      const level = this.engine.level;
      const t = performance.now() / 1000;

      // — ondes concentriques : une onde naît sur chaque « pic » de voix —
      if (!REDUCED && level > 0.42 && t - this._lastBeat > 0.16) {
        this.ripples.push({ r: R * 0.46, a: 0.5 });
        this._lastBeat = t;
      }
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const rp = this.ripples[i];
        rp.r += R * 0.012;
        rp.a -= 0.012;
        if (rp.a <= 0 || rp.r > R * 1.15) { this.ripples.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(cx, cy, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = this._rgba(this.palette.b, rp.a);
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      }

      // — lueur centrale qui pulse —
      const glowR = R * (0.42 + level * 0.18);
      const glow = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, glowR);
      glow.addColorStop(0, this._rgba(this.palette.a, 0.55 * (0.4 + level)));
      glow.addColorStop(1, this._rgba(this.palette.a, 0));
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, glowR, 0, Math.PI * 2); ctx.fill();

      // — égaliseur en couronne —
      const inner = R * 0.50;
      const maxBar = R * 0.40;
      for (let i = 0; i < this.bars; i++) {
        const ang = (i / this.bars) * Math.PI * 2 - Math.PI / 2;
        const v = spec[i];
        const len = R * 0.04 + v * maxBar;
        const x1 = cx + Math.cos(ang) * inner;
        const y1 = cy + Math.sin(ang) * inner;
        const x2 = cx + Math.cos(ang) * (inner + len);
        const y2 = cy + Math.sin(ang) * (inner + len);
        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, this.palette.a);
        g.addColorStop(1, this.palette.b);
        ctx.strokeStyle = g;
        ctx.lineWidth = Math.max(1.5, (Math.PI * 2 * inner) / this.bars * 0.5) * 0.9;
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }

      // — anneau or fin —
      ctx.beginPath(); ctx.arc(cx, cy, inner - 4 * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = this._rgba(this.palette.b, 0.5);
      ctx.lineWidth = 1 * dpr; ctx.stroke();
    }

    _rgba(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, a)})`;
    }
  }

  /* --------------------------------------------------------------
     WaveStrip : forme d'onde linéaire du lecteur sticky.
     -------------------------------------------------------------- */
  class WaveStrip {
    constructor(canvas, engine, progressFn) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.engine = engine;
      this.progress = progressFn || (() => 0); // renvoie un ratio 0..1
      this.bars = 96;
      this.heights = new Float32Array(this.bars).fill(0.15);
      this._dpr = Math.min(2, window.devicePixelRatio || 1);
      this._raf = null;
      this.fit();
      window.addEventListener("resize", () => this.fit());
    }
    fit() {
      const r = this.canvas.getBoundingClientRect();
      this.w = r.width || 900; this.h = r.height || 64;
      this.canvas.width = this.w * this._dpr;
      this.canvas.height = this.h * this._dpr;
    }
    start() { if (!this._raf) this._loop(); }
    stop() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; }
    _loop() { this._raf = requestAnimationFrame(() => this._loop()); this._draw(); }

    _draw() {
      const ctx = this.ctx, dpr = this._dpr, W = this.w * dpr, H = this.h * dpr;
      ctx.clearRect(0, 0, W, H);
      const spec = this.engine.sample(this.bars);
      for (let i = 0; i < this.bars; i++) {
        const target = 0.12 + spec[i] * 0.88;
        this.heights[i] += (target - this.heights[i]) * 0.35;
      }
      const prog = Math.max(0, Math.min(1, this.progress()));
      const gap = (W / this.bars);
      const bw = gap * 0.55;
      for (let i = 0; i < this.bars; i++) {
        const x = i * gap + (gap - bw) / 2;
        const bh = this.heights[i] * H;
        const y = (H - bh) / 2;
        const played = (i / this.bars) <= prog;
        ctx.fillStyle = played ? "#E7CE8C" : "rgba(244,236,214,0.30)";
        const rr = Math.min(bw / 2, 3 * dpr);
        this._rrect(ctx, x, y, bw, bh, rr);
        ctx.fill();
      }
    }
    _rrect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  }

  // Expose
  window.AudioEngine = AudioEngine;
  window.Visualizer = Visualizer;
  window.WaveStrip = WaveStrip;
})();
