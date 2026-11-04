// i18n 运行时 —— _t(中文原文, 参数) + 当前语言 + setLang（重载制）。created 2026-11-04 by Claude Opus 5.5（v0.15.0）
//   形状抄 WeebPaint src/i18n（一张表、类型门、语言一经解析就锁死、切换 = 存 + 重载），差别：键 = 中文原文。
//   为什么键用原文：① 源码读得懂（两千条散在模板串里，换成代号就没法读了）② 中文界面零改动、现有测试照跑
//   ③ `_t("新的话")` 表里没有 = tsc 报错 = 漏译编译不过；工具 tools/i18n-sync.mjs 列出缺的。
//   同一句中文要两种英文 = 键后面加 `##上下文`（`_t("弹##出声")`）：中文只显示 ## 前面，表里是另一条（少见）。
//
//   语言怎么定（一处）：
//     · 主线程：device-kv `lang`（人选过）→ 系统语言（zh* = 中文，别的 = 英文；同 WeebPaint「未支持的语言 → 英文」）
//     · worker：主线程起 worker 时写进 worker 名字（workerOptions），worker 里读不到 device-kv
//     · node（单测 / 命令行渲染）/ AudioWorklet：中文原文，不查表
//   图标不翻（图标就是图标），只翻它的 tooltip。字串里不要写英文双引号：很多条落在 title="…" 里，用 “ ”。
import { S, type Lang, type Key } from "./strings.ts";
import { deviceKvGet, deviceKvSet } from "../device-kv.ts";

export type { Lang, Key } from "./strings.ts";
export const LANGS: readonly Lang[] = ["zh", "en"];
/** 语言名 = 各语言自称，不翻译。 */
export const LANG_NAME: Record<Lang, string> = { zh: "中文", en: "English" };

const valid = (v: unknown): Lang | null => (LANGS.includes(v as Lang) ? (v as Lang) : null);

function detect(): Lang {
  const g = globalThis as unknown as { process?: { versions?: { node?: string } }; document?: unknown; name?: unknown; navigator?: { language?: string } };
  if (g.process?.versions?.node) return "zh";   // 单测 / 命令行：看原文
  if (typeof g.document === "undefined") {       // worker / worklet
    const m = typeof g.name === "string" ? /^lang=(\w+)/.exec(g.name) : null;
    return valid(m?.[1]) ?? "zh";
  }
  const saved = valid(deviceKvGet("lang"));
  if (saved) return saved;
  return (g.navigator?.language ?? "en").toLowerCase().startsWith("zh") ? "zh" : "en";
}

let _lang: Lang | null = null;
/** 当前语言。第一次问的时候定下来，这一页不再变（切换 = 重载，不要半译状态）。 */
export function lang(): Lang { return (_lang ??= detect()); }
/** 人有没有在设置里选过（没选过 = 跟系统）。 */
export function langChosen(): Lang | null { return valid(deviceKvGet("lang")); }
/** 存下选择。重载由调用方做（要先把手上的歌落盘）。null = 回到跟系统。 */
export function saveLang(l: Lang | null): void { deviceKvSet("lang", l); }

/** {n} = 参数；{n|song|songs} = 按 n 是不是 1 挑单复数（只有英文用，中文没有复数）。 */
function fill(raw: string, params?: Record<string, unknown>): string {
  if (!params) return raw;
  return raw.replace(/\{(\w+)(?:\|([^|}]*)\|([^}]*))?\}/g, (m, k: string, one?: string, many?: string) => {
    if (!(k in params)) return m;
    return one !== undefined ? (Number(params[k]) === 1 ? one : many ?? "") : String(params[k]);
  });
}

declare const __I18N_OFF__: boolean | undefined;   // AudioWorklet 的 bundle 定义成 true：它不显示字，翻译表不打进音频线程
const TABLE: Record<string, { en: string } | undefined> = typeof __I18N_OFF__ !== "undefined" && __I18N_OFF__ ? {} : S;

function lookup(key: string): string {
  if (lang() === "zh") { const i = key.indexOf("##"); return i < 0 ? key : key.slice(0, i); }   // 「弹##出声」= 中文显示「弹」，英文是另一条
  const e = TABLE[key];
  return e?.en || key;   // 表里没有（只可能是 _tDyn 收到的运行时字串）= 原文
}

/** 界面文案。key = 中文原文（{名字} 是参数）；表里没有 = tsc 报错。 */
export function _t(key: Key, params?: Record<string, unknown>): string {
  return fill(lookup(key), params);
}
/** 起 worker 用：把语言带进去（worker 里读不到 device-kv）。 */
export function workerOptions(): WorkerOptions {
  return { type: "module", name: `lang=${lang()}` };
}

/** 开机调一次：<html lang>（浏览器按它挑字形）、CSS 里写死的几句（::after 的 content 用变量）。 */
export function applyDocumentLang(): void {
  const root = document.documentElement;
  root.lang = lang() === "zh" ? "zh-CN" : lang();
  root.dataset.lang = lang();
  // styles.css 里 ::after 的 content 走变量（CSS 没有 _t）；中文 = CSS 里的默认值，不用设
  if (lang() !== "zh") {
    root.style.setProperty("--t-loop", JSON.stringify(_t("循环")));
    root.style.setProperty("--t-final-mix", JSON.stringify(_t("定稿了：混音锁着（三条杠里「改稿」解锁）")));
    root.style.setProperty("--t-final-lock", JSON.stringify(_t("定稿了：锁着（三条杠里「改稿」解锁）")));
  }
}
