// opened.ts —— 夹具的歌 = app 打开它之后的样子。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟；施工单第八刀 8-7，统筹定）
//   app 每次开歌、每次改谱都过 song.ts ensureStartDyns（每张纸每条轨第一个音前面补力度 / 理顺先后）；测试的歌不过这一步 = 测的不是 user 看到的那一份
//   （8-6 时不相撞守卫因此漏了「发夹 × 补的 mf」那一类）。所以所有排版夹具（用全的测试歌、三声部、cases 的真歌）都从这里出。
import { ensureStartDyns, type Song } from "../../../src/score/song.ts";

export function asOpened(song: Song): Song {
  let max = 0;
  for (const pp of song.papers) for (const t of Object.values(pp.tracks)) for (const k of t) if (k.id > max) max = k.id;
  return ensureStartDyns(song, max + 1, { reorder: true }).song;
}
