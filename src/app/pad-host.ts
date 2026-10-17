// pad-host.ts —— pad 的宿主 = 翻译层的另一半（键盘只发按键，这里把按键变成谱上的事）：
//   · 音键 → 写 / 改一个音 / 叠音观望 / 出声；按键 id → 命令（锁 × 光标 × 选区）/ 插记号 / 开菜单；
//   · 手指和电脑键盘共用的「谁按着」簿记：单音乐器的「同时按」护栏、叠音的根音与观望（判据 = src/keyboard/chords.ts，纯函数）。
// created 2026-10-15 by Claude Fable 5.1（键盘模块刀 2 之三：从 src/app/main.ts 原样抽出，行为不变；对应 ai-docs/20261014-editing-mental-model.md §6 的「翻译层」）。
//   宿主只知道 pad 发什么（PadHost），谱怎么变全问 PadGlue（main.ts 给的一组访问器）；写法同 performance.ts 的 PerfHost。
// 单音乐器（小月相 / 元音 / 没人）写音：同时多按只写第一个（user「monophonic乐器输入的时候如果你多按只会输第一个。但是做好模糊护栏免得快速输入的时候第二个音被吃掉」）。
//   模糊护栏：只有「上一个写进去的音还按着，而且才过了不到 50 ms」才算同时按、不写不响不亮；快速连按（前一根手指还没抬，但已经隔开了）照写，抬过手的更不管。
//   手指和电脑键盘共用一份；弹（只唱不写）不管，几个音一起响。
// 叠音的「头 / 尾」判据（2026-10-08 by Claude Opus 5.5；只给能叠音的声部）：
//   user「之前的判定是ab落的时候相近。现在的判定是b落的时候不在a的尾巴上」「如果ab，b按下去之后a马上松，那么就不应该是和弦」
//   「尾巴时间规则也需要考虑相对比例，比如如果我快速跳音轻按ab多次的时候」「和弦输入的时候应该支持有长间隔的连按…慢慢按，xor toggle，手指数量不够的时候也能好」
//   A（根音：写进谱、还按着的那个）按着时按下 B：B 马上响，进不进谱**观望**到分得出来（不先写再撤——撤销栈干净、替换模式不丢时值）；规则逐条在 chords.ts 头注释。
// MIDI 键盘（2026-10-16 by Claude Opus 5.5）= 又一台发音键的设备：noteDown / noteUp 收绝对音高，写 / 改 / 叠音观望 / 单声护栏 / 弹和 pad 音键同一条路，
//   只是不吃 pad 的升降锁（raw：琴键本身就分黑白键，按的是哪个就是哪个）。

import { type Pitch, alterBy, keySpell } from "../score/pitch.ts";
import { apply, type Command } from "../score/commands.ts";
import { type EditorState, ART_NAME, singleSel, writePitch, soundingPitch, setNote, setUnit, setTuplet, setInputKey, setInputScale, tr, keyAt, toggleChordPitch, dynMarkAt } from "../score/song.ts";
import type { Mark } from "../score/perform.ts";
import { Pad, type HintRange } from "../keyboard/pad.ts";
import { chordHead, chordBothAfterMs, chordVerdict, monoClash, type ChordWhy } from "../keyboard/chords.ts";
import { createPadMusic, type PadMusicHost } from "./pad-music.ts";
import { padKeyAction, markOfKey } from "./pad-keys.ts";
import { diagNote } from "./report-error.ts";

/** main.ts 给的那一组访问器：谱的状态与写、出声、页 / 模式、鬼音符、锁、披露、符号格要看的、菜单。 */
export interface PadGlue {
  state(): EditorState;
  update(next: EditorState): void;
  /** 写一个音并回刚写的下标（-1 = 没写成）。 */
  writeAndLocate(write: (s: EditorState) => EditorState): number;
  /** 写了一个音 / 休止 / 拉长之后：锁的「只管下一个」用掉了。 */
  afterWrite(): void;
  /** 改了音高之后响一下。 */
  previewEdited(): void;
  info(msg: string): void;
  /** 光标所在声部的乐器能叠音吗。 */
  canStack(): boolean;
  sound: { down(p: Pitch, id: string): void; up(id: string): void };
  /** 谱上第 i 个音出声（和弦整个响）。 */
  soundTok(s: EditorState, i: number, id: string): void;
  /** 顶栏「弹」开着。 */
  impro(): boolean;
  /** 找人视图开着（真对象 finder.isOpen；pad 创建时 finder 还没建，所以是访问器）。 */
  finderOpen(): boolean;
  finderShown(): boolean;
  instShown(): boolean;
  toggleImpro(): void;
  /** 小键盘顶上「符 / 音」：只换键盘。 */
  kbSwitch(): void;
  ghost: { on(): boolean; set(id: string, p: Pitch): void; delete(id: string): boolean; sync(): void };
  /** /2 那把锁：挪光标 = 取消「凑满一份」；拨了长短旋钮 = 取消但不挪回一档；按下 / 松开；命令带上 half。 */
  half: { caretMoved(): void; knobTurned(): void; key(down: boolean): void; wrap(c: Command): Command };
  accKey(phase: "down" | "slide" | "up", acc: -2 | -1 | 1 | 2): void;
  stackKey(down: boolean): void;
  discloseArt(prev: EditorState, a: Mark): void;
  discloseDynOverride(prev: EditorState): void;
  /** 光标所在声部台上那位不认的记号。 */
  ignoredHere(): Mark[];
  hintRange(): HintRange;
  staves(): number;
  autoBars: { get(): boolean; set(on: boolean): void };
  insertMarkHere(kind: "key" | "time" | "tempo"): void;
  insertGrooveHere(): void;
  openRepeatMenu(): void;
  openInsertClefMenu(at: { x: number; y: number }): void;
  openInsertOttavaMenu(at: { x: number; y: number }): void;
  showPad(on: boolean): void;
}

export interface PadHostApi {
  pad: Pad;
  music: PadMusicHost;
  /** 电脑键盘的音键也走它：单音乐器的 50 ms 护栏（能叠音的声部照旧只记「按着」）。 */
  monoAccept(id: string): boolean;
  /** 一个键（手指 / 电脑键）松开了：不再按着（叠音的 B / 根音由 pad 的 onNoteUp 自己定；电脑键只记簿）。 */
  release(id: string): void;
  /** 失焦 / 页面隐藏：抬手的事件可能收不到——观望中的都按「键都松了」定下来（写成单个的音）、根音清空、按着的清空。 */
  reset(): void;
  /** 外接键盘（MIDI）按下一个音：绝对音高，不吃 pad 的升降锁；其余同 pad 音键（写 / 改 / 叠音观望 / 单声护栏 / 弹）。false = 单声护栏没收。 */
  noteDown(p: Pitch, id: string): boolean;
  noteUp(id: string): void;
}

interface ChordRoot { tokId: number; t: number; keyId?: string }
interface ChordWait { keyId: string; pitch: Pitch; t: number; root: ChordRoot & { keyId: string }; timer: number; done: boolean }

export function createPadHost(padEl: HTMLElement, g: PadGlue): PadHostApi {
  const st = (): EditorState => g.state();
  /** pad 上每根按着的手指：刚写的是第几个音（弹 = -1）、它原本的音高——上下滑过门槛时在它上面升 / 降。 */
  const padNotes = new Map<string, { index: number; base: Pitch }>();
  const monoHeld = new Set<string>();
  let monoAt = -Infinity;
  function monoAccept(id: string): boolean {
    const now = performance.now();
    if (monoClash(monoHeld.size, monoAt, now)) return false;
    monoHeld.add(id); monoAt = now; return true;
  }
  const chordRoots = new Map<string, { tokId: number; t: number }>();   // 按着的键 → 它写进谱的那个音（根音候选）
  let chordWaits: ChordWait[] = [];
  const tokIndex = (tokId: number): number => tr(st()).findIndex((t) => t.id === tokId);
  /** 现在的根音 = 最近写进谱、键还按着、音还在的那个。 */
  function chordRoot(): (ChordRoot & { keyId: string }) | null {
    let best: (ChordRoot & { keyId: string }) | null = null;
    for (const [keyId, r] of chordRoots) if (monoHeld.has(keyId) && tokIndex(r.tokId) >= 0 && (!best || r.t > best.t)) best = { ...r, keyId };
    return best;
  }
  /** 叠到根音上（XOR；按谱上的调号拼写）。根音没了 = false。 */
  function chordMerge(root: ChordRoot, pitch: Pitch): boolean {
    const s = st(), ri = tokIndex(root.tokId), t = tr(s)[ri];
    if (ri < 0 || t?.kind !== "note" || !t.pitch) return false;
    g.update(toggleChordPitch(s, ri, keySpell(pitch, keyAt(tr(s), ri))));
    return true;
  }
  /** 定一个观望中的：why = 谁先发生的（B 松 / 根音松 / 两个都按着够久了 / 又按了下一个键）。叠不成 = 现在把 B 当一个音补写进去。 */
  function decideChord(w: ChordWait, why: ChordWhy): void {
    if (w.done) return;
    const now = performance.now(), keyHeld = monoHeld.has(w.keyId), v = chordVerdict(w.root, w, now, why, monoHeld.has(w.root.keyId), keyHeld);   // 头 / 尾判据：src/keyboard/chords.ts
    if (v === null) return;   // 到时候了可有人松了：等松手那一下来定
    w.done = true; clearTimeout(w.timer); chordWaits = chordWaits.filter((x) => x !== w);
    if (v === "chord" && chordMerge(w.root, w.pitch)) return;
    const i = g.writeAndLocate((s) => writePitch(s, w.pitch, true));   // 两个音：现在补写（音高按下时就带好了 ♯ / ♭）
    if (i < 0) { if (st().sel) g.info("选区写满了：写不出选区。要往后写，先点别处退出选区"); return; }
    const t = tr(st())[i];
    if (keyHeld && t) chordRoots.set(w.keyId, { tokId: t.id, t: w.t });   // B 还按着：它成了下一个的根音
    g.afterWrite();
  }
  /** 把还在观望的都定下来（又按了一个键 = 按当前的；页面失焦 / 隐藏 = 键都算松了，写成单个的音）。 */
  function settleChords(why: "force" | "lost"): void {
    for (const w of [...chordWaits]) { if (why === "lost") { monoHeld.delete(w.root.keyId); } decideChord(w, "force"); }
  }
  /** 一个键松开：它是谁的 B / 谁的根音，就按这个定；它不再是根音。 */
  function chordKeyUp(id: string): void {
    for (const w of [...chordWaits]) { if (w.keyId === id) decideChord(w, "keyUp"); else if (w.root.keyId === id) decideChord(w, "rootUp"); }
    chordRoots.delete(id);
  }

  const music = createPadMusic(st);   // pad 的音乐知识（src/app/pad-music.ts）：第 k 级是什么音、「1=」的档；键盘只认 k
  /** 「弹」= 音键只响不写：顶栏开关，或找人视图 / 乐器页开着（试听台上那位）。读 finderShown() 不读 finder：pad 一创建就画「弹」钮，那时 finder 还没建。 */
  const padImpro = (): boolean => g.impro() || g.finderShown() || g.instShown();
  /** 写之前问一声：能叠音的声部同时多按都收（80 ms 内 = 叠在一起）；单声乐器几乎同时按下的第二根手指 = false（不写、不响、不亮）。 */
  const padAccept = (id: string): boolean => (g.canStack() ? (monoHeld.add(id), true) : monoAccept(id));
  /** pad 音键写一个音（找人视图开着一律不接：试听台不碰谱——user「试听的时候写入的东西不会不小心输入到乐谱吧…是不是应该disable」）：
   *  改这个音（只选了一个 / 叠亮着）/ 叠音观望（能叠音的声部）/ 普通写。 */
  function padWrite(p: Pitch, id: string, raw = false): void {
    if (g.finderOpen()) return;
    const now = performance.now(), s = st();
    { const one = singleSel(s); if (one >= 0) {   // 改这个音（只选了一个 / 叠亮着）：XOR（最后一个拿掉 = 一样长的休止，休止上按 = 变回音）；单声乐器 = 换音高
      g.update(writePitch(s, p, raw, !g.canStack())); padNotes.set(id, { index: one, base: p }); g.previewEdited(); return;
    } }
    if (g.canStack()) {
      settleChords("force");   // 又按下一个键：还在观望的先定（根音还按着 = 叠）
      const root = chordRoot();
      if (root) {
        const sp = raw ? p : soundingPitch(st(), p).pitch;
        padNotes.set(id, { index: -1, base: p });   // 先响（padSound 按 base 出声），进不进谱、叠不叠，等分出来再定
        if (chordHead(root, { t: now })) { chordMerge(root, sp); return; }   // 头：和根音几乎同时落下 = 马上叠
        const w: ChordWait = { keyId: id, pitch: sp, t: now, root, timer: 0, done: false };
        w.timer = window.setTimeout(() => decideChord(w, "both"), chordBothAfterMs(root, w));   // 重叠一超过根音单独按着的时长 = 叠（不用等松手）
        chordWaits.push(w);
        return;
      }
    }
    const i = g.writeAndLocate((x) => writePitch(x, p, raw, !g.canStack()));
    if (i < 0) { padNotes.set(id, { index: -1, base: p }); return; }
    const t = tr(st())[i];
    padNotes.set(id, { index: i, base: t?.kind === "note" && t.pitch ? t.pitch : p });
    if (g.canStack() && t) chordRoots.set(id, { tokId: t.id, t: now });
    g.afterWrite();
  }
  /** pad 音键出声：写进谱的那个音（和弦整个响）；弹 = 带上挂着的 ♯ / ♭、谱上画鬼音符。 */
  function padSound(p: Pitch, id: string, raw = false): void {
    const n = padNotes.get(id);
    if (n && n.index >= 0) g.soundTok(st(), n.index, id);
    else { const r = raw ? { pitch: p, st: st() } : soundingPitch(st(), p); if (!raw) g.update(r.st); padNotes.set(id, { index: -1, base: r.pitch }); g.sound.down(r.pitch, id); if (g.ghost.on()) { g.ghost.set(id, r.pitch); g.ghost.sync(); } }
  }
  /** 一个音键按下（pad 的第 k 级、MIDI 的琴键都走这里）：不在「弹」时先写（宿主不收 = false），再响。 */
  function noteDown(p: Pitch, id: string, raw = false): boolean {
    if (!padImpro()) { if (!padAccept(id)) return false; padWrite(p, id, raw); }
    padSound(p, id, raw);
    return true;
  }
  /** 先按松开的顺序定观望中的叠音（要看谁还按着），再放。 */
  function noteUp(id: string): void { chordKeyUp(id); padNotes.delete(id); monoHeld.delete(id); g.sound.up(id); if (g.ghost.delete(id)) g.ghost.sync(); }
  /** pad 发来的按键 id → 翻译（src/app/pad-keys.ts）→ 做：命令走 runPadCommand（锁 / 披露），插记号开记号框，开小菜单。找人视图开着一律不接。 */
  function padKey(id: string, mods: { ramp: boolean }): void {
    if (g.finderOpen()) return;
    const a = padKeyAction(id, mods);
    if (!a) { diagNote("pad", `unknown pad key ${id}`); return; }   // test/pad-keys.test.ts 守着每个格子都接了；真到这儿 = 键盘加了格子没登记
    if (a.kind === "cmd") runPadCommand(a.cmd);
    else if (a.kind === "mark") g.insertMarkHere(a.mark);
    else if (a.menu === "groove") g.insertGrooveHere();
    else if (a.menu === "repeat") g.openRepeatMenu();
    else { const r = padEl.getBoundingClientRect(), at = { x: r.left + r.width / 2, y: r.top - 4 }; if (a.menu === "clef") g.openInsertClefMenu(at); else g.openInsertOttavaMenu(at); }
  }
  /** pad 的编辑命令：锁（/2 的凑满一份）× 命令 → apply；做不成的说一句；写了的披露（不认的记号 / 被盖掉的力度）。 */
  function runPadCommand(c: Command): void {
    if (c.k === "caret") g.half.caretMoved();   // 挪光标 = 取消「凑满一份」（锁住的不动）
    const prev = st(), nx = apply(prev, g.half.wrap(c), performance.now());
    if (c.k === "art" && nx === prev) { g.info(c.a === "arpeggio" ? "琶音只挂在和弦上：光标前那个音（或选中的）是单音" : `${ART_NAME[c.a]}要挂在一个音上（光标前面是休止或者还没有音）`); return; }
    if (c.k === "slur" && nx === prev) { g.info("连线从一个音连到下一个音（光标前面是休止或者还没有音）"); return; }
    if (c.k === "inhale" && nx === prev) { g.info("出声的换气挂在一个音后面（光标前面是休止或者还没有音）"); return; }
    if (c.k === "swell" && nx === prev) { g.info("音内的起伏要挂在一个音上（光标前面是休止或者还没有音）"); return; }
    if (c.k === "wedge" && nx === prev) { g.info(`${c.w === "cresc" ? "渐强" : "渐弱"}从一个音到下一个音（光标前面是休止或者还没有音）`); return; }
    g.update(nx); if (c.k === "rest" || c.k === "extend") g.afterWrite();
    if (c.k === "backspace" || c.k === "delete") {   // 删音顺手湮灭了不再管任何音的力度记号 / 渐强渐弱：说一声（不静默；撤销能回来）
      const marks = (s: EditorState) => tr(s).filter((t) => t.kind === "dyn" || t.kind === "hairpin").length, gone = marks(prev) - marks(st()) - (prev.sel ? tr(prev).slice(prev.sel.from, prev.sel.to).filter((t) => t.kind === "dyn" || t.kind === "hairpin").length : 0);
      if (gone > 0) g.info(`顺手去掉了 ${gone} 个不再管任何音的力度记号 / 渐强渐弱（撤销能找回来）`);
    }
    if (c.k === "art") g.discloseArt(prev, c.a === "swellDown" ? "swellFade" : c.a === "swellUp" || c.a === "swellBoth" ? "swellGrow" : c.a);   // 音内起伏在演奏法里（v0.9.44），「做不到」的说法照旧按 swellGrow / swellFade
    if (c.k === "slur") g.discloseArt(prev, "slur");
    if (c.k === "inhale") g.discloseArt(prev, "inhale");
    if (c.k === "swell") g.discloseArt(prev, c.w === ">" ? "swellFade" : "swellGrow");
    if (c.k === "dyn" || (c.k === "art" && c.a === "fp")) g.discloseDynOverride(prev);
  }

  const pad = new Pad(padEl, {
    view: () => { const s = st(); return { unit: s.input.unit, tuplet: s.input.tuplet, acc: s.input.acc, accMode: s.input.accMode, one: singleSel(s) >= 0, hasSel: !!s.sel }; },
    music,
    isImpro: padImpro,
    onImpro: () => g.toggleImpro(),
    onKbSwitch: () => g.kbSwitch(),   // 小键盘顶上「符 / 音」：只换键盘（v0.10.37；模式条上只剩音 / 词 / 听）
    // 音键按下：第 k 级是什么音问 music；写（不在「弹」时；宿主不收 = false，pad 不亮）+ 响
    onNoteDown: (k, id) => noteDown(music.pitchAt(k), id),
    onNoteUp: (id) => noteUp(id),
    onStack: (down) => g.stackKey(down),
    canStack: () => g.canStack(),
    onAlter: (id, alt) => {
      if (g.finderOpen()) return;   // 临时离调：只管这一个音（滑回中间 = 还原）；重新唱一下让人听见
      const n = padNotes.get(id); if (!n) return;
      const np = alt ? alterBy(n.base, alt) : n.base;
      if (n.index >= 0) g.update(setNote(st(), n.index, { pitch: np }));
      g.sound.down(np, id);
    },
    onKey: (id, mods) => padKey(id, mods),
    onUnit: (u) => { g.half.knobTurned(); g.update(setUnit(st(), u)); },   // 拨了旋钮 = 照拨的，取消「凑满一份」（不挪回一档：旋钮说了算）
    onTuplet: (n) => g.update(setTuplet(st(), n)),
    onPick: (knob, i) => g.update(knob === "key" ? setInputKey(st(), music.fifthsAt(i)) : setInputScale(st(), music.scaleIdAt(i))),
    autoBars: () => g.autoBars.get(),
    staves: () => g.staves(),
    // 符号格的状态：这个格子写的记号台上这位不认 = 画灰（照样能写）；力度 = 光标处正生效的那个亮着（状态机）
    keyState: (id) => {
      const s = st(), mk = markOfKey(id), off = !!mk && g.ignoredHere().includes(mk);
      const on = id.startsWith("dyn:") && id.slice(4) === dynMarkAt(tr(s), s.sel ? s.sel.from : s.caret);
      return off || on ? { off, on } : undefined;
    },
    hintRange: () => g.hintRange(),
    onAutoBars: (on) => { g.autoBars.set(on); pad.render(); },
    onHide: () => g.showPad(false),
    onHalf: (down) => { if (g.finderOpen()) return; g.half.key(down); },
    onAccShift: (phase, acc) => g.accKey(phase, acc),   // 找人视图里也要能用：升降只改弹出来的音高，不碰谱
  });

  return {
    pad, music, monoAccept,
    release: (id) => { monoHeld.delete(id); },
    reset: () => { settleChords("lost"); chordRoots.clear(); monoHeld.clear(); },
    noteDown: (p, id) => noteDown(p, id, true),
    noteUp,
  };
}
