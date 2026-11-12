// roles.ts —— 同名声部编号。created 2026-10-07 by Claude Opus 5.5（原来还放角色名的预设 = MusicXML 官方乐器语义 + 打谱的标准英文名，2026-11-12 删了，见下）。
// 2026-11-12（施工单 12-4，统筹裁定、user「这些其实一直是屎山，也许应该sunset」）：预设表（ROLE_GROUPS / ROLE_PRESETS / DEFAULT_ROLE）和按名字比的谱上翻译（PRESET_SHOW / presetShowName）删了。
//   「这个声部是什么」只剩乐器目录一个来源；新角色 = 目录里的人声（src/gm/default-concept.gen.ts）；显示成什么只走 src/format/part-show.ts。
//   老文件里叫预设名的角色：进门时按冻住的表补上按值的概念（src/format/migrate/legacy-role-names.ts），运行时不认预设。

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
