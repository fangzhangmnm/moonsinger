/** 同名声部编号（user「然后default name如果重名的话会变成vocals vocals2这样？」→ AI 答照打谱软件（MuseScore 4 自动编号）→ user「这个应该可以现在做」）：
 *  名字和官方 id 都一样的几个声部 = 按先后补「 1」「 2」…（第一个也补；单独一个不带号）。名字一样但不是同一种（合唱的 Bass 和贝斯）不一起编。
 *  编号不存进角色名、每次现算（删了一个声部剩下的自动重排）；写 MusicXML 的 <part-name> 也带号。 */
export declare function numberParts(parts: {
    name: string;
    sound: string;
}[]): string[];
