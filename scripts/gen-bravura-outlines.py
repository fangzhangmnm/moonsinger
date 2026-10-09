#!/usr/bin/env python3
"""Bravura 的音乐符号轮廓 → vendor/fonts/bravura/outlines.json（PDF 导出画路径用，不在 PDF 里嵌这个字体）。

created 2026-10-08 深夜 by Claude Opus 5.5（user「自己写pdf」）。
只取 src/ 里画谱用到的 SMuFL 码位（私用区 U+E000–U+F8FF，源码里的 \\uEXXX / \\u{EXXX} 写法）；test/pdf.test.ts 守着「用到的每个码位都有轮廓」。
跑：需要 fontTools + brotli（读 WOFF2）——`python3 -m venv v && v/bin/pip install fonttools brotli && v/bin/python scripts/gen-bravura-outlines.py`。
生成物勿手改。字体本身不改（OFL：「Bravura」是保留名，改了字体文件才要改名；这里只读轮廓，见同目录 README）。
"""
import json, re, pathlib
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = pathlib.Path(__file__).resolve().parent.parent
cps = set()
for p in (ROOT / "src").rglob("*.ts"):
    s = p.read_text(encoding="utf-8")
    for m in re.finditer(r"\\u\{([0-9A-Fa-f]{4,5})\}|\\u([0-9A-Fa-f]{4})", s):
        cp = int(m.group(1) or m.group(2), 16)
        if 0xE000 <= cp <= 0xF8FF: cps.add(cp)
    for ch in s:   # 源码里直接写的私用区字符
        if 0xE000 <= ord(ch) <= 0xF8FF: cps.add(ord(ch))
# 算出来的两段（smufl.ts timeSigDigits = 0xE080 + 数字；engrave.ts GLYPH_TUPLET = 0xE880 + 数字），源码里扫不到字面量
cps |= set(range(0xE080, 0xE08A)) | set(range(0xE880, 0xE88A))
font = TTFont(ROOT / "vendor/fonts/bravura/Bravura.woff2")
cmap, gs, hmtx = font.getBestCmap(), font.getGlyphSet(), font["hmtx"]
out, missing = {}, []
for cp in sorted(cps):
    name = cmap.get(cp)
    if not name: missing.append(f"{cp:04X}"); continue
    pen = SVGPathPen(gs)
    gs[name].draw(pen)
    out[f"{cp:04X}"] = {"adv": hmtx[name][0], "d": pen.getCommands()}
data = {"source": "Bravura.woff2 (vendor/fonts/bravura)", "unitsPerEm": font["head"].unitsPerEm, "glyphs": out}
(ROOT / "vendor/fonts/bravura/outlines.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"{len(out)} glyphs → vendor/fonts/bravura/outlines.json" + (f"; not in Bravura: {missing}" if missing else ""))
