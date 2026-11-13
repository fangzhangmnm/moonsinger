#!/usr/bin/env python3
"""和弦标的衬线字：轮廓 → vendor/fonts/serif/chord-outlines.json（PDF 导出把和弦标画成路径用；不在 PDF 里嵌这个字体）
+ 字宽表 → src/render/chord-text.gen.ts（排版按字形量宽、摆升降号用；屏幕和 PDF 同一份数）
+ 子集字体 → vendor/fonts/serif/chord-serif.ttf（屏幕上的和弦标用它画，v0.17.36；三处同一款字、同一组字，test/pdf.test.ts 守着）。

created 2026-11-09 by Claude Opus 5.5（user 11-08「和弦级数能不能也用英文，也用同样的这种音乐的字体」→ 11-09「和弦级数的字体做」）。
字 = Noto Serif SemiBold（SIL OFL 1.1，没有保留名；本机 /usr/share/fonts/truetype/noto/，可传别的路径）：只取和弦标会用到的字符
（src/theory/western.ts 的 rs 记号（级数写法）+ sym 记号（根音写法）+ 罗马数字 + 数字 + 根音字母 A–G + 「/ ( ) 空格」+ 打平时的分隔「·」+ 对不上时的「?」）。
2026-11-13 改（v0.17.34，Claude Opus 5.5；统筹 134f74e4「升降号贴着它所属的字」）：♭ ♯ 不再从 Bravura 借进这里——和弦标里的升降号从此是谱上的 Bravura 字形
（图元 glyph，src/render/chord-text.ts 摆、按 7-P 补粗），字里不出现 ♭ ♯；加了根音写法要的字母和「·」「?」（原来缺，根音写法整串退回正文字体）。
键 = "T" + 码位（和 Bravura 的码位分开，PDF 里同一套 Form XObject）。
跑：python3 scripts/gen-chord-outlines.py [字体.ttf]（只要 fontTools）。生成物勿手改。test/pdf.test.ts 守着「和弦标会用到的每个字符都有轮廓」、字宽表和轮廓一致。
"""
import json, re, sys, pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = sys.argv[1] if len(sys.argv) > 1 else "/usr/share/fonts/truetype/noto/NotoSerif-SemiBold.ttf"
src = (ROOT / "src/theory/western.ts").read_text(encoding="utf-8")
chars = (set("".join(re.findall(r'(?:rs|sym): "([^"]*)"', src))) | set("IVXivx0123456789/() ABCDEFG·?")) - {"♭", "♯"}   # ♭ ♯ 不是字：谱上的 Bravura 字形
font = TTFont(SRC); cmap, gs, hmtx = font.getBestCmap(), font.getGlyphSet(), font["hmtx"]
k = 1000 / font["head"].unitsPerEm
out = {}
for ch in sorted(chars):
    name = cmap.get(ord(ch))
    if not name: raise SystemExit(f"{SRC} 里没有「{ch}」")
    pen = SVGPathPen(gs); gs[name].draw(TransformPen(pen, (k, 0, 0, k, 0, 0)))
    out[f"T{ord(ch):04X}"] = {"adv": round(hmtx[name][0] * k), "d": pen.getCommands()}

# 量两个数给排版：大写字母多高（OS/2 capHeight）、「I」的竖笔多粗（中间那一高度横切一刀，同 7-P 量 Noto Sans 竖笔的做法）——升降号顶在多高、补粗补到多粗
from fontTools.pens.basePen import BasePen
class _Segs(BasePen):
    def __init__(self, gs): super().__init__(gs); self.segs, self.cur, self.start = [], None, None
    def _moveTo(self, p): self.cur = self.start = p
    def _lineTo(self, p): self.segs.append((self.cur, p)); self.cur = p
    def _curveToOne(self, a, b, c):
        p0 = self.cur
        for i in range(1, 21):
            t = i / 20; q = tuple((1 - t) ** 3 * p0[k] + 3 * (1 - t) ** 2 * t * a[k] + 3 * (1 - t) * t * t * b[k] + t ** 3 * c[k] for k in (0, 1)); self.segs.append((self.cur, q)); self.cur = q
    def _qCurveToOne(self, a, c):
        p0 = self.cur
        for i in range(1, 21):
            t = i / 20; q = tuple((1 - t) ** 2 * p0[k] + 2 * (1 - t) * t * a[k] + t * t * c[k] for k in (0, 1)); self.segs.append((self.cur, q)); self.cur = q
    def _closePath(self):
        if self.cur != self.start: self.segs.append((self.cur, self.start)); self.cur = self.start
pen = _Segs(gs); gs[cmap[ord("I")]].draw(pen)
ys = [p[1] for s_ in pen.segs for p in s_]; ymid = (min(ys) + max(ys)) / 2
xs = sorted(a[0] + (b[0] - a[0]) * (ymid - a[1]) / (b[1] - a[1]) for a, b in pen.segs if (a[1] - ymid) * (b[1] - ymid) < 0)
stem = round((xs[1] - xs[0]) / font["head"].unitsPerEm, 3)
cap = round(font["OS/2"].sCapHeight / font["head"].unitsPerEm, 3)

data = {"source": f"{pathlib.Path(SRC).name}（Noto Serif SemiBold，OFL）", "unitsPerEm": 1000, "glyphs": out}
(ROOT / "vendor/fonts/serif/chord-outlines.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
adv = ", ".join(f"{json.dumps(chr(int(k[1:], 16)), ensure_ascii=False)}: {v['adv'] / 1000:g}" for k, v in sorted(out.items()))
# 左右留白（字号的倍数）：墨的左边离字的起点、墨的右边离字宽的终点——升降号按「看得见的缝」贴字（墨到墨），不按字宽
from fontTools.pens.boundsPen import BoundsPen
def side(ch):
    name = cmap[ord(ch)]; bp = BoundsPen(gs); gs[name].draw(bp); b = bp.bounds; u = font["head"].unitsPerEm
    return (0, 0) if b is None else (round(b[0] / u, 3), round((hmtx[name][0] - b[2]) / u, 3))
sb = ", ".join(f"{json.dumps(ch, ensure_ascii=False)}: [{side(ch)[0]:g}, {side(ch)[1]:g}]" for ch in sorted(chars))
(ROOT / "src/render/chord-text.gen.ts").write_text(
    "// chord-text.gen.ts —— 和弦标那款衬线字的字宽和左右留白（字号的倍数）、大写字母高、「I」竖笔粗。生成物勿手改：python3 scripts/gen-chord-outlines.py\n"
    f"//   字 = {pathlib.Path(SRC).name}（和 vendor/fonts/serif/chord-outlines.json 同一次生成；test/pdf.test.ts 核着两边一样）。\n"
    f"export const CHORD_ADV: Readonly<Record<string, number>> = {{ {adv} }};\n"
    f"export const CHORD_SB: Readonly<Record<string, readonly [number, number]>> = {{ {sb} }};\n"
    f"export const CHORD_CAP = {cap:g}, CHORD_STEM = {stem:g};\n", encoding="utf-8")
# 屏幕上的字（v0.17.36，统筹 796e524b：user 的 iPad / Windows 上没有 Noto Serif、会落到 Times = 我们看到的和他看到的不一样）：同一款字、同一组字切成子集随 app 发。
#   不留排版表（GPOS / GSUB / kern）：浏览器不再自己挤字距、换连字，画出来的字宽 = 上面那张表（屏幕、字宽表、PDF 轮廓三处同一款字、同一组字）。
#   不带 hinting；时间戳照原字体（recalcTimestamp=False），同样的输入生成同样的字节。TTF 不压缩（Pages 传输时压；仓里的 parseTtf 读得了，守卫拿它核）。
from fontTools import subset
opts = subset.Options(); opts.layout_features = []; opts.hinting = False; opts.name_IDs = ["*"]; opts.name_languages = ["*"]; opts.notdef_outline = True
opts.drop_tables += ["GPOS", "GSUB", "GDEF", "kern"]
sub = subset.Subsetter(options=opts); sub.populate(unicodes=[ord(ch) for ch in sorted(chars)])
small = TTFont(SRC, recalcTimestamp=False); sub.subset(small)
small.save(ROOT / "vendor/fonts/serif/chord-serif.ttf")
print(f"{len(out)} glyphs → vendor/fonts/serif/chord-outlines.json；字宽表 → src/render/chord-text.gen.ts（cap {cap}、竖笔 {stem}）；子集字体 → vendor/fonts/serif/chord-serif.ttf")
