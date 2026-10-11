# 图标档位与接线（MoonSinger）

> created 20261011 by Claude Opus 5.5 · as-of v0.11.0 / 2026-10-11
> user 手绘两份原稿，交付在 OneDrive `apps/WeebPaint/`（不进仓，照 WeebPaint `ai-docs/20260821-icon-tiers.md` 的规矩）。
> user 原话：「人类subagent跑完了。月读抱团子和app图标。在weebpaint的onedrive文件夹里面你收一下」「这个转svg方便吗」「蓝=底色是白剪影上抠出的嘴巴」「像素版的你推送我一下我去weebpaint里面精修」「onedrrive文件夹收货 bump minor，上图标，看看效果」。

## 档位表

| 文件 | 来源 | 怎么出 | 用在哪 |
|---|---|---|---|
| `icon.svg` | `20261011-MoonSinger图标设计.ora`（1024²，一色一层） | `tools/icon-from-ora.py` 描成矢量（每色一条路径 + 满铺底色） | 只给 manifest 的 `sizes: "any"` |
| `icon-512.png` | 同上 | 从 `icon.svg` 渲 | manifest、装机弹窗 |
| `icon-192.png` | 同上 | 从 `icon.svg` 渲 | manifest |
| `apple-touch-icon-180.png` | 同上 | 从 `icon.svg` 渲 | iOS / iPad 主屏 |
| `icon-32.png` | `20261011-MoonSinger像素图标.ora`（32²，user 在 WeebPaint 里逐像素精修） | **原样 1:1，绝不从大稿缩** | 浏览器标签页 / 书签 |

重出全部：`~/venvs/20261010-songwriting/bin/python -I tools/icon-from-ora.py <大稿.ora> <像素稿.ora>`（依赖 pillow / numpy / potracer / cairosvg，只在开发环境里，不进 app）。生成物别手改，改原稿重跑。

## 大稿为什么能描成矢量

- 大稿每个颜色单独一层、层里是纯色（底 `#4c5a92` / 月牙 `#fff6d0` / 人 `#ffffff` / 蝴蝶结 `#ff7a7a`），所以每层的遮罩（alpha ≥ 128）描一条路径就够了。和原稿逐像素比，只有边缘那一像素的抗锯齿不同（0.8% 的像素），发丝 / 指缝 / 嘴 / 蝴蝶结折角都在；`icon.svg` 约 11 KB。
- **嘴是抠出来的**（user「蓝=底色是白剪影上抠出的嘴巴」）：颜色等于底色的层 = 从它下面所有层里减掉，自己不出路径——SVG 里嘴是白色路径上的洞，换底色 / 透明底时跟着走。以后加抠掉的细节照这个画法。
- 底色层边上有几处透明的洞（左上角一个像素、左边 x 0–1 · y 约 640–720、底边 x 约 384–540）——底色一律画成满铺方块，洞自然补上，原稿不用改。
- 前提是每层纯色；以后加渐变 / 纹理就描不了了（那时只能像 WeebPaint 那样往 SVG 里嵌位图）。

## 别踩回去的线

1. **`icon.svg` 不挂 `<link rel="icon">`**：浏览器会优先拿 SVG 自己缩到 16 / 32 px，盖掉手画的像素档（大稿的细发丝、腿缝缩下去就糊成一团，矢量也一样）。标签页走 `icon-32.png`。`test/icon-wiring.test.ts` 守着。
2. **`icon-32.png` 不从大稿缩**：它是另一幅画（user 把蝴蝶结放大了、嘴等细节自己定）。要改这一档，在 WeebPaint 里改像素稿再重跑脚本。
3. **加档位 / 改文件名要同时改**：`index.html` 的 `<link>` 或 `manifest.webmanifest` 的 `icons`、`service-worker.js` 的 `STATIC_PRECACHE`、`.github/workflows/deploy.yml` 的拷贝白名单（漏了 = 线上静默 404）、`scripts/serve.sh`、`test/shell-smoke.mjs` / `test/file-smoke.mjs` 的文件表。前四处 `test/icon-wiring.test.ts` 守着，两个冒烟测试漏了会在 SW 装不上时红。

## 没做

- **安卓自适应图标（maskable）没声明**：安卓会把自适应图标裁成圆 / 圆角方，只保证中间直径 80% 的圆不被裁；月牙顶（离上边 29 px）和脚（离下边 19 px）在圈外。现在不声明 = 不裁。要做 = SVG 里整体缩一圈另出一张，user 没要。
- **16×16 没有手画档**：浏览器从 `icon-32.png` 自己缩。
- `manifest.webmanifest` 的 `background_color` / `theme_color` 仍是 app 界面的米色 `#f4f1ea`（启动页底色），没跟着图标的靛蓝改。
