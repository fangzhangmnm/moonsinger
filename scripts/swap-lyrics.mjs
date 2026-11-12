// scripts/swap-lyrics.mjs —— 换词：拿一份歌当底，只把另一份的歌词和元信息换进去（同一首歌的两个语言版本对齐用）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）
//   起因：施工单 ai-docs/20261111-score-surface-construction-plan.md 第 10 节（user 2026-11-12：一首歌的另一个语言版本照原版重新调过的平衡和表情对齐，
//   「只是换中文版的歌词和元信息」）。脚本里不写任何人的路径和歌名；用 app 自己的读写代码（openBytes → 改 → saveMxl），不手改压缩包。
//
//   node --experimental-strip-types scripts/swap-lyrics.mjs <当底.mxl> <出词.mxl>              只看不写：打清单
//   node --experimental-strip-types scripts/swap-lyrics.mjs <当底.mxl> <出词.mxl> <输出.mxl>   做出来 + 两头核对（输出已经在 = 不写）
//
//   从「出词」拿：每个音上的词（字、词没完、语言；按同一张纸、同一个声部、第几个音对）；歌名、作者栏、许可；这首歌怎么看（谱种、版式和纸、歌词排法、小节号、
//     和弦那几样、中央 C、演奏法和表情显示、每张纸 / 每条轨的显示设置）和视图态；参考窗的卡片；封面。
//   其余全用「当底」：所有的音、所有记号、编排、混音台、乐手配置。
//   搬词之前核这条轨两边的音（音高、叠音、时值、连音线）逐个相同；有一处不同 = 不做（退出码 3），报出来。出词那边没词的轨不用核（音不同照样用当底的，单独列出来）。
//   两头核对：做出来的和当底比，只许差「歌词 / 歌名 / 作者栏 / 许可 / 显示方式 / 视图态 / 参考窗卡片 / 封面」；和出词比，只许差「增益推子 / 表情记号」
//     加上清单里单独列出来的那几类。多出任何一类 = 不写（退出码 4）。
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { openBytes, saveMxl } from "../src/format/project.ts";
import { CORE_VERSION } from "../src/core/version.ts";
import { coreHash } from "./core-hash.mjs";

const [baseFile, wordsFile, outFile] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!baseFile || !wordsFile) { console.error("usage: swap-lyrics.mjs <当底.mxl> <出词.mxl> [<输出.mxl>]"); process.exit(2); }
const open = (f) => openBytes(f.split("/").pop(), new Uint8Array(readFileSync(f)));
const base = open(baseFile), words = open(wordsFile);

// ── 分类 ──
const LOOK_KEYS = ["notation", "chordTags", "viewInC", "chords", "density", "lyricFit", "barNumbers", "middleC", "expressions", "paper"];   // 这首歌怎么看（src/score/song-view.ts UNWRITTEN + 纸 / 版式）
const META_KEYS = { title: "歌名", credits: "作者栏", rights: "许可" };
const LYRIC_FIELDS = ["lyric", "hyph", "lang"], SOUND_FIELDS = ["pitch", "chord", "dur", "tie", "staff"], EXPR_FIELDS = ["art", "slur", "inhale"];
const EXPR_KINDS = new Set(["dyn", "hairpin"]);
const J = (x) => JSON.stringify(x ?? null, (_k, v) => (v instanceof Uint8Array ? `bytes:${v.length}:${v.reduce((a, b) => (a * 31 + b) >>> 0, 7)}` : v));
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined && o[k] !== null && !(k === "art" && !o[k].length)).map((k) => [k, o[k]]));
const strip = (t, drop) => Object.fromEntries(Object.entries(t).filter(([k]) => k !== "id" && !drop.includes(k)));
/** 一条轨拆成几样签名：timed = 每个音 / 休止的「音」；lyr = 每个音的词；expr / other = 每个音 / 休止前面挂着的记号 + 音身上的（按第几个音 / 休止排）。 */
function sigs(tokens) {
  const timed = [], lyr = [], expr = [], other = []; let preE = [], preO = [];
  const flush = (sound, t) => { timed.push(sound); expr.push(J([preE, t ? pick(t, EXPR_FIELDS) : null])); other.push(J([preO, t?.harm ?? null])); preE = []; preO = []; };
  for (const t of tokens ?? []) {
    if (t.kind === "note") { flush(J(pick(t, SOUND_FIELDS)), t); lyr.push(J(pick(t, LYRIC_FIELDS))); }
    else if (t.kind === "rest") flush(J(["rest", t.dur, t.staff ?? null]), null);
    else if (EXPR_KINDS.has(t.kind)) preE.push(strip(t, []));
    else preO.push(strip(t, []));
  }
  expr.push(J([preE])); other.push(J([preO]));
  return { timed, notes: timed.filter((s) => !s.startsWith("[\"rest\"")), lyr, expr, other };
}
const diffCount = (a, b) => { let n = Math.abs(a.length - b.length); for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) n++; return n; };
const studioOf = (ex) => ex.studio ?? {};
/** 两份歌（openBytes 的结果）按类比：回「类 → 几处 + 例子」。 */
function compare(a, b) {
  const cats = new Map(), add = (c, what) => { const e = cats.get(c) ?? { n: 0, ex: [] }; e.n++; if (e.ex.length < 40) e.ex.push(what); cats.set(c, e); };
  for (const [k, name] of Object.entries(META_KEYS)) if (J(a.song[k]) !== J(b.song[k])) add(name, k);
  for (const k of LOOK_KEYS) if (J(a.song[k]) !== J(b.song[k])) add("显示方式", k);
  const songOther = new Set([...Object.keys(a.song), ...Object.keys(b.song)].filter((k) => !["papers", "parts", ...LOOK_KEYS, ...Object.keys(META_KEYS)].includes(k)));
  for (const k of songOther) if (J(a.song[k]) !== J(b.song[k])) add("别的歌字段", k);
  const partsA = new Map(a.song.parts.map((p) => [p.id, p])), partsB = new Map(b.song.parts.map((p) => [p.id, p]));
  if (J([...partsA.keys()]) !== J([...partsB.keys()])) add("声部", "声部不一样");
  for (const [id, p] of partsA) { const q = partsB.get(id); if (!q) continue; if (J(p.chords) !== J(q.chords)) add("显示方式", `${id}.chords`); if (J(strip(p, ["chords"])) !== J(strip(q, ["chords"]))) add("声部", id); }
  const papersB = new Map(b.song.papers.map((p) => [p.id, p]));
  if (J(a.song.papers.map((p) => [p.id, p.name])) !== J(b.song.papers.map((p) => [p.id, p.name]))) add("纸", "纸不一样");
  for (const pa of a.song.papers) {
    const pb = papersB.get(pa.id); if (!pb) continue;
    if (J(pa.looks) !== J(pb.looks)) add("显示方式", `${pa.name}.looks`);
    const restA = strip(pa, ["tracks", "looks", "name"]), restB = strip(pb, ["tracks", "looks", "name"]); if (J(restA) !== J(restB)) add("别的记号", `${pa.name} 纸上的 ${Object.keys(restA).join("/")}`);
    for (const pid of new Set([...Object.keys(pa.tracks), ...Object.keys(pb.tracks)])) {
      const sa = sigs(pa.tracks[pid]), sb = sigs(pb.tracks[pid]), at = `${pa.name}·${pid}`;
      if (J(sa.timed) !== J(sb.timed)) add("音", `${at}（音 ${sa.notes.length} 对 ${sb.notes.length}，不同 ${diffCount(sa.timed, sb.timed)} 处）`);
      const hasLyr = (l) => l.some((x) => x !== "{}");   // 两边这条轨都没有词 = 不比（音数不同时「每个音的词」这一列长度不同，不算歌词不同）
      if ((hasLyr(sa.lyr) || hasLyr(sb.lyr)) && J(sa.lyr) !== J(sb.lyr)) add("歌词", `${at}（${diffCount(sa.lyr, sb.lyr)} 个音）`);
      if (J(sa.expr) !== J(sb.expr)) add("表情记号", `${at}（${diffCount(sa.expr, sb.expr)} 处）`);
      if (J(sa.other) !== J(sb.other)) add("别的记号", `${at}（${diffCount(sa.other, sb.other)} 处）`);
    }
  }
  // 混音台：推子（每条轨、总线、总轨的增益）/ 别的（声像、链、发送、出到、名字…）
  const ta = new Map((studioOf(a.extras).tracks ?? []).map((t) => [t.id, t])), tb = new Map((studioOf(b.extras).tracks ?? []).map((t) => [t.id, t]));
  for (const id of new Set([...ta.keys(), ...tb.keys()])) {
    const x = ta.get(id), y = tb.get(id); if (!x || !y) { add("混音台别的", `轨 ${id} 只有一边有`); continue; }
    if (J(x.gainDb) !== J(y.gainDb)) add("增益推子", `${id} ${x.gainDb ?? 0} 对 ${y.gainDb ?? 0}`);
    if (J(strip(x, ["gainDb"])) !== J(strip(y, ["gainDb"]))) add("混音台别的", id);
  }
  const ma = studioOf(a.extras).master ?? {}, mb = studioOf(b.extras).master ?? {};
  if (J(ma.gainDb ?? 0) !== J(mb.gainDb ?? 0)) add("增益推子", `总轨 ${ma.gainDb ?? 0} 对 ${mb.gainDb ?? 0}`);
  if (J(strip(ma, ["gainDb"])) !== J(strip(mb, ["gainDb"]))) add("混音台别的", "总轨");
  if (J(strip(studioOf(a.extras), ["tracks", "master"])) !== J(strip(studioOf(b.extras), ["tracks", "master"]))) add("混音台别的", "录音房别的字段");
  // 乐手配置（每个角色的快照）
  for (const r of new Set([...Object.keys(a.extras.lounge ?? {}), ...Object.keys(b.extras.lounge ?? {})])) if (J(a.extras.lounge?.[r]) !== J(b.extras.lounge?.[r])) add("乐手配置", r);
  if (J(a.extras.sounds) !== J(b.extras.sounds)) add("嵌着的音源", "sounds");
  if (J(a.extras.thumbnail) !== J(b.extras.thumbnail)) add("封面", "thumbnail");
  if (J(a.view) !== J(b.view)) add("视图态", "view");
  if (J(a.references) !== J(b.references)) add("参考窗卡片", `${Object.keys(a.references).length} 对 ${Object.keys(b.references).length}`);
  return cats;
}
/** 乐手配置里两边不一样的键（深比到每个候选的每个键；响度 = calibrationDb 单独标出来）。 */
function loungeDiff(a, b) {
  const out = [];
  for (const r of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
    const x = a?.[r], y = b?.[r]; if (J(x) === J(y)) continue;
    const byId = (arr) => (Array.isArray(arr) && arr.every((e) => e && typeof e === "object" && "id" in e) ? Object.fromEntries(arr.map((e) => [e.id, e])) : null);   // 候选这种带 id 的数组按 id 对
    const walk = (p, u, v) => {
      if (J(u) === J(v)) return;
      const bu = byId(u), bv = byId(v); if (bu && bv) { for (const k of new Set([...Object.keys(bu), ...Object.keys(bv)])) walk(`${p}[${k}]`, bu[k], bv[k]); return; }
      if (u && v && typeof u === "object" && typeof v === "object" && !Array.isArray(u) && !Array.isArray(v)) { for (const k of new Set([...Object.keys(u), ...Object.keys(v)])) walk(`${p}.${k}`, u[k], v[k]); return; }
      out.push(`${p}：${J(u).slice(0, 80)} → ${J(v).slice(0, 80)}`);
    };
    walk(r, x, y);
  }
  return out;
}

// ── 只看：清单 ──
const print = (title, cats) => { console.log(title); if (!cats.size) console.log("  （一样）"); for (const [c, e] of cats) console.log(`  ${c}：${e.n} 处　${e.ex.join("；")}${e.n > e.ex.length ? "；…" : ""}`); };
console.log(`当底：${baseFile}\n出词：${wordsFile}\n`);
const before = compare(base, words);
print("两份现在哪些不一样（当底 → 出词）：", before);

// ── 做：当底整份，换进出词的词和元信息 ──
const song = structuredClone(base.song), stops = [], moved = [], kept = [];
const wPapers = new Map(words.song.papers.map((p) => [p.id, p]));
if (J(song.papers.map((p) => [p.id, p.name])) !== J(words.song.papers.map((p) => [p.id, p.name]))) stops.push("两份的纸（曲段）不一样");
if (J(song.parts.map((p) => p.id)) !== J(words.song.parts.map((p) => p.id))) stops.push("两份的声部不一样");
for (const paper of song.papers) {
  const wp = wPapers.get(paper.id); if (!wp) continue;
  for (const [pid, toks] of Object.entries(paper.tracks)) {
    for (const t of toks) if (t.kind === "note") { t.lyric = null; delete t.hyph; delete t.lang; }   // 当底的词全拿掉（出词那边没词的轨 = 没词）
    const wt = wp.tracks[pid] ?? [], wNotes = wt.filter((t) => t.kind === "note");
    if (!wNotes.some((t) => t.lyric)) continue;
    const bNotes = toks.filter((t) => t.kind === "note"), sb = bNotes.map((t) => J(pick(t, SOUND_FIELDS))), sw = wNotes.map((t) => J(pick(t, SOUND_FIELDS)));
    if (J(sb) !== J(sw)) { const k = sb.findIndex((s, i) => s !== sw[i]); stops.push(`${paper.name}·${pid}：两边的音对不上（当底 ${bNotes.length} 个、出词 ${wNotes.length} 个；第 ${k + 1} 个音起不同）`); continue; }
    let n = 0; bNotes.forEach((t, i) => { const w = wNotes[i]; t.lyric = w.lyric ?? null; for (const f of ["hyph", "lang"]) if (w[f] !== undefined) t[f] = w[f]; if (w.lyric) n++; });
    moved.push(`${paper.name}·${pid}：${n} 个音带词（共 ${bNotes.length} 个音）`);
  }
  if (wp.looks !== undefined) paper.looks = structuredClone(wp.looks); else delete paper.looks;
}
for (const k of [...Object.keys(META_KEYS), ...LOOK_KEYS]) if (words.song[k] !== undefined) song[k] = structuredClone(words.song[k]); else delete song[k];
const wParts = new Map(words.song.parts.map((p) => [p.id, p]));
for (const p of song.parts) { const w = wParts.get(p.id); if (w?.chords !== undefined) p.chords = w.chords; else delete p.chords; }
const extras = { ...base.extras }; if (words.extras.thumbnail) extras.thumbnail = words.extras.thumbnail; else delete extras.thumbnail;

console.log("\n搬的词（按同一张纸、同一个声部、第几个音）："); for (const m of moved) console.log("  " + m);
console.log("\n每一类取自哪边：");
console.log("  出词：歌词（字、词没完、语言）、歌名、作者栏、许可、怎么看（" + LOOK_KEYS.join(" / ") + "、每张纸的 looks、每条轨的 chords）、视图态、参考窗卡片、封面");
console.log("  当底：所有的音、所有记号（力度 / 渐强渐弱 / 渐到 / 演奏法 / 音内起伏 / 换气 / 连线 / 滚奏 / 风格 / 速度 / 反复 / 句号…）、编排、混音台、乐手配置、嵌着的音源");
const ld = loungeDiff(base.extras.lounge, words.extras.lounge), loud = ld.filter((l) => /calibrationDb/.test(l)), rest = ld.filter((l) => !/calibrationDb/.test(l));
console.log(`\n乐手配置两边不一样的（用当底的）：响度 ${loud.length} 处、别的 ${rest.length} 处`); for (const l of [...loud, ...rest]) console.log("  " + l);
if (stops.length) { console.log("\n停：" + stops.join("；")); process.exit(3); }
if (!outFile) { console.log("\n（只看不写：没给输出文件）"); process.exit(0); }

// ── 写 + 两头核对 ──
if (existsSync(outFile)) { console.error(`输出已经在：${outFile}（不覆盖）`); process.exit(5); }
const stamp = JSON.parse(readFileSync(new URL("../dist/build-stamp.json", import.meta.url), "utf8"));
const bytes = saveMxl({ song, hum: song.hum, extras, app: stamp.version ?? "swap-lyrics", date: new Date().toISOString(), view: words.view, references: words.references, core: { version: CORE_VERSION, hash: coreHash() } });
const made = openBytes(outFile.split("/").pop(), bytes);
const vsBase = compare(made, base), vsWords = compare(made, words);
const OK_BASE = new Set(["歌词", "歌名", "作者栏", "许可", "显示方式", "视图态", "参考窗卡片", "封面"]);
const listed = new Set([...before.keys()].filter((c) => !["歌词", "歌名", "作者栏", "许可", "显示方式", "视图态", "参考窗卡片", "封面", "增益推子", "表情记号"].includes(c)));
const OK_WORDS = new Set(["增益推子", "表情记号", ...listed]);
print("\n核对 ①：做出来的 vs 当底（只许差 " + [...OK_BASE].join(" / ") + "）", vsBase);
print("核对 ②：做出来的 vs 出词（只许差 " + [...OK_WORDS].join(" / ") + "）", vsWords);
const bad = [...[...vsBase.keys()].filter((c) => !OK_BASE.has(c)).map((c) => `和当底多差了「${c}」`), ...[...vsWords.keys()].filter((c) => !OK_WORDS.has(c)).map((c) => `和出词多差了「${c}」`)];
if (bad.length) { console.log("\n停（不写）：" + bad.join("；")); process.exit(4); }
writeFileSync(outFile, bytes);
console.log(`\n写好了：${outFile}（${bytes.length} 字节）`);
