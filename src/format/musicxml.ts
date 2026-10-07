// musicxml.ts —— 一条声部的 token ↔ MusicXML 4.0（score-partwise）。created 2026-10-07 by Claude Opus 5.5
// 数据契约草稿（ai-docs/20261007-data-contract-draft.md）§4 的对照表落地：score.musicxml 是这首歌的正本，别的软件打开看到的就是真东西。
// 写：调号 / 拍号 / 速度 / 音符 / 休止 / 连音线 / 歌词（每个音节 xml:lang，持久化第 6 题）/ 人插的小节线；时值 = divisions 1680（= TPQ，几种连音都是整数）。
//   MusicXML 必须分小节：人插的小节线和按拍号自动断的都写成小节，哪些是人插的由调用方记进 .moonsinger/score.json；
//   音跨过自动断开的小节线 → 拆成几段用连音线连着，后面几段的 id 是「n17-2」，读回来时并回一个音（自家文件原样复原）。
// 读：自家文件按上面的规矩原样复原；别的软件存的尽量读（第一个声部、第一个 voice；读不了的东西数出来报给人，不静默丢）。
import { type Paper, STAFF_MM, DEFAULT_PAPER, paperOf, detectPaper } from "../score/paper.ts";
import { type Song, type Token, type NoteTok, TPQ, WHOLE, DEFAULT_KEY, DEFAULT_TIME, DEFAULT_BPM, headLen, effectivePitch } from "../score/song.ts";
import type { Pitch } from "../score/pitch.ts";
import { MELISMA_MARK } from "../score/lyrics.ts";
import { syllableLangs, keepOnlyOverrides } from "../score/lang.ts";
import { type El, esc, parseXml, kids, kid, childText, text } from "./xml.ts";

export interface PartInfo {
  id: string;               // "P1"
  name: string;             // 声部名 = 角色名（谱号前面那个）
  instrumentName: string;   // 上场的候选的名字（给别的软件看）
  sound: string;            // MusicXML 标准音色 id，如 voice.synth
  program: number;          // GM 音色号 1–128
  variant?: { library: string; name: string };   // <virtual-instrument>（我们的变体）
  volume?: number;          // 0–100（MusicXML <volume>）
  pan?: number;             // −90…90
}
export interface WriteMeta { software: string; date: string }
export interface Written { xml: string; manualBars: number[]; unwritten: string[] }

const measureLen = (beats: number, beatType: number) => (beats * WHOLE) / beatType;
const TYPES: [string, number][] = [["whole", WHOLE], ["half", WHOLE / 2], ["quarter", TPQ], ["eighth", TPQ / 2], ["16th", TPQ / 4], ["32nd", TPQ / 8], ["64th", TPQ / 16]];
const TUPLETS: [number, number][] = [[1, 1], [3, 2], [5, 4], [6, 4], [7, 4]];
/** 时值 → 显示用的 type / dot / 连音（只是显示；读的时候只认 duration）。凑不出来 = 不写 type（MusicXML 里它是可选的）。 */
function noteType(dur: number): { type: string; dots: number; tuplet: [number, number] | null } | null {
  for (const [act, norm] of TUPLETS) for (const [type, base] of TYPES) for (let dots = 0; dots <= 2; dots++) {
    if (Math.abs(base * (2 - 1 / 2 ** dots) * (norm / act) - dur) < 0.5) return { type, dots, tuplet: act === 1 ? null : [act, norm] };
  }
  return null;
}
const pitchXml = (p: Pitch) => `<pitch><step>${p.step}</step>${p.alter ? `<alter>${p.alter}</alter>` : ""}<octave>${p.octave}</octave></pitch>`;

/** 一条声部 → 整份 MusicXML。 */
/** 纸 → <defaults>：<scaling> = 五线谱多大（四个线间距 = STAFF_MM mm = 40 tenths），<page-layout> = 页宽高 + 四边边距（tenths）。 */
const TENTHS_PER_MM = 40 / STAFF_MM;
function defaultsXml(p: Paper): string {
  const t = (mm: number) => +(mm * TENTHS_PER_MM).toFixed(2), m = p.marginMm;
  return `<defaults><scaling><millimeters>${STAFF_MM}</millimeters><tenths>40</tenths></scaling><page-layout><page-height>${t(p.heightMm)}</page-height><page-width>${t(p.widthMm)}</page-width>` +
    `<page-margins type="both"><left-margin>${t(m.l)}</left-margin><right-margin>${t(m.r)}</right-margin><top-margin>${t(m.t)}</top-margin><bottom-margin>${t(m.b)}</bottom-margin></page-margins></page-layout></defaults>`;
}
/** <defaults> → 纸（按文件自己的 <scaling> 换成 mm 再认档）；没有页面设置 = undefined（= 默认 A5）。默认 A5 原样也记成 undefined（往返不多出字段）。 */
function readPaper(root: El): Paper | undefined {
  const d = kid(root, "defaults"), pl = kid(d, "page-layout");
  const n = (el: El | undefined, name: string) => { const v = childText(el, name); return v === undefined ? NaN : Number(v); };
  const mm = n(kid(d, "scaling"), "millimeters"), tn = n(kid(d, "scaling"), "tenths"), w = n(pl, "page-width"), h = n(pl, "page-height");
  if (!(mm > 0 && tn > 0 && w > 0 && h > 0)) return undefined;
  const k = mm / tn, pm = kid(pl, "page-margins"), mg = (name: string) => { const v = n(pm, name); return v >= 0 ? v * k : 15; };
  const p = detectPaper(w * k, h * k, { l: mg("left-margin"), r: mg("right-margin"), t: mg("top-margin"), b: mg("bottom-margin") });
  const def = paperOf(DEFAULT_PAPER), same = (a: number, b: number) => Math.abs(a - b) < 0.05;
  if (p.kind === DEFAULT_PAPER && same(p.marginMm.l, def.marginMm.l) && same(p.marginMm.r, def.marginMm.r) && same(p.marginMm.t, def.marginMm.t) && same(p.marginMm.b, def.marginMm.b)) return undefined;
  return p;
}
export function writeMusicXml(song: Song, part: PartInfo, meta: WriteMeta): Written {
  const toks = song.tokens, head = headLen(toks);
  const H = { fifths: DEFAULT_KEY, beats: DEFAULT_TIME.beats, beatType: DEFAULT_TIME.beatType, bpm: DEFAULT_BPM };
  for (let i = 0; i < head; i++) { const t = toks[i]; if (t.kind === "key") H.fifths = t.fifths; else if (t.kind === "time") { H.beats = t.beats; H.beatType = t.beatType; } else if (t.kind === "tempo") H.bpm = t.bpm; }
  const langs = syllableLangs(toks);
  const measures: { body: string[]; manual: boolean }[] = [];
  let cur: string[] = [], ticks = 0, len = measureLen(H.beats, H.beatType);
  const close = (manual: boolean) => { measures.push({ body: cur, manual }); cur = []; ticks = 0; };
  const tempoXml = (bpm: number) => `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${bpm}</per-minute></metronome></direction-type><sound tempo="${bpm}"/></direction>`;
  cur.push(`<attributes><divisions>${TPQ}</divisions><key><fifths>${H.fifths}</fifths></key><time><beats>${H.beats}</beats><beat-type>${H.beatType}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`, tempoXml(H.bpm));
  // 歌词的 syllabic：按「这个词没完」（hyph）推；拖腔记号不打断一个词
  let prevHyph = false;
  const syllabic = (t: NoteTok) => { const s = t.hyph ? (prevHyph ? "middle" : "begin") : (prevHyph ? "end" : "single"); prevHyph = !!t.hyph; return s; };
  const unwritten: string[] = [];
  const nextTimed = (i: number) => { for (let j = i + 1; j < toks.length; j++) { const t = toks[j]; if (t.kind === "note" || t.kind === "rest") return t; } return null; };
  for (let i = head; i < toks.length; i++) {
    const t = toks[i];
    if (t.kind === "bar") { close(true); continue; }
    if (t.kind === "key" || t.kind === "time" || t.kind === "tempo") {
      if (ticks >= len || (t.kind === "time" && ticks > 0)) close(false);   // 满了的小节先断开；拍号变了从新小节开始
      if (t.kind === "key") cur.push(`<attributes><key><fifths>${t.fifths}</fifths></key></attributes>`);
      else if (t.kind === "time") { cur.push(`<attributes><time><beats>${t.beats}</beats><beat-type>${t.beatType}</beat-type></time></attributes>`); len = measureLen(t.beats, t.beatType); }
      else cur.push(tempoXml(t.bpm));
      continue;
    }
    if (t.kind !== "note" && t.kind !== "rest") continue;
    let left = t.dur, k = 0;
    const tieOut = t.kind === "note" && nextTimed(i)?.kind === "note" && (nextTimed(i) as NoteTok).tie;
    let lyricDone = false;
    while (left > 0.5) {
      if (ticks >= len) close(false);
      const piece = Math.min(left, len - ticks), first = k === 0, last = left - piece <= 0.5;
      const ty = noteType(piece);
      const id = `${t.kind === "note" ? "n" : "r"}${t.id}${first ? "" : `-${k + 1}`}`;
      let x = `<note id="${id}">`;
      if (t.kind === "rest") x += `<rest/><duration>${Math.round(piece)}</duration>`;
      else {
        const tieIn = first ? !!t.tie : true, tieOn = last ? tieOut : true;
        x += pitchXml(effectivePitch(toks, i)) + `<duration>${Math.round(piece)}</duration>` + (tieIn ? `<tie type="stop"/>` : "") + (tieOn ? `<tie type="start"/>` : "");
      }
      x += `<voice>1</voice>`;
      if (ty) x += `<type>${ty.type}</type>` + "<dot/>".repeat(ty.dots) + (ty.tuplet ? `<time-modification><actual-notes>${ty.tuplet[0]}</actual-notes><normal-notes>${ty.tuplet[1]}</normal-notes></time-modification>` : "");
      if (t.kind === "note") {
        const tieIn = first ? !!t.tie : true, tieOn = last ? tieOut : true;
        if (tieIn || tieOn) x += `<notations>${tieIn ? `<tied type="stop"/>` : ""}${tieOn ? `<tied type="start"/>` : ""}</notations>`;
        if (!lyricDone && t.lyric) {
          if (t.lyric === MELISMA_MARK) x += `<lyric number="1"><extend/></lyric>`;
          else x += `<lyric number="1"><syllabic>${syllabic(t)}</syllabic><text xml:lang="${esc(langs[i] ?? "ja")}">${esc(t.lyric)}</text></lyric>`;
        }
        lyricDone = true;
      }
      x += `</note>`;
      cur.push(x);
      ticks += piece; left -= piece; k++;
    }
    if (t.kind === "note" && !t.pitch) unwritten.push(`n${t.id}`);
  }
  if (cur.length || !measures.length) close(false);
  const manualBars: number[] = [];
  const body = measures.map((m, n) => { if (m.manual) manualBars.push(n + 1); return `<measure number="${n + 1}">${m.body.join("")}</measure>`; }).join("\n");
  const P = part;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
${song.title ? `<work><work-title>${esc(song.title)}</work-title></work>\n` : ""}<identification><encoding><software>${esc(meta.software)}</software><encoding-date>${esc(meta.date)}</encoding-date></encoding></identification>
${defaultsXml(song.paper ?? paperOf(DEFAULT_PAPER))}
<part-list><score-part id="${P.id}"><part-name>${esc(P.name)}</part-name><score-instrument id="${P.id}-I1"><instrument-name>${esc(P.instrumentName)}</instrument-name><instrument-sound>${esc(P.sound)}</instrument-sound>${P.variant ? `<virtual-instrument><virtual-library>${esc(P.variant.library)}</virtual-library><virtual-name>${esc(P.variant.name)}</virtual-name></virtual-instrument>` : ""}</score-instrument><midi-instrument id="${P.id}-I1"><midi-program>${P.program}</midi-program>${P.volume !== undefined ? `<volume>${P.volume}</volume>` : ""}${P.pan !== undefined ? `<pan>${P.pan}</pan>` : ""}</midi-instrument></score-part></part-list>
<part id="${P.id}">
${body}
</part>
</score-partwise>
`;
  return { xml, manualBars, unwritten };
}

export interface ReadPart { id: string; name: string; instrumentName?: string; program?: number; variant?: string; volume?: number; pan?: number }
export interface Read { song: Song; title: string; parts: ReadPart[]; dropped: Record<string, number> }
export interface ReadHints { manualBars?: number[]; unwritten?: string[] }   // 自家文件的 .moonsinger/score.json；别家文件 = 没有

/** MusicXML → 第一个声部的 token。hints 没给（别的软件存的）= 每条小节线都当人插的（编辑器现在只画人插的小节线）。 */
export function readMusicXml(xml: string, hints?: ReadHints): Read {
  const root = parseXml(xml);
  if (root.name === "score-timewise") throw new Error("这份 MusicXML 是 timewise 排法，这一版只读 partwise");
  if (root.name !== "score-partwise") throw new Error(`这不是 MusicXML 乐谱（根元素是 <${root.name}>）`);
  const dropped: Record<string, number> = {};
  const drop = (what: string) => { dropped[what] = (dropped[what] ?? 0) + 1; };
  const parts: ReadPart[] = kids(kid(root, "part-list"), "score-part").map((sp) => {
    const si = kid(sp, "score-instrument"), mi = kid(sp, "midi-instrument"), vi = kid(si, "virtual-instrument");
    const num = (s?: string) => (s === undefined || s === "" ? undefined : Number(s));
    return { id: sp.attrs.id, name: childText(sp, "part-name") ?? "", instrumentName: childText(si, "instrument-name"), program: num(childText(mi, "midi-program")),
      variant: childText(vi, "virtual-name"), volume: num(childText(mi, "volume")), pan: num(childText(mi, "pan")) };
  });
  const partEls = kids(root, "part");
  if (!partEls.length) throw new Error("这份 MusicXML 里没有声部");
  if (partEls.length > 1) dropped["其余声部（这一版只编辑第一个声部）"] = partEls.length - 1;
  const title = childText(kid(root, "work"), "work-title") ?? childText(root, "movement-title") ?? "";
  const manual = hints?.manualBars ? new Set(hints.manualBars) : null, unwritten = new Set(hints?.unwritten ?? []);
  const H = { fifths: DEFAULT_KEY, beats: DEFAULT_TIME.beats, beatType: DEFAULT_TIME.beatType, bpm: DEFAULT_BPM, gotKey: false, gotTime: false, gotTempo: false };
  // 谱头 = 第一个音之前、每种记号第一次出现的那个；同一种再出现（谱头后面紧跟着插的）= 记号 token
  const body: Token[] = [], langRead = new Map<Token, string>();
  let headPhase = true, divisions = TPQ, voice: string | null = null;
  const usedIds = new Set<number>();
  const takeId = (s: string | undefined): number | null => { const m = s ? /^[nr](\d+)$/.exec(s) : null; if (!m) return null; const n = +m[1]; if (usedIds.has(n)) return null; usedIds.add(n); return n; };
  const tempoOf = (el: El): number | null => { const s = el.name === "sound" ? el : kid(el, "sound"); const v = s?.attrs.tempo; return v ? Math.round(Number(v)) : null; };
  const mark = (t: Token) => { body.push(t); };
  kids(partEls[0], "measure").forEach((m, mi) => {
    for (const c of kids(m)) {
      if (c.name === "attributes") {
        const d = childText(c, "divisions"); if (d) divisions = Number(d);
        const key = kid(c, "key"), time = kid(c, "time");
        if (key && childText(key, "fifths") !== undefined) { const f = Number(childText(key, "fifths")); if (headPhase && !H.gotKey) { H.fifths = f; H.gotKey = true; } else mark({ kind: "key", id: 0, fifths: f }); }
        if (time && childText(time, "beats")) { const b = Number(childText(time, "beats")), bt = Number(childText(time, "beat-type")); if (headPhase && !H.gotTime) { H.beats = b; H.beatType = bt; H.gotTime = true; } else mark({ kind: "time", id: 0, beats: b, beatType: bt }); }
      } else if (c.name === "direction" || c.name === "sound") {
        const bpm = tempoOf(c);
        if (bpm) { if (headPhase && !H.gotTempo) { H.bpm = bpm; H.gotTempo = true; } else mark({ kind: "tempo", id: 0, bpm }); }
      } else if (c.name === "note") {
        if (kid(c, "grace")) { drop("装饰音"); continue; }
        if (kid(c, "cue")) { drop("提示音符"); continue; }
        const v = childText(c, "voice") ?? "1"; if (voice === null) voice = v;
        if (v !== voice) { drop("同一声部里的第二条旋律"); continue; }
        if (kid(c, "chord")) { drop("叠音（同时响的音）"); continue; }
        headPhase = false;
        const dur = Math.round((Number(childText(c, "duration") ?? "0") * TPQ) / divisions);
        if (dur <= 0) continue;
        const idAttr = c.attrs.id, cont = idAttr ? /^([nr])(\d+)-\d+$/.exec(idAttr) : null;
        const prev = body[body.length - 1];
        if (cont && prev && (prev.kind === "note" || prev.kind === "rest") && prev.id === +cont[2] && (cont[1] === "n") === (prev.kind === "note")) { prev.dur += dur; continue; }   // 自家拆开的那几段并回去
        const isRest = !!kid(c, "rest");
        if (isRest) { mark({ kind: "rest", id: takeId(idAttr) ?? 0, dur }); continue; }
        const pe = kid(c, "pitch");
        if (!pe) { drop("没有音高的音（打击乐）"); continue; }
        const pitch: Pitch = { step: (childText(pe, "step") ?? "C") as Pitch["step"], alter: Number(childText(pe, "alter") ?? "0"), octave: Number(childText(pe, "octave") ?? "4") };
        const tok: NoteTok = { kind: "note", id: takeId(idAttr) ?? 0, pitch: unwritten.has(idAttr ?? "") ? null : pitch, dur, lyric: null };
        if (kids(c, "tie").some((t) => t.attrs.type === "stop")) tok.tie = true;
        const lyrics = kids(c, "lyric"), ly = lyrics.find((l) => (l.attrs.number ?? "1") === "1") ?? lyrics[0];
        if (lyrics.length > 1) drop("第二段及以后的歌词");
        if (ly) {
          const tx = kid(ly, "text");
          if (tx) {
            tok.lyric = text(tx);
            const syl = childText(ly, "syllabic"); if (syl === "begin" || syl === "middle") tok.hyph = true;
            if (tx.attrs["xml:lang"]) langRead.set(tok, tx.attrs["xml:lang"]);
          } else if (kid(ly, "extend")) tok.lyric = MELISMA_MARK;
        }
        mark(tok);
      } else if (c.name === "backup" || c.name === "forward") { /* 第二条旋律的定位，跟着那些音一起不读 */ }
      else if (c.name === "harmony") drop("和弦记号");
    }
    const n = Number(m.attrs.number ?? mi + 1);
    if (manual ? manual.has(n) : mi < kids(partEls[0], "measure").length - 1) body.push({ kind: "bar", id: 0 });
  });
  const tokens: Token[] = [{ kind: "key", id: 0, fifths: H.fifths }, { kind: "time", id: 0, beats: H.beats, beatType: H.beatType }, { kind: "tempo", id: 0, bpm: H.bpm }, ...body];
  let next = Math.max(0, ...usedIds) + 1;
  for (const t of tokens) if (!t.id) t.id = next++;
  keepOnlyOverrides(tokens, tokens.map((t) => langRead.get(t) ?? null));
  const paper = readPaper(root);
  return { song: { ...(title ? { title } : {}), ...(paper ? { paper } : {}), hum: "n", tokens }, title, parts, dropped };
}
