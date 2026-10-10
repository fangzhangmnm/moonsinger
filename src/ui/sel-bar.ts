// sel-bar.ts —— 选区条：有选区时挂在走带胶囊下面的一条（照 WeebPaint 的上下文条）：全选 / 复制 / 剪切 / 粘贴 / 操作…（选区菜单：移调 / 转调 / 时值…）/ 修 / 删 / ✕。created 2026-10-08 by Claude Fable 5.1
//   user 2026-10-08「有选区时，胶囊下面出一条选区条…对」「快捷键其实现在我都没用过」（触屏优先；快捷键只是顺手）。
//   没选区但剪贴板里有东西 = 只露「粘贴 / ✕」（贴在光标处；✕ = 忘掉剪贴板）。记号（跳音 / 呼吸…）以后也进这里（user「写完改的」）。
import { iconHtml } from "./icon.ts";
import { ARTS, DYNS, type Art, type Dyn } from "../score/song.ts";

export type SelVerb = "all" | "copy" | "cut" | "paste" | "transpose" | "delete" | "clear" | "forget";   // 「修」2026-10-08 去掉（user「也许不要修这个ui入口，符号键盘承重」）：演奏法 / 连线 / 力度都在 pad 符号层（有选区 = 整组）
/** 「修」（2026-10-08 by Claude Opus 5.5；user 拍「挂在音上 + 选区条」）：选区条原地换成一排开关——演奏法（选中的音都有 = 亮；有的有 = 半亮）+ 力度（选区开头那儿写着的亮）。 */
export interface FixState { art: Record<Art, "all" | "some" | "none">; slur?: "all" | "some" | "none"; ignores?: readonly string[] }   // ignores = 台上那位不认的（钮上标「不认」，照样能写）；slur = 连线（2026-10-08 连断）
/** 渐强 / 渐弱的钮面：< / >（两条线）。 */
export const CRESC_SVG = `<svg class="slur-ico" viewBox="0 0 22 12" aria-hidden="true"><path d="M20,2 L3,6 L20,10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const DIM_SVG = `<svg class="slur-ico" viewBox="0 0 22 12" aria-hidden="true"><path d="M2,2 L19,6 L2,10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/** 连线的钮面：一道弧（SMuFL 没有单个连线字形）。 */
export const SLUR_SVG = `<svg class="slur-ico" viewBox="0 0 22 12" aria-hidden="true"><path d="M2,9 Q11,1 20,9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
const ART_LABEL: Record<Art, [string, string]> = { swellUp: ["<", "音内渐强"], swellDown: [">", "音内渐弱"], swellBoth: ["<>", "音内鼓起"], arpeggio: ["\u{EAA9}", "琶音"], staccato: ["\u{E4A2}", "跳音"], accent: ["\u{E4A0}", "重音"], marcato: ["\u{E4AC}", "强音"], sfz: ["\u{E539}", "突强"], fp: ["\u{E534}", "强后弱"], tenuto: ["\u{E4A4}", "保持"], breath: ["\u{E4CE}", "呼吸"], stress: ["\u{E4B6}", "次重音"], unstress: ["\u{E4B8}", "弱化"], ghost: ["\u{E0F5}\u{E0A4}\u{E0F6}", "幽灵音"], whisper: ["\u{E0A9}", "气声"] };
const DYN_GLYPH: Record<Dyn, string> = { ppp: "\u{E52A}", pp: "\u{E52B}", p: "\u{E520}", mp: "\u{E52C}", mf: "\u{E52D}", f: "\u{E522}", ff: "\u{E52F}", fff: "\u{E530}" };
export interface SelBarHost { verb(v: SelVerb): void }

export class SelBar {
  readonly el: HTMLDivElement;
  constructor(parent: HTMLElement, host: SelBarHost) {
    this.el = document.createElement("div"); this.el.className = "sel-bar"; this.el.hidden = true;
    parent.append(this.el);
    this.el.addEventListener("pointerdown", (e) => e.stopPropagation());   // 别让谱面把这一下当点谱
    this.el.addEventListener("click", (e) => { const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v as SelVerb | undefined; if (v) host.verb(v); });
  }
  /** 画：sel = 有没有选区（几个 token）；clip = 剪贴板里有没有东西；over = 别的全屏视图盖着（藏）；fix = 「修」开着（那一排开关的状态）。 */
  update(sel: number, clip: boolean, over: boolean): void {
    if (over || (!sel && !clip)) { this.el.hidden = true; return; }
    const b = (v: SelVerb, label: string, icon?: string, cls = "") => `<button type="button" class="btn ${cls}" data-v="${v}">${icon ? iconHtml(icon) : ""}<span>${label}</span></button>`;
    this.el.innerHTML = sel
      ? `<span class="sel-n">${sel} 个</span>` + b("all", "全选") + b("copy", "复制") + b("cut", "剪切") + (clip ? b("paste", "粘贴") : "") + b("transpose", "操作…") + b("delete", "删", "trash-can", "danger") + b("clear", "", "x")
      : b("paste", "粘贴到光标处") + b("forget", "", "x");
    this.el.hidden = false;
  }
}
