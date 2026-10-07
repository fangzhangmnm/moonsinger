// roles.ts —— 角色（声部）名的预设 = MusicXML 官方的乐器语义（<instrument-sound> 的标准 id）+ 打谱的标准英文名。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「谱上面显示的不应跟是月读，而是人声，女声 lead bass violin之类功能的东西，还记得之前说的给role assign 乐器的逻辑吗？
//   所以是你可以写或者选role的名字，帮我多想几个preset。然后名字之外再选乐器」→「角色名可以和xml的乐器 功能语义对齐，用最官方的正规的（又可以逼我练识谱了）」。
// · 谱上写的 = 角色名（<part-name>）；它是什么声部 = 官方 id（<instrument-sound>）；谁来演（月读、以后的插件）= 候选（<virtual-instrument>），名字不上谱。
// · id 全部对过 W3C MusicXML 的 sounds.xml（github.com/w3c/musicxml schema/sounds.xml，4.1 草案版，2026-10-07 取的）——只收在里面查得到的。
//   官方表里没有「Lead / 主唱」这种功能名（语义按乐器分）：主唱 = voice.vocals 或按声部 soprano / alto…；想叫别的名字可以自己写（官方 id 不变）。
// · 显示名 = 打谱里常用的标准英文写法；后面的中文只给选的时候看。

export interface RolePreset { sound: string; name: string; zh: string }
export const ROLE_GROUPS: { group: string; items: RolePreset[] }[] = [
  { group: "人声", items: [
    { sound: "voice.vocals", name: "Vocals", zh: "人声" },
    { sound: "voice.soprano", name: "Soprano", zh: "女高音" },
    { sound: "voice.mezzo-soprano", name: "Mezzo-soprano", zh: "女中音" },
    { sound: "voice.alto", name: "Alto", zh: "女低音" },
    { sound: "voice.countertenor", name: "Countertenor", zh: "假声男高音" },
    { sound: "voice.tenor", name: "Tenor", zh: "男高音" },
    { sound: "voice.baritone", name: "Baritone", zh: "男中音" },
    { sound: "voice.bass", name: "Bass", zh: "男低音" },
    { sound: "voice.female", name: "Female Voice", zh: "女声" },
    { sound: "voice.male", name: "Male Voice", zh: "男声" },
    { sound: "voice.child", name: "Child", zh: "童声" },
    { sound: "voice.synth", name: "Synth Voice", zh: "合成人声" },
  ] },
  { group: "弦乐", items: [
    { sound: "strings.violin", name: "Violin", zh: "小提琴" },
    { sound: "strings.viola", name: "Viola", zh: "中提琴" },
    { sound: "strings.cello", name: "Violoncello", zh: "大提琴" },
    { sound: "strings.contrabass", name: "Contrabass", zh: "低音提琴" },
    { sound: "strings.erhu", name: "Erhu", zh: "二胡" },
  ] },
  { group: "键盘", items: [
    { sound: "keyboard.piano", name: "Piano", zh: "钢琴" },
    { sound: "keyboard.piano.electric", name: "Electric Piano", zh: "电钢琴" },
    { sound: "keyboard.organ", name: "Organ", zh: "管风琴" },
    { sound: "keyboard.harpsichord", name: "Harpsichord", zh: "羽管键琴" },
    { sound: "keyboard.accordion", name: "Accordion", zh: "手风琴" },
  ] },
  { group: "木管", items: [
    { sound: "wind.flutes.flute", name: "Flute", zh: "长笛" },
    { sound: "wind.flutes.flute.piccolo", name: "Piccolo", zh: "短笛" },
    { sound: "wind.flutes.recorder", name: "Recorder", zh: "竖笛" },
    { sound: "wind.reed.oboe", name: "Oboe", zh: "双簧管" },
    { sound: "wind.reed.clarinet", name: "Clarinet", zh: "单簧管" },
    { sound: "wind.reed.bassoon", name: "Bassoon", zh: "大管" },
    { sound: "wind.reed.saxophone.alto", name: "Alto Saxophone", zh: "中音萨克斯" },
    { sound: "wind.flutes.xiao", name: "Xiao", zh: "箫" },
    { sound: "wind.reed.sheng", name: "Sheng", zh: "笙" },
  ] },
  { group: "铜管", items: [
    { sound: "brass.trumpet", name: "Trumpet", zh: "小号" },
    { sound: "brass.french-horn", name: "Horn", zh: "圆号" },
    { sound: "brass.trombone", name: "Trombone", zh: "长号" },
    { sound: "brass.tuba", name: "Tuba", zh: "大号" },
  ] },
  { group: "拨弦", items: [
    { sound: "pluck.guitar.acoustic", name: "Acoustic Guitar", zh: "木吉他" },
    { sound: "pluck.guitar.electric", name: "Electric Guitar", zh: "电吉他" },
    { sound: "pluck.bass.electric", name: "Electric Bass", zh: "电贝斯" },
    { sound: "pluck.ukulele", name: "Ukulele", zh: "尤克里里" },
    { sound: "pluck.harp", name: "Harp", zh: "竖琴" },
    { sound: "pluck.guzheng", name: "Guzheng", zh: "古筝" },
    { sound: "pluck.pipa", name: "Pipa", zh: "琵琶" },
  ] },
  { group: "打击 / 合成", items: [
    { sound: "drum.group.set", name: "Drum Set", zh: "架子鼓" },
    { sound: "drum.timpani", name: "Timpani", zh: "定音鼓" },
    { sound: "pitched-percussion.glockenspiel", name: "Glockenspiel", zh: "钟琴" },
    { sound: "pitched-percussion.marimba", name: "Marimba", zh: "马林巴" },
    { sound: "synth.pad", name: "Synth Pad", zh: "合成铺底" },
    { sound: "synth.tone.square", name: "Square Synth", zh: "方波合成" },
  ] },
];
export const ROLE_PRESETS: RolePreset[] = ROLE_GROUPS.flatMap((g) => g.items);
/** 新建的歌：主唱这个声部 = Vocals（voice.vocals）。 */
export const DEFAULT_ROLE: RolePreset = ROLE_PRESETS[0];
