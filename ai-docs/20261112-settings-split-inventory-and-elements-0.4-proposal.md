# 第 13 条开工前交统筹的两样：音源库清单 + 界面零件库 0.4.0 接口提案

> created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）· as-of v0.17.6 / 2026-11-12
> 施工单 `20261111-score-surface-construction-plan.md` 第 13 条、13 补、13 再补、13-0、13-3 要求「先交清单 / 接口提案给统筹再动」。这一份就是。统筹批了才动码。

---

## 一、音源库清单：设备上现在有哪些「库」、各由什么组成、删了动哪里

### 先说一件和施工单写的不一样的事：共用缓存现在跟谁共用

- 写歌软件住在自己的网址 `sing.weebpaint.com`（10-11 搬的，一个 app 一个子域名）。浏览器的缓存、IndexedDB 都是按网址分开的。
- 所以名字叫「家族共用」的两个缓存（`pwa-models` 模型包、`pwa-sounds` 音源）**在这个网址下没有别的 app 在用**。朗读那个 app（JustReadBooks）确实用同几个包，但它在另一个网址，各存一份，删这边不影响那边。
- 真正共用的是：**同一个网址下的正式版（`/`）和开发版（`/dev/`）**——两边的模型包、音源、念缓存、渲染缓存都是同一份。
- 所以 13-2「共用缓存如实说」那一句我建议改成：「正式版和开发版共用这一份：在这里删了，另一个版本也要重新下载」。不写「别的 app」（现在是假的）。请统筹定。

### 1. 小月相（自带的库，删了能装回来）

| 组成 | 住在哪 | 多大 | 人话的名字（13 再补 ①） |
|---|---|---|---|
| `voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007` | Cache Storage `pwa-models`（经家族的模型包库 `@internal/model-packs`） | 39.7 MB | 小月相的声音 |
| `runtime-onnxruntime-web-1.30.0-20261001` | 同上 | 3.7 MB | 运行引擎 |
| `lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001` | 同上 | 24.5 MB | 日语读音 |
| `lang-zh-pinyin-20261001` | 同上 | 0.7 MB | 中文读音 |
| `lang-en-cmudict-20261001` | 同上 | 0.9 MB | 英文读音 |

- 人话的名字按包的种类（slug 开头的 `voice` / `runtime` / `lang-xx`）来，代码里一张小表，不逐个包写死。原名进问号。
- 它自己的缓存（归维护页「小月相」那一组）：**念过的句子** = IndexedDB `moonsinger-5b1e7c0a92d34f6e.speech`（全局池，跨歌共用，按预算淘汰）+ 每条工作道里的内存热层。**引擎** = 每条工作道一个 worker，WASM 内存只涨不落，「重开」才还回去。
- **删**要动的：模型包库 `packStore.delete(这五个包)`（库里有现成的接口）→ 清念缓存（`singer.cache("clear")`）→ 关掉工作道（引擎内存还回去）。
- 删了之后：用小月相的声部不出声（照现有「不出声的声部」那一套：角标、清单、找声音；不替补）。**元音版**（「小月相（元音）」那位、按键预听的元音表）**不受影响**：元音表随 app 一起发（`assets/preview/`），不在这个库里。
- **装回来** = 照现在第一次用时的下载（逐片核校验值）；也可以「从本机文件导入」（已有）。

### 2. 乐器音色库 GeneralUser GS 2.0.3（自带的库，删了能装回来）

- 一个文件 32 MB（`.sf2`，不拆），Cache Storage `pwa-sounds`，按整个文件的 sha256 存；app 里钉着这个 sha256（`src/gm/sounds.gen.ts`）。
- 维护项（13 再补 ⑤）：**清内存** = 主线程里最多留两份整包（`releaseSoundMemory()`），文件不动。
- **删**要动的：`forgetSound(GS 的 sha256)` + 清内存。
- 删了之后：歌里**打包着**声音的声部照常响；**弱引用**它的声部要它的时候会去重新下载（解析链：歌里 → 这次打开里 → 设备上 → 音源库），没网 = 不出声。从 GS 切出来的小块现在**不存设备**，只在这次打开的内存里，所以没有「它自己的缓存」要一起删。
- **装回来** = 「下载留着」（已有，核 sha256）。

### 3. 你自己加的音色文件（不是自带的，删了就没了）

- 住在同一个 `pwa-sounds` 里，按**切出来的那一小块**的 sha256 存。来源有两种：① 从自己的 `.sf2` 选乐器时自动留的那一块；② 「全部解包」时把歌里打包着的声音挪到设备上留的（这一种可能是从 GS 切的，也可能是自己的）。
- **有一个缺口，要统筹定**：缓存里**只存了字节，没存名字和来历**。现在设置里能写出名字，是因为去翻了「现在打开的这首歌」里谁用着它；别的都只能写「别的歌 / 别的版本 / 别的 app 留的（sha256 前 8 位）」。13-2 要的「每个文件一行」要有名字，得在留下这一块的时候顺手记一条「名字、从哪个文件来、哪天留的」。
  - 我提的做法：记在 app 自己的设备键值（device-kv，前缀是 app 的 GUID）里，键 = 这一块的 sha256。只是给人看的标签，丢了不影响出声（照旧按 sha256 认）；删这一块时一起删。老的、没记过的照现在那样写 sha256 前 8 位。
  - 这是新的一样存在设备上的东西（不进歌、不同步），按家规算持久化的改动，所以先问。
- **删**：`forgetSound(那一块的 sha256)`。删了之后：引用它、又没打包的声部不出声，要「找文件…」把原来的 `.sf2` 再给它。

### 4. 不算「库」、但现在设置里出现的东西（各归哪一页）

| 东西 | 住在哪 | 归哪 | 清了会怎样 |
|---|---|---|---|
| 渲染好的声音（歌库封面 ▶ 靠它） | IndexedDB `moonsinger-5b1e7c0a92d34f6e.renders`，最多 N 首 | 维护页「渲染好的声音」 | 要重渲；歌不少东西 |
| 声音设备（出声口） | 内存 | 维护页「声音设备」：重启声音 | 正在响的断一下 |
| 离线壳（app 自己） | Cache Storage `moonsinger-<哈希>` | 维护页「软件」：检查更新 / 清缓存重启 | 重新载 app；歌不动（没落盘的照现有的挽留 / 落盘规矩） |
| 诊断日志 | device-kv | 维护页「诊断日志」 | 日志没了；歌不动 |
| 模型来源 / 音源库来源 | 只在这次打开里 | 音源页各那一栏的「来源」 | — |
| 歌库封面缓存 / 歌库事实缓存 | IndexedDB `….thumbs` / `….facts` | 现在不在设置里（只有还原出厂会清），这次不加 | — |
| 站点配额、几块在录音房、几条道、输出延迟、音频线程忙多少 | — | 开发者页（13 再补 ④） | — |

### 5. 红线守卫打算怎么写

- 音源页的「删」和维护页的「清」，背后只许调这几样：`packStore.delete(小月相那五个包)`、`forgetSound(…)`、`releaseSoundMemory()`、念缓存的 clear、渲染缓存的 clear、重开工作道、重启声音、清自己前缀的离线壳。
- 测试：把这两页的每颗钮挨个按一遍（假的存储），记下被碰到的库 / 缓存名字——不许出现歌库的库、同步的库、别的前缀的缓存；维护页的每颗钮按完之后，歌库里的每一首歌字节不变（「这一页上的每颗钮，按下去都不会让任何一首歌少东西」）。
- 另加一条结构守卫：这两页的处理函数不许 import 歌库 / 同步那一层。

---

## 二、界面零件库 `@internal/workbench-elements` 0.4.0 接口提案（三件，一次升小号）

> 0.4.0 是 user 批的那一次（13-0「页签条」+ 13-3「面板外壳、一项一行 + 问号」同一次）。库只在本机提交、打标签，不推 GitHub。WeebPaint、CatsUp 改用不在这一刀里。

### 现在两家怎么做的（读过的）

- **WeebPaint** `styles.css .menu-tabs / .menu-tab`、`src/settings-menu.ts`：☰ 面板里一排格子，`flex: 1 1 0` 平分，图标 18 px 在上、小字在下，字太长省略号，选中的那格 `aria-pressed` + 一块淡的主题色底；没有边框。记住停在哪页 = desk（跟着文件）。
- **CatsUp** `src/app/ui/popup-menu.ts`（抄 WeebPaint）：`tabs: {id, label, icon?}[]` 是弹出菜单的一个选项，页签条画在菜单身体里；`role="tablist"` / `role="tab"` / `aria-selected`；记住停在哪页交给宿主（`configureTabMemory`）。
- **写歌软件** 现在是一排带边框的小钮（`.set-tabs .btn.chip`），换页、问号展开都在 `wireSetPages` 里；一项一行 = `setItem(label, 控件, 说明, 下面一块)` 拼字符串。
- 共同的那一件 = 「一排平分的格子、图标 + 小字、选中一块底色、点了告诉宿主」。两家都把它焊在弹出菜单里；抽出来做成独立的一件，弹出菜单以后可以用它（不在这一刀）。

### 第七件：页签条 `tab-strip`

```ts
export interface TabSpec<Id extends string = string> {
  id: Id;
  label: string;          // 短名字（一格放得下）；放不下 = 省略号，title 里写全
  icon?: IconName;        // 宿主 sprite 里的 id；没有 = 只有字
  title?: string;         // 读屏 / 悬停的全名（缺 = label）
}
export interface TabStripOpts<Id extends string = string> {
  tabs: readonly TabSpec<Id>[];
  current: Id;
  onPick(id: Id): void;   // 点了（或键盘左右键挪到）告诉宿主；换页、记住停在哪页 = 宿主的事
}
export interface TabStrip<Id extends string = string> {
  readonly el: HTMLElement;                    // <div class="wb-tabs" role="tablist">
  set(id: Id): void;                           // 宿主换了页（比如跳到某一页）= 亮那一格，不回调
  update(tabs: readonly TabSpec<Id>[], current?: Id): void;   // 页变了（多一页 / 少一页 / 改语言）
  dispose(): void;
}
export function createTabStrip<Id extends string>(opts: TabStripOpts<Id>): TabStrip<Id>;
```

- 样子（CSS 进 `workbench-elements.css`，颜色用宿主的 token）：永远一排、格子平分；图标在上、小字在下；没有边框；选中 = 一块底色 + 主题色字；和带边框的动作按钮一眼分得开。窄到放不下：字省略号（不折行，13-0 说「永远一排」——13-1 写的「整排折成两行」以 13-0 为准，请统筹确认）。
- 键盘：页签上左右键挪、Home / End 到头尾（标准的 tablist 行为）；挪了就是 onPick。
- 零内容知识：不认识「设置」「页面设置」，不存停在哪页。

### 第八件：面板外壳 `panel-shell`

```ts
export interface PanelButton { id: string; label: string; primary?: boolean; danger?: boolean }
export interface PanelShellOpts<Tab extends string = string> {
  title: string;
  tabs?: TabStripOpts<Tab>;          // 有 = 标题下面一条页签条（第七件）
  body: HTMLElement;                 // 宿主填的内容（有页签时宿主自己按页换内容，壳不管）
  buttons?: readonly PanelButton[];  // 底下一排；缺 = 只有一颗「好」
  onButton?(id: string): void;       // 点了底下的钮（「好」= "close"）
  onClose(): void;                   // 壳要关了（点「好」、点遮罩、Esc）：宿主收拾、登记的盖层销掉
  width?: "narrow" | "wide";         // 窄 = 现在 360 px 那种；宽 = 设置那种
}
export interface PanelShell<Tab extends string = string> {
  readonly el: HTMLElement;          // 整层（遮罩 + 卡片）
  readonly body: HTMLElement;        // 能滚的那一块
  readonly tabs: TabStrip<Tab> | null;
  close(): void;                     // 宿主要关（不再回 onClose）
}
export function openPanelShell<Tab extends string>(opts: PanelShellOpts<Tab>): PanelShell<Tab>;
```

- 壳只管：遮罩、卡片、标题、页签条、能滚的身体、底下那排钮、Esc / 点遮罩关、打开时焦点放在卡片上。
- 不管：盖层登记（写歌软件的 `ui.open / ui.close`）、内容、修改锁、页面记忆——都在宿主。
- 写歌软件里三处用它：设置、页面设置、这首歌。

### 第九件：一项一行 + 小标记展开 `setting-row`

```ts
export interface RowNote { mark: string; label: string; html: string }   // mark = 名字后面那个小标记的字（"?"、"©"）；label = 读屏名（「这是什么」「版权和使用规则」）；html = 展开的那一段
export interface SettingRowOpts {
  label: string;                  // 左边名字（HTML 已转义的由宿主负责）
  control?: string;               // 右边控件的 HTML（下拉、钮…）
  notes?: readonly RowNote[];     // 名字后面的小标记，一个都没有 = 不画
  below?: string;                 // 这一行下面常驻的一块（列表、状态行）
  attrs?: string;                 // 宿主自己的属性（data-…）
}
export function settingRowHtml(o: SettingRowOpts): string;   // 拼字符串（写歌软件现在全是拼字符串）
export function wireSettingRows(root: HTMLElement): () => void;   // 在根上挂一次：点小标记 = 这一行下面展开那一段，再点收；同一行一次只开一段；回一个解绑
```

- 13 补的「?」+「©」就是两个 `RowNote`；「©」是字不是图标，读屏名写全。
- 写歌软件现在的 `setItem` 换成它，`data-v` 之类宿主的属性不动。

### 版本与交付

- 库 0.3.0 → 0.4.0（user 批的那一次）。只在本机提交 + 打 `v0.4.0` 标签，不推。写歌软件 `vendor-pkgs/` 收新的包。
- 交付给统筹看的是构建出来的 `.d.ts`（家规：第一个版本前人审真实的出口），不是这份提案的字。

---

## 三、页签的图标清单（13-0：先列，缺的画进待过目层）

| 哪里 | 页（短英文名） | 用哪个 | 现成 / 缺 |
|---|---|---|---|
| 设置 | 界面（UI） | `theme` | 现成 |
| 设置 | 音源（Sounds） | `volume`（喇叭） | 现成 |
| 设置 | 输入（Input） | 缺：`midi`（五针圆插头）——`keyboard` 是电脑键盘、`piano-keys` 已经是「弹」 | **缺，要画** |
| 设置 | 维护（Upkeep） | `wrench` | 现成 |
| 设置 | 关于（About） | `info`（和「这首歌」同一枚）或另画 | 见下 |
| 设置 | 开发者（Dev） | 缺：`code`（`</>`）；或用现成的 `chip` | **缺**（或用 chip） |
| 页面设置 | 看谱（View） | `visibility-show`（眼睛） | 现成 |
| 页面设置 | 版面（Page） | `file`（一张纸） | 现成 |
| 纸右上角 | 这首歌 | `info`（圆圈里一个 i，13-3） | **缺，要画** |

- 要统筹定的：「关于」和「这首歌」用不用同一枚 `info`（一个在设置里讲 app、一个在纸上讲这首歌；同一枚省一枚、但同一个 app 里一个图两个意思）；开发者用新画的 `code` 还是现成的 `chip`。
- 画的照家规：进图标库 `build.py` 的 PENDING，note 写「写歌软件 · 设置 / 页面设置的页签（或纸右上角「这首歌」钮）+ Claude Opus 5.5（MoonSinger小弟）画 + 未过目」，`TODO.md` 待过目表各一行；16 / 24 px 各渲一张自己先看，再给统筹。

## 四、要统筹定的（汇总）

1. 共用缓存那一句改成「正式版和开发版共用」（不写别的 app）。
2. 「你自己加的音色文件」每一块记一条名字和来历（设备键值，按 sha256）——新的持久化，批不批。
3. 页签条窄的时候：永远一排 + 省略号（13-0）还是折成两行（13-1）。我按 13-0。
4. 「关于」和「这首歌」同一枚 `info`？开发者用 `code`（新画）还是 `chip`？
5. 零件库三件的接口（第二节）。
