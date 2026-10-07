// lamejs.d.ts —— vendor/lamejs/lamejs.js 的类型声明（按 @breezystack/lamejs 1.2.7 的 type.d.ts 改写）。created 2026-10-07 by Claude Opus 5.5
export class Mp3Encoder {
  constructor(channels: number, sampleRate: number, kbps: number);
  encodeBuffer(left: Int16Array, right?: Int16Array): Uint8Array;
  flush(): Uint8Array;
}
