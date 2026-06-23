/* =================================================================
   visualizer.js — l'animation « au rythme de la parole »
   -----------------------------------------------------------------
   Le tableau (ou son détail) est serti dans un médaillon d'or au
   centre ; autour, des ondes concentriques naissent sur les pics de
   voix et un égaliseur en couronne suit le spectre. Inspiré du
   procédé de l'exemple Napoleonica, transposé dans la palette du
   tableau de Winterhalter.

   AudioEngine : spectre réel via Web Audio API si un fichier joue,
   sinon une cadence de parole simulée pour que tout reste vivant.
   ================================================================= */

(function () {
  "use strict";

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Harmonies prélevées sur le tableau (émeraude, or, rose, ruban bleu, ivoire)
  const PALETTES = [
    { ring: "#C9A968", bar1: "#2C7A63", bar2: "#C9A968", glow: "#1F5C4D" },
    { ring: "#C9A968", bar1: "#5B7FA6", bar2: "#C9A968", glow: "#234a3c" },
    { ring: "#C9A968", bar1: "#D38C8C", bar2: "#C9A968", glow: "#2C7A63" },
    { ring: "#C9A968", bar1: "#2C7A63", bar2: "#F1E7CF", glow: "#1F5C4D" }
  ];

  /* ---------- AudioEngine (instance partagée) ---------- */
  class AudioEngine {
    constructor(audioEl) {
      this.audio = audioEl;
      this.ctx = null; this.analyser = null; this.source = null; this.bins = null;
      this.connected = false; this.playing = false;
      this._t = Math.random() * 100;
      this._smooth = new Float32Array(128);
      this._last = performance.now();
    }
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.82;
        this.bins = new Uint8Array(this.analyser.frequencyBinCount);
      } catch (e) {}
    }
    connectMedia() {
      if (!this.ctx || this.connected) return;
      try {
        this.source = this.ctx.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.connected = true;
      } catch (e) {}
    }
    resume() { if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); }

    sample(count) {
      const now = performance.now();
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now; this._t += dt;
      const out = new Float32Array(count);
      let real = false;
      if (this.analyser && this.playing && !this.audio.paused) {
        this.analyser.getByteFrequencyData(this.bins);
        let sum = 0; for (let i = 0; i < this.bins.length; i++) sum += this.bins[i];
        if (sum > 30) {
          real = true;
          const usable = Math.floor(this.bins.length * 0.7);
          for (let i = 0; i < count; i++) out[i] = this.bins[Math.floor((i / count) * usable)] / 255;
        }
      }
      if (!real) this._simulate(out, count);
      for (let i = 0; i < count; i++) {
        const s = this._smooth[i] || 0;
        this._smooth[i] = s + (out[i] - s) * (real ? 0.5 : 0.25);
        out[i] = this._smooth[i];
      }
      return out;
    }
    _simulate(out, count) {
      const t = this._t, idle = !this.playing;
      const syll = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 3.4);
      const breath = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.45 + 1.1);
      const gate = Math.max(0, breath - 0.2);
      let env = syll * gate;
      env = idle ? 0.10 + env * 0.08 : 0.22 + env * 0.78;
      for (let i = 0; i < count; i++) {
        const f = i / count;
        const shape = Math.exp(-f * 2.4) * (1 + 0.6 * Math.exp(-Math.pow((f - 0.18) / 0.08, 2))
                                              + 0.4 * Math.exp(-Math.pow((f - 0.42) / 0.10, 2)));
        const n = 0.6 + 0.4 * this._noise(i * 1.7 + t * 6.0);
        out[i] = Math.min(1, env * shape * n);
      }
    }
    _noise(x) { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); }
    get level() { let m = 0; for (let i = 0; i < this._smooth.length; i++) m = Math.max(m, this._smooth[i]); return m; }
  }

  /* ---------- Visualizer : médaillon animé ---------- */
  class Visualizer {
    constructor(canvas, engine, opts = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.engine = engine;
      this.bars = opts.bars || 64;
      this.palette = PALETTES[(opts.seed || 0) % PALETTES.length];
      this.image = opts.image || null;
      this.ripples = []; this._lastBeat = 0; this._raf = null; this._visible = true;
      this._dpr = Math.min(2, window.devicePixelRatio || 1);
      this.fit(); window.addEventListener("resize", () => this.fit());
    }
    fit() {
      const r = this.canvas.getBoundingClientRect();
      const w = r.width || this.canvas.width, h = r.height || this.canvas.height;
      this.canvas.width = Math.max(1, w * this._dpr);
      this.canvas.height = Math.max(1, h * this._dpr);
      this.w = w; this.h = h;
    }
    setImage(img) { this.image = img; }
    setSeed(seed) { this.palette = PALETTES[seed % PALETTES.length]; }
    setVisible(v) { this._visible = v; }
    start() { if (!this._raf) this._loop(); }
    stop() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; }
    _loop() { this._raf = requestAnimationFrame(() => this._loop()); if (this._visible) this._draw(); }

    _draw() {
      const ctx = this.ctx, dpr = this._dpr, w = this.w, h = this.h;
      const cx = (w / 2) * dpr, cy = (h / 2) * dpr;
      const R = Math.min(w, h) * 0.5 * dpr;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const spec = this.engine.sample(this.bars);
      const level = this.engine.level;
      const t = performance.now() / 1000;
      const disc = R * 0.56; // rayon du médaillon central

      // ondes concentriques sur les pics de voix
      if (!REDUCED && level > 0.40 && t - this._lastBeat > 0.16) {
        this.ripples.push({ r: disc, a: 0.45 }); this._lastBeat = t;
      }
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const rp = this.ripples[i];
        rp.r += R * 0.011; rp.a -= 0.011;
        if (rp.a <= 0 || rp.r > R * 1.18) { this.ripples.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(cx, cy, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = this._rgba(this.palette.ring, rp.a); ctx.lineWidth = 1.4 * dpr; ctx.stroke();
      }

      // lueur
      const glowR = disc * (1.05 + level * 0.25);
      const g = ctx.createRadialGradient(cx, cy, disc * 0.4, cx, cy, glowR);
      g.addColorStop(0, this._rgba(this.palette.glow, 0.5 * (0.4 + level)));
      g.addColorStop(1, this._rgba(this.palette.glow, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, glowR, 0, Math.PI * 2); ctx.fill();

      // égaliseur en couronne
      const inner = disc + R * 0.03;
      const maxBar = R * 0.36;
      for (let i = 0; i < this.bars; i++) {
        const ang = (i / this.bars) * Math.PI * 2 - Math.PI / 2;
        const len = R * 0.02 + spec[i] * maxBar;
        const x1 = cx + Math.cos(ang) * inner, y1 = cy + Math.sin(ang) * inner;
        const x2 = cx + Math.cos(ang) * (inner + len), y2 = cy + Math.sin(ang) * (inner + len);
        const lg = ctx.createLinearGradient(x1, y1, x2, y2);
        lg.addColorStop(0, this.palette.bar1); lg.addColorStop(1, this.palette.bar2);
        ctx.strokeStyle = lg; ctx.lineCap = "round";
        ctx.lineWidth = Math.max(1.4 * dpr, (Math.PI * 2 * inner) / this.bars * 0.46);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }

      // médaillon central : le tableau serti dans l'or
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, disc, 0, Math.PI * 2); ctx.clip();
      if (this.image && this.image.complete && this.image.naturalWidth) {
        const iw = this.image.naturalWidth, ih = this.image.naturalHeight;
        const s = Math.max((disc * 2) / iw, (disc * 2) / ih);
        const dw = iw * s, dh = ih * s;
        ctx.drawImage(this.image, cx - dw / 2, cy - dh / 2, dw, dh);
        // léger vernis pour fondre dans la palette
        const veil = ctx.createRadialGradient(cx, cy, disc * 0.2, cx, cy, disc);
        veil.addColorStop(0, "rgba(21,39,31,0)"); veil.addColorStop(1, "rgba(21,39,31,0.28)");
        ctx.fillStyle = veil; ctx.fillRect(cx - disc, cy - disc, disc * 2, disc * 2);
      } else {
        const dg = ctx.createRadialGradient(cx - disc * .3, cy - disc * .3, disc * .1, cx, cy, disc);
        dg.addColorStop(0, "#2C7A63"); dg.addColorStop(1, "#15271F");
        ctx.fillStyle = dg; ctx.fillRect(cx - disc, cy - disc, disc * 2, disc * 2);
      }
      ctx.restore();

      // cadre d'or
      const pulse = 1 + level * 0.012;
      ctx.beginPath(); ctx.arc(cx, cy, disc * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = this.palette.ring; ctx.lineWidth = 2.4 * dpr; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, disc * pulse - 5 * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = this._rgba(this.palette.ring, 0.4); ctx.lineWidth = 1 * dpr; ctx.stroke();
    }
    _rgba(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, a)})`;
    }
  }

  /* ---------- WaveStrip : forme d'onde du lecteur ---------- */
  class WaveStrip {
    constructor(canvas, engine, progressFn) {
      this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.engine = engine;
      this.progress = progressFn || (() => 0);
      this.bars = 90; this.heights = new Float32Array(this.bars).fill(0.12);
      this._dpr = Math.min(2, window.devicePixelRatio || 1); this._raf = null;
      this.fit(); window.addEventListener("resize", () => this.fit());
    }
    fit() {
      const r = this.canvas.getBoundingClientRect();
      this.w = r.width || 900; this.h = r.height || 46;
      this.canvas.width = this.w * this._dpr; this.canvas.height = this.h * this._dpr;
    }
    start() { if (!this._raf) this._loop(); }
    stop() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; }
    _loop() { this._raf = requestAnimationFrame(() => this._loop()); this._draw(); }
    _draw() {
      const ctx = this.ctx, dpr = this._dpr, W = this.w * dpr, H = this.h * dpr;
      ctx.clearRect(0, 0, W, H);
      const spec = this.engine.sample(this.bars);
      for (let i = 0; i < this.bars; i++) this.heights[i] += ((0.1 + spec[i] * 0.9) - this.heights[i]) * 0.35;
      const prog = Math.max(0, Math.min(1, this.progress()));
      const gap = W / this.bars, bw = gap * 0.5;
      for (let i = 0; i < this.bars; i++) {
        const x = i * gap + (gap - bw) / 2, bh = this.heights[i] * H, y = (H - bh) / 2;
        ctx.fillStyle = (i / this.bars) <= prog ? "#C9A968" : "rgba(241,231,207,0.26)";
        this._rrect(ctx, x, y, bw, bh, Math.min(bw / 2, 3 * dpr)); ctx.fill();
      }
    }
    _rrect(ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
  }

  window.AudioEngine = AudioEngine;
  window.Visualizer = Visualizer;
  window.WaveStrip = WaveStrip;
})();
