# 本 app 的图标

9 icons · 提取自家族图标库 `../20260708 SVG Icons/icons.svg` · 由 `extract-icons.py` 生成，别手改。

用法：把 sprite 整段内联到 `<body>` 顶部，然后按 id 引用；
⚠ sprite 根自带的隐藏样式（1×1 + `opacity:0`）别换成 `display:none`——
不渲染的子树里 `<mask>`/`<clipPath>` 不生效，靠遮罩留白的图标会静默糊掉；
颜色跟随 CSS `color`（全部 `currentColor`）：

```html
<!-- 内联 icons.svg -->
<svg width="24" height="24"><use href="#play"/></svg>
```

> 👁 **待过目**（AI 自画、未经人类审阅，`data-review="pending"`）：`caret-up`、`caret-down`、`backspace`、`settings`
> 见库 `index.html` 的「待过目」栏；过目后进库/打回归库 session。


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

## common

| name | 说明 |
|------|------|
| `caret-up` 👁待过目 | 上调 ▲:圆角实心扁三角(数字框旁上下叠放的小转盘用,12–16px)；与带竿的 chevron-up(上移)分工【JustReadBooks 朗读控制条预设框右侧小转盘「预设加一」；2026-10-02 Claude Opus 5.5 自画未过目】 |
| `caret-down` 👁待过目 | 下调 ▼:caret-up 的精确上下镜像【JustReadBooks 朗读控制条预设框右侧小转盘「预设减一」；2026-10-02 Claude Opus 5.5 自画未过目】 |

## viewport

| name | 说明 |
|------|------|
| `grid` | 网格:直角外框 1.2 与内网格线同宽(20260725 甲方定稿; 原 rx1.6 圆角粗框版退役), 内部 4x4 细网格 |

## ui

| name | 说明 |
|------|------|
| `backspace` 👁待过目 | 退格 ⌫:左尖五边形 + 内部 ×【WebXiaoHeiWu 话筒左邻浮动「退格」钮；fable 自画未过目】 |
| `settings` 👁待过目 | 设置:齿轮=内圆+外圆+8 根短齿(圆帽)；家族里 sliders 是「调整」别撞【WebXiaoHeiWu 抽屉底栏「设置」入口；fable 自画未过目】 |
