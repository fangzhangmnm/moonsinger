// notation.ts —— 五线谱一段音平常占多宽（拆时值本身在框架：src/render/frame/units.ts notate）。
// > moved 2026-11-11 by Claude Opus 5.5（施工单 1b-2 搬家：从 src/render/engrave.ts 原样搬出）；第五刀 5-1 拆时值那几样搬进框架（MoonSinger小弟）。
import { TPQ } from "../../score/song.ts";

export const baseWidth = (base: number) => Math.max(2.2, 3.6 + 0.75 * Math.log2(base / TPQ));   // 四分 3.6，每翻倍 +0.75（2026-10-07 收紧一点：原 4.0 / +0.8，SE2 一行放不下一小节八分）
