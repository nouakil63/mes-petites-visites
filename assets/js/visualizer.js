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
      this.seg = (opts.seg || 72) & ~1;     // barres de la couronne (nombre pair)
      this.ripples = []; this._beat = 0; this._raf = null;
      this._spin = 0;                        // lente rotation de la couronne
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
      const cx = W / 2, cy = H / 2, R = Math.min(W, H);
      ctx.clearRect(0, 0, W, H);

      const half = this.seg >> 1;
      const spec = this.engine.sample(half);
      const level = this.engine.level;
      const t = performance.now() / 1000;
      const breathe = REDUCED ? 0.5 : (Math.sin(t * 0.9) * 0.5 + 0.5);

      // — fond : dégradé crème chaud (le « fond » du pop-up) —
      const bg = ctx.createRadialGradient(cx, cy * 0.82, 0, cx, cy, Math.hypot(W, H) / 2);
      bg.addColorStop(0, "#FBF4E2"); bg.addColorStop(0.55, "#F1E6C8"); bg.addColorStop(1, "#E6D8B2");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // — anneaux papier-découpé, très discrets (clin d'œil à la charte) —
      const corner = Math.hypot(W, H) / 2;
      for (let i = 4; i >= 1; i--) {
        ctx.beginPath(); ctx.arc(cx, cy, corner * (i / 4) * (1 + level * 0.03), 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(26,32,60,0.05)"; ctx.lineWidth = 1 * dpr; ctx.stroke();
      }

      // — aura chaude qui respire derrière le médaillon —
      const auraR = R * (0.42 + level * 0.12 + breathe * 0.02);
      const aura = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, auraR);
      aura.addColorStop(0, "rgba(181,65,68," + (0.12 + level * 0.22) + ")");
      aura.addColorStop(0.55, "rgba(181,65,68,0.06)");
      aura.addColorStop(1, "rgba(181,65,68,0)");
      ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(cx, cy, auraR, 0, Math.PI * 2); ctx.fill();

      // — ondes nées sur les pics de voix —
      if (!REDUCED && level > 0.4 && t - this._beat > 0.16) { this.ripples.push({ r: R * 0.22, a: 0.5 }); this._beat = t; }
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const rp = this.ripples[i]; rp.r += R * 0.006; rp.a -= 0.011;
        if (rp.a <= 0) { this.ripples.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(cx, cy, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(143,53,55," + (rp.a * 0.9) + ")"; ctx.lineWidth = 1.3 * dpr; ctx.stroke();
      }

      // — couronne égaliseur radiale (symétrique gauche/droite) —
      const medR = R * 0.205, ri = medR + R * 0.026;
      const barMax = R * 0.165, barMin = R * 0.012;
      this._spin += REDUCED ? 0 : 0.0014;
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1.6 * dpr, ((2 * Math.PI * ri) / this.seg) * 0.46);
      for (let i = 0; i < this.seg; i++) {
        const v = spec[i < half ? i : this.seg - 1 - i];
        const a = this._spin - Math.PI / 2 + (i / this.seg) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a), len = barMin + v * barMax;
        const k = Math.min(1, 0.22 + v);
        const cr = (196 - 53 * k) | 0, cg = (107 - 54 * k) | 0, cb = (90 - 35 * k) | 0;
        ctx.strokeStyle = "rgba(" + cr + "," + cg + "," + cb + "," + (0.62 + v * 0.38) + ")";
        ctx.beginPath();
        ctx.moveTo(cx + ca * ri, cy + sa * ri);
        ctx.lineTo(cx + ca * (ri + len), cy + sa * (ri + len));
        ctx.stroke();
      }

      // — médaillon central : le tableau découpé en rond —
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, medR, 0, Math.PI * 2); ctx.clip();
      if (this.image && this.image.complete && this.image.naturalWidth) {
        const bias = 0.32 + (REDUCED ? 0 : Math.sin(t * 0.5) * 0.05);
        this._coverRect(this.image, cx - medR, cy - medR, medR * 2, medR * 2, bias);
        const vg = ctx.createRadialGradient(cx, cy - medR * 0.25, medR * 0.2, cx, cy, medR);
        vg.addColorStop(0, "rgba(17,21,42,0)"); vg.addColorStop(1, "rgba(17,21,42,0.42)");
        ctx.fillStyle = vg; ctx.fillRect(cx - medR, cy - medR, medR * 2, medR * 2);
      } else {
        const g = ctx.createLinearGradient(0, cy - medR, 0, cy + medR);
        g.addColorStop(0, "#EDC6B4"); g.addColorStop(1, "#B54144");
        ctx.fillStyle = g; ctx.fillRect(cx - medR, cy - medR, medR * 2, medR * 2);
      }
      ctx.restore();

      // — cadre du médaillon : double filet bleu nuit —
      ctx.beginPath(); ctx.arc(cx, cy, medR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(26,32,60,0.82)"; ctx.lineWidth = 2 * dpr; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, medR + 3.5 * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(26,32,60,0.16)"; ctx.lineWidth = 1 * dpr; ctx.stroke();
    }
  }

  window.AudioEngine = AudioEngine;
  window.RingWave = RingWave;
})();
