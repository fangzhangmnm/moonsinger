// src/gm/tsf-standalone.ts
async function instantiateTsf(module) {
  const imports = { env: { emscripten_notify_memory_growth: () => {
  } } };
  const inst = module instanceof WebAssembly.Module ? await WebAssembly.instantiate(module, imports) : (await WebAssembly.instantiate(module, imports)).instance;
  const ex = inst.exports;
  ex._initialize();
  return new Tsf(ex);
}
var Tsf = class {
  ex;
  outPtr = 0;
  outCap = 0;
  constructor(ex) {
    this.ex = ex;
  }
  // 不用参数属性：Node 的 strip-only TS 不认
  u8() {
    return new Uint8Array(this.ex.memory.buffer);
  }
  cstr(p) {
    const m = this.u8();
    let s = "";
    for (let i = p; m[i]; i++) s += String.fromCharCode(m[i]);
    return s;
  }
  /** 载一份 sf2（字节拷进 wasm 堆、载完就还）。失败 = null。 */
  load(bytes, sampleRate2, maxVoices = 64) {
    const p = this.ex.malloc(bytes.length);
    this.u8().set(bytes, p);
    const handle = this.ex.sf_load(p, bytes.length, sampleRate2);
    this.ex.free(p);
    if (!handle) return null;
    this.ex.sf_set_max_voices(handle, maxVoices);
    const n = this.ex.sf_preset_count(handle), presets = Array.from({ length: n }, (_, i) => ({ index: i, bank: this.ex.sf_preset_bank(handle, i), program: this.ex.sf_preset_num(handle, i), name: this.cstr(this.ex.sf_preset_name(handle, i)) }));
    return { handle, presets };
  }
  close(b) {
    this.ex.sf_close(b.handle);
  }
  noteOn(b, preset, key, vel) {
    this.ex.sf_note_on(b.handle, preset, key, vel);
  }
  noteOff(b, preset, key) {
    this.ex.sf_note_off(b.handle, preset, key);
  }
  allOff(b) {
    this.ex.sf_note_off_all(b.handle);
  }
  active(b) {
    return this.ex.sf_active(b.handle);
  }
  /** 渲染 n 个单声道采样进 out（从 offset 起）。 */
  render(b, out, offset = 0, n = out.length - offset) {
    if (n <= 0) return;
    if (this.outCap < n) {
      if (this.outPtr) this.ex.free(this.outPtr);
      this.outPtr = this.ex.malloc(n * 4);
      this.outCap = n;
    }
    this.ex.sf_render(b.handle, this.outPtr, n);
    out.set(new Float32Array(this.ex.memory.buffer, this.outPtr, n), offset);
  }
};

// src/engine/studio.ts
var BLOCK = 128;
var CEILING = 0.98;
var LIM_ATTACK = 3e-3;
var LIM_RELEASE = 0.15;
var LIM_LOOK_TAUS = 3;
var TAIL_MAX = 2;
var CLIP_FADE_OUT = 0.03;
var CLIP_FADE_IN = 0.01;
var GAIN_TAU = 4e-3;
var MAX_VOWEL_VOICES = 24;
var V_ATTACK = 0.01;
var V_RELEASE = 0.04;
var V_CUT = 6e-3;
var V_GLIDE = 0.012;
var LOOKAHEAD = 30;
var dbToLin = (dB) => dB === -Infinity ? 0 : 10 ** (dB / 20);
var panGains = (gainDb, pan) => {
  const g = dbToLin(gainDb), p = Math.max(-1, Math.min(1, pan));
  return [g * Math.cos((p + 1) * Math.PI / 4), g * Math.sin((p + 1) * Math.PI / 4)];
};
var DEFAULT_CH = { gainDb: 0, pan: 0, mute: false, solo: false };
var Studio = class {
  sr;
  tsf;
  post;
  banks = /* @__PURE__ */ new Map();
  vowels = null;
  chunks = /* @__PURE__ */ new Map();
  tracks = /* @__PURE__ */ new Map();
  order = [];
  channels = /* @__PURE__ */ new Map();
  // 时间线换了也留着（边放边调不丢）
  master = { gainDb: 0, limiter: true };
  masterLin = 1;
  // 走带
  playing = false;
  pos = 0;
  // 秒（时间线）
  range = { from: 0, to: 0 };
  loop = false;
  loopFrom = null;
  tail = -1;
  // ≥0 = 范围尾：已经等了几秒
  waiting = null;
  // 块没到：等它（走带冻住）
  gen = 0;
  // 走带代号（主线程给；报告带着它）
  // 试听
  auditionSf = /* @__PURE__ */ new Map();
  // sha → 试听用的 player（和时间线的分开：绕过静音 / 独奏）
  auditions = /* @__PURE__ */ new Map();
  // src → 正在按着的
  auditionVowels = [];
  auditionClips = [];
  lastAud = /* @__PURE__ */ new Map();
  // sha → 最后一次试听的增益 / 声像（松开后尾巴照这个）
  // 缓冲（零分配）
  mono = new Float32Array(BLOCK);
  busL = new Float32Array(BLOCK);
  busR = new Float32Array(BLOCK);
  audL = new Float32Array(BLOCK);
  audR = new Float32Array(BLOCK);
  // 限幅器
  look;
  delayL;
  delayR;
  need;
  attPow;
  wr = 0;
  gPrev = 1;
  aRel;
  // 表 / 报告
  meterOn = false;
  meterPeak = 0;
  meterFrames = 0;
  posFrames = 0;
  missingSent = /* @__PURE__ */ new Set();
  constructor(sampleRate2, tsf, post) {
    this.sr = sampleRate2;
    this.tsf = tsf;
    this.post = post;
    this.look = Math.max(1, Math.round(LIM_ATTACK * LIM_LOOK_TAUS * sampleRate2));
    this.delayL = new Float32Array(this.look);
    this.delayR = new Float32Array(this.look);
    this.need = new Float32Array(this.look).fill(1);
    const aAtt = Math.exp(-1 / (LIM_ATTACK * sampleRate2));
    this.attPow = Float32Array.from({ length: this.look + 1 }, (_, k) => aAtt ** k);
    this.aRel = Math.exp(-1 / (LIM_RELEASE * sampleRate2));
  }
  /** 限幅器带来的固定延迟（采样）：导出时从输出里扣掉。 */
  get latency() {
    return this.master.limiter ? this.look : 0;
  }
  get isPlaying() {
    return this.playing;
  }
  get position() {
    return this.pos;
  }
  get waitingFor() {
    return this.waiting;
  }
  hasChunk(key) {
    return this.chunks.has(key);
  }
  // ── 消息 ────────────────────────────────────────────────────────────────────────────────────────────────────────
  handle(m) {
    switch (m.type) {
      case "bank": {
        let b = this.banks.get(m.sha);
        if (!b) {
          const loaded = this.tsf.load(m.bytes, this.sr, 256);
          if (!loaded) {
            this.post({ type: "error", message: `studio: not a SoundFont 2 file (${m.sha.slice(0, 12)})` });
            return;
          }
          b = loaded;
          this.banks.set(m.sha, b);
          for (const t of this.tracks.values()) if (t.spec.kind === "sf" && t.spec.sha === m.sha && !t.sf) t.sf = this.playerFor(b);
        }
        this.post({ type: "banked", sha: m.sha, presets: b.presets.map((p) => [p.bank, p.program]) });
        return;
      }
      case "unbank": {
        const b = this.banks.get(m.sha);
        if (!b) return;
        for (const t of this.tracks.values()) if (t.sf && t.sf.bank === b) {
          this.tsf.close(t.sf.player);
          t.sf = null;
        }
        const a = this.auditionSf.get(m.sha);
        if (a) {
          this.tsf.close(a.player);
          this.auditionSf.delete(m.sha);
        }
        for (const [src, au] of this.auditions) if (au.inst.kind === "sf" && au.inst.sha === m.sha) this.auditions.delete(src);
        this.tsf.close(b);
        this.banks.delete(m.sha);
        return;
      }
      case "vowels": {
        const entries = m.entries.map((e) => {
          const data = new Float32Array(e.len);
          for (let k = 0; k < e.len; k++) data[k] = m.pcm[e.start + k] / 32768;
          return { ...e, data };
        });
        this.vowels = { sr: m.sr, entries };
        return;
      }
      case "timeline":
        this.setTimeline(m.tl);
        return;
      case "chunk":
        this.chunks.set(m.key, { sr: m.sr, samples: m.samples });
        this.missingSent.delete(m.key);
        return;
      case "forget":
        for (const k of m.keys) this.chunks.delete(k);
        return;
      case "channel": {
        const cur = this.channels.get(m.id) ?? { ...DEFAULT_CH }, next = { ...cur, ...m.p };
        this.channels.set(m.id, next);
        const t = this.tracks.get(m.id);
        if (t) t.ch = next;
        return;
      }
      case "master":
        this.master = { ...this.master, ...m.p };
        this.masterLin = dbToLin(this.master.gainDb);
        return;
      case "play":
        if (m.gen !== void 0) this.gen = m.gen;
        this.play(m.at);
        return;
      case "stop":
        this.stop();
        return;
      case "seek":
        this.seek(m.at);
        return;
      case "audition":
        this.audition(m);
        return;
      case "auditionClip": {
        for (const v of this.auditionClips) if (v.src === m.src) v.state = "cut";
        const [gl, gr] = panGains(m.gainDb ?? 0, m.pan ?? 0);
        while (this.auditionClips.length >= 8) this.auditionClips.shift();
        this.auditionClips.push({ src: m.src, data: m.samples, ratio: m.sr / this.sr, pos: 0, env: 0, state: "attack", gl, gr });
        this.auditions.set(m.src, { inst: { kind: "clip" }, key: 0, gl, gr });
        return;
      }
      case "meter":
        this.meterOn = m.on;
        this.meterPeak = 0;
        this.meterFrames = 0;
        return;
    }
  }
  playerFor(bank) {
    const handle = this.tsf.ex.sf_copy(bank.handle);
    this.tsf.ex.sf_set_max_voices(handle, 256);
    return { bank, player: { handle, presets: bank.presets } };
  }
  setTimeline(tl) {
    const old = this.tracks;
    this.tracks = /* @__PURE__ */ new Map();
    this.order = [];
    for (const spec of tl.tracks) {
      const prev = old.get(spec.id);
      const t = prev ?? { spec, ch: this.channels.get(spec.id) ?? { ...DEFAULT_CH }, gl: 0, gr: 0, y: 1, gk: 0, nextNote: 0, offs: [], sf: null, vowels: [], env: 1, envTarget: 1 };
      t.spec = spec;
      t.ch = this.channels.get(spec.id) ?? t.ch;
      if (spec.kind === "sf") {
        const bank = this.banks.get(spec.sha) ?? null;
        if (t.sf && t.sf.bank !== bank) {
          this.tsf.close(t.sf.player);
          t.sf = null;
        }
        if (!t.sf && bank) t.sf = this.playerFor(bank);
      } else if (t.sf) {
        this.tsf.close(t.sf.player);
        t.sf = null;
      }
      this.tracks.set(spec.id, t);
      this.order.push(spec.id);
      old.delete(spec.id);
    }
    for (const t of old.values()) if (t.sf) this.tsf.close(t.sf.player);
    this.range = { ...tl.range };
    this.loop = tl.loop;
    this.loopFrom = tl.loopFrom ?? null;
    if (this.playing) {
      this.resetCursors(false);
      this.checkMissing();
    } else if (this.pos < this.range.from || this.pos > this.range.to) this.pos = this.range.from;
  }
  // ── 走带 ────────────────────────────────────────────────────────────────────────────────────────────────────────
  play(at) {
    if (at !== void 0) this.pos = at;
    if (this.pos < this.range.from || this.pos >= this.range.to) this.pos = this.range.from;
    this.playing = true;
    this.tail = -1;
    this.waiting = null;
    this.posFrames = 0;
    this.resetCursors(true);
    this.checkMissing();
  }
  stop() {
    this.playing = false;
    this.tail = -1;
    this.waiting = null;
    for (const t of this.tracks.values()) {
      this.releaseAll(t);
      t.envTarget = 1;
    }
  }
  seek(at) {
    this.pos = at;
    if (this.playing) {
      this.tail = -1;
      this.waiting = null;
      this.resetCursors(true);
      this.checkMissing();
    }
  }
  /** 游标对齐到 pos；chase = 把 pos 这一刻该响着的音按下（起放 / seek / 续放），正在响的先松开。 */
  resetCursors(chase) {
    for (const t of this.tracks.values()) {
      if (chase) {
        this.releaseAll(t);
        t.env = 0;
      }
      t.envTarget = 1;
      const segs = t.spec.gain;
      if (segs && segs.length) {
        let k = 0;
        while (k < segs.length - 1 && this.pos >= segs[k].t1) k++;
        t.gk = k;
        if (chase) t.y = dbToLin(segs[k].dB);
      }
      if (t.spec.kind === "clips") continue;
      const notes = t.spec.notes;
      let i = 0;
      while (i < notes.length && notes[i].t0 < this.pos) {
        if (chase && notes[i].t1 > this.pos) this.noteOn(t, notes[i]);
        i++;
      }
      t.nextNote = i;
    }
  }
  releaseAll(t) {
    if (t.sf) this.tsf.allOff(t.sf.player);
    t.offs.length = 0;
    for (const v of t.vowels) if (v.state !== "release" && v.state !== "cut") v.state = "release";
  }
  noteOn(t, n) {
    if (t.spec.kind === "sf") {
      if (!t.sf) return;
      this.tsf.noteOn(t.sf.player, n.preset, n.key, n.vel);
    } else if (t.spec.kind === "vowel") this.vowelOn(t.vowels, null, t.spec.kana, n.key, 1, 1);
    else return;
    const off = { t: Math.max(n.t0, n.t1), key: n.key, preset: n.preset };
    let k = t.offs.length;
    while (k > 0 && t.offs[k - 1].t > off.t) k--;
    t.offs.splice(k, 0, off);
  }
  noteOff(t, key, preset) {
    if (t.spec.kind === "sf") {
      if (t.sf) this.tsf.noteOff(t.sf.player, preset, key);
    } else if (t.spec.kind === "vowel") {
      for (const v of t.vowels) if (v.src === null && v.key === key && v.state !== "release" && v.state !== "cut") v.state = "release";
    }
  }
  /** 播放头前面（提前量内）的块到齐了没有；没到的报上去（主线程去算）。 */
  checkMissing() {
    const miss = [];
    for (const t of this.tracks.values()) {
      if (t.spec.kind !== "clips") continue;
      for (const c of t.spec.clips) if (c.t0 + c.dur > this.pos && c.t0 < this.pos + LOOKAHEAD && !this.chunks.has(c.key) && !this.missingSent.has(c.key)) {
        miss.push(c.key);
        this.missingSent.add(c.key);
      }
    }
    if (miss.length) this.post({ type: "missing", keys: miss });
  }
  /** 走带从 pos 往前最多能走到哪（≤ end）：没到的块的头挡住；正站在没到的块上 = 返回 null（要等它）。 */
  clipBarrier(end) {
    let stop = end;
    for (const t of this.tracks.values()) {
      if (t.spec.kind !== "clips") continue;
      for (const c of t.spec.clips) {
        if (this.chunks.has(c.key)) continue;
        if (c.t0 <= this.pos && c.t0 + c.dur > this.pos) return { stop: this.pos, wait: c.key };
        if (c.t0 > this.pos && c.t0 < stop) stop = c.t0;
      }
    }
    return { stop, wait: null };
  }
  keyStartingAt(t0) {
    for (const t of this.tracks.values()) if (t.spec.kind === "clips") {
      for (const c of t.spec.clips) if (!this.chunks.has(c.key) && Math.abs(c.t0 - t0) < 1e-6) return c.key;
    }
    return null;
  }
  freeze(key) {
    this.waiting = key;
    for (const t of this.tracks.values()) this.releaseAll(t);
    this.checkMissing();
  }
  // ── 渲染 ────────────────────────────────────────────────────────────────────────────────────────────────────────
  /** 出一块：outL / outR 长 n（≤ BLOCK）。 */
  render(outL, outR, n) {
    this.busL.fill(0, 0, n);
    this.busR.fill(0, 0, n);
    this.audL.fill(0, 0, n);
    this.audR.fill(0, 0, n);
    if (this.playing) this.renderTransport(n);
    this.renderAuditions(n);
    const g = this.masterLin;
    if (this.master.limiter) this.limit(n, g);
    else for (let i = 0; i < n; i++) {
      this.busL[i] *= g;
      this.busR[i] *= g;
    }
    for (let i = 0; i < n; i++) {
      outL[i] = this.busL[i] + this.audL[i] * g;
      outR[i] = this.busR[i] + this.audR[i] * g;
    }
    if (this.meterOn) {
      for (let i = 0; i < n; i++) {
        const a = Math.abs(outL[i]), b = Math.abs(outR[i]);
        if (a > this.meterPeak) this.meterPeak = a;
        if (b > this.meterPeak) this.meterPeak = b;
      }
      this.meterFrames += n;
      if (this.meterFrames >= 1024) {
        this.post({ type: "meter", peak: this.meterPeak, active: this.activeVoices() });
        this.meterPeak = 0;
        this.meterFrames = 0;
      }
    }
  }
  activeVoices() {
    let a = this.auditionVowels.length;
    for (const t of this.tracks.values()) {
      if (t.sf) a += this.tsf.active(t.sf.player);
      a += t.vowels.length;
    }
    for (const p of this.auditionSf.values()) a += this.tsf.active(p.player);
    return a;
  }
  renderTransport(n) {
    const sr = this.sr;
    let done = 0;
    while (done < n) {
      const left = n - done;
      if (this.waiting) {
        if (!this.chunks.has(this.waiting)) {
          this.renderTracks(done, left, false, false);
          done = n;
          break;
        }
        this.waiting = null;
        this.resetCursors(true);
      }
      if (this.tail >= 0) {
        this.renderTracks(done, left, false, true);
        this.pos += left / sr;
        this.tail += left / sr;
        done = n;
        if (this.tail >= TAIL_MAX || this.silent()) {
          this.stop();
          this.post({ type: "ended", gen: this.gen });
        }
        break;
      }
      const blockEnd = this.pos + left / sr;
      const { stop, wait } = this.clipBarrier(Math.min(blockEnd, this.range.to));
      if (wait) {
        this.freeze(wait);
        continue;
      }
      const cnt = Math.min(left, Math.max(0, Math.round((stop - this.pos) * sr)));
      if (cnt > 0) {
        this.renderTracks(done, cnt, true, true);
        this.pos += cnt / sr;
        done += cnt;
      }
      if (this.pos >= this.range.to - 0.5 / sr) {
        if (this.loop) {
          this.pos = Math.max(this.range.from, Math.min(this.loopFrom ?? this.range.from, this.range.to));
          this.resetCursors(false);
          this.chaseAtLoop();
          this.checkMissing();
        } else {
          this.tail = 0;
          for (const t of this.tracks.values()) {
            this.releaseAll(t);
            t.envTarget = 0;
          }
        }
        continue;
      }
      if (cnt === 0) {
        const key = this.keyStartingAt(stop);
        if (!key) {
          this.renderTracks(done, left, false, false);
          done = n;
          break;
        }
        this.freeze(key);
      }
    }
    this.posFrames += n;
    if (this.posFrames >= 16 * BLOCK) {
      this.posFrames = 0;
      this.post({ type: "pos", sec: this.pos, playing: this.playing, waiting: this.waiting, gen: this.gen });
    }
  }
  chaseAtLoop() {
    for (const t of this.tracks.values()) {
      if (t.spec.kind === "clips") continue;
      for (const nte of t.spec.notes) if (nte.t0 < this.pos && nte.t1 > this.pos) this.noteOn(t, nte);
    }
  }
  silent() {
    for (const t of this.tracks.values()) {
      if (t.sf && this.tsf.active(t.sf.player) > 0) return false;
      if (t.vowels.length) return false;
      if (t.spec.kind === "clips" && t.env > 1e-4) return false;
    }
    return true;
  }
  /** 各声部出 cnt 个采样进母线（从 off 起）。notesOn = 排新音；clipsOn = 块前进（false = 冻着，块不出声）。 */
  renderTracks(off, cnt, notesOn, clipsOn) {
    const solo = this.order.some((id) => this.tracks.get(id).ch.solo);
    const t0 = this.pos, sr = this.sr;
    for (const id of this.order) {
      const t = this.tracks.get(id), mono = this.mono;
      mono.fill(0, 0, cnt);
      if (t.spec.kind === "clips") {
        if (clipsOn) this.renderClips(t, mono, cnt, t0);
      } else this.renderNotes(t, mono, cnt, t0, notesOn);
      const segs = t.spec.gain;
      if (segs && segs.length) {
        const a = 1 - Math.exp(-1 / (GAIN_TAU * sr));
        for (let i = 0; i < cnt; i++) {
          const tt = t0 + i / sr;
          while (t.gk < segs.length - 1 && tt >= segs[t.gk].t1) t.gk++;
          t.y += (dbToLin(segs[t.gk].dB) - t.y) * a;
          mono[i] *= t.y;
        }
      }
      if (t.spec.kind === "clips" && t.env !== t.envTarget) {
        const step = t.envTarget > t.env ? 1 / (CLIP_FADE_IN * sr) : -1 / (CLIP_FADE_OUT * sr);
        for (let i = 0; i < cnt; i++) {
          if (t.env !== t.envTarget) {
            t.env += step;
            if (step > 0 && t.env >= t.envTarget || step < 0 && t.env <= t.envTarget) t.env = t.envTarget;
          }
          mono[i] *= t.env;
        }
      }
      const audible = solo ? t.ch.solo : !t.ch.mute;
      const [gl, gr] = audible ? panGains(t.ch.gainDb, t.ch.pan) : [0, 0];
      const dl = (gl - t.gl) / cnt, dr = (gr - t.gr) / cnt;
      let cl = t.gl, cr = t.gr;
      for (let i = 0; i < cnt; i++) {
        cl += dl;
        cr += dr;
        this.busL[off + i] += mono[i] * cl;
        this.busR[off + i] += mono[i] * cr;
      }
      t.gl = gl;
      t.gr = gr;
    }
  }
  renderClips(t, mono, cnt, t0) {
    if (t.spec.kind !== "clips") return;
    const sr = this.sr, tEnd = t0 + cnt / sr;
    for (const c of t.spec.clips) {
      const ch = this.chunks.get(c.key);
      if (!ch) continue;
      const len = ch.samples.length, cEnd = c.t0 + len / ch.sr;
      if (c.t0 >= tEnd || cEnd <= t0) continue;
      const s = ch.samples, g = c.gain;
      for (let i = 0; i < cnt; i++) {
        const p = (t0 + i / sr - c.t0) * ch.sr;
        if (p < 0) continue;
        const k = p | 0;
        if (k >= len - 1) break;
        const f = p - k;
        mono[i] += (s[k] * (1 - f) + s[k + 1] * f) * g;
      }
    }
  }
  /** 快引擎的轨：事件按采样位置施加（同原 synth-processor），中间逐段渲染。 */
  renderNotes(t, mono, cnt, t0, notesOn) {
    if (t.spec.kind === "clips") return;
    const sr = this.sr, notes = t.spec.notes, tEnd = t0 + cnt / sr;
    let pos = 0;
    const renderTo = (at) => {
      if (at <= pos) return;
      if (t.spec.kind === "sf") {
        if (t.sf) this.tsf.render(t.sf.player, mono, pos, at - pos);
      } else this.renderVowels(t.vowels, mono, null, null, pos, at - pos);
      pos = at;
    };
    if (notesOn) {
      for (; ; ) {
        const nextOn = t.nextNote < notes.length ? notes[t.nextNote].t0 : Infinity, nextOff = t.offs.length ? t.offs[0].t : Infinity;
        if (nextOn >= tEnd && nextOff >= tEnd) break;
        if (nextOff <= nextOn) {
          renderTo(Math.min(cnt, Math.max(pos, Math.round((nextOff - t0) * sr))));
          const o = t.offs.shift();
          this.noteOff(t, o.key, o.preset);
        } else {
          renderTo(Math.min(cnt, Math.max(pos, Math.round((nextOn - t0) * sr))));
          this.noteOn(t, notes[t.nextNote++]);
        }
      }
    }
    renderTo(cnt);
  }
  // ── 元音采样器（原 src/singer/sampler.ts 的做法搬进音频线程：最近音高的样本变速、按住循环稳态段、松开淡出）────────
  vowelOn(pool, src, kana, key, gl, gr) {
    if (!this.vowels) return null;
    const es = this.vowels.entries.filter((e2) => e2.kana === kana);
    if (!es.length) return null;
    const e = es.reduce((a, b) => Math.abs(b.midi - key) < Math.abs(a.midi - key) ? b : a);
    while (pool.length >= MAX_VOWEL_VOICES) pool.shift();
    const rate = 2 ** ((key - e.midi) / 12) * (this.vowels.sr / this.sr);
    const v = { src, data: e.data, pos: 0, rate, target: rate, loopStart: e.loopStart, loopEnd: e.loopEnd, env: 0, state: "attack", gl, gr, key, baseMidi: e.midi };
    pool.push(v);
    return v;
  }
  /** 一池声音出 cnt 个采样：单声道 mono（时间线轨）或立体声 L / R（试听，自带增益声像）。 */
  renderVowels(pool, mono, L, R, off, cnt) {
    const sr = this.sr, attack = 1 / (V_ATTACK * sr), relK = Math.exp(-1 / (V_RELEASE * sr)), cutK = Math.exp(-1 / (V_CUT * sr)), glideK = 1 - Math.exp(-1 / (V_GLIDE * sr));
    for (let vi = pool.length - 1; vi >= 0; vi--) {
      const v = pool[vi], d = v.data, span = v.loopEnd - v.loopStart;
      for (let i = 0; i < cnt; i++) {
        if (v.state === "attack") {
          v.env += attack;
          if (v.env >= 1) {
            v.env = 1;
            v.state = "hold";
          }
        } else if (v.state === "release") v.env *= relK;
        else if (v.state === "cut") v.env *= cutK;
        v.rate += (v.target - v.rate) * glideK;
        const k = v.pos | 0, f = v.pos - k, s = d[k] * (1 - f) + (d[k + 1] ?? d[k]) * f, y = s * v.env;
        if (mono) mono[off + i] += y;
        else {
          L[off + i] += y * v.gl;
          R[off + i] += y * v.gr;
        }
        v.pos += v.rate;
        if (span > 0) {
          while (v.pos >= v.loopEnd) v.pos -= span;
        } else if (v.pos >= d.length - 1) {
          v.env = 0;
          v.state = "cut";
          break;
        }
      }
      if ((v.state === "release" || v.state === "cut") && v.env < 1e-4) pool.splice(vi, 1);
    }
  }
  // ── 按键试听 ──────────────────────────────────────────────────────────────────────────────────────────────────────
  audition(m) {
    if (m.ev === "alloff") {
      for (const src of [...this.auditions.keys()]) this.auditionOff(src);
      for (const v of this.auditionVowels) v.state = "cut";
      for (const v of this.auditionClips) v.state = "cut";
      return;
    }
    if (m.ev === "off") {
      this.auditionOff(m.src);
      return;
    }
    if (m.ev === "glide") {
      const au = this.auditions.get(m.src);
      if (!au || m.key === void 0) return;
      if (au.inst.kind === "vowel" && this.vowels) {
        const near = Math.abs(m.key - au.key) <= 3;
        if (near) {
          for (const v of this.auditionVowels) if (v.src === m.src) {
            v.target = 2 ** ((m.key - v.baseMidi) / 12) * (this.vowels.sr / this.sr);
            v.key = m.key;
          }
          au.key = m.key;
          return;
        }
      }
      this.auditionOff(m.src);
      this.audition({ ...m, ev: "on", inst: au.inst, gainDb: m.gainDb, pan: m.pan });
      return;
    }
    if (!m.inst || m.key === void 0) return;
    this.auditionOff(m.src);
    const [gl, gr] = panGains(m.gainDb ?? 0, m.pan ?? 0), vel = m.vel ?? 0.8;
    if (m.inst.kind === "sf") {
      const bank = this.banks.get(m.inst.sha);
      if (!bank) return;
      let p = this.auditionSf.get(m.inst.sha);
      if (!p) {
        p = this.playerFor(bank);
        this.auditionSf.set(m.inst.sha, p);
      }
      this.tsf.noteOn(p.player, m.inst.preset, m.key, vel);
      this.lastAud.set(m.inst.sha, [gl, gr]);
    } else if (m.inst.kind === "vowel") {
      for (const v of this.auditionVowels) if (v.src === m.src) v.state = "cut";
      this.vowelOn(this.auditionVowels, m.src, m.inst.kana, m.key, gl, gr);
    } else return;
    this.auditions.set(m.src, { inst: m.inst, key: m.key, gl, gr });
  }
  auditionOff(src) {
    const au = this.auditions.get(src);
    if (!au) return;
    this.auditions.delete(src);
    if (au.inst.kind === "sf") {
      const p = this.auditionSf.get(au.inst.sha);
      if (p) this.tsf.noteOff(p.player, au.inst.preset, au.key);
    } else if (au.inst.kind === "clip") {
      for (const v of this.auditionClips) if (v.src === src && v.state !== "cut") v.state = "release";
    } else for (const v of this.auditionVowels) if (v.src === src && v.state !== "cut") v.state = "release";
  }
  renderAuditions(n) {
    if (this.auditionVowels.length) this.renderVowels(this.auditionVowels, null, this.audL, this.audR, 0, n);
    if (this.auditionClips.length) this.renderClipVoices(n);
    for (const [sha, p] of this.auditionSf) {
      if (this.tsf.active(p.player) === 0) continue;
      this.tsf.render(p.player, this.mono, 0, n);
      const [gl, gr] = this.lastAud.get(sha) ?? [1, 1];
      for (let i = 0; i < n; i++) {
        this.audL[i] += this.mono[i] * gl;
        this.audR[i] += this.mono[i] * gr;
      }
    }
  }
  /** 试听的一段声音：线性重采样放一遍（不循环），起 5 ms、松开 40 ms 淡出、被顶掉 6 ms。 */
  renderClipVoices(n) {
    const sr = this.sr, attack = 1 / (5e-3 * sr), relK = Math.exp(-1 / (0.04 * sr)), cutK = Math.exp(-1 / (6e-3 * sr));
    for (let vi = this.auditionClips.length - 1; vi >= 0; vi--) {
      const v = this.auditionClips[vi], d = v.data, len = d.length;
      for (let i = 0; i < n; i++) {
        if (v.state === "attack") {
          v.env += attack;
          if (v.env >= 1) {
            v.env = 1;
            v.state = "hold";
          }
        } else if (v.state === "release") v.env *= relK;
        else if (v.state === "cut") v.env *= cutK;
        const k = v.pos | 0;
        if (k >= len - 1) {
          v.env = 0;
          v.state = "cut";
          break;
        }
        const f = v.pos - k, y = (d[k] * (1 - f) + d[k + 1] * f) * v.env;
        this.audL[i] += y * v.gl;
        this.audR[i] += y * v.gr;
        v.pos += v.ratio;
      }
      if ((v.state === "release" || v.state === "cut") && v.env < 1e-4) {
        this.auditionClips.splice(vi, 1);
        if (this.auditions.get(v.src)?.inst.kind === "clip") this.auditions.delete(v.src);
      }
    }
  }
  // ── 母线前瞻限幅（原 src/audio/mix.ts limitBus 的实时版：输出晚 look 个采样；每个未来的峰按 attack 曲线提前收、过了峰按 release 慢慢放开；左右同一条增益）───
  limit(n, g) {
    const look = this.look, c = CEILING, L = this.busL, R = this.busR, dL = this.delayL, dR = this.delayR, need = this.need, att = this.attPow;
    for (let i = 0; i < n; i++) {
      const l = L[i] * g, r = R[i] * g, p = Math.max(Math.abs(l), Math.abs(r));
      const slot = this.wr, outL = dL[slot], outR = dR[slot];
      let gq = need[slot];
      dL[slot] = l;
      dR[slot] = r;
      need[slot] = p > c ? c / p : 1;
      for (let d = 1; d <= look; d++) {
        const v = 1 - (1 - need[(slot + d) % look]) * att[d];
        if (v < gq) gq = v;
      }
      this.wr = (slot + 1) % look;
      gq = Math.min(gq, 1 - (1 - this.gPrev) * this.aRel);
      this.gPrev = gq;
      let a = outL * gq, b = outR * gq;
      if (a > c) a = c;
      else if (a < -c) a = -c;
      if (b > c) b = c;
      else if (b < -c) b = -c;
      L[i] = a;
      R[i] = b;
    }
  }
};

// src/engine/studio-processor.ts
var StudioProcessor = class extends AudioWorkletProcessor {
  studio = null;
  queue = [];
  constructor(options) {
    super();
    this.port.onmessage = (e) => {
      if (this.studio) this.studio.handle(e.data);
      else this.queue.push(e.data);
    };
    void instantiateTsf(options.processorOptions.module).then((tsf) => {
      this.studio = new Studio(sampleRate, tsf, (m, transfer) => this.port.postMessage(m, transfer ?? []));
      for (const m of this.queue) this.studio.handle(m);
      this.queue = [];
      this.port.postMessage({ type: "ready" });
    }).catch((err) => this.port.postMessage({ type: "error", message: `studio: wasm ${err.message}` }));
  }
  process(_inputs, outputs) {
    const out = outputs[0];
    if (!out || !out.length) return true;
    const L = out[0], R = out[1] ?? out[0];
    if (!this.studio) {
      for (const c of out) c.fill(0);
      return true;
    }
    this.studio.render(L, R, L.length);
    return true;
  }
};
registerProcessor("studio", StudioProcessor);
//# sourceMappingURL=studio-worklet-6f9247d21a39.mjs.map
