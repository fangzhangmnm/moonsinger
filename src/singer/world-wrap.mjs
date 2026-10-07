// world-wrap.mjs —— 把 emscripten 出来的 WORLD 模块包成 { analyze, synth }（普通数组进出）。created 2026-10-06 by Claude Opus 5.5
// 照抄 Lab/20261005 月读第一首/world.mjs 的 loadWorld 主体（同一份 WASM、同样的拷贝方式），只是模块由宿主创建好递进来，
// 这样浏览器 worker 也能用。浏览器 == Node 的逐样本比对守着两边不漂；以后 Lab world.mjs 可以改成 import 这一份（Lab 现归另一 session）。
export function wrapWorld(M) {
  const put = (arr) => { const p = M._malloc(arr.length * 8); M.HEAPF64.set(arr, p / 8); return p; };
  function analyze(x, fs, { framePeriod = 5, f0Floor = 80, f0Ceil = 1000 } = {}) {
    const px = put(Float64Array.from(x)), a = M._w_analyze(px, x.length, fs, framePeriod, f0Floor, f0Ceil);
    const frames = M._w_frames(a), fft = M._w_fft(a), bins = fft / 2 + 1;
    const view = (p, n) => M.HEAPF64.slice(p / 8, p / 8 + n);
    const out = { frames, fft, bins, framePeriod, fs, f0: view(M._w_f0(a), frames), sp: view(M._w_sp(a), frames * bins), ap: view(M._w_ap(a), frames * bins) };
    M._w_free(a); M._free(px); return out;
  }
  function synth({ f0, sp, ap, fft, fs, framePeriod }) {
    const frames = f0.length, n = M._w_synth_len(frames, fs, framePeriod);
    const pf = put(f0), ps = put(sp), pa = put(ap), py = M._malloc(n * 8);
    M._w_synth(pf, frames, ps, pa, fft, fs, framePeriod, py);
    const y = M.HEAPF64.slice(py / 8, py / 8 + n); [pf, ps, pa, py].forEach((p) => M._free(p)); return y;
  }
  return { analyze, synth };
}
