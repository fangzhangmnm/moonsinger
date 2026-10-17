// src/export/lame.ts
var BLOCK = 1152 * 16;
function createMp3Encoder(M, o) {
  const gf = M._mg_open(o.channels, o.sr, o.kbps, o.joint === false ? 0 : 1, o.quality ?? 2);
  if (!gf) throw new Error(`lame: init failed (${o.channels} ch, ${o.sr} Hz, ${o.kbps} kbps)`);
  let cap = BLOCK, pl = M._malloc(cap * 4), pr = o.channels === 2 ? M._malloc(cap * 4) : 0, osz = Math.ceil(1.25 * cap + 7200), po = M._malloc(osz), closed = false;
  const grow = (n) => {
    if (n <= cap) return;
    M._free(pl);
    if (pr) M._free(pr);
    M._free(po);
    cap = n;
    pl = M._malloc(cap * 4);
    pr = o.channels === 2 ? M._malloc(cap * 4) : 0;
    osz = Math.ceil(1.25 * cap + 7200);
    po = M._malloc(osz);
  };
  const take = (k) => {
    if (k < 0) throw new Error(`lame: encode error ${k}`);
    return M.HEAPU8.slice(po, po + k);
  };
  return {
    encode(left, right) {
      if (closed) throw new Error("lame: encoder closed");
      if (o.channels === 2 && (!right || right.length !== left.length)) throw new Error("lame: stereo needs left / right of equal length");
      const out = [];
      let total = 0;
      for (let i = 0; i < left.length; i += BLOCK) {
        const n = Math.min(BLOCK, left.length - i);
        grow(n);
        M.HEAPF32.set(left.subarray(i, i + n), pl >> 2);
        if (pr) M.HEAPF32.set(right.subarray(i, i + n), pr >> 2);
        const b = take(M._mg_encode(gf, pl, pr, n, po, osz));
        if (b.length) {
          out.push(b);
          total += b.length;
        }
      }
      if (out.length === 1) return out[0];
      const all = new Uint8Array(total);
      let p = 0;
      for (const b of out) {
        all.set(b, p);
        p += b.length;
      }
      return all;
    },
    flush() {
      if (closed) throw new Error("lame: encoder closed");
      return take(M._mg_flush(gf, po, osz));
    },
    close() {
      if (closed) return;
      closed = true;
      M._mg_close(gf);
      M._free(pl);
      if (pr) M._free(pr);
      M._free(po);
    },
    get delay() {
      return M._mg_delay(gf);
    }
  };
}
function encodeAll(M, o, left, right) {
  const enc = createMp3Encoder(M, o);
  try {
    const body = enc.encode(left, right), tail = enc.flush();
    if (!tail.length) return body;
    const all = new Uint8Array(body.length + tail.length);
    all.set(body, 0);
    all.set(tail, body.length);
    return all;
  } finally {
    enc.close();
  }
}

// src/export/mp3-worker.ts
var LAME_URL = new URL("../vendor/lame/lame.mjs", import.meta.url);
var lameP = null;
var lame = () => lameP ??= import(
  /* @vite-ignore */
  LAME_URL.href
).then((m) => m.default());
self.onmessage = async (ev) => {
  try {
    const { left, right, sr, kbps } = ev.data, M = await lame();
    const out = encodeAll(M, { channels: right ? 2 : 1, sr, kbps, joint: true }, left, right);
    const bytes = new Uint8Array(new ArrayBuffer(out.length));
    bytes.set(out);
    self.postMessage({ ok: true, bytes }, [bytes.buffer]);
  } catch (e) {
    self.postMessage({ ok: false, message: e.message });
  }
};
//# sourceMappingURL=mp3-worker-1ebe72af5e6d.mjs.map
