// lamejs.d.ts —— vendor/lamejs/lamejs.js 的类型声明（按 @breezystack/lamejs 1.2.7 的 type.d.ts 改写）。created 2026-10-07 by Claude Opus 5.5
export class Mp3Encoder {
  /** opts = MoonSinger 本地补丁（2026-10-17，见 README）：joint = 联合立体声（上游写死左右各编各的）；reservoir = 开比特池（上游写死关）；quality = LAME 质量档 0–9（上游 3）。不给 = 上游行为。 */
  constructor(channels: number, sampleRate: number, kbps: number, opts?: { joint?: boolean; reservoir?: boolean; quality?: number });
  encodeBuffer(left: Int16Array, right?: Int16Array): Uint8Array;
  flush(): Uint8Array;
}
