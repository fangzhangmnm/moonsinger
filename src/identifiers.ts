// identifiers.ts —— 身份的语法（store 0.16：文档种类表）。created 2026-10-08 by Claude Fable 5.1（抄 WebXiaoHeiWu src/identifiers.ts）
//   本 app 只有一种文档：歌（`<名>.mxl`，zip 容器 = MusicXML 压缩包，别的乐谱软件也能开）。这张表报给 createStore（app-store.ts），
//   同一张表在这里再造一份 identifiers 给纯代码和测试用——两边永远是同一套切法。
//   这是 @internal/store 的第二个值级 import 点（test/redline-guard.test.mjs 里放行）：createIdentifiers 是纯函数，不碰存储、不碰云。
//   用词（user 2026-09-29 定）：identifier 身份 / folder / stem 主干 / suffix 后缀 / kind 种类。name 不再指任何精确的东西。
import { createIdentifiers, type DocKind, type Identifiers } from "@internal/store";
import { SONG_SUFFIX } from "./config.ts";

export const SONG_KIND = "song";
export const DOC_KINDS: readonly DocKind[] = Object.freeze([
  { kind: SONG_KIND, suffix: SONG_SUFFIX, container: "zip" },
]);
export const identifiers: Identifiers = createIdentifiers(DOC_KINDS);
