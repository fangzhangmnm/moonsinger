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

// src/gm/synth-processor.ts
var GmSynthProcessor = class extends AudioWorkletProcessor {
  tsf = null;
  bank = null;
  sha = "";
  queue = [];
  meter = false;
  meterPeak = 0;
  meterFrames = 0;
  constructor(options) {
    super();
    this.port.onmessage = (e) => void this.onMessage(e.data);
    void instantiateTsf(options.processorOptions.module).then((t) => {
      this.tsf = t;
      this.port.postMessage({ type: "ready" });
    }).catch((err) => this.port.postMessage({ type: "error", message: `synth: wasm ${err.message}` }));
  }
  async onMessage(m) {
    switch (m.type) {
      case "load": {
        if (!this.tsf) {
          this.port.postMessage({ type: "error", id: m.id, message: "synth: wasm not ready" });
          return;
        }
        if (this.bank) {
          this.tsf.close(this.bank);
          this.bank = null;
          this.queue = [];
        }
        const b = this.tsf.load(m.bytes, sampleRate);
        if (!b) {
          this.port.postMessage({ type: "error", id: m.id, message: "synth: not a SoundFont 2 file" });
          return;
        }
        this.bank = b;
        this.sha = m.sha;
        this.port.postMessage({ type: "loaded", id: m.id, sha: m.sha, presets: b.presets.map((p) => [p.bank, p.program]) });
        return;
      }
      case "unload":
        if (this.bank && this.tsf) {
          this.tsf.close(this.bank);
          this.bank = null;
          this.sha = "";
          this.queue = [];
        }
        return;
      case "noteOn":
        this.push({ t: m.t ?? null, kind: "on", preset: m.preset, key: m.key, vel: m.vel });
        return;
      case "noteOff":
        this.push({ t: m.t ?? null, kind: "off", preset: m.preset, key: m.key, vel: 0 });
        return;
      case "allOff":
        this.queue = [];
        if (this.bank && this.tsf) this.tsf.allOff(this.bank);
        return;
      case "meter":
        this.meter = m.on;
        this.meterPeak = 0;
        this.meterFrames = 0;
        return;
    }
  }
  push(ev) {
    let i = this.queue.length;
    while (i > 0 && (ev.t === null ? this.queue[i - 1].t !== null : this.queue[i - 1].t !== null && this.queue[i - 1].t > ev.t)) i--;
    this.queue.splice(i, 0, ev);
  }
  apply(ev) {
    if (!this.tsf || !this.bank) return;
    if (ev.kind === "on") this.tsf.noteOn(this.bank, ev.preset, ev.key, ev.vel);
    else this.tsf.noteOff(this.bank, ev.preset, ev.key);
  }
  process(_inputs, outputs) {
    const out = outputs[0];
    if (!out || !out.length) return true;
    const ch0 = out[0], n = ch0.length;
    if (!this.tsf || !this.bank) {
      for (const c of out) c.fill(0);
      return true;
    }
    const t0 = currentTime, end = t0 + n / sampleRate;
    let pos = 0;
    while (this.queue.length) {
      const ev = this.queue[0];
      if (ev.t !== null && ev.t >= end) break;
      const at = ev.t === null ? pos : Math.min(n, Math.max(pos, Math.round((ev.t - t0) * sampleRate)));
      if (at > pos) {
        this.tsf.render(this.bank, ch0, pos, at - pos);
        pos = at;
      }
      this.apply(ev);
      this.queue.shift();
    }
    if (pos < n) this.tsf.render(this.bank, ch0, pos, n - pos);
    for (let c = 1; c < out.length; c++) out[c].set(ch0);
    if (this.meter) {
      for (let i = 0; i < n; i++) {
        const a = Math.abs(ch0[i]);
        if (a > this.meterPeak) this.meterPeak = a;
      }
      this.meterFrames += n;
      if (this.meterFrames >= 1024) {
        this.port.postMessage({ type: "meter", peak: this.meterPeak, active: this.tsf.active(this.bank) });
        this.meterPeak = 0;
        this.meterFrames = 0;
      }
    }
    return true;
  }
};
registerProcessor("gm-synth", GmSynthProcessor);
//# sourceMappingURL=synth-worklet-70420f49185f.mjs.map
