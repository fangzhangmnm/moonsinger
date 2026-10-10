# 提案：时间是绝对的——音放在格子上，休止 / 小节线都算出来（不存）

> created 20261010 by Claude Opus 5.5 · as-of v0.10.18 / 2026-10-10 · **被否决**（edited by Claude Opus 5.5 2026-10-10）
>
> **user 否决**：「Proposal: store each note at an absolute position 不同意，which beats the whole idea」「what i think is just auto mute override and rearrange. make it consistient that typing will override the mute symbols」。
> 留着这份是为了不再提（家规：否决的设计不再 re-litigate）。照 user 的规矩做的 = v0.10.19，见 `20261010-keyboard-selection-rules.md` 文末修订。

## user 原话（2026-10-10 晚）

- 「然后好好的理一下later小节插入逻辑。我编辑前面的之后后面的还是飘很远了，然后好多休止符都没法编辑没法删，自动插的点会跑到非小节中间」
- 「也许需要think critically and outside the box跳出来推倒一些东西」
- 「也许真休止符和电脑插的你觉得是一视同仁还是有hidden flag？」

## 三个症状，一个根

现在一个声部 = 一串 token（音 / 休止 / 人插的「|」/ 记号…），**一个音在哪儿 = 它前面所有东西的时值加起来**。小节线也是这么数出来的（`engrave.ts unitsOf`：按拍号数；人插的「|」= 从这儿重新数）。

1. **改前面的，后面的飘走**：任何改了时值的操作（写音时后面没有休止可吃 = 往后推、「—」、÷2 / ×2 / 附点、剪切粘贴、横拖改时值、Delete 合拢）都会把这一行后面的**所有**东西挪走——小节线跟着挪，别的声部不挪，于是上下对不齐、重拍落到弱拍上。v0.10.5 的「写音先吃休止」只是缓解。
2. **休止删不掉 / 改不了**：休止有两种——存着的休止 token，和末尾补齐的淡色休止（只画不存，`padFrom`）。两种长得一样、规矩不一样：淡色的选不中、删不掉；存着的在 v0.10.17 之前退格删不掉。
3. **自动插的点跑到小节中间**：点后面的空小节写音 = 先把中间补成真休止（`materializeLead`）；人插的「|」也是一个 token。它们插下去时在格子上，**之后前面的东西一改长短，它们就跟着漂到小节中间**（「|」漂了还会让后面从这儿重新数，凭空多出一个短小节）。

根：**位置是算出来的（顺序 + 时值累加），不是存着的。** 只要这个不变，所有「不让后面飘」的规矩都是在打补丁。

## 提案：位置存成绝对的

一个声部在一张纸上 = **按时间排好、互不重叠的一串「事件」，每个事件自己带着它从第几拍开始**：

```ts
// 提案 .h（目标契约；现状见 src/score/song.ts Token / NoteTok / RestTok / BarTok）
interface Ev { id: number; at: number; dur: number;          // at = 这张纸上的 tick（绝对位置）
  pitches: Pitch[]; lyric: string | null; hyph?: boolean; tie?: boolean; art?: Art[]; staff?: Staff; /* 其余同 NoteTok */ }
interface Mark { id: number; at: number; kind: "dyn" | "hairpin" | "phrase" | "groove" | "clef" | "ottava" | "nav" | …; … }   // 记号也挂在 tick 上
interface PaperGrid { pickup: number; meters: { at: number; beats: number; beatType: number }[] }   // 小节线 = 弱起 + 拍号（含临时变拍）算出来
interface Lane { evs: Ev[]; marks: Mark[] }                   // 一个声部在一张纸上
```

- **休止不存**（Dorico 就是这么做的）：两个音之间的空 = 休止，画的时候按小节和拍子自动切成该有的休止。于是「真休止 vs 电脑插的」这个问题**不存在了**——只有空。user 问的 hidden flag：不要。
- **小节线不存**：= 弱起 + 拍号（含中途变拍）。人按「|」= 「这一小节到这儿就结束」→ 落成一个**挂在 tick 上的**变拍 / 弱起，不再是夹在音中间会漂的 token。
- **改音不挪别人**（MuseScore / Dorico 的默认）：
  - 写音 = 从光标那一拍起盖住 [at, at+dur)：盖到的音被截短 / 拿掉，**后面的位置一个都不动**。
  - 改短 = 后面空出来（= 休止）；改长 = 盖住后面的。
  - ⌫ = 拿掉光标前那个音 = 留下空（就是「留休止」，现在的规矩不变）。
  - 「删一个休止」= 这段空本来就是空：光标跳过去（或者：⌫ 在空上 = 把后面这一行往前拉——见下面「挪时间」）。
- **挪时间是专门的一个动作**（显式，不顺带）：插入 / 删掉 N 拍或 N 小节，**整张纸所有声部一起挪**（MuseScore「插入小节」那种），所以上下永远对得齐。
- 光标 = 一个 tick（+ 哪个声部），← → 按「音 / 空」一格一格走；点空小节 = 光标直接放到那一拍，不用先补休止。

### 文件格式

**几乎不动**。存的还是每张纸一份 MusicXML（本来就是按小节、休止写死的）：读的时候把休止变成空、算出每个音的 tick；存的时候按格子切小节、补休止。`score.json` 里的 `manualBars` 换成 `pickup` + 变拍（读旧文件时按旧规矩换算一次，旧文件永远能开）。→ 格式红线区（Fable）要过目的只是 `manualBars` → `pickup / meters` 那一处。

### 代价

不小：`src/score/song.ts`（编辑操作都是按 token 下标写的）、`engrave.ts unitsOf`、`timeline.ts`、歌词、选区 / 光标模型都要换底。按「找最小割」切：

1. 先做**读写层**：`Ev[] ↔ Token[]` 互转（Token 流照旧给排版 / 播放用，过渡期两边都能跑）；
2. 再把**编辑操作**一个个换成按 tick 的（写 / 改长短 / ⌫ / 选区 / 粘贴），每换一个删一个旧的；
3. 最后排版和播放直接吃 `Ev[]`，删掉 Token 流和 `padFrom` / `materializeLead` / 人插「|」的那一套。

## 今天能先止血的（不推倒也能做）

- 写音盖住后面的**音**（不只是休止）、永远不往后推——这一条就是改 user 10-10 定的「只有没有休止空间时才会推后面的」，所以要 user 点头。
- ÷2 / ×2 / 附点 / 横拖改时值：改短留空、改长盖住，不挪后面。
- 淡色补齐的休止：点它 = 当成真的空（能写、⌫ 跳过），不再是另一种休止。

## 要 user 拍的

1. 推倒（上面的提案）还是先止血？推倒的话：现在就做（Opus），还是交给下礼拜的 Fable（架构是 Fable 的承重活）？
2. 「挪时间」= 整张纸所有声部一起挪，同意吗？（单独挪一个声部 = 又会上下对不齐。）
3. ⌫ 停在一段空上：跳过去，还是把后面往前拉？
