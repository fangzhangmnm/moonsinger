// 写的音 → SoundFont 的键（纯函数）。created 2026-10-08 by Claude Opus 5.5
import { describe, it, eq } from "./runner.mjs";
import { sfKey, canAlign } from "../src/gm/sf-key.ts";

// 电话（仓鼠 v8 的数）：原速键 64、原速时最强谱峰 ≈ 96（C7 附近）、每键 50 音分
const PHONE = { key: 64, midi: 96, centsPerKey: 50 };
describe("写的音 → 键（sf-key.ts）", () => {
  it("固定键（鼓件 / 音效默认）：写什么都敲它", () => { eq(sfKey(60, { note: 64 }), 64); eq(sfKey(90, { note: 64, sfx: PHONE }, 12), 64); });
  it("没固定、没对齐：写的音 + 移调", () => { eq(sfKey(60, {}), 60); eq(sfKey(60, {}, -24), 36); eq(sfKey(60, { sfx: PHONE }), 60, "音效关了固定、没开对齐 = 照写的键（会变调）"); });
  it("音高对齐：写原速时听到的那个音 = 敲原速键；每写高一个半音 = 敲高两个键（每键 50 音分）", () => {
    const inst = { sfx: { ...PHONE, align: true } };
    eq(sfKey(96, inst), 64); eq(sfKey(97, inst), 66); eq(sfKey(94, inst), 60);
    eq(sfKey(84, inst, 12), 64, "移调先加上再对齐");
  });
  it("夹在 0–127", () => { eq(sfKey(10, { sfx: { ...PHONE, align: true } }), 0); eq(sfKey(130, {}), 127); });
  it("宽带噪声（没有音高）不能对齐", () => { eq(canAlign({ key: 62 }), false); eq(canAlign(PHONE), true); });
});
