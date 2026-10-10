// workspace.ts —— 编辑模式 + 底座（pad 那个位子放什么）的唯一规则表。created 2026-10-10 by Claude Opus 5.5
// user 2026-10-10：「模式！音，歌词，强度和articulation！我早就想用退格删强度曲线了。还有一个就是播放模式，锁写谱，但是可以调录音室」
//   →「强度和演奏法能不能合并，就是符号编辑，和别的符号也合并」→「录音室的键盘位化，和键盘互相排斥，或者不如说就是键盘的模式和编辑模式好好对齐一下。
//   不过录音室不是键盘。这么说键盘的模式键是不是能摘下来。好好理一下架构，可能得收一下屎山」。
// 根问题（账本「轻点打架」）：一次轻点在同一块地方要服务太多东西（光标 / 歌词框 / 记号菜单 / 拖音…），靠命中区先后顺序分 = 误点。
//   做法 = 模式定「这一下点的是哪一层」：谱面（score-view）、退格、底座都只看这张表，不在各处另写判断。
// 纯数据 + 纯函数（node 测试）；DOM 归 main.ts（applyWorkspace）。

/** 音 = 写音（音 / 休止 / 小节线；pad 音键）；词 = 写歌词；符 = 一切不占时值的记号（力度 / 渐强渐弱 / 演奏法 / 调号拍号速度 / 反复 / 风格 / 句号；pad 符号格）；听 = 锁住谱只听。 */
export type Mode = "notes" | "lyrics" | "symbols" | "listen";
export const MODES: readonly Mode[] = ["notes", "lyrics", "symbols", "listen"];
export const MODE_LABEL: Record<Mode, string> = { notes: "音", lyrics: "词", symbols: "符", listen: "听" };
export const MODE_TITLE: Record<Mode, string> = {
  notes: "音：写音 / 休止 / 小节线（键盘 = 音键）；点音 = 光标，笔 / 鼠标拖音 = 改音高 / 时值；退格 = 删音",
  lyrics: "词：点音或它下面 = 写这个音的歌词；按住字拖 = 挪 / 合；退格 = 删光标前那个音的字",
  symbols: "符：力度、渐强渐弱、演奏法、调号 / 拍号 / 速度、反复、风格、句号（键盘 = 符号格）；点记号 = 它的菜单、按住拖 = 挪；退格 = 删记号",
  listen: "听：谱锁住防误触——轻点只认看谱的（歌手牌 / 翻纸 / 本段），不跳播；长按 / 右键谱面 = 从这儿放 / 接着放 / 从头放；空格 = 放 / 停；录音室照样能调（Esc 回到写）",
};

/** 一个模式下谱面的每种手势归谁（score-view 只看这个）。 */
export interface ModeRules {
  /** 能改谱（false = 听：轻点只认看谱的、不跳播；长按 / 右键 = 从这儿放的小菜单；拖 = 滚动；别的不接）。 */
  edit: boolean;
  /** 笔 / 鼠标按在音上拖 = 改音高 / 时值。 */
  noteDrag: boolean;
  /** 点音 / 歌词位 = 开歌词框；按住字拖 = 挪 / 合。 */
  lyrics: boolean;
  /** 点力度记号 / 渐强渐弱 / 调号拍号速度 / 反复 / 风格 = 它的菜单或框；按住拖 = 挪。 */
  symbols: boolean;
  /** 退格删什么。 */
  backspace: "notes" | "lyrics" | "symbols" | null;
}
export const RULES: Record<Mode, ModeRules> = {
  notes: { edit: true, noteDrag: true, lyrics: false, symbols: false, backspace: "notes" },
  lyrics: { edit: true, noteDrag: false, lyrics: true, symbols: false, backspace: "lyrics" },
  symbols: { edit: true, noteDrag: false, lyrics: false, symbols: true, backspace: "symbols" },
  listen: { edit: false, noteDrag: false, lyrics: false, symbols: false, backspace: null },
};

/** 底座（pad 那个位子）：音键 / 符号格 / 录音室 / 空（收起）。录音室不是键盘，但占同一个位子、和键盘互斥。 */
export type Dock = "keys" | "symbols" | "studio" | "none";
export interface WorkspaceState {
  mode: Mode;
  /** 录音室开着（在底座里）。 */
  studio: boolean;
  /** 键盘收起了（pad 的「收起」；点谱 / 底下的「键盘」再弹出来）。 */
  collapsed: boolean;
  /** 试音中（乐器目录 / 乐器页开着：底座放音键，只弹不写）。 */
  tryout: boolean;
}
/** 底座放什么：录音室 > 试音 > 收起 > 按模式（音 = 音键、符 = 符号格；词 / 听 = 空——词用系统键盘，听不写）。 */
export function dockOf(s: WorkspaceState): Dock {
  if (s.studio) return "studio";
  if (s.tryout) return "keys";
  if (s.collapsed) return "none";
  return s.mode === "notes" ? "keys" : s.mode === "symbols" ? "symbols" : "none";
}
/** 这个模式有键盘可收起 / 弹出吗（底下的「键盘」tab 露不露）。 */
export const hasKeys = (m: Mode): boolean => m === "notes" || m === "symbols";
