import type { Pitch } from "../../score/pitch.ts";
/** p = 按那里的调号拼好的音（按 C 调看时已经换到 C）；shown = 画哪个升降号（同排版的规矩：null = 不画，0 = 还原号）；
 *  shift = 这一行那里的谱号 / 八度线位移（有「纵向 = 音高」的行用）；fifths = 那里的调号（数字行读级数用）。 */
export interface GhostNote {
    p: Pitch;
    shown: number | null;
    shift: number;
    fifths: number;
}
