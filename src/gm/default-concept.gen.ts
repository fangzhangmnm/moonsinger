// 生成物：node scripts/gen-instruments.mjs（目录 v16 的 Q7390）。勿手改。
// 新歌默认那一位（主唱）的乐器概念，按值（施工单 12-4）：排谱 / 新建声部时就要，不等目录加载。
import type { LoungeRoleV2 } from "../format/contract.ts";
export const DEFAULT_CONCEPT: Readonly<NonNullable<LoungeRoleV2["concept"]>> = {
 "ids": {
  "wikidata": "Q7390",
  "local": null,
  "musicxml": "voice.vocals",
  "gm": [
   {
    "program": 53,
    "bank": 0
   },
   {
    "program": 52,
    "bank": 0
   }
  ],
  "hs": null
 },
 "name": {
  "zh": "人声",
  "en": "human voice",
  "ja": "声"
 },
 "score": {
  "zh": "人声",
  "en": "Voice"
 },
 "abbr": {
  "en": "Vo."
 }
};
