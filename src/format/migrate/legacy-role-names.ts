// legacy-role-names.ts —— 老文件进门时给角色名升级用的两张表（休息室 minor 1，施工单 12-4）。**冻住的，不要重烤**。
// created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。烤自 vendor/instruments/instruments-v15.json（sha256 4340e7b473321f2abc5f861066244cf60bdccfc5288fdc37e111b763d8aa7139）和当时 src/score/roles.ts 的预设表。
// 只给 src/format/migrate/ 用（运行时别处不许 import，守卫 = test/part-show.test.ts）：老文件只会来自这一版之前，要的就是这一刻的对照；
//   同一个文件不管在哪一版打开，迁移出来的结果一样。以后目录更新不跟着重烤；新上场的声部走目录、按值抄，不经过这里。
// ① LEGACY_PRESETS：老预设（官方 id + 英文名）→ 按值的概念（编号用本 app 自己的预设号 moonsinger-preset:…；官方 id 对得上目录概念的，带上目录的编号）。
// ② LEGACY_LABELS：目录 v15 每个概念的谱上英文叫法 + 英文简写（按 wikidata / local 编号查）。
import type { LoungeRoleV2 } from "../contract.ts";
type Concept = NonNullable<LoungeRoleV2["concept"]>;
export const LEGACY_PRESETS: readonly { sound: string; en: string; concept: Concept }[] = [
 {
  "sound": "voice.vocals",
  "en": "Vocals",
  "concept": {
   "ids": {
    "wikidata": "Q7390",
    "local": "moonsinger-preset:vocals",
    "musicxml": "voice.vocals",
    "gm": [
     {
      "program": 53,
      "bank": 0
     },
     {
      "program": 52,
      "bank": 0
     }
    ],
    "hs": null
   },
   "name": {
    "zh": "人声",
    "en": "human voice",
    "ja": "声"
   },
   "score": {
    "zh": "人声",
    "en": "Vocals"
   },
   "abbr": {
    "en": "Vo."
   }
  }
 },
 {
  "sound": "voice.vocals",
  "en": "Backing Vocals",
  "concept": {
   "ids": {
    "wikidata": null,
    "local": "moonsinger-preset:backing-vocals",
    "musicxml": "voice.vocals",
    "gm": [],
    "hs": null
   },
   "name": {
    "zh": "伴唱",
    "en": "Backing Vocals"
   },
   "score": {
    "zh": "伴唱",
    "en": "Backing Vocals"
   },
   "abbr": {
    "en": "B. Vo."
   }
  }
 },
 {
  "sound": "voice.soprano",
  "en": "Soprano",
  "concept": {
   "ids": {
    "wikidata": null,
    "local": "moonsinger-preset:soprano",
    "musicxml": "voice.soprano",
    "gm": [],
    "hs": null
   },
   "name": {
    "zh": "女高音",
    "en": "Soprano"
   },
   "score": {
    "zh": "女高音",
    "en": "Soprano"
   },
   "abbr": {
    "en": "S."
   }
  }
 },
 {
  "sound": "voice.alto",
  "en": "Alto",
  "concept": {
   "ids": {
    "wikidata": null,
    "local": "moonsinger-preset:alto",
    "musicxml": "voice.alto",
    "gm": [],
    "hs": null
   },
   "name": {
    "zh": "女低音",
    "en": "Alto"
   },
   "score": {
    "zh": "女低音",
    "en": "Alto"
   },
   "abbr": {
    "en": "A."
   }
  }
 },
 {
  "sound": "voice.tenor",
  "en": "Tenor",
  "concept": {
   "ids": {
    "wikidata": null,
    "local": "moonsinger-preset:tenor",
    "musicxml": "voice.tenor",
    "gm": [],
    "hs": null
   },
   "name": {
    "zh": "男高音",
    "en": "Tenor"
   },
   "score": {
    "zh": "男高音",
    "en": "Tenor"
   },
   "abbr": {
    "en": "T."
   }
  }
 },
 {
  "sound": "voice.bass",
  "en": "Bass",
  "concept": {
   "ids": {
    "wikidata": null,
    "local": "moonsinger-preset:bass-voice",
    "musicxml": "voice.bass",
    "gm": [],
    "hs": null
   },
   "name": {
    "zh": "男低音",
    "en": "Bass"
   },
   "score": {
    "zh": "男低音",
    "en": "Bass"
   },
   "abbr": {
    "en": "B."
   }
  }
 },
 {
  "sound": "keyboard.piano",
  "en": "Piano",
  "concept": {
   "ids": {
    "wikidata": "Q5994",
    "local": "moonsinger-preset:piano",
    "musicxml": "keyboard.piano",
    "gm": [
     {
      "program": 0,
      "bank": 0
     },
     {
      "program": 1,
      "bank": 0
     }
    ],
    "hs": "314.122-4-8"
   },
   "name": {
    "zh": "钢琴",
    "en": "piano",
    "ja": "ピアノ"
   },
   "score": {
    "zh": "钢琴",
    "en": "Piano"
   },
   "abbr": {
    "en": "Pno."
   }
  }
 },
 {
  "sound": "pluck.guitar",
  "en": "Guitar",
  "concept": {
   "ids": {
    "wikidata": "Q6607",
    "local": "moonsinger-preset:guitar",
    "musicxml": "pluck.guitar",
    "gm": [
     {
      "program": 120,
      "bank": 0
     }
    ],
    "hs": "321.322"
   },
   "name": {
    "zh": "吉他",
    "en": "guitar",
    "ja": "ギター"
   },
   "score": {
    "zh": "吉他",
    "en": "Guitar"
   },
   "abbr": {
    "en": "Guit."
   }
  }
 },
 {
  "sound": "pluck.bass",
  "en": "Bass",
  "concept": {
   "ids": {
    "wikidata": null,
    "local": "moonsinger-preset:bass",
    "musicxml": "pluck.bass",
    "gm": [],
    "hs": null
   },
   "name": {
    "zh": "贝斯",
    "en": "Bass"
   },
   "score": {
    "zh": "贝斯",
    "en": "Bass"
   }
  }
 },
 {
  "sound": "drum.group.set",
  "en": "Drums",
  "concept": {
   "ids": {
    "wikidata": null,
    "local": "moonsinger-preset:drums",
    "musicxml": "drum.group.set",
    "gm": [],
    "hs": null
   },
   "name": {
    "zh": "鼓",
    "en": "Drums"
   },
   "score": {
    "zh": "鼓",
    "en": "Drums"
   }
  }
 },
 {
  "sound": "strings.group",
  "en": "Strings",
  "concept": {
   "ids": {
    "wikidata": "Q2997126",
    "local": "moonsinger-preset:strings",
    "musicxml": "strings.group",
    "gm": [
     {
      "program": 44,
      "bank": 0
     },
     {
      "program": 45,
      "bank": 0
     },
     {
      "program": 48,
      "bank": 0
     },
     {
      "program": 49,
      "bank": 0
     }
    ],
    "hs": "321.322-71"
   },
   "name": {
    "zh": "弦乐组",
    "en": "string section",
    "ja": "弦楽セクション"
   },
   "score": {
    "zh": "弦乐组",
    "en": "Strings"
   },
   "abbr": {
    "en": "St."
   }
  }
 },
 {
  "sound": "synth.pad",
  "en": "Synth Pad",
  "concept": {
   "ids": {
    "wikidata": null,
    "local": "moonsinger-preset:synth-pad",
    "musicxml": "synth.pad",
    "gm": [],
    "hs": null
   },
   "name": {
    "zh": "合成器背景音",
    "en": "Synth Pad"
   },
   "score": {
    "zh": "合成器背景音",
    "en": "Synth Pad"
   }
  }
 },
 {
  "sound": "synth.tone.sawtooth",
  "en": "Synth Lead",
  "concept": {
   "ids": {
    "wikidata": null,
    "local": "moonsinger-preset:synth-lead",
    "musicxml": "synth.tone.sawtooth",
    "gm": [],
    "hs": null
   },
   "name": {
    "zh": "合成器主音",
    "en": "Synth Lead"
   },
   "score": {
    "zh": "合成器主音",
    "en": "Synth Lead"
   }
  }
 }
];
export const LEGACY_LABELS: { readonly byWikidata: Readonly<Record<string, { en: string; abbr?: string }>>; readonly byLocal: Readonly<Record<string, { en: string; abbr?: string }>> } = {"byWikidata":{"Q5994":{"en":"Piano","abbr":"Pno."},"Q5357606":{"en":"Electric Piano","abbr":"El. Pno."},"Q7673920":{"en":"Honky Tonk Piano","abbr":"Hnk. Pno."},"Q1136507":{"en":"Electric Piano","abbr":"El. Pno."},"Q81982":{"en":"Harpsichord","abbr":"Hch."},"Q1099153":{"en":"Clavinet","abbr":"Clav."},"Q320341":{"en":"Celesta","abbr":"Cel."},"Q626035":{"en":"Glockenspiel","abbr":"Glock."},"Q1365218":{"en":"Music Box"},"Q206987":{"en":"Vibraphone","abbr":"Vib."},"Q220971":{"en":"Marimba","abbr":"Mrm."},"Q165666":{"en":"Xylophone","abbr":"Xyl."},"Q178812":{"en":"Chimes","abbr":"Cme."},"Q1588017":{"en":"Hammered Dulcimer","abbr":"Dlc."},"Q105891":{"en":"Hammond Organ","abbr":"Hm. Org."},"Q281460":{"en":"Pipe Organ","abbr":"Org."},"Q12460259":{"en":"Reed Organ","abbr":"Rd. Org."},"Q79838":{"en":"Accordion","abbr":"Acc."},"Q51290":{"en":"Harmonica","abbr":"Harm."},"Q215032":{"en":"Bandoneon","abbr":"Ban."},"Q719120":{"en":"Classical Guitar","abbr":"Guit."},"Q2563510":{"en":"Acoustic Guitar","abbr":"Guit."},"Q636313":{"en":"Guitar","abbr":"Guit."},"Q78987":{"en":"Electric Guitar","abbr":"El. Guit."},"Q80019":{"en":"Contrabass","abbr":"Cb."},"Q46185":{"en":"Electric Bass","abbr":"El. B."},"Q932855":{"en":"Fretless Bass","abbr":"Frtl. El. B."},"Q6398221":{"en":"Bass Synthesizer","abbr":"Synth."},"Q8355":{"en":"Violin","abbr":"Vln."},"Q80284":{"en":"Viola","abbr":"Vla."},"Q8371":{"en":"Violoncello","abbr":"Vc."},"Q2997126":{"en":"Strings","abbr":"St."},"Q1231959":{"en":"Harp","abbr":"Hrp."},"Q189737":{"en":"Timpani","abbr":"Timp."},"Q110897746":{"en":"String Synthesizer","abbr":"Synth."},"Q131186":{"en":"Choir"},"Q7390":{"en":"Voice","abbr":"Vo."},"Q16346":{"en":"Synth Voice"},"Q7100251":{"en":"Orchestra Hit"},"Q8338":{"en":"Trumpet","abbr":"Tpt."},"Q8350":{"en":"Trombone","abbr":"Tbn."},"Q131168":{"en":"Tuba","abbr":"Tba."},"Q163759":{"en":"Horn","abbr":"Hn."},"Q16824192":{"en":"Brass","abbr":"Br."},"Q163829":{"en":"Synthesizer","abbr":"Synth."},"Q1463985":{"en":"Soprano Saxophone","abbr":"S. Sax."},"Q445275":{"en":"Alto Saxophone","abbr":"A. Sax."},"Q1414932":{"en":"Tenor Saxophone","abbr":"T. Sax."},"Q808218":{"en":"Baritone Saxophone","abbr":"Bar. Sax."},"Q8377":{"en":"Oboe","abbr":"Ob."},"Q185041":{"en":"English Horn","abbr":"E. Hn."},"Q159998":{"en":"Bassoon","abbr":"Bsn."},"Q8343":{"en":"Clarinet","abbr":"Cl."},"Q83509":{"en":"Piccolo","abbr":"Picc."},"Q209554":{"en":"Flute","abbr":"Fl."},"Q187851":{"en":"Recorder","abbr":"S. Rec."},"Q218802":{"en":"Pan Flute","abbr":"Pn. Fl."},"Q4928615":{"en":"Blown Bottle"},"Q524526":{"en":"Shakuhachi","abbr":"Shak."},"Q615403":{"en":"Tin Whistle","abbr":"Tin Wh."},"Q187780":{"en":"Ocarina","abbr":"S. Oc."},"Q229205":{"en":"Sitar","abbr":"Si."},"Q258896":{"en":"Banjo","abbr":"Bj."},"Q241337":{"en":"Shamisen","abbr":"Sh."},"Q289037":{"en":"Koto","abbr":"Ko."},"Q1467960":{"en":"Mbira"},"Q8347":{"en":"Bagpipe","abbr":"Bagp."},"Q510487":{"en":"Fiddle"},"Q847911":{"en":"Shenai","abbr":"She."},"Q1621499":{"en":"Wind Chimes","abbr":"Met. Wn Ch."},"Q395212":{"en":"Agogô Bells","abbr":"Agogô"},"Q6610630":{"en":"Steel Pans","abbr":"St. Pans"},"Q957212":{"en":"Wood Blocks","abbr":"Wd. Bl."},"Q221769":{"en":"Taiko","abbr":"Taiko"},"Q849349":{"en":"Toms","abbr":"Toms"},"Q1327480":{"en":"Electronic Drums"},"Q7649196":{"en":"Suspended Cymbal","abbr":"Sus. Cym."},"Q6607":{"en":"Guitar","abbr":"Guit."},"Q9530":{"en":"Breathing"},"Q93352":{"en":"Seashore"},"Q1126556":{"en":"Birdsong"},"Q690856":{"en":"Telephone Ring"},"Q34486":{"en":"Helicopter"},"Q814696":{"en":"Applause"},"Q2992372":{"en":"Gunshot"},"Q211028":{"en":"Bass Drum","abbr":"BD"},"Q208421":{"en":"Snare Drum","abbr":"SD"},"Q1322478":{"en":"Hand Clap","abbr":"Hd. Clp."},"Q3305735":{"en":"Floor Tom","abbr":"Fl. Tom"},"Q963334":{"en":"Hi-hat","abbr":"Hi-hat"},"Q93985":{"en":"Crash Cymbal","abbr":"Cr. Cym."},"Q93992":{"en":"Ride Cymbal","abbr":"R. Cym."},"Q2451592":{"en":"China Cymbal","abbr":"Ch. Cym."},"Q193666":{"en":"Tambourine","abbr":"Tamb."},"Q1074981":{"en":"Splash Cymbal","abbr":"Sp. Cym."},"Q775570":{"en":"Cowbell","abbr":"Cwb."},"Q390110":{"en":"Vibraslap","abbr":"Vibslp."},"Q243998":{"en":"Bongos","abbr":"Bon."},"Q270200":{"en":"Congas","abbr":"Con."},"Q379248":{"en":"Timbales","abbr":"Timb."},"Q1024685":{"en":"Cabasa","abbr":"Cabs."},"Q39777":{"en":"Maracas","abbr":"Mrcs."},"Q1483670":{"en":"Samba Whistle"},"Q2237198":{"en":"Güiro","abbr":"Gro."},"Q850118":{"en":"Claves","abbr":"Clv."},"Q176926":{"en":"Cuíca","abbr":"Cu."},"Q201735":{"en":"Triangle","abbr":"Trgl."},"Q113624956":{"en":"Electric Piano","abbr":"El. Pno."},"Q743659":{"en":"Electric Piano","abbr":"El. Pno."},"Q1759986":{"en":"Electric Piano","abbr":"El. Pno."},"Q139300":{"en":"Synthesizer","abbr":"Synth."},"Q208173":{"en":"Electric Guitar","abbr":"El. Guit."},"Q288342":{"en":"Electric Bass","abbr":"El. B."},"Q727758":{"en":"Electric Bass","abbr":"El. B."},"Q734687":{"en":"Synthesizer","abbr":"Synth."},"Q296879":{"en":"String Synthesizer","abbr":"Synth."},"Q2536440":{"en":"Synthesizer","abbr":"Synth."},"Q366063":{"en":"Synthesizer","abbr":"Synth."},"Q3347942":{"en":"Synthesizer","abbr":"Synth."},"Q744418":{"en":"Synthesizer","abbr":"Synth."},"Q512222":{"en":"Synthesizer","abbr":"Synth."},"Q2912399":{"en":"Santoor"},"Q877239":{"en":"Yangqin","abbr":"Yq."},"Q726303":{"en":"Guzheng","abbr":"Gz."},"Q1860805":{"en":"Sanxian"},"Q1394795":{"en":"Xiao"},"Q839767":{"en":"Xun"},"Q2096912":{"en":"Suona"},"Q726306":{"en":"Erhu","abbr":"Eh."},"Q1146067":{"en":"Dizi","abbr":"Di."},"Q7206087":{"en":"Bo"},"Q804099":{"en":"Bayan"},"Q940274":{"en":"Surdo"},"Q905244":{"en":"Sikus"},"Q21651966":{"en":"Fūrin"},"Q189388":{"en":"Didgeridoo","abbr":"Doo."},"Q628428":{"en":"Slit Drum","abbr":"Slt. Dr."},"Q61285":{"en":"Ukulele","abbr":"Uk."},"Q208320":{"en":"Gong"},"Q180733":{"en":"Lute","abbr":"Lt."},"Q201129":{"en":"Lyre"},"Q666971":{"en":"Bullroarer"},"Q1630744":{"en":"Musical Bow"},"Q38681":{"en":"Dog Bark"},"Q3307942":{"en":"Cat Meow"},"Q8094":{"en":"Wind"},"Q7925":{"en":"Rain"},"Q83301":{"en":"Thunder"},"Q47521":{"en":"Stream"},"Q3196":{"en":"Fire"},"Q3776776":{"en":"Cricket"},"Q1947892":{"en":"Cicada"},"Q53636":{"en":"Frog"},"Q495529":{"en":"Euphonium","abbr":"Euph."},"Q127933":{"en":"Fireworks"},"Q81103":{"en":"Cannon"},"Q1420":{"en":"Car"},"Q814068":{"en":"Beep"},"Q12760":{"en":"Steam Engine"},"Q207691":{"en":"Theremin","abbr":"Thmn."}},"byLocal":{"x:bei-bangzi":{"en":"Bei Bangzi"}}};
