#!/usr/bin/env python3
"""和弦级数用的衬线字轮廓 → vendor/fonts/serif/chord-outlines.json（PDF 导出把级数画成路径用；不在 PDF 里嵌这个字体）。

created 2026-11-09 by Claude Opus 5.5（user 11-08「和弦级数能不能也用英文，也用同样的这种音乐的字体」→ 11-09「和弦级数的字体做」）。
字 = Noto Serif SemiBold（SIL OFL 1.1，没有保留名；本机 /usr/share/fonts/truetype/noto/，可传别的路径）：只取级数会用到的字符
（src/score/chord-name.ts 的 rs 记号 + 罗马数字 + 数字 + 「/ ( ) 空格」）。Noto Serif 没有 ♭ ♯：借仓里 Bravura 的 accidentalFlat / accidentalSharp 轮廓
（vendor/fonts/bravura/outlines.json，OFL），缩放到和大写字母差不多高。键 = "T" + 码位（和 Bravura 的码位分开，PDF 里同一套 Form XObject）。
跑：python3 scripts/gen-chord-outlines.py [字体.ttf]（只要 fontTools）。生成物勿手改。test/pdf.test.ts 守着「级数会用到的每个字符都有轮廓」。
"""
import json, re, sys, pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = sys.argv[1] if len(sys.argv) > 1 else "/usr/share/fonts/truetype/noto/NotoSerif-SemiBold.ttf"
src = (ROOT / "src/score/chord-name.ts").read_text(encoding="utf-8")
chars = (set("".join(re.findall(r'rs: "([^"]*)"', src))) | set("IVXivx0123456789/() ")) - {"♭", "♯"}   # ♭ ♯ 下面从 Bravura 借
font = TTFont(SRC); cmap, gs, hmtx = font.getBestCmap(), font.getGlyphSet(), font["hmtx"]
k = 1000 / font["head"].unitsPerEm
out = {}
for ch in sorted(chars):
    name = cmap.get(ord(ch))
    if not name: raise SystemExit(f"{SRC} 里没有「{ch}」")
    pen = SVGPathPen(gs); gs[name].draw(TransformPen(pen, (k, 0, 0, k, 0, 0)))
    out[f"T{ord(ch):04X}"] = {"adv": round(hmtx[name][0] * k), "d": pen.getCommands()}

# ♭ ♯：Bravura 的轮廓（字体单位、y 向上）→ 缩放平移到字母那么高
brav = json.loads((ROOT / "vendor/fonts/bravura/outlines.json").read_text(encoding="utf-8"))["glyphs"]
TOK = re.compile(r"[MLHVCQZ]|-?\d+(?:\.\d+)?")
def transform(d, s, tx, ty):
    toks, res, cmd, nums = TOK.findall(d), [], None, []
    def flush():
        if cmd is None: return
        if cmd == "H": res.append("H" + " ".join(f"{float(v) * s + tx:g}" for v in nums))
        elif cmd == "V": res.append("V" + " ".join(f"{float(v) * s + ty:g}" for v in nums))
        elif cmd == "Z": res.append("Z")
        else: res.append(cmd + " ".join(f"{float(v) * s + (tx if i % 2 == 0 else ty):g}" for i, v in enumerate(nums)))
    for t in toks:
        if t.isalpha(): flush(); cmd, nums = t, []
        else: nums.append(t)
    flush(); return "".join(res)
def bbox(d):
    toks, xs, ys, cmd, i = TOK.findall(d), [], [], None, 0
    for t in toks:
        if t.isalpha(): cmd, i = t, 0; continue
        v = float(t)
        if cmd == "H": xs.append(v)
        elif cmd == "V": ys.append(v)
        else: (xs if i % 2 == 0 else ys).append(v); i += 1
    return min(xs), min(ys), max(xs), max(ys)
for cp, code, bottom in [(0x266D, "E260", -20), (0x266F, "E262", -110)]:
    d = brav[code]["d"]; x0, y0, x1, y1 = bbox(d); s = 760 / (y1 - y0)
    out[f"T{cp:04X}"] = {"adv": round((x1 - x0) * s + 90), "d": transform(d, s, 40 - x0 * s, bottom - y0 * s)}

data = {"source": f"{pathlib.Path(SRC).name}（Noto Serif SemiBold，OFL）+ Bravura ♭♯（OFL）", "unitsPerEm": 1000, "glyphs": out}
(ROOT / "vendor/fonts/serif/chord-outlines.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"{len(out)} glyphs → vendor/fonts/serif/chord-outlines.json")
