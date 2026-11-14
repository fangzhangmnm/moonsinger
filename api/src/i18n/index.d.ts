import { type Lang, type Key } from "./strings.ts";
export type { Lang, Key } from "./strings.ts";
export declare const LANGS: readonly Lang[];
/** 语言名 = 各语言自称，不翻译。 */
export declare const LANG_NAME: Record<Lang, string>;
/** 当前语言。第一次问的时候定下来，这一页不再变（切换 = 重载，不要半译状态）。 */
export declare function lang(): Lang;
/** 人有没有在设置里选过（没选过 = 跟系统）。 */
export declare function langChosen(): Lang | null;
/** 界面文案。key = 中文原文（{名字} 是参数）；表里没有 = tsc 报错。 */
export declare function _t(key: Key, params?: Record<string, unknown>): string;
/** 指定语言的文案（不读这一页的当前语言）：排版这类「同样的输入出同样的结果」的纯函数用，语言由调用方明着传进来（谱面分家施工单 1b-3，2026-11-11 Claude Opus 5.5）。 */
export declare function _tIn(l: Lang, key: Key, params?: Record<string, unknown>): string;
/** 起 worker 用：把语言带进去（worker 里读不到 device-kv）。 */
export declare function workerOptions(): WorkerOptions;
/** 开机调一次：<html lang>（浏览器按它挑字形）、CSS 里写死的几句（::after 的 content 用变量）。 */
export declare function applyDocumentLang(): void;
