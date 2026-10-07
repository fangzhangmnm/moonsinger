// en-front.mjs —— 月读唱英文的前端：单词 → 音素 / id / 韵律，外加「每个元音核心从哪个音素开始」「每个音素属于哪个词」，
// 以及乐谱的音节和元音核心怎么对上。纯函数（Node 和浏览器 worker 共用）。created 2026-10-07 by Claude Opus 5.5
// user：「好吧英文先做完」「你先把英文做好」；记谱层只存音节 + 「这个词没完」（MusicXML syllabic），拼回整词、查读音、分核心全在唱法这边
//   （user「月读我记得能读英文的…现在说的是如何记谱」「我们的文件应该是唱法引擎agnostic的」）。
// 注音 = 朗读库的英文前端（piper-plus backend/en-g2p.js：CMUdict → IPA，一个 IPA 字符一个 token，重音 ˈ ˌ、长音 ː 各自一个 token）。
// 元音核心：IPA 里长元音 / 双元音当一个单位（ɑː ɔː iː uː ɜː aɪ eɪ oʊ aʊ ɔɪ），其余元音字符各自一个——这个 g2p 的输出按此切分是准的
//   （fire = aɪ + ɚ 两个核心；every = ɛ + ɚ + iː 三个，CMUdict 就是三个音节）。唱的时候按住单位里第一个字符，双元音的滑音 / 长音放在这个音的尾巴上。

const UNITS = new Set(["ɑː", "ɔː", "iː", "uː", "ɜː", "aɪ", "eɪ", "oʊ", "aʊ", "ɔɪ"]);
const VOWEL_CH = new Set([..."aeiouɪʊɛɔæɑʌəɜɚɝ"]);

/** 一个词的 token 里，哪些位置是元音核心的开头。 */
export function nucleusStarts(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    if (!VOWEL_CH.has(tokens[i])) continue;
    out.push(i);
    if (UNITS.has(tokens[i] + (tokens[i + 1] ?? ""))) i++;   // 双元音 / 长元音：后一个字符属于同一个核心
  }
  return out;
}

/**
 * @param g2p   createEnglishG2p(...) 的返回（phonemize）
 * @param encodeTokens  backend/encode.js 的 encodeTokens
 * @param idMap 模型 config 的 phoneme_id_map
 */
export function makeEnglishFront({ g2p, encodeTokens, idMap }) {
  /** 单词表 → 整句的 tokens（只留编码器认得的，顺序同 ids）/ ids / pros + 每个 token 是不是核心开头、属于第几个词 + 每个词几个核心。 */
  function phonemizeWords(words) {
    const all = [], prosody = [], keptSung = [], keptWord = [], nuclei = [];
    const tokens = [];
    words.forEach((w, wi) => {
      const r = g2p.phonemize(w);   // 一个词一个词注（每个音素属于哪个词才说得清）；拼起来和整句注音一样，只少了同形词的上下文猜测
      const starts = new Set(nucleusStarts(r.tokens));
      nuclei.push(starts.size);
      if (!starts.size) return;   // 没有元音的词（mm）：不唱，它的辅音也不进来（不然会混进下一个词的开头）
      if (all.length) { all.push(" "); prosody.push([0, 0, 0]); }
      r.tokens.forEach((t, i) => {
        all.push(t); prosody.push(r.prosody[i]);
        if (idMap[t]) { tokens.push(t); keptSung.push(starts.has(i)); keptWord.push(wi); }   // 编码器丢掉没有 id 的（空格、, . ! ; :）
      });
    });
    const { ids, pros } = encodeTokens(all, prosody, idMap);   // 整句一起编（含参考编码器的韵律错位，模型训练时就是这样）
    return { tokens, ids, pros, sung: keptSung, wordOf: keptWord, nuclei };
  }
  return { phonemizeWords };
}

/**
 * 乐谱条目（一个音节一条，hyph = 这个词没完）→ 一个元音核心一条。
 * 一个词：核心数 == 音节数 → 一对一；核心少 → 最后一个核心拖过剩下的音（拖腔）；核心多 → 最后一个音节的音分给剩下的核心
 * （音不够分就把最后一个音平均切开）；一个核心都没有（如「mm」）→ 这个词的时长并成前一条的休止（不出声，不打乱时间）。
 * @param entries [{ kana, notes: [[midi, len]…], rest?, hyph?, hum? }]（时长单位 = 八分音符）
 * @param nucleiPerWord 每个词几个元音核心（phonemizeWords 的 nuclei；词的切法同 wordsOf）
 * @returns { entries: 对齐后的条目, leadRest: 开头没元音的词占掉的时长（八分音符，加在前奏后面） }
 */
function groupWords(entries) {
  const groups = [];
  for (const e of entries) {
    const g = groups[groups.length - 1];
    if (g && g.open) g.items.push(e); else groups.push({ items: [e], open: false });
    groups[groups.length - 1].open = !!e.hyph;
  }
  return groups;
}
/** 乐谱条目按 hyph 拼回的单词（「hap」+「py」→「happy」）。 */
export function wordsOf(entries) { return groupWords(entries).map((g) => g.items.map((e) => e.kana).join("")); }

export function alignEnglish(entries, nucleiPerWord) {
  const groups = groupWords(entries), out = [];
  let leadRest = 0;
  groups.forEach((g, wi) => {
    const n = nucleiPerWord[wi], items = g.items, last = items[items.length - 1], rest = last.rest || 0;
    const mk = (kana, notes) => ({ kana, notes, ...(items[0].hum ? { hum: true } : {}) });
    const made = [];
    if (n <= 0) {   // 没有元音：静音占住这段时间
      const len = items.reduce((s, e) => s + e.notes.reduce((a, [, l]) => a + l, 0) + (e.rest || 0), 0);
      const prev = out[out.length - 1];
      if (prev) prev.rest = (prev.rest || 0) + len; else leadRest += len;
      return;
    }
    if (n <= items.length) {
      for (let k = 0; k < n - 1; k++) made.push(mk(items[k].kana, items[k].notes));
      made.push(mk(items.slice(n - 1).map((e) => e.kana).join(""), items.slice(n - 1).flatMap((e) => e.notes)));
    } else {
      for (let k = 0; k < items.length - 1; k++) made.push(mk(items[k].kana, items[k].notes));
      const need = n - (items.length - 1), notes = last.notes;
      if (notes.length >= need) {
        for (let k = 0; k < need - 1; k++) made.push(mk(last.kana, [notes[k]]));
        made.push(mk(last.kana, notes.slice(need - 1)));
      } else {
        for (let k = 0; k < notes.length - 1; k++) made.push(mk(last.kana, [notes[k]]));
        const [midi, len] = notes[notes.length - 1], parts = need - (notes.length - 1);
        for (let k = 0; k < parts; k++) made.push(mk(last.kana, [[midi, len / parts]]));
      }
    }
    if (rest) made[made.length - 1].rest = rest;
    out.push(...made);
  });
  return { entries: out, leadRest };
}
