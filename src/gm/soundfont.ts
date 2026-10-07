// soundfont.ts —— SoundFont 2 播放器的 JS 接口（包 vendor/tsf/ 自己编的 TinySoundFont WASM）。created 2026-10-07 by Claude Fable 5.1
// 契约草稿 §10：样本类音源 = 歌里嵌的 SF2 子集；GM 候选在 worker 里按谱出声。「渲染 = 纯函数(文件)」：
//   一次渲染 = 一个 Player（tsf_copy：共享采样、自己的发声状态），同一串事件永远出同样的采样（Node 里核过逐样本相同）。
// 模块由宿主创建好递进来（worker 按地址载、测试 readFileSync），同 src/singer/world-wrap.mjs 的做法。
// 内存：tsf 载入时把 16 位采样转成 float（≈ sf2 采样字节 × 2）；整包 GeneralUser GS（32 MB）要 ~110 MB 堆，只在找音源时载；歌里嵌的是子集，很小。

export interface SfPreset { index: number; bank: number; program: number; name: string }
/** 一个要出声的音：preset = 预设下标；key = MIDI 音高；vel 0–1；t0 / t1 = 起止秒（谱的时钟；t1 = 松键，之后按预设自己的 release 收尾）。 */
export interface SfNote { preset: number; key: number; vel: number; t0: number; t1: number }

export interface SfBank {
  readonly sampleRate: number;
  readonly presets: SfPreset[];
  /** bank / program 找预设下标；没有 = −1（GM 鼓组 = bank 128）。 */
  presetIndex(bank: number, program: number): number;
  /** 把一串音渲染成单声道 float（纯函数：同样的 notes 同样的采样）。tailSec = 最后一个松键之后再算多久（让 release 收完）。 */
  render(notes: readonly SfNote[], tailSec?: number): Float32Array;
  close(): void;
}

/** M = emscripten 的 createTsf() 出来的模块。 */
export function wrapTsf(M: any): { load(bytes: Uint8Array, sampleRate: number): SfBank } {
  return {
    load(bytes, sampleRate) {
      const p = M._malloc(bytes.length); M.HEAPU8.set(bytes, p);
      const bank = M._sf_load(p, bytes.length, sampleRate); M._free(p);
      if (!bank) throw new Error("soundfont: not a SoundFont 2 file");
      const presets: SfPreset[] = Array.from({ length: M._sf_preset_count(bank) }, (_, i) => ({ index: i, bank: M._sf_preset_bank(bank, i), program: M._sf_preset_num(bank, i), name: M.UTF8ToString(M._sf_preset_name(bank, i)) }));
      let closed = false;
      const render = (notes: readonly SfNote[], tailSec = 2): Float32Array => {
        if (closed) throw new Error("soundfont: bank closed");
        const ev: { t: number; on: boolean; n: SfNote }[] = [];
        for (const n of notes) { ev.push({ t: n.t0, on: true, n }); ev.push({ t: Math.max(n.t0, n.t1), on: false, n }); }
        ev.sort((a, b) => a.t - b.t || (a.on === b.on ? 0 : a.on ? 1 : -1));   // 同一刻先松后按（同键重按不被自己的松键吃掉）
        const end = ev.length ? ev[ev.length - 1].t + tailSec : 0;
        const total = Math.ceil(end * sampleRate), out = new Float32Array(total);
        const f = M._sf_copy(bank);
        const BLOCK = 4096, buf = M._malloc(BLOCK * 4);
        let pos = 0, k = 0;
        const renderTo = (sample: number) => {
          while (pos < sample) {
            const n = Math.min(BLOCK, sample - pos);
            M._sf_render(f, buf, n); out.set(M.HEAPF32.subarray(buf / 4, buf / 4 + n), pos); pos += n;
          }
        };
        for (; k < ev.length; k++) {
          const e = ev[k]; renderTo(Math.min(total, Math.round(e.t * sampleRate)));
          if (e.on) M._sf_note_on(f, e.n.preset, e.n.key, e.n.vel); else M._sf_note_off(f, e.n.preset, e.n.key);
        }
        renderTo(total);
        M._free(buf); M._sf_close(f);
        return out;
      };
      return {
        sampleRate, presets,
        presetIndex: (b, pr) => M._sf_preset_index(bank, b, pr),
        render,
        close: () => { if (!closed) { closed = true; M._sf_close(bank); } },
      };
    },
  };
}
