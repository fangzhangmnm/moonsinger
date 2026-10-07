// roles.ts —— 角色（声部）名的预设 = MusicXML 官方的乐器语义（<instrument-sound> 的标准 id）+ 打谱的标准英文名。created 2026-10-07 by Claude Opus 5.5
// user 2026-10-07「谱上面显示的不应跟是月读，而是人声，女声 lead bass violin之类功能的东西，还记得之前说的给role assign 乐器的逻辑吗？
//   所以是你可以写或者选role的名字，帮我多想几个preset。然后名字之外再选乐器」→「角色名可以和xml的乐器 功能语义对齐，用最官方的正规的（又可以逼我练识谱了）」。
// · 谱上写的 = 角色名（<part-name>）；它是什么声部 = 官方 id（<instrument-sound>）；谁来演（月读、以后的插件）= 候选（<virtual-instrument>），名字不上谱。
// · id 全部对过 W3C MusicXML 的 sounds.xml（github.com/w3c/musicxml schema/sounds.xml，4.1 草案版，2026-10-07 取的）——只收在里面查得到的。
// · 显示名 = 打谱里常用的标准英文写法；后面的中文只给选的时候看。

export interface RolePreset { sound: string; name: string; zh: string }
/** 按功能选（user「声部名的选项太多了。不应跟是乐器name salad，而是功能选，不过你可以push back。也许专业的谱子上面就是这样。乐器名就是功能。而且应该是下拉选」）：
 *  人声 = 主唱 / 和声 + 合唱四部（专业谱上声部名就是功能）；乐队 = 流行编制的几个位置。每项背后是一个官方 id（官方表按乐器分、没有 Lead 这种功能名，
 *  所以「合成主音」落在 synth.tone.sawtooth、「和声」和主唱同是 voice.vocals）。表外的名字自己写（官方 id 不变）。 */
export const ROLE_GROUPS: { group: string; items: RolePreset[] }[] = [
  { group: "人声", items: [
    { sound: "voice.vocals", name: "Vocals", zh: "主唱" },
    { sound: "voice.vocals", name: "Backing Vocals", zh: "和声" },
    { sound: "voice.soprano", name: "Soprano", zh: "女高音（合唱）" },
    { sound: "voice.alto", name: "Alto", zh: "女低音（合唱）" },
    { sound: "voice.tenor", name: "Tenor", zh: "男高音（合唱）" },
    { sound: "voice.bass", name: "Bass", zh: "男低音（合唱）" },
  ] },
  { group: "乐队", items: [
    { sound: "keyboard.piano", name: "Piano", zh: "钢琴 / 键盘" },
    { sound: "pluck.guitar", name: "Guitar", zh: "吉他" },
    { sound: "pluck.bass", name: "Bass", zh: "贝斯" },
    { sound: "drum.group.set", name: "Drums", zh: "鼓" },
    { sound: "strings.group", name: "Strings", zh: "弦乐" },
    { sound: "synth.pad", name: "Synth Pad", zh: "合成铺底" },
    { sound: "synth.tone.sawtooth", name: "Synth Lead", zh: "合成主音" },
  ] },
];
export const ROLE_PRESETS: RolePreset[] = ROLE_GROUPS.flatMap((g) => g.items);
/** 新建的歌：主唱这个声部 = Vocals（voice.vocals）。 */
export const DEFAULT_ROLE: RolePreset = ROLE_PRESETS[0];
