// opened.ts —— 夹具的歌 = app 打开它之后的样子。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟；施工单第八刀 8-7，统筹定）
//   第 16 条起开歌不补不理顺，只有人改谱时补（document 的 normalize：只补、不理顺先后；2026-11-12 16-3 起这里也不理顺）——夹具 = 人改过一次谱之后的样子；测试的歌不过这一步 = 测的不是 user 看到的那一份
//   （8-6 时不相撞守卫因此漏了「发夹 × 补的 mf」那一类）。所以所有排版夹具（用全的测试歌、三声部、cases 的真歌）都从这里出。
import { ensureStartDyns, type Song } from "../../../src/score/song.ts";

export function asOpened(song: Song): Song {
  let max = 0;
  for (const pp of song.papers) for (const t of Object.values(pp.tracks)) for (const k of t) if (k.id > max) max = k.id;
  return ensureStartDyns(song, max + 1).song;
}
