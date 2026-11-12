import { _t } from "../i18n/index.ts";
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
  { group: _t("人声"), items: [
    { sound: "voice.vocals", name: "Vocals", zh: _t("主唱") },
    { sound: "voice.vocals", name: "Backing Vocals", zh: _t("和声") },
    { sound: "voice.soprano", name: "Soprano", zh: _t("女高音（合唱）") },
    { sound: "voice.alto", name: "Alto", zh: _t("女低音（合唱）") },
    { sound: "voice.tenor", name: "Tenor", zh: _t("男高音（合唱）") },
    { sound: "voice.bass", name: "Bass", zh: _t("男低音（合唱）") },
  ] },
  { group: _t("乐队"), items: [
    { sound: "keyboard.piano", name: "Piano", zh: _t("钢琴 / 键盘") },
    { sound: "pluck.guitar", name: "Guitar", zh: _t("吉他") },
    { sound: "pluck.bass", name: "Bass", zh: _t("贝斯") },
    { sound: "drum.group.set", name: "Drums", zh: _t("鼓") },
    { sound: "strings.group", name: "Strings", zh: _t("弦乐") },
    { sound: "synth.pad", name: "Synth Pad", zh: _t("合成铺底") },
    { sound: "synth.tone.sawtooth", name: "Synth Lead", zh: _t("合成主音") },
  ] },
];
export const ROLE_PRESETS: RolePreset[] = ROLE_GROUPS.flatMap((g) => g.items);
/** 新建的歌：主唱这个声部 = Vocals（voice.vocals）。 */
export const DEFAULT_ROLE: RolePreset = ROLE_PRESETS[0];

/** 谱上显示用的预设名（谱面分家 5½ 补；统筹：目录里没有那种语言名字的、app 自己的预设名，按普通的界面字走 i18n）。只是显示：歌里存的名字、MusicXML 里的名字不动。
 *  键 = 官方 id + 英文名（合唱的 Bass 和贝斯分得开）；名字不分大小写比。表外的（自己起的、Piano / Guitar 这类目录里有的）= null。 */
const PRESET_SHOW: readonly { sound: string; name: string; show: () => string }[] = [
  { sound: "voice.vocals", name: "Vocals", show: () => _t("人声##谱上声部名") },
  { sound: "voice.vocals", name: "Backing Vocals", show: () => _t("伴唱##谱上声部名") },
  { sound: "voice.soprano", name: "Soprano", show: () => _t("女高音##谱上声部名") },
  { sound: "voice.alto", name: "Alto", show: () => _t("女低音##谱上声部名") },
  { sound: "voice.tenor", name: "Tenor", show: () => _t("男高音##谱上声部名") },
  { sound: "voice.bass", name: "Bass", show: () => _t("男低音##谱上声部名") },
  { sound: "drum.group.set", name: "Drums", show: () => _t("鼓##谱上声部名") },
  { sound: "synth.tone.sawtooth", name: "Synth Lead", show: () => _t("合成器主音##谱上声部名") },
  { sound: "synth.pad", name: "Synth Pad", show: () => _t("合成器背景音##谱上声部名") },
];
/** 这个声部名（可带号「Vocals 2」）是 app 的预设 = 界面语言里它的叫法 + 号；不是 = null。 */
export function presetShowName(label: string, sound: string): { show: string; base: string } | null {
  const m = / (\d+)$/.exec(label), base = m ? label.slice(0, -m[0].length) : label, low = base.toLowerCase();
  const p = PRESET_SHOW.find((x) => x.sound === sound && x.name.toLowerCase() === low);
  return p ? { show: p.show() + (m ? ` ${m[1]}` : ""), base } : null;
}

/** 同名声部编号（user「然后default name如果重名的话会变成vocals vocals2这样？」→ AI 答照打谱软件（MuseScore 4 自动编号）→ user「这个应该可以现在做」）：
 *  名字和官方 id 都一样的几个声部 = 按先后补「 1」「 2」…（第一个也补；单独一个不带号）。名字一样但不是同一种（合唱的 Bass 和贝斯）不一起编。
 *  编号不存进角色名、每次现算（删了一个声部剩下的自动重排）；写 MusicXML 的 <part-name> 也带号。 */
export function numberParts(parts: { name: string; sound: string }[]): string[] {
  const key = (p: { name: string; sound: string }) => `${p.name}\u0000${p.sound}`;
  const total = new Map<string, number>();
  for (const p of parts) total.set(key(p), (total.get(key(p)) ?? 0) + 1);
  const seen = new Map<string, number>();
  return parts.map((p) => {
    const k = key(p);
    if ((total.get(k) ?? 0) < 2) return p.name;
    const n = (seen.get(k) ?? 0) + 1; seen.set(k, n);
    return `${p.name} ${n}`;
  });
}
