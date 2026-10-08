// mix.ts —— 各声部的声音混成一条立体声（纯函数，播放 / 导出共用）。created 2026-10-08 by Claude Opus 5.5
// user 2026-10-08「三个音轨感觉音量很不稳定…难道你是用三个audio label放的而不是混音的？还是月读自己抽？就是感觉乐器进来之后好像月读变轻了…是不是因为没有挂压缩器？」
// 旧做法（main.ts renderMix，v0.5.0–0.6.7）：线性相加后若峰值 > 0.98，**整条混音**按峰值缩——任何一处响的乐器都会把整首（包括只有月读的段落）一起压小。
// 现在：相加照旧（增益 / 等功率声像 / 线性重采样，和旧代码逐样本相同）；母线只在超过天花板的那一小段压（离线前瞻限幅：
//   先算每个采样「最多能放多大」，往后慢慢回升（release）、往前提前收（attack，离线能看见未来），立体声联动），没超的地方逐样本不动。
// 每声部的音量只由录音室的增益决定、不随别的声部变（混音不做自动响度）。好不好听归 user 耳朵，这里只管数学：不削波、不改相对音量。

/** 一个声部渲染出来的声音：samples 的第 0 个采样对应谱上第 at 秒；gainDb / pan = 录音室这条推子。 */
export interface MixTrack { samples: Float32Array; sr: number; at: number; gainDb: number; pan: number }
export interface Mixed { left: Float32Array; right: Float32Array; sr: number; /** left[0] 对应谱上第几秒（≤ 0） */ start: number }

/** 母线天花板（−0.18 dBFS，和旧代码的 0.98 同一个数）。 */
export const CEILING = 0.98;

/** 相加：每声部线性重采样到 sr、乘增益、等功率声像（pan −1…1），按 at 对齐；尾巴多留 tailSec。 */
export function sumTracks(tracks: readonly MixTrack[], sr: number, tailSec = 0.3): Mixed {
  const start = Math.min(0, ...tracks.map((t) => t.at));
  const end = tracks.length ? Math.max(...tracks.map((t) => t.at + t.samples.length / t.sr)) + tailSec : 0;
  const n = Math.max(0, Math.ceil((end - start) * sr)), left = new Float32Array(n), right = new Float32Array(n);
  for (const t of tracks) {
    const g = 10 ** (t.gainDb / 20), pan = Math.max(-1, Math.min(1, t.pan));
    const gl = g * Math.cos(((pan + 1) * Math.PI) / 4), gr = g * Math.sin(((pan + 1) * Math.PI) / 4);
    const off = Math.round((t.at - start) * sr), ratio = t.sr / sr, len = Math.floor(t.samples.length / ratio);
    for (let i = 0; i < len; i++) {
      const p = i * ratio, k = Math.floor(p), f = p - k, v = t.samples[k] * (1 - f) + (t.samples[k + 1] ?? 0) * f;
      left[off + i] += v * gl; right[off + i] += v * gr;
    }
  }
  return { left, right, sr, start };
}

export interface LimitOpts { ceiling?: number; attackSec?: number; releaseSec?: number }
/** 母线限幅（就地改 left / right，返回最深压了多少 dB，0 = 没碰）。离线 = 能看见未来：
 *  r[i] = 这个采样最多能放多大（≤ 1）；增益曲线 g ≤ r 处处成立（所以绝不超天花板），往后按 release 指数回升到 1、往前按 attack 指数提前收。
 *  没超天花板的整条 = r 全是 1 = g 全是 1 = 逐样本不动。左右同一条增益（立体声像不歪）。 */
export function limitBus(left: Float32Array, right: Float32Array, sr: number, o: LimitOpts = {}): number {
  const c = o.ceiling ?? CEILING, n = left.length;
  const g = new Float64Array(n);   // 必须 64 位：32 位时「差一点点到 1」的舍入总往下取，回升会卡住，远处也跟着被压一丝
  let any = false;
  for (let i = 0; i < n; i++) { const p = Math.max(Math.abs(left[i]), Math.abs(right[i])); g[i] = p > c ? c / p : 1; if (p > c) any = true; }
  if (!any) return 0;
  const aRel = Math.exp(-1 / ((o.releaseSec ?? 0.15) * sr)), aAtt = Math.exp(-1 / ((o.attackSec ?? 0.003) * sr));
  for (let i = 1; i < n; i++) g[i] = Math.min(g[i], 1 - (1 - g[i - 1]) * aRel);       // 压过之后慢慢放开
  for (let i = n - 2; i >= 0; i--) g[i] = Math.min(g[i], 1 - (1 - g[i + 1]) * aAtt);   // 峰到之前提前收（不出咔哒）
  let min = 1;
  for (let i = 0; i < n; i++) {
    const k = g[i]; if (k >= 1) continue;
    if (k < min) min = k;
    left[i] *= k; right[i] *= k;
    // float 乘法的最后一位：g = c / p 时 p·g 可能比 c 多一个 ulp——夹一下，保证「绝不超天花板」是硬的
    if (left[i] > c) left[i] = c; else if (left[i] < -c) left[i] = -c;
    if (right[i] > c) right[i] = c; else if (right[i] < -c) right[i] = -c;
  }
  return 20 * Math.log10(min);
}

/** 按音量曲线给一条声音乘增益（返回新的，原样本不动——渲染结果是缓存着的）。samples[0] 对应谱上第 at 秒；segs 按时间排好（src/score/perform.ts）；
 *  曲线外 = 最近一段的值；增益走一阶平滑（τ = smoothSec）免得段与段之间咔哒。 */
export function applyGain(samples: Float32Array, sr: number, at: number, segs: readonly { t0: number; t1: number; dB: number }[], smoothSec = 0.004): Float32Array {
  const out = new Float32Array(samples.length);
  if (!segs.length) { out.set(samples); return out; }
  const lin = (dB: number) => (dB === -Infinity ? 0 : 10 ** (dB / 20));
  const a = 1 - Math.exp(-1 / (smoothSec * sr));
  let k = 0, y = lin(segs[0].dB);
  for (let i = 0; i < samples.length; i++) {
    const t = at + i / sr;
    while (k < segs.length - 1 && t >= segs[k].t1) k++;
    y += (lin(segs[k].dB) - y) * a;
    out[i] = samples[i] * y;
  }
  return out;
}

/** 整条：相加 + 母线限幅。 */
export function mixTracks(tracks: readonly MixTrack[], sr: number, tailSec = 0.3): Mixed & { limitedDb: number } {
  const m = sumTracks(tracks, sr, tailSec);
  return { ...m, limitedDb: limitBus(m.left, m.right, sr) };
}
