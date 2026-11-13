// library-ids.ts —— 家族音源库里几个库的 id（只放常数，不 import 别的：读文件的门口、出声的代码、找人视图都能用，不拖进目录的取数那一层）。
// created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）：GS_LIBRARY_ID 原来只在 catalog.ts（它连着 resources.ts 的取数）；踏板 11-3 读文件的门口要认「是不是 GS 货架上的」，搬到这里、catalog.ts 照旧导出。
/** GS 在家族音源库里的 id（sampleKey、目录里的连断 / 音效 / 余音这些按音色抄的数，只对它成立）。 */
export const GS_LIBRARY_ID = "generaluser-gs-2.0.3";
