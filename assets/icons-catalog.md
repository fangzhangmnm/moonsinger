# 本 app 的图标

71 icons · 提取自家族图标库 `../20260708 SVG Icons/icons.svg` · 由 `extract-icons.py` 生成，别手改。

用法：把 sprite 整段内联到 `<body>` 顶部，然后按 id 引用；
⚠ sprite 根自带的隐藏样式（1×1 + `opacity:0`）别换成 `display:none`——
不渲染的子树里 `<mask>`/`<clipPath>` 不生效，靠遮罩留白的图标会静默糊掉；
颜色跟随 CSS `color`（全部 `currentColor`）：

```html
<!-- 内联 icons.svg -->
<svg width="24" height="24"><use href="#sliders"/></svg>
```

> 👁 **待过目**（AI 自画、未经人类审阅，`data-review="pending"`）：`play-from-start`、`music-note`、`headphones`、`piano-keys`、`note-stack`、`notes-symbols`、`lyrics-bubble`、`unplugged`、`visibility-only`、`volume-mute`、`volume-solo`、`keyboard-collapse`、`mixer-collapse`、`album`、`music-library`、`caret-up`、`caret-down`、`chevron-left`、`chevron-right`、`forward`、`one-to-one`、`backspace`、`settings`
> 见库 `index.html` 的「待过目」栏；过目后进库/打回归库 session。


## image-processing

| name | 说明 |
|------|------|
| `sliders` | 不写类别 |

## selection

| name | 说明 |
|------|------|
| `select-all` | 全选:实线外框 + 内嵌虚线框, 内部浅填充表示整幅已选中 |

## edit

| name | 说明 |
|------|------|
| `arrow-undo` | 撤销:向左的直角回勾箭头 |
| `arrow-redo` | 重做:arrow-undo 的水平镜像 |
| `paste` | 粘贴:剪贴板不缩(库尺寸)+文档探出右下角, 按 copy 的前后件比例 |
| `copy` | 两个文件叠放 |
| `cut` | 剪切到剪贴板(WebPaint v0.9.22 Ctrl+X): 剪刀 CCW 转 145°(甲方 20260821 拍板取向, 刃朝左下/柄朝右上); 圆环柄 r2.3+描边把手+实心渐尖刃(枢轴半宽 0.85 收到尖), 刃比柄粗=纸剪不是医疗剪。⚠改动时注意: 几何先按 k=0.82 纵向压短再转 —— 原尺寸直接转墨迹会到 20.6x22.0(全家族最大), 而整体 scale 会连线宽一起缩(select-pen 缩放笔即因此落选), 故压几何保线宽恒 1.7; 转后 19.05x19.75 与 grid 同级。落选: 纯描边 X 型(偏医疗剪)、家用不对称柄版、宽刃版 |

## media

| name | 说明 |
|------|------|
| `play` | 播放:实心右向三角 ▶(IEC 60417 磁带机惯例统一实心, 描边同色叠加得圆角); 20260819 media 批入库 |
| `stop` | 停止:实心圆角方块 ⏹; WebPaint timelapse「暂停录制」也用它(record-pause 已驳回, stop 停段+record 续录=磁带机语义); 20260819 media 批入库 |
| `volume` | 音量(BR 音量条旁标识): 实心喇叭(箱体+锥单路径)+双声波弧(内 r3.4 ±42°, 外 r6.1 ±52°, 弧间留白 1.0); media 批统一实心, 弧留描边=声波不是实体。20260821 甲方拍板紧凑版+第二道声波入库(空心喇叭版/单弧版落选) |
| `pause` | 暂停:双竖杠 ⏸(粗 3.2 圆帽, brush-width 同款加粗手法); 20260819 media 批入库 |
| `play-from-start` 👁待过目 | 从起点放 \|▶:左边一道竖杠(粗 2.4 圆帽) + 实心右向三角(play 同款画法,整体右移让出杠)；= 回到设定的起点再放【MoonSinger 顶栏走带主键「从起点放」（放着时换成 stop）；2026-10-10 Claude Opus 5.5 自画未过目】 |
| `skip-prev` | 上一曲 ⏮: skip-next 的精确镜像(translate+scale(-1,1), 同 replay 画法)。20260821 入库 |
| `skip-next` | 下一曲 ⏭(BR 播放器): 实心右三角+竖杠(stroke 2.8 圆帽), 体量对齐 fast-forward; 与 fast-forward(双三角=快进)分工。20260821 甲方拍板候选1号入库(实心 rect 杠版/轻量版落选) |
| `music-note` 👁待过目 | 音符(八分音符):实心斜椭圆符头 + 符干 + 一道弯符尾；通用的「音乐 / 音符」符号【MoonSinger 底座小条「音」模式钮、小键盘顶上切回音键的钮；Claude Opus 5.5 画；未过目】 |
| `headphones` 👁待过目 | 耳机(听):头梁圆弧 + 两边实心耳罩；只听不写【MoonSinger 底座小条「听」模式钮；Claude Opus 5.5 画；未过目】 |
| `piano-keys` 👁待过目 | 琴键(弹着玩):方框里三个白键、两个实心黑键从上往下插；与 keyboard(电脑键盘)分工【MoonSinger 小键盘顶上「弹」钮：音键只响不写；Claude Opus 5.5 画；未过目】 |
| `note-stack` 👁待过目 | 叠音(和弦):一根符干上叠三个实心符头；与 music-note(一个音)成对【MoonSinger 小键盘写字排「叠」键；Claude Opus 5.5 画；未过目】 |
| `notes-symbols` 👁待过目 | 音符 / 记号切换:左上力度字 f(Bravura 轮廓) + 右下八分音符 + 中间一道斜线,同「A/あ」输入法切换键的读法;两面键盘同一颗,不随状态换图【MoonSinger 小键盘顶上切音键 / 符号格的钮;形状 = user 2026-11-04 提的「左上角f右下角音符中间斜线」;Claude Opus 5.5 画;未过目】 |
| `lyrics-bubble` 👁待过目 | 歌词(对话气泡里写字):圆角气泡 + 左下尾巴,里面并排「文」「あ」= 哪种语言的词都能写;字形烘焙不依赖设备字体(同 translate);与 dialog-box(气泡 + 两行线 = 逐段)分工【MoonSinger 底座小条「词」模式钮;形状 = user 2026-11-04 拍的「用 c,里面放文 + 日文 a」;Claude Opus 5.5 画;未过目】 |
| `unplugged` 👁待过目 | 拔开的线(只出声、不接到谱上):一根线从中间断开,左半截头上是公头(两根铜片),右半截头上是母头(挖两个孔),斜 45 度对着,空隙外侧三道小火花 = 断开；也带「Unplugged = 随手现场弹」的意思【MoonSinger 小键盘顶上「弹」钮 + 歌库「即兴」；Claude Opus 5.5 画（user 11-07 从 A–F 六版里挑了 D）；无头浏览器渲过 20/24/48 px 和深色底；未过目】 |
| `visibility-only` 👁待过目 | 只看(只显示这一个):睁开的眼睛(同 visibility-show,缩 0.76)外面套对焦框四个角 = 只看它、别的藏起来；与 visibility-show / visibility-hide 成一组【MoonSinger 谱上声部名下面的「眼睛」大钮长按 = 只看、曲段「只看本段」钮；Claude Opus 5.5 画（无头浏览器渲过 20 / 32 / 96 px 亮底暗底）；user 11-08 看过渲染图说「没问题」，未正式过目入库】 |
| `volume-mute` 👁待过目 | 静音:实心喇叭(同 volume)右边一个 ×,没有声波；与 volume / volume-solo 成一组【MoonSinger 谱上声部名下面的「喇叭」大钮点 = 静音；Claude Opus 5.5 画（无头浏览器渲过 20 / 32 / 96 px 亮底暗底）；user 11-08 看过渲染图说「没问题」，未正式过目入库】 |
| `volume-solo` 👁待过目 | 独奏(只听这一个):喇叭 + 两道声波(同 volume,缩 0.8)外面套对焦框四个角,和 visibility-only 同一个「只…」记号【MoonSinger 谱上声部名下面的「喇叭」大钮长按 = 独奏；Claude Opus 5.5 画（无头浏览器渲过 20 / 32 / 96 px 亮底暗底）；user 11-08 看过渲染图说「没问题」，未正式过目入库】 |
| `keyboard-collapse` 👁待过目 | 收起键盘:琴键(同 piano-keys,压扁到上面)+ 底下一个实心向下三角；与 mixer-collapse 成一对【MoonSinger 小键盘顶上最右边「收起」钮（取代下箭头；user 11-08「不要用一个简单的下箭头，而是说一个键盘的图标下面加一个实心的向下的三角形」）；Claude Opus 5.5 画（无头浏览器渲过 20 / 32 / 96 px 亮底暗底）；user 11-08 看过渲染图说「没问题」，未正式过目入库】 |
| `mixer-collapse` 👁待过目 | 收起混音台:推子(同 sliders,压扁到上面)+ 底下一个实心向下三角；与 keyboard-collapse 成一对【MoonSinger 混音台顶上最右边「收起」钮；Claude Opus 5.5 画（无头浏览器渲过 20 / 32 / 96 px 亮底暗底）；user 11-08 看过渲染图说「没问题」，未正式过目入库】 |

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
| `rename` | 重命名:文字光标+铅笔 |
| `music-library` 👁待过目 | 歌库(唱片箱):一个木箱(前板 + 中间一道把手孔)里插着两张方封套(后面那张往右上错开,只露出上沿和右边),前面那张上一个八分音符 = 很多首歌收在这里；与 album(一张专辑) / bookshelf(书库) / gallery(图库) 分工【MoonSinger 顶栏最左「歌库」钮（取代 album，user 11-08 说 album 看着像马克杯；唱片箱 / 一叠 / 网格几个方向里先定 D3「两张错开」，再试「D3 + 箱子」，user 11-08 挑 E3「平箱子 + 把手孔」）；Claude Opus 5.5 画（无头浏览器渲过 20 / 32 / 96 px 亮底暗底，遮挡按前后关系只画露出来的线）；user 挑过，未正式过目入库】 |

## hierarchy

| name | 说明 |
|------|------|
| `lock` | 锁:体 13x11+锁梁抬高(腿3.5),整体居中 |
| `unlock` | 开锁:同 lock 体型+锁梁弹开 |
| `create-folder` | 加号做成右下角徽标 |
| `visibility-show` | 可见:撑高眼裂+瞳孔 r4.3(甲方实测原版太小) |
| `visibility-hide` | 隐藏:同 show 撑高版+斜杠(mask 留 gap) |

## common

| name | 说明 |
|------|------|
| `caret-up` 👁待过目 | 上调 ▲:圆角实心扁三角(数字框旁上下叠放的小转盘用,12–16px)；与带竿的 chevron-up(上移)分工【JustReadBooks 朗读控制条预设框右侧小转盘「预设加一」；2026-10-02 Claude Opus 5.5 自画未过目】 |
| `caret-down` 👁待过目 | 下调 ▼:caret-up 的精确上下镜像【JustReadBooks 朗读控制条预设框右侧小转盘「预设减一」；2026-10-02 Claude Opus 5.5 自画未过目】 |
| `x` | 叉 |
| `back` | 返回:左向整箭头(带杆;裸 chevron-left 曾因小尺寸渲染差被 sunset) |
| `chevron-left` 👁待过目 | ‹ 小尺寸优化裸 chevron:描边 2.4、臂短(14px chip 用)；库里带杆的 back 是另一语义【WeebPaint 参考窗多图时窗底翻页 chip；fable 自画未过目】 |
| `chevron-right` 👁待过目 | › chevron-left 的精确镜像【WeebPaint 参考窗翻页 chip；fable 自画未过目】 |
| `forward` 👁待过目 | 前进:back 的精确镜像(右向整箭头带杆;与 chevron-right 裸 chevron 分工)【WebXiaoHeiWu 侧栏页头「回退」右邻的「前进」钮（回退之后再回去）；2026-09-10 fable 自画未过目】 |
| `check` | 勾 |
| `chevron-down` | 下移:竖线 + 底端 ∨ 箭头 |

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
| `picture-in-picture` | 画中画:大框(主画布) + 右下角内嵌小窗(参考小窗自己) |
| `one-to-one` 👁待过目 | 1:1 像素:四角括号 + 中心一颗实心像素=「一图像素对一屏像素」(不写 1:1 文字)【WeebPaint 参考窗 ＋ 菜单「1:1 像素」项；fable 自画未过目】 |
| `maximize-viewport` | 适配视口:四角向外的箭头(reset-transform=同形别名 id, 改动保持同几何) |

## ui

| name | 说明 |
|------|------|
| `backspace` 👁待过目 | 退格 ⌫:左尖五边形 + 内部 ×【WebXiaoHeiWu 话筒左邻浮动「退格」钮；fable 自画未过目】 |
| `wrench` | 扳手:斜置组合扳手轮廓(feather:wrench 衍生), 20260724 候选 1 号入库 |
| `menu` | 汉堡菜单:三条等长横线(y=7/12/17) |
| `database` | — |
| `archive-box` | 归档箱:顶盖条 + 箱体 + 中间把手横线(与 collection 同形, 均出自 lucide:archive) |
| `settings` 👁待过目 | 设置:齿轮=内圆+外圆+8 根短齿(圆帽)；家族里 sliders 是「调整」别撞【WebXiaoHeiWu 抽屉底栏「设置」入口；fable 自画未过目】 |
