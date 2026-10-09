// studio.ts —— 录音室：全屏混音台，和谱分开（user 2026-10-08「麦克风增益 / 声像没界面 对。这个可以把第一版录音室给逼出来。我建议是和谱子分开来」「录音室 可以做一个看看」）。
// created 2026-10-08 by Claude Fable 5.1。一个声部一条：名字 / 谁来演 / 增益 dB / 声像 / 静音 / 独奏。数据 = 录音房 studio.json 的 mics（增益 / 声像进文件；静音 / 独奏是这次打开里的）。
// 出声的事归这里（静音 / 独奏），显示的事归谱上的歌手牌（隐藏 / 只看它）；谱上给出声状态打角标。总线 / 效果器 / 电平表以后。
export interface StudioStrip { id: string; name: string; performer: string; gainDb: number; pan: number; muted: boolean; solo: boolean; refs: number }   // refs = 在几张纸上（0 = 能删）
export interface StudioHost {
  strips(): StudioStrip[];
  setGain(id: string, dB: number): void;
  setPan(id: string, pan: number): void;
  toggleMute(id: string): void;
  toggleSolo(id: string): void;
  play(): void;
  close(): void;
  /** 删一位一张纸都不在的歌手（歌手管理；纸上不删）。 */
  deletePart(id: string): void;
}
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const panText = (p: number) => (Math.abs(p) < 0.025 ? "中" : p < 0 ? `左 ${Math.round(-p * 100)}` : `右 ${Math.round(p * 100)}`);
const dbText = (d: number) => `${d > 0 ? "+" : ""}${d.toFixed(1)} dB`;

export class Studio {
  readonly el: HTMLDivElement;
  constructor(parent: HTMLElement, private host: StudioHost) {
    this.el = document.createElement("div"); this.el.className = "studio"; this.el.hidden = true;
    this.el.innerHTML = `<div class="finder-bar"><button class="btn" data-v="back" title="回到谱（Esc）">← 谱</button><span class="finder-title">录音室</span><button class="btn" data-v="play" title="播放（空格）"><svg class="ico"><use href="#play"/></svg></button></div>` +
      `<div class="finder-hint">每个声部一条：增益、声像、静音 / 独奏。增益和声像存进歌（录音房）；静音 / 独奏只是这次。谱上会给静音 / 独奏打角标。</div><div class="studio-strips"></div>`;
    parent.append(this.el);
    this.el.addEventListener("click", (e) => {
      const t = e.target as HTMLElement, v = t.closest<HTMLElement>("[data-v]")?.dataset.v, strip = t.closest<HTMLElement>(".strip")?.dataset.id;
      if (v === "back") this.host.close();
      else if (v === "play") this.host.play();
      else if (v === "mute" && strip) { this.host.toggleMute(strip); this.render(); }
      else if (v === "solo" && strip) { this.host.toggleSolo(strip); this.render(); }
      else if (v === "delpart" && strip) this.host.deletePart(strip);
    });
    this.el.addEventListener("input", (e) => {
      const t = e.target as HTMLInputElement, strip = t.closest<HTMLElement>(".strip"); if (!strip) return;
      const id = strip.dataset.id!, out = t.parentElement?.querySelector("output");
      if (t.dataset.gain !== undefined) { this.host.setGain(id, Number(t.value)); if (out) out.textContent = dbText(Number(t.value)); }
      else if (t.dataset.pan !== undefined) { this.host.setPan(id, Number(t.value)); if (out) out.textContent = panText(Number(t.value)); }
    });
    this.el.addEventListener("dblclick", (e) => {   // 双击推子 = 回到 0
      const t = e.target as HTMLInputElement, strip = t.closest<HTMLElement>(".strip"); if (!strip || t.tagName !== "INPUT") return;
      if (t.dataset.gain !== undefined) this.host.setGain(strip.dataset.id!, 0); else if (t.dataset.pan !== undefined) this.host.setPan(strip.dataset.id!, 0);
      this.render();
    });
  }
  get isOpen(): boolean { return !this.el.hidden; }
  show(): void { this.el.hidden = false; this.render(); }
  hide(): void { this.el.hidden = true; }
  render(): void {
    const box = this.el.querySelector(".studio-strips")!;
    box.innerHTML = this.host.strips().map((s) => `<div class="strip" data-id="${esc(s.id)}"><div class="strip-name">${esc(s.name)}</div><div class="strip-who">${esc(s.performer)}</div>` +
      `<label class="strip-row">增益 <output>${dbText(s.gainDb)}</output><input type="range" min="-24" max="12" step="0.5" value="${s.gainDb}" data-gain title="双击回 0" /></label>` +
      `<label class="strip-row">声像 <output>${panText(s.pan)}</output><input type="range" min="-1" max="1" step="0.05" value="${s.pan}" data-pan title="双击回中" /></label>` +
      `<div class="strip-btns"><button class="btn cand${s.muted ? " is-on" : ""}" data-v="mute">静音</button><button class="btn cand${s.solo ? " is-on" : ""}" data-v="solo">独奏</button></div>` +
      // 歌手管理（2026-10-08 深夜，user「只有没引用的时候才可以在歌手管理里面删」）：在几张纸上；一张都不在 = 能删
      (s.refs ? `<div class="strip-refs">在 ${s.refs} 张纸上</div>` : `<div class="strip-refs">哪张纸上都没有 <button class="btn cand danger" data-v="delpart" title="删掉这位歌手（休息室里它的配置一起删；能撤销）">删掉这位歌手</button></div>`) + `</div>`).join("");
  }
}
