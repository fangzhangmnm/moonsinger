export declare const SPEC_BANDS = 96, SPEC_FMIN = 30, SPEC_FMAX = 16000;
/** 第 k 个频带的中心频率（对数等分 30 Hz – 16 kHz）。 */
export declare const bandHz: (k: number) => number;
/** 频率 → 横坐标 0–1（同频带的对数刻度）。 */
export declare const xOfHz: (f: number) => number;
/** 原地 radix-2 FFT（re / im 长度 = 2 的幂）。 */
export declare function fft(re: Float64Array, im: Float64Array): void;
/** 一段采样 → 96 个点上的**每八度功率**（dB；v0.10.28）：dP/d log₂f，连续的密度，不是「分成几个格子各装多少」——
 *  点数（96 个，30 Hz – 16 kHz 对数等分，约每八度 10.6 个）只是采样密度，读数不跟着它变；粉噪声 = 平的、白噪声 = 每八度 +3 dB。
 *  · 高处（一个点管的那一小段比 FFT 一格宽）：这一段里所有格子（按格子中心归段，一格只进一段）的功率加起来 ÷ 这一段有几个八度宽；
 *  · 低处（约 350 Hz 以下，比一格还窄；2048 点 / 48 kHz = 23 Hz 一格）：每一格的功率摊到它自己覆盖的那几个八度上（格子越低、覆盖的八度越宽），
 *    点落在两格之间 = 按对数频率在两格之间插（不是台阶）。
 *  功率按汉宁窗的等效噪声带宽归一（一格里一个满幅正弦的功率 = 1）。user 2026-10-10「eq的频谱我记得有两种一个是df一个是d1/f用哪个更合理？…或者就用能量？」
 *  →「both yes」→「not discrete bands, but perhaps power per octave?」「for band how many bands? if it is only three bars it beats the propose of a spectrum」。 */
export declare function bandsDb(x: Float32Array, sr: number): Float32Array;
/** 平滑：涨得快（直接到）、落得慢（每次最多落 fall dB）。 */
export declare function smoothBands(prev: Float32Array | undefined, next: Float32Array, fall?: number): Float32Array;
/** 96 个点 → SVG 填充面的 path（viewBox 0 0 100 100；dB 范围 [lo, hi] 映到 100 → 0）。每八度功率比以前「一格最大的」高约 10 dB（一个点管 0.094 个八度）：范围跟着往上挪。 */
export declare function areaPath(b: Float32Array, lo?: number, hi?: number): string;
