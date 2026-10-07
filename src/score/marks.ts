// marks.ts —— 记号（调号 / 拍号 / 速度）和文字之间互转：记号框里显示什么、打进去的字认成什么。纯函数（Node 里可测）。
// created 2026-10-07 by Claude Opus 5.5（从 src/ui/mark-editor.ts 拆出来）
import { type MarkTok, type MarkVal, TEMPO_WORDS } from "./song.ts";
import { KEY_LABEL } from "./pitch.ts";

/** 记号 → 框里的字。 */
export function markText(t: MarkTok): string {
  if (t.kind === "key") return `1=${KEY_LABEL[t.fifths]}`;
  if (t.kind === "time") return `${t.beats}/${t.beatType}`;
  return String(t.bpm);
}
/** 框里的字 → 记号的值（认不出 = null）。 */
export function parseMark(kind: MarkTok["kind"], raw: string): MarkVal | null {
  const s = raw.trim().replace(/\s+/g, "").replace(/♯/g, "#").replace(/♭/g, "b");
  if (kind === "key") {
    const v = s.replace(/^1=/, "");
    let m = /^([+-]?\d)$/.exec(v);
    if (m) { const f = Number(m[1]); return f >= -7 && f <= 7 ? { kind, fifths: f } : null; }
    m = /^(\d)([#b])$/.exec(v);
    if (m) { const f = Number(m[1]) * (m[2] === "#" ? 1 : -1); return f >= -7 && f <= 7 ? { kind, fifths: f } : null; }
    const name = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
    for (const [f, label] of Object.entries(KEY_LABEL)) if (label.replace("♯", "#").replace("♭", "b") === name) return { kind, fifths: Number(f) };
    return null;
  }
  if (kind === "time") {
    const m = /^(\d{1,2})\/(\d{1,2})$/.exec(s);
    if (!m) return null;
    const beats = Number(m[1]), beatType = Number(m[2]);
    return beats >= 1 && beats <= 32 && [1, 2, 4, 8, 16, 32].includes(beatType) ? { kind, beats, beatType } : null;
  }
  const n = /(\d{2,3})/.exec(s);
  if (n) { const bpm = Number(n[1]); return bpm >= 20 && bpm <= 400 ? { kind, bpm } : null; }
  const w = TEMPO_WORDS.find((x) => x.it.toLowerCase() === s.toLowerCase() || x.zh === s);
  return w ? { kind, bpm: w.typical } : null;
}

