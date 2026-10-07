// src/version.ts
var APP_VERSION = "v0.2.15-2026-10-07";

// src/app/pwa-shell.ts
var LOCAL_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1", ""]);
var SHELL_CACHE_PREFIX = "moonsinger-";
function initPwaShell(opts) {
  const isDevRoute = location.pathname.includes("/dev/") || LOCAL_HOSTS.has(location.hostname);
  let registration = null;
  async function reload() {
    try {
      await opts.onBeforeReload?.();
    } catch {
    }
    const reg = registration ?? await navigator.serviceWorker?.getRegistration() ?? null;
    if (!reg || !reg.waiting) {
      location.reload();
      return;
    }
    let done = false;
    const doReload = () => {
      if (done) return;
      done = true;
      location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", doReload, { once: true });
    reg.waiting.postMessage({ type: "skip-waiting" });
    setTimeout(doReload, 5e3);
  }
  async function forceReset() {
    const settle = (p, ms) => Promise.race([Promise.resolve(p).catch(() => void 0), new Promise((r) => setTimeout(r, ms))]);
    await settle(opts.onBeforeReload?.(), 4e3);
    try {
      if (navigator.serviceWorker) {
        const r = await navigator.serviceWorker.getRegistration();
        if (r) await r.unregister().catch(() => {
        });
      }
      if (typeof caches !== "undefined") for (const k of await caches.keys()) {
        if (k.startsWith(SHELL_CACHE_PREFIX)) await caches.delete(k).catch(() => {
        });
      }
    } catch {
    }
    const target = `${location.pathname}?reset=${Date.now()}`;
    setTimeout(() => location.replace(target), 150);
    setTimeout(() => {
      location.href = target;
    }, 2500);
  }
  async function checkForUpdate() {
    const reg = registration ?? await navigator.serviceWorker?.getRegistration() ?? null;
    if (!reg) return "unavailable";
    if (reg.waiting) return "found";
    try {
      await reg.update();
    } catch {
      return "unavailable";
    }
    if (reg.waiting) return "found";
    const sw = reg.installing;
    if (!sw) return "latest";
    return await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(reg.waiting ? "found" : "latest"), 15e3);
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed") {
          clearTimeout(timer);
          resolve("found");
        } else if (sw.state === "redundant") {
          clearTimeout(timer);
          resolve("latest");
        }
      });
    });
  }
  const onFg = () => {
    registration?.update().catch(() => {
    });
    opts.onForeground?.();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") onFg();
  });
  window.addEventListener("focus", onFg);
  if ("serviceWorker" in navigator && !LOCAL_HOSTS.has(location.hostname)) {
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data?.type === "asset-updated") opts.onUpdateAvailable();
    });
    navigator.serviceWorker.register("./service-worker.js").then((reg) => {
      registration = reg;
      if (reg.waiting && navigator.serviceWorker.controller) opts.onUpdateAvailable();
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) opts.onUpdateAvailable();
        });
      });
      setInterval(() => {
        reg.update().catch(() => {
        });
      }, 10 * 60 * 1e3);
    }).catch((err2) => {
      console.warn("[pwa] SW register failed", err2);
    });
  }
  return { isDevRoute, reload, forceReset, checkForUpdate };
}

// src/score/pitch.ts
var STEPS = ["C", "D", "E", "F", "G", "A", "B"];
var STEP_SEMI = [0, 2, 4, 5, 7, 9, 11];
var HOME = { step: "D", alter: 0, octave: 4 };
var stepIndex = (s) => STEPS.indexOf(s);
function midiOf(p) {
  return (p.octave + 1) * 12 + STEP_SEMI[stepIndex(p.step)] + p.alter;
}
function diatonicIndex(p) {
  return p.octave * 7 + stepIndex(p.step);
}
var SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
var FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];
function keyAlter(step, fifths) {
  if (fifths > 0) return SHARP_ORDER.slice(0, fifths).includes(step) ? 1 : 0;
  if (fifths < 0) return FLAT_ORDER.slice(0, -fifths).includes(step) ? -1 : 0;
  return 0;
}
function tonicStepIndex(fifths) {
  return (4 * fifths % 7 + 7) % 7;
}
function fromDiatonic(d2, fifths) {
  const octave = Math.floor(d2 / 7), step = STEPS[(d2 % 7 + 7) % 7];
  return { step, alter: keyAlter(step, fifths), octave };
}
function degreeStepIndex(degree2, fifths) {
  return (tonicStepIndex(fifths) + degree2 - 1) % 7;
}
function placeDegree(degree2, fifths, prev, dir) {
  const s = degreeStepIndex(degree2, fifths);
  const ref = diatonicIndex(prev ?? HOME);
  const base2 = Math.floor(ref / 7) * 7 + s;
  const cands = [base2 - 7, base2, base2 + 7];
  let d2;
  if (dir === "near") d2 = cands.reduce((a, b) => Math.abs(b - ref) < Math.abs(a - ref) ? b : a);
  else if (dir === "up") d2 = cands.find((c) => c > ref);
  else d2 = [...cands].reverse().find((c) => c < ref);
  return fromDiatonic(d2, fifths);
}
function stepBy(p, steps, fifths) {
  return fromDiatonic(diatonicIndex(p) + steps, fifths);
}
function alterBy(p, d2) {
  return { ...p, alter: Math.max(-2, Math.min(2, p.alter + d2)) };
}
function spellMidi(midi, fifths, prefer = fifths < 0 ? -1 : 1) {
  const cands = [];
  for (const step of STEPS) for (let o = Math.floor(midi / 12) - 2; o <= Math.floor(midi / 12); o++) {
    const alter = midi - midiOf({ step, alter: 0, octave: o });
    if (Math.abs(alter) <= 1) cands.push({ step, alter, octave: o });
  }
  return cands.find((p) => p.alter === keyAlter(p.step, fifths)) ?? cands.find((p) => p.alter === prefer) ?? cands.find((p) => p.alter === 0) ?? cands[0];
}
function transposeSemis(p, semis, fifths) {
  return semis === 0 ? p : spellMidi(midiOf(p) + semis, fifths, semis > 0 ? 1 : -1);
}
function transposeInterval(p, steps, semis) {
  const d2 = diatonicIndex(p) + steps, step = STEPS[(d2 % 7 + 7) % 7], octave = Math.floor(d2 / 7);
  return { step, alter: midiOf(p) + semis - midiOf({ step, alter: 0, octave }), octave };
}
function keyInterval(f0, f1) {
  let semis = (7 * (f1 - f0) % 12 + 12) % 12;
  if (semis > 6) semis -= 12;
  let steps = ((tonicStepIndex(f1) - tonicStepIndex(f0)) % 7 + 7) % 7;
  if (semis < 0 && steps > 0) steps -= 7;
  return { steps, semis };
}
function octaveBy(p, d2) {
  return { ...p, octave: p.octave + d2 };
}
function pitchName(p) {
  return `${p.step}${p.alter > 0 ? "#".repeat(p.alter) : "b".repeat(-p.alter)}${p.octave}`;
}
var KEY_LABEL = { [-7]: "C\u266D", [-6]: "G\u266D", [-5]: "D\u266D", [-4]: "A\u266D", [-3]: "E\u266D", [-2]: "B\u266D", [-1]: "F", 0: "C", 1: "G", 2: "D", 3: "A", 4: "E", 5: "B", 6: "F\u266F", 7: "C\u266F" };

// src/score/song.ts
var TPQ = 1680;
var WHOLE = TPQ * 4;
var LADDER = [TPQ / 8, TPQ / 4, TPQ / 2, TPQ, TPQ * 2, WHOLE];
var DEFAULT_UNIT = 2;
var TUPLET = { 3: [2, 3], 5: [4, 5], 6: [4, 6], 7: [4, 7] };
var MIN_DUR = TPQ / 8 * 4 / 7;
var MAX_DUR = WHOLE * 4;
var DEFAULT_KEY = 0;
var DEFAULT_TIME = { beats: 4, beatType: 4 };
var DEFAULT_BPM = 90;
function emptySong(m = {}) {
  return { hum: "n", tokens: [
    // 哼的字默认「嗯」（user 2026-10-07「月读不是有啦嗯哦吗，默认嗯」）
    { kind: "key", id: 1, fifths: m.fifths ?? DEFAULT_KEY },
    { kind: "time", id: 2, beats: m.beats ?? DEFAULT_TIME.beats, beatType: m.beatType ?? DEFAULT_TIME.beatType },
    { kind: "tempo", id: 3, bpm: m.bpm ?? DEFAULT_BPM }
  ] };
}
function initInput() {
  return { unit: DEFAULT_UNIT, tuplet: 0, acc: 0, accMode: "off", accAt: 0, inputFifths: 0, inputScale: "major" };
}
function initState(song = emptySong()) {
  const maxId = song.tokens.reduce((m, t) => Math.max(m, t.id), 0);
  return { song, caret: song.tokens.length, sel: null, nextId: maxId + 1, log: [], input: initInput() };
}
var isTimed = (t) => t.kind === "note" || t.kind === "rest";
var isMark = (t) => t.kind === "key" || t.kind === "time" || t.kind === "tempo";
function headLen(tokens) {
  let n2 = 0;
  while (n2 < tokens.length && isMark(tokens[n2])) n2++;
  return n2;
}
function currentIndex(st2) {
  for (let i = st2.caret - 1; i >= 0; i--) if (isTimed(st2.song.tokens[i])) return i;
  return -1;
}
function prevPitch(tokens, i) {
  for (let j = i - 1; j >= 0; j--) {
    const t = tokens[j];
    if (t.kind === "note" && t.pitch) return t.pitch;
  }
  return null;
}
function effectivePitch(tokens, i) {
  const t = tokens[i];
  if (t.kind === "note" && t.pitch) return t.pitch;
  return prevPitch(tokens, i) ?? HOME;
}
function keyAt(song, i) {
  let f = DEFAULT_KEY;
  for (let j = 0; j < i && j < song.tokens.length; j++) {
    const t = song.tokens[j];
    if (t.kind === "key") f = t.fifths;
  }
  return f;
}
function timeAt(song, i) {
  let v = DEFAULT_TIME;
  for (let j = 0; j < i && j < song.tokens.length; j++) {
    const t = song.tokens[j];
    if (t.kind === "time") v = t;
  }
  return { beats: v.beats, beatType: v.beatType };
}
function tempoAt(song, i) {
  let v = DEFAULT_BPM;
  for (let j = 0; j < i && j < song.tokens.length; j++) {
    const t = song.tokens[j];
    if (t.kind === "tempo") v = t.bpm;
  }
  return v;
}
var TEMPO_WORDS = [
  { from: 0, it: "Largo", zh: "\u5E7F\u677F", typical: 50 },
  { from: 60, it: "Larghetto", zh: "\u5C0F\u5E7F\u677F", typical: 63 },
  { from: 66, it: "Adagio", zh: "\u67D4\u677F", typical: 70 },
  { from: 76, it: "Andante", zh: "\u884C\u677F", typical: 88 },
  { from: 100, it: "Moderato", zh: "\u4E2D\u677F", typical: 108 },
  { from: 112, it: "Allegretto", zh: "\u5C0F\u5FEB\u677F", typical: 116 },
  { from: 120, it: "Allegro", zh: "\u5FEB\u677F", typical: 132 },
  { from: 156, it: "Vivace", zh: "\u6D3B\u677F", typical: 160 },
  { from: 176, it: "Presto", zh: "\u6025\u677F", typical: 184 },
  { from: 200, it: "Prestissimo", zh: "\u6700\u6025\u677F", typical: 208 }
];
function tempoWord(bpm) {
  let w = TEMPO_WORDS[0];
  for (const x of TEMPO_WORDS) if (bpm >= x.from) w = x;
  return w;
}
function beatTicks(beats, beatType) {
  return beatType === 8 && beats > 3 && beats % 3 === 0 ? WHOLE * 3 / 8 : WHOLE / beatType;
}
var inputKey = (st2) => st2.input.inputFifths;
function unitDur(input) {
  const plain = LADDER[input.unit];
  if (!input.tuplet) return plain;
  const [m, n2] = TUPLET[input.tuplet];
  return plain * m / n2;
}
var indexOfId = (tokens, id) => tokens.findIndex((t) => t.id === id);
function next(st2, tokens, patch = {}) {
  const caret = Math.max(headLen(tokens), Math.min(tokens.length, patch.caret ?? st2.caret));
  return { ...st2, ...patch, song: { ...st2.song, tokens }, caret };
}
var leave = (st2) => st2.log.length ? { ...st2, log: [] } : st2;
var validDur = (d2) => Number.isInteger(d2) && d2 >= MIN_DUR && d2 <= MAX_DUR;
function soundingPitch(st2, p) {
  if (!st2.input.acc) return { pitch: p, st: st2 };
  return { pitch: applyAcc(p, st2.input), st: { ...st2, input: consumeAcc(st2.input) } };
}
function consumeAcc(input) {
  return input.accMode === "once" ? { ...input, acc: 0, accMode: "off" } : input;
}
function applyAcc(p, input) {
  return input.acc ? alterBy(p, input.acc) : p;
}
function fillTarget(st2) {
  for (let i = st2.caret; i < st2.song.tokens.length; i++) {
    const t = st2.song.tokens[i];
    if (t.kind === "bar" || isMark(t)) continue;
    return t.kind === "note" && t.pitch === null ? i : -1;
  }
  return -1;
}
function writePitch(st2, pitch0) {
  const pitch = applyAcc(pitch0, st2.input), input = consumeAcc(st2.input);
  if (st2.sel) return overwritePitch({ ...st2, input }, pitch);
  const f = fillTarget(st2);
  if (f >= 0) {
    const t = st2.song.tokens[f], tokens2 = st2.song.tokens.slice();
    tokens2[f] = { ...t, pitch };
    return next(st2, tokens2, { caret: f + 1, input, log: [...st2.log, { k: "fill", id: t.id, unit: t.dur }] });
  }
  const dur = unitDur(st2.input), id = st2.nextId, tokens = st2.song.tokens.slice();
  tokens.splice(st2.caret, 0, { kind: "note", id, pitch, dur, lyric: null });
  return next(st2, tokens, { caret: st2.caret + 1, nextId: id + 1, input, log: [...st2.log, { k: "ins", id, unit: dur }] });
}
function writeDegree(st2, degree2, dir) {
  let at;
  if (st2.sel) at = firstNoteIn(st2);
  else {
    const f = fillTarget(st2);
    at = f >= 0 ? f : st2.caret;
  }
  if (at < 0) return st2;
  return writePitch(st2, placeDegree(degree2, inputKey(st2), prevPitch(st2.song.tokens, at), dir));
}
function writeRest(st2) {
  if (st2.sel) return st2;
  const dur = unitDur(st2.input), id = st2.nextId, tokens = st2.song.tokens.slice();
  tokens.splice(st2.caret, 0, { kind: "rest", id, dur });
  return next(st2, tokens, { caret: st2.caret + 1, nextId: id + 1, log: [...st2.log, { k: "ins", id, unit: dur }] });
}
function writeBar(st2) {
  const at = st2.sel ? st2.sel.to : st2.caret, id = st2.nextId, tokens = st2.song.tokens.slice();
  tokens.splice(at, 0, { kind: "bar", id });
  return next(st2, tokens, { caret: at + 1, sel: null, nextId: id + 1, log: [] });
}
function writeMark(st2, v) {
  const at = st2.sel ? st2.sel.from : st2.caret, tokens = st2.song.tokens;
  let a = at, b = at;
  while (a > 0 && isMark(tokens[a - 1])) a--;
  while (b < tokens.length && isMark(tokens[b])) b++;
  for (let i = a; i < b; i++) if (tokens[i].kind === v.kind) return { st: setMark({ ...leave(st2), sel: null }, i, v), index: i, fresh: false };
  const id = st2.nextId, nt = tokens.slice();
  nt.splice(at, 0, { ...v, id });
  return { st: next(st2, nt, { caret: at + 1, sel: null, nextId: id + 1, log: [] }), index: at, fresh: true };
}
function setMark(st2, i, v) {
  const t = st2.song.tokens[i];
  if (!t || t.kind !== v.kind) return st2;
  const nt = st2.song.tokens.slice();
  nt[i] = { ...v, id: t.id };
  return next(st2, nt, {});
}
function deleteMark(st2, i) {
  const t = st2.song.tokens[i];
  if (!t || !isMark(t) || i < headLen(st2.song.tokens)) return st2;
  const nt = st2.song.tokens.slice();
  nt.splice(i, 1);
  return next(st2, nt, { caret: i < st2.caret ? st2.caret - 1 : st2.caret, sel: null });
}
function extend(st2) {
  if (st2.sel) return mapSelDur(st2, (d3) => d3 + unitDur(st2.input));
  const tokens = st2.song.tokens;
  let target = -1, unit = unitDur(st2.input);
  for (let k = st2.log.length - 1; k >= 0 && target < 0; k--) {
    const e = st2.log[k], i = indexOfId(tokens, e.id);
    if (i < 0) continue;
    target = i;
    for (let q = k; q >= 0; q--) {
      const f = st2.log[q];
      if (f.id === e.id && f.k !== "ext") {
        unit = f.unit;
        break;
      }
    }
  }
  if (target < 0) target = currentIndex(st2);
  if (target < 0) return st2;
  const t = tokens[target];
  const barBetween = tokens.slice(target + 1, st2.caret).some((x) => x.kind === "bar");
  if (barBetween) {
    const id = st2.nextId, nt2 = tokens.slice();
    const tok = t.kind === "note" ? { kind: "note", id, pitch: t.pitch, dur: unit, lyric: null, tie: true } : { kind: "rest", id, dur: unit };
    nt2.splice(st2.caret, 0, tok);
    return next(st2, nt2, { caret: st2.caret + 1, nextId: id + 1, log: [...st2.log, { k: "tie", id, unit }] });
  }
  const d2 = t.dur + unit;
  if (!validDur(d2)) return st2;
  const nt = tokens.slice();
  nt[target] = { ...t, dur: d2 };
  return next(st2, nt, { log: [...st2.log, { k: "ext", id: t.id, by: unit }] });
}
function backspace(st2) {
  if (st2.sel) return deleteSel(st2);
  const tokens = st2.song.tokens;
  while (st2.log.length) {
    const e = st2.log[st2.log.length - 1], log = st2.log.slice(0, -1), i = indexOfId(tokens, e.id);
    if (i < 0) {
      st2 = { ...st2, log };
      continue;
    }
    const nt2 = tokens.slice();
    if (e.k === "ext") {
      const t = nt2[i];
      nt2[i] = { ...t, dur: t.dur - e.by };
      return next(st2, nt2, { log });
    }
    if (e.k === "fill") {
      const t = nt2[i];
      nt2[i] = { ...t, pitch: null };
      return next(st2, nt2, { log, caret: i });
    }
    nt2.splice(i, 1);
    return next(st2, nt2, { log, caret: i < st2.caret ? st2.caret - 1 : st2.caret });
  }
  if (st2.caret <= headLen(tokens)) return st2;
  const nt = tokens.slice();
  nt.splice(st2.caret - 1, 1);
  return next(st2, nt, { caret: st2.caret - 1 });
}
function deleteForward(st2) {
  if (st2.sel) return deleteSel(st2);
  if (st2.caret >= st2.song.tokens.length) return st2;
  const nt = st2.song.tokens.slice();
  nt.splice(st2.caret, 1);
  return next(leave(st2), nt);
}
function setUnit(st2, unit) {
  return { ...st2, input: { ...st2.input, unit: Math.max(0, Math.min(LADDER.length - 1, unit)) } };
}
function shorter(st2) {
  if (st2.sel) return mapSelDur(st2, (d2) => d2 / 2);
  return st2.input.unit > 0 ? { ...st2, input: { ...st2.input, unit: st2.input.unit - 1 } } : st2;
}
function longer(st2) {
  if (st2.sel) return mapSelDur(st2, (d2) => d2 * 2);
  return st2.input.unit < LADDER.length - 1 ? { ...st2, input: { ...st2.input, unit: st2.input.unit + 1 } } : st2;
}
function setTuplet(st2, n2) {
  return { ...st2, input: { ...st2.input, tuplet: n2 } };
}
function tapAcc(st2, acc, now) {
  if (st2.sel) return mapSelPitch(st2, (p) => alterBy(p, acc));
  const i = st2.input;
  if (i.acc !== acc || i.accMode === "off") return { ...st2, input: { ...i, acc, accMode: "once", accAt: now } };
  if (i.accMode === "once" && now - i.accAt < 350) return { ...st2, input: { ...i, accMode: "lock", accAt: now } };
  return { ...st2, input: { ...i, acc: 0, accMode: "off", accAt: now } };
}
function setInputKey(st2, fifths) {
  return { ...st2, input: { ...st2.input, inputFifths: Math.max(-7, Math.min(7, fifths)) } };
}
function setInputScale(st2, id) {
  return { ...st2, input: { ...st2.input, inputScale: id } };
}
function firstNoteIn(st2) {
  if (!st2.sel) return -1;
  for (let i = st2.sel.from; i < st2.sel.to; i++) if (st2.song.tokens[i].kind === "note") return i;
  return -1;
}
function nextNoteAfter(tokens, i) {
  for (let j = i + 1; j < tokens.length; j++) if (tokens[j].kind === "note") return j;
  return -1;
}
function overwritePitch(st2, pitch) {
  const i = firstNoteIn(st2);
  if (i < 0) return st2;
  const nt = st2.song.tokens.slice();
  nt[i] = { ...nt[i], pitch };
  const j = nextNoteAfter(nt, i);
  return j >= 0 ? next(st2, nt, { sel: { from: j, to: j + 1 }, caret: j + 1 }) : next(st2, nt, { sel: null, caret: nt.length, log: [] });
}
function mapSelDur(st2, f) {
  if (!st2.sel) return st2;
  const nt = st2.song.tokens.slice();
  let changed = false;
  for (let i = st2.sel.from; i < st2.sel.to; i++) {
    const t = nt[i];
    if (!isTimed(t)) continue;
    const d2 = f(t.dur);
    if (validDur(d2)) {
      nt[i] = { ...t, dur: d2 };
      changed = true;
    }
  }
  return changed ? next(st2, nt) : st2;
}
function mapSelPitch(st2, f) {
  if (!st2.sel) return st2;
  const nt = st2.song.tokens.slice();
  for (let i = st2.sel.from; i < st2.sel.to; i++) {
    const t = nt[i];
    if (t.kind === "note") nt[i] = { ...t, pitch: f(effectivePitch(nt, i)) };
  }
  return next(st2, nt);
}
function deleteSel(st2) {
  if (!st2.sel) return st2;
  const nt = st2.song.tokens.slice();
  nt.splice(st2.sel.from, st2.sel.to - st2.sel.from);
  return next(st2, nt, { sel: null, caret: st2.sel.from, log: [] });
}
function mapTargetPitch(st2, f) {
  if (st2.sel) {
    const from = st2.sel.from;
    return mapSelPitch(st2, (p) => f(p, keyAt(st2.song, from)));
  }
  const i = currentIndex(st2);
  if (i < 0 || st2.song.tokens[i].kind !== "note") return st2;
  const nt = st2.song.tokens.slice();
  nt[i] = { ...nt[i], pitch: f(effectivePitch(nt, i), keyAt(st2.song, i)) };
  return next(st2, nt);
}
var stepTarget = (st2, steps) => mapTargetPitch(st2, (p, k) => stepBy(p, steps, k));
var alterTarget = (st2, d2) => mapTargetPitch(st2, (p, k) => transposeSemis(p, d2, k));
var octaveTarget = (st2, d2) => mapTargetPitch(st2, (p) => octaveBy(p, d2));
function transposeSel(st2, semis) {
  if (!st2.sel || !semis) return st2;
  const nt = st2.song.tokens.slice();
  for (let i = st2.sel.from; i < st2.sel.to; i++) {
    const t = nt[i];
    if (t.kind === "note" && t.pitch) nt[i] = { ...t, pitch: transposeSemis(t.pitch, semis, keyAt(st2.song, i)) };
  }
  return next(st2, nt);
}
function modulateSel(st2, toFifths) {
  if (!st2.sel) return st2;
  const { from, to } = st2.sel, old = st2.song, f0 = keyAt(old, from), df = toFifths - f0;
  if (!df) return st2;
  const { steps, semis } = keyInterval(f0, toFifths);
  const wrap = (f) => f > 7 ? f - 12 : f < -7 ? f + 12 : f;
  const nt = old.tokens.slice();
  for (let i = from; i < to; i++) {
    const t = nt[i];
    if (t.kind === "note" && t.pitch) nt[i] = { ...t, pitch: transposeInterval(t.pitch, steps, semis) };
    else if (t.kind === "key") nt[i] = { ...t, fifths: wrap(t.fifths + df) };
  }
  let nextId = st2.nextId;
  if (to < nt.length) {
    let hasKey = false;
    for (let i = to; i < nt.length && isMark(nt[i]); i++) if (nt[i].kind === "key") hasKey = true;
    let after = toFifths;
    for (let i = from; i < to; i++) {
      const t = nt[i];
      if (t.kind === "key") after = t.fifths;
    }
    const back = keyAt(old, to);
    if (!hasKey && back !== after) nt.splice(to, 0, { kind: "key", id: nextId++, fifths: back });
  }
  let a = from;
  while (a > 0 && isMark(nt[a - 1])) a--;
  let b = from;
  while (b < nt.length && isMark(nt[b])) b++;
  let shift = 0, keyIdx = -1;
  for (let i = a; i < b; i++) if (nt[i].kind === "key") keyIdx = i;
  if (keyIdx >= 0 && keyIdx < from) nt[keyIdx] = { ...nt[keyIdx], fifths: toFifths };
  else if (keyIdx < 0) {
    nt.splice(from, 0, { kind: "key", id: nextId++, fifths: toFifths });
    shift = 1;
  }
  const sel = { from: from + shift, to: to + shift };
  return next({ ...st2, nextId }, nt, { sel, caret: sel.to });
}
var setCaret = (st2, caret) => ({ ...leave(st2), sel: null, caret: Math.max(headLen(st2.song.tokens), Math.min(st2.song.tokens.length, caret)) });
function select(st2, from, to) {
  const n2 = st2.song.tokens.length, a = Math.max(headLen(st2.song.tokens), Math.min(from, to)), b = Math.min(n2, Math.max(from, to));
  if (b <= a) return setCaret(st2, a);
  return { ...leave(st2), sel: { from: a, to: b }, caret: b };
}
function moveCaret(st2, d2) {
  if (st2.sel) return setCaret(st2, d2 < 0 ? st2.sel.from : st2.sel.to);
  return setCaret(st2, st2.caret + d2);
}
function extendSelection(st2, d2) {
  if (!st2.sel) return d2 < 0 ? select(st2, st2.caret - 1, st2.caret) : select(st2, st2.caret, st2.caret + 1);
  return d2 < 0 ? select(st2, st2.sel.from - 1, st2.sel.to) : select(st2, st2.sel.from, st2.sel.to + 1);
}
function selectToEdge(st2, d2) {
  const n2 = st2.song.tokens.length;
  if (d2 < 0) return select(st2, headLen(st2.song.tokens), st2.sel ? st2.sel.to : st2.caret);
  return select(st2, st2.sel ? st2.sel.from : st2.caret, n2);
}
function escape(st2) {
  if (st2.sel) return st2;
  return st2.caret > headLen(st2.song.tokens) ? select(st2, st2.caret - 1, st2.caret) : st2;
}
function setNote(st2, i, patch) {
  const t = st2.song.tokens[i];
  if (!t || t.kind !== "note") return st2;
  const nt = st2.song.tokens.slice();
  nt[i] = { ...t, ...patch };
  return next(st2, nt);
}
function setDur(st2, i, dur) {
  const t = st2.song.tokens[i];
  if (!t || !isTimed(t) || !validDur(dur)) return st2;
  const nt = st2.song.tokens.slice();
  nt[i] = { ...t, dur };
  return next(st2, nt);
}
function setHum(st2, hum) {
  return { ...st2, song: { ...st2.song, hum } };
}
function setTitle(st2, title) {
  const t = title.trim(), song = { ...st2.song };
  if (t) song.title = t;
  else delete song.title;
  return (st2.song.title ?? "") === t ? st2 : { ...st2, song };
}
function timeline(song) {
  const out = [];
  let t = 0, bar2 = 0, sec = 0, bpm = DEFAULT_BPM;
  song.tokens.forEach((tok, index) => {
    if (tok.kind === "bar") {
      bar2 = t;
      return;
    }
    if (tok.kind === "tempo") {
      bpm = tok.bpm;
      return;
    }
    if (!isTimed(tok)) return;
    const len = tok.dur / TPQ * (60 / bpm);
    out.push({ index, tok, start: t, inBar: t - bar2, bpm, t0: sec, t1: sec + len });
    t += tok.dur;
    sec += len;
  });
  return out;
}

// src/score/commands.ts
function apply(st2, c, now = Date.now()) {
  switch (c.k) {
    case "degree":
      return writeDegree(st2, c.degree, c.dir);
    case "rest":
      return writeRest(st2);
    case "bar":
      return writeBar(st2);
    case "shorter":
      return shorter(st2);
    case "longer":
      return longer(st2);
    case "tuplet":
      return setTuplet(st2, st2.input.tuplet ? 0 : 3);
    case "extend":
      return extend(st2);
    case "acc":
      return tapAcc(st2, c.acc, now);
    case "octave":
      return octaveTarget(st2, c.d);
    case "step":
      return stepTarget(st2, c.d);
    case "alter":
      return alterTarget(st2, c.d);
    case "caret":
      return moveCaret(st2, c.d);
    case "selext":
      return extendSelection(st2, c.d);
    case "home":
      return setCaret(st2, 0);
    // setCaret 自己夹到谱头后面
    case "end":
      return setCaret(st2, st2.song.tokens.length);
    case "escape":
      return escape(st2);
    case "backspace":
      return backspace(st2);
    case "delete":
      return deleteForward(st2);
    case "transpose":
      return transposeSel(st2, c.semis);
    case "modulate":
      return modulateSel(st2, c.fifths);
    case "seledge":
      return selectToEdge(st2, c.d);
  }
}

// src/input/keys.ts
var range = (codes, m = {}) => codes.map((code) => ({ code, ...m }));
var DIGITS = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7"];
var NUMPAD = ["Numpad1", "Numpad2", "Numpad3", "Numpad4", "Numpad5", "Numpad6", "Numpad7"];
var DOWN_ROW = ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU"];
var cmd = (c) => () => ({ k: "cmd", cmd: c });
var degree = (dir) => (i, where) => where === "impro" ? { k: "audition", degree: i % 7 + 1, dir } : { k: "cmd", cmd: { k: "degree", degree: i % 7 + 1, dir } };
var BINDINGS = [
  // ── 写音 ──
  {
    id: "degree.near",
    group: "\u5199\u97F3",
    keys: [...range(DIGITS), ...range(NUMPAD)],
    show: "1\u20137\uFF08\u5C0F\u952E\u76D8\u4E5F\u884C\uFF09",
    sound: true,
    act: degree("near"),
    does: { write: "\u5199\u4E00\u4E2A\u97F3\uFF1A\u8C03\u91CC\u7B2C\u51E0\u7EA7\uFF0C\u843D\u5728\u79BB\u4E0A\u4E00\u4E2A\u97F3\u6700\u8FD1\u5904", edit: "\u628A\u9009\u4E2D\u7684\u7B2C\u4E00\u4E2A\u97F3\u6539\u6210\u8FD9\u4E00\u7EA7\uFF0C\u9009\u4E2D\u8DF3\u5230\u4E0B\u4E00\u4E2A\u97F3", impro: "\u53EA\u5531\u4E0D\u5199" }
  },
  {
    id: "degree.up",
    group: "\u5199\u97F3",
    keys: range(DIGITS, { shift: true }),
    show: "Shift+1\u20137",
    sound: true,
    act: degree("up"),
    does: { write: "\u540C\u4E0A\uFF0C\u5F80\u4E0A\u627E", edit: "\u540C\u4E0A\uFF0C\u5F80\u4E0A\u627E", impro: "\u53EA\u5531\u4E0D\u5199\uFF08\u5F80\u4E0A\u627E\uFF09" }
  },
  {
    id: "degree.down",
    group: "\u5199\u97F3",
    keys: range(DOWN_ROW),
    show: "Q W E R T Y U",
    sound: true,
    act: degree("down"),
    does: { write: "\u540C\u4E0A\uFF0C\u5F80\u4E0B\u627E\uFF08\u6570\u5B57\u6B63\u4E0B\u65B9\u90A3\u4E00\u6392\uFF09", edit: "\u540C\u4E0A\uFF0C\u5F80\u4E0B\u627E", impro: "\u53EA\u5531\u4E0D\u5199\uFF08\u5F80\u4E0B\u627E\uFF09" }
  },
  {
    id: "rest",
    group: "\u5199\u97F3",
    keys: [{ code: "Digit0" }, { code: "Numpad0" }],
    act: cmd({ k: "rest" }),
    does: { write: "\u4F11\u6B62" }
  },
  {
    id: "bar",
    group: "\u5199\u97F3",
    keys: [{ code: "Enter" }, { code: "NumpadEnter" }, { code: "Backslash", shift: true }],
    show: "Enter / |",
    act: cmd({ k: "bar" }),
    does: { write: "\u5C0F\u8282\u7EBF", edit: "\u5728\u9009\u4E2D\u540E\u9762\u63D2\u5C0F\u8282\u7EBF" }
  },
  // ── 时值 ──
  {
    id: "shorter",
    group: "\u65F6\u503C",
    keys: [{ code: "Digit8" }, { code: "Numpad8" }],
    act: cmd({ k: "shorter" }),
    does: { write: "\u77ED\uFF1A\u4E0B\u4E00\u4E2A\u97F3\u7684\u65F6\u503C\u51CF\u534A\uFF08\u5230\u4E09\u5341\u4E8C\u5206\u4E3A\u6B62\uFF09", edit: "\u9009\u4E2D\u7684\u97F3\u51CF\u534A" }
  },
  {
    id: "longer",
    group: "\u65F6\u503C",
    keys: [{ code: "Digit9" }, { code: "Numpad9" }],
    act: cmd({ k: "longer" }),
    does: { write: "\u957F\uFF1A\u4E0B\u4E00\u4E2A\u97F3\u7684\u65F6\u503C\u52A0\u500D\uFF08\u5230\u5168\u97F3\u7B26\u4E3A\u6B62\uFF09", edit: "\u9009\u4E2D\u7684\u97F3\u52A0\u500D" }
  },
  {
    id: "tuplet",
    group: "\u65F6\u503C",
    keys: [{ code: "Digit8", shift: true }],
    act: cmd({ k: "tuplet" }),
    does: { write: "\u4E09\u8FDE\u97F3\u5F00 / \u5173\uFF08\u4E0B\u4E00\u4E2A\u97F3\u8D77\uFF09", edit: "\u4E09\u8FDE\u97F3\u5F00 / \u5173\uFF08\u4E0B\u4E00\u4E2A\u97F3\u8D77\uFF09" }
  },
  {
    id: "extend",
    group: "\u65F6\u503C",
    keys: [{ code: "Minus" }, { code: "NumpadSubtract" }],
    act: cmd({ k: "extend" }),
    does: { write: "\u521A\u5199\u7684\u97F3\u52A0\u4E00\u4EFD\uFF08\u7B80\u8C31\u7684\u6A2A\u7EBF\uFF09\uFF1B\u9694\u7740\u5C0F\u8282\u7EBF = \u65B0\u5F00\u4E00\u4E2A\u8FDE\u7740\u7684\u540C\u97F3", edit: "\u9009\u4E2D\u7684\u97F3\u5404\u52A0\u4E00\u4EFD" }
  },
  // ── 音高 ──
  {
    id: "sharp",
    group: "\u97F3\u9AD8",
    keys: [{ code: "BracketRight" }],
    act: cmd({ k: "acc", acc: 1 }),
    does: { write: "\u266F\uFF1A\u70B9\u4E00\u4E0B\u7BA1\u4E0B\u4E00\u4E2A\u97F3\uFF0C\u8FDE\u70B9\u4E24\u4E0B\u9501\u4F4F\uFF0C\u518D\u70B9\u89E3\u5F00", edit: "\u9009\u4E2D\u7684\u97F3\u5347\u534A\u97F3" }
  },
  {
    id: "flat",
    group: "\u97F3\u9AD8",
    keys: [{ code: "BracketLeft" }],
    act: cmd({ k: "acc", acc: -1 }),
    does: { write: "\u266D\uFF1A\u540C\u4E0A", edit: "\u9009\u4E2D\u7684\u97F3\u964D\u534A\u97F3" }
  },
  {
    id: "octave.up",
    group: "\u97F3\u9AD8",
    keys: [{ code: "Quote" }, { code: "NumpadMultiply" }, { code: "ArrowUp", alt: true }],
    act: cmd({ k: "octave", d: 1 }),
    does: { write: "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u9AD8\u516B\u5EA6", edit: "\u9009\u4E2D\u7684\u97F3\u9AD8\u516B\u5EA6" }
  },
  {
    id: "octave.down",
    group: "\u97F3\u9AD8",
    keys: [{ code: "Comma" }, { code: "NumpadDivide" }, { code: "ArrowDown", alt: true }],
    act: cmd({ k: "octave", d: -1 }),
    does: { write: "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u4F4E\u516B\u5EA6", edit: "\u9009\u4E2D\u7684\u97F3\u4F4E\u516B\u5EA6" }
  },
  { id: "step.up", group: "\u97F3\u9AD8", keys: [{ code: "ArrowUp" }], act: cmd({ k: "step", d: 1 }), does: { write: "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u5F80\u4E0A\u4E00\u7EA7", edit: "\u9009\u4E2D\u7684\u97F3\u5F80\u4E0A\u4E00\u7EA7" } },
  { id: "step.down", group: "\u97F3\u9AD8", keys: [{ code: "ArrowDown" }], act: cmd({ k: "step", d: -1 }), does: { write: "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u5F80\u4E0B\u4E00\u7EA7", edit: "\u9009\u4E2D\u7684\u97F3\u5F80\u4E0B\u4E00\u7EA7" } },
  { id: "alter.up", group: "\u97F3\u9AD8", keys: [{ code: "ArrowUp", shift: true }], act: cmd({ k: "alter", d: 1 }), does: { write: "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u5347\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF1AC \u5927\u8C03 E \u2192 F\uFF09", edit: "\u9009\u4E2D\u7684\u97F3\u6574\u4F53\u5347\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF09" } },
  { id: "alter.down", group: "\u97F3\u9AD8", keys: [{ code: "ArrowDown", shift: true }], act: cmd({ k: "alter", d: -1 }), does: { write: "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u964D\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF09", edit: "\u9009\u4E2D\u7684\u97F3\u6574\u4F53\u964D\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF09" } },
  // ── 光标与选中 ──
  { id: "left", group: "\u5149\u6807\u4E0E\u9009\u4E2D", keys: [{ code: "ArrowLeft" }], act: cmd({ k: "caret", d: -1 }), does: { write: "\u5149\u6807\u5DE6\u79FB", edit: "\u6536\u6210\u9009\u4E2D\u5DE6\u8FB9\u7684\u5149\u6807\uFF08\u56DE\u5230\u5199\uFF09" } },
  { id: "right", group: "\u5149\u6807\u4E0E\u9009\u4E2D", keys: [{ code: "ArrowRight" }], act: cmd({ k: "caret", d: 1 }), does: { write: "\u5149\u6807\u53F3\u79FB", edit: "\u6536\u6210\u9009\u4E2D\u53F3\u8FB9\u7684\u5149\u6807\uFF08\u56DE\u5230\u5199\uFF09" } },
  { id: "sel.left", group: "\u5149\u6807\u4E0E\u9009\u4E2D", keys: [{ code: "ArrowLeft", shift: true }], act: cmd({ k: "selext", d: -1 }), does: { write: "\u9009\u4E2D\u5149\u6807\u524D\u90A3\u4E2A\uFF08\u5199 \u2192 \u6539\uFF09", edit: "\u9009\u4E2D\u5F80\u5DE6\u6269\u4E00\u4E2A" } },
  { id: "sel.right", group: "\u5149\u6807\u4E0E\u9009\u4E2D", keys: [{ code: "ArrowRight", shift: true }], act: cmd({ k: "selext", d: 1 }), does: { write: "\u9009\u4E2D\u5149\u6807\u540E\u90A3\u4E2A\uFF08\u5199 \u2192 \u6539\uFF09", edit: "\u9009\u4E2D\u5F80\u53F3\u6269\u4E00\u4E2A" } },
  { id: "sel.home", group: "\u5149\u6807\u4E0E\u9009\u4E2D", keys: [{ code: "Home", shift: true }], act: cmd({ k: "seledge", d: -1 }), does: { write: "\u4ECE\u5149\u6807\u9009\u5230\u5F00\u5934\uFF08\u5199 \u2192 \u6539\uFF09", edit: "\u9009\u5230\u5F00\u5934" } },
  { id: "sel.end", group: "\u5149\u6807\u4E0E\u9009\u4E2D", keys: [{ code: "End", shift: true }], act: cmd({ k: "seledge", d: 1 }), does: { write: "\u4ECE\u5149\u6807\u9009\u5230\u672B\u5C3E\uFF08Home \u518D Shift+End = \u5168\u9009\uFF09", edit: "\u9009\u5230\u672B\u5C3E" } },
  { id: "home", group: "\u5149\u6807\u4E0E\u9009\u4E2D", keys: [{ code: "Home" }], act: cmd({ k: "home" }), does: { write: "\u5149\u6807\u5230\u5F00\u5934", edit: "\u5149\u6807\u5230\u5F00\u5934" } },
  { id: "end", group: "\u5149\u6807\u4E0E\u9009\u4E2D", keys: [{ code: "End" }], act: cmd({ k: "end" }), does: { write: "\u5149\u6807\u5230\u672B\u5C3E", edit: "\u5149\u6807\u5230\u672B\u5C3E" } },
  {
    id: "escape",
    group: "\u5149\u6807\u4E0E\u9009\u4E2D",
    keys: [{ code: "Escape" }],
    act: (_i, w) => w === "lyric" ? { k: "lyric", a: "cancel" } : w === "mark" ? { k: "mark", a: "cancel" } : w === "sheet" ? { k: "sheet", a: "close" } : { k: "cmd", cmd: { k: "escape" } },
    does: { write: "\u9009\u4E2D\u5149\u6807\u524D\u90A3\u4E2A\uFF08\u5199 \u2192 \u6539\uFF09", lyric: "\u6536\u8D77\uFF0C\u4E0D\u8D34\u6846\u91CC\u7684\u5B57", mark: "\u6536\u8D77\uFF0C\u4E0D\u6539\uFF08\u521A\u63D2\u7684\u8BB0\u53F7 = \u64A4\u6389\uFF09", sheet: "\u5173\u6389\u9762\u677F" }
  },
  {
    id: "backspace",
    group: "\u5149\u6807\u4E0E\u9009\u4E2D",
    keys: [{ code: "Backspace" }],
    act: (_i, w) => w === "lyric" ? { k: "lyric", a: "back" } : { k: "cmd", cmd: { k: "backspace" } },
    does: { write: "\u64A4\u56DE\u672C\u6B21\u8F93\u5165\u7684\u6700\u540E\u4E00\u7B14\uFF08\u300C\u2212\u300D\u3001\u97F3\uFF09\uFF1B\u632A\u8FC7\u5149\u6807\u540E = \u5220\u5149\u6807\u524D\u4E00\u4E2A", edit: "\u5220\u6389\u9009\u4E2D", lyric: "\u6846\u662F\u7A7A\u7684\uFF1A\u56DE\u5230\u4E0A\u4E00\u4E2A\u97F3\uFF0C\u628A\u5B83\u7684\u5B57\u62FF\u51FA\u6765\u63A5\u7740\u5220" }
  },
  { id: "delete", group: "\u5149\u6807\u4E0E\u9009\u4E2D", keys: [{ code: "Delete" }], act: cmd({ k: "delete" }), does: { write: "\u5220\u5149\u6807\u540E\u4E00\u4E2A", edit: "\u5220\u6389\u9009\u4E2D" } },
  // ── 播放 ──
  { id: "play", group: "\u64AD\u653E", keys: [{ code: "Space" }], act: () => ({ k: "play" }), does: { write: "\u6708\u8BFB\u5531 / \u505C", edit: "\u6708\u8BFB\u5531 / \u505C" } },
  { id: "impro", group: "\u64AD\u653E", keys: [{ code: "Backquote" }], show: "`", act: () => ({ k: "impro" }), does: { write: "\u300C\u5F39\u300D\u5F00 / \u5173\uFF08\u97F3\u7B26\u952E\u53EA\u5531\u4E0D\u5199\uFF09", edit: "\u300C\u5F39\u300D\u5F00 / \u5173", impro: "\u300C\u5F39\u300D\u5173" } },
  // ── 文件（无地逃生口：.mxl；user 2026-10-07「先按照无地规范导入导出做逃生口」）。新建只在菜单里（Ctrl+N 浏览器不让拦） ──
  {
    id: "file.save",
    group: "\u6587\u4EF6",
    keys: [{ code: "KeyS", mod: true }],
    show: "Ctrl / \u2318+S",
    act: () => ({ k: "file", a: "save" }),
    does: { write: "\u5B58\uFF08\u5B58\u56DE\u6253\u5F00\u7684\u90A3\u4E2A\u6587\u4EF6\uFF1B\u8FD8\u6CA1\u6709\u5C31\u53E6\u5B58\u4E3A\uFF09", edit: "\u5B58", impro: "\u5B58", lyric: "\u5B58", mark: "\u5B58" }
  },
  {
    id: "file.saveAs",
    group: "\u6587\u4EF6",
    keys: [{ code: "KeyS", mod: true, shift: true }],
    show: "Ctrl / \u2318+Shift+S",
    act: () => ({ k: "file", a: "saveAs" }),
    does: { write: "\u53E6\u5B58\u4E3A\u2026", edit: "\u53E6\u5B58\u4E3A\u2026", impro: "\u53E6\u5B58\u4E3A\u2026", lyric: "\u53E6\u5B58\u4E3A\u2026", mark: "\u53E6\u5B58\u4E3A\u2026" }
  },
  {
    id: "file.open",
    group: "\u6587\u4EF6",
    keys: [{ code: "KeyO", mod: true }],
    show: "Ctrl / \u2318+O",
    act: () => ({ k: "file", a: "open" }),
    does: { write: "\u6253\u5F00\u2026\uFF08.mxl / .musicxml\uFF09", edit: "\u6253\u5F00\u2026", impro: "\u6253\u5F00\u2026", lyric: "\u6253\u5F00\u2026", mark: "\u6253\u5F00\u2026" }
  },
  // ── 歌词框（点谱下面打开；输入法照常用，中文 / 日文选定一段字就按字往后贴） ──
  {
    id: "lyric.next",
    group: "\u6B4C\u8BCD\u6846",
    keys: [{ code: "Space" }, { code: "Tab" }],
    show: "\u7A7A\u683C / Tab",
    act: () => ({ k: "lyric", a: "next" }),
    does: { lyric: "\u8FD9\u4E2A\u8BCD\u5B8C\u4E86\uFF1A\u8D34\u4E0A\u3001\u8DF3\u4E0B\u4E00\u4E2A\u97F3\uFF08\u6846\u662F\u7A7A\u7684 = \u53EA\u8DF3\uFF09" }
  },
  { id: "lyric.prev", group: "\u6B4C\u8BCD\u6846", keys: [{ code: "Tab", shift: true }], act: () => ({ k: "lyric", a: "prev" }), does: { lyric: "\u56DE\u4E0A\u4E00\u4E2A\u97F3" } },
  {
    id: "lyric.hyphen",
    group: "\u6B4C\u8BCD\u6846",
    keys: [{ code: "Minus" }],
    show: "-",
    act: () => ({ k: "lyric", a: "hyphen" }),
    does: { lyric: "\u8DDF\u5728\u5B57\u6BCD\u540E\u9762\uFF1A\u97F3\u8282\u5B8C\u4E86\u3001\u8BCD\u6CA1\u5B8C\uFF08\u8C31\u4E0A\u753B\u8FDE\u5B57\u7B26\uFF09\uFF0C\u8DF3\u4E0B\u4E00\u4E2A\u97F3" }
  },
  { id: "lyric.commit", group: "\u6B4C\u8BCD\u6846", keys: [{ code: "Enter" }, { code: "NumpadEnter" }], act: () => ({ k: "lyric", a: "commit" }), does: { lyric: "\u8D34\u4E0A\u3001\u6536\u8D77" } },
  // ── 记号框（点谱上的调号 / 拍号 / 速度打开） ──
  { id: "mark.commit", group: "\u8BB0\u53F7\u6846", keys: [{ code: "Enter" }, { code: "NumpadEnter" }], act: () => ({ k: "mark", a: "commit" }), does: { mark: "\u6309\u6846\u91CC\u7684\u5B57\u6539\uFF081=D / Bb / 2# \xB7 3/4 \xB7 90 \u6216 Andante\uFF09\u3001\u6536\u8D77" } }
];
var NAME = {
  Minus: "-",
  BracketRight: "]",
  BracketLeft: "[",
  Backslash: "\\",
  Quote: "'",
  Comma: ",",
  Backquote: "`",
  Space: "\u7A7A\u683C",
  Enter: "Enter",
  NumpadEnter: "\u5C0F\u952E\u76D8 Enter",
  Escape: "Esc",
  Backspace: "\u9000\u683C",
  Delete: "Delete",
  Home: "Home",
  End: "End",
  Tab: "Tab",
  ArrowUp: "\u2191",
  ArrowDown: "\u2193",
  ArrowLeft: "\u2190",
  ArrowRight: "\u2192",
  NumpadSubtract: "\u5C0F\u952E\u76D8 -",
  NumpadMultiply: "\u5C0F\u952E\u76D8 *",
  NumpadDivide: "\u5C0F\u952E\u76D8 /"
};
function chordName(c) {
  const base2 = NAME[c.code] ?? c.code.replace(/^Digit/, "").replace(/^Key/, "").replace(/^Numpad(\d)$/, "\u5C0F\u952E\u76D8 $1");
  return `${c.mod ? "Ctrl / \u2318+" : ""}${c.alt ? "Alt+" : ""}${c.shift ? "Shift+" : ""}${base2}`;
}
function hint(id) {
  const b = BINDINGS.find((x) => x.id === id);
  return b ? b.show?.split(" / ")[0] ?? chordName(b.keys[0]) : "";
}
function matches(c, e) {
  if (c.code !== e.code || !!c.shift !== e.shiftKey || !!c.alt !== e.altKey || !!c.mod !== (e.ctrlKey || e.metaKey)) return false;
  if (/^Numpad\d$/.test(c.code) && !/^\d$/.test(e.key)) return false;
  return true;
}
function route(e, where, base2 = "write") {
  if (e.isComposing) return null;
  const tryWhere = (w) => {
    for (const b of BINDINGS) {
      if (!b.does[w]) continue;
      const i = b.keys.findIndex((c) => matches(c, e));
      if (i >= 0) return b.act(i, w);
    }
    return null;
  };
  return tryWhere(where) ?? (where === "impro" ? tryWhere(base2) : null);
}
function isSoundKey(e) {
  return BINDINGS.some((b) => b.sound && b.keys.some((c) => c.code === e.code));
}

// src/score/lyrics.ts
var MELISMA_MARK = "\u30FC";
var SMALL = /* @__PURE__ */ new Set([..."\u3083\u3085\u3087\u3041\u3043\u3045\u3047\u3049\u308E\u3095\u3096\u30E3\u30E5\u30E7\u30A1\u30A3\u30A5\u30A7\u30A9\u30EE\u30F5\u30F6", "\u3063", "\u30C3"]);
var MELISMA = /* @__PURE__ */ new Set(["\u30FC", "~", "\uFF5E", "_", "\uFF3F"]);
var isKana = (c) => /[぀-ゟ゠-ヿ]/.test(c);
var isHan = (c) => /\p{Script=Han}/u.test(c);
var isLatin = (c) => /[A-Za-z'’]/.test(c);
function splitSyllables(text2) {
  const out = [];
  const chars = [...text2.normalize("NFC")];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (MELISMA.has(c)) {
      out.push({ text: MELISMA_MARK, hyph: false });
      continue;
    }
    if (c === "-" || c === "\uFF0D") {
      out.push({ text: MELISMA_MARK, hyph: false });
      continue;
    }
    if (SMALL.has(c)) {
      const last = out[out.length - 1];
      if (last && last.text !== MELISMA_MARK) last.text += c;
      else out.push({ text: c, hyph: false });
      continue;
    }
    if (isKana(c) || isHan(c)) {
      out.push({ text: c, hyph: false });
      continue;
    }
    if (isLatin(c)) {
      let w = c;
      while (i + 1 < chars.length) {
        const n2 = chars[i + 1];
        if (isLatin(n2)) {
          w += n2;
          i++;
          continue;
        }
        if ((n2 === "-" || n2 === "\uFF0D") && i + 2 < chars.length && isLatin(chars[i + 2])) {
          out.push({ text: w, hyph: true });
          w = "";
          i++;
          continue;
        }
        break;
      }
      if (w) out.push({ text: w, hyph: false });
      continue;
    }
  }
  return out;
}
var lyricSlot = (t) => t.kind === "note" && !t.tie;
function distributeFrom(st2, start, syl) {
  const tokens = st2.song.tokens.slice();
  let nextId = st2.nextId, i = start, last = -1;
  for (const s of syl) {
    while (i < tokens.length && !lyricSlot(tokens[i])) i++;
    if (i < tokens.length) tokens[i] = { ...tokens[i], lyric: s.text, hyph: s.hyph || void 0 };
    else tokens.push({ kind: "note", id: nextId++, pitch: null, dur: unitDur(st2.input), lyric: s.text, hyph: s.hyph || void 0 });
    last = i;
    i++;
  }
  return { st: { ...st2, song: { ...st2.song, tokens }, nextId }, last };
}
function nextLyricSlot(tokens, i) {
  for (let j = i + 1; j < tokens.length; j++) if (lyricSlot(tokens[j])) return j;
  return -1;
}
function prevLyricSlot(tokens, i) {
  for (let j = i - 1; j >= 0; j--) if (lyricSlot(tokens[j])) return j;
  return -1;
}

// src/render/smufl.ts
var GLYPH = {
  metNoteQuarterUp: "\uECA5",
  // 速度记号里的四分音符（metronome mark）
  gClef: "\uE050",
  noteheadWhole: "\uE0A2",
  noteheadHalf: "\uE0A3",
  noteheadBlack: "\uE0A4",
  augmentationDot: "\uE1E7",
  flag8thUp: "\uE240",
  flag8thDown: "\uE241",
  flag16thUp: "\uE242",
  flag16thDown: "\uE243",
  flag32ndUp: "\uE244",
  flag32ndDown: "\uE245",
  accidentalFlat: "\uE260",
  accidentalNatural: "\uE261",
  accidentalSharp: "\uE262",
  accidentalDoubleSharp: "\uE263",
  accidentalDoubleFlat: "\uE264",
  restWhole: "\uE4E3",
  restHalf: "\uE4E4",
  restQuarter: "\uE4E5",
  rest8th: "\uE4E6",
  rest16th: "\uE4E7",
  rest32nd: "\uE4E8"
};
var timeSigDigits = (n2) => [...String(n2)].map((d2) => String.fromCodePoint(57472 + Number(d2))).join("");
var W = {
  noteheadBlack: 1.18,
  noteheadHalf: 1.18,
  noteheadWhole: 1.688,
  gClef: 2.684,
  sharp: 0.996,
  flat: 0.904,
  natural: 0.672,
  doubleSharp: 1,
  doubleFlat: 1.644,
  dot: 0.4,
  timeSigDigit: 1.8,
  restWhole: 1.128,
  restHalf: 1.128,
  restQuarter: 1.08,
  rest8th: 0.988,
  rest16th: 1.28,
  rest32nd: 1.452
};
var ENGRAVE = {
  staffLine: 0.13,
  stem: 0.12,
  ledger: 0.16,
  ledgerExt: 0.4,
  beam: 0.5,
  beamGap: 0.25,
  thinBar: 0.16,
  tieMid: 0.22
};
var STEM_UP_SE = [1.18, 0.168];
var STEM_DOWN_NW = [0, -0.168];
var FLAG_ANCHOR_UP = { 1: -0.04, 2: -0.088, 3: 0.376 };
var FLAG_ANCHOR_DOWN = { 1: 0.132, 2: 0.128, 3: -0.448 };

// src/render/engrave.ts
var LYRIC_EM = 1.6;
var TEMPO_EM = 1.35;
var MARGIN = 1.2;
var STAFF_ABOVE = 6;
var SYS_H = 17;
var LYRIC_BELOW = 5.2;
var BAR_W = 1.6;
var TITLE_H = 4.6;
var TOP_LINE = 38;
var MID_LINE = 34;
var BOTTOM_LINE = 30;
var SHARP_POS = [38, 35, 39, 36, 33, 37, 34];
var FLAT_POS = [34, 37, 33, 36, 32, 35, 31];
var GLYPH_TUPLET = (n2) => [...String(n2)].map((d2) => String.fromCodePoint(59520 + Number(d2))).join("");
var MIN_PLAIN = TPQ / 8;
var NOTATABLE = [];
for (let b = WHOLE; b >= MIN_PLAIN; b /= 2) {
  NOTATABLE.push({ ticks: b * 1.5, base: b, dotted: true }, { ticks: b, base: b, dotted: false });
}
NOTATABLE.sort((a, b) => b.ticks - a.ticks);
function splitDur(dur) {
  const out = [];
  let left = dur;
  while (left > 0) {
    const n2 = NOTATABLE.find((v) => v.ticks <= left && (v.dotted ? v.base >= MIN_PLAIN * 2 : true));
    if (!n2) {
      out.push({ base: MIN_PLAIN, dotted: false, ticks: left });
      break;
    }
    out.push(n2);
    left -= n2.ticks;
  }
  return out;
}
var RATIOS = [[3, 2], [5, 4], [6, 4], [7, 4]];
function notate(dur) {
  if (dur % MIN_PLAIN === 0) return { ratio: null, chunks: splitDur(dur) };
  for (const [n2, m] of RATIOS) {
    const written = dur * n2 / m;
    if (Number.isInteger(written) && written % MIN_PLAIN === 0) return { ratio: [n2, m], chunks: splitDur(written).map((c) => ({ ...c, ticks: c.ticks * m / n2 })) };
  }
  return { ratio: null, chunks: [{ base: MIN_PLAIN, dotted: false, ticks: dur }] };
}
var flagLevel = (base2) => base2 >= TPQ ? 0 : Math.round(Math.log2(TPQ / base2));
var baseWidth = (base2) => Math.max(2.2, 3.6 + 0.75 * Math.log2(base2 / TPQ));
var keyWidth = (fifths, prev) => (fifths === 0 ? Math.abs(prev) * 0.8 : Math.abs(fifths) * 1.05) + 1;
var timeWidth = (beats, beatType) => Math.max([...String(beats)].length, [...String(beatType)].length) * W.timeSigDigit;
function engrave(song, o) {
  const sp = o.sp, P = (v) => v * sp;
  const tokens = song.tokens, sel = o.sel ?? null, writing = !sel;
  const prims = [];
  const inSel = (i) => !!sel && i >= sel.from && i < sel.to;
  const H = headLen(tokens);
  let fifths = DEFAULT_KEY, time = { ...DEFAULT_TIME }, bpm = DEFAULT_BPM;
  const headIdx = {};
  for (let i = 0; i < H; i++) {
    const t = tokens[i];
    if (t.kind === "key") fifths = t.fifths;
    else if (t.kind === "time") time = { beats: t.beats, beatType: t.beatType };
    else if (t.kind === "tempo") bpm = t.bpm;
    if (t.kind === "key" || t.kind === "time" || t.kind === "tempo") headIdx[t.kind] = i;
  }
  const headKey = fifths, headTime = time, headBpm = bpm;
  const autoBars2 = o.autoBars !== false;
  const units = [];
  const measureLen2 = (b, bt) => b * WHOLE / bt;
  let accState = /* @__PURE__ */ new Map(), inBar = 0, measureNo = 0, shortBars = 0;
  let beat = beatTicks(time.beats, time.beatType), len = measureLen2(time.beats, time.beatType);
  const pushHead = () => {
    units.push({ kind: "head", w: 0, x: 0, system: 0 });
  };
  const pushBar = (index, auto) => {
    const warn = inBar !== len && measureNo > 0;
    if (warn) shortBars++;
    units.push({ kind: "bar", index, w: BAR_W, x: 0, system: 0, warn, auto });
    accState = /* @__PURE__ */ new Map();
    inBar = 0;
    measureNo++;
  };
  const flushFull = () => {
    if (autoBars2 && inBar >= len && inBar > 0) pushBar(-1, true);
  };
  tokens.forEach((t, i) => {
    if (i < H) return;
    if (writing && i === o.caret) {
      if (t.kind !== "bar") flushFull();
      pushHead();
    }
    if (t.kind === "bar") {
      pushBar(i, false);
      return;
    }
    if (t.kind === "key") {
      flushFull();
      units.push({ kind: "key", index: i, fifths: t.fifths, prev: fifths, w: keyWidth(t.fifths, fifths), x: 0, system: 0 });
      fifths = t.fifths;
      accState = /* @__PURE__ */ new Map();
      return;
    }
    if (t.kind === "time") {
      if (autoBars2 && inBar > 0) pushBar(-1, true);
      units.push({ kind: "time", index: i, beats: t.beats, beatType: t.beatType, w: timeWidth(t.beats, t.beatType) + 1.2, x: 0, system: 0 });
      beat = beatTicks(t.beats, t.beatType);
      len = measureLen2(t.beats, t.beatType);
      return;
    }
    if (t.kind === "tempo") {
      flushFull();
      units.push({ kind: "tempo", index: i, bpm: t.bpm, w: 0.3, x: 0, system: 0 });
      return;
    }
    const isNote = t.kind === "note", nt = t;
    const pitch = isNote ? effectivePitch(tokens, i) : null;
    let left = t.dur, j = 0, lastChunk = null;
    while (left > 1e-6) {
      flushFull();
      const piece = autoBars2 ? Math.min(left, len - inBar) : left;
      const { ratio, chunks } = notate(piece);
      let off = 0;
      for (const c of chunks) {
        let acc2 = null;
        if (pitch && j === 0 && !(isNote && nt.tie)) {
          const key = `${pitch.step}${pitch.octave}`;
          const cur = accState.has(key) ? accState.get(key) : keyAlter(pitch.step, fifths);
          if (pitch.alter !== cur) {
            acc2 = pitch.alter;
            accState.set(key, pitch.alter);
          }
        }
        const lyric = isNote && j === 0 && !nt.tie ? nt.lyric : null;
        const accW = acc2 === null ? 0 : 1.3;
        let w = accW + baseWidth(c.base) + (c.dotted ? 0.6 : 0);
        if (lyric && lyric !== MELISMA_MARK) w = Math.max(w, accW + o.measureLyric(lyric) / sp + (nt.hyph ? 1.4 : 0.7));
        const u = {
          kind: "chunk",
          index: i,
          j,
          last: false,
          base: c.base,
          dotted: c.dotted,
          note: isNote,
          ratio,
          ticks: c.ticks,
          pitch,
          ghost: isNote && nt.pitch === null,
          tie: isNote && !!nt.tie && j === 0,
          lyric,
          hyph: !!(isNote && nt.hyph && j === 0),
          inBar: inBar + off,
          beat,
          acc: acc2,
          w,
          accW,
          x: 0,
          system: 0
        };
        units.push(u);
        lastChunk = u;
        off += c.ticks;
        j++;
      }
      inBar += piece;
      left -= piece;
    }
    if (lastChunk) lastChunk.last = true;
  });
  flushFull();
  if (writing && o.caret >= tokens.length) pushHead();
  const right = o.width / sp - MARGIN;
  const headerW = (first, f) => MARGIN + 0.6 + W.gClef + 1 + Math.abs(f) * 1.05 + (f ? 0.8 : 0) + (first ? timeWidth(headTime.beats, headTime.beatType) + 1.2 : 0.4);
  let system = 0, curKey = headKey, x = headerW(true, curKey);
  const sysStarts = [x], sysKeys = [curKey];
  const newline = () => {
    system++;
    x = headerW(false, curKey);
    sysStarts.push(x);
    sysKeys.push(curKey);
  };
  let seg = [];
  const place = (u) => {
    u.x = x;
    u.system = system;
    x += u.w;
    if (u.kind === "key") curKey = u.fifths;
  };
  const flush = () => {
    const segW = seg.reduce((s, u) => s + u.w, 0);
    if (x + segW > right && x > sysStarts[system] + 0.01) newline();
    for (const u of seg) {
      if (x + u.w > right && x > sysStarts[system] + 0.01) newline();
      place(u);
    }
    seg = [];
  };
  for (const u of units) {
    seg.push(u);
    if (u.kind === "bar") flush();
  }
  flush();
  const nSys = system + 1;
  for (let s = 0; s < nSys - 1; s++) {
    const row = units.filter((u) => u.system === s);
    const end = row.reduce((m, u) => Math.max(m, u.x + u.w), sysStarts[s]), avail = right - sysStarts[s], used = end - sysStarts[s];
    if (used < avail * 0.6) continue;
    const grow = row.filter((u) => u.kind === "chunk"), gw = grow.reduce((a, u) => a + u.w, 0);
    if (!gw) continue;
    const k = (avail - used) / gw;
    let x2 = sysStarts[s];
    for (const u of row) {
      u.x = x2;
      if (u.kind === "chunk") u.w *= 1 + k;
      x2 += u.w;
    }
  }
  const sysTop = (s) => P(TITLE_H + 0.5 + s * SYS_H);
  const staffTop = (s) => sysTop(s) + P(STAFF_ABOVE);
  const yOf = (s, d2) => staffTop(s) + (TOP_LINE - d2) * P(0.5);
  const dOf = (s, y) => Math.round(TOP_LINE - (y - staffTop(s)) / P(0.5));
  const lyricY = (s) => yOf(s, BOTTOM_LINE) + P(LYRIC_BELOW);
  const systems = Array.from({ length: nSys }, (_, s) => ({ top: sysTop(s), staffTop: staffTop(s), bottom: sysTop(s) + P(SYS_H) }));
  if (sel) {
    const byS = /* @__PURE__ */ new Map();
    for (const u of units) {
      if (u.kind === "head" || !inSel(u.index)) continue;
      const r = byS.get(u.system);
      const a = u.x, b = u.x + u.w;
      byS.set(u.system, r ? [Math.min(r[0], a), Math.max(r[1], b)] : [a, b]);
    }
    for (const [s, [a, b]] of byS) prims.push({ t: "rect", x: P(a), y: yOf(s, 44), w: P(b - a), h: lyricY(s) + P(0.8) - yOf(s, 44), cls: "selbox" });
  }
  const marks = [];
  const drawTime = (s, x0, beats, beatType, cls) => {
    const num = timeSigDigits(beats), den = timeSigDigits(beatType);
    const wn = [...num].length * W.timeSigDigit, wd = [...den].length * W.timeSigDigit, cw = Math.max(wn, wd);
    prims.push({ t: "glyph", x: P(x0 + (cw - wn) / 2), y: yOf(s, 36), ch: num, cls });
    prims.push({ t: "glyph", x: P(x0 + (cw - wd) / 2), y: yOf(s, 32), ch: den, cls });
    return cw;
  };
  const drawTempo = (s, x0, v, cls, index) => {
    const fs = TEMPO_EM * sp, word = tempoWord(v).it, y = staffTop(s) - P(2.4);
    const ww = o.measureLyric(word) * TEMPO_EM / LYRIC_EM / sp, num = `= ${v}`, nw = o.measureLyric(num) * TEMPO_EM / LYRIC_EM / sp;
    prims.push({ t: "text", x: P(x0), y, s: word, cls: `${cls} tempo-word`, size: fs, anchor: "start" });
    const gx = x0 + ww + 0.7;
    prims.push({ t: "glyph", x: P(gx), y: y - P(0.3), ch: GLYPH.metNoteQuarterUp, cls, size: fs * 1.75 });
    prims.push({ t: "text", x: P(gx + 1.3), y, s: num, cls: `${cls} tempo-num`, size: fs, anchor: "start" });
    marks.push({ index, kind: "tempo", system: s, x: P(x0 - 0.3), y: y - P(TEMPO_EM * 1.1), w: P(gx + 1.3 + nw + 0.6 - x0), h: P(TEMPO_EM * 1.5) });
  };
  const staffHit = (s) => ({ y: yOf(s, TOP_LINE) - P(1.2), h: yOf(s, BOTTOM_LINE) - yOf(s, TOP_LINE) + P(2.4) });
  const drawKeySig = (s, x0, f, cls) => {
    const pos = f > 0 ? SHARP_POS : FLAT_POS, ch = f > 0 ? GLYPH.accidentalSharp : GLYPH.accidentalFlat;
    for (let k = 0; k < Math.abs(f); k++) prims.push({ t: "glyph", x: P(x0 + k * 1.05), y: yOf(s, pos[k]), ch, cls });
  };
  for (let s = 0; s < nSys; s++) {
    for (let k = 0; k < 5; k++) {
      const y = yOf(s, BOTTOM_LINE + 2 * k);
      prims.push({ t: "line", x1: P(MARGIN), y1: y, x2: P(right), y2: y, w: P(ENGRAVE.staffLine), cls: "staff" });
    }
    let hx = MARGIN + 0.6;
    prims.push({ t: "glyph", x: P(hx), y: yOf(s, 32), ch: GLYPH.gClef, cls: "clef" });
    hx += W.gClef + 1;
    drawKeySig(s, hx, sysKeys[s], "keysig");
    hx += Math.abs(sysKeys[s]) * 1.05;
    if (s === 0) {
      if (headIdx.key !== void 0) marks.push({ index: headIdx.key, kind: "key", system: 0, x: P(MARGIN + 0.3), ...staffHit(0), w: P(hx - MARGIN - 0.3 + 0.3) });
      if (sysKeys[0]) hx += 0.8;
      const cw = drawTime(s, hx, headTime.beats, headTime.beatType, "timesig");
      if (headIdx.time !== void 0) marks.push({ index: headIdx.time, kind: "time", system: 0, x: P(hx - 0.3), ...staffHit(0), w: P(cw + 0.6) });
      if (headIdx.tempo !== void 0) drawTempo(0, MARGIN + 0.6, headBpm, "tempo", headIdx.tempo);
    }
  }
  const notes = [], lyrics = [];
  let head = null;
  const curIndex = (() => {
    if (!writing) return -1;
    for (let i = o.caret - 1; i >= 0; i--) if (isTimed(tokens[i])) return i;
    return -1;
  })();
  const nhX = (c) => P(c.x + c.accW + 0.35);
  const nhW = (c) => P(c.base >= WHOLE ? W.noteheadWhole : W.noteheadBlack);
  const clsOf = (c) => [c.ghost ? "ghost" : "", c.index >= 0 && c.index === curIndex ? "cur" : "", c.index >= 0 && inSel(c.index) ? "sel" : ""].filter(Boolean).join(" ") || void 0;
  const drawChunk = (c) => {
    const cls = clsOf(c);
    if (!c.note) {
      const g2 = c.base >= WHOLE ? GLYPH.restWhole : c.base >= TPQ * 2 ? GLYPH.restHalf : c.base >= TPQ ? GLYPH.restQuarter : c.base >= TPQ / 2 ? GLYPH.rest8th : c.base >= TPQ / 4 ? GLYPH.rest16th : GLYPH.rest32nd;
      const ry = c.base >= WHOLE ? yOf(c.system, 36) : yOf(c.system, MID_LINE);
      prims.push({ t: "glyph", x: P(c.x + 0.35), y: ry, ch: g2, cls: cls ? `rest ${cls}` : "rest" });
      if (c.dotted) prims.push({ t: "glyph", x: P(c.x + 0.35 + 1.5), y: yOf(c.system, 35), ch: GLYPH.augmentationDot, cls });
      return;
    }
    const d2 = diatonicIndex(c.pitch), y = yOf(c.system, d2), x0 = nhX(c);
    if (c.acc !== null) {
      const ag = c.acc === 1 ? GLYPH.accidentalSharp : c.acc === -1 ? GLYPH.accidentalFlat : c.acc === 2 ? GLYPH.accidentalDoubleSharp : c.acc === -2 ? GLYPH.accidentalDoubleFlat : GLYPH.accidentalNatural;
      prims.push({ t: "glyph", x: P(c.x + 0.2), y, ch: ag, cls });
    }
    for (let L = 28; L >= d2; L -= 2) prims.push({ t: "line", x1: x0 - P(ENGRAVE.ledgerExt), y1: yOf(c.system, L), x2: x0 + nhW(c) + P(ENGRAVE.ledgerExt), y2: yOf(c.system, L), w: P(ENGRAVE.ledger), cls: "ledger" });
    for (let L = 40; L <= d2; L += 2) prims.push({ t: "line", x1: x0 - P(ENGRAVE.ledgerExt), y1: yOf(c.system, L), x2: x0 + nhW(c) + P(ENGRAVE.ledgerExt), y2: yOf(c.system, L), w: P(ENGRAVE.ledger), cls: "ledger" });
    const ng = c.base >= WHOLE ? GLYPH.noteheadWhole : c.base >= TPQ * 2 ? GLYPH.noteheadHalf : GLYPH.noteheadBlack;
    prims.push({ t: "glyph", x: x0, y, ch: ng, cls: cls ? `note ${cls}` : "note" });
    if (c.dotted) prims.push({ t: "glyph", x: x0 + nhW(c) + P(0.3), y: yOf(c.system, d2 % 2 === 0 ? d2 + 1 : d2), ch: GLYPH.augmentationDot, cls });
    if (c.j === 0) notes.push({ index: c.index, system: c.system, x: x0, y, w: nhW(c), d: d2 });
    if (c.j === 0 && !c.tie) {
      const ly = lyricY(c.system), cx = x0 + nhW(c) / 2;
      lyrics.push({ index: c.index, system: c.system, x: cx, y: ly });
      if (c.lyric === MELISMA_MARK) prims.push({ t: "line", x1: x0 - P(0.6), y1: ly, x2: x0 + nhW(c) + P(0.4), y2: ly, w: P(0.12), cls: "melisma" });
      else if (c.lyric) prims.push({ t: "text", x: cx, y: ly, s: c.lyric, cls: cls ? `lyric ${cls}` : "lyric" });
    }
  };
  for (const u of units) {
    if (u.kind === "head") {
      head = { system: u.system, x: P(u.x) };
      prims.push({ t: "line", x1: P(u.x + 0.1), y1: yOf(u.system, 42), x2: P(u.x + 0.1), y2: yOf(u.system, 26), w: P(0.16), cls: "caret" });
      continue;
    }
    if (u.kind === "bar") {
      const bx = P(u.x + 0.7);
      prims.push({ t: "line", x1: bx, y1: yOf(u.system, TOP_LINE), x2: bx, y2: yOf(u.system, BOTTOM_LINE), w: P(ENGRAVE.thinBar), cls: u.auto ? "bar auto" : inSel(u.index) ? "bar sel" : "bar" });
      if (u.warn) prims.push({ t: "rect", x: bx - P(0.3), y: yOf(u.system, TOP_LINE) - P(1.6), w: P(0.6), h: P(0.6), cls: "warn" });
      continue;
    }
    if (u.kind === "key") {
      const cls = inSel(u.index) ? "keysig sel" : "keysig";
      if (u.fifths === 0) {
        const pos = u.prev > 0 ? SHARP_POS : FLAT_POS;
        for (let k = 0; k < Math.abs(u.prev); k++) prims.push({ t: "glyph", x: P(u.x + 0.4 + k * 0.8), y: yOf(u.system, pos[k]), ch: GLYPH.accidentalNatural, cls });
      } else drawKeySig(u.system, u.x + 0.4, u.fifths, cls);
      if (u.fifths === 0 && u.prev === 0) prims.push({ t: "text", x: P(u.x + 0.2), y: staffTop(u.system) - P(0.8), s: `1=${KEY_LABEL[0]}`, cls: `${cls} key-label`, size: TEMPO_EM * sp * 0.85, anchor: "start" });
      marks.push({ index: u.index, kind: "key", system: u.system, x: P(u.x), ...staffHit(u.system), w: P(Math.max(u.w, 1.6)) });
      continue;
    }
    if (u.kind === "time") {
      const cls = inSel(u.index) ? "timesig sel" : "timesig";
      drawTime(u.system, u.x + 0.6, u.beats, u.beatType, cls);
      marks.push({ index: u.index, kind: "time", system: u.system, x: P(u.x), ...staffHit(u.system), w: P(u.w) });
      continue;
    }
    if (u.kind === "tempo") {
      drawTempo(u.system, u.x + 0.3, u.bpm, inSel(u.index) ? "tempo sel" : "tempo", u.index);
      continue;
    }
    drawChunk(u);
  }
  const stemmed = [];
  let group = [], groupBeat = -1, groupSys = -1;
  const endGroup = () => {
    if (group.length) stemmed.push(group);
    group = [];
    groupBeat = -1;
  };
  const chunksInOrder = [];
  for (const u of units) {
    if (u.kind === "chunk") chunksInOrder.push(u);
    else if (u.kind !== "head") chunksInOrder.push(null);
  }
  for (const u of chunksInOrder) {
    if (!u || !u.note || u.base >= WHOLE) {
      endGroup();
      continue;
    }
    const s = { c: u, x0: nhX(u), y: yOf(u.system, diatonicIndex(u.pitch)), d: diatonicIndex(u.pitch) };
    if (u.base > TPQ / 2) {
      endGroup();
      stemmed.push([s]);
      continue;
    }
    const beat2 = Math.floor(u.inBar / u.beat);
    if (group.length && (beat2 !== groupBeat || u.system !== groupSys)) endGroup();
    group.push(s);
    groupBeat = beat2;
    groupSys = u.system;
  }
  endGroup();
  const stemCls = (s) => clsOf(s.c);
  const tipOf = /* @__PURE__ */ new Map();
  for (const g2 of stemmed) {
    const sys = g2[0].c.system, mid = yOf(sys, MID_LINE);
    const up = g2.reduce((a, s) => a + s.d, 0) / g2.length < MID_LINE;
    const sx = (s) => up ? s.x0 + P(STEM_UP_SE[0] - ENGRAVE.stem / 2) : s.x0 + P(STEM_DOWN_NW[0] + ENGRAVE.stem / 2);
    const sy0 = (s) => up ? s.y - P(STEM_UP_SE[1]) : s.y - P(STEM_DOWN_NW[1]);
    if (g2.length === 1) {
      const s = g2[0];
      let tip = up ? s.y - P(3.5) : s.y + P(3.5);
      if (up && s.d < 27) tip = Math.min(tip, mid);
      if (!up && s.d > 41) tip = Math.max(tip, mid);
      tipOf.set(s.c, tip);
      prims.push({ t: "line", x1: sx(s), y1: sy0(s), x2: sx(s), y2: tip, w: P(ENGRAVE.stem), cls: stemCls(s) });
      const lv = flagLevel(s.c.base);
      if (lv > 0) {
        const fx = sx(s) - P(ENGRAVE.stem / 2);
        const fg = up ? [GLYPH.flag8thUp, GLYPH.flag16thUp, GLYPH.flag32ndUp][lv - 1] : [GLYPH.flag8thDown, GLYPH.flag16thDown, GLYPH.flag32ndDown][lv - 1];
        prims.push({ t: "glyph", x: fx, y: up ? tip + P(FLAG_ANCHOR_UP[lv]) : tip + P(FLAG_ANCHOR_DOWN[lv]), ch: fg, cls: stemCls(s) });
      }
      continue;
    }
    const xa = sx(g2[0]), xb = sx(g2[g2.length - 1]);
    const k = Math.max(-0.2, Math.min(0.2, (g2[g2.length - 1].y - g2[0].y) / (xb - xa) * 0.5));
    const at = (x2, y02) => y02 + k * (x2 - xa);
    const y0 = up ? Math.min(...g2.map((s) => s.y - P(3.5) - k * (sx(s) - xa))) : Math.max(...g2.map((s) => s.y + P(3.5) - k * (sx(s) - xa)));
    for (const s of g2) {
      tipOf.set(s.c, at(sx(s), y0));
      prims.push({ t: "line", x1: sx(s), y1: sy0(s), x2: sx(s), y2: at(sx(s), y0), w: P(ENGRAVE.stem), cls: stemCls(s) });
    }
    const step = P(ENGRAVE.beam + ENGRAVE.beamGap) * (up ? 1 : -1), th = P(ENGRAVE.beam) * (up ? 1 : -1);
    const beamPath = (xL, xR, lvl) => {
      const of = step * lvl;
      const a = at(xL, y0) + of, b = at(xR, y0) + of;
      return `M${xL - P(ENGRAVE.stem / 2)},${a}L${xR + P(ENGRAVE.stem / 2)},${b}L${xR + P(ENGRAVE.stem / 2)},${b + th}L${xL - P(ENGRAVE.stem / 2)},${a + th}Z`;
    };
    const gcls = ["beam", g2.every((s) => s.c.ghost) ? "ghost" : "", g2.every((s) => s.c.index >= 0 && inSel(s.c.index)) ? "sel" : ""].filter(Boolean).join(" ");
    prims.push({ t: "path", d: beamPath(xa, xb, 0), cls: gcls });
    const maxLv = Math.max(...g2.map((s) => flagLevel(s.c.base)));
    for (let lvl = 2; lvl <= maxLv; lvl++) {
      let runStart = -1;
      for (let n2 = 0; n2 <= g2.length; n2++) {
        const has = n2 < g2.length && flagLevel(g2[n2].c.base) >= lvl;
        if (has && runStart < 0) runStart = n2;
        if (!has && runStart >= 0) {
          const L = runStart, R = n2 - 1;
          if (L === R) {
            const stub = P(1.1), toRight = L < g2.length - 1;
            prims.push({ t: "path", d: beamPath(toRight ? sx(g2[L]) : sx(g2[L]) - stub, toRight ? sx(g2[L]) + stub : sx(g2[L]), lvl - 1), cls: gcls });
          } else prims.push({ t: "path", d: beamPath(sx(g2[L]), sx(g2[R]), lvl - 1), cls: gcls });
          runStart = -1;
        }
      }
    }
  }
  const tieBetween = (a, b) => {
    if (a.system !== b.system || !a.pitch || !b.pitch) return;
    const d2 = diatonicIndex(b.pitch), below = d2 < MID_LINE, sgn = below ? 1 : -1;
    const y = yOf(b.system, d2) + sgn * P(0.8), xa2 = nhX(a) + nhW(a) * 0.8, xb2 = nhX(b) + nhW(b) * 0.2;
    prims.push({ t: "path", d: `M${xa2},${y}Q${(xa2 + xb2) / 2},${y + sgn * P(1)} ${xb2},${y}`, cls: b.ghost ? "tie ghost" : "tie" });
  };
  const realChunks = units.filter((u) => u.kind === "chunk");
  for (let n2 = 1; n2 < realChunks.length; n2++) {
    const a = realChunks[n2 - 1], b = realChunks[n2];
    if (!a.note || !b.note) continue;
    if (b.j > 0 && a.index === b.index || b.tie && a.last) tieBetween(a, b);
  }
  for (let n2 = 0; n2 < lyrics.length; n2++) {
    const L = lyrics[n2], tok = tokens[L.index];
    if (!tok.hyph) continue;
    const R = lyrics[n2 + 1];
    const x2 = R && R.system === L.system ? (L.x + R.x) / 2 : L.x + P(1.6);
    prims.push({ t: "text", x: x2, y: L.y, s: "-", cls: "lyric hyphen" });
  }
  let run2 = [], runRatio = null, acc = 0, minBase = Infinity;
  const closeRun = () => {
    if (run2.length && run2[0].ratio) {
      const s = run2[0].system, n2 = run2[0].ratio[0];
      const xa = nhX(run2[0]), xb = nhX(run2[run2.length - 1]) + nhW(run2[run2.length - 1]);
      const top = Math.min(...run2.map((c) => Math.min(c.pitch ? yOf(s, diatonicIndex(c.pitch)) : yOf(s, MID_LINE), tipOf.get(c) ?? Infinity)), yOf(s, TOP_LINE)) - P(1.6);
      const mid = (xa + xb) / 2, gap = P(1);
      prims.push({ t: "path", d: `M${xa},${top + P(0.6)}L${xa},${top}L${mid - gap},${top}M${mid + gap},${top}L${xb},${top}L${xb},${top + P(0.6)}`, cls: "tuplet-bracket" });
      prims.push({ t: "glyph", x: mid - P(0.55), y: top + P(0.55), ch: GLYPH_TUPLET(n2), cls: "tuplet" });
    }
    run2 = [];
    runRatio = null;
    acc = 0;
    minBase = Infinity;
  };
  for (const c of realChunks) {
    const r = c.ratio ? c.ratio.join(":") : null;
    if (r !== runRatio || run2.length && c.system !== run2[0].system) closeRun();
    if (!r) continue;
    run2.push(c);
    runRatio = r;
    acc += c.ticks;
    minBase = Math.min(minBase, c.base);
    if (acc >= c.ratio[1] * minBase - 1e-6) closeRun();
  }
  closeRun();
  const slots = [];
  const firstUnitOf = /* @__PURE__ */ new Map();
  for (const u of units) if (u.kind !== "head" && u.index >= 0 && !firstUnitOf.has(u.index)) firstUnitOf.set(u.index, u);
  for (let c = H; c <= tokens.length; c++) {
    const u = c < tokens.length ? firstUnitOf.get(c) : null;
    if (u) slots.push({ caret: c, system: u.system, x: P(u.x) });
    else {
      const last = units[units.length - 1];
      slots.push({ caret: c, system: last ? last.system : 0, x: last ? P(last.x + last.w) : P(sysStarts[0]) });
    }
  }
  const titleSize = P(1.9), titleBase = P(TITLE_H * 0.62);
  if (song.title) prims.push({ t: "text", x: o.width / 2, y: titleBase, s: song.title, cls: "song-title", size: titleSize, anchor: "middle" });
  else if (o.titlePlaceholder) prims.push({ t: "text", x: o.width / 2, y: titleBase, s: "\u6B4C\u540D\uFF08\u53EF\u4E0D\u586B\uFF09", cls: "song-title empty", size: titleSize * 0.8, anchor: "middle" });
  const title = { x: P(MARGIN), y: P(0.3), w: o.width - P(2 * MARGIN), h: P(TITLE_H), baseline: titleBase, size: titleSize };
  return { prims, width: o.width, height: P(TITLE_H + nSys * SYS_H + 1), sp, systems, notes, slots, lyrics, marks, title, head, shortBars, lyricY, yOf, dOf };
}

// src/render/svg.ts
var esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var n = (v) => (Math.round(v * 100) / 100).toString();
function toSvg(l, inlineStyle = false) {
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" class="staff-svg" width="${n(l.width)}" height="${n(l.height)}" viewBox="0 0 ${n(l.width)} ${n(l.height)}">`);
  if (inlineStyle) out.push(`<style>${STANDALONE_CSS}</style>`);
  const fs = n(4 * l.sp), lfs = n(LYRIC_EM * l.sp);
  for (const p of l.prims) {
    const c = p.cls ? ` class="${p.cls}"` : "";
    switch (p.t) {
      case "line":
        out.push(`<line${c} x1="${n(p.x1)}" y1="${n(p.y1)}" x2="${n(p.x2)}" y2="${n(p.y2)}" stroke-width="${n(p.w)}"/>`);
        break;
      case "glyph":
        out.push(`<text${c} x="${n(p.x)}" y="${n(p.y)}" font-family="Bravura" font-size="${p.size ? n(p.size) : fs}">${p.ch}</text>`);
        break;
      case "text":
        out.push(`<text${c} x="${n(p.x)}" y="${n(p.y)}" font-size="${p.size ? n(p.size) : lfs}" text-anchor="${p.anchor ?? "middle"}">${esc(p.s)}</text>`);
        break;
      case "path":
        out.push(`<path${c} d="${p.d}"/>`);
        break;
      case "rect":
        out.push(`<rect${c} x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" rx="${n(l.sp * 0.6)}"/>`);
        break;
    }
  }
  out.push("</svg>");
  return out.join("");
}
var STANDALONE_CSS = `
.staff-svg{background:#fff}
.staff-svg line{stroke:#2a2a2a;stroke-linecap:butt}
.staff-svg text{fill:#2a2a2a}
.staff-svg path{fill:#2a2a2a}
.staff-svg line.staff{stroke:#666}
.staff-svg path.tie{fill:none;stroke:#2a2a2a;stroke-width:1.4}
.staff-svg .ghost{fill:#a9b4c2;stroke:#a9b4c2}
.staff-svg path.tie.ghost{fill:none}
.staff-svg .cur{fill:#2b6cb0;stroke:#2b6cb0}
.staff-svg path.tie.cur{fill:none}
.staff-svg line.caret{stroke:#2b6cb0}
.staff-svg rect.warn{fill:#d9a23a}
.staff-svg text.lyric{font-family:system-ui,"Hiragino Sans","Noto Sans CJK JP",sans-serif}
.staff-svg line.melisma{stroke:#2a2a2a}
.staff-svg .sel{fill:#1d5fa8;stroke:#1d5fa8}
.staff-svg rect.selbox{fill:#e3edf9;opacity:.8}
.staff-svg path.tuplet-bracket{fill:none;stroke:#2a2a2a;stroke-width:1}
.staff-svg text.tempo-word{font-weight:600;font-family:system-ui,sans-serif}
.staff-svg text.tempo-num,.staff-svg text.key-label{font-family:system-ui,sans-serif}
`;

// src/ui/lyric-editor.ts
var CJK = /[\p{Script=Han}぀-ヿ]/u;
var LyricEditor = class {
  constructor(parent, host, layout, rerender) {
    this.parent = parent;
    this.host = host;
    this.layout = layout;
    this.rerender = rerender;
    const i = document.createElement("input");
    i.className = "lyric-input";
    i.type = "text";
    i.autocomplete = "off";
    i.spellcheck = false;
    i.hidden = true;
    i.setAttribute("autocapitalize", "off");
    i.setAttribute("enterkeyhint", "done");
    parent.appendChild(i);
    this.input = i;
    i.addEventListener("compositionend", () => this.absorb());
    i.addEventListener("input", (e) => {
      if (!e.isComposing) this.absorb();
    });
    i.addEventListener("blur", () => {
      if (this.open) setTimeout(() => {
        if (document.activeElement !== this.input) this.commitAndClose();
      }, 0);
    });
  }
  input;
  index = -1;
  system = 0;
  get open() {
    return this.index >= 0;
  }
  /** 在下标 i 的音下面打开（框里放着它现在的字，全选，方便直接改写）。 */
  openAt(i) {
    const st2 = this.host.get(), t = st2.song.tokens[i];
    if (!t || !lyricSlot(t)) return;
    this.index = i;
    this.input.value = t.lyric === MELISMA_MARK ? "~" : (t.lyric ?? "") + (t.hyph ? "-" : "");
    this.input.hidden = false;
    this.reposition();
    this.input.focus({ preventScroll: true });
    this.input.select();
  }
  /** 重画之后把框挪回那个音下面。 */
  reposition() {
    if (!this.open) return;
    const L = this.layout(), h = L?.lyrics.find((x) => x.index === this.index);
    if (!L || !h) {
      this.close();
      return;
    }
    this.system = h.system;
    const w = Math.max(48, this.input.value.length * L.sp * 1.6 + 24);
    Object.assign(this.input.style, { left: `${h.x - w / 2}px`, top: `${h.y - L.sp * 2.1}px`, width: `${w}px`, fontSize: `${L.sp * 1.6}px` });
  }
  /** 把框里的字贴到当前这个音（可能一次贴好几个音节，往后挪），并跳到下一个空位。 */
  place(text2, hyphEnd) {
    let syl = splitSyllables(text2);
    if (!syl.length) return;
    if (hyphEnd) syl = syl.map((s, k) => k === syl.length - 1 ? { ...s, hyph: true } : s);
    const { st: st2, last } = distributeFrom(this.host.get(), this.index, syl);
    this.host.set(st2);
    const nx = nextLyricSlot(st2.song.tokens, last);
    this.input.value = "";
    if (nx >= 0) {
      this.index = nx;
      this.input.value = this.slotText(nx);
      this.rerender();
      this.input.select();
    } else {
      this.index = -1;
      this.input.hidden = true;
      this.rerender();
    }
  }
  slotText(i) {
    const t = this.host.get().song.tokens[i];
    return t.lyric === MELISMA_MARK ? "~" : (t.lyric ?? "") + (t.hyph ? "-" : "");
  }
  /** 输入法选定 / 直接打字之后：中日文字立刻贴；拖腔记号立刻贴；英文等空格或「-」。 */
  absorb() {
    if (!this.open) return;
    const v = this.input.value;
    if (!v) return;
    if (/^[~～_＿ー]$/.test(v)) {
      this.place(v, false);
      return;
    }
    if (CJK.test(v) && !/[A-Za-z]/.test(v)) {
      this.place(v, false);
      return;
    }
    this.reposition();
  }
  /** 键盘路由来的动作（src/input/keys.ts 的「歌词框」那几行）。返回 false = 这一下不归歌词框管（让输入框照常打字）。 */
  act(a) {
    if (!this.open) return false;
    const v = this.input.value;
    switch (a) {
      case "commit":
        this.commitAndClose();
        return true;
      case "cancel":
        this.close();
        return true;
      case "next":
        if (v.trim()) this.place(v.trim(), false);
        else this.step(1);
        return true;
      case "prev":
        this.commitOnly();
        this.step(-1);
        return true;
      case "hyphen":
        if (!/[A-Za-z']$/.test(v)) return false;
        this.place(v, true);
        return true;
      case "back": {
        if (v) return false;
        const st2 = this.host.get(), cur = st2.song.tokens[this.index];
        if (cur?.lyric) this.host.set({ ...st2, song: { ...st2.song, tokens: st2.song.tokens.map((t, k) => k === this.index ? { ...cur, lyric: null, hyph: void 0 } : t) } });
        this.step(-1);
        return true;
      }
    }
  }
  /** 前后挪一个歌词位（不贴字）。 */
  step(d2) {
    const toks = this.host.get().song.tokens;
    const j = d2 > 0 ? nextLyricSlot(toks, this.index) : prevLyricSlot(toks, this.index);
    if (j < 0) {
      this.rerender();
      return;
    }
    this.index = j;
    this.input.value = this.slotText(j);
    this.rerender();
    this.input.select();
  }
  /** 框里有字就照原样贴到当前这个音（不往后挪）；空框 = 清掉这个音的字。 */
  commitOnly() {
    if (!this.open) return;
    const st2 = this.host.get(), cur = st2.song.tokens[this.index], v = this.input.value.trim();
    if (!cur) return;
    if (!v) {
      if (cur.lyric) this.host.set({ ...st2, song: { ...st2.song, tokens: st2.song.tokens.map((t, k) => k === this.index ? { ...cur, lyric: null, hyph: void 0 } : t) } });
      return;
    }
    if (v === this.slotText(this.index)) return;
    const syl = splitSyllables(v.replace(/-$/, "")).map((s, k, a) => k === a.length - 1 && /-$/.test(v) ? { ...s, hyph: true } : s);
    if (syl.length) this.host.set(distributeFrom(st2, this.index, syl).st);
  }
  commitAndClose() {
    if (!this.open) return;
    this.commitOnly();
    this.close();
  }
  close() {
    this.index = -1;
    this.input.value = "";
    this.input.hidden = true;
    this.rerender();
  }
};

// src/score/marks.ts
function markText(t) {
  if (t.kind === "key") return `1=${KEY_LABEL[t.fifths]}`;
  if (t.kind === "time") return `${t.beats}/${t.beatType}`;
  return String(t.bpm);
}
function parseMark(kind, raw) {
  const s = raw.trim().replace(/\s+/g, "").replace(/♯/g, "#").replace(/♭/g, "b");
  if (kind === "key") {
    const v = s.replace(/^1=/, "");
    let m = /^([+-]?\d)$/.exec(v);
    if (m) {
      const f = Number(m[1]);
      return f >= -7 && f <= 7 ? { kind, fifths: f } : null;
    }
    m = /^(\d)([#b])$/.exec(v);
    if (m) {
      const f = Number(m[1]) * (m[2] === "#" ? 1 : -1);
      return f >= -7 && f <= 7 ? { kind, fifths: f } : null;
    }
    const name = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
    for (const [f, label] of Object.entries(KEY_LABEL)) if (label.replace("\u266F", "#").replace("\u266D", "b") === name) return { kind, fifths: Number(f) };
    return null;
  }
  if (kind === "time") {
    const m = /^(\d{1,2})\/(\d{1,2})$/.exec(s);
    if (!m) return null;
    const beats = Number(m[1]), beatType = Number(m[2]);
    return beats >= 1 && beats <= 32 && [1, 2, 4, 8, 16, 32].includes(beatType) ? { kind, beats, beatType } : null;
  }
  const n2 = /(\d{2,3})/.exec(s);
  if (n2) {
    const bpm = Number(n2[1]);
    return bpm >= 20 && bpm <= 400 ? { kind, bpm } : null;
  }
  const w = TEMPO_WORDS.find((x) => x.it.toLowerCase() === s.toLowerCase() || x.zh === s);
  return w ? { kind, bpm: w.typical } : null;
}

// src/ui/mark-editor.ts
var KEY_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, -1, -2, -3, -4, -5, -6, -7];
var TIMES = [[2, 4], [3, 4], [4, 4], [5, 4], [3, 8], [6, 8], [9, 8], [12, 8], [7, 8], [2, 2]];
var accName = (f) => f > 0 ? `${f}\u266F` : f < 0 ? `${-f}\u266D` : "\u65E0\u5347\u964D";
var MarkEditor = class {
  constructor(parent, host, layout, rerender) {
    this.host = host;
    this.layout = layout;
    this.rerender = rerender;
    this.box = document.createElement("div");
    this.box.className = "mark-ed";
    this.box.hidden = true;
    this.box.innerHTML = `<div class="mark-row"><input class="mark-in" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" enterkeyhint="done" /><div class="metro" hidden title="\u6309\u8FD9\u4E2A\u901F\u5EA6\u6446\uFF1A\u6446\u5230\u4E00\u5934 = \u4E00\u62CD"><div class="metro-arm"></div></div><button class="btn primary mark-ok" hidden>\u786E\u5B9A</button></div><div class="mark-cands"></div>`;
    parent.appendChild(this.box);
    this.input = this.box.querySelector("input");
    this.list = this.box.querySelector(".mark-cands");
    this.metro = this.box.querySelector(".metro");
    this.ok = this.box.querySelector(".mark-ok");
    this.ok.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.confirmTempo();
    });
    this.input.addEventListener("input", () => {
      if (this.kind !== "tempo") return;
      const v = parseMark("tempo", this.input.value);
      if (v && v.kind === "tempo") this.setPending(v.bpm, false);
    });
    this.list.addEventListener("pointerdown", (e) => {
      const b = e.target.closest("[data-v]");
      if (!b) return;
      e.preventDefault();
      if (b.dataset.v === "delete") {
        this.remove();
        return;
      }
      const v = JSON.parse(b.dataset.v);
      if (v.kind === "tempo") {
        this.setPending(v.bpm, true);
        return;
      }
      this.apply(v);
      this.close();
    });
  }
  box;
  input;
  list;
  id = -1;
  fresh = false;
  initial = "";
  kind = null;
  pending = null;
  // 速度：正在试的 bpm（还没写进谱）
  metro;
  ok;
  system = 0;
  get open() {
    return this.id >= 0;
  }
  /** 键盘路由来的动作（src/input/keys.ts 的「记号框」那几行）。 */
  act(a) {
    if (a !== "commit") this.close();
    else if (this.kind === "tempo") this.confirmTempo();
    else this.commitAndClose();
  }
  indexNow() {
    return this.host.get().song.tokens.findIndex((t) => t.id === this.id);
  }
  /** 打开下标 i 的记号。fresh = 刚插进去的（没改就收起 = 撤掉）。 */
  openAt(i, fresh = false) {
    const st2 = this.host.get(), t = st2.song.tokens[i];
    if (!t || t.kind !== "key" && t.kind !== "time" && t.kind !== "tempo") return;
    this.id = t.id;
    this.fresh = fresh;
    this.initial = this.input.value = markText(t);
    this.input.inputMode = t.kind === "tempo" ? "numeric" : "text";
    this.input.placeholder = t.kind === "key" ? "1=D / Bb / 2#" : t.kind === "time" ? "3/4" : "90";
    this.kind = t.kind;
    this.fill(t, i >= headLen(st2.song.tokens));
    this.metro.hidden = this.ok.hidden = t.kind !== "tempo";
    this.pending = null;
    if (t.kind === "tempo") this.setPending(t.bpm, false);
    this.box.hidden = false;
    this.reposition();
    if (!matchMedia("(pointer: coarse)").matches) {
      this.input.focus({ preventScroll: true });
      this.input.select();
    }
  }
  fill(t, deletable) {
    const chip = (v, label, on, title = "") => `<button class="btn cand${on ? " is-on" : ""}" data-v='${JSON.stringify(v)}' title="${title}">${label}</button>`;
    let h = "";
    if (t.kind === "key") h = KEY_ORDER.map((f) => chip({ kind: "key", fifths: f }, `1=${KEY_LABEL[f]}`, f === t.fifths, accName(f))).join("");
    else if (t.kind === "time") h = TIMES.map(([b, bt]) => chip({ kind: "time", beats: b, beatType: bt }, `${b}/${bt}`, b === t.beats && bt === t.beatType)).join("");
    else {
      const cur = tempoWord(t.bpm).it;
      h = TEMPO_WORDS.map((w) => chip({ kind: "tempo", bpm: w.typical }, `<b>${w.it}</b><small>${w.zh} ${w.typical}</small>`, w.it === cur, `${w.from} \u8D77`)).join("");
    }
    if (deletable) h += `<button class="btn cand danger" data-v="delete">\u5220\u9664</button>`;
    this.list.innerHTML = h;
    this.list.className = `mark-cands ${t.kind}`;
  }
  /** 速度：换试听值——节拍器按它摆（重新起摆，和数字对得上），候选高亮它那一档；fromChip = 框里的数字也跟着换。 */
  setPending(bpm, fromChip) {
    this.pending = bpm;
    if (fromChip) this.input.value = String(bpm);
    const arm = this.metro.firstElementChild;
    this.metro.style.setProperty("--beat", `${60 / bpm}s`);
    arm.style.animation = "none";
    void arm.offsetWidth;
    arm.style.animation = "";
    const word = tempoWord(bpm).it;
    this.list.querySelectorAll("[data-v]").forEach((b) => {
      const v = b.dataset.v === "delete" ? null : JSON.parse(b.dataset.v);
      b.classList.toggle("is-on", v?.kind === "tempo" && tempoWord(v.bpm).it === word);
    });
  }
  /** 速度：「确定」= 把试听值写进谱、收起。 */
  confirmTempo() {
    if (this.pending !== null) {
      const t = this.host.get().song.tokens[this.indexNow()];
      if (t?.kind === "tempo" && t.bpm !== this.pending) this.apply({ kind: "tempo", bpm: this.pending });
      else if (t?.kind === "tempo") this.fresh = false;
    }
    this.close();
  }
  /** 重画之后把框挪回那个记号下面（记号没了 = 收起）。 */
  reposition() {
    if (!this.open) return;
    const L = this.layout(), i = this.indexNow(), h = L?.marks.find((m) => m.index === i);
    if (!L || !h) {
      this.id = -1;
      this.box.hidden = true;
      return;
    }
    this.system = h.system;
    const parentW = this.box.parentElement?.clientWidth ?? 400, w = Math.min(340, parentW - 16);
    Object.assign(this.box.style, { left: `${Math.max(8, Math.min(h.x, parentW - w - 8))}px`, top: `${h.y + h.h + 4}px`, width: `${w}px` });
  }
  apply(v) {
    const i = this.indexNow();
    if (i < 0) return;
    this.fresh = false;
    this.host.set(setMark(this.host.get(), i, v));
  }
  remove() {
    const i = this.indexNow();
    this.id = -1;
    this.box.hidden = true;
    if (i >= 0) this.host.set(deleteMark(this.host.get(), i));
    else this.rerender();
  }
  /** 收起：框里打了合法的新值就先改（速度例外：没按「确定」= 不改）。 */
  commitAndClose() {
    if (!this.open) return;
    if (this.kind === "tempo") {
      this.close();
      return;
    }
    const t = this.host.get().song.tokens[this.indexNow()];
    if (t && this.input.value.trim() !== this.initial) {
      const v = parseMark(t.kind, this.input.value);
      if (v) this.apply(v);
    }
    this.close();
  }
  /** 收起不改；新插的记号没改过 = 撤掉。 */
  close() {
    if (!this.open) return;
    if (this.fresh) {
      this.remove();
      return;
    }
    this.id = -1;
    this.box.hidden = true;
    this.rerender();
  }
};

// src/ui/title-editor.ts
var TitleEditor = class {
  constructor(parent, host, layout) {
    this.host = host;
    this.layout = layout;
    this.input = document.createElement("input");
    this.input.className = "title-input";
    this.input.type = "text";
    this.input.hidden = true;
    this.input.placeholder = "\u6B4C\u540D\uFF08\u53EF\u4E0D\u586B\uFF09";
    this.input.autocomplete = "off";
    this.input.spellcheck = false;
    this.input.enterKeyHint = "done";
    parent.appendChild(this.input);
    this.input.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        this.commitAndClose();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      }
    });
    this.input.addEventListener("blur", () => {
      if (this.open) this.commitAndClose();
    });
  }
  input;
  open = false;
  openNow() {
    this.open = true;
    this.input.value = this.host.get().song.title ?? "";
    this.input.hidden = false;
    this.reposition();
    this.input.focus({ preventScroll: true });
    this.input.select();
  }
  commitAndClose() {
    if (!this.open) return;
    const v = this.input.value;
    this.close();
    this.host.set(setTitle(this.host.get(), v));
  }
  close() {
    this.open = false;
    this.input.hidden = true;
  }
  reposition() {
    const L = this.layout();
    if (!this.open || !L) return;
    const t = L.title;
    Object.assign(this.input.style, { left: `${t.x}px`, top: `${t.y}px`, width: `${t.w}px`, height: `${t.h}px`, fontSize: `${t.size}px` });
  }
};

// src/ui/score-view.ts
var DUR_LADDER = [6, 12, 18, 24, 36, 48, 72, 96, 144, 192].map((v) => v * TPQ / 48);
var ScoreView = class {
  constructor(el, host) {
    this.el = el;
    this.host = host;
    this.sheet = document.createElement("div");
    this.sheet.className = "sheet";
    this.boxEl = document.createElement("div");
    this.boxEl.className = "marquee";
    this.boxEl.hidden = true;
    el.replaceChildren(this.sheet);
    this.lyrics = new LyricEditor(this.sheet, host, () => this.layout, () => this.render());
    this.marks = new MarkEditor(this.sheet, host, () => this.layout, () => this.render());
    this.title = new TitleEditor(this.sheet, host, () => this.layout);
    el.addEventListener("pointerdown", (e) => this.down(e));
    el.addEventListener("pointermove", (e) => this.move(e));
    el.addEventListener("pointerup", (e) => this.up(e));
    el.addEventListener("pointercancel", () => {
      if (this.drag) this.host.release?.();
      this.drag = null;
      this.finger = null;
      this.box = null;
      this.boxEl.hidden = true;
    });
    new ResizeObserver(() => this.render()).observe(el);
  }
  layout = null;
  sheet;
  ctx = document.createElement("canvas").getContext("2d");
  drag = null;
  finger = null;
  box = null;
  boxEl;
  lyrics;
  marks;
  title;
  /** 五线谱间距（px）：触屏 11、鼠标 10；窄屏（< 420，iPhone）跟着宽度小一点，最小 8.5（user「iPhone SE2 一行只有一小节加一大片空白 几个简易试一下」）。 */
  get sp() {
    const base2 = matchMedia("(pointer: coarse)").matches ? 11 : 10, w = this.el.clientWidth;
    return w > 0 && w < 420 ? Math.max(8.5, Math.min(base2, w / 42)) : base2;
  }
  render() {
    const st2 = this.host.get(), sp = this.sp;
    this.ctx.font = `${LYRIC_EM * sp}px system-ui, "Hiragino Sans", "PingFang SC", "Noto Sans CJK JP", sans-serif`;
    const width = Math.max(320, this.el.clientWidth);
    this.layout = engrave(st2.song, { width, sp, caret: st2.caret, sel: st2.sel, measureLyric: (s) => this.ctx.measureText(s).width, titlePlaceholder: true, autoBars: this.host.autoBars?.() ?? true });
    const svg = toSvg(this.layout);
    const old = this.sheet.querySelector("svg");
    if (old) old.outerHTML = svg;
    else this.sheet.insertAdjacentHTML("afterbegin", svg);
    if (!this.boxEl.isConnected) this.sheet.appendChild(this.boxEl);
    this.lyrics.reposition();
    this.marks.reposition();
    this.title.reposition();
    this.follow();
  }
  /** 光标（或选中）那一行保持在视野里（只滚谱面板自己，页面不滚）。 */
  follow() {
    const L = this.layout, st2 = this.host.get();
    if (!L) return;
    let sys = L.head?.system ?? -1;
    if (sys < 0 && st2.sel) sys = L.notes.find((n2) => n2.index >= st2.sel.from && n2.index < st2.sel.to)?.system ?? -1;
    if (this.lyrics.open) sys = this.lyrics.system;
    if (this.marks.open) sys = this.marks.system;
    const box = L.systems[sys];
    if (!box) return;
    const top = this.el.scrollTop, h = this.el.clientHeight;
    if (box.top < top) this.el.scrollTop = box.top;
    else if (box.bottom > top + h) this.el.scrollTop = box.bottom - h;
  }
  local(e) {
    const r = this.el.getBoundingClientRect();
    return { x: e.clientX - r.left + this.el.scrollLeft, y: e.clientY - r.top + this.el.scrollTop };
  }
  systemAt(y) {
    const L = this.layout;
    const i = L.systems.findIndex((s) => y >= s.top && y < s.bottom);
    return i < 0 ? L.systems.length - 1 : i;
  }
  down(e) {
    if (e.target.closest(".lyric-input, .mark-ed, .title-input")) return;
    const L = this.layout;
    if (!L) return;
    this.el.focus({ preventScroll: true });
    const p = this.local(e);
    if (e.pointerType === "touch") {
      this.finger = { pid: e.pointerId, y0: e.clientY, top0: this.el.scrollTop, x: p.x, y: p.y, moved: false, shift: e.shiftKey };
      this.el.setPointerCapture(e.pointerId);
      return;
    }
    e.preventDefault();
    if (this.tap(p.x, p.y, e.shiftKey, e.pointerId)) return;
    this.box = { pid: e.pointerId, x0: p.x, y0: p.y, moved: false, st0: this.host.get() };
    this.el.setPointerCapture(e.pointerId);
  }
  /** 一次轻点：记号 → 记号框；歌词行 → 歌词框；音符 → 选中（+ 笔 / 鼠标开始拖）。点中了东西返回 true；落在空白处返回 false（调用方决定放光标还是框选）。 */
  tap(x, y, shift, pid) {
    const L0 = this.layout, wasMark = this.marks.open;
    this.lyrics.commitAndClose();
    this.marks.commitAndClose();
    if (wasMark) {
      this.host.focus?.("staff");
      return true;
    }
    const L = this.layout ?? L0, sp = L.sp, sys = this.systemAt(y), st2 = this.host.get();
    const tt = L.title;
    if (x >= tt.x && x <= tt.x + tt.w && y >= tt.y && y <= tt.y + tt.h) {
      this.title.openNow();
      this.host.focus?.("text");
      return true;
    }
    const mk2 = L.marks.find((m) => x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h);
    if (mk2) {
      this.marks.openAt(mk2.index);
      return true;
    }
    const ly = L.lyricY(sys);
    if (y > ly - sp * 2.2 && y < ly + sp * 1.2) {
      const cands = L.lyrics.filter((h) => h.system === sys);
      if (cands.length) {
        const best = cands.reduce((a, b) => Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a);
        if (Math.abs(best.x - x) < sp * 4) {
          this.lyrics.openAt(best.index);
          this.host.focus?.("text");
          return true;
        }
      }
    }
    const hit = L.notes.find((n2) => n2.system === sys && x >= n2.x - sp * 0.5 && x <= n2.x + n2.w + sp * 0.5 && Math.abs(y - n2.y) <= sp * 0.9);
    if (hit) {
      this.host.focus?.("staff");
      const cur = st2.sel;
      this.host.set(shift && cur ? select(st2, Math.min(cur.from, hit.index), Math.max(cur.to, hit.index + 1)) : select(st2, hit.index, hit.index + 1));
      if (pid !== null) {
        const t = st2.song.tokens[hit.index];
        this.drag = { index: hit.index, d0: hit.d, dur0: t.dur, x0: x, y0: y, axis: "", pid, heard: hit.d };
        this.el.setPointerCapture(pid);
        this.host.audition?.(hit.index, true);
      } else this.host.audition?.(hit.index);
      return true;
    }
    return false;
  }
  /** 空白处 → 最近的光标落点（= 写）。 */
  caretAt(x, y, st2 = this.host.get()) {
    const L = this.layout, sys = this.systemAt(y), cands = L.slots.filter((s) => s.system === sys);
    if (!cands.length) return st2;
    const best = cands.reduce((a, b) => Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a);
    return setCaret(st2, best.caret);
  }
  /** 框选：框住的音（音头中心在框里）从第一个到最后一个选成一段；一个都没框住 = 回到起点的光标。 */
  boxSelect(x1, y1) {
    const b = this.box, L = this.layout, xa = Math.min(b.x0, x1), xb = Math.max(b.x0, x1), ya = Math.min(b.y0, y1), yb = Math.max(b.y0, y1);
    Object.assign(this.boxEl.style, { left: `${xa}px`, top: `${ya}px`, width: `${xb - xa}px`, height: `${yb - ya}px` });
    const inside = L.notes.filter((n2) => {
      const cx = n2.x + n2.w / 2;
      return cx >= xa && cx <= xb && n2.y >= ya && n2.y <= yb;
    }).map((n2) => n2.index);
    if (!inside.length) {
      this.host.set(this.caretAt(b.x0, b.y0, b.st0));
      return;
    }
    this.host.set(select(b.st0, Math.min(...inside), Math.max(...inside) + 1));
  }
  move(e) {
    if (this.finger && e.pointerId === this.finger.pid) {
      const dy2 = e.clientY - this.finger.y0;
      if (Math.abs(dy2) > 6) this.finger.moved = true;
      if (this.finger.moved) this.el.scrollTop = this.finger.top0 - dy2;
      return;
    }
    if (this.box && e.pointerId === this.box.pid && this.layout) {
      const p2 = this.local(e), b = this.box;
      if (!b.moved && Math.hypot(p2.x - b.x0, p2.y - b.y0) < 6) return;
      if (!b.moved) {
        b.moved = true;
        this.boxEl.hidden = false;
      }
      this.boxSelect(p2.x, p2.y);
      return;
    }
    const g2 = this.drag, L = this.layout;
    if (!g2 || !L || e.pointerId !== g2.pid) return;
    const p = this.local(e), dx = p.x - g2.x0, dy = p.y - g2.y0;
    if (!g2.axis) {
      if (Math.hypot(dx, dy) < 6) return;
      g2.axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x";
      if (g2.axis === "x") this.host.release?.();
    }
    const st2 = this.host.get();
    if (g2.axis === "y") {
      const d2 = g2.d0 + Math.round(-dy / (L.sp / 2));
      if (d2 === g2.heard) return;
      g2.heard = d2;
      this.host.set(setNote(st2, g2.index, { pitch: fromDiatonic(d2, keyAt(st2.song, g2.index)) }));
      if (this.host.glide) this.host.glide(g2.index);
      else this.host.audition?.(g2.index, true);
    } else {
      const i0 = DUR_LADDER.reduce((bi, v, i2) => Math.abs(v - g2.dur0) < Math.abs(DUR_LADDER[bi] - g2.dur0) ? i2 : bi, 0);
      const i = Math.max(0, Math.min(DUR_LADDER.length - 1, i0 + Math.round(dx / (L.sp * 2.2))));
      this.host.set(setDur(st2, g2.index, DUR_LADDER[i]));
    }
  }
  up(e) {
    if (this.finger && e.pointerId === this.finger.pid) {
      const f = this.finger;
      this.finger = null;
      if (!f.moved && this.layout && !this.tap(f.x, f.y, f.shift, null)) {
        this.host.set(this.caretAt(f.x, f.y));
        this.host.focus?.("staff");
      }
      return;
    }
    if (this.box && e.pointerId === this.box.pid) {
      const b = this.box;
      this.box = null;
      this.boxEl.hidden = true;
      if (!b.moved && this.layout) this.host.set(this.caretAt(b.x0, b.y0));
      this.host.focus?.("staff");
      return;
    }
    if (this.drag && e.pointerId === this.drag.pid) {
      if (this.drag.axis !== "x") this.host.release?.();
      this.drag = null;
    }
  }
};

// src/ui/platform-guards.ts
function isTextTarget(t) {
  const el = t;
  if (!el || !el.tagName) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}
function installPlatformGuards(surfaces) {
  const cap = { capture: true, passive: false };
  window.addEventListener("dblclick", (e) => {
    if (!isTextTarget(e.target)) e.preventDefault();
  }, cap);
  window.addEventListener("touchstart", (e) => {
    if (e.touches.length >= 3 && !isTextTarget(e.target)) e.preventDefault();
  }, cap);
  window.addEventListener("gesturestart", (e) => e.preventDefault(), cap);
  window.addEventListener("gesturechange", (e) => e.preventDefault(), cap);
  document.addEventListener("selectstart", (e) => {
    if (!isTextTarget(e.target)) e.preventDefault();
  }, { capture: true });
  document.addEventListener("selectionchange", () => {
    const sel = document.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    let n2 = sel.anchorNode;
    if (n2 && n2.nodeType === Node.TEXT_NODE) n2 = n2.parentElement;
    for (let el = n2; el; el = el.parentElement) if (isTextTarget(el)) return;
    sel.removeAllRanges();
  });
  for (const s of surfaces) {
    s.addEventListener("contextmenu", (e) => {
      if (!isTextTarget(e.target)) e.preventDefault();
    });
    s.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1 && !isTextTarget(e.target)) e.preventDefault();
    }, { passive: false });
  }
}

// src/score/scales.ts
var d = (s) => s.split(" ").map((t) => ({ deg: Number(t.replace(/[#b]/g, "")), alt: t.startsWith("#") ? 1 : t.startsWith("b") ? -1 : 0 }));
var mk = (id, name, group, degs, homeDeg) => {
  const ds = d(degs), h = d(homeDeg)[0];
  return { id, name, group, degs: ds, home: ds.findIndex((x) => x.deg === h.deg && x.alt === h.alt) };
};
var SCALES = [
  mk("major", "\u5927\u8C03", "\u5927\u5C0F\u8C03", "1 2 3 4 5 6 7", "1"),
  mk("minor", "\u5C0F\u8C03", "\u5927\u5C0F\u8C03", "1 2 3 4 5 6 7", "6"),
  mk("harmonic-minor", "\u548C\u58F0\u5C0F\u8C03", "\u5927\u5C0F\u8C03", "1 2 3 4 #5 6 7", "6"),
  mk("melodic-minor", "\u65CB\u5F8B\u5C0F\u8C03", "\u5927\u5C0F\u8C03", "1 2 3 #4 #5 6 7", "6"),
  mk("gong", "\u5BAB\u8C03\u5F0F", "\u4E94\u58F0", "1 2 3 5 6", "1"),
  mk("shang", "\u5546\u8C03\u5F0F", "\u4E94\u58F0", "1 2 3 5 6", "2"),
  mk("jue", "\u89D2\u8C03\u5F0F", "\u4E94\u58F0", "1 2 3 5 6", "3"),
  mk("zhi", "\u5FB5\u8C03\u5F0F", "\u4E94\u58F0", "1 2 3 5 6", "5"),
  mk("yu", "\u7FBD\u8C03\u5F0F", "\u4E94\u58F0", "1 2 3 5 6", "6"),
  mk("qingjue", "\u516D\u58F0\u52A0\u6E05\u89D2", "\u6C11\u65CF", "1 2 3 4 5 6", "1"),
  mk("biangong", "\u516D\u58F0\u52A0\u53D8\u5BAB", "\u6C11\u65CF", "1 2 3 5 6 7", "1"),
  mk("yayue", "\u96C5\u4E50", "\u6C11\u65CF", "1 2 3 #4 5 6 7", "1"),
  mk("yanyue", "\u71D5\u4E50", "\u6C11\u65CF", "1 2 3 4 5 6 b7", "1"),
  mk("miyakobushi", "\u90FD\u8282", "\u65E5\u672C", "1 3 4 6 7", "3"),
  mk("ryukyu", "\u7409\u7403", "\u65E5\u672C", "1 3 4 5 7", "1"),
  mk("blues", "\u5E03\u9C81\u65AF", "\u5176\u4ED6", "1 b3 4 b5 5 b7", "1"),
  mk("dorian", "\u591A\u5229\u4E9A", "\u6559\u4F1A\u8C03\u5F0F", "1 2 3 4 5 6 7", "2"),
  mk("phrygian", "\u5F17\u91CC\u51E0\u4E9A", "\u6559\u4F1A\u8C03\u5F0F", "1 2 3 4 5 6 7", "3"),
  mk("lydian", "\u5229\u5E95\u4E9A", "\u6559\u4F1A\u8C03\u5F0F", "1 2 3 4 5 6 7", "4"),
  mk("mixolydian", "\u6DF7\u5408\u5229\u5E95\u4E9A", "\u6559\u4F1A\u8C03\u5F0F", "1 2 3 4 5 6 7", "5"),
  mk("locrian", "\u6D1B\u514B\u5229\u4E9A", "\u6559\u4F1A\u8C03\u5F0F", "1 2 3 4 5 6 7", "7"),
  mk("spanish", "\u897F\u73ED\u7259", "\u5176\u4ED6", "1 2 3 4 #5 6 7", "3"),
  mk("double-harmonic", "\u963F\u62C9\u4F2F", "\u5176\u4ED6", "1 b2 3 4 5 b6 7", "1"),
  mk("hungarian-minor", "\u5308\u7259\u5229\u5C0F\u8C03", "\u5176\u4ED6", "1 #2 3 4 #5 6 7", "6"),
  mk("whole-tone", "\u5168\u97F3\u9636", "\u5176\u4ED6", "1 2 3 #4 #5 #6", "1"),
  mk("chromatic", "\u534A\u97F3\u9636", "\u5176\u4ED6", "1 #1 2 #2 3 4 #4 5 #5 6 #6 7", "1")
];
var scaleById = (id) => SCALES.find((s) => s.id === id) ?? SCALES[0];
function ladderAt(sc, k, tonicD, fifths) {
  const n2 = sc.degs.length, oct = Math.floor(k / n2), deg = sc.degs[k - oct * n2];
  const pitch = alterBy(fromDiatonic(tonicD + deg.deg - 1 + 7 * oct, fifths), deg.alt);
  return { pitch, deg, oct };
}
function ladderFirstAtOrAbove(sc, midi, tonicD, fifths) {
  let k = Math.floor((midi - midiOf(ladderAt(sc, 0, tonicD, fifths).pitch)) / 12 * sc.degs.length) - sc.degs.length;
  while (midiOf(ladderAt(sc, k, tonicD, fifths).pitch) < midi) k++;
  return k;
}
function ladderHome(sc, tonicD, fifths) {
  const n2 = sc.degs.length, m0 = midiOf(ladderAt(sc, 0, tonicD, fifths).pitch);
  const up = sc.home, down = sc.home - n2;
  return Math.abs(midiOf(ladderAt(sc, down, tonicD, fifths).pitch) - m0) < Math.abs(midiOf(ladderAt(sc, up, tonicD, fifths).pitch) - m0) ? down : up;
}
var degLabel = (g2) => `${g2.alt > 0 ? "\u266F" : g2.alt < 0 ? "\u266D" : ""}${g2.deg}`;

// src/ui/drum.ts
var ROW = 44;
var VISIBLE = 5;
var LOOP_COPIES = 7;
var RECENTER_MS = 140;
var current = null;
function openDrum(anchor, cols, o) {
  current?.close();
  const r = anchor.getBoundingClientRect();
  const box = document.createElement("div");
  box.className = "drum";
  const total = cols.reduce((s, c) => s + c.width, 0) + (cols.length - 1) * 2;
  let left = r.left;
  if (left + total > innerWidth - 4) left = Math.max(4, r.right - total);
  Object.assign(box.style, { left: `${left}px`, top: `${Math.max(4, Math.min(r.top + r.height / 2 - ROW * VISIBLE / 2, innerHeight - ROW * VISIBLE - 4))}px`, height: `${ROW * VISIBLE}px` });
  document.body.appendChild(box);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    box.remove();
    document.removeEventListener("pointerdown", outside, true);
    removeEventListener("keydown", esc4, true);
    if (current === handle) current = null;
    o.onClose?.();
  };
  const outside = (e) => {
    if (box.contains(e.target)) return;
    if (!e.target.closest?.("[data-knob]")) {
      e.preventDefault();
      e.stopPropagation();
    }
    close();
  };
  const esc4 = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };
  setTimeout(() => document.addEventListener("pointerdown", outside, true), 0);
  addEventListener("keydown", esc4, true);
  cols.forEach((c, ci) => {
    const col = document.createElement("div");
    col.className = "drum-col";
    col.style.width = `${c.width}px`;
    if (c.title) col.title = c.title;
    const padRows = Math.floor(VISIBLE / 2), n2 = c.items.length, copies = c.loop ? LOOP_COPIES : 1, mid = Math.floor(copies / 2) * n2;
    col.innerHTML = `<div class="drum-pad" style="height:${ROW * padRows}px"></div>` + Array.from({ length: n2 * copies }, (_, r2) => `<div class="drum-item" data-i="${r2}">${c.items[r2 % n2]}</div>`).join("") + `<div class="drum-pad" style="height:${ROW * padRows}px"></div>`;
    box.appendChild(col);
    const items = [...col.querySelectorAll(".drum-item")], total2 = items.length;
    const raw = () => Math.max(0, Math.min(total2 - 1, Math.round(col.scrollTop / ROW)));
    let shown = c.index, recenter = 0;
    const paint = () => {
      const top = col.scrollTop, a = raw();
      items.forEach((el, i) => {
        el.style.opacity = String(Math.max(0.25, 1 - Math.abs(i * ROW - top) / ROW * 0.3));
        el.classList.toggle("on", i === a);
      });
    };
    col.scrollTop = (c.index + mid) * ROW;
    paint();
    col.addEventListener("scroll", () => {
      paint();
      const i = raw() % n2;
      if (i !== shown) {
        shown = i;
        o.onChange(ci, i);
      }
      if (c.loop) {
        clearTimeout(recenter);
        recenter = window.setTimeout(() => {
          const r2 = raw();
          if (Math.abs(r2 - r2 % n2 - mid) >= n2) col.scrollTop = (r2 % n2 + mid) * ROW;
        }, RECENTER_MS);
      }
    }, { passive: true });
    col.addEventListener("click", (e) => {
      const it = e.target.closest(".drum-item");
      if (!it) return;
      const i = Number(it.dataset.i) % n2;
      if (i !== shown) {
        shown = i;
        o.onChange(ci, i);
      }
      close();
    });
  });
  const handle = {
    close,
    setItems: (ci, items) => {
      const col = box.querySelectorAll(".drum-col")[ci];
      if (!col) return;
      col.querySelectorAll(".drum-item").forEach((el, i) => {
        const h = items[i % items.length];
        if (h !== void 0) el.innerHTML = h;
      });
    }
  };
  current = handle;
  return handle;
}

// src/ui/pad.ts
var HER_LOW = 57;
var HER_HIGH = 76;
var padForm = () => Math.min(innerWidth, innerHeight) >= 600 && innerWidth >= 700 ? "tablet" : "phone";
var KEY_METRIC = { tablet: { h: 55.5, gap: 9 }, phone: { h: 46, gap: 6 } };
var SWIPE = 20;
var STEP = 28;
var MOVE = 6;
var STACK = 150;
var NARROW = 96;
var TIGHT = 130;
var UNITS = [5, 4, 3, 2, 1, 0];
var TUP = [0, 3, 5, 6, 7];
var SHIFTS = [4, 3, 2, 1, 0, -1, -2, -3, -4];
var octDots = (n2) => n2 > 0 ? `<span class="jp-dots">${"<i></i>".repeat(n2)}</span>` : `<span class="jp-dots"></span>`;
var UNIT_GLYPH = ["\uE1DB", "\uE1D9", "\uE1D7", "\uE1D5", "\uE1D3", "\uE1D2"];
var QUARTER = "\uECA5";
var TS = (n2) => String.fromCodePoint(57472 + n2);
var UNIT_NAME = ["\u4E09\u5341\u4E8C\u5206", "\u5341\u516D\u5206", "\u516B\u5206", "\u56DB\u5206", "\u4E8C\u5206", "\u5168\u97F3\u7B26"];
var KEY_NAMES = KEY_LABEL;
var KEY_CIRCLE = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
function tupletMark(n2, unit) {
  const S = 7, M = 1.5, HY = 25, TOP = 11.5, hx = (i) => M + 3 + i * S, sx = (i) => hx(i) + 2.35;
  const W2 = hx(n2 - 1) + 3 + M, hollow = unit >= 4, beams = Math.max(0, 3 - unit), cx = W2 / 2, by = 4.5;
  const heads = Array.from({ length: n2 }, (_, i) => `<ellipse class="${hollow ? "ho" : "fi"}" cx="${hx(i)}" cy="${HY}" rx="${unit === 5 ? 3 : 2.6}" ry="1.85" transform="rotate(-20 ${hx(i)} ${HY})"/>`).join("");
  const stems = unit <= 4 ? Array.from({ length: n2 }, (_, i) => `<line x1="${sx(i)}" y1="${HY - 0.5}" x2="${sx(i)}" y2="${TOP}"/>`).join("") : "";
  const beam = Array.from({ length: beams }, (_, k) => `<rect x="${sx(0) - 0.45}" y="${TOP + k * 3}" width="${sx(n2 - 1) - sx(0) + 0.9}" height="1.8"/>`).join("");
  return `<svg class="tupsvg" viewBox="0 0 ${W2} 28.5" width="${(W2 * 32 / 28.5).toFixed(1)}" height="32" aria-label="${n2} \u8FDE\u97F3"><path class="br" d="M${M} ${by + 2.5}V${by}H${cx - 3.6}M${cx + 3.6} ${by}H${W2 - M}V${by + 2.5}"/><text x="${cx}" y="${by + 3}" text-anchor="middle">${String.fromCodePoint(59520 + n2)}</text>${stems}${beam}${heads}</svg>`;
}
var keyLabel = (f, sc) => `<span class="kk">1=${KEY_LABEL[f] ?? "?"}</span><small>${sc.name}</small>`;
var pretty = (p) => pitchName(p).replace(/#/g, "\u266F").replace(/b(?=\d)|b(?=b)/g, "\u266D");
function homeTonic(fifths) {
  const t = tonicStepIndex(fifths), h = diatonicIndex(HOME);
  return t + 7 * Math.floor((h - t) / 7);
}
var scaleItem = (sc) => `<span class="sc"><b>${sc.name}</b><small>${[...sc.degs.slice(sc.home), ...sc.degs.slice(0, sc.home)].map(degLabel).join(" ")}</small></span>`;
var Pad = class {
  constructor(el, host) {
    this.el = el;
    this.host = host;
    this.render();
    addEventListener("resize", () => this.render());
  }
  rowShift = 0;
  // 音域窗口挪过几行
  cols = 4;
  // 每行几个音（MEDO = 4）
  rowsSetting = 4;
  // 默认 4 行（user「默认还是四行」）；「自动」= 按设备和屏幕剩下的高度算
  layoutMode = "absolute";
  // 首调 / 绝对；默认绝对（user「键盘默认绝对布局」）
  mode = "normal";
  gridFor = "";
  toolsFor = "";
  /** 正按着的音（来源 id → 五线谱位置）：手指和电脑键盘共用，pad 上对应的键按住期间一直亮。 */
  held = /* @__PURE__ */ new Map();
  /** 正在音键上滑的手指（pointerId → 起点 y、当前升降、哪个键）。 */
  swipes = /* @__PURE__ */ new Map();
  /** 网格上每个键（调式梯子上的第 k 级）的音高。 */
  keys = /* @__PURE__ */ new Map();
  rows() {
    if (this.rowsSetting !== "auto") return this.rowsSetting;
    const m = KEY_METRIC[padForm()], avail = innerHeight >= innerWidth ? innerHeight * 0.45 - 110 : innerHeight - 160;
    return Math.max(4, Math.min(6, Math.floor((avail + m.gap) / (m.h + m.gap))));
  }
  /** 音域窗口第 shift 档的范围文字「最低–最高」（user「G4也谜语人，应该是xx-xx」）。 */
  spanText(shift, f, rows) {
    const lo = this.baseAt(shift, f, rows), hi = lo + rows * this.cols - 1;
    return `${pretty(this.pitchAt(lo, f))}\u2013${pretty(this.pitchAt(hi, f))}`;
  }
  /** 同上，画在旋钮 / 滚轮里：放得下就一行「F3–G5」；太窄就两行，下面那行是低的那头（user「也许上下两个吧，下面是lower bound」）。 */
  spanHtml(shift, f, rows, narrow) {
    if (!narrow) return this.spanText(shift, f, rows);
    const lo = this.baseAt(shift, f, rows), hi = lo + rows * this.cols - 1;
    return `<span class="rg"><span>${pretty(this.pitchAt(hi, f))}</span><span>${pretty(this.pitchAt(lo, f))}</span></span>`;
  }
  /** 音域旋钮窄到一行写不下（手机 / 桌面的窄 pad）。 */
  rangeNarrow() {
    const b = this.el.querySelector(".k-range");
    return !!b && b.clientWidth < NARROW;
  }
  scale() {
    return scaleById(this.host.state().input.inputScale);
  }
  /** 调式梯子上第 k 级的音高（k = 0 是 do；pad 的「1=」+ 调式定）。 */
  pitchAt(k, f) {
    return ladderAt(this.scale(), k, homeTonic(f), f).pitch;
  }
  /** 音域窗口第 shift 档时，左下那个键在调式梯子上是第几级：绝对 = 那一行从 C4（或它上面第一个调式音）起；
   *  首调 = 从主音起（小调 / 羽调式从 6 起）；中央那一行默认在中线下面一行。 */
  baseAt(shift, f, rows) {
    const sc = this.scale(), t = homeTonic(f);
    const anchor = this.layoutMode === "absolute" ? ladderFirstAtOrAbove(sc, 60, t, f) : ladderHome(sc, t, f);
    return anchor + this.cols * (shift - Math.floor((rows - 1) / 2));
  }
  /** 状态变了：结构没变就只改文字和样式（按住的键不会被重建打断）。
   *  三块各管各的：最上面一排旋钮或候选（模式 / 有没有选中变了才重建）、写字键一排（只建一次）、音键网格（调 / 音域 / 布局变了才重建）——
   *  旋钮上滑着的时候值一直在变、网格跟着重建，旋钮那个元素不动，手指不会丢。 */
  render() {
    const st2 = this.host.state(), f = inputKey(st2), rows = this.rows(), form = padForm();
    const base2 = this.baseAt(this.rowShift, f, rows);
    if ((this.mode === "transpose" || this.mode === "modulate") && !st2.sel) this.mode = "normal";
    const selKey = st2.sel ? keyAt(st2.song, st2.sel.from) : null;
    this.el.dataset.form = form;
    this.el.style.setProperty("--cols", String(this.cols));
    if (!this.el.querySelector(".pad-grid")) {
      this.el.innerHTML = `<div class="pad-head"></div><div class="pad-tools writes"><button class="btn" data-caret="-1" title="\u5149\u6807\u5DE6\u79FB\uFF08${hint("left")}\uFF09">\u2190</button><button class="btn" data-caret="1" title="\u5149\u6807\u53F3\u79FB\uFF08${hint("right")}\uFF09">\u2192</button><button class="btn wk" data-cmd="rest" title="\u4F11\u6B62\uFF08${hint("rest")}\uFF09"><span>0</span><small>\u4F11\u6B62</small></button><button class="btn wk" data-cmd="bar" title="\u5C0F\u8282\u7EBF\uFF08${hint("bar")}\uFF09"><span>|</span><small>\u5C0F\u8282\u7EBF</small></button><button class="btn wk" data-cmd="extend" title="\u62C9\u957F\u4E00\u4EFD\uFF08${hint("extend")}\uFF09"><span>\u2014</span><small>\u62C9\u957F</small></button><button class="btn" data-cmd="backspace" title="\u9000\u683C\uFF08${hint("backspace")}\uFF09"><svg class="ico"><use href="#backspace"/></svg></button></div><div class="pad-grid"></div>`;
      const w = this.el.querySelector(".writes");
      this.on(w, "[data-caret]", (b) => this.host.onCommand({ k: "caret", d: Number(b.dataset.caret) }));
      this.on(w, "[data-cmd]:not([data-cmd=backspace])", (b) => this.host.onCommand({ k: b.dataset.cmd }));
      const bs = w.querySelector('[data-cmd="backspace"]');
      let timer = 0;
      const stop = () => clearTimeout(timer), del = () => this.host.onCommand({ k: "backspace" });
      bs.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        try {
          bs.setPointerCapture(e.pointerId);
        } catch {
        }
        stop();
        del();
        const tick = () => {
          del();
          timer = window.setTimeout(tick, 70);
        };
        timer = window.setTimeout(tick, 420);
      });
      for (const t of ["pointerup", "pointercancel", "lostpointercapture"]) bs.addEventListener(t, stop);
      addEventListener("blur", stop);
    }
    const gridSig = `${f}|${st2.input.inputScale}|${base2}|${rows}x${this.cols}|${this.layoutMode}`;
    if (gridSig !== this.gridFor) {
      this.buildGrid(f, base2, rows);
      this.gridFor = gridSig;
    }
    const toolSig = this.mode === "normal" ? `normal|${selKey !== null}` : `${this.mode}|${selKey}|${rows}|${this.cols}|${this.rowsSetting}|${this.layoutMode}|${this.mode === "more" ? JSON.stringify(this.marksHere(st2)) : ""}`;
    if (toolSig !== this.toolsFor) {
      this.buildHead(selKey, rows);
      this.toolsFor = toolSig;
    }
    this.refresh(st2);
  }
  /** 光标处正生效的调号 / 拍号 / 速度（插记号按钮上写的就是它：插进去的默认值）。 */
  marksHere(st2) {
    const at = st2.sel ? st2.sel.from : st2.caret;
    return { key: keyAt(st2.song, at), time: timeAt(st2.song, at), bpm: tempoAt(st2.song, at) };
  }
  cands(selKey, rows) {
    const back = `<button class="btn cand" data-back="1">\u8FD4\u56DE</button>`;
    const c = (attrs, label, on = false, title = "") => `<button class="btn cand${on ? " is-on" : ""}" ${attrs}${title ? ` title="${title}"` : ""}>${label}</button>`;
    switch (this.mode) {
      // 「⋯」里可以多行：插记号直接展开（user「...里面可以多行，放很多东西。所以插记号可以展开，然后应该也是用音乐符号？也许用一个加号？」）；
      // 按钮上写光标处正生效的那个（插进去的默认值），调号写「1=G」不写 ♯♭（user「+1=G才比较好懂吧，+#b只会让人觉得是加升降号」）；
      // 「+」在符号左边、小一号浅一色（user「不过加号和后面的东西也许需要分开来」→ 试过左上角角标 →「太不显眼了，能不能放在符号左边，只是字号和颜色拉开差距」）
      case "more": {
        const m = this.marksHere(this.host.state()), plus = `<span class="plus">+</span>`;
        const digits = (n2) => [...String(n2)].map((ch) => TS(Number(ch))).join("");
        return c(`data-mark="key"`, `${plus}1=${KEY_NAMES[m.key] ?? "?"}`, false, "\u63D2\u8C03\u53F7\uFF08\u5728\u5149\u6807\u5904\uFF1B\u5148\u586B\u73B0\u5728\u7684\uFF0C\u63D2\u4E86\u518D\u6539\uFF09") + c(`data-mark="time"`, `${plus}<span class="mg ts"><span>${digits(m.time.beats)}</span><span>${digits(m.time.beatType)}</span></span>`, false, "\u63D2\u62CD\u53F7\uFF08\u5728\u5149\u6807\u5904\uFF1B\u5148\u586B\u73B0\u5728\u7684\uFF0C\u63D2\u4E86\u518D\u6539\uFF09") + c(`data-mark="tempo"`, `${plus}<span class="mg met">${QUARTER}</span><span class="eq">=${m.bpm}</span>`, false, "\u63D2\u901F\u5EA6\uFF08\u5728\u5149\u6807\u5904\uFF1B\u5148\u586B\u73B0\u5728\u7684\uFF0C\u63D2\u4E86\u518D\u6539\uFF09") + c(`data-autobars="1"`, "\u81EA\u52A8\u5C0F\u8282\u7EBF", this.host.autoBars(), "\u6309\u62CD\u53F7\u81EA\u52A8\u753B\u5C0F\u8282\u7EBF\uFF08\u53EA\u753B\u3001\u4E0D\u8FDB\u6570\u636E\uFF09\uFF1B\u624B\u63D2\u7684\u300C|\u300D= \u4ECE\u90A3\u91CC\u91CD\u65B0\u6570\uFF0C\u5F31\u8D77 = \u5199\u5B8C\u5F31\u8D77\u7684\u97F3\u6309\u4E00\u4E0B\u300C|\u300D") + c(`data-open="layout"`, "\u5E03\u5C40\u2026", false, "\u51E0\u884C\u51E0\u5217\u3001\u9996\u8C03 / \u7EDD\u5BF9") + back;
      }
      case "layout":
        return [
          c(`data-rows="auto"`, `\u884C \u81EA\u52A8\uFF08${rows}\uFF09`, this.rowsSetting === "auto"),
          ...[3, 4, 5, 6, 7, 8].map((n2) => c(`data-rows="${n2}"`, `${n2} \u884C`, this.rowsSetting === n2)),
          ...[3, 4, 5, 6, 7].map((n2) => c(`data-cols="${n2}"`, `${n2} \u5217`, this.cols === n2)),
          c(`data-pl="movable"`, "\u9996\u8C03", this.layoutMode === "movable", "\u6BCF\u884C\u4ECE 1 \u8D77\uFF0C\u8DDF\u7740\u300C1=\u300D\u8D70"),
          c(`data-pl="absolute"`, "\u7EDD\u5BF9", this.layoutMode === "absolute", "\u6BCF\u884C\u4ECE C \u8D77\uFF08\u4E0D\u8DDF\u7740\u300C1=\u300D\u632A\uFF09"),
          back
        ].join("");
      case "transpose":
        return c(`data-tr="1"`, "\u2191 \u534A\u97F3") + c(`data-tr="-1"`, "\u2193 \u534A\u97F3") + c(`data-tr="2"`, "\u2191 \u5168\u97F3") + c(`data-tr="-2"`, "\u2193 \u5168\u97F3") + c(`data-toct="1"`, "\u2191 \u516B\u5EA6") + c(`data-toct="-1"`, "\u2193 \u516B\u5EA6") + c(`data-open="modulate"`, "\u8F6C\u8C03\u2026", false, "\u6574\u6BB5\u8F6C\u5230\u53E6\u4E00\u4E2A\u8C03\uFF1A\u97F3\u6309\u4E24\u4E2A\u4E3B\u97F3\u4E4B\u95F4\u7684\u97F3\u7A0B\u632A\uFF0C\u8C03\u53F7\u8DDF\u7740\u6362") + back;
      case "modulate":
        return KEY_CIRCLE.map((k) => c(`data-mod="${k}"`, `\u8F6C\u5230 1=${KEY_NAMES[k]}`, k === selKey)).join("") + back;
      default:
        return "";
    }
  }
  /** 最上面一排：1= / 长短 / 音域三个分宽度，「⋯」是右边一个小方块（user「...和左右应该宽度和高度差不多，其他的也许adaptive一些」）；
   *  「⋯」/ 移调点开后整排换成候选。（试过放 pad 最下面，user「别扭，还是放在上面吧」） */
  buildHead(selKey, rows) {
    const box = this.el.querySelector(".pad-head");
    box.className = `pad-head pad-tools ${this.mode === "normal" ? "knobs" : `cands m-${this.mode}`}`;
    box.innerHTML = this.mode !== "normal" ? this.cands(selKey, rows) : (selKey !== null ? `<button class="btn knob k-key" data-knob="key" title="\u79FB\u8C03\uFF08\u9009\u4E2D\u7684\u8FD9\u6BB5\uFF09\uFF1A\u70B9\u5F00 = \u534A\u97F3 / \u5168\u97F3 / \u516B\u5EA6 / \u8F6C\u8C03"><span class="kl">\u79FB\u8C03</span></button>` : `<button class="btn knob k-key" data-knob="key" title="1=\uFF08pad \u81EA\u5DF1\u7684\u8C03\uFF09\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\uFF08\u4E94\u5EA6\u5708\uFF09"><span class="kl"></span><span class="kh">\u21C5</span></button>`) + `<button class="btn knob k-unit" data-knob="unit" title="\u957F\u77ED\u57FA\u7EBF\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\uFF08\u542B\u8FDE\u97F3\uFF09"><span class="kl"></span><span class="kh">\u21C5</span></button><button class="btn knob k-range" data-knob="range" title="\u97F3\u57DF\uFF08\u8FD9\u5757 pad \u4ECE\u54EA\u4E2A\u97F3\u5230\u54EA\u4E2A\u97F3\uFF09\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\u2014\u2014\u50CF\u63A8\u4E00\u5F20\u7EB8\uFF0C\u5F80\u4E0A\u63A8 = \u770B\u4E0B\u9762\u66F4\u4F4E\u7684"><span class="kl"></span><span class="kh">\u21C5</span></button><button class="btn knob k-more" data-knob="more" title="\u66F4\u591A\uFF1A\u5E03\u5C40\u3001\u63D2\u8BB0\u53F7"><span class="kl">\u22EF</span></button>`;
    box.querySelectorAll("[data-knob]").forEach((b) => b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.knobDown(b, e);
    }));
    this.on(box, "[data-open]", (b) => {
      this.mode = b.dataset.open;
      this.render();
    });
    this.on(box, "[data-mark]", (b) => {
      this.back();
      this.host.onInsertMark(b.dataset.mark);
    });
    this.on(box, "[data-rows]", (b) => {
      this.rowsSetting = b.dataset.rows === "auto" ? "auto" : Number(b.dataset.rows);
      this.render();
    });
    this.on(box, "[data-cols]", (b) => {
      this.cols = Number(b.dataset.cols);
      this.render();
    });
    this.on(box, "[data-pl]", (b) => {
      this.layoutMode = b.dataset.pl === "absolute" ? "absolute" : "movable";
      this.render();
    });
    this.on(box, "[data-tr]", (b) => this.host.onCommand({ k: "transpose", semis: Number(b.dataset.tr) }));
    this.on(box, "[data-toct]", (b) => this.host.onCommand({ k: "octave", d: Number(b.dataset.toct) }));
    this.on(box, "[data-mod]", (b) => {
      this.back();
      this.host.onCommand({ k: "modulate", fifths: Number(b.dataset.mod) });
    });
    this.on(box, "[data-back]", () => this.back());
    this.on(box, "[data-autobars]", () => {
      this.host.onAutoBars(!this.host.autoBars());
      this.toolsFor = "";
      this.render();
    });
  }
  buildGrid(f, base2, rows) {
    const cells = [], sc = this.scale(), ht = homeTonic(f);
    this.keys.clear();
    for (let row = rows - 1; row >= 0; row--) {
      for (let col = 0; col < this.cols; col++) {
        const k = base2 + row * this.cols + col, { pitch: p, deg, oct } = ladderAt(sc, k, ht, f), m = midiOf(p);
        const inRange = m >= HER_LOW && m <= HER_HIGH;
        this.keys.set(k, p);
        cells.push(`<button class="pad-key${inRange ? " hint" : ""}" data-k="${k}" title="${inRange ? "\u6708\u8BFB\u7684\u97F3\u57DF\u91CC" : ""}"><span class="deg">${octDots(Math.max(0, oct))}<span class="num"><span class="acc"></span>${degLabel(deg)}</span>${octDots(Math.max(0, -oct))}</span><span class="abs">${pretty(p)}</span></button>`);
      }
    }
    const grid = this.el.querySelector(".pad-grid");
    grid.innerHTML = cells.join("");
    this.swipes.clear();
    grid.querySelectorAll(".pad-key[data-k]").forEach((b) => {
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        try {
          b.setPointerCapture(e.pointerId);
        } catch {
        }
        const p = this.keys.get(Number(b.dataset.k)), id = `pad${e.pointerId}`;
        if (!this.host.isImpro() && !this.host.accept(id)) return;
        this.swipes.set(e.pointerId, { y0: e.clientY, alt: 0, key: b });
        this.showDown(p, id);
        if (!this.host.isImpro()) this.host.onPitch(p, id);
        this.host.onSoundDown(p, id);
      });
      b.addEventListener("pointermove", (e) => {
        const s = this.swipes.get(e.pointerId);
        if (!s) return;
        const dy = s.y0 - e.clientY, alt = dy > SWIPE ? 1 : dy < -SWIPE ? -1 : 0;
        if (alt === s.alt) return;
        s.alt = alt;
        this.host.onAlter(`pad${e.pointerId}`, alt);
        this.refresh(this.host.state());
      });
      const up = (e) => {
        this.swipes.delete(e.pointerId);
        this.showUp(`pad${e.pointerId}`);
        this.host.onSoundUp(`pad${e.pointerId}`);
      };
      b.addEventListener("pointerup", up);
      b.addEventListener("pointercancel", up);
    });
  }
  refresh(st2) {
    const q = (s) => this.el.querySelector(s);
    const i = st2.input, f = inputKey(st2);
    const k = q(".k-key .kl");
    if (k && !st2.sel) {
      const sc = this.scale();
      k.innerHTML = keyLabel(f, sc);
      k.parentElement.classList.toggle("stack", k.parentElement.clientWidth < STACK);
      k.parentElement.title = `1=${KEY_NAMES[f]} ${sc.name}\uFF08pad \u81EA\u5DF1\u7684\u8C03\u548C\u8C03\u5F0F\uFF09\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1\u6362\u8C03 / \u70B9\u5F00\u9009\u8C03\u548C\u8C03\u5F0F`;
    }
    const u = q(".k-unit .kl");
    if (u) {
      u.innerHTML = `<span class="smufl">${UNIT_GLYPH[i.unit]}</span>${i.tuplet ? `<sup>${i.tuplet}</sup>` : ""}`;
      u.parentElement.title = `\u957F\u77ED\u57FA\u7EBF\uFF1A${UNIT_NAME[i.unit]}${i.tuplet ? `\uFF08${i.tuplet} \u8FDE\u97F3\uFF09` : ""}\u2014\u2014\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009`;
    }
    const r = q(".k-range .kl");
    if (r) {
      const nr = this.rangeNarrow();
      r.parentElement.classList.toggle("narrow", nr);
      r.parentElement.classList.toggle("tight", r.parentElement.clientWidth < TIGHT);
      r.innerHTML = this.spanHtml(this.rowShift, f, this.rows(), nr);
      r.parentElement.title = `\u97F3\u57DF ${this.spanText(this.rowShift, f, this.rows())}\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\u2014\u2014\u50CF\u63A8\u4E00\u5F20\u7EB8\uFF0C\u5F80\u4E0A\u63A8 = \u770B\u4E0B\u9762\u66F4\u4F4E\u7684`;
    }
    this.el.querySelectorAll(".pad-key[data-k]").forEach((b) => {
      const sw = [...this.swipes.values()].find((s) => s.key === b), a = sw ? sw.alt : i.acc;
      const p0 = this.keys.get(Number(b.dataset.k)), p = a ? alterBy(p0, a) : p0;
      b.querySelector(".acc").textContent = a > 0 ? "\u266F" : a < 0 ? "\u266D" : "";
      b.querySelector(".abs").textContent = pretty(p);
      b.classList.toggle("swiping", !!sw && sw.alt !== 0);
    });
    this.el.querySelector(".pad-grid")?.classList.toggle("acc-armed", !!i.acc);
    const down = new Set(this.held.values());
    this.el.querySelectorAll(".pad-key[data-k]").forEach((b) => b.classList.toggle("down", down.has(midiOf(this.keys.get(Number(b.dataset.k))))));
  }
  on(root, sel, fn) {
    root.querySelectorAll(sel).forEach((b) => b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      fn(b);
    }));
  }
  back() {
    this.mode = "normal";
    this.render();
  }
  /** 值旋钮的一串值，大的在上（升号多 / 长的 / 音域高的在上）+ 现在是第几个 + 选第 i 个（立刻生效）。 */
  knobList(knob, narrow = this.rangeNarrow()) {
    const st2 = this.host.state(), f = inputKey(st2);
    if (knob === "key") {
      const K2 = [...KEY_CIRCLE].reverse();
      const sc = this.scale();
      return { items: K2.map((k) => keyLabel(k, sc)), index: Math.max(0, K2.indexOf(f)), title: "pad \u7684\u8C03\uFF08\u4E94\u5EA6\u5708\uFF09", set: (i) => this.host.onInputKey(K2[i]), loop: true };
    }
    if (knob === "unit") return { items: UNITS.map((u) => `<span class="smufl">${UNIT_GLYPH[u]}</span>`), index: Math.max(0, UNITS.indexOf(st2.input.unit)), title: "\u957F\u77ED\u57FA\u7EBF", set: (i) => this.host.onUnit(UNITS[i]) };
    const rows = this.rows();
    return {
      items: SHIFTS.map((sh) => this.spanHtml(sh, f, rows, narrow)),
      index: Math.max(0, SHIFTS.indexOf(Math.max(-4, Math.min(4, this.rowShift)))),
      title: "\u97F3\u57DF\u7A97\u53E3",
      set: (i) => {
        this.rowShift = SHIFTS[i];
        this.render();
      }
    };
  }
  /** 按下一个旋钮。「⋯」/ 移调（有选中）= 整排换成候选。值旋钮：
   *  · 按住上下滑 = 就在这一格里滚，像汽车里程表——旋钮变成一扇窗，滚轮藏在后面，窗里只露一格，滚的时候上下格从窗边滑进来；
   *    内容跟着手指走（往下拉 = 上面大的进窗）；**一次最多一格**，滑过半格值就生效；松手立刻停，不吸附、不放动画
   *    （user「in place的时候一次最多一格，这样方便快速swipe几次就是几格」）
   *    （user「我希望手指松了立刻停，不要顿一下，这是快速输入。要不还是做成in place 滑动只在窗格里面预览？」
   *     「in place滚的时候应该是原来的钮变成一个窗，滚轮藏在下面，就像汽车里程表一样」）。
   *  · 只是点一下（没滑）= 松手时展开滚轮（drum.ts）点选 / 原生滚动。 */
  knobDown(b, e) {
    const knob = b.dataset.knob;
    if (knob === "more" || knob === "key" && this.host.state().sel) {
      this.mode = knob === "more" ? "more" : "transpose";
      this.render();
      return;
    }
    try {
      b.setPointerCapture(e.pointerId);
    } catch {
    }
    const v = this.knobList(knob), n2 = v.items.length, pid = e.pointerId, y0 = e.clientY;
    const rollItems = v.loop ? [v.items[n2 - 1], ...v.items, v.items[0]] : v.items, at0 = v.loop ? v.index + 1 : v.index;
    let moved = false, cur = v.index, roll = null, H = 0;
    const room = (dir) => v.loop || v.index + dir >= 0 && v.index + dir < n2 ? STEP : STEP * 0.3;
    const paint = (dy) => {
      const off = Math.max(-room(1), Math.min(room(-1), dy));
      roll.style.transform = `translateY(${(-at0 * STEP + off) * (H / STEP)}px)`;
      return Math.abs(off) >= STEP / 2 ? (v.index - Math.sign(off) + n2) % n2 : v.index;
    };
    const move = (ev) => {
      if (ev.pointerId !== pid) return;
      const dy = ev.clientY - y0;
      if (!moved) {
        if (Math.abs(dy) < MOVE) return;
        moved = true;
        H = b.clientHeight;
        roll = document.createElement("div");
        roll.className = "kroll";
        roll.innerHTML = rollItems.map((h) => `<div class="kroll-i" style="height:${H}px">${h}</div>`).join("");
        b.appendChild(roll);
        b.classList.add("rolling");
      }
      const i = paint(dy);
      if (i !== cur) {
        cur = i;
        v.set(i);
      }
    };
    const up = (ev) => {
      if (ev.pointerId !== pid) return;
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      removeEventListener("pointercancel", up);
      roll?.remove();
      b.classList.remove("rolling");
      if (!moved && ev.type === "pointerup") this.openDrumFor(knob, b);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
    addEventListener("pointercancel", up);
  }
  /** 点一下值旋钮：在它上面展开滚轮。旋钮够宽（iPad）= 几列分旋钮的宽；太窄（iPhone）= 每列按放得下的宽来，比旋钮宽
   *  （user「如果是iphone等太窄的时候弹出来的窗可以宽一点」）。长短那根旁边并一根连音的，连音画成真的一组小蝌蚪、跟着长短变。 */
  openDrumFor(knob, anchor) {
    const w = anchor.getBoundingClientRect().width;
    if (knob === "unit") {
      const st2 = this.host.state();
      const [wu, wt] = w >= 142 ? [w - Math.round(w * 0.55) - 2, Math.round(w * 0.55)] : [56, 84];
      const tups = (u) => TUP.map((n2) => n2 ? tupletMark(n2, u) : `<span class="plain">\u4E0D\u8FDE</span>`);
      const h = openDrum(anchor, [
        { items: UNITS.map((u) => `<span class="smufl">${UNIT_GLYPH[u]}</span>${wu >= 100 ? `<small>${UNIT_NAME[u]}</small>` : ""}`), index: Math.max(0, UNITS.indexOf(st2.input.unit)), width: wu, title: "\u957F\u77ED\u57FA\u7EBF" },
        { items: tups(st2.input.unit), index: Math.max(0, TUP.indexOf(st2.input.tuplet)), width: wt, title: "\u8FDE\u97F3" }
      ], { onChange: (c, i) => {
        if (c === 0) {
          this.host.onUnit(UNITS[i]);
          h.setItems(1, tups(UNITS[i]));
        } else this.host.onTuplet(TUP[i]);
      } });
      return;
    }
    if (knob === "key") {
      const st2 = this.host.state(), K2 = [...KEY_CIRCLE].reverse();
      const [wk, ws] = w >= 210 ? [Math.round(w * 0.36), w - Math.round(w * 0.36) - 2] : [72, 136];
      openDrum(anchor, [
        { items: K2.map((k) => `1=${KEY_NAMES[k]}`), index: Math.max(0, K2.indexOf(inputKey(st2))), width: wk, title: "pad \u7684\u8C03\uFF08\u4E94\u5EA6\u5708\uFF09", loop: true },
        { items: SCALES.map(scaleItem), index: Math.max(0, SCALES.findIndex((x) => x.id === st2.input.inputScale)), width: ws, title: "\u8C03\u5F0F\uFF1Apad \u4E0A\u6392\u54EA\u4E9B\u97F3" }
      ], { onChange: (c, i) => {
        if (c === 0) this.host.onInputKey(K2[i]);
        else this.host.onInputScale(SCALES[i].id);
      } });
      return;
    }
    const v = this.knobList(knob, false), wr = Math.max(w, 120);
    openDrum(anchor, [{ items: v.items, index: v.index, width: wr, title: v.title }], { onChange: (_c, i) => v.set(i) });
  }
  /** 某个来源（手指 / 电脑键盘的键）按下了音高 p：pad 上同音高的键亮着，直到 showUp（调式里没有这个音 = 不亮）。 */
  showDown(p, id) {
    this.held.set(id, midiOf(p));
    this.refresh(this.host.state());
  }
  showUp(id) {
    if (this.held.delete(id)) this.refresh(this.host.state());
  }
  clearHeld() {
    if (this.held.size || this.swipes.size) {
      this.held.clear();
      this.swipes.clear();
      this.refresh(this.host.state());
    }
  }
};

// src/score/lab-score.ts
var HUM_SYLLABLE = { la: { ja: "\u3089", zh: "\u5566", en: "la" }, n: { ja: "\u3093", zh: "\u55EF", en: "hum" }, u: { ja: "\u3046", zh: "\u545C", en: "ooh" }, o: { ja: "\u304A", zh: "\u54E6", en: "oh" }, a: { ja: "\u3042", zh: "\u554A", en: "ah" } };
function toLabScore(song, lang = "ja") {
  const eighth = TPQ / 2, tl = timeline(song), base2 = tl[0]?.bpm ?? 90;
  const bpmOf = new Map(tl.map((x) => [x.index, x.bpm]));
  const out = [];
  song.tokens.forEach((t, i) => {
    if (!isTimed(t)) return;
    const len = t.dur / eighth * (base2 / bpmOf.get(i));
    if (t.kind === "rest") {
      const last2 = out[out.length - 1];
      if (last2) last2.rest = (last2.rest ?? 0) + len;
      return;
    }
    const midi = midiOf(effectivePitch(song.tokens, i));
    const last = out[out.length - 1];
    if ((t.lyric === MELISMA_MARK || t.tie) && last && !last.rest) {
      last.notes.push([midi, len]);
      return;
    }
    const lyric = t.lyric && t.lyric !== MELISMA_MARK ? t.lyric : null;
    out.push(lyric ? { kana: lyric, notes: [[midi, len]], ...lang === "en" && t.hyph ? { hyph: true } : {} } : { kana: HUM_SYLLABLE[song.hum ?? "n"][lang], notes: [[midi, len]], hum: true });
  });
  const TEXT = lang === "en" ? out.map((e) => e.kana + (e.hyph ? "" : " ")).join("").trim() : out.map((e, k) => e.kana + (e.rest ? "\u3001" : k === out.length - 1 ? "\u3002" : "")).join("");
  return { SCORE: out, TEXT, TEMPO_QUARTER: base2, LANG: lang };
}

// src/singer/audio.ts
var ctx = null;
function audioCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// src/singer/client.ts
var Singer = class {
  w = null;
  seq = 0;
  pending = /* @__PURE__ */ new Map();
  src = null;
  worker() {
    if (this.w) return this.w;
    this.w = new Worker(new URL(`./${"singer-worker-16400ef03270.mjs"}`, import.meta.url), { type: "module" });
    this.w.onmessage = (ev) => {
      const m = ev.data, p = this.pending.get(m.id);
      if (!p) return;
      if (m.type === "progress") p.progress(m.stage);
      else if (m.type === "done") {
        this.pending.delete(m.id);
        p.ok({ samples: m.samples, sr: m.sr, ms: m.ms });
      } else {
        this.pending.delete(m.id);
        p.fail(new Error(m.message));
      }
    };
    this.w.onerror = (e) => {
      this.w?.terminate();
      this.w = null;
      for (const p of this.pending.values()) p.fail(new Error(e.message || "\u6708\u8BFB\u7684 worker \u51FA\u9519"));
      this.pending.clear();
    };
    return this.w;
  }
  sing(s, progress = () => {
  }, extra = {}) {
    const id = ++this.seq;
    const req = { type: "sing", id, score: s.SCORE, text: s.TEXT, tempo: s.TEMPO_QUARTER, lang: s.LANG, ...extra };
    return new Promise((ok, fail) => {
      this.pending.set(id, { ok, fail, progress });
      this.worker().postMessage(req);
    });
  }
  /** 播放（必须在用户手势里先调过 unlock()，iPad 才放声）。播完回调 onEnd。 */
  play(r, onEnd) {
    this.stop();
    const ctx2 = this.unlock();
    const buf = ctx2.createBuffer(1, r.samples.length, r.sr);
    buf.copyToChannel(r.samples, 0);
    const src = ctx2.createBufferSource();
    src.buffer = buf;
    src.connect(ctx2.destination);
    src.onended = () => {
      if (this.src === src) {
        this.src = null;
        onEnd();
      }
    };
    src.start();
    this.src = src;
  }
  stop() {
    const s = this.src;
    this.src = null;
    if (s) {
      s.onended = null;
      try {
        s.stop();
      } catch {
      }
    }
  }
  get playing() {
    return this.src !== null;
  }
  unlock() {
    return audioCtx();
  }
  // 全 app 共用一个（audio.ts）
};

// src/export/mp3.ts
function encodeMp3(samples, sr, kbps = 64) {
  return new Promise((ok, fail) => {
    const w = new Worker(new URL(`./${"mp3-worker-518bd328d28b.mjs"}`, import.meta.url), { type: "module" });
    w.onmessage = (ev) => {
      w.terminate();
      if (ev.data.ok) ok(ev.data.bytes);
      else fail(new Error(ev.data.message));
    };
    w.onerror = (e) => {
      w.terminate();
      fail(new Error(e.message || "mp3 \u7F16\u7801 worker \u51FA\u9519"));
    };
    const req = { samples: samples.slice(), sr, kbps };
    w.postMessage(req, [req.samples.buffer]);
  });
}

// node_modules/@internal/model-packs/dist/sha256.js
var K = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var Sha256 = class {
  h = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
  buf = new Uint8Array(64);
  bufLen = 0;
  total = 0;
  w = new Uint32Array(64);
  done = false;
  update(bytes) {
    if (this.done)
      throw new Error("Sha256: update after hex()");
    let i = 0;
    this.total += bytes.length;
    if (this.bufLen) {
      const take = Math.min(64 - this.bufLen, bytes.length);
      this.buf.set(bytes.subarray(0, take), this.bufLen);
      this.bufLen += take;
      i = take;
      if (this.bufLen === 64) {
        this.block(this.buf, 0);
        this.bufLen = 0;
      }
    }
    for (; i + 64 <= bytes.length; i += 64)
      this.block(bytes, i);
    if (i < bytes.length) {
      this.buf.set(bytes.subarray(i), 0);
      this.bufLen = bytes.length - i;
    }
    return this;
  }
  block(p, o) {
    const w = this.w, H = this.h;
    for (let t = 0; t < 16; t++, o += 4)
      w[t] = p[o] << 24 | p[o + 1] << 16 | p[o + 2] << 8 | p[o + 3];
    for (let t = 16; t < 64; t++) {
      const x = w[t - 15], y = w[t - 2];
      const s0 = (x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ x >>> 3;
      const s1 = (y >>> 17 | y << 15) ^ (y >>> 19 | y << 13) ^ y >>> 10;
      w[t] = w[t - 16] + s0 + w[t - 7] + s1 | 0;
    }
    let a = H[0], b = H[1], c = H[2], d2 = H[3], e = H[4], f = H[5], g2 = H[6], h = H[7];
    for (let t = 0; t < 64; t++) {
      const S1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
      const ch = e & f ^ ~e & g2;
      const t1 = h + S1 + ch + K[t] + w[t] | 0;
      const S0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
      const maj = a & b ^ a & c ^ b & c;
      const t2 = S0 + maj | 0;
      h = g2;
      g2 = f;
      f = e;
      e = d2 + t1 | 0;
      d2 = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    H[0] += a;
    H[1] += b;
    H[2] += c;
    H[3] += d2;
    H[4] += e;
    H[5] += f;
    H[6] += g2;
    H[7] += h;
  }
  hex() {
    if (this.done)
      throw new Error("Sha256: hex() twice");
    const total = this.total;
    const padLen = (this.bufLen < 56 ? 56 - this.bufLen : 120 - this.bufLen) + 8;
    const pad2 = new Uint8Array(padLen);
    pad2[0] = 128;
    const bits2 = total * 8, hi = Math.floor(bits2 / 4294967296), lo = bits2 >>> 0, n2 = padLen;
    pad2[n2 - 8] = hi >>> 24;
    pad2[n2 - 7] = hi >>> 16;
    pad2[n2 - 6] = hi >>> 8;
    pad2[n2 - 5] = hi;
    pad2[n2 - 4] = lo >>> 24;
    pad2[n2 - 3] = lo >>> 16;
    pad2[n2 - 2] = lo >>> 8;
    pad2[n2 - 1] = lo;
    this.total -= padLen;
    this.update(pad2);
    this.done = true;
    return Array.from(this.h, (x) => x.toString(16).padStart(8, "0")).join("");
  }
};

// node_modules/@internal/model-packs/dist/pack-store.js
var SLICE = 1 << 20;
function createPackStore(deps) {
  const cacheName = deps.cacheName ?? "pwa-models";
  const keyOf = (slug, name) => `${location.origin}/__pwa-models__/${slug}/${name}`;
  function manifestOf(slug) {
    const p = deps.packs[slug];
    if (!p)
      throw new Error(`unknown pack: ${slug}`);
    return p;
  }
  const openCache = () => caches.open(cacheName);
  async function hashBlob(b) {
    const sha = new Sha256();
    for (let o = 0; o < b.size; o += SLICE)
      sha.update(new Uint8Array(await b.slice(o, Math.min(o + SLICE, b.size)).arrayBuffer()));
    return sha.hex();
  }
  async function cachedChunkSizes(slug, m) {
    const cache = await openCache();
    const sizes = [];
    for (const c of m.chunks) {
      const r = await cache.match(keyOf(slug, c.name));
      sizes.push(r ? Number(r.headers.get("content-length") ?? 0) : 0);
    }
    return sizes;
  }
  async function putChunk(slug, name, bytes) {
    const cache = await openCache();
    const size = bytes instanceof Blob ? bytes.size : bytes.length;
    await cache.put(keyOf(slug, name), new Response(bytes, { headers: { "content-length": String(size), "content-type": "application/octet-stream" } }));
  }
  async function markVerified(slug, packId) {
    const cache = await openCache();
    await cache.put(keyOf(slug, "verified.json"), new Response(JSON.stringify({ packId, at: (/* @__PURE__ */ new Date()).toISOString() }), { headers: { "content-type": "application/json" } }));
  }
  async function status(slug) {
    const { packId, manifest: m } = manifestOf(slug);
    const cache = await openCache();
    const sizes = await cachedChunkSizes(slug, m);
    const complete = sizes.every((n2, i) => n2 === m.chunks[i].bytes);
    const marker = await cache.match(keyOf(slug, "verified.json"));
    const verified = marker ? (await marker.json()).packId === packId : false;
    return { slug, ready: complete && verified, bytesCached: sizes.reduce((a, b) => a + b, 0), bytesTotal: m.totalBytes };
  }
  async function dropIfStale(slug) {
    const { packId, manifest: m } = manifestOf(slug);
    const cache = await openCache();
    const marker = await cache.match(keyOf(slug, "verified.json"));
    if (!marker || (await marker.json()).packId === packId)
      return;
    for (const c of m.chunks)
      await cache.delete(keyOf(slug, c.name));
    await cache.delete(keyOf(slug, "verified.json"));
  }
  async function sealIfComplete(slug, fresh) {
    const { packId, manifest: m } = manifestOf(slug);
    const sizes = await cachedChunkSizes(slug, m);
    if (!sizes.every((n2, i) => n2 === m.chunks[i].bytes))
      return;
    const cache = await openCache();
    for (const c of m.chunks) {
      if (fresh.has(c.name))
        continue;
      const r = await cache.match(keyOf(slug, c.name));
      const ok = !!r && await hashBlob(await r.blob()) === c.sha256;
      if (!ok) {
        await cache.delete(keyOf(slug, c.name));
        return;
      }
    }
    await markVerified(slug, packId);
  }
  async function download(slug, base2, progress) {
    const { packId, manifest: m } = manifestOf(slug);
    await dropIfStale(slug);
    const sizes = await cachedChunkSizes(slug, m);
    let done = sizes.reduce((a, n2, i) => a + (n2 === m.chunks[i].bytes ? n2 : 0), 0);
    progress({ done, total: m.totalBytes });
    const root = base2.replace(/\/+$/, "");
    for (let i = 0; i < m.chunks.length; i++) {
      const c = m.chunks[i];
      if (sizes[i] === c.bytes)
        continue;
      const res = await fetch(`${root}/packs/${slug}/${c.name}`, { cache: "no-store" });
      if (!res.ok || !res.body)
        throw new Error(`fetch ${c.name}: HTTP ${res.status}`);
      const reader = res.body.getReader();
      const sha = new Sha256();
      const buf = new Uint8Array(c.bytes);
      let got = 0, lastReported = 0;
      for (; ; ) {
        const { value, done: end } = await reader.read();
        if (end)
          break;
        if (got + value.length > c.bytes)
          throw new Error(`${c.name}: larger than manifest says`);
        sha.update(value);
        buf.set(value, got);
        got += value.length;
        if (got - lastReported >= 1048576 || got === c.bytes) {
          lastReported = got;
          progress({ done: done + got, total: m.totalBytes });
        }
      }
      if (got !== c.bytes)
        throw new Error(`${c.name}: got ${got} bytes, expected ${c.bytes}`);
      if (sha.hex() !== c.sha256)
        throw new Error(`${c.name}: sha256 mismatch (source tampered or corrupted)`);
      await putChunk(slug, c.name, buf);
      done += got;
    }
    await markVerified(slug, packId);
    return status(slug);
  }
  async function importFiles(slugs, files, progress) {
    const packs = slugs.map((slug) => ({ slug, m: manifestOf(slug).manifest }));
    for (const p of packs)
      await dropIfStale(p.slug);
    const fresh = new Map(packs.map((p) => [p.slug, /* @__PURE__ */ new Set()]));
    const total = files.reduce((a, f) => a + f.size, 0);
    let done = 0, matched = 0;
    const bad = [];
    for (const f of files) {
      const whole = packs.find((p) => p.m.chunks.length > 1 && p.m.totalBytes === f.size);
      if (whole) {
        let offset = 0;
        for (const c of whole.m.chunks) {
          const piece = f.slice(offset, offset + c.bytes);
          if (await hashBlob(piece) !== c.sha256)
            throw new Error(`${f.name}: sha256 mismatch at ${c.name} (wrong or corrupted file)`);
          await putChunk(whole.slug, c.name, piece);
          fresh.get(whole.slug).add(c.name);
          offset += c.bytes;
          progress({ done: done + offset, total });
        }
        matched++;
      } else {
        const sameSize = packs.flatMap((p) => p.m.chunks.filter((c) => c.bytes === f.size).map((c) => ({ slug: p.slug, c })));
        if (sameSize.length) {
          const hex = await hashBlob(f);
          const hits = sameSize.filter((x) => x.c.sha256 === hex);
          if (!hits.length)
            bad.push(f.name);
          for (const h of hits) {
            await putChunk(h.slug, h.c.name, f);
            fresh.get(h.slug).add(h.c.name);
          }
          if (hits.length)
            matched++;
        }
      }
      done += f.size;
      progress({ done, total });
    }
    for (const p of packs)
      await sealIfComplete(p.slug, fresh.get(p.slug));
    if (bad.length)
      throw new Error(`${bad[0]}: sha256 mismatch (wrong or corrupted file)`);
    if (!matched)
      throw new Error("no-matching-file");
    return Promise.all(slugs.map(status));
  }
  async function downloadAll(slugs, base2, progress) {
    const total = slugs.reduce((a, s) => a + manifestOf(s).manifest.totalBytes, 0);
    const have = (await Promise.all(slugs.map(status))).map((st2) => st2.bytesCached);
    const report = () => progress({ done: have.reduce((a, b) => a + b, 0), total });
    report();
    for (let i = 0; i < slugs.length; i++)
      await download(slugs[i], base2, (p) => {
        have[i] = p.done;
        report();
      });
    return Promise.all(slugs.map(status));
  }
  async function deletePack(slug) {
    const { manifest: m } = manifestOf(slug);
    const cache = await openCache();
    for (const c of m.chunks)
      await cache.delete(keyOf(slug, c.name));
    await cache.delete(keyOf(slug, "verified.json"));
  }
  const noop = () => {
  };
  return {
    status: (slugs) => Promise.all(slugs.map(status)),
    download: (slugs, base2, onProgress) => downloadAll(slugs, base2, onProgress ?? noop),
    importFiles: (slugs, files, onProgress) => importFiles(slugs, files, onProgress ?? noop),
    async delete(slugs) {
      for (const slug of slugs)
        await deletePack(slug);
    },
    async chunks(slug) {
      if (!(await status(slug)).ready)
        throw new Error("pack-missing");
      const { manifest: m } = manifestOf(slug);
      const cache = await openCache();
      const out = [];
      for (const c of m.chunks) {
        const r = await cache.match(keyOf(slug, c.name));
        if (!r)
          throw new Error("pack-missing");
        out.push(await r.blob());
      }
      return out;
    }
  };
}

// src/singer/packs.gen.ts
var PACKS = {
  "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007": { "packId": "56d81c8eb51e693e937397e2557ac3af4dff328e420b761c6e5df8b8b5b80ca6", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 25165824, "name": "chunk-000", "sha256": "269d70de8efb9ef41cdfd5de0a4acd220eb263163c8d1586c2b627c8cb1eaec6" }, { "bytes": 14503410, "name": "chunk-001", "sha256": "56131bbd5133d34a5d7cf4bd668c83a2da1fe8157fbbb849a94c4d1b9569b4ff" }], "createdAt": "2026-10-07", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "piper-plus-voice", "sampleRate": 22050, "speakers": 1 }, "files": [{ "bytes": 39662905, "offset": 0, "path": "model.onnx", "sha256": "d10f3806abeda0ec9ee294d0e39ef5f3884c47b4b09028d23375b71db4107712" }, { "bytes": 6329, "offset": 39662905, "path": "config.json", "sha256": "f6a373726beef08f9094e97f434185b1f9840b76ced0a73281fc40023b02d02d" }], "lang": ["ja", "en", "zh", "es", "fr", "pt"], "license": { "attribution": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\uFF08CV.\u5922\u524D\u9ECE\uFF09https://tyc.rei-yumesaki.net/material/corpus/ \uFF1Bmodel: derivative of ayousanz/piper-plus-tsukuyomi-chan; zh/en language vectors from ayousanz/piper-plus-base (CC-BY-4.0)", "file": "LICENSE.txt", "name": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04\uFF08\u884D\u751F\u6A21\u578B\uFF1Bmodel card: license other / tsukuyomi-chan-corpus\uFF09+ base model CC-BY-4.0", "sha256": "ff76774a797dfedbd00d6b0b167cebf5ceb341d380d865ed4cba495310ace4d9" }, "name": "\u6708\u8BFB\uFF08\u4E2D\u82F1\u589E\u5F3A\uFF0C\u65F6\u957F\u53EF\u63A5\u7BA1\uFF09\u2014 \u3064\u304F\u3088\u307F\u3061\u3083\u3093 piper-plus \u516D\u8BED\u5355\u97F3\u8272\uFF0Cfp16\uFF0C\u4E2D\u82F1\u6539\u8BFB\u5E95\u6A21\u7684\u8BED\u8A00\u5411\u91CF + dur_override \u8F93\u5165\uFF08\u5531\u6B4C\u7528\uFF09", "notes": "Modified model (see LICENSE.txt \xA7[4]). Needs the runtime pack (onnxruntime-web) and one text-frontend pack per language. With dur_override all zeros it reads exactly like voice-tsukuyomi-chan-zhen-6lang-fp16-20261002. The credit block and the four prohibited uses must be shown in the product UI.", "sha256": "466803b3eba2be734c26955c1b701a7e64e566a3e997474c4c744666768e56f9", "slug": "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007", "source": { "converted": "dur_override input on top of voice-tsukuyomi-chan-zhen-6lang-fp16-20261002 (see LICENSE.txt \xA7[4]); all zeros = that pack, sample-identical", "file": "voice-tsukuyomi-chan-zhen-6lang-fp16-20261002/model.onnx @ sha256 ae7ab68a\u2026 + piper-plus/dur-override-exp/make_dur_override.py; config.json = that pack's", "model": "https://huggingface.co/ayousanz/piper-plus-tsukuyomi-chan" }, "task": "tts", "totalBytes": 39669234, "v": 1 } },
  "runtime-onnxruntime-web-1.30.0-20261001": { "packId": "f76668f9383b922aef483f4c0a374fb727b9a9203d230cb2fceabb34fc4459be", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 3687160, "name": "chunk-000", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "onnxruntime-web", "engineConfig": { "kind": "wasm-runtime", "version": "1.30.0" }, "files": [{ "bytes": 3687160, "offset": 0, "path": "ort-wasm-simd-threaded.wasm.gz", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788" }], "lang": [""], "license": { "attribution": "ONNX Runtime (Microsoft)", "file": "LICENSE.txt", "name": "MIT (Microsoft, onnxruntime)", "sha256": "2f07c72751aed99790b8a4869cf2311df85a860b22ded05fa22803587a48922c" }, "name": "onnxruntime-web 1.30.0\uFF08WASM \u63A8\u7406\u8FD0\u884C\u65F6\uFF0C\u5355\u7EBF\u7A0B SIMD\uFF09", "notes": "Engine binary. The matching JS glue (ort.wasm.bundle.min.mjs) is vendored in the app, not in this pack.", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788", "slug": "runtime-onnxruntime-web-1.30.0-20261001", "source": { "converted": "", "file": "dist/ort-wasm-simd-threaded.wasm (unmodified)", "model": "https://www.npmjs.com/package/onnxruntime-web/v/1.30.0" }, "task": "runtime", "totalBytes": 3687160, "v": 1 } },
  "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001": { "packId": "b66632d8ab153a865e2727d745794da248a9c748558920bfd004443cdb9f2d4c", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 24471527, "name": "chunk-000", "sha256": "3e1d7f8ff18204a56d4170da09258cf655bb01bb61114bcd84e8bb2441941b60" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "ja" }, "files": [{ "bytes": 22438129, "offset": 0, "path": "ja/sys.dic.gz", "sha256": "b1804e8c2e6244bb36c7c24eb5af9d4307a80acfb481dcffdc71c7aa60ede055" }, { "bytes": 1867237, "offset": 22438129, "path": "ja/matrix.bin.gz", "sha256": "824f60e50360fb2b186b16d1fe5fd6312919f03c33a73bc86ece37a301b3f0b8" }, { "bytes": 643, "offset": 24305366, "path": "ja/char.bin.gz", "sha256": "335d6f4a6c6cd50ab1d0782dbf6b13ab9e2bed08ed1fd34c97d499d4a05fb665" }, { "bytes": 782, "offset": 24306009, "path": "ja/unk.dic.gz", "sha256": "03721395b79e257fbd2b0e742a4faaed6073ecb79b0cf615fbe352995581b603" }, { "bytes": 147207, "offset": 24306791, "path": "ja/ojt.wasm.gz", "sha256": "97a8738abbdc773b4785b1f6ba849c432a5764cf13c1637df4da630a82f45f8a" }, { "bytes": 17529, "offset": 24453998, "path": "ja/nani-model.json.gz", "sha256": "0427c6cfe53f6c4d771f6c3e50fea06ddeaac96f5e24bdab4f49493395c9630a" }], "lang": ["ja"], "license": { "attribution": "Open JTalk (Nagoya Institute of Technology); MeCab (Taku Kudo, NTT); NAIST Japanese Dictionary; pyopenjtalk / pyopenjtalk-plus (tsukumijima et al.)", "file": "LICENSE.txt", "name": "Modified BSD (Open JTalk) + BSD (MeCab) + BSD-3-Clause style (NAIST-jdic / Open JTalk dictionary) + MIT (pyopenjtalk-plus)", "sha256": "b8dd3d66249df450fc71f3f8f8f29da02b5b01b8b47c03f412af8bc16090c1bb" }, "name": "\u65E5\u8BED\u6587\u672C\u524D\u7AEF\uFF08OpenJTalk + pyopenjtalk-plus \u8BCD\u5178\uFF09", "notes": "ojt.wasm is an engine binary built on 2026-10-01 from the upstream sources (wrapper source: backend/vendor/ojt/ojt_wasm.c). 160 MB initial heap.", "sha256": "3e1d7f8ff18204a56d4170da09258cf655bb01bb61114bcd84e8bb2441941b60", "slug": "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001", "source": { "converted": "", "file": "dictionary: wheel pyopenjtalk/dictionary/; ojt.wasm: built from the sdist (sha256 cdcb0746659857554c6dad23956cad77e21f76c9f3dfa000ea2f8d4f0ba11d99) with Emscripten 6.0.10; nani-model.json: exported from pyopenjtalk/yomi_model/", "model": "https://pypi.org/project/pyopenjtalk-plus/0.4.1.post9/" }, "task": "tts-frontend", "totalBytes": 24471527, "v": 1 } },
  "lang-zh-pinyin-20261001": { "packId": "a84c73d781c805a65b73deb3b39ac9f5fedd15f0cdf3d66b925005c8152af9e3", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 686220, "name": "chunk-000", "sha256": "acad023c61ddf4ed42720c63be1b35737cff734cbf4a6c8ab671b50f7fe39ae1" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "zh" }, "files": [{ "bytes": 186217, "offset": 0, "path": "zh/pinyin_single.tone3.json.gz", "sha256": "ec5c44ed3cd18eda41a04a7831f8d069600cdfb19e55e5b001a42bbdf3a4ad82" }, { "bytes": 500003, "offset": 186217, "path": "zh/pinyin_phrases.tone3.json.gz", "sha256": "43dd0534a63c6bddb4c0f20ee88f19f5933875ff3979acc777652028a66f5ba8" }], "lang": ["zh"], "license": { "attribution": "pypinyin, pinyin-data, phrase-pinyin-data (mozillazg)", "file": "LICENSE.txt", "name": "MIT (pypinyin / pinyin-data / phrase-pinyin-data)", "sha256": "82783f291266e986df7494586db072217e2940227f93208f4f920a53b7a7d91e" }, "name": "\u4E2D\u6587\u62FC\u97F3\u8BCD\u5178\uFF08pypinyin \u6570\u636E\uFF09", "notes": "Tone marks converted to tone-number style (the form the model's phoneme table expects).", "sha256": "acad023c61ddf4ed42720c63be1b35737cff734cbf4a6c8ab671b50f7fe39ae1", "slug": "lang-zh-pinyin-20261001", "source": { "converted": "", "file": "piper-plus 82ee4e7 src/rust/piper-plus-g2p/data/pinyin_{single,phrases}.json, tone marks converted to tone numbers", "model": "https://github.com/ayutaz/piper-plus" }, "task": "tts-frontend", "totalBytes": 686220, "v": 1 } },
  "lang-en-cmudict-20261001": { "packId": "e54e7243870cef39d5015a51fe7fc57917da946908223a3d5baa5cab85956226", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 868090, "name": "chunk-000", "sha256": "21dc3f65ea440c904746ee1ee59a2e24c88aaf0696b1450b0aedcc001aca1926" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "en" }, "files": [{ "bytes": 863232, "offset": 0, "path": "en/cmudict_data.json.gz", "sha256": "3083a0cf26e01398a6877c8834150f03a230baf6965832b00bfae699063208f4" }, { "bytes": 4858, "offset": 863232, "path": "en/homographs.json.gz", "sha256": "2ef14b6d49476790fdb2008150d417cb9069f7dcb74c25706a43bcc3fe5c4187" }], "lang": ["en"], "license": { "attribution": "CMU Pronouncing Dictionary (Carnegie Mellon University); g2p-en (Kyubyong Park & Jongseok Kim)", "file": "LICENSE.txt", "name": "BSD-2-Clause style (CMU Pronouncing Dictionary) + Apache-2.0 (g2p-en homographs)", "sha256": "3d3a944042879fa3c5a25c317ea7e609c0efa7cf0900c0c298ba331953c27039" }, "name": "\u82F1\u8BED\u53D1\u97F3\u8BCD\u5178\uFF08CMUdict + \u540C\u5F62\u5F02\u97F3\u8868\uFF09", "notes": "homographs.json is a format conversion of g2p-en's homographs.en (Apache-2.0 \xA74: modified file notice).", "sha256": "21dc3f65ea440c904746ee1ee59a2e24c88aaf0696b1450b0aedcc001aca1926", "slug": "lang-en-cmudict-20261001", "source": { "converted": "", "file": "cmudict_data.json: piper-plus 82ee4e7 src/rust/piper-plus-g2p/data/; homographs.json: PyPI g2p-en 2.1.0 g2p_en/homographs.en converted to JSON (content unchanged)", "model": "https://github.com/ayutaz/piper-plus" }, "task": "tts-frontend", "totalBytes": 868090, "v": 1 } }
};
var CREDIT = { "credit": "\u672C\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306E\u97F3\u58F0\u5408\u6210\u306B\u306F\u3001\u30D5\u30EA\u30FC\u7D20\u6750\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u300C\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u300D\uFF08\xA9 Rei Yumesaki\uFF09\u304C\u7121\u6599\u516C\u958B\u3057\u3066\u3044\u308B\u97F3\u58F0\u30C7\u30FC\u30BF\u3092\u4F7F\u7528\u3057\u3066\u3044\u307E\u3059\u3002\n\u25A0\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\uFF08CV.\u5922\u524D\u9ECE\uFF09\nhttps://tyc.rei-yumesaki.net/material/corpus/", "terms": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u306E\u58F0\u8CEA\u3092\u4F7F\u7528\u3059\u308B\u5834\u5408\u306F\u3001\u51FA\u529B\u3057\u305F\u97F3\u58F0\u3092\u6B21\u306E\u76EE\u7684\u3067\u4F7F\u7528\u3059\u308B\u3053\u3068\u3092\u7981\u6B62\u3057\u307E\u3059\u3002\n\u3010\u7981\u6B62\u4E8B\u9805\u3011\n\u25A0\u4EBA\u3092\u6279\u5224\u30FB\u653B\u6483\u3059\u308B\u3053\u3068\u3002\uFF08\u300C\u6279\u5224\u30FB\u653B\u6483\u300D\u306E\u5B9A\u7FA9\u306F\u3001\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u30E9\u30A4\u30BB\u30F3\u30B9\u306B\u6E96\u3058\u307E\u3059\uFF09\n\u25A0\u7279\u5B9A\u306E\u653F\u6CBB\u7684\u7ACB\u5834\u30FB\u5B97\u6559\u30FB\u601D\u60F3\u3078\u306E\u8CDB\u540C\u307E\u305F\u306F\u53CD\u5BFE\u3092\u547C\u3073\u304B\u3051\u308B\u3053\u3068\u3002\n\u25A0\u523A\u6FC0\u306E\u5F37\u3044\u8868\u73FE\u3092\u30BE\u30FC\u30CB\u30F3\u30B0\u306A\u3057\u3067\u516C\u958B\u3059\u308B\u3053\u3068\u3002\n\u25A0\u4ED6\u8005\u306B\u5BFE\u3057\u3066\u4E8C\u6B21\u5229\u7528\uFF08\u7D20\u6750\u3068\u3057\u3066\u306E\u5229\u7528\uFF09\u3092\u8A31\u53EF\u3059\u308B\u5F62\u3067\u516C\u958B\u3059\u308B\u3053\u3068\u3002", "termsUrl": "https://tyc.rei-yumesaki.net/material/corpus/", "attribution": ["ayousanz/piper-plus-tsukuyomi-chan \u2014 \u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04 (modified: zh / en language vectors)", "ayousanz/piper-plus-base \u2014 CC-BY-4.0 (zh / en language vectors)", "Open JTalk \xB7 MeCab \xB7 NAIST-jdic \xB7 pyopenjtalk-plus \xB7 CMUdict \xB7 g2p-en \xB7 pypinyin \xB7 ONNX Runtime"] };

// src/singer/sampler.ts
var ENV = { attack: 0.01, cut: 6e-3, cutStop: 0.06, rel: 0.04, relStop: 0.25 };
var GLIDE_TC = 0.012;
var GLIDE_SPAN = 3;
var XFADE = 0.03;
var KANA = { la: "\u3089", n: "\u3093", u: "\u3046", o: "\u304A", a: "\u3042" };
var MAX_VOICES = 8;
var base = new URL("../assets/preview/", import.meta.url);
async function fetchTable() {
  const [idx, pcm] = await Promise.all([
    // no-cache = 每次跟服务器核对（重新生成过的表不吃浏览器缓存）
    fetch(new URL("vowels.json", base), { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error(`\u8BD5\u542C\u5143\u97F3\u8868\uFF1AHTTP ${r.status}\uFF08\u5148\u8DD1 node scripts/gen-preview-vowels.mjs\uFF1F\uFF09`);
      return r.json();
    }),
    fetch(new URL("vowels.pcm16", base), { cache: "no-cache" }).then((r) => r.arrayBuffer())
  ]);
  const all = new Int16Array(pcm), entries = idx.entries;
  for (const e of entries) {
    const f = new Float32Array(e.len);
    for (let k = 0; k < e.len; k++) f[k] = all[e.start + k] / 32768;
    const b = new AudioBuffer({ length: e.len, numberOfChannels: 1, sampleRate: idx.sr });
    b.copyToChannel(f, 0);
    e.buf = b;
  }
  return { sr: idx.sr, entries };
}
var Sampler = class {
  loading = null;
  table = null;
  voices = /* @__PURE__ */ new Map();
  // 来源 id → 正在响的声音（Map 保持按下的先后）
  song = [];
  songTimer = 0;
  /** 开始加载（不挡任何东西）；重复调用只加载一次，失败了下次重试。 */
  load() {
    if (!this.loading) {
      const p = fetchTable();
      this.loading = p;
      p.then((t) => {
        this.table = t;
      }, () => {
        this.loading = null;
      });
    }
    return this.loading.then(() => void 0);
  }
  get ready() {
    return this.table !== null;
  }
  pick(midi, hum) {
    const es = this.table?.entries.filter((e) => e.kana === KANA[hum]) ?? [];
    if (!es.length) return null;
    return es.reduce((a, b) => Math.abs(b.midi - midi) < Math.abs(a.midi - midi) ? b : a);
  }
  /** 起一个声音；offset > 0 = 从样本中间（循环段）开始，不带起音（滑音换样本时用）。 */
  start(midi, hum, when, ctx2 = audioCtx(), offset = 0, attack = ENV.attack) {
    const e = this.pick(midi, hum), sr = this.table?.sr ?? 22050;
    if (!e?.buf) return null;
    const src = ctx2.createBufferSource(), gain = ctx2.createGain();
    src.buffer = e.buf;
    src.loop = true;
    src.loopStart = e.loopStart / sr;
    src.loopEnd = e.loopEnd / sr;
    src.playbackRate.value = 2 ** ((midi - e.midi) / 12);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(1, when + attack);
    src.connect(gain).connect(ctx2.destination);
    src.start(when, offset);
    return { src, gain, entry: e };
  }
  fade(v, when, tc, stopAfter) {
    v.gain.gain.cancelScheduledValues(when);
    v.gain.gain.setTargetAtTime(0, when, tc);
    v.src.stop(when + stopAfter);
  }
  /** 按下：响（同一来源的旧音先停掉）。还没加载好 = 不响（加载在后台）。 */
  down(midi, hum, id = "main") {
    if (!this.ready) {
      void this.load();
      return;
    }
    const ctx2 = audioCtx(), now = ctx2.currentTime, old = this.voices.get(id);
    if (old) {
      this.fade(old, now, ENV.cut, ENV.cutStop);
      this.voices.delete(id);
    }
    while (this.voices.size >= MAX_VOICES) {
      const [k, v2] = this.voices.entries().next().value;
      this.fade(v2, now, ENV.cut, ENV.cutStop);
      this.voices.delete(k);
    }
    const v = this.start(midi, hum, now);
    if (v) this.voices.set(id, v);
  }
  /** 拖音高：新的顶掉旧的——同一个声音滑过去（离样本太远就交叉淡到另一份的循环段，不带起音）。 */
  glide(midi, hum, id = "main") {
    const v = this.voices.get(id);
    if (!v || !this.ready) {
      this.down(midi, hum, id);
      return;
    }
    const ctx2 = audioCtx(), now = ctx2.currentTime, sr = this.table.sr;
    if (Math.abs(midi - v.entry.midi) <= GLIDE_SPAN) {
      v.src.playbackRate.setTargetAtTime(2 ** ((midi - v.entry.midi) / 12), now, GLIDE_TC);
      return;
    }
    const e = this.pick(midi, hum);
    if (!e) return;
    const nv = this.start(midi, hum, now, ctx2, e.loopStart / sr, XFADE);
    this.fade(v, now, XFADE / 3, XFADE * 3);
    if (nv) this.voices.set(id, nv);
    else this.voices.delete(id);
  }
  /** 松开：这个来源的声音淡出。 */
  up(id = "main") {
    const v = this.voices.get(id);
    if (v) {
      this.fade(v, audioCtx().currentTime, ENV.rel, ENV.relStop);
      this.voices.delete(id);
    }
  }
  /** 全部松开（切走 app / 失焦：抬手的事件可能收不到，别让音卡着响）。 */
  upAll() {
    for (const id of [...this.voices.keys()]) this.up(id);
  }
  /** 轻量版整首：notes = [{ midi, t0, t1 }]（秒），全唱 hum 那个字。返回总时长；播完调 onEnd。 */
  playSong(notes, hum, onEnd) {
    this.stopSong();
    const ctx2 = audioCtx(), t = ctx2.currentTime + 0.1;
    for (const n2 of notes) {
      const v = this.start(n2.midi, hum, t + n2.t0);
      if (v) {
        this.fade(v, t + n2.t1, ENV.rel, ENV.relStop);
        this.song.push(v);
      }
    }
    const total = notes.length ? notes[notes.length - 1].t1 : 0;
    this.songTimer = window.setTimeout(() => {
      this.song = [];
      onEnd();
    }, (total + 0.4) * 1e3);
    return total;
  }
  /** 轻量版整首离线渲染（导出用）：同 playSong 的排法，不出声，直接拿样本。 */
  async renderSong(notes, hum) {
    if (!this.ready) await this.load();
    const sr = this.table.sr, lead = 0.1, total = (notes.length ? notes[notes.length - 1].t1 : 0) + lead + 0.4;
    const ctx2 = new OfflineAudioContext(1, Math.ceil(total * sr), sr);
    for (const n2 of notes) {
      const v = this.start(n2.midi, hum, lead + n2.t0, ctx2);
      if (v) this.fade(v, lead + n2.t1, ENV.rel, ENV.relStop);
    }
    const buf = await ctx2.startRendering();
    return { samples: buf.getChannelData(0), sr };
  }
  stopSong() {
    clearTimeout(this.songTimer);
    const now = audioCtx().currentTime;
    for (const v of this.song) {
      try {
        this.fade(v, now, ENV.cut, ENV.cutStop);
      } catch {
      }
    }
    this.song = [];
  }
  get songPlaying() {
    return this.song.length > 0;
  }
};

// vendor/fflate/fflate.esm.js
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
};
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d2, p, m) {
  var o = p / 8 | 0;
  return (d2[o] | d2[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d2, p) {
  var o = p / 8 | 0;
  return (d2[o] | d2[o + 1] << 8 | d2[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st2, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st2.f && !st2.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st2.i != 2;
  var noSt = st2.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st2.f || 0, pos = st2.p || 0, bt = st2.b || 0, lm = st2.l, dm = st2.d, lbt = st2.m, dbt = st2.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st2.b = bt += l, st2.p = pos = t * 8, st2.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n2 = 0;
            if (s == 16)
              n2 = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n2 = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n2 = 11 + bits(dat, pos, 127), pos += 7;
            while (n2--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d2 = dm[bits16(dat, pos) & dms], dsym = d2 >> 4;
        if (!d2)
          err(3);
        pos += d2 & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st2.l = lm, st2.p = lpos, st2.b = bt, st2.f = final;
    if (lm)
      final = 1, st2.m = lbt, st2.d = dm, st2.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var wbits = function(d2, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d2[o] |= v;
  d2[o + 1] |= v >> 8;
};
var wbits16 = function(d2, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d2[o] |= v;
  d2[o + 1] |= v >> 8;
  d2[o + 2] |= v >> 16;
};
var hTree = function(d2, mb) {
  var t = [];
  for (var i = 0; i < d2.length; ++i) {
    if (d2[i])
      t.push({ s: i, f: d2[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n2, l, d2) {
  return n2.s == -1 ? Math.max(ln(n2.l, l, d2 + 1), ln(n2.r, l, d2 + 1)) : l[n2.s] = d2;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st2) {
  var s = st2.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st2.l;
  var pos = (st2.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st2.r >> 3;
    var opt = deo[lvl - 1];
    var n2 = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st2.p || new u16(32768), head = st2.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st2.i || 0, li = 0, wi = st2.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d2 = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n2, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d2 = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d2) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d2];
          var lin = revfl[l] & 31, din = revfd[d2] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st2.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st2.h = head, st2.p = prev, st2.i = i, st2.w = wi;
    }
  } else {
    for (var i = st2.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st2.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = /* @__PURE__ */ function() {
  var t = new Int32Array(256);
  for (var i = 0; i < 256; ++i) {
    var c = i, k = 9;
    while (--k)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i] = c;
  }
  return t;
}();
var crc = function() {
  var c = -1;
  return {
    p: function(d2) {
      var cr = c;
      for (var i = 0; i < d2.length; ++i)
        cr = crct[cr & 255 ^ d2[i]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var dopt = function(dat, opt, pre, post, st2) {
  if (!st2) {
    st2 = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st2.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st2.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st2);
};
var mrg = function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
};
var b2 = function(d2, b) {
  return d2[b] | d2[b + 1] << 8;
};
var b4 = function(d2, b) {
  return (d2[b] | d2[b + 1] << 8 | d2[b + 2] << 16 | d2[b + 3] << 24) >>> 0;
};
var b8 = function(d2, b) {
  return b4(d2, b) + b4(d2, b + 4) * 4294967296;
};
var wbytes = function(d2, b, v) {
  for (; v; ++b)
    d2[b] = v, v >>>= 8;
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var fltn = function(d2, p, t, o) {
  for (var k in d2) {
    var val = d2[k], n2 = p + k, op = o;
    if (Array.isArray(val))
      op = mrg(o, val[1]), val = val[0];
    if (val instanceof u8)
      t[n2] = [val, op];
    else {
      t[n2 += "/"] = [new u8(0), op];
      fltn(val, n2, t, o);
    }
  }
};
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d2) {
  for (var r = "", i = 0; ; ) {
    var c = d2[i++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i + eb > d2.length)
      return { s: r, r: slc(d2, i - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d2[i++] & 63) << 12 | (d2[i++] & 63) << 6 | d2[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d2[i++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d2[i++] & 63) << 6 | d2[i++] & 63);
  }
};
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i = 0; i < str.length; ++i)
      ar_1[i] = str.charCodeAt(i);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = function(v) {
    ar[ai++] = v;
  };
  for (var i = 0; i < l; ++i) {
    if (ai + 5 > ar.length) {
      var n2 = new u8(ai + 8 + (l - i << 1));
      n2.set(ar);
      ar = n2;
    }
    var c = str.charCodeAt(i);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var slzh = function(d2, b) {
  return b + 30 + b2(d2, b + 26) + b2(d2, b + 28);
};
var zh = function(d2, b, z) {
  var fnl = b2(d2, b + 28), fn = strFromU8(d2.subarray(b + 46, b + 46 + fnl), !(b2(d2, b + 8) & 2048)), es = b + 46 + fnl, bs = b4(d2, b + 20);
  var _a2 = z && bs == 4294967295 ? z64e(d2, es) : [bs, b4(d2, b + 24), b4(d2, b + 42)], sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b2(d2, b + 10), sc, su, fn, es + b2(d2, b + 30) + b2(d2, b + 32), off];
};
var z64e = function(d2, b) {
  for (; b2(d2, b) != 1; b += 4 + b2(d2, b + 2))
    ;
  return [b8(d2, b + 12), b8(d2, b + 4), b8(d2, b + 20)];
};
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k in ex) {
      var l = ex[k].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
};
var wzh = function(d2, b, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d2, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d2[b++] = 20, d2[b++] = f.os;
  d2[b] = 20, b += 2;
  d2[b++] = f.flag << 1 | (c < 0 && 8), d2[b++] = u && 8;
  d2[b++] = f.compression & 255, d2[b++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d2, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d2, b, f.crc);
    wbytes(d2, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d2, b + 8, f.size);
  }
  wbytes(d2, b + 12, fl2);
  wbytes(d2, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d2, b, col);
    wbytes(d2, b + 6, f.attrs);
    wbytes(d2, b + 10, ce), b += 14;
  }
  d2.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k in ex) {
      var exf = ex[k], l = exf.length;
      wbytes(d2, b, +k);
      wbytes(d2, b + 2, l);
      d2.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d2.set(co, b), b += col;
  return b;
};
var wzf = function(o, b, c, d2, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d2);
  wbytes(o, b + 16, e);
};
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r = {};
  var files = [];
  fltn(data, "", r, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r) {
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var compression = p.level == 0 ? 0 : 8;
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    if (s > 65535)
      err(11);
    var d2 = compression ? deflateSync(file, p) : file, l = d2.length;
    var c = crc();
    c.p(file);
    files.push(mrg(p, {
      size: file.length,
      crc: c.d(),
      c: d2,
      f,
      m,
      u: s != fn.length || m && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i = 0; i < files.length; ++i) {
    var f = files[i];
    wzh(out, f.o, f, f.f, f.u, f.c.length);
    var badd = 30 + f.f.length + exfl(f.extra);
    out.set(f.c, f.o + badd);
    wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = o == 4294967295 || c == 65535;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i = 0; i < c; ++i) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// src/score/lang.ts
var KANA2 = /[぀-ヿㇰ-ㇿｦ-ﾟ]/;
var HAN = /\p{Script=Han}/u;
var LATIN = /[A-Za-z]/;
function partDefaultLang(tokens) {
  const ls = tokens.flatMap((t) => t.kind === "note" && t.lyric && t.lyric !== MELISMA_MARK ? [t.lyric] : []).join("");
  if (KANA2.test(ls)) return "ja";
  if (HAN.test(ls)) return "zh";
  if (LATIN.test(ls)) return "en";
  return "ja";
}
function syllableLangs(tokens, override = true) {
  const def = partDefaultLang(tokens);
  let prev = def;
  return tokens.map((t) => {
    if (t.kind !== "note" || !t.lyric || t.lyric === MELISMA_MARK) return null;
    let l = KANA2.test(t.lyric) ? "ja" : HAN.test(t.lyric) ? prev : LATIN.test(t.lyric) ? "en" : prev;
    if (override && t.lang) l = t.lang;
    prev = l;
    return l;
  });
}
function keepOnlyOverrides(tokens, read) {
  const def = partDefaultLang(tokens);
  let prev = def;
  tokens.forEach((t, i) => {
    if (t.kind !== "note" || !t.lyric || t.lyric === MELISMA_MARK) return;
    const auto = KANA2.test(t.lyric) ? "ja" : HAN.test(t.lyric) ? prev : LATIN.test(t.lyric) ? "en" : prev;
    const got = read[i];
    if (got && got !== auto) t.lang = got;
    else delete t.lang;
    prev = got ?? auto;
  });
}

// src/format/xml.ts
var ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decode(s) {
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m, e) => e[0] === "#" ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e] ?? m);
}
var esc2 = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function parseXml(src) {
  let i = 0;
  const fail = (what) => {
    throw new Error(`XML \u8BFB\u4E0D\u61C2\uFF08\u7B2C ${src.slice(0, i).split("\n").length} \u884C\uFF09\uFF1A${what}`);
  };
  const stack = [{ name: "#doc", attrs: {}, children: [] }];
  while (i < src.length) {
    const lt = src.indexOf("<", i);
    const text2 = src.slice(i, lt < 0 ? src.length : lt);
    if (text2 && stack.length > 1) stack[stack.length - 1].children.push(decode(text2));
    if (lt < 0) break;
    i = lt;
    if (src.startsWith("<!--", i)) {
      const e = src.indexOf("-->", i);
      if (e < 0) fail("\u6CE8\u91CA\u6CA1\u6536\u5C3E");
      i = e + 3;
      continue;
    }
    if (src.startsWith("<![CDATA[", i)) {
      const e = src.indexOf("]]>", i);
      if (e < 0) fail("CDATA \u6CA1\u6536\u5C3E");
      stack[stack.length - 1].children.push(src.slice(i + 9, e));
      i = e + 3;
      continue;
    }
    if (src.startsWith("<?", i)) {
      const e = src.indexOf("?>", i);
      if (e < 0) fail("\u5904\u7406\u6307\u4EE4\u6CA1\u6536\u5C3E");
      i = e + 2;
      continue;
    }
    if (src.startsWith("<!", i)) {
      let depth = 0, j = i;
      for (; j < src.length; j++) {
        const c = src[j];
        if (c === "[") depth++;
        else if (c === "]") depth--;
        else if (c === ">" && depth === 0) break;
      }
      i = j + 1;
      continue;
    }
    if (src[i + 1] === "/") {
      const e = src.indexOf(">", i);
      if (e < 0) fail("\u7ED3\u675F\u6807\u7B7E\u6CA1\u6536\u5C3E");
      const name = src.slice(i + 2, e).trim(), top = stack.pop();
      if (!top || top.name !== name) fail(`\u7ED3\u675F\u6807\u7B7E </${name}> \u5BF9\u4E0D\u4E0A <${top?.name}>`);
      i = e + 1;
      continue;
    }
    const m = /^<([^\s/>]+)/.exec(src.slice(i, i + 200));
    if (!m) fail("\u6807\u7B7E\u540D");
    const el = { name: m[1], attrs: {}, children: [] };
    i += m[0].length;
    const attrRe = /\s*([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/y;
    for (; ; ) {
      attrRe.lastIndex = i;
      const a = attrRe.exec(src);
      if (!a) break;
      el.attrs[a[1]] = decode(a[3] ?? a[4] ?? "");
      i = attrRe.lastIndex;
    }
    while (/\s/.test(src[i] ?? "")) i++;
    stack[stack.length - 1].children.push(el);
    if (src.startsWith("/>", i)) {
      i += 2;
      continue;
    }
    if (src[i] !== ">") fail(`<${el.name}> \u91CC\u6709\u8BFB\u4E0D\u61C2\u7684\u4E1C\u897F`);
    i++;
    stack.push(el);
  }
  if (stack.length !== 1) fail(`<${stack[stack.length - 1].name}> \u6CA1\u6709\u7ED3\u675F`);
  const root = stack[0].children.find((c) => typeof c !== "string");
  if (!root) fail("\u6CA1\u6709\u6839\u5143\u7D20");
  return root;
}
var kids = (el, name) => (el?.children ?? []).filter((c) => typeof c !== "string" && (name === void 0 || c.name === name));
var kid = (el, name) => kids(el, name)[0];
var text = (el) => (el?.children ?? []).map((c) => typeof c === "string" ? c : text(c)).join("");
var childText = (el, name) => {
  const k = kid(el, name);
  return k ? text(k).trim() : void 0;
};

// src/format/musicxml.ts
var measureLen = (beats, beatType) => beats * WHOLE / beatType;
var TYPES = [["whole", WHOLE], ["half", WHOLE / 2], ["quarter", TPQ], ["eighth", TPQ / 2], ["16th", TPQ / 4], ["32nd", TPQ / 8], ["64th", TPQ / 16]];
var TUPLETS = [[1, 1], [3, 2], [5, 4], [6, 4], [7, 4]];
function noteType(dur) {
  for (const [act, norm] of TUPLETS) for (const [type, base2] of TYPES) for (let dots = 0; dots <= 2; dots++) {
    if (Math.abs(base2 * (2 - 1 / 2 ** dots) * (norm / act) - dur) < 0.5) return { type, dots, tuplet: act === 1 ? null : [act, norm] };
  }
  return null;
}
var pitchXml = (p) => `<pitch><step>${p.step}</step>${p.alter ? `<alter>${p.alter}</alter>` : ""}<octave>${p.octave}</octave></pitch>`;
function writeMusicXml(song, part, meta) {
  const toks = song.tokens, head = headLen(toks);
  const H = { fifths: DEFAULT_KEY, beats: DEFAULT_TIME.beats, beatType: DEFAULT_TIME.beatType, bpm: DEFAULT_BPM };
  for (let i = 0; i < head; i++) {
    const t = toks[i];
    if (t.kind === "key") H.fifths = t.fifths;
    else if (t.kind === "time") {
      H.beats = t.beats;
      H.beatType = t.beatType;
    } else if (t.kind === "tempo") H.bpm = t.bpm;
  }
  const langs = syllableLangs(toks);
  const measures = [];
  let cur = [], ticks = 0, len = measureLen(H.beats, H.beatType);
  const close = (manual) => {
    measures.push({ body: cur, manual });
    cur = [];
    ticks = 0;
  };
  const tempoXml = (bpm) => `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${bpm}</per-minute></metronome></direction-type><sound tempo="${bpm}"/></direction>`;
  cur.push(`<attributes><divisions>${TPQ}</divisions><key><fifths>${H.fifths}</fifths></key><time><beats>${H.beats}</beats><beat-type>${H.beatType}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`, tempoXml(H.bpm));
  let prevHyph = false;
  const syllabic = (t) => {
    const s = t.hyph ? prevHyph ? "middle" : "begin" : prevHyph ? "end" : "single";
    prevHyph = !!t.hyph;
    return s;
  };
  const unwritten = [];
  const nextTimed = (i) => {
    for (let j = i + 1; j < toks.length; j++) {
      const t = toks[j];
      if (t.kind === "note" || t.kind === "rest") return t;
    }
    return null;
  };
  for (let i = head; i < toks.length; i++) {
    const t = toks[i];
    if (t.kind === "bar") {
      close(true);
      continue;
    }
    if (t.kind === "key" || t.kind === "time" || t.kind === "tempo") {
      if (ticks >= len || t.kind === "time" && ticks > 0) close(false);
      if (t.kind === "key") cur.push(`<attributes><key><fifths>${t.fifths}</fifths></key></attributes>`);
      else if (t.kind === "time") {
        cur.push(`<attributes><time><beats>${t.beats}</beats><beat-type>${t.beatType}</beat-type></time></attributes>`);
        len = measureLen(t.beats, t.beatType);
      } else cur.push(tempoXml(t.bpm));
      continue;
    }
    if (t.kind !== "note" && t.kind !== "rest") continue;
    let left = t.dur, k = 0;
    const tieOut = t.kind === "note" && nextTimed(i)?.kind === "note" && nextTimed(i).tie;
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
          else x += `<lyric number="1"><syllabic>${syllabic(t)}</syllabic><text xml:lang="${esc2(langs[i] ?? "ja")}">${esc2(t.lyric)}</text></lyric>`;
        }
        lyricDone = true;
      }
      x += `</note>`;
      cur.push(x);
      ticks += piece;
      left -= piece;
      k++;
    }
    if (t.kind === "note" && !t.pitch) unwritten.push(`n${t.id}`);
  }
  if (cur.length || !measures.length) close(false);
  const manualBars = [];
  const body = measures.map((m, n2) => {
    if (m.manual) manualBars.push(n2 + 1);
    return `<measure number="${n2 + 1}">${m.body.join("")}</measure>`;
  }).join("\n");
  const P = part;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
${song.title ? `<work><work-title>${esc2(song.title)}</work-title></work>
` : ""}<identification><encoding><software>${esc2(meta.software)}</software><encoding-date>${esc2(meta.date)}</encoding-date></encoding></identification>
<part-list><score-part id="${P.id}"><part-name>${esc2(P.name)}</part-name><score-instrument id="${P.id}-I1"><instrument-name>${esc2(P.instrumentName)}</instrument-name><instrument-sound>${esc2(P.sound)}</instrument-sound>${P.variant ? `<virtual-instrument><virtual-library>${esc2(P.variant.library)}</virtual-library><virtual-name>${esc2(P.variant.name)}</virtual-name></virtual-instrument>` : ""}</score-instrument><midi-instrument id="${P.id}-I1"><midi-program>${P.program}</midi-program>${P.volume !== void 0 ? `<volume>${P.volume}</volume>` : ""}${P.pan !== void 0 ? `<pan>${P.pan}</pan>` : ""}</midi-instrument></score-part></part-list>
<part id="${P.id}">
${body}
</part>
</score-partwise>
`;
  return { xml, manualBars, unwritten };
}
function readMusicXml(xml, hints) {
  const root = parseXml(xml);
  if (root.name === "score-timewise") throw new Error("\u8FD9\u4EFD MusicXML \u662F timewise \u6392\u6CD5\uFF0C\u8FD9\u4E00\u7248\u53EA\u8BFB partwise");
  if (root.name !== "score-partwise") throw new Error(`\u8FD9\u4E0D\u662F MusicXML \u4E50\u8C31\uFF08\u6839\u5143\u7D20\u662F <${root.name}>\uFF09`);
  const dropped = {};
  const drop = (what) => {
    dropped[what] = (dropped[what] ?? 0) + 1;
  };
  const parts = kids(kid(root, "part-list"), "score-part").map((sp) => {
    const si = kid(sp, "score-instrument"), mi = kid(sp, "midi-instrument"), vi = kid(si, "virtual-instrument");
    const num = (s) => s === void 0 || s === "" ? void 0 : Number(s);
    return {
      id: sp.attrs.id,
      name: childText(sp, "part-name") ?? "",
      instrumentName: childText(si, "instrument-name"),
      program: num(childText(mi, "midi-program")),
      variant: childText(vi, "virtual-name"),
      volume: num(childText(mi, "volume")),
      pan: num(childText(mi, "pan"))
    };
  });
  const partEls = kids(root, "part");
  if (!partEls.length) throw new Error("\u8FD9\u4EFD MusicXML \u91CC\u6CA1\u6709\u58F0\u90E8");
  if (partEls.length > 1) dropped["\u5176\u4F59\u58F0\u90E8\uFF08\u8FD9\u4E00\u7248\u53EA\u7F16\u8F91\u7B2C\u4E00\u4E2A\u58F0\u90E8\uFF09"] = partEls.length - 1;
  const title = childText(kid(root, "work"), "work-title") ?? childText(root, "movement-title") ?? "";
  const manual = hints?.manualBars ? new Set(hints.manualBars) : null, unwritten = new Set(hints?.unwritten ?? []);
  const H = { fifths: DEFAULT_KEY, beats: DEFAULT_TIME.beats, beatType: DEFAULT_TIME.beatType, bpm: DEFAULT_BPM, gotKey: false, gotTime: false, gotTempo: false };
  const body = [], langRead = /* @__PURE__ */ new Map();
  let headPhase = true, divisions = TPQ, voice = null;
  const usedIds = /* @__PURE__ */ new Set();
  const takeId = (s) => {
    const m = s ? /^[nr](\d+)$/.exec(s) : null;
    if (!m) return null;
    const n2 = +m[1];
    if (usedIds.has(n2)) return null;
    usedIds.add(n2);
    return n2;
  };
  const tempoOf = (el) => {
    const s = el.name === "sound" ? el : kid(el, "sound");
    const v = s?.attrs.tempo;
    return v ? Math.round(Number(v)) : null;
  };
  const mark = (t) => {
    body.push(t);
  };
  kids(partEls[0], "measure").forEach((m, mi) => {
    for (const c of kids(m)) {
      if (c.name === "attributes") {
        const d2 = childText(c, "divisions");
        if (d2) divisions = Number(d2);
        const key = kid(c, "key"), time = kid(c, "time");
        if (key && childText(key, "fifths") !== void 0) {
          const f = Number(childText(key, "fifths"));
          if (headPhase && !H.gotKey) {
            H.fifths = f;
            H.gotKey = true;
          } else mark({ kind: "key", id: 0, fifths: f });
        }
        if (time && childText(time, "beats")) {
          const b = Number(childText(time, "beats")), bt = Number(childText(time, "beat-type"));
          if (headPhase && !H.gotTime) {
            H.beats = b;
            H.beatType = bt;
            H.gotTime = true;
          } else mark({ kind: "time", id: 0, beats: b, beatType: bt });
        }
      } else if (c.name === "direction" || c.name === "sound") {
        const bpm = tempoOf(c);
        if (bpm) {
          if (headPhase && !H.gotTempo) {
            H.bpm = bpm;
            H.gotTempo = true;
          } else mark({ kind: "tempo", id: 0, bpm });
        }
      } else if (c.name === "note") {
        if (kid(c, "grace")) {
          drop("\u88C5\u9970\u97F3");
          continue;
        }
        if (kid(c, "cue")) {
          drop("\u63D0\u793A\u97F3\u7B26");
          continue;
        }
        const v = childText(c, "voice") ?? "1";
        if (voice === null) voice = v;
        if (v !== voice) {
          drop("\u540C\u4E00\u58F0\u90E8\u91CC\u7684\u7B2C\u4E8C\u6761\u65CB\u5F8B");
          continue;
        }
        if (kid(c, "chord")) {
          drop("\u53E0\u97F3\uFF08\u540C\u65F6\u54CD\u7684\u97F3\uFF09");
          continue;
        }
        headPhase = false;
        const dur = Math.round(Number(childText(c, "duration") ?? "0") * TPQ / divisions);
        if (dur <= 0) continue;
        const idAttr = c.attrs.id, cont = idAttr ? /^([nr])(\d+)-\d+$/.exec(idAttr) : null;
        const prev = body[body.length - 1];
        if (cont && prev && (prev.kind === "note" || prev.kind === "rest") && prev.id === +cont[2] && cont[1] === "n" === (prev.kind === "note")) {
          prev.dur += dur;
          continue;
        }
        const isRest = !!kid(c, "rest");
        if (isRest) {
          mark({ kind: "rest", id: takeId(idAttr) ?? 0, dur });
          continue;
        }
        const pe = kid(c, "pitch");
        if (!pe) {
          drop("\u6CA1\u6709\u97F3\u9AD8\u7684\u97F3\uFF08\u6253\u51FB\u4E50\uFF09");
          continue;
        }
        const pitch = { step: childText(pe, "step") ?? "C", alter: Number(childText(pe, "alter") ?? "0"), octave: Number(childText(pe, "octave") ?? "4") };
        const tok = { kind: "note", id: takeId(idAttr) ?? 0, pitch: unwritten.has(idAttr ?? "") ? null : pitch, dur, lyric: null };
        if (kids(c, "tie").some((t) => t.attrs.type === "stop")) tok.tie = true;
        const lyrics = kids(c, "lyric"), ly = lyrics.find((l) => (l.attrs.number ?? "1") === "1") ?? lyrics[0];
        if (lyrics.length > 1) drop("\u7B2C\u4E8C\u6BB5\u53CA\u4EE5\u540E\u7684\u6B4C\u8BCD");
        if (ly) {
          const tx = kid(ly, "text");
          if (tx) {
            tok.lyric = text(tx);
            const syl = childText(ly, "syllabic");
            if (syl === "begin" || syl === "middle") tok.hyph = true;
            if (tx.attrs["xml:lang"]) langRead.set(tok, tx.attrs["xml:lang"]);
          } else if (kid(ly, "extend")) tok.lyric = MELISMA_MARK;
        }
        mark(tok);
      } else if (c.name === "backup" || c.name === "forward") {
      } else if (c.name === "harmony") drop("\u548C\u5F26\u8BB0\u53F7");
    }
    const n2 = Number(m.attrs.number ?? mi + 1);
    if (manual ? manual.has(n2) : mi < kids(partEls[0], "measure").length - 1) body.push({ kind: "bar", id: 0 });
  });
  const tokens = [{ kind: "key", id: 0, fifths: H.fifths }, { kind: "time", id: 0, beats: H.beats, beatType: H.beatType }, { kind: "tempo", id: 0, bpm: H.bpm }, ...body];
  let next2 = Math.max(0, ...usedIds) + 1;
  for (const t of tokens) if (!t.id) t.id = next2++;
  keepOnlyOverrides(tokens, tokens.map((t) => langRead.get(t) ?? null));
  return { song: { ...title ? { title } : {}, hum: "n", tokens }, title, parts, dropped };
}

// src/format/project.ts
var FORMAT = { manifest: 1, score: 1, lounge: 1, studio: 1 };
var MIMETYPE = "application/vnd.recordare.musicxml";
var DIR = ".moonsinger/";
var emptyExtras = () => ({ lounge: {}, unknown: {}, rootfiles: [] });
var PART = "P1";
var ROLE = "r1";
var MIC = "m1";
var CAND = { full: "c1", light: "c2" };
function defaultRole(hum, quality2) {
  return { version: FORMAT.lounge, id: ROLE, name: "\u4E3B\u5531", active: CAND[quality2], candidates: [
    { id: CAND.full, name: "\u6708\u8BFB", gm: { program: 55, variant: "tsukuyomi" }, hum, calibrationDb: 0, chain: [], engines: {} },
    { id: CAND.light, name: "\u6708\u8BFB\uFF08\u5143\u97F3\uFF09", gm: { program: 55, variant: "tsukuyomi-vowels" }, hum, calibrationDb: 0, chain: [], engines: {} }
  ] };
}
function saveMxl(a) {
  const role = structuredClone(a.extras.lounge[ROLE] ?? defaultRole(a.hum, a.quality === "none" ? "full" : a.quality));
  if (a.quality !== "none") role.active = CAND[a.quality];
  const cands = role.candidates ?? [];
  for (const c of cands) if (c.id === CAND.full || c.id === CAND.light) c.hum = a.hum;
  const active = cands.find((c) => c.id === role.active);
  const studio = structuredClone(a.extras.studio ?? { version: FORMAT.studio, mics: [{ id: MIC, name: "\u9EA6\u514B\u98CE 1", gainDb: 0, pan: 0 }] });
  const mic = (studio.mics ?? [])[0];
  const w = writeMusicXml(a.song, {
    id: PART,
    name: String(role.name ?? "\u4E3B\u5531"),
    instrumentName: String(active?.name ?? "\u6708\u8BFB"),
    sound: "voice.synth",
    program: Number(active?.gm?.program ?? 55),
    variant: typeof active?.gm?.variant === "string" ? { library: "MoonSinger", name: String(active.gm.variant) } : void 0,
    pan: mic ? Math.round(Number(mic.pan ?? 0) * 90) : void 0
  }, { software: `MoonSinger ${a.app}`, date: a.date });
  const scoreExt = {
    ...a.extras.scoreExt ?? {},
    version: FORMAT.score,
    parts: [{ id: PART, role: ROLE, mic: MIC }],
    manualBars: { [PART]: w.manualBars },
    unwritten: w.unwritten
  };
  const files = {};
  const lounge = { ...a.extras.lounge, [ROLE]: role };
  const manifest = {
    ...a.extras.manifest ?? {},
    format: "moonsinger",
    version: FORMAT.manifest,
    app: a.app,
    saved: a.date,
    files: { "score.json": FORMAT.score, "studio.json": FORMAT.studio, ...Object.fromEntries(Object.entries(lounge).map(([id, r]) => [`lounge/${id}.json`, Number(r.version ?? 1)])) }
  };
  const json = (o) => strToU8(JSON.stringify(o, null, 2) + "\n");
  const rootfiles = [
    `<rootfile full-path="score.musicxml" media-type="application/vnd.recordare.musicxml+xml"/>`,
    ...a.extras.rootfiles.map((r) => `<rootfile full-path="${r.path}" media-type="${r.mediaType}"/>`)
  ].join("\n    ");
  files["mimetype"] = strToU8(MIMETYPE);
  files["META-INF/container.xml"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    ${rootfiles}
  </rootfiles>
</container>
`);
  files["score.musicxml"] = strToU8(w.xml);
  files[`${DIR}manifest.json`] = json(manifest);
  files[`${DIR}score.json`] = json(scoreExt);
  for (const [id, r] of Object.entries(lounge)) files[`${DIR}lounge/${id}.json`] = json(r);
  files[`${DIR}studio.json`] = json(studio);
  for (const [path, bytes] of Object.entries(a.extras.unknown)) if (!(path in files)) files[path] = bytes;
  const entries = {};
  for (const [path, bytes] of Object.entries(files)) entries[path] = [bytes, { level: path === "mimetype" ? 0 : 6 }];
  return zipSync(entries);
}
function openBytes(name, bytes) {
  const isZip = bytes[0] === 80 && bytes[1] === 75;
  if (!isZip) {
    const r2 = readMusicXml(new TextDecoder().decode(bytes));
    return finish(r2, emptyExtras(), false, name);
  }
  let files;
  try {
    files = unzipSync(bytes);
  } catch (e) {
    throw new Error(`\u8FD9\u4E2A\u6587\u4EF6\u89E3\u4E0D\u5F00\uFF08\u4E0D\u662F\u5B8C\u6574\u7684 .mxl\uFF1F\uFF09\uFF1A${e.message}`);
  }
  const container = files["META-INF/container.xml"];
  if (!container) throw new Error("\u8FD9\u4E2A\u538B\u7F29\u5305\u91CC\u6CA1\u6709 META-INF/container.xml\uFF0C\u4E0D\u662F .mxl");
  const paths = [...strFromU8(container).matchAll(/<rootfile\b[^>]*full-path="([^"]+)"[^>]*?(?:media-type="([^"]*)")?[^>]*\/?>/g)].map((m) => ({ path: m[1], mediaType: m[2] ?? "" }));
  const main = paths[0]?.path;
  if (!main || !files[main]) throw new Error("container.xml \u6307\u7684\u4E3B\u4E50\u8C31\u5728\u5305\u91CC\u627E\u4E0D\u5230");
  const extras = emptyExtras();
  extras.rootfiles = paths.slice(1);
  const known = /* @__PURE__ */ new Set(["mimetype", "META-INF/container.xml", main]);
  const manifestBytes = files[`${DIR}manifest.json`];
  const ours = !!manifestBytes;
  let hints;
  if (ours) {
    const parse = (p) => {
      try {
        return JSON.parse(strFromU8(files[p]));
      } catch {
        throw new Error(`${p} \u8BFB\u4E0D\u61C2\uFF08\u6587\u4EF6\u574F\u4E86\uFF1F\uFF09`);
      }
    };
    const manifest = parse(`${DIR}manifest.json`);
    known.add(`${DIR}manifest.json`);
    const newer = (what, v, mine) => {
      if (Number(v) > mine) throw new Error(`\u8FD9\u9996\u6B4C\u662F\u66F4\u65B0\u7248\u672C\u7684 MoonSinger \u5B58\u7684\uFF08${what} \u7B2C ${v} \u7248\uFF0C\u8FD9\u4E00\u7248\u53EA\u8BA4\u5230\u7B2C ${mine} \u7248\uFF09\uFF0C\u6253\u5F00\u518D\u5B58\u4F1A\u4E22\u4E1C\u897F\uFF0C\u6240\u4EE5\u6CA1\u6709\u6253\u5F00\u3002\u8BF7\u5148\u66F4\u65B0 app\u3002`);
    };
    newer("\u603B\u76EE\u5F55", manifest.version, FORMAT.manifest);
    extras.manifest = manifest;
    if (files[`${DIR}score.json`]) {
      const s = parse(`${DIR}score.json`);
      known.add(`${DIR}score.json`);
      newer("\u8C31\u7684\u6269\u5C55", s.version, FORMAT.score);
      extras.scoreExt = s;
      const part = (s.parts ?? [])[0];
      const pid = String(part?.id ?? PART);
      hints = { manualBars: (s.manualBars ?? {})[pid] ?? [], unwritten: s.unwritten ?? [] };
    }
    for (const p of Object.keys(files)) {
      const m = /^\.moonsinger\/lounge\/([^/]+)\.json$/.exec(p);
      if (m) {
        const r2 = parse(p);
        newer(`\u4F11\u606F\u5BA4\u300C${r2.name ?? m[1]}\u300D`, r2.version, FORMAT.lounge);
        extras.lounge[m[1]] = r2;
        known.add(p);
      }
    }
    if (files[`${DIR}studio.json`]) {
      const s = parse(`${DIR}studio.json`);
      known.add(`${DIR}studio.json`);
      newer("\u5F55\u97F3\u623F", s.version, FORMAT.studio);
      extras.studio = s;
    }
  }
  for (const [p, b] of Object.entries(files)) if (!known.has(p) && !p.endsWith("/")) extras.unknown[p] = b;
  const r = readMusicXml(strFromU8(files[main]), hints);
  return finish(r, extras, ours, name);
}
function finish(r, extras, ours, name) {
  const notices = [];
  const dropped = Object.entries(r.dropped);
  if (dropped.length) notices.push(`\u8FD9\u4EFD\u8C31\u91CC\u6709\u8FD9\u4E00\u7248\u8FD8\u4E0D\u652F\u6301\u7684\u4E1C\u897F\uFF0C\u6CA1\u6709\u8BFB\u8FDB\u6765\uFF1A${dropped.map(([k, n2]) => `${k} ${n2} \u5904`).join("\u3001")}\u3002\u5B58\u7684\u65F6\u5019\u5B83\u4EEC\u4E0D\u4F1A\u5728\u65B0\u6587\u4EF6\u91CC\u2014\u2014\u8981\u7559\u539F\u6837\uFF0C\u8BF7\u300C\u53E6\u5B58\u4E3A\u300D\u65B0\u6587\u4EF6\u3002`);
  let hum = "n", quality2 = "full";
  if (!extras.lounge[ROLE] && !ours) {
    const p = r.parts[0];
    const was = p?.instrumentName || p?.name || "\u539F\u6765\u7684\u4E50\u5668";
    const gm = p?.program;
    const role2 = defaultRole("n", "full");
    role2.name = p?.name || "\u4E3B\u5531";
    role2.active = "c0";
    role2.candidates.unshift({ id: "c0", name: was, gm: { program: gm ?? null, variant: p?.variant ?? null }, calibrationDb: 0, chain: [], engines: {} });
    extras.lounge[ROLE] = role2;
    notices.push(`\u58F0\u90E8\u300C${role2.name}\u300D\u539F\u6765\u662F${was}${gm ? `\uFF08GM ${gm} \u53F7\uFF09` : ""}\uFF1B\u8FD9\u4E00\u7248\u6CA1\u6709\u8FD9\u4EF6\u4E50\u5668\uFF0C\u6240\u4EE5\u8FD8\u6CA1\u4EBA\u4E0A\u573A\u3002\u8981\u6708\u8BFB\u6765\u5531\uFF0C\u5728\u9876\u680F\u300C\u97F3\u8D28\u300D\u9009\u300C\u5B8C\u6574\u300D\u6216\u300C\u8F7B\u91CF\u300D\u3002`);
  }
  const role = extras.lounge[ROLE];
  if (role) {
    quality2 = role.active === CAND.full ? "full" : role.active === CAND.light ? "light" : "none";
    const c = (role.candidates ?? []).find((x) => x.id === CAND.full);
    const h = c?.hum;
    if (h === "la" || h === "n" || h === "u" || h === "o" || h === "a") hum = h;
  }
  const stem = name.replace(/\.(mxl|musicxml|xml)$/i, "");
  return { song: { ...r.song, hum }, stem, hum, quality: quality2, extras, ours, notices };
}

// src/app/doc-file.ts
var TYPES2 = [{ description: "MusicXML \u4E50\u8C31\uFF08MoonSinger \u5B58\u6210 .mxl\uFF09", accept: {
  "application/vnd.recordare.musicxml": [".mxl"],
  "application/vnd.recordare.musicxml+xml": [".musicxml", ".xml"]
} }];
var ACCEPT = ".mxl,.musicxml,.xml";
var g = globalThis;
var topLevel = () => {
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
};
var canPickOpen = () => topLevel() && typeof g.showOpenFilePicker === "function";
var canPickSave = () => topLevel() && typeof g.showSaveFilePicker === "function";
var aborted = (e) => e.name === "AbortError";
async function pickOpen() {
  if (canPickOpen()) {
    let hs;
    try {
      hs = await g.showOpenFilePicker({ types: TYPES2, multiple: false, excludeAcceptAllOption: false });
    } catch (e) {
      if (aborted(e)) return null;
      throw e;
    }
    const f = await hs[0].getFile();
    return { name: f.name, bytes: new Uint8Array(await f.arrayBuffer()), handle: hs[0] };
  }
  return new Promise((resolve, reject) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ACCEPT;
    inp.hidden = true;
    inp.addEventListener("change", async () => {
      const f = inp.files?.[0];
      inp.remove();
      if (!f) {
        resolve(null);
        return;
      }
      try {
        resolve({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()), handle: null });
      } catch (e) {
        reject(e);
      }
    }, { once: true });
    document.body.append(inp);
    inp.click();
  });
}
async function pickSave(suggestedName) {
  try {
    return await g.showSaveFilePicker({ suggestedName, types: TYPES2 });
  } catch (e) {
    if (aborted(e)) return null;
    throw e;
  }
}
async function writeTo(h, bytes) {
  const w = await h.createWritable();
  await w.write(bytes);
  await w.close();
}

// src/app/names.ts
function defaultStem(now = /* @__PURE__ */ new Date()) {
  const z = (n2) => String(n2).padStart(2, "0");
  let r;
  try {
    r = crypto.getRandomValues(new Uint16Array(1))[0];
  } catch {
    r = Math.floor(Math.random() * 65536);
  }
  return `${now.getFullYear()}${z(now.getMonth() + 1)}${z(now.getDate())}-${r.toString(16).padStart(4, "0")}`;
}
var fileSafe = (s) => s.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "").trim();

// src/app/main.ts
var st = initState();
var doc = {
  stem: defaultStem(),
  handle: null,
  extras: emptyExtras(),
  saved: { song: st.song, quality: "full" }
};
var docName = () => fileSafe(st.song.title ?? "") || doc.stem;
var $ = (id) => document.getElementById(id);
var bar = $("bar");
var scoreEl = $("score");
var padEl = $("padPanel");
installPlatformGuards([scoreEl, padEl]);
var shell = initPwaShell({ onUpdateAvailable: () => showUpdateBar() });
function showUpdateBar() {
  if (document.getElementById("updateBar")) return;
  const el = document.createElement("div");
  el.id = "updateBar";
  el.className = "update-bar";
  el.innerHTML = `<span>\u6709\u65B0\u7248\u672C</span><button class="btn primary" data-v="reload">\u5237\u65B0</button><button class="btn" data-v="later">\u5F85\u4F1A\u513F</button>`;
  el.addEventListener("click", (e) => {
    const v = e.target.closest("[data-v]")?.dataset.v;
    if (v === "reload") void shell.reload();
    else if (v === "later") el.remove();
  });
  document.body.append(el);
}
bar.innerHTML = `<button id="fileBtn" class="btn" title="\u6587\u4EF6\uFF1A\u65B0\u5EFA / \u6253\u5F00 / \u5B58 / \u53E6\u5B58\u4E3A\uFF08Ctrl / \u2318+S \u5B58\uFF09"><svg class="ico"><use href="#file"/></svg></button><span id="docTitle" class="title">\u672A\u547D\u540D</span><span class="ver">${APP_VERSION}</span><label class="field" title="\u5B8C\u6574 = \u6708\u8BFB\u672C\u4EBA\uFF08\u7B2C\u4E00\u6B21\u8981\u52A0\u8F7D\u7EA6 65 MB\uFF09\uFF1B\u8F7B\u91CF = \u5143\u97F3\u91C7\u6837\uFF0C\u6309\u4E0B\u5373\u54CD\u3001\u4EFB\u4F55\u8BBE\u5907\u90FD\u80FD\u8DD1">\u97F3\u8D28<select id="qualSel"><option value="full">\u5B8C\u6574</option><option value="light">\u8F7B\u91CF</option></select></label><label class="field" title="\u6CA1\u5199\u6B4C\u8BCD\u7684\u97F3\u5531\u4EC0\u4E48">\u54FC<select id="humSel"><option value="la">\u3089 / \u5566</option><option value="n">\u3093 / \u55EF</option><option value="u">\u3046 / \u545C</option><option value="o">\u304A / \u54E6</option><option value="a">\u3042 / \u554A</option></select></label><span class="spacer"></span><span id="singStatus" class="status sing"></span><span id="status" class="status"></span><button id="padBtn" class="btn is-on" title="\u624B\u6307 pad"><svg class="ico"><use href="#grid"/></svg></button><button id="setBtn" class="btn" title="\u8BBE\u7F6E\uFF1A\u6A21\u578B\u6765\u6E90\u3001\u5BFC\u5165\u6A21\u578B\u5305\u3001\u6708\u8BFB\u7684\u7F72\u540D\u4E0E\u4F7F\u7528\u6761\u6B3E"><svg class="ico"><use href="#wrench"/></svg></button><button id="shareBtn" class="btn" title="\u5BFC\u51FA\u6B4C\u58F0\uFF08mp3\uFF09\uFF0C\u53D1\u7ED9\u522B\u4EBA\u542C"><svg class="ico"><use href="#export"/></svg></button><button id="improBtn" class="btn" title="\u5F39\uFF1A\u97F3\u7B26\u53EA\u5531\u4E0D\u5199\uFF08\`\uFF09">\u5F39</button><button id="playBtn" class="btn" title="\u6708\u8BFB\u5531 / \u505C\uFF08\u7A7A\u683C\uFF09"><svg class="ico"><use href="#play"/></svg></button>`;
var sampler = new Sampler();
var sound = {
  down: (p, id = "main") => sampler.down(midiOf(p), st.song.hum, id),
  up: (id = "main") => sampler.up(id)
};
var soundTok = (s, i, id = "main") => {
  const t = s.song.tokens[i];
  if (t?.kind === "note" && t.pitch) sound.down(t.pitch, id);
};
var keyTok = (s, i, code) => {
  const t = s.song.tokens[i];
  soundTok(s, i, `key${code}`);
  if (t?.kind === "note" && t.pitch) pad.showDown(t.pitch, `key${code}`);
};
function writeAndLocate(write) {
  let target = -1;
  if (st.sel) {
    for (let k = st.sel.from; k < st.sel.to; k++) if (st.song.tokens[k].kind === "note") {
      target = k;
      break;
    }
  }
  update(write(st));
  return target >= 0 ? target : st.caret - 1;
}
var upTimer = 0;
var view = new ScoreView(scoreEl, {
  get: () => st,
  set: (n2) => update(n2),
  audition: (i, hold) => {
    clearTimeout(upTimer);
    soundTok(st, i, "score");
    if (!hold) upTimer = window.setTimeout(() => sound.up("score"), 350);
  },
  glide: (i) => {
    clearTimeout(upTimer);
    const t = st.song.tokens[i];
    if (t?.kind === "note" && t.pitch) sampler.glide(midiOf(t.pitch), st.song.hum, "score");
  },
  release: () => {
    clearTimeout(upTimer);
    sound.up("score");
  },
  focus: (where) => {
    if (stacked()) showPad(where === "staff");
  },
  autoBars: () => autoBars
});
var impro = false;
var autoBars = true;
var padNotes = /* @__PURE__ */ new Map();
var CHORD_MS = 50;
var monoHeld = /* @__PURE__ */ new Set();
var monoAt = -Infinity;
function monoAccept(id) {
  const now = performance.now();
  if (monoHeld.size && now - monoAt < CHORD_MS) return false;
  monoHeld.add(id);
  monoAt = now;
  return true;
}
var pad = new Pad(padEl, {
  state: () => st,
  isImpro: () => impro,
  accept: (id) => monoAccept(id),
  onPitch: (p, id) => {
    const i = writeAndLocate((s) => writePitch(s, p)), t = st.song.tokens[i];
    padNotes.set(id, { index: i, base: t?.kind === "note" && t.pitch ? t.pitch : p });
  },
  onAlter: (id, alt) => {
    const n2 = padNotes.get(id);
    if (!n2) return;
    const np = alt ? alterBy(n2.base, alt) : n2.base;
    if (n2.index >= 0) update(setNote(st, n2.index, { pitch: np }));
    sound.down(np, id);
  },
  onCommand: (c) => update(apply(st, c, performance.now())),
  onUnit: (u) => update(setUnit(st, u)),
  onTuplet: (n2) => update(setTuplet(st, n2)),
  onInputKey: (f) => update(setInputKey(st, f)),
  onInputScale: (id) => update(setInputScale(st, id)),
  autoBars: () => autoBars,
  onAutoBars: (on) => {
    autoBars = on;
    view.render();
    pad.render();
    renderStatus();
  },
  onInsertMark: (kind) => {
    const at = st.sel ? st.sel.from : st.caret;
    const v = kind === "key" ? { kind, fifths: keyAt(st.song, at) } : kind === "time" ? { kind, ...timeAt(st.song, at) } : { kind, bpm: tempoAt(st.song, at) };
    const r = writeMark(st, v);
    update(r.st);
    view.marks.openAt(r.index, r.fresh);
  },
  onSoundDown: (p, id) => {
    const n2 = padNotes.get(id);
    if (n2 && n2.index >= 0) soundTok(st, n2.index, id);
    else {
      const r = soundingPitch(st, p);
      update(r.st);
      padNotes.set(id, { index: -1, base: r.pitch });
      sound.down(r.pitch, id);
    }
  },
  onSoundUp: (id) => {
    padNotes.delete(id);
    monoHeld.delete(id);
    sound.up(id);
  }
});
function toggleImpro() {
  impro = !impro;
  $("improBtn").classList.toggle("is-on", impro);
  if (impro) showPad(true);
  renderStatus();
  pad.render();
}
$("improBtn").addEventListener("click", () => toggleImpro());
function update(next2) {
  if (next2 === st) return;
  st = next2;
  view.render();
  pad.render();
  renderStatus();
  renderTitle();
}
var DUR_NAME = {
  [TPQ * 4]: "\u5168\u97F3\u7B26",
  [TPQ * 3]: "\u9644\u70B9\u4E8C\u5206",
  [TPQ * 2]: "\u4E8C\u5206",
  [TPQ * 1.5]: "\u9644\u70B9\u56DB\u5206",
  [TPQ]: "\u56DB\u5206",
  [TPQ * 0.75]: "\u9644\u70B9\u516B\u5206",
  [TPQ / 2]: "\u516B\u5206",
  [TPQ * 3 / 8]: "\u9644\u70B9\u5341\u516D\u5206",
  [TPQ / 4]: "\u5341\u516D\u5206",
  [TPQ / 8]: "\u4E09\u5341\u4E8C\u5206"
};
var UNIT_NAME2 = ["\u4E09\u5341\u4E8C\u5206", "\u5341\u516D\u5206", "\u516B\u5206", "\u56DB\u5206", "\u4E8C\u5206", "\u5168\u97F3\u7B26"];
var durName = (d2) => DUR_NAME[d2] ?? `${+(d2 / TPQ).toFixed(3)} \u62CD`;
function renderStatus() {
  const el = $("status"), off = view.layout?.shortBars ?? 0;
  const inp = st.input, next2 = `${UNIT_NAME2[inp.unit]}${inp.tuplet ? ` ${inp.tuplet} \u8FDE` : ""}${inp.acc ? ` ${inp.acc > 0 ? "\u266F" : "\u266D"}${inp.accMode === "lock" ? "\uFF08\u9501\uFF09" : ""}` : ""}`;
  let s = impro ? "\u5F39\uFF08\u53EA\u5531\u4E0D\u5199\uFF09" : st.sel ? `\u6539 \xB7 \u9009\u4E2D ${st.sel.to - st.sel.from} \u4E2A` : `\u5199\uFF08\u4E0B\u4E00\u4E2A\uFF1A${next2}\uFF09`;
  const i = st.sel ? st.sel.from : currentIndex(st);
  if (i >= 0 && (!st.sel || st.sel.to - st.sel.from === 1)) {
    const t = st.song.tokens[i];
    if (t.kind === "rest") s += ` \xB7 \u4F11\u6B62 \xB7 ${durName(t.dur)}`;
    else if (t.kind === "note") s += ` \xB7 ${t.pitch ? pitchName(t.pitch) : "\uFF08\u97F3\u9AD8\u7A7A\u7740\uFF09"} \xB7 ${durName(t.dur)}${t.tie ? " \xB7 \u8FDE\u7740\u524D\u4E00\u4E2A" : ""}${t.lyric ? ` \xB7 ${t.lyric === MELISMA_MARK ? "\u62D6\u8154" : t.lyric}` : ""}`;
    else if (t.kind === "key") s += ` \xB7 \u8C03\u53F7 1=${KEY_LABEL[t.fifths]}`;
    else if (t.kind === "time") s += ` \xB7 \u62CD\u53F7 ${t.beats}/${t.beatType}`;
    else if (t.kind === "tempo") s += ` \xB7 \u901F\u5EA6 ${tempoWord(t.bpm).it} \u2669=${t.bpm}`;
  } else if (st.song.tokens.length <= headLen(st.song.tokens)) s += " \xB7 \u6253 1\u20137 \u5199\u97F3\uFF0C\u70B9\u8C31\u4E0B\u9762\u5199\u6B4C\u8BCD\uFF0C\u70B9\u8C31\u5934\u6539\u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6";
  if (off) s += ` \xB7 ${off} \u4E2A\u5C0F\u8282\u62CD\u6570\u548C\u62CD\u53F7\u5BF9\u4E0D\u4E0A\uFF08\u53EA\u63D0\u793A\uFF09`;
  el.textContent = s;
}
var singer = new Singer();
var singing = false;
var singStatus = (s) => {
  $("singStatus").textContent = s;
};
function showError(text2) {
  document.getElementById("errNotice")?.remove();
  const el = document.createElement("div");
  el.id = "errNotice";
  el.className = "update-bar notice-err";
  el.innerHTML = `<span class="notice-text"></span><button class="btn" data-v="ok">\u77E5\u9053\u4E86</button>`;
  el.querySelector(".notice-text").textContent = text2;
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-v]")) el.remove();
  });
  document.body.append(el);
}
var playIcon = (stop) => {
  $("playBtn").innerHTML = `<svg class="ico"><use href="#${stop ? "stop" : "play"}"/></svg>`;
};
function songLang() {
  const ls = st.song.tokens.flatMap((t) => t.kind === "note" && t.lyric && t.lyric !== MELISMA_MARK ? [t.lyric] : []).join("");
  if (/[A-Za-z]/.test(ls) && !/[\p{Script=Han}぀-ヿ]/u.test(ls)) return "en";
  if (!ls && (st.song.hum === "la" || st.song.hum === "u")) return "zh";
  return /\p{Script=Han}/u.test(ls) && !/[぀-ヿ]/.test(ls) ? "zh" : "ja";
}
var humOpt = () => ({ humNasal: "N_m", humConsMin: 0.07 });
function lightNotes() {
  const notes = [];
  for (const { index, tok, t0, t1 } of timeline(st.song)) {
    if (tok.kind !== "note") continue;
    const midi = midiOf(effectivePitch(st.song.tokens, index)), last = notes[notes.length - 1];
    if (tok.tie && last && last.midi === midi) {
      last.t1 = t1;
      continue;
    }
    notes.push({ midi, t0, t1 });
  }
  return notes;
}
var lastFull = null;
async function singFull() {
  const score = toLabScore(st.song, songLang());
  if (!score.SCORE.length) return null;
  const opt = humOpt(), key = JSON.stringify([score, opt]);
  if (lastFull?.key === key) return lastFull.r;
  const r = await singer.sing(score, (stage) => singStatus(`${stage}\u2026`), { opt, models: modelBases() });
  lastFull = { key, r };
  return r;
}
function playLight(who = "\u8F7B\u91CF\u7248") {
  const notes = lightNotes();
  if (!notes.length) {
    singStatus("\u8FD8\u6CA1\u6709\u97F3");
    return;
  }
  if (!sampler.ready) {
    singStatus("\u8F7B\u91CF\u7248\u7684\u5143\u97F3\u8868\u8FD8\u5728\u4E0B\u8F7D\u2026");
    void sampler.load().then(() => playLight(who));
    return;
  }
  const total = sampler.playSong(notes, st.song.hum, () => playIcon(false));
  playIcon(true);
  singStatus(`${who}\u5531 ${total.toFixed(1)} \u79D2`);
}
async function togglePlay() {
  if (singer.playing || sampler.songPlaying) {
    singer.stop();
    sampler.stopSong();
    playIcon(false);
    singStatus("");
    return;
  }
  if (singing) return;
  singer.unlock();
  if (quality() === "none") {
    noCast("\u5531");
    return;
  }
  if (quality() === "light") {
    playLight();
    return;
  }
  singing = true;
  $("playBtn").classList.add("is-on");
  try {
    const cached = lastFull, r = await singFull();
    if (!r) {
      singStatus("\u8FD8\u6CA1\u6709\u97F3");
      return;
    }
    singStatus(r === cached?.r ? `\u5531 ${(r.samples.length / r.sr).toFixed(1)} \u79D2\uFF08\u8C31\u6CA1\u6539\uFF0C\u7528\u4E0A\u6B21\u5531\u597D\u7684\uFF09` : `\u5531 ${(r.samples.length / r.sr).toFixed(1)} \u79D2\uFF08\u51C6\u5907 ${(r.ms.load / 1e3).toFixed(1)} s\uFF0C\u5408\u6210 ${(r.ms.sing / 1e3).toFixed(1)} s\uFF09`);
    singer.play(r, () => {
      playIcon(false);
    });
    playIcon(true);
  } catch (e) {
    showError(`\u5B8C\u6574\u7248\u6708\u8BFB\u5531\u4E0D\u51FA\u6765\uFF1A${e.message}\u3002\u6CA1\u6709\u51FA\u58F0\u3002\u8981\u5148\u7528\u5143\u97F3\u7248\uFF0C\u5C31\u5728\u9876\u680F\u300C\u97F3\u8D28\u300D\u6362\u6210\u300C\u8F7B\u91CF\u300D\u518D\u64AD\u3002`);
    singStatus("\u6CA1\u6709\u51FA\u58F0\uFF08\u539F\u56E0\u89C1\u4E0A\u65B9\uFF09");
  } finally {
    singing = false;
    $("playBtn").classList.remove("is-on");
  }
}
$("playBtn").addEventListener("click", () => {
  void togglePlay();
});
var exporting = false;
async function exportSong() {
  if (exporting || singing) return;
  exporting = true;
  $("shareBtn").classList.add("is-on");
  try {
    let r = null, how = "";
    if (quality() === "none") {
      noCast("\u5BFC\u51FA");
      return;
    }
    if (quality() === "full") {
      try {
        r = await singFull();
        how = "\u6708\u8BFB";
      } catch (e) {
        showError(`\u5B8C\u6574\u7248\u6708\u8BFB\u5531\u4E0D\u51FA\u6765\uFF1A${e.message}\u3002\u6CA1\u6709\u5BFC\u51FA\u3002\u8981\u5148\u7528\u5143\u97F3\u7248\u5BFC\u51FA\uFF0C\u5C31\u5728\u9876\u680F\u300C\u97F3\u8D28\u300D\u6362\u6210\u300C\u8F7B\u91CF\u300D\u518D\u5BFC\u51FA\u3002`);
        singStatus("\u6CA1\u6709\u5BFC\u51FA\uFF08\u539F\u56E0\u89C1\u4E0A\u65B9\uFF09");
        return;
      }
    } else {
      const notes = lightNotes();
      if (notes.length) {
        r = await sampler.renderSong(notes, st.song.hum);
        how = "\u8F7B\u91CF\u7248";
      }
    }
    if (!r) {
      singStatus("\u8FD8\u6CA1\u6709\u97F3");
      return;
    }
    singStatus("\u7F16 mp3\u2026");
    const secs = r.samples.length / r.sr, bytes = await encodeMp3(r.samples, r.sr);
    const file = new File([bytes], `${docName()}.mp3`, { type: "audio/mpeg" });
    singStatus("");
    offerFile(file, "\u6B4C\u58F0\u5BFC\u51FA\u597D\u4E86", `${how}\u5531 ${secs.toFixed(1)} \u79D2 \xB7 mp3 ${file.size < 1e6 ? `${Math.round(file.size / 1e3)} KB` : `${(file.size / 1e6).toFixed(1)} MB`}`);
  } catch (e) {
    singStatus(`\u5BFC\u51FA\u5931\u8D25\uFF1A${e.message}`);
  } finally {
    exporting = false;
    $("shareBtn").classList.remove("is-on");
  }
}
var closeOffer = null;
var MODEL_SOURCE_DEFAULT = "https://fangzhangmnm.github.io/pwa-models";
var modelSource = MODEL_SOURCE_DEFAULT;
var modelBases = () => [.../* @__PURE__ */ new Set([new URL("pwa-models", location.href).href, modelSource.trim().replace(/\/+$/, "") || MODEL_SOURCE_DEFAULT])];
var packStore = createPackStore({ packs: PACKS });
var esc3 = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
async function packStatusText() {
  const st2 = await packStore.status(Object.keys(PACKS));
  return st2.map((s) => `${s.ready ? "\u2713" : "\xB7"} ${s.slug}\uFF08${(s.bytesTotal / 1e6).toFixed(1)} MB\uFF09`).join("\n");
}
function openSettings() {
  if (closeOffer) closeOffer();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">\u8BBE\u7F6E</div><label class="set-field">\u6A21\u578B\u6765\u6E90<input id="srcIn" type="url" spellcheck="false" autocomplete="off" value="${esc3(modelSource)}" /></label><div class="offer-msg">\u5148\u627E\u8FD9\u4E2A\u7F51\u7AD9\u4E0B\u7684 <code>pwa-models/</code>\uFF08\u81EA\u5DF1\u642D\u670D\u52A1\u5668\u7684\u8BDD\uFF0C\u628A\u6A21\u578B\u4ED3\u62F7\u8FC7\u53BB\u5C31\u80FD\u7528\uFF09\uFF0C\u627E\u4E0D\u5230\u518D\u7528\u8FD9\u91CC\u586B\u7684\u3002\u53EA\u5728\u8FD9\u6B21\u6253\u5F00\u91CC\u6709\u6548\u3002</div><div class="set-row"><button class="btn" data-v="default">\u6062\u590D\u9ED8\u8BA4</button><label class="btn" title="\u9009\u6A21\u578B\u5305\u7684\u5206\u7247\u6587\u4EF6\uFF08chunk-000 \u2026\uFF0C\u540D\u5B57\u4E0D\u91CD\u8981\uFF09\uFF0C\u6216\u6574\u4E2A\u5305\u62FC\u6210\u7684\u4E00\u4E2A\u6587\u4EF6"><svg class="ico"><use href="#import"/></svg>\u4ECE\u672C\u673A\u6587\u4EF6\u5BFC\u5165\u6A21\u578B\u5305<input id="impIn" type="file" multiple hidden /></label></div><pre id="packSt" class="set-packs">\u2026</pre><details class="set-credit"><summary>\u6708\u8BFB\uFF08\u3064\u304F\u3088\u307F\u3061\u3083\u3093\uFF09\u7684\u7F72\u540D\u4E0E\u4F7F\u7528\u6761\u6B3E</summary><pre>${esc3(CREDIT.credit)}

${esc3(CREDIT.terms)}
${esc3(CREDIT.termsUrl)}

${esc3(CREDIT.attribution.join("\n"))}</pre></details><div class="set-row set-app"><span class="set-ver">${APP_VERSION}</span><button class="btn" data-v="check">\u68C0\u67E5\u66F4\u65B0</button><button class="btn" data-v="reset" title="\u5361\u5728\u65E7\u7248\u672C\u65F6\u7528\uFF1A\u6CE8\u9500\u672C app \u7684\u79BB\u7EBF\u7F13\u5B58\u518D\u91CD\u5F00\u3002\u4E0B\u597D\u7684\u6708\u8BFB\u6A21\u578B\u5305\u4E0D\u5220">\u6E05\u7F13\u5B58\u91CD\u542F</button></div><div class="offer-btns"><button class="btn primary" data-v="close">\u597D</button></div></div>`;
  document.body.append(box);
  const srcIn = box.querySelector("#srcIn"), packSt = box.querySelector("#packSt");
  const refresh = () => {
    void packStatusText().then((t) => packSt.textContent = t);
  };
  refresh();
  const close = () => {
    modelSource = srcIn.value.trim() || MODEL_SOURCE_DEFAULT;
    box.remove();
    closeOffer = null;
    scoreEl.focus();
  };
  closeOffer = close;
  box.addEventListener("click", (e) => {
    const v = e.target.closest("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") close();
    else if (v === "default") srcIn.value = MODEL_SOURCE_DEFAULT;
    else if (v === "check") void shell.checkForUpdate().then((r) => {
      if (r === "found") {
        close();
        showUpdateBar();
      } else singStatus(r === "latest" ? "\u5DF2\u7ECF\u662F\u6700\u65B0\u7248" : "\u8FD9\u91CC\u6CA1\u6709\u79BB\u7EBF\u58F3\uFF08\u672C\u673A\u5F00\u53D1 / \u6D4F\u89C8\u5668\u4E0D\u652F\u6301\uFF09\uFF0C\u4E0D\u7528\u66F4\u65B0");
    });
    else if (v === "reset") void shell.forceReset();
  });
  box.querySelector("#impIn").addEventListener("change", async (e) => {
    const files = [...e.target.files ?? []];
    if (!files.length) return;
    packSt.textContent = "\u5BFC\u5165\u4E2D\u2026";
    try {
      await packStore.importFiles(Object.keys(PACKS), files, (p) => packSt.textContent = `\u5BFC\u5165\u4E2D\u2026 ${Math.floor(p.done / p.total * 100)}%`);
    } catch (err2) {
      singStatus(`\u5BFC\u5165\u6CA1\u6210\uFF1A${err2.message === "no-matching-file" ? "\u8FD9\u4E9B\u6587\u4EF6\u4E0D\u662F\u6708\u8BFB\u8981\u7684\u6A21\u578B\u5305\u5206\u7247" : err2.message}`);
    }
    refresh();
  });
}
$("setBtn").addEventListener("click", () => openSettings());
function offerFile(file, title, msg, onDone) {
  const nav = navigator;
  const canShare = typeof navigator.share === "function" && !!nav.canShare?.({ files: [file] });
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card"><div class="offer-title">${title}</div><div class="offer-msg">${msg}</div><div class="offer-btns">` + (canShare ? `<button class="btn primary" data-v="share">\u5206\u4EAB</button>` : "") + `<button class="btn${canShare ? "" : " primary"}" data-v="download">\u4E0B\u8F7D</button><button class="btn" data-v="close">\u5173</button></div></div>`;
  document.body.append(box);
  const close = () => {
    box.remove();
    closeOffer = null;
    scoreEl.focus();
  };
  closeOffer = close;
  box.addEventListener("click", async (e) => {
    const v = e.target.closest("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") {
      close();
      return;
    }
    if (v === "download") {
      const a = document.createElement("a"), url = URL.createObjectURL(file);
      a.href = url;
      a.download = file.name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3e4);
      singStatus(`\u5DF2\u4E0B\u8F7D ${file.name}`);
      onDone?.();
      close();
    } else if (v === "share") {
      try {
        await navigator.share({ files: [file], title: file.name });
        singStatus("\u5DF2\u5206\u4EAB");
        onDone?.();
        close();
      } catch (err2) {
        if (err2.name !== "AbortError") singStatus(`\u5206\u4EAB\u5931\u8D25\uFF1A${err2.message}`);
      }
    }
  });
}
$("shareBtn").addEventListener("click", () => {
  void exportSong();
});
window.__moonsinger = { singer, sampler, exportSong, labScore: () => toLabScore(st.song, songLang()), state: () => st, cssHash: "a26121ba07fd" };
$("humSel").value = st.song.hum;
$("humSel").addEventListener("change", (e) => {
  update(setHum(st, e.target.value));
  scoreEl.focus();
});
$("padBtn").addEventListener("click", () => showPad(padEl.hidden));
function stacked() {
  return matchMedia("(max-aspect-ratio: 1/1)").matches;
}
function showPad(on) {
  if (padEl.hidden === !on) return;
  padEl.hidden = !on;
  $("padBtn").classList.toggle("is-on", on);
  if (!on) pad.clearHeld();
  view.render();
}
bar.addEventListener("pointerdown", (e) => {
  if (stacked() && !e.target.closest("button, select, label, input, a")) showPad(false);
});
function quality() {
  return $("qualSel").value;
}
var dirty = () => st.song !== doc.saved.song || quality() !== doc.saved.quality;
function renderTitle() {
  const d2 = dirty(), name = docName();
  $("docTitle").textContent = `${name}${d2 ? " \u2022" : ""}`;
  $("docTitle").title = d2 ? "\u6539\u8FC7\u8FD8\u6CA1\u5B58" : doc.handle ? `\u5B58\u5728 ${doc.handle.name}` : "";
  document.title = `${d2 ? "\u2022 " : ""}${name} \xB7 MoonSinger`;
}
function noCast(what) {
  showError(`\u4E3B\u5531\u8FD9\u4E2A\u89D2\u8272\u8FD8\u6CA1\u6709\u4EBA\u4E0A\u573A\uFF08\u539F\u6765\u7684\u4E50\u5668\u8FD9\u4E00\u7248\u6CA1\u6709\uFF09\uFF0C\u6240\u4EE5\u6CA1\u6709${what}\u3002\u8981\u6708\u8BFB\u6765\u5531\uFF0C\u5728\u9876\u680F\u300C\u97F3\u8D28\u300D\u9009\u300C\u5B8C\u6574\u300D\u6216\u300C\u8F7B\u91CF\u300D\u3002`);
  singStatus(`\u6CA1\u6709${what}\uFF08\u539F\u56E0\u89C1\u4E0A\u65B9\uFF09`);
}
function setQuality(q) {
  const sel = $("qualSel");
  let none = sel.querySelector('option[value="none"]');
  if (q === "none" && !none) {
    none = document.createElement("option");
    none.value = "none";
    none.textContent = "\u672A\u9009\u89D2";
    sel.prepend(none);
  }
  if (q !== "none") none?.remove();
  sel.value = q;
}
function loadDoc(song, o) {
  if (impro) toggleImpro();
  setQuality(o.quality);
  $("humSel").value = song.hum;
  doc.stem = o.stem;
  doc.handle = o.handle;
  doc.extras = o.extras;
  st = { ...initState(song), input: { ...initState(song).input, inputFifths: st.input.inputFifths, inputScale: st.input.inputScale } };
  doc.saved = { song: st.song, quality: o.quality };
  lastFull = null;
  view.render();
  pad.render();
  renderStatus();
  renderTitle();
}
function markSaved() {
  doc.saved = { song: st.song, quality: quality() };
  renderTitle();
}
function confirmDiscard(what) {
  if (!dirty()) return Promise.resolve(true);
  return new Promise((resolve) => {
    closeOffer?.();
    const box = document.createElement("div");
    box.className = "offer";
    box.innerHTML = `<div class="offer-card"><div class="offer-title">\u300C${esc3(docName())}\u300D\u6539\u8FC7\u8FD8\u6CA1\u5B58</div><div class="offer-msg">${what}\u4F1A\u4E22\u6389\u8FD9\u4E9B\u6539\u52A8\u3002</div><div class="offer-btns"><button class="btn" data-v="save">\u5148\u5B58</button><button class="btn" data-v="go">\u4E22\u6389\uFF0C\u7EE7\u7EED</button><button class="btn primary" data-v="no">\u7B97\u4E86</button></div></div>`;
    document.body.append(box);
    const close = (ok) => {
      box.remove();
      closeOffer = null;
      resolve(ok);
    };
    closeOffer = () => close(false);
    box.addEventListener("click", (e) => {
      const v = e.target.closest("[data-v]")?.dataset.v;
      if (e.target === box || v === "no") close(false);
      else if (v === "go") close(true);
      else if (v === "save") {
        close(false);
        void fileSave(false);
      }
    });
  });
}
async function fileNew() {
  if (!await confirmDiscard("\u65B0\u5EFA")) return;
  loadDoc(initState().song, { stem: defaultStem(), quality: "full", extras: emptyExtras(), handle: null });
  singStatus("\u65B0\u7684\u4E00\u9996");
}
async function fileOpen() {
  if (!await confirmDiscard("\u6253\u5F00\u522B\u7684\u6B4C")) return;
  let picked;
  try {
    picked = await pickOpen();
  } catch (e) {
    showError(`\u6CA1\u6253\u5F00\uFF1A${e.message}`);
    return;
  }
  if (!picked) return;
  try {
    const o = openBytes(picked.name, picked.bytes);
    loadDoc(o.song, { stem: o.stem, quality: o.quality, extras: o.extras, handle: o.ours && !o.notices.length ? picked.handle : null });
    if (o.notices.length) showError(o.notices.join(" "));
    singStatus(`\u6253\u5F00\u4E86 ${picked.name}`);
  } catch (e) {
    showError(`\u6253\u4E0D\u5F00 ${picked.name}\uFF1A${e.message}`);
  }
}
var bytesNow = () => saveMxl({ song: st.song, hum: st.song.hum, quality: quality(), extras: doc.extras, app: APP_VERSION, date: (/* @__PURE__ */ new Date()).toISOString() });
async function fileSave(asNew) {
  try {
    if (!asNew && doc.handle) {
      await writeTo(doc.handle, bytesNow());
      markSaved();
      singStatus(`\u5B58\u597D\u4E86\uFF1A${doc.handle.name}`);
      return;
    }
    if (canPickSave()) {
      const h = await pickSave(`${docName()}.mxl`);
      if (!h) return;
      doc.stem = h.name.replace(/\.(mxl|musicxml|xml)$/i, "") || doc.stem;
      await writeTo(h, bytesNow());
      doc.handle = h;
      markSaved();
      singStatus(`\u5B58\u597D\u4E86\uFF1A${h.name}`);
      return;
    }
    const file = new File([bytesNow()], `${docName()}.mxl`, { type: "application/vnd.recordare.musicxml" });
    offerFile(file, "\u5B58\u6210 .mxl", `${esc3(file.name)} \xB7 ${file.size < 1e6 ? `${Math.max(1, Math.round(file.size / 1e3))} KB` : `${(file.size / 1e6).toFixed(1)} MB`}\u3002\u4E0B\u8F7D\u6216\u5206\u4EAB\u5230\u300C\u6587\u4EF6\u300D\u91CC\uFF1B\u4EE5\u540E\u4ECE\u6587\u4EF6\u83DC\u5355\u300C\u6253\u5F00\u300D\u3002`, markSaved);
  } catch (e) {
    showError(`\u6CA1\u5B58\u4E0A\uFF1A${e.message}`);
  }
}
function openFileMenu() {
  closeOffer?.();
  const box = document.createElement("div");
  box.className = "offer";
  box.innerHTML = `<div class="offer-card settings-card"><div class="offer-title">\u6587\u4EF6</div><div class="offer-msg">\u6587\u4EF6\u540D\uFF1A<b>${esc3(doc.handle ? doc.handle.name : `${docName()}.mxl`)}</b>\uFF08\u586B\u4E86\u6B4C\u540D\u5C31\u7528\u6B4C\u540D\uFF1B\u6B4C\u540D\u5728\u7EB8\u9762\u6700\u4E0A\u9762\u70B9\u7740\u586B\uFF0C\u53EF\u4E0D\u586B\uFF09</div><div class="set-row file-row"><button class="btn" data-v="new"><svg class="ico"><use href="#new"/></svg>\u65B0\u5EFA</button><button class="btn" data-v="open"><svg class="ico"><use href="#folder-open"/></svg>\u6253\u5F00\u2026</button><button class="btn" data-v="save"><svg class="ico"><use href="#floppy-disk"/></svg>\u5B58</button><button class="btn" data-v="saveAs"><svg class="ico"><use href="#save-as"/></svg>\u53E6\u5B58\u4E3A\u2026</button></div><div class="offer-msg">\u5B58\u6210 <code>.mxl</code>\uFF08MusicXML \u4E50\u8C31\u7684\u538B\u7F29\u5305\uFF1A\u522B\u7684\u4E50\u8C31\u8F6F\u4EF6\u4E5F\u80FD\u6253\u5F00\uFF1BMoonSinger \u81EA\u5DF1\u7684\u4E1C\u897F\u653E\u5728\u91CC\u9762\u7684 <code>.moonsinger/</code>\uFF09\u3002${doc.handle ? `\u73B0\u5728\u5B58\u5728 ${esc3(doc.handle.name)}\uFF0C\u300C\u5B58\u300D= \u5B58\u56DE\u53BB\u3002` : canPickSave() ? "" : "\u8FD9\u53F0\u8BBE\u5907\u4E0A\u300C\u5B58\u300D= \u4E0B\u8F7D\u6216\u5206\u4EAB\u4E00\u4E2A .mxl \u5230\u300C\u6587\u4EF6\u300D\u91CC\u3002"}</div><div class="offer-btns"><button class="btn primary" data-v="close">\u597D</button></div></div>`;
  document.body.append(box);
  const close = () => {
    box.remove();
    closeOffer = null;
    scoreEl.focus();
  };
  closeOffer = close;
  box.addEventListener("click", (e) => {
    const v = e.target.closest("[data-v]")?.dataset.v;
    if (e.target === box || v === "close") {
      close();
      return;
    }
    if (!v) return;
    close();
    if (v === "new") void fileNew();
    else if (v === "open") void fileOpen();
    else if (v === "save") void fileSave(false);
    else if (v === "saveAs") void fileSave(true);
  });
}
$("fileBtn").addEventListener("click", () => openFileMenu());
$("qualSel").addEventListener("change", () => {
  if (quality() !== "none") setQuality(quality());
  renderTitle();
});
window.addEventListener("beforeunload", (e) => {
  if (dirty()) {
    e.preventDefault();
    e.returnValue = "";
  }
});
function whereNow() {
  if (closeOffer) return "sheet";
  if (view.marks.open) return "mark";
  if (view.lyrics.open) return "lyric";
  return impro ? "impro" : st.sel ? "edit" : "write";
}
function run(a, repeat, code) {
  switch (a.k) {
    case "cmd":
      if (a.cmd.k === "degree") {
        if (!repeat && monoAccept(`key${code}`)) {
          const c = a.cmd, i = writeAndLocate((s) => apply(s, c, performance.now()));
          keyTok(st, i, code);
        }
        return true;
      }
      update(apply(st, a.cmd, performance.now()));
      return true;
    case "audition": {
      if (repeat) return true;
      const probe = apply({ ...st, sel: null, log: [] }, { k: "degree", degree: a.degree, dir: a.dir }, performance.now());
      keyTok(probe, probe.caret - 1, code);
      if (probe.input !== st.input) update({ ...st, input: probe.input });
      return true;
    }
    case "play":
      void togglePlay();
      return true;
    case "impro":
      toggleImpro();
      return true;
    case "lyric":
      return view.lyrics.act(a.a);
    case "mark":
      view.marks.act(a.a);
      return true;
    case "sheet":
      closeOffer?.();
      return true;
    case "file":
      if (a.a === "open") void fileOpen();
      else void fileSave(a.a === "saveAs");
      return true;
  }
}
window.addEventListener("keydown", (e) => {
  const t = e.target;
  if (!(e.ctrlKey || e.metaKey) && t && (t.tagName === "SELECT" || t.tagName === "TEXTAREA" || t.tagName === "INPUT" && !t.closest(".lyric-input, .mark-ed"))) return;
  const a = route(e, whereNow(), st.sel ? "edit" : "write");
  if (a && run(a, e.repeat, e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  monoHeld.delete(`key${e.code}`);
  if (isSoundKey(e)) {
    sound.up(`key${e.code}`);
    pad.showUp(`key${e.code}`);
  }
});
window.addEventListener("blur", () => {
  sampler.upAll();
  pad.clearHeld();
  monoHeld.clear();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    sampler.upAll();
    pad.clearHeld();
    monoHeld.clear();
  }
});
await document.fonts.load(`40px Bravura`).catch(() => void 0);
view.render();
pad.render();
renderStatus();
renderTitle();
scoreEl.focus();
setTimeout(() => {
  void sampler.load().catch((e) => singStatus(`\u8BD5\u542C\u5143\u97F3\u8868\u6CA1\u4E0B\u8F7D\u4E0B\u6765\uFF1A${e.message}`));
}, 300);
//# sourceMappingURL=moonsinger-9fa81ef110db.mjs.map
