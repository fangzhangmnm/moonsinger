// src/score/paper.ts
var densityOf = (p) => p.density ?? "cozy";

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
function spellMidi(midi, fifths, prefer = fifths < 0 ? -1 : 1) {
  const cands = [];
  for (const step of STEPS) for (let o = Math.floor(midi / 12) - 2; o <= Math.floor(midi / 12); o++) {
    const alter = midi - midiOf({ step, alter: 0, octave: o });
    if (Math.abs(alter) <= 1) cands.push({ step, alter, octave: o });
  }
  return cands.find((p) => p.alter === keyAlter(p.step, fifths)) ?? cands.find((p) => p.alter === prefer) ?? cands.find((p) => p.alter === 0) ?? cands[0];
}
var KEY_LABEL = { [-7]: "C\u266D", [-6]: "G\u266D", [-5]: "D\u266D", [-4]: "A\u266D", [-3]: "E\u266D", [-2]: "B\u266D", [-1]: "F", 0: "C", 1: "G", 2: "D", 3: "A", 4: "E", 5: "B", 6: "F\u266F", 7: "C\u266F" };

// src/score/repeats.ts
function navWhy(song, paper, partId, t) {
  if (!(t.kind === "nav" || t.kind === "bar" && t.repeat)) return null;
  const owner = tempoOwner(song, paper);
  if (owner && owner !== partId) return "\u53CD\u590D / \u8DF3\u8F6C\u53EA\u770B\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4F4D\u6B4C\u624B\u90A3\u4E00\u884C";
  if (t.kind === "nav" && (t.what === "ds" || t.what === "dsFine" || t.what === "dsCoda") && !paper.tracks[partId]?.some((x) => x.kind === "nav" && x.what === "segno")) return "\u8FD9\u5F20\u7EB8\u4E0A\u6CA1\u6709 Segno\uFF0CD.S. \u8DF3\u4E0D\u4E86";
  if (t.kind === "nav" && (t.what === "dcCoda" || t.what === "dsCoda") && !paper.tracks[partId]?.some((x) => x.kind === "nav" && x.what === "toCoda")) return "\u6CA1\u6709 To Coda\uFF1A\u8DF3\u56DE\u6765\u4E4B\u540E\u4E00\u8DEF\u653E\u5230\u7EB8\u5C3E";
  return null;
}

// src/score/song.ts
var TPQ = 1680;
var WHOLE = TPQ * 4;
var LADDER = [TPQ / 8, TPQ / 4, TPQ / 2, TPQ, TPQ * 2, WHOLE];
var MIN_DUR = TPQ / 8 * 4 / 7;
var MAX_DUR = WHOLE * 4;
var NAV_LABEL = { segno: "Segno", coda: "Coda", fine: "Fine", toCoda: "To Coda", dc: "D.C.", dcFine: "D.C. al Fine", dcCoda: "D.C. al Coda", ds: "D.S.", dsFine: "D.S. al Fine", dsCoda: "D.S. al Coda" };
var endingLabel = (nums) => nums && nums.length ? nums.map((n2) => `${n2}.`).join(" ") : "1.";
function swellOf(t) {
  if (t?.kind !== "note" || !t.art) return void 0;
  return t.art.includes("swellUp") ? "<" : t.art.includes("swellDown") ? ">" : t.art.includes("swellBoth") ? "<>" : void 0;
}
var DYNS = ["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"];
var CLEFS = ["G", "G8vb", "G8va", "G15ma", "F", "F8vb"];
var SPLIT_MIDI = 60;
var DEFAULT_KEY = 0;
var DEFAULT_TIME = { beats: 4, beatType: 4 };
var DEFAULT_BPM = 90;
var isTimed = (t) => t.kind === "note" || t.kind === "rest";
var isMark = (t) => t.kind === "key" || t.kind === "time" || t.kind === "tempo";
function headLen(tokens) {
  let n2 = 0;
  while (n2 < tokens.length && isMark(tokens[n2])) n2++;
  return n2;
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
var allPitches = (t) => t.pitch ? [t.pitch, ...t.chord ?? []] : [];
function tempoAt(tokens, i) {
  let v = DEFAULT_BPM;
  for (let j = 0; j < i && j < tokens.length; j++) {
    const t = tokens[j];
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
var artOf = (t) => t.art ?? [];
function rampTarget(tokens, i, end = tokens.length) {
  for (let j = i + 1; j < end; j++) {
    const t = tokens[j];
    if (t.kind === "hairpin") return -1;
    if (t.kind === "dyn") return t.ramp ? j : -1;
  }
  return -1;
}
function rampSource(tokens, j, start = 0) {
  for (let k = j - 1; k >= start; k--) {
    const t = tokens[k];
    if (t.kind === "hairpin") return "hairpin";
    if (t.kind === "dyn") return k;
  }
  return "none";
}
function tempoOwner(song, paper) {
  return song.parts.find((p) => paper.tracks[p.id])?.id ?? null;
}
function sheetEndBpm(song, paper) {
  const o = tempoOwner(song, paper);
  return o ? tempoAt(paper.tracks[o], paper.tracks[o].length) : null;
}
function autoStaffs(tokens, staves) {
  let last = 1;
  return tokens.map((t, i) => {
    if (staves !== 2) return 1;
    if (t.kind === "note") last = midiOf(effectivePitch(tokens, i)) < SPLIT_MIDI ? 2 : 1;
    return last;
  });
}
function staffOfTokens(tokens, staves) {
  const auto = autoStaffs(tokens, staves);
  let last = 1;
  return tokens.map((t, i) => {
    if (staves !== 2) return 1;
    const s = (t.kind === "note" || t.kind === "rest") && t.staff ? t.staff : t.kind === "note" ? auto[i] : last;
    last = s;
    return s;
  });
}
function swingDelta(T, origin, r) {
  const u = ((T - origin) % TPQ + TPQ) % TPQ, h = TPQ / 2;
  return (u <= h ? u * 2 * r : r * TPQ + (u - h) * 2 * (1 - r)) - u;
}
var SWING_GRID = TPQ / 16;
function timeline(tokens, tempoMap) {
  const out = [];
  let t = 0, bar = 0, sec = 0, bpm = DEFAULT_BPM, k = 0, sw = 0, org = 0, bt = DEFAULT_TIME.beatType;
  tokens.forEach((tok, index) => {
    if (tok.kind === "bar") {
      bar = t;
      return;
    }
    if (tok.kind === "tempo") {
      if (!tempoMap) bpm = tok.bpm;
      return;
    }
    if (tok.kind === "time") {
      bt = tok.beatType;
      return;
    }
    if (!isTimed(tok)) return;
    if (tempoMap) {
      while (k < tempoMap.length && tempoMap[k].tick <= t) {
        const e = tempoMap[k];
        bpm = e.bpm;
        if (e.swing !== void 0) {
          sw = e.swing;
          org = e.origin ?? 0;
        }
        k++;
      }
    }
    const len = tok.dur / TPQ * (60 / bpm);
    const swOn = sw !== 0 && (bt === 4 || bt === 2) && tok.dur % SWING_GRID === 0;
    const d0 = swOn ? swingDelta(t, org, sw) : 0, d1 = swOn ? swingDelta(t + tok.dur, org, sw) : 0;
    if (d0 || d1) {
      const spt = 60 / (bpm * TPQ);
      out.push({ index, tok, start: t, inBar: t - bar, bpm, t0: sec + d0 * spt, t1: sec + len + d1 * spt, dw0: d0, dw1: d1 });
    } else out.push({ index, tok, start: t, inBar: t - bar, bpm, t0: sec, t1: sec + len });
    t += tok.dur;
    sec += len;
  });
  return out;
}

// src/score/grooves.gen.ts
var GROOVE_STYLES = [
  {
    "id": "none",
    "name": {
      "zh": "\u65E0",
      "en": "None",
      "ja": "\u306A\u3057"
    },
    "aliases": [
      "\u65E0\u98CE\u683C",
      "Off"
    ],
    "meters": {},
    "phase": null,
    "fallback": "none",
    "follow": {
      "piano": 0,
      "chromatic-percussion": 0,
      "organ": 0,
      "guitar": 0,
      "bass": 0,
      "strings": 0,
      "ensemble": 0,
      "brass": 0,
      "reed": 0,
      "pipe": 0,
      "synth-lead": 0,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0,
      "percussive": 0,
      "sound-effects": 0,
      "percussion": 0,
      "voice": 0
    },
    "swing": null
  },
  {
    "id": "classical",
    "name": {
      "zh": "\u53E4\u5178",
      "en": "Classical",
      "ja": "\u30AF\u30E9\u30B7\u30C3\u30AF"
    },
    "aliases": [
      "Classic",
      "\u53E4\u5178\u6D3E"
    ],
    "meters": {
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "3/4": {
        "grid": 12,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "2/4": {
        "grid": 8,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "2/2": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5,
          0,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5
        ]
      },
      "6/8": {
        "grid": 12,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "12/8": {
        "grid": 24,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.5,
      "chromatic-percussion": 0.6,
      "organ": 0.2,
      "guitar": 0.6,
      "bass": 0.6,
      "strings": 0.5,
      "ensemble": 0.3,
      "brass": 0.5,
      "reed": 0.4,
      "pipe": 0.4,
      "synth-lead": 0.4,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 1,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.3
    },
    "swing": null
  },
  {
    "id": "pop",
    "name": {
      "zh": "\u6D41\u884C",
      "en": "Pop",
      "ja": "\u30DD\u30C3\u30D7\u30B9"
    },
    "aliases": [
      "Rock",
      "\u6447\u6EDA",
      "\u30ED\u30C3\u30AF",
      "R&B",
      "Backbeat",
      "\u53CD\u62CD"
    ],
    "meters": {
      "4/4": {
        "grid": 16,
        "weights": [
          0.5,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25,
          0.5,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25
        ]
      },
      "12/8": {
        "grid": 24,
        "weights": [
          0.5,
          -0.25,
          0,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25,
          0,
          -0.25,
          0.5,
          -0.25,
          0,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25,
          0,
          -0.25
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.6,
      "chromatic-percussion": 0.5,
      "organ": 0.3,
      "guitar": 0.8,
      "bass": 1,
      "strings": 0.2,
      "ensemble": 0.1,
      "brass": 0.6,
      "reed": 0.3,
      "pipe": 0.2,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 0.8,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.3
    },
    "swing": null
  },
  {
    "id": "waltz",
    "name": {
      "zh": "\u534E\u5C14\u5179",
      "en": "Waltz",
      "ja": "\u30EF\u30EB\u30C4"
    },
    "aliases": [
      "\u5706\u821E\u66F2",
      "Valse",
      "Walzer"
    ],
    "meters": {
      "3/4": {
        "grid": 12,
        "weights": [
          1,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.8,
      "chromatic-percussion": 0.6,
      "organ": 0.3,
      "guitar": 0.8,
      "bass": 1,
      "strings": 0.5,
      "ensemble": 0.3,
      "brass": 0.5,
      "reed": 0.3,
      "pipe": 0.3,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 0.8,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.3
    },
    "swing": null
  },
  {
    "id": "march",
    "name": {
      "zh": "\u8FDB\u884C\u66F2",
      "en": "March",
      "ja": "\u30DE\u30FC\u30C1"
    },
    "aliases": [
      "\u884C\u8FDB\u66F2",
      "Marcia",
      "\u884C\u9032\u66F2"
    ],
    "meters": {
      "2/4": {
        "grid": 8,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "2/2": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5,
          0.5,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5
        ]
      },
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "6/8": {
        "grid": 12,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.6,
      "chromatic-percussion": 0.6,
      "organ": 0.3,
      "guitar": 0.6,
      "bass": 1,
      "strings": 0.5,
      "ensemble": 0.3,
      "brass": 0.8,
      "reed": 0.6,
      "pipe": 0.6,
      "synth-lead": 0.4,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 1,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.4
    },
    "swing": null
  },
  {
    "id": "swing",
    "name": {
      "zh": "Swing",
      "en": "Swing",
      "ja": "\u30B9\u30A6\u30A3\u30F3\u30B0"
    },
    "aliases": [
      "\u6447\u6446",
      "\u7235\u58EB",
      "Jazz",
      "\u30B8\u30E3\u30BA"
    ],
    "meters": {
      "4/4": {
        "grid": 16,
        "weights": [
          0.25,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25,
          0.25,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.5,
      "chromatic-percussion": 0.4,
      "organ": 0.3,
      "guitar": 0.6,
      "bass": 0.4,
      "strings": 0.2,
      "ensemble": 0.1,
      "brass": 0.5,
      "reed": 0.5,
      "pipe": 0.3,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.4,
      "percussive": 0.6,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.2
    },
    "swing": {
      "unit": "8th",
      "ratio": 0.667,
      "range": [
        0.5,
        0.75
      ]
    }
  },
  {
    "id": "four-on-the-floor",
    "name": {
      "zh": "\u56DB\u62CD\u5E95\u9F13",
      "en": "Four on the floor",
      "ja": "4\u3064\u6253\u3061"
    },
    "aliases": [
      "\u7535\u5B50",
      "\u8FEA\u65AF\u79D1",
      "Disco",
      "EDM",
      "House",
      "\u30C7\u30A3\u30B9\u30B3"
    ],
    "meters": {
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          0,
          0.5,
          0,
          1,
          0,
          0.5,
          0,
          1,
          0,
          0.5,
          0,
          1,
          0,
          0.5,
          0
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.6,
      "chromatic-percussion": 0.4,
      "organ": 0.3,
      "guitar": 0.6,
      "bass": 0.8,
      "strings": 0.2,
      "ensemble": 0.1,
      "brass": 0.5,
      "reed": 0.3,
      "pipe": 0.2,
      "synth-lead": 0.5,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.4,
      "percussive": 0.8,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.2
    },
    "swing": null
  },
  {
    "id": "bossa-nova",
    "name": {
      "zh": "\u6CE2\u8428",
      "en": "Bossa nova",
      "ja": "\u30DC\u30B5\u30CE\u30F4\u30A1"
    },
    "aliases": [
      "Bossa",
      "\u5DF4\u8428\u8BFA\u74E6",
      "\u30DC\u30B5\u30CE\u30D0",
      "Samba-reggae"
    ],
    "meters": {
      "2/4": {
        "grid": 8,
        "weights": [
          1,
          -0.25,
          -0.25,
          0.75,
          0.5,
          -0.25,
          0.75,
          0.25,
          0.5,
          -0.25,
          0.75,
          0.25,
          0.5,
          0.75,
          -0.25,
          0.25
        ],
        "bars": 2
      },
      "2/2": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.25,
          -0.5,
          0.5,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.25,
          -0.5
        ],
        "bars": 2
      },
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.25,
          -0.5,
          0.5,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.25,
          -0.5
        ],
        "bars": 2
      }
    },
    "phase": "3-2",
    "fallback": "classical",
    "follow": {
      "piano": 0.6,
      "chromatic-percussion": 0.4,
      "organ": 0.3,
      "guitar": 1,
      "bass": 0.6,
      "strings": 0.1,
      "ensemble": 0.1,
      "brass": 0.3,
      "reed": 0.3,
      "pipe": 0.3,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 1,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.1
    },
    "swing": null
  },
  {
    "id": "latin",
    "name": {
      "zh": "\u62C9\u4E01\uFF08\u514B\u62C9\u7EF4\uFF09",
      "en": "Latin (son clave)",
      "ja": "\u30E9\u30C6\u30F3\uFF08\u30BD\u30F3\u30FB\u30AF\u30E9\u30FC\u30D9\uFF09"
    },
    "aliases": [
      "\u62C9\u4E01",
      "Latin",
      "Son",
      "Salsa",
      "\u8428\u5C14\u8428",
      "Mambo",
      "\u66FC\u6CE2",
      "\u30B5\u30EB\u30B5",
      "\u30E9\u30C6\u30F3",
      "Clave",
      "\u514B\u62C9\u7EF4"
    ],
    "meters": {
      "2/4": {
        "grid": 8,
        "weights": [
          1,
          -0.25,
          -0.25,
          0.75,
          0,
          -0.25,
          0.75,
          -0.25,
          0.25,
          -0.25,
          0.75,
          -0.25,
          0.75,
          -0.25,
          -0.25,
          -0.25
        ],
        "bars": 2
      },
      "2/2": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ],
        "bars": 2
      },
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ],
        "bars": 2
      }
    },
    "phase": "3-2",
    "fallback": "classical",
    "follow": {
      "piano": 0.8,
      "chromatic-percussion": 0.5,
      "organ": 0.3,
      "guitar": 0.6,
      "bass": 0.8,
      "strings": 0.3,
      "ensemble": 0.1,
      "brass": 0.6,
      "reed": 0.4,
      "pipe": 0.4,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.6,
      "percussive": 1,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.3
    },
    "swing": null
  }
];

// src/score/groove.ts
var grooveStyle = (id) => GROOVE_STYLES.find((s) => s.id === id) ?? null;
var grooveNameEn = (style) => {
  const s = grooveStyle(style);
  return style === "none" ? "none" : s ? s.name.en : style;
};
var grooveLabel = (t) => `Style: ${grooveNameEn(t.style)}${t.shift && grooveHasPhase(grooveStyle(t.style)) ? " 2-3" : ""}${t.amount !== void 0 && t.amount !== 1 && t.style !== "none" ? ` \xD7${t.amount}` : ""}`;
var grooveHasPhase = (s) => !!s && Object.values(s.meters).some((m) => (m.bars ?? 1) > 1);

// src/singer/packs.gen.ts
var SINGER = { "voice": "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007", "runtime": "runtime-onnxruntime-web-1.30.0-20261001", "lang": { "ja": "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001", "zh": "lang-zh-pinyin-20261001", "en": "lang-en-cmudict-20261001" } };
var PACKS = {
  "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007": { "packId": "56d81c8eb51e693e937397e2557ac3af4dff328e420b761c6e5df8b8b5b80ca6", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 25165824, "name": "chunk-000", "sha256": "269d70de8efb9ef41cdfd5de0a4acd220eb263163c8d1586c2b627c8cb1eaec6" }, { "bytes": 14503410, "name": "chunk-001", "sha256": "56131bbd5133d34a5d7cf4bd668c83a2da1fe8157fbbb849a94c4d1b9569b4ff" }], "createdAt": "2026-10-07", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "piper-plus-voice", "sampleRate": 22050, "speakers": 1 }, "files": [{ "bytes": 39662905, "offset": 0, "path": "model.onnx", "sha256": "d10f3806abeda0ec9ee294d0e39ef5f3884c47b4b09028d23375b71db4107712" }, { "bytes": 6329, "offset": 39662905, "path": "config.json", "sha256": "f6a373726beef08f9094e97f434185b1f9840b76ced0a73281fc40023b02d02d" }], "lang": ["ja", "en", "zh", "es", "fr", "pt"], "license": { "attribution": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\uFF08CV.\u5922\u524D\u9ECE\uFF09https://tyc.rei-yumesaki.net/material/corpus/ \uFF1Bmodel: derivative of ayousanz/piper-plus-tsukuyomi-chan; zh/en language vectors from ayousanz/piper-plus-base (CC-BY-4.0)", "file": "LICENSE.txt", "name": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04\uFF08\u884D\u751F\u6A21\u578B\uFF1Bmodel card: license other / tsukuyomi-chan-corpus\uFF09+ base model CC-BY-4.0", "sha256": "ff76774a797dfedbd00d6b0b167cebf5ceb341d380d865ed4cba495310ace4d9" }, "name": "\u6708\u8BFB\uFF08\u4E2D\u82F1\u589E\u5F3A\uFF0C\u65F6\u957F\u53EF\u63A5\u7BA1\uFF09\u2014 \u3064\u304F\u3088\u307F\u3061\u3083\u3093 piper-plus \u516D\u8BED\u5355\u97F3\u8272\uFF0Cfp16\uFF0C\u4E2D\u82F1\u6539\u8BFB\u5E95\u6A21\u7684\u8BED\u8A00\u5411\u91CF + dur_override \u8F93\u5165\uFF08\u5531\u6B4C\u7528\uFF09", "notes": "Modified model (see LICENSE.txt \xA7[4]). Needs the runtime pack (onnxruntime-web) and one text-frontend pack per language. With dur_override all zeros it reads exactly like voice-tsukuyomi-chan-zhen-6lang-fp16-20261002. The credit block and the four prohibited uses must be shown in the product UI.", "sha256": "466803b3eba2be734c26955c1b701a7e64e566a3e997474c4c744666768e56f9", "slug": "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007", "source": { "converted": "dur_override input on top of voice-tsukuyomi-chan-zhen-6lang-fp16-20261002 (see LICENSE.txt \xA7[4]); all zeros = that pack, sample-identical", "file": "voice-tsukuyomi-chan-zhen-6lang-fp16-20261002/model.onnx @ sha256 ae7ab68a\u2026 + piper-plus/dur-override-exp/make_dur_override.py; config.json = that pack's", "model": "https://huggingface.co/ayousanz/piper-plus-tsukuyomi-chan" }, "task": "tts", "totalBytes": 39669234, "v": 1 } },
  "runtime-onnxruntime-web-1.30.0-20261001": { "packId": "f76668f9383b922aef483f4c0a374fb727b9a9203d230cb2fceabb34fc4459be", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 3687160, "name": "chunk-000", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "onnxruntime-web", "engineConfig": { "kind": "wasm-runtime", "version": "1.30.0" }, "files": [{ "bytes": 3687160, "offset": 0, "path": "ort-wasm-simd-threaded.wasm.gz", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788" }], "lang": [""], "license": { "attribution": "ONNX Runtime (Microsoft)", "file": "LICENSE.txt", "name": "MIT (Microsoft, onnxruntime)", "sha256": "2f07c72751aed99790b8a4869cf2311df85a860b22ded05fa22803587a48922c" }, "name": "onnxruntime-web 1.30.0\uFF08WASM \u63A8\u7406\u8FD0\u884C\u65F6\uFF0C\u5355\u7EBF\u7A0B SIMD\uFF09", "notes": "Engine binary. The matching JS glue (ort.wasm.bundle.min.mjs) is vendored in the app, not in this pack.", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788", "slug": "runtime-onnxruntime-web-1.30.0-20261001", "source": { "converted": "", "file": "dist/ort-wasm-simd-threaded.wasm (unmodified)", "model": "https://www.npmjs.com/package/onnxruntime-web/v/1.30.0" }, "task": "runtime", "totalBytes": 3687160, "v": 1 } },
  "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001": { "packId": "b66632d8ab153a865e2727d745794da248a9c748558920bfd004443cdb9f2d4c", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 24471527, "name": "chunk-000", "sha256": "3e1d7f8ff18204a56d4170da09258cf655bb01bb61114bcd84e8bb2441941b60" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "ja" }, "files": [{ "bytes": 22438129, "offset": 0, "path": "ja/sys.dic.gz", "sha256": "b1804e8c2e6244bb36c7c24eb5af9d4307a80acfb481dcffdc71c7aa60ede055" }, { "bytes": 1867237, "offset": 22438129, "path": "ja/matrix.bin.gz", "sha256": "824f60e50360fb2b186b16d1fe5fd6312919f03c33a73bc86ece37a301b3f0b8" }, { "bytes": 643, "offset": 24305366, "path": "ja/char.bin.gz", "sha256": "335d6f4a6c6cd50ab1d0782dbf6b13ab9e2bed08ed1fd34c97d499d4a05fb665" }, { "bytes": 782, "offset": 24306009, "path": "ja/unk.dic.gz", "sha256": "03721395b79e257fbd2b0e742a4faaed6073ecb79b0cf615fbe352995581b603" }, { "bytes": 147207, "offset": 24306791, "path": "ja/ojt.wasm.gz", "sha256": "97a8738abbdc773b4785b1f6ba849c432a5764cf13c1637df4da630a82f45f8a" }, { "bytes": 17529, "offset": 24453998, "path": "ja/nani-model.json.gz", "sha256": "0427c6cfe53f6c4d771f6c3e50fea06ddeaac96f5e24bdab4f49493395c9630a" }], "lang": ["ja"], "license": { "attribution": "Open JTalk (Nagoya Institute of Technology); MeCab (Taku Kudo, NTT); NAIST Japanese Dictionary; pyopenjtalk / pyopenjtalk-plus (tsukumijima et al.)", "file": "LICENSE.txt", "name": "Modified BSD (Open JTalk) + BSD (MeCab) + BSD-3-Clause style (NAIST-jdic / Open JTalk dictionary) + MIT (pyopenjtalk-plus)", "sha256": "b8dd3d66249df450fc71f3f8f8f29da02b5b01b8b47c03f412af8bc16090c1bb" }, "name": "\u65E5\u8BED\u6587\u672C\u524D\u7AEF\uFF08OpenJTalk + pyopenjtalk-plus \u8BCD\u5178\uFF09", "notes": "ojt.wasm is an engine binary built on 2026-10-01 from the upstream sources (wrapper source: backend/vendor/ojt/ojt_wasm.c). 160 MB initial heap.", "sha256": "3e1d7f8ff18204a56d4170da09258cf655bb01bb61114bcd84e8bb2441941b60", "slug": "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001", "source": { "converted": "", "file": "dictionary: wheel pyopenjtalk/dictionary/; ojt.wasm: built from the sdist (sha256 cdcb0746659857554c6dad23956cad77e21f76c9f3dfa000ea2f8d4f0ba11d99) with Emscripten 6.0.10; nani-model.json: exported from pyopenjtalk/yomi_model/", "model": "https://pypi.org/project/pyopenjtalk-plus/0.4.1.post9/" }, "task": "tts-frontend", "totalBytes": 24471527, "v": 1 } },
  "lang-zh-pinyin-20261001": { "packId": "a84c73d781c805a65b73deb3b39ac9f5fedd15f0cdf3d66b925005c8152af9e3", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 686220, "name": "chunk-000", "sha256": "acad023c61ddf4ed42720c63be1b35737cff734cbf4a6c8ab671b50f7fe39ae1" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "zh" }, "files": [{ "bytes": 186217, "offset": 0, "path": "zh/pinyin_single.tone3.json.gz", "sha256": "ec5c44ed3cd18eda41a04a7831f8d069600cdfb19e55e5b001a42bbdf3a4ad82" }, { "bytes": 500003, "offset": 186217, "path": "zh/pinyin_phrases.tone3.json.gz", "sha256": "43dd0534a63c6bddb4c0f20ee88f19f5933875ff3979acc777652028a66f5ba8" }], "lang": ["zh"], "license": { "attribution": "pypinyin, pinyin-data, phrase-pinyin-data (mozillazg)", "file": "LICENSE.txt", "name": "MIT (pypinyin / pinyin-data / phrase-pinyin-data)", "sha256": "82783f291266e986df7494586db072217e2940227f93208f4f920a53b7a7d91e" }, "name": "\u4E2D\u6587\u62FC\u97F3\u8BCD\u5178\uFF08pypinyin \u6570\u636E\uFF09", "notes": "Tone marks converted to tone-number style (the form the model's phoneme table expects).", "sha256": "acad023c61ddf4ed42720c63be1b35737cff734cbf4a6c8ab671b50f7fe39ae1", "slug": "lang-zh-pinyin-20261001", "source": { "converted": "", "file": "piper-plus 82ee4e7 src/rust/piper-plus-g2p/data/pinyin_{single,phrases}.json, tone marks converted to tone numbers", "model": "https://github.com/ayutaz/piper-plus" }, "task": "tts-frontend", "totalBytes": 686220, "v": 1 } },
  "lang-en-cmudict-20261001": { "packId": "e54e7243870cef39d5015a51fe7fc57917da946908223a3d5baa5cab85956226", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 868090, "name": "chunk-000", "sha256": "21dc3f65ea440c904746ee1ee59a2e24c88aaf0696b1450b0aedcc001aca1926" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "en" }, "files": [{ "bytes": 863232, "offset": 0, "path": "en/cmudict_data.json.gz", "sha256": "3083a0cf26e01398a6877c8834150f03a230baf6965832b00bfae699063208f4" }, { "bytes": 4858, "offset": 863232, "path": "en/homographs.json.gz", "sha256": "2ef14b6d49476790fdb2008150d417cb9069f7dcb74c25706a43bcc3fe5c4187" }], "lang": ["en"], "license": { "attribution": "CMU Pronouncing Dictionary (Carnegie Mellon University); g2p-en (Kyubyong Park & Jongseok Kim)", "file": "LICENSE.txt", "name": "BSD-2-Clause style (CMU Pronouncing Dictionary) + Apache-2.0 (g2p-en homographs)", "sha256": "3d3a944042879fa3c5a25c317ea7e609c0efa7cf0900c0c298ba331953c27039" }, "name": "\u82F1\u8BED\u53D1\u97F3\u8BCD\u5178\uFF08CMUdict + \u540C\u5F62\u5F02\u97F3\u8868\uFF09", "notes": "homographs.json is a format conversion of g2p-en's homographs.en (Apache-2.0 \xA74: modified file notice).", "sha256": "21dc3f65ea440c904746ee1ee59a2e24c88aaf0696b1450b0aedcc001aca1926", "slug": "lang-en-cmudict-20261001", "source": { "converted": "", "file": "cmudict_data.json: piper-plus 82ee4e7 src/rust/piper-plus-g2p/data/; homographs.json: PyPI g2p-en 2.1.0 g2p_en/homographs.en converted to JSON (content unchanged)", "model": "https://github.com/ayutaz/piper-plus" }, "task": "tts-frontend", "totalBytes": 868090, "v": 1 } }
};
var CREDIT = { "credit": "\u672C\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306E\u97F3\u58F0\u5408\u6210\u306B\u306F\u3001\u30D5\u30EA\u30FC\u7D20\u6750\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u300C\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u300D\uFF08\xA9 Rei Yumesaki\uFF09\u304C\u7121\u6599\u516C\u958B\u3057\u3066\u3044\u308B\u97F3\u58F0\u30C7\u30FC\u30BF\u3092\u4F7F\u7528\u3057\u3066\u3044\u307E\u3059\u3002\n\u25A0\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\uFF08CV.\u5922\u524D\u9ECE\uFF09\nhttps://tyc.rei-yumesaki.net/material/corpus/", "terms": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u306E\u58F0\u8CEA\u3092\u4F7F\u7528\u3059\u308B\u5834\u5408\u306F\u3001\u51FA\u529B\u3057\u305F\u97F3\u58F0\u3092\u6B21\u306E\u76EE\u7684\u3067\u4F7F\u7528\u3059\u308B\u3053\u3068\u3092\u7981\u6B62\u3057\u307E\u3059\u3002\n\u3010\u7981\u6B62\u4E8B\u9805\u3011\n\u25A0\u4EBA\u3092\u6279\u5224\u30FB\u653B\u6483\u3059\u308B\u3053\u3068\u3002\uFF08\u300C\u6279\u5224\u30FB\u653B\u6483\u300D\u306E\u5B9A\u7FA9\u306F\u3001\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u30E9\u30A4\u30BB\u30F3\u30B9\u306B\u6E96\u3058\u307E\u3059\uFF09\n\u25A0\u7279\u5B9A\u306E\u653F\u6CBB\u7684\u7ACB\u5834\u30FB\u5B97\u6559\u30FB\u601D\u60F3\u3078\u306E\u8CDB\u540C\u307E\u305F\u306F\u53CD\u5BFE\u3092\u547C\u3073\u304B\u3051\u308B\u3053\u3068\u3002\n\u25A0\u523A\u6FC0\u306E\u5F37\u3044\u8868\u73FE\u3092\u30BE\u30FC\u30CB\u30F3\u30B0\u306A\u3057\u3067\u516C\u958B\u3059\u308B\u3053\u3068\u3002\n\u25A0\u4ED6\u8005\u306B\u5BFE\u3057\u3066\u4E8C\u6B21\u5229\u7528\uFF08\u7D20\u6750\u3068\u3057\u3066\u306E\u5229\u7528\uFF09\u3092\u8A31\u53EF\u3059\u308B\u5F62\u3067\u516C\u958B\u3059\u308B\u3053\u3068\u3002", "termsUrl": "https://tyc.rei-yumesaki.net/material/corpus/", "attribution": ["ayousanz/piper-plus-tsukuyomi-chan \u2014 \u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04 (modified: zh / en language vectors)", "ayousanz/piper-plus-base \u2014 CC-BY-4.0 (zh / en language vectors)", "Open JTalk \xB7 MeCab \xB7 NAIST-jdic \xB7 pyopenjtalk-plus \xB7 CMUdict \xB7 g2p-en \xB7 pypinyin \xB7 ONNX Runtime"] };

// src/format/performance.ts
var TSUKUYOMI_CREDIT = {
  attribution: [CREDIT.credit, ...CREDIT.attribution],
  license: { name: "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04\uFF08\u884D\u751F\u6A21\u578B\uFF09", url: CREDIT.termsUrl, text: CREDIT.terms }
};
var TSUKUYOMI_MODEL = { pack: SINGER.voice, sha256: PACKS[SINGER.voice].packId };

// src/score/perform.ts
function hairpinEnd(tokens, i, bounds) {
  const pe = paperEndOf(i, tokens.length, bounds);
  for (let j = i + 1; j < pe; j++) {
    const k = tokens[j].kind;
    if (k === "dyn" || k === "hairpin") return { kind: k, at: j };
  }
  return { kind: "end", at: pe };
}
var paperEndOf = (i, n2, bounds) => {
  for (const b of bounds ?? []) if (b > i) return b;
  return n2;
};
function dynLevels(tokens, map, table, def, step, bounds) {
  const out = /* @__PURE__ */ new Map(), tl = timeline(tokens, map), at = new Map(tl.map((x) => [x.index, x]));
  const lo = Math.min(...Object.values(table)), hi = Math.max(...Object.values(table));
  const onsetFrom = (j, stop = tokens.length) => {
    for (let k = j; k < stop; k++) {
      const x = at.get(k);
      if (x) return x;
    }
    return null;
  };
  const endBefore = (j) => {
    for (let k = j - 1; k >= 0; k--) {
      const x = at.get(k);
      if (x) return x.t1;
    }
    return 0;
  };
  let cur = def, ramp = null;
  const lvl = (t) => ramp ? ramp.from + (ramp.to - ramp.from) * Math.max(0, Math.min(1, ramp.T1 > ramp.T0 ? (t - ramp.T0) / (ramp.T1 - ramp.T0) : 1)) : cur;
  for (let i = 0; i < tokens.length; i++) {
    if (ramp && i >= ramp.end) {
      cur = ramp.to;
      ramp = null;
    }
    const t = tokens[i];
    if (t.kind === "dyn") {
      if (!ramp) cur = table[t.value];
      const pe = paperEndOf(i, tokens.length, bounds), j = ramp ? -1 : rampTarget(tokens, i, pe), start = j >= 0 ? onsetFrom(i + 1, j) : null;
      if (j >= 0 && start) ramp = { from: cur, to: table[tokens[j].value], T0: start.t0, T1: onsetFrom(j, pe)?.t0 ?? endBefore(j), end: j };
      continue;
    }
    if (t.kind === "hairpin") {
      const e = hairpinEnd(tokens, i, bounds), start = onsetFrom(i + 1, e.at);
      if (!start) continue;
      const endVal = e.kind === "dyn" ? table[tokens[e.at].value] : null, oneStep = Math.max(lo, Math.min(hi, cur + (t.dir === "cresc" ? step : -step)));
      const agrees = endVal !== null && (t.dir === "cresc" ? endVal > cur : endVal < cur);
      const to = agrees ? endVal : oneStep;
      const T1 = e.kind === "end" ? endBefore(e.at) : onsetFrom(e.at, paperEndOf(i, tokens.length, bounds))?.t0 ?? endBefore(e.at);
      ramp = { from: cur, to, T0: start.t0, T1, end: e.at };
      continue;
    }
    const x = at.get(i);
    if (!x) continue;
    out.set(i, { at0: lvl(x.t0), at1: lvl(x.t1) });
    if (t.kind === "note" && !ramp && artOf(t).includes("fp")) cur = table.p;
  }
  return out;
}
function dynOverridden(tokens, bounds) {
  const out = /* @__PURE__ */ new Set();
  const T = { ppp: 0, pp: 1, p: 2, mp: 3, mf: 4, f: 5, ff: 6, fff: 7 };
  const fpNotes = /* @__PURE__ */ new Set();
  tokens.forEach((t, k) => {
    if (t.kind === "note" && artOf(t).includes("fp")) fpNotes.add(k);
  });
  if (!fpNotes.size) return out;
  const levels = (ts) => [...dynLevels(ts, void 0, T, 0, 0.5, bounds)].filter(([k]) => !fpNotes.has(k)).map(([k, l]) => `${k}:${l.at0}:${l.at1}`).join("|");
  let base = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind !== "dyn") continue;
    let j = i + 1;
    while (j < tokens.length && !isTimed(tokens[j])) j++;
    if (!fpNotes.has(j)) continue;
    base ??= levels(tokens);
    const alt = (v) => levels(tokens.map((x, k) => k === i ? { ...t, value: v } : x));
    if (alt(t.value === "pp" ? "ff" : "pp") === base && alt(t.value === "mf" ? "p" : "mf") === base) out.add(i);
  }
  return out;
}

// src/score/arrange.ts
var REP = /^(?:[×xX*])(\d+)/;
function parseArrangement(text, papers) {
  const src = (text ?? "").trim();
  if (!src) return { order: papers.filter((p) => !p.hidden).map((p) => p.id), loop: null, issues: [], explicit: false };
  const issues = [];
  let i = 0;
  const ws = () => {
    while (i < src.length && /[\s、,，→]/.test(src[i])) i++;
  };
  const findPaper = (name) => {
    const byName = papers.find((p) => p.name.trim() === name);
    if (byName) return byName.id;
    if (/^\d+$/.test(name)) {
      const k = Number(name);
      if (k >= 1 && k <= papers.length) return papers[k - 1].id;
    }
    return null;
  };
  const rep = () => {
    const save = i;
    while (src[i] === " ") i++;
    const m = REP.exec(src.slice(i));
    if (!m) {
      i = save;
      return null;
    }
    i += m[0].length;
    return Number(m[1]);
  };
  const seq = (close) => {
    const out = [];
    for (; ; ) {
      ws();
      if (i >= src.length) {
        if (close) issues.push({ at: src.length, len: 0, why: `\u5C11\u4E86\u300C${close}\u300D` });
        return out;
      }
      const c = src[i];
      if (close && c === close) {
        i++;
        return out;
      }
      if (c === ")" || c === "]") {
        issues.push({ at: i, len: 1, why: `\u591A\u4E86\u300C${c}\u300D` });
        i++;
        continue;
      }
      if (c === "[") return out;
      let node;
      const at = i;
      if (c === "(") {
        i++;
        node = { kind: "rep", body: seq(")"), n: 1 };
      } else {
        let name = "";
        while (i < src.length && !/[\s、,，→()[\]×*]/.test(src[i]) && !(/[xX]/.test(src[i]) && /\d/.test(src[i + 1] ?? "") && name)) name += src[i++];
        if (!name) {
          issues.push({ at: i, len: 1, why: `\u770B\u4E0D\u61C2\u300C${src[i]}\u300D` });
          i++;
          continue;
        }
        const paper = findPaper(name);
        if (!paper) {
          issues.push({ at, len: name.length, why: `\u6CA1\u6709\u53EB\u300C${name}\u300D\u7684\u7EB8\uFF08\u5199\u66F2\u6BB5\u540D\uFF0C\u6216\u8005\u7B2C\u51E0\u5F20\u7EB8\u7684\u5E8F\u53F7\uFF09` });
          node = { kind: "rep", body: [], n: 1 };
        } else node = { kind: "ref", paper, text: name, at };
      }
      const n2 = rep();
      if (n2 !== null) {
        if (n2 < 1 || n2 > 99) issues.push({ at, len: i - at, why: "\u91CD\u590D\u6B21\u6570\u8981\u5728 1 \u5230 99 \u4E4B\u95F4" });
        if (n2 >= 1) node = { kind: "rep", body: [node], n: Math.min(99, n2) };
      }
      out.push(node);
    }
  };
  const main = seq(null);
  let loopNodes = null;
  ws();
  if (i < src.length && src[i] === "[") {
    const at = i;
    i++;
    loopNodes = seq("]");
    if (!loopNodes.length) issues.push({ at, len: i - at, why: "\u5FAA\u73AF\u6BB5\u662F\u7A7A\u7684" });
    ws();
    if (i < src.length) {
      issues.push({ at: i, len: src.length - i, why: "\u5FAA\u73AF\u6BB5\u53EA\u80FD\u653E\u5728\u6700\u540E\uFF1A\u540E\u9762\u7684\u6C38\u8FDC\u653E\u4E0D\u5230" });
    }
  }
  const expand = (ns) => ns.flatMap((n2) => n2.kind === "ref" ? [n2.paper] : Array.from({ length: n2.n }, () => expand(n2.body)).flat());
  const loop = loopNodes ? expand(loopNodes) : null;
  return { order: expand(main), loop: loop && loop.length ? loop : null, issues, explicit: true };
}

// src/gm/percussion.gen.ts
var PERC = { "0:119": { "staff": 1, "line": 0, "head": "normal", "stem": "up", "hitSec": 1.389, "kitKey": 57 }, "0:120": { "staff": 1, "line": 0, "head": "normal", "stem": "up", "hitSec": 0.057 }, "0:121": { "staff": 1, "line": 0, "head": "normal", "stem": "up", "hitSec": 0.077 }, "0:122": { "staff": 1, "line": 0, "head": "normal", "stem": "up" }, "0:123": { "staff": 1, "line": 0, "head": "normal", "stem": "up" }, "0:124": { "staff": 1, "line": 0, "head": "normal", "stem": "up" }, "0:125": { "staff": 1, "line": 0, "head": "normal", "stem": "up" }, "0:126": { "staff": 1, "line": 0, "head": "normal", "stem": "up" }, "0:127": { "staff": 1, "line": 0, "head": "normal", "stem": "up", "hitSec": 7e-3 }, "128:0:35": { "staff": 5, "line": 8, "head": "normal", "stem": "down", "hitSec": 0.037 }, "128:0:36": { "staff": 5, "line": 7, "head": "normal", "stem": "down", "hitSec": 7e-3 }, "128:0:37": { "staff": 5, "line": 3, "head": "slashed1", "stem": "up", "hitSec": 2e-3 }, "128:0:38": { "staff": 5, "line": 3, "head": "normal", "stem": "up", "hitSec": 7e-3 }, "128:0:39": { "staff": 5, "line": -2, "head": "plus", "stem": "up", "hitSec": 0.012 }, "128:0:40": { "staff": 5, "line": 3, "head": "slash", "stem": "up", "hitSec": 7e-3 }, "128:0:41": { "staff": 5, "line": 6, "head": "normal", "stem": "up", "hitSec": 0.017 }, "128:0:42": { "staff": 5, "line": -1, "head": "x", "stem": "up", "hitSec": 2e-3 }, "128:0:43": { "staff": 5, "line": 5, "head": "normal", "stem": "up", "hitSec": 0.017 }, "128:0:44": { "staff": 5, "line": 9, "head": "x", "stem": "down", "hitSec": 0.012 }, "128:0:45": { "staff": 5, "line": 4, "head": "normal", "stem": "up", "hitSec": 0.012 }, "128:0:46": { "staff": 5, "line": -1, "head": "circle-x", "stem": "up", "hitSec": 0.022 }, "128:0:47": { "staff": 5, "line": 2, "head": "normal", "stem": "up", "hitSec": 7e-3 }, "128:0:48": { "staff": 5, "line": 1, "head": "normal", "stem": "up", "hitSec": 0.012 }, "128:0:49": { "staff": 5, "line": -2, "head": "x", "stem": "up", "hitSec": 0.057 }, "128:0:50": { "staff": 5, "line": 0, "head": "normal", "stem": "up", "hitSec": 2e-3 }, "128:0:51": { "staff": 5, "line": 0, "head": "x", "stem": "up", "hitSec": 2e-3 }, "128:0:52": { "staff": 5, "line": -3, "head": "normal", "stem": "up", "hitSec": 0.027 }, "128:0:53": { "staff": 5, "line": 0, "head": "diamond", "stem": "up", "hitSec": 2e-3 }, "128:0:54": { "staff": 5, "line": 1, "head": "diamond", "stem": "up", "hitSec": 2e-3 }, "128:0:55": { "staff": 5, "line": -4, "head": "x", "stem": "up", "hitSec": 0.067 }, "128:0:56": { "staff": 5, "line": 1, "head": "triangle-down", "stem": "up", "hitSec": 2e-3 }, "128:0:57": { "staff": 5, "line": -3, "head": "x", "stem": "up", "hitSec": 0.057 }, "128:0:58": { "staff": 5, "line": 0, "head": "ti", "stem": "up", "hitSec": 2e-3 }, "128:0:59": { "staff": 5, "line": 2, "head": "x", "stem": "up", "hitSec": 2e-3 }, "128:0:60": { "staff": 5, "line": -1, "head": "normal", "stem": "up", "hitSec": 2e-3 }, "128:0:61": { "staff": 5, "line": 0, "head": "normal", "stem": "up", "hitSec": 7e-3 }, "128:0:62": { "staff": 5, "line": 1, "head": "custom", "stem": "up", "smufl": "noteheadXOrnate", "hitSec": 0.012 }, "128:0:63": { "staff": 5, "line": 1, "head": "normal", "stem": "up", "hitSec": 0.012 }, "128:0:64": { "staff": 5, "line": 2, "head": "normal", "stem": "up", "hitSec": 0.017 }, "128:0:65": { "staff": 5, "line": 5, "head": "normal", "stem": "up", "hitSec": 0.012 }, "128:0:66": { "staff": 5, "line": 7, "head": "normal", "stem": "up", "hitSec": 2e-3 }, "128:0:67": { "staff": 5, "line": -2, "head": "triangle-down", "stem": "up", "hitSec": 2e-3 }, "128:0:68": { "staff": 5, "line": -1, "head": "triangle-down", "stem": "up", "hitSec": 7e-3 }, "128:0:69": { "staff": 5, "line": 2, "head": "diamond", "stem": "up", "hitSec": 0.032 }, "128:0:70": { "staff": 5, "line": 4, "head": "diamond", "stem": "up", "hitSec": 0.032 }, "128:0:71": { "staff": 5, "line": -3, "head": "x", "stem": "up", "hitSec": 0.072 }, "128:0:72": { "staff": 5, "line": -3, "head": "ti", "stem": "up", "hitSec": 0.022 }, "128:0:73": { "staff": 5, "line": -1, "head": "x", "stem": "up", "hitSec": 0.012 }, "128:0:74": { "staff": 5, "line": -1, "head": "slashed1", "stem": "up", "hitSec": 0.222 }, "128:0:75": { "staff": 5, "line": 0, "head": "la", "stem": "up", "hitSec": 2e-3 }, "128:0:76": { "staff": 5, "line": 5, "head": "la", "stem": "up", "hitSec": 2e-3 }, "128:0:77": { "staff": 5, "line": 7, "head": "la", "stem": "up", "hitSec": 2e-3 }, "128:0:78": { "staff": 5, "line": 8, "head": "x", "stem": "up", "hitSec": 0.062 }, "128:0:79": { "staff": 5, "line": 8, "head": "slashed2", "stem": "up", "hitSec": 0.042 }, "128:0:80": { "staff": 5, "line": 0, "head": "x", "stem": "up", "hitSec": 2e-3 }, "128:0:81": { "staff": 5, "line": 0, "head": "triangle-up", "stem": "up", "hitSec": 0.022 }, "128:0:27": { "staff": 5, "line": 8, "head": "slash", "stem": "up", "hitSec": 0.012 }, "128:0:28": { "staff": 5, "line": 4, "head": "custom", "stem": "up", "smufl": "noteheadSlashX", "hitSec": 0.012 }, "128:0:29": { "staff": 5, "line": 6, "head": "slash", "stem": "up", "hitSec": 0.092 }, "128:0:30": { "staff": 5, "line": 6, "head": "slash", "stem": "up", "hitSec": 0.077 }, "128:0:31": { "staff": 5, "line": -1, "head": "plus", "stem": "up", "hitSec": 7e-3 }, "128:0:32": { "staff": 5, "line": 10, "head": "plus", "stem": "up", "hitSec": 2e-3 }, "128:0:33": { "staff": 5, "line": 10, "head": "x", "stem": "up", "hitSec": 2e-3 }, "128:0:34": { "staff": 5, "line": 10, "head": "triangle-up", "stem": "up", "hitSec": 2e-3 }, "128:0:82": { "staff": 5, "line": 5, "head": "diamond", "stem": "up", "hitSec": 0.027 }, "128:0:83": { "staff": 5, "line": 3, "head": "triangle-down", "stem": "up", "hitSec": 0.072 }, "128:0:84": { "staff": 5, "line": 2, "head": "ti", "stem": "up" }, "128:0:85": { "staff": 5, "line": 2, "head": "la", "stem": "up", "hitSec": 2e-3 }, "128:0:86": { "staff": 5, "line": 4, "head": "custom", "stem": "up", "smufl": "noteheadSlashX", "hitSec": 7e-3 }, "128:0:87": { "staff": 5, "line": 4, "head": "slash", "stem": "up", "hitSec": 0.027 }, "0:112": { "staff": 1, "line": 0, "head": "normal", "stem": "up", "hitSec": 2e-3, "kitKey": 84, "from": "Q1621499" }, "0:113": { "staff": 1, "line": -1, "head": "normal", "stem": "up", "hitSec": 7e-3, "kitKey": 67, "from": "Q395212" }, "0:115": { "staff": 1, "line": -1, "head": "normal", "stem": "up", "hitSec": 2e-3, "kitKey": 76, "from": "Q957212" }, "0:116": { "staff": 1, "line": 0, "head": "normal", "stem": "up", "hitSec": 0.027, "kitKey": 87, "from": "Q221769" }, "0:117": { "staff": 5, "line": 5, "head": "normal", "stem": "up", "hitSec": 7e-3, "kitKey": 45, "from": "Q849349" }, "0:118": { "staff": 5, "line": 0, "head": "normal", "stem": "up", "hitSec": 7e-3, "from": "Q1327480" } };

// src/gm/percussion.ts
function percOf(bank, program, note) {
  if (bank === 128) return note === void 0 ? null : PERC[`128:0:${note}`] ?? null;
  return (note !== void 0 ? PERC[`${bank}:${program}:${note}`] : void 0) ?? PERC[`${bank}:${program}`] ?? null;
}

// src/score/lyrics.ts
var MELISMA_MARK = "\u30FC";
var ELISION = "\u203F";
var CJK_CHAR = /[぀-ヿ\p{Script=Han}]/u;
var lyricShow = (s) => s.split(ELISION).reduce((a, b) => !a ? b : CJK_CHAR.test(a.slice(-1)) && CJK_CHAR.test(b.slice(0, 1)) ? a + b : `${a}${ELISION}${b}`, "");
var SMALL = /* @__PURE__ */ new Set([..."\u3083\u3085\u3087\u3041\u3043\u3045\u3047\u3049\u308E\u3095\u3096\u30E3\u30E5\u30E7\u30A1\u30A3\u30A5\u30A7\u30A9\u30EE\u30F5\u30F6", "\u3063", "\u30C3"]);

// src/render/smufl.ts
var GLYPH = {
  metNoteQuarterUp: "\uECA5",
  // 速度记号里的四分音符（metronome mark）
  gClef: "\uE050",
  fClef: "\uE062",
  // 低音谱号（2026-10-08）
  gClef8vb: "\uE052",
  gClef8va: "\uE053",
  gClef15ma: "\uE054",
  fClef8vb: "\uE064",
  // 八度谱号（2026-10-10 v0.9.28：吉他 / 男高音 8vb、短笛 8va、钟琴 15ma、贝斯 8vb）
  ottavaAlta: "\uE511",
  ottavaBassa: "\uE512",
  quindicesimaAlta: "\uE515",
  // 八度线开头的字：8va / 8vb / 15ma
  noteheadWhole: "\uE0A2",
  noteheadHalf: "\uE0A3",
  noteheadBlack: "\uE0A4",
  noteheadXWhole: "\uE0A7",
  noteheadXHalf: "\uE0A8",
  noteheadXBlack: "\uE0A9",
  // × 符头（2026-10-08：演奏者固定敲一个键的声部；user「披露就用x」）
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
var timeSigDigits = (n2) => [...String(n2)].map((d) => String.fromCodePoint(57472 + Number(d))).join("");
var PERC_CLEF = "\uE069";
var PERC_HEAD = {
  normal: { ch: ["\uE0A4", "\uE0A3", "\uE0A2"], w: [1.18, 1.18, 1.688] },
  x: { ch: ["\uE0A9", "\uE0A8", "\uE0A7"], w: [1.16, 1.34, 1.51] },
  "circle-x": { ch: ["\uE0B3", "\uE0B2", "\uE0B1"], w: [0.996, 1, 0.996] },
  slash: { ch: ["\uE101", "\uE103", "\uE102"], w: [2.124, 3.12, 3.92] },
  slashed1: { ch: ["\uE0CF", "\uE0D1", "\uE0D3"], w: [1.18, 1.168, 1.672] },
  slashed2: { ch: ["\uE0D0", "\uE0D2", "\uE0D4"], w: [1.18, 1.172, 1.672] },
  diamond: { ch: ["\uE0DB", "\uE0D9", "\uE0D8"], w: [0.98, 0.98, 1.664] },
  "triangle-up": { ch: ["\uE0BE", "\uE0BC", "\uE0BB"], w: [1.172, 1.14, 1.276] },
  "triangle-down": { ch: ["\uE0C7", "\uE0C5", "\uE0C4"], w: [1.168, 1.14, 1.276] },
  plus: { ch: ["\uE0AF", "\uE0AE", "\uE0AD"], w: [0.996, 1.044, 1.14] },
  la: { ch: ["\uE0B9", "\uE0B8", "\uE0B8"], w: [1.252, 1.252, 1.252] },
  ti: { ch: ["\uE0CD", "\uE0CC", "\uE0CC"], w: [1.112, 1.112, 1.112] }
};
var PERC_SMUFL = {
  noteheadXOrnate: { ch: ["\uE0AA", "\uE0AA", "\uE0AA"], w: [0.992, 0.992, 0.992] },
  noteheadSlashX: { ch: ["\uE106", "\uE106", "\uE106"], w: [2.124, 2.124, 2.124] }
};
var W = {
  noteheadBlack: 1.18,
  noteheadHalf: 1.18,
  noteheadWhole: 1.688,
  noteheadXBlack: 1.16,
  noteheadXHalf: 1.34,
  noteheadXWhole: 1.51,
  // 2026-10-08 在浏览器里用 measureText 量的 advance（400px Bravura；黑符头同法量得 1.18 = 上面那行，方法对得上）
  gClef: 2.684,
  fClef: 2.736,
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

// src/score/clef.ts
var CLEF_SHIFT = { G: 0, G8vb: 7, G8va: -7, G15ma: -14, F: 12, F8vb: 19 };
var isFClef = (c) => c === "F" || c === "F8vb";
var baseClef = (c) => isFClef(c) ? "F" : "G";
var ottavaShift = (s) => -7 * s;
var BOTTOM = 30;
var TOP = 38;
var ledgerLines = (pos) => pos > TOP ? Math.floor((pos - TOP) / 2) : pos < BOTTOM ? Math.floor((BOTTOM - pos) / 2) : 0;
var ledgerCost = (pos) => {
  const l = ledgerLines(pos);
  return l * (l + 1) / 2;
};
var BIAS = { G: 0, F: 0.1, G8vb: 1, G8va: 1, G15ma: 1.5, F8vb: 1.5 };
function autoClef(positions, prev = null) {
  if (!positions.length) return prev ?? "G";
  return pickClef((c) => positions.reduce((a, x) => a + ledgerCost(x + CLEF_SHIFT[c]) + BIAS[c], 0), positions.length, prev);
}
function pickClef(cost, n2, prev) {
  let best = "G", bc = Infinity;
  for (const c of CLEFS) {
    const v = cost(c);
    if (v < bc - 1e-9) {
      bc = v;
      best = c;
    }
  }
  if (prev && cost(prev) <= bc + Math.max(1, 0.1 * n2)) return prev;
  return best;
}
var RUN_COST = 3;
function startClef(tokens, partClef, prev, autoOtt = false) {
  if (partClef) return partClef;
  if (autoOtt) {
    const cut = tokens.findIndex((t) => t.kind === "clef"), seg = cut < 0 ? tokens : tokens.slice(0, cut);
    let n2 = 0;
    for (const t of seg) if (t.kind === "note" && t.pitch) n2 += 1 + (t.chord?.length ?? 0);
    if (!n2) return prev ?? "G";
    return pickClef((c) => {
      const ao = autoOttava(seg, displayStates(seg, c));
      let v = ao.runs.length * RUN_COST;
      seg.forEach((t, i) => {
        if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) v += ledgerCost(diatonicIndex(p) + CLEF_SHIFT[c] + ottavaShift(ao.ott[i] ?? 0)) + BIAS[c];
      });
      return v;
    }, n2, prev);
  }
  const pos = [];
  let o = 0;
  for (const t of tokens) {
    if (t.kind === "clef") break;
    if (t.kind === "ottava") {
      o = t.shift;
      continue;
    }
    if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) pos.push(diatonicIndex(p) + ottavaShift(o));
  }
  return autoClef(pos, prev);
}
var GRAND_BIAS = 0.5;
function wantsGrand(tokens) {
  const pos = [];
  for (const t of tokens) if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) pos.push(diatonicIndex(p));
  if (pos.length < 2) return false;
  const c = startClef(tokens, void 0, null, true), ao = autoOttava(tokens, displayStates(tokens, c));
  let single = ao.runs.length * RUN_COST;
  tokens.forEach((t, i) => {
    if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) single += ledgerCost(diatonicIndex(p) + CLEF_SHIFT[c] + ottavaShift(ao.ott[i] ?? 0));
  });
  const grand = pos.reduce((a, d) => a + ledgerCost(d >= MIDDLE_C ? d : d + CLEF_SHIFT.F), 0) + GRAND_BIAS * pos.length;
  return grand < single;
}
var MIDDLE_C = 28;
function displayStates(tokens, start) {
  const clef = new Array(tokens.length), ott = new Array(tokens.length);
  let c = start, o = 0;
  tokens.forEach((t, i) => {
    if (t.kind === "clef") c = t.clef;
    else if (t.kind === "ottava") o = t.shift;
    clef[i] = c;
    ott[i] = o;
  });
  return { clef, ott };
}
function autoOttava(tokens, ds) {
  const ott = ds.ott.slice(), auto = new Array(tokens.length).fill(false), runs = [];
  const items = [];
  tokens.forEach((t, i) => {
    if (!isTimed(t)) return;
    const manual = (ds.ott[i] ?? 0) !== 0;
    if (t.kind !== "note" || !t.pitch) {
      items.push({ i, note: false, hi: NaN, lo: NaN, dir: 0, manual });
      return;
    }
    const pos = [t.pitch, ...t.chord ?? []].map((p) => diatonicIndex(p) + CLEF_SHIFT[ds.clef[i]]);
    const hi = Math.max(...pos), lo = Math.min(...pos);
    const up = hi > TOP && ledgerLines(hi) >= 3, down = lo < BOTTOM && ledgerLines(lo) >= 3;
    items.push({ i, note: true, hi, lo, dir: up && !down ? 1 : down && !up ? -1 : 0, manual });
  });
  const notes = items.filter((x) => x.note).length, cands = items.filter((x) => x.dir && !x.manual).length;
  if (cands < 2 || cands * 3 > notes) return { ott, auto, runs };
  const okGap = (x, dir) => !x.manual && (!x.note || (dir === 1 ? !(x.lo - 7 < BOTTOM && ledgerLines(x.lo - 7) >= 3) : !(x.hi + 7 > TOP && ledgerLines(x.hi + 7) >= 3)));
  for (let k = 0; k < items.length; ) {
    const it = items[k];
    if (!it.dir || it.manual) {
      k++;
      continue;
    }
    const dir = it.dir;
    let e = k, n2 = 1;
    for (; ; ) {
      const a = items[e + 1], b = items[e + 2];
      if (a && a.dir === dir && !a.manual) {
        e += 1;
        n2++;
        continue;
      }
      if (a && b && b.dir === dir && !b.manual && okGap(a, dir)) {
        e += 2;
        n2++;
        continue;
      }
      break;
    }
    if (n2 >= 2) {
      const span = items.slice(k, e + 1).filter((x) => x.note);
      const shift = dir === -1 ? -1 : span.some((x) => x.hi - 7 > TOP && ledgerLines(x.hi - 7) >= 3) ? 2 : 1;
      const from = items[k].i, to = items[e].i;
      for (let j = from; j <= to; j++) {
        ott[j] = shift;
        auto[j] = true;
      }
      runs.push({ from, to, shift });
    }
    k = e + 1;
  }
  return { ott, auto, runs };
}
function resolveSongClefs(song) {
  const out = /* @__PURE__ */ new Map(), last = /* @__PURE__ */ new Map();
  for (const paper of song.papers) {
    const m = /* @__PURE__ */ new Map();
    out.set(paper.id, m);
    for (const part of song.parts) {
      const toks = paper.tracks[part.id];
      if (!toks || part.staves === 2) continue;
      const c = startClef(toks, part.clef, last.get(part.id) ?? null, part.autoOttava !== false);
      m.set(part.id, c);
      const ds = displayStates(toks, c);
      last.set(part.id, ds.clef.length ? ds.clef[ds.clef.length - 1] : c);
    }
  }
  return out;
}

// src/score/merge.ts
var HEAD_ARTS = ["ghost", "whisper"];
var SWITCH = 5;
function planHands(tracks, wantsGrand2, homes, force = false) {
  const host = tracks[0] ?? [], time = host.find((t) => t.kind === "time");
  const bar = (time?.beats ?? 4) * WHOLE / (time?.beatType ?? 4), meas = (t) => Math.floor(t / bar + 1e-9);
  const med = (xs) => {
    const a = [...xs].sort((x, y) => x - y);
    return a.length ? a[a.length >> 1] : NaN;
  };
  const per = tracks.map((toks) => {
    const notes = [];
    let t = 0;
    for (let i = headLen(toks); i < toks.length; i++) {
      const k = toks[i];
      if (!isTimed(k)) continue;
      if (k.kind === "note" && k.pitch) notes.push({ t, m: [k.pitch, ...k.chord ?? []].map(midiOf) });
      t += k.dur;
    }
    return notes;
  });
  const mid = per.map((ns) => med(ns.flatMap((n2) => n2.m))), home = mid.map((x, i) => homes?.[i] ?? (Number.isNaN(x) || x >= 60 ? 0 : 1));
  const present = mid.map((x, i) => Number.isNaN(x) ? -1 : i).filter((i) => i >= 0);
  if (force && present.length >= 2 && new Set(present.map((i) => home[i])).size < 2) {
    const order = [...present].sort((x, y) => mid[y] - mid[x]);
    let cut = 1, g = -1;
    for (let k = 0; k + 1 < order.length; k++) {
      const d = mid[order[k]] - mid[order[k + 1]];
      if (d > g) {
        g = d;
        cut = k + 1;
      }
    }
    order.forEach((m, k) => {
      home[m] = k < cut ? 0 : 1;
    });
  }
  const grand = force || new Set(present.map((i) => home[i])).size > 1 && wantsGrand2(mergeTracks(tracks));
  const staffCache = /* @__PURE__ */ new Map(), staffOf = (m, ms) => {
    if (!grand) return 0;
    const key = `${m}:${ms}`, hit = staffCache.get(key);
    if (hit !== void 0) return hit;
    const mm = med(per[m].filter((n2) => meas(n2.t) === ms).flatMap((n2) => n2.m));
    const st = Number.isNaN(mm) ? home[m] : home[m] === 1 && mm >= 60 + SWITCH ? 0 : home[m] === 0 && mm < 60 - SWITCH ? 1 : home[m];
    staffCache.set(key, st);
    return st;
  };
  const voiceCache = /* @__PURE__ */ new Map(), voiceOf = (m, ms) => {
    const key = `${m}:${ms}`, hit = voiceCache.get(key);
    if (hit !== void 0) return hit;
    const s = staffOf(m, ms), mates = present.filter((j) => staffOf(j, ms) === s && per[j].some((n2) => meas(n2.t) === ms)).sort((x, y) => mid[y] - mid[x]);
    let cut = mates.length;
    if (mates.length >= 2) {
      let g = -1;
      for (let i = 0; i + 1 < mates.length; i++) {
        const d = mid[mates[i]] - mid[mates[i + 1]];
        if (d > g) {
          g = d;
          cut = i + 1;
        }
      }
    }
    for (let i = 0; i < mates.length; i++) voiceCache.set(`${mates[i]}:${ms}`, i < cut ? 1 : 2);
    return voiceCache.get(key) ?? 1;
  };
  return { grand, pick: (staff, voice) => (m, t) => staffOf(m, meas(t)) === staff && voiceOf(m, meas(t)) === voice };
}
function mergeTracks(tracks, opt = {}) {
  const { keyOf, pick } = opt, barsOnly = opt.marks === "bars";
  const host = tracks[0] ?? [], head = host.slice(0, headLen(host));
  const evs = [], marks = [];
  let end = 0;
  tracks.forEach((toks, m) => {
    let t = 0;
    for (let i = headLen(toks); i < toks.length; i++) {
      const k = toks[i];
      if (isTimed(k)) {
        if (k.kind === "note" && k.pitch) {
          const ps = [k.pitch, ...k.chord ?? []].map((p) => keyOf ? keyOf(m, p) : p);
          if (!pick || pick(m, t)) evs.push({ t0: t, t1: t + k.dur, ps, host: m === 0 && !barsOnly ? k : null, heads: (k.art ?? []).filter((a) => HEAD_ARTS.includes(a)) });
        }
        t += k.dur;
      } else if (m === 0 && k.kind !== "clef" && k.kind !== "ottava" && (!barsOnly || k.kind === "bar" || k.kind === "key" || k.kind === "time")) marks.push({ t, tok: k });
    }
    end = Math.max(end, t);
  });
  const cuts = [.../* @__PURE__ */ new Set([0, end, ...evs.flatMap((e) => [e.t0, e.t1]), ...marks.map((x) => x.t)])].filter((x) => x <= end).sort((a, b) => a - b);
  const out = [...head];
  let id = -1e3, prevChord = false;
  for (let i = 0; i < cuts.length; i++) {
    const a = cuts[i], b = cuts[i + 1];
    for (const x of marks) if (x.t === a) out.push(x.tok);
    if (b === void 0) break;
    const on = evs.filter((e) => e.t0 <= a && e.t1 > a);
    if (!on.length) {
      const last = out[out.length - 1];
      if (last && last.kind === "rest" && last.id <= -1e3) out[out.length - 1] = { ...last, dur: last.dur + (b - a) };
      else out.push({ kind: "rest", id: id--, dur: b - a });
      prevChord = false;
      continue;
    }
    const freshK = /* @__PURE__ */ new Set(), seen = /* @__PURE__ */ new Set();
    for (const e of on) if (e.t0 === a) for (const p of e.ps) freshK.add(midiOf(p));
    const all = on.flatMap((e) => e.ps).filter((p) => {
      const k = midiOf(p);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((x, y) => midiOf(y) - midiOf(x));
    const ps = all;
    const fresh = ps.some((p) => freshK.has(midiOf(p))), h = on.find((e) => e.host && e.t0 === a)?.host ?? null;
    const src = on.filter((e) => e.t0 === a).length ? on.filter((e) => e.t0 === a) : on, art = HEAD_ARTS.filter((x) => src.every((e) => e.heads.includes(x)));
    out.push({ kind: "note", id: id--, pitch: ps[0], ...ps.length > 1 ? { chord: ps.slice(1) } : {}, dur: b - a, lyric: h?.lyric ?? null, ...h?.hyph ? { hyph: true } : {}, ...!fresh && prevChord ? { tie: true } : {}, ...art.length ? { art } : {} });
    prevChord = true;
  }
  return out;
}

// src/render/engrave.ts
var LYRIC_EM = 1.6;
var LYRIC_ROW2 = LYRIC_EM * 1.2;
function fitLyrics(items, gap = 0.5) {
  const out = items.map(() => ({ dx: 0, scale: 1, row: 0, tight: false })), scale = items.map(() => 1);
  const g = (i) => gap + (items[i].hy ? 0.9 : 0);
  const place = (idx) => {
    const pos = idx.map((i) => items[i].cx), half = idx.map((i) => items[i].w * scale[i] / 2), cap = idx.map((i) => Math.max(0.8, 0.45 * items[i].w));
    for (let pass = 0; pass < 4; pass++) {
      for (let k = 1; k < idx.length; k++) {
        const need = pos[k - 1] + half[k - 1] + g(idx[k - 1]) + half[k];
        if (pos[k] < need) pos[k] = Math.min(need, items[idx[k]].cx + cap[k]);
      }
      for (let k = idx.length - 2; k >= 0; k--) {
        const need = pos[k + 1] - half[k + 1] - g(idx[k]) - half[k];
        if (pos[k] > need) pos[k] = Math.max(need, items[idx[k]].cx - cap[k]);
      }
    }
    const bad = /* @__PURE__ */ new Set();
    for (let k = 1; k < idx.length; k++) if (pos[k] - half[k] < pos[k - 1] + half[k - 1] + g(idx[k - 1]) - 1e-6) {
      bad.add(idx[k]);
      bad.add(idx[k - 1]);
    }
    return { pos, bad };
  };
  const all = items.map((_, i) => i);
  let r = place(all);
  if (r.bad.size) {
    for (const i of r.bad) scale[i] = 0.8;
    r = place(all);
  }
  if (!r.bad.size) {
    all.forEach((i, k) => {
      out[i] = { dx: r.pos[k] - items[i].cx, scale: scale[i], row: 0, tight: false };
    });
    return out;
  }
  const row = items.map(() => 0);
  let flip = 0;
  for (let i = 0; i < items.length; i++) {
    if (r.bad.has(i)) row[i] = flip++ % 2;
    else flip = 0;
  }
  for (const rr of [0, 1]) {
    const idx = all.filter((i) => row[i] === rr), res = place(idx);
    idx.forEach((i, k) => {
      out[i] = { dx: res.pos[k] - items[i].cx, scale: scale[i], row: rr, tight: res.bad.has(i) };
    });
  }
  return out;
}
var SCROLL_TAIL = 6;
var ABBR_REF = "Vln.Vc.";
var NAME_MAX = 6.5;
var TEMPO_EM = 1.35;
function stripLayoutFns(l) {
  const { lyricY: _a, yOf: _b, dOf: _c, ...d } = l;
  return d;
}
var SQUEEZE = 0.15;
var MARGIN = 1.2;
var BAR_W = 1.6;
var TITLE_H = 5.4;
var PAPER_H = 3.4;
var PAPER_GAP = 1.6;
var STUB_H = 2.4;
var CTL_H = 3;
var CTL_GLYPH = 2;
var CTL_TEXT = 1.4;
var SPACING = {
  cozy: { staffAbove: 4.6, rowH: 13.4, rowHNoLyric: 11, graveUpper: 9.4, lyricBelow: 4.4, sysGap: 0.4 },
  // graveUpper = 大谱表上面那条（没歌词、紧挨着下面那条）
  compact: { staffAbove: 4, rowH: 12.2, rowHNoLyric: 9.6, graveUpper: 8.6, lyricBelow: 4, sysGap: 0 }
};
var TOP_LINE = 38;
var MID_LINE = 34;
var BOTTOM_LINE = 30;
var ART_GLYPH = {
  stress: { above: "\uE4B6", below: "\uE4B7", w: 1, h: 1 },
  // 次重音（2026-10-08 深夜；宽高 = canvas 量的 Bravura 墨迹）
  unstress: { above: "\uE4B8", below: "\uE4B9", w: 1.6, h: 0.9 },
  // 弱化
  accent: { above: "\uE4A0", below: "\uE4A1", w: 1.36, h: 0.99 },
  marcato: { above: "\uE4AC", below: "\uE4AD", w: 1, h: 1.08 },
  // 强音（2026-10-08；宽按同字号和重音比着量的）
  staccato: { above: "\uE4A2", below: "\uE4A3", w: 0.28, h: 0.28 },
  tenuto: { above: "\uE4A4", below: "\uE4A5", w: 1.35, h: 0.17 }
};
var GLYPH_BREATH = "\uE4CE";
var GROOVE_LANE = 3.4;
var DYN_LANE = 4.8;
var isStrength = (a) => a === "accent" || a === "marcato" || a === "stress" || a === "unstress";
var DYN_GLYPH = { ppp: "\uE52A", pp: "\uE52B", p: "\uE520", mp: "\uE52C", mf: "\uE52D", f: "\uE522", ff: "\uE52F", fff: "\uE530" };
var DYN_INK = { ppp: [-0.4, 4.3, 1.1, 0.6], fff: [-0.6, 3.4, 1.8, 0.6], pp: [-0.4, 3, 1.1, 0.6], p: [-0.4, 1.5, 1.1, 0.6], mp: [-0.1, 3.3, 1.1, 0.6], mf: [-0.1, 3.3, 1.7, 0.7], f: [-0.6, 1.5, 1.8, 0.6], ff: [-0.6, 2.5, 1.8, 0.6] };
var PIN_GAP = 0.7;
var PIN_WORD = { size: 2, w: { cresc: 4.7, dim: 3.5 } };
var DASH = { len: 0.6, gap: 1 };
var RAMP_DASH = { len: 0.5, gap: 0.4 };
var SHARP_POS = [38, 35, 39, 36, 33, 37, 34];
var FLAT_POS = [34, 37, 33, 36, 32, 35, 31];
var GLYPH_TUPLET = (n2) => [...String(n2)].map((d) => String.fromCodePoint(59520 + Number(d))).join("");
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
var flagLevel = (base) => base >= TPQ ? 0 : Math.round(Math.log2(TPQ / base));
var baseWidth = (base) => Math.max(2.2, 3.6 + 0.75 * Math.log2(base / TPQ));
var SLOT = { phrase: -1, bar: 0, nav: 0.5, clef: 0.8, key: 1, time: 2, tempo: 3, groove: 3.3, dyn: 3.5, ottava: 3.6, hairpin: 3.7, head: 4, chunk: 5 };
var CLEF_CUE = 0.72;
var CLEF_CUE_W = 2.74 * CLEF_CUE + 0.9;
var CLEF_GLYPH = { G: GLYPH.gClef, G8vb: GLYPH.gClef8vb, G8va: GLYPH.gClef8va, G15ma: GLYPH.gClef15ma, F: GLYPH.fClef, F8vb: GLYPH.fClef8vb };
var keyWidth = (fifths, prev) => (fifths === 0 ? Math.abs(prev) * 0.8 : Math.abs(fifths) * 1.05) + 1;
var timeWidth = (beats, beatType) => Math.max([...String(beats)].length, [...String(beatType)].length) * W.timeSigDigit;
function unitsOf(tokens, o) {
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
  const head = { key: fifths, time, bpm, idx: headIdx };
  const units = [], measureLen = (b, bt) => b * WHOLE / bt;
  let accState = /* @__PURE__ */ new Map(), inBar = 0, measureNo = 0, shortBars = 0, tick = 0, pickup = false;
  let beat = beatTicks(time.beats, time.beatType), len = measureLen(time.beats, time.beatType);
  const pushHead = () => {
    units.push({ kind: "head", index: -1, w: 0, x: 0, system: 0, tick, staff: 1 });
  };
  const pushBar = (index, auto) => {
    const rb = index >= 0 ? tokens[index] : null, repeat = rb?.repeat;
    const warn = inBar !== len && measureNo > 0 && !(repeat === "start" && inBar === 0);
    if (warn) shortBars++;
    const style = !repeat ? rb?.style : void 0;
    units.push({ kind: "bar", index, w: repeat ? (repeat === "both" ? 2.43 : 1.47) + 0.8 : style ? BAR_W + 0.7 : BAR_W, x: 0, system: 0, tick, staff: 1, warn, auto, ...repeat ? { repeat, ...rb?.times ? { times: rb.times } : {} } : {}, ...style ? { style } : {} });
    const empty = inBar === 0;
    if (measureNo === 0 && inBar > 0 && inBar < len) pickup = true;
    accState = /* @__PURE__ */ new Map();
    inBar = 0;
    if (!(repeat === "start" && empty)) measureNo++;
  };
  const flushFull = () => {
    if (o.autoBars && inBar >= len && inBar > 0) pushBar(-1, true);
  };
  tokens.forEach((t, i) => {
    if (i < H) return;
    if (t.kind === "bar") {
      pushBar(i, false);
      return;
    }
    if (t.kind === "key") {
      flushFull();
      units.push({ kind: "key", index: i, fifths: t.fifths, prev: fifths, w: keyWidth(t.fifths, fifths), x: 0, system: 0, tick, staff: 1 });
      fifths = t.fifths;
      accState = /* @__PURE__ */ new Map();
      return;
    }
    if (t.kind === "time") {
      if (o.autoBars && inBar > 0) pushBar(-1, true);
      units.push({ kind: "time", index: i, beats: t.beats, beatType: t.beatType, w: timeWidth(t.beats, t.beatType) + 1.2, x: 0, system: 0, tick, staff: 1 });
      beat = beatTicks(t.beats, t.beatType);
      len = measureLen(t.beats, t.beatType);
      return;
    }
    if (t.kind === "tempo") {
      flushFull();
      units.push({ kind: "tempo", index: i, bpm: t.bpm, w: 0.3, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "phrase") {
      flushFull();
      units.push({ kind: "phrase", index: i, w: 1, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "dyn") {
      flushFull();
      units.push({ kind: "dyn", index: i, value: t.value, w: 0, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "hairpin") {
      flushFull();
      units.push({ kind: "hairpin", index: i, dir: t.dir, w: 0, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "groove") {
      flushFull();
      units.push({ kind: "groove", index: i, w: 0, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "clef") {
      flushFull();
      units.push({ kind: "clef", index: i, clef: t.clef, w: CLEF_CUE_W, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "ottava") {
      flushFull();
      units.push({ kind: "ottava", index: i, w: 0, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "nav") {
      const head2 = t.what === "ending" || t.what === "segno" || t.what === "coda";
      if (head2) flushFull();
      units.push({ kind: "nav", index: i, w: 0, x: 0, system: 0, tick, staff: 1, slot: head2 ? 0.5 : -0.5 });
      return;
    }
    const isNote = t.kind === "note", nt = t;
    const pitch = isNote ? effectivePitch(tokens, i) : null;
    const pitches = isNote ? nt.pitch ? allPitches(nt) : [pitch] : [];
    let left = t.dur, j = 0, lastChunk = null;
    while (left > 1e-6) {
      flushFull();
      const piece = o.autoBars ? Math.min(left, len - inBar) : left;
      const { ratio, chunks } = notate(piece);
      let off = 0;
      for (const c of chunks) {
        const accs = pitches.map((pp) => {
          if (j !== 0 || isNote && nt.tie) return null;
          const key = `${pp.step}${pp.octave}`, cur = accState.has(key) ? accState.get(key) : keyAlter(pp.step, fifths);
          if (pp.alter !== cur) {
            accState.set(key, pp.alter);
            return pp.alter;
          }
          return null;
        });
        const acc = accs[0] ?? null;
        const lyric = isNote && j === 0 && !nt.tie ? nt.lyric : null;
        const accW = accs.some((a) => a !== null) ? 1.3 : 0;
        let w = accW + baseWidth(c.base) + (c.dotted ? 0.6 : 0);
        if (lyric && lyric !== MELISMA_MARK && !o.rhythm) w = Math.max(w, accW + o.measureLyric(lyricShow(lyric)) / o.sp + (nt.hyph ? 1.4 : 0.7));
        const u = {
          kind: "chunk",
          index: i,
          j,
          last: false,
          m: measureNo,
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
          acc,
          w,
          accW,
          x: 0,
          system: 0,
          tick: tick + off,
          staff: 1,
          pitches,
          accs,
          art: isNote && j === 0 ? (nt.art ?? []).filter((a) => a !== "breath") : [],
          breath: false,
          ...isNote && nt.art?.includes("whisper") ? { whisper: true } : {},
          ...o.padFrom !== void 0 && i >= o.padFrom ? { pad: true } : {}
        };
        units.push(u);
        lastChunk = u;
        off += c.ticks;
        j++;
      }
      inBar += piece;
      left -= piece;
      tick += piece;
    }
    if (lastChunk) {
      lastChunk.last = true;
      if (isNote && nt.art?.includes("breath")) {
        lastChunk.breath = true;
        lastChunk.w += 0.8;
        if (nt.inhale) {
          lastChunk.inhale = nt.inhale;
          lastChunk.w += nt.inhale === "big" ? 2.1 : 1.2;
        }
      }
    }
  });
  flushFull();
  if (o.tail) pushHead();
  return { units, head, shortBars, pickup };
}
function engrave(song, o) {
  const clefStarts = resolveSongClefs(song);
  const sp = o.sp, P = (v) => v * sp;
  const SPC = SPACING[densityOf(song.paper ?? { kind: "A5", widthMm: 0, heightMm: 0, marginMm: { l: 0, r: 0, t: 0, b: 0 } })];
  const PG = o.page ?? null, PAGE_GAP = 3, MX = o.page ?? o.margins ?? { l: 0, r: 0, t: 0, b: 1.5 };
  const pageTopY = (k) => P(k * ((PG?.h ?? 0) + PAGE_GAP));
  const contentTop = (k) => pageTopY(k) + P(PG?.t ?? 0), contentBottom = (k) => pageTopY(k) + P((PG?.h ?? 0) - (PG?.b ?? 0));
  let pageNo = 0;
  const TOP2 = P(MX.t);
  const STAFF_ABOVE = SPC.staffAbove, LYRIC_BELOW = SPC.lyricBelow, SYS_GAP = SPC.sysGap;
  const prims = [];
  const autoBars = o.autoBars !== false;
  const baseRight = o.width / sp - MARGIN;
  let right = baseRight, sheetRight = baseRight;
  const PART_EM = LYRIC_EM * 0.85;
  const nameW = (s) => o.measureLyric(s) * PART_EM / LYRIC_EM / sp;
  const nameLines = (name, staves) => {
    if (nameW(name) <= NAME_MAX) return [name];
    const toks = name.match(/[A-Za-z0-9'’.\-()&]+\s*|\s+|./gu) ?? [name], lines2 = [];
    let cur = "";
    for (const t of toks) {
      if (!cur.trim() || nameW((cur + t).trimEnd()) <= NAME_MAX) cur += t;
      else {
        lines2.push(cur.trimEnd());
        cur = t.trimStart();
      }
    }
    if (cur.trim()) lines2.push(cur.trimEnd());
    const out = lines2.flatMap((l) => {
      if (nameW(l) <= NAME_MAX) return [l];
      const ps = [];
      let c = "";
      for (const ch of [...l]) {
        if (c && nameW(c + ch) > NAME_MAX) {
          ps.push(c);
          c = ch;
        } else c += ch;
      }
      if (c) ps.push(c);
      return ps;
    });
    const max = staves === 2 ? 5 : 3;
    if (out.length > max) {
      out.length = max;
      let last = out[max - 1];
      while (last && nameW(`${last}\u2026`) > NAME_MAX) last = [...last].slice(0, -1).join("");
      out[max - 1] = `${last}\u2026`;
    }
    return out;
  };
  const titleSize = P(2.8), titleBase = TOP2 + P(TITLE_H * 0.62);
  if (song.title) prims.push({ t: "text", x: o.width / 2, y: titleBase, s: song.title, cls: "song-title", size: titleSize, anchor: "middle" });
  else if (o.titlePlaceholder) prims.push({ t: "text", x: o.width / 2, y: titleBase, s: "\u6B4C\u540D", cls: "song-title empty", size: titleSize * 0.8, anchor: "middle" });
  let paperChip = null, addPaper = null, nav = null, paperMenu = null;
  if (o.paperLabel) {
    const ch = P(CTL_H), cw = ch, cx = o.width - P(MARGIN) - cw, cy = TOP2 + P(0.8), is = P(CTL_GLYPH);
    prims.push({ t: "rect", x: cx, y: cy, w: cw, h: ch, cls: "paper-chip" });
    prims.push({ t: "icon", id: "wrench", x: cx + (cw - is) / 2, y: cy + (ch - is) / 2, size: is, cls: "paper-chip-icon", title: `\u7EB8\uFF1A${o.paperLabel}` });
    paperChip = { x: cx - P(0.5), y: cy - P(0.5), w: cw + P(1), h: ch + P(1) };
    if (o.titlePlaceholder) {
      const ax = cx - cw - P(0.6);
      prims.push({ t: "rect", x: ax, y: cy, w: cw, h: ch, cls: "paper-chip" });
      prims.push({ t: "text", x: ax + cw / 2, y: cy + ch * 0.74, s: "\uFF0B", cls: "paper-chip-text", size: P(CTL_GLYPH), anchor: "middle" });
      addPaper = { x: ax - P(0.5), y: cy - P(0.5), w: cw + P(1), h: ch + P(1) };
    }
  }
  if (o.titlePlaceholder && song.papers.length === 1) {
    const ch = P(CTL_H), cw = P(CTL_H + 0.6), cy = TOP2 + P(0.8), mx = P(MARGIN);
    prims.push({ t: "rect", x: mx, y: cy, w: cw, h: ch, cls: "paper-chip" });
    prims.push({ t: "text", x: mx + cw / 2, y: cy + ch * 0.72, s: "\u22EF", cls: "paper-chip-text", size: P(CTL_GLYPH), anchor: "middle" });
    paperMenu = { x: mx - P(0.3), y: cy - P(0.4), w: cw + P(0.6), h: ch + P(0.8) };
  }
  const title = { x: P(MARGIN), y: TOP2 + P(0.3), w: o.width - P(2 * MARGIN), h: P(TITLE_H), baseline: titleBase, size: titleSize };
  const lines = song.credits ? song.credits.split("\n") : [];
  let credits = null;
  const cs = P(1.25), rx = o.width - P(MARGIN), y0 = TOP2 + P(TITLE_H + 1);
  if (lines.length) {
    lines.forEach((s, k) => prims.push({ t: "text", x: rx, y: y0 + k * cs * 1.35, s, cls: "credits", size: cs, anchor: "end" }));
    const w = Math.max(...lines.map((s) => o.measureLyric(s) * 1.25 / LYRIC_EM)) + P(0.6);
    credits = { x: rx - w, y: y0 - cs * 1.1, w: w + P(0.3), h: cs * 1.35 * lines.length + cs * 0.4 };
  } else if (o.titlePlaceholder) {
    prims.push({ t: "text", x: rx, y: y0, s: "\u4F5C\u8005", cls: "credits empty", size: cs, anchor: "end" });
    const w = o.measureLyric("\u4F5C\u8005") * 1.25 / LYRIC_EM + P(0.6);
    credits = { x: rx - w, y: y0 - cs * 1.1, w: w + P(0.3), h: cs * 1.75 };
  }
  let arrangement = null, arrLast = 0;
  if (!o.onlyPaper) {
    const as = P(1.25), wOf = (t, size) => o.measureLyric(t) * size / LYRIC_EM, row = Math.max(lines.length, 1), base = y0 + row * cs * 1.35;
    const arr = parseArrangement(song.arrangement, song.papers), txt = song.arrangement?.trim() ?? "";
    const label = "\u7F16\u6392\u3000", lw = wOf(label, 1.25), x0 = P(MARGIN) + lw, avail = o.width - P(2 * MARGIN) - lw;
    prims.push({ t: "text", x: P(MARGIN), y: base, s: label, cls: txt ? "arr-label" : "arr-label empty", size: as, anchor: "start" });
    arrLast = base;
    if (txt) {
      prims.push({ t: "text", x: x0, y: base, s: txt, cls: "arr", size: as, anchor: "start" });
      if (arr.issues.length) {
        const why = `\xB7 ${arr.issues[0].why}${arr.issues.length > 1 ? ` \u7B49 ${arr.issues.length} \u5904` : ""}`, tw = wOf(txt, 1.25) + P(0.8), fits = tw + wOf(why, 1.1) <= avail;
        prims.push({ t: "text", x: fits ? x0 + tw : x0, y: fits ? base : base + cs * 1.35, s: why, cls: "arr-issue", size: P(1.1), anchor: "start" });
        if (!fits) arrLast = base + cs * 1.35;
      }
    } else if (o.titlePlaceholder) {
      const full = "\u4E0D\u5199 = \u6BCF\u5F20\u7EB8\u6309\u987A\u5E8F\u5404\u653E\u4E00\u904D\uFF08\u4F8B\uFF1A\u524D\u594F (A A1)\xD73 A A2 [\u526F\u6B4C]\uFF09", short = "\u4E0D\u5199 = \u6BCF\u5F20\u7EB8\u6309\u987A\u5E8F\u5404\u653E\u4E00\u904D";
      prims.push({ t: "text", x: x0, y: base, s: wOf(full, 1.25) <= avail ? full : short, cls: "arr-empty", size: as, anchor: "start" });
    }
    arrangement = { x: x0 - P(0.3), y: base - as * 1.15, w: avail + P(0.3), h: as * 1.6, baseline: base, size: as };
  }
  let yCur = Math.max(TOP2 + P(TITLE_H + 0.5), credits && lines.length ? credits.y + credits.h + P(0.3) : 0, arrangement ? arrLast + P(0.8) : 0);
  const ensure = (h) => {
    if (PG && yCur + h > contentBottom(pageNo) && yCur > contentTop(pageNo) + 1) {
      pageNo++;
      yCur = contentTop(pageNo);
    }
  };
  const bars = [];
  const chordHeads = [];
  const sharedRows = [], virtualOut = {}, measures = [], families = [];
  const rows = [], notes = [], slots = [], heads = [], lyrics = [], marks = [], dyns = [], rests = [], clefs = [];
  const partsHit = [], papersHit = [];
  let shortBars = 0;
  const rowTop = /* @__PURE__ */ new Map();
  const rowAbove = /* @__PURE__ */ new Map(), lyricOff = /* @__PURE__ */ new Map(), dynYAt = /* @__PURE__ */ new Map(), noteDynYAt = /* @__PURE__ */ new Map(), navYAt = /* @__PURE__ */ new Map(), ottYAt = /* @__PURE__ */ new Map(), ottDownYAt = /* @__PURE__ */ new Map(), tempoYAt = /* @__PURE__ */ new Map(), grooveYAt = /* @__PURE__ */ new Map();
  const staffTop = (r) => rowTop.get(r) + P(rowAbove.get(r) ?? STAFF_ABOVE);
  const yOf = (r, d) => staffTop(r) + (TOP_LINE - d) * P(0.5);
  const dOf = (r, y) => Math.round(TOP_LINE - (y - staffTop(r)) / P(0.5));
  const lyricY = (r) => yOf(r, BOTTOM_LINE) + P(lyricOff.get(r) ?? LYRIC_BELOW);
  const staffHit = (r) => ({ y: yOf(r, TOP_LINE) - P(1.2), h: yOf(r, BOTTOM_LINE) - yOf(r, TOP_LINE) + P(2.4) });
  const drawTime = (r, x0, beats, beatType, cls) => {
    const num = timeSigDigits(beats), den = timeSigDigits(beatType);
    const wn = [...num].length * W.timeSigDigit, wd = [...den].length * W.timeSigDigit, cw = Math.max(wn, wd);
    prims.push({ t: "glyph", x: P(x0 + (cw - wn) / 2), y: yOf(r, 36), ch: num, cls });
    prims.push({ t: "glyph", x: P(x0 + (cw - wd) / 2), y: yOf(r, 32), ch: den, cls });
    return cw;
  };
  const drawTempo = (r, x0, v, cls, index, change) => {
    const fs = TEMPO_EM * sp, word = tempoWord(v).it, y = tempoYAt.get(r) ?? staffTop(r) - P(2.4);
    if (change) prims.push({ t: "text", x: P(x0 - 0.3), y, s: change === "up" ? "\u2191" : "\u2193", cls: "tempo-change", size: fs, anchor: "end" });
    const ww = o.measureLyric(word) * TEMPO_EM / LYRIC_EM / sp, num = `= ${v}`, nw = o.measureLyric(num) * TEMPO_EM / LYRIC_EM / sp;
    prims.push({ t: "text", x: P(x0), y, s: word, cls: `${cls} tempo-word`, size: fs, anchor: "start" });
    const gx = x0 + ww + 0.7;
    prims.push({ t: "glyph", x: P(gx), y: y - P(0.3), ch: GLYPH.metNoteQuarterUp, cls, size: fs * 1.75 });
    prims.push({ t: "text", x: P(gx + 1.3), y, s: num, cls: `${cls} tempo-num`, size: fs, anchor: "start" });
    marks.push({ index, kind: "tempo", system: r, x: P(x0 - 0.3), y: y - P(TEMPO_EM * 1.1), w: P(gx + 1.3 + nw + 0.6 - x0), h: P(TEMPO_EM * 1.5) });
  };
  const drawKeySig = (r, x0, f, cls, clef = "G") => {
    const pos = f > 0 ? SHARP_POS : FLAT_POS, ch = f > 0 ? GLYPH.accidentalSharp : GLYPH.accidentalFlat, off = clef === "F" ? -2 : 0;
    for (let k = 0; k < Math.abs(f); k++) prims.push({ t: "glyph", x: P(x0 + k * 1.05), y: yOf(r, pos[k] + off), ch, cls });
  };
  const showPaperLine = song.papers.length > 1 || song.papers.some((p) => p.name);
  let drawn = 0;
  song.papers.forEach((paper, paperK) => {
    right = baseRight;
    if (o.onlyPaper && paper.id !== o.onlyPaper) return;
    if (drawn++ > 0) yCur += P(PAPER_GAP);
    const owner = tempoOwner(song, paper), prevPaper = song.papers.slice(0, paperK).reverse().find((x2) => !x2.hidden), prevBpm = prevPaper ? sheetEndBpm(song, prevPaper) : null;
    const paperTop = yCur;
    const pSize = P(1.6);
    let menu = null;
    const paperNav = {};
    const pTitle = { x: P(MARGIN), y: yCur, w: o.width - P(2 * MARGIN) - P(o.titlePlaceholder && song.papers.length > 1 ? 16 : 4), h: P(PAPER_H), baseline: 0, size: pSize, shown: showPaperLine };
    const drawPaperTitle = (firstBlock) => {
      if (!showPaperLine) return;
      ensure(P(PAPER_H) + firstBlock);
      const pBase = yCur + P(PAPER_H * 0.68);
      pTitle.y = yCur;
      pTitle.baseline = pBase;
      if (paper.name) prims.push({ t: "text", x: P(MARGIN), y: pBase, s: paper.name, cls: paper.hidden && !o.onlyPaper ? "paper-name hidden-paper" : "paper-name", size: pSize, anchor: "start" });
      else if (o.titlePlaceholder) prims.push({ t: "text", x: P(MARGIN), y: pBase, s: "\u66F2\u6BB5\u540D", cls: "paper-name empty", size: pSize, anchor: "start" });
      if (o.titlePlaceholder && song.papers.length > 1) {
        const k = song.papers.findIndex((p) => p.id === paper.id), n2 = song.papers.length, ch = P(CTL_H), cw = P(CTL_H), cy = yCur + P((PAPER_H - CTL_H) / 2);
        const lab = `${k + 1}/${n2}`, lw = o.measureLyric(lab) * CTL_TEXT / LYRIC_EM + P(1), sw = o.measureLyric("\u672C\u6BB5") * CTL_TEXT / LYRIC_EM + P(1.6), mw = P(CTL_H + 0.6);
        const segOn = o.onlyPaper === paper.id, total = cw + lw + cw + P(1) + sw + P(0.6) + mw;
        let x2 = o.width - P(MARGIN) - total;
        const hit = (bx, w) => ({ x: bx - P(0.3), y: cy - P(0.2), w: w + P(0.6), h: ch + P(0.4) });
        prims.push({ t: "rect", x: x2, y: cy, w: cw, h: ch, cls: k > 0 ? "paper-chip" : "paper-chip off" });
        prims.push({ t: "text", x: x2 + cw / 2, y: cy + ch * 0.72, s: "\u2039", cls: "paper-chip-text", size: P(CTL_GLYPH), anchor: "middle" });
        const prev = k > 0 ? hit(x2, cw) : null;
        x2 += cw;
        prims.push({ t: "text", x: x2 + lw / 2, y: cy + ch * 0.7, s: lab, cls: "nav-text", size: P(CTL_TEXT), anchor: "middle" });
        x2 += lw;
        prims.push({ t: "rect", x: x2, y: cy, w: cw, h: ch, cls: k < n2 - 1 ? "paper-chip" : "paper-chip off" });
        prims.push({ t: "text", x: x2 + cw / 2, y: cy + ch * 0.72, s: "\u203A", cls: "paper-chip-text", size: P(CTL_GLYPH), anchor: "middle" });
        const next = k < n2 - 1 ? hit(x2, cw) : null;
        x2 += cw + P(1);
        prims.push({ t: "rect", x: x2, y: cy, w: sw, h: ch, cls: segOn ? "paper-chip on" : "paper-chip" });
        prims.push({ t: "text", x: x2 + sw / 2, y: cy + ch * 0.7, s: "\u672C\u6BB5", cls: segOn ? "nav-text on" : "nav-text", size: P(CTL_TEXT), anchor: "middle" });
        const scope = hit(x2, sw);
        x2 += sw + P(0.6);
        prims.push({ t: "rect", x: x2, y: cy, w: mw, h: ch, cls: "paper-chip" });
        prims.push({ t: "text", x: x2 + mw / 2, y: cy + ch * 0.72, s: "\u22EF", cls: "paper-chip-text", size: P(CTL_GLYPH), anchor: "middle" });
        menu = hit(x2, mw);
        Object.assign(paperNav, { prev, next, scope });
      }
      yCur += P(PAPER_H);
    };
    if (paper.hidden && !o.onlyPaper) {
      drawPaperTitle(P(STUB_H));
      ensure(P(STUB_H));
      prims.push({ t: "text", x: P(MARGIN), y: yCur + P(STUB_H * 0.7), s: "\u9690\u85CF \xB7 \u4E0D\u653E\uFF08\u70B9\u66F2\u6BB5\u540D\u8FDB\u53BB\uFF09", cls: "part-stub", size: P(1.1), anchor: "start" });
      prims.push({ t: "line", x1: P(MARGIN + 0.2) + o.measureLyric("\u9690\u85CF \xB7 \u4E0D\u653E\uFF08\u70B9\u66F2\u6BB5\u540D\u8FDB\u53BB\uFF09") * 1.1 / LYRIC_EM + P(0.8), y1: yCur + P(STUB_H * 0.5), x2: P(right), y2: yCur + P(STUB_H * 0.5), w: P(0.08), cls: "part-stub-line" });
      yCur += P(STUB_H);
      papersHit.push({ id: paper.id, title: pTitle, menu, top: paperTop, bottom: yCur, ...paperNav });
      return;
    }
    const present = o.parts.filter((p) => paper.tracks[p.id]), visible = present.filter((p) => !p.hidden), hiddenParts = present.filter((p) => p.hidden);
    const hostOf = (id) => song.parts.find((x2) => x2.id === id)?.host;
    const editingHere = !o.foldAll && o.at.paper === paper.id ? o.at.part : null;
    const absorbed = /* @__PURE__ */ new Map(), virt = /* @__PURE__ */ new Map(), lowOf = /* @__PURE__ */ new Map();
    const voice2Of = /* @__PURE__ */ new Map(), shareWith = /* @__PURE__ */ new Map(), startFor = /* @__PURE__ */ new Map();
    const famOf = (id) => hostOf(id) ?? (song.parts.some((x2) => x2.host === id) ? id : null);
    const famIds = [...new Set(visible.map((p) => famOf(p.id)).filter((x2) => !!x2))];
    const famHere = (fid) => visible.filter((p) => famOf(p.id) === fid);
    for (const fid of famIds) {
      const ms = famHere(fid);
      if (ms.length < 2) continue;
      if (editingHere !== null && famOf(editingHere) === fid) continue;
      const hp = ms[0], ten = ms.slice(1), drums = ms.every((m) => !!m.perc);
      const keyOf = drums ? (m, p) => {
        const pk = ms[m].perc;
        return pk.kind === "one" ? spellMidi(pk.info.kitKey ?? (pk.info.staff === 5 && !pk.info.from ? pk.key : 0), 0) : p;
      } : void 0;
      const tracksM = ms.map((m) => paper.tracks[m.id]);
      absorbed.set(hp.id, ten);
      const staffOf = (sid, mo, all) => {
        startFor.set(sid, startClef(mergeTracks(tracksM, all), void 0, null, true));
        const v1 = mergeTracks(tracksM, mo(1)), v2 = mergeTracks(tracksM, mo(2));
        virt.set(sid, v1);
        virtualOut[`${paper.id}:${sid}`] = v1;
        if (v2.some((t) => t.kind === "note")) {
          const vid = `${sid}~v2`;
          virt.set(vid, v2);
          virtualOut[`${paper.id}:${vid}`] = v2;
          voice2Of.set(sid, vid);
          shareWith.set(vid, sid);
          startFor.set(vid, startFor.get(sid));
        }
      };
      if (drums) {
        const whole = mergeTracks(tracksM, { keyOf });
        virt.set(hp.id, whole);
        virtualOut[`${paper.id}:${hp.id}`] = whole;
        startFor.set(hp.id, "G");
      } else {
        const homes = ms.map((m) => {
          if (m.staves === 2) return null;
          const c = m.clef ?? clefStarts.get(paper.id)?.get(m.id);
          return c ? isFClef(c) ? 1 : 0 : null;
        });
        const plan = planHands(tracksM, wantsGrand, homes, song.parts.find((x2) => x2.id === fid)?.staves === 2), staffOpts = (S, top) => (v) => ({ pick: plan.pick(S, v), marks: top && v === 1 ? "all" : "bars" });
        const both = (S) => ({ pick: (m, t) => plan.pick(S, 1)(m, t) || plan.pick(S, 2)(m, t), marks: "bars" });
        staffOf(hp.id, staffOpts(0, true), both(0));
        if (plan.grand) {
          const lid = `${hp.id}~lo`;
          lowOf.set(hp.id, lid);
          staffOf(lid, staffOpts(1, false), both(1));
        }
      }
    }
    const openFams = famIds.filter((fid) => famHere(fid).length >= 2 && !absorbed.has(famHere(fid)[0].id)).map((fid) => ({ host: fid, ids: famHere(fid).map((p) => p.id) }));
    const gone = new Set([...absorbed.values()].flat().map((p) => p.id));
    const parts = visible.filter((p) => !gone.has(p.id)).flatMap((p) => {
      if (!virt.has(p.id)) return [p];
      const drums = [p, ...absorbed.get(p.id)].every((m) => !!m.perc), lid = lowOf.get(p.id);
      const v = { ...p, clef: void 0, staves: void 0, perc: drums ? { kind: "kit" } : void 0, mono: false, xHead: false, ignores: [], lyricMute: void 0 };
      const fake = (id) => ({ id, name: "", empty: false, first: false, hidden: false, badges: [] }), v2 = (sid) => voice2Of.has(sid) ? [fake(voice2Of.get(sid))] : [];
      return [v, ...v2(p.id), ...lid ? [fake(lid), ...v2(lid)] : []];
    });
    const loIds = new Set(lowOf.values());
    const trackOf = (id) => virt.get(id) ?? paper.tracks[id];
    const stubs = () => {
      for (const p of hiddenParts) {
        ensure(P(STUB_H));
        prims.push({ t: "text", x: P(MARGIN), y: yCur + P(STUB_H * 0.7), s: `${p.name} \xB7 \u9690\u85CF`, cls: "part-stub", size: P(1.1), anchor: "start" });
        prims.push({ t: "line", x1: P(MARGIN + 0.2) + o.measureLyric(`${p.name} \xB7 \u9690\u85CF`) * 1.1 / LYRIC_EM + P(0.8), y1: yCur + P(STUB_H * 0.5), x2: P(right), y2: yCur + P(STUB_H * 0.5), w: P(0.08), cls: "part-stub-line" });
        partsHit.push({ paper: paper.id, part: p.id, x: P(MARGIN - 0.4), y: yCur, w: P(right - MARGIN + 0.4), h: P(STUB_H) });
        yCur += P(STUB_H);
      }
    };
    if (!parts.length) {
      drawPaperTitle(P(hiddenParts.length ? STUB_H : 3.2));
      if (!hiddenParts.length) {
        prims.push({ t: "text", x: P(MARGIN), y: yCur + P(2.2), s: "\uFF08\u8FD9\u5F20\u7EB8\u4E0A\u6CA1\u6709\u58F0\u90E8\uFF09", cls: "paper-name empty", size: P(1.3), anchor: "start" });
        yCur += P(3.2);
      }
      stubs();
      papersHit.push({ id: paper.id, title: pTitle, menu, top: paperTop, bottom: yCur, ...paperNav });
      return;
    }
    const lenOf = (t) => t.reduce((n2, x2) => n2 + (isTimed(x2) ? x2.dur : 0), 0);
    const lens = parts.map((p) => lenOf(trackOf(p.id) ?? [])), paperLen = Math.max(0, ...lens);
    const per = parts.map((p, pi) => {
      const real = trackOf(p.id), vrt = virt.has(p.id), focused = !vrt && o.at.paper === paper.id && o.at.part === p.id, staves = p.staves === 2 ? 2 : 1;
      const gap = paperLen - lens[pi];
      const padT = (dur, id) => ({ kind: "rest", id, dur });
      const tokens = gap > 1e-6 ? [...real, padT(gap, -2)] : real;
      const u = unitsOf(tokens, { tail: focused && !!o.tailOpen, autoBars, measureLyric: o.measureLyric, sp, rhythm: song.lyricFit !== "lyrics", padFrom: real.length });
      shortBars += u.shortBars;
      if (staves === 2) {
        const stf = staffOfTokens(tokens, 2);
        let last = 1;
        for (const x2 of u.units) {
          if (x2.kind === "chunk") {
            x2.staff = stf[x2.index];
            last = x2.staff;
          } else if (x2.kind === "head") x2.staff = last;
        }
      }
      const start = staves === 2 ? "G" : vrt ? startFor.get(p.id) ?? startClef(tokens, void 0, null, true) : clefStarts.get(paper.id)?.get(p.id) ?? "G";
      const ds0 = displayStates(tokens, start), ao = staves === 2 || p.perc || shareWith.has(p.id) || !vrt && song.parts.find((x2) => x2.id === p.id)?.autoOttava === false ? null : autoOttava(tokens, ds0);
      const ds = ao ? { clef: ds0.clef, ott: ao.ott, auto: ao.auto, runs: ao.runs } : { ...ds0, auto: null, runs: [] };
      const fFam = staves === 2 || isFClef(start) || tokens.some((t) => t.kind === "clef" && isFClef(t.clef));
      return { p, tokens, realLen: real.length, realTicks: lens[pi], focused, staves, start, ds, fFam, vrt, ...u };
    });
    const shAt = (q, staff, index) => {
      return q.staves === 2 ? staff === 2 ? 12 : 0 : CLEF_SHIFT[(index >= 0 ? q.ds.clef[index] : void 0) ?? q.start] + ottavaShift(index >= 0 ? q.ds.ott[index] ?? 0 : 0);
    };
    const pmode = per.map((q) => !q.p.perc ? null : q.p.perc.kind === "kit" ? "five" : "one");
    const rowHost = per.map((q) => {
      const h = shareWith.get(q.p.id);
      return h ? per.findIndex((x2) => x2.p.id === h) : -1;
    });
    const hasV2 = per.map((q) => voice2Of.has(q.p.id));
    const percAt = (q, p) => {
      const pk = q.p.perc;
      return !pk ? null : pk.kind === "kit" ? percOf(128, 0, midiOf(p)) : pk.info;
    };
    const posD = (q, p, staff, index) => {
      const m = pmode[per.indexOf(q)];
      if (m && q.p.perc) {
        const pi = percAt(q, p);
        return m === "one" ? MID_LINE - (pi && pi.staff === 1 ? pi.line : 0) : TOP_LINE - (pi ? pi.line : 4);
      }
      return diatonicIndex(p) + shAt(q, staff, index);
    };
    const clefAtSys = (q, s) => {
      const u = q.units.find((x2) => x2.system === s && x2.index >= 0);
      if (u) return q.ds.clef[u.index] ?? q.start;
      let c = q.start;
      for (const x2 of q.units) if (x2.system < s && x2.index >= 0) c = q.ds.clef[x2.index] ?? c;
      return c;
    };
    const clefSrcAtSys = (q, s) => {
      const u = q.units.find((x2) => x2.system === s && x2.index >= 0), upto = u ? u.index : q.tokens.length - 1;
      for (let i = upto; i >= 0; i--) if (q.tokens[i]?.kind === "clef") return i;
      return -1;
    };
    const colMap = /* @__PURE__ */ new Map();
    for (const q of per) {
      const seen = /* @__PURE__ */ new Map();
      for (const u of q.units) {
        const sl = u.kind === "nav" ? u.slot : SLOT[u.kind], base = `${u.tick}:${sl}`, n2 = seen.get(base) ?? 0;
        seen.set(base, n2 + 1);
        const key = `${base}:${n2}`;
        let c = colMap.get(key);
        if (!c) {
          c = { tick: u.tick, slot: sl, n: n2, w: 0, x: 0, system: 0, units: [], bar: false, chunk: false, phrase: false };
          colMap.set(key, c);
        }
        c.units.push(u);
        c.w = Math.max(c.w, u.w);
        if (u.kind === "bar") c.bar = true;
        if (u.kind === "chunk") c.chunk = true;
        if (u.kind === "phrase") c.phrase = true;
      }
    }
    const cols = [...colMap.values()].sort((a, b) => a.tick - b.tick || a.slot - b.slot || a.n - b.n);
    const spans = per.flatMap((q) => q.units.filter((u) => u.kind === "chunk").map((u) => [u.tick, u.tick + u.ticks]));
    const breakableAt = (tick) => !spans.some(([a, b]) => a < tick - 1e-6 && b > tick + 1e-6);
    const FAM_W = openFams.length && o.titlePlaceholder ? 0.8 : 0;
    const ind0 = Math.max(...parts.map((p) => Math.max(...nameLines(p.name, p.staves ?? 1).map(nameW)))) + 1.4 + FAM_W;
    const indN = parts.some((p) => p.abbr) ? Math.max(nameW(ABBR_REF), ...parts.map((p) => nameW(p.abbr ?? ""))) + 1.4 + FAM_W : 0;
    const keyNow = new Map(per.map((q) => [q.p.id, q.head.key]));
    const clefW = (q) => q.fFam ? W.fClef : W.gClef;
    const headerOf = (first) => Math.max(...per.map((q) => {
      const f = keyNow.get(q.p.id);
      return (first ? ind0 : indN) + MARGIN + 0.6 + clefW(q) + 1 + Math.abs(f) * 1.05 + (f ? 0.8 : 0) + (first ? timeWidth(q.head.time.beats, q.head.time.beatType) + 1.2 : 0.4);
    }));
    let system = 0, x = headerOf(true);
    const sysStarts = [x], sysKeys = [new Map(keyNow)];
    const newline = () => {
      system++;
      x = headerOf(false);
      sysStarts.push(x);
      sysKeys.push(new Map(keyNow));
    };
    const placedCols = [];
    const place = (c) => {
      c.x = x;
      c.system = system;
      x += c.w;
      placedCols.push(c);
      for (const u of c.units) {
        u.x = c.x;
        u.system = system;
        if (u.kind === "key") keyNow.set(per.find((q) => q.units.includes(u)).p.id, u.fifths);
      }
    };
    const chunkW = (cs2) => cs2.reduce((a, c) => a + (c.chunk ? c.w : 0), 0);
    let seg = [];
    const brk = o.scroll ? Infinity : right;
    const flush = () => {
      const segW = seg.reduce((s, c) => s + c.w, 0), closed = seg.length > 0 && seg[seg.length - 1].bar;
      const over = x + segW + (closed ? 0 : BAR_W) - brk;
      if (over > 0 && x > sysStarts[system] + 0.01) {
        const lineChunks = chunkW(placedCols.filter((c) => c.system === system)) + chunkW(seg);
        if (over <= lineChunks * SQUEEZE) {
          for (const c of seg) place(c);
          seg = [];
          return;
        }
        newline();
      }
      for (const c of seg) {
        if (x + c.w > brk && x > sysStarts[system] + 0.01) newline();
        place(c);
      }
      seg = [];
    };
    for (const c of cols) {
      seg.push(c);
      if (c.bar && breakableAt(c.tick)) flush();
    }
    flush();
    const nSys = system + 1;
    for (let s = 0; s < nSys; s++) {
      const row = cols.filter((c) => c.system === s);
      const end = row.reduce((m, c) => Math.max(m, c.x + c.w), sysStarts[s]), avail = brk - sysStarts[s], used = end - sysStarts[s];
      if (used <= avail + 1e-6 && (s === nSys - 1 || used < avail * 0.6)) continue;
      const gw = chunkW(row);
      if (!gw) continue;
      const k = (avail - used) / gw;
      let xx = sysStarts[s];
      for (const c of row) {
        c.x = xx;
        if (c.chunk) c.w *= 1 + k;
        xx += c.w;
        for (const u of c.units) {
          u.x = c.x;
          if (u.kind === "chunk") u.w = c.w;
        }
      }
    }
    if (o.scroll) {
      right = Math.max(baseRight, ...cols.map((c) => c.x + c.w)) + SCROLL_TAIL;
      sheetRight = Math.max(sheetRight, right);
    }
    const rowBase = rows.length, nR = parts.length;
    const effStaves = (i) => rowHost[i] >= 0 ? 0 : per[i].staves;
    const rowStart = per.map((_, i) => per.slice(0, i).reduce((a, _q, j) => a + effStaves(j), 0)), nRowsSys = per.reduce((a, _q, j) => a + effStaves(j), 0);
    const rowOf = (s, r, k = 0) => rowBase + s * nRowsSys + rowStart[rowHost[r] >= 0 ? rowHost[r] : r] + k;
    const lyricsOf = per.map((q) => q.tokens.some((t) => t.kind === "note" && t.lyric));
    const lyrPlan = /* @__PURE__ */ new Map(), lyr2 = /* @__PURE__ */ new Set();
    if (song.lyricFit !== "lyrics") per.forEach((q, r) => {
      if (!lyricsOf[r]) return;
      const bySys = /* @__PURE__ */ new Map();
      for (const u of q.units) if (u.kind === "chunk" && u.lyric && u.lyric !== MELISMA_MARK) {
        const arr = bySys.get(u.system) ?? [];
        bySys.set(u.system, arr);
        arr.push({ index: u.index, cx: u.x + u.accW + 0.6, w: o.measureLyric(lyricShow(u.lyric)) / sp, hy: u.hyph });
      }
      for (const [sy, items] of bySys) {
        items.sort((a, b) => a.cx - b.cx);
        fitLyrics(items).forEach((f, k) => {
          lyrPlan.set(`${r}:${items[k].index}`, f);
          if (f.row) lyr2.add(`${r}:${sy}`);
        });
      }
    });
    const extentOf = (q, s, k) => {
      let top = TOP_LINE, bot = BOTTOM_LINE;
      for (const u of q.units) {
        if (u.kind !== "chunk" || u.system !== s || !u.note || (u.staff ?? 1) !== k + 1) continue;
        const ds = (u.pitches.length ? u.pitches : u.pitch ? [u.pitch] : []).map((pp) => posD(q, pp, k + 1, u.index));
        if (!ds.length) continue;
        const hi = Math.max(...ds), lo = Math.min(...ds), stem = u.base < WHOLE, up = (hi + lo) / 2 < MID_LINE;
        top = Math.max(top, hi + (stem && up ? 7 : 1));
        bot = Math.min(bot, lo - (stem && !up ? 7 : 1));
        if (u.art.some((a) => a === "staccato" || a === "tenuto")) {
          if (up) bot = Math.min(bot, lo - 3);
          else top = Math.max(top, hi + 3);
        }
        if (u.art.some(isStrength)) top = Math.max(top, (stem && up ? hi + 7 : hi + 3) + 4, TOP_LINE + 5);
      }
      return { top, bot };
    };
    const bigDynIn = (q, s) => q.units.some((u) => u.system === s && (u.kind === "dyn" || u.kind === "hairpin"));
    const noteDynIn = (q, s) => q.units.some((u) => u.system === s && u.kind === "chunk" && u.note && (u.art.includes("sfz") || u.art.includes("fp") || !!swellOf(q.tokens[u.index])));
    const ottIn = (q, s, up) => q.staves === 1 && q.units.some((u) => u.system === s && u.kind === "chunk" && (up ? (q.ds.ott[u.index] ?? 0) > 0 : (q.ds.ott[u.index] ?? 0) < 0));
    const geoOf = (s) => per.map((q, r) => {
      const ex = Array.from({ length: q.staves }, (_, k) => extentOf(q, s, k)), big = bigDynIn(q, s), own = noteDynIn(q, s), dyn = big || own;
      per.forEach((t, j) => {
        if (rowHost[j] !== r) return;
        for (let k = 0; k < ex.length; k++) {
          const e = extentOf(t, s, k);
          ex[k] = { top: Math.max(ex[k].top, e.top), bot: Math.min(ex[k].bot, e.bot) };
        }
      });
      const ottUp = ottIn(q, s, true), ottDown = ottIn(q, s, false);
      const g = ex.map((e, k) => {
        const minBelow = q.staves === 2 && k === 0 ? SPC.graveUpper - STAFF_ABOVE - 4 : (lyricsOf[r] ? SPC.rowH : SPC.rowHNoLyric) - STAFF_ABOVE - 4;
        let above = Math.max(STAFF_ABOVE, (e.top - TOP_LINE) / 2 + 0.8), below = Math.max(minBelow, (BOTTOM_LINE - e.bot) / 2 + 0.8), lyric = null;
        if (ottDown) below = Math.max(below, (BOTTOM_LINE - e.bot) / 2 + 3);
        if (lyricsOf[r] && k === q.staves - 1) {
          lyric = Math.max(LYRIC_BELOW, (BOTTOM_LINE - e.bot) / 2 + 2 + (ottDown ? 2.4 : 0)) + (o.lyricRaise ?? 0);
          below = Math.max(below, lyric + (SPC.rowH - STAFF_ABOVE - 4 - LYRIC_BELOW)) + (lyr2.has(`${r}:${s}`) ? LYRIC_ROW2 : 0);
        }
        return { above, below, lyric, dynD: null, noteDynD: null, navD: null, tempoD: null, grooveD: null, ottD: null, ottDownD: null };
      });
      const lane0 = Math.max(TOP_LINE + 2.4, ex[0].top + 3);
      if (own) g[0].noteDynD = lane0;
      if (big) g[0].dynD = own ? lane0 + DYN_LANE : lane0;
      if (ottUp) g[0].ottD = Math.max(TOP_LINE + 4.4, ex[0].top + 3, (g[0].dynD ?? g[0].noteDynD ?? -99) + 4.4);
      if (ottDown) g[0].ottDownD = Math.min(BOTTOM_LINE - 3.2, ex[0].bot - 3.2);
      if (q.units.some((u) => u.system === s && (u.kind === "nav" || u.kind === "bar" && !!u.times && u.times > 2))) g[0].navD = Math.max(TOP_LINE + 5.4, ex[0].top + 4, (g[0].ottD ?? g[0].dynD ?? g[0].noteDynD ?? -99) + 5.2);
      const topDyn = g[0].navD ?? g[0].ottD ?? g[0].dynD ?? g[0].noteDynD;
      if (topDyn !== null) g[0].above = Math.max(g[0].above, (topDyn - TOP_LINE) / 2 + 2.2);
      if (q.p.id === owner) {
        const t = Math.max(TOP_LINE + 4.8, ex[0].top + 3, topDyn !== null ? topDyn + 4.6 : 0);
        g[0].tempoD = t;
        g[0].above = Math.max(g[0].above, (t - TOP_LINE) / 2 + 1.6);
      }
      const nGroove = q.units.filter((u) => u.system === s && u.kind === "groove").length;
      if (nGroove) {
        const t = g[0].tempoD !== null ? g[0].tempoD + 4.6 : Math.max(TOP_LINE + 4.8, ex[0].top + 3, topDyn !== null ? topDyn + 4.6 : 0);
        g[0].grooveD = t;
        g[0].above = Math.max(g[0].above, (t + (nGroove > 1 ? GROOVE_LANE : 0) - TOP_LINE) / 2 + 1.6);
      }
      return { g, ex, dyn };
    });
    const sysHOf = (G) => P(G.reduce((n2, x2, r) => n2 + (rowHost[r] >= 0 ? 0 : x2.g.reduce((m, y) => m + y.above + 4 + y.below, 0)), 0) + SYS_GAP);
    const geos = Array.from({ length: nSys }, (_, s) => geoOf(s));
    drawPaperTitle(geos.length ? sysHOf(geos[0]) : P(SPC.rowH));
    if (paper.hidden) {
      ensure(P(STUB_H));
      prims.push({ t: "text", x: P(MARGIN), y: yCur + P(STUB_H * 0.7), s: "\u8FD9\u5F20\u7EB8\u9690\u85CF\u7740\uFF1A\u4E0D\u653E\u3001\u4E0D\u8FDB\u538B\u5E73\u4EF6\uFF08\u300C\u22EF\u300D\u91CC\u663E\u793A\uFF09", cls: "part-stub hidden-note", size: P(1.1), anchor: "start" });
      yCur += P(STUB_H);
    }
    for (let s = 0; s < nSys; s++) {
      const G = geos[s];
      ensure(sysHOf(G));
      for (let r = 0; r < nR; r++) for (let k = 0; k < effStaves(r); k++) {
        const top = yCur, row = rowOf(s, r, k), g = G[r].g[k], h = g.above + 4 + g.below;
        rowTop.set(row, top);
        rowAbove.set(row, g.above);
        if (g.lyric !== null) lyricOff.set(row, g.lyric);
        const e = G[r].ex[k], lane = k === 0 ? g.navD ?? g.ottD ?? g.dynD ?? g.noteDynD : null;
        const inkAbove = Math.max(0, (e.top - TOP_LINE) / 2, lane !== null ? (lane - TOP_LINE) / 2 + 1.3 : 0);
        const inkBelow = Math.max(0, (BOTTOM_LINE - e.bot) / 2, g.lyric !== null ? g.lyric + 0.5 + (lyr2.has(`${r}:${s}`) ? LYRIC_ROW2 : 0) : 0, g.ottDownD !== null ? (BOTTOM_LINE - g.ottDownD) / 2 + 0.6 : 0);
        rows.push({ top, staffTop: top + P(g.above), bottom: top + P(h), paper: paper.id, part: parts[r].id, sys: s, staff: k + 1, inkTop: top + P(g.above - inkAbove), inkBottom: top + P(g.above + 4 + inkBelow) });
        yCur += P(h);
        if (per[r].vrt) sharedRows.push(row);
      }
      for (let r = 0; r < nR; r++) {
        if (rowHost[r] >= 0) continue;
        const x2 = G[r], r0 = rowOf(s, r, 0);
        if (x2.g[0].tempoD !== null) tempoYAt.set(r0, yOf(r0, x2.g[0].tempoD));
        if (x2.g[0].grooveD !== null) grooveYAt.set(r0, yOf(r0, x2.g[0].grooveD));
        dynYAt.set(r0, yOf(r0, x2.g[0].dynD ?? TOP_LINE + 2.4));
        noteDynYAt.set(r0, yOf(r0, x2.g[0].noteDynD ?? TOP_LINE + 2.4));
        if (x2.g[0].navD !== null) navYAt.set(r0, yOf(r0, x2.g[0].navD));
        if (x2.g[0].ottD !== null) ottYAt.set(r0, yOf(r0, x2.g[0].ottD));
        if (x2.g[0].ottDownD !== null) ottDownYAt.set(r0, yOf(r0, x2.g[0].ottDownD));
      }
      yCur += P(SYS_GAP);
    }
    const staffEnd = Array.from({ length: nSys }, (_, s) => {
      const row = placedCols.filter((c) => c.system === s);
      if (!row.length) return right;
      const last = row.reduce((a, c) => c.x > a.x || c.x === a.x && (c.slot > a.slot || c.slot === a.slot && c.n > a.n) ? c : a);
      return last.bar ? Math.min(right, last.x + 0.7) : right;
    });
    for (let s = 0; s < nSys; s++) {
      const ind = s === 0 ? ind0 : indN;
      if (song.barNumbers !== "off" && per[0]) {
        const q0 = per.find((q) => q.units.some((u) => u.kind === "chunk" && u.system === s)) ?? per[0];
        const c0 = q0.units.find((u) => u.kind === "chunk" && u.system === s);
        const num = c0 ? (c0.m ?? 0) + (q0.pickup ? 0 : 1) : null;
        if (num !== null && !(s === 0 && num <= 1)) prims.push({ t: "text", x: P(MARGIN + ind), y: yOf(rowOf(s, 0, 0), TOP_LINE + 3.2), s: String(num), cls: "bar-no", size: P(1.05), anchor: "start" });
      }
      per.forEach((q, r) => {
        if (rowHost[r] >= 0) return;
        const ten = absorbed.get(q.p.id) ?? [];
        const pr = lowOf.has(q.p.id) ? per.findIndex((x2) => x2.p.id === lowOf.get(q.p.id)) : r, rEnd = (sy) => rowOf(sy, pr, per[pr].staves - 1);
        const f = sysKeys[s].get(q.p.id) ?? q.head.key;
        for (let k = 0; k < q.staves; k++) {
          const row = rowOf(s, r, k), clef = q.staves === 2 ? k ? "F" : "G" : clefAtSys(q, s), base = baseClef(clef);
          if (rows[row]) rows[row].x1 = P(staffEnd[s]);
          const pm = pmode[r];
          for (let L = 0; L < 5; L++) {
            if (pm === "one" && L !== 2) continue;
            const y = yOf(row, BOTTOM_LINE + 2 * L);
            prims.push({ t: "line", x1: P(MARGIN + ind), y1: y, x2: P(staffEnd[s]), y2: y, w: P(ENGRAVE.staffLine), cls: "staff" });
          }
          let hx = MARGIN + ind + 0.6;
          if (pm) prims.push({ t: "glyph", x: P(hx), y: yOf(row, MID_LINE), ch: PERC_CLEF, cls: "clef perc-clef" });
          else prims.push({ t: "glyph", x: P(hx), y: yOf(row, base === "F" ? 36 : 32), ch: CLEF_GLYPH[clef], cls: "clef" });
          if (q.staves === 1 && !pm && !q.vrt) clefs.push({ kind: "start", paper: paper.id, part: q.p.id, index: clefSrcAtSys(q, s), system: row, x: P(hx - 0.3), ...staffHit(row), w: P(clefW(q) + 0.6) });
          hx += clefW(q) + 1;
          const keyX0 = hx;
          const fk = pm ? 0 : f;
          drawKeySig(row, hx, fk, "keysig", base);
          hx += Math.abs(fk) * 1.05;
          if (s === 0) {
            if (q.head.idx.key !== void 0) marks.push({ index: q.head.idx.key, kind: "key", system: row, x: P(keyX0 - 0.3), ...staffHit(row), w: P(Math.max(1.2, hx - keyX0 + 0.3)) });
            if (fk) hx += 0.8;
            const cw = drawTime(row, hx, q.head.time.beats, q.head.time.beatType, "timesig");
            if (q.head.idx.time !== void 0) marks.push({ index: q.head.idx.time, kind: "time", system: row, x: P(hx - 0.3), ...staffHit(row), w: P(cw + 0.6) });
            if (k === 0 && q.p.id === owner && q.head.idx.tempo !== void 0) drawTempo(row, MARGIN + ind + 0.6, q.head.bpm, "tempo", q.head.idx.tempo, prevBpm === null || prevBpm === q.head.bpm ? void 0 : q.head.bpm > prevBpm ? "up" : "down");
          }
        }
        if (loIds.has(q.p.id)) return;
        if (s === 0) {
          const r0 = rowOf(s, r, 0), r1 = rEnd(s), lines2 = nameLines(q.p.name, pr !== r ? 2 : q.staves), LH = PART_EM * 1.15;
          const tl = ten.map((t) => nameLines(t.name, 1)[0] ?? ""), nAll = lines2.length + tl.length;
          const ny = (yOf(r0, MID_LINE) + yOf(r1, MID_LINE)) / 2 + P(0.55 * PART_EM) - P(LH * (nAll - 1) / 2);
          const ncls = q.p.empty ? "part-name empty" : q.focused ? "part-name focus" : "part-name";
          lines2.forEach((ln, k) => prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * k), s: ln, cls: ncls, size: PART_EM * sp, anchor: "start" }));
          tl.forEach((ln, k) => prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * (lines2.length + k)), s: ln, cls: "part-name tenant", size: PART_EM * sp, anchor: "start" }));
          if (ten.length) {
            const lineTop = (i) => ny + P(LH * i) - P(PART_EM * 0.95);
            ten.forEach((t, k) => partsHit.push({ paper: paper.id, part: t.id, x: P(MARGIN - 0.4), y: lineTop(lines2.length + k), w: P(ind0 + 0.2), h: P(LH) }));
          }
          if (q.p.badges?.length) prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * (nAll - 1)) + P(1.5), s: q.p.badges.join(" "), cls: "part-badge", size: P(1), anchor: "start" });
          {
            const y02 = yOf(r0, TOP_LINE) - P(1.2), yEnd = ten.length ? ny + P(LH * lines2.length) - P(PART_EM * 0.95) : yOf(r1, BOTTOM_LINE) + P(1.2);
            partsHit.push({ paper: paper.id, part: q.p.id, x: P(MARGIN - 0.4), y: y02, w: P(ind0 + 0.2), h: yEnd - y02 });
          }
          if (q.p.colorIdx !== void 0) prims.push({ t: "rect", x: P(MARGIN - 0.95), y: ny - P(PART_EM * 0.62), w: P(0.6), h: P(0.6), cls: `cat-dot cat-${q.p.colorIdx}` });
        } else if (q.p.abbr) {
          const r0 = rowOf(s, r, 0), r1 = rEnd(s), LH = PART_EM * 1.15, ta = ten.map((t) => t.abbr ?? "");
          const ny = (yOf(r0, MID_LINE) + yOf(r1, MID_LINE)) / 2 + P(0.55 * PART_EM) - P(LH * ta.length / 2);
          prims.push({ t: "text", x: P(MARGIN), y: ny, s: q.p.abbr, cls: q.p.empty ? "part-name abbr empty" : q.focused ? "part-name abbr focus" : "part-name abbr", size: PART_EM * sp, anchor: "start" });
          ta.forEach((a, k) => {
            prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * (k + 1)), s: a, cls: "part-name abbr tenant", size: PART_EM * sp, anchor: "start" });
            partsHit.push({ paper: paper.id, part: ten[k].id, x: P(MARGIN - 0.4), y: ny + P(LH * (k + 1)) - P(PART_EM * 0.95), w: P(indN + 0.2), h: P(LH) });
          });
          if (q.p.colorIdx !== void 0) prims.push({ t: "rect", x: P(MARGIN - 0.95), y: ny - P(PART_EM * 0.62), w: P(0.6), h: P(0.6), cls: `cat-dot cat-${q.p.colorIdx}` });
          partsHit.push({ paper: paper.id, part: q.p.id, x: P(MARGIN - 0.4), y: yOf(r0, TOP_LINE) - P(1.2), w: P(indN + 0.2), h: yOf(r1, BOTTOM_LINE) - yOf(r0, TOP_LINE) + P(2.4) });
        }
        if (q.p.colorIdx !== void 0) {
          const r0 = rowOf(s, r, 0), r1 = rEnd(s);
          prims.push({ t: "rect", x: P(MARGIN + ind - 0.8), y: yOf(r0, TOP_LINE), w: P(0.3), h: yOf(r1, BOTTOM_LINE) - yOf(r0, TOP_LINE), cls: `cat-bar cat-${q.p.colorIdx}` });
        }
        if (q.staves === 2 || pr !== r) {
          const bx = P(MARGIN + ind - 0.7), y02 = yOf(rowOf(s, r, 0), TOP_LINE), y1 = yOf(rEnd(s), BOTTOM_LINE);
          prims.push({ t: "path", d: `M${bx + P(0.5)},${y02}Q${bx - P(0.3)},${y02 + P(0.6)} ${bx},${(y02 + y1) / 2}Q${bx - P(0.3)},${y1 - P(0.6)} ${bx + P(0.5)},${y1}`, cls: "brace" });
        }
      });
      if (ind > 0 && o.titlePlaceholder) for (const fam of openFams) {
        const rs = fam.ids.map((id) => per.findIndex((q) => q.p.id === id)).filter((i) => i >= 0);
        if (rs.length < 2) continue;
        const r0 = Math.min(...rs), r1 = Math.max(...rs), x2 = P(MARGIN + ind - 1.55), y02 = yOf(rowOf(s, r0, 0), TOP_LINE) - P(0.6), y1 = yOf(rowOf(s, r1, per[r1].staves - 1), BOTTOM_LINE) + P(0.6);
        prims.push({ t: "path", d: `M${x2 + P(0.55)},${y02}L${x2},${y02}L${x2},${y1}L${x2 + P(0.55)},${y1}`, cls: "family-bracket" });
        families.push({ paper: paper.id, host: fam.host, x: x2 - P(0.6), y: y02, w: P(1.3), h: y1 - y02 });
      }
      if (nRowsSys > 1) prims.push({ t: "line", x1: P(MARGIN + ind), y1: yOf(rowOf(s, 0, 0), TOP_LINE), x2: P(MARGIN + ind), y2: yOf(rowOf(s, nR - 1, per[nR - 1].staves - 1), BOTTOM_LINE), w: P(ENGRAVE.thinBar * 1.4), cls: "bar" });
    }
    {
      const q0 = per.find((q) => rowHost[per.indexOf(q)] < 0) ?? per[0];
      let t = 0, cur = null;
      for (const u of q0.units) {
        if (u.kind !== "chunk") continue;
        const m = u.m ?? 0;
        if (!cur || cur.m !== m) {
          cur = { paper: paper.id, t0: t, t1: t, row: rowOf(u.system, per.indexOf(q0), 0), x: P(u.x) };
          cur.m = m;
          measures.push(cur);
        }
        t += u.ticks;
        cur.t1 = t;
      }
      for (const x2 of measures) delete x2.m;
    }
    per.forEach((q, r) => {
      const tokens = q.tokens, focused = q.focused, v2 = rowHost[r] >= 0;
      const units = q.units, tag = v2 ? { part: q.p.id } : {};
      const dynOff = dynOverridden(tokens);
      const clefOf = (staff, index = -1) => q.staves === 2 ? staff === 2 ? "F" : "G" : baseClef((index >= 0 ? q.ds.clef[index] : void 0) ?? q.start);
      const dIdx = (p, staff, index = -1) => posD(q, p, staff, index);
      const dynRight = /* @__PURE__ */ new Map();
      const grooveRight = /* @__PURE__ */ new Map();
      const RW = (u) => rowOf(u.system, r, u.staff - 1);
      const lyricRow = (s) => rowOf(s, r, q.staves - 1);
      const navY = (s) => navYAt.get(rowOf(s, r, 0)) ?? yOf(rowOf(s, r, 0), TOP_LINE + 6);
      const navMute = (i) => navWhy(song, paper, q.p.id, tokens[i]) ? " art-mute" : "";
      const drawNav = (u) => {
        const t = tokens[u.index], y = navY(u.system), cls = "nav-mark" + navMute(u.index), tok = t.id;
        const fs = P(TEMPO_EM * 1.05), x2 = P(u.x + 0.4);
        if (t.what === "ending") {
          const ui = units.indexOf(u);
          let end = null, closed = false, fallback = null, sawNote = false;
          for (let k = ui + 1; k < units.length; k++) {
            const v = units[k];
            if (v.kind === "chunk") sawNote = true;
            if (v.kind === "bar" && (v.repeat === "end" || v.repeat === "both")) {
              end = v;
              closed = true;
              break;
            }
            if (v.kind === "nav" && tokens[v.index].what === "ending") {
              end = v;
              closed = true;
              break;
            }
            if (v.kind === "bar" && v.repeat === "start") {
              if (!fallback) fallback = v;
              break;
            }
            if (v.kind === "bar" && sawNote && !fallback) fallback = v;
          }
          if (!end) end = fallback;
          const top = y - P(1.5), h = P(1.6);
          const endX = (v, sys) => v && v.system === sys ? v.kind === "bar" ? P(v.x + (v.repeat ? 0.4 + (v.repeat === "both" ? 1.2 : 1.47) : 0.7)) : P(v.x) - P(0.3) : P(right);
          const seg2 = (sys, xa, openL, xb, hookR) => {
            const yy = sys === u.system ? top : navY(sys) - P(1.5);
            prims.push({ t: "path", d: `${openL ? `M${xa},${yy}` : `M${xa},${yy + h}L${xa},${yy}`}L${xb},${yy}${hookR ? `L${xb},${yy + h}` : ""}`, cls: "volta" + navMute(u.index) });
          };
          const endSys = end ? end.system : u.system;
          seg2(u.system, x2 - P(0.2), false, endX(endSys === u.system ? end : null, u.system), closed && endSys === u.system);
          for (let s2 = u.system + 1; s2 <= endSys; s2++) {
            const first = units.find((w) => w.system === s2);
            seg2(s2, P((first?.x ?? MARGIN) - 0.3), true, endX(s2 === endSys ? end : null, s2), closed && s2 === endSys);
          }
          prims.push({ tok, t: "text", x: x2 + P(0.3), y: top + P(1.25), s: endingLabel(t.nums), cls, size: fs, anchor: "start" });
          dyns.push({ index: u.index, kind: "nav", system: rowOf(u.system, r, 0), x: x2 - P(0.4), y: top - P(0.4), w: P(3), h: h + P(0.8) });
          return;
        }
        if (t.what === "segno" || t.what === "coda") {
          const gs = 4 * sp * 0.7;
          prims.push({ tok, t: "glyph", x: x2, y, ch: t.what === "segno" ? "\uE047" : "\uE048", cls: cls.replace("nav-mark", "nav-sign"), size: gs });
          dyns.push({ index: u.index, kind: "nav", system: rowOf(u.system, r, 0), x: x2 - P(0.3), y: y - gs * 0.8, w: gs * (t.what === "segno" ? 0.6 : 1), h: gs * 0.95 });
          return;
        }
        const label = NAV_LABEL[t.what], tw = o.measureLyric(label) * TEMPO_EM * 1.05 / LYRIC_EM, atEnd = x2 - tw > P(MARGIN + 6);
        prims.push({ tok, t: "text", x: atEnd ? x2 : x2 - P(0.2), y, s: label, cls: cls + " nav-word", size: fs, anchor: atEnd ? "end" : "start" });
        dyns.push({ index: u.index, kind: "nav", system: rowOf(u.system, r, 0), x: atEnd ? x2 - tw - P(0.3) : x2 - P(0.5), y: y - P(TEMPO_EM * 1.1), w: tw + P(0.8), h: P(TEMPO_EM * 1.5) });
      };
      const nhX = (c) => P(c.x + c.accW + 0.35);
      const pm = pmode[r], percHere = !!pm && !!q.p.perc;
      const xHead = !!q.p.xHead && !percHere;
      const percHead = (c, p) => {
        const pi = percAt(q, p), hd = (pi?.head === "custom" && pi.smufl ? PERC_SMUFL[pi.smufl] : void 0) ?? PERC_HEAD[pi?.head ?? "normal"] ?? PERC_HEAD.normal, k = c.base >= WHOLE ? 2 : c.base >= TPQ * 2 ? 1 : 0;
        return { ch: hd.ch[k], w: hd.w[k] };
      };
      const xOf = (c) => xHead || !!c.whisper;
      const nhW = (c) => P(xOf(c) ? c.base >= WHOLE ? W.noteheadXWhole : c.base >= TPQ * 2 ? W.noteheadXHalf : W.noteheadXBlack : percHere && c.pitch ? percHead(c, c.pitch).w : c.base >= WHOLE ? W.noteheadWhole : W.noteheadBlack);
      const whisperMute = (q.p.ignores ?? []).includes("whisper");
      const clsOf = (c) => [c.ghost ? "ghost" : "", c.pad ? "pad-rest" : ""].filter(Boolean).join(" ") || void 0;
      const tokOf = (c) => c.index >= 0 && !c.pad ? tokens[c.index]?.id : void 0;
      const partLyrics = [];
      const drawChunk = (c) => {
        const cls = clsOf(c), row = RW(c);
        if (!c.note) {
          if (c.pad || v2) return;
          const g = c.base >= WHOLE ? GLYPH.restWhole : c.base >= TPQ * 2 ? GLYPH.restHalf : c.base >= TPQ ? GLYPH.restQuarter : c.base >= TPQ / 2 ? GLYPH.rest8th : c.base >= TPQ / 4 ? GLYPH.rest16th : GLYPH.rest32nd;
          const ry = c.base >= WHOLE && pm !== "one" ? yOf(row, 36) : yOf(row, MID_LINE);
          prims.push({ tok: tokOf(c), t: "glyph", x: P(c.x + 0.35), y: ry, ch: g, cls: cls ? `rest ${cls}` : "rest" });
          if (c.j === 0 && c.index >= 0 && !c.pad) rests.push({ index: c.index, system: row, x: P(c.x + 0.35), y: yOf(row, MID_LINE), w: P(1.2) });
          if (c.dotted) prims.push({ tok: tokOf(c), t: "glyph", x: P(c.x + 0.35 + 1.5), y: yOf(row, 35), ch: GLYPH.augmentationDot, cls });
          return;
        }
        const ds = (c.pitches.length ? c.pitches : [c.pitch]).map((pp) => dIdx(pp, c.staff, c.index));
        const d = ds[0], y = yOf(row, d), x0 = nhX(c);
        c.accs.forEach((a, k) => {
          if (a === null || percHere) return;
          const ag = a === 1 ? GLYPH.accidentalSharp : a === -1 ? GLYPH.accidentalFlat : a === 2 ? GLYPH.accidentalDoubleSharp : a === -2 ? GLYPH.accidentalDoubleFlat : GLYPH.accidentalNatural;
          const near = c.accs.slice(0, k).some((b, kk) => b !== null && Math.abs(ds[kk] - ds[k]) < 3);
          prims.push({ tok: tokOf(c), t: "glyph", x: P(c.x + 0.2) - (near ? P(1.1) : 0) - (c.art.includes("ghost") ? P(0.6) : 0), y: yOf(row, ds[k]), ch: ag, cls });
        });
        const ledgers = /* @__PURE__ */ new Set();
        for (const dd of ds) {
          for (let L = 28; L >= dd; L -= 2) ledgers.add(L);
          for (let L = 40; L <= dd; L += 2) ledgers.add(L);
        }
        for (const L of ledgers) prims.push({ t: "line", x1: x0 - P(ENGRAVE.ledgerExt), y1: yOf(row, L), x2: x0 + nhW(c) + P(ENGRAVE.ledgerExt), y2: yOf(row, L), w: P(ENGRAVE.ledger), cls: "ledger" });
        const ng = xOf(c) ? c.base >= WHOLE ? GLYPH.noteheadXWhole : c.base >= TPQ * 2 ? GLYPH.noteheadXHalf : GLYPH.noteheadXBlack : c.base >= WHOLE ? GLYPH.noteheadWhole : c.base >= TPQ * 2 ? GLYPH.noteheadHalf : GLYPH.noteheadBlack;
        let shifted = false;
        ds.forEach((dd, k) => {
          const second = k > 0 && Math.abs(ds[k - 1] - dd) === 1 && !shifted;
          shifted = second;
          const mute = k > 0 && !!q.p.mono;
          if (c.j === 0 && k > 0) chordHeads.push({ ...tag, index: c.index, system: row, x: second ? x0 + nhW(c) * 0.95 : x0, y: yOf(row, dd), w: nhW(c) });
          const hch = percHere && !xOf(c) ? percHead(c, (c.pitches.length ? c.pitches : [c.pitch])[k]).ch : ng;
          prims.push({ tok: tokOf(c), t: "glyph", x: second ? x0 + nhW(c) * 0.95 : x0, y: yOf(row, dd), ch: hch, cls: ["note", cls ?? "", mute ? "chord-mute" : "", c.whisper && whisperMute ? "art-mute" : ""].filter(Boolean).join(" ") });
          if (c.art.includes("ghost")) {
            const hx = second ? x0 + nhW(c) * 0.95 : x0, pc = ["note-paren", cls ?? ""].filter(Boolean).join(" ");
            prims.push({ tok: tokOf(c), t: "glyph", x: hx - P(0.6), y: yOf(row, dd), ch: "\uE0F5", cls: pc });
            prims.push({ tok: tokOf(c), t: "glyph", x: hx + nhW(c) + P(0.25), y: yOf(row, dd), ch: "\uE0F6", cls: pc });
          }
        });
        if (c.dotted) prims.push({ tok: tokOf(c), t: "glyph", x: x0 + nhW(c) + P(0.3), y: yOf(row, d % 2 === 0 ? d + 1 : d), ch: GLYPH.augmentationDot, cls });
        if (c.j === 0) notes.push({ ...tag, index: c.index, system: row, x: x0, y, w: nhW(c), d: diatonicIndex(c.pitch) });
        if (c.j === 0 && !c.tie) {
          const fit = lyrPlan.get(`${r}:${c.index}`), ly0 = lyricY(lyricRow(c.system)), cx0 = x0 + nhW(c) / 2;
          const ly = ly0 + (fit?.row ? P(LYRIC_ROW2) : 0), cx = cx0 + (fit ? P(fit.dx) : 0);
          partLyrics.push({ index: c.index, system: row, x: cx, y: ly, ...fit?.tight ? { tight: true } : {} });
          if (c.lyric === MELISMA_MARK) prims.push({ t: "line", x1: x0 - P(0.6), y1: ly0, x2: x0 + nhW(c) + P(0.4), y2: ly0, w: P(0.12), cls: "melisma" });
          else if (c.lyric) prims.push({ tok: tokOf(c), t: "text", x: cx, y: ly, s: lyricShow(c.lyric), ...fit && fit.scale < 1 ? { size: P(LYRIC_EM * fit.scale) } : {}, cls: ["lyric", q.p.lyricMute?.has(tokens[c.index]?.id ?? -1) || fit?.tight ? "lyric-mute" : "", fit?.tight ? "lyric-tight" : "", cls ?? ""].filter(Boolean).join(" ") });
        }
      };
      for (const u of units) {
        const row = RW(u);
        if (u.kind === "phrase") {
          prims.push({ t: "text", x: P(u.x + 0.1), y: lyricY(lyricRow(u.system)), s: "\u3002", cls: "phrase-mark", size: P(1.3), anchor: "start" });
          continue;
        }
        if (u.kind === "dyn") {
          const dr = rowOf(u.system, r, 0), [cl0, cr0] = DYN_INK[u.value];
          let dy = dynYAt.get(dr) ?? yOf(row, TOP_LINE + 2.4);
          const lx = P(u.x + 0.3 + cl0), prev = dynRight.get(dr);
          if (prev !== void 0 && lx < prev + P(0.3)) dy += dy < yOf(dr, MID_LINE) ? -P(1.9) : P(1.9);
          else dynRight.set(dr, P(u.x + 0.3 + cr0));
          prims.push({ t: "glyph", x: P(u.x + 0.3), y: dy, ch: DYN_GLYPH[u.value], tok: tokens[u.index].id, cls: "dyn" + (dynOff.has(u.index) ? " art-mute" : "") });
          const [il, ir, iu, id] = DYN_INK[u.value];
          dyns.push({ index: u.index, kind: "dyn", system: dr, x: P(u.x + 0.3 + il - 0.3), y: dy - P(iu + 0.4), w: P(ir - il + 0.6), h: P(iu + id + 0.8) });
          continue;
        }
        if (u.kind === "groove") {
          const gt = tokens[u.index], gr = rowOf(u.system, r, 0), label = grooveLabel(gt), known = !!grooveStyle(gt.style);
          const fs = TEMPO_EM * sp, gw = o.measureLyric(label) * TEMPO_EM / LYRIC_EM, gx = P(u.x + 0.3);
          const lanes = grooveRight.get(gr) ?? [-Infinity, -Infinity], lane = gx >= lanes[0] + P(0.8) ? 0 : 1;
          lanes[lane] = gx + gw;
          grooveRight.set(gr, lanes);
          const gy = (grooveYAt.get(gr) ?? staffTop(gr) - P(2.4)) - lane * P(GROOVE_LANE / 2);
          prims.push({ t: "text", x: gx, y: gy, s: label, tok: gt.id, cls: ["groove-mark", known ? "" : "groove-unknown"].filter(Boolean).join(" "), size: fs, anchor: "start" });
          dyns.push({ index: u.index, kind: "groove", system: gr, x: P(u.x), y: gy - P(TEMPO_EM * 1.1), w: gw + P(0.6), h: P(TEMPO_EM * 1.5) });
          continue;
        }
        if (u.kind === "head") continue;
        if (v2 && (u.kind === "bar" || u.kind === "key" || u.kind === "time")) continue;
        if (u.kind === "bar" || u.kind === "key" || u.kind === "time") {
          for (let k = 0; k < q.staves; k++) {
            const rr = rowOf(u.system, r, k), clef = clefOf(k + 1, u.index), sh = clef === "F" ? 12 : 0;
            if (u.kind === "bar") bars.push({ system: rr, x: P(u.x + 0.7) });
            if (u.kind === "bar" && u.repeat) {
              prims.push({ t: "glyph", x: P(u.x + 0.4), y: yOf(rr, BOTTOM_LINE), ch: u.repeat === "start" ? "\uE040" : u.repeat === "end" ? "\uE041" : "\uE042", cls: "repeat-bar" + navMute(u.index), tok: tokens[u.index].id });
              if (u.times && u.times > 2 && k === 0) prims.push({ t: "text", x: P(u.x + 0.4 + (u.repeat === "both" ? 1.2 : 1.47)), y: navY(u.system), s: `\xD7${u.times}`, cls: "nav-mark" + navMute(u.index), size: P(TEMPO_EM * 1.05), anchor: "end" });
            } else if (u.kind === "bar") {
              const bx = P(u.x + 0.7), bcls = u.auto ? "bar auto" : "bar";
              const [bt, bb] = pmode[r] === "one" ? [MID_LINE + 2, MID_LINE - 2] : [TOP_LINE, BOTTOM_LINE];
              prims.push({ t: "line", x1: bx, y1: yOf(rr, bt), x2: bx, y2: yOf(rr, bb), w: P(ENGRAVE.thinBar), cls: bcls });
              if (u.style === "double") prims.push({ t: "line", x1: bx + P(0.45), y1: yOf(rr, bt), x2: bx + P(0.45), y2: yOf(rr, bb), w: P(ENGRAVE.thinBar), cls: bcls });
              if (u.style === "final") prims.push({ t: "line", x1: bx + P(0.6), y1: yOf(rr, bt), x2: bx + P(0.6), y2: yOf(rr, bb), w: P(0.5), cls: bcls });
              if (u.warn && k === 0) prims.push({ t: "rect", x: bx - P(0.3), y: yOf(rr, TOP_LINE) - P(1.6), w: P(0.6), h: P(0.6), cls: "warn" });
            } else if (u.kind === "key") {
              if (pmode[r]) {
                marks.push({ index: u.index, kind: "key", system: rr, x: P(u.x), ...staffHit(rr), w: P(Math.max(u.w, 1.6)) });
                continue;
              }
              const cls = "keysig";
              if (u.fifths === 0) {
                const pos = u.prev > 0 ? SHARP_POS : FLAT_POS;
                for (let j = 0; j < Math.abs(u.prev); j++) prims.push({ t: "glyph", x: P(u.x + 0.4 + j * 0.8), y: yOf(rr, pos[j] - (sh ? 2 : 0)), ch: GLYPH.accidentalNatural, cls });
              } else drawKeySig(rr, u.x + 0.4, u.fifths, cls, clef);
              if (u.fifths === 0 && u.prev === 0 && k === 0) prims.push({ t: "text", x: P(u.x + 0.2), y: staffTop(rr) - P(0.8), s: `1=${KEY_LABEL[0]}`, cls: `${cls} key-label`, size: TEMPO_EM * sp * 0.85, anchor: "start" });
              marks.push({ index: u.index, kind: "key", system: rr, x: P(u.x), ...staffHit(rr), w: P(Math.max(u.w, 1.6)) });
            } else {
              const cls = "timesig";
              drawTime(rr, u.x + 0.6, u.beats, u.beatType, cls);
              marks.push({ index: u.index, kind: "time", system: rr, x: P(u.x), ...staffHit(rr), w: P(u.w) });
            }
          }
          continue;
        }
        if (u.kind === "tempo") {
          if (q.p.id === owner) drawTempo(row, u.x + 0.3, u.bpm, "tempo", u.index);
          continue;
        }
        if (u.kind === "hairpin") continue;
        if (u.kind === "nav") {
          drawNav(u);
          continue;
        }
        if (u.kind === "ottava") continue;
        if (u.kind === "clef") {
          if (q.staves === 2) continue;
          const first = !units.some((x2) => x2.system === u.system && x2.index >= 0 && x2.index < u.index && x2.kind !== "ottava");
          const base = baseClef(u.clef), cls = "clef cue";
          if (!first) prims.push({ t: "glyph", x: P(u.x + 0.35), y: yOf(row, base === "F" ? 36 : 32), ch: CLEF_GLYPH[u.clef], cls, size: P(4 * CLEF_CUE) });
          clefs.push({ kind: "mid", paper: paper.id, part: q.p.id, index: u.index, system: row, x: P(u.x), ...staffHit(row), w: P(Math.max(u.w, 1.6)) });
          continue;
        }
        drawChunk(u);
      }
      if (q.staves === 1) {
        const SIG = { 1: GLYPH.ottavaAlta, 2: GLYPH.quindicesimaAlta, [-1]: GLYPH.ottavaBassa };
        const SIG_W = { 1: 3.54, 2: 5.26, [-1]: 3.36 };
        for (let sy = 0; sy < nSys; sy++) {
          const row0 = rowOf(sy, r, 0);
          const us = units.filter((x2) => x2.system === sy && x2.kind === "chunk").sort((a, b) => a.x - b.x);
          let k = 0;
          while (k < us.length) {
            const v = q.ds.ott[us[k].index] ?? 0;
            if (!v) {
              k++;
              continue;
            }
            const isAuto = !!q.ds.auto?.[us[k].index];
            let e = k;
            while (e + 1 < us.length && (q.ds.ott[us[e + 1].index] ?? 0) === v && !!q.ds.auto?.[us[e + 1].index] === isAuto) e++;
            const up = v > 0, y = up ? ottYAt.get(row0) : ottDownYAt.get(row0);
            if (y !== void 0) {
              const prevIdx = us[k].index - 1, cont = k === 0 && prevIdx >= 0 && (q.ds.ott[prevIdx] ?? 0) === v && units.some((x2) => x2.index >= 0 && x2.index <= prevIdx && x2.system < sy);
              const nextU = us[e + 1], lastIdx = us[e].index, endsHere = !!nextU || (q.ds.ott[lastIdx + 1] ?? 0) !== v || lastIdx + 1 >= q.tokens.length || !units.some((x2) => x2.system > sy && x2.index > lastIdx);
              const x0 = P(us[k].x - 0.2), x1 = P(us[e].x + us[e].w - 0.3), sz = P(4 * 0.85), gw = P(SIG_W[v] * 0.85);
              const src = units.find((x2) => x2.kind === "ottava" && x2.index <= us[k].index && (q.ds.ott[x2.index] ?? 0) === v && x2.system === sy) ?? null;
              if (cont) prims.push({ t: "text", x: x0, y: y + P(0.5), s: `(${v === 2 ? "15ma" : v > 0 ? "8va" : "8vb"})`, cls: "ottava cont", size: P(1.3), anchor: "start" });
              else prims.push({ t: "glyph", x: x0, y: y + P(up ? 0.4 : 0.4), ch: SIG[v], cls: isAuto ? "ottava auto" : "ottava", size: sz });
              const lx = x0 + (cont ? P(4.2) : gw) + P(0.4), ly = y - P(up ? 0.55 : 0.55);
              for (let x2 = lx; x2 + P(0.6) <= x1; x2 += P(1)) prims.push({ t: "line", x1: x2, y1: ly, x2: x2 + P(0.6), y2: ly, w: P(0.1), cls: "ottava-line" });
              if (endsHere) prims.push({ t: "line", x1, y1: ly, x2: x1, y2: ly + P(up ? 1.1 : -1.1), w: P(0.1), cls: "ottava-line" });
              const hitIdx = src ? src.index : (() => {
                for (let i = us[k].index; i >= 0; i--) if (q.tokens[i]?.kind === "ottava") return i;
                return -1;
              })();
              const run2 = isAuto ? q.ds.runs.find((rr) => us[k].index >= rr.from && us[k].index <= rr.to) : void 0;
              if (q.vrt) {
              } else if (run2) clefs.push({ kind: "ottava", paper: paper.id, part: q.p.id, index: -1, run: run2, system: row0, x: x0, y: y - P(1.6), w: Math.max(gw, P(3)), h: P(2.2) });
              else if (hitIdx >= 0) clefs.push({ kind: "ottava", paper: paper.id, part: q.p.id, index: hitIdx, system: row0, x: x0, y: y - P(1.6), w: Math.max(gw, P(3)), h: P(2.2) });
            }
            k = e + 1;
          }
        }
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
        else if (u.kind === "bar" || u.kind === "key" || u.kind === "time") chunksInOrder.push(null);
      }
      for (const u of chunksInOrder) {
        if (!u || !u.note || u.base >= WHOLE) {
          endGroup();
          continue;
        }
        const dsU = (u.pitches.length ? u.pitches : [u.pitch]).map((pp) => dIdx(pp, u.staff, u.index));
        const s = { c: u, x0: nhX(u), y: yOf(RW(u), dsU[0]), d: dsU[0], yLow: yOf(RW(u), dsU[dsU.length - 1]), dLow: dsU[dsU.length - 1] };
        if (u.base > TPQ / 2) {
          endGroup();
          stemmed.push([s]);
          continue;
        }
        const beat = Math.floor(u.inBar / u.beat);
        if (group.length && (beat !== groupBeat || u.system !== groupSys || u.staff !== group[0].c.staff)) endGroup();
        group.push(s);
        groupBeat = beat;
        groupSys = u.system;
      }
      endGroup();
      const stemCls = (s) => clsOf(s.c);
      const upOf = /* @__PURE__ */ new Map();
      const tipOf = /* @__PURE__ */ new Map();
      for (const g of stemmed) {
        const row = RW(g[0].c), mid = yOf(row, MID_LINE);
        const up = v2 ? false : hasV2[r] ? true : percHere ? pm === "one" || g.some((s) => (s.c.pitches.length ? s.c.pitches : [s.c.pitch]).some((p) => percAt(q, p)?.stem !== "down")) : g.reduce((a, s) => a + (s.d + s.dLow) / 2, 0) / g.length < MID_LINE;
        for (const s of g) upOf.set(s.c, up);
        const sx = (s) => up ? s.x0 + P(STEM_UP_SE[0] - ENGRAVE.stem / 2) : s.x0 + P(STEM_DOWN_NW[0] + ENGRAVE.stem / 2);
        const sy0 = (s) => up ? s.yLow - P(STEM_UP_SE[1]) : s.y - P(STEM_DOWN_NW[1]);
        if (g.length === 1) {
          const s = g[0];
          let tip = up ? s.y - P(3.5) : s.yLow + P(3.5);
          if (up && s.d < 27) tip = Math.min(tip, mid);
          if (!up && s.dLow > 41) tip = Math.max(tip, mid);
          tipOf.set(s.c, tip);
          prims.push({ tok: tokOf(s.c), t: "line", x1: sx(s), y1: sy0(s), x2: sx(s), y2: tip, w: P(ENGRAVE.stem), cls: stemCls(s) });
          const lv = flagLevel(s.c.base);
          if (lv > 0) {
            const fx = sx(s) - P(ENGRAVE.stem / 2);
            const fg = up ? [GLYPH.flag8thUp, GLYPH.flag16thUp, GLYPH.flag32ndUp][lv - 1] : [GLYPH.flag8thDown, GLYPH.flag16thDown, GLYPH.flag32ndDown][lv - 1];
            prims.push({ tok: tokOf(s.c), t: "glyph", x: fx, y: up ? tip + P(FLAG_ANCHOR_UP[lv]) : tip + P(FLAG_ANCHOR_DOWN[lv]), ch: fg, cls: stemCls(s) });
          }
          continue;
        }
        const xa = sx(g[0]), xb = sx(g[g.length - 1]);
        const k = Math.max(-0.2, Math.min(0.2, (g[g.length - 1].y - g[0].y) / (xb - xa) * 0.5));
        const at = (xx, yy0) => yy0 + k * (xx - xa);
        const yb0 = up ? Math.min(...g.map((s) => s.y - P(3.5) - k * (sx(s) - xa))) : Math.max(...g.map((s) => s.yLow + P(3.5) - k * (sx(s) - xa)));
        for (const s of g) {
          tipOf.set(s.c, at(sx(s), yb0));
          prims.push({ tok: tokOf(s.c), t: "line", x1: sx(s), y1: sy0(s), x2: sx(s), y2: at(sx(s), yb0), w: P(ENGRAVE.stem), cls: stemCls(s) });
        }
        const step = P(ENGRAVE.beam + ENGRAVE.beamGap) * (up ? 1 : -1), th = P(ENGRAVE.beam) * (up ? 1 : -1);
        const beamPath = (xL, xR, lvl) => {
          const of = step * lvl;
          const a = at(xL, yb0) + of, b = at(xR, yb0) + of;
          return `M${xL - P(ENGRAVE.stem / 2)},${a}L${xR + P(ENGRAVE.stem / 2)},${b}L${xR + P(ENGRAVE.stem / 2)},${b + th}L${xL - P(ENGRAVE.stem / 2)},${a + th}Z`;
        };
        const gcls = ["beam", g.every((s) => s.c.ghost) ? "ghost" : ""].filter(Boolean).join(" ");
        prims.push({ t: "path", d: beamPath(xa, xb, 0), cls: gcls });
        const maxLv = Math.max(...g.map((s) => flagLevel(s.c.base)));
        for (let lvl = 2; lvl <= maxLv; lvl++) {
          let runStart = -1;
          for (let n2 = 0; n2 <= g.length; n2++) {
            const has = n2 < g.length && flagLevel(g[n2].c.base) >= lvl;
            if (has && runStart < 0) runStart = n2;
            if (!has && runStart >= 0) {
              const L = runStart, R = n2 - 1;
              if (L === R) {
                const stub = P(1.1), toRight = L < g.length - 1;
                prims.push({ t: "path", d: beamPath(toRight ? sx(g[L]) : sx(g[L]) - stub, toRight ? sx(g[L]) + stub : sx(g[L]), lvl - 1), cls: gcls });
              } else prims.push({ t: "path", d: beamPath(sx(g[L]), sx(g[R]), lvl - 1), cls: gcls });
              runStart = -1;
            }
          }
        }
      }
      const ign = new Set(q.p.ignores ?? []);
      for (const c of units) {
        if (c.kind !== "chunk" || !c.note || !c.art.length && !c.breath) continue;
        const row = RW(c), cls = clsOf(c), cx = nhX(c) + nhW(c) / 2;
        const dsC = (c.pitches.length ? c.pitches : [c.pitch]).map((pp) => dIdx(pp, c.staff, c.index)), dHi = dsC[0], dLo = dsC[dsC.length - 1];
        const below = upOf.get(c) ?? false, sgn = below ? -1 : 1;
        const inStaff = (d2) => d2 >= BOTTOM_LINE && d2 <= TOP_LINE;
        let d = below ? dLo - 2 : dHi + 2;
        const artCls = (a) => ["art", ign.has(a) ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ");
        for (const a of ["staccato", "tenuto"].filter((x2) => c.art.includes(x2))) {
          if (inStaff(d) && d % 2 === 0) d += sgn;
          const m = ART_GLYPH[a], g = below ? m.below : m.above;
          prims.push({ tok: tokOf(c), t: "glyph", x: cx - P(m.w / 2), y: yOf(row, d) + (below ? -P(m.h / 2) : P(m.h / 2)), ch: g, cls: artCls(a) });
          d += sgn * 2;
        }
        let yS = Math.min(yOf(row, TOP_LINE + 2), below ? (tipOf.get(c) ?? yOf(row, dHi + 7)) - P(1.1) : yOf(row, d));
        for (const a of ["accent", "marcato", "stress", "unstress"].filter((x2) => c.art.includes(x2))) {
          const m = ART_GLYPH[a];
          prims.push({ tok: tokOf(c), t: "glyph", x: cx - P(m.w / 2), y: yS + P(m.h / 2), ch: m.above, cls: artCls(a) });
          yS -= P(1.5);
        }
        const swl = c.j === 0 ? swellOf(tokens[c.index]) : void 0;
        if (swl) {
          const y = (noteDynYAt.get(rowOf(c.system, r, 0)) ?? yOf(RW(c), TOP_LINE + 2.4)) - P(0.5), xa = nhX(c) + (c.art.some((a) => a === "sfz" || a === "fp") ? P(2.4) : 0), xb = Math.max(xa + P(1.6), nhX(c) + P(c.w) - P(0.8)), H2 = P(0.35);
          const cl = ["hairpin", ign.has(swl === ">" ? "swellFade" : "swellGrow") ? "art-mute" : ""].filter(Boolean).join(" "), mx = (xa + xb) / 2;
          const d2 = swl === "<" ? `M${xb},${y - H2}L${xa},${y}L${xb},${y + H2}` : swl === ">" ? `M${xa},${y - H2}L${xb},${y}L${xa},${y + H2}` : `M${xa},${y}L${mx},${y - H2}L${xb},${y}M${xa},${y}L${mx},${y + H2}L${xb},${y}`;
          prims.push({ t: "path", d: d2, cls: cl });
        }
        if (c.art.includes("arpeggio")) {
          const yTop = yOf(row, dHi) - P(0.7), yBot = yOf(row, dLo) + P(0.7), x0 = nhX(c) - P(c.accW + 0.9), amp = P(0.28), step = P(0.5);
          let dd = `M${x0},${yBot}`;
          for (let y = yBot, k = 0; y > yTop; y -= step, k++) dd += `Q${x0 + (k % 2 ? -amp : amp) * 2},${y - step / 2} ${x0},${Math.max(yTop, y - step)}`;
          prims.push({ tok: tokOf(c), t: "path", d: dd, cls: ["arpeggio", ign.has("arpeggio") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
        }
        for (const a of ["sfz", "fp"].filter((x2) => c.art.includes(x2)))
          prims.push({ tok: tokOf(c), t: "glyph", x: nhX(c) - P(0.2), y: noteDynYAt.get(rowOf(c.system, r, 0)) ?? yOf(RW(c), TOP_LINE + 2.4), ch: a === "sfz" ? "\uE539" : "\uE534", cls: ["dyn", ign.has(a) ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
        if (c.breath) prims.push({ tok: tokOf(c), t: "glyph", x: nhX(c) + nhW(c) + P(0.55), y: yOf(row, TOP_LINE + 1), ch: GLYPH_BREATH, cls: ["breath", ign.has("breath") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
        if (c.breath && c.inhale) prims.push({ tok: tokOf(c), t: "text", x: nhX(c) + nhW(c) + P(1.35), y: yOf(row, TOP_LINE + 1) + P(0.45), s: c.inhale === "big" ? "\u6DF1\u5438" : "\u5438", cls: ["breath-label", ign.has("inhale") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" "), size: P(1.15), anchor: "start" });
      }
      const tieArc = (row, d, x1, x2, ghost) => {
        const sgn = d < MID_LINE ? 1 : -1, y = yOf(row, d) + sgn * P(0.8), h = Math.min(P(1), Math.abs(x2 - x1) * 0.25);
        prims.push({ t: "path", d: `M${x1},${y}Q${(x1 + x2) / 2},${y + sgn * h} ${x2},${y}`, cls: ghost ? "tie ghost" : "tie" });
      };
      const tieBetween = (a, b) => {
        if (a.staff !== b.staff || !a.pitch || !b.pitch) return;
        const da = dIdx(a.pitch, a.staff, a.index), db = dIdx(b.pitch, b.staff, b.index);
        if (a.system === b.system) {
          tieArc(RW(b), db, nhX(a) + nhW(a) * 0.8, nhX(b) + nhW(b) * 0.2, b.ghost);
          return;
        }
        tieArc(RW(a), da, nhX(a) + nhW(a) * 0.8, Math.max(nhX(a) + nhW(a) * 0.8 + P(2), P(right) - P(0.3)), b.ghost);
        tieArc(RW(b), db, Math.max(P((sysStarts[b.system] ?? 0) - 1.6), nhX(b) - P(3)), nhX(b) + nhW(b) * 0.2, b.ghost);
      };
      const realChunks = units.filter((u) => u.kind === "chunk");
      for (let n2 = 1; n2 < realChunks.length; n2++) {
        const a = realChunks[n2 - 1], b = realChunks[n2];
        if (!a.note || !b.note) continue;
        if (b.j > 0 && a.index === b.index || b.tie && a.last) tieBetween(a, b);
      }
      const headOf = /* @__PURE__ */ new Map();
      for (const c of realChunks) if (c.note && c.j === 0 && !headOf.has(c.index)) headOf.set(c.index, c);
      const noteIdx = [...headOf.keys()].sort((x2, y) => x2 - y), slurOf = (k) => !!tokens[noteIdx[k]].slur;
      const ext = (c, below) => {
        const ds = (c.pitches.length ? c.pitches : [c.pitch]).map((pp) => dIdx(pp, c.staff, c.index));
        return yOf(RW(c), below ? Math.min(...ds) : Math.max(...ds));
      };
      for (let k = 0; k < noteIdx.length; k++) {
        if (!slurOf(k) || k > 0 && slurOf(k - 1)) continue;
        let e = k;
        while (e < noteIdx.length - 1 && slurOf(e)) e++;
        if (e === k) continue;
        const run2 = noteIdx.slice(k, e + 1).map((x2) => headOf.get(x2)).filter((c) => c.pitch), below = upOf.get(run2[0]) ?? false, sgn = below ? 1 : -1;
        const groups = [];
        for (const c of run2) {
          const g = groups[groups.length - 1];
          if (g && g[0].system === c.system) g.push(c);
          else groups.push([c]);
        }
        groups.forEach((g, gi) => {
          const f = g[0], l = g[g.length - 1], openL = gi > 0, openR = gi < groups.length - 1;
          const xa = openL ? nhX(f) - P(2) : nhX(f) + nhW(f) / 2, xb = openR ? nhX(l) + nhW(l) + P(2) : nhX(l) + nhW(l) / 2;
          if (xb - xa < P(1)) return;
          const ya = ext(f, below) + sgn * P(1.2), yb = ext(l, below) + sgn * P(1.2);
          const peak = g.map((c) => ext(c, below) + sgn * P(2.2)), cy = below ? Math.max(ya, yb, ...peak) + P(0.6) : Math.min(ya, yb, ...peak) - P(0.6);
          prims.push({ t: "path", d: `M${xa},${ya}C${xa + (xb - xa) * 0.2},${cy} ${xb - (xb - xa) * 0.2},${cy} ${xb},${yb}`, cls: ["slur", ign.has("slur") ? "art-mute" : ""].filter(Boolean).join(" ") });
        });
      }
      const LEVELS = DYNS;
      const lastChunk = [...units].reverse().find((u) => u.kind === "chunk");
      const drawWedge = (index, dir, s0, startX, s1, endX, ramp) => {
        const leftOf = (sy) => Math.min(...units.filter((u) => u.kind === "chunk" && u.system === sy).map((c) => nhX(c)), P(right)) - P(1);
        const segs = [];
        for (let sy = s0; sy <= s1; sy++) segs.push([sy, sy === s0 ? startX : leftOf(sy), sy === s1 ? endX : P(right) - P(0.3)]);
        const total = segs.reduce((n2, [, a, b]) => n2 + Math.max(0, b - a), 0) || 1, H2 = P(0.5);
        const midY = (sy) => (dynYAt.get(rowOf(sy, r, 0)) ?? yOf(rowOf(sy, r, 0), TOP_LINE + 2.4)) - P(0.5);
        if (total > P(right - MARGIN)) {
          const word = dir === "cresc" ? "cresc." : "dim.", ww = P(PIN_WORD.w[dir === "cresc" ? "cresc" : "dim"]);
          let said = false;
          for (const [sy, a0, b] of segs) {
            if (b - a0 < P(0.3)) continue;
            let a = a0;
            if (!said && b - a >= ww + P(1)) {
              prims.push({ t: "text", x: a, y: midY(sy) + P(0.5), s: word, tok: tokens[index].id, cls: ["dyn-word", ramp ? "ramp" : ""].filter(Boolean).join(" "), size: P(PIN_WORD.size), anchor: "start" });
              a += ww + P(0.6);
              said = true;
            }
            for (let x2 = a; x2 + P(DASH.len) <= b; x2 += P(DASH.len + DASH.gap)) prims.push({ t: "line", x1: x2, y1: midY(sy), x2: x2 + P(DASH.len), y2: midY(sy), w: P(0.12), cls: "dyn-dash" });
            dyns.push({ index, kind: "hairpin", system: rowOf(sy, r, 0), x: a0, y: midY(sy) - P(1.4), w: b - a0, h: P(2.8) });
          }
        } else {
          let acc2 = 0;
          for (const [sy, a, b] of segs) {
            if (b - a < P(0.3)) continue;
            const f0 = acc2 / total, f1 = (acc2 + b - a) / total;
            acc2 += b - a;
            const [h0, h1] = dir === "cresc" ? [H2 * f0, H2 * f1] : [H2 * (1 - f0), H2 * (1 - f1)], y = midY(sy);
            let d = `M${a},${y - h0}L${b},${y - h1}M${a},${y + h0}L${b},${y + h1}`;
            if (ramp) {
              const hAt = (x2) => h0 + (h1 - h0) * ((x2 - a) / (b - a)), on = P(RAMP_DASH.len), per2 = P(RAMP_DASH.len + RAMP_DASH.gap);
              d = "";
              for (let x2 = a; x2 < b - P(0.05); x2 += per2) {
                const x22 = Math.min(b, x2 + on);
                d += `M${x2},${y - hAt(x2)}L${x22},${y - hAt(x22)}M${x2},${y + hAt(x2)}L${x22},${y + hAt(x22)}`;
              }
            }
            prims.push({ tok: tokens[index].id, t: "path", d, cls: ["hairpin", ramp ? "ramp" : ""].filter(Boolean).join(" ") });
            dyns.push({ index, kind: "hairpin", system: rowOf(sy, r, 0), x: a, y: y - P(1.4), w: b - a, h: P(2.8) });
          }
        }
      };
      units.forEach((h, hi) => {
        if (h.kind !== "hairpin" || !lastChunk) return;
        const prevU = units[hi - 1];
        const dynBefore = prevU && prevU.kind === "dyn" && prevU.system === h.system ? prevU : null;
        const startX = Math.max(P(h.x + 0.3), dynBefore ? P(dynBefore.x + 0.3 + DYN_INK[dynBefore.value][1] + PIN_GAP) : 0), s0 = h.system;
        const endU = units.slice(hi + 1).find((u) => u.kind === "dyn" || u.kind === "hairpin");
        let curDyn = "mf";
        for (let j = h.index - 1; j >= 0; j--) {
          const u = tokens[j];
          if (u.kind === "dyn") {
            curDyn = u.value;
            break;
          }
        }
        const ci = LEVELS.indexOf(curDyn), against = !!endU && endU.kind === "dyn" && (h.dir === "cresc" ? LEVELS.indexOf(endU.value) <= ci : LEVELS.indexOf(endU.value) >= ci);
        const IMPLIED_W = 3;
        const endX = endU ? P(endU.x + 0.3 + (endU.kind === "dyn" ? DYN_INK[endU.value][0] : 0) - PIN_GAP - (against ? IMPLIED_W + 0.4 : 0)) : nhX(lastChunk) + nhW(lastChunk) + P(0.8), s1 = endU ? endU.system : lastChunk.system;
        if (s1 < s0) return;
        let endXd = endX, labelAbove = false;
        const MIN_PIN = P(1.4);
        if (s1 === s0 && endXd - startX < MIN_PIN) {
          const roomy = against ? endXd + P(IMPLIED_W + 0.4) : endXd;
          if (against) labelAbove = true;
          endXd = Math.max(startX + MIN_PIN, Math.min(roomy, startX + MIN_PIN * 2));
        }
        drawWedge(h.index, h.dir, s0, startX, s1, endXd, false);
        if (!endU || against) {
          const k = Math.max(0, Math.min(LEVELS.length - 1, ci + (h.dir === "cresc" ? 1 : -1)));
          prims.push({ t: "text", x: labelAbove ? endXd - P(1.2) : endXd + P(0.4), y: (dynYAt.get(rowOf(s1, r, 0)) ?? yOf(rowOf(s1, r, 0), TOP_LINE + 2.4)) + P(labelAbove ? -1.9 : 0.1), s: `(${LEVELS[k]})`, cls: "dyn-implied", size: P(1.3), anchor: "start" });
        }
      });
      for (const u of units) {
        if (u.kind !== "dyn" || !tokens[u.index].ramp) continue;
        const src = rampSource(tokens, u.index);
        if (typeof src !== "number") continue;
        const pu = units.find((x2) => x2.kind === "dyn" && x2.index === src);
        if (!pu) continue;
        const a = LEVELS.indexOf(pu.value), b = LEVELS.indexOf(u.value);
        if (a === b) continue;
        const sx = P(pu.x + 0.3 + DYN_INK[pu.value][1] + PIN_GAP);
        let ex = P(u.x + 0.3 + DYN_INK[u.value][0] - PIN_GAP);
        if (u.system === pu.system && ex - sx < P(1.4)) ex = sx + P(1.4);
        if (u.system < pu.system) continue;
        drawWedge(u.index, b > a ? "cresc" : "dim", pu.system, sx, u.system, ex, true);
      }
      for (let n2 = 0; n2 < partLyrics.length; n2++) {
        const L = partLyrics[n2], tok = tokens[L.index];
        if (!tok.hyph) continue;
        const R = partLyrics[n2 + 1];
        const xx = R && R.system === L.system ? (L.x + R.x) / 2 : L.x + P(1.6);
        prims.push({ t: "text", x: xx, y: L.y, s: "-", cls: "lyric hyphen" });
      }
      lyrics.push(...partLyrics);
      const bracket = (cs2, openL, openR, num) => {
        const row = RW(cs2[0]), n2 = cs2[0].ratio[0];
        const xa = openL ? Math.min(nhX(cs2[0]) - P(1.2), nhX(cs2[0])) : nhX(cs2[0]), last = cs2[cs2.length - 1], xb = openR ? nhX(last) + nhW(last) + P(1.2) : nhX(last) + nhW(last);
        const top = Math.min(...cs2.map((c) => Math.min(c.pitch ? yOf(row, dIdx(c.pitch, c.staff, c.index)) : yOf(row, MID_LINE), tipOf.get(c) ?? Infinity)), yOf(row, TOP_LINE)) - P(1.6);
        const mid = (xa + xb) / 2, gap = num ? P(1) : 0;
        const left = openL ? `M${xa},${top}` : `M${xa},${top + P(0.6)}L${xa},${top}`, right2 = openR ? `L${xb},${top}` : `L${xb},${top}L${xb},${top + P(0.6)}`;
        prims.push({ t: "path", d: num ? `${left}L${mid - gap},${top}M${mid + gap},${top}${right2}` : `${left}${right2}`, cls: "tuplet-bracket" });
        if (num) prims.push({ t: "glyph", x: mid - P(0.55), y: top + P(0.55), ch: GLYPH_TUPLET(n2), cls: "tuplet" });
      };
      let run = [], runRatio = null, acc = 0, minBase = Infinity, segStart = 0;
      const flushSeg = (openR) => {
        const cs2 = run.slice(segStart);
        if (cs2.length && cs2[0].ratio) bracket(cs2, segStart > 0, openR, segStart === 0);
        segStart = run.length;
      };
      const closeRun = () => {
        if (run.length) flushSeg(false);
        run = [];
        runRatio = null;
        acc = 0;
        minBase = Infinity;
        segStart = 0;
      };
      for (const c of realChunks) {
        const rr = c.ratio ? c.ratio.join(":") : null;
        if (rr !== runRatio || run.length && c.staff !== run[0].staff) closeRun();
        else if (run.length && c.system !== run[run.length - 1].system) flushSeg(true);
        if (!rr) continue;
        run.push(c);
        runRatio = rr;
        acc += c.ticks;
        minBase = Math.min(minBase, c.base);
        if (acc >= c.ratio[1] * minBase - 1e-6) closeRun();
      }
      closeRun();
      const H = headLen(tokens);
      const firstUnitOf = /* @__PURE__ */ new Map();
      for (const u of units) if (u.kind !== "head" && u.index >= 0 && !firstUnitOf.has(u.index)) firstUnitOf.set(u.index, u);
      const realLen = q.realLen;
      for (let c = H; c <= realLen; c++) {
        const u = c < tokens.length ? firstUnitOf.get(c) : void 0;
        const last = u ? null : [...units].reverse().find((v) => v.kind !== "head");
        const sys = u ? u.system : last ? last.system : 0, x2 = u ? P(u.x) : last ? P(last.x + last.w) : P(sysStarts[0]);
        for (let k = 0; k < q.staves; k++) slots.push({ caret: c, system: rowOf(sys, r, k), x: x2 });
      }
      const shiftAt = (c) => {
        const kk = Math.min(c, realLen) - 1, si = kk >= H ? kk : -1;
        return Array.from({ length: q.staves }, (_, k) => shAt(q, k + 1, si));
      };
      for (let c = H; c <= realLen; c++) {
        const u0 = c < tokens.length ? firstUnitOf.get(c) : void 0;
        let sys, x2;
        if (!u0) {
          const last = [...units].reverse().find((v) => v.kind !== "head");
          sys = last ? last.system : 0;
          x2 = last ? P(last.x + last.w) : P(sysStarts[0]);
        } else if (u0.kind === "chunk") {
          sys = u0.system;
          x2 = P(u0.x);
        } else {
          const T = u0.tick, ch = units.find((v) => v.kind === "chunk" && v.index >= c && Math.abs(v.tick - T) < 1e-6);
          if (ch) {
            sys = ch.system;
            x2 = P(ch.x);
          } else {
            const same = units.filter((v) => v.kind !== "head" && v.index >= c && Math.abs(v.tick - T) < 1e-6), lastT = same[same.length - 1] ?? u0;
            sys = lastT.system;
            x2 = P(lastT.x + lastT.w);
          }
        }
        const sh = shiftAt(c);
        for (let k = 0; k < q.staves; k++) heads.push({ caret: c, system: rowOf(sys, r, k), x: x2, shift: sh[k] });
      }
      for (const u of units) if (u.kind === "chunk" && u.pad && u.inBar < 1e-6 && u.tick - q.realTicks > 1e-6) {
        const sh = shiftAt(realLen);
        for (let k = 0; k < q.staves; k++) {
          slots.push({ caret: realLen, system: rowOf(u.system, r, k), x: P(u.x), lead: u.tick - q.realTicks });
          heads.push({ caret: realLen, system: rowOf(u.system, r, k), x: P(u.x), shift: sh[k], lead: u.tick - q.realTicks });
        }
      }
      let lastSys = -1;
      for (let c = H; c < Math.min(tokens.length, realLen + 1); c++) {
        const u = firstUnitOf.get(c);
        if (!u) continue;
        const crossed = lastSys >= 0 && u.system > lastSys;
        lastSys = u.system;
        if (!crossed) continue;
        const prevRow = cols.filter((cc) => cc.system === u.system - 1);
        if (!prevRow.length) continue;
        const x2 = P(Math.max(...prevRow.map((cc) => cc.x + cc.w)));
        const sh = shiftAt(c);
        for (let k = 0; k < q.staves; k++) {
          slots.push({ caret: c, system: rowOf(u.system - 1, r, k), x: x2, end: true });
          heads.push({ caret: c, system: rowOf(u.system - 1, r, k), x: x2, shift: sh[k], end: true });
        }
      }
    });
    stubs();
    papersHit.push({ id: paper.id, title: pTitle, menu, top: paperTop, bottom: yCur, ...paperNav });
  });
  const pages = [];
  if (PG) {
    const frames = [];
    for (let k = 0; k <= pageNo; k++) {
      const top = pageTopY(k);
      frames.push({ t: "rect", x: -P(PG.l), y: top, w: o.width + P(PG.l + PG.r), h: P(PG.h), cls: "page" });
      prims.push({ t: "text", x: o.width / 2, y: top + P(PG.h - PG.b / 2), s: String(k + 1), cls: "page-no", size: P(1.2), anchor: "middle" });
      pages.push({ top, h: P(PG.h) });
    }
    prims.unshift(...frames);
  }
  const height = PG ? pageTopY(pageNo) + P(PG.h) : yCur + P(MX.b);
  return { prims, width: o.scroll ? P(sheetRight + MARGIN) : o.width, height, sp, systems: rows, bars, notes, chordHeads, sharedRows, virtual: virtualOut, measures, families, slots, heads, lyrics, marks, dyns, rests, title, clefs, arrangement, credits, parts: partsHit, papers: papersHit, addPaper, nav, paperMenu, pageX: { left: P(MX.l), right: P(MX.r) }, pages, paperChip, shortBars, lyricYs: rows.map((_, r) => lyricY(r)), lyricY, yOf, dOf };
}

// src/render/svg.ts
var esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var n = (v) => (Math.round(v * 100) / 100).toString();
function primSvg(p, fs, lfs, rx) {
  const c = (p.cls ? ` class="${p.cls}"` : "") + (p.tok !== void 0 ? ` data-tok="${p.tok}"` : "");
  switch (p.t) {
    case "line":
      return `<line${c} x1="${n(p.x1)}" y1="${n(p.y1)}" x2="${n(p.x2)}" y2="${n(p.y2)}" stroke-width="${n(p.w)}"/>`;
    case "glyph":
      return `<text${c} x="${n(p.x)}" y="${n(p.y)}" font-family="Bravura" font-size="${p.size ? n(p.size) : fs}">${p.ch}</text>`;
    case "text":
      return `<text${c} x="${n(p.x)}" y="${n(p.y)}" font-size="${p.size ? n(p.size) : lfs}" text-anchor="${p.anchor ?? "middle"}">${esc(p.s)}</text>`;
    case "path":
      return `<path${c} d="${p.d}"/>`;
    case "rect":
      return `<rect${c} x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" rx="${rx}"/>`;
    case "icon":
      return `<use${c} href="#${p.id}" x="${n(p.x)}" y="${n(p.y)}" width="${n(p.size)}" height="${n(p.size)}">${p.title ? `<title>${esc(p.title)}</title>` : ""}</use>`;
  }
}
function yOfPrim(p) {
  switch (p.t) {
    case "line":
      return (p.y1 + p.y2) / 2;
    case "glyph":
    case "text":
      return p.y;
    case "rect":
      return p.y + p.h / 2;
    case "icon":
      return p.y + p.size / 2;
    case "path": {
      const m = /^\s*M\s*-?[\d.]+[\s,]+(-?[\d.]+)/.exec(p.d);
      return m ? Number(m[1]) : null;
    }
  }
}
function toSvgParts(l) {
  const L = l.pageX?.left ?? 0, R = l.pageX?.right ?? 0, W2 = l.width + L + R;
  const open = `<svg xmlns="http://www.w3.org/2000/svg" class="staff-svg" width="${n(W2)}" height="${n(l.height)}" viewBox="${n(-L)} 0 ${n(W2)} ${n(l.height)}">`;
  const fs = n(4 * l.sp), lfs = n(LYRIC_EM * l.sp), rx = n(l.sp * 0.6);
  const boxes = l.systems.map((s) => [s.top, s.bottom]);
  const buckets = Array.from({ length: boxes.length + 1 }, () => []);
  for (const p of l.prims) {
    const y = yOfPrim(p);
    let k = 0;
    if (y !== null) {
      for (let i = 0; i < boxes.length; i++) if (y >= boxes[i][0] && y < boxes[i][1]) {
        k = i + 1;
        break;
      }
    }
    buckets[k].push(primSvg(p, fs, lfs, rx));
  }
  return { open, groups: buckets.map((b, k) => `<g data-sys="${k - 1}">${b.join("")}</g>`), close: "</svg>" };
}

// src/render/lyric-font.ts
function measurerOn(ctx, font) {
  return (s) => {
    if (ctx.font !== font) ctx.font = font;
    return ctx.measureText(s).width;
  };
}

// src/render/layout-worker.ts
function runLayoutJob(job, measure, now = () => performance.now()) {
  const t0 = now();
  const L = engrave(job.song, { ...job.opts, measureLyric: measure });
  const parts = toSvgParts(L);
  return { seq: job.seq, parts, data: stripLayoutFns(L), ms: now() - t0 };
}
if (typeof document === "undefined" && typeof self !== "undefined" && typeof self.postMessage === "function" && typeof OffscreenCanvas !== "undefined") {
  const ws = self;
  const ctx = new OffscreenCanvas(1, 1).getContext("2d");
  ws.onmessage = (e) => {
    const job = e.data;
    try {
      ws.postMessage(runLayoutJob(job, measurerOn(ctx, job.font)));
    } catch (err) {
      ws.postMessage({ seq: job.seq, error: String(err?.stack ?? err) });
    }
  };
}
export {
  runLayoutJob
};
//# sourceMappingURL=layout-worker-6fb0185cdc6b.mjs.map
