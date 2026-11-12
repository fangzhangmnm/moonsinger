// inst-settings.ts —— 乐器设置页（台上是谁 + 这位怎么演 + 记号表 + 谱上叫什么）：全屏占 #stage 的 main，pad 留着当试听键盘。
// created 2026-11-09 by Claude Opus 5.5：从 main.ts 原样搬出来（施工单 ai-docs/20261109-work-order-instrument-pick-vs-tune.md §6「这一页搬出 main.ts…照 header-panel.ts 的形状」；
//   审计风险 2「主程序里一张一张手糊的面板」）。宿主给一组访问器 + 动作，页面自己管画和点击；行为和搬之前一样。各段的来历见段内注释（原注释照搬）。
import { dropdownHtml, mountDropdowns } from "../../ui/dropdown.ts";
import { _t, lang } from "../../i18n/index.ts";
import { roleName, roleSound, activeId, gmCandidates, activeCandidateName, partLabels, activeCalibrationDb, activeTranspose, activePerfSpec, activeGm, withGapSec, withRollHz, withSwellDb, withCalibration, GAP_MAX_SEC, SWELL_DB_MIN, SWELL_DB_MAX, type Extras, type Engine } from "../../format/project.ts";
import { UNWRITTEN_CALIBRATION_DB, ROLL_HZ_MIN, ROLL_HZ_MAX, MARK_DEFAULTS } from "../../format/performance.ts";
const MARK_DEFAULTS_SWELL = MARK_DEFAULTS.swellDb;
import { performerOf } from "../../performers/index.ts";
import type { InspectorCtx } from "../../performers/registry.ts";
import { ignoredArts, rollDefaultHz, depthCurve, velocityForDb, SF2_VEL_DEPTH, type Mark } from "../../score/perform.ts";
import { sf2VelocityCurve, type VelCurve } from "../../gm/sf2-subset.ts";
import { sfKey } from "../../gm/sf-key.ts";
import { DYNS, type Dyn, type Hum, type Song } from "../../score/song.ts";
import { jointOf, GS_LIBRARY_ID, type Catalog } from "../../gm/catalog.ts";
import { DYN_GLYPH } from "../../render/smufl.ts";

export interface InstSettingsHost {
  shown(): boolean;                    // 乐器页开着没
  extras(): Extras; song(): Song; at(): { paper: string; part: string }; role(): string; engine(): Engine;
  catalog(): Catalog | null;           // 音乐目录（没载 = null）
  needCatalog(): void;                 // 目录还没载：载上，载好重画
  padHidden(): boolean;                // 试听键盘收着没（顶条「键盘」亮不亮）
  abbr(k: number): string;             // 第 k 个声部谱前的简写
  sessionHas(sha256: string): boolean; // 这次打开里找到过这个子集（弱引用的状态行）
  bankBytes(sha256: string): Uint8Array | undefined; // 这次打开里手边的子集字节（乐器页读库写的力度深度，9-4）
  // 动作
  commit(next: Extras, label: string, gesture?: string): void;   // 改这位的设置（走 undo；同一个旋钮连着点并成一步）
  setHum(h: Hum): void; setPart(id: string): void; silence(): void;
  back(): void; togglePad(): void; openFinder(): void; findBankFile(candId: string): void;
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const chip = (v: string, label: string, on: boolean, title = "") => `<button class="btn cand${on ? " is-on" : ""}" data-v="${esc(v)}"${title ? ` title="${esc(title)}"` : ""}>${label}</button>`;
const fmtDb = (dB: number) => `${dB > 0 ? "+" : dB < 0 ? "−" : ""}${Math.abs(dB)} dB`;
const sizeText = (n: number) => (n < 1e6 ? `${Math.max(1, Math.round(n / 1e3))} KB` : `${(n / 1e6).toFixed(1)} MB`);
const HUMS: [Hum, string][] = [["n", _t("ん / 嗯")], ["a", _t("あ / 啊")], ["o", _t("お / 哦")], ["u", _t("う / 呜")], ["la", _t("ら / 啦")]];

/** el = 页面的容器（宿主建好、挂进 #stage）。返回 draw = 重画（开着才画）。 */
export function createInstSettings(el: HTMLElement, h: InstSettingsHost): { draw(): void } {
  let instAdvOpen = false;   // 「高级」折叠开着没（重画保持）
  /** 「记号怎么演」：这位演奏者 by value 带着的解读表，原样摊开（user 2026-10-08「记号怎么解读应该乐器里面有explicit的配置，而不是代码写死」）。现在只读；改数以后做。 */
  function marksTableHtml(role: string, eng: string): string {
    const sp = activePerfSpec(h.extras(), role), ms = (x: number) => `${Math.round(x * 1000)} ms`, pct = (x: number) => `${Math.round(x * 100)}%`, db = (x: number) => `${x > 0 ? "+" : ""}${x} dB`;
    const plug0 = performerOf(eng);
    const ign = ignoredArts(performerOf(eng), sp.gapSec), sung = performerOf(eng)?.sound === "chunks", gray = (m: string) => (ign.includes(m as Mark) ? ` class="ign"` : "");
    const singTxt = (k: string) => { const m = sp.sing[k]; return m ? _t("{p}前「{mark}」{p2}", { p: m.at === "next" ? _t("下一个字") : _t("这个字"), mark: m.mark, p2: m.mark === "^" ? _t("（顿一下，不换气）") : m.mark === "v" ? _t("（换气）") : _t("（大口换气）") }) : _t("不变成唱法记号"); };
    const vel = performerOf(eng)?.dynamics === "velocity";   // 按力度敲 / 按音量曲线 = 插件的能力（9-2 起不再看「有没有力度表」）
    // 这一类怎么变响 / 变轻（2026-10-08 深夜 Opus 5.5；user「月读吃音内减弱吗，普通减弱可以有一样的效果吗还是只影响输入的…月读又是弦又是管所以应该是实时调制的」
    //   「我觉得其实可以不同的类别乐器卡可以说一下」）：按这位实际走的那条路说（perform.ts：按力度敲 = MIDI 力度，按音量曲线 = 乘在出来的声音上；力度 → 响度两边同一条，9-2）
    const how = vel
      ? _t("按下那一下的轻重（MIDI 力度）：渐强渐弱 = 每个新音一个台阶，按住的音中间不变；一个音里面要变，用音内起伏{canSwell}", { canSwell: sp.canSwell ? "" : _t("（这件乐器按下去就自然衰减：音内只能变弱）") })
      : _t("一条连续的音量曲线（乘在{sung}出来的声音上）：渐强渐弱在一个长音中间也一直在变，和音内起伏是同一种变法；只变响度、不变音色{sung2}", { sung: sung ? _t("唱##出声") : _t("弹##出声"), sung2: sung ? _t("（真人渐弱会变虚、变暗，这个还没有）") : "" });
    const rows: [string, string, string][] = [
      [_t("力度怎么变"), "", how],
      [_t("力度记号"), "", _t("力度表：{string}", { string: (Object.entries(sp.dynamicsVel) as [string, number][]).map(([d, x]) => `${d} ${x}`).join(" · ") })],
      [_t("渐强渐弱没写终点"), "", _t("走一档 = 力度 {wedgeStepVel}", { wedgeStepVel: sp.wedgeStepVel })],
      [_t("幽灵音"), "ghost", vel ? _t("力度 {ghostVel}", { ghostVel: sp.ghostVel }) : _t("整个音 {ghostDb}", { ghostDb: db(sp.ghostDb) })],
      [_t("弱化"), "unstress", vel ? _t("力度 {unstressVel}", { unstressVel: sp.unstressVel }) : _t("整个音 {unstressDb}", { unstressDb: db(sp.unstressDb) })],
      [_t("次重音"), "stress", vel ? _t("力度 +{stressVel}", { stressVel: sp.stressVel }) : _t("音头 {accentSec} {stressDb}", { accentSec: ms(sp.accentSec), stressDb: db(sp.stressDb) })],
      [_t("重音"), "accent", vel ? _t("力度 +{accentVel}", { accentVel: sp.accentVel }) : _t("音头 {accentSec} {accentDb}{sung}", { accentSec: ms(sp.accentSec), accentDb: db(sp.accentDb), sung: sung ? `；${singTxt("accent")}` : "" })],
      [_t("强音"), "marcato", vel ? _t("力度 +{marcatoVel}", { marcatoVel: sp.marcatoVel }) : _t("音头 {accentSec} {marcatoDb}{sung}", { accentSec: ms(sp.accentSec), marcatoDb: db(sp.marcatoDb), sung: sung ? `；${singTxt("marcato")}` : "" })],
      [_t("突强 sfz"), "sfz", vel ? _t("力度 +{sfzVel}", { sfzVel: sp.sfzVel }) : _t("音头 {sfzDb}，{sfzSec} 里落回来{sung}", { sfzDb: db(sp.sfzDb), sfzSec: ms(sp.sfzSec), sung: sung ? `；${singTxt("sfz")}` : "" })],
      [_t("强后即弱 fp"), "fp", _t("音头按 f，{fpSec} 里落到 p，之后都是 p{sung}", { fpSec: ms(sp.fpSec), sung: sung ? `；${singTxt("fp")}` : "" })],
      [_t("音内渐强 / 鼓起"), "swellGrow", !sp.canSwell && plug0?.honors.includes("roll") ? _t("做不到：这件乐器按下去就自然衰减（滚奏的音例外：每一下的力度跟着起伏）") : sp.canSwell ? _t("写的力度是最高点：< 从 −{swellDb} dB 长到写的力度；<> 两头 −{swellDb2} dB、中间回到写的力度（强后即弱之后的 < 长回音头的 f）", { swellDb: sp.swellDb, swellDb2: sp.swellDb }) : _t("做不到：这件乐器按下去就自然衰减")],
      [_t("音内渐弱"), "swellFade", _t("一路往下到 −{swellDb} dB", { swellDb: sp.swellDb })],
      [_t("跳音"), "staccato", sung ? singTxt("staccato") : _t("唱 / 弹 {staccatoGate} 的长度", { staccatoGate: pct(sp.staccatoGate) })],
      [_t("保持"), "tenuto", _t("这个音不留缝")],
      [_t("连线"), "slur", _t("连到下一个音、不留缝")],
      [_t("呼吸"), "breath", sung ? singTxt("breath") : _t("前一个音收短 {breathSec}（最多 {breathShare}）", { breathSec: ms(sp.breathSec), breathShare: pct(sp.breathShare) })],
      [_t("出声的换气（轻吸 / 深吸）"), "inhale", sung ? _t("换气的空当里一声吸气（按下一个字的元音塑形，比它轻约 28 dB；深吸 = 空当长一点、响 4 dB）") : _t("做不到：这位只断开，不出吸气声")],
      [_t("气声（× 符头）"), "whisper", sung ? _t("这个字不唱音高：用念的时候的气声（谱包络照旧、声带不振），再轻 6 dB") : _t("做不到：这位只按音高出声")],
      [_t("音和音之间"), "", sung ? _t("连着唱") : _t("{gapSec}（最多 {gapShare}）", { gapSec: ms(sp.gapSec), gapShare: pct(sp.gapShare) })],
      [_t("滚奏"), "roll", _t("整个音敲满，每秒 {hz} 下；每一下按敲下去那一刻的力度（渐强渐弱 / 渐到 / 音内起伏 / 强后即弱都在每一下里），重音这一组只算第一下", { hz: rollHzText(role) })],
    ];
    return `<details class="ip-marks"><summary>${_t("记号怎么演（这位自己的配置，跟着演奏者存进歌）")}</summary><table>${rows.map(([k, m, v]) => `<tr${gray(m)}><th>${k}</th><td>${esc(v)}${m && ign.includes(m as Mark) ? `<span class="ign-tag">${_t("不认")}</span>` : ""}</td></tr>`).join("")}</table></details>`;
  }
  /** 滚奏的默认（7-N 第二批）：鼓类（固定敲一件 / 整套鼓）一律 12、有音高的 14（perform.ts rollDefaultHz）。 */
  function rollDefaultOf(role: string): number {
    const g = activeGm(h.extras(), role);
    return rollDefaultHz(g?.note !== undefined ? g.note : g?.bank === 128 ? 38 : null);   // 整套鼓：哪一件都一样（38 只是「是鼓」）
  }
  function rollHzText(role: string): string {
    const set = activePerfSpec(h.extras(), role).rollHz;
    return String(set !== null ? set : rollDefaultOf(role));
  }
  /** 乐器页「音和音之间」的默认 + 说明：GS 货架上的 = 目录的 joint；自己的 .sf2 = 0（目录不认识）；元音版 = 0（人声连着唱）。目录还没载 = null（先载，载好重画）。 */
  function gapDefaultOf(role: string): { gapSec: number; label: string } | null {
    const g = activeGm(h.extras(), role);
    if (!g) return { gapSec: 0, label: _t("人声（连着唱）") };
    if (g.origin.library !== GS_LIBRARY_ID) return { gapSec: 0, label: _t("自己的 .sf2（目录里没有这个音色的连断数据）") };
    const catalogNow = h.catalog(); if (!catalogNow) { h.needCatalog(); return null; }
    const j = jointOf(catalogNow, g.bank, g.program, g.note);
    return j ? { gapSec: j.gapSec, label: j.zh } : { gapSec: 0, label: _t("一下就完 / 音效（不留缝）") };
  }
  /** 乐器页「这个声部是什么」卡上的说明行（v0.16.2）：这件乐器的详细说明（百科名，按值存在歌里）+ 第二行起谱前写的简写。
   *  user 2026-11-07「所以应该是有详细解释，名字，简写？think critically about it」：谱上名在上面的框里，这一行补另外两层。没有挂乐器（自己写的名字）= 只写简写。 */
  function roleDetail(role: string): string {
    const cn = (h.extras().lounge[role] as { concept?: { name?: { zh: string; en: string } } } | undefined)?.concept?.name;
    const k = h.song().parts.findIndex((p) => p.role === role), ab = k >= 0 ? h.abbr(k) : "";
    const en = cn ? cn.en.replace(/^./, (c) => c.toUpperCase()) : "";
    const what = cn ? (lang() === "zh" ? `${cn.zh} · ${en}` : en) : "";
    return `<div class="role-detail">${what ? _t("这件乐器：{what}", { what: esc(what) }) + (ab ? " · " : "") : ""}${ab ? _t("第二行起写 {ab}", { ab: esc(ab) }) : ""}</div>`;
  }
  /** 力度换算表（v0.9.23；user 2026-10-10「wishlist: ppp fff，以及帮我科普这些和db的换算关系，然后应该向用户揭露，方便对比」「揭露表的位置建议是乐器页「力度」那一行 同意」）：
   *  每个力度记号 → 这位的 MIDI 力度 + 响度（9-2 起全体一张表、一条规矩；9-4 起：响度 = 深度 ÷ 960 × 40·log10(力度 ÷ 127)，满力度 = 0 dB，深度 = 库给这件乐器写的 /
   *  小月相和元音版的插件报的；不知道 = 不写 dB 那一行），有 GS 力度层数据的再加一行「第几份录音」（跨层 = 换一份录音）。 */
  function dynTable(sp: { dynamicsVel: Record<Dyn, number> }, layers: { count: number; ranges: [number, number][] } | null, L: ((vel: number) => number | null) | null): string {
    const db = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x)}`;
    const cells = (f: (d: Dyn) => string) => DYNS.map((d) => `<td>${f(d)}</td>`).join("");
    const vel = sp.dynamicsVel;
    return `<table class="dyn-tab"><tr><th></th>${DYNS.map((d) => `<th title="${d}"><span class="smufl">${DYN_GLYPH[d]}</span></th>`).join("")}</tr>` +
      `<tr><th>${_t("MIDI 力度")}</th>${cells((d) => String(vel[d]))}</tr>` +
      // 响度（第 9 节 / 9-2 / 9-4，2026-11-12）：响度 = 深度 ÷ 960 × 40·log10(力度 ÷ 127) dB（满力度 = 0）；一张表看出每档差多少
      // L（7-N）：和出声同一个函数（乐器 = 引擎在那个键上实际的，perform.ts VelDb）；满力度 = 0 dB
      ((top) => (L && top !== null ? `<tr><th>${_t("响度 dB")}</th>${cells((d) => { const x = L(vel[d]); return x === null ? "–" : db(Math.round((x - top) * 10) / 10); })}</tr>` : ""))(L ? L(127) : null) +
      (layers && layers.count > 1 ? `<tr><th>${_t("第几份录音")}</th>${cells((d) => { const k = layers.ranges.findIndex(([lo, hi]) => vel[d] >= lo && vel[d] <= hi); return k >= 0 ? String(k + 1) : "–"; })}</tr>` : "") + `</table>`;
  }
  /** 乐器页的内容（每次改完整页重画；输入框里正在打的字不受影响——只有提交时才改 extras）。 */
  /** 这位的 L 在一个键上（7-N；和出声同一个函数）：乐器 = 库的字节在手边才有（嵌在歌里的 / 这次找到过的），按写的中央 C 换成敲的键；按音量曲线的 = 插件报的深度。没有 = null。 */
  const curves = new Map<string, VelCurve | null>();
  function curveOf(sha: string, bank: number, program: number): VelCurve | null {
    const k = `${sha}|${bank}:${program}`; if (curves.has(k)) return curves.get(k)!;
    const g = gmCandidates(h.extras(), h.role()).find((x) => x.subsetSha256 === sha), bytes = g?.bytes ?? h.bankBytes(sha);
    if (!bytes) return null;   // 没载好：不记，下次画再问
    let c: VelCurve | null = null; try { c = sf2VelocityCurve(bytes, bank, program); } catch { c = null; }
    curves.set(k, c); return c;
  }
  function curveHere(role: string): ((vel: number) => number | null) | null {
    const plug = performerOf(h.engine());
    if (plug?.dynamics === "gain") { const c = depthCurve(plug.velocityDepth ?? SF2_VEL_DEPTH); return (v) => c(60, v); }
    const aid = activeId(h.extras(), role), g = gmCandidates(h.extras(), role).find((x) => x.id === aid); if (!g) return null;
    const c = curveOf(g.subsetSha256, g.bank, g.program), key = sfKey(60, g, activeTranspose(h.extras(), role));
    return c ? (v) => c.at(key, v) : null;
  }
  /** 音内起伏那一行的后半句：按力度敲的 = 滚奏上低 D dB 落到力度几（约几档）；按音量曲线的 = 空。 */
  function swellVelNote(role: string, D: number): string {
    const plug = performerOf(h.engine()); if (plug?.dynamics !== "velocity") return "";
    const L = curveHere(role); if (!L) return _t("滚奏的音上按力度做（声音载好后显示约几档）。");
    const tab = activePerfSpec(h.extras(), role).dynamicsVel, to = velocityForDb((_m, v) => L(v), 60, tab.mf, D);
    const order = DYNS.map((d) => tab[d]), i = order.indexOf(tab.mf); let pos = 0;
    for (let k = 0; k < order.length - 1; k++) if (to >= order[k]! && to <= order[k + 1]!) { pos = k + (to - order[k]!) / Math.max(1, order[k + 1]! - order[k]!); break; }
    return _t("滚奏的音上按力度做：mf（{mf}）低 {d} dB ≈ 力度 {to}（约 {n} 档力度）。", { mf: tab.mf, d: D, to, n: Math.max(0, i - pos).toFixed(1) });
  }
  /** 上场那位所在的库 / 插件报的默认「响度」（9-3）：SoundFont 按候选来自哪个库，别的引擎问自己的插件；没人上场 = 格式里「没写」的值。 */
  function calDefault(role: string): number {
    const aid = activeId(h.extras(), role), g = gmCandidates(h.extras(), role).find((x) => x.id === aid);
    return performerOf(h.engine())?.defaultCalibrationDb(g?.origin.library ?? null) ?? UNWRITTEN_CALIBRATION_DB;
  }
  /** 插件自报参数行要的上下文（ADR-0004 §2.5）：休息室 / 角色 / 哼的字 / 音乐目录（没载 = null）/ 排版小工具。 */
  function inspectorCtx(role: string): InspectorCtx {
    return { extras: h.extras(), role, hum: h.song().hum, catalog: h.catalog(), esc, chip, dynTable: (layers, L) => dynTable(activePerfSpec(h.extras(), role), layers, L), bankBytes: (sha) => h.bankBytes(sha), velCurve: (sha, bank, program) => curveOf(sha, bank, program) };
  }
  function draw(): void {
    if (!h.shown()) return;
    const eng = h.engine(), hum = h.song().hum, role = h.role(), rn = roleName(h.extras(), role), rs = roleSound(h.extras(), role), aid = activeId(h.extras(), role);
    const gms = new Map(gmCandidates(h.extras(), role).map((g) => [g.id, g])), active = gms.get(aid), who = activeCandidateName(h.extras(), role) ?? _t("（没人上场）");
    const status = !active ? "" : active.bytes ? `<div class="cand-status">${_t("声音嵌在歌里（{n}）{library}", { n: sizeText(active.bytes.length), library: active.origin.library ? _t("，来自家族音源库的 {name}", { name: esc(active.origin.name) }) : _t("，来自 {name}", { name: esc(active.origin.name) }) })}</div>`
      : active.path ? `<div class="cand-status">${_t("声音没随这首歌带来，所以没人上场——换一个「谁来演」")}</div>`
      : ((found) => `<div class="cand-status">${_t("弱引用：歌里不带声音，用时从「{name}」找（{found}）", { name: esc(active.origin.name), found: found ? _t("本次已找到") : _t("家族音源库 / 设备缓存 / 你的文件") })}${found ? "" : `<button class="btn" data-v="find:${esc(active.id)}">${_t("找文件…")}</button>`}</div>`)(h.sessionHas(active.subsetSha256));
    const labels = partLabels(h.song(), h.extras()), onPaper = new Set(Object.keys(h.song().papers.find((p) => p.id === h.at().paper)?.tracks ?? {}));
    const parts = h.song().parts.map((p, k) => ({ p, label: labels[k] })).filter((x) => onPaper.has(x.p.id));
    const cal = activeCalibrationDb(h.extras(), role), tr = activeTranspose(h.extras(), role), calDef = calDefault(role);
    const row = (k: string, v: string, note = "") => `<span class="ip-k">${k}</span><div class="ip-v"><div class="ip-ctl">${v}</div>${note ? `<div class="ip-note">${note}</div>` : ""}</div>`;
    // 这位怎么演：通用的行（响度 / 音和音之间 / 力度记号 dB 表 / 哼的字）按能力字段摆；这位自己的行（力度 / 音效 / 修八度 / 八度 / 唱法旋钮 / 分段唱…）由插件自报
    //   （ADR-0004 §2.5「槽旁的参数行由插件自报，不是 main.ts 写死」；2026-10-15 刀 5 之一）。
    const plug = performerOf(eng), ictx = inspectorCtx(role);
    const own = plug?.inspector?.(ictx) ?? [], ownMain = own.filter((x) => !x.place), ownAdv = own.filter((x) => x.place === "adv"), ownTail = own.filter((x) => x.place === "tail");
    const rowOf = (x: { label: string; control: string; note?: string }) => row(x.label, x.control, x.note ?? "");
    const how =
      (plug ? row(_t("响度"), `<b class="ip-val">${fmtDb(cal)}</b><button class="btn" data-v="cal:-1" title="${_t("这位演奏者小声 1 dB")}">−1 dB</button><button class="btn" data-v="cal:1" title="${_t("大声 1 dB")}">+1 dB</button>${cal !== calDef ? `<button class="btn" data-v="cal:def" title="${_t("回到默认 {d}", { d: fmtDb(calDef) })}">${_t("默认")}</button>` : ""}`,
        _t("这位演奏者自己的音量：这个库的默认是 {d}。库和库之间就在这一个数上对齐，几个声部叠在一起也不顶到天花板、不把声音压变样；混音台的推子是这首歌的决定，另算", { d: fmtDb(calDef) })) : "") +
      // 连断的底色（2026-10-08，user「连断 预设 都同意」）：不写记号的音之间留多大缝（毫秒）；按 GM 音色家族给的默认只是起点，好不好听归耳朵。
      //   月读还不认（唱法核心的连 / 断是第 3 步）：不给这一行，谱上的连线 / 保持照规矩画灰
      (plug?.sound === "notes" ? ((gap, d) => row(_t("音和音之间"), `<b class="ip-val">${Math.round(gap * 1000)} ms</b>` +
        `<button class="btn" data-v="gap:-0.01" title="${_t("缝小 10 ms（更连）")}">−10</button><button class="btn" data-v="gap:0.01" title="${_t("缝大 10 ms（更断）")}">+10</button>` +
        (d && Math.abs(gap - d.gapSec) > 1e-9 ? `<button class="btn" data-v="gap:def" title="${_t("回到默认 {p} ms", { p: Math.round(d.gapSec * 1000) })}">${_t("默认")}</button>` : ""),
        _t("不写记号的音和下一个音之间留的缝：0 = 连着。{d}连线（连奏）、保持的音不留缝；呼吸 = 这里断开；跳音另算", { d: d ? _t("{label}：默认 {p} ms（音乐目录给的，按音色逐个）。", { label: esc(d.label), p: Math.round(d.gapSec * 1000) }) : "" })))(activePerfSpec(h.extras(), role).gapSec, gapDefaultOf(role)) : "") +
      // 滚奏的密度（v0.16.64；user 11-07「标准滚奏记号 可以，但是要可以调整密度」）：只给认滚奏的演奏者；没调过 = 按乐器默认，调过 = 「默认」钮回去
      (plug?.honors.includes("roll") ? ((set: number | null, d: number) => row(_t("滚奏"), `<b class="ip-val">${esc(_t("每秒 {n} 下", { n: set ?? d }))}</b>` +
        `<button class="btn" data-v="roll:-2" title="${_t("滚奏稀一点（每秒少 2 下）")}">−2</button><button class="btn" data-v="roll:2" title="${_t("滚奏密一点（每秒多 2 下）")}">+2</button>` +
        (set !== null ? `<button class="btn" data-v="roll:def" title="${_t("回到这件乐器的默认")}">${_t("默认")}</button>` : ""),
        _t("谱上符干带三道斜线的音 = 滚奏：整个音按这个密度敲满；每一下按敲下去那一刻的力度——渐强渐弱 / 渐到、音内起伏（鼓也行）、强后即弱都在每一下的力度里，重音这一组只算第一下、幽灵音 / 弱化每一下都算。默认：鼓类一律 12，有音高的 14（每秒）。")))(activePerfSpec(h.extras(), role).rollHz, rollDefaultOf(role)) : "") +
      // 音内起伏多深（7-N，2026-11-12；user「上了音内渐强是从-6db开始的还是从0开始的这个我也没法配置」）：swellDb，一档 3 dB，3–24，默认 6；按力度敲的旁边写约几档力度
      (plug?.honors.includes("swellGrow") || plug?.honors.includes("swellFade") ? ((D: number) => row(_t("音内起伏多深"), `<b class="ip-val">${D} dB</b>` +
        `<button class="btn" data-v="swell:-3" title="${_t("浅一点（−3 dB）")}">−3</button><button class="btn" data-v="swell:3" title="${_t("深一点（+3 dB）")}">+3</button>` +
        (D !== MARK_DEFAULTS_SWELL ? `<button class="btn" data-v="swell:def" title="${_t("回到默认 {d} dB", { d: MARK_DEFAULTS_SWELL })}">${_t("默认")}</button>` : ""),
        _t("音内渐强 / 渐弱 / 鼓起的深浅：写的力度是最高点，< 从低 {d} dB 长到写的力度、> 收到低 {d} dB、<> 两头低 {d} dB。{vel}", { d: D, vel: swellVelNote(role, D) })))(activePerfSpec(h.extras(), role).swellDb) : "") +
      ownMain.map(rowOf).join("") +
      // 月读 / 元音版：没有「按下去的力度」，力度记号 = 音量曲线；同一个位置摆同一张表（v0.9.23，方便和乐器的那张对比）
      (plug?.dynamics === "gain" ? ((dp: number) => row(_t("力度记号"), "", _t("力度记号 → 力度 → 响度，和乐器同一条规矩（SoundFont 的放法：响度 = 深度 ÷ 960 × 40·log10(力度 ÷ 127)，满力度 = 0 dB）。这位的力度深度 {dp}（照库里人声类和长笛、小提琴这类拉长音的乐器；规范默认 960）；没有录音层，只变响度：{extras}", { dp, extras: dynTable(activePerfSpec(h.extras(), role), null, (v) => depthCurve(dp)(60, v)) })))(plug.velocityDepth ?? SF2_VEL_DEPTH) : "") +
      ((plug?.lyrics ?? "none") !== "none" ? row(_t("哼的字"), HUMS.map(([v, l]) => chip(`hum:${v}`, l, hum === v)).join(""), _t("没写歌词的音唱什么（整首歌一个）")) : "") +
      (ownAdv.length ? `<details class="ip-adv"${instAdvOpen ? " open" : ""}><summary>${_t("高级：唱法核心的旋钮")}</summary>${ownAdv.map(rowOf).join("")}</details>` : "") +
      ownTail.map(rowOf).join("") +
      (!plug ? row("", "", _t("这一版出不了声（别的软件原来的乐器）：换一个「谁来演」")) : "");
    // 整页重画会换掉滚动的那一层（.ip-body）：记下滚到哪、画完放回去（user 2026-10-17「我调歌手设置的时候每调一下页面都会弹回顶端」）；刚打开那一下由 openInstPage 滚回顶
    const keepScroll = el.querySelector<HTMLElement>(".ip-body")?.scrollTop ?? 0;
    el.innerHTML =
      `<div class="ip-bar"><button class="btn" data-v="back" title="${_t("回到谱（Esc）")}">${_t("← 谱")}</button><span class="ip-title">${_t("乐器")}</span>` +
      (parts.length > 1 ? dropdownHtml(parts.map((x) => ({ value: x.p.id, label: x.label })), h.at().part, { cls: "ip-part", title: _t("换一个声部") }) : `<span class="ip-part-one">${esc(parts[0]?.label ?? rn)}</span>`) +   // 下拉 = 界面零件库的标准件（7-T）
      `<span class="ip-gap"></span><button class="btn finder-pad ip-pad${h.padHidden() ? "" : " is-on"}" data-v="pad" title="${_t("试听键盘：开 / 关")}"><svg class="ico"><use href="#piano-keys"/></svg><span>${_t("键盘")}</span></button></div>` +
      `<div class="ip-body"><div class="ip-cols">` +
      // 谁来演 = 一行：台上是谁 + 声音在哪 + 换（v0.16.18 搬家 C：用过的候选、退掉、从 GS 选都搬进乐器目录顶上；这页只留配置）
      `<section class="ip-card ip-who"><h3>${_t("台上")}<small>${_t("演奏者和他手里的琴；名字不上谱")}</small></h3>` +
        `<div class="ip-who-row"><b>${esc(activeCandidateName(h.extras(), role) ?? _t("没人上场"))}</b>${status}</div>` +
        `<div class="ip-btns"><button class="btn primary" data-v="finder" title="${_t("乐器目录：顶上是这首歌里用过的，下面按曲风 / 年代 / 族浏览；右边的键盘试听，选好就换上")}">${_t("换乐器…")}</button>` +
        `</div></section>` +   // 自己的 .sf2 搬进乐器目录（v0.16.37，施工单 §4.3：那里能试听，这里原来是盲选）
      `<section class="ip-card ip-how"><h3>${_t("{who} 怎么演", { who: esc(who) })}<small>${_t("右边的键盘弹的就是台上这位，改了马上能试")}</small></h3><div class="ip-grid">${how}</div>${eng !== "unknown" ? marksTableHtml(role, eng) : ""}</section>` +
      // 谱上叫什么 = 只读一行（v0.16.35；user 11-09「标准名下拉框拿掉…就还是说用乐器的那个」：名字跟目录选的乐器走，改名在声部管理）
      `<div class="ip-what">${_t("谱上写「{rn}」", { rn: esc(rn) })} · MusicXML <code>${esc(rs)}</code> · ${_t("改名在声部管理")}${roleDetail(role)}</div>` +
      `</div></div>`;
    if (keepScroll) el.querySelector<HTMLElement>(".ip-body")!.scrollTop = keepScroll;
    el.querySelector<HTMLDetailsElement>("details.ip-adv")?.addEventListener("toggle", (e) => { instAdvOpen = (e.target as HTMLDetailsElement).open; });
    mountDropdowns(el);
    el.querySelector<HTMLButtonElement>(".ip-part")?.addEventListener("change", (e) => { h.setPart((e.target as HTMLButtonElement).value); draw(); });
  }

  el.addEventListener("click", (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>("[data-v]")?.dataset.v; if (!v) return;
    const role = h.role(), rn = roleName(h.extras(), role), hum = h.song().hum;
    if (v === "back") { h.back(); return; }
    if (v === "pad") { h.togglePad(); draw(); return; }
    if (v === "finder") { h.openFinder(); return; }
    if (v.startsWith("find:")) { h.findBankFile(v.slice(5)); return; }
    if (v.startsWith("gap:")) { const def = gapDefaultOf(role)?.gapSec ?? 0, next = v === "gap:def" ? def : Math.max(0, Math.min(GAP_MAX_SEC, activePerfSpec(h.extras(), role).gapSec + Number(v.slice(4)))); h.commit(withGapSec(h.extras(), role, next, hum), _t("「{rn}」音和音之间 {p} ms", { rn, p: Math.round(next * 1000) }), "gap"); }
    else if (v.startsWith("swell:")) { const cur = activePerfSpec(h.extras(), role).swellDb, next = v === "swell:def" ? null : Math.max(SWELL_DB_MIN, Math.min(SWELL_DB_MAX, cur + Number(v.slice(6)))); h.commit(withSwellDb(h.extras(), role, next, hum), _t("「{rn}」音内起伏 {d} dB", { rn, d: next ?? MARK_DEFAULTS_SWELL }), "swell"); }
    else if (v.startsWith("roll:")) { const cur = activePerfSpec(h.extras(), role).rollHz ?? rollDefaultOf(role), next = v === "roll:def" ? null : Math.max(ROLL_HZ_MIN, Math.min(ROLL_HZ_MAX, cur + Number(v.slice(5)))); h.commit(withRollHz(h.extras(), role, next, hum), next === null ? _t("「{rn}」滚奏回到默认", { rn }) : _t("「{rn}」滚奏每秒 {n} 下", { rn, n: next }), "roll"); }
    else if (v.startsWith("cal:")) { const d = v === "cal:def" ? NaN : Number(v.slice(4)), next = Math.max(-30, Math.min(12, Number.isNaN(d) ? calDefault(role) : activeCalibrationDb(h.extras(), role) + d)); h.commit(withCalibration(h.extras(), role, next, hum), _t("「{rn}」响度校准 {next} dB", { rn, next }), "cal"); }
    else if (v.startsWith("hum:")) h.setHum(v.slice(4) as Hum);
    else { const ch = performerOf(h.engine())?.onInspector?.(v, inspectorCtx(role)); if (!ch) return; h.commit(ch.extras, ch.label, ch.gesture); if (ch.silence) h.silence(); }   // 这位自己的行（力度 / 音效 / 修八度 / 唱法旋钮 / 分段唱…）：插件自己管（ADR-0004 §2.5）
    draw();
  });
  return { draw };
}
