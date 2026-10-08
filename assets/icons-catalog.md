# 本 app 的图标

36 icons · 提取自家族图标库 `../20260708 SVG Icons/icons.svg` · 由 `extract-icons.py` 生成，别手改。

用法：把 sprite 整段内联到 `<body>` 顶部，然后按 id 引用；
⚠ sprite 根自带的隐藏样式（1×1 + `opacity:0`）别换成 `display:none`——
不渲染的子树里 `<mask>`/`<clipPath>` 不生效，靠遮罩留白的图标会静默糊掉；
颜色跟随 CSS `color`（全部 `currentColor`）：

```html
<!-- 内联 icons.svg -->
<svg width="24" height="24"><use href="#sliders"/></svg>
```

> 👁 **待过目**（AI 自画、未经人类审阅，`data-review="pending"`）：`album`、`caret-up`、`caret-down`、`backspace`
> 见库 `index.html` 的「待过目」栏；过目后进库/打回归库 session。


## image-processing

| name | 说明 |
|------|------|
| `sliders` | 不写类别 |

## edit

| name | 说明 |
|------|------|
| `arrow-undo` | 撤销:向左的直角回勾箭头 |
| `arrow-redo` | 重做:arrow-undo 的水平镜像 |

## media

| name | 说明 |
|------|------|
| `play` | 播放:实心右向三角 ▶(IEC 60417 磁带机惯例统一实心, 描边同色叠加得圆角); 20260819 media 批入库 |
| `stop` | 停止:实心圆角方块 ⏹; WebPaint timelapse「暂停录制」也用它(record-pause 已驳回, stop 停段+record 续录=磁带机语义); 20260819 media 批入库 |

## file

| name | 说明 |
|------|------|
| `export` | 导出:向上箭头离开托盘(import 的上下镜像) |
| `import` | 导入:向下箭头落进托盘(托盘=开口朝上的 U) |
| `file` | 文档:单张纸+折角(copy/paste/clear-canvas 共用母题) |
| `new` | 新建:纯加号(等长十字线) |
| `folder-open` | 打开的文件夹:背板止于盖顶 T 接,不再互相压线 |
| `floppy-disk` | 软盘/保存:滑盖左右对称(7/17)且两竖线顶到顶边 + 防呆角 k=3 |
| `save-as` | 另存为(floppy-disk=保存 的配对键):双软盘叠放(copy 的前后件语法), 后盘右上探出, 前盘遮罩留白; 20260724 候选 3 号入库 |
| `image` | 从图片新建:相框+山+太阳 |
| `folder` | 文件夹:左边 tab + 矩形主体 |
| `trash-can` | 垃圾桶:桶身收口(feather 是直筒);与 fluent(圆提手/更低)、heroicons(弧形透视)亦不同 — own |
| `album` 👁待过目 | 专辑/唱片:左边一个方形唱片封套(圆角矩形) + 右侧从封套后露出半张唱片(大圆弧 + 中心小孔)；与 bookshelf(书库) / gallery(图库) 分工 = 歌库【MoonSinger 顶栏最左「歌库」钮（回歌库）+ 文件菜单「歌库…」；2026-10-08 Claude Fable 5.1 自画未过目】 |

## hierarchy

| name | 说明 |
|------|------|
| `lock` | 锁:体 13x11+锁梁抬高(腿3.5),整体居中 |
| `unlock` | 开锁:同 lock 体型+锁梁弹开 |

## common

| name | 说明 |
|------|------|
| `caret-up` 👁待过目 | 上调 ▲:圆角实心扁三角(数字框旁上下叠放的小转盘用,12–16px)；与带竿的 chevron-up(上移)分工【JustReadBooks 朗读控制条预设框右侧小转盘「预设加一」；2026-10-02 Claude Opus 5.5 自画未过目】 |
| `caret-down` 👁待过目 | 下调 ▼:caret-up 的精确上下镜像【JustReadBooks 朗读控制条预设框右侧小转盘「预设减一」；2026-10-02 Claude Opus 5.5 自画未过目】 |
| `x` | 叉 |
| `back` | 返回:左向整箭头(带杆;裸 chevron-left 曾因小尺寸渲染差被 sunset) |

## cloud

| name | 说明 |
|------|------|
| `cloud` | 云 |
| `cloud-upload` | 云+上传箭头 (云形统一为 feather 的) |
| `cloud-download` | 云+下载箭头:cloud-upload 的精确上下镜像(箭头绕 y=14 翻转); WeebPaint gallery 同步徽章 newer-on-cloud, 12px 用量 (甲方 20260825 拍板候选 1 号) |
| `cloud-synced` | 云+勾 |
| `cloud-pending` | 待判定:虚线云 + 云内问号(加粗 2.4, 遮罩描边留白与云脱开;问号下点的半径=描边半宽) |
| `cloud-conflict` | 云+感叹号(2.4 描边整体收在云内不破轮廓, 点半径=描边半宽; 与 cloud-pending 问号云成对但云为实线); WeebPaint gallery 同步徽章 conflict, 12px 用量 (甲方 20260825 拍板候选 5 号=大号收内) |
| `cloud-unavailable` | — |
| `refresh` | 刷新:顺时针 3/4 圆 + 箭头(从 12 点绕到 9 点, 箭头尖在右上) |

## viewport

| name | 说明 |
|------|------|
| `grid` | 网格:直角外框 1.2 与内网格线同宽(20260725 甲方定稿; 原 rx1.6 圆角粗框版退役), 内部 4x4 细网格 |

## ui

| name | 说明 |
|------|------|
| `backspace` 👁待过目 | 退格 ⌫:左尖五边形 + 内部 ×【WebXiaoHeiWu 话筒左邻浮动「退格」钮；fable 自画未过目】 |
| `wrench` | 扳手:斜置组合扳手轮廓(feather:wrench 衍生), 20260724 候选 1 号入库 |
| `menu` | 汉堡菜单:三条等长横线(y=7/12/17) |
| `database` | — |
| `archive-box` | 归档箱:顶盖条 + 箱体 + 中间把手横线(与 collection 同形, 均出自 lucide:archive) |
