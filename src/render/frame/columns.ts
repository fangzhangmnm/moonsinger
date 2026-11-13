// columns.ts —— 一张纸上各条轨按时刻对齐成列：同一时刻里各种东西的先后。
// > created 2026-11-11 by Claude Opus 5.5（谱面分家施工单 1b-2 从 engrave.ts 搬出；1b-4 起按种类命名、归框架——施工单第五节裁定 1）。
//   种类是核心的词（小节线、房子、谱号、调号、拍号、速度、风格、力度、八度线、发夹、写字头、音），框架可以认；某种画法没有的种类 = 不报那一列。
//   note = 音 / 休止（一段：跨小节的音切开、拆成能记的时值后的每一段）；tail = 写字头停在这条轨的尾巴后面（零宽）。

export type ColumnKind = "bar" | "nav" | "clef" | "key" | "time" | "tempo" | "groove" | "dyn" | "ottava" | "pedal" | "hairpin" | "tail" | "note";
