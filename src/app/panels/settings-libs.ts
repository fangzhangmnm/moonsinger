// src/app/panels/settings-libs.ts —— 设置的「音源」「维护」两页：每个库一栏、维护按对象分组（施工单第 13 条 13-2 + 「13 补」+「13 再补」+「13 开工前…五件的回话」）。
//   created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）。user 2026-11-12：「可以，每个库一栏，然后库可以删，builtin的可以装回来」「"版权和使用规则" 我希望是能立刻看到，但是不占空间…问号那么小的字的注释上标？」
//   「同意你说的维护和音源分开，虽然音源里面也可以删，维护而是和缓存有关」。
//   · 两个词：音源页 = 「删」（删库：要重新下载、用到它的声部会不出声）；维护页 = 「清」（清算出来的缓存和运行状态：什么都不丢、会自己再生）。
//   · **维护页的规矩：这一页上的每颗钮，按下去都不会让任何一首歌少东西。**（守卫 test/settings-libs.test.ts 照这句写）
//   · 这里只拼字和分派；碰存储的事一律经宿主交进来的 LibsHost 做（守卫按名字记它碰了什么，对一张白名单）。不 import 歌库 / 同步那一层。
import { settingRowHtml } from "@internal/workbench-elements";
import { _t, lang } from "../../i18n/index.ts";
import { CREDIT_TRANSLATIONS } from "../../singer/credit-translations.ts";
import { escapeHtml as esc } from "../../ui/md-lite.ts";
import { sizeText } from "../../ui/size-text.ts";

export type LibId = "voice" | "gs";

// ── 看的那一份（宿主每次刷新时量好交进来；这里只拼字） ──
export interface PackView { slug: string; ready: boolean; bytesTotal: number; bytesCached: number }
export interface VoiceView {
  packs: readonly PackView[];
  /** 文件夹版（双击打开的那一份）：不下载、不导入、不删，这一栏画灰 + 这一句；不是 = null。 */
  folder: string | null;
  source: string;
  /** 你在这里删了（设备上的记号，v0.17.25）：缺包时不自己下载。 */
  removed: boolean;
}
export interface GsView { name: string; description?: string; bytes: number; cached: boolean; /** 你在这里删了（v0.17.25）。 */ removed: boolean; license: { name: string; summary?: string }; attribution: string; homepage?: string; folder: string | null; source: string }
export interface OwnView {
  sha256: string; bytes: number;
  /** 从这块字节里读出来的名字；undefined = 还在读（先出页面、名字后补）；null = 读不出（写 sha256 前 8 位）。 */
  label: { preset?: string; library?: string; presets: number } | null | undefined;
  /** 现在打开的这首歌里谁用着它、打包着没有（附带的一句，不当名字的来源）。 */
  users: readonly string[]; packed: boolean;
}

/** 模型包的人话名字（「13 再补」第 1 条）：按包的种类（slug 开头）来，不逐个包写死；原名进「?」。 */
export function packLabel(slug: string): string {
  if (slug.startsWith("voice-")) return _t("小月相的声音");
  if (slug.startsWith("runtime-")) return _t("运行引擎");
  const lang = /^lang-([a-z]+)-/.exec(slug)?.[1];
  if (lang === "ja") return _t("日语读音");
  if (lang === "zh") return _t("中文读音");
  if (lang === "en") return _t("英文读音");
  return slug;
}

/** 「存在哪、和谁共用」那一句（统筹「五件的回话」第 1 条：照实际的存法核过——写歌软件住在自己的网址，浏览器按网址分开存，这个网址下只有它自己；
 *  共用的是同一个网址下的正式版和开发版）。**网址或存法变了，这一句跟着改。**测试守不住这种话，所以写在这里。 */
const SHARED = () => _t("存在这个网址下，正式版和开发版共用这一份；在这里删了，另一个版本也要重新下载。");
/** 自带的库三种状态各一句（「?」里；v0.17.25）。 */
const STATES = () => _t("装着 = 在这台设备上，没网也能用；没装 = 用到时会自己下载；你删了 = 不会自己下载，用它的声部不出声，点「装回来」才下。");
const btn = (v: string, label: string, extra = "") => `<button class="btn" type="button" data-v="${v}"${extra}>${label}</button>`;
const off = (label: string, why: string) => `<span class="btn is-off" title="${esc(why)}">${label}</span>`;
const note = (html: string) => `<div class="set-row"><span class="set-note">${html}</span></div>`;
const line = (html: string, right = "") => `<div class="set-row lib-line"><span>${html}</span>${right}</div>`;
const toUpkeep = (lib: LibId) => `<button class="lib-jump" type="button" data-v="goto:upkeep:${lib}">${_t("它的缓存在「维护」里")}</button>`;

/** 小月相那一栏。 */
export function voiceColumnHtml(v: VoiceView): string {
  const total = v.packs.reduce((n, p) => n + p.bytesTotal, 0), have = v.packs.reduce((n, p) => n + (p.ready ? p.bytesTotal : 0), 0);
  const all = v.packs.length > 0 && v.packs.every((p) => p.ready), none = v.packs.every((p) => !p.ready && !p.bytesCached);
  // 三种状态（v0.17.25，统筹「…删掉的库不许自己下回来」）：装着 / 没装（用到时自己下载）/ 你删了（不会自己下载）
  const status = v.folder ? _t("在文件夹里") : all ? _t("装着 · {size}", { size: sizeText(total) })
    : v.removed ? _t("你删了 · 不会自己下载") : none ? _t("没装 · 用到时会自己下载") : _t("装了一部分（{have} / {total}）· 用到时会自己下载", { have: sizeText(have), total: sizeText(total) });
  const parts = v.packs.map((p) => `${esc(packLabel(p.slug))} ${sizeText(p.bytesTotal)}${!v.folder && !all && !none && !p.ready ? _t("（没下）") : ""}`).join(" · ");   // 「没下」只在装了一部分时标
  const tr = CREDIT_TRANSLATIONS[lang() === "zh" ? "zh" : "en"];   // 署名和禁止用途 = 钉着原文的译文（credit-translations.ts）；原文在「全文…」里
  const what = _t("唱歌的那一位：她的声音，和唱的时候要用的几样（运行引擎、日语 / 中文 / 英文读音）。") + `<br>${STATES()}` +
    `<br>${_t("组成（包的原名）：")}${v.packs.map((p) => `<code>${esc(p.slug)}</code>`).join("、")}<br>${SHARED()}`;
  const rules = `<b>${_t("版权和使用规则")}</b><br>${esc(tr.credit).replace(/\n/g, "<br>")}<br>${esc(tr.terms).replace(/\n/g, "<br>")}<br>${btn("lib:doc:voice", _t("全文…"))}`;
  const actions = v.folder ? off(_t("从本机文件导入"), v.folder)
    : `<label class="btn"><svg class="ico"><use href="#import"/></svg>${_t("从本机文件导入")}<input id="impIn" type="file" multiple hidden /></label>` +
      (all ? "" : btn("lib:add:voice", v.removed ? _t("装回来") : _t("现在下载"))) + (none ? "" : btn("lib:del:voice", _t("删")));
  return settingRowHtml({
    labelHtml: esc(_t("小月相")),
    notes: [{ mark: "?", label: _t("这是什么"), html: what }, { mark: "©", label: _t("版权和使用规则"), html: rules }],
    controlHtml: actions,
    belowHtml: line(esc(status)) + line(parts) + (v.folder ? note(esc(v.folder)) : "") +
      `<div class="set-row lib-line"><span>${_t("来源")}</span>${btn("src:default:voice", _t("恢复默认"))}</div>` +
      (v.folder ? `<input id="srcIn" type="url" disabled value="${esc(v.source)}" />` : `<input id="srcIn" type="url" spellcheck="false" autocomplete="off" value="${esc(v.source)}" />`) +
      `<pre id="packSt" class="set-packs" hidden></pre>` + `<div class="set-row">${toUpkeep("voice")}</div>`,
    attrs: { "data-lib": "voice" },
  });
}

/** 乐器音色库那一栏（GeneralUser GS）。 */
export function gsColumnHtml(v: GsView): string {
  const status = v.folder ? _t("在文件夹里") : v.cached ? _t("装着 · {size}", { size: sizeText(v.bytes) }) : v.removed ? _t("你删了 · 不会自己下载") : _t("没装 · 用到时会自己下载");
  const what = esc(v.description ?? "") + `<br>${_t("一个文件（{size}），不是 AI 模型；歌里用到的那几件会切下来打包进歌，这里只是货架。", { size: sizeText(v.bytes) })}<br>${STATES()}<br>${SHARED()}`;
  const rules = `<b>${_t("版权和使用规则")}</b><br>${esc(v.license.name)}${v.license.summary ? `<br>${esc(v.license.summary)}` : ""}<br>${esc(v.attribution)}${v.homepage ? `<br><a href="${esc(v.homepage)}" target="_blank" rel="noopener">${esc(v.homepage)}</a>` : ""}`;
  const actions = v.folder ? "" : v.cached ? btn("lib:del:gs", _t("删")) : btn("lib:add:gs", v.removed ? _t("装回来") : _t("现在下载"));
  return settingRowHtml({
    labelHtml: esc(v.name),
    notes: [{ mark: "?", label: _t("这是什么"), html: what }, { mark: "©", label: _t("版权和使用规则"), html: rules }],
    controlHtml: actions,
    belowHtml: line(esc(status)) + (v.folder ? note(esc(v.folder)) : "") +
      `<div class="set-row lib-line"><span>${_t("来源")}</span>${btn("src:default:gs", _t("恢复默认"))}</div>` +
      `<input id="sndIn" type="url" spellcheck="false" autocomplete="off" value="${esc(v.source)}" />` + `<div class="set-row">${toUpkeep("gs")}</div>`,
    attrs: { "data-lib": "gs" },
  });
}

/** 一块自己加的音色文件叫什么（「预设名 · 音色库名」；读不出 = sha256 前 8 位；还在读 = 「…」）。 */
export function ownLabel(o: Pick<OwnView, "sha256" | "label">): string {
  if (o.label === undefined) return "…";
  if (!o.label || (!o.label.preset && !o.label.library)) return o.sha256.slice(0, 8);
  const preset = o.label.preset ? (o.label.presets > 1 ? _t("{name} 等 {n} 件", { name: o.label.preset, n: o.label.presets }) : o.label.preset) : "";
  return [preset, o.label.library ?? ""].filter(Boolean).join(" · ");
}
/** 「你自己加的音色文件」那一栏：每个文件一行、单独能删（删了就没了）。 */
export function ownColumnHtml(rows: readonly OwnView[], folder: string | null): string {
  const list = folder ? note(esc(folder)) : !rows.length ? note(esc(_t("没有"))) : rows.map((o) =>
    `<div class="set-row lib-own" data-sha="${esc(o.sha256)}"><span><span class="lib-own-name">${esc(ownLabel(o))}</span> · ${sizeText(o.bytes)}` +
    (o.users.length ? `<small class="set-note"> ${esc(_t("这首歌里：{names}（{how}）", { names: o.users.join("、"), how: o.packed ? _t("也打包着") : _t("引用着") }))}</small>` : "") +
    `</span>${btn(`lib:del:own:${o.sha256}`, _t("删"))}</div>`).join("");
  return settingRowHtml({
    labelHtml: esc(_t("你自己加的音色文件")),
    notes: [{ mark: "?", label: _t("这是什么"), html: _t("从自己的 .sf2 选乐器时、或者「全部解包」时留在这台设备上的小块（名字是从这块文件里读的）。不是自带的：删了就没了，没有原来的 .sf2 就找不回来。") }],
    belowHtml: list,
    attrs: { "data-lib": "own" },
  });
}

// ── 维护页（「13 补」：按对象分组；「13 再补」：拿掉只用「清」、渲染那一串一首一行） ──
export interface RenderRow { key: string; title: string; secs: number; size: number; at: number; old: boolean; coreVersion: string; links: readonly string[] }
export interface UpkeepView {
  speech: { bytes: number; budget: number; entries: number } | null; speechNote: string | null;
  /** 小月相引擎现在占的内存（每条道的 WASM 堆加起来；还没起来 = null）。 */
  engineBytes: number | null;
  gsMemBytes: number;
  renders: { rows: readonly RenderRow[]; bytes: number; oldCount: number; oldBytes: number; coreNow: string } | null;
}
const group = (lib: LibId | null, title: string, what: string, body: string, attr: string) => settingRowHtml({
  labelHtml: lib ? `<button class="lib-jump lib-group-title" type="button" data-v="goto:sound:${lib}">${esc(title)}</button>` : esc(title),
  ...(what ? { notes: [{ mark: "?", label: _t("这是什么"), html: what }] } : {}),
  belowHtml: body, attrs: { "data-group": attr },
});
/** 小月相那一组：念过的句子、引擎。 */
export function upkeepVoiceHtml(v: Pick<UpkeepView, "speech" | "speechNote" | "engineBytes">): string {
  return group("voice", _t("小月相"), _t("念过的句子：念过的歌词存在这台设备上，跨歌共用、重开 app 也在，清了只是要重念。引擎：唱歌的程序占的内存只涨不落，清 = 重开它、内存还回去（念过的句子不丢）。"),
    line(esc(v.speech ? _t("念过的句子：{bytes} / 预算 {budget}，{entries} 条", { bytes: sizeText(v.speech.bytes), budget: sizeText(v.speech.budget), entries: v.speech.entries }) : (v.speechNote ?? _t("念过的句子：…"))), btn("sp:clear", _t("清"))) +
    line(esc(v.engineBytes === null ? _t("引擎：还没起来") : _t("引擎：内存 {size}", { size: sizeText(v.engineBytes) })), v.engineBytes === null ? "" : btn("eng:restart", _t("清"))), "voice");
}
/** 乐器音色库那一组：清内存（文件不动）。 */
export function upkeepGsHtml(memBytes: number): string {
  return group("gs", _t("乐器音色库"), _t("载进内存的整包（最多两份）；清了只是下次用到时从设备上再读一次，文件不动。"),
    line(esc(memBytes ? _t("内存里：{size}", { size: sizeText(memBytes) }) : _t("内存里：没占")), memBytes ? btn("snd:mem", _t("清内存")) : ""), "gs");
}
/** 渲染好的声音那一组：一首一行、「清」在行尾；日期跟界面语言；正文只写「旧版本渲的」，版本号进「?」。 */
export function upkeepRendersHtml(r: UpkeepView["renders"], keep: number): string {
  const olds = r?.rows.filter((x) => x.old) ?? [];
  const what = _t("导出或「渲染到缓存」时放进来的整首歌声，歌库封面上的 ▶ 靠它；只在这台设备上、不同步，最多 {n} 首，满了丢最久没听的；清了只是要重渲。", { n: keep }) +
    (r ? `<br>${_t("这一版的渲染核心是 {v}；标「旧版本渲的」= 更早的渲染核心渲的，照样能听：", { v: r.coreNow })}${olds.length ? olds.map((x) => `<br>· ${esc(x.title)} — ${esc(x.coreVersion)}`).join("") : _t("（现在没有）")}` : "");
  const body = !r ? line("…") : !r.rows.length ? note(esc(_t("还没有记着的"))) :
    line(esc(_t("{n} 首 · {size}", { n: r.rows.length, size: sizeText(r.bytes) })), (r.oldCount ? btn("rc:old", _t("清旧版本渲的（{n} 条，共 {size}）", { n: r.oldCount, size: sizeText(r.oldBytes) })) : "") + btn("rc:clear", _t("清"))) +
    r.rows.map((x, i) => `<div class="set-row lib-line rc-row"><span>${esc(_t("{title} · {secs} 秒 · {size} · {date}", { title: x.title, secs: x.secs.toFixed(0), size: sizeText(x.size), date: new Date(x.at).toLocaleDateString(lang()) }))}` +
      (x.old ? `<small class="set-note rc-core is-old"> ${esc(_t("旧版本渲的"))}</small>` : "") +
      (x.links.length ? `<small class="set-note"> ${esc(_t("歌库里：{names}", { names: x.links.join("、") }))}</small>` : "") + `</span>${btn(`rc:del:${i}`, _t("清"))}</div>`).join("");
  return group(null, _t("渲染好的声音"), what, `<div id="rcList">${body}</div>`, "renders");
}
/** 声音设备、软件、诊断日志三组（钮的 data-v 和原来一样）。「检查更新」不在这里：它和版本号一起在每一页底下（「13 再补」第 6 条）。 */
export function upkeepRestHtml(o: { canShare: boolean; diagText: string }): string {
  return group(null, _t("声音设备"), _t("声音不对劲的时候按一下（按键有延迟、没有声音）：把通向扬声器的那一段换成新的，排着没播完的声音一起丢掉。正在响的声音会断一下"),
      `<div class="set-row">${btn("audio:revive", _t("重启声音"))}</div>`, "audio") +
    group(null, _t("软件"), _t("「清缓存重启」= 卡在旧版本时用：清掉这个 app 自己的离线缓存再重开；歌、模型包、音源都不动。"),
      `<div class="set-row">${btn("reset", _t("清缓存重启"))}</div>`, "shell") +
    group(null, _t("诊断日志"), _t("黑匣子：出错了把这个发给开发者；不上传，只有点「复制 / 分享」才离开设备"),
      `<pre id="diagTxt" hidden>${esc(o.diagText)}</pre><div class="set-row">${btn("diag:view", _t("看…"))}${btn("diag:copy", _t("复制"))}${btn("diag:download", _t("下载 .txt"))}${o.canShare ? btn("diag:share", _t("分享…")) : ""}${btn("diag:clear", _t("清"))}</div>`, "diag");
}

// ── 按下去做什么（宿主交进来的存储操作；这里只排先后、问一句、说一句） ──
export interface LibsHost {
  ask(title: string, msg: string, ok: string, danger?: boolean): Promise<boolean>;
  info(msg: string): void;
  error(msg: string): void;
  /** 现在打开的这首歌里，删了这个库会不出声的声部名（只引用、没打包的）。 */
  silencedBy(lib: LibId | { sha256: string }): string[];
  /** 这个库现在在设备上占多大（问之前写进面板）。 */
  sizeOf(lib: LibId | { sha256: string }): number;
  voice: { delete(): Promise<void>; install(onPct: (p: number) => void): Promise<void> };
  /** 「你删了」的记号（设备键值，v0.17.25）：删成功才记、装成功才去掉。 */
  removed: { set(lib: LibId, on: boolean): void };
  sounds: { delete(sha256: string): Promise<void>; installGs(onPct: (p: number) => void): Promise<void>; releaseMemory(): void; gsSha: string };
  speech: { clear(): Promise<void> };
  lanes: { restart(): void };
  renders: { clearAll(): Promise<void>; clearOld(): Promise<{ count: number; bytes: number }>; clear(index: number): Promise<boolean> };
  audio: { revive(): Promise<boolean> };
  shell: { check(): Promise<void>; reset(): Promise<void> };
  diag: { view(): void; copy(): void; download(): void; share(): void; clear(): void };
  /** 改完了：重量重画（哪一块）。 */
  refresh(what: "sound" | "upkeep"): void;
  /** 「它的缓存在维护里」/ 维护里的组名：跳到另一页的那一栏 / 那一组。 */
  goto(page: "sound" | "upkeep", lib: LibId): void;
  /** 「全文…」：小月相的署名与使用条款全文（原文 + 译文）。 */
  doc(lib: "voice"): void;
  progress(text: string): void;
}
/** 「装回来」/「现在下载」（音源页、不出声的清单都走这一个；v0.17.25）：下好了才去掉「你删了」的记号。 */
export async function libInstall(h: Pick<LibsHost, "voice" | "sounds" | "removed" | "info" | "error" | "progress" | "refresh">, lib: LibId): Promise<boolean> {
  let ok = false;
  try {
    if (lib === "voice") await h.voice.install((p) => h.progress(_t("下载小月相 {p}%", { p }))); else await h.sounds.installGs((p) => h.progress(_t("下载乐器音色库 {p}%", { p })));
    h.removed.set(lib, false); ok = true;
    h.info(lib === "voice" ? _t("小月相装好了") : _t("乐器音色库装好了"));
  } catch (e) { h.error(_t("没装上：{e}", { e: (e as Error).message })); }
  h.progress(""); h.refresh("sound"); return ok;
}
/** 维护页的「清」：做；成了说一句（done 可以是做完回的那一句），没成也说一句（「删和清失败了要说一句」，v0.17.25）。 */
async function cleared(h: LibsHost, run: () => Promise<unknown>, done: string): Promise<void> {
  try { const r = await run(); const msg = typeof r === "string" && r ? r : done; if (msg) h.info(msg); }
  catch (e) { h.error(_t("没清掉：{e}", { e: (e as Error).message })); }
  h.refresh("upkeep");
}
const silenced = (h: LibsHost, lib: LibId | { sha256: string }) => { const n = h.silencedBy(lib); return n.length ? _t("现在打开的歌里，{names} 会不出声。", { names: n.join("、") }) : _t("现在打开的歌里没有声部会因此不出声。"); };
/** 按下一颗钮（data-v）。认得 = true（宿主就不用再管）；不认得 = false。 */
export async function libAction(h: LibsHost, v: string): Promise<boolean> {
  if (v === "lib:del:voice") {
    if (!(await h.ask(_t("删掉小月相？"), _t("占 {size}。删了之后不会自己下载，用到她的声部不出声，直到你点「装回来」（要联网）；念过的句子一起清掉。{silenced}{shared}", { size: sizeText(h.sizeOf("voice")), silenced: silenced(h, "voice"), shared: SHARED() }), _t("删"), true))) return true;
    try { await h.voice.delete(); } catch (e) { h.error(_t("没删掉：{e}", { e: (e as Error).message })); h.refresh("sound"); return true; }
    h.removed.set("voice", true);   // 删成功才记：从这以后缺包不自己下载（v0.17.25）
    try { await h.speech.clear(); } catch (e) { h.error(_t("念过的句子没清掉：{e}", { e: (e as Error).message })); }
    h.lanes.restart();   // 删库时顺带清掉它自己的缓存（「13 补」）；引擎关掉，内存还回去
    h.info(_t("小月相删了：不会自己下载，用到她的声部不出声；要用时点「装回来」")); h.refresh("sound"); h.refresh("upkeep"); return true;
  }
  if (v === "lib:del:gs") {
    if (!(await h.ask(_t("删掉乐器音色库？"), _t("占 {size}。删了之后不会自己下载：歌里打包着声音的照样响，只引用它的不出声，直到你点「装回来」（要联网）。{silenced}{shared}", { size: sizeText(h.sizeOf("gs")), silenced: silenced(h, "gs"), shared: SHARED() }), _t("删"), true))) return true;
    try { await h.sounds.delete(h.sounds.gsSha); } catch (e) { h.error(_t("没删掉：{e}", { e: (e as Error).message })); h.refresh("sound"); return true; }
    h.removed.set("gs", true); h.sounds.releaseMemory();
    h.info(_t("乐器音色库删了：不会自己下载，只引用它的声部不出声；要用时点「装回来」")); h.refresh("sound"); h.refresh("upkeep"); return true;
  }
  if (v.startsWith("lib:del:own:")) {
    const sha256 = v.slice("lib:del:own:".length);
    if (!(await h.ask(_t("删掉这个音色文件？"), _t("占 {size}。不是自带的：删了就没了，没有原来的 .sf2 就找不回来。{silenced}", { size: sizeText(h.sizeOf({ sha256 })), silenced: silenced(h, { sha256 }) }), _t("删"), true))) return true;
    try { await h.sounds.delete(sha256); } catch (e) { h.error(_t("没删掉：{e}", { e: (e as Error).message })); }
    h.refresh("sound"); return true;
  }
  if (v === "lib:add:voice" || v === "lib:add:gs") { await libInstall(h, v === "lib:add:voice" ? "voice" : "gs"); return true; }
  if (v === "lib:doc:voice") { h.doc("voice"); return true; }
  const go = /^goto:(sound|upkeep):(voice|gs)$/.exec(v); if (go) { h.goto(go[1] as "sound" | "upkeep", go[2] as LibId); return true; }
  // 维护页：只清缓存和运行状态
  if (v === "sp:clear") { await cleared(h, () => h.speech.clear(), _t("念过的句子清了（要重念）")); return true; }
  if (v === "eng:restart") { h.lanes.restart(); h.info(_t("小月相的引擎重开了，内存还回去了（念过的句子不丢）")); h.refresh("upkeep"); return true; }
  if (v === "snd:mem") { h.sounds.releaseMemory(); h.refresh("upkeep"); return true; }
  if (v === "rc:clear") { await cleared(h, () => h.renders.clearAll(), _t("渲染好的声音清了（要听再渲）")); return true; }
  if (v === "rc:old") { await cleared(h, async () => { const r = await h.renders.clearOld(); return _t("清了 {n} 条旧版本渲的（{size}）：歌库里要听再渲", { n: r.count, size: sizeText(r.bytes) }); }, ""); return true; }
  if (v.startsWith("rc:del:")) { await cleared(h, async () => ((await h.renders.clear(Number(v.slice(7)))) ? _t("清了这一遍（要听再渲）") : ""), ""); return true; }
  if (v === "audio:revive") { const ok = await h.audio.revive(); h.info(ok ? _t("声音重启了") : _t("换过了，但声音设备还没起来：再按一次，或者把 app 关掉重开")); return true; }
  if (v === "check") { await h.shell.check(); return true; }
  if (v === "reset") { await h.shell.reset(); return true; }
  if (v === "diag:view") { h.diag.view(); return true; }
  if (v === "diag:copy") { h.diag.copy(); return true; }
  if (v === "diag:download") { h.diag.download(); return true; }
  if (v === "diag:share") { h.diag.share(); return true; }
  if (v === "diag:clear") { h.diag.clear(); return true; }
  return false;
}
/** 维护页上的钮（守卫：按下去都不许让任何一首歌少东西）。 */
export const UPKEEP_ACTIONS = ["goto:sound:", "sp:clear", "eng:restart", "snd:mem", "rc:clear", "rc:old", "rc:del:", "audio:revive", "check", "reset", "diag:view", "diag:copy", "diag:download", "diag:share", "diag:clear"] as const;

