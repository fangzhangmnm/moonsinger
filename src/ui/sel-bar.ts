// sel-bar.ts —— 选区条：有选区时挂在走带胶囊下面的一条（照 WeebPaint 的上下文条）：全选 / 复制 / 剪切 / 粘贴 / 移调 / 删 / ✕。created 2026-10-08 by Claude Fable 5.1
//   user 2026-10-08「有选区时，胶囊下面出一条选区条…对」「快捷键其实现在我都没用过」（触屏优先；快捷键只是顺手）。
//   没选区但剪贴板里有东西 = 只露「粘贴 / ✕」（贴在光标处；✕ = 忘掉剪贴板）。记号（跳音 / 呼吸…）以后也进这里（user「写完改的」）。
import { iconHtml } from "./icon.ts";
import { ARTS, DYNS, type Art, type Dyn } from "../score/song.ts";

export type SelVerb = "all" | "copy" | "cut" | "paste" | "transpose" | "delete" | "clear" | "forget" | "fix" | "fixdone" | `art:${Art}` | `dyn:${Dyn}` | "dyn:none";
/** 「修」（2026-10-08 by Claude Opus 5.5；user 拍「挂在音上 + 选区条」）：选区条原地换成一排开关——演奏法（选中的音都有 = 亮；有的有 = 半亮）+ 力度（选区开头那儿写着的亮）。 */
export interface FixState { art: Record<Art, "all" | "some" | "none">; dyn: Dyn | null }
const ART_LABEL: Record<Art, [string, string]> = { staccato: ["\u{E4A2}", "跳音"], accent: ["\u{E4A0}", "重音"], tenuto: ["\u{E4A4}", "保持"], breath: ["\u{E4CE}", "呼吸"] };
const DYN_GLYPH: Record<Dyn, string> = { pp: "\u{E52B}", p: "\u{E520}", mp: "\u{E52C}", mf: "\u{E52D}", f: "\u{E522}", ff: "\u{E52F}" };
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
  update(sel: number, clip: boolean, over: boolean, fix: FixState | null = null): void {
    if (over || (!sel && !clip)) { this.el.hidden = true; return; }
    const b = (v: SelVerb, label: string, icon?: string, cls = "") => `<button type="button" class="btn ${cls}" data-v="${v}">${icon ? iconHtml(icon) : ""}<span>${label}</span></button>`;
    if (sel && fix) {
      this.el.innerHTML = `<span class="sel-n">修</span>` +
        ARTS.map((a) => `<button type="button" class="btn fix-art${fix.art[a] === "all" ? " is-on" : fix.art[a] === "some" ? " is-some" : ""}" data-v="art:${a}" title="${ART_LABEL[a][1]}：选中的音都有 = 去掉，否则都加上"><span class="smufl">${ART_LABEL[a][0]}</span><span>${ART_LABEL[a][1]}</span></button>`).join("") +
        `<span class="sel-gap"></span>` +
        DYNS.map((d) => `<button type="button" class="btn fix-dyn${fix.dyn === d ? " is-on" : ""}" data-v="dyn:${d}" title="力度 ${d}：放在选区开头，管到下一个力度"><span class="smufl">${DYN_GLYPH[d]}</span></button>`).join("") +
        (fix.dyn ? b("dyn:none", "去掉力度") : "") + b("fixdone", "完成", "", "primary");
      this.el.hidden = false; return;
    }
    this.el.innerHTML = sel
      ? `<span class="sel-n">${sel} 个</span>` + b("all", "全选") + b("copy", "复制") + b("cut", "剪切") + (clip ? b("paste", "粘贴") : "") + b("transpose", "移调") + b("fix", "修") + b("delete", "删", "trash-can", "danger") + b("clear", "", "x")
      : b("paste", "粘贴到光标处") + b("forget", "", "x");
    this.el.hidden = false;
  }
}
