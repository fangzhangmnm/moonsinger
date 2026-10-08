// credit-translations.ts —— 月读（つくよみちゃん）署名块与使用条款的中文 / 英文译文（只给人读，**以日文原文为准**）。created 2026-10-08 by Claude Opus 5.5
// user 2026-10-08「月读的license的展示你守的很紧，但是没做翻译」「还有英文，中国人还能读白字」。
// 原文 = packs.gen.ts 的 CREDIT（模型仓 voices/*.json 生成）；译文按原文的 sha256 钉住：上游改了原文 → test/credit-translations.test.ts 红 →
// 重译再改这里的哈希（不让过期的译文对着新原文显示）。设置里照旧先显示原文（条款要求的是原文），译文在下面、标明「仅供阅读」。
export const CREDIT_TRANSLATIONS = {
  /** 译自的原文（sha256）。 */
  of: {
    credit: "5c233b5c7f4d890be860df437d6f5d258bc530f39e0577295651b67ae8072f1f",
    terms: "6c04cd4680d210e6eb189cdc1e5a81b2c65c65510a46eb5708076b612b930887",
  },
  zh: {
    credit: "本软件的语音合成使用了免费素材角色「つくよみちゃん」（月读；© Rei Yumesaki）免费公开的语音数据。\n■つくよみちゃん语料库（CV. 夢前黎）\nhttps://tyc.rei-yumesaki.net/material/corpus/",
    terms: "使用つくよみちゃん的声线时，禁止把生成出来的声音用于以下目的。\n【禁止事项】\n" +
      "■批评、攻击他人。（「批评、攻击」的定义以つくよみちゃん角色许可（キャラクターライセンス）为准）\n" +
      "■号召人们赞同或反对特定的政治立场、宗教、思想。\n" +
      "■不做区隔（ゾーニング）就公开刺激性强的内容。（译注：区隔 = 分级、加提示、放进单独的地方等，让不想看的人碰不到）\n" +
      "■以允许他人二次利用（当作素材使用）的形式公开。",
  },
  en: {
    credit: "The voice synthesis in this software uses voice data released free of charge by the free-material character \"Tsukuyomi-chan\" (© Rei Yumesaki).\n■ Tsukuyomi-chan Corpus (CV: Rei Yumesaki)\nhttps://tyc.rei-yumesaki.net/material/corpus/",
    terms: "When using Tsukuyomi-chan's voice, you must not use the generated audio for the following purposes.\n[Prohibited]\n" +
      "■ Criticizing or attacking people. (What counts as \"criticizing or attacking\" follows the Tsukuyomi-chan Character License.)\n" +
      "■ Calling on people to support or oppose a particular political position, religion, or ideology.\n" +
      "■ Publishing intense or provocative content without zoning. (Translator's note: zoning = age gates, content warnings, separate spaces, so that people who don't want to see it don't run into it.)\n" +
      "■ Publishing it in a form that permits others to reuse it (as material for their own works).",
  },
} as const;
