// catalog-i18n.ts —— 乐器目录（仓鼠的数据）怎么按界面语言显示。created 2026-11-04 by Claude Opus 5.5（v0.15.0）
//   目录是拷来的快照（vendor/instruments/），概念自带 zh / en / ja；分类标签（年代、曲风、承重、连断）只有 zh：
//   英文对照写在这里，不改快照（取货不会把它冲掉）。新版目录多了标签 = test/catalog-i18n.test.ts 红。
//   依据 / 理由这类长说明（reason、basis…）只有中文：英文界面不显示（给不了就不给，不留半句中文）。
import { lang } from "../i18n/index.ts";

/** 分类标签：中文 → 英文。键是数据里的 zh，取货换了字这里会红。 */
export const DEF_EN: Record<string, string> = {
  // 年代
  "人类以前": "Before humans", "石器": "Stone Age", "农业": "Agriculture", "青铜与文字": "Bronze & writing", "古典": "Classical antiquity",
  "手抄本": "Manuscripts", "印刷术": "Printing", "科学革命": "Scientific Revolution", "启蒙": "Enlightenment", "工业革命": "Industrial Revolution",
  "铁路": "Railways", "电话电灯": "Telephone & electric light", "无线电": "Radio", "两次大战": "World Wars", "原子时代": "Atomic Age",
  "个人计算机": "Personal computers", "互联网": "Internet", "AI": "AI",
  // 曲风
  "贝多风（交响乐）": "Beethoven (symphonic)", "贝多风（管乐团）": "Beethoven (wind band)", "军乐风": "Military", "教堂风": "Church", "爵士风": "Jazz",
  "摇滚流行风": "Rock / pop", "合成器风": "Synth", "8-bit 风": "8-bit", "游乐场风": "Fairground", "西部风": "Western", "凯尔特风": "Celtic", "巴黎风": "Paris",
  "苏联风": "Soviet", "音乐课风": "School music", "拉丁风": "Latin", "安第斯风": "Andes", "非洲风": "Africa", "原始部落风": "Tribal", "和风": "Japanese",
  "印度风": "Indian", "中华风": "Chinese", "音效": "Sound effects", "自然声": "Nature", "夏威夷风": "Hawaii", "新世纪风": "New age", "太空风": "Space",
  "童话治愈风": "Fairytale", "电音动漫歌风": "Anime electro", "交响金属风": "Symphonic metal", "民谣风": "Folk",
  // 承重
  "承重": "Core", "常用": "Common", "点缀": "Accent",
  // 音和音之间
  "连": "Legato", "断奏（换弓）": "Détaché", "吐音": "Tongued", "抬手": "Lifted",
};

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** 概念（乐器）在界面上叫什么。 */
export function conceptName(names: { zh: string; en: string }): string {
  return lang() === "zh" ? names.zh : cap(names.en);
}
/** 概念名下面那一行：中文界面 = 英文 + 日文；英文界面 = 日文（中文名搜索照样能搜到）。 */
export function conceptAlt(enName: string, names: { ja?: string }): string {
  const ja = names.ja ?? "";
  return lang() === "zh" ? `${enName}${ja ? ` · ${ja}` : ""}` : ja;
}
/** 分类标签。英文界面没对照的 = 原样（测试守着不会没有）。 */
export function defLabel(zh: string): string {
  return lang() === "zh" ? zh : (DEF_EN[zh] ?? zh);
}
/** 只有中文的长说明：英文界面不显示。 */
export function zhOnly(s: string): string {
  return lang() === "zh" ? s : "";
}
