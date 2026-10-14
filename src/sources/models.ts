// models.ts —— 模型从哪来（pwa-models：小月相本体 / 运行时 / 词典；家族级黄线白名单 ②）。created 2026-10-15 by Claude Fable 5.1（从 src/app/main.ts 搬来，刀 4 音源来源接缝）
// ── 模型来源（ADR-0006 ③ re-pointable endpoints：界面上能改、出厂预填；user 2026-10-07「i might worry about hardcode my gh link so if
//    i closed my gh account all app are not able to run in private server which violates the anti abandonware rule」）：
//    先找同一个网站下的 pwa-models/（自己搭服务器的人把模型仓拷过来就能用、不用配置），找不到再用这里设的；还能从本机文件导入。
//    设的值只在这次打开里有效（持久化还没定）。
export const MODEL_SOURCE_DEFAULT = "https://fangzhangmnm.github.io/pwa-models";

export interface ModelSources {
  /** 设置里填的模型来源（这次打开里有效；空 = 出厂默认）。 */
  source: string;
  /** 逐个试的地址：同一个网站下的 pwa-models/ 先，再设置里的。 */
  bases(): string[];
}
export function createModelSources(): ModelSources {
  let source = MODEL_SOURCE_DEFAULT;
  return {
    get source() { return source; },
    set source(v: string) { source = v.trim() || MODEL_SOURCE_DEFAULT; },
    bases: () => [...new Set([new URL("pwa-models", location.href).href, source.trim().replace(/\/+$/, "") || MODEL_SOURCE_DEFAULT])],
  };
}
