// sing-core.mjs —— 月读唱法核心：乐谱 → 歌声（Float32Array，22050 Hz）。Node（Lab 命令行）与浏览器（编辑器 worker）共用这一份。
// extracted 2026-10-06 by Claude Opus 5.5 from MoonSinger Lab/20261005 月读第一首/sing.mjs @ e2dfb26（冻结点；原作 Claude Opus 5.5 2026-10-05 +
//   Claude Fable 5.1 2026-10-06 图谱 / 断气 / 断句）。抽取方式 = 按行号原样切出、只做机械替换，浮点运算顺序一行未动：
//   piper / WORLD / 图谱数据由宿主递进来（不碰 node:*）；console.log → log；DIAG2 诊断留在 Lab 命令行壳。
// user 规矩：「之后我们不要python测了。免得你两边写的不一样」——调唱法改这一份，Lab 命令行和编辑器同时生效。
// 算法说明（第 1–6 步、各旋钮的来历）见 Lab/20261005 月读第一首/sing.mjs 头注释与 README。
//
// 输入（都是普通对象，宿主负责加载）：
//   score   每个唱出来的音节一条 { kana, notes: [[midi, 八分音符数]…], rest?, before?: "^"|"v"|"O", moras? }（Lab score.mjs 格式）
//   text    喂给 piper 注音的整句（标点处 = 休止；注音前去掉标点；音节数必须等于 score 条数）
//   tempo   每分钟四分音符数；lang "ja" | "zh"；transpose 半音
//   piper   { SR, HOP, phonemize(text), phonemizeZh(text), encode(tokens, prosody), run(ids, pros, opts) → { audio, durations } }（session 已绑定）
//   world   { analyze(x, fs, opts), synth({ f0, sp, ap, fft, fs, framePeriod }) }（WORLD WASM，Lab world.mjs 的接口）
//   atlas   "off" | "normal" | "strong" | "soft" | "deep" | "bright"；loadAtlas(id) → { ...meta, data: Float32Array }（id = B3 Ds4 G4 B4 strong …）
//   mix 0..1、breath 布尔、phrasing "score" | "punct" | "none"、preset（模型的 preset 输入）、opt（覆盖 DEFAULT_OPT 的部分键）、log(s)
// 输出：{ sung（归一化 + 尾巴，可直接播 / 写文件）, y（WORLD 原样输出）, x（piper 念的原料）, SR, finish, internals（Lab 的测量 / 诊断用） }

export const DEFAULT_OPT = {
  leadIn: 0.5,            // s before the first sung vowel (the first consonant comes out of it)
  tail: 0.6,              // s of silence after the last note
  consonantCap: 0.5,      // a consonant may take at most this share of the previous note when no rest precedes it
  vowelFrames: [8, 16],   // piper frames (11.6 ms) for vowel + its blank: 2 × the model's own length, clamped to this range
  attack: 0.06,           // s of the vowel start copied 1:1 before stretching
  release: 0.08,          // s of fade-out at the end of a note before a rest / at the end
  holdDb: 6,              // the held stretch = clean frames (see breath) within this many dB of the vowel's loudest clean frame
  vowelLag: 0.02,         // s: fallback only — the sung vowel starts where piper's vowel turns clean (periodic), within its first half
  cleanMax: 0.4,          // a vowel whose own cleanest frames are noisier than this (whispered: なかよし's し, つく's つ) is replaced by a
                          // clean sample of the same vowel elsewhere in the song — envelope AND noise profile (take 5 borrowed only the noise
                          // profile: a whisper's envelope sung voiced = buzz) — sung vowels are never devoiced (user「常识唱歌的时候这种音会唱成什么」)
  // knobs from the table (ai-docs/20261005-moonsinger-upheaval.md §8), take 4 — user 2026-10-05「突然气球漏气变成气音」「有些音突然很轻」:
  breath: 0,              // 实声/气息: 0 = every vowel frame as clean (periodic) as that vowel's cleanest frames; 1 = piper's own breathiness
  level: 0.8,             // 音量: pull each syllable's loudness this far toward the song's median (0 = speech's own loud/soft pattern)
  levelMaxDb: 6,          // take 5 allowed 12 and boosted the consonants too: user「一堆麦克风的电噪声……有时候还有电锯声」
  tailIntoNext: 0.04,     // s at most of the vowel's tail copied 1:1 into the next consonant
  portamentoMs: 40,       // width of the pitch glide between two notes
  // 哼的字（score 条目带 hum: true = 没写歌词、唱这首歌「哼的字」的音；MoonSinger 编辑器给）。2026-10-07 (Claude Opus 5.5)，
  //   user「全歌唱的时候也是都听的像啊」：「んんん」全被注成舌根 N_uvular（嘴张着 ≈ 鼻化的 a）；「ららら」的弹舌只有 20–70 ms，夹在两个 a 中间。默认关 = 原样。
  humNasal: null,         // 哼「ん」改用哪个 N（"N_m" = 双唇，闭嘴哼）；null = 照注音
  humConsMin: 0,          // s：哼的字的辅音在歌的时钟上至少这么长（ら 的弹舌拉开）；0 = 照 piper
  vibrato: { cents: 15, hz: 5.5, delay: 0.25, fadeIn: 0.2, minNote: 0.5 },   // only on notes ≥ minNote s
  noiseScale: 0.667, noiseW: 0.5,                                              // the read-aloud library's defaults
  atlasXfade: 0.04,       // s: crossfade piper → atlas at the start of the held stretch; atlas → piper happens across the tail segment (not inside the hold)
  atlasGainClamp: 12,     // dB: the level match atlas → piper's held level is clamped to ±this (take 1 had −17 dB on 着: a quiet speech vowel pulling a sung frame way down)
  atlasExprLevel: 1,      // 0..1: how much of the expression set's own loudness difference (強 / 弱 / 深 / 明 vs the normal set at that pitch) is kept (take 1 = 0: 強 sounded like normal)
  atlasTiltHz: 3000,      // breath: bins above this are attenuated (an inhale has little energy up there)
  breathDb: -28,          // breath loudness relative to the coming vowel's held level
  lift: 0.06,             // s: ^ = silence before the syllable (stolen from the previous note), no inhale   (v3 had 0.09: user「吃了很多音长」)
  gap: { v: { share: 0.25, max: 0.16, db: 0 },   // v: an inhale: at most this share of the previous note / this long, at breathDb   (v3: 0.4 / 0.28)
         O: { share: 0.35, max: 0.24, db: 4 } }, // O: 大口: longer and this many dB louder   (v3: 0.5 / 0.42 / +6)
  breathMinRest: 1,       // in eighths: only rests at least this long get an inhale (shorter = no time to breathe)
};

import { wordsOf, alignEnglish } from "./en-front.mjs";   // 英文：音节拼回单词、元音核心对齐（2026-10-07 Claude Opus 5.5）
const VOWEL = new Set(["a", "i", "u", "e", "o", "N"])   /* cl (っ) is not a sung syllable: it joins the next consonant */, VOICED_FOR = { A: "a", I: "i", U: "u", E: "e", O: "o" };
const isMark = (t) => "[]#?!".includes(t) || /^tone\d$/.test(t);   // zh: the tone token after each final is a one-frame mark

// only = 只唱第 entry 个字（2026-10-10 Claude Fable 5.1，实时试听刀 3：按键试听 = 念好的那句里光标那个字按下的音高唱 secs 秒；user「可以争取一下实时」）：
//   整句照常念（piper 两遍 + 分析——念缓存命中时几毫秒）、照常算断句 / 辅音 / 稳态，只把这个字的音换成按下的、长度换成 secs，
//   然后只重建、只合成它自己那几帧（辅音起、到它的末尾）。不走 only 的那条路一行不动（冻结样本不变）。
export async function singCore({ score: SCORE_IN, text: TEXT, tempo: TEMPO_QUARTER, lang: LANG = "ja", transpose: TRANSPOSE = 0, phrasing: PHRASING = "score",
  atlas: ATLAS = "off", mix: MIX = 1, breath: BREATH = false, preset: PRESET = 0, piper: pn, world: W, loadAtlas = null, opt = {}, log = () => {}, only = null }) {
  const OPT = { ...DEFAULT_OPT, ...opt };
  if (ATLAS !== "off" && !loadAtlas) throw new Error(`atlas=${ATLAS} needs loadAtlas`);
  // English (2026-10-07, Claude Opus 5.5; user「好吧英文先做完」): the score has one entry per WRITTEN syllable (hyph = the word goes on);
  //   the engine glues the words back, looks them up and gives every vowel nucleus its own entry (en-front.mjs). ja / zh untouched.
  let EN = null, leadRest = 0, SRC = SCORE_IN;
  if (LANG === "en") { EN = pn.phonemizeEnWords(wordsOf(SCORE_IN)); ({ entries: SRC, leadRest } = alignEnglish(SCORE_IN, EN.nuclei)); }
  // an entry sung on several kana (しい) becomes one entry per kana sharing its single note evenly
  const EIGHTH0 = 60 / TEMPO_QUARTER / 2;
  if (only) SRC = SRC.map((e, k) => (k === only.entry ? { ...e, notes: [[only.midi - TRANSPOSE, Math.max(0.25, only.secs / EIGHTH0)]], rest: 0 } : e));   // 这个字：按下的音高、唱 secs 秒
  const SCORE = SRC.map((e) => ({ ...e, notes: e.notes.map(([m, l]) => [m + TRANSPOSE, l]) })).flatMap((e) => { const n = e.moras || 1; if (n === 1) return [e]; if (e.notes.length !== 1) throw new Error(`${e.kana}: moras > 1 needs one note`);
    const [midi, len] = e.notes[0]; return Array.from({ length: n }, (_, i) => ({ kana: [...e.kana][i] ?? e.kana, notes: [[midi, len / n]], rest: i === n - 1 ? e.rest : 0, before: i === 0 ? e.before : undefined })); });
  const SR = pn.SR, HOP = pn.HOP, FR = SR / HOP, EIGHTH = 60 / TEMPO_QUARTER / 2, FP = 5, FPS = FP / 1000;

  // ---- 1. tokens -> moras -------------------------------------------------------------------------------------------------
  const sungText = TEXT.replace(/[、。，．,.！？!?]/g, "");       // rests are made on the song clock, not as speech pauses
  const ph = LANG === "en" ? EN : LANG === "zh" ? pn.phonemizeZh(sungText) : pn.phonemize(sungText);
  const tokens = LANG === "ja" ? ph.tokens.map((t) => VOICED_FOR[t] ?? t) : ph.tokens;
  if (OPT.humNasal && LANG === "ja") {                           // 哼的「ん」：第 k 个唱的音素属于 SCORE[k]（同下面的 sung1 规则）
    let k = 0; tokens.forEach((t, i) => { if (!(VOWEL.has(t) || /^N/.test(t))) return; if (SCORE[k]?.hum && /^N/.test(t)) tokens[i] = OPT.humNasal; k++; });
  }
  const { ids, pros } = LANG === "ja" ? pn.encode(tokens, ph.prosody) : ph;
  const RUN = { lang: LANG, preset: PRESET };
  const owner = []; let p = 2;                                   // ids: ^ pad (tok pad)* … $ ; a pause "_" is a single pad id
  for (const t of tokens) { owner.push(t === "_" ? [p] : [p, p + 1]); p += t === "_" ? 1 : 2; }
  if (p !== ids.length - 1) throw new Error(`id layout: expected EOS at ${p}, have ${ids.length - 1}`);
  const moras = []; let gap = [];                                 // gap = token indices between two vowels (marks, pauses, consonants)
  const sung1 = LANG === "zh" ? (t, i) => /^tone\d$/.test(tokens[i + 1] ?? "")   // zh: the final (the token before its tone mark) is the sung part
    : LANG === "en" ? (t, i) => EN.sung[i]                          // en: the first char of each vowel nucleus (en-front.mjs nucleusStarts)
    : (t) => VOWEL.has(t) || /^N/.test(t);                          // ja: vowels and ん (N_n / N_m / N_ng … by place of articulation)
  tokens.forEach((t, i) => { if (sung1(t, i)) { moras.push({ gap, vowel: i }); gap = []; } else gap.push(i); });
  const trailing = gap;
  if (moras.length !== SCORE.length) throw new Error(`${moras.length} sung syllables in the text, ${SCORE.length} in the score\n text: ${moras.map((m) => tokens.slice(m.gap.length ? m.gap[0] : m.vowel, m.vowel + 1).filter((t) => !"[]#?!_".includes(t)).join("")).join(" ")}`);
  moras.forEach((m, k) => {
    m.kana = SCORE[k].kana; m.mark = SCORE[k].before ?? null; if (m.mark && !"^vO".includes(m.mark)) throw new Error(`${m.kana}: before must be ^ v or O`); m.label = [...m.gap.filter((i) => !isMark(tokens[i]) && tokens[i] !== "_").map((i) => tokens[i]), tokens[m.vowel]].join("");
    const lastPause = m.gap.lastIndexOf(m.gap.findLast?.((i) => tokens[i] === "_") ?? -1);
    m.pause = lastPause >= 0 ? m.gap[lastPause] : null;
    m.cons = m.gap.slice(lastPause + 1);                          // marks + consonants after the last pause: sung on the way into the beat
    m.before = lastPause >= 0 ? m.gap.slice(0, lastPause + 1) : []; // marks + pause before that: belong to the rest
  });
  if (LANG === "en") moras.forEach((m, k) => {                   // en: a word's final consonants (and a diphthong's glide / length mark) stay at the end of
    const w = EN.wordOf[m.vowel], next = moras[k + 1];            //   their own note when a rest or the song end follows — not after the rest with the next word
    if (!next) { m.coda = trailing.filter((i) => !isMark(tokens[i])); return; }
    if (!(SCORE[k].rest > 0)) return;
    m.coda = next.cons.filter((i) => EN.wordOf[i] === w); next.cons = next.cons.filter((i) => EN.wordOf[i] !== w);
  });
  if (PHRASING !== "score") {                                    // --phrasing=punct: breathe where the lyric's own 、。 are (っ has no note; it is skipped on the walk)
    if (PHRASING !== "punct" && PHRASING !== "none") throw new Error(`--phrasing=${PHRASING}: unknown (score|punct|none)`);
    let ti = 0; moras.forEach((m, k) => { let punct = false;
      for (const ch of [...SCORE[k].kana]) { while (ti < TEXT.length && "っ、。，".includes(TEXT[ti])) { if (TEXT[ti] !== "っ") punct = true; ti++; } if (TEXT[ti] === ch) ti++; }
      m.mark = PHRASING === "punct" && punct && k > 0 ? "v" : null; });
  }

  // ---- 2. piper's take: compact, near-natural timing ------------------------------------------------------------------------
  const pred = (await pn.run(ids, pros, { noiseScale: 0, noiseW: 0, ...RUN })).durations;
  const frames = new Float32Array(ids.length).fill(1);
  frames[0] = 10;                                                 // ^ : lead-in material for the first consonant
  for (const m of moras) {
    for (const i of m.cons) if (!isMark(tokens[i])) owner[i].forEach((j) => (frames[j] = Math.max(1, Math.round(pred[j]))));
    for (const i of m.coda ?? []) if (!isMark(tokens[i])) owner[i].forEach((j) => (frames[j] = Math.max(1, Math.round(pred[j]))));
    if (m.pause !== null) frames[owner[m.pause][0]] = 10;
    const [a, b] = owner[m.vowel], tot = Math.min(OPT.vowelFrames[1], Math.max(OPT.vowelFrames[0], Math.round(2 * (pred[a] + pred[b]))));
    frames[a] = Math.max(1, Math.round(tot * pred[a] / (pred[a] + pred[b]))); frames[b] = Math.max(1, tot - frames[a]);
  }
  frames[ids.length - 1] = 8;
  const cum = [0]; for (const v of frames) cum.push(cum[cum.length - 1] + v);
  const sec = (idIndex) => cum[idIndex] / FR;                     // compact time where id starts
  let t0 = performance.now();
  const said = await pn.run(ids, pros, { noiseScale: OPT.noiseScale, noiseW: OPT.noiseW, override: Array.from(frames), ...RUN });
  const piperMs = performance.now() - t0;
  if (said.audio.length !== cum[cum.length - 1] * HOP) throw new Error(`audio ${said.audio.length} samples, timeline ${cum[cum.length - 1] * HOP}`);
  const x = said.audio;
  for (const m of moras) {                                        // compact spans
    m.c0 = m.cons.length ? sec(owner[m.cons[0]][0]) : sec(owner[m.vowel][0]);
    m.v0 = sec(owner[m.vowel][0]); m.v1 = sec(owner[m.vowel][1] + 1);   // nominal; the onset is moved to where the voice starts below
    if (m.coda?.length) m.codaC1 = sec(owner[m.coda[m.coda.length - 1]][1] + 1);
  }

  // ---- 3. the score's clock ---------------------------------------------------------------------------------------------
  t0 = performance.now();
  const an = W.analyze(x, SR, { framePeriod: FP, f0Floor: 80, f0Ceil: 1000 }), bins = an.bins;
  const energy = (f) => { let e = 0; for (let q = 0; q < bins; q++) e += an.sp[f * bins + q]; return 10 * Math.log10(e + 1e-30); };
  const BAND = [Math.round(500 / SR * an.fft), Math.round(4000 / SR * an.fft)];
  const noisiness = (f) => { let s = 0; for (let q = BAND[0]; q < BAND[1]; q++) s += an.ap[f * bins + q]; return s / (BAND[1] - BAND[0]); };
  for (const m of moras) {                                        // sung vowel onset = first clean frame in the vowel's first half
    const a0 = Math.ceil(m.v0 / FPS), mid = Math.floor((m.v0 + m.v1) / 2 / FPS); let on = -1;
    for (let f = a0; f <= mid; f++) if (noisiness(f) <= OPT.cleanMax) { on = f; break; }
    m.v0 = on >= 0 ? on * FPS : Math.min(m.v0 + OPT.vowelLag, (m.v0 + m.v1) / 2);
  }
  for (const m of moras) {                                        // loudest stretch among the clean frames of each vowel in piper's take
    const f0i = Math.ceil(m.v0 / FPS), f1i = Math.max(f0i + 1, Math.floor(m.v1 / FPS)), fr = [];
    for (let f = f0i; f < f1i; f++) fr.push(f);
    const cleanest = Math.min(...fr.map(noisiness)), clean = (f) => noisiness(f) <= cleanest + 0.15;
    let best = fr.filter(clean).reduce((p, f) => (energy(f) > energy(p) ? f : p), fr.find(clean));
    let a = best, b = best; const floor = energy(best) - OPT.holdDb;
    while (a - 1 >= f0i && energy(a - 1) >= floor && clean(a - 1)) a--; while (b + 1 < f1i && energy(b + 1) >= floor && clean(b + 1)) b++;
    m.hold = { h0: a * FPS, h1: Math.max((b + 1) * FPS, a * FPS + FPS) };
    // the vowel's clean noise profile = per-bin median over its cleanest third of frames; its level = mean energy of the held stretch
    const best3 = [...fr].sort((p, q) => noisiness(p) - noisiness(q)).slice(0, Math.max(1, Math.ceil(fr.length / 3)));
    m.apClean = new Float64Array(bins); const col = new Float64Array(best3.length);
    for (let q = 0; q < bins; q++) { best3.forEach((f, i) => (col[i] = an.ap[f * bins + q])); col.sort(); m.apClean[q] = col[col.length >> 1]; }
    let e = 0; for (let f = a; f <= b; f++) e += energy(f); m.levelDb = e / (b - a + 1);
    m.ownClean = best3.reduce((p, f) => p + noisiness(f), 0) / best3.length; m.cleanFrames = best3;
  }
  { // whispered vowels: borrow the clean profile of the same vowel letter (median over its clean moras), else of all clean moras
    const tmpl = (ms) => { const fr = ms.flatMap((m) => m.cleanFrames); if (!fr.length) return null; const out = new Float64Array(bins), col = new Float64Array(fr.length);
      for (let q = 0; q < bins; q++) { fr.forEach((f, i) => (col[i] = an.ap[f * bins + q])); col.sort(); out[q] = col[col.length >> 1]; } return out; };
    const tmplSp = (ms) => { const fr = ms.flatMap((m) => m.cleanFrames); if (!fr.length) return null; const out = new Float64Array(bins), col = new Float64Array(fr.length);
      for (let q = 0; q < bins; q++) { fr.forEach((f, i) => (col[i] = Math.log(an.sp[f * bins + q] + 1e-16))); col.sort(); out[q] = Math.exp(col[col.length >> 1]); } return out; };
    const good = moras.filter((m) => m.ownClean <= OPT.cleanMax), all = tmpl(good), allSp = tmplSp(good);
    for (const m of moras) if (m.ownClean > OPT.cleanMax) { const same = good.filter((g) => tokens[g.vowel] === tokens[m.vowel]);
      m.apClean = tmpl(same) ?? all ?? m.apClean; m.spClean = tmplSp(same) ?? allSp ?? undefined; m.borrowed = (tmpl(same) ?? all) !== null; }   // 2026-10-07 (Claude Opus 5.5): nothing clean to borrow (a one-syllable phrase) → keep its own profile instead of crashing
    log(`whispered vowels sung from a clean sample of the same vowel: ${moras.filter((m) => m.borrowed).map((m) => m.kana).join(" ") || "none"}`);
  }
  { const lv = moras.filter((m) => m.ownClean <= OPT.cleanMax).map((m) => m.levelDb).sort((p, q) => p - q), med = lv[lv.length >> 1];
    for (const m of moras) m.gainDb = m.ownClean > OPT.cleanMax ? 0 : Math.max(-OPT.levelMaxDb, Math.min(OPT.levelMaxDb, OPT.level * (med - m.levelDb))); }
  let t = OPT.leadIn + leadRest * EIGHTH; const notes = [];
  SCORE.forEach((s, k) => {
    const m = moras[k]; m.noteStart = t;
    for (const [midi, len] of s.notes) { notes.push({ k, midi, t0: t, t1: t + len * EIGHTH }); t += len * EIGHTH; }
    m.noteEnd = t; m.rest = (s.rest || 0) > 0; t += (s.rest || 0) * EIGHTH;
    m.end = m.noteEnd;                                            // where this syllable's sound ends: the beat, unless the next syllable's mark steals time
  });
  moras.forEach((m, k) => {                                       // 断句标记: steal the gap (+ the next consonant) from the end of the previous note
    if (!m.mark || k === 0) return; const prev = moras[k - 1]; if (prev.rest) return;   // after a written rest the mark only picks the inhale kind
    const noteLen = prev.noteEnd - prev.noteStart, cons = Math.min(m.v0 - m.c0, OPT.consonantCap * noteLen);
    const want = m.mark === "^" ? OPT.lift : Math.min(OPT.gap[m.mark].max, OPT.gap[m.mark].share * noteLen);
    prev.end = prev.noteEnd - Math.min(want + cons, 0.6 * noteLen); prev.rest = true; prev.stolen = true;
  });
  moras.forEach((m, k) => {                                       // consonant pre-roll on the song clock
    let len = m.v0 - m.c0;
    if (SCORE[k].hum && OPT.humConsMin > 0 && m.cons.some((i) => !isMark(tokens[i]) && tokens[i] !== "_")) len = Math.max(len, OPT.humConsMin);   // 哼的字：辅音拉开
    if (k > 0 && (!moras[k - 1].rest || moras[k - 1].stolen)) len = Math.min(len, OPT.consonantCap * (moras[k - 1].noteEnd - moras[k - 1].noteStart));
    m.preStart = m.noteStart - len;
  });
  // piecewise-linear map song time -> compact time
  const segs = [];
  const seg = (s0, s1, c0, c1, kind, k, hold = false) => { if (s1 > s0 + 1e-9) segs.push({ s0, s1, c0, c1, kind, k, hold }); };
  seg(0, moras[0].preStart, 0, moras[0].c0, "lead", -1);
  moras.forEach((m, k) => {
    seg(m.preStart, m.noteStart, m.c0, m.v0, "cons", k);
    const sEnd0 = k + 1 < moras.length && !m.rest ? moras[k + 1].preStart : m.end;
    const codaLen = m.codaC1 ? Math.min(m.codaC1 - m.v1, 0.45 * (sEnd0 - m.noteStart)) : 0, sEnd = sEnd0 - codaLen;   // en coda: the note's last bit
    const L = sEnd - m.noteStart, last = k + 1 === moras.length, fade = (m.rest || last) && !codaLen ? OPT.release : 0;
    m.fade = fade > 0 ? [sEnd - Math.min(fade, 0.4 * L), sEnd] : null;
    const { h0, h1 } = m.hold, tailC = fade > 0 ? 0 : Math.min(OPT.tailIntoNext, m.v1 - h1);
    const attC = h0 - m.v0;
    if (L <= attC + tailC + 0.02) seg(m.noteStart, sEnd, m.v0, fade > 0 ? h1 : m.v1, "vowel", k);   // short note: plain linear map
    else {
      seg(m.noteStart, m.noteStart + attC, m.v0, h0, "vowel", k);
      seg(m.noteStart + attC, sEnd - tailC, h0, h1, "vowel", k, true);   // the held stretch: the atlas sings here
      if (tailC > 0) seg(sEnd - tailC, sEnd, m.v1 - tailC, m.v1, "vowel", k, "tail");   // atlas → piper crossfade happens here
    }
    if (codaLen > 0) { seg(sEnd, sEnd0, m.v1, m.codaC1, "cons", k, "coda"); m.codaFade = [sEnd0 - Math.min(0.04, codaLen / 2), sEnd0]; }
    if (m.rest && k + 1 < moras.length) seg(m.end, moras[k + 1].preStart, m.codaC1 ?? m.v1, moras[k + 1].c0, "rest", k);
  });
  const songEnd = moras[moras.length - 1].noteEnd;

  // ---- 3b. 元音图谱: load the sets this run needs ---------------------------------------------------------------------------------
  const ATLAS_VOWEL = (tok) => {   // which atlas vowel sings this token (ja: itself; zh finals: by their nucleus — an approximation, the bank is Japanese)
    if (LANG !== "zh") return /^N/.test(tok) ? "N" : (VOWEL.has(tok) ? tok : null);
    const c = tok[0]; return { a: "a", i: "i", u: "u", y: "i", e: "e", "ə": "e", "ɤ": "o", o: "o", "ɻ": "i", "ɨ": "i", "ɚ": "e" }[c] ?? null;
  };
  let atlas = null;
  if (ATLAS !== "off") {
    const exprId = { strong: "strong", soft: "soft", deep: "deep", bright: "bright" }[ATLAS];
    if (ATLAS !== "normal" && !exprId) throw new Error(`--atlas=${ATLAS}: unknown (normal|strong|soft|deep|bright|off)`);
    const normal = await Promise.all(["B3", "Ds4", "G4", "B4"].map((id) => loadAtlas(id)));
    atlas = ATLAS === "normal" ? normal : [await loadAtlas(exprId)];
    for (const a of [...normal, ...atlas]) { const e = a.entries[0]; if (!e || e.bins !== bins || e.fft !== an.fft || a.framePeriodMs !== FP) throw new Error(`atlas ${a.set}: bins/fft/frame period differ from this analysis`); }
    // an expression set's own loudness vs the normal set nearest in pitch, per vowel (dB): 強 is louder than normal G4 by this much → kept via OPT.atlasExprLevel
    if (ATLAS !== "normal") { const a = atlas[0], ref = [...normal].sort((p, q) => Math.abs(p.midi - a.midi) - Math.abs(q.midi - a.midi))[0]; a.exprOffset = {};
      for (const v of ["a", "i", "u", "e", "o", "N"]) { const mean = (set) => { const es = set.entries.filter((e) => e.vowel === v); return es.length ? es.reduce((s, e) => s + e.energyDb, 0) / es.length : NaN; };
        const d = mean(a) - mean(ref); a.exprOffset[v] = isFinite(d) ? d : 0; }
      log(`图谱 ${ATLAS} vs ${ref.set}: loudness offset per vowel dB ${JSON.stringify(Object.fromEntries(Object.entries(a.exprOffset).map(([k, x]) => [k, +x.toFixed(1)])))}`); }
  }
  /** atlas frame for mora m at note pitch midi, τ seconds into the held stretch: log-sp and ap arrays (level-matched to piper's held level). */
  function atlasFrame(m, midi, tau, k) {
    const v = ATLAS_VOWEL(tokens[m.vowel]); if (!v) return null;
    let mixSets;   // [{set, w}]
    if (atlas.length === 1) mixSets = [{ a: atlas[0], w: 1 }];
    else { const sorted = [...atlas].sort((p, q) => p.midi - q.midi); let lo = sorted[0], hi = sorted[sorted.length - 1];
      for (let i = 0; i + 1 < sorted.length; i++) if (midi >= sorted[i].midi && midi <= sorted[i + 1].midi) { lo = sorted[i]; hi = sorted[i + 1]; }
      const w = midi <= lo.midi ? 0 : midi >= hi.midi ? 1 : (midi - lo.midi) / (hi.midi - lo.midi);
      mixSets = w === 0 ? [{ a: lo, w: 1 }] : w === 1 ? [{ a: hi, w: 1 }] : [{ a: lo, w: 1 - w }, { a: hi, w }]; }
    const logsp = new Float64Array(bins), apo = new Float64Array(bins); let used = 0;
    for (const { a, w } of mixSets) {
      const es = a.entries.filter((e) => e.vowel === v); if (!es.length) continue;
      const e = es[k % es.length], L = e.frames, idx0 = Math.floor(tau / FPS); let i = idx0 % Math.max(1, 2 * L - 2); if (i >= L) i = 2 * L - 2 - i;   // ping-pong through the sample
      const gdb = Math.max(-OPT.atlasGainClamp, Math.min(OPT.atlasGainClamp, m.levelDb - e.energyDb)) + OPT.atlasExprLevel * (a.exprOffset?.[v] ?? 0);
      const base = (e.frame0 + i) * bins * 2, gain = gdb / 10 * Math.LN10;   // dB → ln factor (sp is power)
      for (let q = 0; q < bins; q++) { logsp[q] += w * (Math.log(a.data[base + q] + 1e-16) + gain); apo[q] += w * a.data[base + bins + q]; }
      used += w;
    }
    if (used <= 0) return null;
    if (used < 0.999) for (let q = 0; q < bins; q++) { logsp[q] /= used; apo[q] /= used; }
    return { logsp, ap: apo };
  }
  /** breath template for the mora that follows a rest: its vowel's atlas (or piper) envelope, tilted, as pure noise; returns log-sp scaled to breathDb below the vowel */
  function breathTemplate(m, midi, k) {
    const fr = atlas ? atlasFrame(m, midi, 0, k) : null; const logsp = new Float64Array(bins);
    if (fr) logsp.set(fr.logsp); else { const src = m.spClean ?? null; for (let q = 0; q < bins; q++) logsp[q] = Math.log((src ? src[q] : an.sp[Math.ceil(m.hold.h0 / FPS) * bins + q]) + 1e-16); }
    const tilt = Math.round(OPT.atlasTiltHz / SR * an.fft);
    for (let q = 0; q < bins; q++) if (q > tilt) logsp[q] += Math.log(0.25) * Math.min(1, (q - tilt) / tilt);
    let e = 0; for (let q = 0; q < bins; q++) e += Math.exp(logsp[q]); const db = 10 * Math.log10(e + 1e-30);
    const want = m.levelDb + OPT.breathDb, g = (want - db) / 10 * Math.LN10; for (let q = 0; q < bins; q++) logsp[q] += g;
    return logsp;
  }
  const midiOf = (k) => notes.find((n) => n.k === k).midi;

  // ---- 4. WORLD: analyse piper's take, rebuild on the song clock, sing the melody ----------------------------------------------
  const N = Math.ceil(songEnd / FPS) + 1;
  // melody in cents on the song clock (consonant pre-roll already on its syllable's first note), then portamento + vibrato
  const pitchSegs = [...notes, ...moras.map((m, k) => ({ t0: m.preStart, t1: m.noteStart, midi: notes.find((n) => n.k === k).midi }))];
  const cents = new Float64Array(N).fill(NaN);
  for (let j = 0; j < N; j++) { const tt = j * FPS; const s = pitchSegs.find((q) => tt >= q.t0 && tt < q.t1); if (s) cents[j] = s.midi * 100; }
  const half = Math.max(1, Math.round(OPT.portamentoMs / 2 / FP)), smooth = Float64Array.from(cents);
  for (let j = 0; j < N; j++) { if (isNaN(cents[j])) continue; let s = 0, c = 0; for (let q = j - half; q <= j + half; q++) if (q >= 0 && q < N && !isNaN(cents[q])) { s += cents[q]; c++; } smooth[j] = s / c; }
  for (const n of notes) { const V = OPT.vibrato; if (n.t1 - n.t0 < V.minNote) continue;
    for (let j = Math.ceil((n.t0 + V.delay) / FPS); j * FPS < n.t1 && j < N; j++) { const u = j * FPS - n.t0 - V.delay; smooth[j] += V.cents * Math.min(1, u / V.fadeIn) * Math.sin(2 * Math.PI * V.hz * u); } }
  // rebuild frames
  const sp = new Float64Array(N * bins), ap = new Float64Array(N * bins), f0 = new Float64Array(N); let repaired = 0, vowelFrames = 0, atlasFrames = 0, holdFrames = 0, breaths = new Map();   // mora k -> "v" | "O"
  const breathSp = new Map();   // mora k -> breath template (built once)
  // only：只重建这个字自己的帧（辅音起 → 它的末尾）；别的帧不算
  const onlyK = only ? SRC.slice(0, only.entry).reduce((a, e) => a + (e.moras || 1), 0) : -1;   // SRC 的条目 → SCORE / moras 的下标（几个假名一条的拆开过）
  const onlyM = only ? moras[Math.min(onlyK, moras.length - 1)] : null;
  const J0 = onlyM ? Math.max(0, Math.floor(onlyM.preStart / FPS)) : 0, J1 = onlyM ? Math.min(N, Math.ceil(onlyM.end / FPS) + 1) : N;
  for (let j = J0; j < J1; j++) {
    const tt = j * FPS, s = segs.find((q) => tt >= q.s0 && tt < q.s1) ?? (tt >= songEnd ? segs[segs.length - 1] : null);
    if (!s) continue;
    const c = s.c0 + ((Math.min(tt, s.s1) - s.s0) / (s.s1 - s.s0)) * (s.c1 - s.c0), fi = Math.min(an.frames - 1, c / FPS);
    const a = Math.floor(fi), b = Math.min(an.frames - 1, a + 1), w = fi - a;
    for (let q = 0; q < bins; q++) {
      sp[j * bins + q] = Math.exp((1 - w) * Math.log(an.sp[a * bins + q] + 1e-16) + w * Math.log(an.sp[b * bins + q] + 1e-16));
      ap[j * bins + q] = (1 - w) * an.ap[a * bins + q] + w * an.ap[b * bins + q];
    }
    const srcVoiced = an.f0[a] > 0 || an.f0[b] > 0, sung = !isNaN(smooth[j]);
    if (s.kind === "rest" || s.kind === "lead") {
      for (let q = 0; q < bins; q++) sp[j * bins + q] *= 1e-6;   // −60 dB: silence
      // 断气: an inhale at the end of the rest / lead-in, before the next phrase
      const nk = s.kind === "lead" ? 0 : s.k + 1, mark = s.kind === "lead" ? "v" : (moras[nk]?.mark ?? null);
      const restLen = s.s1 - s.s0, stolen = s.kind === "rest" && !!moras[s.k].stolen, longEnough = s.kind === "lead" || restLen >= OPT.breathMinRest * EIGHTH - 1e-6;
      const g = OPT.gap[mark === "O" ? "O" : "v"];
      if (BREATH && nk < moras.length && mark !== "^" && (stolen || longEnough)) {
        const bl = Math.min(g.max, 0.8 * restLen), b0 = s.s1 - bl, boost = 10 ** (g.db / 10);
        if (tt >= b0) {
          if (!breathSp.has(nk)) breathSp.set(nk, breathTemplate(moras[nk], midiOf(nk), nk));
          const u = (tt - b0) / bl, env = u < 0.7 ? 0.5 - 0.5 * Math.cos(Math.PI * u / 0.7) : 0.5 + 0.5 * Math.cos(Math.PI * (u - 0.7) / 0.3);   // rise 70 %, fall 30 %
          const tpl = breathSp.get(nk); for (let q = 0; q < bins; q++) { sp[j * bins + q] = Math.exp(tpl[q]) * env * env * boost; ap[j * bins + q] = 1; }
          f0[j] = 0; breaths.set(nk, mark === "O" ? "O" : "v");
        }
      }
    }
    if (s.kind === "vowel" && sung) {
      vowelFrames++; f0[j] = 440 * 2 ** ((smooth[j] - 6900) / 1200);
      const m = moras[s.k]; let changed = false;
      if (m.spClean) sp.set(m.spClean, j * bins);                 // whispered in piper's take: sing the song's clean sample of this vowel
      for (let q = 0; q < bins; q++) { const v = ap[j * bins + q], c = m.apClean[q]; if (v > c) { ap[j * bins + q] = c + OPT.breath * (v - c); changed = true; } }
      if (changed && !srcVoiced) repaired++;
      if (atlas && s.hold) {                                       // 元音图谱: the held stretch sings real sung vowel frames; fade in at its start, fade out across the tail segment
        holdFrames++;
        const holdSeg = s.hold === true ? s : segs.find((q) => q.kind === "vowel" && q.k === s.k && q.hold === true);
        const tau = tt - (holdSeg ? holdSeg.s0 : s.s0), total = s.s1 - s.s0, xf = Math.max(1e-3, Math.min(OPT.atlasXfade, total / 3));
        let wa;
        if (s.hold === "tail") { wa = holdSeg ? MIX * (1 - (tt - s.s0) / total) : 0; }                         // tail: atlas → piper across the whole tail
        else { const fadeOut = moras[s.k].fade ? Math.min(1, (total - (tt - s.s0)) / xf) : 1; wa = MIX * Math.min(1, (tt - s.s0) / xf, fadeOut); }   // hold: fade in; fade out only if the note ends in silence
        const fr = wa > 0 ? atlasFrame(m, midiOf(s.k), tau, s.k) : null;
        if (fr) { atlasFrames++; for (let q = 0; q < bins; q++) { sp[j * bins + q] = Math.exp((1 - wa) * Math.log(sp[j * bins + q] + 1e-16) + wa * fr.logsp[q]); ap[j * bins + q] = (1 - wa) * ap[j * bins + q] + wa * fr.ap[q]; } }
      }
    }
    const fm = s.kind === "vowel" ? moras[s.k].fade : s.kind === "cons" && s.hold === "coda" ? moras[s.k].codaFade : null;
    if (fm && tt >= fm[0]) { const g = Math.max(0.01, 1 - (tt - fm[0]) / (fm[1] - fm[0])); for (let q = 0; q < bins; q++) sp[j * bins + q] *= g * g; }
    if (s.kind === "vowel" && s.k >= 0) {                           // level: vowels only (consonants untouched), ramp over the first 30 ms
      const m = moras[s.k], w = Math.min(1, Math.max(0, (tt - m.noteStart) / 0.03)), gg = 10 ** ((w * m.gainDb) / 10);
      for (let q = 0; q < bins; q++) sp[j * bins + q] *= gg;
    } else if (s.kind === "cons" && sung && srcVoiced && noisiness(a) <= 0.5 && noisiness(b) <= 0.5) f0[j] = 440 * 2 ** ((smooth[j] - 6900) / 1200);
    // ↑ a consonant is pitched only where piper's frame is really voiced (m n r g …): Harvest sometimes finds a pitch inside s / sh / ts,
    //   and a pitched hiss is a buzz (user, take 5/6「有时候还有电锯声」)
  }

  const y = only
    ? W.synth({ f0: f0.subarray(J0, J1), sp: sp.subarray(J0 * bins, J1 * bins), ap: ap.subarray(J0 * bins, J1 * bins), fft: an.fft, fs: SR, framePeriod: FP })
    : W.synth({ f0, sp, ap, fft: an.fft, fs: SR, framePeriod: FP });
  const worldMs = performance.now() - t0;

  function finish(sig) {
    const fade = Math.round(0.03 * SR), n = sig.length, out = new Float32Array(n + Math.round(OPT.tail * SR));
    let m = 1e-9; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(sig[i]));
    for (let i = 0; i < n; i++) out[i] = (sig[i] / m) * 0.89 * (i > n - fade ? (n - i) / fade : 1);
    return out;
  }

  return { sung: finish(y), y, x, SR, finish, internals: { tokens, moras, notes, segs, an, sp, ap, f0, N, bins, FP, FPS, EIGHTH, songEnd, noisiness,
    atlas, breaths, repaired, vowelFrames, atlasFrames, holdFrames, piperMs, worldMs, ATLAS_VOWEL, midiOf, OPT } };
}
