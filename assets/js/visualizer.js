/* =================================================================
   visualizer.js — l'animation « au rythme de la parole »
   -----------------------------------------------------------------
   AudioEngine : spectre réel via Web Audio API si un fichier joue,
                 sinon cadence de parole simulée (la maquette s'anime
                 quand même).
   RingWave    : la pochette animée du pop-up. Ondes concentriques en
                 fond + le tableau découpé en barres verticales qui
                 dansent avec la voix (procédé inspiré de Napoleonica,
                 transposé dans la palette du tableau).
   ================================================================= */

(function () {
  "use strict";
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- AudioEngine (partagé) ---------------- */
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
        this.source.connect(this.analyser); this.analyser.connect(this.ctx.destination);
        this.connected = true;
      } catch (e) {}
    }
    resume() { if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); }
    sample(count) {
      const now = performance.now();
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now; this._t += dt;
      const out = new Float32Array(count); let real = false;
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
        this._smooth[i] = s + (out[i] - s) * (real ? 0.5 : 0.28);
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
      env = idle ? 0.12 + env * 0.10 : 0.24 + env * 0.76;
      for (let i = 0; i < count; i++) {
        const f = i / count;
        const shape = Math.exp(-f * 1.7) * (1 + 0.5 * Math.exp(-Math.pow((f - 0.22) / 0.12, 2)));
        const n = 0.55 + 0.45 * this._noise(i * 2.3 + t * 5.5);
        out[i] = Math.min(1, env * shape * n);
      }
    }
    _noise(x) { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); }
    get level() { let m = 0; for (let i = 0; i < this._smooth.length; i++) m = Math.max(m, this._smooth[i]); return m; }
  }

  /* ---------------- RingWave : la pochette animée ---------------- */
  class RingWave {
    constructor(canvas, engine, opts = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.engine = engine;
      this.image = opts.image || null;
      this.bars = opts.bars || 15;
      // charte mes petites visites : terracotta + sauge/olive + bleu nuit (crème en lueur)
      this.rings = ["#DB9079", "#2C3556", "#B54144", "#1A203C", "#8E9679", "#11152A"];
      this.ripples = []; this._beat = 0; this._raf = null; this._vis = true;
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.fit(); this._onR = () => this.fit(); window.addEventListener("resize", this._onR);
    }
    setImage(img) { this.image = img; }
    fit() {
      const r = this.canvas.getBoundingClientRect();
      this.w = r.width || this.canvas.width; this.h = r.height || this.canvas.height;
      this.canvas.width = Math.max(1, this.w * this.dpr);
      this.canvas.height = Math.max(1, this.h * this.dpr);
    }
    start() { if (!this._raf) this._loop(); }
    stop() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; }
    _loop() { this._raf = requestAnimationFrame(() => this._loop()); this._draw(); }

    _coverRect(img, dx, dy, dw, dh, biasY) {
      const s = Math.max(dw / img.naturalWidth, dh / img.naturalHeight);
      const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
      const ox = dx + (dw - iw) / 2;
      const oy = dy + (dh - ih) * (biasY == null ? 0.5 : biasY);
      this.ctx.drawImage(img, ox, oy, iw, ih);
    }

    _draw() {
      const ctx = this.ctx, dpr = this.dpr, W = this.w * dpr, H = this.h * dpr;
      const cx = W / 2, cy = H / 2;
      ctx.clearRect(0, 0, W, H);

      const spec = this.engine.sample(this.bars);
      const level = this.engine.level;
      const t = performance.now() / 1000;

      // — fond : ondes concentriques façon papier découpé —
      const corner = Math.hypot(W, H) / 2;
      const n = this.rings.length;
      const pulse = 1 + level * 0.05;
      const breathe = REDUCED ? 0 : (Math.sin(t * 1.1) * 0.012);
      for (let i = n - 1; i >= 0; i--) {
        const rr = corner * ((i + 1) / n) * (pulse + breathe);
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.fillStyle = this.rings[i % this.rings.length];
        ctx.fill();
      }
      // halo central chaud
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, corner * 0.5);
      halo.addColorStop(0, "rgba(250,243,221," + (0.10 + level * 0.18) + ")");
      halo.addColorStop(1, "rgba(250,243,221,0)");
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, corner * 0.5, 0, Math.PI * 2); ctx.fill();

      // — ondes qui naissent sur les pics de voix —
      if (!REDUCED && level > 0.42 && t - this._beat > 0.18) { this.ripples.push({ r: H * 0.16, a: 0.5 }); this._beat = t; }
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const rp = this.ripples[i]; rp.r += corner * 0.012; rp.a -= 0.012;
        if (rp.a <= 0) { this.ripples.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(cx, cy, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(250,243,221," + rp.a + ")"; ctx.lineWidth = 1.4 * dpr; ctx.stroke();
      }

      // — le tableau découpé en barres verticales —
      const region = W * 0.84, startX = cx - region / 2;
      const gap = (region / this.bars) * 0.16, bw = region / this.bars - gap;
      const maxH = H * 0.78, minH = H * 0.12;
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < this.bars; i++) {
        const bh = minH + spec[i] * (maxH - minH);
        const x = startX + i * (bw + gap), y = cy - bh / 2;
        this._roundRect(ctx, x, y, bw, bh, Math.min(bw / 2, 4 * dpr));
      }
      ctx.clip();
      if (this.image && this.image.complete && this.image.naturalWidth) {
        this._coverRect(this.image, startX, cy - maxH / 2, region, maxH, 0.34);
        // léger vernis sombre pour la lisibilité
        ctx.fillStyle = "rgba(17,21,42,0.14)"; ctx.fillRect(startX, cy - maxH / 2, region, maxH);
      } else {
        const g = ctx.createLinearGradient(0, cy - maxH / 2, 0, cy + maxH / 2);
        g.addColorStop(0, "#EDC6B4"); g.addColorStop(1, "#B54144");
        ctx.fillStyle = g; ctx.fillRect(startX, cy - maxH / 2, region, maxH);
      }
      ctx.restore();

      // liseré crème sur chaque barre (souligne le découpage)
      ctx.strokeStyle = "rgba(250,243,221,0.30)"; ctx.lineWidth = 1 * dpr;
      for (let i = 0; i < this.bars; i++) {
        const bh = minH + spec[i] * (maxH - minH);
        const x = startX + i * (bw + gap), y = cy - bh / 2;
        this._roundRect(ctx, x, y, bw, bh, Math.min(bw / 2, 4 * dpr)); ctx.stroke();
      }
    }
    _roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
  }

  window.AudioEngine = AudioEngine;
  window.RingWave = RingWave;
})();
