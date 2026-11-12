export interface RolePreset {
    sound: string;
    name: string;
    zh: string;
}
/** 按功能选（user「声部名的选项太多了。不应跟是乐器name salad，而是功能选，不过你可以push back。也许专业的谱子上面就是这样。乐器名就是功能。而且应该是下拉选」）：
 *  人声 = 主唱 / 和声 + 合唱四部（专业谱上声部名就是功能）；乐队 = 流行编制的几个位置。每项背后是一个官方 id（官方表按乐器分、没有 Lead 这种功能名，
 *  所以「合成主音」落在 synth.tone.sawtooth、「和声」和主唱同是 voice.vocals）。表外的名字自己写（官方 id 不变）。 */
export declare const ROLE_GROUPS: {
    group: string;
    items: RolePreset[];
}[];
export declare const ROLE_PRESETS: RolePreset[];
/** 新建的歌：主唱这个声部 = Vocals（voice.vocals）。 */
export declare const DEFAULT_ROLE: RolePreset;
/** 这个声部名（可带号「Vocals 2」）是 app 的预设 = 界面语言里它的叫法 + 号；不是 = null。 */
export declare function presetShowName(label: string, sound: string): {
    show: string;
    base: string;
} | null;
/** 同名声部编号（user「然后default name如果重名的话会变成vocals vocals2这样？」→ AI 答照打谱软件（MuseScore 4 自动编号）→ user「这个应该可以现在做」）：
 *  名字和官方 id 都一样的几个声部 = 按先后补「 1」「 2」…（第一个也补；单独一个不带号）。名字一样但不是同一种（合唱的 Bass 和贝斯）不一起编。
 *  编号不存进角色名、每次现算（删了一个声部剩下的自动重排）；写 MusicXML 的 <part-name> 也带号。 */
export declare function numberParts(parts: {
    name: string;
    sound: string;
}[]): string[];
