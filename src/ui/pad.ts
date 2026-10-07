// pad.ts —— 手指面板：4×4 pad（照 Donner MEDO 音符模式 = 音阶 4 个一行往上折，左下是 1，跟着调走）+ 一条按钮。
// created 2026-10-06 by Claude Opus 5.5
// grill 账本 Q10 / Q11：user「Donner MEDO 是golden ui example…我只是当ocarina来按」「pad 跟着调走 当然可以config」
//   「我反而不喜欢滑音和gyro，反而会误触」→ 只收离散的拍，按下即写，不做滑音。
//   第 16 格（右上，MEDO 的菜单格）= 0 休止（user 2026-10-06「the 16th pad should be 0」）；工具键一行放在 16 键上面，像拼音候选条
//   （user「the tool keys are above it like 拼音候选框」）；iPad 竖屏全宽、不必是正方形（「like the ipad software keyboard position」）。
// 起点八度：左下永远是不带点的那个 1（她说话那组的 1；1=C 时 C4）——照 MEDO 的肌肉记忆，不替她的音域挑位置
//   （user 2026-10-07「no. just use the muscle memory of that」）；▲▼ 整体挪一个八度（按八度挪每个键还是原来的级，按行挪会把指法打乱）。

import { type Pitch, HOME, diatonicIndex, fromDiatonic, tonicStepIndex, pitchName } from "../score/pitch.ts";
import type { Command } from "../score/keymap.ts";

const HER_LOW = 26, HER_HIGH = 37;   // A3 / E5 的五线谱位置
const NOTE_KEYS = 15;                // 16 格里 15 个音 + 右上 1 个 0

export function defaultPadBase(fifths: number): number { return homeTonic(fifths); }

const DOT_UP = "\u0307", DOT_DOWN = "\u0323";   // 简谱的上加点 / 下加点

/** 不带点的那一组 = 她说话的家（HOME = D4）所在的那个「1 到 7」：1=C 时 C4–B4 不带点。 */
function homeTonic(fifths: number): number {
  const t = tonicStepIndex(fifths), h = diatonicIndex(HOME);
  return t + 7 * Math.floor((h - t) / 7);
}

export interface PadHost { fifths(): number; onPitch(p: Pitch): void; onCommand(c: Command): void }

export class Pad {
  private shift = 0;          // 用户挪过几个八度

  constructor(private el: HTMLElement, private host: PadHost) { this.render(); }

  render(): void {
    const fifths = this.host.fifths();
    const base = defaultPadBase(fifths) + 7 * this.shift;
    const cells: string[] = [];
    for (let row = 3; row >= 0; row--) {
      for (let col = 0; col < 4; col++) {
        const k = row * 4 + col;
        if (k >= NOTE_KEYS) { cells.push(`<button class="pad-key rest" data-cmd="rest" title="休止（0）"><span class="deg">0</span><span class="abs">休止</span></button>`); continue; }
        const d = base + k, p = fromDiatonic(d, fifths);
        const deg = (k % 7) + 1, oct = Math.floor((d - homeTonic(fifths)) / 7);
        const dots = oct > 0 ? DOT_UP.repeat(oct) : DOT_DOWN.repeat(-oct);
        const inRange = d >= HER_LOW && d <= HER_HIGH;
        cells.push(`<button class="pad-key${inRange ? "" : " out"}${deg === 1 ? " tonic" : ""}" data-d="${d}">` +
          `<span class="deg">${deg}${dots}</span><span class="abs">${pitchName(p).replace("#", "♯").replace(/b(?=\d)/, "♭")}</span></button>`);
      }
    }
    this.el.innerHTML =
      `<div class="pad-tools">` +
      `<button class="btn" data-oct="-1" title="整体低八度"><svg class="ico"><use href="#caret-down"/></svg></button>` +
      `<button class="btn" data-oct="1" title="整体高八度"><svg class="ico"><use href="#caret-up"/></svg></button>` +
      `<button class="btn" data-cmd="extend" title="拉长一拍（-）">－</button>` +
      `<button class="btn" data-cmd="halve" title="减半（8）">短</button>` +
      `<button class="btn" data-cmd="double" title="加倍（9）">长</button>` +
      `<button class="btn" data-cmd="dot" title="附点（.）">·</button>` +
      `<button class="btn" data-cmd="bar" title="小节线（|）">|</button>` +
      `<button class="btn" data-cmd="backspace" title="退格"><svg class="ico"><use href="#backspace"/></svg></button>` +
      `</div>` +
      `<div class="pad-grid">${cells.join("")}</div>`;
    this.el.querySelectorAll<HTMLButtonElement>(".pad-key[data-d]").forEach((b) => b.addEventListener("pointerdown", (e) => {
      e.preventDefault(); b.classList.add("hit"); setTimeout(() => b.classList.remove("hit"), 120);
      this.host.onPitch(fromDiatonic(Number(b.dataset.d), this.host.fifths()));
    }));
    this.el.querySelectorAll<HTMLButtonElement>("[data-cmd]").forEach((b) => b.addEventListener("pointerdown", (e) => {
      e.preventDefault(); if (b.classList.contains("pad-key")) { b.classList.add("hit"); setTimeout(() => b.classList.remove("hit"), 120); }
      this.host.onCommand({ k: b.dataset.cmd } as Command);
    }));
    this.el.querySelectorAll<HTMLButtonElement>("[data-oct]").forEach((b) => b.addEventListener("pointerdown", (e) => {
      e.preventDefault(); this.shift = Math.max(-2, Math.min(2, this.shift + Number(b.dataset.oct))); this.render();
    }));
  }
}
