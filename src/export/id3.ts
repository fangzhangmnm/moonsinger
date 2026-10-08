// id3.ts —— mp3 的 ID3v2.3 标签（纯函数）：歌名 / 作者 / 许可 / 署名写进 mp3 文件头，播放器、网盘、文件管理器都读得到。created 2026-10-08 by Claude Opus 5.5
// user 2026-10-08「mp3能自动生成license吗」。用 v2.3 + UTF-16（带 BOM）：中日文在 iOS / Windows 资源管理器 / 各播放器里都显示得出来（v2.4 的 UTF-8 老 Windows 不认）。
// 规格：ID3v2.3.0（id3.org）——头 10 字节「ID3」03 00 + 标志 + 同步安全的长度；帧 = 4 字节 id + 4 字节长度（v2.3 帧长度是普通大端，不是同步安全）+ 2 字节标志 + 内容。
export interface Id3Fields {
  title?: string;       // TIT2
  artist?: string;      // TPE1
  copyright?: string;   // TCOP（这首歌自己的许可）
  copyrightUrl?: string;   // WCOP（许可的链接，只放 ASCII 网址）
  comment?: string;     // COMM（整段署名）
  software?: string;    // TSSE
}

const enc = (s: string): Uint8Array => {   // UTF-16LE + BOM
  const out = new Uint8Array(2 + s.length * 2); out[0] = 0xff; out[1] = 0xfe;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); out[2 + i * 2] = c & 0xff; out[3 + i * 2] = c >> 8; }
  return out;
};
const cat = (...xs: Uint8Array[]): Uint8Array => { const n = xs.reduce((a, x) => a + x.length, 0), out = new Uint8Array(n); let o = 0; for (const x of xs) { out.set(x, o); o += x.length; } return out; };
const ascii = (s: string) => Uint8Array.from([...s].map((c) => c.charCodeAt(0) & 0x7f));
function frame(id: string, body: Uint8Array): Uint8Array {
  const h = new Uint8Array(10); h.set(ascii(id), 0);
  const n = body.length; h[4] = (n >>> 24) & 0xff; h[5] = (n >>> 16) & 0xff; h[6] = (n >>> 8) & 0xff; h[7] = n & 0xff;
  return cat(h, body);
}
const textFrame = (id: string, s: string) => frame(id, cat(Uint8Array.of(1), enc(s)));
/** 一整个 ID3v2.3 标签（空字段不写；全空 = 空数组）。拼在 mp3 字节最前面。 */
export function id3v2(f: Id3Fields): Uint8Array {
  const frames: Uint8Array[] = [];
  if (f.title) frames.push(textFrame("TIT2", f.title));
  if (f.artist) frames.push(textFrame("TPE1", f.artist));
  if (f.copyright) frames.push(textFrame("TCOP", f.copyright));
  if (f.copyrightUrl && /^https?:\/\/[\x21-\x7e]+$/.test(f.copyrightUrl)) frames.push(frame("WCOP", ascii(f.copyrightUrl)));
  if (f.comment) frames.push(frame("COMM", cat(Uint8Array.of(1), ascii("chi"), enc(""), Uint8Array.of(0, 0), enc(f.comment))));   // 编码 + 语言 + 空的短描述（UTF-16 结尾两个 0）+ 正文
  if (f.software) frames.push(textFrame("TSSE", f.software));
  if (!frames.length) return new Uint8Array(0);
  const body = cat(...frames), n = body.length, h = new Uint8Array(10);
  h.set(ascii("ID3"), 0); h[3] = 3; h[4] = 0; h[5] = 0;
  h[6] = (n >>> 21) & 0x7f; h[7] = (n >>> 14) & 0x7f; h[8] = (n >>> 7) & 0x7f; h[9] = n & 0x7f;   // 同步安全：每字节只用低 7 位
  return cat(h, body);
}
/** 许可文字里第一个网址（给 WCOP）。 */
export const firstUrl = (s: string | undefined): string | undefined => (s ? /https?:\/\/[\x21-\x7e]+/.exec(s)?.[0] : undefined);
