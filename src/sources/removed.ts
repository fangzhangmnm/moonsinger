// src/sources/removed.ts —— 自带的库被人删了（v0.17.25，统筹「v0.17.24：…删掉的库不许自己下回来」）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。
//   自带的库在这台设备上三种状态：装着 / 没装（用到时自己下载，照原来）/ 你删了（不自己下载，用它的声部不出声，直到人点「装回来」）。
//   「你删了」的记号住在 app 自己的设备键值里（读写在 main.ts，那里在持久层白名单上）；这里只有纯的东西：库的名字、报给人的那一句、下不下载的判断。
//   拦在真正去下载的那一处：小月相 = worker 的 ensurePacks（请求带 blocked）；乐器音色库 = 解析链里去音源库拿整包那一步（sources/sounds.ts）。
import { _t } from "../i18n/index.ts";

export type BuiltinLib = "voice" | "gs";
/** 被删了的那一句（不出声的清单里的原因、worker 报回来的错，同一句）。 */
export const removedWhy = (lib: BuiltinLib): string => (lib === "voice" ? _t("小月相被你删了") : _t("乐器音色库被你删了"));
/** 「被删了」的错：带着是哪个库（认种类靠 removedLib，不靠比那句会翻译、会改措辞的话；统筹「v0.17.25 收」第 1 条）。 */
export class LibRemovedError extends Error {
  readonly removedLib: BuiltinLib;
  constructor(lib: BuiltinLib) { super(removedWhy(lib)); this.name = "LibRemovedError"; this.removedLib = lib; }
}
/** 缺的东西怎么办：在 = 用；不在、没被删 = 自己下载（照原来）；不在、被删了 = 不下载，报「被删了」。 */
export const packPlan = (ready: boolean, removed: boolean): "use" | "download" | "removed" => (ready ? "use" : removed ? "removed" : "download");
