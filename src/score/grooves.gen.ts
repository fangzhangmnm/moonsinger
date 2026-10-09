// 生成物：node scripts/gen-grooves.mjs（源 = ../20260813 MyLlamaReborn/20261007 音乐史/export/moonsinger/grooves-v2.json，拷在 vendor/grooves/）。勿手改。
// 拍子轻重的预设（音乐仓鼠出；强弱先后引维基原文、具体数值 AI 按层级取；引文 / 依据 / 许可证见 vendor/grooves/grooves-v2.json）。
export const GROOVES_VERSION = 2;
export const GROOVES_FILE = {"file":"vendor/grooves/grooves-v2.json","bytes":42822,"sha256":"95c8f7fc050dc0512ee31bd6044bb1059393b80bdb2c289dbfd48001954b098b"} as const;
export interface GrooveStyle {
  id: string; name: { zh: string; en: string; ja: string }; aliases: string[];
  /** 拍号（"4/4"）→ 一小节几个十六分格子 + 每格上开始的音的相对轻重（−1…1）；bars = 几小节一轮（克拉维 = 2，weights = 两小节的格子接起来）。 */
  meters: Record<string, { grid: number; weights: number[]; bars?: number }>;
  /** 两小节一轮的默认方向（"3-2" = 第一小节是三击那边）；「错开一小节」= 两小节对调（2-3）。没有 = 一小节一轮。 */
  phase: string | null;
  /** 没列的拍号：classical = 按古典层级推；none = 不加。 */
  fallback: "classical" | "none";
  /** 各类乐器跟多少（0–1）：键 = GM 家族（gm-map defs.families）+ voice（人声类，优先）。 */
  follow: Record<string, number>;
  /** 摇摆（时值，不是轻重）：一对音里前一个占的比例。 */
  swing: { unit: string; ratio: number; range: [number, number] } | null;
}
export const GROOVE_STYLES: GrooveStyle[] = [
 {
  "id": "none",
  "name": {
   "zh": "无",
   "en": "None",
   "ja": "なし"
  },
  "aliases": [
   "无风格",
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
   "zh": "古典",
   "en": "Classical",
   "ja": "クラシック"
  },
  "aliases": [
   "Classic",
   "古典派"
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
   "zh": "流行",
   "en": "Pop",
   "ja": "ポップス"
  },
  "aliases": [
   "Rock",
   "摇滚",
   "ロック",
   "R&B",
   "Backbeat",
   "反拍"
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
   "zh": "华尔兹",
   "en": "Waltz",
   "ja": "ワルツ"
  },
  "aliases": [
   "圆舞曲",
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
   "zh": "进行曲",
   "en": "March",
   "ja": "マーチ"
  },
  "aliases": [
   "行进曲",
   "Marcia",
   "行進曲"
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
   "ja": "スウィング"
  },
  "aliases": [
   "摇摆",
   "爵士",
   "Jazz",
   "ジャズ"
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
   "zh": "四拍底鼓",
   "en": "Four on the floor",
   "ja": "4つ打ち"
  },
  "aliases": [
   "电子",
   "迪斯科",
   "Disco",
   "EDM",
   "House",
   "ディスコ"
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
   "zh": "波萨",
   "en": "Bossa nova",
   "ja": "ボサノヴァ"
  },
  "aliases": [
   "Bossa",
   "巴萨诺瓦",
   "ボサノバ",
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
   "zh": "拉丁（克拉维）",
   "en": "Latin (son clave)",
   "ja": "ラテン（ソン・クラーベ）"
  },
  "aliases": [
   "拉丁",
   "Latin",
   "Son",
   "Salsa",
   "萨尔萨",
   "Mambo",
   "曼波",
   "サルサ",
   "ラテン",
   "Clave",
   "克拉维"
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
