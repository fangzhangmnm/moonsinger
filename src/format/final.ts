// final.ts —— 定稿 / 改稿（W-38；user 2026-10-13「记账 moonsinger加一个锁功能，写好了之后加锁，会渲染mp3，之后只能听，不能修改…解锁之后mp3自动cache invalid」
//   「想一个比锁语义更准确的名字」→「定稿改稿同意」）。created 2026-10-16 by Claude Fable 5.1。
//   定稿 = 渲染成 mp3 存进歌里（`.moonsinger/final.mp3`，不压缩）+ 总目录里一条 FinalRecord；之后出声的内容锁住（只能听）；改稿 = 记录和 mp3 一起丢掉。
//   这一层只管**文件里的真相**：记录的形状、出声内容的指纹（定稿后被谁改过一眼能看出）、mp3 entry 的位置。锁本身分四层执法（user 2026-10-16
//   「定稿的时候得从多个窄接口上护栏住写入，甚至store级别」）：① UI（听模式钉死、钮灰）② 状态入口（main.ts update / updateExtras / undo 拒绝）
//   ③ 格式（saveMxl：指纹对不上就抛，src/format/project.ts）④ store 接缝（editor-session 落盘前的门）。每层各自承重，不互相托付。
import { sha256TextSync } from "./sha256-sync.ts";

/** 定稿 mp3 在 zip 里的位置（不压缩；歌库靠 store getPeek 按 entry 名抓）。 */
export const FINAL_MP3_ENTRY = ".moonsinger/final.mp3";

/** 总目录 `manifest.final`：这首歌定稿的那一刻记了什么。 */
export interface FinalRecord {
  /** ISO 时刻。 */
  at: string;
  /** 这首歌自己的定稿版本号：每次定稿 +1（改稿不减；user 10-13「我是说歌的自增版本号」）。 */
  rev: number;
  /** 定稿时的 app 版本（壳；只是记一笔）。 */
  app: string;
  /** 定稿时的渲染核心（src/core/version.ts）：version 人定、hash 构建时按核心源码算。想复现这份 mp3 = 用这一版核心（user「还可以锁引擎的版本」）。 */
  core: { version: string; hash: string };
  /** 定稿那一刻出声内容的指纹（contentFingerprint）：对不上 = 定稿后被改过（旧版 app / 别的软件）→ 这份 mp3 不算数、打开时作废。 */
  fingerprint: string;
  /** 存进歌里的 mp3：路径、字节数、sha256、秒数、参数。 */
  mp3: { path: string; bytes: number; sha256: string; secs: number; sr: number; kbps: number; stereo: boolean };
  /** 进了 mp3 的声部（静音 / 独奏按定稿那一刻的视图；user 听到什么就定稿什么）。 */
  parts: string[];
  /** 定稿那一刻不出声的声部（§2.2½ 清单；mp3 里没有它们）。 */
  issues?: { part: string; why: string }[];
}

/** 出声内容的指纹的原料：saveMxl 写出来的 / openBytes 读进来的那几份**字符串**（同一份文件两边算出来一样）。
 *  不进指纹的 = 定稿后还允许改的：歌名 / 作者栏 / 许可 / 纸的大小（MusicXML 头里的 work / identification / credit / defaults；曲段名 movement-title 也剥掉——它只是显示）、
 *  视图态（score.json 的 view）、封面、文件名、参考窗。进指纹的 = 每张纸的音 + 记号 + 歌词、谱的扩展（编排 / 句号 / 起伏 / 隐藏 / 声部表 / 歌词排法 / 小节号）、
 *  休息室（谁上场、怎么演、哼的字）、录音房（推子 / 效果 / 总轨）、嵌的音源（路径里有 sha256）。 */
export interface FingerprintParts {
  /** 纸 id → 这张纸的 MusicXML 全文（按纸 id 排序后算）。 */
  papers: Record<string, string>;
  /** score.json 的 JSON 文本（含 view 也行，这里会去掉）。 */
  scoreExt: string;
  /** 角色 id → 休息室 JSON 文本。 */
  lounge: Record<string, string>;
  /** studio.json 的 JSON 文本。 */
  studio: string;
  /** 嵌的音源的路径（路径里有 sha256）。 */
  sounds: string[];
}
const HEAD_TAGS = [/<work>[\s\S]*?<\/work>\s*/g, /<movement-title>[\s\S]*?<\/movement-title>\s*/g, /<identification>[\s\S]*?<\/identification>\s*/g, /<credit\b[\s\S]*?<\/credit>\s*/g, /<defaults>[\s\S]*?<\/defaults>\s*/g];
/** MusicXML 去掉头上那几块（歌名 / 曲段名 / 作者栏 / 许可 / 编码日期 / 纸）：剩下的才是出声的内容。 */
export function strippedXml(xml: string): string { let s = xml; for (const re of HEAD_TAGS) s = s.replace(re, ""); return s; }
/** score.json 去掉 view（视图态不算内容）；键的顺序照原文。 */
function scoreExtNoView(text: string): string {
  const o = JSON.parse(text) as Record<string, unknown>;
  if ("view" in o) delete o.view;
  return JSON.stringify(o);
}
/** 出声内容的指纹（sha256）。纯函数：同样的原料同样的指纹。 */
export function contentFingerprint(p: FingerprintParts): string {
  const papers = Object.keys(p.papers).sort().map((id) => [id, strippedXml(p.papers[id])]);
  const lounge = Object.keys(p.lounge).sort().map((id) => [id, JSON.stringify(JSON.parse(p.lounge[id]))]);
  const studio = JSON.stringify(JSON.parse(p.studio));
  return sha256TextSync(JSON.stringify({ v: 1, papers, scoreExt: scoreExtNoView(p.scoreExt), lounge, studio, sounds: [...p.sounds].sort() }));
}

/** 读进来的 manifest.final 像不像一条记录（旧版 / 别的软件写坏的 = 不认）。 */
export function parseFinalRecord(v: unknown): FinalRecord | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>, mp3 = r.mp3 as Record<string, unknown> | undefined, core = r.core as Record<string, unknown> | undefined;
  if (typeof r.at !== "string" || typeof r.rev !== "number" || typeof r.fingerprint !== "string" || !mp3 || typeof mp3.path !== "string" || typeof mp3.bytes !== "number" || typeof mp3.sha256 !== "string") return null;
  return {
    at: r.at, rev: r.rev, app: String(r.app ?? ""), fingerprint: r.fingerprint,
    core: { version: String(core?.version ?? ""), hash: String(core?.hash ?? "") },
    mp3: { path: mp3.path, bytes: mp3.bytes, sha256: mp3.sha256, secs: Number(mp3.secs ?? 0), sr: Number(mp3.sr ?? 0), kbps: Number(mp3.kbps ?? 0), stereo: mp3.stereo !== false },
    parts: Array.isArray(r.parts) ? r.parts.map(String) : [],
    ...(Array.isArray(r.issues) ? { issues: (r.issues as { part: unknown; why: unknown }[]).map((i) => ({ part: String(i.part), why: String(i.why) })) } : {}),
  };
}

/** 定稿后改动是不是允许的那几种（歌名 / 作者栏 / 许可 / 纸的大小）：两份歌只在这几个字段上不同 = true（别的字段按引用比：谱 / 声部 / 哼 / 编排 / 排法都没换对象）。
 *  状态入口的那一层（main.ts update）用它判断「这一下改了什么」。 */
export function onlyMetaChanged(a: { title?: string; credits?: string; rights?: string; paper?: unknown; parts: unknown; papers: unknown; hum: unknown; arrangement?: string; lyricFit?: unknown; barNumbers?: unknown },
  b: typeof a): boolean {
  return a.parts === b.parts && a.papers === b.papers && a.hum === b.hum && a.arrangement === b.arrangement && a.lyricFit === b.lyricFit && a.barNumbers === b.barNumbers;
}
