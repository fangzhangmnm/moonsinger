// credits-doc.ts —— 「版权与署名」一篇长文（v0.16.90）：所有版权相关的东西合在一处、分节，设置里哪里用到就跳到哪一节。
// created 2026-11-10 by Claude Opus 5.5。user 11-10「所有版权相关的东西收到一个专门栏里面，然后是点开之后跳文本框，就不要把这些版权相关的东西全都用来浪费这个设置的窗格的地方」
//   「可以所有版权相关合租一个长markdown，然后按需跳转」「版权是?还是长文弹窗你自己判断」→ 长文弹窗（条款要放原文 + 两种译文、图标 69 条，放不进一个问号）。
// 正文 = md-lite（src/ui/md-lite.ts，WeebPaint 的那一份）：先整体转义再做行内标记，条款原文里的字不会变成标签。
import { _t } from "../i18n/index.ts";
import { CREDIT } from "../singer/packs.gen.ts";
import { CREDIT_TRANSLATIONS } from "../singer/credit-translations.ts";
import { ICON_CREDITS } from "../gm/instruments.gen.ts";
import { renderMdLite, escapeHtml } from "../ui/md-lite.ts";

export interface DocSection { id: string; title: string; body: string }
const link = (raw: string) => { const url = raw.replace(/&amp;/g, "&"); return /^https?:\/\//.test(url) ? `[${url}](${url})` : url; };   // 目录数据里有的网址带着 HTML 转义（&amp;），先还原

/** 这一篇的各节（顺序 = 文里的顺序）。lang = 界面语言（中文界面多给中文译文；英文译文都给）。 */
export function creditsSections(lang: string): DocSection[] {
  return [
    { id: "tsukuyomi", title: _t("小月相（つくよみちゃん）的署名与使用条款"),
      // 原文在上（条款要求的是原文）；中 / 英译文在下、只给人读（user 2026-10-08「月读的license的展示你守的很紧，但是没做翻译」「还有英文，中国人还能读白字」）
      body: `## ${_t("原文（以此为准）")}\n\n${CREDIT.credit}\n\n${CREDIT.terms}` +
        (lang === "zh" ? `\n\n## ${_t("中文译文（仅供阅读，以日文原文为准）")}\n\n${CREDIT_TRANSLATIONS.zh.credit}\n\n${CREDIT_TRANSLATIONS.zh.terms}` : "") +
        `\n\n## English translation (for reading only; the Japanese original is authoritative)\n\n${CREDIT_TRANSLATIONS.en.credit}\n\n${CREDIT_TRANSLATIONS.en.terms}` },
    { id: "icons", title: _t("乐器目录的图标（第三方，{n} 个）", { n: ICON_CREDITS.length }),
      body: ICON_CREDITS.map((c) => `- **${c.id}** — ${c.author}（${c.set}，${c.license}）${link(c.url)}${c.modified ? _t("；改动：{modified}", { modified: c.modified }) : ""}`).join("\n") },
  ];
}

/** 整篇的 HTML（每节一个 section，id = doc-<节 id>，跳转用）。 */
export function sectionsHtml(sections: readonly DocSection[]): string {
  return sections.map((s) => `<section class="doc-section" id="doc-${s.id}"><h3>${escapeHtml(s.title)}</h3>${renderMdLite(s.body)}</section>`).join("");
}
