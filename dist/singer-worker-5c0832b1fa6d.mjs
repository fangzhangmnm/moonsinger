var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/singer/en-front.mjs
var UNITS = /* @__PURE__ */ new Set(["\u0251\u02D0", "\u0254\u02D0", "i\u02D0", "u\u02D0", "\u025C\u02D0", "a\u026A", "e\u026A", "o\u028A", "a\u028A", "\u0254\u026A"]);
var VOWEL_CH = /* @__PURE__ */ new Set([..."aeiou\u026A\u028A\u025B\u0254\xE6\u0251\u028C\u0259\u025C\u025A\u025D"]);
function nucleusStarts(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!VOWEL_CH.has(tokens[i])) continue;
    out.push(i);
    if (UNITS.has(tokens[i] + (tokens[i + 1] ?? ""))) i++;
  }
  return out;
}
function makeEnglishFront({ g2p, encodeTokens: encodeTokens2, idMap }) {
  function phonemizeWords(words) {
    const all = [], prosody = [], keptSung = [], keptWord = [], nuclei = [];
    const tokens = [];
    words.forEach((w, wi) => {
      const r = g2p.phonemize(w);
      const starts = new Set(nucleusStarts(r.tokens));
      nuclei.push(starts.size);
      if (!starts.size) return;
      if (all.length) {
        all.push(" ");
        prosody.push([0, 0, 0]);
      }
      r.tokens.forEach((t, i) => {
        all.push(t);
        prosody.push(r.prosody[i]);
        if (idMap[t]) {
          tokens.push(t);
          keptSung.push(starts.has(i));
          keptWord.push(wi);
        }
      });
    });
    const { ids, pros } = encodeTokens2(all, prosody, idMap);
    return { tokens, ids, pros, sung: keptSung, wordOf: keptWord, nuclei };
  }
  return { phonemizeWords };
}
function groupWords(entries) {
  const groups = [];
  for (const e of entries) {
    const g = groups[groups.length - 1];
    if (g && g.open) g.items.push(e);
    else groups.push({ items: [e], open: false });
    groups[groups.length - 1].open = !!e.hyph;
  }
  return groups;
}
function wordsOf(entries) {
  return groupWords(entries).map((g) => g.items.map((e) => e.kana).join(""));
}
function alignEnglish(entries, nucleiPerWord) {
  const groups = groupWords(entries), out = [];
  let leadRest = 0;
  groups.forEach((g, wi) => {
    const n = nucleiPerWord[wi], items = g.items, last = items[items.length - 1], rest = last.rest || 0;
    const mk = (kana, notes) => ({ kana, notes, ...items[0].hum ? { hum: true } : {} });
    const made = [];
    if (n <= 0) {
      const len = items.reduce((s, e) => s + e.notes.reduce((a, [, l]) => a + l, 0) + (e.rest || 0), 0);
      const prev = out[out.length - 1];
      if (prev) prev.rest = (prev.rest || 0) + len;
      else leadRest += len;
      return;
    }
    if (n <= items.length) {
      for (let k = 0; k < n - 1; k++) made.push(mk(items[k].kana, items[k].notes));
      made.push(mk(items.slice(n - 1).map((e) => e.kana).join(""), items.slice(n - 1).flatMap((e) => e.notes)));
    } else {
      for (let k = 0; k < items.length - 1; k++) made.push(mk(items[k].kana, items[k].notes));
      const need = n - (items.length - 1), notes = last.notes;
      if (notes.length >= need) {
        for (let k = 0; k < need - 1; k++) made.push(mk(last.kana, [notes[k]]));
        made.push(mk(last.kana, notes.slice(need - 1)));
      } else {
        for (let k = 0; k < notes.length - 1; k++) made.push(mk(last.kana, [notes[k]]));
        const [midi, len] = notes[notes.length - 1], parts = need - (notes.length - 1);
        for (let k = 0; k < parts; k++) made.push(mk(last.kana, [[midi, len / parts]]));
      }
    }
    if (rest) made[made.length - 1].rest = rest;
    out.push(...made);
  });
  return { entries: out, leadRest };
}

// src/singer/sing-core.mjs
var DEFAULT_OPT = {
  leadIn: 0.5,
  // s before the first sung vowel (the first consonant comes out of it)
  tail: 0.6,
  // s of silence after the last note
  consonantCap: 0.5,
  // a consonant may take at most this share of the previous note when no rest precedes it
  vowelFrames: [8, 16],
  // piper frames (11.6 ms) for vowel + its blank: 2 × the model's own length, clamped to this range
  attack: 0.06,
  // s of the vowel start copied 1:1 before stretching
  release: 0.08,
  // s of fade-out at the end of a note before a rest / at the end
  holdDb: 6,
  // the held stretch = clean frames (see breath) within this many dB of the vowel's loudest clean frame
  vowelLag: 0.02,
  // s: fallback only — the sung vowel starts where piper's vowel turns clean (periodic), within its first half
  cleanMax: 0.4,
  // a vowel whose own cleanest frames are noisier than this (whispered: なかよし's し, つく's つ) is replaced by a
  // clean sample of the same vowel elsewhere in the song — envelope AND noise profile (take 5 borrowed only the noise
  // profile: a whisper's envelope sung voiced = buzz) — sung vowels are never devoiced (user「常识唱歌的时候这种音会唱成什么」)
  // knobs from the table (ai-docs/20261005-moonsinger-upheaval.md §8), take 4 — user 2026-10-05「突然气球漏气变成气音」「有些音突然很轻」:
  breath: 0,
  // 实声/气息: 0 = every vowel frame as clean (periodic) as that vowel's cleanest frames; 1 = piper's own breathiness
  level: 0.8,
  // 音量: pull each syllable's loudness this far toward the song's median (0 = speech's own loud/soft pattern)
  levelMaxDb: 6,
  // take 5 allowed 12 and boosted the consonants too: user「一堆麦克风的电噪声……有时候还有电锯声」
  tailIntoNext: 0.04,
  // s at most of the vowel's tail copied 1:1 into the next consonant
  portamentoMs: 40,
  // width of the pitch glide between two notes
  // 哼的字（score 条目带 hum: true = 没写歌词、唱这首歌「哼的字」的音；MoonSinger 编辑器给）。2026-10-07 (Claude Opus 5.5)，
  //   user「全歌唱的时候也是都听的像啊」：「んんん」全被注成舌根 N_uvular（嘴张着 ≈ 鼻化的 a）；「ららら」的弹舌只有 20–70 ms，夹在两个 a 中间。默认关 = 原样。
  humNasal: null,
  // 哼「ん」改用哪个 N（"N_m" = 双唇，闭嘴哼）；null = 照注音
  humConsMin: 0,
  // s：哼的字的辅音在歌的时钟上至少这么长（ら 的弹舌拉开）；0 = 照 piper
  vibrato: { cents: 15, hz: 5.5, delay: 0.25, fadeIn: 0.2, minNote: 0.5 },
  // only on notes ≥ minNote s
  noiseScale: 0.667,
  noiseW: 0.5,
  // the read-aloud library's defaults
  atlasXfade: 0.04,
  // s: crossfade piper → atlas at the start of the held stretch; atlas → piper happens across the tail segment (not inside the hold)
  atlasGainClamp: 12,
  // dB: the level match atlas → piper's held level is clamped to ±this (take 1 had −17 dB on 着: a quiet speech vowel pulling a sung frame way down)
  atlasExprLevel: 1,
  // 0..1: how much of the expression set's own loudness difference (強 / 弱 / 深 / 明 vs the normal set at that pitch) is kept (take 1 = 0: 強 sounded like normal)
  atlasTiltHz: 3e3,
  // breath: bins above this are attenuated (an inhale has little energy up there)
  breathDb: -28,
  // breath loudness relative to the coming vowel's held level
  lift: 0.06,
  // s: ^ = silence before the syllable (stolen from the previous note), no inhale   (v3 had 0.09: user「吃了很多音长」)
  gap: {
    v: { share: 0.25, max: 0.16, db: 0 },
    // v: an inhale: at most this share of the previous note / this long, at breathDb   (v3: 0.4 / 0.28)
    O: { share: 0.35, max: 0.24, db: 4 }
  },
  // O: 大口: longer and this many dB louder   (v3: 0.5 / 0.42 / +6)
  breathMinRest: 1
  // in eighths: only rests at least this long get an inhale (shorter = no time to breathe)
};
var VOWEL = /* @__PURE__ */ new Set(["a", "i", "u", "e", "o", "N"]);
var VOICED_FOR = { A: "a", I: "i", U: "u", E: "e", O: "o" };
var isMark = (t) => "[]#?!".includes(t) || /^tone\d$/.test(t);
async function singCore({
  score: SCORE_IN,
  text: TEXT,
  tempo: TEMPO_QUARTER,
  lang: LANG = "ja",
  transpose: TRANSPOSE = 0,
  phrasing: PHRASING = "score",
  atlas: ATLAS = "off",
  mix: MIX = 1,
  breath: BREATH = false,
  preset: PRESET = 0,
  piper: pn2,
  world: W,
  loadAtlas = null,
  opt = {},
  log = () => {
  },
  only = null
}) {
  const OPT = { ...DEFAULT_OPT, ...opt };
  if (ATLAS !== "off" && !loadAtlas) throw new Error(`atlas=${ATLAS} needs loadAtlas`);
  let EN = null, leadRest = 0, SRC = SCORE_IN;
  if (LANG === "en") {
    EN = pn2.phonemizeEnWords(wordsOf(SCORE_IN));
    ({ entries: SRC, leadRest } = alignEnglish(SCORE_IN, EN.nuclei));
  }
  const EIGHTH0 = 60 / TEMPO_QUARTER / 2;
  if (only) SRC = SRC.map((e, k) => k === only.entry ? { ...e, notes: [[only.midi - TRANSPOSE, Math.max(0.25, only.secs / EIGHTH0)]], rest: 0 } : e);
  const SCORE = SRC.map((e) => ({ ...e, notes: e.notes.map(([m, l]) => [m + TRANSPOSE, l]) })).flatMap((e) => {
    const n = e.moras || 1;
    if (n === 1) return [e];
    if (e.notes.length !== 1) throw new Error(`${e.kana}: moras > 1 needs one note`);
    const [midi, len] = e.notes[0];
    return Array.from({ length: n }, (_, i) => ({ kana: [...e.kana][i] ?? e.kana, notes: [[midi, len / n]], rest: i === n - 1 ? e.rest : 0, before: i === 0 ? e.before : void 0 }));
  });
  const SR2 = pn2.SR, HOP2 = pn2.HOP, FR = SR2 / HOP2, EIGHTH = 60 / TEMPO_QUARTER / 2, FP = 5, FPS = FP / 1e3;
  const sungText = TEXT.replace(/[、。，．,.！？!?]/g, "");
  const ph = LANG === "en" ? EN : LANG === "zh" ? pn2.phonemizeZh(sungText) : pn2.phonemize(sungText);
  const tokens = LANG === "ja" ? ph.tokens.map((t2) => VOICED_FOR[t2] ?? t2) : ph.tokens;
  if (OPT.humNasal && LANG === "ja") {
    let k = 0;
    tokens.forEach((t2, i) => {
      if (!(VOWEL.has(t2) || /^N/.test(t2))) return;
      if (SCORE[k]?.hum && /^N/.test(t2)) tokens[i] = OPT.humNasal;
      k++;
    });
  }
  const { ids, pros } = LANG === "ja" ? pn2.encode(tokens, ph.prosody) : ph;
  const RUN = { lang: LANG, preset: PRESET };
  const owner = [];
  let p = 2;
  for (const t2 of tokens) {
    owner.push(t2 === "_" ? [p] : [p, p + 1]);
    p += t2 === "_" ? 1 : 2;
  }
  if (p !== ids.length - 1) throw new Error(`id layout: expected EOS at ${p}, have ${ids.length - 1}`);
  const moras = [];
  let gap = [];
  const sung1 = LANG === "zh" ? (t2, i) => /^tone\d$/.test(tokens[i + 1] ?? "") : LANG === "en" ? (t2, i) => EN.sung[i] : (t2) => VOWEL.has(t2) || /^N/.test(t2);
  tokens.forEach((t2, i) => {
    if (sung1(t2, i)) {
      moras.push({ gap, vowel: i });
      gap = [];
    } else gap.push(i);
  });
  const trailing = gap;
  if (moras.length !== SCORE.length) throw new Error(`${moras.length} sung syllables in the text, ${SCORE.length} in the score
 text: ${moras.map((m) => tokens.slice(m.gap.length ? m.gap[0] : m.vowel, m.vowel + 1).filter((t2) => !"[]#?!_".includes(t2)).join("")).join(" ")}`);
  moras.forEach((m, k) => {
    m.kana = SCORE[k].kana;
    m.mark = SCORE[k].before ?? null;
    if (m.mark && !"^vO".includes(m.mark)) throw new Error(`${m.kana}: before must be ^ v or O`);
    m.label = [...m.gap.filter((i) => !isMark(tokens[i]) && tokens[i] !== "_").map((i) => tokens[i]), tokens[m.vowel]].join("");
    const lastPause = m.gap.lastIndexOf(m.gap.findLast?.((i) => tokens[i] === "_") ?? -1);
    m.pause = lastPause >= 0 ? m.gap[lastPause] : null;
    m.cons = m.gap.slice(lastPause + 1);
    m.before = lastPause >= 0 ? m.gap.slice(0, lastPause + 1) : [];
  });
  if (LANG === "en") moras.forEach((m, k) => {
    const w = EN.wordOf[m.vowel], next = moras[k + 1];
    if (!next) {
      m.coda = trailing.filter((i) => !isMark(tokens[i]));
      return;
    }
    if (!(SCORE[k].rest > 0)) return;
    m.coda = next.cons.filter((i) => EN.wordOf[i] === w);
    next.cons = next.cons.filter((i) => EN.wordOf[i] !== w);
  });
  if (PHRASING !== "score") {
    if (PHRASING !== "punct" && PHRASING !== "none") throw new Error(`--phrasing=${PHRASING}: unknown (score|punct|none)`);
    let ti = 0;
    moras.forEach((m, k) => {
      let punct = false;
      for (const ch of [...SCORE[k].kana]) {
        while (ti < TEXT.length && "\u3063\u3001\u3002\uFF0C".includes(TEXT[ti])) {
          if (TEXT[ti] !== "\u3063") punct = true;
          ti++;
        }
        if (TEXT[ti] === ch) ti++;
      }
      m.mark = PHRASING === "punct" && punct && k > 0 ? "v" : null;
    });
  }
  const pred = (await pn2.run(ids, pros, { noiseScale: 0, noiseW: 0, ...RUN })).durations;
  const frames = new Float32Array(ids.length).fill(1);
  frames[0] = 10;
  for (const m of moras) {
    for (const i of m.cons) if (!isMark(tokens[i])) owner[i].forEach((j) => frames[j] = Math.max(1, Math.round(pred[j])));
    for (const i of m.coda ?? []) if (!isMark(tokens[i])) owner[i].forEach((j) => frames[j] = Math.max(1, Math.round(pred[j])));
    if (m.pause !== null) frames[owner[m.pause][0]] = 10;
    const [a, b] = owner[m.vowel], tot = Math.min(OPT.vowelFrames[1], Math.max(OPT.vowelFrames[0], Math.round(2 * (pred[a] + pred[b]))));
    frames[a] = Math.max(1, Math.round(tot * pred[a] / (pred[a] + pred[b])));
    frames[b] = Math.max(1, tot - frames[a]);
  }
  frames[ids.length - 1] = 8;
  const cum = [0];
  for (const v of frames) cum.push(cum[cum.length - 1] + v);
  const sec = (idIndex) => cum[idIndex] / FR;
  let t0 = performance.now();
  const said = await pn2.run(ids, pros, { noiseScale: OPT.noiseScale, noiseW: OPT.noiseW, override: Array.from(frames), ...RUN });
  const piperMs = performance.now() - t0;
  if (said.audio.length !== cum[cum.length - 1] * HOP2) throw new Error(`audio ${said.audio.length} samples, timeline ${cum[cum.length - 1] * HOP2}`);
  const x = said.audio;
  for (const m of moras) {
    m.c0 = m.cons.length ? sec(owner[m.cons[0]][0]) : sec(owner[m.vowel][0]);
    m.v0 = sec(owner[m.vowel][0]);
    m.v1 = sec(owner[m.vowel][1] + 1);
    if (m.coda?.length) m.codaC1 = sec(owner[m.coda[m.coda.length - 1]][1] + 1);
  }
  t0 = performance.now();
  const an2 = W.analyze(x, SR2, { framePeriod: FP, f0Floor: 80, f0Ceil: 1e3 }), bins = an2.bins;
  const energy = (f) => {
    let e = 0;
    for (let q2 = 0; q2 < bins; q2++) e += an2.sp[f * bins + q2];
    return 10 * Math.log10(e + 1e-30);
  };
  const BAND = [Math.round(500 / SR2 * an2.fft), Math.round(4e3 / SR2 * an2.fft)];
  const noisiness = (f) => {
    let s = 0;
    for (let q2 = BAND[0]; q2 < BAND[1]; q2++) s += an2.ap[f * bins + q2];
    return s / (BAND[1] - BAND[0]);
  };
  for (const m of moras) {
    const a0 = Math.ceil(m.v0 / FPS), mid = Math.floor((m.v0 + m.v1) / 2 / FPS);
    let on2 = -1;
    for (let f = a0; f <= mid; f++) if (noisiness(f) <= OPT.cleanMax) {
      on2 = f;
      break;
    }
    m.v0 = on2 >= 0 ? on2 * FPS : Math.min(m.v0 + OPT.vowelLag, (m.v0 + m.v1) / 2);
  }
  for (const m of moras) {
    const f0i = Math.ceil(m.v0 / FPS), f1i = Math.max(f0i + 1, Math.floor(m.v1 / FPS)), fr = [];
    for (let f = f0i; f < f1i; f++) fr.push(f);
    const cleanest = Math.min(...fr.map(noisiness)), clean = (f) => noisiness(f) <= cleanest + 0.15;
    let best = fr.filter(clean).reduce((p2, f) => energy(f) > energy(p2) ? f : p2, fr.find(clean));
    let a = best, b = best;
    const floor = energy(best) - OPT.holdDb;
    while (a - 1 >= f0i && energy(a - 1) >= floor && clean(a - 1)) a--;
    while (b + 1 < f1i && energy(b + 1) >= floor && clean(b + 1)) b++;
    m.hold = { h0: a * FPS, h1: Math.max((b + 1) * FPS, a * FPS + FPS) };
    const best3 = [...fr].sort((p2, q2) => noisiness(p2) - noisiness(q2)).slice(0, Math.max(1, Math.ceil(fr.length / 3)));
    m.apClean = new Float64Array(bins);
    const col = new Float64Array(best3.length);
    for (let q2 = 0; q2 < bins; q2++) {
      best3.forEach((f, i) => col[i] = an2.ap[f * bins + q2]);
      col.sort();
      m.apClean[q2] = col[col.length >> 1];
    }
    let e = 0;
    for (let f = a; f <= b; f++) e += energy(f);
    m.levelDb = e / (b - a + 1);
    m.ownClean = best3.reduce((p2, f) => p2 + noisiness(f), 0) / best3.length;
    m.cleanFrames = best3;
  }
  {
    const tmpl = (ms2) => {
      const fr = ms2.flatMap((m) => m.cleanFrames);
      if (!fr.length) return null;
      const out = new Float64Array(bins), col = new Float64Array(fr.length);
      for (let q2 = 0; q2 < bins; q2++) {
        fr.forEach((f, i) => col[i] = an2.ap[f * bins + q2]);
        col.sort();
        out[q2] = col[col.length >> 1];
      }
      return out;
    };
    const tmplSp = (ms2) => {
      const fr = ms2.flatMap((m) => m.cleanFrames);
      if (!fr.length) return null;
      const out = new Float64Array(bins), col = new Float64Array(fr.length);
      for (let q2 = 0; q2 < bins; q2++) {
        fr.forEach((f, i) => col[i] = Math.log(an2.sp[f * bins + q2] + 1e-16));
        col.sort();
        out[q2] = Math.exp(col[col.length >> 1]);
      }
      return out;
    };
    const good = moras.filter((m) => m.ownClean <= OPT.cleanMax), all = tmpl(good), allSp = tmplSp(good);
    for (const m of moras) if (m.ownClean > OPT.cleanMax) {
      const same = good.filter((g) => tokens[g.vowel] === tokens[m.vowel]);
      m.apClean = tmpl(same) ?? all ?? m.apClean;
      m.spClean = tmplSp(same) ?? allSp ?? void 0;
      m.borrowed = (tmpl(same) ?? all) !== null;
    }
    log(`whispered vowels sung from a clean sample of the same vowel: ${moras.filter((m) => m.borrowed).map((m) => m.kana).join(" ") || "none"}`);
  }
  {
    const lv = moras.filter((m) => m.ownClean <= OPT.cleanMax).map((m) => m.levelDb).sort((p2, q2) => p2 - q2), med = lv[lv.length >> 1];
    for (const m of moras) m.gainDb = m.ownClean > OPT.cleanMax ? 0 : Math.max(-OPT.levelMaxDb, Math.min(OPT.levelMaxDb, OPT.level * (med - m.levelDb)));
  }
  let t = OPT.leadIn + leadRest * EIGHTH;
  const notes = [];
  SCORE.forEach((s, k) => {
    const m = moras[k];
    m.noteStart = t;
    for (const [midi, len] of s.notes) {
      notes.push({ k, midi, t0: t, t1: t + len * EIGHTH });
      t += len * EIGHTH;
    }
    m.noteEnd = t;
    m.rest = (s.rest || 0) > 0;
    t += (s.rest || 0) * EIGHTH;
    m.end = m.noteEnd;
  });
  moras.forEach((m, k) => {
    if (!m.mark || k === 0) return;
    const prev = moras[k - 1];
    if (prev.rest) return;
    const noteLen = prev.noteEnd - prev.noteStart, cons = Math.min(m.v0 - m.c0, OPT.consonantCap * noteLen);
    const want = m.mark === "^" ? OPT.lift : Math.min(OPT.gap[m.mark].max, OPT.gap[m.mark].share * noteLen);
    prev.end = prev.noteEnd - Math.min(want + cons, 0.6 * noteLen);
    prev.rest = true;
    prev.stolen = true;
  });
  moras.forEach((m, k) => {
    let len = m.v0 - m.c0;
    if (SCORE[k].hum && OPT.humConsMin > 0 && m.cons.some((i) => !isMark(tokens[i]) && tokens[i] !== "_")) len = Math.max(len, OPT.humConsMin);
    if (k > 0 && (!moras[k - 1].rest || moras[k - 1].stolen)) len = Math.min(len, OPT.consonantCap * (moras[k - 1].noteEnd - moras[k - 1].noteStart));
    m.preStart = m.noteStart - len;
  });
  const segs = [];
  const seg = (s0, s1, c0, c1, kind, k, hold = false) => {
    if (s1 > s0 + 1e-9) segs.push({ s0, s1, c0, c1, kind, k, hold });
  };
  seg(0, moras[0].preStart, 0, moras[0].c0, "lead", -1);
  moras.forEach((m, k) => {
    seg(m.preStart, m.noteStart, m.c0, m.v0, "cons", k);
    const sEnd0 = k + 1 < moras.length && !m.rest ? moras[k + 1].preStart : m.end;
    const codaLen = m.codaC1 ? Math.min(m.codaC1 - m.v1, 0.45 * (sEnd0 - m.noteStart)) : 0, sEnd = sEnd0 - codaLen;
    const L = sEnd - m.noteStart, last = k + 1 === moras.length, fade = (m.rest || last) && !codaLen ? OPT.release : 0;
    m.fade = fade > 0 ? [sEnd - Math.min(fade, 0.4 * L), sEnd] : null;
    const { h0, h1 } = m.hold, tailC = fade > 0 ? 0 : Math.min(OPT.tailIntoNext, m.v1 - h1);
    const attC = h0 - m.v0;
    if (L <= attC + tailC + 0.02) seg(m.noteStart, sEnd, m.v0, fade > 0 ? h1 : m.v1, "vowel", k);
    else {
      seg(m.noteStart, m.noteStart + attC, m.v0, h0, "vowel", k);
      seg(m.noteStart + attC, sEnd - tailC, h0, h1, "vowel", k, true);
      if (tailC > 0) seg(sEnd - tailC, sEnd, m.v1 - tailC, m.v1, "vowel", k, "tail");
    }
    if (codaLen > 0) {
      seg(sEnd, sEnd0, m.v1, m.codaC1, "cons", k, "coda");
      m.codaFade = [sEnd0 - Math.min(0.04, codaLen / 2), sEnd0];
    }
    if (m.rest && k + 1 < moras.length) seg(m.end, moras[k + 1].preStart, m.codaC1 ?? m.v1, moras[k + 1].c0, "rest", k);
  });
  const songEnd = moras[moras.length - 1].noteEnd;
  const ATLAS_VOWEL = (tok) => {
    if (LANG !== "zh") return /^N/.test(tok) ? "N" : VOWEL.has(tok) ? tok : null;
    const c = tok[0];
    return { a: "a", i: "i", u: "u", y: "i", e: "e", "\u0259": "e", "\u0264": "o", o: "o", "\u027B": "i", "\u0268": "i", "\u025A": "e" }[c] ?? null;
  };
  let atlas = null;
  if (ATLAS !== "off") {
    const exprId = { strong: "strong", soft: "soft", deep: "deep", bright: "bright" }[ATLAS];
    if (ATLAS !== "normal" && !exprId) throw new Error(`--atlas=${ATLAS}: unknown (normal|strong|soft|deep|bright|off)`);
    const normal = await Promise.all(["B3", "Ds4", "G4", "B4"].map((id) => loadAtlas(id)));
    atlas = ATLAS === "normal" ? normal : [await loadAtlas(exprId)];
    for (const a of [...normal, ...atlas]) {
      const e = a.entries[0];
      if (!e || e.bins !== bins || e.fft !== an2.fft || a.framePeriodMs !== FP) throw new Error(`atlas ${a.set}: bins/fft/frame period differ from this analysis`);
    }
    if (ATLAS !== "normal") {
      const a = atlas[0], ref = [...normal].sort((p2, q2) => Math.abs(p2.midi - a.midi) - Math.abs(q2.midi - a.midi))[0];
      a.exprOffset = {};
      for (const v of ["a", "i", "u", "e", "o", "N"]) {
        const mean = (set) => {
          const es2 = set.entries.filter((e) => e.vowel === v);
          return es2.length ? es2.reduce((s, e) => s + e.energyDb, 0) / es2.length : NaN;
        };
        const d = mean(a) - mean(ref);
        a.exprOffset[v] = isFinite(d) ? d : 0;
      }
      log(`\u56FE\u8C31 ${ATLAS} vs ${ref.set}: loudness offset per vowel dB ${JSON.stringify(Object.fromEntries(Object.entries(a.exprOffset).map(([k, x2]) => [k, +x2.toFixed(1)])))}`);
    }
  }
  function atlasFrame(m, midi, tau, k) {
    const v = ATLAS_VOWEL(tokens[m.vowel]);
    if (!v) return null;
    let mixSets;
    if (atlas.length === 1) mixSets = [{ a: atlas[0], w: 1 }];
    else {
      const sorted = [...atlas].sort((p2, q2) => p2.midi - q2.midi);
      let lo2 = sorted[0], hi = sorted[sorted.length - 1];
      for (let i = 0; i + 1 < sorted.length; i++) if (midi >= sorted[i].midi && midi <= sorted[i + 1].midi) {
        lo2 = sorted[i];
        hi = sorted[i + 1];
      }
      const w = midi <= lo2.midi ? 0 : midi >= hi.midi ? 1 : (midi - lo2.midi) / (hi.midi - lo2.midi);
      mixSets = w === 0 ? [{ a: lo2, w: 1 }] : w === 1 ? [{ a: hi, w: 1 }] : [{ a: lo2, w: 1 - w }, { a: hi, w }];
    }
    const logsp = new Float64Array(bins), apo = new Float64Array(bins);
    let used = 0;
    for (const { a, w } of mixSets) {
      const es2 = a.entries.filter((e2) => e2.vowel === v);
      if (!es2.length) continue;
      const e = es2[k % es2.length], L = e.frames, idx0 = Math.floor(tau / FPS);
      let i = idx0 % Math.max(1, 2 * L - 2);
      if (i >= L) i = 2 * L - 2 - i;
      const gdb = Math.max(-OPT.atlasGainClamp, Math.min(OPT.atlasGainClamp, m.levelDb - e.energyDb)) + OPT.atlasExprLevel * (a.exprOffset?.[v] ?? 0);
      const base2 = (e.frame0 + i) * bins * 2, gain = gdb / 10 * Math.LN10;
      for (let q2 = 0; q2 < bins; q2++) {
        logsp[q2] += w * (Math.log(a.data[base2 + q2] + 1e-16) + gain);
        apo[q2] += w * a.data[base2 + bins + q2];
      }
      used += w;
    }
    if (used <= 0) return null;
    if (used < 0.999) for (let q2 = 0; q2 < bins; q2++) {
      logsp[q2] /= used;
      apo[q2] /= used;
    }
    return { logsp, ap: apo };
  }
  function breathTemplate(m, midi, k) {
    const fr = atlas ? atlasFrame(m, midi, 0, k) : null;
    const logsp = new Float64Array(bins);
    if (fr) logsp.set(fr.logsp);
    else {
      const src = m.spClean ?? null;
      for (let q2 = 0; q2 < bins; q2++) logsp[q2] = Math.log((src ? src[q2] : an2.sp[Math.ceil(m.hold.h0 / FPS) * bins + q2]) + 1e-16);
    }
    const tilt = Math.round(OPT.atlasTiltHz / SR2 * an2.fft);
    for (let q2 = 0; q2 < bins; q2++) if (q2 > tilt) logsp[q2] += Math.log(0.25) * Math.min(1, (q2 - tilt) / tilt);
    let e = 0;
    for (let q2 = 0; q2 < bins; q2++) e += Math.exp(logsp[q2]);
    const db = 10 * Math.log10(e + 1e-30);
    const want = m.levelDb + OPT.breathDb, g = (want - db) / 10 * Math.LN10;
    for (let q2 = 0; q2 < bins; q2++) logsp[q2] += g;
    return logsp;
  }
  const midiOf = (k) => notes.find((n) => n.k === k).midi;
  const N2 = Math.ceil(songEnd / FPS) + 1;
  const pitchSegs = [...notes, ...moras.map((m, k) => ({ t0: m.preStart, t1: m.noteStart, midi: notes.find((n) => n.k === k).midi }))];
  const cents = new Float64Array(N2).fill(NaN);
  for (let j = 0; j < N2; j++) {
    const tt = j * FPS;
    const s = pitchSegs.find((q2) => tt >= q2.t0 && tt < q2.t1);
    if (s) cents[j] = s.midi * 100;
  }
  const half = Math.max(1, Math.round(OPT.portamentoMs / 2 / FP)), smooth = Float64Array.from(cents);
  for (let j = 0; j < N2; j++) {
    if (isNaN(cents[j])) continue;
    let s = 0, c = 0;
    for (let q2 = j - half; q2 <= j + half; q2++) if (q2 >= 0 && q2 < N2 && !isNaN(cents[q2])) {
      s += cents[q2];
      c++;
    }
    smooth[j] = s / c;
  }
  for (const n of notes) {
    const V = OPT.vibrato;
    if (n.t1 - n.t0 < V.minNote) continue;
    for (let j = Math.ceil((n.t0 + V.delay) / FPS); j * FPS < n.t1 && j < N2; j++) {
      const u2 = j * FPS - n.t0 - V.delay;
      smooth[j] += V.cents * Math.min(1, u2 / V.fadeIn) * Math.sin(2 * Math.PI * V.hz * u2);
    }
  }
  const onlyK = only ? SRC.slice(0, only.entry).reduce((a, e) => a + (e.moras || 1), 0) : -1;
  const onlyM = only ? moras[Math.min(onlyK, moras.length - 1)] : null;
  const J0 = onlyM ? Math.max(0, Math.floor(onlyM.preStart / FPS)) : 0, J1 = onlyM ? Math.min(N2, Math.ceil(onlyM.end / FPS) + 1) : N2, NN = J1 - J0;
  const sp = new Float64Array(NN * bins), ap = new Float64Array(NN * bins), f0 = new Float64Array(NN);
  let repaired = 0, vowelFrames = 0, atlasFrames = 0, holdFrames = 0, breaths = /* @__PURE__ */ new Map();
  const breathSp = /* @__PURE__ */ new Map();
  for (let j = J0; j < J1; j++) {
    const jj = j - J0;
    const tt = j * FPS, s = segs.find((q2) => tt >= q2.s0 && tt < q2.s1) ?? (tt >= songEnd ? segs[segs.length - 1] : null);
    if (!s) continue;
    const c = s.c0 + (Math.min(tt, s.s1) - s.s0) / (s.s1 - s.s0) * (s.c1 - s.c0), fi = Math.min(an2.frames - 1, c / FPS);
    const a = Math.floor(fi), b = Math.min(an2.frames - 1, a + 1), w = fi - a;
    for (let q2 = 0; q2 < bins; q2++) {
      sp[jj * bins + q2] = Math.exp((1 - w) * Math.log(an2.sp[a * bins + q2] + 1e-16) + w * Math.log(an2.sp[b * bins + q2] + 1e-16));
      ap[jj * bins + q2] = (1 - w) * an2.ap[a * bins + q2] + w * an2.ap[b * bins + q2];
    }
    const srcVoiced = an2.f0[a] > 0 || an2.f0[b] > 0, sung = !isNaN(smooth[j]);
    if (s.kind === "rest" || s.kind === "lead") {
      for (let q2 = 0; q2 < bins; q2++) sp[jj * bins + q2] *= 1e-6;
      const nk = s.kind === "lead" ? 0 : s.k + 1, mark = s.kind === "lead" ? "v" : moras[nk]?.mark ?? null;
      const restLen = s.s1 - s.s0, stolen = s.kind === "rest" && !!moras[s.k].stolen, longEnough = s.kind === "lead" || restLen >= OPT.breathMinRest * EIGHTH - 1e-6;
      const g = OPT.gap[mark === "O" ? "O" : "v"];
      if (BREATH && nk < moras.length && mark !== "^" && (stolen || longEnough)) {
        const bl = Math.min(g.max, 0.8 * restLen), b0 = s.s1 - bl, boost = 10 ** (g.db / 10);
        if (tt >= b0) {
          if (!breathSp.has(nk)) breathSp.set(nk, breathTemplate(moras[nk], midiOf(nk), nk));
          const u2 = (tt - b0) / bl, env = u2 < 0.7 ? 0.5 - 0.5 * Math.cos(Math.PI * u2 / 0.7) : 0.5 + 0.5 * Math.cos(Math.PI * (u2 - 0.7) / 0.3);
          const tpl = breathSp.get(nk);
          for (let q2 = 0; q2 < bins; q2++) {
            sp[jj * bins + q2] = Math.exp(tpl[q2]) * env * env * boost;
            ap[jj * bins + q2] = 1;
          }
          f0[jj] = 0;
          breaths.set(nk, mark === "O" ? "O" : "v");
        }
      }
    }
    if (s.kind === "vowel" && sung) {
      vowelFrames++;
      f0[jj] = 440 * 2 ** ((smooth[j] - 6900) / 1200);
      const m = moras[s.k];
      let changed = false;
      if (m.spClean) sp.set(m.spClean, jj * bins);
      for (let q2 = 0; q2 < bins; q2++) {
        const v = ap[jj * bins + q2], c2 = m.apClean[q2];
        if (v > c2) {
          ap[jj * bins + q2] = c2 + OPT.breath * (v - c2);
          changed = true;
        }
      }
      if (changed && !srcVoiced) repaired++;
      if (atlas && s.hold) {
        holdFrames++;
        const holdSeg = s.hold === true ? s : segs.find((q2) => q2.kind === "vowel" && q2.k === s.k && q2.hold === true);
        const tau = tt - (holdSeg ? holdSeg.s0 : s.s0), total = s.s1 - s.s0, xf = Math.max(1e-3, Math.min(OPT.atlasXfade, total / 3));
        let wa;
        if (s.hold === "tail") {
          wa = holdSeg ? MIX * (1 - (tt - s.s0) / total) : 0;
        } else {
          const fadeOut = moras[s.k].fade ? Math.min(1, (total - (tt - s.s0)) / xf) : 1;
          wa = MIX * Math.min(1, (tt - s.s0) / xf, fadeOut);
        }
        const fr = wa > 0 ? atlasFrame(m, midiOf(s.k), tau, s.k) : null;
        if (fr) {
          atlasFrames++;
          for (let q2 = 0; q2 < bins; q2++) {
            sp[jj * bins + q2] = Math.exp((1 - wa) * Math.log(sp[jj * bins + q2] + 1e-16) + wa * fr.logsp[q2]);
            ap[jj * bins + q2] = (1 - wa) * ap[jj * bins + q2] + wa * fr.ap[q2];
          }
        }
      }
    }
    const fm = s.kind === "vowel" ? moras[s.k].fade : s.kind === "cons" && s.hold === "coda" ? moras[s.k].codaFade : null;
    if (fm && tt >= fm[0]) {
      const g = Math.max(0.01, 1 - (tt - fm[0]) / (fm[1] - fm[0]));
      for (let q2 = 0; q2 < bins; q2++) sp[jj * bins + q2] *= g * g;
    }
    if (s.kind === "vowel" && s.k >= 0) {
      const m = moras[s.k], w2 = Math.min(1, Math.max(0, (tt - m.noteStart) / 0.03)), gg = 10 ** (w2 * m.gainDb / 10);
      for (let q2 = 0; q2 < bins; q2++) sp[jj * bins + q2] *= gg;
    } else if (s.kind === "cons" && sung && srcVoiced && noisiness(a) <= 0.5 && noisiness(b) <= 0.5) f0[jj] = 440 * 2 ** ((smooth[j] - 6900) / 1200);
  }
  const y = W.synth({ f0, sp, ap, fft: an2.fft, fs: SR2, framePeriod: FP });
  const worldMs = performance.now() - t0;
  function finish(sig) {
    const fade = Math.round(0.03 * SR2), n = sig.length, out = new Float32Array(n + Math.round(OPT.tail * SR2));
    let m = 1e-9;
    for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(sig[i]));
    for (let i = 0; i < n; i++) out[i] = sig[i] / m * 0.89 * (i > n - fade ? (n - i) / fade : 1);
    return out;
  }
  return { sung: finish(y), y, x, SR: SR2, finish, internals: {
    tokens,
    moras,
    notes,
    segs,
    an: an2,
    sp,
    ap,
    f0,
    N: N2,
    bins,
    FP,
    FPS,
    EIGHTH,
    songEnd,
    noisiness,
    atlas,
    breaths,
    repaired,
    vowelFrames,
    atlasFrames,
    holdFrames,
    piperMs,
    worldMs,
    ATLAS_VOWEL,
    midiOf,
    OPT
  } };
}

// src/singer/world-wrap.mjs
function wrapWorld(M) {
  const put = (arr) => {
    const p = M._malloc(arr.length * 8);
    M.HEAPF64.set(arr, p / 8);
    return p;
  };
  function analyze(x, fs2, { framePeriod = 5, f0Floor = 80, f0Ceil = 1e3 } = {}, hooks = null) {
    const px = put(Float64Array.from(x));
    try {
      hooks?.stage?.("f0");
      hooks?.check?.();
      const a = M._w_f0(px, x.length, fs2, framePeriod, f0Floor, f0Ceil);
      try {
        hooks?.stage?.("sp");
        hooks?.check?.();
        M._w_sp(a, px, x.length, fs2, f0Floor);
        hooks?.stage?.("ap");
        hooks?.check?.();
        M._w_ap(a, px, x.length, fs2);
        const frames = M._w_frames(a), fft = M._w_fft(a), bins = fft / 2 + 1;
        const view = (p, n) => M.HEAPF64.slice(p / 8, p / 8 + n);
        return { frames, fft, bins, framePeriod, fs: fs2, f0: view(M._w_f0_ptr(a), frames), sp: view(M._w_sp_ptr(a), frames * bins), ap: view(M._w_ap_ptr(a), frames * bins) };
      } finally {
        M._w_free(a);
      }
    } finally {
      M._free(px);
    }
  }
  function synth({ f0, sp, ap, fft, fs: fs2, framePeriod }) {
    const frames = f0.length, n = M._w_synth_len(frames, fs2, framePeriod);
    const pf = put(f0), ps2 = put(sp), pa = put(ap), py = M._malloc(n * 8);
    M._w_synth(pf, frames, ps2, pa, fft, fs2, framePeriod, py);
    const y = M.HEAPF64.slice(py / 8, py / 8 + n);
    [pf, ps2, pa, py].forEach((p) => M._free(p));
    return y;
  }
  return { analyze, synth };
}

// src/singer/speech-cache.ts
var f32 = new Float32Array(1);
var u32 = new Uint32Array(f32.buffer);
function toBf16(x) {
  const out = new Uint16Array(x.length);
  for (let i = 0; i < x.length; i++) {
    f32[0] = x[i];
    const b = u32[0];
    out[i] = b + 32767 + (b >>> 16 & 1) >>> 16 & 65535;
  }
  return out;
}
function fromBf16(x) {
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) {
    u32[0] = x[i] << 16;
    out[i] = f32[0];
  }
  return out;
}
var SpeechCache = class {
  map = /* @__PURE__ */ new Map();
  // 插入顺序 = 最久没用的在前
  bytes = 0;
  /** 分析按它来自哪段 piper 输出记（同一个 Float32Array 对象 → 同一次念） */
  audioKey = /* @__PURE__ */ new WeakMap();
  /** 最近一次解好码的分析（按键试听连按同一句：不用每次把 bf16 解成 Float64 ≈ 1M 个数）。交出去的不拷贝——唱法核心不就地改这些数组（core 里 grep 过）。 */
  hot = null;
  hits = 0;
  misses = 0;
  diskHits = 0;
  budget;
  store = null;
  model = "";
  touched = /* @__PURE__ */ new Map();
  // 盘上的 at 一分钟最多碰一次
  diskKeys = /* @__PURE__ */ new Map();
  // 内存键 → 盘键（算过一次就记着）
  warned = false;
  constructor(budget = 32e6) {
    this.budget = budget;
  }
  // 不用参数属性：Node 的 strip-only TS 不认
  get used() {
    return this.bytes;
  }
  setBudget(b) {
    this.budget = b;
    this.trim();
  }
  touch(k, e) {
    this.map.delete(k);
    this.map.set(k, e);
  }
  put(k, e) {
    const old = this.map.get(k);
    if (old) {
      this.bytes -= old.bytes;
      this.map.delete(k);
    }
    this.map.set(k, e);
    this.bytes += e.bytes;
    this.trim();
  }
  trim() {
    for (const [k, e] of this.map) {
      if (this.bytes <= this.budget) break;
      this.map.delete(k);
      this.bytes -= e.bytes;
    }
  }
  clear() {
    this.map.clear();
    this.bytes = 0;
    this.hot = null;
  }
  /** 接上持久层；model = 模型配置标签（语音包 + 运行时包的 id）：换模型 = 另一组键。 */
  attachStore(store2, model) {
    this.store = store2;
    this.model = model;
    this.diskKeys.clear();
  }
  get disk() {
    return this.store;
  }
  async diskKey(kind, memKey, sub = "") {
    const id = `${kind}|${memKey}`;
    let h = this.diskKeys.get(id);
    if (!h) {
      h = await sha256(memKey);
      this.diskKeys.set(id, h);
    }
    return `${this.model}|${kind}|${h}${sub}`;
  }
  diskFail(e) {
    if (this.warned) return;
    this.warned = true;
    console.warn("speech store: " + (e?.message ?? e));
  }
  touchDisk(diskKey) {
    const t = Date.now();
    if ((this.touched.get(diskKey) ?? 0) > t - 6e4) return;
    this.touched.set(diskKey, t);
    this.store?.touch(diskKey).catch((e) => this.diskFail(e));
  }
  /** run 回来那一刻：这一句念的分析（可能几份：不同 fs / 参数）从盘上预取进内存，让同步的 analyze 能命中。 */
  async prefetchAnalyses(pKey) {
    if (!this.store) return;
    for (const k of this.map.keys()) if (k.startsWith(`a:${pKey}:`)) return;
    try {
      const prefix = await this.diskKey("a", pKey, "|");
      for (const { key, e } of await this.store.scan(prefix)) {
        if (e.kind !== "a" || this.map.has(e.k)) continue;
        this.put(e.k, { bytes: e.bytes, an: { meta: e.meta, f0: e.f0, sp: e.sp, ap: e.ap } });
        this.diskKeys.set(`a|${e.k}`, key.slice(prefix.length - 1 - 64, prefix.length - 1));
        this.diskHits++;
      }
    } catch (e) {
      this.diskFail(e);
    }
  }
  wrapPiper(piper) {
    const self2 = this, run = piper.run.bind(piper);
    return { ...piper, run: async (ids, pros, o) => {
      const k = "p:" + JSON.stringify([ids, pros, o]);
      let had = self2.map.get(k);
      if (!had?.run && self2.store) {
        try {
          const dk = await self2.diskKey("p", k), e = await self2.store.get(dk);
          if (e?.kind === "p") {
            had = { bytes: e.bytes, run: { audio: e.audio, durations: e.durations } };
            self2.put(k, had);
            self2.diskHits++;
            self2.touchDisk(dk);
          }
        } catch (e) {
          self2.diskFail(e);
        }
      }
      if (had?.run) {
        self2.hits++;
        self2.touch(k, had);
        const a = had.run.audio.slice();
        self2.audioKey.set(a, k);
        await self2.prefetchAnalyses(k);
        return { audio: a, durations: had.run.durations?.slice() };
      }
      self2.misses++;
      const r = await run(ids, pros, o);
      const keep = { audio: r.audio.slice(), durations: r.durations?.slice() };
      self2.put(k, { bytes: keep.audio.byteLength + (keep.durations?.byteLength ?? 0), run: keep });
      self2.audioKey.set(r.audio, k);
      if (self2.store) void self2.diskKey("p", k).then((dk) => self2.store.put(dk, { kind: "p", k, bytes: keep.audio.byteLength + (keep.durations?.byteLength ?? 0), audio: keep.audio, durations: keep.durations })).catch((e) => self2.diskFail(e));
      await self2.prefetchAnalyses(k);
      return r;
    } };
  }
  wrapWorld(world) {
    const self2 = this, analyze = world.analyze.bind(world);
    return { ...world, analyze: (x, fs2, o, hooks = null) => {
      const from = x instanceof Float32Array ? self2.audioKey.get(x) : void 0;
      const k = from ? `a:${from}:${fs2}:${JSON.stringify(o ?? {})}` : null;
      const had = k ? self2.map.get(k) : void 0;
      if (had?.an) {
        self2.hits++;
        self2.touch(k, had);
        hooks?.stage?.("cached");
        hooks?.check?.();
        if (self2.store && from) void self2.diskKey("a", from, `|${self2.diskKeys.get(`a|${k}`) ?? ""}`).then((dk) => {
          if (self2.diskKeys.has(`a|${k}`)) self2.touchDisk(dk);
        }).catch(() => void 0);
        if (self2.hot?.key === k) return self2.hot.an;
        const an3 = { ...had.an.meta, f0: had.an.f0.slice(), sp: fromBf16(had.an.sp), ap: fromBf16(had.an.ap) };
        self2.hot = { key: k, an: an3 };
        return an3;
      }
      self2.misses++;
      const an2 = analyze(x, fs2, o, hooks), { f0, sp, ap, ...meta } = an2, spB = toBf16(sp), apB = toBf16(ap);
      if (k) {
        const bytes2 = f0.byteLength + spB.byteLength + apB.byteLength, f0c = f0.slice();
        self2.put(k, { bytes: bytes2, an: { meta, f0: f0c, sp: spB, ap: apB } });
        if (self2.store && from) void Promise.all([self2.diskKey("a", from, "|"), sha256(k)]).then(([pre, h]) => {
          self2.diskKeys.set(`a|${k}`, h);
          return self2.store.put(pre + h, { kind: "a", k, bytes: bytes2, meta: structuredClone(meta), f0: f0c, sp: spB, ap: apB });
        }).catch((e) => self2.diskFail(e));
      }
      const outAn = { ...meta, f0, sp: fromBf16(spB), ap: fromBf16(apB) };
      if (k) self2.hot = { key: k, an: outAn };
      return outAn;
    } };
  }
};
async function sha256(text) {
  const sub = globalThis.crypto?.subtle;
  if (sub) {
    const d = await sub.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(d)].map((b2) => b2.toString(16).padStart(2, "0")).join("");
  }
  let a = 2166136261, b = 16777619 ^ 1540483477;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 16777619);
    b = Math.imul(b ^ c, 16777619) ^ b >>> 13;
  }
  return ((a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0")).padEnd(64, "0");
}

// src/singer/speech-store.ts
var STORE = "entries";
var META = "meta";
var DB_VERSION = 1;
var req = (r) => new Promise((ok, fail) => {
  r.onsuccess = () => ok(r.result);
  r.onerror = () => fail(r.error ?? new Error("idb"));
});
var done = (tx) => new Promise((ok, fail) => {
  tx.oncomplete = () => ok();
  tx.onerror = () => fail(tx.error ?? new Error("idb tx"));
  tx.onabort = () => fail(tx.error ?? new Error("idb abort"));
});
var strip = (r) => {
  const { key: _k, at: _a, ...e } = r;
  return e;
};
async function openSpeechStore(name, budget) {
  const idb = globalThis.indexedDB;
  if (!idb) return null;
  let db;
  try {
    db = await new Promise((ok, fail) => {
      const r = idb.open(name, DB_VERSION);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "key" }).createIndex("at", "at");
        if (!d.objectStoreNames.contains(META)) d.createObjectStore(META, { keyPath: "key" });
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => fail(r.error ?? new Error("idb open"));
      r.onblocked = () => fail(new Error("idb blocked"));
    });
  } catch {
    return null;
  }
  let budgetNow = budget;
  const total = async (tx) => (await req(tx.objectStore(META).get("total")))?.bytes ?? 0;
  const setTotal = (tx, bytes2) => tx.objectStore(META).put({ key: "total", bytes: Math.max(0, bytes2) });
  return {
    async get(key) {
      const tx = db.transaction(STORE, "readonly"), r = await req(tx.objectStore(STORE).get(key));
      return r ? strip(r) : null;
    },
    async put(key, e) {
      const tx = db.transaction([STORE, META], "readwrite"), s = tx.objectStore(STORE);
      const old = await req(s.get(key));
      let t = await total(tx) - (old?.bytes ?? 0) + e.bytes;
      s.put({ key, at: Date.now(), ...e });
      if (t > budgetNow) {
        const cur = s.index("at").openCursor();
        await new Promise((ok, fail) => {
          cur.onerror = () => fail(cur.error ?? new Error("idb cursor"));
          cur.onsuccess = () => {
            const c = cur.result;
            if (!c || t <= budgetNow) {
              ok();
              return;
            }
            const r = c.value;
            if (r.key !== key) {
              t -= r.bytes;
              c.delete();
            }
            c.continue();
          };
        });
      }
      setTotal(tx, t);
      await done(tx);
    },
    async scan(prefix) {
      const tx = db.transaction(STORE, "readonly");
      const rs2 = await req(tx.objectStore(STORE).getAll(IDBKeyRange.bound(prefix, prefix + "\uFFFF")));
      return rs2.map((r) => ({ key: r.key, e: strip(r) }));
    },
    async touch(key) {
      const tx = db.transaction(STORE, "readwrite"), s = tx.objectStore(STORE), r = await req(s.get(key));
      if (r) {
        r.at = Date.now();
        s.put(r);
      }
      await done(tx);
    },
    async info() {
      const tx = db.transaction([STORE, META], "readonly");
      const [bytes2, entries] = await Promise.all([total(tx), req(tx.objectStore(STORE).count())]);
      return { bytes: bytes2, entries, budget: budgetNow };
    },
    async clear() {
      const tx = db.transaction([STORE, META], "readwrite");
      tx.objectStore(STORE).clear();
      setTotal(tx, 0);
      await done(tx);
    },
    setBudget(b) {
      budgetNow = b;
    }
  };
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
  update(bytes2) {
    if (this.done)
      throw new Error("Sha256: update after hex()");
    let i = 0;
    this.total += bytes2.length;
    if (this.bufLen) {
      const take = Math.min(64 - this.bufLen, bytes2.length);
      this.buf.set(bytes2.subarray(0, take), this.bufLen);
      this.bufLen += take;
      i = take;
      if (this.bufLen === 64) {
        this.block(this.buf, 0);
        this.bufLen = 0;
      }
    }
    for (; i + 64 <= bytes2.length; i += 64)
      this.block(bytes2, i);
    if (i < bytes2.length) {
      this.buf.set(bytes2.subarray(i), 0);
      this.bufLen = bytes2.length - i;
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
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let t = 0; t < 64; t++) {
      const S1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
      const ch = e & f ^ ~e & g;
      const t1 = h + S1 + ch + K[t] + w[t] | 0;
      const S0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
      const maj = a & b ^ a & c ^ b & c;
      const t2 = S0 + maj | 0;
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    H[0] += a;
    H[1] += b;
    H[2] += c;
    H[3] += d;
    H[4] += e;
    H[5] += f;
    H[6] += g;
    H[7] += h;
  }
  hex() {
    if (this.done)
      throw new Error("Sha256: hex() twice");
    const total = this.total;
    const padLen = (this.bufLen < 56 ? 56 - this.bufLen : 120 - this.bufLen) + 8;
    const pad = new Uint8Array(padLen);
    pad[0] = 128;
    const bits = total * 8, hi = Math.floor(bits / 4294967296), lo2 = bits >>> 0, n = padLen;
    pad[n - 8] = hi >>> 24;
    pad[n - 7] = hi >>> 16;
    pad[n - 6] = hi >>> 8;
    pad[n - 5] = hi;
    pad[n - 4] = lo2 >>> 24;
    pad[n - 3] = lo2 >>> 16;
    pad[n - 2] = lo2 >>> 8;
    pad[n - 1] = lo2;
    this.total -= padLen;
    this.update(pad);
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
  async function putChunk(slug, name, bytes2) {
    const cache = await openCache();
    const size = bytes2 instanceof Blob ? bytes2.size : bytes2.length;
    await cache.put(keyOf(slug, name), new Response(bytes2, { headers: { "content-length": String(size), "content-type": "application/octet-stream" } }));
  }
  async function markVerified(slug, packId) {
    const cache = await openCache();
    await cache.put(keyOf(slug, "verified.json"), new Response(JSON.stringify({ packId, at: (/* @__PURE__ */ new Date()).toISOString() }), { headers: { "content-type": "application/json" } }));
  }
  async function status(slug) {
    const { packId, manifest: m } = manifestOf(slug);
    const cache = await openCache();
    const sizes = await cachedChunkSizes(slug, m);
    const complete = sizes.every((n, i) => n === m.chunks[i].bytes);
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
    if (!sizes.every((n, i) => n === m.chunks[i].bytes))
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
    let done2 = sizes.reduce((a, n, i) => a + (n === m.chunks[i].bytes ? n : 0), 0);
    progress({ done: done2, total: m.totalBytes });
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
          progress({ done: done2 + got, total: m.totalBytes });
        }
      }
      if (got !== c.bytes)
        throw new Error(`${c.name}: got ${got} bytes, expected ${c.bytes}`);
      if (sha.hex() !== c.sha256)
        throw new Error(`${c.name}: sha256 mismatch (source tampered or corrupted)`);
      await putChunk(slug, c.name, buf);
      done2 += got;
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
    let done2 = 0, matched = 0;
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
          progress({ done: done2 + offset, total });
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
      done2 += f.size;
      progress({ done: done2, total });
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
    const have = (await Promise.all(slugs.map(status))).map((st) => st.bytesCached);
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
var SINGER = { "voice": "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007", "runtime": "runtime-onnxruntime-web-1.30.0-20261001", "lang": { "ja": "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001", "zh": "lang-zh-pinyin-20261001", "en": "lang-en-cmudict-20261001" } };
var PACKS = {
  "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007": { "packId": "56d81c8eb51e693e937397e2557ac3af4dff328e420b761c6e5df8b8b5b80ca6", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 25165824, "name": "chunk-000", "sha256": "269d70de8efb9ef41cdfd5de0a4acd220eb263163c8d1586c2b627c8cb1eaec6" }, { "bytes": 14503410, "name": "chunk-001", "sha256": "56131bbd5133d34a5d7cf4bd668c83a2da1fe8157fbbb849a94c4d1b9569b4ff" }], "createdAt": "2026-10-07", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "piper-plus-voice", "sampleRate": 22050, "speakers": 1 }, "files": [{ "bytes": 39662905, "offset": 0, "path": "model.onnx", "sha256": "d10f3806abeda0ec9ee294d0e39ef5f3884c47b4b09028d23375b71db4107712" }, { "bytes": 6329, "offset": 39662905, "path": "config.json", "sha256": "f6a373726beef08f9094e97f434185b1f9840b76ced0a73281fc40023b02d02d" }], "lang": ["ja", "en", "zh", "es", "fr", "pt"], "license": { "attribution": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\uFF08CV.\u5922\u524D\u9ECE\uFF09https://tyc.rei-yumesaki.net/material/corpus/ \uFF1Bmodel: derivative of ayousanz/piper-plus-tsukuyomi-chan; zh/en language vectors from ayousanz/piper-plus-base (CC-BY-4.0)", "file": "LICENSE.txt", "name": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04\uFF08\u884D\u751F\u6A21\u578B\uFF1Bmodel card: license other / tsukuyomi-chan-corpus\uFF09+ base model CC-BY-4.0", "sha256": "ff76774a797dfedbd00d6b0b167cebf5ceb341d380d865ed4cba495310ace4d9" }, "name": "\u6708\u8BFB\uFF08\u4E2D\u82F1\u589E\u5F3A\uFF0C\u65F6\u957F\u53EF\u63A5\u7BA1\uFF09\u2014 \u3064\u304F\u3088\u307F\u3061\u3083\u3093 piper-plus \u516D\u8BED\u5355\u97F3\u8272\uFF0Cfp16\uFF0C\u4E2D\u82F1\u6539\u8BFB\u5E95\u6A21\u7684\u8BED\u8A00\u5411\u91CF + dur_override \u8F93\u5165\uFF08\u5531\u6B4C\u7528\uFF09", "notes": "Modified model (see LICENSE.txt \xA7[4]). Needs the runtime pack (onnxruntime-web) and one text-frontend pack per language. With dur_override all zeros it reads exactly like voice-tsukuyomi-chan-zhen-6lang-fp16-20261002. The credit block and the four prohibited uses must be shown in the product UI.", "sha256": "466803b3eba2be734c26955c1b701a7e64e566a3e997474c4c744666768e56f9", "slug": "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007", "source": { "converted": "dur_override input on top of voice-tsukuyomi-chan-zhen-6lang-fp16-20261002 (see LICENSE.txt \xA7[4]); all zeros = that pack, sample-identical", "file": "voice-tsukuyomi-chan-zhen-6lang-fp16-20261002/model.onnx @ sha256 ae7ab68a\u2026 + piper-plus/dur-override-exp/make_dur_override.py; config.json = that pack's", "model": "https://huggingface.co/ayousanz/piper-plus-tsukuyomi-chan" }, "task": "tts", "totalBytes": 39669234, "v": 1 } },
  "runtime-onnxruntime-web-1.30.0-20261001": { "packId": "f76668f9383b922aef483f4c0a374fb727b9a9203d230cb2fceabb34fc4459be", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 3687160, "name": "chunk-000", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "onnxruntime-web", "engineConfig": { "kind": "wasm-runtime", "version": "1.30.0" }, "files": [{ "bytes": 3687160, "offset": 0, "path": "ort-wasm-simd-threaded.wasm.gz", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788" }], "lang": [""], "license": { "attribution": "ONNX Runtime (Microsoft)", "file": "LICENSE.txt", "name": "MIT (Microsoft, onnxruntime)", "sha256": "2f07c72751aed99790b8a4869cf2311df85a860b22ded05fa22803587a48922c" }, "name": "onnxruntime-web 1.30.0\uFF08WASM \u63A8\u7406\u8FD0\u884C\u65F6\uFF0C\u5355\u7EBF\u7A0B SIMD\uFF09", "notes": "Engine binary. The matching JS glue (ort.wasm.bundle.min.mjs) is vendored in the app, not in this pack.", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788", "slug": "runtime-onnxruntime-web-1.30.0-20261001", "source": { "converted": "", "file": "dist/ort-wasm-simd-threaded.wasm (unmodified)", "model": "https://www.npmjs.com/package/onnxruntime-web/v/1.30.0" }, "task": "runtime", "totalBytes": 3687160, "v": 1 } },
  "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001": { "packId": "b66632d8ab153a865e2727d745794da248a9c748558920bfd004443cdb9f2d4c", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 24471527, "name": "chunk-000", "sha256": "3e1d7f8ff18204a56d4170da09258cf655bb01bb61114bcd84e8bb2441941b60" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "ja" }, "files": [{ "bytes": 22438129, "offset": 0, "path": "ja/sys.dic.gz", "sha256": "b1804e8c2e6244bb36c7c24eb5af9d4307a80acfb481dcffdc71c7aa60ede055" }, { "bytes": 1867237, "offset": 22438129, "path": "ja/matrix.bin.gz", "sha256": "824f60e50360fb2b186b16d1fe5fd6312919f03c33a73bc86ece37a301b3f0b8" }, { "bytes": 643, "offset": 24305366, "path": "ja/char.bin.gz", "sha256": "335d6f4a6c6cd50ab1d0782dbf6b13ab9e2bed08ed1fd34c97d499d4a05fb665" }, { "bytes": 782, "offset": 24306009, "path": "ja/unk.dic.gz", "sha256": "03721395b79e257fbd2b0e742a4faaed6073ecb79b0cf615fbe352995581b603" }, { "bytes": 147207, "offset": 24306791, "path": "ja/ojt.wasm.gz", "sha256": "97a8738abbdc773b4785b1f6ba849c432a5764cf13c1637df4da630a82f45f8a" }, { "bytes": 17529, "offset": 24453998, "path": "ja/nani-model.json.gz", "sha256": "0427c6cfe53f6c4d771f6c3e50fea06ddeaac96f5e24bdab4f49493395c9630a" }], "lang": ["ja"], "license": { "attribution": "Open JTalk (Nagoya Institute of Technology); MeCab (Taku Kudo, NTT); NAIST Japanese Dictionary; pyopenjtalk / pyopenjtalk-plus (tsukumijima et al.)", "file": "LICENSE.txt", "name": "Modified BSD (Open JTalk) + BSD (MeCab) + BSD-3-Clause style (NAIST-jdic / Open JTalk dictionary) + MIT (pyopenjtalk-plus)", "sha256": "b8dd3d66249df450fc71f3f8f8f29da02b5b01b8b47c03f412af8bc16090c1bb" }, "name": "\u65E5\u8BED\u6587\u672C\u524D\u7AEF\uFF08OpenJTalk + pyopenjtalk-plus \u8BCD\u5178\uFF09", "notes": "ojt.wasm is an engine binary built on 2026-10-01 from the upstream sources (wrapper source: backend/vendor/ojt/ojt_wasm.c). 160 MB initial heap.", "sha256": "3e1d7f8ff18204a56d4170da09258cf655bb01bb61114bcd84e8bb2441941b60", "slug": "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001", "source": { "converted": "", "file": "dictionary: wheel pyopenjtalk/dictionary/; ojt.wasm: built from the sdist (sha256 cdcb0746659857554c6dad23956cad77e21f76c9f3dfa000ea2f8d4f0ba11d99) with Emscripten 6.0.10; nani-model.json: exported from pyopenjtalk/yomi_model/", "model": "https://pypi.org/project/pyopenjtalk-plus/0.4.1.post9/" }, "task": "tts-frontend", "totalBytes": 24471527, "v": 1 } },
  "lang-zh-pinyin-20261001": { "packId": "a84c73d781c805a65b73deb3b39ac9f5fedd15f0cdf3d66b925005c8152af9e3", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 686220, "name": "chunk-000", "sha256": "acad023c61ddf4ed42720c63be1b35737cff734cbf4a6c8ab671b50f7fe39ae1" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "zh" }, "files": [{ "bytes": 186217, "offset": 0, "path": "zh/pinyin_single.tone3.json.gz", "sha256": "ec5c44ed3cd18eda41a04a7831f8d069600cdfb19e55e5b001a42bbdf3a4ad82" }, { "bytes": 500003, "offset": 186217, "path": "zh/pinyin_phrases.tone3.json.gz", "sha256": "43dd0534a63c6bddb4c0f20ee88f19f5933875ff3979acc777652028a66f5ba8" }], "lang": ["zh"], "license": { "attribution": "pypinyin, pinyin-data, phrase-pinyin-data (mozillazg)", "file": "LICENSE.txt", "name": "MIT (pypinyin / pinyin-data / phrase-pinyin-data)", "sha256": "82783f291266e986df7494586db072217e2940227f93208f4f920a53b7a7d91e" }, "name": "\u4E2D\u6587\u62FC\u97F3\u8BCD\u5178\uFF08pypinyin \u6570\u636E\uFF09", "notes": "Tone marks converted to tone-number style (the form the model's phoneme table expects).", "sha256": "acad023c61ddf4ed42720c63be1b35737cff734cbf4a6c8ab671b50f7fe39ae1", "slug": "lang-zh-pinyin-20261001", "source": { "converted": "", "file": "piper-plus 82ee4e7 src/rust/piper-plus-g2p/data/pinyin_{single,phrases}.json, tone marks converted to tone numbers", "model": "https://github.com/ayutaz/piper-plus" }, "task": "tts-frontend", "totalBytes": 686220, "v": 1 } },
  "lang-en-cmudict-20261001": { "packId": "e54e7243870cef39d5015a51fe7fc57917da946908223a3d5baa5cab85956226", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 868090, "name": "chunk-000", "sha256": "21dc3f65ea440c904746ee1ee59a2e24c88aaf0696b1450b0aedcc001aca1926" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "en" }, "files": [{ "bytes": 863232, "offset": 0, "path": "en/cmudict_data.json.gz", "sha256": "3083a0cf26e01398a6877c8834150f03a230baf6965832b00bfae699063208f4" }, { "bytes": 4858, "offset": 863232, "path": "en/homographs.json.gz", "sha256": "2ef14b6d49476790fdb2008150d417cb9069f7dcb74c25706a43bcc3fe5c4187" }], "lang": ["en"], "license": { "attribution": "CMU Pronouncing Dictionary (Carnegie Mellon University); g2p-en (Kyubyong Park & Jongseok Kim)", "file": "LICENSE.txt", "name": "BSD-2-Clause style (CMU Pronouncing Dictionary) + Apache-2.0 (g2p-en homographs)", "sha256": "3d3a944042879fa3c5a25c317ea7e609c0efa7cf0900c0c298ba331953c27039" }, "name": "\u82F1\u8BED\u53D1\u97F3\u8BCD\u5178\uFF08CMUdict + \u540C\u5F62\u5F02\u97F3\u8868\uFF09", "notes": "homographs.json is a format conversion of g2p-en's homographs.en (Apache-2.0 \xA74: modified file notice).", "sha256": "21dc3f65ea440c904746ee1ee59a2e24c88aaf0696b1450b0aedcc001aca1926", "slug": "lang-en-cmudict-20261001", "source": { "converted": "", "file": "cmudict_data.json: piper-plus 82ee4e7 src/rust/piper-plus-g2p/data/; homographs.json: PyPI g2p-en 2.1.0 g2p_en/homographs.en converted to JSON (content unchanged)", "model": "https://github.com/ayutaz/piper-plus" }, "task": "tts-frontend", "totalBytes": 868090, "v": 1 } }
};

// node_modules/@internal/read-aloud/backend/piper-plus/vendor/onnxruntime-web/ort.wasm.bundle.min.mjs
var ort_wasm_bundle_min_exports = {};
__export(ort_wasm_bundle_min_exports, {
  InferenceSession: () => rs,
  TRACE: () => Cr,
  TRACE_EVENT_BEGIN: () => Pe,
  TRACE_EVENT_END: () => Ue,
  TRACE_FUNC_BEGIN: () => _e,
  TRACE_FUNC_END: () => De,
  Tensor: () => de,
  default: () => iu,
  env: () => Y,
  registerBackend: () => Je
});
var qt = Object.defineProperty;
var Qa = Object.getOwnPropertyDescriptor;
var Ka = Object.getOwnPropertyNames;
var es = Object.prototype.hasOwnProperty;
var Jt = ((n) => typeof __require < "u" ? __require : typeof Proxy < "u" ? new Proxy(n, { get: (t, a) => (typeof __require < "u" ? __require : t)[a] }) : n)(function(n) {
  if (typeof __require < "u") return __require.apply(this, arguments);
  throw Error('Dynamic require of "' + n + '" is not supported');
});
var N = (n, t, a) => () => {
  if (a) throw a[0];
  try {
    return n && (t = n(n = 0)), t;
  } catch (u2) {
    throw a = [u2], u2;
  }
};
var ut = (n, t) => {
  for (var a in t) qt(n, a, { get: t[a], enumerable: true });
};
var ts = (n, t, a, u2) => {
  if (t && typeof t == "object" || typeof t == "function") for (let o of Ka(t)) !es.call(n, o) && o !== a && qt(n, o, { get: () => t[o], enumerable: !(u2 = Qa(t, o)) || u2.enumerable });
  return n;
};
var Xt = (n) => ts(qt({}, "__esModule", { value: true }), n);
var ft;
var Be;
var Je;
var ns;
var pr;
var Zt = N(() => {
  "use strict";
  ft = /* @__PURE__ */ new Map(), Be = [], Je = (n, t, a) => {
    if (t && typeof t.init == "function" && typeof t.createInferenceSessionHandler == "function") {
      let u2 = ft.get(n);
      if (u2 === void 0) ft.set(n, { backend: t, priority: a });
      else {
        if (u2.priority > a) return;
        if (u2.priority === a && u2.backend !== t) throw new Error(`cannot register backend "${n}" using priority ${a}`);
      }
      if (a >= 0) {
        let o = Be.indexOf(n);
        o !== -1 && Be.splice(o, 1);
        for (let d = 0; d < Be.length; d++) if (ft.get(Be[d]).priority <= a) {
          Be.splice(d, 0, n);
          return;
        }
        Be.push(n);
      }
      return;
    }
    throw new TypeError("not a valid backend");
  }, ns = async (n) => {
    let t = ft.get(n);
    if (!t) return "backend not found.";
    if (t.initialized) return t.backend;
    if (t.aborted) return t.error;
    {
      let a = !!t.initPromise;
      try {
        return a || (t.initPromise = t.backend.init(n)), await t.initPromise, t.initialized = true, t.backend;
      } catch (u2) {
        return a || (t.error = `${u2}`, t.aborted = true), t.error;
      } finally {
        delete t.initPromise;
      }
    }
  }, pr = async (n) => {
    let t = n.executionProviders || [], a = t.map((m) => typeof m == "string" ? m : m.name), u2 = a.length === 0 ? Be : a, o, d = [], c = /* @__PURE__ */ new Set();
    for (let m of u2) {
      let h = await ns(m);
      typeof h == "string" ? d.push({ name: m, err: h }) : (o || (o = h), o === h && c.add(m));
    }
    if (!o) throw new Error(`no available backend found. ERR: ${d.map((m) => `[${m.name}] ${m.err}`).join(", ")}`);
    for (let { name: m, err: h } of d) a.includes(m) && console.warn(`removing requested execution provider "${m}" from session options because it is not available: ${h}`);
    let l = t.filter((m) => c.has(typeof m == "string" ? m : m.name));
    return [o, new Proxy(n, { get: (m, h) => h === "executionProviders" ? l : Reflect.get(m, h) })];
  };
});
var mr = N(() => {
  "use strict";
  Zt();
});
var hr;
var wr = N(() => {
  "use strict";
  hr = "1.30.0";
});
var br;
var q;
var Qt = N(() => {
  "use strict";
  wr();
  br = "warning", q = { wasm: {}, webgl: {}, webgpu: {}, versions: { common: hr }, set logLevel(n) {
    if (n !== void 0) {
      if (typeof n != "string" || ["verbose", "info", "warning", "error", "fatal"].indexOf(n) === -1) throw new Error(`Unsupported logging level: ${n}`);
      br = n;
    }
  }, get logLevel() {
    return br;
  } };
  Object.defineProperty(q, "logLevel", { enumerable: true });
});
var Y;
var yr = N(() => {
  "use strict";
  Qt();
  Y = q;
});
var gr;
var Er;
var Tr = N(() => {
  "use strict";
  gr = (n, t) => {
    let a = typeof document < "u" ? document.createElement("canvas") : new OffscreenCanvas(1, 1);
    a.width = n.dims[3], a.height = n.dims[2];
    let u2 = a.getContext("2d");
    if (u2 != null) {
      let o, d;
      t?.tensorLayout !== void 0 && t.tensorLayout === "NHWC" ? (o = n.dims[2], d = n.dims[3]) : (o = n.dims[3], d = n.dims[2]);
      let c = t?.format !== void 0 ? t.format : "RGB", l = t?.norm, m, h;
      l === void 0 || l.mean === void 0 ? m = [255, 255, 255, 255] : typeof l.mean == "number" ? m = [l.mean, l.mean, l.mean, l.mean] : (m = [l.mean[0], l.mean[1], l.mean[2], 0], l.mean[3] !== void 0 && (m[3] = l.mean[3])), l === void 0 || l.bias === void 0 ? h = [0, 0, 0, 0] : typeof l.bias == "number" ? h = [l.bias, l.bias, l.bias, l.bias] : (h = [l.bias[0], l.bias[1], l.bias[2], 0], l.bias[3] !== void 0 && (h[3] = l.bias[3]));
      let g = d * o, b = 0, y = g, T = g * 2, I = -1;
      c === "RGBA" ? (b = 0, y = g, T = g * 2, I = g * 3) : c === "RGB" ? (b = 0, y = g, T = g * 2) : c === "RBG" && (b = 0, T = g, y = g * 2);
      for (let D = 0; D < d; D++) for (let $ = 0; $ < o; $++) {
        let v = (n.data[b++] - h[0]) * m[0], A = (n.data[y++] - h[1]) * m[1], F = (n.data[T++] - h[2]) * m[2], P = I === -1 ? 255 : (n.data[I++] - h[3]) * m[3];
        u2.fillStyle = "rgba(" + v + "," + A + "," + F + "," + P + ")", u2.fillRect($, D, 1, 1);
      }
      if ("toDataURL" in a) return a.toDataURL();
      throw new Error("toDataURL is not supported");
    } else throw new Error("Can not access image data");
  }, Er = (n, t) => {
    let a = typeof document < "u" ? document.createElement("canvas").getContext("2d") : new OffscreenCanvas(1, 1).getContext("2d"), u2;
    if (a != null) {
      let o, d, c;
      t?.tensorLayout !== void 0 && t.tensorLayout === "NHWC" ? (o = n.dims[2], d = n.dims[1], c = n.dims[3]) : (o = n.dims[3], d = n.dims[2], c = n.dims[1]);
      let l = t !== void 0 && t.format !== void 0 ? t.format : "RGB", m = t?.norm, h, g;
      m === void 0 || m.mean === void 0 ? h = [255, 255, 255, 255] : typeof m.mean == "number" ? h = [m.mean, m.mean, m.mean, m.mean] : (h = [m.mean[0], m.mean[1], m.mean[2], 255], m.mean[3] !== void 0 && (h[3] = m.mean[3])), m === void 0 || m.bias === void 0 ? g = [0, 0, 0, 0] : typeof m.bias == "number" ? g = [m.bias, m.bias, m.bias, m.bias] : (g = [m.bias[0], m.bias[1], m.bias[2], 0], m.bias[3] !== void 0 && (g[3] = m.bias[3]));
      let b = d * o;
      if (t !== void 0 && (t.format !== void 0 && c === 4 && t.format !== "RGBA" || c === 3 && t.format !== "RGB" && t.format !== "BGR")) throw new Error("Tensor format doesn't match input tensor dims");
      let y = 4, T = 0, I = 1, D = 2, $ = 3, v = 0, A = b, F = b * 2, P = -1;
      l === "RGBA" ? (v = 0, A = b, F = b * 2, P = b * 3) : l === "RGB" ? (v = 0, A = b, F = b * 2) : l === "RBG" && (v = 0, F = b, A = b * 2), u2 = a.createImageData(o, d);
      for (let k = 0; k < d * o; T += y, I += y, D += y, $ += y, k++) u2.data[T] = (n.data[v++] - g[0]) * h[0], u2.data[I] = (n.data[A++] - g[1]) * h[1], u2.data[D] = (n.data[F++] - g[2]) * h[2], u2.data[$] = P === -1 ? 255 : (n.data[P++] - g[3]) * h[3];
    } else throw new Error("Can not access image data");
    return u2;
  };
});
var Kt;
var Sr;
var vr;
var Ar;
var Or;
var Ir;
var Br = N(() => {
  "use strict";
  ct();
  Kt = (n, t) => {
    if (n === void 0) throw new Error("Image buffer must be defined");
    if (t.height === void 0 || t.width === void 0) throw new Error("Image height and width must be defined");
    if (t.tensorLayout === "NHWC") throw new Error("NHWC Tensor layout is not supported yet");
    let { height: a, width: u2 } = t, o = t.norm ?? { mean: 255, bias: 0 }, d, c;
    typeof o.mean == "number" ? d = [o.mean, o.mean, o.mean, o.mean] : d = [o.mean[0], o.mean[1], o.mean[2], o.mean[3] ?? 255], typeof o.bias == "number" ? c = [o.bias, o.bias, o.bias, o.bias] : c = [o.bias[0], o.bias[1], o.bias[2], o.bias[3] ?? 0];
    let l = t.format !== void 0 ? t.format : "RGBA", m = t.tensorFormat !== void 0 && t.tensorFormat !== void 0 ? t.tensorFormat : "RGB", h = a * u2, g = m === "RGBA" ? new Float32Array(h * 4) : new Float32Array(h * 3), b = 4, y = 0, T = 1, I = 2, D = 3, $ = 0, v = h, A = h * 2, F = -1;
    l === "RGB" && (b = 3, y = 0, T = 1, I = 2, D = -1), m === "RGBA" ? F = h * 3 : m === "RBG" ? ($ = 0, A = h, v = h * 2) : m === "BGR" && (A = 0, v = h, $ = h * 2);
    for (let k = 0; k < h; k++, y += b, I += b, T += b, D += b) g[$++] = (n[y] + c[0]) / d[0], g[v++] = (n[T] + c[1]) / d[1], g[A++] = (n[I] + c[2]) / d[2], F !== -1 && D !== -1 && (g[F++] = (n[D] + c[3]) / d[3]);
    return m === "RGBA" ? new Z("float32", g, [1, 4, a, u2]) : new Z("float32", g, [1, 3, a, u2]);
  }, Sr = async (n, t) => {
    let a = typeof HTMLImageElement < "u" && n instanceof HTMLImageElement, u2 = typeof ImageData < "u" && n instanceof ImageData, o = typeof ImageBitmap < "u" && n instanceof ImageBitmap, d = typeof n == "string", c, l = t ?? {}, m = () => {
      if (typeof document < "u") return document.createElement("canvas");
      if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(1, 1);
      throw new Error("Canvas is not supported");
    }, h = (g) => typeof HTMLCanvasElement < "u" && g instanceof HTMLCanvasElement || g instanceof OffscreenCanvas ? g.getContext("2d") : null;
    if (a) {
      let g = m();
      g.width = n.width, g.height = n.height;
      let b = h(g);
      if (b != null) {
        let y = n.height, T = n.width;
        if (t !== void 0 && t.resizedHeight !== void 0 && t.resizedWidth !== void 0 && (y = t.resizedHeight, T = t.resizedWidth), t !== void 0) {
          if (l = t, t.tensorFormat !== void 0) throw new Error("Image input config format must be RGBA for HTMLImageElement");
          l.tensorFormat = "RGBA", l.height = y, l.width = T;
        } else l.tensorFormat = "RGBA", l.height = y, l.width = T;
        b.drawImage(n, 0, 0), c = b.getImageData(0, 0, T, y).data;
      } else throw new Error("Can not access image data");
    } else if (u2) {
      let g, b;
      if (t !== void 0 && t.resizedWidth !== void 0 && t.resizedHeight !== void 0 ? (g = t.resizedHeight, b = t.resizedWidth) : (g = n.height, b = n.width), t !== void 0 && (l = t), l.format = "RGBA", l.height = g, l.width = b, t !== void 0) {
        let y = m();
        y.width = b, y.height = g;
        let T = h(y);
        if (T != null) T.putImageData(n, 0, 0), c = T.getImageData(0, 0, b, g).data;
        else throw new Error("Can not access image data");
      } else c = n.data;
    } else if (o) {
      if (t === void 0) throw new Error("Please provide image config with format for Imagebitmap");
      let g = m();
      g.width = n.width, g.height = n.height;
      let b = h(g);
      if (b != null) {
        let y = n.height, T = n.width;
        return b.drawImage(n, 0, 0, T, y), c = b.getImageData(0, 0, T, y).data, l.height = y, l.width = T, Kt(c, l);
      } else throw new Error("Can not access image data");
    } else {
      if (d) return new Promise((g, b) => {
        let y = m(), T = h(y);
        if (!n || !T) return b();
        let I = new Image();
        I.crossOrigin = "Anonymous", I.src = n, I.onload = () => {
          y.width = I.width, y.height = I.height, T.drawImage(I, 0, 0, y.width, y.height);
          let D = T.getImageData(0, 0, y.width, y.height);
          l.height = y.height, l.width = y.width, g(Kt(D.data, l));
        };
      });
      throw new Error("Input data provided is not supported - aborted tensor creation");
    }
    if (c !== void 0) return Kt(c, l);
    throw new Error("Input data provided is not supported - aborted tensor creation");
  }, vr = (n, t) => {
    let { width: a, height: u2, download: o, dispose: d } = t, c = [1, u2, a, 4];
    return new Z({ location: "texture", type: "float32", texture: n, dims: c, download: o, dispose: d });
  }, Ar = (n, t) => {
    let { dataType: a, dims: u2, download: o, dispose: d } = t;
    return new Z({ location: "gpu-buffer", type: a ?? "float32", gpuBuffer: n, dims: u2, download: o, dispose: d });
  }, Or = (n, t) => {
    let { dataType: a, dims: u2, download: o, dispose: d } = t;
    return new Z({ location: "ml-tensor", type: a ?? "float32", mlTensor: n, dims: u2, download: o, dispose: d });
  }, Ir = (n, t, a) => new Z({ location: "cpu-pinned", type: n, data: t, dims: a ?? [t.length] });
});
var Le;
var Xe;
var Lr;
var _r;
var Dr = N(() => {
  "use strict";
  Le = /* @__PURE__ */ new Map([["float32", Float32Array], ["uint8", Uint8Array], ["int8", Int8Array], ["uint16", Uint16Array], ["int16", Int16Array], ["int32", Int32Array], ["bool", Uint8Array], ["float64", Float64Array], ["uint32", Uint32Array], ["int4", Uint8Array], ["uint4", Uint8Array]]), Xe = /* @__PURE__ */ new Map([[Float32Array, "float32"], [Uint8Array, "uint8"], [Int8Array, "int8"], [Uint16Array, "uint16"], [Int16Array, "int16"], [Int32Array, "int32"], [Float64Array, "float64"], [Uint32Array, "uint32"]]), Lr = false, _r = () => {
    if (!Lr) {
      Lr = true;
      let n = typeof BigInt64Array < "u" && BigInt64Array.from, t = typeof BigUint64Array < "u" && BigUint64Array.from, a = globalThis.Float16Array, u2 = typeof a < "u" && a.from;
      n && (Le.set("int64", BigInt64Array), Xe.set(BigInt64Array, "int64")), t && (Le.set("uint64", BigUint64Array), Xe.set(BigUint64Array, "uint64")), u2 ? (Le.set("float16", a), Xe.set(a, "float16")) : Le.set("float16", Uint16Array);
    }
  };
});
var Pr;
var Ur;
var xr = N(() => {
  "use strict";
  ct();
  Pr = (n) => {
    let t = 1;
    for (let a = 0; a < n.length; a++) {
      let u2 = n[a];
      if (typeof u2 != "number" || !Number.isSafeInteger(u2)) throw new TypeError(`dims[${a}] must be an integer, got: ${u2}`);
      if (u2 < 0) throw new RangeError(`dims[${a}] must be a non-negative integer, got: ${u2}`);
      t *= u2;
    }
    return t;
  }, Ur = (n, t) => {
    switch (n.location) {
      case "cpu":
        return new Z(n.type, n.data, t);
      case "cpu-pinned":
        return new Z({ location: "cpu-pinned", data: n.data, type: n.type, dims: t });
      case "texture":
        return new Z({ location: "texture", texture: n.texture, type: n.type, dims: t });
      case "gpu-buffer":
        return new Z({ location: "gpu-buffer", gpuBuffer: n.gpuBuffer, type: n.type, dims: t });
      case "ml-tensor":
        return new Z({ location: "ml-tensor", mlTensor: n.mlTensor, type: n.type, dims: t });
      default:
        throw new Error(`tensorReshape: tensor location ${n.location} is not supported`);
    }
  };
});
var Z;
var ct = N(() => {
  "use strict";
  Tr();
  Br();
  Dr();
  xr();
  Z = class {
    constructor(t, a, u2) {
      _r();
      let o, d;
      if (typeof t == "object" && "location" in t) switch (this.dataLocation = t.location, o = t.type, d = t.dims, t.location) {
        case "cpu-pinned": {
          let l = Le.get(o);
          if (!l) throw new TypeError(`unsupported type "${o}" to create tensor from pinned buffer`);
          if (!(t.data instanceof l)) throw new TypeError(`buffer should be of type ${l.name}`);
          this.cpuData = t.data;
          break;
        }
        case "texture": {
          if (o !== "float32") throw new TypeError(`unsupported type "${o}" to create tensor from texture`);
          this.gpuTextureData = t.texture, this.downloader = t.download, this.disposer = t.dispose;
          break;
        }
        case "gpu-buffer": {
          if (o !== "float32" && o !== "float16" && o !== "int32" && o !== "int64" && o !== "uint32" && o !== "uint8" && o !== "bool" && o !== "uint4" && o !== "int4") throw new TypeError(`unsupported type "${o}" to create tensor from gpu buffer`);
          this.gpuBufferData = t.gpuBuffer, this.downloader = t.download, this.disposer = t.dispose;
          break;
        }
        case "ml-tensor": {
          if (o !== "float32" && o !== "float16" && o !== "int32" && o !== "int64" && o !== "uint32" && o !== "uint64" && o !== "int8" && o !== "uint8" && o !== "bool" && o !== "uint4" && o !== "int4") throw new TypeError(`unsupported type "${o}" to create tensor from MLTensor`);
          this.mlTensorData = t.mlTensor, this.downloader = t.download, this.disposer = t.dispose;
          break;
        }
        default:
          throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`);
      }
      else {
        let l, m;
        if (typeof t == "string") if (o = t, m = u2, t === "string") {
          if (!Array.isArray(a)) throw new TypeError("A string tensor's data must be a string array.");
          l = a;
        } else {
          let h = Le.get(t);
          if (h === void 0) throw new TypeError(`Unsupported tensor type: ${t}.`);
          if (Array.isArray(a)) {
            if (t === "float16" && h === Uint16Array || t === "uint4" || t === "int4") throw new TypeError(`Creating a ${t} tensor from number array is not supported. Please use ${h.name} as data.`);
            t === "uint64" || t === "int64" ? l = h.from(a, BigInt) : l = h.from(a);
          } else if (a instanceof h) l = a;
          else if (a instanceof Uint8ClampedArray) if (t === "uint8") l = Uint8Array.from(a);
          else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");
          else if (t === "float16" && a instanceof Uint16Array && h !== Uint16Array) l = new globalThis.Float16Array(a.buffer, a.byteOffset, a.length);
          else throw new TypeError(`A ${o} tensor's data must be type of ${h}`);
        }
        else if (m = a, Array.isArray(t)) {
          if (t.length === 0) throw new TypeError("Tensor type cannot be inferred from an empty array.");
          let h = typeof t[0];
          if (h === "string") o = "string", l = t;
          else if (h === "boolean") o = "bool", l = Uint8Array.from(t);
          else throw new TypeError(`Invalid element type of data array: ${h}.`);
        } else if (t instanceof Uint8ClampedArray) o = "uint8", l = Uint8Array.from(t);
        else {
          let h = Xe.get(t.constructor);
          if (h === void 0) throw new TypeError(`Unsupported type for tensor data: ${t.constructor}.`);
          o = h, l = t;
        }
        if (m === void 0) m = [l.length];
        else if (!Array.isArray(m)) throw new TypeError("A tensor's dims must be a number array");
        d = m, this.cpuData = l, this.dataLocation = "cpu";
      }
      let c = Pr(d);
      if (this.cpuData && c !== this.cpuData.length && !((o === "uint4" || o === "int4") && Math.ceil(c / 2) === this.cpuData.length)) throw new Error(`Tensor's size(${c}) does not match data length(${this.cpuData.length}).`);
      this.type = o, this.dims = d, this.size = c;
    }
    static async fromImage(t, a) {
      return Sr(t, a);
    }
    static fromTexture(t, a) {
      return vr(t, a);
    }
    static fromGpuBuffer(t, a) {
      return Ar(t, a);
    }
    static fromMLTensor(t, a) {
      return Or(t, a);
    }
    static fromPinnedBuffer(t, a, u2) {
      return Ir(t, a, u2);
    }
    toDataURL(t) {
      return gr(this, t);
    }
    toImageData(t) {
      return Er(this, t);
    }
    get data() {
      if (this.ensureValid(), !this.cpuData) throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");
      return this.cpuData;
    }
    get location() {
      return this.dataLocation;
    }
    get texture() {
      if (this.ensureValid(), !this.gpuTextureData) throw new Error("The data is not stored as a WebGL texture.");
      return this.gpuTextureData;
    }
    get gpuBuffer() {
      if (this.ensureValid(), !this.gpuBufferData) throw new Error("The data is not stored as a WebGPU buffer.");
      return this.gpuBufferData;
    }
    get mlTensor() {
      if (this.ensureValid(), !this.mlTensorData) throw new Error("The data is not stored as a WebNN MLTensor.");
      return this.mlTensorData;
    }
    async getData(t) {
      switch (this.ensureValid(), this.dataLocation) {
        case "cpu":
        case "cpu-pinned":
          return this.data;
        case "texture":
        case "gpu-buffer":
        case "ml-tensor": {
          if (!this.downloader) throw new Error("The current tensor is not created with a specified data downloader.");
          if (this.isDownloading) throw new Error("The current tensor is being downloaded.");
          try {
            this.isDownloading = true;
            let a = await this.downloader();
            return this.downloader = void 0, this.dataLocation = "cpu", this.cpuData = a, t && this.disposer && (this.disposer(), this.disposer = void 0), a;
          } finally {
            this.isDownloading = false;
          }
        }
        default:
          throw new Error(`cannot get data from location: ${this.dataLocation}`);
      }
    }
    dispose() {
      if (this.isDownloading) throw new Error("The current tensor is being downloaded.");
      this.disposer && (this.disposer(), this.disposer = void 0), this.cpuData = void 0, this.gpuTextureData = void 0, this.gpuBufferData = void 0, this.mlTensorData = void 0, this.downloader = void 0, this.isDownloading = void 0, this.dataLocation = "none";
    }
    ensureValid() {
      if (this.dataLocation === "none") throw new Error("The tensor is disposed.");
    }
    reshape(t) {
      if (this.ensureValid(), this.downloader || this.disposer) throw new Error("Cannot reshape a tensor that owns GPU resource.");
      return Ur(this, t);
    }
  };
});
var de;
var en = N(() => {
  "use strict";
  ct();
  de = Z;
});
var Cr;
var Mr;
var _e;
var De;
var Pe;
var Ue;
var tn = N(() => {
  "use strict";
  Qt();
  Cr = (n, t) => {
    (typeof q.trace > "u" ? !q.wasm.trace : !q.trace) || console.timeStamp(`${n}::ORT::${t}`);
  }, Mr = (n, t) => {
    let a = new Error().stack?.split(/\r\n|\r|\n/g) || [], u2 = false;
    for (let o = 0; o < a.length; o++) {
      if (u2 && !a[o].includes("TRACE_FUNC")) {
        let d = `FUNC_${n}::${a[o].trim().split(" ")[1]}`;
        t && (d += `::${t}`), Cr("CPU", d);
        return;
      }
      a[o].includes("TRACE_FUNC") && (u2 = true);
    }
  }, _e = (n) => {
    (typeof q.trace > "u" ? !q.wasm.trace : !q.trace) || Mr("BEGIN", n);
  }, De = (n) => {
    (typeof q.trace > "u" ? !q.wasm.trace : !q.trace) || Mr("END", n);
  }, Pe = (n) => {
    (typeof q.trace > "u" ? !q.wasm.trace : !q.trace) || console.time(`ORT::${n}`);
  }, Ue = (n) => {
    (typeof q.trace > "u" ? !q.wasm.trace : !q.trace) || console.timeEnd(`ORT::${n}`);
  };
});
var lt;
var Rr = N(() => {
  "use strict";
  Zt();
  en();
  tn();
  lt = class n {
    constructor(t) {
      this.handler = t;
    }
    async run(t, a, u2) {
      _e(), Pe("InferenceSession.run");
      let o = {}, d = {};
      if (typeof t != "object" || t === null || t instanceof de || Array.isArray(t)) throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");
      let c = true;
      if (typeof a == "object") {
        if (a === null) throw new TypeError("Unexpected argument[1]: cannot be null.");
        if (a instanceof de) throw new TypeError("'fetches' cannot be a Tensor");
        if (Array.isArray(a)) {
          if (a.length === 0) throw new TypeError("'fetches' cannot be an empty array.");
          c = false;
          for (let h of a) {
            if (typeof h != "string") throw new TypeError("'fetches' must be a string array or an object.");
            if (this.outputNames.indexOf(h) === -1) throw new RangeError(`'fetches' contains invalid output name: ${h}.`);
            o[h] = null;
          }
          if (typeof u2 == "object" && u2 !== null) d = u2;
          else if (typeof u2 < "u") throw new TypeError("'options' must be an object.");
        } else {
          let h = false, g = Object.getOwnPropertyNames(a);
          for (let b of this.outputNames) if (g.indexOf(b) !== -1) {
            let y = a[b];
            (y === null || y instanceof de) && (h = true, c = false, o[b] = y);
          }
          if (h) {
            if (typeof u2 == "object" && u2 !== null) d = u2;
            else if (typeof u2 < "u") throw new TypeError("'options' must be an object.");
          } else d = a;
        }
      } else if (typeof a < "u") throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");
      for (let h of this.inputNames) if (typeof t[h] > "u") throw new Error(`input '${h}' is missing in 'feeds'.`);
      if (c) for (let h of this.outputNames) o[h] = null;
      let l = await this.handler.run(t, o, d), m = {};
      for (let h in l) if (Object.hasOwnProperty.call(l, h)) {
        let g = l[h];
        g instanceof de ? m[h] = g : m[h] = new de(g.type, g.data, g.dims);
      }
      return Ue("InferenceSession.run"), De(), m;
    }
    async release() {
      return this.handler.dispose();
    }
    static async create(t, a, u2, o) {
      _e(), Pe("InferenceSession.create");
      let d, c = {};
      if (typeof t == "string") {
        if (d = t, typeof a == "object" && a !== null) c = a;
        else if (typeof a < "u") throw new TypeError("'options' must be an object.");
      } else if (t instanceof Uint8Array) {
        if (d = t, typeof a == "object" && a !== null) c = a;
        else if (typeof a < "u") throw new TypeError("'options' must be an object.");
      } else if (t instanceof ArrayBuffer || typeof SharedArrayBuffer < "u" && t instanceof SharedArrayBuffer) {
        let g = t, b = 0, y = t.byteLength;
        if (typeof a == "object" && a !== null) c = a;
        else if (typeof a == "number") {
          if (b = a, !Number.isSafeInteger(b)) throw new RangeError("'byteOffset' must be an integer.");
          if (b < 0 || b >= g.byteLength) throw new RangeError(`'byteOffset' is out of range [0, ${g.byteLength}).`);
          if (y = t.byteLength - b, typeof u2 == "number") {
            if (y = u2, !Number.isSafeInteger(y)) throw new RangeError("'byteLength' must be an integer.");
            if (y <= 0 || b + y > g.byteLength) throw new RangeError(`'byteLength' is out of range (0, ${g.byteLength - b}].`);
            if (typeof o == "object" && o !== null) c = o;
            else if (typeof o < "u") throw new TypeError("'options' must be an object.");
          } else if (typeof u2 < "u") throw new TypeError("'byteLength' must be a number.");
        } else if (typeof a < "u") throw new TypeError("'options' must be an object.");
        d = new Uint8Array(g, b, y);
      } else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");
      let [l, m] = await pr(c), h = await l.createInferenceSessionHandler(d, m);
      return Ue("InferenceSession.create"), De(), new n(h);
    }
    startProfiling() {
      this.handler.startProfiling();
    }
    endProfiling() {
      this.handler.endProfiling();
    }
    get inputNames() {
      return this.handler.inputNames;
    }
    get outputNames() {
      return this.handler.outputNames;
    }
    get inputMetadata() {
      return this.handler.inputMetadata;
    }
    get outputMetadata() {
      return this.handler.outputMetadata;
    }
  };
});
var rs;
var Fr = N(() => {
  "use strict";
  Rr();
  rs = lt;
});
var Nr = N(() => {
  "use strict";
});
var kr = N(() => {
  "use strict";
});
var Wr = N(() => {
  "use strict";
});
var Gr = N(() => {
  "use strict";
});
var nn = {};
ut(nn, { InferenceSession: () => rs, TRACE: () => Cr, TRACE_EVENT_BEGIN: () => Pe, TRACE_EVENT_END: () => Ue, TRACE_FUNC_BEGIN: () => _e, TRACE_FUNC_END: () => De, Tensor: () => de, env: () => Y, registerBackend: () => Je });
var Te = N(() => {
  "use strict";
  mr();
  yr();
  Fr();
  en();
  Nr();
  kr();
  tn();
  Wr();
  Gr();
});
var dt = N(() => {
  "use strict";
});
var jr = {};
ut(jr, { default: () => os });
var zr;
var Hr;
var os;
var Vr = N(() => {
  "use strict";
  rn();
  xe();
  pt();
  zr = "ort-wasm-proxy-worker", Hr = globalThis.self?.name === zr;
  Hr && (self.onmessage = (n) => {
    let { type: t, in: a } = n.data;
    try {
      switch (t) {
        case "init-wasm":
          mt(a.wasm).then(() => {
            ht(a).then(() => {
              postMessage({ type: t });
            }, (u2) => {
              postMessage({ type: t, err: u2 });
            });
          }, (u2) => {
            postMessage({ type: t, err: u2 });
          });
          break;
        case "init-ep": {
          let { epName: u2, env: o } = a;
          wt(o, u2).then(() => {
            postMessage({ type: t });
          }, (d) => {
            postMessage({ type: t, err: d });
          });
          break;
        }
        case "copy-from": {
          let { buffer: u2 } = a, o = Ze(u2);
          postMessage({ type: t, out: o });
          break;
        }
        case "create": {
          let { model: u2, options: o } = a;
          bt(u2, o).then((d) => {
            postMessage({ type: t, out: d });
          }, (d) => {
            postMessage({ type: t, err: d });
          });
          break;
        }
        case "release":
          yt(a), postMessage({ type: t });
          break;
        case "run": {
          let { sessionId: u2, inputIndices: o, inputs: d, outputIndices: c, options: l } = a;
          gt(u2, o, d, c, new Array(c.length).fill(null), l).then((m) => {
            m.some((h) => h[3] !== "cpu") ? postMessage({ type: t, err: "Proxy does not support non-cpu tensor location." }) : postMessage({ type: t, out: m }, Tt([...d, ...m]));
          }, (m) => {
            postMessage({ type: t, err: m });
          });
          break;
        }
        case "end-profiling":
          Et(a), postMessage({ type: t });
          break;
        default:
      }
    } catch (u2) {
      postMessage({ type: t, err: u2 });
    }
  });
  os = Hr ? null : (n) => new Worker(n ?? oe, { type: "module", name: zr });
});
var qr = {};
ut(qr, { default: () => as });
async function Yr(n = {}) {
  var t = n, a = !!globalThis.window, u2 = !!globalThis.WorkerGlobalScope, o = u2 && self.name?.startsWith("em-pthread");
  t.mountExternalData = (e, r) => {
    e.startsWith("./") && (e = e.substring(2)), (t.Tb || (t.Tb = /* @__PURE__ */ new Map())).set(e, r);
  }, t.unmountExternalData = () => {
    delete t.Tb, delete t.mc, delete t.lc, delete t.nc;
  }, globalThis.SharedArrayBuffer ?? new WebAssembly.Memory({ initial: 0, maximum: 0, shared: true }).buffer.constructor;
  var d, c, l = (e, r) => {
    throw r;
  }, m = import.meta.url, h = "";
  if (a || u2) {
    try {
      h = new URL(".", m).href;
    } catch {
    }
    u2 && (c = (e) => {
      var r = new XMLHttpRequest();
      return r.open("GET", e, false), r.responseType = "arraybuffer", r.send(null), new Uint8Array(r.response);
    }), d = async (e) => {
      if (k(e)) return new Promise((i, s) => {
        var f = new XMLHttpRequest();
        f.open("GET", e, true), f.responseType = "arraybuffer", f.onload = () => {
          f.status == 200 || f.status == 0 && f.response ? i(f.response) : s(f.status);
        }, f.onerror = s, f.send(null);
      });
      var r = await fetch(e, { credentials: "same-origin" });
      if (r.ok) return r.arrayBuffer();
      throw Error(r.status + " : " + r.url);
    };
  }
  var g, b, y, T, I, D, $ = console.log.bind(console), v = console.error.bind(console), A = $, F = v, P = false, k = (e) => e.startsWith("file://");
  function w() {
    ge.buffer != H.buffer && ee();
  }
  if (o) {
    let e = function(r) {
      try {
        var i = r.data, s = i.Rb;
        if (s === "load") {
          let f = [];
          self.onmessage = (p) => f.push(p), D = () => {
            postMessage({ Rb: "loaded" });
            for (let p of f) e(p);
            self.onmessage = e;
          };
          for (let p of i.ac) t[p] && !t[p].proxy || (t[p] = (...E) => {
            postMessage({ Rb: "callHandler", $b: p, args: E });
          }, p == "print" && (A = t[p]), p == "printErr" && (F = t[p]));
          ge = i.fc, ee(), b = i.hc, Ut(), it();
        } else if (s === "run") {
          (function(f) {
            var p = (w(), W)[f + 52 >>> 2 >>> 0];
            f = (w(), W)[f + 56 >>> 2 >>> 0], ir(p, p - f), _(p);
          })(i.Qb), zt(i.Qb, 0, 0, 1, 0, 0), wn(), Ft(i.Qb), Q ||= true;
          try {
            Io(i.dc, i.Vb);
          } catch (f) {
            if (f != "unwind") throw f;
          }
        } else i.target !== "setimmediate" && (s === "checkMailbox" ? Q && rt() : s && (F(`worker: received unknown command ${s}`), F(i)));
      } catch (f) {
        throw nr(), f;
      }
    };
    var As = e, Q = false;
    self.onunhandledrejection = (r) => {
      throw r.reason || r;
    }, self.onmessage = e;
  }
  var H, ne, pe, B, W, re, me, O, K2, je = false;
  function ee() {
    var e = ge.buffer;
    t.HEAP8 = H = new Int8Array(e), pe = new Int16Array(e), t.HEAPU8 = ne = new Uint8Array(e), new Uint16Array(e), t.HEAP32 = B = new Int32Array(e), t.HEAPU32 = W = new Uint32Array(e), re = new Float32Array(e), me = new Float64Array(e), O = new BigInt64Array(e), new BigUint64Array(e);
  }
  function he() {
    je = true, o ? D() : Ee.Va();
  }
  function j(e) {
    throw F(e = "Aborted(" + e + ")"), P = true, e = new WebAssembly.RuntimeError(e + ". Build with -sASSERTIONS for more info."), I?.(e), e;
  }
  function J() {
    return { a: { T: ca, f: Bo, w: Lo, e: _o, k: Do, h: Po, L: Uo, b: xo, G: Co, ua: vn, j: Mo, M: In, La: Bn, qa: Ln, sa: _n, Ma: Dn, Ja: Pn, Ca: Un, Ia: xn, Z: Cn, ra: Mn, oa: Rn, Ka: Fn, pa: Nn, Ra: Ro, Fa: Fo, ma: ko, va: Wo, ja: Go, U: $o, Ea: Ft, Oa: zo, za: Ho, Aa: jo, Ba: Vo, xa: $n, ya: zn, ka: Hn, Ta: qo, Qa: Zo, W: Qo, V: Ko, Pa: Jo, F: ea, Na: ta, na, u: Yo, H: ra, S: at, la: aa, ba: oa, Ua: sa, Ga: Yn, Ha: qn, ta: ye, I: Jn, wa: Xn, Y: Zn, Da: Qn, X: Kn, $: Ya, N: $a, aa: Va, O: Ga, v: Da, d: ma, m: da, n: la, r: Aa, ca: Na, E: Fa, o: ba, P: ka, C: za, J: Ra, da: Ma, ea: Ca, z: Oa, fa: Ua, Q: xa, ga: Pa, y: La, D: Wa, c: pa, q: wa, i: ha, _: qa, l: ga, p: Ea, s: ya, t: Ta, x: Ia, R: _a, A: Ha, K: Ba, B: ja, ha: va, ia: Sa, g: ua, a: ge, Sa: V } };
  }
  async function Ut() {
    function e(s, f) {
      return Ee = s.exports, Ee = function() {
        var p = Ee, E = (C) => () => C() >>> 0, S = (C) => (R) => C(R) >>> 0;
        return (p = Object.assign({}, p)).ub = E(p.ub), p.wb = S(p.wb), p.Kb = S(p.Kb), p.Lb = E(p.Lb), p.Pb = S(p.Pb), p;
      }(), mn.push(Ee.xb), s = Ee, t._OrtInit = s.Wa, t._OrtGetLastError = s.Xa, t._OrtCreateSessionOptions = s.Ya, t._OrtAppendExecutionProvider = s.Za, t._OrtAddFreeDimensionOverride = s._a, t._OrtAddSessionConfigEntry = s.$a, t._OrtReleaseSessionOptions = s.ab, t._OrtCreateSession = s.bb, t._OrtReleaseSession = s.cb, t._OrtGetInputOutputCount = s.db, t._OrtGetInputOutputMetadata = s.eb, t._OrtFree = s.fb, t._OrtCreateTensor = s.gb, t._OrtGetTensorData = s.hb, t._OrtReleaseTensor = s.ib, t._OrtCreateRunOptions = s.jb, t._OrtAddRunConfigEntry = s.kb, t._OrtReleaseRunOptions = s.lb, t._OrtCreateBinding = s.mb, t._OrtBindInput = s.nb, t._OrtBindOutput = s.ob, t._OrtClearBoundOutputs = s.pb, t._OrtReleaseBinding = s.qb, t._OrtRunWithBinding = s.rb, t._OrtRun = s.sb, t._OrtEndProfiling = s.tb, st = s.ub, er = t._free = s.vb, tr = t._malloc = s.wb, zt = s.zb, nr = s.Ab, rr = s.Bb, or = s.Cb, Ht = s.Db, ar = s.Eb, sr = s.Fb, x = s.Gb, qe = s.Hb, ir = s.Ib, _ = s.Jb, jt = s.Kb, U = s.Lb, ur = s.Mb, Vt = s.Nb, fr = s.Ob, cr = s.Pb, lr = s.yb, b = f, Ee;
    }
    var r, i = J();
    return t.instantiateWasm ? new Promise((s) => {
      t.instantiateWasm(i, (f, p) => {
        s(e(f, p));
      });
    }) : o ? e(new WebAssembly.Instance(b, J()), b) : (K2 ??= t.locateFile ? t.locateFile ? t.locateFile("ort-wasm-simd-threaded.wasm", h) : h + "ort-wasm-simd-threaded.wasm" : new URL("ort-wasm-simd-threaded.wasm", import.meta.url).href, r = await async function(s) {
      var f = K2;
      if (!g && !k(f)) try {
        var p = fetch(f, { credentials: "same-origin" });
        return await WebAssembly.instantiateStreaming(p, s);
      } catch (E) {
        F(`wasm streaming compile failed: ${E}`), F("falling back to ArrayBuffer instantiation");
      }
      return async function(E, S) {
        try {
          var C = await async function(R) {
            if (!g) try {
              var X = await d(R);
              return new Uint8Array(X);
            } catch {
            }
            if (R == K2 && g) R = new Uint8Array(g);
            else {
              if (!c) throw "both async and sync fetching of the wasm failed";
              R = c(R);
            }
            return R;
          }(E);
          return await WebAssembly.instantiate(C, S);
        } catch (R) {
          F(`failed to asynchronously prepare wasm: ${R}`), j(R);
        }
      }(f, s);
    }(i), e(r.instance, r.module));
  }
  class Se {
    name = "ExitStatus";
    constructor(r) {
      this.message = `Program terminated with exit(${r})`, this.status = r;
    }
  }
  var ve = (e) => {
    e.terminate(), e.onmessage = () => {
    };
  }, Ve = [], Re = 0, te = null, ue = (e) => {
    ce.length == 0 && (yn(), bn(ce[0]));
    var r = ce.pop();
    if (!r) return 6;
    Fe.push(r), Ae[e.Qb] = r, r.Qb = e.Qb;
    var i = { Rb: "run", dc: e.cc, Vb: e.Vb, Qb: e.Qb };
    return r.postMessage(i, e.Zb), 0;
  }, se = 0, L = (e, r, ...i) => {
    var s, f = 16 * i.length, p = U(), E = jt(f), S = E >>> 3;
    for (s of i) typeof s == "bigint" ? ((w(), O)[S++ >>> 0] = 1n, (w(), O)[S++ >>> 0] = s) : ((w(), O)[S++ >>> 0] = 0n, (w(), me)[S++ >>> 0] = s);
    return e = rr(e, 0, f, E, r), _(p), e;
  };
  function V(e) {
    if (o) return L(0, 1, e);
    if (y = e, !(0 < se)) {
      for (var r of Fe) ve(r);
      for (r of ce) ve(r);
      ce = [], Fe = [], Ae = {}, P = true;
    }
    l(0, new Se(e));
  }
  function fe(e) {
    if (o) return L(1, 0, e);
    ye(e);
  }
  var ye = (e) => {
    if (y = e, o) throw fe(e), "unwind";
    V(e);
  }, ce = [], Fe = [], mn = [], Ae = {}, hn = (e) => {
    var r = e.Qb;
    delete Ae[r], ce.push(e), Fe.splice(Fe.indexOf(e), 1), e.Qb = 0, or(r);
  };
  function wn() {
    mn.forEach((e) => e());
  }
  var bn = (e) => new Promise((r) => {
    e.onmessage = (f) => {
      var p = f.data;
      if (f = p.Rb, p.Ub && p.Ub != st()) {
        var E = Ae[p.Ub];
        E ? E.postMessage(p, p.Zb) : F(`Internal error! Worker sent a message "${f}" to target pthread ${p.Ub}, but that thread no longer exists!`);
      } else f === "checkMailbox" ? rt() : f === "spawnThread" ? ue(p) : f === "cleanupThread" ? Rt(() => {
        hn(Ae[p.ec]);
      }) : f === "loaded" ? (e.loaded = true, r(e)) : p.target === "setimmediate" ? e.postMessage(p) : f === "uncaughtException" ? e.onerror(p.error) : f === "callHandler" ? t[p.$b](...p.args) : f && F(`worker sent an unknown command ${f}`);
    }, e.onerror = (f) => {
      throw F(`worker sent an error! ${f.filename}:${f.lineno}: ${f.message}`), f;
    };
    var i, s = [];
    for (i of []) t.propertyIsEnumerable(i) && s.push(i);
    e.postMessage({ Rb: "load", ac: s, fc: ge, hc: b });
  });
  function yn() {
    var e = new Worker((() => {
      let r = URL;
      return import.meta.url > "file:" && import.meta.url < "file;" ? new r("ort.wasm.bundle.min.mjs", import.meta.url) : new URL(import.meta.url);
    })(), { type: "module", workerData: "em-pthread", name: "em-pthread" });
    ce.push(e);
  }
  var ge, gn = [], M = (e) => {
    var r = gn[e];
    return r || (gn[e] = r = lr.get(e)), r;
  }, Io = (e, r) => {
    se = 0, e = M(e)(r), 0 < se ? y = e : Ht(e);
  }, tt = [], nt = 0;
  function Bo(e) {
    var r = new xt(e >>>= 0);
    return (w(), H)[r.Sb + 12 >>> 0] == 0 && (En(r, true), nt--), Tn(r, false), tt.push(r), cr(e);
  }
  var Ne = 0, Lo = () => {
    x(0, 0);
    var e = tt.pop();
    ur(e.Wb), Ne = 0;
  };
  function En(e, r) {
    r = r ? 1 : 0, (w(), H)[e.Sb + 12 >>> 0] = r;
  }
  function Tn(e, r) {
    r = r ? 1 : 0, (w(), H)[e.Sb + 13 >>> 0] = r;
  }
  class xt {
    constructor(r) {
      this.Wb = r, this.Sb = r - 24;
    }
  }
  var Ct = (e) => {
    var r = Ne;
    if (!r) return qe(0), 0;
    var i = new xt(r);
    (w(), W)[i.Sb + 16 >>> 2 >>> 0] = r;
    var s = (w(), W)[i.Sb + 4 >>> 2 >>> 0];
    if (!s) return qe(0), r;
    for (var f of e) {
      if (f === 0 || f === s) break;
      if (fr(f, s, i.Sb + 16)) return qe(f), r;
    }
    return qe(s), r;
  };
  function _o() {
    return Ct([]);
  }
  function Do(e) {
    return Ct([e >>> 0]);
  }
  function Po(e, r, i, s) {
    return Ct([e >>> 0, r >>> 0, i >>> 0, s >>> 0]);
  }
  var Uo = () => {
    var e = tt.pop();
    e || j("no exception to throw");
    var r = e.Wb;
    throw (w(), H)[e.Sb + 13 >>> 0] == 0 && (tt.push(e), Tn(e, true), En(e, false), nt++), Vt(r), Ne = r;
  };
  function xo(e, r, i) {
    var s = new xt(e >>>= 0);
    throw r >>>= 0, i >>>= 0, (w(), W)[s.Sb + 16 >>> 2 >>> 0] = 0, (w(), W)[s.Sb + 4 >>> 2 >>> 0] = r, (w(), W)[s.Sb + 8 >>> 2 >>> 0] = i, Vt(e), nt++, Ne = e;
  }
  var Co = () => nt;
  function Sn(e, r, i, s) {
    return o ? L(2, 1, e, r, i, s) : vn(e, r, i, s);
  }
  function vn(e, r, i, s) {
    if (e >>>= 0, r >>>= 0, i >>>= 0, s >>>= 0, !globalThis.SharedArrayBuffer) return 6;
    var f = [];
    return o && f.length === 0 ? Sn(e, r, i, s) : (e = { cc: i, Qb: e, Vb: s, Zb: f }, o ? (e.Rb = "spawnThread", postMessage(e, f), 0) : ue(e));
  }
  function Mo(e) {
    throw Ne ||= e >>> 0, Ne;
  }
  var An = globalThis.TextDecoder && new TextDecoder(), On = (e, r = 0, i, s) => {
    var f = r >>>= 0;
    if (i = f + i, s) s = i;
    else {
      for (; e[f] && !(f >= i); ) ++f;
      s = f;
    }
    if (16 < s - r && e.buffer && An) return An.decode(e.buffer instanceof ArrayBuffer ? e.subarray(r, s) : e.slice(r, s));
    for (f = ""; r < s; ) if (128 & (i = e[r++])) {
      var p = 63 & e[r++];
      if ((224 & i) == 192) f += String.fromCharCode((31 & i) << 6 | p);
      else {
        var E = 63 & e[r++];
        65536 > (i = (240 & i) == 224 ? (15 & i) << 12 | p << 6 | E : (7 & i) << 18 | p << 12 | E << 6 | 63 & e[r++]) ? f += String.fromCharCode(i) : (i -= 65536, f += String.fromCharCode(55296 | i >> 10, 56320 | 1023 & i));
      }
    } else f += String.fromCharCode(i);
    return f;
  }, Mt = (e, r, i) => (e >>>= 0) ? On((w(), ne), e, r, i) : "";
  function In(e, r, i) {
    return o ? L(3, 1, e, r, i) : 0;
  }
  function Bn(e, r) {
    if (o) return L(4, 1, e, r);
  }
  function Ln(e, r) {
    if (o) return L(5, 1, e, r);
  }
  function _n(e, r, i) {
    if (o) return L(6, 1, e, r, i);
  }
  function Dn(e, r, i) {
    return o ? L(7, 1, e, r, i) : 0;
  }
  function Pn(e, r) {
    if (o) return L(8, 1, e, r);
  }
  function Un(e, r, i) {
    if (o) return L(9, 1, e, r, i);
  }
  function xn(e, r, i, s) {
    if (o) return L(10, 1, e, r, i, s);
  }
  function Cn(e, r, i, s) {
    if (o) return L(11, 1, e, r, i, s);
  }
  function Mn(e, r, i, s) {
    if (o) return L(12, 1, e, r, i, s);
  }
  function Rn(e) {
    if (o) return L(13, 1, e);
  }
  function Fn(e, r) {
    if (o) return L(14, 1, e, r);
  }
  function Nn(e, r, i) {
    if (o) return L(15, 1, e, r, i);
  }
  var Ro = () => j("");
  function Fo(e) {
    zt(e >>> 0, !u2, 1, !a, 131072, false), wn();
  }
  var Rt = (e) => {
    if (!P) try {
      if (e(), !(0 < se)) try {
        o ? st() && Ht(y) : ye(y);
      } catch (r) {
        r instanceof Se || r == "unwind" || l(0, r);
      }
    } catch (r) {
      r instanceof Se || r == "unwind" || l(0, r);
    }
  }, No = !Atomics.waitAsync || globalThis.navigator?.userAgent && 91 > Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) || [])[2]);
  function Ft(e) {
    e >>>= 0, No || (Atomics.waitAsync((w(), B), e >>> 2, e).value.then(rt), e += 128, Atomics.store((w(), B), e >>> 2, 1));
  }
  var rt = () => Rt(() => {
    var e = st();
    e && (Ft(e), sr());
  });
  function ko(e, r) {
    (e >>>= 0) == r >>> 0 ? setTimeout(rt) : o ? postMessage({ Ub: e, Rb: "checkMailbox" }) : (e = Ae[e]) && e.postMessage({ Rb: "checkMailbox" });
  }
  var Nt = [];
  function Wo(e, r, i, s, f) {
    for (r >>>= 0, f >>>= 0, Nt.length = 0, i = f >>> 3, s = f + s >>> 3; i < s; ) {
      var p;
      p = (w(), O)[i++ >>> 0] ? (w(), O)[i++ >>> 0] : (w(), me)[i++ >>> 0], Nt.push(p);
    }
    return (r ? dr[r] : fa[e])(...Nt);
  }
  var Go = () => {
    se = 0;
  };
  function $o(e) {
    e >>>= 0, o ? postMessage({ Rb: "cleanupThread", ec: e }) : hn(Ae[e]);
  }
  function zo(e) {
  }
  function Ho(e, r) {
    e = -9007199254740992 > e || 9007199254740992 < e ? NaN : Number(e), r >>>= 0, e = new Date(1e3 * e), (w(), B)[r >>> 2 >>> 0] = e.getUTCSeconds(), (w(), B)[r + 4 >>> 2 >>> 0] = e.getUTCMinutes(), (w(), B)[r + 8 >>> 2 >>> 0] = e.getUTCHours(), (w(), B)[r + 12 >>> 2 >>> 0] = e.getUTCDate(), (w(), B)[r + 16 >>> 2 >>> 0] = e.getUTCMonth(), (w(), B)[r + 20 >>> 2 >>> 0] = e.getUTCFullYear() - 1900, (w(), B)[r + 24 >>> 2 >>> 0] = e.getUTCDay(), e = (e.getTime() - Date.UTC(e.getUTCFullYear(), 0, 1, 0, 0, 0, 0)) / 864e5 | 0, (w(), B)[r + 28 >>> 2 >>> 0] = e;
  }
  var kn = (e) => e % 4 == 0 && (e % 100 != 0 || e % 400 == 0), Wn = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], Gn = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  function jo(e, r) {
    e = -9007199254740992 > e || 9007199254740992 < e ? NaN : Number(e), r >>>= 0, e = new Date(1e3 * e), (w(), B)[r >>> 2 >>> 0] = e.getSeconds(), (w(), B)[r + 4 >>> 2 >>> 0] = e.getMinutes(), (w(), B)[r + 8 >>> 2 >>> 0] = e.getHours(), (w(), B)[r + 12 >>> 2 >>> 0] = e.getDate(), (w(), B)[r + 16 >>> 2 >>> 0] = e.getMonth(), (w(), B)[r + 20 >>> 2 >>> 0] = e.getFullYear() - 1900, (w(), B)[r + 24 >>> 2 >>> 0] = e.getDay();
    var i = (kn(e.getFullYear()) ? Wn : Gn)[e.getMonth()] + e.getDate() - 1 | 0;
    (w(), B)[r + 28 >>> 2 >>> 0] = i, (w(), B)[r + 36 >>> 2 >>> 0] = -60 * e.getTimezoneOffset(), i = new Date(e.getFullYear(), 6, 1).getTimezoneOffset();
    var s = new Date(e.getFullYear(), 0, 1).getTimezoneOffset();
    e = 0 | (i != s && e.getTimezoneOffset() == Math.min(s, i)), (w(), B)[r + 32 >>> 2 >>> 0] = e;
  }
  function Vo(e) {
    e >>>= 0;
    var r = new Date((w(), B)[e + 20 >>> 2 >>> 0] + 1900, (w(), B)[e + 16 >>> 2 >>> 0], (w(), B)[e + 12 >>> 2 >>> 0], (w(), B)[e + 8 >>> 2 >>> 0], (w(), B)[e + 4 >>> 2 >>> 0], (w(), B)[e >>> 2 >>> 0], 0), i = (w(), B)[e + 32 >>> 2 >>> 0], s = r.getTimezoneOffset(), f = new Date(r.getFullYear(), 6, 1).getTimezoneOffset(), p = new Date(r.getFullYear(), 0, 1).getTimezoneOffset(), E = Math.min(p, f);
    return 0 > i ? (w(), B)[e + 32 >>> 2 >>> 0] = +(f != p && E == s) : 0 < i != (E == s) && (f = Math.max(p, f), r.setTime(r.getTime() + 6e4 * ((0 < i ? E : f) - s))), (w(), B)[e + 24 >>> 2 >>> 0] = r.getDay(), i = (kn(r.getFullYear()) ? Wn : Gn)[r.getMonth()] + r.getDate() - 1 | 0, (w(), B)[e + 28 >>> 2 >>> 0] = i, (w(), B)[e >>> 2 >>> 0] = r.getSeconds(), (w(), B)[e + 4 >>> 2 >>> 0] = r.getMinutes(), (w(), B)[e + 8 >>> 2 >>> 0] = r.getHours(), (w(), B)[e + 12 >>> 2 >>> 0] = r.getDate(), (w(), B)[e + 16 >>> 2 >>> 0] = r.getMonth(), (w(), B)[e + 20 >>> 2 >>> 0] = r.getYear(), e = r.getTime(), BigInt(isNaN(e) ? -1 : e / 1e3);
  }
  function $n(e, r, i, s, f, p, E) {
    return o ? L(16, 1, e, r, i, s, f, p, E) : -52;
  }
  function zn(e, r, i, s, f, p) {
    if (o) return L(17, 1, e, r, i, s, f, p);
  }
  var Ye = {}, Yo = () => performance.timeOrigin + performance.now();
  function Hn(e, r) {
    if (o) return L(18, 1, e, r);
    if (Ye[e] && (clearTimeout(Ye[e].id), delete Ye[e]), !r) return 0;
    var i = setTimeout(() => {
      delete Ye[e], Rt(() => ar(e, performance.timeOrigin + performance.now()));
    }, r);
    return Ye[e] = { id: i, oc: r }, 0;
  }
  var Oe = (e, r, i) => {
    var s = (w(), ne);
    if (r >>>= 0, 0 < i) {
      var f = r;
      i = r + i - 1;
      for (var p = 0; p < e.length; ++p) {
        var E = e.codePointAt(p);
        if (127 >= E) {
          if (r >= i) break;
          s[r++ >>> 0] = E;
        } else if (2047 >= E) {
          if (r + 1 >= i) break;
          s[r++ >>> 0] = 192 | E >> 6, s[r++ >>> 0] = 128 | 63 & E;
        } else if (65535 >= E) {
          if (r + 2 >= i) break;
          s[r++ >>> 0] = 224 | E >> 12, s[r++ >>> 0] = 128 | E >> 6 & 63, s[r++ >>> 0] = 128 | 63 & E;
        } else {
          if (r + 3 >= i) break;
          s[r++ >>> 0] = 240 | E >> 18, s[r++ >>> 0] = 128 | E >> 12 & 63, s[r++ >>> 0] = 128 | E >> 6 & 63, s[r++ >>> 0] = 128 | 63 & E, p++;
        }
      }
      s[r >>> 0] = 0, e = r - f;
    } else e = 0;
    return e;
  };
  function qo(e, r, i, s) {
    e >>>= 0, r >>>= 0, i >>>= 0, s >>>= 0;
    var f = (/* @__PURE__ */ new Date()).getFullYear(), p = new Date(f, 0, 1).getTimezoneOffset();
    f = new Date(f, 6, 1).getTimezoneOffset();
    var E = Math.max(p, f);
    (w(), W)[e >>> 2 >>> 0] = 60 * E, (w(), B)[r >>> 2 >>> 0] = +(p != f), e = (r = (S) => {
      var C = Math.abs(S);
      return `UTC${0 <= S ? "-" : "+"}${String(Math.floor(C / 60)).padStart(2, "0")}${String(C % 60).padStart(2, "0")}`;
    })(p), r = r(f), f < p ? (Oe(e, i, 17), Oe(r, s, 17)) : (Oe(e, s, 17), Oe(r, i, 17));
  }
  var Jo = () => Date.now(), Xo = 1;
  function Zo(e, r, i) {
    if (i >>>= 0, !(0 <= e && 3 >= e)) return 28;
    if (e === 0) e = Date.now();
    else {
      if (!Xo) return 52;
      e = performance.timeOrigin + performance.now();
    }
    return e = Math.round(1e6 * e), (w(), O)[i >>> 3 >>> 0] = BigInt(e), 0;
  }
  var kt = [];
  function Qo(e, r, i) {
    e >>>= 0, r >>>= 0, i >>>= 0, kt.length = 0;
    for (var s; s = (w(), ne)[r++ >>> 0]; ) {
      var f = s != 105;
      i += (f &= s != 112) && i % 8 ? 4 : 0, kt.push(s == 112 ? (w(), W)[i >>> 2 >>> 0] : s == 106 ? (w(), O)[i >>> 3 >>> 0] : s == 105 ? (w(), B)[i >>> 2 >>> 0] : (w(), me)[i >>> 3 >>> 0]), i += f ? 8 : 4;
    }
    return dr[e](...kt);
  }
  var Ko = () => {
  };
  function ea(e, r) {
    return F(Mt(e >>> 0, r >>> 0));
  }
  var ta = () => {
    throw se += 1, "unwind";
  };
  function na() {
    return 4294901760;
  }
  var ra = () => navigator.hardwareConcurrency, Ie = {}, Wt = (e) => {
    for (var r = 0, i = 0; i < e.length; ++i) {
      var s = e.charCodeAt(i);
      127 >= s ? r++ : 2047 >= s ? r += 2 : 55296 <= s && 57343 >= s ? (r += 4, ++i) : r += 3;
    }
    return r;
  }, ot = (e) => {
    var r;
    return (r = /\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(e)) ? +r[1] : (r = /:(\d+):\d+(?:\)|$)/.exec(e)) ? 2147483648 | +r[1] : 0;
  }, jn = (e) => {
    for (var r of e) (e = ot(r)) && (Ie[e] = r);
  };
  function oa() {
    var e = Error().stack.toString().split(`
`);
    return e[0] == "Error" && e.shift(), jn(e), Ie.Xb = ot(e[3]), Ie.bc = e, Ie.Xb;
  }
  function at(e) {
    if (!(e = Ie[e >>> 0])) return 0;
    var r;
    if (r = /^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(e)) e = r[1];
    else if (r = /^\s+at (.*) \(.*\)$/.exec(e)) e = r[1];
    else {
      if (!(r = /^(.+?)@/.exec(e))) return 0;
      e = r[1];
    }
    er(at.Yb ?? 0), r = Wt(e) + 1;
    var i = tr(r);
    return i && Oe(e, i, r), at.Yb = i, at.Yb;
  }
  function aa(e) {
    e >>>= 0;
    var r = (w(), ne).length;
    if (e <= r || 4294901760 < e) return false;
    for (var i = 1; 4 >= i; i *= 2) {
      var s = r * (1 + 0.2 / i);
      s = Math.min(s, e + 100663296);
      e: {
        s = (Math.min(4294901760, 65536 * Math.ceil(Math.max(e, s) / 65536)) - ge.buffer.byteLength + 65535) / 65536 | 0;
        try {
          ge.grow(s), ee();
          var f = 1;
          break e;
        } catch {
        }
        f = void 0;
      }
      if (f) return true;
    }
    return false;
  }
  function sa(e, r, i) {
    if (e >>>= 0, r >>>= 0, Ie.Xb == e) var s = Ie.bc;
    else (s = Error().stack.toString().split(`
`))[0] == "Error" && s.shift(), jn(s);
    for (var f = 3; s[f] && ot(s[f]) != e; ) ++f;
    for (e = 0; e < i && s[e + f]; ++e) (w(), B)[r + 4 * e >>> 2 >>> 0] = ot(s[e + f]);
    return e;
  }
  var Gt, $t = {}, Vn = () => {
    if (!Gt) {
      var e, r = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8", _: "./this.program" };
      for (e in $t) $t[e] === void 0 ? delete r[e] : r[e] = $t[e];
      var i = [];
      for (e in r) i.push(`${e}=${r[e]}`);
      Gt = i;
    }
    return Gt;
  };
  function Yn(e, r) {
    if (o) return L(19, 1, e, r);
    e >>>= 0, r >>>= 0;
    var i, s = 0, f = 0;
    for (i of Vn()) {
      var p = r + s;
      (w(), W)[e + f >>> 2 >>> 0] = p, s += Oe(i, p, 1 / 0) + 1, f += 4;
    }
    return 0;
  }
  function qn(e, r) {
    if (o) return L(20, 1, e, r);
    e >>>= 0, r >>>= 0;
    var i = Vn();
    for (var s of ((w(), W)[e >>> 2 >>> 0] = i.length, e = 0, i)) e += Wt(s) + 1;
    return (w(), W)[r >>> 2 >>> 0] = e, 0;
  }
  function Jn(e) {
    return o ? L(21, 1, e) : 52;
  }
  function Xn(e, r, i, s, f) {
    return o ? L(22, 1, e, r, i, s, f) : 52;
  }
  function Zn(e, r, i, s) {
    return o ? L(23, 1, e, r, i, s) : 52;
  }
  function Qn(e, r, i, s) {
    return o ? L(24, 1, e, r, i, s) : 70;
  }
  var ia = [null, [], []];
  function Kn(e, r, i, s) {
    if (o) return L(25, 1, e, r, i, s);
    r >>>= 0, i >>>= 0, s >>>= 0;
    for (var f = 0, p = 0; p < i; p++) {
      var E = (w(), W)[r >>> 2 >>> 0], S = (w(), W)[r + 4 >>> 2 >>> 0];
      r += 8;
      for (var C = 0; C < S; C++) {
        var R = e, X = (w(), ne)[E + C >>> 0], le = ia[R];
        X === 0 || X === 10 ? ((R === 1 ? A : F)(On(le)), le.length = 0) : le.push(X);
      }
      f += S;
    }
    return (w(), W)[s >>> 2 >>> 0] = f, 0;
  }
  function ua(e) {
    return e >>> 0;
  }
  o || function() {
    for (var e = t.numThreads - 1; e--; ) yn();
    Ve.push(async () => {
      var r = async function() {
        if (!o) return Promise.all(ce.map(bn));
      }();
      Re++, await r, --Re == 0 && te && (r = te, te = null, r());
    });
  }(), o || (ge = new WebAssembly.Memory({ initial: 256, maximum: 65536, shared: true }), ee()), t.wasmBinary && (g = t.wasmBinary), t.stackSave = () => U(), t.stackRestore = (e) => _(e), t.stackAlloc = (e) => jt(e), t.setValue = function(e, r, i = "i8") {
    switch (i.endsWith("*") && (i = "*"), i) {
      case "i1":
      case "i8":
        (w(), H)[e >>> 0] = r;
        break;
      case "i16":
        (w(), pe)[e >>> 1 >>> 0] = r;
        break;
      case "i32":
        (w(), B)[e >>> 2 >>> 0] = r;
        break;
      case "i64":
        (w(), O)[e >>> 3 >>> 0] = BigInt(r);
        break;
      case "float":
        (w(), re)[e >>> 2 >>> 0] = r;
        break;
      case "double":
        (w(), me)[e >>> 3 >>> 0] = r;
        break;
      case "*":
        (w(), W)[e >>> 2 >>> 0] = r;
        break;
      default:
        j(`invalid type for setValue: ${i}`);
    }
  }, t.getValue = function(e, r = "i8") {
    switch (r.endsWith("*") && (r = "*"), r) {
      case "i1":
      case "i8":
        return (w(), H)[e >>> 0];
      case "i16":
        return (w(), pe)[e >>> 1 >>> 0];
      case "i32":
        return (w(), B)[e >>> 2 >>> 0];
      case "i64":
        return (w(), O)[e >>> 3 >>> 0];
      case "float":
        return (w(), re)[e >>> 2 >>> 0];
      case "double":
        return (w(), me)[e >>> 3 >>> 0];
      case "*":
        return (w(), W)[e >>> 2 >>> 0];
      default:
        j(`invalid type for getValue: ${r}`);
    }
  }, t.UTF8ToString = Mt, t.stringToUTF8 = Oe, t.lengthBytesUTF8 = Wt;
  var st, er, tr, zt, nr, rr, or, Ht, ar, sr, x, qe, ir, _, jt, U, ur, Vt, fr, cr, lr, Ee, fa = [V, fe, Sn, In, Bn, Ln, _n, Dn, Pn, Un, xn, Cn, Mn, Rn, Fn, Nn, $n, zn, Hn, Yn, qn, Jn, Xn, Zn, Qn, Kn], dr = { 1042604: (e, r, i, s, f) => {
    if (t === void 0 || !t.Tb) return 1;
    if ((e = Mt(Number(e >>> 0))).startsWith("./") && (e = e.substring(2)), !(e = t.Tb.get(e))) return 2;
    if (r = Number(r >>> 0), i = Number(i >>> 0), s = Number(s >>> 0), r + i > e.byteLength) return 3;
    try {
      let p = e.subarray(r, r + i);
      switch (f) {
        case 0:
          (w(), ne).set(p, s >>> 0);
          break;
        case 1:
          t.ic ? t.ic(s, p) : t.kc(s, p);
          break;
        default:
          return 4;
      }
      return 0;
    } catch {
      return 4;
    }
  }, 1043428: () => typeof wasmOffsetConverter < "u" };
  function ca() {
    return typeof wasmOffsetConverter < "u";
  }
  function la(e, r, i, s) {
    var f = U();
    try {
      return M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function da(e, r, i) {
    var s = U();
    try {
      return M(e)(r, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      x(1, 0);
    }
  }
  function pa(e) {
    var r = U();
    try {
      M(e)();
    } catch (i) {
      if (_(r), i !== i + 0) throw i;
      x(1, 0);
    }
  }
  function ma(e, r) {
    var i = U();
    try {
      return M(e)(r);
    } catch (s) {
      if (_(i), s !== s + 0) throw s;
      x(1, 0);
    }
  }
  function ha(e, r, i) {
    var s = U();
    try {
      M(e)(r, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      x(1, 0);
    }
  }
  function wa(e, r) {
    var i = U();
    try {
      M(e)(r);
    } catch (s) {
      if (_(i), s !== s + 0) throw s;
      x(1, 0);
    }
  }
  function ba(e, r, i, s, f, p, E) {
    var S = U();
    try {
      return M(e)(r, i, s, f, p, E);
    } catch (C) {
      if (_(S), C !== C + 0) throw C;
      x(1, 0);
    }
  }
  function ya(e, r, i, s, f, p) {
    var E = U();
    try {
      M(e)(r, i, s, f, p);
    } catch (S) {
      if (_(E), S !== S + 0) throw S;
      x(1, 0);
    }
  }
  function ga(e, r, i, s) {
    var f = U();
    try {
      M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function Ea(e, r, i, s, f) {
    var p = U();
    try {
      M(e)(r, i, s, f);
    } catch (E) {
      if (_(p), E !== E + 0) throw E;
      x(1, 0);
    }
  }
  function Ta(e, r, i, s, f, p, E) {
    var S = U();
    try {
      M(e)(r, i, s, f, p, E);
    } catch (C) {
      if (_(S), C !== C + 0) throw C;
      x(1, 0);
    }
  }
  function Sa(e, r, i, s, f, p, E) {
    var S = U();
    try {
      M(e)(r, i, s, f, p, E);
    } catch (C) {
      if (_(S), C !== C + 0) throw C;
      x(1, 0);
    }
  }
  function va(e, r, i, s, f, p, E, S) {
    var C = U();
    try {
      M(e)(r, i, s, f, p, E, S);
    } catch (R) {
      if (_(C), R !== R + 0) throw R;
      x(1, 0);
    }
  }
  function Aa(e, r, i, s, f) {
    var p = U();
    try {
      return M(e)(r, i, s, f);
    } catch (E) {
      if (_(p), E !== E + 0) throw E;
      x(1, 0);
    }
  }
  function Oa(e, r, i) {
    var s = U();
    try {
      return M(e)(r, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      x(1, 0);
    }
  }
  function Ia(e, r, i, s, f, p, E, S) {
    var C = U();
    try {
      M(e)(r, i, s, f, p, E, S);
    } catch (R) {
      if (_(C), R !== R + 0) throw R;
      x(1, 0);
    }
  }
  function Ba(e, r, i, s, f, p, E, S, C, R, X, le) {
    var we = U();
    try {
      M(e)(r, i, s, f, p, E, S, C, R, X, le);
    } catch (be) {
      if (_(we), be !== be + 0) throw be;
      x(1, 0);
    }
  }
  function La(e, r, i) {
    var s = U();
    try {
      return M(e)(r, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      return x(1, 0), 0n;
    }
  }
  function _a(e, r, i, s, f, p, E, S, C) {
    var R = U();
    try {
      M(e)(r, i, s, f, p, E, S, C);
    } catch (X) {
      if (_(R), X !== X + 0) throw X;
      x(1, 0);
    }
  }
  function Da(e) {
    var r = U();
    try {
      return M(e)();
    } catch (i) {
      if (_(r), i !== i + 0) throw i;
      x(1, 0);
    }
  }
  function Pa(e, r) {
    var i = U();
    try {
      return M(e)(r);
    } catch (s) {
      if (_(i), s !== s + 0) throw s;
      return x(1, 0), 0n;
    }
  }
  function Ua(e, r, i, s) {
    var f = U();
    try {
      return M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function xa(e) {
    var r = U();
    try {
      return M(e)();
    } catch (i) {
      if (_(r), i !== i + 0) throw i;
      return x(1, 0), 0n;
    }
  }
  function Ca(e, r, i, s) {
    var f = U();
    try {
      return M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function Ma(e, r, i, s, f) {
    var p = U();
    try {
      return M(e)(r, i, s, f);
    } catch (E) {
      if (_(p), E !== E + 0) throw E;
      x(1, 0);
    }
  }
  function Ra(e, r, i, s, f, p) {
    var E = U();
    try {
      return M(e)(r, i, s, f, p);
    } catch (S) {
      if (_(E), S !== S + 0) throw S;
      x(1, 0);
    }
  }
  function Fa(e, r, i, s, f, p) {
    var E = U();
    try {
      return M(e)(r, i, s, f, p);
    } catch (S) {
      if (_(E), S !== S + 0) throw S;
      x(1, 0);
    }
  }
  function Na(e, r, i, s, f, p) {
    var E = U();
    try {
      return M(e)(r, i, s, f, p);
    } catch (S) {
      if (_(E), S !== S + 0) throw S;
      x(1, 0);
    }
  }
  function ka(e, r, i, s, f, p, E, S) {
    var C = U();
    try {
      return M(e)(r, i, s, f, p, E, S);
    } catch (R) {
      if (_(C), R !== R + 0) throw R;
      x(1, 0);
    }
  }
  function Wa(e, r, i, s, f) {
    var p = U();
    try {
      return M(e)(r, i, s, f);
    } catch (E) {
      if (_(p), E !== E + 0) throw E;
      return x(1, 0), 0n;
    }
  }
  function Ga(e, r, i, s) {
    var f = U();
    try {
      return M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function $a(e, r, i, s) {
    var f = U();
    try {
      return M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function za(e, r, i, s, f, p, E, S, C, R, X, le) {
    var we = U();
    try {
      return M(e)(r, i, s, f, p, E, S, C, R, X, le);
    } catch (be) {
      if (_(we), be !== be + 0) throw be;
      x(1, 0);
    }
  }
  function Ha(e, r, i, s, f, p, E, S, C, R, X) {
    var le = U();
    try {
      M(e)(r, i, s, f, p, E, S, C, R, X);
    } catch (we) {
      if (_(le), we !== we + 0) throw we;
      x(1, 0);
    }
  }
  function ja(e, r, i, s, f, p, E, S, C, R, X, le, we, be, Ja, Xa) {
    var Za = U();
    try {
      M(e)(r, i, s, f, p, E, S, C, R, X, le, we, be, Ja, Xa);
    } catch (Yt) {
      if (_(Za), Yt !== Yt + 0) throw Yt;
      x(1, 0);
    }
  }
  function Va(e, r, i) {
    var s = U();
    try {
      return M(e)(r, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      x(1, 0);
    }
  }
  function Ya(e, r, i) {
    var s = U();
    try {
      return M(e)(r, i);
    } catch (f) {
      if (_(s), f !== f + 0) throw f;
      x(1, 0);
    }
  }
  function qa(e, r, i, s) {
    var f = U();
    try {
      M(e)(r, i, s);
    } catch (p) {
      if (_(f), p !== p + 0) throw p;
      x(1, 0);
    }
  }
  function it() {
    if (0 < Re) te = it;
    else if (o) T?.(t), he();
    else {
      for (var e = Ve; 0 < e.length; ) e.shift()(t);
      0 < Re ? te = it : (t.calledRun = true, P || (he(), T?.(t)));
    }
  }
  return o || (Ee = await Ut(), it()), t.PTR_SIZE = 4, je ? t : new Promise((e, r) => {
    T = e, I = r;
  });
}
var as;
var ss;
var Jr = N(() => {
  "use strict";
  as = Yr, ss = globalThis.self?.name?.startsWith("em-pthread");
  ss && Yr();
});
var Qr;
var an;
var is;
var oe;
var Kr;
var on;
var us;
var fs;
var eo;
var cs;
var Xr;
var to;
var Zr;
var no;
var pt = N(() => {
  "use strict";
  dt();
  Qr = typeof location > "u" ? void 0 : location.origin, an = import.meta.url > "file:" && import.meta.url < "file;", is = () => {
    if (true) {
      if (an) {
        let n = URL;
        return new URL(new n("ort.wasm.bundle.min.mjs", import.meta.url).href, Qr).href;
      }
      return import.meta.url;
    }
  }, oe = is(), Kr = () => {
    if (oe && !oe.startsWith("blob:")) return oe.substring(0, oe.lastIndexOf("/") + 1);
  }, on = (n, t) => {
    try {
      let a = t ?? oe;
      return (a ? new URL(n, a) : new URL(n)).origin === Qr;
    } catch {
      return false;
    }
  }, us = (n, t) => {
    let a = t ?? oe;
    try {
      return (a ? new URL(n, a) : new URL(n)).href;
    } catch {
      return;
    }
  }, fs = (n, t) => `${t ?? "./"}${n}`, eo = async (n) => {
    let a = await (await fetch(n, { credentials: "same-origin" })).blob();
    return URL.createObjectURL(a);
  }, cs = async (n) => (await import(
    /*webpackIgnore:true*/
    /*@vite-ignore*/
    n
  )).default, Xr = (Vr(), Xt(jr)).default, to = async () => {
    if (!oe) throw new Error("Failed to load proxy worker: cannot determine the script source URL.");
    if (on(oe)) return [void 0, Xr()];
    let n = await eo(oe);
    return [n, Xr(n)];
  }, Zr = (Jr(), Xt(qr)).default, no = async (n, t, a, u2) => {
    let o = Zr && !(n || t);
    if (o) if (oe) o = on(oe) || u2 && !a;
    else if (u2 && !a) o = true;
    else throw new Error("cannot determine the script source URL.");
    if (o) return [void 0, Zr];
    {
      let d = "ort-wasm-simd-threaded.mjs", c = n ?? us(d, t), l = a && c && !on(c, t), m = l ? await eo(c) : c ?? fs(d, t);
      return [l ? m : void 0, await cs(m)];
    }
  };
});
var sn;
var un;
var St;
var ro;
var ls;
var ds;
var ps;
var mt;
var z;
var xe = N(() => {
  "use strict";
  pt();
  un = false, St = false, ro = false, ls = () => {
    if (typeof SharedArrayBuffer > "u") return false;
    try {
      return typeof MessageChannel < "u" && new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)), WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 4, 1, 3, 1, 1, 10, 11, 1, 9, 0, 65, 0, 254, 16, 2, 0, 26, 11]));
    } catch {
      return false;
    }
  }, ds = () => {
    try {
      return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 30, 1, 28, 0, 65, 0, 253, 15, 253, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 253, 186, 1, 26, 11]));
    } catch {
      return false;
    }
  }, ps = () => {
    try {
      return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 19, 1, 17, 0, 65, 1, 253, 15, 65, 2, 253, 15, 65, 3, 253, 15, 253, 147, 2, 11]));
    } catch {
      return false;
    }
  }, mt = async (n) => {
    if (un) return Promise.resolve();
    if (St) throw new Error("multiple calls to 'initializeWebAssembly()' detected.");
    if (ro) throw new Error("previous call to 'initializeWebAssembly()' failed.");
    St = true;
    let t = n.initTimeout, a = n.numThreads;
    if (n.simd !== false) {
      if (n.simd === "relaxed") {
        if (!ps()) throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.");
      } else if (!ds()) throw new Error("WebAssembly SIMD is not supported in the current environment.");
    }
    let u2 = ls();
    a > 1 && !u2 && (typeof self < "u" && !self.crossOriginIsolated && console.warn("env.wasm.numThreads is set to " + a + ", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."), console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."), n.numThreads = a = 1);
    let o = n.wasmPaths, d = typeof o == "string" ? o : void 0, c = o?.mjs, l = c?.href ?? c, m = o?.wasm, h = m?.href ?? m, g = n.wasmBinary, [b, y] = await no(l, d, a > 1, !!g || !!h), T = false, I = [];
    if (t > 0 && I.push(new Promise((D) => {
      setTimeout(() => {
        T = true, D();
      }, t);
    })), I.push(new Promise((D, $) => {
      let v = { numThreads: a };
      if (g) v.wasmBinary = g, v.locateFile = (A) => A;
      else if (h || d) v.locateFile = (A) => h ?? d + A;
      else if (l && l.indexOf("blob:") !== 0) v.locateFile = (A) => new URL(A, l).href;
      else if (b) {
        let A = Kr();
        A && (v.locateFile = (F) => A + F);
      }
      y(v).then((A) => {
        St = false, un = true, sn = A, D(), b && URL.revokeObjectURL(b);
      }, (A) => {
        St = false, ro = true, $(A);
      });
    })), await Promise.race(I), T) throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`);
  }, z = () => {
    if (un && sn) return sn;
    throw new Error("WebAssembly is not initialized yet.");
  };
});
var ae;
var Qe;
var G;
var vt = N(() => {
  "use strict";
  xe();
  ae = (n, t) => {
    let a = z(), u2 = a.lengthBytesUTF8(n) + 1, o = a._malloc(u2);
    return a.stringToUTF8(n, o, u2), t.push(o), o;
  }, Qe = (n, t, a, u2) => {
    if (typeof n == "object" && n !== null) {
      if (a.has(n)) throw new Error("Circular reference in options");
      a.add(n);
    }
    Object.entries(n).forEach(([o, d]) => {
      let c = t ? t + o : o;
      if (typeof d == "object") Qe(d, c + ".", a, u2);
      else if (typeof d == "string" || typeof d == "number") u2(c, d.toString());
      else if (typeof d == "boolean") u2(c, d ? "1" : "0");
      else throw new Error(`Can't handle extra config type: ${typeof d}`);
    });
  }, G = (n) => {
    let t = z(), a = t.stackSave();
    try {
      let u2 = t.PTR_SIZE, o = t.stackAlloc(2 * u2);
      t._OrtGetLastError(o, o + u2);
      let d = Number(t.getValue(o, u2 === 4 ? "i32" : "i64")), c = t.getValue(o + u2, "*"), l = c ? t.UTF8ToString(c) : "";
      throw new Error(`${n} ERROR_CODE: ${d}, ERROR_MESSAGE: ${l}`);
    } finally {
      t.stackRestore(a);
    }
  };
});
var oo;
var ao = N(() => {
  "use strict";
  xe();
  vt();
  oo = (n) => {
    let t = z(), a = 0, u2 = [], o = n || {};
    try {
      if (n?.logSeverityLevel === void 0) o.logSeverityLevel = 2;
      else if (typeof n.logSeverityLevel != "number" || !Number.isInteger(n.logSeverityLevel) || n.logSeverityLevel < 0 || n.logSeverityLevel > 4) throw new Error(`log severity level is not valid: ${n.logSeverityLevel}`);
      if (n?.logVerbosityLevel === void 0) o.logVerbosityLevel = 0;
      else if (typeof n.logVerbosityLevel != "number" || !Number.isInteger(n.logVerbosityLevel)) throw new Error(`log verbosity level is not valid: ${n.logVerbosityLevel}`);
      n?.terminate === void 0 && (o.terminate = false);
      let d = 0;
      return n?.tag !== void 0 && (d = ae(n.tag, u2)), a = t._OrtCreateRunOptions(o.logSeverityLevel, o.logVerbosityLevel, !!o.terminate, d), a === 0 && G("Can't create run options."), n?.extra !== void 0 && Qe(n.extra, "", /* @__PURE__ */ new WeakSet(), (c, l) => {
        let m = ae(c, u2), h = ae(l, u2);
        t._OrtAddRunConfigEntry(a, m, h) !== 0 && G(`Can't set a run config entry: ${c} - ${l}.`);
      }), [a, u2];
    } catch (d) {
      throw a !== 0 && t._OrtReleaseRunOptions(a), u2.forEach((c) => t._free(c)), d;
    }
  };
});
var ms;
var hs;
var ws;
var ke;
var bs;
var so;
var io = N(() => {
  "use strict";
  xe();
  vt();
  ms = (n) => {
    switch (n) {
      case "disabled":
        return 0;
      case "basic":
        return 1;
      case "extended":
        return 2;
      case "layout":
        return 3;
      case "all":
        return 99;
      default:
        throw new Error(`unsupported graph optimization level: ${n}`);
    }
  }, hs = (n) => {
    switch (n) {
      case "sequential":
        return 0;
      case "parallel":
        return 1;
      default:
        throw new Error(`unsupported execution mode: ${n}`);
    }
  }, ws = (n) => {
    n.extra || (n.extra = {}), n.extra.session || (n.extra.session = {});
    let t = n.extra.session;
    t.use_ort_model_bytes_directly || (t.use_ort_model_bytes_directly = "1"), n.executionProviders && n.executionProviders.some((a) => (typeof a == "string" ? a : a.name) === "webgpu") && (n.enableMemPattern = false);
  }, ke = (n, t, a, u2) => {
    let o = ae(t, u2), d = ae(a, u2);
    z()._OrtAddSessionConfigEntry(n, o, d) !== 0 && G(`Can't set a session config entry: ${t} - ${a}.`);
  }, bs = async (n, t, a) => {
    let u2 = t.executionProviders;
    for (let o of u2) {
      let d = typeof o == "string" ? o : o.name, c = [];
      switch (d) {
        case "webnn":
          if (d = "WEBNN", ke(n, "session.disable_quant_qdq", "1", a), ke(n, "session.disable_qdq_constant_folding", "1", a), typeof o != "string") {
            let y = o?.deviceType;
            y && ke(n, "deviceType", y, a);
          }
          break;
        case "webgpu":
          if (d = "JS", typeof o != "string") {
            let b = o;
            if (b?.preferredLayout) {
              if (b.preferredLayout !== "NCHW" && b.preferredLayout !== "NHWC") throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${b.preferredLayout}`);
              ke(n, "preferredLayout", b.preferredLayout, a);
            }
          }
          break;
        case "wasm":
        case "cpu":
          continue;
        default:
          throw new Error(`not supported execution provider: ${d}`);
      }
      let l = ae(d, a), m = c.length, h = 0, g = 0;
      if (m > 0) {
        h = z()._malloc(m * z().PTR_SIZE), a.push(h), g = z()._malloc(m * z().PTR_SIZE), a.push(g);
        for (let b = 0; b < m; b++) z().setValue(h + b * z().PTR_SIZE, c[b][0], "*"), z().setValue(g + b * z().PTR_SIZE, c[b][1], "*");
      }
      await z()._OrtAppendExecutionProvider(n, l, h, g, m) !== 0 && G(`Can't append execution provider: ${d}.`);
    }
  }, so = async (n) => {
    let t = z(), a = 0, u2 = [], o = n || {};
    ws(o);
    try {
      let d = ms(o.graphOptimizationLevel ?? "all"), c = hs(o.executionMode ?? "sequential"), l = typeof o.logId == "string" ? ae(o.logId, u2) : 0, m = o.logSeverityLevel ?? 2;
      if (!Number.isInteger(m) || m < 0 || m > 4) throw new Error(`log severity level is not valid: ${m}`);
      let h = o.logVerbosityLevel ?? 0;
      if (!Number.isInteger(h) || h < 0 || h > 4) throw new Error(`log verbosity level is not valid: ${h}`);
      let g = typeof o.optimizedModelFilePath == "string" ? ae(o.optimizedModelFilePath, u2) : 0;
      if (a = t._OrtCreateSessionOptions(d, !!o.enableCpuMemArena, !!o.enableMemPattern, c, !!o.enableProfiling, 0, l, m, h, g), a === 0 && G("Can't create session options."), o.executionProviders && await bs(a, o, u2), o.enableGraphCapture !== void 0) {
        if (typeof o.enableGraphCapture != "boolean") throw new Error(`enableGraphCapture must be a boolean value: ${o.enableGraphCapture}`);
        ke(a, "enableGraphCapture", o.enableGraphCapture.toString(), u2);
      }
      if (o.freeDimensionOverrides) for (let [b, y] of Object.entries(o.freeDimensionOverrides)) {
        if (typeof b != "string") throw new Error(`free dimension override name must be a string: ${b}`);
        if (typeof y != "number" || !Number.isInteger(y) || y < 0) throw new Error(`free dimension override value must be a non-negative integer: ${y}`);
        let T = ae(b, u2);
        t._OrtAddFreeDimensionOverride(a, T, y) !== 0 && G(`Can't set a free dimension override: ${b} - ${y}.`);
      }
      return o.extra !== void 0 && Qe(o.extra, "", /* @__PURE__ */ new WeakSet(), (b, y) => {
        ke(a, b, y, u2);
      }), [a, u2];
    } catch (d) {
      throw a !== 0 && t._OrtReleaseSessionOptions(a) !== 0 && G("Can't release session options."), u2.forEach((c) => t._free(c)), d;
    }
  };
});
var We;
var At;
var Ge;
var uo;
var fo;
var Ot;
var It;
var co;
var fn = N(() => {
  "use strict";
  We = (n) => {
    switch (n) {
      case "int8":
        return 3;
      case "uint8":
        return 2;
      case "bool":
        return 9;
      case "int16":
        return 5;
      case "uint16":
        return 4;
      case "int32":
        return 6;
      case "uint32":
        return 12;
      case "float16":
        return 10;
      case "float32":
        return 1;
      case "float64":
        return 11;
      case "string":
        return 8;
      case "int64":
        return 7;
      case "uint64":
        return 13;
      case "int4":
        return 22;
      case "uint4":
        return 21;
      default:
        throw new Error(`unsupported data type: ${n}`);
    }
  }, At = (n) => {
    switch (n) {
      case 3:
        return "int8";
      case 2:
        return "uint8";
      case 9:
        return "bool";
      case 5:
        return "int16";
      case 4:
        return "uint16";
      case 6:
        return "int32";
      case 12:
        return "uint32";
      case 10:
        return "float16";
      case 1:
        return "float32";
      case 11:
        return "float64";
      case 8:
        return "string";
      case 7:
        return "int64";
      case 13:
        return "uint64";
      case 22:
        return "int4";
      case 21:
        return "uint4";
      default:
        throw new Error(`unsupported data type: ${n}`);
    }
  }, Ge = (n, t) => {
    let a = [-1, 4, 1, 1, 2, 2, 4, 8, -1, 1, 2, 8, 4, 8, -1, -1, -1, -1, -1, -1, -1, 0.5, 0.5][n], u2 = typeof t == "number" ? t : t.reduce((o, d) => o * d, 1);
    return a > 0 ? Math.ceil(u2 * a) : void 0;
  }, uo = (n) => {
    switch (n) {
      case "float16":
        return typeof Float16Array < "u" ? Float16Array : Uint16Array;
      case "float32":
        return Float32Array;
      case "uint8":
        return Uint8Array;
      case "int8":
        return Int8Array;
      case "uint16":
        return Uint16Array;
      case "int16":
        return Int16Array;
      case "int32":
        return Int32Array;
      case "bool":
        return Uint8Array;
      case "float64":
        return Float64Array;
      case "uint32":
        return Uint32Array;
      case "int64":
        return BigInt64Array;
      case "uint64":
        return BigUint64Array;
      default:
        throw new Error(`unsupported type: ${n}`);
    }
  }, fo = (n) => {
    switch (n) {
      case "verbose":
        return 0;
      case "info":
        return 1;
      case "warning":
        return 2;
      case "error":
        return 3;
      case "fatal":
        return 4;
      default:
        throw new Error(`unsupported logging level: ${n}`);
    }
  }, Ot = (n) => n === "float32" || n === "float16" || n === "int32" || n === "int64" || n === "uint32" || n === "uint8" || n === "bool" || n === "uint4" || n === "int4", It = (n) => n === "float32" || n === "float16" || n === "int32" || n === "int64" || n === "uint32" || n === "uint64" || n === "int8" || n === "uint8" || n === "bool" || n === "uint4" || n === "int4", co = (n) => {
    switch (n) {
      case "none":
        return 0;
      case "cpu":
        return 1;
      case "cpu-pinned":
        return 2;
      case "texture":
        return 3;
      case "gpu-buffer":
        return 4;
      case "ml-tensor":
        return 5;
      default:
        throw new Error(`unsupported data location: ${n}`);
    }
  };
});
var Ke;
var cn = N(() => {
  "use strict";
  dt();
  Ke = async (n) => {
    if (typeof n == "string") if (false) try {
      let { readFile: t } = Jt("node:fs/promises");
      return new Uint8Array(await t(n));
    } catch (t) {
      if (t.code === "ERR_FS_FILE_TOO_LARGE") {
        let { createReadStream: a } = Jt("node:fs"), u2 = a(n), o = [];
        for await (let d of u2) o.push(d);
        return new Uint8Array(Buffer.concat(o));
      }
      throw t;
    }
    else {
      let t = await fetch(n);
      if (!t.ok) throw new Error(`failed to load external data file: ${n}`);
      let a = t.headers.get("Content-Length"), u2 = a ? parseInt(a, 10) : 0;
      if (u2 < 1073741824) return new Uint8Array(await t.arrayBuffer());
      {
        if (!t.body) throw new Error(`failed to load external data file: ${n}, no response body.`);
        let o = t.body.getReader(), d;
        try {
          d = new ArrayBuffer(u2);
        } catch (l) {
          if (l instanceof RangeError) {
            let m = Math.ceil(u2 / 65536);
            d = new WebAssembly.Memory({ initial: m, maximum: m }).buffer;
          } else throw l;
        }
        let c = 0;
        for (; ; ) {
          let { done: l, value: m } = await o.read();
          if (l) break;
          let h = m.byteLength;
          new Uint8Array(d, c, h).set(m), c += h;
        }
        return new Uint8Array(d, 0, u2);
      }
    }
    else return n instanceof Blob ? new Uint8Array(await n.arrayBuffer()) : n instanceof Uint8Array ? n : new Uint8Array(n);
  };
});
var ys;
var ht;
var wt;
var $e;
var gs;
var lo;
var Ze;
var bt;
var yt;
var po;
var gt;
var Et;
var Tt;
var rn = N(() => {
  "use strict";
  Te();
  ao();
  io();
  fn();
  xe();
  vt();
  cn();
  ys = (n, t) => {
    z()._OrtInit(n, t) !== 0 && G("Can't initialize onnxruntime.");
  }, ht = async (n) => {
    ys(n.wasm.numThreads, fo(n.logLevel));
  }, wt = async (n, t) => {
    z().asyncInit?.();
    let a = n.webgpu.adapter;
    if (t === "webgpu") {
      if (typeof navigator > "u" || !navigator.gpu) throw new Error("WebGPU is not supported in current environment");
      if (a) {
        if (typeof a.limits != "object" || typeof a.features != "object" || typeof a.requestDevice != "function") throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.");
      } else {
        let u2 = n.webgpu.powerPreference;
        if (u2 !== void 0 && u2 !== "low-power" && u2 !== "high-performance") throw new Error(`Invalid powerPreference setting: "${u2}"`);
        let o = n.webgpu.forceFallbackAdapter;
        if (o !== void 0 && typeof o != "boolean") throw new Error(`Invalid forceFallbackAdapter setting: "${o}"`);
        if (a = await navigator.gpu.requestAdapter({ powerPreference: u2, forceFallbackAdapter: o }), !a) throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.');
      }
    }
    if (t === "webnn" && (typeof navigator > "u" || !navigator.ml)) throw new Error("WebNN is not supported in current environment");
  }, $e = /* @__PURE__ */ new Map(), gs = (n) => {
    let t = z(), a = t.stackSave();
    try {
      let u2 = t.PTR_SIZE, o = t.stackAlloc(2 * u2);
      t._OrtGetInputOutputCount(n, o, o + u2) !== 0 && G("Can't get session input/output count.");
      let c = u2 === 4 ? "i32" : "i64";
      return [Number(t.getValue(o, c)), Number(t.getValue(o + u2, c))];
    } finally {
      t.stackRestore(a);
    }
  }, lo = (n, t) => {
    let a = z(), u2 = a.stackSave(), o = 0;
    try {
      let d = a.PTR_SIZE, c = a.stackAlloc(2 * d);
      a._OrtGetInputOutputMetadata(n, t, c, c + d) !== 0 && G("Can't get session input/output metadata.");
      let m = Number(a.getValue(c, "*"));
      o = Number(a.getValue(c + d, "*"));
      let h = a.HEAP32[o / 4];
      if (h === 0) return [m, 0];
      let g = a.HEAPU32[o / 4 + 1], b = [];
      for (let y = 0; y < g; y++) {
        let T = Number(a.getValue(o + 8 + y * d, "*"));
        b.push(T !== 0 ? a.UTF8ToString(T) : Number(a.getValue(o + 8 + (y + g) * d, "*")));
      }
      return [m, h, b];
    } finally {
      a.stackRestore(u2), o !== 0 && a._OrtFree(o);
    }
  }, Ze = (n) => {
    let t = z(), a = t._malloc(n.byteLength);
    if (a === 0) throw new Error(`Can't create a session. failed to allocate a buffer of size ${n.byteLength}.`);
    return t.HEAPU8.set(n, a), [a, n.byteLength];
  }, bt = async (n, t) => {
    let a, u2, o = z();
    Array.isArray(n) ? [a, u2] = n : n.buffer === o.HEAPU8.buffer ? [a, u2] = [n.byteOffset, n.byteLength] : [a, u2] = Ze(n);
    let d = 0, c = 0, l = 0, m = [], h = [], g = [];
    try {
      if ([c, m] = await so(t), t?.externalData && o.mountExternalData) {
        let P = [];
        for (let k of t.externalData) {
          let w = typeof k == "string" ? k : k.path, Q = typeof k == "string" ? k : k.data;
          P.push(Ke(Q).then((H) => {
            o.mountExternalData(w, H);
          }));
        }
        await Promise.all(P);
      }
      for (let P of t?.executionProviders ?? []) if ((typeof P == "string" ? P : P.name) === "webnn") {
        if (o.shouldTransferToMLTensor = false, typeof P != "string") {
          let w = P, Q = w?.context, H = w?.gpuDevice, ne = w?.deviceType, pe = w?.powerPreference;
          Q ? o.currentContext = Q : H ? o.currentContext = await o.webnnCreateMLContext(H) : o.currentContext = await o.webnnCreateMLContext({ deviceType: ne, powerPreference: pe });
        } else o.currentContext = await o.webnnCreateMLContext();
        break;
      }
      d = await o._OrtCreateSession(a, u2, c), o.webgpuOnCreateSession?.(d), d === 0 && G("Can't create a session."), o.jsepOnCreateSession?.(), o.currentContext && (o.webnnRegisterMLContext(d, o.currentContext), o.currentContext = void 0, o.shouldTransferToMLTensor = true);
      let [b, y] = gs(d), T = !!t?.enableGraphCapture, I = [], D = [], $ = [], v = [], A = [];
      for (let P = 0; P < b; P++) {
        let [k, w, Q] = lo(d, P);
        k === 0 && G("Can't get an input name."), h.push(k);
        let H = o.UTF8ToString(k);
        I.push(H), $.push(w === 0 ? { name: H, isTensor: false } : { name: H, isTensor: true, type: At(w), shape: Q });
      }
      for (let P = 0; P < y; P++) {
        let [k, w, Q] = lo(d, P + b);
        k === 0 && G("Can't get an output name."), g.push(k);
        let H = o.UTF8ToString(k);
        D.push(H), v.push(w === 0 ? { name: H, isTensor: false } : { name: H, isTensor: true, type: At(w), shape: Q });
      }
      return $e.set(d, [d, h, g, null, T, false]), [d, I, D, $, v];
    } catch (b) {
      throw h.forEach((y) => o._OrtFree(y)), g.forEach((y) => o._OrtFree(y)), l !== 0 && o._OrtReleaseBinding(l) !== 0 && G("Can't release IO binding."), d !== 0 && o._OrtReleaseSession(d) !== 0 && G("Can't release session."), b;
    } finally {
      o._free(a), c !== 0 && o._OrtReleaseSessionOptions(c) !== 0 && G("Can't release session options."), m.forEach((b) => o._free(b)), o.unmountExternalData?.();
    }
  }, yt = (n) => {
    let t = z(), a = $e.get(n);
    if (!a) throw new Error(`cannot release session. invalid session id: ${n}`);
    let [u2, o, d, c, l] = a;
    c && (l && t._OrtClearBoundOutputs(c.handle) !== 0 && G("Can't clear bound outputs."), t._OrtReleaseBinding(c.handle) !== 0 && G("Can't release IO binding.")), t.jsepOnReleaseSession?.(n), t.webnnOnReleaseSession?.(n), t.webgpuOnReleaseSession?.(n), o.forEach((m) => t._OrtFree(m)), d.forEach((m) => t._OrtFree(m)), t._OrtReleaseSession(u2) !== 0 && G("Can't release session."), $e.delete(n);
  }, po = async (n, t, a, u2, o, d, c = false) => {
    if (!n) {
      t.push(0);
      return;
    }
    let l = z(), m = l.PTR_SIZE, h = n[0], g = n[1], b = n[3], y = b, T, I;
    if (h === "string" && (b === "gpu-buffer" || b === "ml-tensor")) throw new Error("String tensor is not supported on GPU.");
    if (c && b !== "gpu-buffer") throw new Error(`External buffer must be provided for input/output index ${d} when enableGraphCapture is true.`);
    if (b === "gpu-buffer") {
      let v = n[2].gpuBuffer;
      I = Ge(We(h), g);
      {
        let A = l.jsepRegisterBuffer;
        if (!A) throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');
        T = A(u2, d, v, I);
      }
    } else if (b === "ml-tensor") {
      let v = n[2].mlTensor;
      I = Ge(We(h), g);
      let A = l.webnnRegisterMLTensor;
      if (!A) throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');
      T = A(u2, v, We(h), g);
    } else {
      let v = n[2];
      if (Array.isArray(v)) {
        I = m * v.length, T = l._malloc(I), a.push(T);
        for (let A = 0; A < v.length; A++) {
          if (typeof v[A] != "string") throw new TypeError(`tensor data at index ${A} is not a string`);
          l.setValue(T + A * m, ae(v[A], a), "*");
        }
      } else {
        let A = l.webnnIsGraphInput, F = l.webnnIsGraphOutput;
        if (h !== "string" && A && F) {
          let P = l.UTF8ToString(o);
          if (A(u2, P) || F(u2, P)) {
            let k = We(h);
            I = Ge(k, g), y = "ml-tensor";
            let w = l.webnnCreateTemporaryTensor, Q = l.webnnUploadTensor;
            if (!w || !Q) throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');
            let H = await w(u2, k, g);
            Q(H, new Uint8Array(v.buffer, v.byteOffset, v.byteLength)), T = H;
          } else I = v.byteLength, T = l._malloc(I), a.push(T), l.HEAPU8.set(new Uint8Array(v.buffer, v.byteOffset, I), T);
        } else I = v.byteLength, T = l._malloc(I), a.push(T), l.HEAPU8.set(new Uint8Array(v.buffer, v.byteOffset, I), T);
      }
    }
    let D = l.stackSave(), $ = l.stackAlloc(4 * g.length);
    try {
      g.forEach((A, F) => l.setValue($ + F * m, A, m === 4 ? "i32" : "i64"));
      let v = l._OrtCreateTensor(We(h), T, I, $, g.length, co(y));
      v === 0 && G(`Can't create tensor for input/output. session=${u2}, index=${d}.`), t.push(v);
    } finally {
      l.stackRestore(D);
    }
  }, gt = async (n, t, a, u2, o, d) => {
    let c = z(), l = c.PTR_SIZE, m = $e.get(n);
    if (!m) throw new Error(`cannot run inference. invalid session id: ${n}`);
    let h = m[0], g = m[1], b = m[2], y = m[3], T = m[4], I = m[5], D = t.length, $ = u2.length, v = 0, A = [], F = [], P = [], k = [], w = [], Q = c.stackSave(), H = c.stackAlloc(D * l), ne = c.stackAlloc(D * l), pe = c.stackAlloc($ * l), B = c.stackAlloc($ * l);
    try {
      [v, A] = oo(d), Pe("wasm prepareInputOutputTensor");
      for (let O = 0; O < D; O++) await po(a[O], F, k, n, g[t[O]], t[O], T);
      for (let O = 0; O < $; O++) await po(o[O], P, k, n, b[u2[O]], D + u2[O], T);
      Ue("wasm prepareInputOutputTensor");
      for (let O = 0; O < D; O++) c.setValue(H + O * l, F[O], "*"), c.setValue(ne + O * l, g[t[O]], "*");
      for (let O = 0; O < $; O++) c.setValue(pe + O * l, P[O], "*"), c.setValue(B + O * l, b[u2[O]], "*");
      c.jsepOnRunStart?.(h), c.webnnOnRunStart?.(h);
      let W;
      W = await c._OrtRun(h, ne, H, D, B, $, pe, v), W !== 0 && G("failed to call OrtRun().");
      let re = [], me = [];
      Pe("wasm ProcessOutputTensor");
      for (let O = 0; O < $; O++) {
        let K2 = Number(c.getValue(pe + O * l, "*"));
        if (K2 === P[O] || w.includes(P[O])) {
          re.push(o[O]), K2 !== P[O] && c._OrtReleaseTensor(K2) !== 0 && G("Can't release tensor.");
          continue;
        }
        let je = c.stackSave(), ee = c.stackAlloc(4 * l), he = false, j, J = 0;
        try {
          c._OrtGetTensorData(K2, ee, ee + l, ee + 2 * l, ee + 3 * l) !== 0 && G(`Can't access output tensor data on index ${O}.`);
          let Se = l === 4 ? "i32" : "i64", ve = Number(c.getValue(ee, Se));
          J = c.getValue(ee + l, "*");
          let Ve = c.getValue(ee + l * 2, "*"), Re = Number(c.getValue(ee + l * 3, Se)), te = [];
          for (let L = 0; L < Re; L++) te.push(Number(c.getValue(Ve + L * l, Se)));
          c._OrtFree(Ve) !== 0 && G("Can't free memory for tensor dims.");
          let ue = te.reduce((L, V) => L * V, 1);
          j = At(ve);
          let se = y?.outputPreferredLocations[u2[O]];
          if (j === "string") {
            if (se === "gpu-buffer" || se === "ml-tensor") throw new Error("String tensor is not supported on GPU.");
            let L = [];
            for (let V = 0; V < ue; V++) {
              let fe = c.getValue(J + V * l, "*"), ye = c.getValue(J + (V + 1) * l, "*"), ce = V === ue - 1 ? void 0 : ye - fe;
              L.push(c.UTF8ToString(fe, ce));
            }
            re.push([j, te, L, "cpu"]);
          } else if (se === "gpu-buffer" && ue > 0) {
            let L = c.jsepGetBuffer;
            if (!L) throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');
            let V = L(J), fe = Ge(ve, ue);
            if (fe === void 0 || !Ot(j)) throw new Error(`Unsupported data type: ${j}`);
            he = true, re.push([j, te, { gpuBuffer: V, download: c.jsepCreateDownloader(V, fe, j), dispose: () => {
              c._OrtReleaseTensor(K2) !== 0 && G("Can't release tensor.");
            } }, "gpu-buffer"]);
          } else if (se === "ml-tensor" && ue > 0) {
            let L = c.webnnEnsureTensor, V = c.webnnIsGraphInputOutputTypeSupported;
            if (!L || !V) throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');
            if (Ge(ve, ue) === void 0 || !It(j)) throw new Error(`Unsupported data type: ${j}`);
            if (!V(n, j, false)) throw new Error(`preferredLocation "ml-tensor" for ${j} output is not supported by current WebNN Context.`);
            let ye = await L(n, J, ve, te, false);
            he = true, re.push([j, te, { mlTensor: ye, download: c.webnnCreateMLTensorDownloader(J, j), dispose: () => {
              c.webnnReleaseTensorId(J), c._OrtReleaseTensor(K2);
            } }, "ml-tensor"]);
          } else if (se === "ml-tensor-cpu-output" && ue > 0) {
            let L = c.webnnCreateMLTensorDownloader(J, j)(), V = re.length;
            he = true, me.push((async () => {
              let fe = [V, await L];
              return c.webnnReleaseTensorId(J), c._OrtReleaseTensor(K2), fe;
            })()), re.push([j, te, [], "cpu"]);
          } else {
            let L = uo(j), V = new L(ue);
            new Uint8Array(V.buffer, V.byteOffset, V.byteLength).set(c.HEAPU8.subarray(J, J + V.byteLength)), re.push([j, te, V, "cpu"]);
          }
        } finally {
          c.stackRestore(je), j === "string" && J && c._free(J), he || c._OrtReleaseTensor(K2);
        }
      }
      y && !T && (c._OrtClearBoundOutputs(y.handle) !== 0 && G("Can't clear bound outputs."), $e.set(n, [h, g, b, y, T, false]));
      for (let [O, K2] of await Promise.all(me)) re[O][2] = K2;
      return Ue("wasm ProcessOutputTensor"), re;
    } finally {
      c.webnnOnRunEnd?.(h), c.stackRestore(Q), F.forEach((W) => c._OrtReleaseTensor(W)), P.forEach((W) => c._OrtReleaseTensor(W)), k.forEach((W) => c._free(W)), v !== 0 && c._OrtReleaseRunOptions(v), A.forEach((W) => c._free(W));
    }
  }, Et = (n) => {
    let t = z(), a = $e.get(n);
    if (!a) throw new Error("invalid session id");
    let u2 = a[0], o = t._OrtEndProfiling(u2);
    o === 0 && G("Can't get an profile file name."), t._OrtFree(o);
  }, Tt = (n) => {
    let t = [];
    for (let a of n) {
      let u2 = a[2];
      !Array.isArray(u2) && "buffer" in u2 && t.push(u2.buffer);
    }
    return t;
  };
});
var Me;
var ie;
var et;
var Lt;
var _t;
var Bt;
var ln;
var dn;
var ze;
var He;
var Ts;
var mo;
var ho;
var wo;
var bo;
var yo;
var go;
var Eo;
var pn = N(() => {
  "use strict";
  Te();
  rn();
  xe();
  pt();
  Me = () => !!Y.wasm.proxy && typeof document < "u", et = false, Lt = false, _t = false, dn = /* @__PURE__ */ new Map(), ze = (n, t) => {
    let a = dn.get(n);
    a ? a.push(t) : dn.set(n, [t]);
  }, He = () => {
    if (et || !Lt || _t || !ie) throw new Error("worker not ready");
  }, Ts = (n) => {
    switch (n.data.type) {
      case "init-wasm":
        et = false, n.data.err ? (_t = true, ln[1](n.data.err)) : (Lt = true, ln[0]()), Bt && (URL.revokeObjectURL(Bt), Bt = void 0);
        break;
      case "init-ep":
      case "copy-from":
      case "create":
      case "release":
      case "run":
      case "end-profiling": {
        let t = dn.get(n.data.type);
        n.data.err ? t.shift()[1](n.data.err) : t.shift()[0](n.data.out);
        break;
      }
      default:
    }
  }, mo = async () => {
    if (!Lt) {
      if (et) throw new Error("multiple calls to 'initWasm()' detected.");
      if (_t) throw new Error("previous call to 'initWasm()' failed.");
      if (et = true, Me()) return new Promise((n, t) => {
        ie?.terminate(), to().then(([a, u2]) => {
          try {
            ie = u2, ie.onerror = (d) => t(d), ie.onmessage = Ts, ln = [n, t];
            let o = { type: "init-wasm", in: Y };
            !o.in.wasm.wasmPaths && (a || an) && (o.in.wasm.wasmPaths = { wasm: new URL("ort-wasm-simd-threaded.wasm", import.meta.url).href }), ie.postMessage(o), Bt = a;
          } catch (o) {
            t(o);
          }
        }, t);
      });
      try {
        await mt(Y.wasm), await ht(Y), Lt = true;
      } catch (n) {
        throw _t = true, n;
      } finally {
        et = false;
      }
    }
  }, ho = async (n) => {
    if (Me()) return He(), new Promise((t, a) => {
      ze("init-ep", [t, a]);
      let u2 = { type: "init-ep", in: { epName: n, env: Y } };
      ie.postMessage(u2);
    });
    await wt(Y, n);
  }, wo = async (n) => Me() ? (He(), new Promise((t, a) => {
    ze("copy-from", [t, a]);
    let u2 = { type: "copy-from", in: { buffer: n } };
    ie.postMessage(u2, [n.buffer]);
  })) : Ze(n), bo = async (n, t) => {
    if (Me()) {
      if (t?.preferredOutputLocation) throw new Error('session option "preferredOutputLocation" is not supported for proxy.');
      return He(), new Promise((a, u2) => {
        ze("create", [a, u2]);
        let o = { type: "create", in: { model: n, options: { ...t } } }, d = [];
        n instanceof Uint8Array && d.push(n.buffer), ie.postMessage(o, d);
      });
    } else return bt(n, t);
  }, yo = async (n) => {
    if (Me()) return He(), new Promise((t, a) => {
      ze("release", [t, a]);
      let u2 = { type: "release", in: n };
      ie.postMessage(u2);
    });
    yt(n);
  }, go = async (n, t, a, u2, o, d) => {
    if (Me()) {
      if (a.some((c) => c[3] !== "cpu")) throw new Error("input tensor on GPU is not supported for proxy.");
      if (o.some((c) => c)) throw new Error("pre-allocated output tensor is not supported for proxy.");
      return He(), new Promise((c, l) => {
        ze("run", [c, l]);
        let m = a, h = { type: "run", in: { sessionId: n, inputIndices: t, inputs: m, outputIndices: u2, options: d } };
        ie.postMessage(h, Tt(m));
      });
    } else return gt(n, t, a, u2, o, d);
  }, Eo = async (n) => {
    if (Me()) return He(), new Promise((t, a) => {
      ze("end-profiling", [t, a]);
      let u2 = { type: "end-profiling", in: n };
      ie.postMessage(u2);
    });
    Et(n);
  };
});
var To;
var Ss;
var Dt;
var So = N(() => {
  "use strict";
  Te();
  pn();
  fn();
  dt();
  cn();
  To = (n, t) => {
    switch (n.location) {
      case "cpu":
        return [n.type, n.dims, n.data, "cpu"];
      case "gpu-buffer":
        return [n.type, n.dims, { gpuBuffer: n.gpuBuffer }, "gpu-buffer"];
      case "ml-tensor":
        return [n.type, n.dims, { mlTensor: n.mlTensor }, "ml-tensor"];
      default:
        throw new Error(`invalid data location: ${n.location} for ${t()}`);
    }
  }, Ss = (n) => {
    switch (n[3]) {
      case "cpu":
        return new de(n[0], n[2], n[1]);
      case "gpu-buffer": {
        let t = n[0];
        if (!Ot(t)) throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);
        let { gpuBuffer: a, download: u2, dispose: o } = n[2];
        return de.fromGpuBuffer(a, { dataType: t, dims: n[1], download: u2, dispose: o });
      }
      case "ml-tensor": {
        let t = n[0];
        if (!It(t)) throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);
        let { mlTensor: a, download: u2, dispose: o } = n[2];
        return de.fromMLTensor(a, { dataType: t, dims: n[1], download: u2, dispose: o });
      }
      default:
        throw new Error(`invalid data location: ${n[3]}`);
    }
  }, Dt = class {
    async fetchModelAndCopyToWasmMemory(t) {
      return wo(await Ke(t));
    }
    async loadModel(t, a) {
      _e();
      let u2;
      typeof t == "string" ? u2 = await this.fetchModelAndCopyToWasmMemory(t) : u2 = t, [this.sessionId, this.inputNames, this.outputNames, this.inputMetadata, this.outputMetadata] = await bo(u2, a), De();
    }
    async dispose() {
      return yo(this.sessionId);
    }
    async run(t, a, u2) {
      _e();
      let o = [], d = [];
      Object.entries(t).forEach((y) => {
        let T = y[0], I = y[1], D = this.inputNames.indexOf(T);
        if (D === -1) throw new Error(`invalid input '${T}'`);
        o.push(I), d.push(D);
      });
      let c = [], l = [];
      Object.entries(a).forEach((y) => {
        let T = y[0], I = y[1], D = this.outputNames.indexOf(T);
        if (D === -1) throw new Error(`invalid output '${T}'`);
        c.push(I), l.push(D);
      });
      let m = o.map((y, T) => To(y, () => `input "${this.inputNames[d[T]]}"`)), h = c.map((y, T) => y ? To(y, () => `output "${this.outputNames[l[T]]}"`) : null), g = await go(this.sessionId, d, m, l, h, u2), b = {};
      for (let y = 0; y < g.length; y++) b[this.outputNames[l[y]]] = c[y] ?? Ss(g[y]);
      return De(), b;
    }
    startProfiling() {
    }
    endProfiling() {
      Eo(this.sessionId);
    }
  };
});
var Ao = {};
ut(Ao, { OnnxruntimeWebAssemblyBackend: () => Pt, initializeFlags: () => vo, wasmBackend: () => vs });
var vo;
var Pt;
var vs;
var Oo = N(() => {
  "use strict";
  Te();
  pn();
  So();
  vo = () => {
    (typeof Y.wasm.initTimeout != "number" || Y.wasm.initTimeout < 0) && (Y.wasm.initTimeout = 0);
    let n = Y.wasm.simd;
    if (typeof n != "boolean" && n !== void 0 && n !== "fixed" && n !== "relaxed" && (console.warn(`Property "env.wasm.simd" is set to unknown value "${n}". Reset it to \`false\` and ignore SIMD feature checking.`), Y.wasm.simd = false), typeof Y.wasm.proxy != "boolean" && (Y.wasm.proxy = false), typeof Y.wasm.trace != "boolean" && (Y.wasm.trace = false), typeof Y.wasm.numThreads != "number" || !Number.isInteger(Y.wasm.numThreads) || Y.wasm.numThreads <= 0) if (typeof self < "u" && !self.crossOriginIsolated) Y.wasm.numThreads = 1;
    else {
      let t = typeof navigator > "u" ? Jt("node:os").cpus().length : navigator.hardwareConcurrency;
      Y.wasm.numThreads = Math.min(4, Math.ceil((t || 1) / 2));
    }
  }, Pt = class {
    async init(t) {
      vo(), await mo(), await ho(t);
    }
    async createInferenceSessionHandler(t, a) {
      let u2 = new Dt();
      return await u2.loadModel(t, a), u2;
    }
  }, vs = new Pt();
});
Te();
Te();
Te();
var $r = "1.30.0";
var iu = nn;
{
  let n = (Oo(), Xt(Ao)).wasmBackend;
  Je("cpu", n, 10), Je("wasm", n, 10);
}
Object.defineProperty(Y.versions, "web", { value: $r, enumerable: true });

// node_modules/@internal/read-aloud/backend/piper-plus/vendor/ojt/ojt.mjs
async function Module(moduleArg = {}) {
  var Module2 = moduleArg;
  var ENVIRONMENT_IS_WEB = !!globalThis.window;
  var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
  var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";
  var thisProgram = "./this.program";
  var _scriptName = import.meta.url;
  var scriptDirectory = "";
  function locateFile(path) {
    if (Module2["locateFile"]) {
      return Module2["locateFile"](path, scriptDirectory);
    }
    return scriptDirectory + path;
  }
  var readAsync, readBinary;
  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    try {
      scriptDirectory = new URL(".", _scriptName).href;
    } catch {
    }
    {
      if (ENVIRONMENT_IS_WORKER) {
        readBinary = (url) => {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.responseType = "arraybuffer";
          xhr.send(null);
          return new Uint8Array(xhr.response);
        };
      }
      readAsync = async (url) => {
        var response = await fetch(url, { credentials: "same-origin" });
        if (response.ok) {
          return response.arrayBuffer();
        }
        throw new Error(response.status + " : " + response.url);
      };
    }
  } else {
  }
  var out = console.log.bind(console);
  var err = console.error.bind(console);
  var wasmBinary;
  var ABORT = false;
  class EmscriptenEH {
  }
  class EmscriptenSjLj extends EmscriptenEH {
  }
  var runtimeInitialized = false;
  function getMemoryBuffer() {
    return wasmMemory.buffer;
  }
  function updateMemoryViews() {
    if (HEAP8?.buffer?.resizable) return;
    var b = getMemoryBuffer();
    HEAP8 = new Int8Array(b);
    HEAP16 = new Int16Array(b);
    Module2["HEAPU8"] = HEAPU8 = new Uint8Array(b);
    HEAP32 = new Int32Array(b);
    HEAPU32 = new Uint32Array(b);
    HEAP64 = new BigInt64Array(b);
  }
  function preRun() {
  }
  function initRuntime() {
    runtimeInitialized = true;
    if (!Module2["noFSInit"] && !FS.initialized) FS.init();
    TTY.init();
    wasmExports["__wasm_call_ctors"]();
    FS.ignorePermissions = false;
  }
  function postRun() {
  }
  function abort(what) {
    what = `Aborted(${what})`;
    err(what);
    ABORT = true;
    what += ". Build with -sASSERTIONS for more info.";
    var e = new WebAssembly.RuntimeError(what);
    throw e;
  }
  var wasmBinaryFile;
  function findWasmBinary() {
    if (Module2["locateFile"]) {
      return locateFile("ojt.wasm");
    }
    return new URL("ojt.wasm", import.meta.url).href;
  }
  function getBinarySync(file) {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    if (readBinary) {
      return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
  }
  async function getWasmBinary(binaryFile) {
    if (!wasmBinary) {
      try {
        var response = await readAsync(binaryFile);
        return new Uint8Array(response);
      } catch {
      }
    }
    return getBinarySync(binaryFile);
  }
  async function instantiateArrayBuffer(binaryFile, imports) {
    try {
      var binary = await getWasmBinary(binaryFile);
      var instance = await WebAssembly.instantiate(binary, imports);
      return instance;
    } catch (reason) {
      err(`failed to asynchronously prepare wasm: ${reason}`);
      abort(reason);
    }
  }
  async function instantiateAsync(binary, binaryFile, imports) {
    if (!binary) {
      try {
        var response = fetch(binaryFile, { credentials: "same-origin" });
        var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
        return instantiationResult;
      } catch (reason) {
        err(`wasm streaming compile failed: ${reason}`);
        err("falling back to ArrayBuffer instantiation");
      }
    }
    return instantiateArrayBuffer(binaryFile, imports);
  }
  function getWasmImports() {
    var imports = { env: wasmImports, wasi_snapshot_preview1: wasmImports };
    return imports;
  }
  async function createWasm() {
    function receiveInstance(instance) {
      wasmExports = instance.exports;
      assignWasmExports(wasmExports);
      updateMemoryViews();
      return wasmExports;
    }
    function receiveInstantiationResult(result2) {
      return receiveInstance(result2["instance"]);
    }
    var info = getWasmImports();
    wasmBinaryFile ??= findWasmBinary();
    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
    var exports = receiveInstantiationResult(result);
    return exports;
  }
  class ExitStatus {
    name = "ExitStatus";
    constructor(status) {
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }
  }
  var HEAP8;
  var stackRestore = (val) => __emscripten_stack_restore(val);
  var stackSave = () => _emscripten_stack_get_current();
  var HEAPU32;
  class ExceptionInfo {
    constructor(excPtr) {
      this.excPtr = excPtr;
      this.ptr = excPtr - 24;
    }
    set_type(type) {
      HEAPU32[this.ptr + 4 >> 2] = type;
    }
    get_type() {
      return HEAPU32[this.ptr + 4 >> 2];
    }
    set_destructor(destructor) {
      HEAPU32[this.ptr + 8 >> 2] = destructor;
    }
    get_destructor() {
      return HEAPU32[this.ptr + 8 >> 2];
    }
    set_caught(caught) {
      caught = caught ? 1 : 0;
      HEAP8[this.ptr + 12] = caught;
    }
    get_caught() {
      return HEAP8[this.ptr + 12] != 0;
    }
    set_rethrown(rethrown) {
      rethrown = rethrown ? 1 : 0;
      HEAP8[this.ptr + 13] = rethrown;
    }
    get_rethrown() {
      return HEAP8[this.ptr + 13] != 0;
    }
    init(type, destructor) {
      this.set_adjusted_ptr(0);
      this.set_type(type);
      this.set_destructor(destructor);
    }
    set_adjusted_ptr(adjustedPtr) {
      HEAPU32[this.ptr + 16 >> 2] = adjustedPtr;
    }
    get_adjusted_ptr() {
      return HEAPU32[this.ptr + 16 >> 2];
    }
  }
  var uncaughtExceptionCount = 0;
  var __Unwind_RaiseException = (ex) => {
    abort();
  };
  var ___cxa_throw = (ptr, type, destructor) => {
    var info = new ExceptionInfo(ptr);
    info.init(type, destructor);
    uncaughtExceptionCount++;
    __Unwind_RaiseException(ptr);
  };
  var HEAP32;
  var syscallGetVarargI = () => {
    var ret = HEAP32[+SYSCALLS.varargs >> 2];
    SYSCALLS.varargs += 4;
    return ret;
  };
  var syscallGetVarargP = syscallGetVarargI;
  var PATH = { isAbs: (path) => path.charAt(0) === "/", splitPath: (filename) => {
    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    return splitPathRe.exec(filename).slice(1);
  }, normalizeArray: (parts, allowAboveRoot) => {
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === ".") {
        parts.splice(i, 1);
      } else if (last === "..") {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }
    if (allowAboveRoot) {
      for (; up; up--) {
        parts.unshift("..");
      }
    }
    return parts;
  }, normalize: (path) => {
    var isAbsolute = PATH.isAbs(path), trailingSlash = path.slice(-1) === "/";
    path = PATH.normalizeArray(path.split("/").filter((p) => !!p), !isAbsolute).join("/");
    if (!path && !isAbsolute) {
      path = ".";
    }
    if (path && trailingSlash) {
      path += "/";
    }
    return (isAbsolute ? "/" : "") + path;
  }, dirname: (path) => {
    var result = PATH.splitPath(path), root = result[0], dir = result[1];
    if (!root && !dir) {
      return ".";
    }
    if (dir) {
      dir = dir.slice(0, -1);
    }
    return root + dir;
  }, basename: (path) => path && path.match(/([^\/]+|\/)\/*$/)[1], join: (...paths) => PATH.normalize(paths.join("/")), join2: (l, r) => PATH.normalize(l + "/" + r) };
  var initRandomFill = () => (view) => (crypto.getRandomValues(view), 0);
  var randomFill = (view) => (randomFill = initRandomFill())(view);
  var PATH_FS = { resolve: (...args) => {
    var resolvedPath = "", resolvedAbsolute = false;
    for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = i >= 0 ? args[i] : FS.cwd();
      if (typeof path != "string") {
        throw new TypeError("Arguments to path.resolve must be strings");
      } else if (!path) {
        return "";
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = PATH.isAbs(path);
    }
    resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((p) => !!p), !resolvedAbsolute).join("/");
    return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
  }, relative: (from, to2) => {
    from = PATH_FS.resolve(from).slice(1);
    to2 = PATH_FS.resolve(to2).slice(1);
    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== "") break;
      }
      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== "") break;
      }
      if (start > end) return [];
      return arr.slice(start, end - start + 1);
    }
    var fromParts = trim(from.split("/"));
    var toParts = trim(to2.split("/"));
    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }
    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..");
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join("/");
  } };
  var UTF8Decoder = globalThis.TextDecoder && new TextDecoder();
  var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
    var maxIdx = idx + maxBytesToRead;
    if (ignoreNul) return maxIdx;
    while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
    return idx;
  };
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
    var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
      return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
    }
    var str = "";
    while (idx < endPtr) {
      var u0 = heapOrArray[idx++];
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }
      var u1 = heapOrArray[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
      }
      var u2 = heapOrArray[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
      }
    }
    return str;
  };
  var FS_stdin_getChar_buffer = [];
  var lengthBytesUTF8 = (str) => {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      var c = str.charCodeAt(i);
      if (c <= 127) {
        len++;
      } else if (c <= 2047) {
        len += 2;
      } else if (c >= 55296 && c <= 57343) {
        len += 4;
        ++i;
      } else {
        len += 3;
      }
    }
    return len;
  };
  var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
      var u2 = str.codePointAt(i);
      if (u2 <= 127) {
        if (outIdx >= endIdx) break;
        heap[outIdx++] = u2;
      } else if (u2 <= 2047) {
        if (outIdx + 1 >= endIdx) break;
        heap[outIdx++] = 192 | u2 >> 6;
        heap[outIdx++] = 128 | u2 & 63;
      } else if (u2 <= 65535) {
        if (outIdx + 2 >= endIdx) break;
        heap[outIdx++] = 224 | u2 >> 12;
        heap[outIdx++] = 128 | u2 >> 6 & 63;
        heap[outIdx++] = 128 | u2 & 63;
      } else {
        if (outIdx + 3 >= endIdx) break;
        heap[outIdx++] = 240 | u2 >> 18;
        heap[outIdx++] = 128 | u2 >> 12 & 63;
        heap[outIdx++] = 128 | u2 >> 6 & 63;
        heap[outIdx++] = 128 | u2 & 63;
        i++;
      }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx;
  };
  var intArrayFromString = (stringy, dontAddNull, length) => {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
  };
  var FS_stdin_getChar = () => {
    if (!FS_stdin_getChar_buffer.length) {
      var result = null;
      if (globalThis.window?.prompt) {
        result = window.prompt("Input: ");
        if (result !== null) {
          result += "\n";
        }
      } else {
      }
      if (!result) {
        return null;
      }
      FS_stdin_getChar_buffer = intArrayFromString(result, true);
    }
    return FS_stdin_getChar_buffer.shift();
  };
  var TTY = { ttys: [], init() {
  }, shutdown() {
  }, register(dev, ops) {
    TTY.ttys[dev] = { input: [], output: [], ops };
    FS.registerDevice(dev, TTY.stream_ops);
  }, stream_ops: { open(stream) {
    var tty = TTY.ttys[stream.node.rdev];
    if (!tty) {
      throw new FS.ErrnoError(43);
    }
    stream.tty = tty;
    stream.seekable = false;
  }, close(stream) {
    stream.tty.ops.fsync(stream.tty);
  }, fsync(stream) {
    stream.tty.ops.fsync(stream.tty);
  }, read(stream, buffer, offset, length, pos) {
    if (!stream.tty || !stream.tty.ops.get_char) {
      throw new FS.ErrnoError(60);
    }
    var bytesRead = 0;
    for (var i = 0; i < length; i++) {
      var result;
      try {
        result = stream.tty.ops.get_char(stream.tty);
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
      if (result === void 0 && !bytesRead) {
        throw new FS.ErrnoError(6);
      }
      if (result === null || result === void 0) break;
      bytesRead++;
      buffer[offset + i] = result;
      if (result === 10) break;
    }
    if (bytesRead) {
      stream.node.atime = Date.now();
    }
    return bytesRead;
  }, write(stream, buffer, offset, length, pos) {
    if (!stream.tty || !stream.tty.ops.put_char) {
      throw new FS.ErrnoError(60);
    }
    try {
      for (var i = 0; i < length; i++) {
        stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
      }
    } catch (e) {
      throw new FS.ErrnoError(29);
    }
    if (length) {
      stream.node.mtime = stream.node.ctime = Date.now();
    }
    return i;
  } }, default_tty_ops: { get_char(tty) {
    return FS_stdin_getChar();
  }, put_char(tty, val) {
    if (val === null || val === 10) {
      out(UTF8ArrayToString(tty.output));
      tty.output = [];
    } else {
      if (val != 0) tty.output.push(val);
    }
  }, fsync(tty) {
    if (tty.output?.length > 0) {
      out(UTF8ArrayToString(tty.output));
      tty.output = [];
    }
  }, ioctl_tcgets(tty) {
    return { c_iflag: 25856, c_oflag: 5, c_cflag: 191, c_lflag: 35387, c_cc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
  }, ioctl_tcsets(tty, optional_actions, data) {
    return 0;
  }, ioctl_tiocgwinsz(tty) {
    return [24, 80];
  } }, default_tty1_ops: { put_char(tty, val) {
    if (val === null || val === 10) {
      err(UTF8ArrayToString(tty.output));
      tty.output = [];
    } else {
      if (val != 0) tty.output.push(val);
    }
  }, fsync(tty) {
    if (tty.output?.length > 0) {
      err(UTF8ArrayToString(tty.output));
      tty.output = [];
    }
  } } };
  var HEAPU8;
  var zeroMemory = (ptr, size) => HEAPU8.fill(0, ptr, ptr + size);
  var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
  var mmapAlloc = (size) => {
    size = alignMemory(size, 65536);
    var ptr = _emscripten_builtin_memalign(65536, size);
    if (ptr) zeroMemory(ptr, size);
    return ptr;
  };
  var MEMFS = { ops_table: null, mount(mount) {
    return MEMFS.createNode(null, "/", 16895, 0);
  }, createNode(parent, name, mode, dev) {
    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
      throw new FS.ErrnoError(63);
    }
    MEMFS.ops_table ||= { dir: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, lookup: MEMFS.node_ops.lookup, mknod: MEMFS.node_ops.mknod, rename: MEMFS.node_ops.rename, unlink: MEMFS.node_ops.unlink, rmdir: MEMFS.node_ops.rmdir, readdir: MEMFS.node_ops.readdir, symlink: MEMFS.node_ops.symlink }, stream: { llseek: MEMFS.stream_ops.llseek } }, file: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync } }, link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} }, chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops } };
    var node = FS.createNode(parent, name, mode, dev);
    if (FS.isDir(node.mode)) {
      node.node_ops = MEMFS.ops_table.dir.node;
      node.stream_ops = MEMFS.ops_table.dir.stream;
      node.contents = {};
    } else if (FS.isFile(node.mode)) {
      node.node_ops = MEMFS.ops_table.file.node;
      node.stream_ops = MEMFS.ops_table.file.stream;
      node.usedBytes = 0;
      node.contents = MEMFS.emptyFileContents ??= new Uint8Array(0);
    } else if (FS.isLink(node.mode)) {
      node.node_ops = MEMFS.ops_table.link.node;
      node.stream_ops = MEMFS.ops_table.link.stream;
    } else if (FS.isChrdev(node.mode)) {
      node.node_ops = MEMFS.ops_table.chrdev.node;
      node.stream_ops = MEMFS.ops_table.chrdev.stream;
    }
    node.atime = node.mtime = node.ctime = Date.now();
    if (parent) {
      parent.contents[name] = node;
      parent.atime = parent.mtime = parent.ctime = node.atime;
    }
    return node;
  }, getFileDataAsTypedArray(node) {
    return node.contents.subarray(0, node.usedBytes);
  }, expandFileStorage(node, newCapacity) {
    var prevCapacity = node.contents.length;
    if (prevCapacity >= newCapacity) return;
    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
    newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
    if (prevCapacity) newCapacity = Math.max(newCapacity, 256);
    var oldContents = MEMFS.getFileDataAsTypedArray(node);
    node.contents = new Uint8Array(newCapacity);
    node.contents.set(oldContents);
  }, resizeFileStorage(node, newSize) {
    if (node.usedBytes == newSize) return;
    var oldContents = node.contents;
    node.contents = new Uint8Array(newSize);
    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
    node.usedBytes = newSize;
  }, node_ops: { getattr(node) {
    var attr = {};
    attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
    attr.ino = node.id;
    attr.mode = node.mode;
    attr.nlink = 1;
    attr.uid = 0;
    attr.gid = 0;
    attr.rdev = node.rdev;
    if (FS.isDir(node.mode)) {
      attr.size = 4096;
    } else if (FS.isFile(node.mode)) {
      attr.size = node.usedBytes;
    } else if (FS.isLink(node.mode)) {
      attr.size = node.link.length;
    } else {
      attr.size = 0;
    }
    attr.atime = new Date(node.atime);
    attr.mtime = new Date(node.mtime);
    attr.ctime = new Date(node.ctime);
    attr.blksize = 4096;
    attr.blocks = Math.ceil(attr.size / attr.blksize);
    return attr;
  }, setattr(node, attr) {
    for (const key of ["mode", "atime", "mtime", "ctime"]) {
      if (attr[key] != null) {
        node[key] = attr[key];
      }
    }
    if (attr.size !== void 0) {
      MEMFS.resizeFileStorage(node, attr.size);
    }
  }, lookup(parent, name) {
    if (!MEMFS.doesNotExistError) {
      MEMFS.doesNotExistError = new FS.ErrnoError(44);
      MEMFS.doesNotExistError.stack = "<generic error, no stack>";
    }
    throw MEMFS.doesNotExistError;
  }, mknod(parent, name, mode, dev) {
    return MEMFS.createNode(parent, name, mode, dev);
  }, rename(old_node, new_dir, new_name) {
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {
    }
    if (new_node) {
      if (FS.isDir(old_node.mode)) {
        for (var i in new_node.contents) {
          throw new FS.ErrnoError(55);
        }
      }
      FS.hashRemoveNode(new_node);
    }
    delete old_node.parent.contents[old_node.name];
    new_dir.contents[new_name] = old_node;
    old_node.name = new_name;
    new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
  }, unlink(parent, name) {
    delete parent.contents[name];
    parent.ctime = parent.mtime = Date.now();
  }, rmdir(parent, name) {
    var node = FS.lookupNode(parent, name);
    for (var i in node.contents) {
      throw new FS.ErrnoError(55);
    }
    delete parent.contents[name];
    parent.ctime = parent.mtime = Date.now();
  }, readdir(node) {
    return [".", "..", ...Object.keys(node.contents)];
  }, symlink(parent, newname, oldpath) {
    var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
    node.link = oldpath;
    return node;
  }, readlink(node) {
    if (!FS.isLink(node.mode)) {
      throw new FS.ErrnoError(28);
    }
    return node.link;
  } }, stream_ops: { read(stream, buffer, offset, length, position) {
    var contents = stream.node.contents;
    if (position >= stream.node.usedBytes) return 0;
    var size = Math.min(stream.node.usedBytes - position, length);
    buffer.set(contents.subarray(position, position + size), offset);
    return size;
  }, write(stream, buffer, offset, length, position, canOwn) {
    if (buffer.buffer === HEAP8.buffer) {
      canOwn = false;
    }
    if (!length) return 0;
    var node = stream.node;
    node.mtime = node.ctime = Date.now();
    if (canOwn) {
      node.contents = buffer.subarray(offset, offset + length);
      node.usedBytes = length;
    } else if (!node.usedBytes && !position) {
      node.contents = buffer.slice(offset, offset + length);
      node.usedBytes = length;
    } else {
      MEMFS.expandFileStorage(node, position + length);
      node.contents.set(buffer.subarray(offset, offset + length), position);
      node.usedBytes = Math.max(node.usedBytes, position + length);
    }
    return length;
  }, llseek(stream, offset, whence) {
    var position = offset;
    if (whence === 1) {
      position += stream.position;
    } else if (whence === 2) {
      if (FS.isFile(stream.node.mode)) {
        position += stream.node.usedBytes;
      }
    }
    if (position < 0) {
      throw new FS.ErrnoError(28);
    }
    return position;
  }, mmap(stream, length, position, prot, flags) {
    if (!FS.isFile(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    var ptr;
    var allocated;
    var contents = stream.node.contents;
    if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
      allocated = false;
      ptr = contents.byteOffset;
    } else {
      allocated = true;
      ptr = mmapAlloc(length);
      if (!ptr) {
        throw new FS.ErrnoError(48);
      }
      if (contents) {
        if (position > 0 || position + length < contents.length) {
          if (contents.subarray) {
            contents = contents.subarray(position, position + length);
          } else {
            contents = Array.prototype.slice.call(contents, position, position + length);
          }
        }
        HEAP8.set(contents, ptr);
      }
    }
    return { ptr, allocated };
  }, msync(stream, buffer, offset, length, mmapFlags) {
    MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
    return 0;
  } } };
  var FS_modeStringToFlags = (str) => {
    if (typeof str != "string") return str;
    var flagModes = { r: 0, "r+": 2, w: 512 | 64 | 1, "w+": 512 | 64 | 2, a: 1024 | 64 | 1, "a+": 1024 | 64 | 2 };
    var flags = flagModes[str];
    if (typeof flags == "undefined") {
      throw new Error(`Unknown file open mode: ${str}`);
    }
    return flags;
  };
  var FS_fileDataToTypedArray = (data) => {
    if (typeof data == "string") {
      data = intArrayFromString(data, true);
    }
    if (!data.subarray) {
      data = new Uint8Array(data);
    }
    return data;
  };
  var FS_getMode = (canRead, canWrite) => {
    var mode = 0;
    if (canRead) mode |= 292 | 73;
    if (canWrite) mode |= 146;
    return mode;
  };
  var asyncLoad = async (url) => {
    var arrayBuffer = await readAsync(url);
    return new Uint8Array(arrayBuffer);
  };
  var FS_createDataFile = (...args) => FS.createDataFile(...args);
  var getUniqueRunDependency = (id) => id;
  var dependenciesPromise = null;
  var resolveRunDependencies = async () => dependenciesPromise;
  var runDependencies = 0;
  var dependenciesPromiseResolve = null;
  var removeRunDependency = (id) => {
    runDependencies--;
    if (!runDependencies) {
      dependenciesPromiseResolve();
    }
  };
  var addRunDependency = (id) => {
    if (!runDependencies) {
      dependenciesPromise = new Promise((resolve) => dependenciesPromiseResolve = resolve);
    }
    runDependencies++;
  };
  var preloadPlugins = [];
  var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
    if (typeof Browser != "undefined") Browser.init();
    for (var plugin of preloadPlugins) {
      if (plugin["canHandle"](fullname)) {
        return plugin["handle"](byteArray, fullname);
      }
    }
    return byteArray;
  };
  var FS_preloadFile = async (parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) => {
    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
    var dep = getUniqueRunDependency(`cp ${fullname}`);
    addRunDependency(dep);
    try {
      var byteArray = url;
      if (typeof url == "string") {
        byteArray = await asyncLoad(url);
      }
      byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
      preFinish?.();
      if (!dontCreateFile) {
        FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
      }
    } finally {
      removeRunDependency(dep);
    }
  };
  var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
    FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
  };
  var FS = { root: null, mounts: [], devices: {}, streams: [], nextInode: 1, nameTable: null, currentPath: "/", initialized: false, ignorePermissions: true, filesystems: null, syncFSRequests: 0, ErrnoError: class {
    name = "ErrnoError";
    constructor(errno) {
      this.errno = errno;
    }
  }, FSStream: class {
    shared = {};
    get object() {
      return this.node;
    }
    set object(val) {
      this.node = val;
    }
    get isRead() {
      return (this.flags & 2097155) !== 1;
    }
    get isWrite() {
      return (this.flags & 2097155) !== 0;
    }
    get isAppend() {
      return this.flags & 1024;
    }
    get flags() {
      return this.shared.flags;
    }
    set flags(val) {
      this.shared.flags = val;
    }
    get position() {
      return this.shared.position;
    }
    set position(val) {
      this.shared.position = val;
    }
  }, FSNode: class {
    node_ops = {};
    stream_ops = {};
    readMode = 292 | 73;
    writeMode = 146;
    mounted = null;
    constructor(parent, name, mode, rdev) {
      if (!parent) {
        parent = this;
      }
      this.parent = parent;
      this.mount = parent.mount;
      this.id = FS.nextInode++;
      this.name = name;
      this.mode = mode;
      this.rdev = rdev;
      this.atime = this.mtime = this.ctime = Date.now();
    }
    get read() {
      return (this.mode & this.readMode) === this.readMode;
    }
    set read(val) {
      val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
    }
    get write() {
      return (this.mode & this.writeMode) === this.writeMode;
    }
    set write(val) {
      val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
    }
    get isFolder() {
      return FS.isDir(this.mode);
    }
    get isDevice() {
      return FS.isChrdev(this.mode);
    }
    addListener(cb, exclusive = false) {
      var entry = { cb, exclusive };
      var listeners = this.listeners ??= /* @__PURE__ */ new Set();
      listeners.add(entry);
      return { listeners, entry };
    }
    notifyListeners(flags) {
      if (!this.listeners) return;
      var excl;
      for (var entry of this.listeners) {
        if (entry.exclusive) (excl ||= []).push(entry);
        else entry.cb(flags);
      }
      if (excl) {
        var i = (this.exclTurn || 0) % excl.length;
        this.exclTurn = i + 1;
        excl[i].cb(flags);
      }
    }
  }, lookupPath(path, opts = {}) {
    if (!path) {
      throw new FS.ErrnoError(44);
    }
    opts.follow_mount ??= true;
    if (!PATH.isAbs(path)) {
      path = FS.cwd() + "/" + path;
    }
    linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
      var parts = path.split("/").filter((p) => !!p);
      var current = FS.root;
      var current_path = "/";
      for (var i = 0; i < parts.length; i++) {
        var islast = i === parts.length - 1;
        if (islast && opts.parent) {
          break;
        }
        if (parts[i] === ".") {
          continue;
        }
        if (parts[i] === "..") {
          current_path = PATH.dirname(current_path);
          if (FS.isRoot(current)) {
            path = current_path + "/" + parts.slice(i + 1).join("/");
            nlinks--;
            continue linkloop;
          } else {
            current = current.parent;
          }
          continue;
        }
        current_path = PATH.join2(current_path, parts[i]);
        try {
          current = FS.lookupNode(current, parts[i]);
        } catch (e) {
          if (e?.errno === 44 && islast && opts.noent_okay) {
            return { path: current_path };
          }
          throw e;
        }
        if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
          current = current.mounted.root;
        }
        if (FS.isLink(current.mode) && (!islast || opts.follow)) {
          if (!current.node_ops.readlink) {
            throw new FS.ErrnoError(52);
          }
          var link = current.node_ops.readlink(current);
          if (!PATH.isAbs(link)) {
            link = PATH.dirname(current_path) + "/" + link;
          }
          path = link + "/" + parts.slice(i + 1).join("/");
          continue linkloop;
        }
      }
      return { path: current_path, node: current };
    }
    throw new FS.ErrnoError(32);
  }, getPath(node) {
    var path;
    while (true) {
      if (FS.isRoot(node)) {
        var mount = node.mount.mountpoint;
        if (!path) return mount;
        return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
      }
      path = path ? `${node.name}/${path}` : node.name;
      node = node.parent;
    }
  }, hashName(parentid, name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
    }
    return (parentid + hash >>> 0) % FS.nameTable.length;
  }, hashAddNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    node.name_next = FS.nameTable[hash];
    FS.nameTable[hash] = node;
  }, hashRemoveNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    if (FS.nameTable[hash] === node) {
      FS.nameTable[hash] = node.name_next;
    } else {
      var current = FS.nameTable[hash];
      while (current) {
        if (current.name_next === node) {
          current.name_next = node.name_next;
          break;
        }
        current = current.name_next;
      }
    }
  }, lookupNode(parent, name) {
    var errCode = FS.mayLookup(parent);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    var hash = FS.hashName(parent.id, name);
    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
      var nodeName = node.name;
      if (node.parent.id === parent.id && nodeName === name) {
        return node;
      }
    }
    return FS.lookup(parent, name);
  }, createNode(parent, name, mode, rdev) {
    var node = new FS.FSNode(parent, name, mode, rdev);
    FS.hashAddNode(node);
    return node;
  }, destroyNode(node) {
    FS.hashRemoveNode(node);
  }, isRoot(node) {
    return node === node.parent;
  }, isMountpoint(node) {
    return !!node.mounted;
  }, isFile(mode) {
    return (mode & 61440) === 32768;
  }, isDir(mode) {
    return (mode & 61440) === 16384;
  }, isLink(mode) {
    return (mode & 61440) === 40960;
  }, isChrdev(mode) {
    return (mode & 61440) === 8192;
  }, isBlkdev(mode) {
    return (mode & 61440) === 24576;
  }, isFIFO(mode) {
    return (mode & 61440) === 4096;
  }, isSocket(mode) {
    return (mode & 49152) === 49152;
  }, flagsToPermissionString(flag) {
    var perms = ["r", "w", "rw"][flag & 3];
    if (flag & 512) {
      perms += "w";
    }
    return perms;
  }, nodePermissions(node, perms) {
    if (FS.ignorePermissions) {
      return 0;
    }
    if (perms.includes("r") && !(node.mode & 292)) {
      return 2;
    }
    if (perms.includes("w") && !(node.mode & 146)) {
      return 2;
    }
    if (perms.includes("x") && !(node.mode & 73)) {
      return 2;
    }
    return 0;
  }, mayLookup(dir) {
    if (!FS.isDir(dir.mode)) return 54;
    var errCode = FS.nodePermissions(dir, "x");
    if (errCode) return errCode;
    if (!dir.node_ops.lookup) return 2;
    return 0;
  }, mayCreate(dir, name) {
    if (!FS.isDir(dir.mode)) {
      return 54;
    }
    try {
      var node = FS.lookupNode(dir, name);
      return 20;
    } catch (e) {
    }
    return FS.nodePermissions(dir, "wx");
  }, mayDelete(dir, name, isdir) {
    var node;
    try {
      node = FS.lookupNode(dir, name);
    } catch (e) {
      return e.errno;
    }
    var errCode = FS.nodePermissions(dir, "wx");
    if (errCode) {
      return errCode;
    }
    if (isdir) {
      if (!FS.isDir(node.mode)) {
        return 54;
      }
      if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
        return 10;
      }
    } else if (FS.isDir(node.mode)) {
      return 31;
    }
    return 0;
  }, mayOpen(node, flags) {
    if (!node) {
      return 44;
    }
    if (FS.isLink(node.mode)) {
      return 32;
    }
    var mode = FS.flagsToPermissionString(flags);
    if (FS.isDir(node.mode)) {
      if (mode !== "r" || flags & (512 | 64)) {
        return 31;
      }
    }
    return FS.nodePermissions(node, mode);
  }, checkOpExists(op, err2) {
    if (!op) {
      throw new FS.ErrnoError(err2);
    }
    return op;
  }, MAX_OPEN_FDS: 4096, nextfd() {
    for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
      if (!FS.streams[fd]) {
        return fd;
      }
    }
    throw new FS.ErrnoError(33);
  }, getStreamChecked(fd) {
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8);
    }
    return stream;
  }, getStream: (fd) => FS.streams[fd], createStream(stream, fd = -1) {
    stream = Object.assign(new FS.FSStream(), stream);
    if (fd == -1) {
      fd = FS.nextfd();
    }
    stream.fd = fd;
    FS.streams[fd] = stream;
    return stream;
  }, closeStream(fd) {
    FS.streams[fd] = null;
  }, dupStream(origStream, fd = -1) {
    var stream = FS.createStream(origStream, fd);
    stream.stream_ops?.dup?.(stream);
    return stream;
  }, doSetAttr(stream, node, attr) {
    var setattr = stream?.stream_ops.setattr;
    var arg = setattr ? stream : node;
    setattr ??= node.node_ops.setattr;
    FS.checkOpExists(setattr, 63);
    try {
      setattr(arg, attr);
    } catch (e) {
      if (e instanceof RangeError) {
        throw new FS.ErrnoError(22);
      }
      throw e;
    }
  }, chrdev_stream_ops: { open(stream) {
    var device = FS.getDevice(stream.node.rdev);
    stream.stream_ops = device.stream_ops;
    stream.stream_ops.open?.(stream);
  }, llseek() {
    throw new FS.ErrnoError(70);
  } }, major: (dev) => dev >> 8, minor: (dev) => dev & 255, makedev: (ma, mi) => ma << 8 | mi, registerDevice(dev, ops) {
    FS.devices[dev] = { stream_ops: ops };
  }, getDevice: (dev) => FS.devices[dev], getMounts(mount) {
    var mounts = [];
    var check = [mount];
    while (check.length) {
      var m = check.pop();
      mounts.push(m);
      check.push(...m.mounts);
    }
    return mounts;
  }, syncfs(populate, callback) {
    if (typeof populate == "function") {
      callback = populate;
      populate = false;
    }
    FS.syncFSRequests++;
    if (FS.syncFSRequests > 1) {
      err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
    }
    var mounts = FS.getMounts(FS.root.mount);
    var completed = 0;
    function doCallback(errCode) {
      FS.syncFSRequests--;
      return callback(errCode);
    }
    function done2(errCode) {
      if (errCode) {
        if (!done2.errored) {
          done2.errored = true;
          return doCallback(errCode);
        }
        return;
      }
      if (++completed >= mounts.length) {
        doCallback(null);
      }
    }
    for (var mount of mounts) {
      if (mount.type.syncfs) {
        mount.type.syncfs(mount, populate, done2);
      } else {
        done2(null);
      }
    }
  }, mount(type, opts, mountpoint) {
    var root = mountpoint === "/";
    var pseudo = !mountpoint;
    var node;
    if (root && FS.root) {
      throw new FS.ErrnoError(10);
    } else if (!root && !pseudo) {
      var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
      mountpoint = lookup.path;
      node = lookup.node;
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(10);
      }
      if (!FS.isDir(node.mode)) {
        throw new FS.ErrnoError(54);
      }
    }
    var mount = { type, opts, mountpoint, mounts: [] };
    var mountRoot = type.mount(mount);
    mountRoot.mount = mount;
    mount.root = mountRoot;
    if (root) {
      FS.root = mountRoot;
    } else if (node) {
      node.mounted = mount;
      if (node.mount) {
        node.mount.mounts.push(mount);
      }
    }
    return mountRoot;
  }, unmount(mountpoint) {
    var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
    if (!FS.isMountpoint(lookup.node)) {
      throw new FS.ErrnoError(28);
    }
    var node = lookup.node;
    var mount = node.mounted;
    var mounts = FS.getMounts(mount);
    for (var [hash, current] of Object.entries(FS.nameTable)) {
      while (current) {
        var next = current.name_next;
        if (mounts.includes(current.mount)) {
          FS.destroyNode(current);
        }
        current = next;
      }
    }
    node.mounted = null;
    var idx = node.mount.mounts.indexOf(mount);
    node.mount.mounts.splice(idx, 1);
  }, lookup(parent, name) {
    return parent.node_ops.lookup(parent, name);
  }, mknod(path, mode, dev) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    var name = PATH.basename(path);
    if (!name) {
      throw new FS.ErrnoError(28);
    }
    if (name === "." || name === "..") {
      throw new FS.ErrnoError(20);
    }
    var errCode = FS.mayCreate(parent, name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.mknod) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.mknod(parent, name, mode, dev);
  }, statfs(path) {
    return FS.statfsNode(FS.lookupPath(path, { follow: true }).node);
  }, statfsStream(stream) {
    return FS.statfsNode(stream.node);
  }, statfsNode(node) {
    var rtn = { bsize: 4096, frsize: 4096, blocks: 1e6, bfree: 5e5, bavail: 5e5, files: FS.nextInode, ffree: FS.nextInode - 1, fsid: 42, flags: 2, namelen: 255 };
    if (node.node_ops.statfs) {
      Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
    }
    return rtn;
  }, create(path, mode = 438) {
    mode &= 4095;
    mode |= 32768;
    return FS.mknod(path, mode, 0);
  }, mkdir(path, mode = 511) {
    mode &= 511 | 512;
    mode |= 16384;
    return FS.mknod(path, mode, 0);
  }, mkdirTree(path, mode) {
    var dirs = path.split("/");
    var d = "";
    for (var dir of dirs) {
      if (!dir) continue;
      if (d || PATH.isAbs(path)) d += "/";
      d += dir;
      try {
        FS.mkdir(d, mode);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
    }
  }, mkdev(path, mode, dev) {
    if (typeof dev == "undefined") {
      dev = mode;
      mode = 438;
    }
    mode |= 8192;
    return FS.mknod(path, mode, dev);
  }, symlink(oldpath, newpath) {
    if (!PATH_FS.resolve(oldpath)) {
      throw new FS.ErrnoError(44);
    }
    var lookup = FS.lookupPath(newpath, { parent: true });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.symlink) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.symlink(parent, newname, oldpath);
  }, link(oldpath, newpath, flags) {
    var lookup = FS.lookupPath(newpath, { parent: true });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.link) {
      throw new FS.ErrnoError(34);
    }
    return parent.node_ops.link(parent, newname, oldpath, flags);
  }, rename(old_path, new_path) {
    var old_dirname = PATH.dirname(old_path);
    var new_dirname = PATH.dirname(new_path);
    var old_name = PATH.basename(old_path);
    var new_name = PATH.basename(new_path);
    var lookup, old_dir, new_dir;
    lookup = FS.lookupPath(old_path, { parent: true });
    old_dir = lookup.node;
    lookup = FS.lookupPath(new_path, { parent: true });
    new_dir = lookup.node;
    if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
    if (old_dir.mount !== new_dir.mount) {
      throw new FS.ErrnoError(75);
    }
    var old_node = FS.lookupNode(old_dir, old_name);
    var relative = PATH_FS.relative(old_path, new_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(28);
    }
    relative = PATH_FS.relative(new_path, old_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(55);
    }
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {
    }
    if (old_node === new_node) {
      return;
    }
    var isdir = FS.isDir(old_node.mode);
    var errCode = FS.mayDelete(old_dir, old_name, isdir);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!old_dir.node_ops.rename) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
      throw new FS.ErrnoError(10);
    }
    if (new_dir !== old_dir) {
      errCode = FS.nodePermissions(old_dir, "w");
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    FS.hashRemoveNode(old_node);
    try {
      old_dir.node_ops.rename(old_node, new_dir, new_name);
      old_node.parent = new_dir;
    } catch (e) {
      throw e;
    } finally {
      FS.hashAddNode(old_node);
    }
  }, rmdir(path) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, true);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.rmdir) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.rmdir(parent, name);
    FS.destroyNode(node);
  }, readdir(path) {
    var lookup = FS.lookupPath(path, { follow: true });
    var node = lookup.node;
    var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
    return readdir(node);
  }, unlink(path) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, false);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.unlink) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.unlink(parent, name);
    FS.destroyNode(node);
  }, readlink(path) {
    var lookup = FS.lookupPath(path);
    var link = lookup.node;
    if (!link) {
      throw new FS.ErrnoError(44);
    }
    if (!link.node_ops.readlink) {
      throw new FS.ErrnoError(28);
    }
    return link.node_ops.readlink(link);
  }, stat(path, dontFollow) {
    var lookup = FS.lookupPath(path, { follow: !dontFollow });
    var node = lookup.node;
    var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
    return getattr(node);
  }, fstat(fd) {
    var stream = FS.getStreamChecked(fd);
    var node = stream.node;
    var getattr = stream.stream_ops.getattr;
    var arg = getattr ? stream : node;
    getattr ??= node.node_ops.getattr;
    FS.checkOpExists(getattr, 63);
    return getattr(arg);
  }, lstat(path) {
    return FS.stat(path, true);
  }, doChmod(stream, node, mode, dontFollow) {
    FS.doSetAttr(stream, node, { mode: mode & 4095 | node.mode & ~4095, ctime: Date.now(), dontFollow });
  }, chmod(path, mode, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, { follow: !dontFollow });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doChmod(null, node, mode, dontFollow);
  }, lchmod(path, mode) {
    FS.chmod(path, mode, true);
  }, fchmod(fd, mode) {
    var stream = FS.getStreamChecked(fd);
    FS.doChmod(stream, stream.node, mode, false);
  }, doChown(stream, node, dontFollow) {
    FS.doSetAttr(stream, node, { timestamp: Date.now(), dontFollow });
  }, chown(path, uid, gid, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, { follow: !dontFollow });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doChown(null, node, dontFollow);
  }, lchown(path, uid, gid) {
    FS.chown(path, uid, gid, true);
  }, fchown(fd, uid, gid) {
    var stream = FS.getStreamChecked(fd);
    FS.doChown(stream, stream.node, false);
  }, doTruncate(stream, node, len) {
    if (FS.isDir(node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!FS.isFile(node.mode)) {
      throw new FS.ErrnoError(28);
    }
    var errCode = FS.nodePermissions(node, "w");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.doSetAttr(stream, node, { size: len, timestamp: Date.now() });
  }, truncate(path, len) {
    if (len < 0) {
      throw new FS.ErrnoError(28);
    }
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, { follow: true });
      node = lookup.node;
    } else {
      node = path;
    }
    FS.doTruncate(null, node, len);
  }, ftruncate(fd, len) {
    var stream = FS.getStreamChecked(fd);
    if (len < 0 || (stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(28);
    }
    FS.doTruncate(stream, stream.node, len);
  }, utime(path, atime, mtime, dontFollow) {
    var lookup = FS.lookupPath(path, { follow: !dontFollow });
    FS.doSetAttr(null, lookup.node, { atime, mtime, dontFollow });
  }, open(path, flags, mode = 438) {
    if (path === "") {
      throw new FS.ErrnoError(44);
    }
    flags = FS_modeStringToFlags(flags);
    if (flags & 64) {
      mode = mode & 4095 | 32768;
    } else {
      mode = 0;
    }
    var node;
    var isDirPath;
    if (typeof path == "object") {
      node = path;
    } else {
      isDirPath = path.endsWith("/");
      var lookup = FS.lookupPath(path, { follow: !(flags & 131072), noent_okay: true });
      node = lookup.node;
      path = lookup.path;
    }
    var created = false;
    if (flags & 64) {
      if (node) {
        if (flags & 128) {
          throw new FS.ErrnoError(20);
        }
      } else if (isDirPath) {
        throw new FS.ErrnoError(31);
      } else {
        node = FS.mknod(path, mode | 511, 0);
        created = true;
      }
    }
    if (!node) {
      throw new FS.ErrnoError(44);
    }
    if (FS.isChrdev(node.mode)) {
      flags &= ~512;
    }
    if (flags & 65536 && !FS.isDir(node.mode)) {
      throw new FS.ErrnoError(54);
    }
    if (!created) {
      var errCode = FS.mayOpen(node, flags);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    if (flags & 512 && !created) {
      FS.truncate(node, 0);
    }
    flags &= ~(128 | 512 | 131072);
    var stream = FS.createStream({ node, path: FS.getPath(node), flags, seekable: true, position: 0, stream_ops: node.stream_ops, ungotten: [], error: false });
    if (stream.stream_ops.open) {
      stream.stream_ops.open(stream);
    }
    if (created) {
      FS.chmod(node, mode & 511);
    }
    return stream;
  }, close(stream) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (stream.getdents) stream.getdents = null;
    stream.node?.notifyListeners(32);
    try {
      if (stream.stream_ops.close) {
        stream.stream_ops.close(stream);
      }
    } catch (e) {
      throw e;
    } finally {
      FS.closeStream(stream.fd);
    }
    stream.fd = null;
  }, isClosed(stream) {
    return stream.fd === null;
  }, llseek(stream, offset, whence) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (!stream.seekable || !stream.stream_ops.llseek) {
      throw new FS.ErrnoError(70);
    }
    if (whence != 0 && whence != 1 && whence != 2) {
      throw new FS.ErrnoError(28);
    }
    stream.position = stream.stream_ops.llseek(stream, offset, whence);
    stream.ungotten = [];
    return stream.position;
  }, read(stream, buffer, offset, length, position) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.read) {
      throw new FS.ErrnoError(28);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
    if (!seeking) stream.position += bytesRead;
    return bytesRead;
  }, write(stream, buffer, offset, length, position, canOwn) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.write) {
      throw new FS.ErrnoError(28);
    }
    if (stream.seekable && stream.flags & 1024) {
      FS.llseek(stream, 0, 2);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
    if (!seeking) stream.position += bytesWritten;
    return bytesWritten;
  }, mmap(stream, length, position, prot, flags) {
    if (prot & 2 && !(flags & 2) && (stream.flags & 2097155) !== 2) {
      throw new FS.ErrnoError(2);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(2);
    }
    if (!stream.stream_ops.mmap) {
      throw new FS.ErrnoError(43);
    }
    if (!length) {
      throw new FS.ErrnoError(28);
    }
    return stream.stream_ops.mmap(stream, length, position, prot, flags);
  }, msync(stream, buffer, offset, length, mmapFlags) {
    if (!stream.stream_ops.msync) {
      return 0;
    }
    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
  }, ioctl(stream, cmd, arg) {
    if (!stream.stream_ops.ioctl) {
      throw new FS.ErrnoError(59);
    }
    return stream.stream_ops.ioctl(stream, cmd, arg);
  }, readFile(path, opts = {}) {
    opts.flags = opts.flags ?? 0;
    opts.encoding = opts.encoding ?? "binary";
    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
      abort(`Invalid encoding type "${opts.encoding}"`);
    }
    var stream = FS.open(path, opts.flags);
    var stat = FS.stat(path);
    var length = stat.size;
    var buf = new Uint8Array(length);
    FS.read(stream, buf, 0, length, 0);
    if (opts.encoding === "utf8") {
      buf = UTF8ArrayToString(buf);
    }
    FS.close(stream);
    return buf;
  }, writeFile(path, data, opts = {}) {
    opts.flags = opts.flags ?? 577;
    var stream = FS.open(path, opts.flags, opts.mode);
    data = FS_fileDataToTypedArray(data);
    FS.write(stream, data, 0, data.byteLength, void 0, opts.canOwn);
    FS.close(stream);
  }, cwd: () => FS.currentPath, chdir(path) {
    var lookup = FS.lookupPath(path, { follow: true });
    if (lookup.node === null) {
      throw new FS.ErrnoError(44);
    }
    if (!FS.isDir(lookup.node.mode)) {
      throw new FS.ErrnoError(54);
    }
    var errCode = FS.nodePermissions(lookup.node, "x");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.currentPath = lookup.path;
  }, createDefaultDirectories() {
    FS.mkdir("/tmp");
    FS.mkdir("/home");
    FS.mkdir("/home/web_user");
  }, createDefaultDevices() {
    FS.mkdir("/dev");
    FS.registerDevice(FS.makedev(1, 3), { read: () => 0, write: (stream, buffer, offset, length, pos) => length, llseek: () => 0 });
    FS.mkdev("/dev/null", FS.makedev(1, 3));
    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
    FS.mkdev("/dev/tty", FS.makedev(5, 0));
    FS.mkdev("/dev/tty1", FS.makedev(6, 0));
    var randomBuffer = new Uint8Array(1024), randomLeft = 0;
    var randomByte = () => {
      if (!randomLeft) {
        randomFill(randomBuffer);
        randomLeft = randomBuffer.byteLength;
      }
      return randomBuffer[--randomLeft];
    };
    FS.createDevice("/dev", "random", randomByte);
    FS.createDevice("/dev", "urandom", randomByte);
    FS.mkdir("/dev/shm");
    FS.mkdir("/dev/shm/tmp");
  }, createSpecialDirectories() {
    FS.mkdir("/proc");
    var proc_self = FS.mkdir("/proc/self");
    FS.mkdir("/proc/self/fd");
    FS.mount({ mount() {
      var node = FS.createNode(proc_self, "fd", 16895, 73);
      node.stream_ops = { llseek: MEMFS.stream_ops.llseek };
      node.node_ops = { lookup(parent, name) {
        var fd = +name;
        var stream = FS.getStreamChecked(fd);
        var ret = { parent: null, mount: { mountpoint: "fake" }, node_ops: { readlink: () => stream.path }, id: fd + 1 };
        ret.parent = ret;
        return ret;
      }, readdir() {
        return Array.from(FS.streams.entries()).filter(([k, v]) => v).map(([k, v]) => k.toString());
      } };
      return node;
    } }, {}, "/proc/self/fd");
  }, createStandardStreams(input, output, error) {
    if (input) {
      FS.createDevice("/dev", "stdin", input);
    } else {
      FS.symlink("/dev/tty", "/dev/stdin");
    }
    if (output) {
      FS.createDevice("/dev", "stdout", null, output);
    } else {
      FS.symlink("/dev/tty", "/dev/stdout");
    }
    if (error) {
      FS.createDevice("/dev", "stderr", null, error);
    } else {
      FS.symlink("/dev/tty1", "/dev/stderr");
    }
    var stdin = FS.open("/dev/stdin", 0);
    var stdout = FS.open("/dev/stdout", 1);
    var stderr = FS.open("/dev/stderr", 1);
  }, staticInit() {
    FS.nameTable = new Array(4096);
    FS.mount(MEMFS, {}, "/");
    FS.createDefaultDirectories();
    FS.createDefaultDevices();
    FS.createSpecialDirectories();
    FS.filesystems = { MEMFS };
  }, init(input, output, error) {
    FS.initialized = true;
    FS.createStandardStreams(input, output, error);
  }, quit() {
    FS.initialized = false;
    for (var stream of FS.streams) {
      if (stream) {
        FS.close(stream);
      }
    }
  }, findObject(path, dontResolveLastLink) {
    var ret = FS.analyzePath(path, dontResolveLastLink);
    if (!ret.exists) {
      return null;
    }
    return ret.object;
  }, analyzePath(path, dontResolveLastLink) {
    try {
      var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
      path = lookup.path;
    } catch (e) {
    }
    var ret = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
    try {
      var lookup = FS.lookupPath(path, { parent: true });
      ret.parentExists = true;
      ret.parentPath = lookup.path;
      ret.parentObject = lookup.node;
      ret.name = PATH.basename(path);
      lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
      ret.exists = true;
      ret.path = lookup.path;
      ret.object = lookup.node;
      ret.name = lookup.node.name;
      ret.isRoot = lookup.path === "/";
    } catch (e) {
      ret.error = e.errno;
    }
    return ret;
  }, createPath(parent, path, canRead, canWrite) {
    parent = typeof parent == "string" ? parent : FS.getPath(parent);
    var parts = path.split("/").reverse();
    while (parts.length) {
      var part = parts.pop();
      if (!part) continue;
      var current = PATH.join2(parent, part);
      try {
        FS.mkdir(current);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
      parent = current;
    }
    return current;
  }, createFile(parent, name, properties, canRead, canWrite) {
    var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
    var mode = FS_getMode(canRead, canWrite);
    return FS.create(path, mode);
  }, createDataFile(parent, name, data, canRead, canWrite, canOwn) {
    var path = name;
    if (parent) {
      parent = typeof parent == "string" ? parent : FS.getPath(parent);
      path = name ? PATH.join2(parent, name) : parent;
    }
    var mode = FS_getMode(canRead, canWrite);
    var node = FS.create(path, mode);
    if (data) {
      data = FS_fileDataToTypedArray(data);
      FS.chmod(node, mode | 146);
      var stream = FS.open(node, 577);
      FS.write(stream, data, 0, data.length, 0, canOwn);
      FS.close(stream);
      FS.chmod(node, mode);
    }
  }, createDevice(parent, name, input, output) {
    var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
    var mode = FS_getMode(!!input, !!output);
    FS.createDevice.major ??= 64;
    var dev = FS.makedev(FS.createDevice.major++, 0);
    FS.registerDevice(dev, { open(stream) {
      stream.seekable = false;
    }, close(stream) {
      if (output?.buffer?.length) {
        output(10);
      }
    }, read(stream, buffer, offset, length, pos) {
      var bytesRead = 0;
      for (var i = 0; i < length; i++) {
        var result;
        try {
          result = input();
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
        if (result === void 0 && !bytesRead) {
          throw new FS.ErrnoError(6);
        }
        if (result === null || result === void 0) break;
        bytesRead++;
        buffer[offset + i] = result;
      }
      if (bytesRead) {
        stream.node.atime = Date.now();
      }
      return bytesRead;
    }, write(stream, buffer, offset, length, pos) {
      for (var i = 0; i < length; i++) {
        try {
          output(buffer[offset + i]);
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
      }
      if (length) {
        stream.node.mtime = stream.node.ctime = Date.now();
      }
      return i;
    } });
    return FS.mkdev(path, mode, dev);
  }, forceLoadFile(obj) {
    if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
    if (globalThis.XMLHttpRequest) {
      abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
    } else {
      try {
        obj.contents = readBinary(obj.url);
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
    }
  }, createLazyFile(parent, name, url, canRead, canWrite) {
    class LazyUint8Array {
      lengthKnown = false;
      chunks = [];
      get(idx) {
        if (idx > this.length - 1 || idx < 0) {
          return void 0;
        }
        var chunkOffset = idx % this.chunkSize;
        var chunkNum = idx / this.chunkSize | 0;
        return this.getter(chunkNum)[chunkOffset];
      }
      setDataGetter(getter) {
        this.getter = getter;
      }
      cacheLength() {
        var xhr = new XMLHttpRequest();
        xhr.open("HEAD", url, false);
        xhr.send(null);
        if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr.status}`);
        var datalength = Number(xhr.getResponseHeader("Content-length"));
        var header;
        var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
        var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
        var chunkSize = 1024 * 1024;
        if (!hasByteServing) chunkSize = datalength;
        var doXHR = (from, to2) => {
          if (from > to2) abort(`invalid range (${from}, ${to2}) or no bytes requested!`);
          if (to2 > datalength - 1) abort(`only ${datalength} bytes available! programmer error!`);
          var xhr2 = new XMLHttpRequest();
          xhr2.open("GET", url, false);
          if (datalength !== chunkSize) xhr2.setRequestHeader("Range", `bytes=${from}-${to2}`);
          xhr2.responseType = "arraybuffer";
          if (xhr2.overrideMimeType) {
            xhr2.overrideMimeType("text/plain; charset=x-user-defined");
          }
          xhr2.send(null);
          if (!(xhr2.status >= 200 && xhr2.status < 300 || xhr2.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr2.status}`);
          if (xhr2.response !== void 0) {
            return new Uint8Array(xhr2.response || []);
          }
          return intArrayFromString(xhr2.responseText ?? "", true);
        };
        var lazyArray2 = this;
        lazyArray2.setDataGetter((chunkNum) => {
          var start = chunkNum * chunkSize;
          var end = (chunkNum + 1) * chunkSize - 1;
          end = Math.min(end, datalength - 1);
          if (typeof lazyArray2.chunks[chunkNum] == "undefined") {
            lazyArray2.chunks[chunkNum] = doXHR(start, end);
          }
          if (typeof lazyArray2.chunks[chunkNum] == "undefined") abort("doXHR failed!");
          return lazyArray2.chunks[chunkNum];
        });
        if (usesGzip || !datalength) {
          chunkSize = datalength = 1;
          datalength = this.getter(0).length;
          chunkSize = datalength;
          out("LazyFiles on gzip forces download of the whole file when length is accessed");
        }
        this._length = datalength;
        this._chunkSize = chunkSize;
        this.lengthKnown = true;
      }
      get length() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._length;
      }
      get chunkSize() {
        if (!this.lengthKnown) {
          this.cacheLength();
        }
        return this._chunkSize;
      }
    }
    if (globalThis.XMLHttpRequest) {
      if (!ENVIRONMENT_IS_WORKER) abort("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");
      var lazyArray = new LazyUint8Array();
      var properties = { isDevice: false, contents: lazyArray };
    } else {
      var properties = { isDevice: false, url };
    }
    var node = FS.createFile(parent, name, properties, canRead, canWrite);
    if (properties.contents) {
      node.contents = properties.contents;
    } else if (properties.url) {
      node.contents = null;
      node.url = properties.url;
    }
    Object.defineProperties(node, { usedBytes: { get: function() {
      return this.contents.length;
    } } });
    var stream_ops = {};
    for (const [key, fn2] of Object.entries(node.stream_ops)) {
      stream_ops[key] = (...args) => {
        FS.forceLoadFile(node);
        return fn2(...args);
      };
    }
    function writeChunks(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= contents.length) return 0;
      var size = Math.min(contents.length - position, length);
      if (contents.slice) {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents[position + i];
        }
      } else {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents.get(position + i);
        }
      }
      return size;
    }
    stream_ops.read = (stream, buffer, offset, length, position) => {
      FS.forceLoadFile(node);
      return writeChunks(stream, buffer, offset, length, position);
    };
    stream_ops.mmap = (stream, length, position, prot, flags) => {
      FS.forceLoadFile(node);
      var ptr = mmapAlloc(length);
      if (!ptr) {
        throw new FS.ErrnoError(48);
      }
      writeChunks(stream, HEAP8, ptr, length, position);
      return { ptr, allocated: true };
    };
    node.stream_ops = stream_ops;
    return node;
  } };
  var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : "";
  var HEAP64;
  var SYSCALLS = { currentUmask: 18, calculateAt(dirfd, path, allowEmpty) {
    if (PATH.isAbs(path)) {
      return path;
    }
    var dir;
    if (dirfd === -100) {
      dir = FS.cwd();
    } else {
      var dirstream = SYSCALLS.getStreamFromFD(dirfd);
      dir = dirstream.path;
    }
    if (path.length == 0) {
      if (!allowEmpty) {
        throw new FS.ErrnoError(44);
      }
      return dir;
    }
    return dir + "/" + path;
  }, writeStat(buf, stat) {
    HEAPU32[buf >> 2] = stat.dev;
    HEAPU32[buf + 4 >> 2] = stat.mode;
    HEAPU32[buf + 8 >> 2] = stat.nlink;
    HEAPU32[buf + 12 >> 2] = stat.uid;
    HEAPU32[buf + 16 >> 2] = stat.gid;
    HEAPU32[buf + 20 >> 2] = stat.rdev;
    HEAP64[buf + 24 >> 3] = BigInt(stat.size);
    HEAP32[buf + 32 >> 2] = 4096;
    HEAP32[buf + 36 >> 2] = stat.blocks;
    var atime = stat.atime.getTime();
    var mtime = stat.mtime.getTime();
    var ctime = stat.ctime.getTime();
    HEAP64[buf + 40 >> 3] = BigInt(Math.floor(atime / 1e3));
    HEAPU32[buf + 48 >> 2] = atime % 1e3 * 1e3 * 1e3;
    HEAP64[buf + 56 >> 3] = BigInt(Math.floor(mtime / 1e3));
    HEAPU32[buf + 64 >> 2] = mtime % 1e3 * 1e3 * 1e3;
    HEAP64[buf + 72 >> 3] = BigInt(Math.floor(ctime / 1e3));
    HEAPU32[buf + 80 >> 2] = ctime % 1e3 * 1e3 * 1e3;
    HEAP64[buf + 88 >> 3] = BigInt(stat.ino);
    return 0;
  }, writeStatFs(buf, stats) {
    HEAPU32[buf + 4 >> 2] = stats.bsize;
    HEAPU32[buf + 60 >> 2] = stats.bsize;
    HEAP64[buf + 8 >> 3] = BigInt(stats.blocks);
    HEAP64[buf + 16 >> 3] = BigInt(stats.bfree);
    HEAP64[buf + 24 >> 3] = BigInt(stats.bavail);
    HEAP64[buf + 32 >> 3] = BigInt(stats.files);
    HEAP64[buf + 40 >> 3] = BigInt(stats.ffree);
    HEAPU32[buf + 48 >> 2] = stats.fsid;
    HEAPU32[buf + 64 >> 2] = stats.flags;
    HEAPU32[buf + 56 >> 2] = stats.namelen;
  }, doMsync(addr, stream, len, flags, offset) {
    if (!FS.isFile(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    if (flags & 2) {
      return 0;
    }
    var buffer = HEAPU8.subarray(addr, addr + len);
    FS.msync(stream, buffer, offset, len, flags);
  }, getStreamFromFD(fd) {
    var stream = FS.getStreamChecked(fd);
    return stream;
  }, varargs: void 0, getStr(ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  } };
  var HEAP16;
  function ___syscall_fcntl64(fd, cmd, varargs) {
    SYSCALLS.varargs = varargs;
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (cmd) {
        case 0: {
          var arg = syscallGetVarargI();
          if (arg < 0) {
            return -28;
          }
          while (FS.streams[arg]) {
            arg++;
          }
          var newStream;
          newStream = FS.dupStream(stream, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;
        case 3:
          return stream.flags;
        case 4: {
          var arg = syscallGetVarargI();
          var mask = 289792;
          stream.flags = stream.flags & ~mask | arg & mask;
          return 0;
        }
        case 12: {
          var arg = syscallGetVarargP();
          var offset = 0;
          HEAP16[arg + offset >> 1] = 2;
          return 0;
        }
        case 13:
        case 14:
          return 0;
      }
      return -28;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_fstat64(fd, buf) {
    try {
      return SYSCALLS.writeStat(buf, FS.fstat(fd));
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_ioctl(fd, op, varargs) {
    SYSCALLS.varargs = varargs;
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (op) {
        case 21509: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21505: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcgets) {
            var termios = stream.tty.ops.ioctl_tcgets(stream);
            var argp = syscallGetVarargP();
            HEAP32[argp >> 2] = termios.c_iflag || 0;
            HEAP32[argp + 4 >> 2] = termios.c_oflag || 0;
            HEAP32[argp + 8 >> 2] = termios.c_cflag || 0;
            HEAP32[argp + 12 >> 2] = termios.c_lflag || 0;
            for (var i = 0; i < 32; i++) {
              HEAP8[argp + i + 17] = termios.c_cc[i] || 0;
            }
            return 0;
          }
          return 0;
        }
        case 21510:
        case 21511:
        case 21512: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcsets) {
            var argp = syscallGetVarargP();
            var c_iflag = HEAP32[argp >> 2];
            var c_oflag = HEAP32[argp + 4 >> 2];
            var c_cflag = HEAP32[argp + 8 >> 2];
            var c_lflag = HEAP32[argp + 12 >> 2];
            var c_cc = [];
            for (var i = 0; i < 32; i++) {
              c_cc.push(HEAP8[argp + i + 17]);
            }
            return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
          }
          return 0;
        }
        case 21519: {
          if (!stream.tty) return -59;
          var argp = syscallGetVarargP();
          HEAP32[argp >> 2] = 0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -59;
          return -28;
        }
        case 21537:
        case 21531: {
          var argp = syscallGetVarargP();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tiocgwinsz) {
            var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
            var argp = syscallGetVarargP();
            HEAP16[argp >> 1] = winsize[0];
            HEAP16[argp + 2 >> 1] = winsize[1];
          }
          return 0;
        }
        case 21524: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21515: {
          if (!stream.tty) return -59;
          return 0;
        }
        default:
          return -28;
      }
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_lstat64(path, buf) {
    try {
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.lstat(path));
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_newfstatat(dirfd, path, buf, flags) {
    try {
      path = SYSCALLS.getStr(path);
      var nofollow = flags & 256;
      var allowEmpty = flags & 4096;
      flags = flags & ~6400;
      path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
      return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path));
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_openat(dirfd, path, flags, varargs) {
    SYSCALLS.varargs = varargs;
    try {
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      var mode = varargs ? syscallGetVarargI() : 0;
      if (flags & 64) {
        mode &= ~SYSCALLS.currentUmask;
      }
      return FS.open(path, flags, mode).fd;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function ___syscall_stat64(path, buf) {
    try {
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.stat(path));
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  var __abort_js = () => abort("");
  var INT53_MAX = 9007199254740992;
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = (num) => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num);
  function __mmap_js(len, prot, flags, fd, offset, allocated, addr) {
    offset = bigintToI53Checked(offset);
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      var res = FS.mmap(stream, len, offset, prot, flags);
      var ptr = res.ptr;
      HEAP32[allocated >> 2] = res.allocated;
      HEAPU32[addr >> 2] = ptr;
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  function __munmap_js(addr, len, prot, flags, fd, offset) {
    offset = bigintToI53Checked(offset);
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      if (prot & 2) {
        SYSCALLS.doMsync(addr, stream, len, flags, offset);
      }
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return -e.errno;
    }
  }
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
  var __tzset_js = (timezone, daylight, std_name, dst_name) => {
    var currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    var winter = new Date(currentYear, 0, 1);
    var summer = new Date(currentYear, 6, 1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
    HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
    var extractZone = (timezoneOffset) => {
      var sign = timezoneOffset >= 0 ? "-" : "+";
      var absOffset = Math.abs(timezoneOffset);
      var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
      var minutes = String(absOffset % 60).padStart(2, "0");
      return `UTC${sign}${hours}${minutes}`;
    };
    var winterName = extractZone(winterOffset);
    var summerName = extractZone(summerOffset);
    if (summerOffset < winterOffset) {
      stringToUTF8(winterName, std_name, 17);
      stringToUTF8(summerName, dst_name, 17);
    } else {
      stringToUTF8(winterName, dst_name, 17);
      stringToUTF8(summerName, std_name, 17);
    }
  };
  var getHeapMax = () => 1073741824;
  var growMemory = (size) => {
    var oldHeapSize = wasmMemory.buffer.byteLength;
    var pages = (size - oldHeapSize + 65535) / 65536 | 0;
    try {
      wasmMemory.grow(pages);
      updateMemoryViews();
      return 1;
    } catch (e) {
    }
  };
  var _emscripten_resize_heap = (requestedSize) => {
    var oldSize = HEAPU8.length;
    requestedSize >>>= 0;
    var maxHeapSize = getHeapMax();
    if (requestedSize > maxHeapSize) {
      return false;
    }
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
      var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
      overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
      var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
      var replacement = growMemory(newSize);
      if (replacement) {
        return true;
      }
    }
    return false;
  };
  var ENV = {};
  var getExecutableName = () => thisProgram;
  var getEnvStrings = () => {
    if (!getEnvStrings.strings) {
      var lang = (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8";
      var env = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: lang, _: getExecutableName() };
      for (var x in ENV) {
        if (ENV[x] === void 0) delete env[x];
        else env[x] = ENV[x];
      }
      var strings = [];
      for (var x in env) {
        strings.push(`${x}=${env[x]}`);
      }
      getEnvStrings.strings = strings;
    }
    return getEnvStrings.strings;
  };
  var _environ_get = (__environ, environ_buf) => {
    var bufSize = 0;
    var envp = 0;
    for (var string of getEnvStrings()) {
      var ptr = environ_buf + bufSize;
      HEAPU32[__environ + envp >> 2] = ptr;
      bufSize += stringToUTF8(string, ptr, Infinity) + 1;
      envp += 4;
    }
    return 0;
  };
  var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
    var strings = getEnvStrings();
    HEAPU32[penviron_count >> 2] = strings.length;
    var bufSize = 0;
    for (var string of strings) {
      bufSize += lengthBytesUTF8(string) + 1;
    }
    HEAPU32[penviron_buf_size >> 2] = bufSize;
    return 0;
  };
  function _fd_close(fd) {
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return e.errno;
    }
  }
  var doReadv = (stream, iov, iovcnt, offset) => {
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
      var ptr = HEAPU32[iov >> 2];
      var len = HEAPU32[iov + 4 >> 2];
      iov += 8;
      try {
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
      } catch (e) {
        if (ret > 0 && e instanceof FS.ErrnoError && (e.errno == 6 || e.errno == 6)) {
          break;
        }
        throw e;
      }
      if (curr < 0) return -1;
      ret += curr;
      if (curr < len) break;
      if (typeof offset != "undefined") {
        offset += curr;
      }
    }
    return ret;
  };
  function _fd_read(fd, iov, iovcnt, pnum) {
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doReadv(stream, iov, iovcnt);
      HEAPU32[pnum >> 2] = num;
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return e.errno;
    }
  }
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
    try {
      if (isNaN(offset)) return 22;
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.llseek(stream, offset, whence);
      HEAP64[newOffset >> 3] = BigInt(stream.position);
      if (stream.getdents && !offset && whence === 0) stream.getdents = null;
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return e.errno;
    }
  }
  var doWritev = (stream, iov, iovcnt, offset) => {
    if (iovcnt == 1) {
      return FS.write(stream, HEAP8, HEAPU32[iov >> 2], HEAPU32[iov + 4 >> 2], offset);
    }
    var total = 0;
    for (var i = 0, p = iov; i < iovcnt; i++, p += 8) {
      total += HEAPU32[p + 4 >> 2];
    }
    var view = new Uint8Array(total);
    var voff = 0;
    for (var i = 0; i < iovcnt; i++, iov += 8) {
      var ptr = HEAPU32[iov >> 2];
      var len = HEAPU32[iov + 4 >> 2];
      view.set(HEAPU8.subarray(ptr, ptr + len), voff);
      voff += len;
    }
    return FS.write(stream, view, 0, total, offset);
  };
  function _fd_write(fd, iov, iovcnt, pnum) {
    try {
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doWritev(stream, iov, iovcnt);
      HEAPU32[pnum >> 2] = num;
      return 0;
    } catch (e) {
      if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
      return e.errno;
    }
  }
  var getCFunc = (ident) => {
    var func = Module2["_" + ident];
    return func;
  };
  var writeArrayToMemory = (array, buffer) => {
    HEAP8.set(array, buffer);
  };
  var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
  var stringToUTF8OnStack = (str) => {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8(str, ret, size);
    return ret;
  };
  var ccall = (ident, returnType, argTypes, args, opts) => {
    var toC = { string: (str) => {
      var ret2 = 0;
      if (str !== null && str !== void 0 && str !== 0) {
        ret2 = stringToUTF8OnStack(str);
      }
      return ret2;
    }, array: (arr) => {
      var ret2 = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret2);
      return ret2;
    } };
    function convertReturnValue(ret2) {
      if (returnType === "string") {
        return UTF8ToString(ret2);
      }
      if (returnType === "boolean") return Boolean(ret2);
      return ret2;
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (!stack) stack = stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func(...cArgs);
    function onDone(ret2) {
      if (stack) stackRestore(stack);
      return convertReturnValue(ret2);
    }
    ret = onDone(ret);
    return ret;
  };
  var cwrap = (ident, returnType, argTypes, opts) => {
    var numericArgs = !argTypes || argTypes.every((type) => type === "number" || type === "boolean");
    var numericRet = returnType !== "string";
    if (numericRet && numericArgs && !opts) {
      return getCFunc(ident);
    }
    return (...args) => ccall(ident, returnType, argTypes, args, opts);
  };
  var FS_createPath = (...args) => FS.createPath(...args);
  var FS_unlink = (...args) => FS.unlink(...args);
  var FS_createLazyFile = (...args) => FS.createLazyFile(...args);
  var FS_createDevice = (...args) => FS.createDevice(...args);
  FS.createPreloadedFile = FS_createPreloadedFile;
  FS.preloadFile = FS_preloadFile;
  FS.staticInit();
  {
    if (Module2["print"]) out = Module2["print"];
    if (Module2["printErr"]) err = Module2["printErr"];
    if (Module2["wasmBinary"]) wasmBinary = Module2["wasmBinary"];
  }
  Module2["addRunDependency"] = addRunDependency;
  Module2["removeRunDependency"] = removeRunDependency;
  Module2["ccall"] = ccall;
  Module2["cwrap"] = cwrap;
  Module2["UTF8ToString"] = UTF8ToString;
  Module2["stringToUTF8"] = stringToUTF8;
  Module2["lengthBytesUTF8"] = lengthBytesUTF8;
  Module2["FS_preloadFile"] = FS_preloadFile;
  Module2["FS_unlink"] = FS_unlink;
  Module2["FS_createPath"] = FS_createPath;
  Module2["FS_createDevice"] = FS_createDevice;
  Module2["FS"] = FS;
  Module2["FS_createDataFile"] = FS_createDataFile;
  Module2["FS_createLazyFile"] = FS_createLazyFile;
  var _ojt_init, _ojt_stage1, _malloc, _free, _ojt_stage2, _ojt_labels, _emscripten_builtin_memalign, _setThrew, __emscripten_stack_restore, __emscripten_stack_alloc, _emscripten_stack_get_current, memory, __indirect_function_table, wasmMemory;
  function assignWasmExports(wasmExports2) {
    _ojt_init = Module2["_ojt_init"] = wasmExports2["ojt_init"];
    _ojt_stage1 = Module2["_ojt_stage1"] = wasmExports2["ojt_stage1"];
    _malloc = Module2["_malloc"] = wasmExports2["malloc"];
    _free = Module2["_free"] = wasmExports2["free"];
    _ojt_stage2 = Module2["_ojt_stage2"] = wasmExports2["ojt_stage2"];
    _ojt_labels = Module2["_ojt_labels"] = wasmExports2["ojt_labels"];
    _emscripten_builtin_memalign = wasmExports2["emscripten_builtin_memalign"];
    _setThrew = wasmExports2["setThrew"];
    __emscripten_stack_restore = wasmExports2["_emscripten_stack_restore"];
    __emscripten_stack_alloc = wasmExports2["_emscripten_stack_alloc"];
    _emscripten_stack_get_current = wasmExports2["emscripten_stack_get_current"];
    memory = wasmMemory = wasmExports2["memory"];
    __indirect_function_table = wasmExports2["__indirect_function_table"];
  }
  var wasmImports = { __cxa_throw: ___cxa_throw, __syscall_fcntl64: ___syscall_fcntl64, __syscall_fstat64: ___syscall_fstat64, __syscall_ioctl: ___syscall_ioctl, __syscall_lstat64: ___syscall_lstat64, __syscall_newfstatat: ___syscall_newfstatat, __syscall_openat: ___syscall_openat, __syscall_stat64: ___syscall_stat64, _abort_js: __abort_js, _mmap_js: __mmap_js, _munmap_js: __munmap_js, _tzset_js: __tzset_js, emscripten_resize_heap: _emscripten_resize_heap, environ_get: _environ_get, environ_sizes_get: _environ_sizes_get, fd_close: _fd_close, fd_read: _fd_read, fd_seek: _fd_seek, fd_write: _fd_write };
  async function run() {
    preRun();
    if (runDependencies) {
      await resolveRunDependencies();
    }
    if (ABORT) return;
    initRuntime();
    postRun();
  }
  var wasmExports;
  wasmExports = await createWasm();
  await run();
  ;
  return Module2;
}
var ojt_default = Module;

// node_modules/@internal/read-aloud/backend/piper-plus/ja-frontend.js
var FIELDS = ["string", "pos", "pos_group1", "pos_group2", "pos_group3", "ctype", "cform", "orig", "read", "pron", "acc", "mora_size", "chain_rule", "chain_flag"];
var INT_FIELDS = /* @__PURE__ */ new Set(["acc", "mora_size", "chain_flag"]);
var cps = (s) => Array.from(s);
var isKanji = (c) => {
  const o = c.codePointAt(0);
  return o >= 19968 && o <= 40959;
};
function parseNjd(tsv) {
  const out = [];
  for (const line of tsv.split("\n")) {
    if (!line) continue;
    const f = line.split("	"), o = {};
    FIELDS.forEach((k, i) => {
      o[k] = INT_FIELDS.has(k) ? parseInt(f[i], 10) : f[i] ?? "";
    });
    out.push(o);
  }
  return out;
}
var dumpNjd = (features) => features.map((o) => FIELDS.map((k) => String(o[k]).replace(/[\t\n\0]/g, "")).join("	")).join("\n") + (features.length ? "\n" : "");
function applyOriginalRuleBeforeChaining(F) {
  for (let i = 0; i < F.length - 1; i++) {
    const njd = F[i], next = F[i + 1];
    if (njd.pos === "\u540D\u8A5E" && next.string === "\u4E0D\u8DB3" && next.pron === "\u30D5\u30BD\u30AF") {
      next.read = "\u30D6\u30BD\u30AF";
      next.pron = "\u30D6\u30BD\u30AF";
    }
    let isFractionDenominator = false;
    if (i + 2 < F.length && next.string === "\u306E") isFractionDenominator = F[i + 2].pos_group1 === "\u6570";
    if (isFractionDenominator && njd.string.endsWith("\u5206")) {
      if (njd.pron.endsWith("\u30D5\u30F3") || njd.pron.endsWith("\u30D7\u30F3")) {
        njd.read = cps(njd.read).slice(0, -2).join("") + "\u30D6\u30F3";
        njd.pron = cps(njd.pron).slice(0, -2).join("") + "\u30D6\u30F3";
      } else if (njd.pron.endsWith("\u30D6")) {
        njd.read += "\u30F3";
        njd.pron += "\u30F3";
      }
    }
    if (i > 0 && i + 2 < F.length && njd.string === "\u5206" && F[i - 1].pos_group1 === "\u6570" && next.string === "\u306E" && F[i + 2].pos_group1 === "\u6570") {
      njd.read = "\u30D6\u30F3";
      njd.pron = "\u30D6\u30F3";
    }
    if (njd.string === "\u3007" && next.string === "\u3007") for (const p of [njd, next]) {
      p.pos_group1 = "\u4E00\u822C";
      p.read = "\u30DE\u30EB";
      p.pron = "\u30DE\u30EB";
      p.acc = 1;
      p.mora_size = 2;
    }
    if (next.string === "\u7403" && next.pos === "\u540D\u8A5E" && next.pos_group1 === "\u63A5\u5C3E" && next.pron === "\u30AD\u30E5\u30FC" && cps(njd.string).some((c) => c >= "\u4E00" && c <= "\u9FFF") && cps(njd.string).some((c) => c >= "\u3041" && c <= "\u3096")) {
      next.read = "\u30C0\u30DE";
      next.pron = "\u30C0\u30DE";
      next.acc = 1;
      next.mora_size = 2;
      next.chain_rule = "C4";
    }
    if ((["\u30B5\u5909\u63A5\u7D9A", "\u683C\u52A9\u8A5E", "\u63A5\u7D9A\u52A9\u8A5E"].includes(njd.pos_group1) || njd.pos === "\u540D\u8A5E" && njd.pos_group1 === "\u4E00\u822C" || njd.pos === "\u526F\u8A5E") && next.ctype === "\u30B5\u5909\u30FB\u30B9\u30EB") next.chain_flag = 1;
    if (["\u304A", "\u5FA1", "\u3054"].includes(njd.string) && njd.chain_rule === "P1") {
      if (next.acc === 0 || next.acc === next.mora_size) {
        next.chain_rule = "C4";
        next.acc = 0;
      } else next.chain_rule = "C1";
    }
    if (njd.pos === "\u52D5\u8A5E" && next.pos === "\u52D5\u8A5E") next.chain_rule = next.acc !== 0 ? "C1" : "C4";
    if (["\u9023\u7528\u5F62", "\u9023\u7528\u30BF\u63A5\u7D9A", "\u9023\u7528\u30B4\u30B6\u30A4\u63A5\u7D9A", "\u9023\u7528\u30C6\u63A5\u7D9A"].includes(njd.cform) && njd.acc === njd.mora_size && njd.mora_size > 1) njd.acc -= 1;
    if (["\u308C\u308B", "\u3089\u308C\u308B", "\u305B\u308B", "\u3055\u305B\u308B", "\u3061\u3083\u3046"].includes(njd.orig) && next.string === "\u305F") next.chain_rule = "F2@1";
    if (njd.pos === "\u5F62\u5BB9\u8A5E" && ["\u306A\u308B", "\u3059\u308B"].includes(next.orig)) next.chain_flag = 1;
  }
  return F;
}
function modifyFillerAccent(F) {
  let after = false;
  for (const f of F) {
    if (f.pos === "\u30D5\u30A3\u30E9\u30FC") {
      if (f.acc > f.mora_size) f.acc = 0;
      after = true;
    } else if (after) {
      if (f.pos === "\u540D\u8A5E") f.chain_flag = 0;
      after = false;
    }
  }
  return F;
}
function naniPredict(model, next) {
  if (!next) return 0;
  const x = [];
  for (const oh of model.onehot) {
    const v = next[model.x_cols[oh.col]];
    for (const c of oh.cats) x.push(c === v ? 1 : 0);
  }
  const score = [0, 0];
  for (const tree of model.trees) {
    let n = 0;
    for (; ; ) {
      const [mode, feat, val, tn2, fn2] = tree.nodes[n];
      if (mode === "LEAF") {
        const w = tree.leaves[n];
        if (w) {
          score[0] += w[0];
          score[1] += w[1];
        }
        break;
      }
      n = x[feat] <= val ? tn2 : fn2;
    }
  }
  return score[1] > score[0] ? 1 : 0;
}
function predictNaniReading(F, model) {
  F.forEach((cur, i) => {
    if (cur.orig !== "\u4F55") return;
    const next = i + 1 < F.length ? F[i + 1] : null;
    const high = next !== null && (["\u3092", "\u304C", "\u306B", "\u3082", "\u3088\u308A"].includes(next.orig) || next.orig === "\u3059\u308B" || next.string === "\u3067" && next.pos === "\u52A9\u52D5\u8A5E" && next.ctype === "\u7279\u6B8A\u30FB\u30C0");
    const keepNan = next !== null && next.orig === "\u3067" && next.pos === "\u52A9\u8A5E" && next.pos_group1 === "\u683C\u52A9\u8A5E";
    let isNan;
    if (high) isNan = 0;
    else if (keepNan) isNan = 1;
    else if (model) isNan = naniPredict(model, next);
    else return;
    cur.pron = cur.read = isNan === 1 ? "\u30CA\u30F3" : "\u30CA\u30CB";
  });
  return F;
}
var MULTI_READ_KANJI = new Set("\u98A8\u89B3\u65B9\u51FA\u6642\u4E0A\u4E0B\u541B\u624B\u5ACC\u8868\u5BFE\u8272\u4EBA\u524D\u5F8C\u89D2\u91D1\u982D\u7B46\u6C34\u9593\u68DA\u5E8A\u5165\u6765\u5857\u6012\u5305\u88AB\u958B\u5F3E\u637B\u6F5C\u652F\u62B1\u884C\u964D\u7A2E\u8A33\u7CDE\u7A7A\u6027\u4F53\u7B49\u751F\u6B62\u582A\u6369\u5BB6\u7E01\u52B4\u4E2D\u9AD8\u4F4E\u6C17\u8981\u9000\u9762\u8272\u4E3B\u8853\u76F4\u7247\u7DD2\u5C0F\u5927\u5024".split(""));
function emulateKanjiYomiPass(F) {
  const hits = F.filter((f) => MULTI_READ_KANJI.has(f.orig)), surfaceHits = F.filter((f) => MULTI_READ_KANJI.has(f.string));
  if (!hits.length || surfaceHits.length !== hits.length) return F;
  for (const f of hits) if (f.pos_group1 !== "\u63A5\u5C3E" && f.pos !== "\u63A5\u982D\u8A5E") {
    const y = f.orig === "\u65B9" && f.read === "\u30DB\u30A6" ? "\u30DB\u30AA" : f.read;
    f.pron = y;
    f.read = y;
  }
  return F;
}
var DAN = {};
for (const [d, s] of [["a", "\u30A2\u30AB\u30B5\u30BF\u30CA\u30CF\u30DE\u30E4\u30E9\u30EF\u30AC\u30B6\u30C0\u30D0\u30D1\u30A1"], ["i", "\u30A4\u30AD\u30B7\u30C1\u30CB\u30D2\u30DF\u30EA\u30AE\u30B8\u30C2\u30D3\u30D4\u30A3"], ["u", "\u30A6\u30AF\u30B9\u30C4\u30CC\u30D5\u30E0\u30E6\u30EB\u30B0\u30BA\u30C5\u30D6\u30D7\u30F4\u30A5"], ["e", "\u30A8\u30B1\u30BB\u30C6\u30CD\u30D8\u30E1\u30EC\u30B2\u30BC\u30C7\u30D9\u30DA\u30A7"], ["o", "\u30AA\u30B3\u30BD\u30C8\u30CE\u30DB\u30E2\u30E8\u30ED\u30F2\u30B4\u30BE\u30C9\u30DC\u30DD\u30A9"]]) for (const c of s) DAN[c] = d;
function suppressUnnaturalAuxiliaryULongVowel(F) {
  for (let i = 0; i < F.length - 1; i++) {
    const cur = F[i], next = F[i + 1];
    if (next.pron !== "\u30FC" || next.read !== "\u30A6") continue;
    const p = cps(cur.pron.replace(/’+$/u, ""));
    if (!p.length) continue;
    if (["a", "i", "e"].includes(DAN[p[p.length - 1]])) next.pron = "\u30A6";
  }
  return F;
}
var YOUON = new Set("\u30E3\u30E5\u30E7\u30A1\u30A3\u30A5\u30A7\u30A9");
function retreatAccNuc(F) {
  if (!F.length) return F;
  let acc = 0, head = F[0];
  for (const njd of F) {
    if (njd.chain_flag === 0 || njd.chain_flag === -1) {
      head = njd;
      acc = njd.acc;
    }
    let pron = cps(njd.pron).filter((c) => !YOUON.has(c));
    if (pron.length === 0) pron = cps(njd.pron);
    if (acc > 0) {
      if (acc <= njd.mora_size) {
        const nuc = acc - 1 < pron.length ? pron[acc - 1] : pron[0];
        if (["\u30FC", "\u30C3", "\u30F3"].includes(nuc)) head.acc += -1;
        acc = -1;
      } else acc = acc - njd.mora_size;
    }
  }
  return F;
}
function modifyAccAfterChaining(F) {
  if (!F.length) return F;
  let acc = 0, isAfterNuc = false, phaseLen = 0, head = F[0];
  for (const njd of F) {
    if (njd.chain_flag === 0 || njd.chain_flag === -1) {
      isAfterNuc = false;
      head = njd;
      acc = njd.acc;
      phaseLen = 0;
    }
    if (acc === 0) continue;
    else if (isAfterNuc) {
      if (njd.ctype === "\u7279\u6B8A\u30FB\u30DE\u30B9") head.acc = njd.cform !== "\u672A\u7136\u5F62" ? phaseLen + 1 : phaseLen + 2;
      else if (njd.ctype === "\u7279\u6B8A\u30FB\u30CA\u30A4") head.acc = phaseLen;
      else if (["\u308C\u308B", "\u3089\u308C\u308B", "\u3059\u304E\u308B", "\u305B\u308B", "\u3055\u305B\u308B"].includes(njd.orig)) head.acc = phaseLen + njd.acc;
      else {
        isAfterNuc = false;
        acc = 0;
      }
      phaseLen += njd.mora_size;
    } else {
      phaseLen += njd.mora_size;
      if (acc <= njd.mora_size) isAfterNuc = true;
      else acc = acc - njd.mora_size;
    }
  }
  return F;
}
var SEION = {};
{
  const d = "\u304C\u304E\u3050\u3052\u3054\u3056\u3058\u305A\u305C\u305E\u3060\u3062\u3065\u3067\u3069\u3070\u3073\u3076\u3079\u307C\u30AC\u30AE\u30B0\u30B2\u30B4\u30B6\u30B8\u30BA\u30BC\u30BE\u30C0\u30C2\u30C5\u30C7\u30C9\u30D0\u30D3\u30D6\u30D9\u30DC\u30F4", s = "\u304B\u304D\u304F\u3051\u3053\u3055\u3057\u3059\u305B\u305D\u305F\u3061\u3064\u3066\u3068\u306F\u3072\u3075\u3078\u307B\u30AB\u30AD\u30AF\u30B1\u30B3\u30B5\u30B7\u30B9\u30BB\u30BD\u30BF\u30C1\u30C4\u30C6\u30C8\u30CF\u30D2\u30D5\u30D8\u30DB\u30A6";
  cps(d).forEach((c, i) => {
    SEION[c] = cps(s)[i];
  });
}
function splitKanaMora(text) {
  const ch = cps(text), out = [];
  for (let i = 0; i < ch.length; ) {
    if (i + 1 < ch.length && YOUON.has(ch[i + 1])) {
      out.push(ch[i] + ch[i + 1]);
      i += 2;
    } else {
      out.push(ch[i]);
      i++;
    }
  }
  return out;
}
function detectOdoriUnit(read) {
  const m = splitKanaMora(cps(read).map((c) => SEION[c] ?? c).join("")), n = m.length;
  if (n < 2) return null;
  for (let p = 1; p <= Math.floor(n / 2); p++) if (m.slice(n - p * 2, n - p).join("|") === m.slice(n - p).join("|")) return p;
  return null;
}
var DAKU = {};
{
  const a = "\u30AB\u30AD\u30AF\u30B1\u30B3\u30B5\u30B7\u30B9\u30BB\u30BD\u30BF\u30C1\u30C4\u30C6\u30C8\u30CF\u30D2\u30D5\u30D8\u30DB\u304B\u304D\u304F\u3051\u3053\u3055\u3057\u3059\u305B\u305D\u305F\u3061\u3064\u3066\u3068\u306F\u3072\u3075\u3078\u307B", b = "\u30AC\u30AE\u30B0\u30B2\u30B4\u30B6\u30B8\u30BA\u30BC\u30BE\u30C0\u30C2\u30C5\u30C7\u30C9\u30D0\u30D3\u30D6\u30D9\u30DC\u304C\u304E\u3050\u3052\u3054\u3056\u3058\u305A\u305C\u305E\u3060\u3062\u3065\u3067\u3069\u3070\u3073\u3076\u3079\u307C";
  cps(a).forEach((c, i) => {
    DAKU[c] = cps(b)[i];
  });
  for (const [x, y] of [["\u30AD", "\u30AE"], ["\u30B7", "\u30B8"], ["\u30C1", "\u30C2"], ["\u30D2", "\u30D3"], ["\u304D", "\u304E"], ["\u3057", "\u3058"], ["\u3061", "\u3062"], ["\u3072", "\u3073"]]) for (const s of x < "\u30A1" ? "\u3083\u3085\u3087" : "\u30E3\u30E5\u30E7") DAKU[x + s] = y + s;
}
var DAKU_REV = Object.fromEntries(Object.entries(DAKU).map(([k, v]) => [v, k]));
var asNoun = (f) => {
  f.pos = "\u540D\u8A5E";
  f.pos_group1 = "\u4E00\u822C";
  f.pos_group2 = "*";
  f.pos_group3 = "*";
  f.ctype = "*";
  f.cform = "*";
};
function processOdoriFeatures(F, cFrontend) {
  const isDancing = (orig) => orig.length > 0 && cps(orig).every((c) => c === "\u3005");
  const isOdoriji = (orig) => cps(orig).every((c) => "\u309D\u309E\u30FD\u30FE".includes(c));
  const countOdori = (orig) => cps(orig).filter((c) => c === "\u3005").length;
  const isKanjiToken = (t) => t.pos !== "\u8A18\u53F7" && cps(t.orig).some(isKanji);
  const isSingleKanjiToken = (t) => isKanjiToken(t) && cps(t.orig).length === 1 && isKanji(cps(t.orig)[0]);
  const needsReanalysis = (od, prev, next) => {
    if (countOdori(od.orig) !== 1 || !isKanjiToken(prev)) return [false, "", null];
    const po2 = cps(prev.orig);
    if (po2.length > 1 && isKanji(po2[po2.length - 1])) return [true, po2[po2.length - 1], next && isSingleKanjiToken(next) ? next.orig : null];
    return [false, "", null];
  };
  const processOdoriji = (od, prev) => {
    const readChars = splitKanaMora(prev.read);
    let src = prev.pron.replace(/’/g, "");
    if (src === "") src = prev.read;
    const pronChars = splitKanaMora(src), moraPerChar = prev.mora_size / readChars.length;
    const pRead = readChars[readChars.length - 1], pPron = pronChars[pronChars.length - 1];
    let forced = false;
    for (const c of cps(od.orig)) {
      if (c === "\u309E" || c === "\u30FE") {
        forced = true;
        break;
      }
      if (c === "\u309D" || c === "\u30FD") break;
    }
    const single = !cps(pRead).some((c) => YOUON.has(c));
    if (forced) {
      od.read = DAKU[pRead] || pRead;
      od.pron = DAKU[pPron] || pPron;
    } else if (single) {
      od.read = DAKU_REV[pRead] || pRead;
      od.pron = DAKU_REV[pPron] || pPron;
    } else {
      od.read = pRead;
      od.pron = pPron;
    }
    od.mora_size = Math.trunc(moraPerChar);
    if (od.pos === "\u8A18\u53F7") asNoun(od);
    return od;
  };
  let i = 0;
  while (i < F.length) {
    if (isDancing(F[i].orig)) {
      if (i > 0 && cFrontend) {
        const [need, target, nextKanji] = needsReanalysis(F[i], F[i - 1], i + 1 < F.length ? F[i + 1] : null);
        if (need) {
          if (nextKanji !== null) {
            const an3 = cFrontend(target + nextKanji);
            if (an3.length > 0) an3[0].chain_flag = 1;
            F.splice(i, 2, ...an3);
            i += an3.length;
            continue;
          }
          const an2 = cFrontend(target);
          F[i] = an2[0];
          F[i].chain_flag = 1;
          asNoun(F[i]);
          i += 1;
          continue;
        }
      }
      const start = i;
      let end = i, total = 0;
      while (end < F.length && isDancing(F[end].orig)) {
        total += countOdori(F[end].orig);
        end++;
      }
      if (i > 0 && F[i - 1].orig.endsWith("\u3005")) {
        const prev = F[i - 1], period = detectOdoriUnit(prev.read);
        if (period !== null) {
          const rm = splitKanaMora(prev.read), pm = splitKanaMora(prev.pron);
          if (rm.length >= period && rm.length > 0) {
            const cur = F[i], n = countOdori(cur.orig), unitMora = Math.floor(prev.mora_size / rm.length) * period;
            cur.read = rm.slice(rm.length - period).join("").repeat(n);
            cur.pron = pm.slice(pm.length - period).join("").repeat(n);
            cur.mora_size = unitMora * n;
            cur.acc = prev.acc;
            cur.chain_flag = 1;
            if (cur.pos === "\u8A18\u53F7") asNoun(cur);
            i += 1;
            continue;
          }
        }
      }
      const normal = [];
      let j = start - 1, collected = 0;
      const needed = Math.min(total, 8);
      while (j >= 0) {
        const t = F[j];
        if (["\u8A18\u53F7", "\u30D5\u30A3\u30E9\u30FC", "\u611F\u52D5\u8A5E"].includes(t.pos)) break;
        if (isKanjiToken(t)) {
          normal.push(t);
          collected += cps(t.orig).length;
          if (collected >= needed) break;
        } else break;
        j--;
      }
      normal.reverse();
      if (!normal.length) {
        i = end;
        continue;
      }
      const singleKanji = normal.length === 1 && cps(normal[0].orig).length === 1;
      const baseRead = singleKanji ? normal[0].read : normal.map((x) => x.read).join(""), basePron = singleKanji ? normal[0].pron : normal.map((x) => x.pron).join("");
      const baseMora = singleKanji ? normal[0].mora_size : normal.reduce((a, x) => a + x.mora_size, 0), baseAcc = normal[0].acc;
      for (let k = start; k < end; k++) {
        const n = countOdori(F[k].orig);
        if (singleKanji) {
          F[k].read = baseRead.repeat(n);
          F[k].pron = basePron.repeat(n);
          F[k].mora_size = baseMora * n;
        } else {
          F[k].read = baseRead;
          F[k].pron = basePron;
          F[k].mora_size = baseMora;
        }
        F[k].acc = baseAcc;
        F[k].chain_flag = 1;
        if (F[k].pos === "\u8A18\u53F7") asNoun(F[k]);
      }
      i = end;
    } else if (isOdoriji(F[i].orig)) {
      if (i > 0 && F[i - 1].pos !== "\u8A18\u53F7") {
        let p = i - 1;
        while (p >= 0) {
          if (F[p].pos !== "\u8A18\u53F7" && F[p].mora_size > 0) break;
          p--;
        }
        if (p >= 0) F[i] = processOdoriji(F[i], F[p]);
      }
      i += 1;
    } else i += 1;
  }
  return F;
}
function questionType(text) {
  const s = text.trim(), e = (...xs) => xs.some((x) => s.endsWith(x));
  if (e("?!", "\uFF01\uFF1F", "\uFF1F\uFF01")) return "?!";
  if (e("?.", "\u3002\uFF1F", "\uFF1F\u3002")) return "?.";
  if (e("?~", "\uFF5E\uFF1F", "\uFF1F\uFF5E")) return "?~";
  if (e("?", "\uFF1F")) return "?";
  return "$";
}
var SKIP = /* @__PURE__ */ new Set(["_", "#", "[", "]", "^", "$", "?", "?!", "?.", "?~"]);
function applyNRules(tokens) {
  const r = tokens.slice();
  let next = null;
  for (let i = r.length - 1; i >= 0; i--) {
    const t = r[i];
    if (!SKIP.has(t) && t !== "N") next = t;
    else if (t === "N") {
      if (next === null) r[i] = "N_uvular";
      else if (["m", "my", "b", "by", "p", "py"].includes(next)) r[i] = "N_m";
      else if (["n", "ny", "t", "ty", "d", "dy", "ts", "ch"].includes(next)) r[i] = "N_n";
      else if (["k", "ky", "kw", "g", "gy", "gw"].includes(next)) r[i] = "N_ng";
      else r[i] = "N_uvular";
      next = r[i];
    }
  }
  return r;
}
var RE_PH = /-([^+]+)\+/;
var RE_PROS = /\/A:([\d-]+)\+([0-9]+)\+([0-9]+)\//;
function labelsToTokens(labels, text) {
  const tokens = [], prosody = [], q2 = questionType(text);
  labels.forEach((label, idx) => {
    const m = RE_PH.exec(label);
    if (!m) return;
    const ph = m[1];
    if (ph === "sil") {
      if (idx !== 0 && idx === labels.length - 1 && q2 !== "$") {
        tokens.push(q2);
        prosody.push(null);
      }
      return;
    }
    if (ph === "pau") {
      tokens.push("_");
      prosody.push(null);
      return;
    }
    tokens.push(ph);
    const p = RE_PROS.exec(label);
    if (!p) {
      prosody.push(null);
      return;
    }
    const a1 = parseInt(p[1], 10), a2 = parseInt(p[2], 10), a3 = parseInt(p[3], 10);
    prosody.push([a1, a2, a3]);
    let a2next = -1;
    if (idx < labels.length - 1) {
      const n = RE_PROS.exec(labels[idx + 1]);
      a2next = n ? parseInt(n[2], 10) : -1;
    }
    if (a1 === 0 && a2next === a2 + 1) {
      tokens.push("]");
      prosody.push(null);
    }
    if (a2 === a3 && a2next === 1) {
      tokens.push("#");
      prosody.push(null);
    }
    if (a2 === 1 && a2next === 2) {
      tokens.push("[");
      prosody.push(null);
    }
  });
  return { tokens: applyNRules(tokens), prosody };
}
function mountDictionaryBytes(Module2, dict, dicDir = "/dic") {
  Module2.FS.mkdir(dicDir);
  for (const [name, bytes2] of [["char.bin", dict.char], ["matrix.bin", dict.matrix], ["unk.dic", dict.unk]]) Module2.FS.writeFile(`${dicDir}/${name}`, bytes2);
  const len = dict.sys.length, ptr = Module2._malloc(len);
  if (!ptr) throw new Error("out of memory while loading the Japanese dictionary");
  Module2.HEAPU8.set(dict.sys, ptr);
  Module2.FS.writeFile(`${dicDir}/sys.dic`, new Uint8Array(0));
  const node = Module2.FS.lookupPath(`${dicDir}/sys.dic`).node;
  node.contents = Module2.HEAPU8.subarray(ptr, ptr + len);
  node.usedBytes = len;
  Module2.__ojtHeapAtMount = Module2.HEAPU8.buffer;
}
function createJaFrontend(Module2, dicDir = "/dic", { naniModel = null, emulateSudachiPass = true } = {}) {
  const call = (name, text) => {
    const n = Module2.lengthBytesUTF8(text) + 1, p = Module2._malloc(n);
    Module2.stringToUTF8(text, p, n);
    try {
      const r = Module2[name](p);
      if (!r) throw new Error(name + " failed (text too long or MeCab error)");
      return Module2.UTF8ToString(r);
    } finally {
      Module2._free(p);
    }
  };
  {
    const n = Module2.lengthBytesUTF8(dicDir) + 1, p = Module2._malloc(n);
    Module2.stringToUTF8(dicDir, p, n);
    const ok = Module2._ojt_init(p);
    Module2._free(p);
    if (ok !== 1) throw new Error("MeCab dictionary load failed: " + dicDir);
  }
  if (Module2.__ojtHeapAtMount && Module2.__ojtHeapAtMount !== Module2.HEAPU8.buffer) throw new Error("WASM heap grew while MeCab was loading the zero-copy dictionary; rebuild ojt.wasm with a larger INITIAL_MEMORY");
  {
    const node = Module2.FS.lookupPath(`${dicDir}/sys.dic`).node;
    node.contents = new Uint8Array(0);
    node.usedBytes = 0;
  }
  function cFrontend(text) {
    const s1 = call("_ojt_stage1", text.replace(/[\t\n\r\0]/g, " "));
    if (!s1) return [];
    return parseNjd(call("_ojt_stage2", dumpNjd(applyOriginalRuleBeforeChaining(parseNjd(s1)))));
  }
  function runFrontend(text, { vanilla = false } = {}) {
    let F = cFrontend(text);
    if (!vanilla) {
      F = modifyFillerAccent(F);
      F = predictNaniReading(F, naniModel);
      if (emulateSudachiPass) F = emulateKanjiYomiPass(F);
      F = suppressUnnaturalAuxiliaryULongVowel(F);
      F = retreatAccNuc(F);
      F = modifyAccAfterChaining(F);
      F = processOdoriFeatures(F, cFrontend);
    }
    return F;
  }
  function extractFullcontext(text, opts) {
    const F = runFrontend(text, opts);
    return F.length ? call("_ojt_labels", dumpNjd(F)).split("\n").filter(Boolean) : [];
  }
  function phonemize(text, opts) {
    const clean = Array.from(text).filter((ch) => ch >= " " || "\n	\r".includes(ch)).join("");
    if (!clean) return { tokens: [], prosody: [] };
    return labelsToTokens(extractFullcontext(clean, opts), clean);
  }
  return { cFrontend, runFrontend, extractFullcontext, phonemize };
}

// node_modules/@internal/read-aloud/backend/piper-plus/pua-map.js
var TOKEN2CHAR = { "a:": "\uE000", "i:": "\uE001", "u:": "\uE002", "e:": "\uE003", "o:": "\uE004", "cl": "\uE005", "ky": "\uE006", "kw": "\uE007", "gy": "\uE008", "gw": "\uE009", "ty": "\uE00A", "dy": "\uE00B", "py": "\uE00C", "by": "\uE00D", "ch": "\uE00E", "ts": "\uE00F", "sh": "\uE010", "zy": "\uE011", "hy": "\uE012", "ny": "\uE013", "my": "\uE014", "ry": "\uE015", "?!": "\uE016", "?.": "\uE017", "?~": "\uE018", "N_m": "\uE019", "N_n": "\uE01A", "N_ng": "\uE01B", "N_uvular": "\uE01C", "rr": "\uE01D", "y_vowel": "\uE01E", "p\u02B0": "\uE020", "t\u02B0": "\uE021", "k\u02B0": "\uE022", "t\u0255": "\uE023", "t\u0255\u02B0": "\uE024", "t\u0282": "\uE025", "t\u0282\u02B0": "\uE026", "ts\u02B0": "\uE027", "a\u026A": "\uE028", "e\u026A": "\uE029", "a\u028A": "\uE02A", "o\u028A": "\uE02B", "an": "\uE02C", "\u0259n": "\uE02D", "a\u014B": "\uE02E", "\u0259\u014B": "\uE02F", "u\u014B": "\uE030", "ia": "\uE031", "i\u025B": "\uE032", "iou": "\uE033", "ia\u028A": "\uE034", "i\u025Bn": "\uE035", "in": "\uE036", "ia\u014B": "\uE037", "i\u014B": "\uE038", "iu\u014B": "\uE039", "ua": "\uE03A", "uo": "\uE03B", "ua\u026A": "\uE03C", "ue\u026A": "\uE03D", "uan": "\uE03E", "u\u0259n": "\uE03F", "ua\u014B": "\uE040", "u\u0259\u014B": "\uE041", "y\u025B": "\uE042", "y\u025Bn": "\uE043", "yn": "\uE044", "\u027B\u0329": "\uE045", "tone1": "\uE046", "tone2": "\uE047", "tone3": "\uE048", "tone4": "\uE049", "tone5": "\uE04A", "p\u0348": "\uE04B", "t\u0348": "\uE04C", "k\u0348": "\uE04D", "s\u0348": "\uE04E", "t\u0348\u0255": "\uE04F", "k\u031A": "\uE050", "t\u031A": "\uE051", "p\u031A": "\uE052", "t\u0283": "\uE054", "d\u0292": "\uE055", "\u025B\u0303": "\uE056", "\u0251\u0303": "\uE057", "\u0254\u0303": "\uE058", "i\u02D0": "\uE059", "y\u02D0": "\uE05A", "e\u02D0": "\uE05B", "\u025B\u02D0": "\uE05C", "\xF8\u02D0": "\uE05D", "\u0251\u02D0": "\uE05E", "o\u02D0": "\uE05F", "u\u02D0": "\uE060", "\u0289\u02D0": "\uE061", "\u0254\u026A": "\uE062", "\u0153\u0303": "\uE063", "\u0250\u0303": "\uE064" };

// node_modules/@internal/read-aloud/backend/piper-plus/encode.js
function encodeTokens(tokens, prosody, phonemeIdMap, { quirk = true, pauseAt = null } = {}) {
  const pad = phonemeIdMap["_"][0], ids = [phonemeIdMap["^"][0], pad], pros = [[0, 0, 0], [0, 0, 0]];
  let k = 0;
  tokens.forEach((tok, i) => {
    const mapped = TOKEN2CHAR[tok] ?? tok;
    for (const ch of mapped) {
      const m = phonemeIdMap[ch];
      if (!m) {
        if (pauseAt && pauseAt.has(ch) && ids.length > 2 && i < tokens.length - 1) {
          ids.push(pad);
          pros.push([0, 0, 0]);
        }
        continue;
      }
      for (const id of m) {
        ids.push(id);
        pros.push((quirk ? prosody[k] : prosody[i]) || [0, 0, 0]);
        k++;
        if (id !== pad) {
          ids.push(pad);
          pros.push([0, 0, 0]);
        }
      }
    }
  });
  ids.push(phonemeIdMap["$"][0]);
  pros.push([0, 0, 0]);
  return { ids, pros };
}

// node_modules/@internal/read-aloud/backend/piper-plus/zh-loanwords.js
var zh_loanwords_default = { "acronyms": { "GPS": ["ji4", "pi4", "ai1", "si4"], "USB": ["you1", "ai1", "si4", "bi4"], "CPU": ["si4", "pi4", "you1"], "GPU": ["ji4", "pi4", "you1"], "AI": ["ei1", "ai4"], "API": ["ei1", "pi4", "ai4"], "URL": ["you1", "a4", "er2", "ai1", "er2"], "SDK": ["ai1", "si4", "di4", "kei4"], "HTML": ["ai1", "chi4", "ti4", "ai1", "mu5", "ai1", "er2"], "CSS": ["si4", "ai1", "si4", "ai1", "si4"], "JS": ["jie4", "ai1", "si4"], "CSV": ["si4", "ai1", "si4", "wei1"], "PDF": ["pi4", "di4", "ai1", "fu2"], "XML": ["ai4", "ke4", "si1", "ai1", "mu5", "ai1", "er2"], "SQL": ["ai1", "si4", "kiu1", "ai1", "er2"], "UI": ["you1", "ai4"], "UX": ["you1", "ai4", "ke4", "si1"], "DNS": ["di4", "en1", "ai1", "si4"], "IP": ["ai4", "pi4"], "TCP": ["ti4", "si4", "pi4"], "UDP": ["you1", "di4", "pi4"], "SSH": ["ai1", "si4", "ai1", "si4", "ai1", "chi4"], "SSL": ["ai1", "si4", "ai1", "si4", "ai1", "er2"], "TLS": ["ti4", "ai1", "er2", "ai1", "si4"], "VPN": ["wei1", "pi4", "en1"], "NPC": ["en1", "pi4", "si4"], "RPG": ["a4", "er2", "pi4", "ji4"], "FPS": ["ai1", "fu2", "pi4", "ai1", "si4"], "CEO": ["si4", "yi1", "ou1"], "CFO": ["si4", "ai1", "fu2", "ou1"], "CTO": ["si4", "ti4", "ou1"], "COO": ["si4", "ou1", "ou1"], "PR": ["pi4", "a4", "er2"], "HR": ["ai1", "chi4", "a4", "er2"], "KPI": ["kei4", "pi4", "ai4"], "ROI": ["a4", "er2", "ou1", "ai4"], "OKR": ["ou1", "kei4", "a4", "er2"], "CRM": ["si4", "a4", "er2", "ai1", "mu5"], "ERP": ["yi1", "a4", "er2", "pi4"], "IOT": ["ai4", "ou1", "ti4"], "AR": ["ei1", "a4", "er2"], "VR": ["wei1", "a4", "er2"], "MR": ["ai1", "mu5", "a4", "er2"], "ML": ["ai1", "mu5", "ai1", "er2"], "DL": ["di4", "ai1", "er2"], "NLP": ["en1", "ai1", "er2", "pi4"], "LED": ["ai1", "er2", "yi1", "di4"], "LCD": ["ai1", "er2", "si4", "di4"], "OLED": ["ou1", "ai1", "er2", "yi1", "di4"], "PHP": ["pi4", "ai1", "chi4", "pi4"], "PNG": ["pi4", "en1", "ji4"], "JPG": ["jie4", "pi4", "ji4"], "MP3": ["ai1", "mu5", "pi4", "san1"], "MP4": ["ai1", "mu5", "pi4", "si4"], "FBI": ["ai1", "fu2", "bi4", "ai4"], "CIA": ["si4", "ai4", "ei1"], "NBA": ["en1", "bi4", "ei1"], "UN": ["you1", "en1"], "EU": ["yi1", "you1"], "UK": ["you1", "kei4"], "US": ["you1", "ai1", "si4"], "USA": ["you1", "ai1", "si4", "ei1"], "ATM": ["ei1", "ti4", "ai1", "mu5"], "PIN": ["pi4", "ai4", "en1"], "FAQ": ["ai1", "fu2", "ei1", "kiu1"], "WTO": ["shuang1", "bi3", "you1", "ti4", "ou1"] }, "loanwords": { "Python": ["pai4", "sen1"], "iPhone": ["ai4", "feng1"], "iPad": ["ai4", "pa4"], "ChatGPT": ["chai4", "ti2", "ji4", "pi4", "ti4"], "Java": ["jia3", "wa3"], "Google": ["gu3", "ge1"], "Facebook": ["fei4", "si1", "bu4", "ke4"], "Microsoft": ["wei2", "ruan3"], "Twitter": ["tui1", "te4"], "YouTube": ["you1", "tu4", "bei4"], "WhatsApp": ["hua2", "ci2", "a1", "pu1"], "WeChat": ["wei1", "xin4"], "TikTok": ["ti4", "ke4", "ti4", "ke4"], "Linux": ["li4", "nei4", "ke4", "si1"], "Docker": ["dao4", "ke4"], "Kubernetes": ["ku4", "bo2", "nei4", "ti4", "si1"], "GitHub": ["ji2", "te4", "ha2", "bu4"], "Slack": ["si1", "la1", "ke4"], "Zoom": ["zu4", "mu3"], "Spotify": ["si1", "bo1", "ti4", "fei1"], "Netflix": ["nai4", "fei1"], "Amazon": ["ya4", "ma3", "xun4"], "Tesla": ["te4", "si1", "la1"], "Bitcoin": ["bi3", "te4", "bi4"], "Ethereum": ["yi3", "tai4", "fang1"], "Discord": ["di2", "si1", "ke1", "de2"], "Reddit": ["rui4", "di2", "te4"], "Steam": ["si1", "ti4", "mu3"], "Minecraft": ["mai4", "ke4", "la1", "fu1", "te4"], "Excel": ["yi1", "ke4", "sai1", "er3"], "Word": ["wo4", "de2"], "PowerPoint": ["pao4", "wei4", "pin3", "te4"], "Skype": ["si1", "kai1", "pu3"], "LinkedIn": ["ling3", "ying1"], "Android": ["an1", "zhuo2"], "iOS": ["ai4", "ou1", "ai1", "si4"], "macOS": ["ma3", "ke4", "ou1", "ai1", "si4"], "Windows": ["wen2", "duo1", "si1"], "Apple": ["a1", "pou1"], "Office": ["ao4", "fei1", "si1"] }, "letter_fallback": { "A": ["ei1"], "B": ["bi4"], "C": ["si4"], "D": ["di4"], "E": ["yi1"], "F": ["ai1", "fu2"], "G": ["ji4"], "H": ["ai1", "chi4"], "I": ["ai4"], "J": ["jie4"], "K": ["kei4"], "L": ["ai1", "er2"], "M": ["ai1", "mu5"], "N": ["en1"], "O": ["ou1"], "P": ["pi4"], "Q": ["kiu1"], "R": ["a4", "er2"], "S": ["ai1", "si4"], "T": ["ti4"], "U": ["you1"], "V": ["wei1"], "W": ["shuang1", "bi3", "you1"], "X": ["ai4", "ke4", "si1"], "Y": ["wai4"], "Z": ["zi4"] } };

// node_modules/@internal/read-aloud/backend/piper-plus/zh-g2p.js
var INITIAL_TO_IPA = {
  b: "p",
  p: "p\u02B0",
  m: "m",
  f: "f",
  d: "t",
  t: "t\u02B0",
  n: "n",
  l: "l",
  g: "k",
  k: "k\u02B0",
  h: "x",
  j: "t\u0255",
  q: "t\u0255\u02B0",
  x: "\u0255",
  zh: "t\u0282",
  ch: "t\u0282\u02B0",
  sh: "\u0282",
  r: "\u027B",
  z: "ts",
  c: "ts\u02B0",
  s: "s"
};
var FINAL_TO_IPA = {
  a: "a",
  o: "o",
  e: "\u0264",
  i: "i",
  u: "u",
  "\xFC": "y_vowel",
  v: "y_vowel",
  ai: "a\u026A",
  ei: "e\u026A",
  ao: "a\u028A",
  ou: "o\u028A",
  an: "an",
  en: "\u0259n",
  ang: "a\u014B",
  eng: "\u0259\u014B",
  ong: "u\u014B",
  er: "\u025A",
  ia: "ia",
  ie: "i\u025B",
  iao: "ia\u028A",
  iu: "iou",
  iou: "iou",
  ian: "i\u025Bn",
  in: "in",
  iang: "ia\u014B",
  ing: "i\u014B",
  iong: "iu\u014B",
  ua: "ua",
  uo: "uo",
  uai: "ua\u026A",
  ui: "ue\u026A",
  uei: "ue\u026A",
  uan: "uan",
  un: "u\u0259n",
  uen: "u\u0259n",
  uang: "ua\u014B",
  ueng: "u\u0259\u014B",
  "\xFCe": "y\u025B",
  ve: "y\u025B",
  "\xFCan": "y\u025Bn",
  van: "y\u025Bn",
  "\xFCn": "yn",
  vn: "yn",
  "-i_retroflex": "\u027B\u0329",
  "-i_alveolar": "\u0268"
};
var INITIALS_ORDER = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "r", "z", "c", "s"];
var RETROFLEX = /* @__PURE__ */ new Set(["zh", "ch", "sh", "r"]);
var ALVEOLAR = /* @__PURE__ */ new Set(["z", "c", "s"]);
var ZH_PUNCT_MAP = { "\u3002": ".", "\uFF0C": ",", "\uFF01": "!", "\uFF1F": "?", "\u3001": ",", "\uFF1B": ";", "\uFF1A": ":", "\u2026": ".", "\u2014": ",", "\u201C": '"', "\u201D": '"', "\u2018": "'", "\u2019": "'" };
var ZH_PUNCT = /* @__PURE__ */ new Set([",", ".", ";", ":", "!", "?", "\u3002", "\uFF0C", "\uFF01", "\uFF1F", "\u3001", "\uFF1B", "\uFF1A", "\u201C", "\u201D", "\u2018", "\u2019", "\u2026", "\u2014"]);
var WS = /* @__PURE__ */ new Set([9, 10, 11, 12, 13, 32, 133, 160, 5760, 8192, 8193, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288]);
var isWs = (ch) => WS.has(ch.codePointAt(0));
var RE_ALPHA = /\p{Alphabetic}/u;
var isCjk = (ch) => {
  const c = ch.codePointAt(0);
  return c >= 19968 && c <= 40959 || c >= 13312 && c <= 19903;
};
function normalizePinyin(py) {
  const s = py.replace(/v/g, "\xFC");
  if (s.startsWith("yu")) return "\xFC" + s.slice(2);
  if (s.startsWith("y")) {
    const rest = s.slice(1);
    return rest.startsWith("i") ? rest : "i" + rest;
  }
  if (s.startsWith("w")) {
    const rest = s.slice(1);
    return rest.startsWith("u") ? rest : "u" + rest;
  }
  return s;
}
function splitPinyin(pinyin) {
  for (const init of INITIALS_ORDER) {
    if (!pinyin.startsWith(init)) continue;
    let fin = pinyin.slice(init.length);
    if (fin === "i") {
      if (RETROFLEX.has(init)) return [init, "-i_retroflex"];
      if (ALVEOLAR.has(init)) return [init, "-i_alveolar"];
    }
    if ((init === "j" || init === "q" || init === "x") && fin.startsWith("u")) fin = "\xFC" + fin.slice(1);
    return [init, fin];
  }
  return ["", pinyin];
}
function pinyinToIpa(syllable, tone) {
  const [initial, fin] = splitPinyin(syllable), tokens = [];
  if (initial && INITIAL_TO_IPA[initial]) tokens.push(INITIAL_TO_IPA[initial]);
  if (fin) {
    if (Object.hasOwn(FINAL_TO_IPA, fin)) tokens.push(FINAL_TO_IPA[fin]);
    else for (const ch of fin) if (ch >= "a" && ch <= "z") tokens.push(Object.hasOwn(FINAL_TO_IPA, ch) ? FINAL_TO_IPA[ch] : ch);
  }
  if (tone >= 1 && tone <= 5) tokens.push("tone" + tone);
  return tokens;
}
function extractTone(syl) {
  const c = syl.charCodeAt(syl.length - 1);
  return c >= 49 && c <= 53 ? [syl.slice(0, -1), c - 48] : [syl, 5];
}
function applyToneSandhi(st) {
  for (let i = 0; i + 1 < st.length; i++) {
    const t = st[i][1], next = st[i + 1][1];
    if (t === 3 && next === 3) {
      st[i][1] = 2;
      continue;
    }
    if (st[i][0] === "i" && t === 1) {
      if (next === 4) st[i][1] = 2;
      else if (next >= 1 && next <= 3) st[i][1] = 4;
      continue;
    }
    if (st[i][0] === "bu" && t === 4 && next === 4) st[i][1] = 2;
  }
}
var DIGIT_PINYIN = ["ling2", "yi1", "er4", "san1", "si4", "wu3", "liu4", "qi1", "ba1", "jiu3"];
function latinToPinyin(token) {
  if (Object.hasOwn(zh_loanwords_default.loanwords, token)) return zh_loanwords_default.loanwords[token];
  const up = token.toUpperCase();
  if (Object.hasOwn(zh_loanwords_default.acronyms, up)) return zh_loanwords_default.acronyms[up];
  const out = [];
  for (const ch of up) {
    if (Object.hasOwn(zh_loanwords_default.letter_fallback, ch)) out.push(...zh_loanwords_default.letter_fallback[ch]);
    else if (ch >= "0" && ch <= "9") out.push(DIGIT_PINYIN[+ch]);
  }
  return out;
}
function createChineseG2p({ single, phrases }) {
  const singleDict = /* @__PURE__ */ new Map(), phraseDict = /* @__PURE__ */ new Map();
  for (const [k, v] of Object.entries(single)) {
    const cp = Number(k);
    if (!Number.isInteger(cp)) continue;
    const py = Array.isArray(v) ? v[0] : v;
    if (py) singleDict.set(String.fromCodePoint(cp), py);
  }
  for (const [k, v] of Object.entries(phrases)) {
    const list = typeof v === "string" ? v.split(/\s+/).filter(Boolean) : v.map((x) => Array.isArray(x) ? x[0] : x);
    if (list.length) phraseDict.set(k, list);
  }
  function textToPinyin(chars) {
    const out = [], n = chars.length;
    for (let i = 0; i < n; ) {
      const cp = chars[i];
      if (!isCjk(cp)) {
        out.push({ chinese: false, normalized: "", tone: 0 });
        i++;
        continue;
      }
      let hit = null, hitLen = 0;
      for (let len = Math.min(n - i, 8); len >= 2; len--) {
        const p = phraseDict.get(chars.slice(i, i + len).join(""));
        if (p) {
          hit = p;
          hitLen = len;
          break;
        }
      }
      if (hit) {
        for (let j = 0; j < hitLen; j++) {
          const [base2, tone] = j < hit.length ? extractTone(hit[j]) : ["", 5];
          out.push({ chinese: true, normalized: normalizePinyin(base2), tone });
        }
        i += hitLen;
        continue;
      }
      const raw = singleDict.get(cp);
      if (raw !== void 0) {
        const [base2, tone] = extractTone(raw.split(",")[0]);
        out.push({ chinese: true, normalized: normalizePinyin(base2), tone });
      } else out.push({ chinese: false, normalized: "", tone: 0 });
      i++;
    }
    return out;
  }
  function phonemize(text) {
    const chars = Array.from(text), n = chars.length;
    const wordInfo = new Array(n).fill(null);
    for (let i = 0; i < n; ) {
      if (!isCjk(chars[i])) {
        i++;
        continue;
      }
      let j = i;
      while (j < n && isCjk(chars[j])) j++;
      for (let k = i; k < j; k++) wordInfo[k] = [k - i + 1, j - i];
      i = j;
    }
    const cp = textToPinyin(chars);
    for (let i = 0; i < n; ) {
      if (!cp[i].chinese) {
        i++;
        continue;
      }
      let j = i;
      while (j < n && cp[j].chinese) j++;
      if (j - i >= 2) {
        const st = cp.slice(i, j).map((c) => [c.normalized, c.tone]);
        applyToneSandhi(st);
        st.forEach(([, tone], k) => {
          cp[i + k].tone = tone;
        });
      }
      i = j;
    }
    const tokens = [], prosody = [];
    for (let idx = 0; idx < n; idx++) {
      const ch = chars[idx], c = cp[idx];
      if (/[A-Za-z0-9]/.test(ch) && !c.chinese) {
        let j = idx;
        while (j < n && /[A-Za-z0-9]/.test(chars[j])) j++;
        const tok = chars.slice(idx, j).join("");
        if (/[A-Za-z]/.test(tok)) {
          const syl = latinToPinyin(tok);
          syl.forEach((py, k) => {
            const [base2, tone2] = extractTone(py);
            for (const t of pinyinToIpa(normalizePinyin(base2), tone2)) {
              tokens.push(t);
              prosody.push([tone2, k + 1, syl.length]);
            }
          });
          idx = j - 1;
          continue;
        }
      }
      if (!c.chinese) {
        if (Object.hasOwn(ZH_PUNCT_MAP, ch)) {
          tokens.push(ZH_PUNCT_MAP[ch]);
          prosody.push(null);
        } else if (ZH_PUNCT.has(ch)) {
          tokens.push(ch);
          prosody.push(null);
        } else if (isWs(ch)) {
          tokens.push(" ");
          prosody.push([0, 0, 0]);
        } else if (ch >= "0" && ch <= "9" || RE_ALPHA.test(ch)) {
          tokens.push(ch);
          prosody.push([0, 0, 1]);
        }
        continue;
      }
      let normalized = c.normalized;
      const tone = c.tone;
      const erhua = normalized.length > 1 && normalized !== "er" && normalized.endsWith("r");
      if (erhua) normalized = normalized.slice(0, -1);
      const ipa = pinyinToIpa(normalized, tone);
      if (erhua && ipa.length) {
        if (ipa[ipa.length - 1].startsWith("tone")) ipa.splice(ipa.length - 1, 0, "\u025A");
        else ipa.push("\u025A");
      }
      const [pos, len] = wordInfo[idx] || [1, 1];
      for (const t of ipa) {
        tokens.push(t);
        prosody.push([tone, pos, len]);
      }
    }
    return { tokens, prosody };
  }
  function encodeRustLayout(text, phonemeIdMap) {
    const { tokens, prosody } = phonemize(text);
    const pad = phonemeIdMap["_"][0], ids = [phonemeIdMap["^"][0], pad], pros = [[0, 0, 0], [0, 0, 0]];
    let eos = "$";
    tokens.forEach((tok, i) => {
      const mapped = TOKEN2CHAR[tok] ?? tok;
      if (mapped === "^" || mapped === "$" || mapped === "?" || mapped === TOKEN2CHAR["?!"] || mapped === TOKEN2CHAR["?."] || mapped === TOKEN2CHAR["?~"]) {
        if (mapped !== "^") eos = mapped;
        return;
      }
      for (const ch of mapped) {
        const m = phonemeIdMap[ch];
        if (m) for (const id of m) {
          ids.push(id);
          pros.push(prosody[i] || [0, 0, 0]);
        }
      }
      ids.push(pad);
      pros.push([0, 0, 0]);
    });
    ids.push((phonemeIdMap[eos] || phonemeIdMap["$"])[0]);
    pros.push([0, 0, 0]);
    return { ids, pros };
  }
  function encode(text, phonemeIdMap, layout = "wasm") {
    if (layout === "python") {
      const t = phonemize(text);
      return encodeTokens(t.tokens, t.prosody, phonemeIdMap);
    }
    const r = encodeRustLayout(text, phonemeIdMap);
    return toReferenceLayout(r.ids, r.pros);
  }
  return { phonemize, encodeRustLayout, encode };
}
function toReferenceLayout(ids, pros) {
  const oi = [], op = [], unfiltered = [], keptAt = [];
  for (let i = 0; i < ids.length; ) {
    if (ids[i] !== 0) {
      if (i > 0 && i < ids.length - 1) {
        keptAt.push(oi.length);
        unfiltered.push(pros[i]);
      }
      oi.push(ids[i]);
      op.push(pros[i]);
      i++;
      continue;
    }
    let j = i;
    while (j < ids.length && ids[j] === 0) j++;
    oi.push(0);
    op.push([0, 0, 0]);
    for (let k = 1; k < j - i; k++) unfiltered.push([0, 0, 0]);
    i = j;
  }
  keptAt.forEach((pos, k) => {
    op[pos] = unfiltered[k];
  });
  return { ids: oi, pros: op };
}

// node_modules/@internal/read-aloud/backend/piper-plus/en-g2p.js
var ARPA2IPA = {
  AA: "\u0251",
  AE: "\xE6",
  AH: "\u028C",
  AO: "\u0254\u02D0",
  AW: "a\u028A",
  AY: "a\u026A",
  B: "b",
  CH: "t\u0283",
  D: "d",
  DH: "\xF0",
  EH: "\u025B",
  ER: "\u025A",
  EY: "e\u026A",
  F: "f",
  G: "\u0261",
  HH: "h",
  IH: "\u026A",
  IY: "i\u02D0",
  JH: "d\u0292",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  NG: "\u014B",
  OW: "o\u028A",
  OY: "\u0254\u026A",
  P: "p",
  R: "\u0279",
  S: "s",
  SH: "\u0283",
  T: "t",
  TH: "\u03B8",
  UH: "\u028A",
  UW: "u\u02D0",
  V: "v",
  W: "w",
  Y: "j",
  Z: "z",
  ZH: "\u0292"
};
var FUNCTION_WORDS = new Set("a an the i me my mine myself you your yours yourself he him his himself she her hers herself it its itself we us our ours ourselves they them their theirs themselves am is are was were be been being have has had having do does did will would shall should can could may might must at by for from in of on to with about after before between into through under and but or nor so yet if that than when while as because since not no".split(" "));
var PUNCT = /* @__PURE__ */ new Set([",", ".", ";", ":", "!", "?"]);
var VERB_CUES = new Set("to i you we they he she it who will would shall should can could may might must not don't didn't doesn't won't wouldn't can't couldn't let's please".split(" "));
var PAST_CUES = new Set("have has had having was were been be is are am got get 've 'd".split(" "));
var OVERRIDES = { live: "L IH1 V", lives: "L IH1 V Z", lead: "L IY1 D", leads: "L IY1 D Z", wind: "W IH1 N D", winds: "W IH1 N D Z", tear: "T IH1 R", tears: "T IH1 R Z" };
var DIGRAPH_RULES = [
  ["igh", ["AY1"]],
  ["th", ["TH"]],
  ["sh", ["SH"]],
  ["ch", ["CH"]],
  ["ph", ["F"]],
  ["wh", ["W"]],
  ["ck", ["K"]],
  ["ng", ["NG"]],
  ["qu", ["K", "W"]],
  ["oo", ["UW1"]],
  ["ee", ["IY1"]],
  ["ea", ["IY1"]],
  ["ai", ["EY1"]],
  ["ay", ["EY1"]],
  ["oi", ["OY1"]],
  ["oy", ["OY1"]],
  ["ou", ["AW1"]],
  ["ow", ["OW1"]],
  ["aw", ["AO1"]],
  ["au", ["AO1"]]
];
var LETTER_RULES = {
  a: ["AE1"],
  b: ["B"],
  c: ["K"],
  d: ["D"],
  e: ["EH1"],
  f: ["F"],
  g: ["G"],
  h: ["HH"],
  i: ["IH1"],
  j: ["JH"],
  k: ["K"],
  l: ["L"],
  m: ["M"],
  n: ["N"],
  o: ["AA1"],
  p: ["P"],
  q: ["K"],
  r: ["R"],
  s: ["S"],
  t: ["T"],
  u: ["AH1"],
  v: ["V"],
  w: ["W"],
  x: ["K", "S"],
  y: ["Y"],
  z: ["Z"]
};
var ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
var TENS = "  twenty thirty forty fifty sixty seventy eighty ninety".split(" ");
function cardinal(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  if (n < 1e3) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + cardinal(n % 100) : "");
  for (const [v, w] of [[1e9, "billion"], [1e6, "million"], [1e3, "thousand"]]) if (n >= v) return cardinal(Math.floor(n / v)) + " " + w + (n % v ? " " + cardinal(n % v) : "");
  return String(n);
}
var ORD = { one: "first", two: "second", three: "third", five: "fifth", eight: "eighth", nine: "ninth", twelve: "twelfth" };
function ordinal(n) {
  const w = cardinal(n).split(" "), l = w.pop();
  w.push(ORD[l] || (l.endsWith("y") ? l.slice(0, -1) + "ieth" : l + "th"));
  return w.join(" ");
}
function expandNumbers(text) {
  return text.replace(/(\d),(?=\d{3})/g, "$1").replace(/\b(\d+)(st|nd|rd|th)\b/g, (_, d) => ordinal(+d)).replace(/\b(\d+)\.(\d+)\b/g, (_, a, b) => cardinal(+a) + " point " + Array.from(b, (c) => ONES[+c]).join(" ")).replace(/\b\d+\b/g, (d) => {
    const n = +d;
    if (n > 1e3 && n < 3e3 && d.length === 4) {
      if (n === 2e3) return "two thousand";
      if (n > 2e3 && n < 2010) return "two thousand " + ONES[n % 100];
      if (n % 100 === 0) return cardinal(n / 100) + " hundred";
      if (n % 100 < 10) return cardinal(Math.floor(n / 100)) + " oh " + ONES[n % 100];
      return cardinal(Math.floor(n / 100)) + " " + cardinal(n % 100);
    }
    return n < 1e12 ? cardinal(n) : Array.from(d, (c) => ONES[+c]).join(" ");
  });
}
function morphFallback(word, cmu) {
  const n = word.length, tryBase = (b, suf) => cmu[b] ? cmu[b] + " " + suf : null, dbl = (b) => b.length >= 2 && b[b.length - 1] === b[b.length - 2];
  let r;
  if (n > 4 && word.endsWith("ing")) {
    const b = word.slice(0, -3);
    if ((r = tryBase(b, "IH0 NG")) || dbl(b) && (r = tryBase(b.slice(0, -1), "IH0 NG")) || (r = tryBase(b + "e", "IH0 NG"))) return r;
  }
  if (n > 3 && word.endsWith("ed")) {
    const b = word.slice(0, -2);
    if ((r = tryBase(b, "D")) || dbl(b) && (r = tryBase(b.slice(0, -1), "D")) || (r = tryBase(word.slice(0, -1), "D"))) return r;
  }
  if (n > 2 && word.endsWith("s")) {
    if (n > 4 && word.endsWith("ies") && (r = tryBase(word.slice(0, -3) + "y", "Z"))) return r;
    if (n > 3 && word.endsWith("es") && (r = tryBase(word.slice(0, -2), "IH0 Z"))) return r;
    if (r = tryBase(word.slice(0, -1), "Z")) return r;
  }
  if (n > 3 && word.endsWith("er")) {
    const b = word.slice(0, -2);
    if ((r = tryBase(b, "ER0")) || dbl(b) && (r = tryBase(b.slice(0, -1), "ER0"))) return r;
  }
  if (n > 3 && word.endsWith("ly")) {
    if ((r = tryBase(word.slice(0, -2), "L IY0")) || n > 4 && word[n - 3] === "i" && (r = tryBase(word.slice(0, -3) + "y", "L IY0"))) return r;
  }
  if (n > 4 && word.endsWith("est") && (r = tryBase(word.slice(0, -3), "AH0 S T"))) return r;
  return null;
}
function letterRules(word) {
  const out = [];
  for (let i = 0; i < word.length; ) {
    const hit = DIGRAPH_RULES.find(([p]) => word.startsWith(p, i));
    if (hit) {
      out.push(...hit[1]);
      i += hit[0].length;
    } else {
      const a = LETTER_RULES[word[i]];
      if (a) out.push(...a);
      i++;
    }
  }
  return out;
}
var SIBILANT = /* @__PURE__ */ new Set(["S", "Z", "SH", "ZH", "CH", "JH"]);
var VOICELESS = /* @__PURE__ */ new Set(["P", "T", "K", "F", "TH"]);
function createEnglishG2p({ cmudict, homographs = null }) {
  const cmu = cmudict;
  function wordToArpabet(word, prev, next) {
    if (OVERRIDES[word]) return OVERRIDES[word].split(" ");
    if (homographs && homographs[word]) {
      const [p1, p2, pos] = homographs[word], verbish = VERB_CUES.has(prev || "");
      const pick = pos === "V" ? verbish ? p1 : p2 : pos === "VBD" ? PAST_CUES.has(prev || "") ? p2 : p1 : pos === "VBN" ? next === "to" ? p2 : p1 : verbish ? p2 : p1;
      return pick.trim().split(" ");
    }
    if (cmu[word]) return cmu[word].split(" ");
    const m = /^(.+)'(s|ll|d|ve|re)$/.exec(word);
    if (m && cmu[m[1]]) {
      const base2 = cmu[m[1]].split(" "), last = base2[base2.length - 1].replace(/\d/, "");
      const suf = m[2] === "s" ? SIBILANT.has(last) ? ["IH0", "Z"] : VOICELESS.has(last) ? ["S"] : ["Z"] : { ll: ["AH0", "L"], d: ["D"], ve: ["V"], re: ["ER0"] }[m[2]];
      return [...base2, ...suf];
    }
    const bare = word.replace(/'/g, "");
    if (bare !== word && cmu[bare]) return cmu[bare].split(" ");
    const mf = morphFallback(bare, cmu);
    return mf ? mf.split(" ") : letterRules(bare);
  }
  function wordToIpa(arpa) {
    const out = [];
    for (let i = 0; i < arpa.length; i++) {
      const m = /^([A-Z]+)(\d)?$/.exec(arpa[i]);
      if (!m) continue;
      const base2 = m[1], stress = m[2] === void 0 ? -1 : +m[2];
      if (base2 === "AA" && arpa[i + 1] === "R") {
        out.push(["\u0251\u02D0\u0279", stress]);
        i++;
        continue;
      }
      if (base2 === "ER" && stress === 1) {
        out.push(["\u025C\u02D0", stress]);
        continue;
      }
      if (base2 === "AH" && stress === 0) {
        out.push(["\u0259", stress]);
        continue;
      }
      if (ARPA2IPA[base2]) out.push([ARPA2IPA[base2], stress]);
    }
    return out;
  }
  function phonemize(text) {
    let t = expandNumbers(String(text)).normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/[‘’]/g, "'").replace(/[-‐-―]/g, " ");
    t = t.replace(/[^ a-z'.,?!;:]/g, " ").replace(/i\.e\./g, "that is").replace(/e\.g\./g, "for example");
    const raw = t.match(/[a-z']+|[.,?!;:]/g) || [];
    const tokens = [], prosody = [];
    let needSpace = false, prev = "";
    for (let ri = 0; ri < raw.length; ri++) {
      let w = raw[ri];
      if (PUNCT.has(w)) {
        if (w !== ";" && w !== ":") {
          tokens.push(w);
          prosody.push([0, 0, 1]);
        }
        needSpace = true;
        continue;
      }
      w = w.replace(/^'+|'+$/g, "");
      if (!w) continue;
      if (needSpace) {
        tokens.push(" ");
        prosody.push([0, 0, 0]);
      }
      let ipas = wordToIpa(wordToArpabet(w, prev, raw[ri + 1]));
      if (FUNCTION_WORDS.has(w)) ipas = ipas.map(([ipa, s]) => [ipa, s >= 1 ? 0 : s]);
      const count = ipas.reduce((a, [ipa]) => a + Array.from(ipa).length, 0);
      for (const [ipa, s] of ipas) {
        const a2 = s === 1 ? 2 : s === 2 ? 1 : 0;
        if (s === 1) {
          tokens.push("\u02C8");
          prosody.push([0, a2, count]);
        } else if (s === 2) {
          tokens.push("\u02CC");
          prosody.push([0, a2, count]);
        }
        for (const ch of ipa) {
          tokens.push(ch);
          prosody.push([0, a2, count]);
        }
      }
      needSpace = true;
      prev = w;
    }
    return { tokens, prosody };
  }
  return { phonemize, wordToArpabet };
}

// src/singer/worker.ts
var wasmMems = /* @__PURE__ */ new Set();
var captureMem = (imports, instance) => {
  for (const ns2 of Object.values(imports ?? {})) if (ns2 && typeof ns2 === "object") {
    for (const v of Object.values(ns2)) if (v instanceof WebAssembly.Memory) wasmMems.add(v);
  }
  const ex = instance?.exports;
  if (ex) {
    for (const v of Object.values(ex)) if (v instanceof WebAssembly.Memory) wasmMems.add(v);
  }
};
{
  const WA = WebAssembly;
  const inst = WA.instantiate, stream = WA.instantiateStreaming;
  WA.instantiate = async function(src, imports) {
    const r = await inst.call(WebAssembly, src, imports);
    captureMem(imports, r.instance ?? r);
    return r;
  };
  if (stream) WA.instantiateStreaming = async function(src, imports) {
    const r = await stream.call(WebAssembly, src, imports);
    captureMem(imports, r.instance);
    return r;
  };
}
var memNow = () => {
  let wasm = 0;
  for (const m of wasmMems) wasm += m.buffer.byteLength;
  return { wasm, cache: speech.used };
};
var base = new URL("../dev-assets/", import.meta.url);
var u = (p) => new URL(p, base).href;
async function bytes(p) {
  const r = await fetch(u(p));
  if (!r.ok) throw new Error(`${p}: HTTP ${r.status}\uFF08\u5148\u8DD1 scripts/link-dev-assets.sh\uFF1F\uFF09`);
  return new Uint8Array(await r.arrayBuffer());
}
var json = async (p) => JSON.parse(new TextDecoder().decode(await bytes(p)));
var WORLD = new URL("../vendor/world/", import.meta.url);
var bases = ["https://fangzhangmnm.github.io/pwa-models"];
var store = createPackStore({ packs: PACKS });
async function ensurePacks(slugs, what, say) {
  if ((await store.status(slugs)).every((s) => s.ready)) return;
  let last = null;
  for (const base2 of bases) {
    try {
      await store.download(slugs, base2, (p) => say(`\u4E0B\u8F7D${what}\uFF08${(p.total / 1e6).toFixed(0)} MB\uFF0C\u53EA\u4E0B\u8FD9\u4E00\u6B21\uFF09${Math.floor(p.done / p.total * 100)}%`));
      return;
    } catch (e) {
      last = e;
    }
  }
  throw new Error(`${what}\u4E0B\u8F7D\u4E0D\u4E0B\u6765\uFF08\u8BD5\u8FC7 ${bases.join("\u3001")}\uFF09\uFF1A${last?.message ?? last}\u3002\u53EF\u4EE5\u5728\u8BBE\u7F6E\u91CC\u6362\u6A21\u578B\u6765\u6E90\uFF0C\u6216\u4ECE\u672C\u673A\u6587\u4EF6\u5BFC\u5165`);
}
async function packFile(slug, path) {
  const files = PACKS[slug].manifest.files;
  const f = files.find((x) => x.path === path);
  if (!f) throw new Error(`${slug}: \u5305\u91CC\u6CA1\u6709 ${path}`);
  const piece = new Blob(await store.chunks(slug)).slice(f.offset, f.offset + f.bytes);
  if (!path.endsWith(".gz")) return new Uint8Array(await piece.arrayBuffer());
  return new Uint8Array(await new Response(piece.stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
}
var packJson = async (slug, path) => JSON.parse(new TextDecoder().decode(await packFile(slug, path)));
var SR = 22050;
var HOP = 256;
var engine = null;
var speech = new SpeechCache(32e6);
var SPEECH_DB = "moonsinger-speech";
var SPEECH_FORMAT = 1;
var diskBudget = 512e6;
var storeP = null;
var speechStore = () => storeP ??= (diskBudget <= 0 ? Promise.resolve(null) : openSpeechStore(SPEECH_DB, diskBudget)).then((st) => {
  st?.setBudget(diskBudget);
  return st;
}).catch(() => null);
var hex16 = async (bytes2) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes2))].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
var bootMs = {};
async function loadEngine(say) {
  const V = SINGER.voice, JA = SINGER.lang.ja;
  let tk = performance.now();
  const lap = (name) => {
    const t = performance.now();
    bootMs[name] = Math.round(t - tk);
    tk = t;
  };
  await ensurePacks([V, SINGER.runtime, JA], "\u6708\u8BFB", say);
  lap("packs");
  const store2 = await speechStore();
  say("\u52A0\u8F7D piper \u5F15\u64CE");
  const ort = ort_wasm_bundle_min_exports;
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmBinary = await packFile(SINGER.runtime, "ort-wasm-simd-threaded.wasm.gz");
  lap("ortWasm");
  say("\u52A0\u8F7D\u6708\u8BFB\u7684\u6A21\u578B");
  const sess = await ort.InferenceSession.create(await packFile(V, "model.onnx"), { executionProviders: ["wasm"], graphOptimizationLevel: "disabled" });
  ort.env.wasm.wasmBinary = void 0;
  lap("session");
  say("\u52A0\u8F7D\u65E5\u8BED\u524D\u7AEF");
  const Module2 = await ojt_default({ wasmBinary: await packFile(JA, "ja/ojt.wasm.gz"), print: () => {
  }, printErr: () => {
  } });
  mountDictionaryBytes(Module2, { sys: await packFile(JA, "ja/sys.dic.gz"), matrix: await packFile(JA, "ja/matrix.bin.gz"), char: await packFile(JA, "ja/char.bin.gz"), unk: await packFile(JA, "ja/unk.dic.gz") });
  const ja = createJaFrontend(Module2, "/dic", { naniModel: await packJson(JA, "ja/nani-model.json.gz") });
  lap("jaFrontend");
  const config = await packJson(V, "config.json");
  let zh = null;
  const ensureZh = async (say2) => {
    if (zh) return;
    const ZH = SINGER.lang.zh;
    await ensurePacks([ZH], "\u4E2D\u6587\u524D\u7AEF", say2);
    zh = createChineseG2p({ single: await packJson(ZH, "zh/pinyin_single.tone3.json.gz"), phrases: await packJson(ZH, "zh/pinyin_phrases.tone3.json.gz") });
  };
  let en2 = null;
  const ensureEn = async (say2) => {
    if (en2) return;
    const EN = SINGER.lang.en;
    await ensurePacks([EN], "\u82F1\u6587\u8BCD\u5178", say2);
    en2 = makeEnglishFront({ g2p: createEnglishG2p({ cmudict: await packJson(EN, "en/cmudict_data.json.gz"), homographs: await packJson(EN, "en/homographs.json.gz") }), encodeTokens, idMap: config.phoneme_id_map });
  };
  async function run(ids, pros, { noiseScale = 0.667, lengthScale = 1.5, noiseW = 0.5, override = null, lang = "ja", preset = 0 } = {}) {
    const n = ids.length, big = (v) => BigInt(v), lid = config.language_id_map?.[lang] ?? 0;
    const feeds = {
      input: new ort.Tensor("int64", BigInt64Array.from(ids, big), [1, n]),
      input_lengths: new ort.Tensor("int64", BigInt64Array.from([big(n)]), [1]),
      scales: new ort.Tensor("float32", Float32Array.from([noiseScale, lengthScale, noiseW]), [3]),
      lid: new ort.Tensor("int64", BigInt64Array.from([big(lid)]), [1]),
      prosody_features: new ort.Tensor("int64", BigInt64Array.from(pros.flat(), big), [1, n, 3]),
      speaker_embedding: new ort.Tensor("float32", new Float32Array(256), [1, 256]),
      speaker_embedding_mask: new ort.Tensor("int64", BigInt64Array.from([0n]), [1, 1])
    };
    if (sess.inputNames.includes("preset")) feeds.preset = new ort.Tensor("int64", BigInt64Array.from([big(preset)]), [1]);
    if (sess.inputNames.includes("dur_override")) feeds.dur_override = new ort.Tensor("float32", override ? Float32Array.from(override) : new Float32Array(n), [1, n]);
    const r = await sess.run(feeds);
    return { audio: new Float32Array(r.output.data), durations: Float32Array.from(r.durations.data) };
  }
  const piper = speech.wrapPiper({
    SR,
    HOP,
    run,
    phonemize: (text) => {
      const r = ja.phonemize(text);
      return { tokens: r.tokens, prosody: r.prosody, ...encodeTokens(r.tokens, r.prosody, config.phoneme_id_map) };
    },
    phonemizeZh: (text) => {
      const t = zh.phonemize(text), e = zh.encode(text, config.phoneme_id_map);
      return { tokens: t.tokens, prosody: t.prosody, ids: e.ids, pros: e.pros };
    },
    encode: (tokens, prosody) => encodeTokens(tokens, prosody, config.phoneme_id_map),
    phonemizeEnWords: (words) => en2.phonemizeWords(words)
  });
  say("\u52A0\u8F7D WORLD");
  const { default: createWorld } = await import(
    /* @vite-ignore */
    new URL("world.mjs", WORLD).href
  );
  const wasm = await fetch(new URL("world.wasm", WORLD));
  if (!wasm.ok) throw new Error(`WORLD: HTTP ${wasm.status}`);
  const worldBytes = new Uint8Array(await wasm.arrayBuffer());
  if (store2) speech.attachStore(store2, `${PACKS[V].packId.slice(0, 16)}:${PACKS[SINGER.runtime].packId.slice(0, 16)}:w${await hex16(worldBytes)}:v${SPEECH_FORMAT}`);
  const world = speech.wrapWorld(wrapWorld(await createWorld({ wasmBinary: worldBytes })));
  lap("world");
  const hasAtlas = (await fetch(u("atlas/atlas.json"), { method: "HEAD" })).ok;
  const loadAtlas = hasAtlas ? async (id) => {
    const meta = await json(`atlas/${id}.json`);
    const raw = await bytes(`atlas/${id}.f32`);
    return { ...meta, data: new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength >> 2) };
  } : null;
  return { piper, world, loadAtlas, hasAtlas, ensureZh, ensureEn, presetDefault: config.preset_default ?? {} };
}
var cancelled = /* @__PURE__ */ new Set();
self.onmessage = async (ev) => {
  const q2 = ev.data;
  const post = (m, transfer = []) => self.postMessage(m, transfer);
  if (q2.type === "cancel") {
    cancelled.add(q2.id);
    return;
  }
  if (q2.type === "cache") {
    try {
      if (q2.diskBytes !== void 0) {
        diskBudget = q2.diskBytes;
        (await storeP)?.setBudget(diskBudget);
      }
      const st = await speechStore();
      if (q2.op === "clear") {
        await st?.clear();
        speech.clear();
      }
      post({ type: "cache", id: q2.id, disk: st ? await st.info() : null });
    } catch (err) {
      post({ type: "error", id: q2.id, message: err?.message ?? String(err) });
    }
    return;
  }
  if (q2.type === "warm") {
    const say2 = (stage) => post({ type: "progress", id: q2.id, stage });
    try {
      if (q2.models?.length) bases = q2.models;
      if (q2.diskBytes !== void 0) diskBudget = q2.diskBytes;
      if (!engine) engine = loadEngine(say2).catch((e) => {
        engine = null;
        throw e;
      });
      await engine;
      post({ type: "done", id: q2.id, samples: new Float32Array(0), sr: SR, mem: memNow(), ms: { load: 0, sing: 0, ...Object.keys(bootMs).length ? { boot: bootMs } : {} } });
      bootMs = {};
    } catch (err) {
      post({ type: "error", id: q2.id, message: err?.message ?? String(err) });
    }
    return;
  }
  if (q2.type !== "sing") return;
  const say = (stage) => post({ type: "progress", id: q2.id, stage });
  const check = () => {
    if (cancelled.has(q2.id)) {
      cancelled.delete(q2.id);
      throw new Error("cancelled");
    }
  };
  try {
    const t0 = performance.now();
    if (q2.models?.length) bases = q2.models;
    if (q2.cacheBytes !== void 0) speech.setBudget(q2.cacheBytes);
    if (q2.diskBytes !== void 0) {
      diskBudget = q2.diskBytes;
      (await storeP)?.setBudget(diskBudget);
    }
    if (!engine) engine = loadEngine(say).catch((e2) => {
      engine = null;
      throw e2;
    });
    const e = await engine;
    if (q2.lang === "zh") await e.ensureZh(say);
    if (q2.lang === "en") await e.ensureEn(say);
    const t1 = performance.now();
    say("\u6708\u8BFB\u5728\u5531");
    const atlas = q2.atlas ?? "off", breath = q2.breath ?? atlas !== "off";
    const preset = e.presetDefault[q2.lang] ?? 0;
    let runs = 0;
    const piper = { ...e.piper, run: async (ids, pros, o) => {
      check();
      say(runs++ === 0 ? "\u5FF5\uFF081/2\uFF09" : "\u5FF5\uFF082/2\uFF09");
      const r2 = await e.piper.run(ids, pros, o);
      check();
      return r2;
    } };
    const names = { f0: "\u5206\u6790\uFF081/3 \u97F3\u9AD8\uFF09", sp: "\u5206\u6790\uFF082/3 \u8C31\u5305\u7EDC\uFF09", ap: "\u5206\u6790\uFF083/3 \u6C14\u58F0\uFF09", cached: "\u5206\u6790\uFF08\u7F13\u5B58\uFF09" };
    const world = { ...e.world, analyze: (x, fs2, o) => e.world.analyze(x, fs2, o, { stage: (n) => say(names[n] ?? n), check }), synth: (a) => {
      check();
      say("\u5408\u6210");
      return e.world.synth(a);
    } };
    const r = await singCore({ score: q2.score, text: q2.text, tempo: q2.tempo, lang: q2.lang, atlas, breath, preset, piper, world, loadAtlas: e.loadAtlas, opt: q2.opt ?? {}, only: q2.only ?? null });
    check();
    const samples = q2.raw || q2.only ? Float32Array.from(r.y) : r.sung;
    post({ type: "done", id: q2.id, samples, sr: r.SR, mem: memNow(), ms: { load: t1 - t0, sing: performance.now() - t1, ...Object.keys(bootMs).length ? { boot: bootMs } : {} } }, [samples.buffer]);
    bootMs = {};
  } catch (err) {
    cancelled.delete(q2.id);
    engine = engine && await engine.catch(() => null) ? engine : null;
    post({ type: "error", id: q2.id, message: err?.message ?? String(err) });
  }
};
/*! Bundled license information:

@internal/read-aloud/backend/piper-plus/vendor/onnxruntime-web/ort.wasm.bundle.min.mjs:
  (*!
   * ONNX Runtime Web v1.30.0
   * Copyright (c) Microsoft Corporation. All rights reserved.
   * Licensed under the MIT License.
   *)
*/
//# sourceMappingURL=singer-worker-5c0832b1fa6d.mjs.map
