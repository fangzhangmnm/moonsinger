# tools/icon-from-ora.py —— 从 user 手绘的两份 .ora 出全部图标档。created 2026-10-11 by Claude Opus 5.5
# 原稿在 OneDrive apps/WeebPaint/（不进仓，照 WeebPaint 图标的规矩）：
#   大稿   20261011-MoonSinger图标设计.ora（1024²，一色一层）→ icon.svg（真矢量）→ icon-512 / icon-192 / apple-touch-icon-180
#   像素稿 20261011-MoonSinger像素图标.ora（32²，user 逐像素精修）→ icon-32.png，**原样 1:1，绝不从大稿缩**
# 详 ai-docs/20261011-icon-tiers.md。
# 用法：~/venvs/20261010-songwriting/bin/python -I tools/icon-from-ora.py <大稿.ora> <像素稿.ora> [输出目录=仓根]
# 依赖（只在这个开发环境里，不进 app）：pillow / numpy / potracer（potrace 的纯 Python 版）/ cairosvg。
#
# 大稿怎么变矢量：每个可见层 = 一条 path（层里的主色，alpha ≥ 128 算有），底色层（铺满 95% 以上）= 满铺 rect——
# 底色层边上有几处透明的洞，满铺 rect 顺手补上。颜色等于底色的层 = 抠图（user 10-11「蓝=底色是白剪影上抠出的嘴巴」）：
# 从它下面所有层里减掉、自己不出路径，换底色时嘴跟着走。所以这条路的前提是大稿每层都是纯色；有了渐变 / 纹理就不成立了。
import io, sys, zipfile, xml.etree.ElementTree as ET
import numpy as np, potrace, cairosvg
from PIL import Image


def visible_layers(node, shown=True):
    for el in node:
        vis = shown and el.get("visibility", "visible") == "visible"
        if el.tag == "stack": yield from visible_layers(el, vis)
        elif el.tag == "layer" and vis: yield el


def trace_svg(ora: zipfile.ZipFile, note: str) -> str:
    st = ET.fromstring(ora.read("stack.xml")); W, H = int(st.get("w")), int(st.get("h"))
    num = lambda v: f"{v:.1f}".rstrip("0").rstrip(".")
    bg, shapes = None, []  # shapes：自下而上 [颜色, 整张画布大小的遮罩]
    for el in reversed(list(visible_layers(st.find("stack")))):  # stack.xml 顶层在前；SVG 后画的在上
        a = np.array(Image.open(io.BytesIO(ora.read(el.get("src")))).convert("RGBA")); m = a[..., 3] >= 128
        cols, cnt = np.unique(a[m][:, :3], axis=0, return_counts=True)
        fill = "#%02x%02x%02x" % tuple(int(v) for v in cols[cnt.argmax()])
        x0, y0 = int(el.get("x")), int(el.get("y")); h, w = m.shape
        full = np.zeros((H, W), bool)
        full[max(y0, 0):min(y0 + h, H), max(x0, 0):min(x0 + w, W)] = m[max(-y0, 0):H - y0, max(-x0, 0):W - x0]
        if full.sum() > 0.95 * W * H: bg = fill; continue
        if fill == bg:
            for s in shapes: s[1] &= ~full
            continue
        shapes.append([fill, full])
    parts = [f'<rect width="{W}" height="{H}" fill="{bg}"/>']
    for fill, m in shapes:
        d = []
        for cv in potrace.Bitmap(~m).trace(turdsize=8, alphamax=1.0, opticurve=True, opttolerance=0.2):  # potracer 把 0 当成要填的
            p = cv.start_point; d.append(f"M{num(p.x)} {num(p.y)}")
            for s in cv.segments:
                if s.is_corner: d.append(f"L{num(s.c.x)} {num(s.c.y)}L{num(s.end_point.x)} {num(s.end_point.y)}")
                else: d.append(f"C{num(s.c1.x)} {num(s.c1.y)} {num(s.c2.x)} {num(s.c2.y)} {num(s.end_point.x)} {num(s.end_point.y)}")
            d.append("Z")
        parts.append(f'<path fill="{fill}" fill-rule="evenodd" d="{"".join(d)}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">\n<!-- {note} -->\n' + "\n".join(parts) + "\n</svg>\n"


def main(design_path: str, pixel_path: str, out: str = "."):
    design, pixel = zipfile.ZipFile(design_path), zipfile.ZipFile(pixel_path)
    svg = trace_svg(design, f"MoonSinger 图标：user 手绘「{design_path.rsplit('/', 1)[-1]}」，tools/icon-from-ora.py 描成矢量（生成物，别手改，改原稿重跑）")
    open(f"{out}/icon.svg", "w").write(svg)
    for size, name in ((512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon-180.png")):
        png = cairosvg.svg2png(bytestring=svg.encode(), output_width=size, output_height=size)
        Image.open(io.BytesIO(png)).convert("RGB").save(f"{out}/{name}", optimize=True)  # 底色满铺，去掉 alpha 通道（iOS 主屏不要透明）
    px = Image.open(io.BytesIO(pixel.read("mergedimage.png"))).convert("RGBA")
    assert px.size == (32, 32), f"像素稿应当是 32×32，拿到 {px.size}"
    assert px.getextrema()[3][0] == 255, "像素稿有透明像素——标签栏会漏底，先在 WeebPaint 里补满底色"
    px.convert("RGB").save(f"{out}/icon-32.png", optimize=True)
    print(f"icon.svg {len(svg)} B；icon-512 / icon-192 / apple-touch-icon-180 从 svg 渲；icon-32 = 像素稿原样")


if __name__ == "__main__":
    main(*sys.argv[1:])
