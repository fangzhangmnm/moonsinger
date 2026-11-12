// src/render/text/style.ts
var TEXT_FACES = {
  sans: `system-ui, -apple-system, "PingFang SC", "Hiragino Sans", "Noto Sans CJK SC", sans-serif`,
  serif: `"Noto Serif", "Times New Roman", Times, Georgia, serif`,
  lyric: `system-ui, "Hiragino Sans", "PingFang SC", "Noto Sans CJK JP", sans-serif`
};
var s = (face, em, ruler, weight = 400, italic = false) => ({ face, weight, italic, em, ruler });
var TEMPO_EM = 1.35;
var LYRIC_EM = 1.6;
var LYRIC_LOOK = { cozy: { k: 1, sx: 1, gapFloor: 0.2 }, compact: { k: 1.15, sx: 0.85, gapFloor: 0.2 } };
var LYRIC_MIN_SX = 0.5;
var isBlockScript = (s2) => /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af\uff66-\uff9f]/.test(s2);
var TEXT_STYLES = {
  "song-title": s("sans", 2.8, "text", 600),
  credits: s("sans", 1.25, "text"),
  arr: s("sans", 1.25, "text"),
  "arr-label": s("sans", 1.25, "text"),
  "arr-issue": s("sans", 1.1, "text", 400, true),
  "paper-name": s("sans", 1.6, "text", 600),
  "part-name": s("sans", LYRIC_EM * 0.85, "text", 600),
  "part-badge": s("sans", 1, "text", 600),
  // 谱上的记号字（速度、1=X、风格、和弦级数、反复的字、小节号）跟谱（v0.16.48；user 11-09「M F 它跟着走没问题，关键是它这个速度的那一串字号，是不是也应该跟着走？…速度啊，音高啊，那一串」）；歌名 / 曲段名 / 歌手名这些标签照旧跟字
  "tempo-word": s("sans", TEMPO_EM, "staff", 600),
  "tempo-num": s("sans", TEMPO_EM, "staff"),
  "tempo-change": s("sans", TEMPO_EM, "staff", 700),
  "key-label": s("sans", TEMPO_EM, "staff"),
  /** 专业模式 C 调的淡「1=C」（覆盖层写、不印）：和「1=F」一样跟谱。 */
  "key-hint": s("sans", TEMPO_EM, "staff"),
  "groove-mark": s("sans", TEMPO_EM, "staff", 600, true),
  "chord-tag": s("serif", TEMPO_EM, "staff", 600),
  "nav-word": s("sans", TEMPO_EM * 1.05, "staff", 600, true),
  "nav-mark": s("sans", TEMPO_EM * 1.05, "staff", 600),
  // 反复的字（房子「1.」、×3、D.C.…）：屏幕一直是粗的，PDF 原来印细的——统一成粗的
  "bar-no": s("sans", 1.05, "staff"),
  "page-no": s("sans", 1.2, "text"),
  lyric: s("lyric", LYRIC_EM, "staff"),
  ottava: s("sans", 1.3, "staff"),
  "breath-label": s("sans", 1.15, "staff"),
  "dyn-word": s("serif", 2, "staff", 400, true),
  "dyn-implied": s("sans", 1.3, "staff", 600, true),
  // 简谱数字行（谱面分家第四刀；字号在图元上、宽高查 render/jianpu/glyphs.ts，不现场量）：数字一律不分粗细（UX 稿第 5 节）；谱头「1=C 4/4」和中途换调的字
  "jp-digit": s("sans", 2.5, "staff"),
  "jp-acc": s("sans", 1.3, "staff"),
  "jp-head": s("sans", TEMPO_EM, "staff", 600)
};
var DEFAULT = s("sans", LYRIC_EM, "staff");
function textPx(role, sp, ts = 1) {
  const st = TEXT_STYLES[role];
  return st.ruler === "text" ? st.em * sp * ts : st.em * sp;
}

// src/render/text/lyric-fit.ts
var LYRIC_SPACE = 0.6;
var HYPHEN_SX = 0.8;
var GAP_MIN = 0.5;
var GAP_FLOOR = 0.2;
var DEFAULT_GAPS = { space: 0.27 * 1.6 * LYRIC_SPACE, hyphen: 0.33 * 1.6 * HYPHEN_SX + 0.27 * 1.6 * LYRIC_SPACE };
function solveLyrics(items, blockSx, minSx, gaps, widen = true) {
  const n2 = items.length, f = items.map((it) => it.block ? blockSx : 1), tight = /* @__PURE__ */ new Set();
  if (!n2) return { pos: [], f, tight };
  const c = items.map((it) => it.cx);
  const w = items.map((it) => it.w), halfL = c.map((x, i) => i > 0 ? Math.abs(c[i - 1] - x) / 2 : Infinity), halfR = c.map((x, i) => i < n2 - 1 ? Math.abs(c[i + 1] - x) / 2 : Infinity);
  const gb = items.slice(0, -1).map((it, i) => gaps.space + (it.hy && !(it.block || items[i + 1].block) ? gaps.hyphen : 0));
  const lo = (i) => c[i] - Math.max(0.2, Math.min(w[i] * f[i] / 2 - 0.15, halfL[i])), hi = (i) => c[i] + Math.max(0.2, Math.min(w[i] * f[i] / 2 - 0.15, halfR[i]));
  const G2 = new Array(Math.max(0, n2 - 1)).fill(1), floor = gaps.floor ?? GAP_FLOOR;
  const d = (i) => (w[i] * f[i] + w[i + 1] * f[i + 1]) / 2 + Math.max(floor, gb[i] * Math.min(f[i], f[i + 1]) * G2[i]);
  const L = new Array(n2), start = new Array(n2);
  const step = (i) => {
    const a = i > 0 ? L[i - 1] + d(i - 1) : -Infinity, b = lo(i);
    if (a > b) {
      L[i] = a;
      start[i] = start[i - 1];
    } else {
      L[i] = b;
      start[i] = i;
    }
  };
  const pushFrom = (s2, to) => {
    L[s2] = lo(s2);
    start[s2] = s2;
    for (let i = s2 + 1; i <= to; i++) step(i);
  };
  step(0);
  for (let i = 1; i < n2; i++) {
    step(i);
    if (L[i] <= hi(i) + 1e-9) continue;
    const s2 = start[i], keep = f.slice(s2, i + 1), can = (j) => !items[j].block;
    {
      const keepG = G2.slice(s2, i), fitsG = (t) => {
        for (let j = s2; j < i; j++) G2[j] = Math.min(keepG[j - s2], t);
        pushFrom(s2, i);
        for (let j = s2; j <= i; j++) if (L[j] > hi(j) + 1e-9) return false;
        return true;
      };
      if (fitsG(GAP_MIN)) {
        let a2 = GAP_MIN, b2 = 1;
        for (let k = 0; k < 16 && Math.floor(a2 * 100) !== Math.floor(b2 * 100); k++) {
          const m = (a2 + b2) / 2;
          if (fitsG(m)) a2 = m;
          else b2 = m;
        }
        fitsG(Math.max(GAP_MIN, Math.floor(a2 * 100) / 100));
        continue;
      }
    }
    const fits = (t) => {
      for (let j = s2; j <= i; j++) if (can(j)) f[j] = Math.min(keep[j - s2], t);
      pushFrom(s2, i);
      for (let j = s2; j <= i; j++) if (L[j] > hi(j) + 1e-9) return false;
      return true;
    };
    const top = Math.max(...keep);
    if (!items.slice(s2, i + 1).some((_, k) => can(s2 + k)) || !fits(minSx)) {
      fits(minSx);
      tight.add(i - 1);
      tight.add(i);
      L[i] = Math.min(L[i], hi(i));
      continue;
    }
    let a = minSx, b = top;
    for (let k = 0; k < 20 && Math.floor(a * 100) !== Math.floor(b * 100); k++) {
      const m = (a + b) / 2;
      if (fits(m)) a = m;
      else b = m;
    }
    fits(Math.max(minSx, Math.floor(a * 100) / 100));
  }
  const clashes = (mark) => {
    let k = 0;
    for (let i = 0; i < n2; i++) {
      step(i);
      if (L[i] > hi(i) + 1e-9) {
        k += L[i] - hi(i);
        mark?.add(i - 1);
        mark?.add(i);
        L[i] = hi(i);
      }
    }
    return k;
  };
  if (widen) {
    const over = new Array(n2).fill(0);
    for (let i = 0; i < n2; i++) {
      step(i);
      over[i] = Math.max(0, L[i] - hi(i));
      if (over[i] > 0) L[i] = hi(i);
    }
    const tryAt = (from, set, undo) => {
      const sL = [], sO = [], sS = [];
      set();
      let delta = 0, j = Math.max(0, from);
      for (; j < n2; j++) {
        const oldL = L[j];
        sL.push(oldL);
        sO.push(over[j]);
        sS.push(start[j]);
        step(j);
        let o = 0;
        if (L[j] > hi(j) + 1e-9) {
          o = L[j] - hi(j);
          L[j] = hi(j);
        }
        delta += o - over[j];
        over[j] = o;
        if (j > from + 1 && Math.abs(L[j] - oldL) < 1e-12) {
          j++;
          break;
        }
      }
      if (delta <= 1e-6) return true;
      undo();
      for (let k = 0; k < sL.length; k++) {
        L[from + k] = sL[k];
        over[from + k] = sO[k];
        start[from + k] = sS[k];
      }
      return false;
    };
    const relax = (arr, skip, fromOf) => {
      for (let round = 0; round < 14; round++) {
        let moved = false;
        for (let i = 0; i < arr.length; i++) {
          if (skip(i) || arr[i] >= 1) continue;
          const was = arr[i], next = Math.min(1, Math.round((was + 0.05) * 100) / 100);
          if (tryAt(fromOf(i), () => {
            arr[i] = next;
          }, () => {
            arr[i] = was;
          })) moved = true;
        }
        if (!moved) break;
      }
    };
    if (f.some((v, i) => v < 1 && !items[i].block)) relax(f, (i) => !!items[i].block, (i) => Math.max(0, i - 1));
    if (G2.some((v) => v < 1)) relax(G2, () => false, (i) => i + 1);
  }
  tight.clear();
  clashes(tight);
  tight.delete(-1);
  const R = new Array(n2);
  R[n2 - 1] = hi(n2 - 1);
  for (let i = n2 - 2; i >= 0; i--) R[i] = Math.min(hi(i), R[i + 1] - d(i));
  const D2 = new Array(n2);
  D2[0] = 0;
  for (let i = 1; i < n2; i++) D2[i] = D2[i - 1] + d(i - 1);
  const blocks = [];
  for (let i = 0; i < n2; i++) {
    blocks.push({ sum: c[i] - D2[i], cnt: 1 });
    while (blocks.length > 1 && blocks[blocks.length - 2].sum / blocks[blocks.length - 2].cnt > blocks[blocks.length - 1].sum / blocks[blocks.length - 1].cnt) {
      const t = blocks.pop();
      blocks[blocks.length - 1].sum += t.sum;
      blocks[blocks.length - 1].cnt += t.cnt;
    }
  }
  const y = [];
  for (const b of blocks) for (let k = 0; k < b.cnt; k++) y.push(b.sum / b.cnt);
  const pos = y.map((v, i) => {
    const l = L[i] - D2[i], r = Math.max(L[i], R[i]) - D2[i];
    return Math.min(Math.max(v, l), r) + D2[i];
  });
  for (let i = 1; i < n2; i++) if (!tight.has(i) && pos[i] < pos[i - 1] + d(i - 1) - 1e-6) pos[i] = pos[i - 1] + d(i - 1);
  return { pos, f, tight };
}
function lyricBlockSx(items, minSx = LYRIC_MIN_SX, gaps = DEFAULT_GAPS) {
  if (!items.some((it) => it.block)) return 1;
  const badBlocks = (t) => {
    const r = solveLyrics(items, t, minSx, gaps, false);
    let k = 0;
    for (const i of r.tight) if (items[i].block) k++;
    return k;
  };
  let best = 1, bestN = badBlocks(1);
  for (let t = 0.95; bestN && t >= minSx - 1e-9; t = Math.round((t - 0.05) * 100) / 100) {
    const k = badBlocks(t);
    if (k < bestN) {
      best = t;
      bestN = k;
    }
  }
  return best;
}
function fitLyrics(items, blockSx = 1, minSx = LYRIC_MIN_SX, gaps = DEFAULT_GAPS) {
  const r = solveLyrics(items, blockSx, minSx, gaps);
  return items.map((it, i) => ({ dx: r.pos[i] - it.cx, sx: r.f[i], tight: r.tight.has(i) }));
}
function hyphens(syls, hyphenW, lonely) {
  return syls.map((l, n2) => {
    if (!l.hy) return null;
    const r = syls[n2 + 1], same = !!r && r.row === l.row;
    if (!same) return { x: l.x + lonely, hf: 1 };
    if (l.hw === void 0 || r.hw === void 0) return { x: (l.x + (l.hw ?? l.nw ?? 0) + r.x - (r.hw ?? r.nw ?? 0)) / 2, hf: 1 };
    const hf = Math.min(l.sx ?? 1, r.sx ?? 1), a = l.x + l.hw, b = r.x - r.hw;
    if (!(l.cjk || r.cjk) && b - a < hyphenW * hf - 1e-6) return null;
    return { x: (a + b) / 2, hf };
  });
}

// src/render/text/measure.ts
function createTextMeasure(raw) {
  const byPx = /* @__PURE__ */ new Map();
  const at = (s2, px) => {
    let m = byPx.get(px);
    if (!m) byPx.set(px, m = /* @__PURE__ */ new Map());
    let v = m.get(s2);
    if (v === void 0) m.set(s2, v = raw(s2, px));
    return v;
  };
  return {
    width(role, s2, sp, ts) {
      const st = TEXT_STYLES[role];
      return at(s2, LYRIC_EM * sp * ts) * st.em / LYRIC_EM / sp / ts * (st.ruler === "text" ? ts : 1);
    },
    widthPx(s2, px, sp, ts) {
      const ref = LYRIC_EM * sp * ts;
      return at(s2, ref) * px / ref;
    }
  };
}
var lyricFont = (px) => `${px}px ${TEXT_FACES.lyric}`;
function canvasMeasure(ctx) {
  return (s2, px) => {
    const f = lyricFont(px);
    if (ctx.font !== f) ctx.font = f;
    return ctx.measureText(s2).width;
  };
}
var lyricLook = (ts) => ts > 1 ? LYRIC_LOOK.compact : LYRIC_LOOK.cozy;
var lyricWidth = (m, s2, sp, ts) => m.width("lyric", s2, sp, ts) * lyricLook(ts).k * lyricLook(ts).sx;
var lyricSizePx = (sp, ts) => LYRIC_EM * lyricLook(ts).k * sp;

// src/render/text/baseline.ts
var INK_EST = { a: 0.8, d: 0.22 };

// src/i18n/strings.ts
var S = {
  "\u6B63\u5728\u6838\u5BF9\u7F51\u76D8\u4E0A\u7684\u7248\u672C\u2026": { en: "Checking the version on OneDrive\u2026" },
  "\u5148\u79BB\u7EBF\u7528": { en: "Work offline for now" },
  "\u7F51\u76D8\u6CA1\u8FDE\u4E0A": { en: "OneDrive isn't connected" },
  "\u767B\u5F55\u8FC7\u671F\u4E86": { en: "Sign-in expired" },
  "\u73B0\u5728\u6CA1\u6709\u7F51\u7EDC": { en: "No network right now" },
  "\u7F51\u76D8\u6CA1\u6709\u56DE\u5E94": { en: "OneDrive isn't responding" },
  "\u91CD\u65B0\u767B\u5F55": { en: "Sign in again" },
  "\u79BB\u7EBF\u7EE7\u7EED": { en: "Continue offline" },
  "\u79BB\u7EBF \xB7 \u8FD8\u6709 {n} \u4EFD\u6CA1\u4F20\u4E0A\u53BB": { en: "Offline \xB7 {n} not uploaded yet" },
  "\u79BB\u7EBF": { en: "Offline" },
  "\u5DF2\u8FDE\u4E0A\u7F51\u76D8\uFF0C\u6B63\u5728\u540C\u6B65\u2026": { en: "Connected to OneDrive, syncing\u2026" },
  "\u770B\u5217\u8868": { en: "See the list" },
  "\u91CD\u65B0\u8FDE\u63A5": { en: "Reconnect" },
  "\u5C0F\u6708\u76F8\uFF08\u3064\u304F\u3088\u307F\u3061\u3083\u3093\uFF09\u7684\u7F72\u540D\u4E0E\u4F7F\u7528\u6761\u6B3E": { en: "Tsukuyomi-chan (\u3064\u304F\u3088\u307F\u3061\u3083\u3093) credits and terms of use" },
  "\u539F\u6587\uFF08\u4EE5\u6B64\u4E3A\u51C6\uFF09": { en: "Original text (authoritative)" },
  "\u4E2D\u6587\u8BD1\u6587\uFF08\u4EC5\u4F9B\u9605\u8BFB\uFF0C\u4EE5\u65E5\u6587\u539F\u6587\u4E3A\u51C6\uFF09": { en: "Chinese translation (for reference only; the Japanese original governs)" },
  "\u4E50\u5668\u76EE\u5F55\u7684\u56FE\u6807\uFF08\u7B2C\u4E09\u65B9\uFF0C{n} \u4E2A\uFF09": { en: "Instrument catalog icons (third-party, {n})" },
  "\uFF1B\u6539\u52A8\uFF1A{modified}": { en: "; modified: {modified}" },
  "\u590D\u5236\u4E86 {n} \u6761": { en: "Copied {n} {n|entry|entries}" },
  "\u590D\u5236\u4E0D\u4E86\uFF08\u6D4F\u89C8\u5668\u4E0D\u7ED9\u526A\u8D34\u677F\uFF09\uFF1A\u5DF2\u9009\u4E2D\uFF0C\u957F\u6309\u590D\u5236": { en: "Can't copy (the browser won't allow clipboard access): text selected, long-press to copy" },
  "\u4E0B\u8F7D\u4E86 {name}": { en: "Downloaded {name}" },
  "MoonSinger \u8BCA\u65AD\u65E5\u5FD7": { en: "MoonSinger diagnostic log" },
  "\u5206\u4EAB\u6CA1\u6210": { en: "Sharing didn't work" },
  "\uFF08\u7A7A\uFF09": { en: "(empty)" },
  "\u6E05\u7A7A\u4E86": { en: "Cleared" },
  "MusicXML \u4E50\u8C31\uFF08MoonSinger \u5B58\u6210 .mxl\uFF09": { en: "MusicXML score (MoonSinger saves as .mxl)" },
  "\u8C31 / \u6B4C\u540D / \u4F5C\u8005\u680F": { en: "The score / title / credits" },
  "\u7EB8": { en: "Sheets" },
  "\u58F0\u90E8 / \u4E50\u5668": { en: "Parts / instruments" },
  "\u6DF7\u97F3": { en: "The mix" },
  "\u5C01\u9762": { en: "The cover" },
  "{p}\uFF1A{what}\u6539\u4E0D\u4E86": { en: "{p}: {what} can't be changed" },
  "\u64A4\u9500": { en: "Undo" },
  "\u91CD\u505A": { en: "Redo" },
  "\u9501\u7740": { en: "Locked" },
  "\u89E3\u9501\uFF0C\u63A5\u7740\u6539\u8FD9\u4E00\u9996\u3002\u653E\u7740\u4E00\u5929\u4E0D\u52A8\u4F1A\u81EA\u5DF1\u9501\u4E0A\uFF1B\u968F\u65F6\u80FD\u5728\u4E09\u6761\u6760\u91CC\u300C\u9501\u4E0A\u300D": { en: "Unlock and keep editing this song. It locks itself after a day untouched; you can lock it any time from the \u2630 menu" },
  "\u63A5\u7740\u6539": { en: "Keep editing" },
  "\u5148\u628A\u73B0\u5728\u7684\u6837\u5B50\u5B58\u4E00\u7248\u7559\u5E95\uFF08\u6536\u5728\u6B4C\u5E93\u91CC\u8FD9\u9996\u6B4C\u7684\u5361\u7247\u4E0B\u9762\uFF09\uFF0C\u518D\u89E3\u9501\u63A5\u7740\u6539": { en: "Save a version of it as it is now (kept under this song\u2019s card in the library), then unlock and keep editing" },
  "\u5B58\u4E00\u7248\u518D\u6539": { en: "Save a version, then edit" },
  "{dir}/\uFF08\u6574\u4E2A\u6587\u4EF6\u5939\uFF09": { en: "{dir}/ (whole folder)" },
  "\uFF08\u6839\u6587\u4EF6\u5939\uFF09": { en: "(root folder)" },
  "\u6B4C\u5E93\u91CC\u8FD8\u6CA1\u6709\u6B4C": { en: "No songs in the library yet" },
  "\u5DF2\u5BFC\u51FA {count} \u9996\u5230 {fileName}": { en: "Exported {count} {count|song|songs} to {fileName}" },
  " \u7B49 {n} \u9879": { en: " and {n} more" },
  "\u53EA\u5BFC\u51FA\u4E86 {count} \u9996\u5230 {fileName}\u3002\u8FD9\u4E9B\u6CA1\u62FF\u5230\uFF1A{names}": { en: "Only exported {count} {count|song|songs} to {fileName}. Couldn't get: {names}" },
  "\u6CA1\u80FD\u5BFC\u51FA\uFF1A{names}": { en: "Couldn't export: {names}" },
  "\u5220\u9664\u5168\u90E8\u672C\u5730\u6570\u636E": { en: "Delete all local data" },
  "\u5220\u9664\u8FD9\u53F0\u8BBE\u5907\u4E0A MoonSinger \u7684\u5168\u90E8\u672C\u5730\u6570\u636E\uFF1A\u6B4C\u5E93\u91CC\u7684\u6B4C\uFF08\u672C\u673A\u526F\u672C\uFF09\u3001\u5FF5\u7F13\u5B58\u3001\u5C01\u9762\u7F13\u5B58\u3001\u8BBE\u7F6E\u3001\u8BCA\u65AD\u65E5\u5FD7\uFF1B\u79BB\u7EBF\u58F3\u4E5F\u91CD\u88C5\u3002\u4E91\u7AEF\uFF08OneDrive\uFF09\u4E0A\u7684\u6B4C\u548C\u672C\u673A\u6587\u4EF6\u4E0D\u53D7\u5F71\u54CD\u3002": { en: "Deletes all of MoonSinger's local data on this device: songs in the library (local copies), speech cache, cover cache, settings and the diagnostic log; the offline shell is reinstalled too. Songs on OneDrive and files on this device aren't affected." },
  "\u6709 {dirtyN} \u9996\u8FD8\u6CA1\u4F20\u4E0A\u53BB\uFF0C\u4F1A\u4E00\u8D77\u5220\u6389\uFF08\u4E0D\u9020\u9003\u751F\u526F\u672C\uFF09\u3002": { en: "{dirtyN} {dirtyN|song hasn't|songs haven't} been uploaded and will be deleted too (no rescue copy is made)." },
  "\u6B4C\u5E93\u91CC\u7684\u6B4C\u90FD\u4F20\u4E0A\u53BB\u4E86\u3002": { en: "All songs in the library have been uploaded." },
  "\u8FD9\u53F0\u8BBE\u5907\u6CA1\u8FDB\u8FC7\u6B4C\u5E93\u3002": { en: "This device has never opened the library." },
  "\u624B\u91CC\u8FD9\u9996\u6539\u8FC7\u8FD8\u6CA1\u5B58\uFF0C\u4E5F\u4F1A\u4E22\u3002": { en: "The song you have open has unsaved changes, and those will be lost too." },
  "\u8FD8\u539F\u51FA\u5382\u8BBE\u7F6E": { en: "Factory reset" },
  "\u7EE7\u7EED": { en: "Continue" },
  "\u9010\u5B57\u8F93\u5165\u300C{CONSENT_PHRASE}\u300D\u786E\u8BA4\u3002\u8FD9\u4E00\u6B65\u505A\u5B8C app \u4F1A\u91CD\u5F00\u6210\u65B0\u88C5\u7684\u6837\u5B50\u3002": { en: "Type \u201C{CONSENT_PHRASE}\u201D exactly to confirm. When this finishes the app reopens as if newly installed." },
  "\u5220\u9664": { en: "Delete" },
  "\u8F93\u5165\u7684\u4E0D\u4E00\u6837\uFF0C\u4EC0\u4E48\u90FD\u6CA1\u52A8\u3002": { en: "That doesn't match. Nothing was changed." },
  "\u8FD8\u6CA1\u5220\u5E72\u51C0": { en: "Not fully deleted yet" },
  "\u6709 {blocked} \u4E2A\u5E93\u88AB\u522B\u7684\u6807\u7B7E\u9875\u5360\u7740\uFF0C\u5220\u4E0D\u6389\u3002\u5173\u6389\u5176\u4ED6 MoonSinger \u6807\u7B7E\u9875\uFF08\u6216\u522B\u7684\u7A97\u53E3\uFF09\u518D\u6765\u4E00\u6B21\u2014\u2014\u518D\u505A\u4E00\u904D\u662F\u5B89\u5168\u7684\u3002": { en: "{blocked} databases are held by another tab and can't be deleted. Close other MoonSinger tabs (or windows) and try again \u2014 doing it again is safe." },
  "\u597D": { en: "OK" },
  "\u5173\u95ED": { en: "Close" },
  "\u5220\u4E86 {db} \u4E2A\u5E93\u3001{ls} \u4E2A\u952E\uFF0C\u8FD9\u53F0\u8BBE\u5907\u4E0A\u6CA1\u6709\u6B8B\u7559\u3002\u70B9\u300C\u597D\u300D\u91CD\u5F00\u3002": { en: "Deleted {db} databases and {ls} keys; nothing is left on this device. Tap OK to reopen." },
  "\u5220\u4E86 {db} \u4E2A\u5E93\u3001{ls} \u4E2A\u952E\uFF1B\u8FD8\u5269 {residue} \u5904\u6B8B\u7559\uFF08\u679A\u4E3E\u4E0D\u5230\u7684\u5E73\u53F0 / \u521A\u88AB\u91CD\u5EFA\uFF09\uFF0C\u91CD\u5F00\u540E\u518D\u505A\u4E00\u904D\u5C31\u6CA1\u4E86\u3002\u70B9\u300C\u597D\u300D\u91CD\u5F00\u3002": { en: "Deleted {db} databases and {ls} keys; {residue} leftovers remain (platforms that can't be enumerated / just recreated). Do it once more after reopening and they'll be gone. Tap OK to reopen." },
  "\u6CA1\u6709\u5347\u964D\u53F7": { en: "no sharps or flats" },
  "{n} \u4E2A\u5347\u53F7": { en: "{n} {n|sharp|sharps}" },
  "{n} \u4E2A\u964D\u53F7": { en: "{n} {n|flat|flats}" },
  "\u81EA\u52A8\uFF08\u73B0\u5728\uFF1A{p}\uFF09": { en: "Auto (now: {p})" },
  "\u5927\u8C31\u8868\uFF08\u4E0A\u9AD8\u97F3\u4E0B\u4F4E\u97F3\uFF09": { en: "Grand staff (treble above, bass below)" },
  "\u4E0D\u53D8": { en: "unchanged" },
  "\u81EA\u52A8\u516B\u5EA6\u7EBF": { en: "Auto 8va lines" },
  "\u4E00\u4E32\u5F88\u9AD8 / \u5F88\u4F4E\u7684\u97F3\uFF08\u6BCF\u4E2A\u90FD\u8981\u4E09\u6761\u4EE5\u4E0A\u52A0\u7EBF\uFF09\u81EA\u52A8\u753B 8va / 15ma / 8vb\uFF1B\u624B\u5199\u7684\u8BF4\u4E86\u7B97\uFF0C\u4E0D\u5B58\u8FDB\u8C31\u3002\u53EA\u7BA1\u8FD9\u4E00\u6BB5": { en: "A run of very high / low notes (three or more ledger lines each) gets 8va / 15ma / 8vb drawn automatically; written ones win; not saved into the score. Only this section" },
  "\u5F00": { en: "On" },
  "\u5173": { en: "Off" },
  "\u4E0D\u53D8\uFF08{k}\uFF09": { en: "No change ({k})" },
  "\u548C\u5F26\u7EA7\u6570\u4ECE do \u6570\uFF081 = do\uFF09": { en: "Chord degrees count from do (1 = do)" },
  "{k} \u5927\u8C03": { en: "{k} major" },
  "\u548C\u5F26\u7EA7\u6570\u4ECE la \u6570\uFF08a \u5C0F\u8C03\u91CC Am = i\uFF09\uFF1B\u97F3\u548C\u5347\u964D\u53F7\u4E0D\u53D8": { en: "Chord degrees count from la (in A minor, Am = i); notes and accidentals stay the same" },
  "{k} \u5C0F\u8C03": { en: "{k} minor" },
  "\u4E0D\u53D8\uFF08{t}\uFF09": { en: "No change ({t})" },
  "\u5176\u4ED6\u2026\uFF08\u81EA\u5DF1\u5199\uFF09": { en: "Other\u2026 (type it)" },
  "\u8FD9\u5F20\u7EB8\u5F00\u5934\uFF1A\u4ECE\u5934\u5F00\u59CB\u7684\u8C31\u53F7 / \u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6\u3002\u53EA\u7BA1\u8FD9\u4E00\u4E2A\u58F0\u90E8\u8FD9\u4E00\u6BB5\uFF08\u5F00\u5934\u7684\u901F\u5EA6\u6574\u5F20\u7EB8\u4E00\u8D77\uFF09\u3002": { en: "Start of this sheet: the clef / key / time / tempo it starts with. Only for this part in this section (the starting tempo applies to the whole sheet)." },
  "\u4ECE\u8FD9\u91CC\u8D77\u7684\u53D8\u5316\uFF08\u300C\u4E0D\u53D8\u300D= \u8DDF\u524D\u9762\u4E00\u6837\uFF09\u3002": { en: "Changes from here on (\u201CNo change\u201D = same as before)." },
  "\u8C31\u53F7": { en: "Clef" },
  "\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8": { en: "Display only; pitches don\u2019t change" },
  "\u8C03\u53F7": { en: "Key" },
  "\u6539\u8C03\u53F7 = \u5B83\u7BA1\u7684\u97F3\u6309\u65B0\u8C03\u53F7\u62FC\u5199\uFF0C\u97F3\u9AD8\u4E0D\u53D8": { en: "Changing the key respells the notes it governs; pitches don\u2019t change" },
  "\u62CD\u53F7": { en: "Time" },
  "\u901F\u5EA6": { en: "Speed" },
  "\u6253\u5F00\u901F\u5EA6\u6846\uFF1A\u62E8\u901F\u5EA6\u3001\u9009\u901F\u5EA6\u8BCD\u3001\u770B\u5C0F\u8282\u62CD\u5668\uFF0C\u6309\u300C\u786E\u5B9A\u300D\u624D\u5199\u8FDB\u8C31": { en: "Open the tempo box: dial the tempo, pick a tempo word, watch the metronome; nothing is written until you press OK" },
  "\u4E0D\u53D8\uFF08\u2669={n}\uFF09\xB7 \u5728\u8FD9\u91CC\u6362\u2026": { en: "No change (\u2669={n}) \xB7 change it here\u2026" },
  "\u5220\u6389\u8FD9\u91CC\u7684\u53D8\u5316": { en: "Remove the changes here" },
  "\u300C{name}\u300D\u7684\u8C31\uFF08\u6574\u9996\u90FD\u7B97\uFF09": { en: "\u201C{name}\u201D staff (whole song)" },
  "\u5206\u89E3\u548C\u5F26": { en: "Broken chords" },
  "\u62C6\u5F00\u5F39\u7684\u548C\u5F26\uFF08\u4E00\u62CD / \u534A\u5C0F\u8282 / \u4E00\u5C0F\u8282\u91CC\u7684\u97F3\u51D1\u6210\u4E00\u4E2A\u548C\u5F26\uFF09\u8981\u4E0D\u8981\u6807\u7EA7\u6570\uFF1B\u53E0\u5728\u4E00\u8D77\u7684\u548C\u5F26\u7167\u65E7\u6807": { en: "Label chords played as broken notes (a beat, half a bar or a whole bar adding up to a chord); stacked chords are labeled either way" },
  "\u8BA4": { en: "Read" },
  "\u4E0D\u8BA4": { en: "Ignored" },
  "\u5408\u79DF": { en: "Shared staff" },
  "\u6709\u522B\u7684\u58F0\u90E8\u6302\u5728\u8FD9\u4E00\u884C\u4E0A\uFF08\u5B83\u662F\u4E3B\u4EBA\uFF09\uFF0C\u4E0D\u80FD\u518D\u53BB\u6302\u522B\u4EBA": { en: "Other parts are attached to this line (it's the host), so it can't attach to another" },
  "\u6302\u5728\u522B\u4EBA\u7684\u8C31\u7EBF\u4E0A\u753B\uFF08\u5408\u79DF\uFF1A\u53EA\u770B\u4E2A\u5927\u6982\uFF0C\u97F3\u649E\u5728\u4E00\u8D77\u5C31\u649E\uFF1B\u53EA\u753B\u97F3\uFF0C\u4E0D\u753B\u4F11\u6B62 / \u6B4C\u8BCD / \u529B\u5EA6\uFF1B\u70B9\u540D\u5B57 = \u62C6\u5F00\u6765\u5199\uFF09": { en: "Draw on another part's staff (shared: just an overview, colliding notes collide; only notes are drawn, no rests / lyrics / dynamics; tap the name to split it out and write)" },
  "\u81EA\u5DF1\u4E00\u884C": { en: "Own line" },
  "\u6302\u5728\u300C{name}\u300D\u4E0A": { en: "On \u201C{name}\u201D" },
  "\u8FD9\u4E00\u6BB5\u8C03\u53F7\u4E00\u6837\u7684 {n} \u4E2A\u58F0\u90E8\u4E00\u8D77\u6539\u4E86": { en: "Changed {n} parts in this section that share this key signature" },
  "\u5206\u89E3\u548C\u5F26\uFF1A\u8BA4": { en: "Broken chords: read" },
  "\u5206\u89E3\u548C\u5F26\uFF1A\u4E0D\u8BA4": { en: "Broken chords: ignored" },
  "\u4E50\u8C31": { en: "Score" },
  "\u300C{name}\u300D\u5728\u5916\u9762\u88AB\u6539\u8FC7": { en: "\u201C{name}\u201D was changed elsewhere" },
  "\u6253\u5F00\u6216\u4E0A\u6B21\u5B58\u4E4B\u540E\uFF0C\u8FD9\u4E2A\u6587\u4EF6\u88AB\u522B\u7684\u7A0B\u5E8F\u6539\u8FC7\u3002\u8986\u76D6 = \u5916\u9762\u6539\u7684\u90A3\u4E9B\u4F1A\u4E22\u3002": { en: "Another program changed this file since it was opened or last saved. Overwriting will lose those changes." },
  "\u8986\u76D6": { en: "Overwrite" },
  "\u5B58\u6210 .mxl": { en: "Save as .mxl" },
  "{name} \xB7 {size}\u3002\u4E0B\u8F7D\u6216\u5206\u4EAB\u5230\u300C\u6587\u4EF6\u300D\u91CC\uFF1B\u4EE5\u540E\u4ECE\u6587\u4EF6\u83DC\u5355\u300C\u6253\u5F00\u300D\u3002": { en: "{name} \xB7 {size}. Download it or share it to Files; open it later from the menu." },
  "\u8FD9\u9996\u6B4C\u91CC\u539F\u6765\u5E26\u7740\u7684\u90A3\u4EFD mp3\uFF08{size}\uFF09\u4E0D\u518D\u5B58\u8FDB\u6B4C\u91CC\u4E86\uFF1A\u5B83\u5DF2\u7ECF\u8BB0\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u5E93\u91CC\u7167\u6837\u80FD\u542C\u3001\u80FD\u518D\u5BFC\u51FA\u3002": { en: "The mp3 that used to be stored inside this song ({size}) is no longer saved into the song file. It is remembered on this device, so you can still play it from the library and export it again." },
  "\u8FDE\u7EBF": { en: "Slur" },
  "\u97F3\u5185\u6E10\u5F3A / \u9F13\u8D77": { en: "Swell up / swell" },
  "\u97F3\u5185\u6E10\u5F31": { en: "Swell down" },
  "\u51FA\u58F0\u7684\u6362\u6C14": { en: "Audible breath" },
  "\u53F0\u4E0A\u8FD9\u4F4D": { en: "The performer on stage" },
  "{who}\u7684\u97F3\u6309\u4E0B\u53BB\u5C31\u81EA\u7136\u8870\u51CF\uFF0C{p}\u505A\u4E0D\u5230\uFF1A\u5199\u5728\u8C31\u4E0A\u4E86\uFF08\u753B\u7070\uFF09\uFF0C\u51FA\u58F0\u4E0D\u53D8\uFF1B\u97F3\u5185\u6E10\u5F31\u7167\u505A": { en: "{who}'s notes decay on their own, so {p} isn't possible: it's written on the score (grayed out) and the sound doesn't change. Swell down still works" },
  "{who}\u672C\u6765\u5C31\u8FDE\u7740\u5531\uFF1A{p}\u5199\u5728\u8C31\u4E0A\u4E86\uFF08\u753B\u7070\uFF09\uFF0C\u51FA\u58F0\u4E0D\u53D8\uFF1B\u8981\u65AD\u53E5\u7528\u547C\u5438": { en: "{who} already sings legato: {p} is written on the score (grayed out) and the sound doesn't change. Use a breath to separate phrases" },
  "{who}\u672C\u6765\u5C31\u4E0D\u7559\u7F1D\uFF08\u4E50\u5668\u9875\u300C\u97F3\u548C\u97F3\u4E4B\u95F4\u300D= 0\uFF09\uFF1A{p}\u5199\u5728\u8C31\u4E0A\u4E86\uFF08\u753B\u7070\uFF09\uFF0C\u51FA\u58F0\u4E0D\u53D8": { en: "{who} already leaves no gap (\u201CBetween notes\u201D on the instrument page = 0): {p} is written on the score (grayed out) and the sound doesn't change" },
  "{who}\u4E0D\u8BA4{p}\uFF1A\u5199\u5728\u8C31\u4E0A\u4E86\uFF08\u753B\u7070\uFF09\uFF0C\u51FA\u58F0\u4E0D\u53D7\u5F71\u54CD": { en: "{who} ignores {p}: it's written on the score (grayed out) and doesn't affect the sound" },
  "\u8FD9\u4E2A {p} \u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A\u540E\u9762\u90A3\u4E2A\u97F3\u662F\u5F3A\u540E\u5373\u5F31\uFF08fp\uFF09\uFF0C\u97F3\u5934\u6309 f\u3001\u968F\u540E\u843D\u5230 p": { en: "This {p} has no effect (grayed out): the next note is forte-piano (fp), which attacks at f and then falls to p" },
  "\u529B\u5EA6\u8BB0\u53F7": { en: "Dynamic marks" },
  "PNG 256 \u8272\u3001\u957F\u8FB9\u6700\u591A 2048": { en: "PNG, 256 colors, long side up to 2048" },
  "\u5B58\u8FDB\u6B4C\u91CC\uFF08{bytes}\uFF09": { en: "Save in the song ({bytes})" },
  "\u538B\u4E00\u4E0B\u518D\u5B58\uFF08{what}\uFF09": { en: "Compress, then save ({what})" },
  "\u538B\u4E00\u4E0B\u518D\u5B58\uFF08\u7EA6 {estimate}\uFF09": { en: "Compress, then save (about {estimate})" },
  "\u53EA\u653E\u5185\u5B58\uFF08\u63A8\u8350\uFF09": { en: "Memory only (recommended)" },
  "\u53EA\u653E\u5185\u5B58\uFF08\u4E0D\u5B58\u8FDB\u6B4C\u91CC\uFF09": { en: "Memory only (not saved in the song)" },
  "\u300C{name}\u300D{bytes}\u3002\u53C2\u8003\u7A97\u91CC\u7684\u4E1C\u897F\u8DDF\u7740\u6B4C\u4E00\u8D77\u5B58\u3001\u4E00\u8D77\u540C\u6B65\u3002{smaller}\u53EA\u653E\u5185\u5B58 = \u8FD9\u6B21\u6253\u5F00\u80FD{p}\uFF0C\u4E0D\u5B58\u8FDB\u6B4C\u91CC\uFF1B\u4E0B\u6B21\u6253\u5F00\u662F\u4E2A\u7A7A\u4F4D\uFF0C\u628A\u540C\u4E00\u4E2A\u6587\u4EF6\u62D6\u8FDB\u6765\u5C31\u8865\u4E0A\u3002{suggestRam}": { en: "\u201C{name}\u201D is {bytes}. What's in the reference window is saved and synced with the song. {smaller}Memory only = you can {p} it this session, but it isn't saved in the song; next time it's an empty slot, and dragging the same file in fills it again. {suggestRam}" },
  "\u538B\u4E86\u4E5F\u4E0D\u4F1A\u66F4\u5C0F\uFF0C\u5C31\u4E0D\u5217\u4E86\u3002": { en: "Compressing wouldn't make it smaller, so that option isn't listed." },
  "\u538B\u4E00\u4E0B = {what}\u3002": { en: "Compress = {what}." },
  "\u542C##\u52A8\u8BCD": { en: "listen to" },
  "\u770B##\u52A8\u8BCD": { en: "view" },
  "\u8D85\u8FC7 4 MB \u7684\uFF0C\u5B58\u8FDB\u53BB\u8FD9\u9996\u6B4C\u4F1A\u5927\u8FD9\u4E48\u591A\u3001\u540C\u6B65\u4E5F\u6162\uFF0C\u6240\u4EE5\u5148\u63A8\u8350\u53EA\u653E\u5185\u5B58\u3002": { en: "Over 4 MB: saving it makes this song that much bigger and syncing slower, so memory only is recommended first." },
  "\u97F3\u9891 / \u89C6\u9891\u9ED8\u8BA4\u53EA\u653E\u5185\u5B58\uFF08\u8FD9\u6B21\u6253\u5F00\u6709\u6548\uFF09\uFF1B\u8981\u8DDF\u7740\u6B4C\u8D70\u5C31\u9009\u300C\u5B58\u8FDB\u6B4C\u91CC\u300D\u3002": { en: "Audio / video goes to memory only by default (this session); choose \u201CSave in the song\u201D to keep it with the song." },
  "\u8FD9\u6BB5\u97F3\u9891\u6709\u70B9\u5927": { en: "This audio is rather large" },
  "\u8FD9\u6BB5\u89C6\u9891\u6709\u70B9\u5927": { en: "This video is rather large" },
  "\u8FD9\u5F20\u56FE\u6709\u70B9\u5927": { en: "This image is rather large" },
  "\u6709\u65B0\u7248\u672C": { en: "New version available" },
  "\u5237\u65B0": { en: "Refresh" },
  "\u5F85\u4F1A\u513F": { en: "Later" },
  "\u4ECE\u8D77\u70B9\u653E / \u505C\uFF08\u7A7A\u683C\uFF09\uFF1B\u8FDE\u6309\u4E24\u4E0B = \u4ECE\u5934\u653E\u3002\u957F\u6309 / \u53F3\u952E = \u63A5\u7740\u653E / \u81EA\u52A8\u7FFB / \u5FAA\u73AF / \u4ECE\u5934\u653E / \u63A5\u7F1D\u3002\u8D77\u70B9 = \u957F\u6309 / \u53F3\u952E\u8C31\u9762\u300C\u4ECE\u8FD9\u513F\u653E\u300D\u632A": { en: "Play from the start point / stop (Space); double-press = from the top. Long-press / right-click = resume / auto-follow / loop / from the top / seam. To move the start point, long-press / right-click the score: \u201CPlay from here\u201D" },
  "\u6B4C\u5E93\uFF1A\u6B4C\u653E\u5728\u7F51\u76D8\uFF08OneDrive\uFF09\u6216\u4F60\u9009\u7684\u6587\u4EF6\u5939\u91CC": { en: "Library: songs live on OneDrive or in a folder you choose" },
  "\u6B4C\u5E93\uFF1A\u6B4C\u653E\u5728\u4F60\u9009\u7684\u6587\u4EF6\u5939\u91CC": { en: "Library: songs live in a folder you choose" },
  "\u6587\u4EF6\u540D \xB7 \u70B9\u4E86\u6539\u540D": { en: "File name \xB7 tap to rename" },
  "\u672A\u547D\u540D": { en: "Untitled" },
  "\u8FD9\u9996\u6B4C\u6CA1\u52A0\u5BC6\uFF08MoonSinger \u8FD9\u4E00\u7248\u8FD8\u4E0D\u52A0\u5BC6\uFF09": { en: "This song isn't encrypted (this version of MoonSinger doesn't encrypt yet)" },
  "\u5B58": { en: "Save" },
  "\u83DC\u5355\uFF1A\u65B0\u5EFA / \u6253\u5F00 / \u5BFC\u51FA / \u5C01\u9762 / \u58F0\u97F3\u4E0E\u7F72\u540D / \u8BBE\u7F6E": { en: "Menu: new / open / export / cover / sounds and credits / settings" },
  "\u952E\u76D8\uFF08pad\uFF09": { en: "Keyboard (pad)" },
  "\u952E\u76D8": { en: "Keys" },
  "\u64A4\u9500\uFF08Ctrl / \u2318+Z\uFF09": { en: "Undo (Ctrl / \u2318+Z)" },
  "\u91CD\u505A\uFF08Ctrl / \u2318+Shift+Z\uFF09": { en: "Redo (Ctrl / \u2318+Shift+Z)" },
  "\u6A21\u5F0F\uFF1A\u8FD9\u4E00\u4E0B\u70B9\u7684\u662F\u54EA\u4E00\u5C42": { en: "Mode: which layer a tap edits" },
  "\u770B\u54EA\u4E00\u6BB5\uFF1A\u5168\u90E8 / \u53EA\u770B\u8FD9\u4E00\u6BB5": { en: "Which section to view: all / just this one" },
  "\u770B\u54EA\u4E2A\u58F0\u90E8\uFF1A\u5168\u90E8 / \u53EA\u770B\u8FD9\u4E00\u4E2A": { en: "Which part to view: all / just this one" },
  "\u5168\u90E8\u66F2\u6BB5": { en: "All sections" },
  "\u7B2C {p} \u6BB5": { en: "Section {p}" },
  "\uFF08\u9690\u85CF\uFF09": { en: "(hidden)" },
  "\u5168\u90E8\u58F0\u90E8": { en: "All parts" },
  "\u6DF7\u97F3\u53F0": { en: "Mixer" },
  "\u70B9 = \u6536\u8D77": { en: "Tap = hide" },
  "\u70B9 = \u6253\u5F00": { en: "Tap = open" },
  "\u526A\u8D34\u677F\u91CC\u7684\u4E0D\u662F\u7B80\u8C31\uFF08\u50CF 1 2 3 | 5 - - \u8FD9\u6837\u7684\u624D\u8BA4\uFF09": { en: "The clipboard isn't jianpu (only things like 1 2 3 | 5 - - are recognized)" },
  "\u526A\u8D34\u677F\u91CC\u6CA1\u6709\u4E1C\u897F": { en: "The clipboard is empty" },
  "\u8D34\u4E86 {n} \u4E2A": { en: "Pasted {n}" },
  "\u590D\u5236\u4E86 {n} \u4E2A": { en: "Copied {n}" },
  "\u526A\u5207\u4E86 {n} \u4E2A": { en: "Cut {n}" },
  "\u518D\u77ED\u5C31\u6CA1\u6709\u8FD9\u79CD\u65F6\u503C\u4E86": { en: "No shorter note value exists" },
  "\u518D\u957F\u5C31\u6CA1\u6709\u8FD9\u79CD\u65F6\u503C\u4E86": { en: "No longer note value exists" },
  "\u9009\u4E2D\u7684\u91CC\u9762\u6CA1\u6709\u80FD\u52A0\u9644\u70B9\u7684\u65F6\u503C": { en: "Nothing selected can take a dot" },
  "\u58F0\u97F3\u6392\u7740\u961F\uFF1A\u5927\u7EA6 {qd} ms\uFF08\u542C\u5230\u7684\u6BD4\u6309\u4E0B\u665A\u8FD9\u4E48\u591A\uFF09\xB7 \u70B9\u8FD9\u91CC\u6E05\u6389 \uFF5C \u7B49\u4E3B\u7EBF\u7A0B {q} ms \xB7 \u5230\u51FA\u58F0 {s} ms \xB7 \u58F0\u97F3\u5757 \u5E73\u5E38 {t} ms / \u6700\u957F {a} ms": { en: "Audio is backed up: about {qd} ms (what you hear is this late) \xB7 tap here to clear it | main-thread wait {q} ms \xB7 to sound {s} ms \xB7 audio block usual {t} ms / longest {a} ms" },
  "\u6309\u952E\u665A\u4E86\uFF1A\u7B49\u4E3B\u7EBF\u7A0B {q} ms \xB7 \u5230\u51FA\u58F0 {s} ms \xB7 \u4E3B\u7EBF\u7A0B\u6700\u957F\u505C {st} ms \xB7 \u58F0\u97F3\u5757 \u5E73\u5E38 {t} ms / \u6700\u957F {a} ms \xB7 \u58F0\u97F3\u6392\u961F {qd} ms \xB7 \u6700\u6162\u4E00\u6B65 {slow}\uFF08\u70B9\u4E00\u4E0B\u6536\u8D77\u8FD9\u4E00\u6B21\uFF09": { en: "Keys are late: main-thread wait {q} ms \xB7 to sound {s} ms \xB7 longest main-thread stall {st} ms \xB7 audio block usual {t} ms / longest {a} ms \xB7 audio backed up {qd} ms \xB7 slowest step {slow} (tap to hide this time)" },
  "\u624B\u611F\uFF1A\u7B49\u4E3B\u7EBF\u7A0B {q} ms \xB7 \u5230\u51FA\u58F0 {s} ms \xB7 \u4E3B\u7EBF\u7A0B\u6700\u957F\u505C {st} ms \xB7 \u58F0\u97F3\u5757 \u5E73\u5E38 {t} ms / \u6700\u957F {a} ms \xB7 \u58F0\u97F3\u6392\u961F {qd} ms\uFF08\u70B9\u4E00\u4E0B\u6536\u8D77\u8FD9\u4E00\u6B21\uFF09": { en: "Key feel: main-thread wait {q} ms \xB7 to sound {s} ms \xB7 longest main-thread stall {st} ms \xB7 audio block usual {t} ms / longest {a} ms \xB7 audio backed up {qd} ms (tap to hide this time)" },
  "\u5176\u4ED6\u7EB8": { en: "Other sheets" },
  "\u65B0\u7684\u4E00\u6BB5": { en: "New section" },
  "\u9690\u85CF\u7740\u7684\uFF08\u70B9 = \u653E\u51FA\u6765\uFF09": { en: "Hidden (tap = show)" },
  "\u53BB\u770B": { en: "Go to it" },
  "\u653E\u51FA\u6765": { en: "Unhide" },
  "\u9690\u85CF\u7740\u7684\u66F2\u6BB5\uFF08\u4E0D\u653E\u3001\u4E0D\u5370\uFF09": { en: "Hidden sections (not played, not printed)" },
  "\u300C{p}\u300D\u653E\u51FA\u6765\u4E86\uFF08\u64A4\u9500\u80FD\u518D\u85CF\u8D77\u6765\uFF09": { en: "\u201C{p}\u201D is back (undo hides it again)" },
  "\u300C{extras}\u300D\u662F\u5355\u58F0\u4E50\u5668\uFF0C\u8FD9\u4E2A\u58F0\u90E8\u53E0\u4E0D\u4E86\u97F3": { en: "\u201C{extras}\u201D is a monophonic instrument, so this part can't stack notes" },
  "\u5149\u6807\u524D\u9762\u8FD8\u6CA1\u6709\u97F3": { en: "No note before the cursor yet" },
  "\u300C{who}\u300D\u4E00\u6B21\u53EA\u51FA\u4E00\u4E2A\u97F3\uFF1A\u51E0\u4E4E\u540C\u65F6\u6309\u4E0B\u7684\u7B2C\u4E8C\u4E2A\u952E\u6CA1\u5199\u3002\u8981\u5199\u548C\u5F26\uFF0C\u7ED9\u8FD9\u4E2A\u58F0\u90E8\u6362\u94A2\u7434\u8FD9\u7C7B\u4E50\u5668": { en: "\u201C{who}\u201D plays one note at a time: the second key pressed at almost the same moment was not written. For chords, switch this part to something like a piano" },
  "\u9690\u85CF\u4E86\u8FD9\u5F20\u7EB8": { en: "Hid this sheet" },
  "\u53D6\u6D88\u9690\u85CF\u8FD9\u5F20\u7EB8": { en: "Unhid this sheet" },
  "\u8FD9\u4E00\u6BB5\u5B9A\u6210\u4E86\u5927\u8C31\u8868\uFF08\u624B\u52A8\u5206\u7684\u4E0A\u4E0B\u884C\u8981\u5B58\u5F97\u4E0B\uFF09\uFF1B\u60F3\u56DE\u5230\u81EA\u52A8\uFF0C\u70B9\u884C\u9996\u8C31\u53F7\u9009\u300C\u81EA\u52A8\u300D": { en: "This section is now fixed as a grand staff (so the notes you moved between staves can be saved); to go back to automatic, tap the clef at the start of the line and pick \u201CAuto\u201D" },
  "\u6CA1\u6709\u53EF\u64A4\u9500\u7684": { en: "Nothing to undo" },
  "\u6CA1\u6709\u53EF\u91CD\u505A\u7684": { en: "Nothing to redo" },
  "\u770B\u8C31": { en: "Reading" },
  "\u8C31\u79CD": { en: "Notation" },
  "\u4E94\u7EBF\u8C31": { en: "Staff" },
  "\u7B80\u8C31": { en: "Numbered (jianpu)" },
  "\u7EB8\u5F20": { en: "Paper" },
  "\u6309\u97F3\u9AD8\u753B\u5728\u4E94\u6761\u7EBF\u4E0A": { en: "Pitches drawn on the five lines" },
  "\u6570\u5B57 1\u20137\uFF08\u9996\u8C03\uFF09\uFF1B\u6709\u53E0\u97F3\u7684\u58F0\u90E8\u3001\u9F13\u548C\u5408\u79DF\u53E0\u8D77\u6765\u7684\u90A3\u4E00\u884C\u6682\u65F6\u8FD8\u753B\u6210\u4E94\u7EBF\u8C31": { en: "Digits 1\u20137 (movable do); parts with stacked notes, drums and shared rows are still drawn as staff for now" },
  "\u7B80\u8C31\u672C\u6765\u5C31\u662F\u9996\u8C03\uFF081 = \u8FD9\u4E2A\u8C03\u7684\u4E3B\u97F3\uFF09\uFF0C\u7528\u4E0D\u4E0A\u300C\u6309 C \u8C03\u770B\u300D\uFF1B\u5B58\u7740\u7684\u9009\u62E9\u4E0D\u52A8\uFF0C\u5207\u56DE\u4E94\u7EBF\u8C31\u7167\u65E7\u3002": { en: "Numbered notation is already movable-do (1 = the key's tonic), so \u201CRead in C\u201D doesn't apply; your choice is kept and works again on staff." },
  "\u4F11\u606F\u5BA4": { en: "Green room" },
  "{issueCount} \u6761\u8F68\u4E0D\u51FA\u58F0\uFF1A\u70B9\u5F00\u770B\u6E05\u5355": { en: "{issueCount} {issueCount|track is|tracks are} silent: tap for the list" },
  "\u603B\u8F68": { en: "Master" },
  "\u4ECE\u8FD9\u513F\u653E": { en: "Play from here" },
  "\u8D77\u70B9\u632A\u5230\u8FD9\u4E2A\u5C0F\u8282\u7684\u5934\uFF0C\u4ECE\u8FD9\u513F\u653E": { en: "Moves the start point to the head of this bar and plays from here" },
  "\u63A5\u7740\u653E": { en: "Resume" },
  "\u4ECE\u4E0A\u6B21\u505C\u4E0B\u7684\u5730\u65B9\u63A5\u7740\u653E": { en: "Continue from where it last stopped" },
  "\u4ECE\u5934\u653E": { en: "Play from the top" },
  "\u8D77\u70B9\u56DE\u5230\u5F00\u5934\uFF0C\u4ECE\u5934\u653E\uFF08\u4E5F\u53EF\u4EE5\u8FDE\u6309\u4E24\u4E0B |\u25B6 / \u7A7A\u683C\uFF09": { en: "Moves the start point back to the top and plays (or double-press |\u25B6 / Space)" },
  "\u4ECE\u4E0A\u6B21\u505C\u4E0B\u7684\u5730\u65B9\u63A5\u7740\u653E\uFF08\u8D77\u70B9\u4E0D\u52A8\uFF09": { en: "Continue from where it last stopped (start point stays)" },
  "\u8DF3\u5230\u6B63\u5728\u653E\u7684\u5730\u65B9": { en: "Jump to the playing spot" },
  "\u8C31\u6EDA\u5230\u6B63\u5728\u653E\uFF08\u505C\u7740 = \u505C\u4E0B\uFF09\u7684\u90A3\u4E00\u884C\uFF1B\u521A\u624D\u81EA\u5DF1\u6EDA\u8FC7\u4E5F\u7167\u6837\u8FC7\u53BB\u3001\u63A5\u7740\u8DDF": { en: "Scrolls the score to the line now playing (or where it stopped), even if you just scrolled, and keeps following" },
  "\u7FFB\u8C31\u63D0\u524D\u591A\u5C11\uFF1A\u5FEB\u5230\u884C\u5C3E\uFF08\u6216\u7F16\u6392\u8DF3\u56DE\u53BB\u4E4B\u524D\uFF09\u8FD9\u4E48\u4E45\u5C31\u5148\u7FFB\u8FC7\u53BB\uFF0C\u6700\u540E\u4E00\u5C0F\u622A\u9760\u8BB0\u2014\u2014\u50CF\u94A2\u7434\u5BB6\u7FFB\u8C31\u30020 = \u6362\u4E86\u884C\u624D\u7FFB": { en: "How early to turn the page: this long before the end of a line (or before the arrangement jumps back), turn first and read the last bit from memory \u2014 like a pianist. 0 = turn only after the line changes" },
  "\u63D0\u524D\u7FFB": { en: "Turn early" },
  "\u4E0D": { en: "Off" },
  "{autoFollow}\u81EA\u52A8\u7FFB": { en: "{autoFollow}Auto-follow" },
  "\u653E\u7740\u7684\u65F6\u5019\u8C31\u8DDF\u7740\u6B63\u5728\u653E\u7684\u90A3\u4E00\u884C\u6EDA\uFF08\u51FA\u4E86\u5C4F\u5E55\u8212\u670D\u7684\u90A3\u4E00\u6BB5\u624D\u6EDA\uFF1B\u4F60\u81EA\u5DF1\u6EDA\u8FC7 4 \u79D2\u5185\u4E0D\u8DDF\uFF09": { en: "While playing, the score follows the line being played (only when it leaves the comfortable part of the screen; not within 4 s of you scrolling)" },
  "{loopOn}\u5FAA\u73AF": { en: "{loopOn}Loop" },
  "\u653E\u5230\u5934\u63A5\u7740\u4ECE\u5934\u653E\uFF1B\u7F16\u6392\u5199\u4E86 [\u5FAA\u73AF\u6BB5] = \u524D\u9762\u653E\u4E00\u904D\u3001\u62EC\u4F4F\u7684\u4E00\u76F4\u5FAA\u73AF": { en: "Restart from the top at the end; if the arrangement has [a loop section], play what's before it once, then loop the bracketed part" },
  "\u542C\u63A5\u7F1D": { en: "Hear the seam" },
  "\u4ECE\u5FAA\u73AF\u6BB5\u7ED3\u5C3E\u524D\u51E0\u79D2\u653E\u8D77\uFF0C\u8DF3\u56DE\u5F00\u5934\u518D\u653E\u51E0\u79D2\u5C31\u505C": { en: "Plays the last few seconds of the loop, jumps back to its start, plays a few more seconds, then stops" },
  "\u7FFB\u8C31\u63D0\u524D {turnLead} \u79D2": { en: "Page turns {turnLead} s early" },
  "\u7FFB\u8C31\u4E0D\u63D0\u524D\uFF08\u6362\u4E86\u884C\u624D\u7FFB\uFF09": { en: "Page turns aren't early (only after the line changes)" },
  "\u73B0\u5728\u6CA1\u6709\u5728\u653E\u7684\u5730\u65B9": { en: "Nothing is playing right now" },
  "\u81EA\u52A8\u7FFB\uFF1A\u5F00": { en: "Auto-follow: on" },
  "\u81EA\u52A8\u7FFB\uFF1A\u5173": { en: "Auto-follow: off" },
  "\u73B0\u5728\u7684\u58F0\u90E8\u90FD\u80FD\u51FA\u58F0": { en: "All parts can sound now" },
  "\u4E0D\u51FA\u58F0\u7684\u58F0\u90E8": { en: "Silent parts" },
  "\u6362\u4EBA / \u627E\u58F0\u97F3\u2026": { en: "Change performer / find sound\u2026" },
  "\u653E\u548C\u5BFC\u51FA\u7684 mp3 \u91CC\u90FD\u6CA1\u6709\u8FD9{p}\u7684\u58F0\u97F3\uFF0C\u5176\u4F59\u7167\u653E\u3002\u6362\u8C01\u7531\u4F60\u5B9A\uFF0C\u4E0D\u66FF\u8865\u3002": { en: "Neither playback nor the exported mp3 will have the sound of {p}; the rest plays as usual. Who replaces it is up to you \u2014 no automatic substitutes." },
  "{n} \u6761\u8F68": { en: "{n} {n|track|tracks}" },
  "\u6761\u8F68": { en: "this track" },
  "\u77E5\u9053\u4E86": { en: "Got it" },
  "\u51C6\u5907\u2026": { en: "Preparing\u2026" },
  "\u53D6\u6D88": { en: "Cancel" },
  "\u6B63\u5728\u53D6\u6D88\u2026": { en: "Cancelling\u2026" },
  "\u6B63\u5728\u6E32\u67D3\u2026": { en: "Rendering\u2026" },
  "\u5DF2\u7ECF\u5728\u6E32\u67D3\u7F13\u5B58\u91CC\u4E86\uFF08\u5185\u5BB9\u6CA1\u53D8\uFF09": { en: "Already in the render cache (nothing changed)" },
  "\u6E32\u597D\u4E86\uFF0C\u4F46\u6CA1\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\uFF08\u5B58\u50A8\u6EE1\u4E86\u6216\u8005\u662F\u9690\u79C1\u6A21\u5F0F\uFF09": { en: "Rendered, but it could not be kept in the render cache (storage full or private browsing)" },
  "\u6E32\u597D\u4E86\uFF0C\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\uFF1A\u5B58\u4E0B\u53BB\u4E4B\u540E\u6B4C\u5E93\u5C01\u9762\u4E0A\u80FD\u542C": { en: "Rendered into the render cache: once you save, you can play it from the library cover" },
  "\u6E32\u597D\u4E86\uFF0C\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\uFF1A\u6B4C\u5E93\u91CC\u8FD9\u9996\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C": { en: "Rendered into the render cache: play it straight from this song\u2019s cover in the library" },
  "\u6E32\u67D3\u53D6\u6D88\u4E86": { en: "Rendering cancelled" },
  "\u6E32\u4E0D\u4E86\uFF1A{Error}": { en: "Couldn't render: {Error}" },
  "\u6B63\u5728\u6E32\u67D3\u300C{stem}\u300D\u2026": { en: "Rendering \u201C{stem}\u201D\u2026" },
  "\u5BFC\u51FA\u6B4C\u58F0\uFF08mp3\uFF09": { en: "Export MP3" },
  "\u97F3\u8D28": { en: "Quality" },
  "\u8303\u56F4": { en: "Range" },
  "\u6574\u9996": { en: "Whole song" },
  "\u9690\u85CF\u7684\u7EB8\u4E0D\u653E": { en: "Hidden sheets aren't played" },
  "\u8FD9\u4E00\u5F20\u7EB8": { en: "This sheet" },
  "\u7B2C {p} \u5F20": { en: "Sheet {p}" },
  "\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58": { en: "Keep in render cache" },
  "\u653E\u8FDB\u53BB": { en: "Keep" },
  "\u6B4C\u5E93\u91CC\u8FD9\u9996\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C\uFF1B\u8BBE\u7F6E\u91CC\u80FD\u5220": { en: "Play it from this song\u2019s cover in the library; delete it in Settings" },
  "\u4E0D\u653E": { en: "Don't keep" },
  "\u53EA\u5BFC\u51FA\u8FD9\u4E00\u4EFD\uFF0C\u4E0D\u7559": { en: "Export this copy only, keep nothing" },
  "\u8FD9\u53F0\u8BBE\u5907\u4E0A\u8BB0\u7740\u4E0A\u6B21\u6E32\u597D\u7684\u8FD9\u4E00\u4EFD\uFF0C\u5185\u5BB9\u6CA1\u53D8\uFF1A\u76F4\u63A5\u62FF\uFF0C\u4E0D\u7528\u7B49\u3002": { en: "This device remembers the last render of exactly this, and nothing has changed: you get it right away, no waiting." },
  "\u8BB8\u53EF\uFF1A{fellBack}\u3002\u548C\u7F72\u540D\u4E00\u8D77\u5199\u8FDB mp3 \u7684\u6807\u7B7E\u3002": { en: "License: {fellBack}. Written into the mp3 tags along with the credits." },
  "\u8FD9\u4EFD\u6309\u300C\u672A\u58F0\u660E\u300D\u5199\u2014\u2014\u4F60\u9009\u7684\u8BB8\u53EF\u5141\u8BB8\u522B\u4EBA\u6539\u7F16\uFF0C\u548C\u5C0F\u6708\u76F8\u7684\u6761\u6B3E\u53EF\u80FD\u51B2\u7A81\uFF08\u4F5C\u8005\u680F\u91CC\u7684\u9009\u62E9\u6CA1\u52A8\uFF09": { en: "This copy is written as \u201Cnot stated\u201D \u2014 the license you chose allows adaptation, which may conflict with Tsukuyomi-chan's terms (your choice in the credits is unchanged)" },
  "{n} \u6761\u8F68\u4E0D\u51FA\u58F0\uFF0Cmp3 \u91CC\u4E0D\u4F1A\u6709\u5B83\u4EEC\uFF1A{is}\u3002\u6362\u4EBA\u5728\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u91CC\u3002": { en: "{n} {n|track is|tracks are} silent and won't be in the mp3: {is}. Change the performer from the part name at the front of the score." },
  "\u7167\u6837\u5BFC\u51FA": { en: "Export anyway" },
  "\u5BFC\u51FA": { en: "Export" },
  "\u7B97\u4E86": { en: "Never mind" },
  "\u2713 \u5728\u6587\u4EF6\u5939\u91CC": { en: "\u2713 In the folder" },
  "\xB7 \u6587\u4EF6\u5939\u91CC\u6CA1\u6709": { en: "\xB7 Not in the folder" },
  "\u4F60\u6311\u7684\u300C{name}\u300D\u4E0D\u5728\u73B0\u5728\u8FD9\u51E0\u4E2A\u97F3\u7684\u8BFB\u6CD5\u91CC\uFF08\u97F3\u6539\u8FC7\u4E86\uFF09\uFF1A\u6362\u4E00\u4E2A\uFF0C\u6216\u8005\u6539\u56DE\u81EA\u52A8": { en: "The chord you picked, \u201C{name}\u201D, is no longer one of the readings of these notes (the notes changed): pick another, or go back to automatic" },
  "\u8FD9\u662F\u4F60\u6311\u7684\u300C{name}\u300D": { en: "You picked \u201C{name}\u201D" },
  "\u6539\u56DE\u81EA\u52A8\uFF08{label}\uFF09": { en: "Back to automatic ({label})" },
  "\u6539\u56DE\u81EA\u52A8\uFF08\u8FD9\u51E0\u4E2A\u97F3\u8BA4\u4E0D\u51FA\u548C\u5F26 = \u4E0D\u6807\uFF09": { en: "Back to automatic (these notes don't read as a chord = no label)" },
  "\u70B9\u4E00\u4E2A = \u7528\u5B83\uFF08\u8BB0\u8FDB\u8FD9\u4E2A\u97F3\uFF0C\u80FD\u64A4\u9500\uFF09": { en: "Tap one = use it (stored on this note; undo works)" },
  "\u754C\u9762": { en: "Interface" },
  "\u4E50\u7406\u52A9\u624B": { en: "Music theory helper" },
  "\u97F3\u6E90\u4E0E\u7F13\u5B58": { en: "Audio" },
  "\u5F00\u53D1\u8005": { en: "Developer" },
  "\u8FD9\u662F\u4EC0\u4E48": { en: "What's this" },
  "\u8BBE\u7F6E": { en: "Settings" },
  "\u8DDF\u7CFB\u7EDF": { en: "System" },
  "\u7248\u6743\u4E0E\u7F72\u540D": { en: "Credits and licenses" },
  "\u770B\u2026": { en: "View\u2026" },
  "\u5C0F\u6708\u76F8\u7684\u7F72\u540D\u4E0E\u4F7F\u7528\u6761\u6B3E\u3001\u4E50\u5668\u76EE\u5F55\u56FE\u6807\u7684\u4F5C\u8005\u4E0E\u8BB8\u53EF\uFF0C\u5408\u5728\u4E00\u7BC7\u91CC\u770B": { en: "Tsukuyomi-chan's credit and terms of use, plus the authors and licenses of the instrument catalog icons, all in one page" },
  "\u770B\u8C31\u65B9\u5F0F\u3001\u548C\u5F26\u6807\u7EA7\u6570": { en: "How to read the score, chord degrees" },
  "\u642C\u5230\u4E86\u7EB8\u7684\u8BBE\u7F6E\u91CC\uFF08\u8C31\u53F3\u4E0A\u89D2\u7684\u6273\u624B \u2192\u300C\u770B\u8C31\u300D\uFF09\uFF1A\u73B0\u5728\u8DDF\u7740\u6BCF\u9996\u6B4C\u8D70\u3001\u5B58\u5728\u6B4C\u91CC\uFF0C\u4EE5\u524D\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u8C03\u8FC7\u7684\u4E0D\u5E26\u8FC7\u53BB\u3002": { en: "Moved to the paper settings (the wrench at the top right of the score \u2192 Reading): they now belong to each song and are saved in it; what you set on this device before does not carry over." },
  "\u6A21\u578B\u6765\u6E90": { en: "Model source" },
  "\u5148\u627E\u8FD9\u4E2A\u7F51\u7AD9\u4E0B\u7684 <code>pwa-models/</code>\uFF08\u81EA\u5DF1\u642D\u670D\u52A1\u5668\u7684\u8BDD\uFF0C\u628A\u6A21\u578B\u4ED3\u62F7\u8FC7\u53BB\u5C31\u80FD\u7528\uFF09\uFF0C\u627E\u4E0D\u5230\u518D\u7528\u8FD9\u91CC\u586B\u7684\u3002\u53EA\u5728\u8FD9\u6B21\u6253\u5F00\u91CC\u6709\u6548\u3002": { en: "Looks first for <code>pwa-models/</code> on this site (if you host your own server, copy the model repo there), then uses what's entered here. Only for this session." },
  "\u97F3\u6E90\u5E93\u6765\u6E90": { en: "Sound library source" },
  "\u6062\u590D\u9ED8\u8BA4": { en: "Reset to default" },
  "\u4E50\u5668\u97F3\u8272\u5E93\u3001\u9F13\u7EC4\u3001\u97F3\u6548\u7D20\u6750\uFF08\u4E0D\u662F AI \u6A21\u578B\uFF09\u3002\u300C\u6062\u590D\u9ED8\u8BA4\u300D= \u6A21\u578B\u6765\u6E90\u548C\u97F3\u6E90\u5E93\u6765\u6E90\u90FD\u56DE\u5230\u51FA\u5382\u7684\u5730\u5740\u3002\u53EA\u5728\u8FD9\u6B21\u6253\u5F00\u91CC\u6709\u6548\u3002": { en: "Instrument banks, drum kits, sound effects (not AI models). \u201CRestore defaults\u201D = both the model source and the sound library source go back to the built-in addresses. Only for this session." },
  "\u5C0F\u6708\u76F8\u7684\u6A21\u578B\u5305": { en: "Tsukuyomi-chan's model packs" },
  "\u4ECE\u672C\u673A\u6587\u4EF6\u5BFC\u5165": { en: "Import from a local file" },
  "\u9009\u6A21\u578B\u5305\u7684\u5206\u7247\u6587\u4EF6\uFF08chunk-000 \u2026\uFF0C\u540D\u5B57\u4E0D\u91CD\u8981\uFF09\uFF0C\u6216\u6574\u4E2A\u5305\u62FC\u6210\u7684\u4E00\u4E2A\u6587\u4EF6": { en: "Choose the pack's chunk files (chunk-000 \u2026, names don't matter), or one file with the whole pack joined" },
  "\u97F3\u6E90\u5E93\u7F13\u5B58": { en: "Sound library cache" },
  "\u7559\u5728\u8BBE\u5907\u4E0A\uFF0C\u6CA1\u7F51\u4E5F\u80FD\u7528\uFF1B\u6B4C\u81EA\u5DF1\u5E26\u58F0\u97F3\uFF0C\u8FD9\u91CC\u53EA\u662F\u8D27\u67B6": { en: "Kept on this device, works offline; songs carry their own sound, this is only the shelf" },
  "\u6E32\u67D3\u7F13\u5B58": { en: "Render cache" },
  "\u5168\u6E05": { en: "Clear all" },
  "\u5BFC\u51FA\u6216\u300C\u6E32\u67D3\u5230\u7F13\u5B58\u300D\u65F6\u653E\u8FDB\u6765\u7684\u6574\u9996\u6B4C\u58F0\uFF0C\u6B4C\u5E93\u5C01\u9762\u4E0A\u7684 \u25B6 \u9760\u5B83\uFF1B\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u3001\u4E0D\u540C\u6B65\uFF0C\u6700\u591A {n} \u9996\uFF0C\u6EE1\u4E86\u4E22\u6700\u4E45\u6CA1\u542C\u7684\uFF1B\u5220\u4E86\u53EA\u662F\u8981\u91CD\u6E32": { en: "Whole songs rendered when you export or use \u201CRender to cache\u201D; the \u25B6 on library covers plays them. Only on this device, never synced, at most {n} songs (the least recently played goes first); deleting only means rendering again" },
  "\u5C0F\u6708\u76F8\u7684\u5FF5\u7F13\u5B58": { en: "Tsukuyomi-chan's speech cache" },
  "\u6E05\u7A7A\u5FF5\u7F13\u5B58": { en: "Clear speech cache" },
  "\u8BBE\u5907\u4E0A\u7684\u5168\u5C40\u6C60\uFF1A\u5FF5\u8FC7\u7684\u53E5\u5B50\u8DE8\u6B4C\u5171\u7528\uFF0C\u91CD\u5F00 app \u4E5F\u5728\uFF1B\u53EF\u518D\u751F\uFF0C\u6E05\u4E86\u53EA\u662F\u8981\u91CD\u5FF5": { en: "A global pool on this device: spoken lines are shared across songs and survive restarts; regenerable \u2014 clearing only means re-speaking" },
  "\u91CD\u542F\u58F0\u97F3": { en: "Restart audio" },
  "\u58F0\u97F3\u4E0D\u5BF9\u52B2\u7684\u65F6\u5019\u6309\u4E00\u4E0B\uFF08\u6309\u952E\u6709\u5EF6\u8FDF\u3001\u6CA1\u6709\u58F0\u97F3\uFF09\uFF1A\u628A\u901A\u5411\u626C\u58F0\u5668\u7684\u90A3\u4E00\u6BB5\u6362\u6210\u65B0\u7684\uFF0C\u6392\u7740\u6CA1\u64AD\u5B8C\u7684\u58F0\u97F3\u4E00\u8D77\u4E22\u6389\u3002\u6B63\u5728\u54CD\u7684\u58F0\u97F3\u4F1A\u65AD\u4E00\u4E0B": { en: "Press this when the sound is off (keys respond late, or there is no sound): it rebuilds the path to the speaker and throws away any audio still waiting to play. Anything sounding right now will cut out for a moment" },
  "\u5F15\u64CE\u8D1F\u8F7D\u4E0E\u5185\u5B58": { en: "Engine load and memory" },
  "\u5C0F\u6708\u76F8\u5F15\u64CE\u7684 WASM \u5185\u5B58\u53EA\u6DA8\u4E0D\u843D\uFF0C\u53EA\u6709\u91CD\u5F00\u624D\u8FD8\u56DE\u53BB\uFF1B\u5FF5\u8FC7\u7684\u53E5\u5B50\u8981\u91CD\u5FF5": { en: "Tsukuyomi-chan's engine WASM memory only grows; only a restart returns it. Spoken lines will need re-speaking" },
  "\u91CD\u5F00\u5C0F\u6708\u76F8\u5F15\u64CE": { en: "Restart Tsukuyomi-chan's engine" },
  "\u80FD\u7B97\u5230\u7684\u90E8\u5206\uFF1B\u8D85\u9884\u7B97\u4F1A\u5148\u653E\u5757\u3001\u518D\u51CF\u5E76\u884C\u3001\u518D\u8D81\u7A7A\u91CD\u5F00\u5F15\u64CE\uFF0C\u5E76\u5728\u8FD9\u91CC / \u72B6\u6001\u6761\u660E\u8BF4\u3002\u5C0F\u6708\u76F8\u5F15\u64CE\u7684\u5185\u5B58\u53EA\u6DA8\u4E0D\u843D\uFF0C\u53EA\u6709\u91CD\u5F00\u624D\u8FD8\u56DE\u53BB": { en: "The parts we can measure; over budget it drops chunks first, then reduces parallelism, then restarts the engine when idle, and says so here / in the status bar. Tsukuyomi-chan's engine memory only grows; restarting is the only way to give it back" },
  "\u5C0F\u6708\u76F8\u7684\u7F72\u540D\u4E0E\u4F7F\u7528\u6761\u6B3E": { en: "Tsukuyomi-chan's credit and terms of use" },
  "MIDI \u952E\u76D8": { en: "MIDI keyboard" },
  "\u8FDE\u63A5": { en: "Connect" },
  "\u8BCA\u65AD\u65E5\u5FD7": { en: "Diagnostic log" },
  "\u9ED1\u5323\u5B50\uFF1A\u51FA\u9519\u4E86\u628A\u8FD9\u4E2A\u53D1\u7ED9\u5F00\u53D1\u8005\uFF1B\u4E0D\u4E0A\u4F20\uFF0C\u53EA\u6709\u70B9\u300C\u590D\u5236 / \u5206\u4EAB\u300D\u624D\u79BB\u5F00\u8BBE\u5907": { en: "Black box: send this to the developer if something breaks; never uploaded, it only leaves the device when you tap Copy / Share" },
  "\u590D\u5236": { en: "Copy" },
  "\u4E0B\u8F7D .txt": { en: "Download .txt" },
  "\u5206\u4EAB\u2026": { en: "Share\u2026" },
  "\u6E05\u7A7A": { en: "Clear" },
  "\u6309\u952E\u624B\u611F\u7684\u6570\u5B57": { en: "Key-feel numbers" },
  "\u67E5\u5EF6\u8FDF\u7528\uFF1A\u6253\u5F00 = \u6309\u952E\u65F6\u5728\u952E\u76D8\u4E0A\u9762\u9732\u4E00\u884C\u6570\u5B57\uFF1B\u5173\u7740 = \u4E0D\u663E\u793A\uFF08\u665A\u4E86\u4E5F\u4E0D\u5F39\uFF0C\u53EA\u8BB0\u8FDB\u8BCA\u65AD\u65E5\u5FD7\uFF09": { en: "For chasing latency: on = a line of numbers appears above the keys while you play; off = never shown, even when keys are late (it only goes into the diagnostic log)" },
  "\u58F0\u97F3\u7684\u8D77\u6CD5\uFF08\u8BD5\u9A8C\uFF09": { en: "How audio starts (experiment)" },
  "\u5F00 = \u7B2C\u4E00\u6B21\u70B9\u5C4F\u5E55\u5148\u8D77\u4E00\u4E2A\u4E0D\u51FA\u58F0\u7684\u57AB\u811A\u628A\u58F0\u97F3\u786C\u4EF6\u53EB\u9192\uFF0C\u518D\u8D77\u771F\u6B63\u51FA\u58F0\u7684\u90A3\u4E00\u4E2A\uFF1B\u5173 = \u4EE5\u524D\u7684\u8D77\u6CD5\u3002\u6539\u4E86\u8981\u91CD\u5F00 app \u624D\u770B\u5F97\u51FA": { en: "On = the first tap starts a silent primer to wake the audio hardware, then the real output starts; off = the old way. Takes effect the next time the app is opened" },
  "\u8FD8\u539F\u51FA\u5382\u8BBE\u7F6E\u2026": { en: "Factory reset\u2026" },
  "\u8FD9\u53F0\u8BBE\u5907\u4E0A MoonSinger \u7684\u5168\u90E8\u672C\u5730\u6570\u636E\u6E05\u6210\u65B0\u88C5\uFF1A\u6B4C\u5E93\u7684\u672C\u673A\u526F\u672C\u3001\u5FF5\u7F13\u5B58\u3001\u5C01\u9762\u7F13\u5B58\u3001\u8BBE\u7F6E\u3001\u8BCA\u65AD\u65E5\u5FD7\u3001\u79BB\u7EBF\u58F3\uFF1B\u4E91\u7AEF\u7684\u6B4C\u548C\u672C\u673A\u6587\u4EF6\u4E0D\u52A8\uFF1B\u5C0F\u6708\u76F8\u6A21\u578B\u5305\u662F\u5BB6\u65CF\u5171\u4EAB\u7F13\u5B58\uFF0C\u4E0D\u52A8\u2014\u2014\u5728\u300C\u97F3\u6E90\u4E0E\u7F13\u5B58\u300D\u7684\u6A21\u578B\u5305\u91CC\u9010\u4E2A\u5220": { en: "Wipes all of MoonSinger's local data on this device back to a fresh install: local library copies, speech cache, cover cache, settings, diagnostic log and offline shell; songs in the cloud and local files aren't touched; Tsukuyomi-chan's model packs are shared with other apps on this site and aren't touched \u2014 delete them one by one under model packs in Settings \u203A Audio" },
  "\u68C0\u67E5\u66F4\u65B0": { en: "Check for updates" },
  "\u5361\u5728\u65E7\u7248\u672C\u65F6\u7528\uFF1A\u6CE8\u9500\u672C app \u7684\u79BB\u7EBF\u7F13\u5B58\u518D\u91CD\u5F00\u3002\u4E0B\u597D\u7684\u5C0F\u6708\u76F8\u6A21\u578B\u5305\u4E0D\u5220": { en: "For when you're stuck on an old version: unregisters this app's offline cache and reopens. Downloaded Tsukuyomi-chan model packs stay" },
  "\u6E05\u7F13\u5B58\u91CD\u542F": { en: "Clear cache and restart" },
  "{BUDGET} \u5C0F\u6708\u76F8 {parallelism} \u6761\u9053\uFF08\u8BBE\u5907\u9884\u7B97 {lanes}\uFF09\u3002{p}": { en: "{BUDGET} Tsukuyomi-chan {parallelism} lanes (device budget {lanes}). {p}" },
  "\u58F0\u97F3\u7684\u8F93\u51FA\u5EF6\u8FDF\uFF08\u6D4F\u89C8\u5668\u62A5\u7684\uFF09{lat} ms\u3002": { en: "Audio output latency (as reported by the browser): {lat} ms." },
  "{bytes} / \u9884\u7B97 {budget}\uFF0C{entries} \u6761": { en: "{bytes} / budget {budget}, {entries} entries" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u6CA1\u6709 IndexedDB\uFF1A\u53EA\u7528\u5185\u5B58": { en: "This browser has no IndexedDB: memory only" },
  "\u8BFB\u4E0D\u5230\uFF1A{Error}": { en: "Can't read: {Error}" },
  "\uFF1B\u8FD9\u4E2A\u7AD9\u70B9\u5171\u7528\u4E86 {usage} / \u914D\u989D {quota}": { en: "; this site is using {usage} / quota {quota}" },
  "\u8BBE\u5907\u4E0A\u7559\u7740 {total}{quota}\uFF1B\u5185\u5B58\u91CC\u73B0\u5728 {mem}": { en: "{total} kept on this device{quota}; {mem} in memory now" },
  "\u653E\u6389\u5185\u5B58\u91CC\u7684\u6574\u5305\uFF08\u8BBE\u5907\u4E0A\u7559\u7740\u7684\u4E0D\u52A8\uFF0C\u4E0B\u6B21\u7528\u518D\u4ECE\u8BBE\u5907\u8BFB\uFF09": { en: "Release whole banks from memory (what's on the device stays; it's read from the device next time)" },
  "\u653E\u6389\u5185\u5B58": { en: "Release memory" },
  "\u5DF2\u7559\u5728\u8BBE\u5907\u4E0A": { en: "Kept on this device" },
  "\u6CA1\u4E0B\u8F7D": { en: "Not downloaded" },
  "\u5220\u6389": { en: "Remove" },
  "\u4E0B\u8F7D\u7559\u7740": { en: "Download and keep" },
  "\u300C{p}\u300D\u7684\u58F0\u97F3\uFF08\u8FD9\u9996\u6B4C{packed}\uFF09": { en: "Sound of \u201C{p}\u201D (in this song{packed})" },
  "\u4E5F\u6253\u5305\u7740": { en: ", also packed" },
  "\u5F15\u7528\u7740\uFF1B\u5220\u4E86\u8981\u4ECE\u300C{name}\u300D\u627E": { en: "Referenced; if removed it must be found from \u201C{name}\u201D" },
  "\u522B\u7684\u6B4C / \u522B\u7684\u7248\u672C / \u522B\u7684 app \u7559\u7684\uFF08{p}\u2026\uFF09": { en: "Left by other songs / versions / apps ({p}\u2026)" },
  "\uFF08\u6CA1\u6709\uFF09": { en: "(none)" },
  "\u8FD8\u6CA1\u6709\u8BB0\u7740\u7684": { en: "Nothing kept yet" },
  "{n} \u9996 \xB7 {size}": { en: "{n} {n|song|songs} \xB7 {size}" },
  "{title} \xB7 {secs} \u79D2 \xB7 {size} \xB7 {date}": { en: "{title} \xB7 {secs} s \xB7 {size} \xB7 {date}" },
  "\u6B4C\u5E93\u91CC\uFF1A{names}": { en: "In the library: {names}" },
  "\u5220": { en: "Delete" },
  "\u58F0\u97F3\u91CD\u542F\u4E86": { en: "Audio restarted" },
  "\u6362\u8FC7\u4E86\uFF0C\u4F46\u58F0\u97F3\u8BBE\u5907\u8FD8\u6CA1\u8D77\u6765\uFF1A\u518D\u6309\u4E00\u6B21\uFF0C\u6216\u8005\u628A app \u5173\u6389\u91CD\u5F00": { en: "Rebuilt, but the audio device has not come up yet: press again, or close the app and reopen it" },
  "\u4E0B\u8F7D {name} {bytes}%": { en: "Downloading {name} {bytes}%" },
  "{name} \u7559\u5728\u8BBE\u5907\u4E0A\u4E86": { en: "{name} is kept on this device" },
  "\u5DF2\u7ECF\u662F\u6700\u65B0\u7248": { en: "Already up to date" },
  "\u8FD9\u91CC\u6CA1\u6709\u79BB\u7EBF\u58F3\uFF08\u672C\u673A\u5F00\u53D1 / \u6D4F\u89C8\u5668\u4E0D\u652F\u6301\uFF09\uFF0C\u4E0D\u7528\u66F4\u65B0": { en: "No offline shell here (local dev / unsupported browser), nothing to update" },
  "\u5168\u6E05\u4E86\uFF08\u8981\u542C\u518D\u6E32\uFF09": { en: "All cleared (render again to listen)" },
  "\u5220\u4E86\u8FD9\u4E00\u904D\uFF08\u8981\u542C\u518D\u6E32\uFF09": { en: "Deleted this render (render again to listen)" },
  "\u5FF5\u7F13\u5B58\u6E05\u7A7A\u4E86\uFF08\u5FF5\u8FC7\u7684\u53E5\u5B50\u8981\u91CD\u5FF5\uFF09": { en: "Speech cache cleared (spoken lines will need re-speaking)" },
  "\u5C0F\u6708\u76F8\u5F15\u64CE\u91CD\u5F00\u4E86\uFF0C\u5185\u5B58\u8FD8\u56DE\u53BB\u4E86\uFF08\u5FF5\u8FC7\u7684\u53E5\u5B50\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u4E0D\u7528\u91CD\u5FF5\uFF09": { en: "Tsukuyomi-chan's engine restarted and memory returned (spoken lines are stored on this device, no re-speaking needed)" },
  "\u5BFC\u5165\u4E2D\u2026": { en: "Importing\u2026" },
  "\u5BFC\u5165\u4E2D\u2026 {total}%": { en: "Importing\u2026 {total}%" },
  "\u5BFC\u5165\u6CA1\u6210\uFF1A{Error}": { en: "Import failed: {Error}" },
  "\u8FD9\u4E9B\u6587\u4EF6\u4E0D\u662F\u5C0F\u6708\u76F8\u8981\u7684\u6A21\u578B\u5305\u5206\u7247": { en: "These files aren't the model pack chunks Tsukuyomi-chan needs" },
  "\u5206\u4EAB": { en: "Share" },
  "\u4E0B\u8F7D": { en: "Download" },
  "\u5173##\u5173\u7A97": { en: "Close" },
  "\u5DF2\u4E0B\u8F7D {name}": { en: "Downloaded {name}" },
  "\u5DF2\u5206\u4EAB": { en: "Shared" },
  "\u5206\u4EAB\u5931\u8D25\uFF1A{Error}": { en: "Sharing failed: {Error}" },
  "\u6253\u5F00\u522B\u7684\u6B4C": { en: "Opening another song" },
  "\u8F68\u300C{id}\u300D": { en: "Track \u201C{id}\u201D" },
  "\u603B\u7EBF": { en: "Bus" },
  "\u52A0\u603B\u7EBF\u300C{name}\u300D": { en: "Add bus \u201C{name}\u201D" },
  "\u5220\u603B\u7EBF\u300C{id}\u300D": { en: "Delete bus \u201C{id}\u201D" },
  "\u5206\u6BB5\u5531\uFF1A{v}": { en: "Sing in segments: {v}" },
  "\u6587\u4EF6\u540D\uFF08{p}\uFF09\xB7 {p2}": { en: "File name ({p}) \xB7 {p2}" },
  "\u672C\u673A\u6587\u4EF6\u7684\u540D\u5B57\u5728\u6587\u4EF6\u7BA1\u7406\u5668\u91CC\u6539": { en: "Rename local files in your file manager" },
  "\u70B9\u4E86\u6539\u540D": { en: "Tap to rename" },
  "\u6539\u4E86\uFF0C\u9A6C\u4E0A\u81EA\u52A8\u5B58\u5230\u8FD9\u53F0\u8BBE\u5907\uFF08\u70B9 = \u73B0\u5728\u5B58 + \u63A8\uFF09": { en: "Changed; saving to this device shortly (tap = save and upload now)" },
  "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF08\u6CA1\u767B\u5F55 OneDrive\uFF0C\u4E0D\u4E0A\u4E91\uFF1B\u70B9 = \u5B58 + \u53BB\u767B\u5F55\uFF09": { en: "Saved on this device (not signed in to OneDrive, so not in the cloud; tap = save and sign in)" },
  "\u5B58\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\uFF08{cloudOffTitle}\uFF09": { en: "Saved in this browser ({cloudOffTitle})" },
  "\u79BB\u7EBF\uFF1A\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u56DE\u7EBF\u518D\u63A8\u4E0A\u4E91": { en: "Offline: saved on this device, uploads when back online" },
  "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\uFF0C\u8FD8\u6CA1\u63A8\u4E0A\u4E91\uFF08\u70B9 = \u73B0\u5728\u63A8\uFF09": { en: "Saved on this device, not uploaded yet (tap = upload now)" },
  "\u4E91\u7AEF\u4E5F\u662F\u6700\u65B0\u7684\uFF08\u70B9 = \u590D\u67E5\u4E91\u7AEF\uFF09": { en: "The cloud is up to date too (tap = recheck the cloud)" },
  "\u6539\u8FC7\u8FD8\u6CA1\u5B58\u56DE\u6587\u4EF6\uFF08\u70B9 = \u5B58\uFF09": { en: "Changed, not saved back to the file (tap = save)" },
  "\u5B58\u5728\u672C\u5730\u6587\u4EF6\u91CC\u4E86": { en: "Saved in the local file" },
  "\u8FD8\u6CA1\u5B58\uFF08\u70B9 = \u5B58\uFF09": { en: "Not saved yet (tap = save)" },
  "\u65B0\u7684\u4E00\u9996\uFF0C\u8FD8\u6CA1\u5B58": { en: "New song, not saved yet" },
  "\u6539\u4E86\uFF0C\u9A6C\u4E0A\u81EA\u52A8\u5B58\u5230\u8FD9\u53F0\u8BBE\u5907\uFF08\u70B9 = \u73B0\u5728\u5B58 + \u5199\u8FDB\u6587\u4EF6\u5939\uFF09": { en: "Changed; saving to this device shortly (tap = save and write to the folder now)" },
  "\u6587\u4EF6\u5939\u7684\u6743\u9650\u6389\u4E86\uFF1A\u6539\u52A8\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF08\u70B9 = \u91CD\u65B0\u6388\u6743\uFF09": { en: "Folder permission lost: changes are saved on this device (tap = re-authorize)" },
  "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\uFF0C\u8FD8\u6CA1\u5199\u8FDB\u6587\u4EF6\u5939\uFF08\u70B9 = \u73B0\u5728\u5199\uFF09": { en: "Saved on this device, not written to the folder yet (tap = write now)" },
  "\u6587\u4EF6\u5939\u91CC\u4E5F\u662F\u6700\u65B0\u7684\uFF08\u70B9 = \u590D\u67E5\uFF09": { en: "The folder is up to date too (tap = recheck)" },
  "\u300C{extras}\u300D\u8FD9\u4E2A\u89D2\u8272\u8FD8\u6CA1\u6709\u4EBA\u4E0A\u573A\uFF08\u539F\u6765\u7684\u4E50\u5668\u8FD9\u4E00\u7248\u6CA1\u6709\uFF09\uFF0C\u6240\u4EE5\u6CA1\u6709{what}\u3002\u8981\u5C0F\u6708\u76F8\u6765\u5531\uFF0C\u70B9\u8C31\u524D\u9762\u7684\u300C{extras2}\u300D\uFF0C\u5728\u300C\u8C01\u6765\u6F14\u300D\u9009\u5C0F\u6708\u76F8\u3002": { en: "Nobody is performing \u201C{extras}\u201D yet (this version doesn't have the original instrument), so there's no {what}. To have Tsukuyomi-chan sing it, tap \u201C{extras2}\u201D at the front of the score and choose her under \u201CWho performs\u201D." },
  "\u5199\u8FD9\u4E2A\u97F3 = \u539F\u901F\uFF08\u97F3\u9AD8\u5BF9\u9F50\uFF1A\u5199\u7684\u97F3 \u2248 \u542C\u5230\u7684\u97F3\uFF09": { en: "Writing this note = original speed (pitch aligned: the written note \u2248 what you hear)" },
  "\u539F\u901F\u952E\uFF1A\u6309\u8FD9\u4E2A\u952E\uFF0C\u91C7\u6837\u4E0D\u62C9\u4F38\u4E0D\u538B\u7F29": { en: "Original-speed key: press this key and the sample isn't stretched or compressed" },
  "\u8BD5\u542C\u4E0D\u4E86\uFF1A{Error}": { en: "Can't audition: {Error}" },
  "\u8C31\u4E0A\u8FD8\u6CA1\u6709\u97F3": { en: "No notes on the score yet" },
  "\u5C0F\u6708\u76F8\uFF08\u54FC\uFF09": { en: "Tsukuyomi-chan (hum)" },
  "\u300C{c}\u300D\u6362\u6210\uFF1A{gmName}": { en: "\u201C{c}\u201D replaced by: {gmName}" },
  "\u8FD9\u4E00\u884C\u4EA4\u7ED9\u4E86\u65B0\u58F0\u90E8\uFF1A{c}": { en: "This line now belongs to a new part: {c}" },
  "\u52A0\u4E86\u4E00\u4E2A\u58F0\u90E8\uFF1A{c}": { en: "Added a part: {c}" },
  "\u52A0\u4E86\u4E00\u4E2A\u58F0\u90E8\uFF1A{c}\uFF08\u76EE\u5F55\u8FD8\u5F00\u7740\uFF0C\u53EF\u4EE5\u63A5\u7740\u6362\uFF09": { en: "Added a part: {c} (the catalog stays open \u2014 keep switching if you like)" },
  "\u300C{extras}\u300D\u6362\u6210\uFF1A{name}": { en: "\u201C{extras}\u201D replaced by: {name}" },
  "\u300C{name}\u300D\u7684\u58F0\u97F3\u6CA1\u80FD\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF08\u7A7A\u95F4\u4E0D\u591F\uFF0C\u6216\u8FD9\u4E2A\u6D4F\u89C8\u5668\u4E0D\u8BA9\u5B58\uFF09\uFF1A\u8FD9\u6B21\u6253\u5F00\u91CC\u80FD\u54CD\uFF1B\u4E0B\u6B21\u8981\u4ECE\u300C{name2}\u300D\u6587\u4EF6\u627E\u3002\u60F3\u8BA9\u6B4C\u81EA\u5DF1\u5E26\u7740\u5B83\uFF1A\u6587\u4EF6\u83DC\u5355\u300C\u5168\u90E8\u6253\u5305\u8FDB\u6B4C\u300D\u3002": { en: "The sound of \u201C{name}\u201D couldn't be kept on this device (out of space, or the browser doesn't allow it): it works this session; next time, find it from the \u201C{name2}\u201D file. To have the song carry it: menu \u201CPack everything into the song\u201D." },
  "\u91CC\u9762\u6CA1\u6709\u4E50\u5668": { en: "No instruments inside" },
  "\u8BFB\u4E0D\u4E86\u300C{name}\u300D\uFF1A{Error}": { en: "Can't read \u201C{name}\u201D: {Error}" },
  "{name}\uFF08\u6CA1\u4EBA\u80FD\u6F14\uFF09": { en: "{name} (nobody can perform it)" },
  "\u300C{rn}\u300D\u590D\u5236\u4E86\u4E00\u4EFD\uFF1A{who}": { en: "\u201C{rn}\u201D: duplicated {who}" },
  "\u300C{rn}\u300D\u62F7\u6765\u4E86\u300C{from}\u300D\u7684\uFF1A{who}": { en: "\u201C{rn}\u201D: copied {who} from \u201C{from}\u201D" },
  "\u6362\u6210\u300C{who}\u300D": { en: "Changed to \u201C{who}\u201D" },
  "\u300C{rn}\u300D\u9000\u6389\u4E00\u4F4D\u5019\u9009": { en: "\u201C{rn}\u201D dropped a candidate" },
  "\u65B0\u58F0\u90E8": { en: "New part" },
  "\uFF08\u6CA1\u4EBA\u4E0A\u573A\uFF09": { en: "(nobody on stage)" },
  "{id} \u589E\u76CA {p}{p2} dB": { en: "{id} gain {p}{p2} dB" },
  "{id} \u58F0\u50CF {pan}": { en: "{id} pan {pan}" },
  "\u4E2D": { en: "C" },
  "\u5DE6 {p}": { en: "L {p}" },
  "\u53F3 {p}": { en: "R {p}" },
  "\u603B\u8F68\u589E\u76CA {p}{p2} dB": { en: "Master gain {p}{p2} dB" },
  "\u6BCD\u7EBF\u9650\u5E45{on}": { en: "Bus limiter{on}" },
  "\u65C1\u901A": { en: "Bypass" },
  "\u53D6\u6D88\u65C1\u901A": { en: "Un-bypass" },
  "\u6DF7\u97F3\u8F68 {n}": { en: "Bus {n}" },
  "\u52A0{name}": { en: "Add {name}" },
  "\u5220{name}": { en: "Delete {name}" },
  "\u6539\u540D\u300C{name}\u300D": { en: "Rename \u201C{name}\u201D" },
  "{extras} \u5F80{p}\u632A": { en: "Move {extras} {p}" },
  "\u524D": { en: "earlier" },
  "\u540E": { en: "later" },
  "{extras} \u589E\u76CA {p}{p2} dB": { en: "{extras} gain {p}{p2} dB" },
  "{extras} \u58F0\u50CF": { en: "{extras} pan" },
  "{track} \u51FA\u5230 {to}": { en: "{track} output to {to}" },
  "\u300C{next}\u300D\u6362\u4EBA\uFF1A{next2}": { en: "\u201C{next}\u201D performer change: {next2}" },
  "\u4F5C\u8005\u680F": { en: "Credits" },
  "\u51E0\u884C\u90FD\u884C\uFF0C\u7167\u5199\u7684\u663E\u793A\u5728\u7EB8\u4E0A\uFF08\u6807\u9898\u4E0B\u9762\u9760\u53F3\uFF09": { en: "Any number of lines, shown as written on the sheet (right-aligned under the title)" },
  "\u53EF\u4E0D\u586B\u3002\u5B58\u8FDB MusicXML\u300C\u5370\u5728\u9875\u9762\u4E0A\u7684\u5B57\u300D\uFF0C\u522B\u7684\u4E50\u8C31\u8F6F\u4EF6\u6253\u5F00\u4E5F\u5728\u7EB8\u4E0A\u3002": { en: "Optional. Saved as MusicXML page text, so other score software shows it too." },
  "\u8BB8\u53EF\uFF08\u53EF\u9009\uFF1B\u4F60\u5199\u7684\u8FD9\u90E8\u5206\uFF1A\u8BCD / \u66F2 / \u7F16\uFF09": { en: "License (optional; for your part: lyrics / music / arrangement)" },
  "\u4E0D\u5199\uFF1A\u6CD5\u5F8B\u9ED8\u8BA4 = \u4FDD\u7559\u6240\u6709\u6743\u5229\uFF08\u522B\u4EBA\u7528\u8981\u5148\u95EE\u4F60\uFF09": { en: "Not written: the legal default = all rights reserved (others must ask you first)" },
  "\u672A\u58F0\u660E\uFF08\u9ED8\u8BA4\uFF09": { en: "Not stated (default)" },
  "\u7A7A\u7740 = \u672A\u58F0\u660E\uFF08\u6CD5\u5F8B\u9ED8\u8BA4\u5C31\u662F\u4FDD\u7559\u6240\u6709\u6743\u5229\uFF09\uFF1B\u4E5F\u53EF\u4EE5\u81EA\u5DF1\u5199": { en: "Empty = not stated (the legal default is all rights reserved); or write your own" },
  "\u4ECE\u7D27\u5230\u677E\u6392\uFF1BCC \u90A3\u51E0\u4E2A\u53D1\u51FA\u53BB\u4EE5\u540E\u5BF9\u5DF2\u7ECF\u53D1\u51FA\u53BB\u7684\u6536\u4E0D\u56DE\u3002\u5B58\u8FDB MusicXML \u7684 &lt;rights&gt;\uFF1B\u5BFC\u51FA mp3 \u65F6\u8FDE\u540C\u7F72\u540D\u5199\u8FDB\u6587\u4EF6\u7684\u6807\u7B7E\u91CC\u3002": { en: "Listed strictest to loosest; once published under a CC license, published copies can't be taken back. Saved in MusicXML &lt;rights&gt;; written into the file tags with the credits when exporting mp3." },
  "\u5176\u4ED6": { en: "Other" },
  "\u6574\u9996\u6B4C\u4E00\u5F20\u7EB8\u3002\u7EB8\u8D8A\u5927\u4E00\u884C\u653E\u7684\u5C0F\u8282\u8D8A\u591A\uFF1B\u5C4F\u5E55\u653E\u5F97\u4E0B\u5C31\u7167\u7EB8\u6392\u3002\u4E0D\u6253\u5370\u7684\u65F6\u5019\u4E0D\u5206\u9875\u3002": { en: "One paper size for the whole song. Bigger paper fits more bars per line; if the screen fits, it's laid out as on paper. No page breaks unless printing." },
  "\u7248\u5F0F": { en: "Layout" },
  "\u7D27\u51D1 = \u8C31\u5C0F\u4E00\u53F7\u3001\u884C\u8DDD\u548C\u8C31\u8DDD\u6536\u7D27\u3001\u6CA1\u5199\u6B4C\u8BCD\u7684\u58F0\u90E8\u4E0D\u7559\u6B4C\u8BCD\u4F4D\u3002\u5B58\u8FDB MusicXML \u7684 scaling \u548C\u884C\u8DDD\uFF0C\u522B\u7684\u8F6F\u4EF6\u6253\u5F00\u4E5F\u4E00\u6837\u3002": { en: "Compact = smaller staves, tighter line and staff spacing, no lyric space for parts without lyrics. Saved in MusicXML scaling and spacing, so other software matches." },
  "\u7EB8\uFF08\u66F2\u6BB5\uFF09": { en: "Sheets (sections)" },
  "\uFF08\u6CA1\u540D\u5B57\uFF09": { en: "(no name)" },
  "\uFF08\u9690\u85CF \xB7 \u4E0D\u653E\uFF09": { en: "(hidden \xB7 not played)" },
  "\u8FD9\u4E00\u6BB5\u7684\u83DC\u5355\uFF1A\u6539\u540D / \u9690\u85CF / \u5220\u3001\u5728\u4E0A\u9762 / \u4E0B\u9762\u63D2\u4E00\u6BB5\u3001\u632A\u3001\u79FB\u8C03": { en: "This section\u2019s menu: rename / hide / delete, insert a section above / below, move, transpose" },
  "\u663E\u793A": { en: "Show" },
  "\u53EA\u770B\u4E00\u53F7\u8F68": { en: "First track only" },
  "\u53EA\u770B\u300C{song}\u300D\uFF08\u901F\u5EA6\u3001\u98CE\u683C\u3001\u53CD\u590D\u5199\u5728\u6700\u4E0A\u9762\u90A3\u4F4D\u8EAB\u4E0A\uFF09\uFF1B\u518D\u70B9 = \u90FD\u770B": { en: "Show only \u201C{song}\u201D (tempo, style and repeats are written on the top part); tap again = show all" },
  "\u6392\u6CD5": { en: "Layout mode" },
  "\u8FDE\u7EED": { en: "Continuous" },
  "\u4E0D\u65AD\u9875\uFF0C\u6BCF\u4E00\u884C\u548C\u5206\u9875\u4E00\u6837": { en: "No page breaks; every line matches paged layout" },
  "\u5206\u9875": { en: "Paged" },
  "\u6309\u7EB8\uFF08A4 / A5\uFF09\u7684\u771F\u5B9E\u9AD8\u5EA6\u65AD\u9875\uFF0C\u9884\u89C8\u6253\u5370": { en: "Breaks at the paper's real height (A4 / A5), for print preview" },
  "\u6A2A\u5377": { en: "Horizontal scroll" },
  "\u6BCF\u5F20\u7EB8\u4E00\u884C\u3001\u4E00\u76F4\u5F80\u53F3\uFF0C\u6A2A\u7740\u6EDA\uFF1B\u58F0\u90E8\u540D\u9489\u5728\u5DE6\u8FB9": { en: "One line per sheet, running right and scrolled sideways; part names stay pinned at the left" },
  "\u5C0F\u8282\u53F7": { en: "Bar numbers" },
  "\u6BCF\u884C\u5F00\u5934": { en: "Start of each line" },
  "\u6BCF\u884C\u6700\u4E0A\u9762\u90A3\u6761\u8C31\u7684\u5DE6\u4E0A\u89D2\uFF0C\u5C0F\u5B57\uFF1B\u6BCF\u5F20\u7EB8\u4ECE 1 \u6570\uFF0C\u5F31\u8D77\u7B97 0": { en: "Small, top-left of each line's top staff; each sheet counts from 1, a pickup counts as 0" },
  "\u4E0D\u5370": { en: "Don't print" },
  "\u6B4C\u8BCD": { en: "Lyrics" },
  "\u6309\u8282\u594F": { en: "By rhythm" },
  "\u97F3\u7684\u4F4D\u7F6E\u53EA\u770B\u65F6\u503C\uFF0C\u6253\u5B57\u65F6\u97F3\u7B26\u4E0D\u52A8\uFF1B\u6B4C\u8BCD\u8BA9\u8DEF\uFF1A\u501F\u65C1\u8FB9\u7684\u7A7A \u2192 \u8FD9\u4E00\u884C\u4E00\u8D77\u7F29\u4E00\u70B9 \u2192 \u8FD8\u653E\u4E0D\u4E0B\u753B\u7070": { en: "Note positions depend only on duration, so notes stay put while you type; lyrics make room: borrow space nearby \u2192 shrink the whole line a little \u2192 grey out if it still doesn't fit" },
  "\u6309\u6B4C\u8BCD": { en: "By lyrics" },
  "\u957F\u7684\u5B57\u628A\u97F3\u63A8\u5F00\uFF08\u51FA\u7248\u8C31\u7684\u8001\u89C4\u77E9\uFF09": { en: "Long words push notes apart (the traditional engraving rule)" },
  "\u4E13\u4E1A": { en: "Standard" },
  "\u6309\u5B9E\u9645\u7684\u8C03\u753B\u8C31\uFF0C\u952E\u4E0A\u5927\u5B57\u5199\u97F3\u540D": { en: "Draw in the actual key; big key labels show note names" },
  "\u6309 C \u8C03\u770B\uFF081=X\uFF09": { en: "Read in C (1=X)" },
  "\u8C31\u6362\u5230 C \u8C03\u753B\u3001\u6BCF\u4E2A\u8C03\u53F7\u4E0A\u65B9\u5199\u300C1=\u539F\u6765\u7684\u8C03\u300D\uFF0C\u952E\u4E0A\u5927\u5B57\u5199\u7EA7\u6570\uFF1B\u952E\u7684\u4F4D\u7F6E\u4E0D\u52A8": { en: "Draw the score in C with \u201C1=original key\u201D above every key signature; big key labels show degrees; the keys stay where they are" },
  "\u548C\u5F26\u6807\u7EA7\u6570": { en: "Chord degrees" },
  "\u53E0\u5728\u4E00\u8D77\u7684\u548C\u5F26\u4E0A\u65B9\u5199\u5B83\u5728\u8FD9\u4E2A\u8C03\u91CC\u662F\u51E0\u7EA7\uFF08V7\u3001ii\u3001\u266DVII\u3001I/3\u2026\uFF09\uFF1B\u70B9\u5B83\u770B\u5168\u90E8\u5019\u9009": { en: "Write the degree of stacked chords in this key above them (V7, ii, \u266DVII, I/3\u2026); tap one to see all candidates" },
  "\u4E0D\u6807": { en: "Don\u2019t show" },
  "\u8DDF\u7740\u8FD9\u9996\u6B4C\u8D70\uFF1A\u5B58\u5728\u6B4C\u91CC\u3001\u80FD\u64A4\u9500\uFF0C\u5BFC\u51FA\u7684 PDF \u7167\u8FD9\u91CC\u5370\u3002\u522B\u4EBA\u7684\u6B4C\u9501\u7740\u4E5F\u80FD\u5207\u7740\u770B\uFF0C\u4E0D\u4F1A\u6539\u52A8\u6587\u4EF6\u3002": { en: "Belongs to this song: saved in it, undoable, and the exported PDF prints it this way. You can switch it on someone else\u2019s locked song too; the file is not changed." },
  "\u5C4F\u5E55\u653E\u4E0D\u4E0B\u7EB8\u7684\u65F6\u5019": { en: "When the screen can't fit the sheet" },
  "\u4E0D\u6298\u884C": { en: "Don't wrap" },
  "\u6574\u5F20\u7EB8\u7F29\u5C0F\uFF0C\u884C\u548C\u7EB8\u4E0A\u4E00\u6837": { en: "Shrink the whole sheet; lines match the paper" },
  "\u6298\u884C": { en: "Wrap" },
  "\u6309\u5C4F\u5E55\u5BBD\u6392\uFF0C\u8C31\u5927\u4E00\u70B9": { en: "Lay out to screen width, with larger staves" },
  "\u4EE5\u540E\u63D2\u56FE\u7247\u4E5F\u5728\u8FD9\u91CC\u3002": { en: "Image insertion will live here later too." },
  "\u6309 C \u8C03\u770B": { en: "Read in C" },
  "\u770B\u8C31\uFF1A\u4E13\u4E1A": { en: "Reading: professional" },
  "\u548C\u5F26\u4E0D\u6807\u7EA7\u6570": { en: "No chord degrees" },
  "\u5C0F\u6708\u76F8\u5FF5\u51FA\u6765 {n} \u4E2A\u97F3\u8282\u3001\u8C31\u4E0A {n2} \u4E2A\uFF0C\u5BF9\u4E0D\u4E0A\uFF08\u5531\u7684\u65F6\u5019\u4F1A\u62A5\u9519\uFF09\uFF1A": { en: "Tsukuyomi-chan says {n} syllables but the score has {n2}, so they don't match (singing will report an error):" },
  "\u5C0F\u6708\u76F8\u5FF5\u6210\uFF08\u97F3\u7D20 + \u58F0\u8C03\uFF09\uFF1A": { en: "Tsukuyomi-chan reads it as (phonemes + tones):" },
  "\u5C0F\u6708\u76F8\u5FF5\u6210\uFF1A": { en: "Tsukuyomi-chan reads it as:" },
  "\u4E0D\u51FA\u58F0": { en: "Silent" },
  "{p}{p2}\uFF1A\u7A7A\u7740\u7684\u6B4C\u8BCD\u4F4D\u4E0D\u5F00\u6846\uFF1B\u5DF2\u7ECF\u5199\u4E86\u7684\u5B57\u70B9\u5F00\u80FD\u6539\u3001\u80FD\u5220": { en: "{p}{p2}: empty lyric slots don't open a box; lyrics already written can still be tapped to edit or delete" },
  "\uFF08\u5143\u97F3\u7248\uFF09\u53EA\u54FC": { en: " (vowel version) only hums" },
  "\u4E0D\u5531\u6B4C\u8BCD": { en: " doesn't sing lyrics" },
  "\u6B4C\u91CC\u53EA\u5269\u8FD9\u4E00\u4E2A\u58F0\u90E8\uFF0C\u5220\u4E0D\u4E86": { en: "This is the only part left in the song; it can't be deleted" },
  "\u300C{name}\u300D\u662F{secs}\u91CC\u552F\u4E00\u7684\u58F0\u90E8\uFF0C\u5220\u4E0D\u4E86\uFF1A\u5148\u7ED9\u8FD9\u51E0\u6BB5\u653E\u8FDB\u522B\u7684\u58F0\u90E8\uFF0C\u6216\u8005\u628A\u8FD9\u51E0\u6BB5\u6574\u6BB5\u5220\u6389": { en: "\u201C{name}\u201D is the only part in {secs}, so it can't be deleted: first put another part into those sections, or delete those sections" },
  "\u5220\u6389\u58F0\u90E8\u300C{name}\u300D": { en: "Delete part \u201C{name}\u201D" },
  "\u5220\u6389\u4E86\u300C{name}\u300D\uFF08\u5B83\u6CA1\u5199\u4E1C\u897F\uFF1B\u64A4\u9500\u80FD\u627E\u56DE\u6765\uFF09": { en: "Deleted \u201C{name}\u201D (it hadn't written anything; undo brings it back)" },
  "\u300C{p}\u300D{n} \u4E2A\u97F3": { en: "\u201C{p}\u201D: {n} {n|note|notes}" },
  "\u300C{p}\u300D\uFF08\u6CA1\u6709\u97F3\uFF0C\u53EA\u6709\u4F11\u6B62 / \u8BB0\u53F7\uFF09": { en: "\u201C{p}\u201D (no notes, only rests / marks)" },
  "\u3001": { en: ", " },
  "\u5220\u6389\u58F0\u90E8\u300C{name}\u300D\uFF1F": { en: "Delete the part \u201C{name}\u201D?" },
  "\u5B83\u5199\u8FC7\u7684\uFF1A{list}\u3002\u8FDE\u540C\u6B4C\u8BCD\u3001\u8BB0\u53F7\u3001\u5B83\u7684\u4E50\u5668\u8BBE\u7F6E\u4E00\u8D77\u5220\u6389\uFF08\u80FD\u64A4\u9500\uFF0C\u4E00\u6B65\u5168\u627E\u56DE\uFF09\u3002": { en: "What it wrote: {list}. Its lyrics, marks and instrument settings are deleted too (undo brings it all back in one step)." },
  "\u5220\u6389\u4E86\u300C{name}\u300D\uFF08\u64A4\u9500\u80FD\u627E\u56DE\u6765\uFF09": { en: "Deleted \u201C{name}\u201D (undo brings it back)" },
  "\u7B2C {n} \u6BB5": { en: "Section {n}" },
  "\u300C{p}\u300D\u53EA\u6709\u300C{name}\u300D\u8FD9\u4E00\u4E2A\u58F0\u90E8\uFF0C\u5220\u4E0D\u4E86\uFF1A\u8FD9\u4E00\u6BB5\u6574\u6BB5\u4E0D\u8981 = \u7EB8\u9876\u300C\u22EF\u300D\u91CC\u5220\u8FD9\u4E00\u6BB5": { en: "\u201C{name}\u201D is the only part in \u201C{p}\u201D, so it can't be deleted: to drop the whole section, use the \u22EF at the top of the sheet" },
  "\u5DF2\u4ECE\u300C{p}\u300D\u5220\u6389\u300C{name}\u300D\uFF08\u5B83\u5728\u8FD9\u4E00\u6BB5\u6CA1\u5199\u4E1C\u897F\uFF09": { en: "Deleted \u201C{name}\u201D from \u201C{p}\u201D (it hadn't written anything in this section)" },
  "\u4ECE\u300C{p}\u300D\u5220\u6389\u300C{name}\u300D\uFF1F": { en: "Delete \u201C{name}\u201D from \u201C{p}\u201D?" },
  "\u5B83\u5728\u8FD9\u4E00\u6BB5\u5199\u7684 {n} \u4E2A\u97F3\uFF0C\u8FDE\u540C\u6B4C\u8BCD\u3001\u8BB0\u53F7\u4E00\u8D77\u5220\u6389\u3002": { en: "The {n} {n|note|notes} it wrote in this section {n|is|are} deleted, with their lyrics and marks." },
  "\u5B83\u5728\u8FD9\u4E00\u6BB5\u5199\u7684\u4E1C\u897F\u4E00\u8D77\u5220\u6389\u3002": { en: "What it wrote in this section is deleted." },
  "\u518D\u628A\u5B83\u653E\u8FDB\u8FD9\u4E00\u6BB5\u662F\u4E00\u884C\u7A7A\u7684\uFF1B\u8981\u627E\u56DE\u53EA\u80FD\u64A4\u9500\u3002": { en: "Putting it back into this section gives an empty line; only undo brings the old one back." },
  "\u300C{p}\u300D\u6BB5\u7684\u300C{label}\u300D\u4EA4\u7ED9\u2026": { en: "Hand \u201C{label}\u201D in section \u201C{p}\u201D to\u2026" },
  "\u5728\u300C{label}\u300D\u4E0A\u9762\u52A0": { en: "Add above \u201C{label}\u201D" },
  "\u5728\u300C{label}\u300D\u4E0B\u9762\u52A0": { en: "Add below \u201C{label}\u201D" },
  "\uFF08\u5BF9\u8C03\uFF09": { en: " (swap)" },
  "\uFF0B \u65B0\u58F0\u90E8\u2026": { en: "\uFF0B New part\u2026" },
  "\u53EA\u6539\u8FD9\u4E00\u6BB5\uFF1A\u97F3\u3001\u6B4C\u8BCD\u3001\u8BB0\u53F7\u90FD\u4E0D\u52A8\uFF0C\u6362\u4E00\u4E2A\u58F0\u90E8\u5531\uFF1B\u8DE8\u6BB5\u6309\u58F0\u90E8\u63A5\u8D77\u6765\u3002\u5BF9\u65B9\u5728\u8FD9\u4E00\u6BB5\u5DF2\u7ECF\u6709\u4E00\u884C = \u4E24\u884C\u5BF9\u8C03\u3002": { en: "This section only: notes, lyrics and marks stay, another part plays them; across sections, lines join up by part. If the other part already has a row here, the two rows swap." },
  "\u53EA\u52A0\u5728\u8FD9\u4E00\u6BB5\uFF08\u522B\u7684\u6BB5\u7167\u65E7\uFF09\u3002": { en: "Only added to this section (others unchanged)." },
  "\u4ECE\u300C{p}\u300D\u5220\u6389\uFF08\u5B83\u5728\u8FD9\u4E00\u6BB5\u5199\u7684\u4E00\u8D77\u5220\uFF0C\u5148\u95EE\uFF09": { en: "Delete from \u201C{p}\u201D (what it wrote in that section is deleted; asks first)" },
  "\u653E\u8FDB\u300C{p}\u300D\uFF08\u4E00\u884C\u7A7A\u7684\uFF09": { en: "Put into \u201C{p}\u201D (an empty line)" },
  "\u8C31\u4E0A\u5199\u7684\u540D\u5B57\uFF08\u70B9\u4E86\u5C31\u80FD\u6539\uFF09": { en: "The name written on the score (tap to edit)" },
  "\u6362\u4E50\u5668\uFF08\u8FDB\u4E50\u5668\u76EE\u5F55\uFF09": { en: "Change instrument (opens the instrument catalog)" },
  "\u6CA1\u4EBA\u4E0A\u573A": { en: "Nobody on stage" },
  "\u8FD9\u4E00\u884C\u7684\u66F4\u591A\uFF1A\u4E0A\u4E0B\u632A\u3001\u52A0\u3001\u4EA4\u7ED9\u3001\u4E50\u5668\u8BBE\u7F6E\u3001\u5220\u9664": { en: "More for this row: move, add, hand over, instrument settings, delete" },
  "\u66F4\u591A": { en: "More" },
  "\u4E0A\u79FB": { en: "Move up" },
  "\u4E0B\u79FB": { en: "Move down" },
  "\u5728\u8FD9\u4E00\u884C\u4E0A\u9762\u52A0\u4E00\u4E2A\u58F0\u90E8\uFF08\u5DF2\u6709\u7684\u6216\u65B0\u7684\uFF1B\u53EA\u52A0\u5728\u8FD9\u4E00\u6BB5\uFF09": { en: "Add a part above this row (existing or new; this section only)" },
  "\u5728\u4E0A\u9762\u52A0\u2026": { en: "Add above\u2026" },
  "\u5728\u8FD9\u4E00\u884C\u4E0B\u9762\u52A0\u4E00\u4E2A\u58F0\u90E8\uFF08\u5DF2\u6709\u7684\u6216\u65B0\u7684\uFF1B\u53EA\u52A0\u5728\u8FD9\u4E00\u6BB5\uFF09": { en: "Add a part below this row (existing or new; this section only)" },
  "\u5728\u4E0B\u9762\u52A0\u2026": { en: "Add below\u2026" },
  "\u53EA\u6709\u8FD9\u4E00\u6BB5\uFF1A\u8FD9\u4E00\u884C\u7684\u97F3\u3001\u6B4C\u8BCD\u3001\u8BB0\u53F7\u539F\u6837\u4EA4\u7ED9\u53E6\u4E00\u4E2A\u58F0\u90E8\u6F14\uFF08\u7528\u5B83\u7684\u4E50\u5668\u548C\u6DF7\u97F3\u53F0\u90A3\u4E00\u6761\uFF09": { en: "This section only: hand this row\u2019s notes, lyrics and marks to another part (its instrument and its mixer strip)" },
  "\u300C{p}\u300D\u6BB5\u4EA4\u7ED9\u2026": { en: "Hand section \u201C{p}\u201D to\u2026" },
  "\u653E\u8FDB\u300C{p}\u300D": { en: "Put into \u201C{p}\u201D" },
  "\u4E50\u5668\u8BBE\u7F6E\u2026": { en: "Instrument settings\u2026" },
  "\u5B83\u5728\u8FD9\u4E00\u6BB5\u5199\u7684\u4E00\u8D77\u5220\u6389\uFF08\u5148\u95EE\uFF1B\u80FD\u64A4\u9500\uFF09\u3002\u522B\u7684\u6BB5\u7167\u65E7": { en: "Deletes what it wrote in this section (asks first; undo works). Other sections stay as they are" },
  "\u4ECE\u300C{p}\u300D\u5220\u6389": { en: "Delete from \u201C{p}\u201D" },
  "\u6574\u4E2A\u58F0\u90E8\u5220\u6389\uFF1A\u6BCF\u4E00\u6BB5\u91CC\u5B83\u5199\u7684\u3001\u5B83\u7684\u4E50\u5668\u8BBE\u7F6E\u4E00\u8D77\u5220\uFF08\u5148\u95EE\uFF1B\u80FD\u64A4\u9500\uFF09": { en: "Delete the whole part: what it wrote in every section and its instrument settings (asks first; undo works)" },
  "\u5220\u6389\u58F0\u90E8\u2026": { en: "Delete part\u2026" },
  "\u58F0\u90E8\u7BA1\u7406": { en: "Parts" },
  "\u5C0F\u683C = \u5728\u54EA\u51E0\u6BB5\uFF08\u4EAE = \u6709\uFF1B\u5708\u7740\u7684 = \u5149\u6807\u8FD9\u4E00\u6BB5\uFF09\uFF1B\u22EF = \u4E0A\u4E0B\u632A\u3001\u52A0\u3001\u4EA4\u7ED9\u3001\u5220\u9664": { en: "Chips = which sections (lit = has it; ringed = the cursor's section); \u22EF = move, add, hand over, delete" },
  "\u65B0\u58F0\u90E8\u53EA\u52A0\u5728\u5149\u6807\u8FD9\u4E00\u6BB5\uFF08\u522B\u7684\u6BB5\u7167\u65E7\uFF09\uFF0C\u52A0\u5B8C\u6311\u4E50\u5668": { en: "The new part goes only into the cursor\u2019s section (others unchanged); then pick an instrument" },
  "\uFF0B \u65B0\u58F0\u90E8": { en: "\uFF0B New part" },
  "\u89D2\u8272\u6539\u540D\uFF1A{n}": { en: "Role renamed: {n}" },
  "\u8FD9\u4E00\u6BB5\u7684\u8FD9\u4E00\u884C\u4EA4\u7ED9\u4E86\u300C{name}\u300D": { en: "This section\u2019s row was handed to \u201C{name}\u201D" },
  "\u8FD9\u4E00\u6BB5": { en: "This section" },
  "\u6539\u66F2\u6BB5\u540D\u2026": { en: "Rename section\u2026" },
  "\u9690\u85CF = \u4E0D\u653E\u3001\u4E0D\u8FDB\u538B\u5E73\u4EF6\uFF1B\u8C31\u4E0A\u6298\u53E0\u7740\uFF0C\u7FFB\u9875\u80FD\u8FDB\u53BB": { en: "Hidden = not played and not in the flattened copy; collapsed on the score, reachable by paging" },
  "\u663E\u793A\uFF08\u73B0\u5728\u9690\u85CF\u7740\uFF09": { en: "Show (hidden now)" },
  "\u9690\u85CF\uFF08\u4E0D\u653E\uFF09": { en: "Hide (don't play)" },
  "\u5220\u8FD9\u4E00\u6BB5\u2026": { en: "Delete this section\u2026" },
  "\u63D2\u5165": { en: "Insert" },
  "\u65B0\u7684\u4E00\u6BB5\u63D2\u5728\u5B83\u524D\u9762\uFF08\u8C31\u5934\u7167\u6284\u524D\u4E00\u6BB5\u7ED3\u5C3E\u7684\u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6\uFF09": { en: "Insert a new section before it (its header copies the key / time / tempo where the previous section ends)" },
  "\u5728\u4E0A\u9762\u63D2\u4E00\u6BB5": { en: "Insert above" },
  "\u65B0\u7684\u4E00\u6BB5\u63A5\u5728\u5B83\u540E\u9762": { en: "Insert a new section after it" },
  "\u5728\u4E0B\u9762\u63D2\u4E00\u6BB5": { en: "Insert below" },
  "\u6574\u6BB5\uFF08\u6240\u6709\u58F0\u90E8\u7684\u97F3\u3001\u8BB0\u53F7\u3001\u6B4C\u8BCD\uFF09\u7167\u6284\u4E00\u4EFD\uFF0C\u63A5\u5728\u5B83\u540E\u9762": { en: "Copy the whole section (all parts' notes, marks and lyrics) right after it" },
  "\u590D\u5236\u8FD9\u4E00\u6BB5": { en: "Duplicate section" },
  "\u7F16\u8F91": { en: "Edit" },
  "\u8FD9\u5F20\u7EB8 / \u6574\u9996\u6240\u6709\u58F0\u90E8\u4E00\u8D77\u79FB\u8C03\u3001\u8F6C\u8C03\uFF08\u8C03\u53F7\u8DDF\u7740\u632A\uFF09": { en: "Transpose / change key for all parts on this sheet or the whole song (key signature moves too)" },
  "\u79FB\u8C03 / \u8F6C\u8C03\u2026": { en: "Transpose / change key\u2026" },
  "\u66F2\u6BB5 = \u4E00\u5F20\u7EB8\uFF1A\u6BCF\u4E00\u6BB5\u662F\u4E00\u4E2A\u65B0\u7684\u5F00\u59CB\uFF0C\u5404\u58F0\u90E8\u5728\u8FD9\u91CC\u91CD\u65B0\u5BF9\u9F50\uFF1B\u4E00\u6BB5\u91CC\u8981\u54EA\u4E9B\u58F0\u90E8\u968F\u5B83\uFF08\u6BCF\u6BB5\u5E95\u4E0B\u300C\uFF0B \u58F0\u90E8\u300D\uFF09\u3002": { en: "Section = one sheet: each section is a fresh start where all parts line up again; each section has its own parts (use \uFF0B Part under it)." },
  "{name} \u526F\u672C": { en: "{name} copy" },
  "\u66F2\u6BB5": { en: "Section" },
  "\u590D\u5236\u4E86\u4E00\u6BB5\uFF08\u63A5\u5728\u540E\u9762\uFF09": { en: "Section duplicated (placed right after)" },
  "\u8FD9\u5F20\u7EB8\u663E\u793A\u4E86\uFF08\u4F1A\u653E\uFF09": { en: "This sheet is shown (will play)" },
  "\u8FD9\u5F20\u7EB8\u9690\u85CF\u4E86\uFF08\u4E0D\u653E\uFF09": { en: "This sheet is hidden (won't play)" },
  "\u5220\u6389\u300C{p}\u300D\uFF1F": { en: "Delete \u201C{p}\u201D?" },
  "\u8FD9\u5F20\u7EB8\u4E0A\u6240\u6709\u58F0\u90E8\u5199\u7684\u4E1C\u897F\u4E00\u8D77\u5220\u6389\uFF08\u80FD\u64A4\u9500\uFF1A\u64A4\u9500 / Ctrl+Z\uFF09\u3002": { en: "Everything written in all parts on this sheet is deleted (can be undone: Undo / Ctrl+Z)." },
  "\u52A0\u8FDB\u300C{p}\u300D": { en: "Add to \u201C{p}\u201D" },
  "\u5DF2\u6709\u7684\u58F0\u90E8\uFF0C\u53EA\u52A0\u8FDB\u8FD9\u4E00\u6BB5\uFF08\u522B\u7684\u6BB5\u7167\u65E7\uFF09": { en: "An existing part, added to this section only (others unchanged)" },
  "\u65B0\u7684\u4E00\u4E2A\u58F0\u90E8\uFF0C\u53EA\u51FA\u73B0\u5728\u8FD9\u4E00\u6BB5\uFF1B\u52A0\u5B8C\u6311\u4E50\u5668": { en: "A new part, only in this section; then pick an instrument" },
  "\u58F0\u90E8\u7BA1\u7406\u2026": { en: "Parts\u2026" },
  "\u6362\u4E50\u5668\uFF1A\u8FDB\u4E50\u5668\u76EE\u5F55\uFF08\u53F3\u8FB9\u7684\u952E\u76D8\u80FD\u8BD5\uFF1B\u9876\u4E0A\u662F\u8FD9\u9996\u6B4C\u7684\u4E50\u5668\u9884\u8BBE\uFF09\uFF0C\u9009\u597D\u5C31\u6362\u4E0A\u3001\u76EE\u5F55\u8FD8\u5F00\u7740\u53EF\u4EE5\u63A5\u7740\u6362\uFF0C\u300C\u2190 \u8C31\u300D\u56DE\u6765": { en: "Change instrument: open the catalog (try with the keyboard on the right; this song\u2019s instrument presets are on top); picking one swaps it in and keeps the catalog open so you can keep trying; \u201C\u2190 Score\u201D goes back" },
  "{who} \u5728\u6F14": { en: "Played by {who}" },
  "\u6362\u4E50\u5668 \u203A": { en: "Change instrument \u203A" },
  "\u8FD9\u4F4D\u600E\u4E48\u6F14\uFF08\u54CD\u5EA6\u3001\u529B\u5EA6\u3001\u5531\u6CD5\u2026\uFF09\u548C\u8C31\u4E0A\u5199\u4EC0\u4E48\u540D\u5B57\uFF1A\u5168\u5C4F\u4E00\u9875\uFF0C\u53F3\u8FB9\u7684\u952E\u76D8\u80FD\u8BD5": { en: "How this performer plays (loudness, dynamics, singing\u2026) and the name on the score: a full page, try it on the keys at the right" },
  "\u6240\u6709\u58F0\u90E8\u6392\u4E00\u5217\uFF1A\u6539\u540D\u3001\u4E0A\u4E0B\u632A\u3001\u5728\u54EA\u51E0\u6BB5\uFF1B\u8FD9\u4E00\u6BB5\u4E0A\u9762 / \u4E0B\u9762\u52A0\u3001\u4EA4\u7ED9\u522B\u7684\u58F0\u90E8\u3001\u4ECE\u8FD9\u4E00\u6BB5\u5220\u6389": { en: "All parts in one list: rename, move, choose sections; add above / below in this section, hand to another part, delete from this section" },
  "\u6709 {n} \u4E2A\u5B57\u5531\u4E0D\u51FA\u6765\uFF08\u8C31\u4E0A\u753B\u7070\uFF09\uFF1A{first}{x}": { en: "{n} {n|syllable|syllables} can't be sung (grayed out on the score): {first}{x}" },
  " \u7B49": { en: " etc." },
  "\u8D77\u70B9\u632A\u5230\u8FD9\u4E2A\u5C0F\u8282\u7684\u5934\uFF0C\u4ECE\u8FD9\u513F\u653E\uFF08\u4E4B\u540E |\u25B6 \u56DE\u5230\u8FD9\u513F\u91CD\u653E\uFF1B\u7F16\u8F91\u3001\u632A\u5149\u6807\u90FD\u4E0D\u52A8\u8D77\u70B9\uFF09": { en: "Moves the start point to the head of this bar and plays from here (later |\u25B6 replays from here; editing or moving the cursor doesn't move it)" },
  "\u7C98\u8D34": { en: "Paste" },
  "\u8D34\u5728\u8FD9\u91CC\uFF1Aapp \u91CC\u590D\u5236\u7684\uFF0C\u6216\u7CFB\u7EDF\u526A\u8D34\u677F\u91CC\u7684\u7B80\u8C31\u6587\u5B57\uFF081 2 3 | 5 - -\uFF09": { en: "Paste here: copied in the app, or jianpu text on the system clipboard (1 2 3 | 5 - -)" },
  "\u5C0F\u8282\u7EBF |": { en: "Barline |" },
  "\u4ECE\u8FD9\u91CC\u91CD\u65B0\u6570\u5C0F\u8282\uFF08\u5F31\u8D77\uFF09": { en: "Recount bars from here (pickup)" },
  "\u8C31\u53F7 \xB7 \u8C03\u53F7 \xB7 \u62CD\u53F7 \xB7 \u901F\u5EA6\u2026": { en: "Clef \xB7 Key \xB7 Time \xB7 Tempo\u2026" },
  "\u4ECE\u8FD9\u513F\u8D77\u6362\uFF08\u540C\u4E00\u4E2A\u9762\u677F\uFF09": { en: "Change from here (one panel)" },
  "\u516B\u5EA6\u7EBF\u2026": { en: "Ottava line\u2026" },
  "8va / 15ma / 8vb\uFF08\u53EA\u7BA1\u753B\uFF09": { en: "8va / 15ma / 8vb (display only)" },
  "\u8FD9\u5F20\u7EB8 / \u6574\u9996\u6240\u6709\u58F0\u90E8\u4E00\u8D77\u632A\uFF08\u8C03\u53F7\u8DDF\u7740\u632A\uFF09\uFF1B\u53EA\u632A\u4E00\u6BB5 = \u9009\u4E2D\u5B83\uFF0C\u7528\u9009\u533A\u83DC\u5355": { en: "Moves all parts on this sheet or in the whole song (key signature too); to move just a passage, select it and use the selection menu" },
  "\u529B\u5EA6 {d}\uFF1A\u4ECE\u8FD9\u513F\u524D\u9762\u90A3\u4E2A\u97F3\u8D77": { en: "Dynamic {d}: from the note before here" },
  "\u5168\u9009": { en: "Select all" },
  "\u98CE\u683C\u8BB0\u53F7\u8981\u653E\u5728\u4E00\u4E2A\u97F3\u4E0A\uFF08\u8FD9\u5F20\u7EB8\u91CC\u8FD8\u6CA1\u6709\u97F3\uFF09": { en: "A style mark goes on a note (this sheet has no notes yet)" },
  "\u53CD\u590D / \u8DF3\u8F6C\u53EA\u770B\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4F4D\uFF08{extras}\uFF09\u90A3\u4E00\u884C\uFF1A\u8FD9\u4E00\u884C\u5199\u7684\u753B\u7070\u3001\u4E0D\u8D77\u4F5C\u7528": { en: "Repeats / jumps only count on the top part's line ({extras}): written on this line they're grayed out and have no effect" },
  "\u7B2C {p} \u5F20\u7EB8": { en: "Sheet {p}" },
  "\u8FD9\u4E00\u6BB5\u300C{paperId}\u300D": { en: "This section \u201C{paperId}\u201D" },
  "\u79FB\u8C03": { en: "Transpose" },
  "\u2191 \u534A\u97F3": { en: "\u2191 Semitone" },
  "\u2193 \u534A\u97F3": { en: "\u2193 Semitone" },
  "\u2191 \u5168\u97F3": { en: "\u2191 Whole tone" },
  "\u2193 \u5168\u97F3": { en: "\u2193 Whole tone" },
  "\u516B\u5EA6": { en: "Octave" },
  "\u2191 \u516B\u5EA6": { en: "\u2191 Octave" },
  "\u2193 \u516B\u5EA6": { en: "\u2193 Octave" },
  "\u8F6C\u8C03\u5230\uFF08\u73B0\u5728 1={now}\uFF09\uFF1A\u97F3\u6309\u4E24\u4E2A\u4E3B\u97F3\u4E4B\u95F4\u7684\u97F3\u7A0B\u632A": { en: "Change key to (now 1={now}): notes move by the interval between the two tonics" },
  "{whole}\u6240\u6709\u58F0\u90E8\u4E00\u8D77\u632A\uFF0C\u8C03\u53F7\u8DDF\u7740\u632A\uFF08\u53D6\u5347\u964D\u53F7\u5C11\u7684\u5199\u6CD5\uFF1B\u632A\u516B\u5EA6\u8C03\u53F7\u4E0D\u53D8\uFF09\u3002\u6B4C\u8BCD\u3001\u8BB0\u53F7\u3001\u8C31\u53F7\u4E0D\u52A8\uFF1B\u9F13 / \u56FA\u5B9A\u6572\u4E00\u4E2A\u952E\u7684\u58F0\u90E8\uFF08\u5199\u7684\u97F3\u9AD8 = \u6572\u54EA\u4E2A\uFF09\u4E0D\u52A8\uFF1Bpad \u7684\u300C1=\u300D\u4E0D\u8DDF\u3002": { en: "{whole}all parts move together, and the key signature follows (spelled with fewer accidentals; octave moves leave it unchanged). Lyrics, marks and clefs stay; drums / single-key parts (written pitch = which one to hit) stay; the pad's \u201C1=\u201D doesn't follow." },
  "\u8FD9\u5F20\u7EB8\u4E0A": { en: "On this sheet," },
  "\u5DF2\u7ECF\u662F\u8FD9\u4E2A\u8C03": { en: "Already in this key" },
  "\u6CA1\u6709\u53EF\u4EE5\u632A\u7684\u97F3": { en: "No notes to move" },
  "{held} \u662F\u9F13 / \u56FA\u5B9A\u6572\u4E00\u4E2A\u952E\uFF08\u5199\u7684\u97F3\u9AD8 = \u6572\u54EA\u4E2A\uFF09\uFF0C\u6CA1\u632A": { en: "{held} is drums / single-key (written pitch = which one to hit), so it wasn't moved" },
  "\u8C31\u5185\u53CD\u590D\uFF1A\u63D2\u5728\u5149\u6807\u5904\uFF1B\u5149\u6807\u6328\u7740\u5C0F\u8282\u7EBF = \u628A\u90A3\u6761\u6539\u6210\u53CD\u590D\u7684\u3002\u653E\u7684\u65F6\u5019\u6309\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4E2A\u58F0\u90E8\u90A3\u4E00\u884C\u5C55\u5F00\uFF0C\u522B\u7684\u58F0\u90E8\u8DDF\u7740\uFF1B\u4E0D\u8DE8\u7EB8\u3002\u8DF3\u56DE\u6765\uFF08D.C. / D.S.\uFF09\u4E4B\u540E\u53CD\u590D\u4E0D\u518D\u53CD\u590D\u3002": { en: "Score repeats: inserted at the cursor; next to a barline = turns that barline into a repeat. Playback expands them from this sheet's top part, other parts follow; they don't cross sheets. After a jump back (D.C. / D.S.), repeats don't repeat again." },
  "\u53CD\u590D\u5F00\u59CB": { en: "Repeat start" },
  "\u53CD\u590D\u7ED3\u675F\uFF1A\u56DE\u5230 |:\uFF08\u6CA1\u6709 = \u8FD9\u5F20\u7EB8\u5F00\u5934\uFF09\u518D\u653E\u4E00\u904D": { en: "Repeat end: back to |: (or this sheet's start if none) and play again" },
  "\u524D\u4E00\u6BB5\u53CD\u590D\u7ED3\u675F\u3001\u540E\u4E00\u6BB5\u53CD\u590D\u5F00\u59CB": { en: "End one repeat, start another" },
  "\u4E00\u5171\u653E\u4E09\u904D": { en: "Play three times in total" },
  "\u4E00\u5171\u653E\u56DB\u904D": { en: "Play four times in total" },
  "\u6539\u56DE\u666E\u901A\u5C0F\u8282\u7EBF": { en: "Back to a normal barline" },
  "\u2016 \u6BB5\u843D\u7EBF": { en: "\u2016 Double bar" },
  "\u6BB5\u843D\u7EBF\uFF08\u4E24\u6839\u7EC6\u7EBF\uFF09\uFF1A\u5206\u6BB5\u7684\u8BB0\u53F7\uFF0C\u4E0D\u662F\u4E24\u6839\u5C0F\u8282\u7EBF\uFF1B\u6328\u7740\u5C0F\u8282\u7EBF = \u628A\u90A3\u6761\u6539\u6210\u6BB5\u843D\u7EBF": { en: "Double bar (two thin lines): a section marker, not two barlines; next to a barline = turns that one into a double bar" },
  "\u7EC8\u6B62\u7EBF": { en: "Final bar" },
  "\u7EC8\u6B62\u7EBF\uFF08\u7EC6 + \u7C97\uFF09\uFF1A\u66F2\u5B50 / \u8FD9\u4E00\u6BB5\u5230\u8FD9\u513F\u7ED3\u675F": { en: "Final bar (thin + thick): the piece / this section ends here" },
  "\u623F\u5B50\uFF1A\u7B2C {p} \u904D\u8D70\u8FD9\u91CC": { en: "Ending: take this on pass {p}" },
  "8va\uFF1A\u8C31\u4E0A\u753B\u4F4E\u4E00\u4E2A\u516B\u5EA6\uFF08\u5B9E\u9645\u7167\u5199\u7684\u9AD8\u516B\u5EA6\u54CD\uFF09": { en: "8va: drawn an octave lower (sounds an octave higher, as written)" },
  "15ma\uFF1A\u8C31\u4E0A\u753B\u4F4E\u4E24\u4E2A\u516B\u5EA6": { en: "15ma: drawn two octaves lower" },
  "8vb\uFF1A\u8C31\u4E0A\u753B\u9AD8\u4E00\u4E2A\u516B\u5EA6\uFF08\u5B9E\u9645\u7167\u5199\u7684\u4F4E\u516B\u5EA6\u54CD\uFF09": { en: "8vb: drawn an octave higher (sounds an octave lower, as written)" },
  "\u5230\u8FD9\u513F\u7ED3\u675F\u516B\u5EA6\u7EBF": { en: "End the ottava line here" },
  "\u516B\u5EA6\u7EBF\uFF1A\u4ECE\u5149\u6807\u5904\u8D77{sel}\u3002\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8\u3002": { en: "Ottava line: from the cursor{sel}. Display only, pitch doesn't change." },
  "\uFF08\u6709\u9009\u533A = \u53EA\u753B\u8FD9\u4E00\u6BB5\uFF09": { en: " (with a selection = just this passage)" },
  "\uFF0C\u5230\u4E0B\u4E00\u4E2A\u516B\u5EA6\u7EBF\u8BB0\u53F7\u4E3A\u6B62": { en: ", up to the next ottava mark" },
  "\u5927\u8C31\u8868": { en: "Grand staff" },
  "\u81EA\u52A8\u516B\u5EA6\u7EBF\uFF1A\u8FD9\u4E00\u4E32\u97F3\u8981\u4E09\u6761\u4EE5\u4E0A\u52A0\u7EBF\uFF0C\u81EA\u52A8\u753B\u4E86 {lab}\u3002\u53EA\u7BA1\u753B\u3001\u4E0D\u5B58\u8FDB\u8C31\uFF0C\u97F3\u9AD8\u4E0D\u53D8\uFF1B\u6539\u4E86\u97F3\u4F1A\u8DDF\u7740\u91CD\u7B97\u3002\u624B\u5199\u7684\u516B\u5EA6\u7EBF\u8BF4\u4E86\u7B97\u3002": { en: "Auto ottava: this run needs three or more ledger lines, so {lab} was drawn automatically. Display only, not saved in the score; pitch doesn't change, and it recalculates as notes change. Handwritten ottava lines win." },
  "\u56FA\u5B9A\u6210\u624B\u5199\u7684 {lab}\uFF08\u4E4B\u540E\u81EA\u5DF1\u6539\uFF09": { en: "Make it a handwritten {lab} (edit it yourself afterward)" },
  "\u8FD9\u4E00\u6BB5\u4E0D\u8981\u81EA\u52A8\u516B\u5EA6\u7EBF": { en: "No automatic octave lines in this section" },
  "\u8FD9\u4E00\u6BB5\u8FD9\u4E2A\u58F0\u90E8\u7684\u81EA\u52A8\u516B\u5EA6\u7EBF\u5173\u4E86\uFF08\u70B9\u8C31\u53F7\u3001\u8C31\u5934\u9762\u677F\u91CC\u80FD\u518D\u5F00\uFF09": { en: "Automatic octave lines are off for this part in this section (turn them back on by tapping the clef, in the header panel)" },
  "\u516B\u5EA6\u7EBF\uFF1A{p}\u3002\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8\u3002": { en: "Ottava line: {p}. Display only, pitch doesn't change." },
  "\u5220\u6389\u8FD9\u6761\u516B\u5EA6\u7EBF": { en: "Delete this ottava line" },
  "Segno\uFF1AD.S. \u8DF3\u56DE\u5230\u8FD9\u513F": { en: "Segno: D.S. jumps back here" },
  "Coda\uFF1ATo Coda \u8DF3\u5230\u8FD9\u513F": { en: "Coda: To Coda jumps here" },
  "Fine\uFF1A\u8DF3\u56DE\u6765\uFF08al Fine\uFF09\u4E4B\u540E\u5728\u8FD9\u513F\u505C": { en: "Fine: after jumping back (al Fine), stop here" },
  "To Coda\uFF1A\u8DF3\u56DE\u6765\uFF08al Coda\uFF09\u4E4B\u540E\u4ECE\u8FD9\u513F\u53BB Coda": { en: "To Coda: after jumping back (al Coda), go to the Coda from here" },
  "D.C.\uFF1A\u8DF3\u56DE\u8FD9\u5F20\u7EB8\u5F00\u5934\uFF0C\u653E\u5230\u7EB8\u5C3E": { en: "D.C.: back to the start of this sheet, play to the end" },
  "D.C. al Fine\uFF1A\u8DF3\u56DE\u5F00\u5934\uFF0C\u653E\u5230 Fine": { en: "D.C. al Fine: back to the start, play to Fine" },
  "D.C. al Coda\uFF1A\u8DF3\u56DE\u5F00\u5934\uFF0C\u5230 To Coda \u53BB Coda": { en: "D.C. al Coda: back to the start, at To Coda go to the Coda" },
  "D.S.\uFF1A\u8DF3\u56DE Segno\uFF0C\u653E\u5230\u7EB8\u5C3E": { en: "D.S.: back to the Segno, play to the end" },
  "D.S. al Fine\uFF1A\u8DF3\u56DE Segno\uFF0C\u653E\u5230 Fine": { en: "D.S. al Fine: back to the Segno, play to Fine" },
  "D.S. al Coda\uFF1A\u8DF3\u56DE Segno\uFF0C\u5230 To Coda \u53BB Coda": { en: "D.S. al Coda: back to the Segno, at To Coda go to the Coda" },
  "\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A{why}": { en: "No effect (grayed out): {why}" },
  "\u623F\u5B50\uFF1A\u7B2C {nums} \u904D\u8D70\u8FD9\u4E2A\u62EC\u53F7\uFF0C\u522B\u7684\u904D\u8DF3\u8FC7": { en: "Ending: pass {nums} takes this bracket, other passes skip it" },
  "\u8FD9\u4E00\u7248\u4E0D\u8BA4\u8BC6\u300C{style}\u300D\uFF1A\u4E0D\u52A0\u8F7B\u91CD\uFF08\u6362\u4E00\u4E2A\u98CE\u683C\u5C31\u597D\uFF09": { en: "This version doesn't know \u201C{style}\u201D: no beat weighting (pick another style)" },
  "{p} \u8FD9\u4E2A\u9884\u8BBE\u6CA1\u5217\uFF1A\u6309\u53E4\u5178\u7684\u5F3A\u5F31\u63A8{m}": { en: "This preset doesn't list {p}: inferred from classical strong and weak beats{m}" },
  "\uFF08\u51E0\u4E2A\u516B\u5206\u4E00\u7EC4\u8C31\u4E0A\u6CA1\u8BB0\uFF0C\u6309 2 + 2 + \u2026 + 3 \u63A8\uFF09": { en: " (eighth-note grouping isn't written, assumed 2 + 2 + \u2026 + 3)" },
  "{p}\uFF1A\u8FD9\u4E2A\u9884\u8BBE\u4E0D\u52A0\u8F7B\u91CD": { en: "{p}: this preset adds no beat weighting" },
  "\u6447\u6446\uFF1A\u4E00\u62CD\u91CC\u524D\u4E00\u4E2A\u516B\u5206\u5360 {p}%\uFF08\u76F4 = 50%\uFF0C\u4E09\u8FDE\u97F3\u611F \u2248 67%\uFF1B\u5E45\u5EA6\u53EA\u653E\u5927 / \u7F29\u5C0F\u6BD4\u76F4\u7684\u591A\u51FA\u6765\u7684\u90A3\u4E00\u622A\uFF0C\u5939\u5728 {p2}\u2013{p3}%\uFF09\u3002\u8FD9\u5F20\u7EB8\u4E0A\u6240\u6709\u58F0\u90E8\u4E00\u8D77\u6447\uFF08\u5C0F\u6708\u76F8\u4E5F\u662F\uFF0C\u4E0D\u5206\u8DDF\u591A\u5C11\uFF09\uFF1B\u5199\u6210\u8FDE\u97F3\u7684\u97F3\u30016/8 \u8FD9\u7C7B\u62CD\u53F7\u4E0D\u6447": { en: "Swing: the first eighth takes {p}% of each beat (straight = 50%, triplet feel \u2248 67%; amount only scales the part above straight, clamped to {p2}\u2013{p3}%). All parts on this sheet swing together (Tsukuyomi-chan too, regardless of how much they follow); tuplets and meters like 6/8 don't swing" },
  "\u8DDF {p}%": { en: "Follows {p}%" },
  "\u4E0D\u8DDF": { en: "Doesn't follow" },
  "\u8FD9\u5F20\u7EB8\u4E0A\uFF1A{p}\uFF08\u6309\u4E50\u5668\u7C7B\u522B\uFF0C\u9884\u8BBE\u7ED9\u7684\uFF09": { en: "On this sheet: {p} (by instrument family, from the preset)" },
  "\u4E5F\u53EB {p}": { en: "Also called {p}" },
  "\u4ECE\u8FD9\u513F\u8D77\u4E0D\u52A0\u62CD\u5B50\u8F7B\u91CD": { en: "No beat weighting from here" },
  "\u4E0D\u52A0\u8F7B\u91CD": { en: "No weighting" },
  "\u5E45\u5EA6\uFF1A\u9884\u8BBE\u7684 {a} \u500D": { en: "Amount: {a} \xD7 preset" },
  "\u98CE\u683C = \u62CD\u5B50\u8F7B\u91CD\uFF1A\u4ECE\u8FD9\u4E2A\u97F3\u8D77\u5230\u8FD9\u5F20\u7EB8\u7ED3\u5C3E\uFF0C\u6BCF\u4E2A\u97F3\u6309\u5B83\u843D\u5728\u5C0F\u8282\u91CC\u7684\u54EA\u4E00\u62CD\u8F7B\u4E00\u70B9\u6216\u91CD\u4E00\u70B9\uFF08\u50CF\u9F13\u624B\u7684\u5F8B\u52A8\uFF09\uFF1B\u5199\u4E86\u91CD\u97F3 / \u5F31\u5316\u7684\u97F3\u7167\u5199\u7684\u6765\u3002": { en: "Style = beat weighting: from this note to the end of the sheet, each note gets slightly lighter or heavier depending on where it falls in the bar (like a drummer's groove); notes with written accents / unstress follow what's written." },
  "\u4E00\u8F6E\u7684\u7B2C\u4E00\u5C0F\u8282\u662F\u4E09\u51FB\u90A3\u8FB9\uFF08\u524D\u53E5\uFF09\uFF0C\u4ECE\u8FD9\u4E2A\u8BB0\u53F7\u90A3\u4E00\u5C0F\u8282\u8D77\u6570": { en: "The first bar of the cycle is the three-hit side (first phrase), counted from this mark's bar" },
  "\u9519\u5F00\u4E00\u5C0F\u8282\uFF1A\u4E24\u5C0F\u8282\u5BF9\u8C03\uFF0C\u7B2C\u4E00\u5C0F\u8282\u662F\u4E24\u51FB\u90A3\u8FB9": { en: "Offset by a bar: the two bars swap, the first bar is the two-hit side" },
  "2-3\uFF08\u9519\u5F00\u4E00\u5C0F\u8282\uFF09": { en: "2-3 (offset by a bar)" },
  "\u53BB\u6389\u8FD9\u4E2A\u98CE\u683C\u8BB0\u53F7\uFF08\u8FD9\u513F\u8D77\u56DE\u5230\u524D\u4E00\u4E2A\u98CE\u683C\uFF1B\u8FD9\u5F20\u7EB8\u5F00\u5934 = \u4E0D\u52A0\uFF09": { en: "Remove this style mark (from here it returns to the previous style; at the start of a sheet = none)" },
  "\u53EA\u7BA1\u8FD9\u5F20\u7EB8\uFF1A\u4ECE\u8FD9\u4E2A\u97F3\u5230\u8FD9\u5F20\u7EB8\u7ED3\u5C3E\uFF08\u6216\u4E0B\u4E00\u4E2A\u98CE\u683C\u8BB0\u53F7\uFF09\u3002\u957F\u6309\u62D6 = \u632A\u5230\u522B\u7684\u97F3\u4E0A": { en: "This sheet only: from this note to the end of the sheet (or the next style mark). Long-press and drag = move to another note" },
  "\u6539\u6210 {d}": { en: "Change to {d}" },
  "\u6E10\u5F3A": { en: "Crescendo" },
  "\u6E10\u5F31": { en: "Diminuendo" },
  "\u8FD9\u5F20\u7EB8\u91CC\u524D\u9762\u6CA1\u6709\u529B\u5EA6\u8BB0\u53F7\uFF0C\u6CA1\u6709\u5730\u65B9\u6E10\u8FC7\u6765": { en: "No dynamic earlier on this sheet, so there's nothing to ramp from" },
  "\u4E2D\u95F4\u6709\u624B\u5199\u7684\u6E10\u5F3A\u6E10\u5F31\uFF0C\u6309\u624B\u5199\u7684\u8D70": { en: "There's a handwritten crescendo / diminuendo in between; that wins" },
  "\u4E0D\u8D77\u4F5C\u7528\uFF08\u753B\u7070\uFF09\uFF1A\u540E\u9762\u90A3\u4E2A\u97F3\u662F\u5F3A\u540E\u5373\u5F31\uFF08fp\uFF09\u2014\u2014\u97F3\u5934\u6309 f\u3001\u968F\u540E\u843D\u5230 p\uFF0C\u4E4B\u540E\u4E5F\u662F p\uFF0C\u8FD9\u4E2A {value} \u7BA1\u4E0D\u5230": { en: "No effect (grayed out): the next note is forte-piano (fp) \u2014 it attacks at f, falls to p and stays p, out of reach of this {value}" },
  "\u6E10\u5230\uFF1A\u4ECE\u8FD9\u5F20\u7EB8\u91CC\u4E0A\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u90A3\u513F\u4E00\u8DEF\u6E10\u53D8\u5230\u8FD9\u91CC\uFF08\u8C31\u4E0A\u865A\u7EBF\u53D1\u5939\uFF09\uFF1B\u5173 = \u5230\u8FD9\u513F\u7A81\u53D8": { en: "Ramp: changes gradually from the previous dynamic on this sheet to here (dashed hairpin on the score); off = changes suddenly here" },
  "{ramp}\u6E10\u5230\uFF08\u4ECE\u4E0A\u4E00\u4E2A\u529B\u5EA6\u6E10\u53D8\u8FC7\u6765\uFF09": { en: "{ramp}Ramp (gradually from the previous dynamic)" },
  "\u4E0D\u8D77\u4F5C\u7528\uFF1A": { en: "No effect:" },
  "\u53BB\u6389\u8FD9\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF08\u540E\u9762\u7684\u97F3\u56DE\u5230\u524D\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF09": { en: "Remove this dynamic (later notes return to the previous one)" },
  "\u53BB\u6389\u8FD9\u4E2A\u6E10\u5F3A / \u6E10\u5F31": { en: "Remove this crescendo / diminuendo" },
  "\u957F\u6309\u62D6 = \u632A\u5230\u522B\u7684\u97F3\u4E0A": { en: "Long-press and drag = move to another note" },
  "\u2039 \u8F6C\u8C03\u5230\u2026": { en: "\u2039 Change key to\u2026" },
  "\u73B0\u5728\u7684\u8C03": { en: "Current key" },
  "\u8F6C\u8C03\u2026": { en: "Change key\u2026" },
  "\u6574\u6BB5\u8F6C\u5230\u53E6\u4E00\u4E2A\u8C03\uFF1A\u97F3\u6309\u4E24\u4E2A\u4E3B\u97F3\u4E4B\u95F4\u7684\u97F3\u7A0B\u632A\uFF0C\u8C03\u53F7\u8DDF\u7740\u6362": { en: "Move the whole passage to another key: notes move by the interval between the two tonics, and the key signature changes" },
  "\u6309\u8C03\u53F7\u62FC\u5199": { en: "Spell by key signature" },
  "\u97F3\u9AD8\u4E0D\u53D8\uFF1A\u8C03\u5185\u7684\u97F3\u6362\u6210\u8C03\u53F7\u91CC\u7684\u5199\u6CD5\uFF08A\u266D \u5728\u4E94\u4E2A\u5347\u53F7\u7684\u8C03\u91CC = G\u266F\uFF09\uFF0C\u8C03\u5916\u7684\u4E0D\u52A8": { en: "Pitch stays: in-key notes use the key's spelling (A\u266D in a five-sharp key = G\u266F), out-of-key notes stay" },
  "\u65F6\u503C": { en: "Duration" },
  "\u90FD\u6539\u6210": { en: "Change all to" },
  "\u90FD\u6539\u6210\u957F\u77ED\u65CB\u94AE\u73B0\u5728\u90A3\u4E00\u6863": { en: "Change all to the current length setting" },
  "\u6E05\u6389\u8BB0\u53F7": { en: "Clear marks" },
  "\u66F2\u7EA7": { en: "Passage level" },
  "\u529B\u5EA6\u5B57\u3001\u6E10\u5F3A\u6E10\u5F31\u3001\u6E10\u5230\u3001\u98CE\u683C\uFF08\u9009\u533A\u7B2C\u4E00\u4E2A\u97F3\u524D\u9762\u6302\u7740\u7684\u4E5F\u7B97\uFF09": { en: "Dynamics, crescendo / diminuendo, ramps, style (including those just before the first selected note)" },
  "\u97F3\u7EA7": { en: "Note level" },
  "\u6F14\u594F\u6CD5\u3001\u97F3\u5934\uFF08\u91CD\u97F3 / \u7A81\u5F3A\u2026\uFF09\u3001\u97F3\u5185\u8D77\u4F0F\u3001\u8FDE\u7EBF\u3001\u547C\u5438\u3001\u6C14\u58F0": { en: "Articulations, attacks (accent / sforzando\u2026), swells, slurs, breaths, whispers" },
  "\u90FD\u6E05": { en: "Clear all" },
  "\u66F2\u7EA7 + \u97F3\u7EA7\uFF1B\u97F3\u3001\u6B4C\u8BCD\u3001\u8C03\u53F7\u62CD\u53F7\u901F\u5EA6\u3001\u53CD\u590D\u4E0D\u52A8": { en: "Passage + note level; notes, lyrics, key / time / tempo and repeats stay" },
  "\u526A\u5207": { en: "Cut" },
  "\u7C98\u8D34\uFF08\u66FF\u6362\u9009\u4E2D\u7684\uFF09": { en: "Paste (replaces selection)" },
  "\u9009\u4E2D\u7684\u8FD9\u4E00\u6BB5\u6CA1\u6709\u8FD9\u7C7B\u8BB0\u53F7": { en: "This selection has no marks of that kind" },
  "\u8FD9\u4E00\u7248\u51FA\u4E0D\u4E86\u58F0\uFF08\u522B\u7684\u8F6F\u4EF6\u539F\u6765\u7684\u4E50\u5668\uFF09": { en: "This version can't sound it (the other software's original instrument)" },
  "\u300C{name}\u300D\u4E0D\u662F\u6B4C\u91CC\u8BB0\u7684\u90A3\u4E2A\u300C{name2}\u300D\uFF08sha256 {p}\u2026 \u2260 {p2}\u2026\uFF09": { en: "\u201C{name}\u201D isn't the \u201C{name2}\u201D recorded in the song (sha256 {p}\u2026 \u2260 {p2}\u2026)" },
  "\u627E\u5230\u4E86\uFF1A\u300C{name}\u300D\u80FD\u54CD\u4E86": { en: "Found: \u201C{name}\u201D can sound now" },
  "\u6BCF\u5F20\u7EB8\u5F00\u5934\u8865\u4E86 {startDyns} \u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF08\u5C31\u662F\u90A3\u91CC\u672C\u6765\u751F\u6548\u7684\uFF0C\u542C\u8D77\u6765\u4E0D\u53D8\uFF1B\u4E0B\u6B21\u5B58\u65F6\u4E00\u8D77\u5199\u8FDB\u6587\u4EF6\uFF09": { en: "Added {startDyns} dynamics at sheet starts (the ones already in effect there, so it sounds the same; written to the file on the next save)" },
  "\u300C{p}\u300D\u6539\u8FC7\u8FD8\u6CA1\u5B58": { en: "\u201C{p}\u201D has unsaved changes" },
  "{what}\u4F1A\u4E22\u6389\u8FD9\u4E9B\u6539\u52A8\u3002": { en: "{what} will discard these changes." },
  "\u5148\u5B58": { en: "Save first" },
  "\u4E22\u6389\uFF0C\u7EE7\u7EED": { en: "Discard and continue" },
  "\u65B0\u5EFA": { en: "New" },
  "\u65B0\u7684\u4E00\u9996": { en: "New song" },
  "\u6CA1\u6253\u5F00\uFF1A{Error}": { en: "Not opened: {Error}" },
  "\u4ECE {host} \u6253\u5F00\u4E86 {name}\uFF1A\u8FD9\u662F\u4E00\u4EFD\u62F7\u8D1D\uFF0C\u60F3\u7559\u4E0B\u6765\u5C31\u6309\u300C\u5B58\u300D\u3002": { en: "Opened {name} from {host}. This is a copy; press Save to keep it." },
  "\u6253\u5F00\u4E86 {name}": { en: "Opened {name}" },
  "\u6253\u4E0D\u5F00 {name}\uFF1A{Error}": { en: "Can't open {name}: {Error}" },
  "\u4ECE\u94FE\u63A5\u6253\u5F00\u8FD9\u9996\u6B4C\uFF1F": { en: "Open this song from a link?" },
  "\u4F1A\u4ECE {host} \u4E0B\u8F7D\u8FD9\u4E2A\u6587\u4EF6\uFF1A{url}\u3002\u8FD9\u662F\u522B\u4EBA\u653E\u5728\u7F51\u4E0A\u7684\u6587\u4EF6\uFF1B\u6253\u5F00\u7684\u662F\u4E00\u4EFD\u62F7\u8D1D\uFF0C\u60F3\u7559\u4E0B\u6765\u5C31\u6309\u300C\u5B58\u300D\u3002": { en: "This downloads the file from {host}: {url}. It is a file someone put online; you get a copy, and pressing Save keeps it." },
  "\u6253\u5F00": { en: "Open" },
  "\u6253\u5F00\u94FE\u63A5\u91CC\u7684\u6B4C": { en: "Open the song from the link" },
  "\u6B63\u5728\u4ECE {host} \u4E0B\u8F7D\u2026": { en: "Downloading from {host}\u2026" },
  "\u6B63\u5728\u4ECE {host} \u4E0B\u8F7D\u2026 {pc}%": { en: "Downloading from {host}\u2026 {pc}%" },
  "{host} \u7ED9\u7684\u662F\u4E00\u4E2A\u7F51\u9875\uFF0C\u4E0D\u662F\u6B4C\u6587\u4EF6\uFF1A\u8981\u7528\u80FD\u76F4\u63A5\u4E0B\u8F7D\u7684\u94FE\u63A5\uFF08\u7F51\u76D8\u7684\u5206\u4EAB\u9875\u591A\u534A\u8981\u6362\u6210\u300C\u4E0B\u8F7D\u300D\u90A3\u4E2A\u94FE\u63A5\uFF09\u3002": { en: "{host} sent a web page, not a song file. Use a direct download link (for a cloud drive, usually its \u201Cdownload\u201D link rather than the share page)." },
  "\u4ECE {host} \u62FF\u5230\u7684\u4E0D\u662F\u6B4C\u6587\u4EF6\uFF08.mxl / .musicxml\uFF09\u3002": { en: "What came from {host} is not a song file (.mxl / .musicxml)." },
  "\u8FD9\u9996\u6B4C\u9501\u7740\uFF0C\u6709\u6539\u52A8\u6CA1\u5B58\u3001\u4E5F\u4E0D\u4F1A\u63A8\u4E0A\u4E91\uFF1A\u6539\u52A8\u8FD8\u5728\uFF0C\u70B9\u8C31\u4E0A\u9762\u7684\u300C\u63A5\u7740\u6539\u300D\u4E4B\u540E\u518D\u5B58\u3002": { en: "This song is locked, so the changes were not saved or uploaded. They are still here: tap \u201CKeep editing\u201D above the score, then save." },
  "\u8FD8\u662F\u7A7A\u7684\uFF0C\u6CA1\u4EC0\u4E48\u53EF\u5B58": { en: "Still empty, nothing to save" },
  "\u5B58\u597D\u4E86\uFF1A{name}": { en: "Saved: {name}" },
  "\u6CA1\u5B58": { en: "Not saved" },
  "\u6CA1\u5B58\uFF08\u53D6\u6D88\u4E86\uFF09": { en: "Not saved (canceled)" },
  "\u6CA1\u5B58\u4E0A\uFF1A{Error}": { en: "Couldn't save: {Error}" },
  "\u8FD9\u51E0\u4EF6\u627E\u4E0D\u5230\u58F0\u97F3\uFF0C\u526F\u672C\u91CC\u6CA1\u5E26\uFF1A{p}\u3002\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\uFF0C\u5728\u300C\u8C01\u6765\u6F14\u300D\u91CC\u300C\u627E\u6587\u4EF6\u2026\u300D\uFF0C\u518D\u5BFC\u51FA\u4E00\u6B21\u3002": { en: "No sound found for these, so the copy doesn't include them: {p}. Tap the part name at the front of the score, \u201CFind file\u2026\u201D under \u201CWho performs\u201D, and export again." },
  "\u8BB8\u53EF\u8FD9\u4E00\u4EFD\u6309\u300C\u672A\u58F0\u660E\u300D\u5199\u4E86\uFF08\u4F60\u9009\u7684\u8BB8\u53EF\u548C\u5C0F\u6708\u76F8\u7684\u6761\u6B3E\u53EF\u80FD\u51B2\u7A81\uFF1B\u4F5C\u8005\u680F\u91CC\u7684\u9009\u62E9\u6CA1\u52A8\uFF09\u3002": { en: "This copy's license was written as \u201Cnot stated\u201D (your chosen license may conflict with Tsukuyomi-chan's terms; your choice in the credits is unchanged)." },
  "\u7F72\u540D": { en: "Credits" },
  "\u6253\u5305\u5206\u53D1\u7684\u8BB8\u53EF\uFF08\u8FD9\u4EFD\u526F\u672C\u91CC\u5E26\u7740\u8FD9\u4E9B\u6E90\u6587\u4EF6\uFF09": { en: "Licenses for packed distribution (this copy carries these source files)" },
  "\u5B58\u4E86\u4E00\u4EFD\uFF1A{name}{fellBack}": { en: "Saved a copy: {name}{fellBack}" },
  "\uFF08\u8BB8\u53EF\u6309\u672A\u58F0\u660E\u5199\uFF09": { en: " (license written as not stated)" },
  "\u5B58\u4E00\u4EFD .mxl \u526F\u672C\uFF08\u6253\u5305\u97F3\u6E90\uFF09": { en: "Save an .mxl copy (packed sounds)" },
  "\u5B58\u4E00\u4EFD .mxl \u526F\u672C": { en: "Save an .mxl copy" },
  "{name} \xB7 {size}\u3002\u73B0\u5728\u8FD9\u9996\u6B4C\u7684\u4E00\u4EFD\u62F7\u8D1D\uFF1B\u8FD9\u91CC\u518D\u6539\uFF0C\u5B83\u4E0D\u4F1A\u8DDF\u7740\u53D8\u3002{credits}": { en: "{name} \xB7 {size}. A copy of the song as it is now; later edits here won't change it. {credits}" },
  "\u6253\u5305\u4E86 {n} \u4EF6\u58F0\u97F3": { en: "Packed {n} {n|sound|sounds}" },
  "\u6253\u5305\u4E86 {n} \u4EF6\u58F0\u97F3\u8FDB\u6B4C\uFF1A\u73B0\u5728\u6B4C\u91CC\u5E26\u7740 {size}{embedSoftLimit}\uFF0C\u53D1\u7ED9\u522B\u4EBA\u4E5F\u80FD\u54CD": { en: "Packed {n} {n|sound|sounds} into the song: it now carries {size}{embedSoftLimit}, and works when sent to others" },
  "\uFF08\u8D85\u8FC7 {embedSoftLimit}\uFF1A\u5B58 / \u540C\u6B65\u4F1A\u6162\u4E00\u70B9\uFF09": { en: " (over {embedSoftLimit}: saving / syncing gets a bit slower)" },
  "\u8FD9\u51E0\u4EF6\u627E\u4E0D\u5230\u58F0\u97F3\uFF0C\u6CA1\u6253\u5305\uFF1A{p}\u3002\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\uFF0C\u5728\u300C\u8C01\u6765\u6F14\u300D\u91CC\u300C\u627E\u6587\u4EF6\u2026\u300D\u3002": { en: "No sound found for these, so they weren't packed: {p}. Tap the part name at the front of the score, \u201CFind file\u2026\u201D under \u201CWho performs\u201D." },
  "\u6CA1\u6709\u8981\u6253\u5305\u7684\uFF08\u5C0F\u6708\u76F8 / \u5143\u97F3\u7248\u4E0D\u6253\u5305\uFF1A\u5B83\u4EEC\u662F\u6A21\u578B\u5305\uFF0C\u6B4C\u91CC\u53EA\u9489\u54C8\u5E0C\uFF09": { en: "Nothing to pack (Tsukuyomi-chan / vowel versions aren't packed: they're model packs, the song only pins a hash)" },
  "\u6B4C\u91CC\u6CA1\u6709\u6253\u5305\u7740\u7684\u58F0\u97F3": { en: "The song has no packed sounds" },
  "\u89E3\u5305\u4E86 {size} \u4EF6\u58F0\u97F3": { en: "Unpacked {size} {size|sound|sounds}" },
  "\u89E3\u5305\u4E86 {size} \u4EF6\uFF1A\u6B4C\u91CC\u53EA\u8BB0\u6765\u6E90\uFF08\u5C0F\u4E86 {n}\uFF09\uFF1B\u8FD9\u53F0\u8BBE\u5907\u4E0A\u7559\u7740\uFF0C\u7167\u6837\u80FD\u54CD\u3002\u522B\u7684\u8BBE\u5907\u4E0A\u4ECE\u5BB6\u65CF\u97F3\u6E90\u5E93\u6216\u539F\u6587\u4EF6\u627E": { en: "Unpacked {size}: the song only records sources now ({n} smaller); kept on this device, so it still sounds. Other devices find it from the family sound library or the original file" },
  "\u8FD9\u51E0\u4EF6\u6CA1\u89E3\u5305\uFF1A{p}\u2014\u2014\u8FD9\u53F0\u8BBE\u5907\u7559\u4E0D\u4F4F\u5B83\u7684\u58F0\u97F3\uFF08\u7A7A\u95F4\u4E0D\u591F\uFF0C\u6216\u6D4F\u89C8\u5668\u4E0D\u8BA9\u5B58\uFF09\uFF0C\u5BB6\u65CF\u97F3\u6E90\u5E93\u91CC\u4E5F\u6CA1\u6709\uFF0C\u89E3\u4E86\u5C31\u627E\u4E0D\u56DE\u6765\u3002": { en: "These weren't unpacked: {p} \u2014 this device can't keep the sound (out of space, or the browser doesn't allow it) and it's not in the family sound library, so it couldn't be recovered." },
  "\u590D\u5236\u4E0B\u6765\u8D34\u8FDB\u4F5C\u54C1\u8BF4\u660E": { en: "Copy this and paste it into your work's description" },
  "\u590D\u5236\u7F72\u540D": { en: "Copy credits" },
  "\u7F72\u540D\u590D\u5236\u597D\u4E86": { en: "Credits copied" },
  "\u590D\u5236\u4E0D\u4E86\uFF08\u6D4F\u89C8\u5668\u4E0D\u8BA9\uFF09\uFF1A\u957F\u6309\u4E0A\u9762\u7684\u5B57\u81EA\u5DF1\u9009": { en: "Can't copy (the browser won't allow it): long-press the text above to select it" },
  "\u6E32\u4E00\u904D\uFF0C\u7F16\u6210 mp3\uFF0C\u5206\u4EAB\u6216\u4E0B\u8F7D\uFF1B\u6E32\u597D\u7684\u90A3\u4EFD\u8BB0\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u5E93\u91CC\u8FD9\u9996\u6B4C\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C": { en: "Render once into an mp3 to share or download. The render is remembered on this device, so you can play it straight from this song\u2019s cover in the library" },
  "\u6B4C\u58F0\uFF08mp3\uFF09\u2026": { en: "MP3\u2026" },
  "\u5370\u51FA\u6765\u7684\u8C31\uFF08\u6309\u8FD9\u9996\u6B4C\u7684\u7EB8\u5F20\u5206\u9875\uFF1B\u6B4C\u8BCD\u7528\u5D4C\u8FDB\u53BB\u7684\u5B57\u4F53\uFF0C\u80FD\u9009\u4E2D\u590D\u5236\uFF09": { en: "A printed score (paged by this song's paper; lyrics use an embedded font and can be selected and copied)" },
  "\u4E50\u8C31\uFF08PDF\uFF09\u2026": { en: "Score (PDF)\u2026" },
  "\u73B0\u5728\u8FD9\u9996\u6B4C\u7684\u4E00\u4EFD\u62F7\u8D1D\uFF08\u6587\u4EF6\u540D\u5E26\u65F6\u523B\uFF09\uFF1B\u8FD9\u91CC\u7684\u6B4C\u8FD8\u4F4F\u539F\u6765\u7684\u5BB6": { en: "A copy of the song as it is now (timestamped file name); the song here stays in its home" },
  "\u5B58\u4E00\u4EFD .mxl \u526F\u672C\u2026": { en: "Save an .mxl copy\u2026" },
  "\u526F\u672C\u91CC\u628A\u4E50\u5668\u7684\u58F0\u97F3\u4E5F\u88C5\u8FDB\u53BB\uFF08\u53D1\u7ED9\u522B\u4EBA\u4E5F\u80FD\u54CD\uFF09\uFF1B\u8FD9\u91CC\u7684\u6B4C\u7167\u65E7\u53EA\u8BB0\u6765\u6E90": { en: "The copy also carries the instruments' sounds (works when sent to others); the song here still only records sources" },
  "\u5B58\u4E00\u4EFD .mxl \u526F\u672C\uFF08\u6253\u5305\u97F3\u6E90\uFF09\u2026": { en: "Save an .mxl copy (packed sounds)\u2026" },
  "\u5BFC\u51FA = \u5BC4\u4E00\u4EFD\u51FA\u53BB\uFF0C\u8FD9\u91CC\u7684\u6B4C\u8FD8\u662F\u539F\u6765\u90A3\u4E2A\u5BB6\uFF0C\u300C\u5B58\u300D\u624D\u662F\u5B58\u56DE\u53BB\u3002": { en: "Export = send out a copy; the song here keeps its home, and \u201CSave\u201D is what saves back." },
  "\u4E50\u8C31\uFF08PDF\uFF09": { en: "Score (PDF)" },
  "\u5370\u54EA\u4E9B": { en: "What to print" },
  "\u6BCF\u5F20\u7EB8\u6309\u987A\u5E8F\u63A5\u7740\u6392\uFF08= \u5206\u9875 + \u300C\u5168\u90E8\u300D\uFF09": { en: "Each sheet in order (= paged + \u201CAll\u201D)" },
  "\u8FD9\u4E00\u6BB5\u300C{p}\u300D": { en: "This section \u201C{p}\u201D" },
  "\u8FD9\u5F20\u7EB8": { en: "This sheet" },
  "\u53EA\u5370\u5149\u6807\u6240\u5728\u7684\u8FD9\u5F20\u7EB8\uFF08= \u5206\u9875 + \u300C\u672C\u6BB5\u300D\uFF09": { en: "Print only the sheet with the cursor (= paged + \u201CThis section\u201D)" },
  "\u58F0\u90E8": { en: "Parts" },
  "\u7167\u5206\u9875\u9884\u89C8": { en: "As in the paged preview" },
  "\u9690\u85CF\u7684\u58F0\u90E8\u4E0D\u5370\uFF0C\u9884\u89C8\u91CC\u90A3\u6761\u7EC6\u884C\u7684\u4F4D\u7F6E\u7A7A\u7740\uFF08\u548C\u9884\u89C8\u4E00\u6837\uFF09": { en: "Hidden parts aren't printed; their thin line's spot stays blank (same as the preview)" },
  "\u53EA\u6392\u770B\u5F97\u89C1\u7684\uFF1A{p}": { en: "Only visible parts: {p}" },
  "\u9690\u85CF\u7684\u58F0\u90E8\u6574\u4E2A\u62FF\u6389\u3001\u91CD\u65B0\u6392\uFF0C\u4E0D\u7559\u7A7A\u4F4D\uFF08\u50CF\u62BD\u51FA\u6765\u7684\u5206\u8C31\uFF1B\u548C\u5206\u9875\u9884\u89C8\u4E0D\u4E00\u6837\uFF09": { en: "Hidden parts are removed and it's re-laid out with no gaps (like an extracted part; differs from the paged preview)" },
  "\u6B4C\u8BCD\u7684\u5B57\u4F53": { en: "Lyrics font" },
  "\u9ED1\u4F53": { en: "Sans" },
  "\u601D\u6E90\u9ED1\u4F53\uFF1A\u4E2D\u6587 / \u65E5\u6587 / \u82F1\u6587\u90FD\u6709": { en: "Source Han Sans: has Chinese / Japanese / English" },
  "\u62FC\u97F3": { en: "Pinyin" },
  "\u840C\u795E\u624B\u5199\u4F53\uFF1A\u6C49\u5B57\u5934\u4E0A\u6807\u666E\u901A\u8BDD\u62FC\u97F3\uFF08\u53EF\u7231\uFF09\uFF1B\u65E5\u6587\u6B4C\u7684\u6C49\u5B57\u4E5F\u4F1A\u88AB\u6807\u4E0A\u666E\u901A\u8BDD\u62FC\u97F3": { en: "Moe handwriting: Mandarin pinyin above Chinese characters (cute); kanji in Japanese songs also get Mandarin pinyin" },
  "{p}\u7B2C\u4E00\u6B21\u8981\u4E0B\u8F7D\u5B57\u4F53\uFF08\u7EA6 {p2} MB\uFF09\uFF0C\u4E4B\u540E\u79BB\u7EBF\u4E5F\u80FD\u7528\u3002\u7EB8\u5F20 = \u8FD9\u9996\u6B4C\u7684\u7EB8\uFF08\u7EB8\u7684\u6273\u624B\u91CC\u6539\uFF09\u3002": { en: "{p}The font downloads the first time (about {p2} MB), then works offline. Paper = this song's paper (change it with the sheet's wrench)." },
  "\u840C\u795E\u624B\u5199\u4F53\uFF1A\u6C49\u5B57\u5934\u4E0A\u6807\u666E\u901A\u8BDD\u62FC\u97F3\uFF0C\u6B4C\u8BCD\u90A3\u4E00\u884C\u4F1A\u5F80\u4E0B\u8BA9\u51FA\u62FC\u97F3\u7684\u5730\u65B9\u3002\u65E5\u6587\u6B4C\u7684\u6C49\u5B57\u4E5F\u4F1A\u88AB\u6807\u4E0A\u666E\u901A\u8BDD\u62FC\u97F3\u3002": { en: "Moe handwriting: Mandarin pinyin above Chinese characters; the lyric line moves down to make room. Kanji in Japanese songs also get Mandarin pinyin." },
  "\u601D\u6E90\u9ED1\u4F53\uFF1A\u4E2D\u6587\u3001\u65E5\u6587\u3001\u82F1\u6587\u90FD\u6709\u3002": { en: "Source Han Sans: has Chinese, Japanese and English." },
  "\u53EA\u6392\u770B\u5F97\u89C1\u7684\u58F0\u90E8\uFF08{p}\uFF09\uFF1A\u91CD\u65B0\u6392\u3001\u4E0D\u7559\u7A7A\u4F4D\u2014\u2014\u548C\u5206\u9875\u9884\u89C8\u4E0D\u4E00\u6837\u3002": { en: "Only visible parts ({p}): re-laid out with no gaps \u2014 differs from the paged preview." },
  "\u5370\u51FA\u6765\u7684 = \u6273\u624B\u91CC\u300C\u5206\u9875\u300D+ \u66F2\u6BB5\u63A7\u4EF6\u300C{p}\u300D\u770B\u5230\u7684\u6837\u5B50\uFF0C\u53BB\u6389\u6309\u94AE\u548C\u63D0\u793A\uFF1B\u9690\u85CF\u7684{p2}\u58F0\u90E8\u4E0D\u5370\uFF08\u9884\u89C8\u91CC\u90A3\u6761\u7EC6\u884C\u7684\u4F4D\u7F6E\u7A7A\u7740\uFF09\u3002": { en: "Printed = what you see with \u201CPaged\u201D on the wrench + \u201C{p}\u201D on the section control, minus buttons and hints; hidden {p2}parts aren't printed (their thin line's spot stays blank)." },
  "\u672C\u6BB5": { en: "This section" },
  "\u5168\u90E8": { en: "All" },
  "\u7EB8 / ": { en: "sheets /" },
  "\u7167\u8FD9\u9996\u6B4C\u7684\u770B\u8C31\u65B9\u5F0F\u5370\uFF1A{w}\uFF08\u7EB8\u7684\u6273\u624B \u2192\u300C\u770B\u8C31\u300D\u91CC\u6539\uFF09\u3002": { en: "Printed the way this song is read: {w} (change it under the paper wrench \u203A Reading)." },
  "\u6309 C \u8C03\u770B\uFF08\u6BCF\u4E2A\u8C03\u53F7\u4E0A\u65B9\u5370\u300C1=\u539F\u6765\u7684\u8C03\u300D\uFF09": { en: "read in C (\u201C1=original key\u201D above each key signature)" },
  "\u548C\u5F26\u7EA7\u6570": { en: "chord degrees" },
  "\u751F\u6210 PDF": { en: "Create PDF" },
  "\u4E0B\u8F7D\u5B57\u4F53\uFF08\u7B2C\u4E00\u6B21\u7EA6 {p} MB\uFF09\u2026": { en: "Downloading font (about {p} MB the first time)\u2026" },
  "\u6392\u7248\u2026": { en: "Laying out\u2026" },
  "\u8FD9\u4E9B\u5B57\u8FD9\u6B3E\u5B57\u4F53\u91CC\u6CA1\u6709\uFF0CPDF \u91CC\u662F\u7A7A\u767D\uFF1A{p}{p2}": { en: "This font doesn't have these characters, so they're blank in the PDF: {p}{p2}" },
  "\u6709 {n} \u79CD\u8BB0\u8C31\u7B26\u53F7\u6CA1\u753B\u51FA\u6765\uFF08{p}\uFF09\u2014\u2014\u8FD9\u662F app \u7684\u6BDB\u75C5\uFF0C\u8BF7\u544A\u8BC9\u6211\u4EEC\u3002": { en: "{n} notation symbols weren't drawn ({p}) \u2014 that's a bug in the app, please tell us." },
  "\u4E50\u8C31 PDF \u597D\u4E86": { en: "Score PDF is ready" },
  "{pages} \u9875 \xB7 {p} \xB7 {e6}{miss}{missM}": { en: "{pages} {pages|page|pages} \xB7 {p} \xB7 {e6}{miss}{missM}" },
  "\u62FC\u97F3\u5B57\u4F53": { en: "Pinyin font" },
  "PDF \u751F\u6210\u5931\u8D25\uFF1A{Error}": { en: "PDF creation failed: {Error}" },
  "\u4E50\u5668\u7684\u58F0\u97F3": { en: "Instrument sounds" },
  "{n} \u4EF6\uFF1A\u6253\u5305\u5728\u6B4C\u91CC {n2} \u4EF6{length}\uFF0C\u53EA\u8BB0\u6765\u6E90 {n3} \u4EF6\u3002\u6253\u5305 = \u58F0\u97F3\u8DDF\u7740\u6B4C\u8D70\uFF08\u53D1\u7ED9\u522B\u4EBA\u4E5F\u80FD\u54CD\uFF0C\u6587\u4EF6\u53D8\u5927\uFF09\uFF1B\u53EA\u8BB0\u6765\u6E90 = \u6B4C\u5C0F\uFF0C\u58F0\u97F3\u4ECE\u8FD9\u53F0\u8BBE\u5907 / \u5BB6\u65CF\u97F3\u6E90\u5E93 / \u4F60\u7684\u6587\u4EF6\u91CC\u627E\u3002\u5C0F\u6708\u76F8\u4E0D\u6253\u5305\uFF08\u5979\u662F\u6A21\u578B\u5305\uFF0C\u6B4C\u91CC\u53EA\u9489\u54C8\u5E0C\uFF09\u3002": { en: "{n} items: {n2} packed in the song{length}, {n3} source-only. Packed = the sound travels with the song (works when sent to others, bigger file); source-only = small song, the sound is found on this device / in the family sound library / in your files. Tsukuyomi-chan isn't packed (she's a model pack, the song only pins a hash)." },
  "\u5168\u90E8\u6253\u5305\u8FDB\u6B4C": { en: "Pack everything into the song" },
  "\u5168\u90E8\u89E3\u5305\uFF08\u53EA\u8BB0\u6765\u6E90\uFF09": { en: "Unpack everything (source only)" },
  "\u6253\u5305\u5206\u53D1\u7684\u8BB8\u53EF\uFF08\u6587\u4EF6\u91CC\u5E26\u7740\u8FD9\u4E9B\u6E90\u6587\u4EF6\uFF09": { en: "Licenses for packed distribution (the file carries these source files)" },
  "\u5728\u6B4C\u5E93\u91CC\uFF08\u6587\u4EF6\u5939\u300C{label}\u300D\uFF09\uFF0C\u81EA\u52A8\u5B58\uFF1B\u6362\u6B4C / \u9000\u51FA / \u6309\u300C\u5B58\u300D\u65F6\u5199\u8FDB\u6587\u4EF6\u5939": { en: "In the library (folder \u201C{label}\u201D), autosaved; written to the folder when switching songs / leaving / pressing Save" },
  "\u5728\u6B4C\u5E93\u91CC\uFF0C\u81EA\u52A8\u5B58{p}": { en: "In the library, autosaved{p}" },
  "\uFF1B\u6362\u6B4C / \u9000\u51FA / \u6309\u300C\u5B58\u300D\u65F6\u63A8\u4E0A OneDrive": { en: "; uploaded to OneDrive when switching songs / leaving / pressing Save" },
  "\uFF08\u6CA1\u767B\u5F55\uFF0C\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF09": { en: " (not signed in, only on this device)" },
  "\uFF08\u53EA\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\uFF1B\u7F51\u76D8\u5728\u5B98\u7F51\u7248\uFF09": { en: " (only in this browser; OneDrive is on the official site)" },
  "\u5B58\u5728\u672C\u673A\u6587\u4EF6 {name}\uFF0C\u300C\u5B58\u300D= \u5B58\u56DE\u53BB": { en: "Stored in local file {name}; \u201CSave\u201D saves back to it" },
  "\u65B0\u7684\u4E00\u9996\uFF1A\u7B2C\u4E00\u7B14\u5199\u4E0B\u53BB\u5C31\u8FDB\u6B4C\u5E93": { en: "New song: joins the library with the first thing you write" },
  "\u8FD8\u6CA1\u5B58\u8FC7\uFF1A\u300C\u5B58\u300D\u4F1A\u95EE\u5B58\u5230\u54EA": { en: "Not saved yet: \u201CSave\u201D will ask where" },
  "\u8FD9\u53F0\u8BBE\u5907\u4E0A\u300C\u5B58\u300D= \u4E0B\u8F7D\u6216\u5206\u4EAB\u4E00\u4E2A .mxl": { en: "On this device \u201CSave\u201D = download or share an .mxl" },
  "\u672C\u673A\u6587\u4EF6\u7684\u540D\u5B57\u5728\u6587\u4EF6\u7BA1\u7406\u5668\u91CC\u6539\uFF08\u73B0\u5728\u662F {name}\uFF09": { en: "Rename local files in your file manager (currently {name})" },
  "\u6253\u5F00\u672C\u673A\u6587\u4EF6\u2026": { en: "Open local file\u2026" },
  "\u6253\u5F00 .mxl / .musicxml\uFF08\u62D6\u8FDB\u6765\u4E5F\u884C\uFF1BCtrl / \u2318+O\uFF09": { en: "Open .mxl / .musicxml (or drag it in; Ctrl / \u2318+O)" },
  "\u5BFC\u51FA\u2026": { en: "Export\u2026" },
  "mp3\u3001.mxl \u526F\u672C\uFF08\u6253\u5305\u97F3\u6E90\uFF09\u2026\uFF08Ctrl / \u2318+Shift+S\uFF09": { en: "mp3, .mxl copy (packed sounds)\u2026 (Ctrl / \u2318+Shift+S)" },
  "\u6E32\u67D3\u5230\u7F13\u5B58": { en: "Render to cache" },
  "\u6E32\u4E00\u904D\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\uFF08\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF09\uFF1A\u6B4C\u5E93\u91CC\u8FD9\u9996\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C\uFF1B\u4E0D\u5BFC\u51FA\u6587\u4EF6": { en: "Renders this song into the render cache (this device only) so you can play it from its cover in the library; no file is exported" },
  "\u5B58\u8FDB\u6B4C\u5E93": { en: "Save to library" },
  "\u628A\u8FD9\u9996\u6B4C\u653E\u8FDB\u6B4C\u5E93\uFF08\u8FD9\u53F0\u8BBE\u5907\u4E0A\u7559\u4E00\u4EFD\uFF1B\u767B\u5F55\u540E\u540C\u6B65\u5230 OneDrive\uFF09": { en: "Put this song in the library (a copy stays on this device; syncs to OneDrive after signing in)" },
  "\u628A\u8FD9\u9996\u6B4C\u653E\u8FDB\u6B4C\u5E93\uFF08\u53EA\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\u7559\u4E00\u4EFD\uFF1B\u7F51\u76D8\u5728\u5B98\u7F51\u7248\uFF09": { en: "Put this song in the library (a copy stays only in this browser; OneDrive is on the official site)" },
  "\u6539\u6587\u4EF6\u540D\u2026": { en: "Rename file\u2026" },
  "\u53EA\u6539\u6587\u4EF6\u540D\uFF0C\u7EB8\u4E0A\u7684\u6B4C\u540D\u4E0D\u53D8\uFF08\u70B9\u9876\u680F\u7684\u6587\u4EF6\u540D\u4E5F\u4E00\u6837\uFF09": { en: "Only the file name changes, not the title on the sheet (same as tapping the file name at the top)" },
  "\u5C01\u9762\u56FE\u2026": { en: "Cover image\u2026" },
  "\u6B4C\u5E93\u5361\u7247\u4E0A\u7684\u56FE": { en: "The picture on the library card" },
  "\u58F0\u97F3\u4E0E\u7F72\u540D\u2026": { en: "Sounds and credits\u2026" },
  "\u4E50\u5668\u7684\u58F0\u97F3\u6253\u5305 / \u89E3\u5305\uFF1B\u8FD9\u9996\u6B4C\u7528\u4E86\u8C01\u7684\u58F0\u97F3": { en: "Pack / unpack instrument sounds; whose sounds this song uses" },
  "\u9501\u4E0A\uFF08\u5148\u4E0D\u6539\u4E86\uFF09": { en: "Lock (done editing for now)" },
  "\u5148\u628A\u6539\u52A8\u5B58\u597D\uFF0C\u518D\u628A\u8FD9\u9996\u6B4C\u9501\u4E0A\uFF1A\u4E4B\u540E\u6253\u5F00\u662F\u53EA\u80FD\u770B\u3001\u80FD\u542C\u7684\uFF0C\u70B9\u300C\u63A5\u7740\u6539\u300D\u968F\u65F6\u89E3\u5F00": { en: "Saves your changes, then locks this song: it opens view-and-listen only until you tap \u201CKeep editing\u201D" },
  "\u6536\u8D77\u53C2\u8003\u7A97": { en: "Hide reference window" },
  "\u53C2\u8003\u7A97{p}": { en: "Reference window{p}" },
  "\uFF08{p} \u5F20\uFF09": { en: " ({p} {p|item|items})" },
  "\u622A\u56FE / \u6587\u5B57\u653E\u5728\u65C1\u8FB9\u5BF9\u7740\u770B\uFF1A\u70B9\u5F00\u540E\u7C98\u8D34\uFF08Ctrl / \u2318+V\uFF09\u3001\u62D6\u8FDB\u6765\uFF0C\u6216\u8005\u300C\uFF0B\u300D\u5BFC\u5165\uFF1B\u8DDF\u7740\u6B4C\u4E00\u8D77\u5B58": { en: "Keep screenshots / text beside you to refer to: open it, then paste (Ctrl / \u2318+V), drag in, or import with \u201C\uFF0B\u201D; saved with the song" },
  "\u8BBE\u7F6E\u2026": { en: "Settings\u2026" },
  "\u6A21\u578B / \u97F3\u6E90\u5E93\u6765\u6E90\u3001\u7F13\u5B58\u3001\u7F72\u540D\u4E0E\u6761\u6B3E\u3001\u8BCA\u65AD\u65E5\u5FD7\u3001\u7248\u672C": { en: "Model / sound library sources, cache, credits and terms, diagnostic log, version" },
  "\u6CA1\u9501\u4E0A\uFF1A\u6539\u52A8\u8FD8\u6CA1\u5B58\u597D\uFF08\u518D\u8BD5\u4E00\u6B21\uFF09\u3002": { en: "Not locked: the changes are not saved yet (try again)." },
  "\u6CA1\u9501\u4E0A\uFF1A\u6539\u52A8\u6CA1\u6709\u5199\u56DE\u6587\u4EF6\u3002": { en: "Not locked: the changes were not written back to the file." },
  "\u9501\u4E0A\u4E86\u3002\u8981\u6539\uFF0C\u70B9\u8C31\u4E0A\u9762\u7684\u300C\u63A5\u7740\u6539\u300D\u3002": { en: "Locked. To edit, tap \u201CKeep editing\u201D above the score." },
  "\u6CA1\u9501\u4E0A\uFF1A{Error}": { en: "Not locked: {Error}" },
  "\u5C01\u9762\u56FE": { en: "Cover image" },
  "\u6CA1\u6709\u5C01\u9762\u56FE": { en: "No cover image" },
  "\u9009\u4E00\u5F20\u56FE\u5F53\u5C01\u9762\uFF08\u7F29\u6210 256\xB2 \u5B58\u8FDB\u6B4C\u91CC\uFF1B\u6B4C\u5E93\u5361\u7247\u4E0A\u6B4C\u540D\u5370\u5728\u56FE\u4E0A\u9762\uFF09": { en: "Choose an image as the cover (shrunk to 256\xB2 and stored in the song; the library card prints the title over it)" },
  "\u6362\u4E00\u5F20\u2026": { en: "Replace\u2026" },
  "\u9009\u4E00\u5F20\u56FE\u2026": { en: "Choose an image\u2026" },
  "\u53BB\u6389\u5C01\u9762\u56FE": { en: "Remove cover image" },
  "\u6B4C\u5E93\u5361\u7247\u4E0A\u7684\u56FE\uFF1B\u6B4C\u540D\u548C\u65E5\u671F\u7167\u6837\u5370\u5728\u4E0A\u9762\u3002\u7F29\u6210 256\xB2 \u5B58\u8FDB\u6B4C\u91CC\u3002": { en: "The picture on the library card; title and date still print over it. Shrunk to 256\xB2 and stored in the song." },
  "\u53BB\u6389\u4E86\u5C01\u9762\u56FE": { en: "Cover image removed" },
  "\u58F0\u97F3\u4E0E\u7F72\u540D": { en: "Sounds and credits" },
  "\u8FD9\u9996\u6B4C\u6CA1\u7528\u4E50\u5668\u7684\u58F0\u97F3\u6587\u4EF6\uFF08\u5C0F\u6708\u76F8 / \u5143\u97F3\u7248\u7684\u58F0\u97F3\u968F app \u8D70\uFF0C\u4E0D\u8FDB\u6B4C\uFF09\u3002": { en: "This song uses no instrument sound files (Tsukuyomi-chan / vowel versions come with the app, not the song)." },
  "\u6539\u6587\u4EF6\u540D": { en: "Rename file" },
  "\u6587\u4EF6\u540D": { en: "File name" },
  "\u53EA\u6539\u6587\u4EF6\u540D\uFF0C\u7EB8\u4E0A\u7684\u6B4C\u540D\u4E0D\u53D8\u3002\u4E0B\u6B21\u5B58\u7684\u65F6\u5019\u7528\u8FD9\u4E2A\u540D\u5B57\u3002": { en: "Only the file name changes, not the title on the sheet. The next save uses this name." },
  "\u6539": { en: "Rename" },
  "\u6587\u4EF6\u540D\u6539\u6210 {stem}{SONG_SUFFIX}": { en: "File renamed to {stem}{SONG_SUFFIX}" },
  "\u6253\u5F00\u300C{name}\u300D": { en: "Opened \u201C{name}\u201D" },
  "\u6253\u5F00\u300C{id}\u300D": { en: "Opening \u201C{id}\u201D" },
  "\u6253\u4E0D\u5F00\u300C{id}\u300D\uFF1A\u8FD9\u53F0\u8BBE\u5907\u4E0A\u6CA1\u6709\u5B83\u7684\u5B57\u8282\uFF08\u79BB\u7EBF\u3001\u6216\u8FD8\u6CA1\u4ECE\u4E91\u7AEF\u62C9\u4E0B\u6765\uFF09": { en: "Can't open \u201C{id}\u201D: its bytes aren't on this device (offline, or not pulled from the cloud yet)" },
  "\u65B0\u7684\u4E00\u9996\uFF08\u7B2C\u4E00\u7B14\u5199\u4E0B\u53BB\u5C31\u8FDB\u6B4C\u5E93\uFF09": { en: "New song (joins the library with the first thing you write)" },
  "\u8FD8\u662F\u7A7A\u7684\uFF1A\u5199\u4E0B\u7B2C\u4E00\u7B14\u5C31\u81EA\u52A8\u8FDB\u6B4C\u5E93": { en: "Still empty: joins the library automatically with the first thing you write" },
  "\u8FDB\u6B4C\u5E93\u4E86\uFF1A{stem}{SONG_SUFFIX}": { en: "In the library: {stem}{SONG_SUFFIX}" },
  "\u53EA\u6539\u6587\u4EF6\u540D\uFF0C\u7EB8\u4E0A\u7684\u6B4C\u540D\u4E0D\u53D8\u3002": { en: "Only the file name changes, not the title on the sheet." },
  "\u300C{v}\u300D\u5DF2\u7ECF\u6709\u4E86\uFF08{p}\uFF09\uFF0C\u6CA1\u6539": { en: "\u201C{v}\u201D already exists ({p}), not renamed" },
  "\u4E91\u7AEF": { en: "in the cloud" },
  "\u8FD9\u53F0\u8BBE\u5907\u4E0A": { en: "on this device" },
  "\u8FD9\u6B21\u6CA1\u52A8": { en: "Nothing changed this time" },
  "\u6587\u4EF6\u540D\u6539\u6210 {stem}{SONG_SUFFIX}\uFF1B\u7167\u4F60\u7684\u610F\u601D\uFF0C\u4E91\u7AEF\u65E7\u540D\u90A3\u4EFD\u7559\u7740\u6CA1\u52A8": { en: "File renamed to {stem}{SONG_SUFFIX}; as you chose, the copy under the old name in the cloud stays untouched" },
  "\u6587\u4EF6\u540D\u6539\u6210 {stem}{SONG_SUFFIX}\uFF08\u65E7\u540D\u7684\u90A3\u4EFD\u8C31\u7CFB\u4E0D\u660E\uFF0C\u4E91\u7AEF\u539F\u5730\u7559\u7740\u4E86\u2014\u2014\u6B4C\u5E93\u91CC\u8FD8\u770B\u5F97\u89C1\uFF09": { en: "File renamed to {stem}{SONG_SUFFIX} (the copy under the old name has an unknown history, so it stays in the cloud \u2014 still visible in the library)" },
  "\u8FD9\u4E2A\u90E8\u7F72\u65B9\u5F0F\u6CA1\u6709\u6B4C\u5E93\uFF08itch\uFF1A\u6B4C\u53EA\u7528\u6587\u4EF6\u5B58\uFF09": { en: "This deployment has no library (itch: songs only use files)" },
  "\u8FD9\u4E2A\u90E8\u7F72\u65B9\u5F0F\u6CA1\u6709\u7F51\u76D8\uFF08\u5907\u7528\u7248\uFF1A\u6B4C\u5E93\u7684\u5BB6\u53EA\u80FD\u662F\u6587\u4EF6\u5939\uFF09": { en: "This deployment has no OneDrive (standalone version: the library's home can only be a folder)" },
  "\u300C{stem}\u300D\u5DF2\u7ECF\u8FDB\u4E86\u56DE\u6536\u7AD9\uFF1B\u624B\u91CC\u8FD9\u4EFD\u73B0\u5728\u6CA1\u6709\u5BB6\u4E86\uFF08\u300C\u5B58\u300D\u4F1A\u95EE\u5B58\u5230\u54EA\uFF0C\u6216\u300C\u5B58\u8FDB\u6B4C\u5E93\u300D\uFF09\u3002": { en: "\u201C{stem}\u201D is now in the trash; the copy in hand has no home now (\u201CSave\u201D will ask where, or \u201CSave to library\u201D)." },
  "\u8FDB\u6B4C\u5E93": { en: "Save to library" },
  "\u6B4C\u5E93\u8981\u5148\u6709\u4E2A\u5BB6": { en: "The library needs a home first" },
  "\u6B4C\u653E\u5728\u6D4F\u89C8\u5668\u5916\u9762\u3001\u4F60\u81EA\u5DF1\u591F\u5F97\u7740\u7684\u5730\u65B9\uFF0C\u624D\u4E0D\u6015\u6D4F\u89C8\u5668\u6E05\u7F13\u5B58\u3002{cloud}{folder}\u4E0D\u60F3\u9009\u4E5F\u884C\uFF1A\u300C\u5B58\u300D= \u5B58\u6210\u6587\u4EF6\uFF0C\u300C\u6253\u5F00\u300D= \u9009\u6587\u4EF6\u3002": { en: "Keep songs outside the browser, somewhere you can reach, so clearing browser data can't hurt them. {cloud}{folder}You can skip this too: \u201CSave\u201D = save as a file, \u201COpen\u201D = choose a file." },
  "\u7F51\u76D8\u5728\u5B98\u7F51\u7248\u91CC\uFF08{SITE_HOST}\uFF09\u3002": { en: "OneDrive is on the official site ({SITE_HOST})." },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u9009\u4E0D\u4E86\u6587\u4EF6\u5939\uFF08\u684C\u9762\u7248 Chrome / Edge \u53EF\u4EE5\uFF09\u3002": { en: "This browser can't choose folders (desktop Chrome / Edge can)." },
  "\u8FDE\u63A5\u7F51\u76D8\uFF08OneDrive\uFF09": { en: "Connect OneDrive" },
  "\u9009\u4E00\u4E2A\u6587\u4EF6\u5939": { en: "Choose a folder" },
  "\u6362\u5230\u6587\u4EF6\u5939": { en: "Switch to a folder" },
  "\u6CA1\u62FF\u5230\u300C{label}\u300D\u7684\u6743\u9650\uFF1A\u6539\u52A8\u8FD8\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u4E00\u9996\u6CA1\u4E22\u3002": { en: "Didn't get permission for \u201C{label}\u201D: changes are still on this device, no songs lost." },
  "\u6587\u4EF6\u5939\u300C{label}\u300D\u7684\u6743\u9650\u6389\u4E86\uFF1A\u6539\u52A8\u5148\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u4E00\u9996\u6CA1\u4E22": { en: "Permission for folder \u201C{label}\u201D was lost: changes are saved on this device for now, no songs lost" },
  "\u91CD\u65B0\u6388\u6743": { en: "Re-authorize" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\u8FD8\u6709 {legacyLeft} \u9996\u65E7\u6B4C\uFF0C\u6CA1\u642C\u8FDB\u300C{label}\u300D": { en: "This browser still has {legacyLeft} old {legacyLeft|song|songs} not moved into \u201C{label}\u201D" },
  "\u642C\u8FDB\u6765": { en: "Move them in" },
  "\u5168\u90E8\u5BFC\u51FA": { en: "Export all" },
  "\u8FD9\u4E9B\u6B4C\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u7684\u6D4F\u89C8\u5668\u91CC\uFF0C\u6CA1\u6709\u5907\u4EFD": { en: "These songs exist only in this device's browser, with no backup" },
  "\u642C\u8FDB\u4E00\u4E2A\u6587\u4EF6\u5939": { en: "Move into a folder" },
  "\u8FDE\u63A5\u7F51\u76D8": { en: "Connect OneDrive" },
  "\u6B4C\u5E93\u5728\u6587\u4EF6\u5939\u300C{label}\u300D": { en: "Library is in folder \u201C{label}\u201D" },
  "\u6B4C\u5C31\u662F\u8FD9\u4E2A\u6587\u4EF6\u5939\u91CC\u7684 .mxl\uFF0C\u8D44\u6E90\u7BA1\u7406\u5668\u91CC\u4E5F\u770B\u5F97\u5230\uFF1B\u56DE\u6536\u7AD9 / \u5907\u4EFD\u7BB1\u662F\u91CC\u9762\u7684 .trash / .backup\u3002{lost}": { en: "Songs are the .mxl files in this folder, visible in your file manager too; the trash / backup are .trash / .backup inside it. {lost}" },
  "\n\u73B0\u5728\u6743\u9650\u6389\u4E86\uFF1A\u6539\u52A8\u5148\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u3002": { en: "\nPermission is lost now: changes are saved on this device for now." },
  "\u4E0D\u7528\u8FD9\u4E2A\u6587\u4EF6\u5939\u4E86\u2026": { en: "Stop using this folder\u2026" },
  "\u5939\u91CC\u7684\u6B4C\u4E00\u9996\u4E0D\u52A8\uFF1B\u4E4B\u540E\u53EF\u4EE5\u518D\u9009\u4E00\u4E2A\u5BB6": { en: "Songs in the folder stay untouched; you can choose another home later" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\u6709 {n} \u9996\u6B4C": { en: "This browser has {n} {n|song|songs}" },
  "\u5B83\u4EEC\u53EA\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u91CC\uFF0C\u6E05\u7F13\u5B58\u5C31\u6CA1\u4E86\u3002{f}\u7A0D\u540E\u4E5F\u884C\uFF1A\u6B4C\u5E93\u9876\u4E0A\u90A3\u6761\u8FD8\u5728\u3002": { en: "They exist only in this browser and vanish if it's cleared. {f}Later is fine too: the bar at the top of the library stays." },
  "\u642C\u8FDB\u300C{label}\u300D\uFF1A\u9010\u9996\u6838\u5BF9\u5B57\u8282\uFF0C\u4E00\u6A21\u4E00\u6837\u624D\u4ECE\u6D4F\u89C8\u5668\u79FB\u8D70\u3002": { en: "Move into \u201C{label}\u201D: bytes are checked song by song, and removed from the browser only if identical." },
  "\u9009\u4E00\u4E2A\u5BB6\u642C\u8FC7\u53BB\uFF1B\u6216\u8005\u5148\u5168\u90E8\u5BFC\u51FA\u6210\u6587\u4EF6\u3002": { en: "Choose a home to move them to, or export everything as files first." },
  "\u642C\u8FDB\u300C{label}\u300D": { en: "Move into \u201C{label}\u201D" },
  "\u9009\u4E00\u4E2A\u6587\u4EF6\u5939\uFF0C\u642C\u8FDB\u53BB": { en: "Choose a folder and move in" },
  "\u7A0D\u540E": { en: "Later" },
  "\u6B63\u5728\u628A\u6B4C\u642C\u8FDB\u300C{label}\u300D\u2026": { en: "Moving songs into \u201C{label}\u201D\u2026" },
  "\u6CA1\u5199\u8FDB\u6587\u4EF6\u5939": { en: "Not written to the folder" },
  "\u65E7\u5E93\u6CA1\u79FB\u8D70\uFF08{status}\uFF09": { en: "Old library copy not removed ({status})" },
  "\u6B63\u5728\u642C\u6B4C {done} / {total}\u2026": { en: "Moving songs {done} / {total}\u2026" },
  "\u642C\u5BB6\u6CA1\u6210\uFF1A{Error}\u3002\u6D4F\u89C8\u5668\u91CC\u7684\u6B4C\u4E00\u9996\u6CA1\u52A8\u3002": { en: "Move failed: {Error}. No songs in the browser were touched." },
  "\u4E91\u7AEF\uFF08OneDrive\uFF09": { en: "Cloud (OneDrive)" },
  "\u5DF2\u767B\u5F55{who}\u3002\u6B4C\u5E93\u540C\u6B65\u5230 OneDrive \u7684\u300C\u5E94\u7528\u300D\u6587\u4EF6\u5939\uFF08\u8FD9\u4E2A app \u53EA\u80FD\u770B\u81EA\u5DF1\u7684\u90A3\u4E2A\u5939\uFF0C\u770B\u4E0D\u5230\u4F60\u522B\u7684\u6587\u4EF6\uFF09\u3002": { en: "Signed in{who}. The library syncs to OneDrive's Apps folder (this app can only see its own folder, none of your other files)." },
  "\u767B\u5F55\u5FAE\u8F6F\u4E2A\u4EBA\u8D26\u53F7\u540E\uFF0C\u6B4C\u5E93\u540C\u6B65\u5230 OneDrive \u7684\u300C\u5E94\u7528\u300D\u6587\u4EF6\u5939\uFF08\u8FD9\u4E2A app \u53EA\u80FD\u770B\u81EA\u5DF1\u7684\u90A3\u4E2A\u5939\uFF0C\u770B\u4E0D\u5230\u4F60\u522B\u7684\u6587\u4EF6\uFF09\u3002\u4E0D\u767B\u5F55\u4E5F\u80FD\u7528\uFF0C\u6B4C\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u3002": { en: "After signing in with a personal Microsoft account, the library syncs to OneDrive's Apps folder (this app can only see its own folder, none of your other files). It works without signing in, with songs only on this device." },
  "\u5237\u65B0\u4E91\u7AEF": { en: "Refresh cloud" },
  "\u9000\u51FA\u767B\u5F55": { en: "Sign out" },
  "\u6B4C\u8FD8\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A": { en: "Songs stay on this device" },
  "\u767B\u5F55\u5FAE\u8F6F\u8D26\u53F7": { en: "Sign in with Microsoft" },
  "MoonSinger-\u6B4C\u5E93-{p}{p2}{p3}-{p4}{p5}.zip": { en: "MoonSinger-library-{p}{p2}{p3}-{p4}{p5}.zip" },
  "\u6B63\u5728\u6253\u5305\u6B4C\u5E93\u2026": { en: "Packing the library\u2026" },
  "\u6B4C\u5E93\u6253\u5305\u597D\u4E86": { en: "Library packed" },
  "\u5BFC\u51FA\u6CA1\u6210\uFF1A{Error}": { en: "Export failed: {Error}" },
  "\u8FD8\u6709 {n} \u9996\u6CA1\u5199\u8FDB\u6587\u4EF6\u5939": { en: "{n} {n|song|songs} not written to the folder yet" },
  "\u8FD8\u6709 {n} \u9996\u6CA1\u4E0A\u4E91": { en: "{n} {n|song|songs} not in the cloud yet" },
  "\u9000\u51FA\u540E\u8FD9\u4E9B\u6539\u52A8\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u3002\u53EF\u4EE5\u5148\u63A8\u4E0A\u53BB\uFF08\u63A8\u4E0D\u4E0A\u53BB\u7684\u9010\u9996\u4E0B\u8F7D\u5907\u4EFD\uFF09\uFF0C\u6216\u8005\u7167\u6837\u9000\u51FA\u3002": { en: "After signing out these changes exist only on this device. You can upload them first (what can't be uploaded is downloaded song by song as backup), or sign out anyway." },
  "\u5148\u63A8\u4E0A\u53BB / \u4E0B\u8F7D\u5907\u4EFD": { en: "Upload first / download backup" },
  "\u7167\u6837\u9000\u51FA": { en: "Sign out anyway" },
  "\u4E0D\u7528\u300C{label}\u300D\u4E86\uFF1A\u5939\u91CC\u7684\u6B4C\u4E00\u9996\u6CA1\u52A8\uFF0C\u518D\u8FDB\u6B4C\u5E93\u53EF\u4EE5\u9009\u5BB6": { en: "Stopped using \u201C{label}\u201D: no songs in the folder were touched; choose a home next time you open the library" },
  "\u9000\u51FA\u4E86\uFF1A\u6B4C\u90FD\u8FD8\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u518D\u8FDE\u4E0A\u7F51\u76D8\u5C31\u80FD\u63A5\u7740\u7528": { en: "Signed out: all songs are still on this device; reconnect OneDrive to carry on" },
  "\u63A8\u4E0D\u4E0A\u53BB\u7684 {n} \u9996\u5DF2\u4E0B\u8F7D\u5907\u4EFD": { en: "{n} {n|song that couldn't upload was|songs that couldn't upload were} downloaded as backup" },
  "\u90FD\u63A8\u4E0A\u53BB\u4E86": { en: "Everything uploaded" },
  "\u53BB\u5FAE\u8F6F\u767B\u5F55": { en: "Sign in with Microsoft" },
  "\u9875\u9762\u4F1A\u8DF3\u5230\u5FAE\u8F6F\u7684\u767B\u5F55\u9875\uFF08\u53EA\u8BA4\u4E2A\u4EBA\u8D26\u53F7\uFF09\uFF0C\u767B\u5F55\u5B8C\u81EA\u52A8\u56DE\u5230\u8FD9\u91CC\u3002{inGallery}": { en: "The page will go to Microsoft's sign-in (personal accounts only) and come back here afterward. {inGallery}" },
  "\u624B\u91CC\u7684\u6B4C\u5DF2\u7ECF\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\u3002": { en: "The song in hand is already saved on this device." },
  "\u624B\u91CC\u8FD9\u9996\u65E0\u5730\u7684\u6B4C\u6539\u8FC7\u8FD8\u6CA1\u5B58\u2014\u2014\u8DF3\u8D70\u4F1A\u4E22\uFF0C\u5148\u5B58\u4E00\u4E0B\u518D\u6765\u3002": { en: "The homeless song in hand has unsaved changes \u2014 leaving would lose them, so save first." },
  "\u53BB\u767B\u5F55": { en: "Sign in" },
  "\u4E91\u7AEF\u6709\u65B0\u7248\u672C": { en: "Newer version in the cloud" },
  "\u300C{id}\u300D\u5728\u522B\u7684\u8BBE\u5907\u4E0A\u6539\u8FC7\u4E86\uFF0C\u6B63\u5728\u6362\u6210\u6700\u65B0\u7684\u2026\u2026\u5148\u522B\u6253\u5B57\u3002": { en: "\u201C{id}\u201D was changed on another device, switching to the latest\u2026 hold off on typing." },
  "\u6362\u6210\u4E91\u7AEF\u7684\u65B0\u7248\u672C\u4E86": { en: "Switched to the newer cloud version" },
  "\u300C{id}\u300D\u4E91\u7AEF\u7684\u65B0\u7248\u672C\u62C9\u4E0B\u6765\u4E86\uFF0C\u4F46\u91CD\u5F00\u5931\u8D25\u2014\u2014\u8BF7\u4ECE\u6B4C\u5E93\u518D\u6253\u5F00\u4E00\u6B21": { en: "The newer cloud version of \u201C{id}\u201D was pulled, but reopening failed \u2014 please open it again from the library" },
  "{n} \u9996\u6539\u8FC7\u7684\u8FD8\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A{named}": { en: "{n} edited {n|song is|songs are} still only on this device{named}" },
  "\uFF1B\u4F20\u7684\u8BDD\u8FDE\u6B63\u5728\u5199\u7684\u8FD9\u9996\u4E00\u8D77": { en: "; uploading also includes the song you're writing" },
  "\u5199\u8FDB\u300C{label}\u300D": { en: "Write into \u201C{label}\u201D" },
  "\u4F20\u4E0A\u53BB": { en: "Upload" },
  "\u4EE5\u540E\u518D\u8BF4": { en: "Not now" },
  "{r} \u9996\u90FD\u4F20\u4E0A\u53BB\u4E86": { en: "{r} {r|song|songs} uploaded" },
  "\u4F20\u4E0A\u53BB {r} \u9996\uFF0C\u8FD8\u6709 {left} \u9996\u6CA1\u4F20\u6210{named}\uFF1A\u522B\u7684\u8BBE\u5907\u6539\u8FC7\u7684\u8981\u4F60\u9009\uFF0C\u7F51\u7EDC\u95EE\u9898\u7684\u4E4B\u540E\u518D\u8BD5\u3002": { en: "Uploaded {r} {r|song|songs}, {left} not done{named}: changes from other devices need your choice, network problems will retry later." },
  "\u53BB\u5904\u7406": { en: "Handle them" },
  "\u6709 {neverUploaded} \u9996\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\uFF0C\u8FD8\u6709 {others} \u9996\u6539\u8FC7\u6CA1\u4F20\u3002\u73B0\u5728\u5168\u4F20\uFF1F": { en: "{neverUploaded} {neverUploaded|song exists|songs exist} only on this device, and {others} more {others|has|have} changes not uploaded. Upload everything now?" },
  "\u6709 {neverUploaded} \u9996\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\uFF0C\u73B0\u5728{f}\uFF1F": { en: "{neverUploaded} {neverUploaded|song exists|songs exist} only on this device. {f} now?" },
  "\u522B\u7684\u8BBE\u5907\u6539\u8FC7\u7684\u4E0D\u4F1A\u88AB\u76D6\u6389\uFF0C\u4F1A\u7559\u7ED9\u4F60\u9009\u3002\u7A0D\u540E = \u5B83\u4EEC\u8FDB\u6B4C\u5E93\u300C\u8981\u5904\u7406\u300D\u7684\u5217\u8868\uFF0C\u4EC0\u4E48\u90FD\u4E0D\u4F20\u3002": { en: "Changes made on other devices won't be overwritten; you'll get to choose. Later = they go on the library's \u201CNeeds attention\u201D list and nothing is uploaded." },
  "\u73B0\u5728\u4F20": { en: "Upload now" },
  "{n} \u9996\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u5E93\u300C\u8981\u5904\u7406\u300D\u91CC\u770B\u5F97\u89C1": { en: "{n} {n|song stays|songs stay} on this device, in the library's \u201CNeeds attention\u201D list" },
  "\u6362\u5C01\u9762\u56FE": { en: "Change cover image" },
  "\u5C01\u9762\u56FE\u6362\u597D\u4E86\uFF08{n}\uFF09": { en: "Cover image changed ({n})" },
  "\u8FD9\u5F20\u56FE\u7528\u4E0D\u4E86\uFF1A{Error}": { en: "This image can't be used: {Error}" },
  "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86": { en: "Saved on this device" },
  "\u8981\u540C\u6B65\u5230 OneDrive \u5417\uFF1F\u767B\u5F55\u5FAE\u8F6F\u4E2A\u4EBA\u8D26\u53F7\u540E\uFF0C\u6B4C\u5E93\u540C\u6B65\u5230\u4F60 OneDrive \u7684\u300C\u5E94\u7528\u300D\u6587\u4EF6\u5939\uFF08\u8FD9\u4E2A app \u53EA\u80FD\u770B\u81EA\u5DF1\u7684\u90A3\u4E2A\u5939\uFF09\u3002": { en: "Sync to OneDrive? After signing in with a personal Microsoft account, the library syncs to your OneDrive's Apps folder (this app can only see its own folder)." },
  "\u6682\u4E0D": { en: "Not now" },
  "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\uFF0C\u8FD8\u6CA1\u5199\u8FDB\u6587\u4EF6\u5939": { en: "Saved on this device, not written to the folder yet" },
  "\u5B58\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\u4E86\uFF0C\u4E91\u7AEF\u7A0D\u540E\u518D\u63A8": { en: "Saved on this device, uploading to the cloud later" },
  "\u5DF2\u5B58 \u2713": { en: "Saved \u2713" },
  "\u8FD9\u9996\u6B4C\u6CA1\u52A0\u5BC6\u3002MoonSinger \u8FD9\u4E00\u7248\u8FD8\u4E0D\u52A0\u5BC6\uFF08\u8981\u7684\u8BDD\u544A\u8BC9\u5F00\u53D1\u8005\uFF1A\u7167 WXHW \u63A5 zip.js + 7z \u5C31\u80FD\u5F00\uFF09\u3002": { en: "This song isn't encrypted. This version of MoonSinger doesn't encrypt yet." },
  "\u300C{p}\u300D\u91CC\u952E\u76D8\u4E0D\u5199\u97F3\uFF08\u5207\u5230\u300C\u97F3\u300D\u518D\u5199\uFF09": { en: "In \u201C{p}\u201D the keys don't write notes (switch to \u201CNotes\u201D to write)" },
  "\u8FD9\u6761\u58F0\u90E8\u53F0\u4E0A\u662F\u5355\u58F0\u7684\uFF08\u5C0F\u6708\u76F8 / \u5143\u97F3\u7248 / \u6CA1\u4EBA\uFF09\uFF1A\u53E0\u4E0D\u4E86\u3002\u6362\u6210\u80FD\u53E0\u97F3\u7684\u4E50\u5668\u518D\u53E0": { en: "This part's performer is monophonic (Tsukuyomi-chan / vowel version / nobody): it can't stack. Switch to an instrument that can" },
  "MIDI \u952E\u76D8\u63A5\u4E0A\u4E86\uFF1A{name}": { en: "MIDI keyboard connected: {name}" },
  "MIDI \u952E\u76D8\u62D4\u6389\u4E86\uFF1A{name}": { en: "MIDI keyboard unplugged: {name}" },
  "MIDI \u952E\u76D8\uFF1A\u8FD8\u6CA1\u8FDE\uFF08\u70B9\u4E00\u4E0B\u770B\u600E\u4E48\u8FDE\uFF09": { en: "MIDI keyboard: not connected (tap to see how)" },
  "MIDI \u952E\u76D8\uFF1A\u7B49\u6D4F\u89C8\u5668\u7684\u8BB8\u53EF\u2026": { en: "MIDI keyboard: waiting for browser permission\u2026" },
  "MIDI \u952E\u76D8\uFF1A\u6D4F\u89C8\u5668\u6CA1\u7ED9\uFF08\u70B9\u4E00\u4E0B\u770B\u600E\u4E48\u529E\uFF09": { en: "MIDI keyboard: browser denied it (tap to see what to do)" },
  "MIDI \u952E\u76D8\uFF1A\u5F00\u7740\uFF0C\u8FD8\u6CA1\u63D2\u7434\uFF08\u63D2\u4E0A\u5C31\u8BA4\uFF09": { en: "MIDI keyboard: on, nothing plugged in (recognized when plugged in)" },
  "MIDI \u952E\u76D8\uFF1A\u63A5\u7740 {p}\uFF08\u5F39\u4E00\u4E0B\u8FD9\u4E2A\u70B9\u4F1A\u95EA\uFF09": { en: "MIDI keyboard: connected to {p} (this dot flashes when you play)" },
  "\u95EE\u6D4F\u89C8\u5668\u8981 MIDI \u7684\u8BB8\u53EF\uFF08\u6D4F\u89C8\u5668\u4F1A\u5F39\u5B83\u81EA\u5DF1\u7684\u6846\uFF09\uFF1B\u7ED9\u8FC7\u4E00\u6B21\u4EE5\u540E\u5F00 app \u81EA\u5DF1\u63A5\u4E0A": { en: "Asks the browser for MIDI permission (it shows its own prompt); after that, the app connects by itself" },
  "\u6211\u6CA1\u6709 MIDI \u952E\u76D8": { en: "I don't have a MIDI keyboard" },
  "\u9876\u680F\u4E0D\u518D\u9732\u300CMIDI\u300D\uFF1B\u4EE5\u540E\u8981\u8FDE\uFF1A\u83DC\u5355 \u2192 \u8BBE\u7F6E \u2192 MIDI \u952E\u76D8": { en: "\u201CMIDI\u201D no longer shows in the top bar; to connect later: Menu \u2192 Settings \u2192 MIDI keyboard" },
  "\u9876\u680F\u4E0D\u9732\u300CMIDI\u300D\u4E86\uFF1B\u4EE5\u540E\u8981\u8FDE\uFF1A\u83DC\u5355 \u2192 \u8BBE\u7F6E \u2192 MIDI \u952E\u76D8": { en: "\u201CMIDI\u201D is hidden from the top bar; to connect later: Menu \u2192 Settings \u2192 MIDI keyboard" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u8BFB\u4E0D\u4E86 MIDI \u952E\u76D8\uFF08iPad / iPhone \u4E0A\u7684\u6D4F\u89C8\u5668\u90FD\u6CA1\u6709 Web MIDI\uFF09\uFF1B\u7535\u8111\u4E0A\u7684 Chrome / Edge / Firefox \u53EF\u4EE5": { en: "This browser can't read MIDI keyboards (no browser on iPad / iPhone has Web MIDI); Chrome / Edge / Firefox on a computer can" },
  "\u7B49\u6D4F\u89C8\u5668\u7684\u8BB8\u53EF\u2026": { en: "Waiting for browser permission\u2026" },
  "\u6D4F\u89C8\u5668\u6CA1\u7ED9\uFF08{why}\uFF09\u3002\u5728\u5730\u5740\u680F\u5DE6\u8FB9\u7684\u7AD9\u70B9\u8BBE\u7F6E\u91CC\u5141\u8BB8 MIDI\uFF0C\u518D\u70B9\u8FDE\u63A5": { en: "The browser denied it ({why}). Allow MIDI in the site settings left of the address bar, then tap Connect" },
  "\u7434\u7528 USB \u63D2\u4E0A\u7535\u8111\uFF0C\u70B9\u300C\u8FDE\u63A5\u300D\uFF08\u6D4F\u89C8\u5668\u4F1A\u95EE\u4E00\u6B21\uFF0C\u4EE5\u540E\u5F00 app \u81EA\u5DF1\u63A5\u4E0A\uFF09": { en: "Plug the keyboard into the computer via USB and tap \u201CConnect\u201D (the browser asks once, then the app connects by itself)" },
  "\u63A5\u7740\uFF1A{p}\u3002\u5F39\u7684\u97F3\u6309\u5149\u6807\u5904\u7684\u957F\u77ED\u5199\u8FDB\u8C31\uFF1B\u300C\u5F39\u300D\u5F00\u7740 / \u8BCD / \u542C\u91CC\u53EA\u51FA\u58F0": { en: "Connected: {p}. Notes you play are written with the length at the cursor; with \u201CJam\u201D on, or in Lyrics / Listen, they only sound" },
  "\u5F00\u7740\uFF0C\u8FD8\u6CA1\u63D2\u7434\uFF08\u63D2\u4E0A\u5C31\u8BA4\uFF09": { en: "On, nothing plugged in (recognized when plugged in)" },
  "\u5FF5\u7F13\u5B58\u548C\u5C01\u9762\u7F13\u5B58\u6362\u4E86\u65B0\u540D\u5B57\uFF0C\u4F1A\u91CD\u65B0\u751F\u6210\u4E00\u6B21\uFF08\u6B4C\u4E0D\u53D7\u5F71\u54CD\uFF09": { en: "The speech and cover caches got new names and will regenerate once (songs aren't affected)" },
  "\u8BD5\u542C\u5143\u97F3\u8868\u6CA1\u4E0B\u8F7D\u4E0B\u6765\uFF1A{Error}": { en: "Couldn't download the audition vowel table: {Error}" },
  "\u8FD9\u53F0\u8BBE\u5907\u4E0A\u8BFB\u4E0D\u5230\u5B83\u7684\u5B57\u8282": { en: "Its bytes can't be read on this device" },
  "\u5199\u5B8C\u5728\u65B0\u5BB6\u91CC\u627E\u4E0D\u5230": { en: "Not found in the new home after writing" },
  "\u5199\u8FDB\u53BB\u7684\u5B57\u8282\u548C\u539F\u6765\u7684\u5BF9\u4E0D\u4E0A": { en: "Written bytes don't match the original" },
  " \u7B49 {n} \u9996": { en: " and {n} more {n|song|songs}" },
  "\u642C\u597D\u4E86 {n} \u9996\u5230\u300C{home}\u300D": { en: "Moved {n} {n|song|songs} into \u201C{home}\u201D" },
  "{n} \u9996\u8FDE\u7740\u7F51\u76D8\u7684\u62F7\u4E86\u4E00\u4EFD\u8FC7\u53BB\uFF0C\u6D4F\u89C8\u5668\u91CC\u90A3\u4EFD\u7559\u7740\uFF08\u767B\u5F55\u540E\u7167\u5E38\u540C\u6B65\uFF09": { en: "{n} OneDrive-linked {n|song was|songs were} copied over; the browser's {n|copy stays|copies stay} (sync as usual after signing in)" },
  "{n} \u9996\u5DF2\u7ECF\u5728\u300C{home}\u300D\u91CC\u4E86\uFF0C\u4F46\u6D4F\u89C8\u5668\u91CC\u7684\u65E7\u7684\u6CA1\u79FB\u8D70\uFF1A{stuck}": { en: "{n} {n|song is|songs are} already in \u201C{home}\u201D, but the old browser copies weren't removed: {stuck}" },
  "{n} \u9996\u6CA1\u642C\u6210\uFF0C\u8FD8\u5728\u6D4F\u89C8\u5668\u91CC\uFF0C\u4E00\u4E2A\u5B57\u8282\u6CA1\u52A8\uFF1A{failed}": { en: "{n} {n|song wasn't|songs weren't} moved and {n|remains|remain} in the browser, not a byte changed: {failed}" },
  "\u6CA1\u6709\u8981\u642C\u7684\u6B4C": { en: "No songs to move" },
  "\u9009\u533A\u5199\u6EE1\u4E86\uFF1A\u5199\u4E0D\u51FA\u9009\u533A\u3002\u8981\u5F80\u540E\u5199\uFF0C\u5148\u70B9\u522B\u5904\u9000\u51FA\u9009\u533A": { en: "The selection is full: can't write past it. To keep writing, tap elsewhere to leave the selection" },
  "\u7436\u97F3\u53EA\u6302\u5728\u548C\u5F26\u4E0A\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6216\u9009\u4E2D\u7684\uFF09\u662F\u5355\u97F3": { en: "Arpeggios only go on chords: the note before the cursor (or the selection) is a single note" },
  "{p}\u8981\u6302\u5728\u4E00\u4E2A\u97F3\u4E0A\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": { en: "{p} must go on a note (before the cursor is a rest, or no note yet)" },
  "\u8FDE\u7EBF\u4ECE\u4E00\u4E2A\u97F3\u8FDE\u5230\u4E0B\u4E00\u4E2A\u97F3\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": { en: "A slur goes from one note to the next (before the cursor is a rest, or no note yet)" },
  "\u51FA\u58F0\u7684\u6362\u6C14\u6302\u5728\u4E00\u4E2A\u97F3\u540E\u9762\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": { en: "An audible breath goes after a note (before the cursor is a rest, or no note yet)" },
  "\u97F3\u5185\u7684\u8D77\u4F0F\u8981\u6302\u5728\u4E00\u4E2A\u97F3\u4E0A\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": { en: "A swell must go on a note (before the cursor is a rest, or no note yet)" },
  "{p}\u4ECE\u4E00\u4E2A\u97F3\u5230\u4E0B\u4E00\u4E2A\u97F3\uFF08\u5149\u6807\u524D\u9762\u662F\u4F11\u6B62\u6216\u8005\u8FD8\u6CA1\u6709\u97F3\uFF09": { en: "{p} goes from one note to the next (before the cursor is a rest, or no note yet)" },
  "\u987A\u624B\u53BB\u6389\u4E86 {gone} \u4E2A\u4E0D\u518D\u7BA1\u4EFB\u4F55\u97F3\u7684\u529B\u5EA6\u8BB0\u53F7 / \u6E10\u5F3A\u6E10\u5F31\uFF08\u64A4\u9500\u80FD\u627E\u56DE\u6765\uFF09": { en: "Also removed {gone} dynamics / hairpins that no longer govern any note (undo brings them back)" },
  "\u8DDF\u8C31": { en: "Follow score" },
  "\u8DDF\u7740\u8C31\u4E0A\u8FD9\u91CC\u7684\u8C03\u53F7": { en: "Uses the key signature here" },
  "\u624B\u52A8": { en: "Manual" },
  "\u624B\u52A8\uFF1A\u952E\u76D8\u6309 {pad} \u6392\uFF0C\u548C\u8C31\u4E0A\u8FD9\u91CC\u7684\u8C03\u53F7\uFF081={k}\uFF09\u4E0D\u4E00\u6837\u3002\u70B9\u5F00\u300C1=\u300D\uFF0C\u8C03\u5F0F\u90A3\u4E00\u5217\u6700\u4E0A\u9762\u7684\u300C\u8DDF\u8C31\u300D= \u56DE\u5230\u8DDF\u7740\u8C31\u8D70": { en: "Manual: the keyboard is laid out in {pad}, which differs from the key signature here (1={k}). Open \u201C1=\u201D and pick \u201CFollow score\u201D at the top of the mode column to follow the score again" },
  "{name}\uFF08\u8DDF\u7740\u8C31\u4E0A\u8FD9\u91CC\u7684\u8C03\u53F7\uFF09": { en: "{name} (follows the key signature here)" },
  "{name}\uFF08\u624B\u52A8\uFF09": { en: "{name} (manual)" },
  "\u3093 / \u55EF": { en: "\u3093 (hum)" },
  "\u3042 / \u554A": { en: "\u3042 (ah)" },
  "\u304A / \u54E6": { en: "\u304A (oh)" },
  "\u3046 / \u545C": { en: "\u3046 (oo)" },
  "\u3089 / \u5566": { en: "\u3089 (la)" },
  "{p}\u524D\u300C{mark}\u300D{p2}": { en: "\u201C{mark}\u201D before {p}{p2}" },
  "\u4E0B\u4E00\u4E2A\u5B57": { en: "the next syllable" },
  "\u8FD9\u4E2A\u5B57": { en: "this syllable" },
  "\uFF08\u987F\u4E00\u4E0B\uFF0C\u4E0D\u6362\u6C14\uFF09": { en: " (a brief stop, no breath)" },
  "\uFF08\u6362\u6C14\uFF09": { en: " (a breath)" },
  "\uFF08\u5927\u53E3\u6362\u6C14\uFF09": { en: " (a big breath)" },
  "\u4E0D\u53D8\u6210\u5531\u6CD5\u8BB0\u53F7": { en: "Doesn't become a singing mark" },
  "\u6309\u4E0B\u90A3\u4E00\u4E0B\u7684\u8F7B\u91CD\uFF08MIDI \u529B\u5EA6\uFF09\uFF1A\u6E10\u5F3A\u6E10\u5F31 = \u6BCF\u4E2A\u65B0\u97F3\u4E00\u4E2A\u53F0\u9636\uFF0C\u6309\u4F4F\u7684\u97F3\u4E2D\u95F4\u4E0D\u53D8\uFF1B\u4E00\u4E2A\u97F3\u91CC\u9762\u8981\u53D8\uFF0C\u7528\u97F3\u5185\u8D77\u4F0F{canSwell}": { en: "How hard the key is struck (MIDI velocity): crescendo / diminuendo = one step per new note, held notes don't change; to change within a note, use a swell{canSwell}" },
  "\uFF08\u8FD9\u4EF6\u4E50\u5668\u6309\u4E0B\u53BB\u5C31\u81EA\u7136\u8870\u51CF\uFF1A\u97F3\u5185\u53EA\u80FD\u53D8\u5F31\uFF09": { en: " (this instrument decays on its own: within a note it can only get softer)" },
  "\u4E00\u6761\u8FDE\u7EED\u7684\u97F3\u91CF\u66F2\u7EBF\uFF08\u4E58\u5728{sung}\u51FA\u6765\u7684\u58F0\u97F3\u4E0A\uFF09\uFF1A\u6E10\u5F3A\u6E10\u5F31\u5728\u4E00\u4E2A\u957F\u97F3\u4E2D\u95F4\u4E5F\u4E00\u76F4\u5728\u53D8\uFF0C\u548C\u97F3\u5185\u8D77\u4F0F\u662F\u540C\u4E00\u79CD\u53D8\u6CD5\uFF1B\u53EA\u53D8\u54CD\u5EA6\u3001\u4E0D\u53D8\u97F3\u8272{sung2}": { en: "A continuous volume curve (multiplied onto the {sung} sound): crescendo / diminuendo keep changing through a long note, the same way a swell does; only loudness changes, not timbre{sung2}" },
  "\u5531##\u51FA\u58F0": { en: "sung" },
  "\u5F39##\u51FA\u58F0": { en: "played" },
  "\uFF08\u771F\u4EBA\u6E10\u5F31\u4F1A\u53D8\u865A\u3001\u53D8\u6697\uFF0C\u8FD9\u4E2A\u8FD8\u6CA1\u6709\uFF09": { en: " (a real singer's diminuendo gets airier and darker; not modeled yet)" },
  "\u529B\u5EA6\u600E\u4E48\u53D8": { en: "How dynamics change" },
  "\u529B\u5EA6\u8868\uFF1A{string}": { en: "Dynamics table: {string}" },
  "\u97F3\u91CF\uFF1A{dynamicsDb}": { en: "Volume: {dynamicsDb}" },
  "\u6E10\u5F3A\u6E10\u5F31\u6CA1\u5199\u7EC8\u70B9": { en: "Crescendo / diminuendo with no endpoint" },
  "\u8D70\u4E00\u6863 = \u529B\u5EA6 {wedgeStepVel}": { en: "One step = velocity {wedgeStepVel}" },
  "\u8D70\u4E00\u6863 = {wedgeStepDb}": { en: "One step = {wedgeStepDb}" },
  "\u5E7D\u7075\u97F3": { en: "Ghost note" },
  "\u529B\u5EA6 {ghostVel}": { en: "Velocity {ghostVel}" },
  "\u6574\u4E2A\u97F3 {ghostDb}": { en: "Whole note {ghostDb}" },
  "\u5F31\u5316": { en: "Unstressed" },
  "\u529B\u5EA6 {unstressVel}": { en: "Velocity {unstressVel}" },
  "\u6574\u4E2A\u97F3 {unstressDb}": { en: "Whole note {unstressDb}" },
  "\u6B21\u91CD\u97F3": { en: "Stress" },
  "\u529B\u5EA6 +{stressVel}": { en: "Velocity +{stressVel}" },
  "\u97F3\u5934 {accentSec} {stressDb}": { en: "Attack {accentSec} {stressDb}" },
  "\u91CD\u97F3": { en: "Accent" },
  "\u529B\u5EA6 +{accentVel}": { en: "Velocity +{accentVel}" },
  "\u97F3\u5934 {accentSec} {accentDb}{sung}": { en: "Attack {accentSec} {accentDb}{sung}" },
  "\u5F3A\u97F3": { en: "Marcato" },
  "\u529B\u5EA6 +{marcatoVel}": { en: "Velocity +{marcatoVel}" },
  "\u97F3\u5934 {accentSec} {marcatoDb}{sung}": { en: "Attack {accentSec} {marcatoDb}{sung}" },
  "\u7A81\u5F3A sfz": { en: "Sforzando sfz" },
  "\u529B\u5EA6 +{sfzVel}": { en: "Velocity +{sfzVel}" },
  "\u97F3\u5934 {sfzDb}\uFF0C{sfzSec} \u91CC\u843D\u56DE\u6765{sung}": { en: "Attack {sfzDb}, falls back within {sfzSec}{sung}" },
  "\u5F3A\u540E\u5373\u5F31 fp": { en: "Forte-piano fp" },
  "\u97F3\u5934\u6309 f\uFF0C{fpSec} \u91CC\u843D\u5230 p\uFF0C\u4E4B\u540E\u90FD\u662F p{sung}": { en: "Attacks at f, falls to p within {fpSec}, then stays p{sung}" },
  "\u5199\u7684\u529B\u5EA6\u662F\u6700\u9AD8\u70B9\uFF1A< \u4ECE \u2212{swellDb} dB \u957F\u5230\u5199\u7684\u529B\u5EA6\uFF1B<> \u4E24\u5934 \u2212{swellDb2} dB\u3001\u4E2D\u95F4\u56DE\u5230\u5199\u7684\u529B\u5EA6\uFF08\u5F3A\u540E\u5373\u5F31\u4E4B\u540E\u7684 < \u957F\u56DE\u97F3\u5934\u7684 f\uFF09": { en: "The written dynamic is the peak: < grows from \u2212{swellDb} dB to it; <> starts and ends at \u2212{swellDb2} dB, returning to it in the middle (a < after fp grows back to the attack's f)" },
  "\u505A\u4E0D\u5230\uFF1A\u8FD9\u4EF6\u4E50\u5668\u6309\u4E0B\u53BB\u5C31\u81EA\u7136\u8870\u51CF": { en: "Not possible: this instrument decays on its own" },
  "\u4E00\u8DEF\u5F80\u4E0B\u5230 \u2212{swellDb} dB": { en: "Falls all the way to \u2212{swellDb} dB" },
  "\u8DF3\u97F3": { en: "Staccato" },
  "\u5531 / \u5F39 {staccatoGate} \u7684\u957F\u5EA6": { en: "Sung / played at {staccatoGate} of its length" },
  "\u4FDD\u6301": { en: "Tenuto" },
  "\u8FD9\u4E2A\u97F3\u4E0D\u7559\u7F1D": { en: "No gap after this note" },
  "\u8FDE\u5230\u4E0B\u4E00\u4E2A\u97F3\u3001\u4E0D\u7559\u7F1D": { en: "Connects to the next note with no gap" },
  "\u547C\u5438": { en: "Breath" },
  "\u524D\u4E00\u4E2A\u97F3\u6536\u77ED {breathSec}\uFF08\u6700\u591A {breathShare}\uFF09": { en: "Shortens the previous note by {breathSec} (at most {breathShare})" },
  "\u51FA\u58F0\u7684\u6362\u6C14\uFF08\u8F7B\u5438 / \u6DF1\u5438\uFF09": { en: "Audible breath (soft / deep)" },
  "\u6362\u6C14\u7684\u7A7A\u5F53\u91CC\u4E00\u58F0\u5438\u6C14\uFF08\u6309\u4E0B\u4E00\u4E2A\u5B57\u7684\u5143\u97F3\u5851\u5F62\uFF0C\u6BD4\u5B83\u8F7B\u7EA6 28 dB\uFF1B\u6DF1\u5438 = \u7A7A\u5F53\u957F\u4E00\u70B9\u3001\u54CD 4 dB\uFF09": { en: "An inhale in the breath gap (shaped by the next syllable's vowel, about 28 dB softer; deep = a longer gap and 4 dB louder)" },
  "\u505A\u4E0D\u5230\uFF1A\u8FD9\u4F4D\u53EA\u65AD\u5F00\uFF0C\u4E0D\u51FA\u5438\u6C14\u58F0": { en: "Not possible: this performer only separates, with no inhale sound" },
  "\u6C14\u58F0\uFF08\xD7 \u7B26\u5934\uFF09": { en: "Whisper (\xD7 notehead)" },
  "\u8FD9\u4E2A\u5B57\u4E0D\u5531\u97F3\u9AD8\uFF1A\u7528\u5FF5\u7684\u65F6\u5019\u7684\u6C14\u58F0\uFF08\u8C31\u5305\u7EDC\u7167\u65E7\u3001\u58F0\u5E26\u4E0D\u632F\uFF09\uFF0C\u518D\u8F7B 6 dB": { en: "This syllable has no sung pitch: uses the breathy spoken voice (same spectral envelope, no vocal-fold vibration), 6 dB softer" },
  "\u505A\u4E0D\u5230\uFF1A\u8FD9\u4F4D\u53EA\u6309\u97F3\u9AD8\u51FA\u58F0": { en: "Not possible: this performer only sounds by pitch" },
  "\u97F3\u548C\u97F3\u4E4B\u95F4": { en: "Between notes" },
  "\u8FDE\u7740\u5531": { en: "Legato" },
  "{gapSec}\uFF08\u6700\u591A {gapShare}\uFF09": { en: "{gapSec} (at most {gapShare})" },
  "\u6EDA\u594F": { en: "Roll" },
  "\u6574\u4E2A\u97F3\u6572\u6EE1\uFF0C\u6BCF\u79D2 {hz} \u4E0B\uFF1B\u529B\u5EA6\u8DDF\u7740\u5F53\u65F6\u7684\u529B\u5EA6\u548C\u6E10\u5F3A\u6E10\u5F31\u8D70": { en: "Fills the whole note, {hz} hits per second; loudness follows the current dynamic and hairpins" },
  "\u8BB0\u53F7\u600E\u4E48\u6F14\uFF08\u8FD9\u4F4D\u81EA\u5DF1\u7684\u914D\u7F6E\uFF0C\u8DDF\u7740\u6F14\u594F\u8005\u5B58\u8FDB\u6B4C\uFF09": { en: "How marks are performed (this performer's own settings, saved in the song with them)" },
  "\u6309\u9F13\u4EF6\uFF08\u519B\u9F13 20\u3001\u9572 14\u3001\u5E95\u9F13 12\u3001\u522B\u7684\u9F13 16\uFF09": { en: "Per drum (snare 20, cymbals 14, kick 12, other drums 16)" },
  "\u4EBA\u58F0\uFF08\u8FDE\u7740\u5531\uFF09": { en: "Voice (legato)" },
  "\u81EA\u5DF1\u7684 .sf2\uFF08\u76EE\u5F55\u91CC\u6CA1\u6709\u8FD9\u4E2A\u97F3\u8272\u7684\u8FDE\u65AD\u6570\u636E\uFF09": { en: "Own .sf2 (the catalog has no legato data for this sound)" },
  "\u4E00\u4E0B\u5C31\u5B8C / \u97F3\u6548\uFF08\u4E0D\u7559\u7F1D\uFF09": { en: "One-shot / sound effect (no gap)" },
  "\u8FD9\u4EF6\u4E50\u5668\uFF1A{what}": { en: "Instrument: {what}" },
  "\u7B2C\u4E8C\u884C\u8D77\u5199 {ab}": { en: "from the 2nd system: {ab}" },
  "MIDI \u529B\u5EA6": { en: "MIDI velocity" },
  "\u97F3\u91CF dB": { en: "Volume dB" },
  "GS \u529B\u5EA6\u5C42": { en: "GS velocity layer" },
  "\u58F0\u97F3\u5D4C\u5728\u6B4C\u91CC\uFF08{n}\uFF09{library}": { en: "Sound embedded in the song ({n}){library}" },
  "\uFF0C\u6765\u81EA\u5BB6\u65CF\u97F3\u6E90\u5E93\u7684 {name}": { en: ", from {name} in the family sound library" },
  "\uFF0C\u6765\u81EA {name}": { en: ", from {name}" },
  "\u58F0\u97F3\u6CA1\u968F\u8FD9\u9996\u6B4C\u5E26\u6765\uFF0C\u6240\u4EE5\u6CA1\u4EBA\u4E0A\u573A\u2014\u2014\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D": { en: "The sound didn't come with this song, so nobody is on stage \u2014 pick another \u201CWho performs\u201D" },
  "\u5F31\u5F15\u7528\uFF1A\u6B4C\u91CC\u4E0D\u5E26\u58F0\u97F3\uFF0C\u7528\u65F6\u4ECE\u300C{name}\u300D\u627E\uFF08{found}\uFF09": { en: "Weak reference: the song carries no sound; found from \u201C{name}\u201D when used ({found})" },
  "\u672C\u6B21\u5DF2\u627E\u5230": { en: "found this session" },
  "\u5BB6\u65CF\u97F3\u6E90\u5E93 / \u8BBE\u5907\u7F13\u5B58 / \u4F60\u7684\u6587\u4EF6": { en: "family sound library / device cache / your files" },
  "\u627E\u6587\u4EF6\u2026": { en: "Find file\u2026" },
  "\u54CD\u5EA6": { en: "Loudness" },
  "\u8FD9\u4F4D\u6F14\u594F\u8005\u5C0F\u58F0 1 dB": { en: "This performer 1 dB softer" },
  "\u5927\u58F0 1 dB": { en: "1 dB louder" },
  "\u56DE\u5230\u9ED8\u8BA4 {DEFAULT_CALIBRATION_DB}": { en: "Back to default {DEFAULT_CALIBRATION_DB}" },
  "\u9ED8\u8BA4": { en: "Default" },
  "\u8FD9\u4F4D\u6F14\u594F\u8005\u81EA\u5DF1\u7684\u97F3\u91CF\uFF1A\u9ED8\u8BA4\u90FD\u662F {DEFAULT_CALIBRATION_DB}\uFF08\u5C0F\u6708\u76F8\u4E5F\u662F\uFF09\uFF0C\u51E0\u4E2A\u58F0\u90E8\u53E0\u5728\u4E00\u8D77\u624D\u4E0D\u9876\u5230\u5929\u82B1\u677F\u3001\u4E0D\u628A\u58F0\u97F3\u538B\u53D8\u6837\uFF1B\u6DF7\u97F3\u53F0\u7684\u63A8\u5B50\u53E6\u7B97": { en: "This performer's own volume: the default is {DEFAULT_CALIBRATION_DB} for everyone (Tsukuyomi-chan too), so stacked parts don't hit the ceiling and get squashed; the mixer fader is separate" },
  "\u7F1D\u5C0F 10 ms\uFF08\u66F4\u8FDE\uFF09": { en: "Gap 10 ms smaller (more legato)" },
  "\u7F1D\u5927 10 ms\uFF08\u66F4\u65AD\uFF09": { en: "Gap 10 ms larger (more detached)" },
  "\u56DE\u5230\u9ED8\u8BA4 {p} ms": { en: "Back to default {p} ms" },
  "\u4E0D\u5199\u8BB0\u53F7\u7684\u97F3\u548C\u4E0B\u4E00\u4E2A\u97F3\u4E4B\u95F4\u7559\u7684\u7F1D\uFF1A0 = \u8FDE\u7740\u3002{d}\u8FDE\u7EBF\uFF08\u8FDE\u594F\uFF09\u3001\u4FDD\u6301\u7684\u97F3\u4E0D\u7559\u7F1D\uFF1B\u547C\u5438 = \u8FD9\u91CC\u65AD\u5F00\uFF1B\u8DF3\u97F3\u53E6\u7B97": { en: "Gap left between unmarked notes and the next note: 0 = connected. {d}Slurred (legato) and tenuto notes leave no gap; a breath separates here; staccato is separate" },
  "{label}\uFF1A\u9ED8\u8BA4 {p} ms\uFF08\u97F3\u4E50\u76EE\u5F55\u7ED9\u7684\uFF0C\u6309\u97F3\u8272\u9010\u4E2A\uFF09\u3002": { en: "{label}: default {p} ms (from the music catalog, per sound)." },
  "\u6BCF\u79D2 {n} \u4E0B": { en: "{n} per second" },
  "\u6309\u9F13\u4EF6": { en: "Per drum" },
  "\u6EDA\u594F\u7A00\u4E00\u70B9\uFF08\u6BCF\u79D2\u5C11 2 \u4E0B\uFF09": { en: "Slower roll (2 fewer hits per second)" },
  "\u6EDA\u594F\u5BC6\u4E00\u70B9\uFF08\u6BCF\u79D2\u591A 2 \u4E0B\uFF09": { en: "Faster roll (2 more hits per second)" },
  "\u56DE\u5230\u8FD9\u4EF6\u4E50\u5668\u7684\u9ED8\u8BA4": { en: "Back to this instrument's default" },
  "\u8C31\u4E0A\u7B26\u5E72\u5E26\u4E09\u9053\u659C\u7EBF\u7684\u97F3 = \u6EDA\u594F\uFF1A\u6574\u4E2A\u97F3\u6309\u8FD9\u4E2A\u5BC6\u5EA6\u6572\u6EE1\uFF0C\u529B\u5EA6\u8DDF\u7740\u5F53\u65F6\u7684\u529B\u5EA6\u548C\u6E10\u5F3A\u6E10\u5F31\u8D70\u3002\u9ED8\u8BA4\uFF1A\u519B\u9F13 20\u3001\u9572 14\u3001\u5E95\u9F13 12\u3001\u522B\u7684\u9F13 16\u3001\u6709\u97F3\u9AD8\u7684 14\uFF08\u6BCF\u79D2\uFF09\u3002": { en: "A note with three slashes on its stem is a roll: the whole note is filled at this rate, following the current dynamic and hairpins. Defaults (per second): snare 20, cymbals 14, kick 12, other drums 16, pitched 14." },
  "\u529B\u5EA6\u8BB0\u53F7 = \u97F3\u91CF\uFF08\u76F8\u5BF9 mf\uFF0CdB\uFF09\uFF1B\u4E00\u6863 6 dB \u2248 \u632F\u5E45\u7FFB\u500D / \u51CF\u534A\u3002\u529B\u5EA6\u8BB0\u53F7\u6CA1\u6709\u6807\u51C6\u7684 dB\uFF0C\u662F\u76F8\u5BF9\u7684\uFF1A\u6BCF\u4F4D\u6F14\u594F\u8005\u81EA\u5DF1\u5E26\u4E00\u5F20\u8868\uFF0C\u8FD9\u662F\u8FD9\u4F4D\u7684\uFF1A{extras}": { en: "Dynamics = volume (relative to mf, dB); one step of 6 dB \u2248 double / half the amplitude. Dynamics have no standard dB value: they're relative, and each performer carries a table. This performer's: {extras}" },
  "\u54FC\u7684\u5B57": { en: "Hum syllable" },
  "\u6CA1\u5199\u6B4C\u8BCD\u7684\u97F3\u5531\u4EC0\u4E48\uFF08\u6574\u9996\u6B4C\u4E00\u4E2A\uFF09": { en: "What notes without lyrics sing (one for the whole song)" },
  "\u9AD8\u7EA7\uFF1A\u5531\u6CD5\u6838\u5FC3\u7684\u65CB\u94AE": { en: "Advanced: singing core knobs" },
  "\u8FD9\u4E00\u7248\u51FA\u4E0D\u4E86\u58F0\uFF08\u522B\u7684\u8F6F\u4EF6\u539F\u6765\u7684\u4E50\u5668\uFF09\uFF1A\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D": { en: "This version can't sound it (the other software's original instrument): pick another \u201CWho performs\u201D" },
  "\u56DE\u5230\u8C31\uFF08Esc\uFF09": { en: "Back to the score (Esc)" },
  "\u2190 \u8C31": { en: "\u2190 Score" },
  "\u4E50\u5668": { en: "Instruments" },
  "\u6362\u4E00\u4E2A\u58F0\u90E8": { en: "Switch part" },
  "\u8BD5\u542C\u952E\u76D8\uFF1A\u5F00 / \u5173": { en: "Audition keys: on / off" },
  "\u53F0\u4E0A": { en: "On stage" },
  "\u6F14\u594F\u8005\u548C\u4ED6\u624B\u91CC\u7684\u7434\uFF1B\u540D\u5B57\u4E0D\u4E0A\u8C31": { en: "The performer and the instrument they hold; this name isn't on the score" },
  "\u4E50\u5668\u76EE\u5F55\uFF1A\u9876\u4E0A\u662F\u8FD9\u9996\u6B4C\u91CC\u7528\u8FC7\u7684\uFF0C\u4E0B\u9762\u6309\u66F2\u98CE / \u5E74\u4EE3 / \u65CF\u6D4F\u89C8\uFF1B\u53F3\u8FB9\u7684\u952E\u76D8\u8BD5\u542C\uFF0C\u9009\u597D\u5C31\u6362\u4E0A": { en: "Instrument catalog: what this song has used is at the top, browse below by style / era / family; try on the keys at the right, pick one and it\u2019s on" },
  "\u6362\u4E50\u5668\u2026": { en: "Change instrument\u2026" },
  "{who} \u600E\u4E48\u6F14": { en: "How {who} performs" },
  "\u53F3\u8FB9\u7684\u952E\u76D8\u5F39\u7684\u5C31\u662F\u53F0\u4E0A\u8FD9\u4F4D\uFF0C\u6539\u4E86\u9A6C\u4E0A\u80FD\u8BD5": { en: "The keys at the right play whoever's on stage; changes can be tried right away" },
  "\u8C31\u4E0A\u5199\u300C{rn}\u300D": { en: "Shown on the score as \u201C{rn}\u201D" },
  "\u6539\u540D\u5728\u58F0\u90E8\u7BA1\u7406": { en: "rename it under Parts" },
  "\u300C{rn}\u300D\u97F3\u548C\u97F3\u4E4B\u95F4 {p} ms": { en: "\u201C{rn}\u201D between notes {p} ms" },
  "\u300C{rn}\u300D\u6EDA\u594F\u56DE\u5230\u9ED8\u8BA4": { en: "\u201C{rn}\u201D roll back to default" },
  "\u300C{rn}\u300D\u6EDA\u594F\u6BCF\u79D2 {n} \u4E0B": { en: "\u201C{rn}\u201D roll: {n} per second" },
  "\u300C{rn}\u300D\u54CD\u5EA6\u6821\u51C6 {next} dB": { en: "\u201C{rn}\u201D loudness calibration {next} dB" },
  "\u8FD8\u6CA1\u6709\u4EBA\u4E0A\u573A\uFF08\u522B\u7684\u8F6F\u4EF6\u539F\u6765\u7684\u4E50\u5668\uFF0C\u8FD9\u4E00\u7248\u8BA4\u4E0D\u51FA\uFF09": { en: "Nobody on stage yet (the other software's original instrument isn't recognized by this version)" },
  "{next}\u3002\u8FD9{p}\u653E\u548C\u5BFC\u51FA\u90FD\u4E0D\u51FA\u58F0\uFF0C\u5176\u4F59\u7167\u653E\uFF1B\u70B9 |\u25B6 \u89D2\u4E0A\u7684\u6570\u5B57\u770B\u6E05\u5355\uFF0C\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D\u3002": { en: "{next}. {p} silent in both playback and export, the rest plays as usual; tap the number on the corner of |\u25B6 for the list, and tap the part name at the front of the score to change \u201CWho performs\u201D." },
  "\u73B0\u5728\u7684\u58F0\u90E8\u90FD\u80FD\u51FA\u58F0\u4E86": { en: "All parts can sound now" },
  "\u300C{who}\u300D\u5531\u4E0D\u4E86\u8FD9\u4E00\u53E5\uFF1A{failed}": { en: "\u201C{who}\u201D can't sing this line: {failed}" },
  "{who}\uFF1A{pumpQuiet} {left} \u53E5\u2026": { en: "{who}: {pumpQuiet} {left} lines\u2026" },
  "\u5148\u5531\u7740": { en: "singing ahead" },
  "\u8FD8\u6709": { en: "still" },
  "\u300C{who}\u300D\u5531\u4E0D\u4E86\u8FD9\u4E00\u53E5\uFF1A{msg}": { en: "\u201C{who}\u201D can't sing this line: {msg}" },
  "\u5185\u5B58 / \u8D1F\u8F7D\u5403\u7D27\uFF1A\u5C0F\u6708\u76F8\u6539\u6210\u4E00\u6761\u9053\u5531\uFF08\u6162\u4E00\u70B9\uFF0C\u58F0\u97F3\u4E0D\u53D8\uFF09": { en: "Memory / load is tight: Tsukuyomi-chan now sings on one lane (slower, same sound)" },
  "\u97F3\u9891\u7EBF\u7A0B\u6700\u8FD1 1 s \u5FD9 {p}%\uFF1A\u53EF\u80FD\u7206\u97F3\u3002\u6548\u679C\u94FE / \u58F0\u90E8\u662F\u4F60\u7684\u6DF7\u97F3\uFF0C\u4E0D\u66FF\u4F60\u52A8\uFF1B\u53EF\u4EE5\u5148\u628A\u6CA1\u5728\u542C\u7684\u58F0\u90E8\u9759\u97F3": { en: "The audio thread was {p}% busy in the last 1 s: it may crackle. Effects and parts are your mix, so nothing changes automatically; you could mute parts you aren't listening to" },
  "\u6CA1\u6709\u51FA\u58F0\uFF1A{issues}\u3002\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D\u3002": { en: "Nothing sounded: {issues}. Tap the part name at the front of the score to change \u201CWho performs\u201D." },
  "\u6CA1\u6709\u4F1A\u51FA\u58F0\u7684\u58F0\u90E8": { en: "No parts that can sound" },
  "\u5FAA\u73AF {loopFrom} \u79D2": { en: "Loop {loopFrom} s" },
  "{atNow} \u79D2": { en: "{atNow} s" },
  "\u653E\u4E0D\u4E86\uFF1A{Error}": { en: "Can't play: {Error}" },
  "\u64AD\u653E\u51FA\u9519\u4E86\uFF0C\u5DF2\u7ECF\u505C\u4E0B\uFF08\u9519\u8BEF\u8BB0\u8FDB\u4E86\u8BCA\u65AD\u65E5\u5FD7\uFF09\uFF1A{p}": { en: "Playback error, stopped (recorded in the diagnostic log): {p}" },
  "\u7B49\u5C0F\u6708\u76F8\u5531\u597D\u8FD9\u4E00\u53E5\u2026": { en: "Waiting for Tsukuyomi-chan to finish this line\u2026" },
  "\u300C{name}\u300D\u54CD\u4E0D\u4E86\uFF1A{Error}": { en: "\u201C{name}\u201D can't sound: {Error}" },
  "\u7F16 mp3\u2026": { en: "Encoding mp3\u2026" },
  "\u8FD9\u4E00\u5F20": { en: "This sheet" },
  "\u7ACB\u4F53\u58F0": { en: "Stereo" },
  "\u5355\u58F0\u9053": { en: "Mono" },
  "\u6B4C\u58F0\u5BFC\u51FA\u597D\u4E86": { en: "MP3 exported" },
  "{p} \u79D2 \xB7 mp3 {Q} {kbps}k {size}{fromFinal}{fellBack}{length}{lines}": { en: "{p} s \xB7 mp3 {Q} {kbps}k {size}{fromFinal}{fellBack}{length}{lines}" },
  "\uFF08\u7528\u7684\u662F\u8FD9\u53F0\u8BBE\u5907\u4E0A\u8BB0\u7740\u7684\u4E0A\u6B21\u6E32\u597D\u7684\u90A3\u4EFD\uFF0C\u5185\u5BB9\u6CA1\u53D8\uFF09": { en: " (the last render remembered on this device; nothing has changed)" },
  "\u4E5F\u653E\u8FDB\u6E32\u67D3\u7F13\u5B58\u4E86\uFF1A\u6B4C\u5E93\u91CC\u8FD9\u9996\u7684\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C\uFF0C\u5185\u5BB9\u4E0D\u53D8\u518D\u5BFC\u51FA\u4E0D\u7528\u518D\u6E32\u3002\u8BBE\u7F6E\u300C\u97F3\u6E90\u4E0E\u7F13\u5B58\u300D\u2192\u300C\u6E32\u67D3\u7F13\u5B58\u300D\u91CC\u770B\u5F97\u89C1\u3001\u5220\u5F97\u6389\u3002": { en: "Also kept in the render cache: play it straight from this song\u2019s cover in the library, and re-exporting an unchanged song is instant. See or delete it under Settings \u203A Audio \u203A Render cache." },
  "\u8FD9\u51E0\u6761\u8F68\u6CA1\u51FA\u58F0\uFF0Cmp3 \u91CC\u6CA1\u6709\u5B83\u4EEC\uFF1A": { en: "These tracks were silent and aren't in the mp3:" },
  "\u7F72\u540D \xB7 \u5DF2\u5199\u8FDB mp3 \u7684\u6807\u7B7E": { en: "Credits \xB7 written into the mp3 tags" },
  "\u5BFC\u51FA\u5931\u8D25\uFF1A{Error}": { en: "Export failed: {Error}" },
  "\u6B63\u5728\u5BFC\u51FA\u6216\u51C6\u5907\u64AD\u653E\uFF0C\u7B49\u5B83\u5B8C\u4E86\u518D\u6E32": { en: "Exporting or getting ready to play; render after that finishes" },
  "{label} \xB7 \u5F00\u5934 {p} \u79D2": { en: "{label} \xB7 first {p} s" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u89E3\u4E0D\u4E86\u97F3\u9891": { en: "This browser can't decode the audio" },
  "PNG {REF_IMAGE_COLORS} \u8272\u3001{w} \xD7 {h}\uFF08\u957F\u8FB9\u6700\u591A {REF_IMAGE_EDGE}\uFF09": { en: "PNG {REF_IMAGE_COLORS} colors, {w} \xD7 {h} (long side up to {REF_IMAGE_EDGE})" },
  "mp3 {REF_MP3_KBPS}k{right}\u3001{p} \u5206\u949F": { en: "mp3 {REF_MP3_KBPS}k{right}, {p} min" },
  " \u5355\u58F0\u9053": { en: " mono" },
  "\u4E0D\u4F1A\u538B\u8FD9\u79CD\uFF1A{kind}": { en: "Can't compress this kind: {kind}" },
  "\u539F\u5C3A\u5BF8": { en: "Original size" },
  "\u5220\u6389\u8FD9\u5F20": { en: "Delete this one" },
  "\u518D\u70B9\u4E00\u6B21\u5220\u6389": { en: "Tap again to delete" },
  "\u4E0A\u4E00\u5F20": { en: "Previous" },
  "\u4E0B\u4E00\u5F20": { en: "Next" },
  "\u53C2\u8003\u7A97\u83DC\u5355": { en: "Reference window menu" },
  "\u70B9\u4E00\u4E0B\u7F29\u6210\u5C0F\u56FE\u6807\uFF0C\u6309\u4F4F\u62D6\u52A8\u632A\u4F4D\u7F6E": { en: "Tap to shrink to an icon, hold and drag to move" },
  "\u6539\u5927\u5C0F": { en: "Resize" },
  "\u5F80\u524D\u632A": { en: "Move earlier" },
  "\u5F80\u540E\u632A": { en: "Move later" },
  "\u8DF3\u5230\u2026": { en: "Jump to\u2026" },
  "\u56FE\u7247": { en: "Image" },
  "\u6587\u5B57": { en: "Text" },
  "\u97F3\u9891": { en: "Audio" },
  "\u89C6\u9891": { en: "Video" },
  "\u5185\u5BB9\u4E0D\u5728\u4E86": { en: "Content is gone" },
  "\u5BFC\u5165\u56FE\u7247 / \u97F3\u9891 / \u89C6\u9891 / \u6587\u5B57\u2026": { en: "Import image / audio / video / text\u2026" },
  "\u64AD\u653E": { en: "Play" },
  "\u6682\u505C": { en: "Pause" },
  "\u5FAA\u73AF": { en: "Loop" },
  "\u4E0A\u4E00\u5E27": { en: "Previous frame" },
  "\u4E0B\u4E00\u5E27": { en: "Next frame" },
  "\u53EA\u5728\u5185\u5B58\u91CC\uFF0C\u6CA1\u5B58\u8FDB\u6B4C\u91CC\u2014\u2014\u628A\u8FD9\u4E2A\u6587\u4EF6\u62D6\u8FDB\u6765\uFF0C\u6216\u8005\u70B9 \uFF0B \u91CD\u65B0\u5BFC\u5165\uFF0C\u5C31\u8865\u56DE\u8FD9\u91CC": { en: "Only in memory, not saved in the song \u2014 drag this file in, or re-import with \uFF0B, to fill this spot" },
  "\u7F29\u6210\u5C0F\u56FE\u6807": { en: "Shrink to an icon" },
  "\u70B9\u4E00\u4E0B\u6062\u590D\uFF0C\u6309\u4F4F\u62D6\u52A8\u632A\u4F4D\u7F6E": { en: "Tap to restore, hold and drag to move" },
  "\u526A\u8D34\u677F\u91CC\u6CA1\u6709\u56FE\u7247\u6216\u6587\u5B57": { en: "No image or text on the clipboard" },
  "\u8FD9\u5F20\u56FE\u8FD9\u4E2A\u6D4F\u89C8\u5668\u6253\u4E0D\u5F00{name}": { en: "This browser can't open this image{name}" },
  "\u53C2\u8003\u7A97\uFF1A{message}": { en: "Reference window: {message}" },
  "\u8BA4\u4E0D\u51FA\uFF1A{name}\uFF08\u53C2\u8003\u7A97\u6536\u56FE\u7247\u3001\u97F3\u9891\u548C\u6587\u5B57\uFF09": { en: "Not recognized: {name} (the reference window takes images, audio and text)" },
  "\u6CA1\u52A0\u4E0A\uFF1A{name}\uFF08{message}\uFF09": { en: "Not added: {name} ({message})" },
  "\u51FA\u9519\u4E86": { en: "Something went wrong" },
  "\u52A0\u4E86 {n} \u5F20": { en: "Added {n}" },
  "\u8865\u56DE {n} \u5F20\uFF08\u53EA\u653E\u5185\u5B58\u7684\u7A7A\u4F4D\uFF09": { en: "Filled {n} (memory-only empty slots)" },
  "\u53C2\u8003\u7A97\uFF1A{p}": { en: "Reference window: {p}" },
  "\u7C98\u8D34.{p}": { en: "pasted.{p}" },
  "\u8BFB\u4E0D\u4E86\u526A\u8D34\u677F\uFF1A\u70B9\u4E00\u4E0B\u53C2\u8003\u7A97\uFF0C\u518D\u6309 Ctrl / \u2318+V": { en: "Can't read the clipboard: tap the reference window, then press Ctrl / \u2318+V" },
  "\u8FD9\u9996\u6B4C\u7684\u53C2\u8003\u7A97\u662F\u66F4\u65B0\u7248\u672C\u7684 app \u5B58\u7684\uFF1A\u8FD9\u7248\u6CA1\u6709\u7684\u529F\u80FD\u4FDD\u5B58\u65F6\u4E0D\u4E22\uFF0C\u53EA\u662F\u770B\u4E0D\u5230": { en: "This song's reference window was saved by a newer app: features this version lacks aren't lost on save, they're just not visible" },
  "\u8FD9\u9996\u6B4C\u7684\u53C2\u8003\u7A97\u662F\u66F4\u65B0\u7248\u672C\u7684 app \u5B58\u7684\uFF08\u53C2\u8003\u6E05\u5355\u7B2C {fileVersion} \u7248\uFF0C\u8FD9\u4E00\u7248\u8BA4\u5230\u7B2C {libVersion} \u7248\uFF09\uFF1A\u539F\u6837\u7559\u7740\u3001\u5B58\u7684\u65F6\u5019\u539F\u6837\u5199\u56DE\uFF0C\u8FD9\u91CC\u5148\u4E0D\u663E\u793A": { en: "This song's reference window was saved by a newer app (reference list version {fileVersion}, this version knows up to {libVersion}): kept as is and written back as is, not shown here for now" },
  "\u53C2\u8003\u7A97\u8BFB\u4E0D\u51FA\u6765\uFF1A{Error}\uFF08\u5B57\u8282\u539F\u6837\u7559\u7740\u3001\u5B58\u7684\u65F6\u5019\u539F\u6837\u5199\u56DE\uFF09": { en: "Can't read the reference window: {Error} (bytes stay untouched and are written back as is)" },
  "\u8FD9\u9996\u6B4C\u7684\u53C2\u8003\u7A97\u662F\u66F4\u65B0\u7248\u672C\u7684 app \u5B58\u7684\uFF0C\u8FD9\u4E00\u7248\u5148\u4E0D\u663E\u793A\uFF08\u539F\u6837\u7559\u7740\uFF09": { en: "This song's reference window was saved by a newer app; this version doesn't show it for now (kept as is)" },
  "\u9053 {p}\uFF1A\u5806 {wasm}{p2} + \u5FF5\u7F13\u5B58 {cache}": { en: "Lane {p}: heap {wasm}{p2} + speech cache {cache}" },
  "\uFF08\u521A\u8D77\u6765 {base}\uFF09": { en: " (at startup {base})" },
  "\u5C0F\u6708\u76F8\u5F15\u64CE\u6CA1\u8D77": { en: "Tsukuyomi-chan's engine isn't running" },
  "\u97F3\u9891\u7EBF\u7A0B\uFF1A\u6CA1\u5728\u62A5": { en: "Audio thread: not reporting" },
  "\u97F3\u9891\u7EBF\u7A0B\u6700\u8FD1 1 s \u5FD9 {p}%{AUDIO_HOT}": { en: "Audio thread {p}% busy in the last 1 s{AUDIO_HOT}" },
  "\uFF08\u70ED\uFF1A\u53EF\u80FD\u7206\u97F3\uFF09": { en: " (hot: may crackle)" },
  "\u80FD\u7B97\u5230\u7684\u5360\u7528 {s} / \u9884\u7B97 {total}\uFF08{lanes}\uFF1B\u5F55\u97F3\u623F\u91CC {chunks} \u5757 {chunkBytes}\uFF1B\u97F3\u6E90\u5185\u5B58 {soundMem}\uFF09\u3002{audio}\u3002": { en: "Measured usage {s} / budget {total} ({lanes}; {chunks} chunks {chunkBytes} in the studio; sound memory {soundMem}). {audio}." },
  "\u8FD9\u662F itch \u4E0A\u7684\u8BD5\u73A9\u7248\uFF1A\u9664\u4E86\u7F51\u76D8\u540C\u6B65\uFF0C\u522B\u7684\u90FD\u6709\u3002\u5B8C\u6574\u7248\u5728 {SITE_HOST}": { en: "This is the itch demo: everything except OneDrive sync. The full version is at {SITE_HOST}" },
  "\u8FD9\u662F\u4E0B\u8F7D\u4E0B\u6765\u7684\u5907\u7528\u7248\uFF1A\u9664\u4E86\u7F51\u76D8\u540C\u6B65\uFF0C\u522B\u7684\u90FD\u6709\u3002\u5B8C\u6574\u7248\u5728 {SITE_HOST}": { en: "This is the downloaded standalone version: everything except OneDrive sync. The full version is at {SITE_HOST}" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u6253\u5F00\u5907\u7528\u7248\u6CA1\u6D4B\u8FC7\uFF1A\u8BBE\u7F6E\u548C\u7F13\u5B58\u5B58\u4E0D\u4F4F\uFF08\u5173\u4E86\u5C31\u5FD8\uFF09\uFF0C\u6B4C\u8BF7\u8BB0\u5F97\u300C\u5B58\u300D\u4E0B\u6765\u3002\u9047\u5230\u95EE\u9898\u8BF7\u5230 {REPORT_URL} \u544A\u8BC9\u6211\u4EEC": { en: "This browser hasn't been tested with the standalone version: settings and caches don't persist (forgotten when closed), so remember to \u201CSave\u201D your songs. For problems, tell us at {REPORT_URL}" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u5199\u4E0D\u8FDB\u5B58\u50A8\u4E86\uFF1A\u8FD9\u6B21\u6253\u5F00\u4E4B\u540E\u6539\u7684\u8BBE\u7F6E\u53EA\u7559\u5728\u5185\u5B58\u91CC\uFF0C\u5173\u4E86\u5C31\u5FD8": { en: "This browser can't write to storage: settings changed from now on stay in memory and are forgotten when closed" },
  "\u7F51\u76D8\u5728\u5B98\u7F51": { en: "OneDrive is on the official site" },
  "\u7F51\u76D8\uFF08OneDrive\uFF09\u540C\u6B65\u53EA\u5728\u5B98\u7F51\u7248\u91CC\u6709\uFF1A{SITE_HOST}": { en: "OneDrive sync is only on the official site: {SITE_HOST}" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u5B58\u4E0D\u4F4F\u6B4C\u5E93\uFF08\u5173\u4E86\u5C31\u5FD8\uFF09\uFF1A\u6B4C\u8BF7\u7528\u300C\u5B58\u300D\u4E0B\u8F7D\u6210\u6587\u4EF6\uFF1B\u6B4C\u5E93\u5728\u5B98\u7F51\u7248\u91CC\uFF1A{SITE_HOST}": { en: "This browser can't keep a library (forgotten when closed): use \u201CSave\u201D to download songs as files; the library is on the official site: {SITE_HOST}" },
  "\u6B4C\u5E93\u53EA\u5728\u5B98\u7F51\u7248\u91CC\u6709\uFF08{SITE_HOST}\uFF09\uFF1A\u8FD9\u91CC\u7684\u6B4C\u6CA1\u6709\u6D4F\u89C8\u5668\u5916\u7684\u5BB6\u2014\u2014\u300C\u5B58\u300D= \u4E0B\u8F7D\u6210 .mxl \u6587\u4EF6\uFF0C\u300C\u6253\u5F00\u300D= \u9009\u6587\u4EF6": { en: "The library is only on the official site ({SITE_HOST}): songs here have no home outside the browser \u2014 \u201CSave\u201D = download an .mxl file, \u201COpen\u201D = choose a file" },
  "itch \u7248\u8DDF\u7740 itch \u4E0A\u7684\u7248\u672C\u8D70\uFF1A\u4F5C\u8005\u63A8\u4E86\u65B0\u7248\uFF0C\u5237\u65B0\u8FD9\u4E00\u9875\u5C31\u662F\u65B0\u7684": { en: "The itch version follows what's on itch: when a new version is pushed, refresh this page to get it" },
  "\u5907\u7528\u7248\u4E0D\u4F1A\u81EA\u5DF1\u66F4\u65B0\uFF1A\u8981\u65B0\u7248\u5C31\u91CD\u65B0\u4E0B\u8F7D\u8FD9\u4E2A\u6587\u4EF6\u5939\uFF0C\u6216\u53BB\u5B98\u7F51 {SITE_HOST}": { en: "The standalone version doesn't update itself: for a new version, download this folder again or go to the official site {SITE_HOST}" },
  "\u8FD9\u91CC\u6CA1\u6709\u79BB\u7EBF\u58F3\uFF0C\u4E0D\u7528\u66F4\u65B0": { en: "No offline shell here, nothing to update" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u9009\u4E0D\u4E86\u6587\u4EF6\u5939\uFF08\u684C\u9762\u7248 Chrome / Edge \u53EF\u4EE5\uFF09\uFF0C\u6240\u4EE5\u5907\u7528\u7248\u5728\u8FD9\u91CC\u6CA1\u6709\u6B4C\u5E93\uFF1A\u300C\u5B58\u300D= \u4E0B\u8F7D\u6210 .mxl \u6587\u4EF6\uFF0C\u300C\u6253\u5F00\u300D= \u9009\u6587\u4EF6\uFF1B\u6B4C\u5E93\u4E5F\u5728\u5B98\u7F51\u7248\u91CC\uFF1A{SITE_HOST}": { en: "This browser can't choose folders (desktop Chrome / Edge can), so the standalone version has no library here: \u201CSave\u201D = download an .mxl file, \u201COpen\u201D = choose a file; the library is also on the official site: {SITE_HOST}" },
  "\u53BB\u5B98\u7F51": { en: "Official site" },
  "\u62A5\u544A\u95EE\u9898": { en: "Report a problem" },
  "\u5907\u7528\u7248\uFF1A\u5C0F\u6708\u76F8\u7684\u6A21\u578B\u5305\u5C31\u5728\u8FD9\u4E2A\u6587\u4EF6\u5939\u7684 pwa-models/ \u91CC\uFF0C\u7528\u5230\u624D\u8BFB\u3001\u8BFB\u7684\u65F6\u5019\u6838\u54C8\u5E0C\uFF1B\u4E0D\u7528\u4E0B\u8F7D\u3001\u4E5F\u4E0D\u7528\u5BFC\u5165": { en: "Standalone: Tsukuyomi-chan's model pack is in this folder's pwa-models/, read when needed and hash-checked as it's read; no download or import needed" },
  "\u5907\u7528\u7248\uFF1A\u97F3\u6E90\u5C31\u5728\u8FD9\u4E2A\u6587\u4EF6\u5939\u7684 pwa-sounds/ \u91CC\uFF0C\u7528\u5230\u624D\u8BFB\uFF1B\u6D4F\u89C8\u5668\u7F13\u5B58\u5728\u53CC\u51FB\u6253\u5F00\u7684\u7F51\u9875\u91CC\u7528\u4E0D\u4E86\uFF0C\u8FD9\u91CC\u6CA1\u6709\u300C\u7559\u5728\u8BBE\u5907\u4E0A\u300D\u8FD9\u56DE\u4E8B": { en: "Standalone: sounds are in this folder's pwa-sounds/, read when needed; browser cache doesn't work on pages opened by double-click, so nothing is \u201Ckept on the device\u201D here" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u4E0D\u8BA9\u53CC\u51FB\u6253\u5F00\u7684\u7F51\u9875\u7684\u540E\u53F0\u7EBF\u7A0B\u5B58\u4E1C\u897F\uFF1A\u5FF5\u7F13\u5B58\u53EA\u5728\u5185\u5B58\u91CC\uFF08\u6BCF\u6B21\u6253\u5F00\u7B2C\u4E00\u904D\u8981\u91CD\u5FF5\uFF09": { en: "This browser doesn't let background threads store data on pages opened by double-click: the speech cache is memory-only (the first pass of each session re-speaks)" },
  "\u8FD9\u4EFD mp3 \u653E\u4E0D\u4E86\uFF08\u6587\u4EF6\u574F\u4E86\uFF1F\uFF09": { en: "This mp3 can't be played (damaged file?)" },
  "\u97F3": { en: "Notes" },
  "\u8BCD": { en: "Lyrics" },
  "\u7B26": { en: "Symbols" },
  "\u542C": { en: "Listen" },
  "\u97F3\uFF1A\u5199\u97F3\u548C\u8BB0\u53F7\u2014\u2014\u8C31\u4E0A\u97F3\u548C\u8BB0\u53F7\u90FD\u80FD\u6539\uFF08\u70B9\u97F3 = \u5149\u6807\uFF0C\u7B14 / \u9F20\u6807\u62D6\u97F3 = \u6539\u97F3\u9AD8 / \u65F6\u503C\uFF1B\u70B9\u8BB0\u53F7 = \u5B83\u7684\u83DC\u5355\u3001\u6309\u4F4F\u62D6 = \u632A\uFF09\uFF1B\u5C0F\u952E\u76D8\u9876\u4E0A\u300C\u7B26 / \u97F3\u300D\u5207\u97F3\u952E / \u7B26\u53F7\u683C\uFF0C\u9000\u683C\u5220\u4EC0\u4E48\u8DDF\u7740\u952E\u76D8": { en: "Notes: write notes and marks \u2014 both can be edited on the score (tap a note = cursor, drag with pen / mouse = change pitch / length; tap a mark = its menu, hold and drag = move); the switch above the keys toggles note keys / symbol grid, and Backspace follows the keys" },
  "\u8BCD\uFF1A\u70B9\u97F3\u6216\u5B83\u4E0B\u9762 = \u5199\u8FD9\u4E2A\u97F3\u7684\u6B4C\u8BCD\uFF1B\u6309\u4F4F\u5B57\u62D6 = \u632A / \u5408\uFF1B\u9000\u683C = \u5220\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u7684\u5B57": { en: "Lyrics: tap a note or below it = write its lyric; hold a syllable and drag = move / join; Backspace = delete the syllable of the note before the cursor" },
  "\u7B26\uFF1A\u952E\u76D8 = \u7B26\u53F7\u683C\uFF08\u529B\u5EA6\u3001\u6E10\u5F3A\u6E10\u5F31\u3001\u6F14\u594F\u6CD5\u3001\u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6\u3001\u53CD\u590D\u3001\u98CE\u683C\uFF1B\u9000\u683C = \u5220\u8BB0\u53F7\uFF09\u3002\u8C31\u4E0A\u548C\u300C\u97F3\u300D\u4E00\u6837\uFF1A\u97F3\u548C\u8BB0\u53F7\u90FD\u80FD\u6539": { en: "Symbols: keys = symbol grid (dynamics, hairpins, articulations, key / time / tempo, repeats, style; Backspace = delete marks). On the score it's the same as \u201CNotes\u201D: notes and marks can both be edited" },
  "\u542C\uFF1A\u8C31\u9501\u4F4F\u9632\u8BEF\u89E6\u2014\u2014\u8F7B\u70B9\u53EA\u8BA4\u770B\u8C31\u7684\uFF08\u58F0\u90E8\u540D / \u7FFB\u7EB8 / \u672C\u6BB5\uFF09\uFF0C\u4E0D\u8DF3\u64AD\uFF1B\u957F\u6309 / \u53F3\u952E\u8C31\u9762 = \u4ECE\u8FD9\u513F\u653E / \u63A5\u7740\u653E / \u4ECE\u5934\u653E\uFF1B\u7A7A\u683C = \u653E / \u505C\uFF1B\u5E95\u4E0B\u662F\u6DF7\u97F3\u53F0\uFF08Esc \u56DE\u5230\u5199\uFF09": { en: "Listen: the score locks to prevent accidental edits \u2014 taps only do viewing things (part names / page turns / this section) and never jump playback; long-press / right-click the score = play from here / resume / from the top; Space = play / stop; the mixer sits below (Esc returns to writing)" },
  "\u6CA1\u6709\u51FA\u58F0\uFF1A{e}": { en: "Nothing sounded: {e}" },
  "\u6DF7\u97F3\u2026": { en: "Mixing\u2026" },
  "\u5747\u8861": { en: "EQ" },
  "\u6BCF\u6BB5\u4E00\u4E2A\u53CC\u4E8C\u9636 H(z) = (b0 + b1 z^-1 + b2 z^-2) / (1 + a1 z^-1 + a2 z^-2)\uFF0C\u7CFB\u6570\u6309 RBJ Audio EQ Cookbook\uFF08hp / lp Q = 0.707\uFF1B\u67B6\u5B50 Q = 0.707\uFF1B\u5CF0 Q \u53EF\u8C03\uFF09\u3002hpHz / lpHz = 0 \u5173\u3002": { en: "One biquad per band H(z) = (b0 + b1 z^-1 + b2 z^-2) / (1 + a1 z^-1 + a2 z^-2), coefficients from the RBJ Audio EQ Cookbook (hp / lp Q = 0.707; shelves Q = 0.707; peak Q adjustable). hpHz / lpHz = 0 is off." },
  "\u4F4E\u5207": { en: "Low cut" },
  "\u9AD8\u5207": { en: "High cut" },
  "\u4F4E\u67B6": { en: "Low shelf" },
  "\u4F4E\u67B6\u9891\u7387": { en: "Low shelf freq" },
  "\u4E2D\u5CF0": { en: "Mid peak" },
  "\u4E2D\u5CF0\u9891\u7387": { en: "Mid peak freq" },
  "\u4E2D\u5CF0\u5BBD": { en: "Mid peak width" },
  "\u9AD8\u67B6": { en: "High shelf" },
  "\u9AD8\u67B6\u9891\u7387": { en: "High shelf freq" },
  "\u538B\u7F29": { en: "Compressor" },
  "\u5305\u7EDC e[n] = max(|x|, e[n-1]\xB7r) \u8D77\uFF08attack\uFF09\u843D\uFF08release\uFF09\u5404\u4E00\u4E2A\u65F6\u95F4\u5E38\u6570\uFF1B\u8D85\u8FC7 threshold \u7684\u90E8\u5206\u6309 ratio \u538B\uFF08kneeDb \u5185\u8F6F\u62D0\u70B9\uFF1Ag = -(x - T + K/2)^2 \xB7 (1 - 1/R) / (2K)\uFF09\uFF1B\u589E\u76CA = 10^(g/20) \xD7 10^(makeup/20)\u3002key \u7ED9\u4E86 = \u542C\u522B\u7684\u8F68\uFF08\u4FA7\u94FE\uFF09\uFF0C\u4E0D\u7ED9 = \u542C\u81EA\u5DF1\u3002": { en: "Envelope e[n] = max(|x|, e[n-1]\xB7r) with one time constant each for attack and release; above the threshold, compressed by ratio (soft knee within kneeDb: g = -(x - T + K/2)^2 \xB7 (1 - 1/R) / (2K)); gain = 10^(g/20) \xD7 10^(makeup/20). With a key = listens to another track (sidechain); without = listens to itself." },
  "\u9608\u503C": { en: "Threshold" },
  "\u6BD4\u4F8B": { en: "Ratio" },
  "\u8D77": { en: "Attack" },
  "\u843D": { en: "Release" },
  "\u62D0\u70B9": { en: "Knee" },
  "\u8865\u507F": { en: "Makeup" },
  "\u5EF6\u8FDF": { en: "Delay" },
  "y[n] = x[n]\xB7dry + d[n]\xB7mix\uFF08dry \u6CA1\u5199 = 1 \u2212 mix\uFF0Cv0.10.10 \u524D\u7684\u5199\u6CD5\uFF09\uFF0Cd[n] = x[n - D] + fb \xB7 LP(d[n - D])\uFF0CLP = \u4E00\u9636\u4F4E\u901A dampHz\u3002D = timeMs\uFF08\u6700\u957F 2 s\uFF09\u3002": { en: "y[n] = x[n]\xB7dry + d[n]\xB7mix (no dry = 1 \u2212 mix, the pre-v0.10.10 form), d[n] = x[n - D] + fb \xB7 LP(d[n - D]), LP = one-pole low-pass dampHz. D = timeMs (up to 2 s)." },
  "\u65F6\u95F4": { en: "Time" },
  "\u53CD\u9988": { en: "Feedback" },
  "\u6E7F": { en: "Wet" },
  "\u539F\u58F0": { en: "Dry" },
  "\u53CD\u9988\u9AD8\u5207": { en: "Feedback high cut" },
  "\u6DF7\u54CD": { en: "Reverb" },
  "Freeverb\uFF1A8 \u6761\u4F4E\u901A\u53CD\u9988\u68B3\u72B6\uFF08\u957F\u5EA6 1116\u20261617 @44.1k\uFF0C\u6309\u91C7\u6837\u7387\u7F29\u653E\uFF1B\u53CD\u9988 = 0.7 + 0.28\xB7room\uFF0C\u4F4E\u901A = damp\uFF09\u5E76\u8054\uFF0C\u518D\u4E32 4 \u6761\u5168\u901A\uFF08g = 0.5\uFF09\uFF1B\u53F3\u8FB9\u5404\u957F 23 \u4E2A\u91C7\u6837\uFF1B\u524D\u9762\u4E00\u6BB5 preDelayMs \u7EAF\u5EF6\u8FDF\uFF1By = x\xB7(1-mix) + wet\xB7mix\u3002": { en: "Freeverb: 8 low-pass feedback combs in parallel (lengths 1116\u20261617 @44.1k, scaled by sample rate; feedback = 0.7 + 0.28\xB7room, low-pass = damp), then 4 all-pass in series (g = 0.5); the right side is 23 samples longer each; a preDelayMs pure delay in front; y = x\xB7(1-mix) + wet\xB7mix." },
  "\u623F\u95F4\u5927\u5C0F": { en: "Room size" },
  "\u9AD8\u9891\u5438\u6536": { en: "Damping" },
  "\u9884\u5EF6\u8FDF": { en: "Pre-delay" },
  "\u5BBD\u5EA6": { en: "Width" },
  "\u5408\u5531": { en: "Chorus" },
  "v \u6761\u5EF6\u8FDF d_k(t) = delayMs + depthMs \xB7 sin(2\u03C0 \xB7 rateHz \xB7 t + 2\u03C0k/v)\uFF08\u7EBF\u6027\u63D2\u503C\u8BFB\uFF09\uFF0C\u7B2C k \u6761\u6446\u5728 pan_k = spread \xB7 (2k/(v-1) - 1)\uFF1By = x\xB7(1-mix) + mix \xB7 \u03A3_k d_k / v\u3002": { en: "v delays d_k(t) = delayMs + depthMs \xB7 sin(2\u03C0 \xB7 rateHz \xB7 t + 2\u03C0k/v) (read with linear interpolation), voice k placed at pan_k = spread \xB7 (2k/(v-1) - 1); y = x\xB7(1-mix) + mix \xB7 \u03A3_k d_k / v." },
  "\u51E0\u6761": { en: "Voices" },
  "\u6296\u52A8\u6DF1\u5EA6": { en: "Depth" },
  "\u6296\u52A8\u5FEB\u6162": { en: "Rate" },
  "\u5DE6\u53F3\u94FA\u5F00": { en: "Spread" },
  "\u589E\u76CA": { en: "Gain" },
  "{kind}\uFF1A\u8FD9\u4E00\u7248\u4E0D\u8BA4\u8BC6": { en: "{kind}: not recognized by this version" },
  "\u8FD8\u6CA1\u6709\u4EBA\u4E0A\u573A": { en: "Nobody on stage yet" },
  "\u300C{label}\u300D\u4E0D\u4F1A\u6309\u97F3\u7B26\u8868\u51FA\u58F0": { en: "\u201C{label}\u201D can't sound from a note list" },
  "\u8BD5\u542C\u5143\u97F3\u8868\uFF1A{Error}\uFF08\u5148\u8DD1 node scripts/gen-preview-vowels.mjs\uFF1F\uFF09": { en: "Audition vowel table: {Error} (run node scripts/gen-preview-vowels.mjs first?)" },
  "\u6807\u51C6": { en: "Standard" },
  "\u7ACB\u4F53\u58F0 192k\uFF0C\u7EA6 1.4 MB / \u5206\u949F": { en: "Stereo 192k, about 1.4 MB / min" },
  "\u5C0F\u6587\u4EF6": { en: "Small file" },
  "\u5355\u58F0\u9053 64k\uFF0C\u7EA6 0.5 MB / \u5206\u949F": { en: "Mono 64k, about 0.5 MB / min" },
  "mp3 \u7F16\u7801 worker \u51FA\u9519": { en: "mp3 encoder worker error" },
  "\u5B57\u4F53\u4E0B\u4E0D\u6765\uFF08{Error}\uFF09": { en: "Couldn't download the font ({Error})" },
  "\u97F3\u4E50\u5B57\u5F62\u4E0B\u4E0D\u6765\uFF08{Error}\uFF09": { en: "Couldn't download the music glyphs ({Error})" },
  "\u8FD9\u9996\u6B4C": { en: "This song" },
  "\uFF08\u6CA1\u58F0\u660E\u8BB8\u53EF\uFF09": { en: "(no license stated)" },
  "\u4FDD\u7559\u6240\u6709\u6743\u5229": { en: "All rights reserved" },
  "\u4EC0\u4E48\u90FD\u8981\u5148\u95EE\u4F60\uFF08\u6CD5\u5F8B\u9ED8\u8BA4\u5C31\u662F\u8FD9\u6837\uFF0C\u8FD9\u91CC\u53EA\u662F\u5199\u660E\uFF09": { en: "Everyone must ask you first for anything (that's the legal default; this just says so)" },
  "\xA9 {y} \u4FDD\u7559\u6240\u6709\u6743\u5229": { en: "\xA9 {y} All rights reserved" },
  "\u4EC5\u4F9B\u6B23\u8D4F": { en: "For listening only" },
  "\u542C\u53EF\u4EE5\uFF1B\u8F6C\u8F7D\u3001\u6539\u7F16\u3001\u5546\u7528\u90FD\u8981\u5148\u95EE\u4F60": { en: "Listening is fine; reposting, adapting and commercial use must ask you first" },
  "\xA9 {y} \u4FDD\u7559\u6240\u6709\u6743\u5229\u3002\u4EC5\u4F9B\u4E2A\u4EBA\u6B23\u8D4F\uFF0C\u7981\u6B62\u8F6C\u8F7D\u3001\u6539\u7F16\u3001\u5546\u7528\u3002": { en: "\xA9 {y} All rights reserved. For personal listening only; no reposting, adaptation or commercial use." },
  "\u5546\u7528\u8BF7\u8054\u7CFB": { en: "Contact for commercial use" },
  "\u4FDD\u7559\u6240\u6709\u6743\u5229\uFF0C\u5E76\u544A\u8BC9\u522B\u4EBA\u5546\u7528\u600E\u4E48\u627E\u4F60": { en: "All rights reserved, plus telling people how to reach you for commercial use" },
  "\xA9 {y} \u4FDD\u7559\u6240\u6709\u6743\u5229\u3002\u5546\u7528\u8BF7\u8054\u7CFB\u4F5C\u8005\u3002": { en: "\xA9 {y} All rights reserved. Contact the author for commercial use." },
  "\u6CE8\u660E\u51FA\u5904\u53EF\u4EE5\u539F\u6837\u8F6C\u53D1\uFF1B\u4E0D\u8BB8\u6539\u3001\u4E0D\u8BB8\u5546\u7528\uFF08\u6700\u7D27\u7684 CC\uFF09": { en: "Can be reshared unchanged with credit; no changes, no commercial use (the strictest CC)" },
  "\u6CE8\u660E\u51FA\u5904\u53EF\u4EE5\u6539\uFF1B\u4E0D\u8BB8\u5546\u7528": { en: "Can be changed with credit; no commercial use" },
  "\u6CE8\u660E\u51FA\u5904\u53EF\u4EE5\u6539\u3001\u53EF\u4EE5\u5546\u7528\uFF1B\u6539\u4E86\u7684\u8981\u7528\u540C\u6837\u7684\u8BB8\u53EF": { en: "Can be changed and used commercially with credit; changes must use the same license" },
  "\u6CE8\u660E\u51FA\u5904\u968F\u4FBF\u7528": { en: "Free to use with credit" },
  "\u653E\u5F03\u6743\u5229\uFF0C\u8C01\u90FD\u80FD\u968F\u4FBF\u7528\uFF08\u53D1\u51FA\u53BB\u6536\u4E0D\u56DE\uFF09": { en: "Rights waived, anyone can use it freely (can't be taken back once published)" },
  "\u4F60\u9009\u7684\u8BB8\u53EF\u5141\u8BB8\u522B\u4EBA\u6539\u7F16 / \u5F53\u7D20\u6750\u518D\u7528\uFF0C\u53EF\u91CC\u9762\u6709\u5C0F\u6708\u76F8\u7684\u58F0\u97F3\uFF0C\u5C0F\u6708\u76F8\u7684\u6761\u6B3E\u4E0D\u8BB8\u8FD9\u6837\u516C\u5F00\uFF08\u8BBE\u7F6E\u91CC\u6709\u539F\u6587\u548C\u8BD1\u6587\uFF09\uFF0C\u6240\u4EE5\u5BFC\u51FA\u65F6\u8BB8\u53EF\u90A3\u4E00\u9879\u6309\u300C\u672A\u58F0\u660E\u300D\u5199\uFF1B\u4F60\u5728\u8FD9\u91CC\u7684\u9009\u62E9\u6CA1\u52A8\u3002": { en: "The license you chose lets others adapt or reuse this as material, but it contains Tsukuyomi-chan's voice, and her terms don't allow that publicly (original and translation are in Settings), so exports write the license as \u201Cnot stated\u201D; your choice here is unchanged." },
  "\u8BB8\u53EF\u8BC1\u4E0D\u660E": { en: "License unknown" },
  "\uFF08\u6CA1\u6709\u7F72\u540D\u4FE1\u606F\uFF09": { en: "(no credit information)" },
  "{ly} \u8BCD\u66F2": { en: "Lyrics & music: {ly}" },
  "{ly} \u8BCD": { en: "Lyrics: {ly}" },
  "{co} \u66F2": { en: "Music: {co}" },
  "{a} \u7F16\u66F2": { en: "Arranged by {a}" },
  "\u8FD9\u4EFD MusicXML \u662F timewise \u6392\u6CD5\uFF0C\u8FD9\u4E00\u7248\u53EA\u8BFB partwise": { en: "This MusicXML is timewise; this version only reads partwise" },
  "\u8FD9\u4E0D\u662F MusicXML \u4E50\u8C31\uFF08\u6839\u5143\u7D20\u662F <{name}>\uFF09": { en: "This isn't a MusicXML score (root element is <{name}>)" },
  "\u8FD9\u4EFD MusicXML \u91CC\u6CA1\u6709\u58F0\u90E8": { en: "This MusicXML has no parts" },
  "\u548C\u5F26\u8BB0\u53F7\uFF08\u6CA1\u6807\u5728\u4E00\u4E2A\u97F3\u7684\u5F00\u5934\uFF09": { en: "Chord symbols (not at the start of a note)" },
  "\u548C\u5F26\u8BB0\u53F7\uFF08\u8FD9\u4E00\u7248\u4E0D\u8BA4\u7684\u79CD\u7C7B\uFF09": { en: "Chord symbols (a kind this version doesn't know)" },
  "\u6F14\u594F\u6CD5\u8BB0\u53F7\uFF08\u8FD9\u4E00\u7248\u4E0D\u8BA4\u7684\uFF09": { en: "Articulation marks (not recognized by this version)" },
  "\u529B\u5EA6\u8BB0\u53F7\uFF08\u8FD9\u4E00\u7248\u4E0D\u8BA4\u7684\uFF0C\u5982 sfz\uFF09": { en: "Dynamic marks (not recognized by this version, such as sfz)" },
  "\u6309\u62CD\u5B50\u91CD\u590D\u7684\u98A4\u97F3\uFF08\u4E00\u4E24\u9053\u659C\u7EBF\uFF09": { en: "Measured tremolo (one or two slashes)" },
  "\u5927\u8C31\u8868\u4E0B\u9762\u4E00\u884C\u7684\u6362\u8C31\u53F7": { en: "clef changes on the lower staff of a grand staff" },
  "\u88C5\u9970\u97F3": { en: "Grace notes" },
  "\u63D0\u793A\u97F3\u7B26": { en: "Cue notes" },
  "\u540C\u4E00\u58F0\u90E8\u91CC\u7684\u7B2C\u4E8C\u6761\u65CB\u5F8B": { en: "A second melody within one part" },
  "\u53E0\u97F3\uFF08\u524D\u9762\u6CA1\u6709\u80FD\u53E0\u7684\u97F3\uFF09": { en: "Stacked notes (with nothing before to stack on)" },
  "\u6CA1\u6709\u97F3\u9AD8\u7684\u97F3\uFF08\u6253\u51FB\u4E50\uFF09": { en: "Unpitched notes (percussion)" },
  "\u7B2C\u4E8C\u6BB5\u53CA\u4EE5\u540E\u7684\u6B4C\u8BCD": { en: "Lyrics beyond the first verse" },
  "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04\uFF08\u884D\u751F\u6A21\u578B\uFF09": { en: "Tsukuyomi-chan Corpus Terms of Use (derived model)" },
  "\u5C0F\u6708\u76F8": { en: "Tsukuyomi-chan" },
  "\u5C0F\u6708\u76F8\uFF08\u5143\u97F3\uFF09": { en: "Tsukuyomi-chan (vowels)" },
  "\u9EA6\u514B\u98CE {t}": { en: "Mic {t}" },
  "\u53C2\u8003\u7A97\u7684\u6587\u4EF6\u4E0D\u5728 {REFERENCES_DIR} \u4E0B\uFF1A{path}": { en: "A reference window file isn't under {REFERENCES_DIR}: {path}" },
  "\u9EA6\u514B\u98CE {x}": { en: "Mic {x}" },
  "\u4E0A\u573A\u7684\u5019\u9009\u4E0D\u80FD\u5220\uFF0C\u5148\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D": { en: "The candidate on stage can't be deleted; change \u201CWho performs\u201D first" },
  "\u89D2\u8272": { en: "role" },
  "\u6DF7\u97F3\u8F68": { en: "Bus" },
  "\u6F14\u594F\u8005": { en: "performer" },
  "\u6548\u679C\u683C": { en: "effect slot" },
  "\u6548\u679C\u7684\u79CD\u7C7B": { en: "effect type" },
  "\u8FD9\u9996\u6B4C\u7684\u6587\u4EF6\u91CC\u6709\u4E0D\u5408\u89C4\u77E9\u7684\u7F16\u53F7\uFF08{what}\uFF09\uFF1A\u591A\u534A\u662F\u88AB\u522B\u7684\u5DE5\u5177\u6539\u8FC7\u6216\u8005\u6587\u4EF6\u574F\u4E86\uFF0C\u6CA1\u6709\u6253\u5F00\u3002": { en: "This song file contains malformed internal IDs ({what}): it was probably edited by another tool or is damaged, so it was not opened." },
  "{k} {n} \u4E2A": { en: "{n} \xD7 {k}" },
  "\u8FD9\u4E2A\u6587\u4EF6\u89E3\u4E0D\u5F00\uFF08\u4E0D\u662F\u5B8C\u6574\u7684 .mxl\uFF1F\uFF09\uFF1A{Error}": { en: "This file can't be unpacked (not a complete .mxl?): {Error}" },
  "\u8FD9\u4E2A\u538B\u7F29\u5305\u91CC\u6CA1\u6709 META-INF/container.xml\uFF0C\u4E0D\u662F .mxl": { en: "This archive has no META-INF/container.xml, so it's not an .mxl" },
  "container.xml \u6307\u7684\u4E3B\u4E50\u8C31\u5728\u5305\u91CC\u627E\u4E0D\u5230": { en: "The main score named in container.xml isn't in the archive" },
  "{p} \u8BFB\u4E0D\u61C2\uFF08\u6587\u4EF6\u574F\u4E86\uFF1F\uFF09": { en: "{p} can't be read (damaged file?)" },
  "\u8FD9\u9996\u6B4C\u662F\u66F4\u65B0\u7248\u672C\u7684 MoonSinger \u5B58\u7684\uFF08{what} \u7B2C {major} \u7248\uFF0C\u8FD9\u4E00\u7248\u53EA\u8BA4\u5230\u7B2C {p} \u7248\uFF09\uFF0C\u6253\u5F00\u518D\u5B58\u4F1A\u4E22\u4E1C\u897F\uFF0C\u6240\u4EE5\u6CA1\u6709\u6253\u5F00\u3002\u8BF7\u5148\u66F4\u65B0 app\u3002": { en: "This song was saved by a newer MoonSinger ({what} version {major}, this version knows up to {p}); opening and saving would lose data, so it wasn't opened. Please update the app first." },
  "\u603B\u76EE\u5F55": { en: "The manifest" },
  "\u8C31\u7684\u6269\u5C55": { en: "The score extension" },
  "\u4F11\u606F\u5BA4\u300C{name}\u300D": { en: "Green room \u201C{name}\u201D" },
  "\u5F55\u97F3\u623F": { en: "The studio" },
  "\u7EB8\u300C{id}\u300D\u7684\u8C31\uFF08{file}\uFF09\u5728\u5305\u91CC\u627E\u4E0D\u5230": { en: "Score of sheet \u201C{id}\u201D ({file}) isn't in the archive" },
  "\u8FD9\u9996\u6B4C\u662F\u66F4\u65B0\u7248\u672C\u7684 MoonSinger \u5B58\u7684\uFF08{p}\u91CC\u6709\u8FD9\u4E00\u7248\u8FD8\u6CA1\u6709\u7684\u4E1C\u897F\uFF09\uFF1A\u7167\u6837\u80FD\u5F00\u80FD\u6539\u80FD\u5B58\uFF0C\u53EA\u662F\u90A3\u4E9B\u4E1C\u897F\u8FD9\u4E00\u7248\u770B\u4E0D\u5230\uFF0C\u5728\u8FD9\u4E00\u7248\u91CC\u5B58\u4E00\u6B21\uFF0C\u5176\u4E2D\u4E00\u90E8\u5206\u4F1A\u4E22\u3002\u60F3\u539F\u6837\u7559\u7740\uFF0C\u5148\u66F4\u65B0 app \u518D\u6539\u3002": { en: "This song was saved by a newer MoonSinger ({p} has things this version doesn\u2019t know): you can still open, edit and save it, but this version can\u2019t show those things, and saving it here will lose some of them. To keep them as they are, update the app before editing." },
  "\u58F0\u90E8\u300C{name}\u300D\u548C\u522B\u7684\u58F0\u90E8\u5171\u7528\u4E00\u4EFD\u4E50\u5668\u8BBE\u7F6E\uFF1B\u6BCF\u4E2A\u58F0\u90E8\u6709\u81EA\u5DF1\u7684\u4E50\u5668\uFF0C\u6240\u4EE5\u62C6\u6210\u4E86\u4E24\u4EFD\uFF08\u4E50\u5668\u548C\u8BBE\u7F6E\u90FD\u7167\u6284\uFF09\u3002": { en: "Part \u201C{name}\u201D shared its instrument settings with another part; every part has its own instrument, so they were split into two copies (instrument and settings copied)." },
  "\u8FD9\u4EFD\u8C31\u91CC\u6709\u8FD9\u4E00\u7248\u8FD8\u4E0D\u652F\u6301\u7684\u4E1C\u897F\uFF0C\u6CA1\u6709\u8BFB\u8FDB\u6765\uFF1A{k}\u3002\u5B58\u7684\u65F6\u5019\u5B83\u4EEC\u4E0D\u4F1A\u5728\u65B0\u6587\u4EF6\u91CC\u2014\u2014\u8981\u7559\u539F\u6837\uFF0C\u8BF7\u300C\u53E6\u5B58\u4E3A\u300D\u65B0\u6587\u4EF6\u3002": { en: "This score has things this version doesn't support, which weren't read: {k}. They won't be in a new file when saving \u2014 to keep them, save as a new file." },
  "{k} {n} \u5904": { en: "{k} at {n} places" },
  "\u539F\u6765\u7684\u4E50\u5668": { en: "The original instrument" },
  "\u58F0\u90E8\u300C{name}\u300D\u539F\u6765\u662F{was}{gm}\uFF1B\u8FD9\u4E00\u7248\u6CA1\u6709\u8FD9\u4EF6\u4E50\u5668\uFF0C\u6240\u4EE5\u8FD8\u6CA1\u4EBA\u4E0A\u573A\u3002\u8981\u5C0F\u6708\u76F8\u6765\u5531\uFF0C\u70B9\u8C31\u524D\u9762\u7684\u300C{name2}\u300D\uFF0C\u5728\u300C\u8C01\u6765\u6F14\u300D\u9009\u5C0F\u6708\u76F8\u3002": { en: "Part \u201C{name}\u201D used to be {was}{gm}; this version doesn't have that instrument, so nobody is on stage yet. To have Tsukuyomi-chan sing it, tap \u201C{name2}\u201D at the front of the score and choose her under \u201CWho performs\u201D." },
  "\uFF08GM {gm} \u53F7\uFF09": { en: " (GM {gm})" },
  "\u300C{name}\u300D\u7684\u58F0\u97F3\uFF08{path}\uFF09\u6CA1\u968F\u8FD9\u9996\u6B4C\u4E00\u8D77\u5E26\u6765\uFF0C\u6240\u4EE5\u6CA1\u4EBA\u4E0A\u573A\u3002\u70B9\u8C31\u524D\u9762\u7684\u300C{name2}\u300D\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D\u3002": { en: "The sound of \u201C{name}\u201D ({path}) didn't come with this song, so nobody is on stage. Tap \u201C{name2}\u201D at the front of the score to change \u201CWho performs\u201D." },
  "XML \u8BFB\u4E0D\u61C2\uFF08\u7B2C {i} \u884C\uFF09\uFF1A{what}": { en: "Can't read the XML (line {i}): {what}" },
  "\u6CE8\u91CA\u6CA1\u6536\u5C3E": { en: "Unterminated comment" },
  "CDATA \u6CA1\u6536\u5C3E": { en: "Unterminated CDATA" },
  "\u5904\u7406\u6307\u4EE4\u6CA1\u6536\u5C3E": { en: "Unterminated processing instruction" },
  "\u7ED3\u675F\u6807\u7B7E\u6CA1\u6536\u5C3E": { en: "Unterminated end tag" },
  "\u7ED3\u675F\u6807\u7B7E </{name}> \u5BF9\u4E0D\u4E0A <{top}>": { en: "End tag </{name}> doesn't match <{top}>" },
  "\u6807\u7B7E\u540D": { en: "Tag name" },
  "<{name}> \u91CC\u6709\u8BFB\u4E0D\u61C2\u7684\u4E1C\u897F": { en: "Something unreadable inside <{name}>" },
  "<{name}> \u6CA1\u6709\u7ED3\u675F": { en: "<{name}> has no end" },
  "\u6CA1\u6709\u6839\u5143\u7D20": { en: "No root element" },
  "\u8FD8\u6CA1\u6709\u6B4C\u3002\u70B9\u300C\u65B0\u5EFA\u300D\u5199\u4E00\u9996\uFF0C\u6216\u628A .mxl \u62D6\u8FDB\u6765\u3002": { en: "No songs yet. Tap \u201CNew\u201D to write one, or drag in an .mxl." },
  "\u8FD9\u4E2A\u5939\u91CC\u8FD8\u6CA1\u6709\u6B4C\u3002": { en: "No songs in this folder yet." },
  "\u56DE\u6536\u7AD9\u662F\u7A7A\u7684\u3002": { en: "The trash is empty." },
  "\u6253\u5F00\u4E2D": { en: "Open now" },
  "\u6B4C\u5E93": { en: "Library" },
  "\u4E91\u7AEF\uFF1A\u767B\u5F55 / \u9000\u51FA": { en: "Cloud: sign in / out" },
  "\u5373\u5174\uFF1A\u6311\u4E50\u5668\u3001\u7528\u952E\u76D8\u5F39\u7740\u73A9\uFF08\u4E0D\u5199\u8FDB\u54EA\u9996\u6B4C\uFF09": { en: "Jam: pick an instrument and play on the keys for fun (not written into any song)" },
  "\u5373\u5174": { en: "Jam" },
  "\u65B0\u5EFA\uFF1A\u4E00\u9996\u6B4C / \u4E00\u4E2A\u6587\u4EF6\u5939": { en: "New: a song / a folder" },
  "\u56DE\u6536\u7AD9\u548C\u5907\u4EFD\u7BB1": { en: "Trash and backups" },
  "\u56DE\u5230\u6B4C": { en: "Back to the song" },
  "\u56DE\u6536\u7AD9": { en: "Trash" },
  "\u5907\u4EFD\u7BB1": { en: "Backups" },
  "\u65E7": { en: "outdated" },
  "\u6E32\u67D3\u7F13\u5B58\u91CC\u90A3\u4E00\u904D\u662F\u6539\u4E4B\u524D\u6E32\u7684\uFF08\u4E4B\u540E\u6539\u8FC7\uFF09": { en: "The render cache has a render from before later changes" },
  "\u6539\u4E8E {lastModified}": { en: "Changed {lastModified}" },
  "\u6E32\u67D3\u7F13\u5B58\u91CC\u8FD8\u6CA1\u6709\u8FD9\u9996\uFF1A\u70B9 = \u6E32\u67D3\uFF08\u4E4B\u540E\u5C01\u9762\u4E0A\u80FD\u76F4\u63A5\u542C\uFF09": { en: "Not in the render cache yet: tap to render (then play it from the cover)" },
  "\u6682\u505C\uFF08\u5E95\u8FB9\u64AD\u653E\u6761\u4E0A\u4E5F\u80FD\u63A7\uFF09": { en: "Pause (also on the bottom player bar)" },
  "\u64AD\u653E\u6E32\u67D3\u7F13\u5B58\u91CC\u4E0A\u6B21\u6E32\u7684\u90A3\u4E00\u904D\uFF08\u4E4B\u540E\u6539\u8FC7\uFF0C{p} \u79D2\uFF09": { en: "Play the last render from the render cache (outdated: changed since; {p} s)" },
  "\u64AD\u653E\u6E32\u67D3\u7F13\u5B58\u91CC\u7684\u8FD9\u4E00\u904D\uFF08{p} \u79D2\uFF09": { en: "Play from render cache ({p} s)" },
  "\u542C\u6B4C\u91CC\u5E26\u7740\u7684\u90A3\u4EFD mp3\uFF08{p} \u79D2\uFF09": { en: "Play the mp3 stored inside the song ({p} s)" },
  "\u4ECE\u5934\u653E\uFF08\u9501\u5C4F / \u8033\u673A\u7684\u300C\u4E0A\u4E00\u9996\u300D\u4E5F\u662F\uFF09": { en: "From the top (\u201Cprevious track\u201D on the lock screen / headphones too)" },
  "\u653E / \u6682\u505C": { en: "Play / pause" },
  "\u6309\u73B0\u5728\u7684\u6837\u5B50\u91CD\u65B0\u6E32\u4E00\u904D": { en: "Render again as it is now" },
  "\u91CD\u65B0\u6E32\u67D3": { en: "Render again" },
  "\u5206\u4EAB / \u4E0B\u8F7D\u8FD9\u9996\u7684 mp3": { en: "Share / download this song\u2019s mp3" },
  "\u505C": { en: "Stop" },
  "{stem} \xB7 \u65E7\uFF08\u4E4B\u540E\u6539\u8FC7\uFF09": { en: "{stem} \xB7 outdated (changed since)" },
  "\u8FD9\u4E00\u904D\u662F\u4E4B\u524D\u6E32\u7684\uFF1A\u5FAA\u73AF\u8981\u7B49\u4F59\u97F3\u653E\u5B8C\u624D\u56DE\u5230\u5F00\u5934\u3002\u91CD\u65B0\u6E32\u4E00\u904D\uFF0C\u5FAA\u73AF\u5C31\u6309\u8C31\u5207\uFF08\u548C\u7F16\u8F91\u5668\u91CC\u4E00\u6837\uFF09": { en: "This render is from before: looping waits for the tail to die out before starting over. Render again and the loop cuts by the score, like in the editor" },
  "\u5355\u66F2\u5FAA\u73AF\uFF1A\u5F00\u7740\uFF08\u653E\u5B8C\u4ECE\u5934\u518D\u653E\uFF0C\u9501\u5C4F\u4E5F\u4E00\u6837\uFF09": { en: "Loop song: on (restarts at the end, on the lock screen too)" },
  "\u5355\u66F2\u5FAA\u73AF\uFF1A\u5173\u7740\uFF08\u653E\u5B8C\u5C31\u505C\uFF09": { en: "Loop song: off (stops at the end)" },
  "\u6E32\u67D3\u7F13\u5B58\u91CC\u8FD8\u6CA1\u6709\u8FD9\u9996\uFF1A\u70B9\u5B83\u5C01\u9762\u4E0A\u7684\u94AE\u6E32\u67D3\uFF0C\u6216\u8005\u6253\u5F00\u5B83\u7528\u4E09\u6761\u6760\u91CC\u7684\u300C\u6E32\u67D3\u5230\u7F13\u5B58\u300D\u3002": { en: "This song isn\u2019t in the render cache yet: tap the button on its cover to render it, or open it and use \u201CRender to cache\u201D in the \u2630 menu." },
  "\u53D6\u300C{stem}\u300D\u7684\u58F0\u97F3\u2026": { en: "Getting the audio for \u201C{stem}\u201D\u2026" },
  "\u8FD9\u53F0\u8BBE\u5907\u4E0A\u8BB0\u7740\u7684\u90A3\u4E00\u904D": { en: "Remembered on this device" },
  "mp3 \u6CA1\u53D6\u5230\uFF08{blob}\uFF09": { en: "Couldn't get the mp3 ({blob})" },
  "\u7A7A": { en: "empty" },
  "\u6B4C\u91CC\u5E26\u7740\u7684\u90A3\u4EFD mp3": { en: "The mp3 stored inside the song" },
  "\u6CA1\u80FD\u81EA\u5DF1\u5F00\u59CB\u653E\uFF1A\u70B9\u5E95\u8FB9\u64AD\u653E\u6761\u4E0A\u7684 \u25B6": { en: "Couldn't start playing by itself: tap \u25B6 on the bottom player bar" },
  "\u6B4C\u5E93\u8FD8\u6CA1\u63A5\u4E0A\uFF0C\u5EFA\u4E0D\u4E86\u6587\u4EF6\u5939": { en: "The library isn't connected yet, so folders can't be created" },
  "\u65B0\u5EFA\u6587\u4EF6\u5939": { en: "New folder" },
  "\u65B0\u6587\u4EF6\u5939": { en: "New folder" },
  "\u6587\u4EF6\u5939\u540D": { en: "Folder name" },
  "\u6587\u4EF6\u5939\u540D\u4E0D\u80FD\u7A7A\u7740": { en: "Folder name can't be empty" },
  '\u6587\u4EF6\u5939\u540D\u91CC\u4E0D\u80FD\u6709 / \\ : * ? " < > |\uFF0C\u4E5F\u4E0D\u80FD\u7528\u70B9\u6216\u7A7A\u683C\u5F00\u5934 / \u7ED3\u5C3E\uFF08OneDrive \u4E0D\u6536\uFF09': { en: `Folder names can't contain / \\ : * ? " < > |, or start / end with a dot or space (OneDrive rejects them)` },
  "\u65B0\u5EFA\u6587\u4EF6\u5939\u300C{n}\u300D\u2026": { en: "Creating folder \u201C{n}\u201D\u2026" },
  "\u300C{n}\u300D\u8FD9\u4E2A\u540D\u5B57\u5DF2\u7ECF\u6709\u4E86\uFF08\u540C\u540D\u7684\u6B4C\u6216\u6587\u4EF6\u5939\uFF09": { en: "\u201C{n}\u201D already exists (a song or folder with that name)" },
  "\u5EFA\u597D\u4E86\u6587\u4EF6\u5939\u300C{n}\u300D": { en: "Created folder \u201C{n}\u201D" },
  "\u65B0\u5EFA\u6587\u4EF6\u5939\u6CA1\u6210\u529F\uFF1A{Error}": { en: "Couldn't create folder: {Error}" },
  "\u65B0\u5EFA\u6B4C": { en: "New song" },
  "\u5728\u73B0\u5728\u8FD9\u4E2A\u5939\u91CC": { en: "In this folder" },
  "\u65B0\u5EFA\u6587\u4EF6\u5939\u2026": { en: "New folder\u2026" },
  "\u6B4C\u5E93\u5728\u6587\u4EF6\u5939\u300C{folder}\u300D": { en: "Library is in folder \u201C{folder}\u201D" },
  "\u4E91\u7AEF\uFF1A\u5DF2\u767B\u5F55{p}": { en: "Cloud: signed in{p}" },
  "\u4E91\u7AEF\uFF1A\u6CA1\u767B\u5F55\uFF08\u6B4C\u53EA\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF09": { en: "Cloud: not signed in (songs only on this device)" },
  "{file} \u548C app \u5185\u5D4C\u7684\u4E0D\u4E00\u6837\uFF08\u88AB\u6539\u8FC7\uFF1F\uFF09": { en: "{file} differs from the copy built into the app (modified?)" },
  "\u9F13\u4EF6 {note}": { en: "Drum piece {note}" },
  "{zh}\u7684\u5E38\u7528\u97F3\u57DF{basis}": { en: "Common range of {zh}{basis}" },
  "\uFF08\u4F9D\u636E\uFF1A{basis}\uFF09": { en: " (basis: {basis})" },
  "\u539F\u901F\u952E\uFF1A\u6309\u8FD9\u4E2A\u952E\uFF0C\u91C7\u6837\u4E0D\u62C9\u4F38\u4E0D\u538B\u7F29{recommendedBasis}": { en: "Original-speed key: press this key and the sample isn't stretched or compressed{recommendedBasis}" },
  "\u8C31\u4E0A\u5199\u7684\u5C31\u662F\u5B9E\u9645\u97F3\u9AD8\uFF08MoonSinger \u4E0D\u6309\u4E50\u5668\u79FB\u8C03\uFF09\uFF0C\u53D1\u7ED9\u97F3\u6E90\u7684\u4E5F\u662F\u8FD9\u4E2A\u97F3\u3002": { en: "What's written is the actual pitch (MoonSinger doesn't transpose by instrument), and that's what's sent to the sound source." },
  "\u8FD9\u4EF6\u4E50\u5668\u7684\u8C31\u4E60\u60EF\u5199{p} {octave} \u4E2A\u516B\u5EA6\uFF08\u5B9E\u9645{p2}\uFF09\uFF1B\u60F3\u8981\u8C31\u9762\u597D\u8BFB\uFF0C\u7528\u8C31\u53F7\uFF08\u8FD9\u4EF6\u4E50\u5668\u6309\u5B9E\u9645\u97F3\u9AD8\u65F6\u5E38\u7528\u300C{concertClef}\u300D\uFF0C\u8C31\u53F7\u300C\u81EA\u52A8\u300D\u4E5F\u4F1A\u6311\uFF09\u6216 8va \u7EBF\uFF0C\u51FA\u58F0\u4E0D\u53D8\u3002": { en: "This instrument is customarily written {p} {octave} octaves (sounding {p2}); for an easier-to-read score, use a clef (at concert pitch it commonly uses \u201C{concertClef}\u201D, which \u201CAuto\u201D also picks) or an 8va line; the sound doesn't change." },
  "\u4F4E": { en: "lower" },
  "\u9AD8": { en: "higher" },
  "GS \u8FD9\u4E2A\u97F3\u8272\u5B9E\u6D4B\uFF1A\u5224\u4E0D\u51C6\u2014\u2014\u6BCF\u4E2A\u952E\u6700\u5F3A\u7684\u90A3\u4E2A\u5206\u97F3\u6BD4\u952E\u540D\u9AD8 {measured} \u534A\u97F3\uFF0C\u542C\u8D77\u6765\u591A\u534A\u8DDF\u7740\u5B83\u3002": { en: "Measured on this GS sound: unclear \u2014 the strongest partial of each key is {measured} semitones above the key name, and it likely sounds like that." },
  "GS \u8FD9\u4E2A\u97F3\u8272\u5B9E\u6D4B\uFF1A\u6309\u54EA\u4E2A\u952E\uFF0C\u8033\u6735\u542C\u5230\u7684\u5C31\u662F\u90A3\u4E2A\u97F3\u3002": { en: "Measured on this GS sound: whichever key you press is the note you hear." },
  "GS \u8FD9\u4E2A\u97F3\u8272\u5B9E\u6D4B\uFF1A\u6700\u5F3A\u7684\u5206\u97F3\u6BD4\u952E\u540D\u9AD8 {measured} \u534A\u97F3\uFF08{measuredOctave} \u4E2A\u516B\u5EA6\uFF09\uFF0C\u4F46\u8033\u6735\u542C\u5230\u7684\u97F3\u540D\u8FD8\u662F\u952E\u540D\uFF08\u949F\u7684\u6253\u51FB\u97F3\uFF09\u2014\u2014\u542C\u7740\u89C9\u5F97\u9AD8\u4E86\u662F\u8FD9\u4E2A\u539F\u56E0\u3002": { en: "Measured on this GS sound: the strongest partial is {measured} semitones above the key name ({measuredOctave} octaves), but the perceived note is still the key name (a bell's strike tone) \u2014 that's why it can sound high." },
  "GS \u8FD9\u4E2A\u97F3\u8272\u5B9E\u6D4B\uFF1A\u8033\u6735\u542C\u5230\u7684\u6BD4\u952E\u540D{p} {perceived} \u534A\u97F3\u3002": { en: "Measured on this GS sound: it sounds {p} than the key name by {perceived} semitones." },
  "\u6309\u5E74\u4EE3": { en: "By era" },
  "\u6309\u66F2\u98CE": { en: "By genre" },
  "\u6309\u79CD\u7C7B\uFF08\u9F13\u3001Pad\u2026\uFF09": { en: "By kind (drums, pads\u2026)" },
  "\u6309\u65CF\uFF08GM \u7684\u987A\u5E8F\uFF09": { en: "By family (GM order)" },
  "\u6309\u53D1\u58F0\u65B9\u5F0F": { en: "By sound source" },
  "\u4F53\u9E23\uFF08\u6572\u5B83\u81EA\u5DF1\uFF09": { en: "Idiophones (struck itself)" },
  "\u819C\u9E23\uFF08\u6572\u76AE\uFF09": { en: "Membranophones (struck skin)" },
  "\u5F26\u9E23\uFF08\u5F26\uFF09": { en: "Chordophones (strings)" },
  "\u6C14\u9E23\uFF08\u6C14\uFF09": { en: "Aerophones (air)" },
  "\u7535\u9E23\uFF08\u7535\uFF09": { en: "Electrophones (electric)" },
  "\u4EBA\u58F0": { en: "Voice" },
  "\u97F3\u6548": { en: "Sound effects" },
  "\uFF08{from} \u8D77\uFF09": { en: " (from {from})" },
  "\u5E74\u4EE3\u4E0D\u8BE6": { en: "Era unknown" },
  "\u5206\u7C7B\u4E0D\u8BE6": { en: "Family unknown" },
  "\u9F13\u548C\u6253\u51FB\u4E50": { en: "Drums & percussion" },
  "Pad\uFF08\u5408\u6210\u5668\u7684\u94FA\u5E95\u97F3\u8272\uFF09": { en: "Pads (synth pad sounds)" },
  "\u5176\u4F59\uFF08\u8FD8\u6CA1\u6309\u79CD\u7C7B\u5206\uFF09": { en: "Others (not sorted by kind yet)" },
  "\u6CA1\u8D34\u98CE\u683C": { en: "No style tag" },
  "\u516C\u5143\u524D {y}": { en: "{y} BC" },
  "\u5199\u97F3": { en: "Write notes" },
  "1\u20137\uFF08\u5C0F\u952E\u76D8\u4E5F\u884C\uFF09": { en: "1\u20137 (numpad too)" },
  "\u5199\u4E00\u4E2A\u97F3\uFF1A\u8C03\u91CC\u7B2C\u51E0\u7EA7\uFF0C\u843D\u5728\u79BB\u4E0A\u4E00\u4E2A\u97F3\u6700\u8FD1\u5904": { en: "Write a note: this scale degree, nearest the previous note" },
  "\u628A\u9009\u4E2D\u7684\u7B2C\u4E00\u4E2A\u97F3\u6539\u6210\u8FD9\u4E00\u7EA7\uFF0C\u9009\u4E2D\u8DF3\u5230\u4E0B\u4E00\u4E2A\u97F3": { en: "Change the first selected note to this degree, and move the selection to the next note" },
  "\u53EA\u5531\u4E0D\u5199": { en: "Sound only, don't write" },
  "\u53E0\uFF1A\u8FD9\u4E00\u7EA7\u53E0\u5230\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u4E0A\uFF08\u548C\u5F26\uFF0C\u843D\u5728\u79BB\u5B83\u73B0\u6709\u7684\u97F3\u6700\u8FD1\u5904\uFF1B\u5DF2\u7ECF\u6709 = \u53BB\u6389\uFF09\u3002\u540C pad\u300C\u53E0\u300D": { en: "Stack: add this degree to the note before the cursor (a chord, placed nearest its existing notes; already there = removed). Same as the pad's stack key" },
  "\u53E0\u5230\u521A\u5199\u7684\u90A3\u4E2A / \u9009\u533A\u7B2C\u4E00\u4E2A\u97F3\u4E0A": { en: "Stack on the note just written / the selection's first note" },
  "\u540C\u4E0A\uFF0C\u5F80\u4E0B\u627E\uFF08\u6570\u5B57\u6B63\u4E0B\u65B9\u90A3\u4E00\u6392\uFF09": { en: "Same, searching downward (the row right below the digits)" },
  "\u540C\u4E0A\uFF0C\u5F80\u4E0B\u627E": { en: "Same, searching downward" },
  "\u53EA\u5531\u4E0D\u5199\uFF08\u5F80\u4E0B\u627E\uFF09": { en: "Sound only, don't write (searching downward)" },
  "\u4F11\u6B62": { en: "Rest" },
  "\u9009\u533A\u91CC\u5199\u4E00\u4E2A\u4F11\u6B62\uFF08\u66FF\u6362\u6A21\u5F0F\uFF1A\u6309\u957F\u77ED\u6863\u5403\u6389\u9009\u533A\u91CC\u7684\u97F3\uFF0C\u4E0D\u5199\u51FA\u9009\u533A\uFF09": { en: "Write a rest in the selection (replace mode: eats selected notes at the current length, never past the selection)" },
  "\u5C0F\u8282\u7EBF": { en: "Barline" },
  "\u5728\u9009\u4E2D\u540E\u9762\u63D2\u5C0F\u8282\u7EBF": { en: "Insert a barline after the selection" },
  "\u77ED\uFF1A\u4E0B\u4E00\u4E2A\u97F3\u7684\u65F6\u503C\u51CF\u534A\uFF08\u5230\u4E09\u5341\u4E8C\u5206\u4E3A\u6B62\uFF09": { en: "Shorter: halve the next note's length (down to a thirty-second)" },
  "\u77ED\uFF1A\u63A5\u4E0B\u6765\u5199\u7684\u51CF\u534A\uFF08\u9009\u533A\u91CC\u5199 = \u6309\u8FD9\u4E00\u6863\u66FF\u6362\uFF1B\u6574\u7EC4\u6539\u65F6\u503C\u8D70\u9009\u533A\u83DC\u5355\uFF09": { en: "Shorter: halve what's written next (in a selection = replaces at this length; to change a whole group, use the selection menu)" },
  "\u957F\uFF1A\u4E0B\u4E00\u4E2A\u97F3\u7684\u65F6\u503C\u52A0\u500D\uFF08\u5230\u5168\u97F3\u7B26\u4E3A\u6B62\uFF09": { en: "Longer: double the next note's length (up to a whole note)" },
  "\u957F\uFF1A\u63A5\u4E0B\u6765\u5199\u7684\u52A0\u500D\uFF08\u9009\u533A\u91CC\u5199 = \u6309\u8FD9\u4E00\u6863\u66FF\u6362\uFF1B\u6574\u7EC4\u6539\u65F6\u503C\u8D70\u9009\u533A\u83DC\u5355\uFF09": { en: "Longer: double what's written next (in a selection = replaces at this length; to change a whole group, use the selection menu)" },
  "\u4E09\u8FDE\u97F3\u5F00 / \u5173\uFF08\u4E0B\u4E00\u4E2A\u97F3\u8D77\uFF09": { en: "Triplets on / off (from the next note)" },
  "\u521A\u5199\u7684\u97F3\u52A0\u4E00\u4EFD\uFF08\u7B80\u8C31\u7684\u6A2A\u7EBF\uFF09\uFF1B\u9694\u7740\u5C0F\u8282\u7EBF = \u65B0\u5F00\u4E00\u4E2A\u8FDE\u7740\u7684\u540C\u97F3": { en: "Add one unit to the note just written (the jianpu dash); across a barline = starts a tied note of the same pitch" },
  "\u9009\u4E2D\u7684\u97F3\u5404\u52A0\u4E00\u4EFD": { en: "Add one unit to each selected note" },
  "\u97F3\u9AD8": { en: "Pitch" },
  "\u266F\uFF1A\u70B9\u4E00\u4E0B\u7BA1\u4E0B\u4E00\u4E2A\u97F3\uFF0C\u8FDE\u70B9\u4E24\u4E0B\u9501\u4F4F\uFF0C\u518D\u70B9\u89E3\u5F00": { en: "\u266F: tap = next note, double-tap = lock, tap again = unlock" },
  "\u9009\u4E2D\u7684\u97F3\u5347\u534A\u97F3": { en: "Raise selected notes a semitone" },
  "\u266D\uFF1A\u540C\u4E0A": { en: "\u266D: same" },
  "\u9009\u4E2D\u7684\u97F3\u964D\u534A\u97F3": { en: "Lower selected notes a semitone" },
  "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u9AD8\u516B\u5EA6": { en: "Note before the cursor up an octave" },
  "\u9009\u4E2D\u7684\u97F3\u9AD8\u516B\u5EA6": { en: "Selected notes up an octave" },
  "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u4F4E\u516B\u5EA6": { en: "Note before the cursor down an octave" },
  "\u9009\u4E2D\u7684\u97F3\u4F4E\u516B\u5EA6": { en: "Selected notes down an octave" },
  "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u5F80\u4E0A\u4E00\u7EA7": { en: "Note before the cursor up a scale step" },
  "\u9009\u4E2D\u7684\u97F3\u5F80\u4E0A\u4E00\u7EA7": { en: "Selected notes up a scale step" },
  "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u5F80\u4E0B\u4E00\u7EA7": { en: "Note before the cursor down a scale step" },
  "\u9009\u4E2D\u7684\u97F3\u5F80\u4E0B\u4E00\u7EA7": { en: "Selected notes down a scale step" },
  "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u5347\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF1AC \u5927\u8C03 E \u2192 F\uFF09": { en: "Note before the cursor up a semitone (spelled by key: in C major, E \u2192 F)" },
  "\u9009\u4E2D\u7684\u97F3\u6574\u4F53\u5347\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF09": { en: "Selected notes up a semitone (spelled by key)" },
  "\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u964D\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF09": { en: "Note before the cursor down a semitone (spelled by key)" },
  "\u9009\u4E2D\u7684\u97F3\u6574\u4F53\u964D\u534A\u97F3\uFF08\u6309\u8C03\u62FC\u5199\uFF09": { en: "Selected notes down a semitone (spelled by key)" },
  "\u5149\u6807\u4E0E\u9009\u4E2D": { en: "Cursor and selection" },
  "\u5149\u6807\u5DE6\u79FB": { en: "Cursor left" },
  "\u6536\u6210\u9009\u4E2D\u5DE6\u8FB9\u7684\u5149\u6807\uFF08\u56DE\u5230\u5199\uFF09": { en: "Collapse to a cursor left of the selection (back to writing)" },
  "\u5149\u6807\u53F3\u79FB": { en: "Cursor right" },
  "\u6536\u6210\u9009\u4E2D\u53F3\u8FB9\u7684\u5149\u6807\uFF08\u56DE\u5230\u5199\uFF09": { en: "Collapse to a cursor right of the selection (back to writing)" },
  "\u9009\u4E2D\u5149\u6807\u524D\u90A3\u4E2A\uFF08\u5199 \u2192 \u6539\uFF09": { en: "Select the item before the cursor (write \u2192 edit)" },
  "\u9009\u4E2D\u5F80\u5DE6\u6269\u4E00\u4E2A": { en: "Extend selection left by one" },
  "\u9009\u4E2D\u5149\u6807\u540E\u90A3\u4E2A\uFF08\u5199 \u2192 \u6539\uFF09": { en: "Select the item after the cursor (write \u2192 edit)" },
  "\u9009\u4E2D\u5F80\u53F3\u6269\u4E00\u4E2A": { en: "Extend selection right by one" },
  "\u4ECE\u5149\u6807\u9009\u5230\u5F00\u5934\uFF08\u5199 \u2192 \u6539\uFF09": { en: "Select from the cursor to the start (write \u2192 edit)" },
  "\u9009\u5230\u5F00\u5934": { en: "Select to the start" },
  "\u4ECE\u5149\u6807\u9009\u5230\u672B\u5C3E\uFF08Home \u518D Shift+End = \u5168\u9009\uFF09": { en: "Select from the cursor to the end (Home, then Shift+End = select all)" },
  "\u9009\u5230\u672B\u5C3E": { en: "Select to the end" },
  "\u5149\u6807\u5230\u5F00\u5934": { en: "Cursor to the start" },
  "\u5149\u6807\u5230\u672B\u5C3E": { en: "Cursor to the end" },
  "\u6536\u8D77\uFF0C\u4E0D\u8D34\u6846\u91CC\u7684\u5B57": { en: "Close without pasting the box's text" },
  "\u6536\u8D77\uFF0C\u4E0D\u6539\uFF08\u521A\u63D2\u7684\u8BB0\u53F7 = \u64A4\u6389\uFF09": { en: "Close without changing (a mark just inserted = removed)" },
  "\u5173\u6389\u9762\u677F": { en: "Close the panel" },
  "\u64A4\u56DE\u672C\u6B21\u8F93\u5165\u7684\u6700\u540E\u4E00\u7B14\uFF08\u300C\u2212\u300D\u3001\u97F3\uFF09\uFF1B\u632A\u8FC7\u5149\u6807\u540E = \u5220\u5149\u6807\u524D\u4E00\u4E2A": { en: "Take back the last stroke of this input (\u201C\u2212\u201D, a note); after moving the cursor = delete the item before it" },
  "\u5220\u6389\u9009\u4E2D": { en: "Delete the selection" },
  "\u6846\u662F\u7A7A\u7684\uFF1A\u56DE\u5230\u4E0A\u4E00\u4E2A\u97F3\uFF0C\u628A\u5B83\u7684\u5B57\u62FF\u51FA\u6765\u63A5\u7740\u5220": { en: "Empty box: back to the previous note, its text comes out to keep deleting" },
  "\u5220\u5149\u6807\u540E\u4E00\u4E2A": { en: "Delete the item after the cursor" },
  "\u5C0F\u6708\u76F8\u5531 / \u505C": { en: "Tsukuyomi-chan sing / stop" },
  "\u300C\u5F39\u300D\u5F00 / \u5173\uFF08\u97F3\u7B26\u952E\u53EA\u5531\u4E0D\u5199\uFF09": { en: "\u201CJam\u201D on / off (note keys sound without writing)" },
  "\u300C\u5F39\u300D\u5F00 / \u5173": { en: "\u201CJam\u201D on / off" },
  "\u300C\u5F39\u300D\u5173": { en: "\u201CJam\u201D off" },
  "\u6587\u4EF6": { en: "File" },
  "\u5B58\uFF08\u5B58\u56DE\u6253\u5F00\u7684\u90A3\u4E2A\u6587\u4EF6\uFF1B\u8FD8\u6CA1\u6709\u5BB6 = \u95EE\u5B58\u5230\u54EA / iPad \u4E0B\u8F7D\uFF09": { en: "Save (back to the opened file; no home yet = asks where / downloads on iPad)" },
  "\u5BFC\u51FA\u2026\uFF08\u6B4C\u58F0 mp3 / \u5B58\u4E00\u4EFD .mxl \u526F\u672C\uFF1B\u539F\u6765\u7684\u300C\u53E6\u5B58\u4E3A\u300D\u4F4F\u8FD9\u91CC\uFF09": { en: "Export\u2026 (MP3 / an .mxl copy; what used to be \u201CSave as\u201D)" },
  "\u6253\u5F00\u2026\uFF08.mxl / .musicxml\uFF09": { en: "Open\u2026 (.mxl / .musicxml)" },
  "\u6253\u5F00\u2026": { en: "Open\u2026" },
  "\u9009\u533A": { en: "Selection" },
  "\u590D\u5236\u9009\u4E2D\uFF08app \u5185\u539F\u6837 + \u7CFB\u7EDF\u526A\u8D34\u677F\u4E00\u884C\u7B80\u8C31\uFF09": { en: "Copy selection (as is in the app + one line of jianpu on the system clipboard)" },
  "\u526A\u5207\u9009\u4E2D": { en: "Cut selection" },
  "\u8D34\u5728\u5149\u6807\u5904\uFF08app \u5185\u590D\u5236\u8FC7\u7684\uFF1B\u6CA1\u6709\u5C31\u8BD5\u7740\u8BFB\u7CFB\u7EDF\u526A\u8D34\u677F\u91CC\u7684\u7B80\u8C31\u6587\u5B57\uFF09": { en: "Paste at the cursor (copied in the app; otherwise tries jianpu text on the system clipboard)" },
  "\u8D34 = \u66FF\u6362\u9009\u4E2D": { en: "Paste = replace selection" },
  "\u5168\u9009\uFF08\u8FD9\u5F20\u7EB8\u4E0A\u8FD9\u4E2A\u58F0\u90E8\uFF09": { en: "Select all (this part on this sheet)" },
  "\u64A4\u9500\u4E0A\u4E00\u6B65\uFF08\u62D6 / \u8FDE\u6253\u6B4C\u8BCD\u7B97\u4E00\u6B65\uFF09": { en: "Undo the last step (a drag / a run of lyric typing counts as one)" },
  "\u6B4C\u8BCD\u6846": { en: "Lyric box" },
  "\u7A7A\u683C / Tab": { en: "Space / Tab" },
  "\u8FD9\u4E2A\u8BCD\u5B8C\u4E86\uFF1A\u8D34\u4E0A\u3001\u8DF3\u4E0B\u4E00\u4E2A\u97F3\uFF08\u6846\u662F\u7A7A\u7684 = \u53EA\u8DF3\uFF09": { en: "This word is done: paste and jump to the next note (empty box = just jump)" },
  "\u56DE\u4E0A\u4E00\u4E2A\u97F3": { en: "Back to the previous note" },
  "\u8DDF\u5728\u5B57\u6BCD\u540E\u9762\uFF1A\u97F3\u8282\u5B8C\u4E86\u3001\u8BCD\u6CA1\u5B8C\uFF08\u8C31\u4E0A\u753B\u8FDE\u5B57\u7B26\uFF09\uFF0C\u8DF3\u4E0B\u4E00\u4E2A\u97F3": { en: "After a letter: syllable done, word not done (a hyphen on the score), jump to the next note" },
  "\u8D34\u4E0A\u3001\u6536\u8D77": { en: "Paste and close" },
  "\u8BB0\u53F7\u6846": { en: "Mark box" },
  "\u6309\u6846\u91CC\u7684\u5B57\u6539\uFF081=D / Bb / 2# \xB7 3/4 \xB7 90 \u6216 Andante\uFF09\u3001\u6536\u8D77": { en: "Apply the box's text (1=D / Bb / 2# \xB7 3/4 \xB7 90 or Andante) and close" },
  "\u7A7A\u683C": { en: "Space" },
  "\u5C0F\u952E\u76D8 Enter": { en: "Numpad Enter" },
  "\u9000\u683C": { en: "Backspace" },
  "\u5C0F\u952E\u76D8 -": { en: "Numpad -" },
  "\u5C0F\u952E\u76D8 *": { en: "Numpad *" },
  "\u5C0F\u952E\u76D8 /": { en: "Numpad /" },
  "\u9762\u677F\uFF08\u5BFC\u51FA\u597D\u4E86\uFF09": { en: "Panel (export done)" },
  "\u6F14\u594F\u6CD5##\u9875\u7B7E": { en: "Artic." },
  "\u529B\u5EA6##\u9875\u7B7E": { en: "Dyn." },
  "\u8BB0\u53F7": { en: "Marks" },
  "\u5F3A\u5EA6\uFF08\u5E7D\u7075\u97F3 / \u5F31\u5316 / \u6B21\u91CD\u97F3 / \u91CD\u97F3 / \u5F3A\u97F3 / \u7A81\u5F3A / \u5F3A\u540E\u5373\u5F31\uFF09\u3001\u4FDD\u6301 / \u8DF3\u97F3 / \u8FDE\u7EBF / \u547C\u5438\uFF08\u9759\u9ED8 / \u8F7B\u5438 / \u6DF1\u5438\uFF09\u3001\u6C14\u58F0": { en: "Strength (ghost / unstressed / stress / accent / marcato / sfz / fp), tenuto / staccato / slur / breath (silent / soft / deep), whisper" },
  "ppp\u2026fff\u3001\u6E10\u5F3A / \u6E10\u5F31\u3001\u6E10\u5230\u3001\u97F3\u5185\u8D77\u4F0F": { en: "ppp\u2026fff, crescendo / diminuendo, ramp, swells" },
  "\u53E5\u53F7\u3001\u8C03\u53F7 / \u62CD\u53F7 / \u8C31\u53F7 / \u516B\u5EA6\u7EBF / \u901F\u5EA6\u3001\u98CE\u683C\uFF08\u62CD\u5B50\u8F7B\u91CD\uFF09": { en: "Phrase end, key / time / clef / ottava / tempo, style (beat weighting)" },
  "\u4E09\u5341\u4E8C\u5206": { en: "Thirty-second" },
  "\u5341\u516D\u5206": { en: "Sixteenth" },
  "\u516B\u5206": { en: "Eighth" },
  "\u56DB\u5206": { en: "Quarter" },
  "\u4E8C\u5206": { en: "Half" },
  "\u5168\u97F3\u7B26": { en: "Whole" },
  "{n} \u8FDE\u97F3": { en: "{n}-tuplet" },
  "\u5149\u6807\u5DE6\u79FB\uFF08{p}\uFF09": { en: "Cursor left ({p})" },
  "\u5149\u6807\u53F3\u79FB\uFF08{p}\uFF09": { en: "Cursor right ({p})" },
  "\u4F11\u6B62\uFF08{p}\uFF09": { en: "Rest ({p})" },
  "\u5C0F\u8282\u7EBF\uFF08{p}\uFF09": { en: "Barline ({p})" },
  "\u547C\u5438\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u540E\u9762\u6362\u4E00\u53E3\u6C14\uFF08\u5C0F\u6708\u76F8\u5531\u5230\u8FD9\u513F\u6362\u6C14\uFF1B\u4E50\u5668\u5728\u8FD9\u513F\u7A0D\u5FAE\u65AD\u5F00\uFF1B\u8FDE\u7EBF\u8FDE\u7740\u4E5F\u7167\u6837\u65AD\u5F00\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389\uFF09": { en: "Breath: a breath after the note before the cursor (Tsukuyomi-chan breathes here; instruments separate slightly; it separates even under a slur; tap again to remove)" },
  "\u5347\u964D\uFF08\u548C Shift \u4E00\u6837\uFF09\uFF1A\u70B9\u4E00\u4E0B = \u4E0B\u4E00\u4E2A\u97F3\uFF1B\u8FDE\u70B9\u4E24\u4E0B = \u9501\u4F4F\uFF0C\u518D\u70B9\u89E3\u5F00\uFF1B\u6309\u4F4F\u5199 = \u6309\u4F4F\u671F\u95F4\u3002\u5728\u952E\u4E0A\u4E0A\u4E0B\u6ED1\u6362 \u{1D12A} / \u266F / \u266D / \u{1D12B}": { en: "Accidental (like Shift): tap = next note; double-tap = lock, tap again = unlock; hold while writing = while held. Slide up / down on the key to change \u{1D12A} / \u266F / \u266D / \u{1D12B}" },
  "\u5347\u964D": { en: "Acc." },
  "\u53E0\uFF08\u50CF Caps Lock\uFF09\uFF1A\u6309\u4E00\u4E0B = \u9009\u4E2D\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u6765\u6539\u2014\u2014\u6309\u97F3\u952E\u53E0\u4E0A / \u62FF\u6389\uFF08\u6700\u540E\u4E00\u4E2A\u62FF\u6389 = \u4E00\u6837\u957F\u7684\u4F11\u6B62\uFF0C\u4F11\u6B62\u4E0A\u6309 = \u53D8\u56DE\u97F3\uFF09\u3001\u2014 \u957F\u4E00\u6B65\u3001\u232B \u77ED\u4E00\u6B65\u3001\u2190 \u2192 \u6362\u524D\u540E\u7684\u97F3\uFF1B\u518D\u6309\u4E00\u4E0B = \u56DE\u5230\u5B83\u540E\u9762\u63A5\u7740\u5199\u3002\u5355\u58F0\u4E50\u5668\u7684\u58F0\u90E8\u53E0\u4E0D\u4E86": { en: "Stack (like Caps Lock): press = select the note before the cursor to edit it \u2014 note keys add / remove (removing the last = a rest of the same length; on a rest = back to a note), \u2014 one step longer, \u232B one step shorter, \u2190 \u2192 to neighbors; press again = back after it to keep writing. Monophonic parts can't stack" },
  "\u53E0\u97F3": { en: "Stack" },
  "\u51CF\u534A\uFF08\u957F\u77ED\u57FA\u7EBF\u77ED\u4E00\u6863\uFF09\uFF1A\u70B9\u4E00\u4E0B = \u4E0B\u4E00\u4E2A\u97F3\uFF1B\u8FDE\u70B9\u4E24\u4E0B = \u9501\u4F4F\uFF0C\u518D\u70B9\u89E3\u5F00\uFF1B\u4E5F\u53EF\u4EE5\u6309\u4F4F\u5199": { en: "Halve (one notch shorter): tap = next note; double-tap = lock, tap again = unlock; or hold while writing" },
  "\u51CF\u534A": { en: "Halve" },
  "\u62C9\u957F\u4E00\u4EFD\uFF08{p}\uFF09": { en: "Extend by one unit ({p})" },
  "\u62C9\u957F": { en: "Extend" },
  "\u9000\u683C\uFF08{p}\uFF09": { en: "Backspace ({p})" },
  "\u25BE \u8FD8\u6709 {n} \u4E2A": { en: "\u25BE {n} more" },
  "\u8FD4\u56DE": { en: "Back" },
  "\u81EA\u52A8\u5C0F\u8282\u7EBF": { en: "Auto barlines" },
  "\u6309\u62CD\u53F7\u81EA\u52A8\u753B\u5C0F\u8282\u7EBF\uFF08\u53EA\u753B\u3001\u4E0D\u8FDB\u6570\u636E\uFF09\uFF1B\u624B\u63D2\u7684\u300C|\u300D= \u4ECE\u90A3\u91CC\u91CD\u65B0\u6570\uFF0C\u5F31\u8D77 = \u5199\u5B8C\u5F31\u8D77\u7684\u97F3\u6309\u4E00\u4E0B\u300C|\u300D": { en: "Draws barlines from the time signature (display only, not in the data); a hand-inserted \u201C|\u201D recounts from there; for a pickup, write its notes and press \u201C|\u201D" },
  "\u6362\u8C31\u8868": { en: "Change staff" },
  "\u5927\u8C31\u8868\uFF1A\u521A\u5199\u7684\u97F3\uFF08\u6216\u9009\u4E2D\u7684\uFF09\u632A\u5230\u53E6\u4E00\u5F20\u8C31\u8868\uFF1B\u518D\u6309\u4E00\u6B21\u56DE\u5230\u6309\u97F3\u9AD8\u81EA\u52A8\u5206": { en: "Grand staff: moves the note just written (or the selection) to the other staff; press again = back to auto by pitch" },
  "\u5E03\u5C40\u2026": { en: "Layout\u2026" },
  "\u51E0\u884C\u51E0\u5217\u3001\u9996\u8C03 / \u7EDD\u5BF9": { en: "Rows and columns, movable / fixed do" },
  "\u6E10\u5230": { en: "Ramp" },
  "\u6362\u56DE\u97F3\u952E\uFF08\u5199\u97F3 / \u4F11\u6B62 / \u5C0F\u8282\u7EBF\uFF09": { en: "Back to note keys (notes / rests / barlines)" },
  "\u5F39\uFF1A\u97F3\u952E\u53EA\u54CD\u4E0D\u5199\uFF08\u5FEB\u6377\u952E `\uFF09\uFF1B\u518D\u70B9\u56DE\u5230\u5199": { en: "Jam: note keys sound without writing (shortcut `); tap again to return to writing" },
  "\u5F39": { en: "Jam" },
  "\u6536\u8D77\u952E\u76D8\uFF08\u70B9\u4E94\u7EBF\u8C31\u518D\u5F39\u51FA\u6765\uFF09": { en: "Hide the keys (tap the staff to bring them back)" },
  "\u6536\u8D77": { en: "Hide" },
  "\u66F4\u591A\uFF1A\u5E03\u5C40\u3001\u63D2\u8BB0\u53F7": { en: "More: layout, insert marks" },
  "\u97F3\u57DF\uFF08\u8FD9\u5757 pad \u4ECE\u54EA\u4E2A\u97F3\u5230\u54EA\u4E2A\u97F3\uFF09\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\u2014\u2014\u50CF\u63A8\u4E00\u5F20\u7EB8\uFF0C\u5F80\u4E0A\u63A8 = \u770B\u4E0B\u9762\u66F4\u4F4E\u7684": { en: "Range (the pad's lowest to highest note): hold and slide up / down, or tap to choose \u2014 like pushing a sheet of paper: pushing up shows lower notes" },
  "\u957F\u77ED\u57FA\u7EBF\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\uFF08\u542B\u8FDE\u97F3\uFF09": { en: "Note length: hold and slide up / down, or tap to choose (tuplets included)" },
  "1=\uFF08pad \u81EA\u5DF1\u7684\u8C03\uFF09\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\uFF08\u4E94\u5EA6\u5708\uFF09": { en: "1= (the pad's own key): hold and slide up / down, or tap to choose (circle of fifths)" },
  "\u6362\u6210\u7B26\u53F7\u683C\uFF08\u529B\u5EA6\u3001\u6E10\u5F3A\u6E10\u5F31\u3001\u6F14\u594F\u6CD5\u3001\u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6\u3001\u53CD\u590D\u3001\u98CE\u683C\u3001\u53E5\u53F7\uFF09\u2014\u2014\u8C31\u4E0A\u97F3\u548C\u8BB0\u53F7\u672C\u6765\u5C31\u4E00\u8D77\u6539\uFF0C\u8FD9\u91CC\u53EA\u6362\u952E\u76D8": { en: "Switch to the symbol grid (dynamics, hairpins, articulations, key / time / tempo, repeats, style, phrase end) \u2014 notes and marks are edited together on the score anyway; this only switches the keys" },
  "\u5C11\u4E00{name}": { en: "One fewer {name}" },
  "\u591A\u4E00{name}": { en: "One more {name}" },
  "\u884C": { en: "Rows" },
  "\u81EA\u52A8": { en: "Auto" },
  "\u6309\u5C4F\u5E55\u9AD8\u5EA6\u81EA\u52A8\u5B9A\u51E0\u884C": { en: "Sets the row count from the screen height" },
  "\u952E\u76D8\u51E0\u884C\uFF08\u9AD8\u5EA6\uFF09": { en: "Key rows (height)" },
  "\u5217": { en: "Columns" },
  "\u952E\u76D8\u51E0\u5217": { en: "Key columns" },
  "\u952E\u4F4D": { en: "Key layout" },
  "\u9996\u8C03": { en: "Movable do" },
  "\u6BCF\u884C\u4ECE 1 \u8D77\uFF0C\u8DDF\u7740\u300C1=\u300D\u8D70": { en: "Each row starts at 1, following \u201C1=\u201D" },
  "\u7EDD\u5BF9": { en: "Fixed" },
  "\u6BCF\u884C\u4ECE C \u8D77\uFF08\u4E0D\u8DDF\u7740\u300C1=\u300D\u632A\uFF09": { en: "Each row starts at C (doesn't follow \u201C1=\u201D)" },
  "\u6ED1": { en: "Slide" },
  "\u6EDA\u952E\u76D8": { en: "Glide" },
  "\u624B\u6307\u6309\u7740\u6ED1\u5230\u4E0B\u4E00\u4E2A\u952E = \u54CD\u4E0B\u4E00\u4E2A\uFF08\u5199\u7684\u65F6\u5019\u4E00\u8DEF\u5199\uFF09": { en: "Sliding your finger to the next key sounds that key (writes along the way while writing)" },
  "\u5728\u97F3\u952E\u4E0A\u4E0A\u4E0B\u6ED1 = \u8FD9\u4E00\u4E2A\u97F3\u5347 / \u964D\uFF08\u9ECF\u7740\uFF09": { en: "Sliding up / down on a note key bends just this note up / down (sticky)" },
  "\u952E\u76D8\u5E03\u5C40": { en: "Keyboard layout" },
  "\uFF08\u53F0\u4E0A\u8FD9\u4F4D\u4E0D\u8BA4\uFF1A\u5199\u5728\u8C31\u4E0A\u753B\u7070\uFF0C\u51FA\u58F0\u4E0D\u53D7\u5F71\u54CD\uFF09": { en: " (the performer on stage ignores this: drawn gray on the score, sound unaffected)" },
  "\u7436\u97F3": { en: "Arpeggio" },
  "\u7436\u97F3\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u548C\u5F26\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u4ECE\u4F4E\u5230\u9AD8\u4F9D\u6B21\u594F\u51FA\uFF08\u548C\u5F26\u5DE6\u8FB9\u4E00\u6761\u6CE2\u6D6A\u7EBF\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Arpeggio: rolls the chord before the cursor (or the selection) low to high (a wavy line left of the chord); tap again to remove" },
  "\u6EDA\u594F\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u6574\u4E2A\u97F3\u6572\u6EE1\uFF08\u7B26\u5E72\u4E0A\u4E09\u9053\u659C\u7EBF\uFF09\uFF1B\u591A\u5BC6\u5728\u4E50\u5668\u9875\u8C03\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Roll: the note before the cursor (or the selection) is filled with rapid hits (three slashes on the stem); set how fast on the instrument page; tap again to remove" },
  "\u8DF3\u97F3\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u5531 / \u5F39\u5F97\u77ED\u4FC3\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Staccato: the note before the cursor (or the selection) sung / played short; tap again to remove" },
  "\u5E7D\u7075\u97F3\uFF08\u62EC\u53F7\u7B26\u5934\uFF09\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u5F88\u8F7B\u3001\u51E0\u4E4E\u542C\u4E0D\u89C1\uFF1B\u97F3\u7684\u5F3A\u5EA6\u53EA\u6709\u4E00\u79CD\uFF1A\u548C\u5F31\u5316 / \u6B21\u91CD\u97F3 / \u91CD\u97F3 / \u5F3A\u97F3 / \u7A81\u5F3A / \u5F3A\u540E\u5373\u5F31\u4E92\u65A5": { en: "Ghost note (parenthesized notehead): the note before the cursor (or the selection) is very soft, almost inaudible; a note has one strength: excludes unstressed / stress / accent / marcato / sfz / fp" },
  "\u5F31\u5316\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u8F7B\u4E00\u70B9\uFF1B\u548C\u522B\u7684\u5F3A\u5EA6\u4E92\u65A5": { en: "Unstressed: the note before the cursor (or the selection) a little lighter; excludes other strengths" },
  "\u6B21\u91CD\u97F3\uFF1A\u6BD4\u91CD\u97F3\u8F7B\u7684\u91CD\u97F3\uFF08\u56DB\u62CD\u5B50\u300C\u5F3A\u5F31\u6B21\u5F3A\u5F31\u300D\u7684\u6B21\u5F3A\uFF09\uFF1B\u548C\u522B\u7684\u5F3A\u5EA6\u4E92\u65A5": { en: "Stress: lighter than an accent (the secondary beat in 4/4's strong-weak-medium-weak); excludes other strengths" },
  "\u91CD\u97F3\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u52A0\u91CD\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Accent: the note before the cursor (or the selection) heavier; tap again to remove" },
  "\u5F3A\u97F3\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u6BD4\u91CD\u97F3\u66F4\u91CD\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Marcato: the note before the cursor (or the selection) heavier than an accent; tap again to remove" },
  "\u7A81\u5F3A": { en: "Sforzando" },
  "\u7A81\u5F3A sfz\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u97F3\u5934\u731B\u5730\u51B2\u4E00\u4E0B\u518D\u843D\u56DE\u6765\uFF1B\u548C\u91CD\u97F3 / \u5F3A\u97F3 / fp \u4E92\u65A5": { en: "Sforzando sfz: the note before the cursor (or the selection) jolts at the attack and falls back; excludes accent / marcato / fp" },
  "\u5F3A\u540E\u5373\u5F31": { en: "Forte-piano" },
  "\u5F3A\u540E\u5373\u5F31 fp\uFF1A\u97F3\u5934 f\uFF0C\u9A6C\u4E0A\u843D\u5230 p\uFF0C\u4E4B\u540E\u7684\u97F3\u90FD\u662F p\uFF1B\u548C\u91CD\u97F3 / \u5F3A\u97F3 / sfz \u4E92\u65A5": { en: "Forte-piano fp: attacks at f, falls right to p, and later notes stay p; excludes accent / marcato / sfz" },
  "\u4FDD\u6301\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u5531 / \u5F39\u6EE1\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Tenuto: the note before the cursor (or the selection) sung / played in full; tap again to remove" },
  "\u6E10\u5F3A <\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u533A\u7B2C\u4E00\u4E2A\u97F3\uFF09\u8D77\uFF0C\u4E00\u8DEF\u6E10\u5F3A\u5230\u8FD9\u5F20\u7EB8\u91CC\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF1B\u6CA1\u5199 = \u8D70\u4E00\u6863\uFF08\u8C31\u4E0A\u7070\u5B57\u6807\u51FA\u63A8\u5B9A\u7684\u7EC8\u70B9\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Crescendo <: from the note before the cursor (or the selection's first note), grows up to the next dynamic on this sheet; none = one step (the inferred endpoint shows in gray on the score); tap again to remove" },
  "\u6E10\u5F31 >\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u533A\u7B2C\u4E00\u4E2A\u97F3\uFF09\u8D77\uFF0C\u4E00\u8DEF\u6E10\u5F31\u5230\u8FD9\u5F20\u7EB8\u91CC\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF1B\u6CA1\u5199 = \u8D70\u4E00\u6863\uFF08\u8C31\u4E0A\u7070\u5B57\u6807\u51FA\u63A8\u5B9A\u7684\u7EC8\u70B9\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389": { en: "Diminuendo >: from the note before the cursor (or the selection's first note), falls to the next dynamic on this sheet; none = one step (the inferred endpoint shows in gray on the score); tap again to remove" },
  "\u529B\u5EA6": { en: "Dynamics" },
  "\u529B\u5EA6 {d}\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8D77\uFF08\u6709\u9009\u533A = \u9009\u533A\u5F00\u5934\uFF09\uFF0C\u7BA1\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\uFF1B\u90A3\u513F\u5DF2\u7ECF\u662F\u5B83 = \u53BB\u6389": { en: "Dynamic {d}: from the note before the cursor (or the selection's start) until the next dynamic; already that = removed" },
  "\u6E10\u5230\uFF1A\u70B9\u4E00\u4E0B = \u4E0B\u4E00\u4E2A\u529B\u5EA6\u4ECE\u8FD9\u5F20\u7EB8\u91CC\u4E0A\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u90A3\u513F\u4E00\u8DEF\u6E10\u53D8\u8FC7\u6765\uFF08\u8C31\u4E0A\u753B\u865A\u7EBF\u53D1\u5939\uFF1B\u624B\u5199\u7684\u6E10\u5F3A\u6E10\u5F31\u662F\u5B9E\u7EBF\uFF09\uFF1B\u8FDE\u70B9\u4E24\u4E0B = \u9501\u4F4F\uFF0C\u4E4B\u540E\u5199\u7684\u529B\u5EA6\u90FD\u662F\u6E10\u5230\uFF1B\u518D\u70B9 = \u5173\u3002\u4E0D\u5F00 = \u5230\u90A3\u513F\u7A81\u53D8": { en: "Ramp: tap = the next dynamic ramps from the previous one on this sheet (dashed hairpin on the score; handwritten hairpins are solid); double-tap = lock, every dynamic written is a ramp; tap again = off. Off = changes suddenly there" },
  "\u97F3\u5185\u6E10\u5F3A": { en: "Swell up" },
  "\u97F3\u5185\u9F13\u8D77": { en: "Swell" },
  "{p}\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u81EA\u5DF1\u91CC\u9762\u7684\u8D77\u4F0F\uFF1B\u548C\u6BB5\u843D\u7684\u6E10\u5F3A\u6E10\u5F31\u662F\u4E24\u5C42\uFF0C\u53EF\u4EE5\u53E0\uFF1B\u518D\u70B9 = \u53BB\u6389": { en: "{p}: a swell inside the note before the cursor (or the selection); a separate layer from phrase hairpins, they can stack; tap again = remove" },
  "\u97F3\u5185\u6E10\u5F31\uFF08\u952F\u9F7F\uFF09": { en: "Swell down (sawtooth)" },
  "\u97F3\u5185\u9F13\u8D77\uFF08messa di voce\uFF09": { en: "Swell (messa di voce)" },
  "\u8FDE\u7EBF\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8FDE\u5230\u4E0B\u4E00\u4E2A\u97F3\uFF08\u8FDE\u594F\u3001\u4E0D\u7559\u7F1D\uFF1B\u6709\u9009\u533A = \u9009\u4E2D\u7684\u8FDE\u8D77\u6765\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389\uFF09\u3002\u540C\u4E00\u4E2A\u97F3\u4E0A\u53C8\u6709\u547C\u5438 = \u547C\u5438\u7B97\u6570\uFF1A\u90A3\u91CC\u7167\u6837\u65AD\u5F00\u6362\u6C14\uFF0C\u8FDE\u7EBF\u7167\u753B": { en: "Slur: connects the note before the cursor to the next (legato, no gap; with a selection = connects it; tap again to remove). A breath on the same note wins: it still separates and breathes there, and the slur is still drawn" },
  "\u5438##\u8BB0\u53F7": { en: "in" },
  "\u8F7B\u5438": { en: "Soft inhale" },
  "\u51FA\u58F0\u7684\u6362\u6C14\uFF08\u8F7B\u5438\uFF09\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u540E\u9762\u6362\u6C14\u3001\u542C\u5F97\u89C1\u5438\u6C14\u58F0\uFF08\u6CA1\u6709\u547C\u5438\u8BB0\u53F7\u5C31\u8FDE\u9017\u53F7\u4E00\u8D77\u52A0\u4E0A\uFF1B\u518D\u70B9\u4E00\u6B21 = \u6574\u4E2A\u53BB\u6389\uFF09\u3002\u53EA\u6709\u70B9\u4E86\u7684\u5730\u65B9\u624D\u51FA\u58F0\uFF0C\u666E\u901A\u7684\u547C\u5438\u8BB0\u53F7\u7167\u65E7\u9759\u9ED8": { en: "Audible breath (soft): breathes after the note before the cursor with an audible inhale (adds the comma if there's no breath mark; tap again = removes it all). Only tapped spots make a sound; plain breath marks stay silent" },
  "\u6DF1\u5438##\u8BB0\u53F7": { en: "deep in" },
  "\u6DF1\u5438": { en: "Deep inhale" },
  "\u51FA\u58F0\u7684\u6362\u6C14\uFF08\u6DF1\u5438\uFF09\uFF1A\u5927\u53E3\u5438\u6C14\u3001\u6362\u6C14\u7684\u7A7A\u5F53\u4E5F\u957F\u4E00\u70B9\uFF08\u4ECE\u524D\u4E00\u4E2A\u97F3\u672B\u5C3E\u501F\u65F6\u95F4\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21 = \u6574\u4E2A\u53BB\u6389": { en: "Audible breath (deep): a big inhale with a slightly longer gap (borrowed from the end of the previous note); tap again = removes it all" },
  "\u6C14\u58F0": { en: "Whisper" },
  "\u6C14\u58F0\uFF08\xD7 \u7B26\u5934\uFF09\uFF1A\u5149\u6807\u524D\u90A3\u4E2A\u97F3\uFF08\u6709\u9009\u533A = \u9009\u4E2D\u7684\uFF09\u4E0D\u5531\u97F3\u9AD8\u3001\u7528\u6C14\u58F0\u5531\u8FD9\u4E2A\u5B57\uFF08\u5FF5\u767D / \u8033\u8BED\uFF09\uFF1B\u518D\u70B9\u4E00\u6B21\u53BB\u6389\u3002\u53EA\u6709\u5C0F\u6708\u76F8\u505A\u5F97\u5230\uFF0C\u4E50\u5668\u4E0A\u753B\u7070": { en: "Whisper (\xD7 notehead): the note before the cursor (or the selection) has no sung pitch, breathing this syllable (speech / whisper); tap again to remove. Only Tsukuyomi-chan can do it; grayed out on instruments" },
  "\u63D2\u8C03\u53F7\uFF08\u5728\u5149\u6807\u5904\uFF1B\u5148\u586B\u73B0\u5728\u7684\uFF0C\u63D2\u4E86\u518D\u6539\uFF09": { en: "Insert key signature (at the cursor; starts with the current one, edit after inserting)" },
  "\u63D2\u62CD\u53F7\uFF08\u5728\u5149\u6807\u5904\uFF09": { en: "Insert time signature (at the cursor)" },
  "\u901F\u5EA6##\u8C31": { en: "Tempo" },
  "\u63D2\u901F\u5EA6\uFF08\u5728\u5149\u6807\u5904\uFF09": { en: "Insert tempo (at the cursor)" },
  "\u8C31\u53F7\uFF1A\u4ECE\u5149\u6807\u5904\u8D77\u6362\u8C31\u53F7\uFF08\u9AD8\u97F3 / \u4F4E\u97F3 / \u4E0B\u52A0 8 / \u4E0A\u52A0 8 / \u4E0A\u52A0 15\uFF09\uFF1B\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8\u3002\u6BCF\u884C\u5F00\u5934\u7684\u8C31\u53F7\u4E5F\u80FD\u76F4\u63A5\u70B9": { en: "Clef: changes the clef from the cursor (treble / bass / 8 below / 8 above / 15 above); display only, pitch doesn't change. The clef at the start of each line can be tapped too" },
  "\u516B\u5EA6\u7EBF": { en: "Ottava" },
  "\u516B\u5EA6\u7EBF\uFF1A\u4ECE\u5149\u6807\u5904\u8D77\u8C31\u4E0A\u753B\u4F4E\uFF088va / 15ma\uFF09\u6216\u753B\u9AD8\uFF088vb\uFF09\uFF1B\u6709\u9009\u533A = \u8FD9\u4E00\u6BB5\uFF1B\u300C\u7ED3\u675F\u300D= \u5230\u8FD9\u513F\u6536\u3002\u53EA\u7BA1\u753B\uFF0C\u97F3\u9AD8\u4E0D\u53D8": { en: "Ottava line: from the cursor, drawn lower (8va / 15ma) or higher (8vb); with a selection = this passage; \u201CEnd\u201D = stops here. Display only, pitch doesn't change" },
  "\u98CE\u683C": { en: "Style" },
  "\u62CD\u5B50\u8F7B\u91CD": { en: "Beat weighting" },
  "\u98CE\u683C\u8BB0\u53F7\uFF1A\u4ECE\u5149\u6807\u524D\u90A3\u4E2A\u97F3\u8D77\u5230\u8FD9\u5F20\u7EB8\u7ED3\u5C3E\uFF0C\u6BCF\u4E2A\u97F3\u6309\u5B83\u5728\u5C0F\u8282\u91CC\u7684\u4F4D\u7F6E\u8F7B\u4E00\u70B9 / \u91CD\u4E00\u70B9\uFF08\u53E4\u5178 / \u6D41\u884C / \u534E\u5C14\u5179 / \u8FDB\u884C\u66F2\u2026\u70B9\u5F00\u9009\uFF09\uFF1B\u6574\u5F20\u7EB8\u7684\u58F0\u90E8\u4E00\u8D77\u542C\uFF0C\u5404\u4EBA\u8DDF\u591A\u5C11\u6309\u4E50\u5668": { en: "Style mark: from the note before the cursor to the end of the sheet, each note gets lighter / heavier by its place in the bar (classical / pop / waltz / march\u2026 tap to choose); all parts on the sheet follow, each by instrument" },
  "\u53CD\u590D": { en: "Repeat" },
  "\u8C31\u5185\u53CD\u590D / \u8DF3\u8F6C\uFF1A|: :|\u3001\u623F\u5B50 1. 2.\u3001Segno / Coda / D.C. / D.S. / Fine\u2026\uFF08\u70B9\u5F00\u9009\uFF1B\u63D2\u5728\u5149\u6807\u5904\uFF0C\u6328\u7740\u5C0F\u8282\u7EBF = \u628A\u90A3\u6761\u6539\u6210\u53CD\u590D\u7684\uFF09\u3002\u4E0D\u8DE8\u7EB8\uFF1B\u653E\u7684\u65F6\u5019\u53EA\u770B\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4E2A\u58F0\u90E8\u90A3\u4E00\u884C": { en: "Score repeats / jumps: |: :|, endings 1. 2., Segno / Coda / D.C. / D.S. / Fine\u2026 (tap to choose; inserted at the cursor, next to a barline = turns it into a repeat). Doesn't cross sheets; playback only looks at this sheet's top part" },
  "\u5927\u8C31\u8868\uFF1A\u8FD9\u4E2A\u97F3\u6362\u5230\u53E6\u4E00\u5F20\u8C31\u8868": { en: "Grand staff: move this note to the other staff" },
  "{who}\u7684\u97F3\u57DF\u91CC": { en: "Within {who}'s range" },
  "\u77ED\u4E00\u6B65": { en: "Shorter" },
  "\u77ED\u4E00\u6B65\uFF08\u9000\u683C\uFF09\uFF1A\u9009\u4E2D\u7684\u8FD9\u4E2A\u97F3\u77ED\u4E00\u6863\uFF0C\u7A7A\u51FA\u6765\u7684\u53D8\u6210\u4F11\u6B62": { en: "One step shorter (backspace): the selected note gets one notch shorter, and the freed space becomes a rest" },
  "\u957F\u4E00\u6B65": { en: "Longer" },
  "{name}\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1\u6362\u8C03 / \u70B9\u5F00\u9009\u8C03\u548C\u8C03\u5F0F": { en: "{name}: hold and slide up or down to change key / tap to pick key and mode" },
  "\u957F\u77ED\u57FA\u7EBF\uFF1A{p}{tuplet}\u2014\u2014\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009": { en: "Note length: {p}{tuplet} \u2014 hold and slide up / down, or tap to choose" },
  "\uFF08{tuplet} \u8FDE\u97F3\uFF09": { en: " ({tuplet}-tuplet)" },
  "\u97F3\u57DF {rowShift}\uFF1A\u6309\u4F4F\u4E0A\u4E0B\u6ED1 / \u70B9\u5F00\u9009\u2014\u2014\u50CF\u63A8\u4E00\u5F20\u7EB8\uFF0C\u5F80\u4E0A\u63A8 = \u770B\u4E0B\u9762\u66F4\u4F4E\u7684": { en: "Range {rowShift}: hold and slide up / down, or tap to choose \u2014 like pushing a sheet of paper: pushing up shows lower notes" },
  "pad \u7684\u8C03\uFF08\u4E94\u5EA6\u5708\uFF09": { en: "The pad's key (circle of fifths)" },
  "\u957F\u77ED\u57FA\u7EBF": { en: "Note length" },
  "\u97F3\u57DF\u7A97\u53E3": { en: "Range window" },
  "\u4E0D\u8FDE": { en: "No tuplet" },
  "\u8FDE\u97F3": { en: "Tuplets" },
  "\u8C03\u5F0F\uFF1Apad \u4E0A\u6392\u54EA\u4E9B\u97F3": { en: "Mode: which notes the pad lays out" },
  ' data-def="{def}" title="\u53CC\u51FB\u56DE {defText}"': { en: ' data-def="{def}" title="Double-click: back to {defText}"' },
  "SoundFont \u4E50\u5668": { en: "SoundFont instrument" },
  "SoundFont \u4E50\u5668\uFF08TinySoundFont \u51FA\u58F0\uFF09": { en: "SoundFont instrument (sounds via TinySoundFont)" },
  "\u53F0\u4E0A\u7684\u4E0D\u662F SoundFont \u4E50\u5668": { en: "The performer on stage isn't a SoundFont instrument" },
  "\u529B\u5EA6##MIDI": { en: "Velocity" },
  "\u8F7B\u4E00\u70B9\uFF08MIDI \u529B\u5EA6 \u22128\uFF09": { en: "A little softer (MIDI velocity \u22128)" },
  "\u91CD\u4E00\u70B9\uFF08+8\uFF09": { en: "A little harder (+8)" },
  "\u56DE\u5230 {def}": { en: "Back to {def}" },
  "\u6CA1\u5199\u529B\u5EA6\u8BB0\u53F7\u7684\u97F3\u6309\u8FD9\u4E2A\u529B\u5EA6\uFF08MIDI 1\u2013127\uFF09\u3002{dynamicsVel}{L}": { en: "Notes without a dynamic use this velocity (MIDI 1\u2013127). {dynamicsVel}{L}" },
  "\u529B\u5EA6\u8BB0\u53F7\u6309\u8FD9\u4F4D\u7684\u529B\u5EA6\u8868\uFF08\u91CD\u97F3 +{accentVel}\u3001\u5F3A\u97F3 +{marcatoVel}\uFF1B\u522B\u7684\u8BB0\u53F7\u89C1\u4E0B\u9762\u300C\u8BB0\u53F7\u600E\u4E48\u6F14\u300D\uFF09\uFF1A{L}": { en: "Dynamics follow this performer's velocity table (accent +{accentVel}, marcato +{marcatoVel}; for other marks see \u201CHow marks are performed\u201D below): {L}" },
  "\u8FD9\u4F4D\u662F\u4E4B\u524D\u4E0A\u573A\u7684\uFF1A\u529B\u5EA6\u8BB0\u53F7\u8FD8\u662F\u53EA\u6539\u97F3\u91CF\uFF1A{p}": { en: "This performer came on stage earlier: dynamics still only change volume: {p}" },
  "GS \u91CC\u8FD9\u4E2A\u97F3\u8272\u6709 {count} \u4E2A\u529B\u5EA6\u5C42{p}\uFF1A\u8DE8\u5C42 = \u6362\u4E00\u4EFD\u5F55\u97F3\uFF0C\u97F3\u8272\u4F1A\u53D8\uFF0C\u4E0D\u53EA\u662F\u54CD\u5EA6\u3002": { en: "This GS sound has {count} velocity layers{p}: crossing a layer = a different recording, so timbre changes, not just loudness." },
  "\uFF0C\u73B0\u5728\u5728\u7B2C {p} \u5C42\uFF08{p2}\u2013{p3}\uFF09": { en: ", now on layer {p} ({p2}\u2013{p3})" },
  "GS \u91CC\u8FD9\u4E2A\u97F3\u8272\u53EA\u6709\u4E00\u4E2A\u529B\u5EA6\u5C42\uFF1A\u529B\u5EA6\u53EA\u6539\u54CD\u5EA6\u3002": { en: "This GS sound has one velocity layer: velocity only changes loudness." },
  "\u56FA\u5B9A\u539F\u901F": { en: "Fixed speed" },
  "\u6BCF\u4E2A\u97F3\u90FD\u6572\u539F\u901F\u952E\uFF1A\u5199\u8C31\u6309\u952E\u3001\u64AD\u653E\u90FD\u662F\u539F\u6765\u7684\u6837\u5B50\uFF1B\u8C31\u4E0A\u5199\u7684\u97F3\u9AD8\u7167\u7559\uFF0C\u53EA\u662F\u4E0D\u62FF\u6765\u51FA\u58F0": { en: "Every note strikes the original-speed key: writing, keys and playback all sound original; the written pitch stays on the score, it's just not used for sound" },
  "\u97F3\u9AD8\u5BF9\u9F50": { en: "Pitch align" },
  "\u6309\u539F\u901F\u65F6\u6700\u5F3A\u7684\u90A3\u4E2A\u9891\u7387\u5927\u81F4\u5BF9\u9F50\uFF0C\u8C31\u4E0A\u7684\u97F3 \u2248 \u542C\u5230\u7684\u97F3\uFF1B\u4E0D\u4E00\u5B9A\u662F\u8033\u6735\u542C\u5230\u7684\u4E3B\u97F3": { en: "Aligns the strongest frequency at original speed, so the written note \u2248 what you hear; not always the perceived main pitch" },
  "\u8C31\u4E0A\u5199\u4E0D\u540C\u7684\u97F3\u4E5F\u90FD\u54CD\u539F\u6765\u7684\u6837\u5B50\uFF08\u97F3\u9AD8\u7559\u5728\u8C31\u4E0A\uFF0C\u5173\u6389\u5C31\u6309\u5B83\u53D8\u8C03\uFF09": { en: "Different written notes all sound original (pitch stays on the score; turn this off to transpose by it)" },
  "\u5199\u7684\u97F3 \u2248 \u542C\u5230\u7684\u97F3\uFF08\u5927\u81F4\uFF09": { en: "Written note \u2248 what you hear (roughly)" },
  "\u6309\u5199\u7684\u97F3\u53D8\u8C03\u53D8\u901F\uFF1A\u8D8A\u9AD8\u8D8A\u5C16\u8D8A\u5FEB\uFF0C\u8D8A\u4F4E\u8D8A\u6C89\u8D8A\u6162{sfx}": { en: "Varies pitch and speed by the written note: higher is shriller and faster, lower is deeper and slower{sfx}" },
  "\uFF1B\u8FD9\u4E2A\u97F3\u6548\u539F\u901F\u65F6\u542C\u4E0D\u51FA\u97F3\u9AD8\uFF0C\u6CA1\u6CD5\u5BF9\u9F50": { en: "; this sound effect has no audible pitch at original speed, so it can't align" },
  "\u4FEE\u516B\u5EA6": { en: "Octave fix" },
  "{p}{tr} \u534A\u97F3": { en: "{p}{tr} semitones" },
  "\u4F4E\u4E00\u4E2A\u516B\u5EA6": { en: "Down an octave" },
  "\u4F4E\u534A\u97F3": { en: "Down a semitone" },
  "\u9AD8\u534A\u97F3": { en: "Up a semitone" },
  "\u9AD8\u4E00\u4E2A\u516B\u5EA6": { en: "Up an octave" },
  "\u56DE\u5230 0": { en: "Back to 0" },
  "\u5F52\u96F6": { en: "Reset" },
  "\u5927\u90E8\u5206\u60C5\u51B5\u4E0D\u7528\u52A8\uFF1A\u67D0\u4E9B\u97F3\u8272\u672C\u8EAB\u5C31\u5DEE\u516B\u5EA6\uFF08\u6BD4\u5982 GS \u7684 Guitar Harmonics \u9AD8\u4E24\u4E2A\u516B\u5EA6\uFF09\u65F6\u515C\u5E95\uFF0C\u8C03\u597D\u540E\u5199\u4EC0\u4E48\u97F3\u5C31\u54CD\u4EC0\u4E48\u97F3": { en: "Rarely needed: a fallback when a sound is itself off by octaves (e.g. GS Guitar Harmonics is two octaves high); once fixed, what you write is what sounds" },
  "\u4E0D\u56FA\u5B9A\u539F\u901F\uFF08\u6309\u5199\u7684\u97F3\u53D8\u8C03\uFF09": { en: "Not fixed speed (transposes by the written note)" },
  "\u300C{rn}\u300D\u97F3\u9AD8\u5BF9\u9F50{on}": { en: "\u201C{rn}\u201D pitch align{on}" },
  "\u300C{rn}\u300D\u4FEE\u516B\u5EA6 / \u79FB\u8C03 {next} \u534A\u97F3": { en: "\u201C{rn}\u201D octave fix / transpose {next} semitones" },
  "\u300C{rn}\u300D\u529B\u5EA6 {p}": { en: "\u201C{rn}\u201D velocity {p}" },
  "\u9F50\u5E73": { en: "Leveling" },
  "\u6BCF\u4E2A\u5B57\u7684\u54CD\u5EA6\u5F80\u6574\u53E5\u7684\u4E2D\u4F4D\u6570\u62C9\u51E0\u6210\uFF1A\u5173 = \u7167\u5FF5\u7684\u65F6\u5019\u81EA\u5DF1\u7684\u8F7B\u91CD\uFF08\u5B57\u548C\u5B57\u4E4B\u95F4\u54CD\u5EA6\u4E0D\u53EF\u63A7\uFF09\uFF1B0.8 = \u62C9\u516B\u6210\uFF08\u9ED8\u8BA4\uFF1B2026-10-14 \u5230 10-17 \u9ED8\u8BA4\u5173\u8FC7\uFF09\u3002\u56E2\u5B50 C \u6BB5\u7B2C 10 \u5C0F\u8282\u300C\u305D\u300D\u7684\u7834\u97F3\u662F\u9F50\u5E73\u300C\u6BCF\u5B57\u91CD\u8D77\u300D\u5728\u5B57\u7684\u8FB9\u754C\u4E0A\u8DF3\u51FA\u6765\u7684\u53F0\u9636\uFF0C\u300C\u8FDE\u7EED\u300D\u4E0D\u8DF3": { en: "How far each syllable's loudness is pulled toward the line's median: off = as spoken (loudness between syllables is uncontrolled); 0.8 = 80% (default). Restarting per syllable can step at syllable boundaries and crackle; \u201CContinuous\u201D doesn't step" },
  "\u9F50\u5E73\u8FC7\u6E21": { en: "Leveling transition" },
  "\u6BCF\u5B57\u91CD\u8D77": { en: "Per syllable" },
  "\u9F50\u5E73\u5F00\u7740\u65F6\u589E\u76CA\u600E\u4E48\u4ECE\u4E00\u4E2A\u5B57\u6362\u5230\u4E0B\u4E00\u4E2A\u5B57\uFF1A\u6BCF\u5B57\u91CD\u8D77 = \u5728\u6BCF\u4E2A\u5B57\u7684\u5143\u97F3\u8D77\u70B9\u4ECE 0 \u8D77\u300130 ms \u5185\u722C\u5230\u8FD9\u4E2A\u5B57\u7684\u76EE\u6807\uFF0C\u8F85\u97F3\u4E0D\u52A0\uFF1B\u8FDE\u7EED = \u4ECE\u524D\u4E00\u4E2A\u5B57\u7684\u589E\u76CA\u8D77\uFF0C\u7ECF\u8FC7\u8F85\u97F3\u5230\u5143\u97F3\u8D77\u70B9\u540E 30 ms \u5E73\u6ED1\u8FC7\u6E21\u5230\u8FD9\u4E2A\u5B57\u7684": { en: "How gain moves between syllables while leveling: per syllable = starts from 0 at each syllable's vowel onset and climbs to its target within 30 ms, consonants not boosted; continuous = smoothly from the previous syllable's gain, through the consonant, to this one's within 30 ms of the vowel onset" },
  "\u9F50\u5E73\u4E0A\u9650": { en: "Leveling limit" },
  "\u9F50\u5E73\u6700\u591A\u628A\u4E00\u4E2A\u5B57\u62C9\u51E0 dB": { en: "The most dB leveling can pull a syllable" },
  "\u501F\u5143\u97F3\u95E8\u69DB": { en: "Vowel-borrow threshold" },
  "\u4E00\u4E2A\u5B57\u81EA\u5DF1\u6700\u5E72\u51C0\u90A3\u4E09\u5206\u4E4B\u4E00\u5E27\u7684\u6742\u5EA6\u8D85\u8FC7\u8FD9\u4E2A\u6570 = \u5F53\u5B83\u662F\u6C14\u58F0\u5FF5\u7684\uFF0C\u62FF\u540C\u4E00\u53E5\u91CC\u522B\u7684\u5E72\u51C0\u7684\u540C\u5143\u97F3\u6765\u5531\uFF08\u300C\u305D\u300D\u662F 0.34\uFF09": { en: "If the noisiness of a syllable's cleanest third of frames exceeds this, it's treated as spoken breathily, and a clean same-vowel syllable from the line is sung instead" },
  "\u6C14\u606F": { en: "Breathiness" },
  "\u5B9E\u58F0": { en: "Clear" },
  "\u7167\u5FF5\u7684": { en: "As spoken" },
  "\u5408\u6210\u524D\u628A\u6BCF\u5E27\u6BCF\u4E2A\u9891\u6BB5\u7684\u6742\u5EA6\u538B\u5230\u8FD9\u4E2A\u5143\u97F3\u6700\u5E72\u51C0\u90A3\u51E0\u5E27\u7684\u7A0B\u5EA6\uFF1A0 = \u5168\u538B\u6210\u5B9E\u58F0\uFF0C1 = \u7167 piper \u5FF5\u51FA\u6765\u7684\u7559\u7740": { en: "Before synthesis, presses each frame's band noisiness down to the level of this vowel's cleanest frames: 0 = fully clear voice, 1 = keep what piper spoke" },
  "\u5C0F\u6708\u76F8\u672C\u4EBA\uFF08\u3064\u304F\u3088\u307F\u3061\u3083\u3093\uFF1B\u7B2C\u4E00\u6B21\u8981\u52A0\u8F7D\u7EA6 65 MB\uFF09": { en: "Tsukuyomi-chan herself (\u3064\u304F\u3088\u307F\u3061\u3083\u3093; loads about 65 MB the first time)" },
  "\uFF08\u9ED8\u8BA4\uFF09": { en: " (default)" },
  "\u6539\u4E86\u7528\u5230\u7684\u53E5\u5B50\u4F1A\u91CD\u5531\uFF1B\u5B58\u8FDB\u6B4C\u91CC\u3001\u80FD\u64A4\u9500": { en: "Changing it re-sings the lines that use it; saved in the song, can be undone" },
  "\u5206\u6BB5\u5531": { en: "Sing in segments" },
  "\u6BCF\u53E5": { en: "Per line" },
  "\u5728\u4F11\u6B62\u5904\u5207\uFF08\u4F11\u6B62 \u2265 0.25 \u79D2\uFF09\uFF1A\u5185\u5B58\u6700\u7701\uFF0C\u6539\u4E00\u53E5\u53EA\u91CD\u5531\u90A3\u4E00\u53E5": { en: "Cut at rests (rests \u2265 0.25 s): least memory; editing a line only re-sings that line" },
  "\u6BCF\u5F20\u7EB8": { en: "Per sheet" },
  "\u4E00\u5F20\u7EB8\u4E00\u6BB5": { en: "One segment per sheet" },
  "\u4E00\u6574\u9996": { en: "Whole song" },
  "\u4E00\u53E3\u6C14\u5531\u5B8C\uFF08\u4EE5\u524D\u7684\u5531\u6CD5\uFF1B\u957F\u6B4C\u5728 iPad \u4E0A\u53EF\u80FD\u5185\u5B58\u4E0D\u591F\uFF09": { en: "Sing it all at once (the old way; long songs may run out of memory on iPad)" },
  "\u4E00\u53E3\u6C14\u5531\u5B8C\uFF1A\u53E5\u548C\u53E5\u4E4B\u95F4\u5531\u6CD5\u6700\u8FDE\u8D2F\uFF0C\u4F46\u957F\u6B4C\u5728 iPad \u4E0A\u53EF\u80FD\u5185\u5B58\u4E0D\u591F": { en: "Sing it all at once: smoothest between lines, but long songs may run out of memory on iPad" },
  "\u5206\u6BB5\u5531\uFF1A\u4E00\u6BB5\u5531\u5B8C\u5C31\u653E\u6389\uFF0C\u91CD\u590D\u7684\u6BB5 / \u6CA1\u6539\u7684\u53E5\u5B50\u76F4\u63A5\u62FF\u4E0A\u6B21\u7684\uFF1B\u6BB5\u548C\u6BB5\u4E4B\u95F4\u5207\u5728\u4F11\u6B62 / \u7EB8\u754C\uFF0C\u6574\u9996\u6700\u540E\u7EDF\u4E00\u97F3\u91CF": { en: "Sing in segments: each is released after singing, repeated segments / unchanged lines reuse last time's; cuts fall at rests / sheet boundaries, with one volume for the whole song at the end" },
  "\u300C{rn}\u300D\u5206\u6BB5\u5531\uFF1A{p}": { en: "\u201C{rn}\u201D sing in segments: {p}" },
  "\u5C0F\u6708\u76F8\u7684\u5143\u97F3\u91C7\u6837\uFF1A\u6309\u4E0B\u5373\u54CD\u3001\u4EFB\u4F55\u8BBE\u5907\u90FD\u80FD\u8DD1": { en: "Tsukuyomi-chan's vowel samples: instant response, runs on any device" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u4E0D\u8BA9\u53CC\u51FB\u6253\u5F00\u7684\u7F51\u9875\u7528\u5B58\u50A8": { en: "This browser doesn't let pages opened by double-click use storage" },
  "\u8FD9\u4E2A\u6D4F\u89C8\u5668\u73B0\u5728\u4E0D\u8BA9\u8FD9\u4E00\u9875\u7528\u5B58\u50A8": { en: "This browser doesn't let this page use storage right now" },
  "\u548C itch \u4E0A\u522B\u7684\u6E38\u620F\u5171\u7528\u4E00\u4E2A\u5B58\u50A8\u6876": { en: "Shares one storage bucket with other games on itch" },
  "\u548C\u8FD9\u53F0\u7535\u8111\u4E0A\u522B\u7684\u53CC\u51FB\u6253\u5F00\u7684\u7F51\u9875\u5171\u7528\u4E00\u4E2A\u5B58\u50A8\u6876": { en: "Shares one storage bucket with other double-clicked pages on this computer" },
  "\u5199\u4E0D\u8FDB\u5B58\u50A8\u4E86\uFF08{why}\uFF09\uFF1A\u8FD9\u6B21\u6253\u5F00\u4E4B\u540E\u7684\u8BBE\u7F6E\u53EA\u7559\u5728\u5185\u5B58\u91CC": { en: "Can't write to storage ({why}): settings from now on stay in memory only" },
  "\u7F16\u6392\u3000": { en: "Arrangement\u2002" },
  " \u7B49 {n} \u5904": { en: " at {n} places" },
  "\u8FD9\u4E2A\u97F3\u77ED\u4E00\u70B9\u3001\u548C\u4E0B\u4E00\u4E2A\u97F3\u65AD\u5F00": { en: "Make this note short, detached from the next one" },
  "\u8FD9\u4E2A\u97F3\u7684\u97F3\u5934\u91CD\u4E00\u70B9": { en: "Lean on the start of this note" },
  "\u6BD4\u91CD\u97F3\u66F4\u91CD\u7684\u97F3\u5934": { en: "A heavier attack than an accent" },
  "\u6BD4\u91CD\u97F3\u8F7B\u4E00\u6863\u7684\u91CD\uFF08\u56DB\u62CD\u5B50\u91CC\u7684\u7B2C\u4E09\u62CD\u90A3\u79CD\uFF09": { en: "A lighter stress than an accent (like beat three in 4/4)" },
  "\u8FD9\u4E2A\u97F3\u8F7B\u4E00\u70B9": { en: "Play this note softer" },
  "\u51E0\u4E4E\u542C\u4E0D\u89C1\u7684\u97F3\uFF08\u53EA\u7559\u4E2A\u5F71\u5B50\uFF09": { en: "A note you can barely hear (just a shadow)" },
  "\u8FD9\u4E2A\u97F3\u5531 / \u594F\u6EE1\uFF0C\u4E0D\u548C\u4E0B\u4E00\u4E2A\u97F3\u65AD\u5F00": { en: "Hold this note full length, connected to the next one" },
  "\u8FD9\u4E2A\u97F3\u540E\u9762\u6362\u6C14": { en: "Breathe after this note" },
  "\u97F3\u5934\u7A81\u7136\u51B2\u4E00\u4E0B\u3001\u518D\u56DE\u5230\u5F53\u4E0B\u7684\u529B\u5EA6": { en: "A sudden burst at the start, then back to the current dynamic" },
  "\u97F3\u5934\u6309\u5F3A\u3001\u9A6C\u4E0A\u843D\u5230\u5F31\uFF0C\u540E\u9762\u7684\u97F3\u90FD\u662F\u5F31": { en: "Loud attack that drops straight to soft; the notes after stay soft" },
  "\u4E0D\u5531\u97F3\u9AD8\u3001\u7528\u6C14\u58F0\u5FF5\uFF08\u97F3\u9AD8\u7167\u5199\u5728\u8C31\u4E0A\uFF09": { en: "Speak this note in a breathy voice instead of singing the pitch (the pitch stays written)" },
  "\u8FD9\u4E2A\u97F3\u91CC\u9762\u4ECE\u5F31\u957F\u5230\u5199\u7684\u529B\u5EA6": { en: "Grow from soft to the written dynamic within this note" },
  "\u8FD9\u4E2A\u97F3\u91CC\u9762\u4ECE\u5199\u7684\u529B\u5EA6\u6536\u5F31": { en: "Fade from the written dynamic within this note" },
  "\u8FD9\u4E2A\u97F3\u91CC\u9762\u5148\u957F\u540E\u6536\uFF08messa di voce\uFF09": { en: "Grow then fade within this note (messa di voce)" },
  "\u548C\u5F26\u4ECE\u4F4E\u5230\u9AD8\u4E00\u4E2A\u4E2A\u62E8\u51FA\u6765": { en: "Roll the chord from the lowest note up" },
  "\u8FD9\u4E2A\u97F3\u5FEB\u901F\u5730\u53CD\u590D\u6572\uFF08\u6EDA\uFF09": { en: "Repeat this note rapidly (a roll)" },
  "\u529B\u5EA6\u8BB0\u53F7\uFF1A\u4ECE\u8FD9\u4E2A\u97F3\u8D77\u662F\u8FD9\u4E2A\u5F3A\u5F31\uFF0C\u7BA1\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7": { en: "Dynamic mark: from this note on, at this loudness, until the next dynamic mark" },
  "\u4ECE\u8FD9\u91CC\u8D77\u8D8A\u6765\u8D8A\u5F3A\uFF0C\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u4E3A\u6B62": { en: "Getting louder from here until the next dynamic mark" },
  "\u4ECE\u8FD9\u91CC\u8D77\u8D8A\u6765\u8D8A\u5F31\uFF0C\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u4E3A\u6B62": { en: "Getting softer from here until the next dynamic mark" },
  "\u4ECE\u4E0A\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u5747\u5300\u53D8\u5230\u8FD9\u4E00\u4E2A": { en: "Change evenly from the previous dynamic mark to this one" },
  "{src} \u8F7D\u8FDB\u6765\u4E86\uFF0C\u4F46\u91CC\u9762\u6CA1\u6709\u300C{key}\u300D": { en: "{src} loaded, but \u201C{key}\u201D isn't in it" },
  "\u5907\u7528\u7248\u6587\u4EF6\u5939\u91CC\u5C11\u4E86 {src}\uFF08\u6216\u6D4F\u89C8\u5668\u4E0D\u8BA9\u8BFB\uFF09": { en: "{src} is missing from the standalone folder (or the browser won't let it be read)" },
  "\u5907\u7528\u7248\u91CC\u6CA1\u6709 {path}": { en: "{path} isn't in the standalone version" },
  "{path}\uFF1A\u5907\u7528\u7248\u6587\u4EF6\u5939\u91CC\u7684\u8FD9\u4E2A\u6587\u4EF6\u548C app \u91CC\u9489\u7684\u54C8\u5E0C\u5BF9\u4E0D\u4E0A\uFF08\u88AB\u6539\u8FC7\u6216\u574F\u4E86\uFF09": { en: "{path}: this file in the standalone folder doesn't match the hash pinned in the app (modified or damaged)" },
  "{path}\uFF1A\u548C app \u91CC\u9489\u7684\u54C8\u5E0C\u5BF9\u4E0D\u4E0A\uFF08\u88AB\u6539\u8FC7\u6216\u574F\u4E86\uFF09": { en: "{path}: doesn't match the hash pinned in the app (modified or damaged)" },
  "\u5C11\u4E86\u300C{close}\u300D": { en: "Missing \u201C{close}\u201D" },
  "\u591A\u4E86\u300C{c}\u300D": { en: "Extra \u201C{c}\u201D" },
  "\u770B\u4E0D\u61C2\u300C{p}\u300D": { en: "Can't understand \u201C{p}\u201D" },
  "\u6CA1\u6709\u53EB\u300C{name}\u300D\u7684\u7EB8\uFF08\u5199\u66F2\u6BB5\u540D\uFF0C\u6216\u8005\u7B2C\u51E0\u5F20\u7EB8\u7684\u5E8F\u53F7\uFF09": { en: "No sheet named \u201C{name}\u201D (write a section name, or a sheet number)" },
  "\u91CD\u590D\u6B21\u6570\u8981\u5728 1 \u5230 99 \u4E4B\u95F4": { en: "Repeat counts must be 1 to 99" },
  "\u5FAA\u73AF\u6BB5\u662F\u7A7A\u7684": { en: "The loop section is empty" },
  "\u5FAA\u73AF\u6BB5\u53EA\u80FD\u653E\u5728\u6700\u540E\uFF1A\u540E\u9762\u7684\u6C38\u8FDC\u653E\u4E0D\u5230": { en: "The loop section can only be last: anything after it would never play" },
  "\u9AD8\u97F3": { en: "Treble" },
  "\u9AD8\u97F3 8vb": { en: "Treble 8vb" },
  "\u9AD8\u97F3 8va": { en: "Treble 8va" },
  "\u9AD8\u97F3 15ma": { en: "Treble 15ma" },
  "\u4F4E\u97F3": { en: "Bass" },
  "\u4F4E\u97F3 8vb": { en: "Bass 8vb" },
  "\u9AD8\u97F3\u8C31\u53F7": { en: "Treble clef" },
  "\u9AD8\u97F3\u8C31\u53F7\u4E0B\u9762\u6302 8\uFF1A\u8C31\u4E0A\u5199\u7684\u97F3\u5B9E\u9645\u4F4E\u4E00\u4E2A\u516B\u5EA6\u54CD\uFF08\u5409\u4ED6\u3001\u7537\u9AD8\u97F3\uFF09": { en: "Treble clef with 8 below: written notes sound an octave lower (guitar, tenor)" },
  "\u9AD8\u97F3\u8C31\u53F7\u4E0A\u9762\u6302 8\uFF1A\u5B9E\u9645\u9AD8\u4E00\u4E2A\u516B\u5EA6\uFF08\u77ED\u7B1B\uFF09": { en: "Treble clef with 8 above: sounds an octave higher (piccolo)" },
  "\u9AD8\u97F3\u8C31\u53F7\u4E0A\u9762\u6302 15\uFF1A\u5B9E\u9645\u9AD8\u4E24\u4E2A\u516B\u5EA6\uFF08\u949F\u7434\u3001\u94C3\uFF09": { en: "Treble clef with 15 above: sounds two octaves higher (glockenspiel, bells)" },
  "\u4F4E\u97F3\u8C31\u53F7": { en: "Bass clef" },
  "\u4F4E\u97F3\u8C31\u53F7\u4E0B\u9762\u6302 8\uFF1A\u5B9E\u9645\u4F4E\u4E00\u4E2A\u516B\u5EA6\uFF08\u4F4E\u97F3\u63D0\u7434\u3001\u8D1D\u65AF\uFF09": { en: "Bass clef with 8 below: sounds an octave lower (double bass, bass guitar)" },
  "\u7ED3\u675F\u516B\u5EA6\u7EBF": { en: "End ottava line" },
  "\u6700\u91CD": { en: "strongest" },
  "\u5F88\u91CD": { en: "very strong" },
  "\u91CD": { en: "strong" },
  "\u7A0D\u91CD": { en: "slightly strong" },
  "\u7A0D\u8F7B": { en: "slightly light" },
  "\u8F7B": { en: "light" },
  "\u4E00": { en: "1" },
  "\u4E8C": { en: "2" },
  "\u4E09": { en: "3" },
  "\u56DB": { en: "4" },
  "\u4E94": { en: "5" },
  "\u516D": { en: "6" },
  "\u4E03": { en: "7" },
  "\u516B": { en: "8" },
  "\u4E5D": { en: "9" },
  "\u5341": { en: "10" },
  "\u5341\u4E00": { en: "11" },
  "\u5341\u4E8C": { en: "12" },
  "{p}\u62CD {p2}": { en: "Beat {p} {p2}" },
  "\u4E24\u5C0F\u8282\u4E00\u8F6E\uFF1A\u7B2C\u4E00\u5C0F\u8282 {p}\uFF1B\u7B2C\u4E8C\u5C0F\u8282 {p2}\uFF1B\u91CD\u7684\u683C\u5B50\uFF08\u5C0F\u8282-\u7B2C\u51E0\u4E2A\u5341\u516D\u5206\uFF09{p3}": { en: "Two-bar cycle: first bar {p}; second bar {p2}; strong slots (bar-sixteenth) {p3}" },
  "\u62CD\u91CC\u7684\u516B\u5206": { en: "Eighths within the beat" },
  "\u534A\u62CD": { en: "Half-beat" },
  "\uFF1B\u66F4\u7EC6\u7684 {finer}": { en: "; finer {finer}" },
  "\u52A0\u4E86\u4E00\u5F20\u7EB8": { en: "Added a sheet" },
  "\u5220\u4E86\u4E00\u5F20\u7EB8": { en: "Deleted a sheet" },
  "\u52A0\u4E86\u4E00\u4E2A\u58F0\u90E8": { en: "Added a part" },
  "\u5220\u4E86\u4E00\u4E2A\u58F0\u90E8": { en: "Deleted a part" },
  "\u632A\u4E86\u58F0\u90E8\u987A\u5E8F": { en: "Reordered parts" },
  "\u5199\u4E86 {d} \u4E2A": { en: "Wrote {d}" },
  "\u5220\u4E86 {d} \u4E2A": { en: "Deleted {d}" },
  "\u6539\u6B4C\u540D": { en: "Changed title" },
  "\u6539\u4F5C\u8005\u680F": { en: "Changed credits" },
  "\u6539\u66F2\u6BB5\u540D": { en: "Renamed section" },
  "\u6539##\u8C31": { en: "Edited" },
  "{engineName}\u4E0D\u5531\u6B4C\u8BCD\uFF08\u53EA\u54FC / \u53EA\u5F39\uFF09\uFF1B\u6B4C\u8BCD\u7167\u5199\u7167\u5B58": { en: "{engineName} doesn't sing lyrics (only hums / plays); lyrics are still written and saved" },
  "\u8FD9\u4E00\u6BB5\u6709\u5047\u540D\u3001\u6309\u65E5\u8BED\u5531\uFF1A\u6C49\u5B57\u5C0F\u6708\u76F8\u6309\u8BFB\u97F3\u6570\u62CD\uFF0C\u4E00\u4E2A\u5B57\u53EF\u80FD\u597D\u51E0\u62CD\u3001\u5BF9\u4E0D\u4E0A\u97F3\u2014\u2014\u5199\u6210\u5047\u540D\uFF08\u4E00\u6BB5\u90FD\u662F\u6C49\u5B57\u624D\u6309\u4E2D\u6587\u5531\uFF1B\u6BB5 = \u4E50\u5668\u8BBE\u7F6E\u91CC\u7684\u300C\u5206\u6BB5\u5531\u300D\uFF09": { en: "This segment has kana and is sung in Japanese: Tsukuyomi-chan counts kanji by reading, so one character may take several beats and miss the notes \u2014 write it in kana (a segment is sung in Chinese only if it's all kanji; segment = \u201CSing in segments\u201D in instrument settings)" },
  "\u4E00\u4E2A\u97F3\u4E0A {beats} \u62CD\uFF1A\u5C0F\u6708\u76F8\u4E00\u4E2A\u97F3\u5531\u4E00\u62CD\u2014\u2014\u62C6\u6210 {beats2} \u4E2A\u97F3\uFF0C\u6216\u8005\u7528\u300C+\u300D\u8FDE\u7740\u5199": { en: "{beats} beats on one note: Tsukuyomi-chan sings one beat per note \u2014 split into {beats2} notes, or join with \u201C+\u201D" },
  "\u8FD9\u4E00\u6BB5\u6309\u65E5\u8BED\u5531\uFF1A\u5B57\u6BCD / \u6570\u5B57 / \u7B26\u53F7\u5FF5\u4E0D\u51C6\u2014\u2014\u5199\u6210\u5047\u540D": { en: "This segment is sung in Japanese: letters / digits / symbols aren't read reliably \u2014 write them in kana" },
  "\u8FD9\u4E00\u6BB5\u6309\u4E2D\u6587\u5531\uFF1A\u4E00\u4E2A\u97F3\u5199\u4E00\u4E2A\u6C49\u5B57": { en: "This segment is sung in Chinese: one character per note" },
  "\u8FD9\u4E00\u6BB5\u6309\u82F1\u6587\u5531\uFF1A\u5199\u62C9\u4E01\u5B57\u6BCD": { en: "This segment is sung in English: use Latin letters" },
  "\u8212\u9002": { en: "Comfortable" },
  "\u8C31\u5927\u3001\u97F3\u8DDD\u6B63\u5E38\uFF1A\u6478\u4E3B\u65CB\u5F8B\u3001\u5199\u6B4C\u8BCD": { en: "Large staves, normal note spacing: for sketching the melody and lyrics" },
  "\u7D27\u51D1": { en: "Compact" },
  "\u8C31\u5C0F\u3001\u97F3\u8DDD\u7D27\u3001\u884C\u8DDD\u518D\u5377\u4E00\u70B9\uFF1A\u914D\u5668\uFF1B\u6B4C\u540D\u548C\u58F0\u90E8\u540D\u7167\u5927\u7684\uFF0C\u6B4C\u8BCD\u7528\u5C0F\u5B57": { en: "Small staves, tight note spacing and rows: for arranging; titles and part names stay large, lyrics are small" },
  "\u6A2A\u653E\uFF1A\u603B\u8C31 / \u5927\u5C4F": { en: "Landscape: scores / large screens" },
  "\u6B63\u7ECF\u7EB8": { en: "Standard paper" },
  "\u5C0F\u518C\u5B50\uFF08A4 \u5BF9\u6298\uFF09": { en: "Booklet (A4 folded)" },
  "\u53E3\u888B\u672C": { en: "Pocket" },
  "A3 \u6A2A": { en: "A3 landscape" },
  "\u53CD\u590D / \u8DF3\u8F6C\u53EA\u770B\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4E2A\u58F0\u90E8\u90A3\u4E00\u884C": { en: "Repeats / jumps only count on this sheet's top part" },
  "\u8FD9\u5F20\u7EB8\u4E0A\u6CA1\u6709 Segno\uFF0CD.S. \u8DF3\u4E0D\u4E86": { en: "No Segno on this sheet, so D.S. can't jump" },
  "\u6CA1\u6709 To Coda\uFF1A\u8DF3\u56DE\u6765\u4E4B\u540E\u4E00\u8DEF\u653E\u5230\u7EB8\u5C3E": { en: "No To Coda: after jumping back it plays to the end of the sheet" },
  "\u4E3B\u5531": { en: "Lead vocal" },
  "\u548C\u58F0": { en: "Harmony" },
  "\u5973\u9AD8\u97F3\uFF08\u5408\u5531\uFF09": { en: "Soprano (choir)" },
  "\u5973\u4F4E\u97F3\uFF08\u5408\u5531\uFF09": { en: "Alto (choir)" },
  "\u7537\u9AD8\u97F3\uFF08\u5408\u5531\uFF09": { en: "Tenor (choir)" },
  "\u7537\u4F4E\u97F3\uFF08\u5408\u5531\uFF09": { en: "Bass (choir)" },
  "\u4E50\u961F": { en: "Band" },
  "\u94A2\u7434 / \u952E\u76D8": { en: "Piano / keys" },
  "\u5409\u4ED6": { en: "Guitar" },
  "\u8D1D\u65AF": { en: "Bass" },
  "\u9F13": { en: "Drums" },
  "\u5F26\u4E50": { en: "Strings" },
  "\u5408\u6210\u94FA\u5E95": { en: "Synth pad" },
  "\u5408\u6210\u4E3B\u97F3": { en: "Synth lead" },
  "\u5927\u8C03": { en: "Major" },
  "\u5927\u5C0F\u8C03": { en: "Major / minor" },
  "\u5C0F\u8C03": { en: "Minor" },
  "\u548C\u58F0\u5C0F\u8C03": { en: "Harmonic minor" },
  "\u65CB\u5F8B\u5C0F\u8C03": { en: "Melodic minor" },
  "\u5BAB\u8C03\u5F0F": { en: "Gong mode" },
  "\u4E94\u58F0": { en: "Pentatonic" },
  "\u5546\u8C03\u5F0F": { en: "Shang mode" },
  "\u89D2\u8C03\u5F0F": { en: "Jue mode" },
  "\u5FB5\u8C03\u5F0F": { en: "Zhi mode" },
  "\u7FBD\u8C03\u5F0F": { en: "Yu mode" },
  "\u516D\u58F0\u52A0\u6E05\u89D2": { en: "Hexatonic + qingjue" },
  "\u6C11\u65CF": { en: "Chinese" },
  "\u516D\u58F0\u52A0\u53D8\u5BAB": { en: "Hexatonic + biangong" },
  "\u96C5\u4E50": { en: "Yayue" },
  "\u71D5\u4E50": { en: "Yanyue" },
  "\u90FD\u8282": { en: "Miyako-bushi" },
  "\u65E5\u672C": { en: "Japanese" },
  "\u7409\u7403": { en: "Ryukyu" },
  "\u5E03\u9C81\u65AF": { en: "Blues" },
  "\u591A\u5229\u4E9A": { en: "Dorian" },
  "\u6559\u4F1A\u8C03\u5F0F": { en: "Church modes" },
  "\u5F17\u91CC\u51E0\u4E9A": { en: "Phrygian" },
  "\u5229\u5E95\u4E9A": { en: "Lydian" },
  "\u6DF7\u5408\u5229\u5E95\u4E9A": { en: "Mixolydian" },
  "\u6D1B\u514B\u5229\u4E9A": { en: "Locrian" },
  "\u897F\u73ED\u7259": { en: "Spanish" },
  "\u963F\u62C9\u4F2F": { en: "Arabic" },
  "\u5308\u7259\u5229\u5C0F\u8C03": { en: "Hungarian minor" },
  "\u5168\u97F3\u9636": { en: "Whole tone" },
  "\u534A\u97F3\u9636": { en: "Chromatic" },
  "\u5E7F\u677F": { en: "Largo" },
  "\u5C0F\u5E7F\u677F": { en: "Larghetto" },
  "\u67D4\u677F": { en: "Adagio" },
  "\u884C\u677F": { en: "Andante" },
  "\u4E2D\u677F": { en: "Moderato" },
  "\u5C0F\u5FEB\u677F": { en: "Allegretto" },
  "\u5FEB\u677F": { en: "Allegro" },
  "\u6D3B\u677F": { en: "Vivace" },
  "\u6025\u677F": { en: "Presto" },
  "\u6700\u6025\u677F": { en: "Prestissimo" },
  "\u5C0F\u6708\u76F8\u7684 worker \u51FA\u9519": { en: "Tsukuyomi-chan's worker failed" },
  "\u5C0F\u6708\u76F8\u7684 worker \u91CD\u5F00\u4E86": { en: "Tsukuyomi-chan's worker restarted" },
  "\u5185\u5B58\u4E0D\u591F\uFF1A\u91CD\u5F00\u5C0F\u6708\u76F8\u7684\u5F15\u64CE\u518D\u8BD5\u4E00\u6B21": { en: "Out of memory: restarting Tsukuyomi-chan's engine to try again" },
  "\u8FD9\u53F0\u8BBE\u5907\u7684\u5185\u5B58\u4E0D\u591F\uFF0C\u5C0F\u6708\u76F8\u7684\u5F15\u64CE\u8D77\u4E0D\u6765\uFF08\u5DF2\u7ECF\u91CD\u5F00\u8FC7\u4E00\u6B21\u5F15\u64CE\uFF09\u3002\u53EF\u4EE5\u628A\u522B\u7684\u4E50\u5668\u58F0\u90E8\u9759\u97F3\u518D\u653E\uFF0C\u6216\u8005\u5173\u6389 app \u91CD\u65B0\u6253\u5F00\uFF1B\u4E5F\u53EF\u4EE5\u7ED9\u8FD9\u4E2A\u58F0\u90E8\u6362\u300C\u5C0F\u6708\u76F8\uFF08\u5143\u97F3\uFF09\u300D": { en: "This device doesn't have enough memory to start Tsukuyomi-chan's engine (already restarted once). You can mute other instrument parts and play again, or close and reopen the app; or switch this part to \u201CTsukuyomi-chan (vowels)\u201D" },
  "\u4ECE\u6587\u4EF6\u5939\u8BFB{what}": { en: "Reading {what} from the folder" },
  "\u4E0B\u8F7D{what}\uFF08{e6} MB\uFF0C\u53EA\u4E0B\u8FD9\u4E00\u6B21\uFF09{total}%": { en: "Downloading {what} ({e6} MB, only this once) {total}%" },
  "{what}\u4E0B\u8F7D\u4E0D\u4E0B\u6765\uFF08\u8BD5\u8FC7 {p}\uFF09\uFF1A{Error}\u3002\u53EF\u4EE5\u5728\u8BBE\u7F6E\u91CC\u6362\u6A21\u578B\u6765\u6E90\uFF0C\u6216\u4ECE\u672C\u673A\u6587\u4EF6\u5BFC\u5165": { en: "{what} couldn't be downloaded (tried {p}): {Error}. You can change the model source in Settings, or import from a local file" },
  "\u7F13\u5B58\u91CC\u7684\u5C0F\u6708\u76F8\u6A21\u578B\u548C\u6E05\u5355\u5BF9\u4E0D\u4E0A\uFF08\u88AB\u6539\u8FC7\u6216\u574F\u4E86\uFF09\uFF0C\u574F\u7684\u90A3\u4E00\u7247\u5DF2\u7ECF\u4E22\u6389\uFF1A\u518D\u5531\u4E00\u6B21\u4F1A\u91CD\u65B0\u4E0B\u8F7D\uFF08{Error}\uFF09": { en: "The cached Tsukuyomi-chan model doesn't match its manifest (modified or damaged); the bad chunk was discarded: singing again will re-download it ({Error})" },
  "{slug}: \u5305\u91CC\u6CA1\u6709 {path}": { en: "{slug}: {path} isn't in the pack" },
  "\u52A0\u8F7D piper \u5F15\u64CE": { en: "Loading the piper engine" },
  "\u52A0\u8F7D\u5C0F\u6708\u76F8\u7684\u6A21\u578B": { en: "Loading Tsukuyomi-chan's model" },
  "\u52A0\u8F7D\u65E5\u8BED\u524D\u7AEF": { en: "Loading the Japanese front end" },
  "\u4E2D\u6587\u524D\u7AEF": { en: "Chinese front end" },
  "\u82F1\u6587\u8BCD\u5178": { en: "English dictionary" },
  "\u52A0\u8F7D WORLD": { en: "Loading WORLD" },
  "\u4E3B\u7EBF\u7A0B\u6CA1\u8BFB\u5230\u8FD9\u4E2A\u6587\u4EF6": { en: "The main thread couldn't read this file" },
  "\u5C0F\u6708\u76F8\u5728\u5531": { en: "Tsukuyomi-chan is singing" },
  "\u5FF5\uFF081/2\uFF09": { en: "Speaking (1/2)" },
  "\u5FF5\uFF082/2\uFF09": { en: "Speaking (2/2)" },
  "\u5206\u6790\uFF081/3 \u97F3\u9AD8\uFF09": { en: "Analyzing (1/3 pitch)" },
  "\u5206\u6790\uFF082/3 \u8C31\u5305\u7EDC\uFF09": { en: "Analyzing (2/3 spectral envelope)" },
  "\u5206\u6790\uFF083/3 \u6C14\u58F0\uFF09": { en: "Analyzing (3/3 breathiness)" },
  "\u5206\u6790\uFF08\u7F13\u5B58\uFF09": { en: "Analyzing (cached)" },
  "\u5408\u6210": { en: "Synthesizing" },
  "\u8FD9\u4E0D\u662F\u4E00\u4E2A\u7F51\u5740\uFF1A{link}": { en: "This is not a web address: {link}" },
  "\u53EA\u8BA4 https \u5F00\u5934\u7684\u94FE\u63A5\uFF1A{link}": { en: "Only links starting with https work: {link}" },
  "Google Drive \u4E0D\u8BA9\u522B\u7684\u7F51\u9875\u76F4\u63A5\u8BFB\u91CC\u9762\u7684\u6587\u4EF6\uFF0C\u8FD9\u6761\u94FE\u63A5\u6253\u4E0D\u5F00\u3002\u6362\u6210 Dropbox\u3001OneDrive\u3001GitHub\uFF0C\u6216\u8005\u81EA\u5DF1\u7F51\u7AD9\u4E0A\u7684\u76F4\u94FE\u3002": { en: "Google Drive does not let other web pages read its files, so this link can\u2019t be opened. Use Dropbox, OneDrive, GitHub, or a direct link on your own site." },
  "\u8FD9\u662F Dropbox \u7684\u6587\u4EF6\u5939\u94FE\u63A5\uFF1A\u8981\u5206\u4EAB\u5355\u4E2A\u6B4C\u6587\u4EF6\u7684\u94FE\u63A5\u3002": { en: "This is a Dropbox folder link. Share the link to a single song file instead." },
  "\u8FD9\u662F GitHub \u7684\u9875\u9762\uFF0C\u4E0D\u662F\u6587\u4EF6\uFF1A\u8981\u94FE\u5230\u4ED3\u5E93\u91CC\u7684\u90A3\u4E2A\u6B4C\u6587\u4EF6\uFF08\u5730\u5740\u91CC\u6709 /blob/ \u7684\u90A3\u79CD\uFF09\u3002": { en: "This is a GitHub page, not a file. Link to the song file in the repository (an address with /blob/ in it)." },
  "\u8BA4\u4E0D\u51FA\u8FD9\u4E2A Gist \u94FE\u63A5\uFF1A\u8981\u5E26\u7528\u6237\u540D\u7684\u90A3\u79CD\uFF08gist.github.com/\u540D\u5B57/\u7F16\u53F7\uFF09\u3002": { en: "Can\u2019t read this Gist link. Use the form with the user name (gist.github.com/name/id)." },
  "\u6CA1\u62FF\u5230\uFF1A{host} \u4E0D\u8BA9\u522B\u7684\u7F51\u9875\u8BFB\u8FD9\u4E2A\u6587\u4EF6\uFF0C\u6216\u8005\u7F51\u65AD\u4E86\u3002": { en: "Couldn\u2019t get it: {host} doesn\u2019t let other web pages read this file, or the network is down." },
  "{host} \u8BF4\u8FD9\u4E2A\u6587\u4EF6\u4E0D\u5728\u4E86\uFF08{status}\uFF09\uFF1A\u94FE\u63A5\u8FC7\u671F\u4E86\uFF0C\u6216\u8005\u6CA1\u8BBE\u6210\u516C\u5F00\u5206\u4EAB\u3002": { en: "{host} says the file is gone ({status}). The link may have expired or isn\u2019t shared publicly." },
  "{host} \u4E0D\u8BA9\u8BFB\uFF08{status}\uFF09\uFF1A\u8FD9\u6761\u94FE\u63A5\u6CA1\u8BBE\u6210\u300C\u77E5\u9053\u94FE\u63A5\u7684\u4EBA\u90FD\u80FD\u770B\u300D\u3002": { en: "{host} refused ({status}). The link isn\u2019t set to \u201Canyone with the link can view\u201D." },
  "{host} \u56DE\u4E86 {status}\uFF0C\u6CA1\u62FF\u5230\u6587\u4EF6\u3002": { en: "{host} answered {status}; no file." },
  "\u8FD9\u4E2A\u6587\u4EF6\u8D85\u8FC7 {mb} MB\uFF0C\u4E0D\u50CF\u4E00\u9996\u6B4C\uFF0C\u6CA1\u6253\u5F00\u3002": { en: "This file is over {mb} MB, too big for a song, so it wasn\u2019t opened." },
  "\u5927\u5C0F\u4E0D\u5BF9\uFF08{n} \u2260 {bytes}\uFF09": { en: "Wrong size ({n} \u2260 {bytes})" },
  "\u6BD4\u76EE\u5F55\u91CC\u8BF4\u7684\u5927": { en: "Larger than the catalog says" },
  "\u5927\u5C0F\u4E0D\u5BF9\uFF08{o} \u2260 {bytes}\uFF09": { en: "Wrong size ({o} \u2260 {bytes})" },
  "\u5185\u5BB9\u548C\u76EE\u5F55\u91CC\u9489\u7684\u4E0D\u4E00\u6837\uFF08sha256 {p}\u2026 \u2260 {p2}\u2026\uFF09\uFF0C\u6CA1\u6709\u7528\u5B83": { en: "Content differs from the hash pinned in the catalog (sha256 {p}\u2026 \u2260 {p2}\u2026), so it wasn't used" },
  "\u300C{name}\u300D\u62FF\u4E0D\u5230\uFF08\u8BD5\u8FC7 {p}\uFF09\u3002\u6700\u540E\u4E00\u6B21\uFF1A{last}\u3002\u53EF\u4EE5\u5728\u8BBE\u7F6E\u91CC\u6362\u97F3\u6E90\u5E93\u6765\u6E90\uFF0C\u6216\u4ECE\u672C\u673A .sf2 \u6587\u4EF6\u9009\u3002": { en: "Couldn't get \u201C{name}\u201D (tried {p}). Last attempt: {last}. You can change the sound library source in Settings, or choose from a local .sf2 file." },
  "\u300C{name}\u300D\u7684\u58F0\u97F3\uFF08{path}\uFF09\u6CA1\u968F\u8FD9\u9996\u6B4C\u5E26\u6765": { en: "The sound of \u201C{name}\u201D ({path}) didn't come with this song" },
  "\u627E\u300C{name}\u300D\u7684\u58F0\u97F3\uFF1A\u4E0B\u8F7D {name2} {bytes}%": { en: "Finding the sound of \u201C{name}\u201D: downloading {name2} {bytes}%" },
  "\u300C{name}\u300D\u7684\u58F0\u97F3\u6CA1\u968F\u6B4C\u5E26\uFF08\u5F31\u5F15\u7528\uFF09\uFF0C\u8FD9\u53F0\u8BBE\u5907\u548C\u5BB6\u65CF\u97F3\u6E90\u5E93\u91CC\u4E5F\u6CA1\u6709\u5B83\u6765\u81EA\u7684\u300C{name2}\u300D\uFF08sha256 {p}\u2026\uFF09\u3002\u70B9\u8C31\u524D\u9762\u7684\u300C{p2}\u300D\uFF0C\u7ED9\u5B83\u300C\u627E\u6587\u4EF6\u2026\u300D\uFF0C\u6216\u6362\u4E00\u4E2A\u300C\u8C01\u6765\u6F14\u300D": { en: "The sound of \u201C{name}\u201D didn't come with the song (weak reference), and \u201C{name2}\u201D (sha256 {p}\u2026) isn't on this device or in the family sound library either. Tap \u201C{p2}\u201D at the front of the score, \u201CFind file\u2026\u201D, or change \u201CWho performs\u201D" },
  "\u4ECE\u300C{name}\u300D\u5207\u51FA\u6765\u7684\u300C{name2}\u300D\u548C\u6B4C\u91CC\u8BB0\u7684\u4E0D\u4E00\u6837\uFF08sha256 {p}\u2026 \u2260 {p2}\u2026\uFF09\uFF0C\u6CA1\u6709\u7528\u5B83": { en: "\u201C{name2}\u201D cut from \u201C{name}\u201D differs from what the song records (sha256 {p}\u2026 \u2260 {p2}\u2026), so it wasn't used" },
  "\u300C{n}\u300D\u4E91\u7AEF\u5DF2\u7ECF\u6709\u540C\u540D\u7684\u4E86\uFF0C\u79BB\u7EBF\u65F6\u5B58\u7684\u8FD9\u4EFD\u6CA1\u63A8\u4E0A\u53BB\uFF08\u5728\u6B4C\u5E93\u91CC\u6539\u4E2A\u540D\u518D\u63A8\uFF09": { en: "\u201C{n}\u201D already exists in the cloud, so the copy saved offline wasn't uploaded (rename it in the library and upload again)" },
  "\u79BB\u7EBF\u65F6\u5B58\u7684\u6B4C\u63A8\u4E0A\u4E91\u4E86\uFF08{done} / {total}\uFF09": { en: "Songs saved offline were uploaded ({done} / {total})" },
  "\u6B63\u5728\u628A\u79BB\u7EBF\u65F6\u5B58\u7684\u6B4C\u63A8\u4E0A\u4E91\u2026 {done} / {total}": { en: "Uploading songs saved offline\u2026 {done} / {total}" },
  "\u600E\u4E48\u8BA4\u7684\uFF1A\u51D1\u5F97\u6210\u5B8C\u6574\u548C\u5F26\u7684\u4F18\u5148\uFF08\u4E0D\u7701\u97F3\uFF09\u2192 \u6700\u4F4E\u97F3\u5F53\u6839\u97F3\u7684\u4F18\u5148 \u2192 \u6839\u97F3\u5728\u8FD9\u4E2A\u8C03\u91CC\u7684\u4F18\u5148 \u2192 \u7B80\u5355\u7684\u4F18\u5148\u3002\u6253\u5E73\u7684\u4E24\u4E2A\u90FD\u5199\u5728\u8C31\u4E0A\u3002": { en: "How it is read: chords that are complete (nothing left out) win \u2192 the lowest note as root wins \u2192 a root inside this key wins \u2192 simpler chords win. When two tie, both are written on the score." },
  "\u8F6C\u4F4D\uFF08\u6700\u4F4E\u97F3\u4E0D\u662F\u6839\u97F3\uFF09": { en: "Inversion (the lowest note is not the root)" },
  "\u6CA1\u6709\u4E09\u5EA6\uFF1A\u5927\u4E09\u548C\u5F26\u8FD8\u662F\u5C0F\u4E09\u548C\u5F26\u5206\u4E0D\u51FA\u6765\uFF0C\u6309\u8FD9\u4E2A\u8C03\u91CC\u7684\u5199": { en: "No third: major or minor can\u2019t be told apart, so it follows this key" },
  "\u7701\u4E86 {n} \u4E2A\u97F3": { en: "{n} {n|note|notes} left out" },
  "\u6CA1\u6709\u53EF\u7528\u7684\u8D77\u6CD5\uFF08\u6253\u5305\u65F6\u6CA1\u5E26\u8FD9\u4E2A\u7EBF\u7A0B\uFF09": { en: "No way to start it (this thread wasn't bundled)" },
  "\u540E\u53F0\u7EBF\u7A0B\u300C{name}\u300D\u8D77\u4E0D\u6765\uFF1A{Error}": { en: "Background thread \u201C{name}\u201D can't start: {Error}" },
  "\u51FA\u58F0\u7EBF\u7A0B\u300C{name}\u300D\u8D77\u4E0D\u6765\uFF1A{Error}": { en: "Audio thread \u201C{name}\u201D can't start: {Error}" },
  "\u65CB\u5F8B": { en: "Melody" },
  "\u548C\u5F26": { en: "Chords" },
  "\u7B2C\u4E8C\u65CB\u5F8B": { en: "2nd melody" },
  "\u4F34\u594F": { en: "Accomp." },
  "\u94FA\u5E95": { en: "Pad" },
  "\u8282\u594F": { en: "Rhythm" },
  "\u70B9\u4E00\u4EF6\u4E50\u5668 \u2192 \u6311\u8C01\u6765\u6F14 \u2192 \u7528\u53F3\u8FB9\u7684\u952E\u76D8\u8BD5 \u2192 \u300C\u9009\u8FD9\u4E2A\u300D= \u6362\u4E0A\u3002\u76EE\u5F55\u4E0D\u5173\uFF0C\u653E\u7740\u6B4C\u4E5F\u80FD\u63A5\u7740\u6362\uFF1B\u56DE\u8C31\u70B9\u300C\u2190 \u8C31\u300D\u3002\u8C31\u4E0A\u7684\u540D\u5B57\u8DDF\u7740\u6362\u6210\u90A3\u4EF6\u4E50\u5668\u3002": { en: "Tap an instrument \u2192 pick who plays it \u2192 try it on the keyboard \u2192 \u201CUse this\u201D switches to it. The catalog stays open, so you can keep switching even while the song plays; tap \u201C\u2190 Score\u201D to go back. The name on the score follows the instrument." },
  "\u641C\u4E50\u5668\uFF08\u4E2D / \u82F1 / \u65E5\uFF09": { en: "Search instruments (zh / en / ja)" },
  "\u81EA\u5DF1\u7684 .sf2 \u6587\u4EF6\uFF1A\u9009\u4E2D\u7684\u90A3\u4E00\u4EF6\u5207\u51FA\u6765\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u91CC\u53EA\u8BB0\u6765\u6E90": { en: "Your own .sf2 file: the one you pick is cut out and kept on this device; the song only records where it came from" },
  "\u6253\u5F00 .sf2\u2026": { en: "Open .sf2\u2026" },
  "\u8DF3\u5230": { en: "Jump to" },
  "\u5217\u8868\u6EDA\u5230\u8FD9\u4E00\u7EC4": { en: "Scroll the list to this group" },
  "\u9690\u85CF\u627E\u4E0D\u5230\u7684": { en: "Hide unavailable" },
  "\u52A0\u8F7D\u76EE\u5F55\u2026": { en: "Loading the catalog\u2026" },
  "\u4E50\u5668\u76EE\u5F55\uFF08\u5F39\u7740\u73A9\uFF09": { en: "Instrument catalog (just for fun)" },
  "\u627E\u4EBA\u7ED9\u300C{p}\u300D": { en: "Finding someone for \u201C{p}\u201D" },
  "\u2190 \u6B4C\u5E93": { en: "\u2190 Library" },
  "\u70B9\u4E00\u4EF6\u4E50\u5668 \u2192 \u6311\u8C01\u6765\u6F14 \u2192 \u7528\u952E\u76D8\u5F39\u7740\u73A9\u3002\u8981\u7ED9\u6B4C\u91CC\u7684\u58F0\u90E8\u9009\u4E50\u5668\uFF1A\u5F00\u4E00\u9996\u6B4C\uFF0C\u70B9\u8C31\u524D\u9762\u7684\u58F0\u90E8\u540D\u3002": { en: "Tap an instrument \u2192 choose who performs \u2192 play on the keys for fun. To choose an instrument for a part: open a song and tap the part name at the front of the score." },
  "\u76EE\u5F55\u52A0\u8F7D\u4E0D\u4E86\uFF1A{Error}": { en: "Can't load the catalog: {Error}" },
  "\u70B9\u4E0B\u9762\u4E00\u4EF6\u4E50\u5668\uFF0C\u6362\u8FDB\u8FD9\u4E00\u683C": { en: "Tap an instrument below to put it in this slot" },
  "\u70B9 = \u6362\u4E0A\u300C{name}\u300D\uFF1B\u957F\u6309\uFF08\u53F3\u952E\uFF09= \u6362\u6210\u522B\u7684 / \u62FF\u6389": { en: "Tap = switch to \u201C{name}\u201D; long-press (right-click) = replace / remove" },
  "\u590D\u5236\u4E00\u4EFD": { en: "Duplicate" },
  "\u62F7\u5230\u8FD9\u4E2A\u58F0\u90E8": { en: "Copy to this part" },
  "\u6362\u6210\u2026": { en: "Replace with\u2026" },
  "\u62FF\u6389": { en: "Remove" },
  "\u53D6\u6D88\u7F6E\u9876": { en: "Unpin" },
  "\u7F6E\u9876\u5230\u5E38\u7528": { en: "Pin to favorites" },
  "\u8FD9\u9996\u6B4C\u7684\u4E50\u5668\u9884\u8BBE": { en: "Instrument presets in this song" },
  "\u6B63\u5728\u53F0\u4E0A\uFF1B\u957F\u6309\uFF08\u53F3\u952E\uFF09= \u590D\u5236\u4E00\u4EFD": { en: "On stage now; long-press (right-click) = duplicate" },
  "\u70B9 = \u6362\u4E0A\uFF1B\u957F\u6309\uFF08\u53F3\u952E\uFF09= \u590D\u5236\u4E00\u4EFD / \u5220\u6389": { en: "Tap = use it; long-press (right-click) = duplicate / delete" },
  "\u70B9 = \u62F7\u4E00\u4EFD\u5230\u8FD9\u4E2A\u58F0\u90E8\u3001\u6362\u4E0A\uFF08\u300C{from}\u300D\u90A3\u8FB9\u4E0D\u52A8\uFF09": { en: "Tap = copy it to this part and use it (the one on \u201C{from}\u201D stays as it is)" },
  "\u5728 {from} \u4E0A": { en: "on {from}" },
  "\u5F00\u7740\uFF1A\u76EE\u5F55\u91CC\u6CA1\u6709\u8C01\u80FD\u6F14\uFF08\u8FDE\u5E73\u66FF\u4E5F\u6CA1\u6709\uFF09\u7684\u4E50\u5668\u4E0D\u5217\u51FA\u6765\uFF08\u8FD9\u4E00\u9875\u85CF\u4E86 {n} \u4EF6\uFF09\u3002\u70B9\u4E00\u4E0B = \u5168\u5217\u51FA\u6765": { en: "On: instruments nobody in the catalog can perform (not even a stand-in) are hidden ({n} hidden here). Tap to list everything" },
  "\u5173\u7740\uFF1A\u6240\u6709\u4E50\u5668\u90FD\u5217\u51FA\u6765\uFF0C\u6CA1\u6709\u8C01\u80FD\u6F14\u7684\u4E5F\u5728\u3002\u70B9\u4E00\u4E0B = \u85CF\u8D77\u6765": { en: "Off: every instrument is listed, including ones nobody can perform. Tap to hide them" },
  "{label} \xB7 {n} \u4EF6": { en: "{label} \xB7 {n}" },
  "\u6CA1\u6709\u53EB\u300C{q}\u300D\u7684\u80FD\u6F14\u7684\u4E50\u5668\uFF08\u85CF\u7740 {n} \u4EF6\u6CA1\u6709\u8C01\u80FD\u6F14\u7684\uFF1A\u5173\u6389\u300C\u9690\u85CF\u627E\u4E0D\u5230\u7684\u300D\u80FD\u770B\u5230\uFF09": { en: "No playable instrument named \u201C{q}\u201D ({n} with no performer are hidden \u2014 turn off \u201CHide unavailable\u201D to see them)" },
  "\u6CA1\u6709\u53EB\u300C{q}\u300D\u7684": { en: "Nothing named \u201C{q}\u201D" },
  "\u6536\u8D77\u8FD9\u4E00\u7EC4": { en: "Collapse this group" },
  "\u5C55\u5F00\u8FD9\u4E00\u7EC4\uFF08\u522B\u7684\u6536\u8D77\uFF09": { en: "Expand this group (others collapse)" },
  "\u9876\u66FF": { en: "Substitute" },
  "\u7528\u5B83\u653E\u8FD9\u6761\u58F0\u90E8\u7684\u5F00\u5934": { en: "Plays the start of this part with it" },
  "\u25B6 \u542C\u5F00\u5934": { en: "\u25B6 Hear the start" },
  "\u5148\u4E0D\u6362\uFF1A\u52A0\u4E00\u4E2A\u65B0\u58F0\u90E8\u653E\u5B83\uFF0C\u5F00\u300C\u5F39\u300D\u770B\u7740\u8C31\u5F39\u7740\u8BD5\uFF08\u53F0\u4E0A\u8FD9\u4F4D\u4E0D\u52A8\uFF09": { en: "Don't swap yet: add a new part with it and turn on Play to try it along with the score (the current performer stays)" },
  "\u52A0\u6210\u65B0\u58F0\u90E8\u8BD5\u8BD5": { en: "Try as a new part" },
  "\uFF0B \u58F0\u90E8": { en: "\uFF0B Part" },
  "\u9009\u5B83\u6765\u6F14\u8FD9\u4E2A\u58F0\u90E8\uFF08\u76EE\u5F55\u4E0D\u5173\uFF0C\u53EF\u4EE5\u63A5\u7740\u6362\uFF09": { en: "Use it for this part (the catalog stays open)" },
  "\u9009\u8FD9\u4E2A": { en: "Choose this" },
  "\u9F13\u7EC4": { en: "Drum kits" },
  "\u53D8\u4F53\uFF08bank {b}\uFF09": { en: "Variations (bank {b})" },
  "{name}\uFF08{n} \u4EF6\uFF09": { en: "{name} ({n} items)" },
  "\u6536\u8D77\u8FD9\u4E2A\u6587\u4EF6\uFF08\u5B57\u8282\u653E\u6389\uFF0C\u8981\u518D\u7528\u5C31\u91CD\u65B0\u6253\u5F00\uFF09": { en: "Close this file (its bytes are dropped; open it again to use it)" },
  "\u6536\u8D77\u8FD9\u4E2A\u6587\u4EF6": { en: "Close this file" },
  "\u9009\u7684\u90A3\u4E00\u4EF6\u5207\u51FA\u6765\u7559\u5728\u8FD9\u53F0\u8BBE\u5907\u4E0A\uFF0C\u6B4C\u91CC\u53EA\u8BB0\u6765\u6E90\uFF08\u6B4C\u5C0F\uFF09\u3002\u8981\u6B4C\u81EA\u5DF1\u5E26\u7740\u58F0\u97F3 = \u6587\u4EF6\u83DC\u5355\u300C\u5168\u90E8\u6253\u5305\u8FDB\u6B4C\u300D\uFF0C\u6216\u5BFC\u51FA\u300C\u6253\u5305\u97F3\u6E90\u300D\u7684\u526F\u672C\u3002": { en: "The one you choose is cut out and kept on this device; the song only records where it came from (keeps the song small). To make the song carry the sound itself: File menu \u2192 \u201CPack everything into the song\u201D, or save an .mxl copy (packed sounds)." },
  "\u5728\u8FD9\u79CD\u98CE\u91CC\u9876\u66FF\u300C{asName}\u300D": { en: "Substitutes for \u201C{asName}\u201D in this style" },
  "\u9876 {asName}": { en: "Subs for {asName}" },
  "\u7EA6 ": { en: "c. " },
  "\u5531\u6B4C\u8BCD\uFF1B\u6CA1\u5199\u6B4C\u8BCD\u7684\u97F3\u6309\u300C\u54FC\u7684\u5B57\u300D\u5531": { en: "Sings lyrics; notes without lyrics use the \u201CHum syllable\u201D" },
  "\u53EA\u54FC\u300C\u54FC\u7684\u5B57\u300D\u3001\u4E0D\u5531\u6B4C\u8BCD\uFF1B\u8F7B\uFF0C\u7834\u8BBE\u5907\u4E5F\u5E26\u5F97\u52A8": { en: "Only hums the hum syllable, no lyrics; light enough for older devices" },
  "\u9F13\u4EF6 \xB7 {gmName}\uFF08Standard \u9F13\u7EC4\u7684 {note} \u53F7\u952E\uFF09": { en: "Drum piece \xB7 {gmName} (key {note} of the Standard kit)" },
  "\u9F13\u7EC4 \xB7 {gmName}": { en: "Drum kit \xB7 {gmName}" },
  "\u9876\u66FF{p}{reason}": { en: "Substitute{p}{reason}" },
  "\uFF08GM \u539F\u6587\u8BA4\u53EF\uFF09": { en: " (GM original accepts it)" },
  "\uFF08\u524D\u8EAB\uFF09": { en: " (predecessor)" },
  "\uFF08\u4EFF\u58F0\uFF09": { en: " (imitation)" },
  "\uFF08\u540C\u7C7B\uFF09": { en: " (same type)" },
  "\uFF08\u53EA\u662F\u540C\u540D\uFF09": { en: " (same name only)" },
  "\u76EE\u5F55\u91CC\u8FD8\u6CA1\u6709\u8C01\u80FD\u6F14\u5B83": { en: "Nobody in the catalog can perform it yet" },
  "\u5408": { en: "Join" },
  "\u8FD9\u4E2A\u5B57\u5E76\u8FDB\u524D\u4E00\u4E2A\u97F3\uFF08\u4E00\u4E2A\u97F3\u4E0A\u51E0\u4E2A\u5B57\uFF09\uFF1B\u8FD9\u4E00\u53E5\u540E\u9762\u7684\u5B57\u5F80\u524D\u632A\u4E00\u4E2A\u97F3": { en: "Merges this syllable into the previous note (several syllables on one note); later syllables in this phrase shift forward one note" },
  "\u6324\u4E86\uFF1A\u6309\u8282\u594F\u6392\uFF0C\u8FD9\u4E2A\u5B57\u653E\u4E0D\u4E0B\uFF08\u7EB8\u7684\u8BBE\u7F6E\u91CC\u6362\u6210\u300C\u6309\u6B4C\u8BCD\u300D= \u628A\u97F3\u63A8\u5F00\uFF09": { en: "Crowded: laid out by rhythm, this syllable doesn't fit (in sheet settings, \u201CBy lyrics\u201D pushes notes apart)" },
  "\u65E0\u5347\u964D": { en: "No accidentals" },
  "\u6309\u8FD9\u4E2A\u901F\u5EA6\u6446\uFF1A\u6446\u5230\u4E00\u5934 = \u4E00\u62CD": { en: "Swinging at this tempo: one end of the swing = one beat" },
  "\u786E\u5B9A": { en: "OK" },
  "\u62E8\u901F\u5EA6\uFF1A\u4E00\u683C = 1\uFF0C\u4E00\u7529\u6ED1\u4E00\u5927\u6BB5": { en: "Dial the tempo: one notch = 1, a flick covers more" },
  "{from} \u8D77": { en: "from {from}" },
  "\u94DC\u7BA1": { en: "Brass" },
  "\u6728\u7BA1": { en: "Woodwinds" },
  "\u5F39\u62E8": { en: "Plucked" },
  "\u6253\u51FB": { en: "Percussion" },
  "\u6709\u97F3\u9AD8\u6253\u51FB / \u94C3": { en: "Pitched percussion / bells" },
  "\u97F3\u6548 / \u5176\u4ED6": { en: "Sound effects / other" },
  "\u81EA\u52A8\u4F4E\u5207": { en: "Auto low cut" },
  "\u8DDF\u901F\u5EA6\uFF08\u51E0\u62CD\u4E00\u6B21\uFF1B0 = \u7528\u4E0A\u9762\u7684\u6BEB\u79D2\uFF09": { en: "Follow tempo (beats per echo; 0 = use the ms above)" },
  "\u81EA\u52A8\u4F4E\u5207\uFF1A\u6309\u8FD9\u4E2A\u58F0\u90E8\u6700\u4F4E\u7684\u97F3\u653E\u4F4E\u5207\uFF08\u5F80\u4E0B\u5927\u4E09\u5EA6\uFF09\uFF0C\u5207\u6389\u5B83\u7528\u4E0D\u7740\u7684\u4F4E\u9891\u2014\u2014\u9686\u9686\u58F0\u3001\u548C\u522B\u7684\u8F68\u7CCA\u5728\u4E00\u8D77\u7684\u4F4E\u9891": { en: "Auto low cut: sets the low cut from this part's lowest note (a major third below), removing lows it doesn't use \u2014 rumble and lows that muddy other tracks" },
  "\u4F4E\u5207\uFF1A\u8FD9\u4E2A\u9891\u7387\u4EE5\u4E0B\u7684\u90FD\u5207\u6389\u3002\u4EBA\u58F0\u5E38\u5728 80\u2013120 Hz\uFF0C\u94C3\u8FD9\u7C7B\u9AD8\u7684\u4E50\u5668\u53EF\u4EE5\u66F4\u9AD8\uFF1B\u6700\u5DE6 = \u5173": { en: "Low cut: removes everything below this frequency. Voices are often 80\u2013120 Hz; high instruments like bells can go higher; far left = off" },
  "\u9AD8\u5207\uFF1A\u8FD9\u4E2A\u9891\u7387\u4EE5\u4E0A\u7684\u90FD\u5207\u6389\uFF0C\u53BB\u523A\u8033\u3001\u5636\u5636\u58F0\uFF1B\u6700\u5DE6 = \u5173": { en: "High cut: removes everything above this frequency, for harshness and hiss; far left = off" },
  "\u4F4E\u67B6\uFF1A\u8F6C\u6298\u9891\u7387\u4EE5\u4E0B\u6574\u4F53\u52A0 / \u51CF\u591A\u5C11\u3002\u51CF = \u53BB\u95F7\u3001\u7ED9\u522B\u7684\u8F68\u8BA9\u51FA\u4F4E\u9891\uFF1B\u52A0 = \u52A0\u539A": { en: "Low shelf: boosts / cuts everything below the corner. Cut = less muddy, leaves lows for other tracks; boost = thicker" },
  "\u4F4E\u67B6\u7684\u8F6C\u6298\u9891\u7387\uFF1A\u4ECE\u8FD9\u91CC\u5F80\u4E0B\u7B97\u300C\u4F4E\u300D": { en: "Low shelf corner: \u201Clow\u201D counts down from here" },
  "\u4E2D\u5CF0\uFF1A\u5728\u4E00\u4E2A\u9891\u6BB5\u4E0A\u63A8 / \u6316\u591A\u5C11\u3002\u4E24\u6837\u4E1C\u897F\u7CCA\u5728\u4E00\u8D77\u65F6\uFF0C\u5728\u5176\u4E2D\u4E00\u4E2A\u4E0A\u6316\u4E00\u5200\u7ED9\u53E6\u4E00\u4E2A\u8BA9\u4F4D": { en: "Mid peak: boosts / cuts one band. When two things blur together, cut one to make room for the other" },
  "\u4E2D\u5CF0\u7684\u4E2D\u5FC3\u9891\u7387\uFF1A\u63A8 / \u6316\u7684\u662F\u54EA\u4E00\u6BB5": { en: "Mid peak center: which band is boosted / cut" },
  "\u4E2D\u5CF0\u7684\u5BBD\u7A84\uFF1AQ \u8D8A\u5927\u8D8A\u7A84\uFF081 \u2248 \u4E00\u4E2A\u591A\u516B\u5EA6\u5BBD\uFF0C4 \u2248 \u5C0F\u534A\u4E2A\u516B\u5EA6\uFF09": { en: "Mid peak width: higher Q is narrower (1 \u2248 a bit over an octave, 4 \u2248 under half an octave)" },
  "\u9AD8\u67B6\uFF1A\u8F6C\u6298\u9891\u7387\u4EE5\u4E0A\u6574\u4F53\u52A0 / \u51CF\u591A\u5C11\u3002\u52A0 = \u4EAE\u3001\u51CF = \u6697": { en: "High shelf: boosts / cuts everything above the corner. Boost = brighter, cut = darker" },
  "\u9AD8\u67B6\u7684\u8F6C\u6298\u9891\u7387\uFF1A\u4ECE\u8FD9\u91CC\u5F80\u4E0A\u7B97\u300C\u9AD8\u300D": { en: "High shelf corner: \u201Chigh\u201D counts up from here" },
  "\u9608\u503C\uFF1A\u58F0\u97F3\u8D85\u8FC7\u8FD9\u4E2A\u7535\u5E73\u624D\u5F00\u59CB\u538B\uFF1B\u8D8A\u4F4E\uFF0C\u538B\u5230\u7684\u8D8A\u591A": { en: "Threshold: compression starts above this level; lower compresses more" },
  "\u6BD4\u4F8B\uFF1A\u8D85\u8FC7\u9608\u503C\u7684\u90E8\u5206\u538B\u6210\u51E0\u5206\u4E4B\u4E00\uFF084:1 = \u8D85\u51FA 4 dB \u7684\u53EA\u5269 1 dB\uFF09": { en: "Ratio: how much the part above the threshold is reduced (4:1 = 4 dB over becomes 1 dB)" },
  "\u8D77\u538B\uFF1A\u8D85\u8FC7\u9608\u503C\u4E4B\u540E\u591A\u5FEB\u538B\u4E0B\u53BB\u3002\u77ED = \u8FDE\u5B57\u5934\u4E00\u8D77\u538B\u5E73\uFF1B\u957F = \u8BA9\u5B57\u5934\u5148\u51B2\u51FA\u6765\u3001\u66F4\u6709\u52B2": { en: "Attack: how fast it compresses after crossing the threshold. Short = flattens word onsets too; long = lets onsets punch through" },
  "\u653E\u5F00\uFF1A\u58F0\u97F3\u843D\u56DE\u9608\u503C\u4EE5\u4E0B\u4E4B\u540E\u591A\u5FEB\u677E\u5F00\u3002\u592A\u77ED\u4F1A\u4E00\u62BD\u4E00\u62BD\u7684\uFF0C\u592A\u957F\u4E0B\u4E00\u4E2A\u5B57\u4E5F\u88AB\u538B\u7740": { en: "Release: how fast it lets go after falling below the threshold. Too short pumps; too long keeps the next word compressed too" },
  "\u62D0\u70B9\uFF1A\u9608\u503C\u9644\u8FD1\u8FD9\u4E48\u5BBD\u7684\u4E00\u6BB5\u91CC\u6162\u6162\u5F00\u59CB\u538B\uFF08\u8F6F\uFF09\uFF1B0 = \u4E00\u5230\u9608\u503C\u5C31\u538B\uFF08\u786C\uFF09": { en: "Knee: compression eases in over this width around the threshold (soft); 0 = kicks in right at the threshold (hard)" },
  "\u8865\u507F\uFF1A\u538B\u5B8C\u6574\u4F53\u52A0\u56DE\u6765\u591A\u5C11\uFF08\u538B\u7F29\u4F1A\u8BA9\u6574\u4F53\u53D8\u8F7B\uFF09": { en: "Makeup: how much to add back after compressing (compression makes things quieter overall)" },
  "\u6DF7\u54CD\u65F6\u95F4\uFF08RT60\uFF09\uFF1A\u58F0\u97F3\u505C\u4E86\u4E4B\u540E\uFF0C\u5C3E\u5DF4\u8870\u51CF 60 dB \u8981\u591A\u4E45\u3002\u5C0F\u623F\u95F4\u4E0D\u5230 1 \u79D2\uFF0C\u5927\u5385 2\u20133 \u79D2\uFF0C\u6559\u5802\u66F4\u957F": { en: "Reverb time (RT60): how long the tail takes to fall 60 dB after the sound stops. Small rooms under 1 s, halls 2\u20133 s, churches longer" },
  "\u9AD8\u9891\u4ECE\u8FD9\u91CC\u5F00\u59CB\u8870\u51CF\uFF1A\u771F\u5B9E\u7684\u623F\u95F4\u91CC\u9AD8\u9891\u88AB\u5438\u6536\u5F97\u5FEB\uFF0C\u5C3E\u5DF4\u8D8A\u5F80\u540E\u8D8A\u6697\uFF1B\u6570\u8D8A\u4F4E\u8D8A\u6697": { en: "Highs start fading from here: real rooms absorb highs fast, so the tail gets darker; lower is darker" },
  "\u6E7F\uFF1A\u6DF7\u54CD\u7684\u58F0\u97F3\u6709\u591A\u54CD": { en: "Wet: how loud the reverb is" },
  "\u539F\u58F0\uFF1A\u539F\u6765\u7684\u58F0\u97F3\u7559\u591A\u5C11\u3002\u63D2\u5728\u58F0\u90E8\u8F68\u4E0A\u4E00\u822C 0 dB\uFF08\u4E0D\u52A8\uFF09\uFF1B\u5F53\u53D1\u9001\u7684\u8FD4\u56DE\u8F68\u7528 = \u5173": { en: "Dry: how much of the original to keep. Usually 0 dB (untouched) on a part's track; off on a send's return track" },
  "\u9884\u5EF6\u8FDF\uFF1A\u539F\u58F0\u4E4B\u540E\u8FC7\u591A\u4E45\u6DF7\u54CD\u624D\u8FDB\u6765\u3002\u62C9\u5F00\u4E00\u70B9\uFF0C\u4EBA\u58F0\u66F4\u6E05\u695A\u3001\u4E0D\u88AB\u7CCA\u4F4F": { en: "Pre-delay: how long after the dry sound the reverb comes in. A little keeps voices clear and not smeared" },
  "\u5BBD\u5EA6\uFF1A\u6DF7\u54CD\u5728\u5DE6\u53F3\u94FA\u591A\u5F00": { en: "Width: how far the reverb spreads left and right" },
  "\u8DDF\u901F\u5EA6\uFF1A\u56DE\u58F0\u9694\u51E0\u62CD\uFF0C\u6309\u6B4C\u7684\u901F\u5EA6\u7B97\u65F6\u95F4\uFF1B0 = \u7528\u4E0B\u9762\u7684\u6BEB\u79D2": { en: "Follow tempo: beats between echoes, timed from the song's tempo; 0 = use the ms below" },
  "\u65F6\u95F4\uFF1A\u6BCF\u6B21\u56DE\u58F0\u9694\u591A\u4E45": { en: "Time: the gap between echoes" },
  "\u6BCF\u6B21\u56DE\u58F0\uFF1A\u6BCF\u91CD\u590D\u4E00\u6B21\u8F7B\u591A\u5C11 dB\uFF1B\u8D8A\u63A5\u8FD1 0\uFF0C\u56DE\u58F0\u8D8A\u4E45": { en: "Each echo: how many dB softer per repeat; closer to 0 lasts longer" },
  "\u6E7F\uFF1A\u56DE\u58F0\u6709\u591A\u54CD": { en: "Wet: how loud the echoes are" },
  "\u53CD\u9988\u9AD8\u5207\uFF1A\u6BCF\u6B21\u56DE\u58F0\u90FD\u628A\u8FD9\u4E2A\u9891\u7387\u4EE5\u4E0A\u7684\u524A\u6389\u4E00\u70B9\uFF0C\u8D8A\u5F80\u540E\u8D8A\u6697\uFF08\u50CF\u771F\u7684\u56DE\u58F0\uFF09": { en: "Feedback high cut: each echo loses a bit above this frequency, getting darker over time (like real echoes)" },
  "\u51E0\u6761\uFF1A\u540C\u65F6\u6709\u51E0\u4E2A\u7A0D\u5FAE\u9519\u5F00\u7684\u526F\u672C": { en: "Voices: how many slightly offset copies at once" },
  "\u5EF6\u8FDF\uFF1A\u526F\u672C\u6BD4\u539F\u58F0\u665A\u591A\u5C11": { en: "Delay: how much later the copies are than the dry sound" },
  "\u6296\u52A8\u6DF1\u5EA6\uFF1A\u526F\u672C\u7684\u5EF6\u8FDF\u6765\u56DE\u6643\u591A\u5927\u2014\u2014\u6643 = \u97F3\u9AD8\u8F7B\u5FAE\u8D77\u4F0F\uFF0C\u50CF\u597D\u51E0\u4E2A\u4EBA\u5531\u4E0D\u9F50": { en: "Depth: how far each copy's delay wobbles \u2014 wobble = slight pitch movement, like several people not quite together" },
  "\u6296\u52A8\u5FEB\u6162\uFF1A\u6BCF\u79D2\u6643\u51E0\u6B21": { en: "Rate: wobbles per second" },
  "\u5DE6\u53F3\u94FA\u5F00\uFF1A\u526F\u672C\u6446\u5F97\u591A\u5F00": { en: "Spread: how wide the copies are placed" },
  "\u6E7F\uFF1A\u526F\u672C\u6709\u591A\u54CD": { en: "Wet: how loud the copies are" },
  "\u589E\u76CA\uFF1A\u5355\u7EAF\u8C03\u5927\u8C03\u5C0F\uFF08\u524D\u9762\u7684\u63D2\u4EF6\u628A\u97F3\u91CF\u6539\u4E86\uFF0C\u7528\u5B83\u8865\u56DE\u6765\uFF09": { en: "Gain: plain louder / softer (to make up for level changed by earlier plugins)" },
  "\u6DF7\u54CD\u65F6\u95F4\uFF08RT60\uFF09": { en: "Reverb time (RT60)" },
  "\u9AD8\u9891\u4ECE\u8FD9\u91CC\u5F00\u59CB\u8870\u51CF": { en: "Highs fade from here" },
  "\u4E0D\u8870\u51CF\uFF0820 kHz \u4EE5\u4E0A\uFF09": { en: "No fade (above 20 kHz)" },
  "\u6E7F\uFF08\u6548\u679C\uFF09": { en: "Wet (effect)" },
  "\u6BCF\u6B21\u56DE\u58F0": { en: "Each echo" },
  "{v} dB / \u6B21": { en: "{v} dB / echo" },
  "\u5BBD\u5EA6\uFF080 = \u5355\u58F0\u9053\uFF0C100% = \u5DE6\u53F3\u94FA\u6EE1\uFF09": { en: "Width (0 = mono, 100% = full stereo)" },
  "\u5DE6\u53F3\u94FA\u5F00\uFF080 = \u90FD\u5728\u4E2D\u95F4\uFF0C100% = \u94FA\u5230\u4E24\u8FB9\uFF09": { en: "Spread (0 = all center, 100% = full width)" },
  "{v} \u6761": { en: "{v} {v|voice|voices}" },
  "\u5207\u6389\u8FD9\u4E2A\u58F0\u90E8\u7528\u4E0D\u7740\u7684\u4F4E\u9891\uFF1A\u4F4E\u5207\u653E\u5728\u5B83\u6700\u4F4E\u7684\u97F3\u5F80\u4E0B\u4E00\u70B9": { en: "Removes lows this part doesn't use: the low cut sits a bit below its lowest note" },
  "\u539A \u2194 \u4EAE": { en: "Warm \u2194 Bright" },
  "\u5F80\u5DE6 = \u539A\uFF08\u4F4E\u7684\u591A\u4E00\u70B9\u3001\u9AD8\u7684\u5C11\u4E00\u70B9\uFF09\uFF0C\u5F80\u53F3 = \u4EAE\uFF1B\u4E2D\u95F4 = \u4E0D\u52A8": { en: "Left = warmer (more lows, fewer highs), right = brighter; center = unchanged" },
  "\u5E73": { en: "Flat" },
  "\u539A {p} dB": { en: "Warm {p} dB" },
  "\u4EAE {p} dB": { en: "Bright {p} dB" },
  "\u8BA9\u591A\u5C11": { en: "Duck by" },
  "\u538B\u591A\u5C11": { en: "Compress by" },
  "\u88AB\u90A3\u6761\u8F68\u538B\uFF1A\u5B83\u4E00\u54CD\uFF0C\u8FD9\u6761\u5C31\u8BA9\u51FA\u6765\uFF1B\u5F80\u53F3 = \u8BA9\u5F97\u8D8A\u591A\uFF08\u4E0D\u8865\u507F\uFF1A\u5B83\u4E0D\u54CD\u7684\u65F6\u5019\u8FD9\u6761\u7167\u63A8\u5B50\u7684\u97F3\u91CF\uFF09": { en: "Compressed by that track: when it sounds, this one makes way; right = makes way more (no makeup: when it's silent this one sits at the fader level)" },
  "\u628A\u5FFD\u5927\u5FFD\u5C0F\u62C9\u5E73\uFF1A\u5F80\u53F3 = \u538B\u5F97\u8D8A\u72E0\uFF08\u54CD\u7684\u5B57\u538B\u4E0B\u6765\u3001\u8F7B\u7684\u76F8\u5BF9\u663E\u51FA\u6765\uFF09": { en: "Evens out loud and soft: right = harder (loud syllables come down, soft ones stand out more)" },
  "{thresholdDb} dB \u8D77\u538B \xB7 {ratio}:1": { en: "Compresses from {thresholdDb} dB \xB7 {ratio}:1" },
  "\u8FDC\u8FD1": { en: "Distance" },
  "\u5F80\u53F3 = \u8D8A\u8FDC\u3001\u8D8A\u5927\u7684\u623F\u95F4\uFF08\u94C3\u53EF\u4EE5\u8FDC\u4E00\u70B9\uFF0C\u8D34\u8033\u7684\u4EBA\u58F0\u8FD1\u4E00\u70B9\uFF09\uFF1B\u539F\u58F0\u4E0D\u52A8\uFF0C\u53EA\u5F80\u4E0A\u52A0\u6DF7\u54CD": { en: "Right = farther, in a bigger room (bells can be distant, close vocals near); the dry sound stays, reverb is only added on top" },
  "\u6E7F {mix} \xB7 {room} s": { en: "Wet {mix} \xB7 {room} s" },
  "\u56DE\u58F0\u591A\u5C11": { en: "Echo amount" },
  "\u5F80\u53F3 = \u56DE\u58F0\u8D8A\u54CD\u3001\u8D8A\u4E45\uFF1B\u539F\u58F0\u4E0D\u52A8": { en: "Right = louder, longer echoes; the dry sound stays" },
  "\u6E7F {mix} \xB7 \u6BCF\u6B21 {feedback} dB": { en: "Wet {mix} \xB7 each {feedback} dB" },
  "\u51E0\u62CD\u4E00\u6B21": { en: "Beats per echo" },
  "\u56DE\u58F0\u548C\u62CD\u5B50\u5BF9\u9F50\uFF08\u8DDF\u7740\u6B4C\u7684\u901F\u5EA6\uFF09": { en: "Aligns echoes with the beat (follows the song's tempo)" },
  "\u9644\u70B9\u516B\u5206": { en: "Dotted eighth" },
  "\u5BBD": { en: "Wide" },
  "\u5F80\u53F3 = \u8D8A\u5BBD\u3001\u8D8A\u50CF\u597D\u51E0\u4E2A\u4EBA\uFF1B\u539F\u58F0\u4E0D\u52A8": { en: "Right = wider, more like several people; the dry sound stays" },
  "\u6E7F {mix} \xB7 \u6296\u52A8 {depthMs} ms": { en: "Wet {mix} \xB7 depth {depthMs} ms" },
  "\u63D2\u4EF6\u94FE\u4E2D\u95F4\u5355\u7EAF\u8C03\u5927\u8C03\u5C0F\uFF08\u524D\u9762\u7684\u63D2\u4EF6\u628A\u97F3\u91CF\u6539\u4E86\uFF0C\u7528\u5B83\u8865\u56DE\u6765\uFF09": { en: "Plain louder / softer inside the plugin chain (to make up for level changed by earlier plugins)" },
  "\u6DF7\u54CD\u65F6\u95F4": { en: "Reverb time" },
  "\u5C3E\u5DF4\u8870\u51CF 60 dB \u8981\u591A\u4E45\uFF08RT60\uFF09\uFF1A\u5F80\u53F3 = \u8D8A\u5927\u7684\u623F\u95F4\uFF08\u53D1\u591A\u5C11\u7531\u53D1\u9001\u90A3\u8FB9\u7684\u65CB\u94AE\u7BA1\uFF09": { en: "How long the tail takes to fall 60 dB (RT60): right = bigger room (how much is sent is set on the send knob)" },
  "\u56DE\u58F0\u591A\u957F": { en: "Echo length" },
  "\u5F80\u53F3 = \u56DE\u58F0\u91CD\u590D\u5F97\u8D8A\u4E45\uFF08\u53D1\u591A\u5C11\u7531\u53D1\u9001\u90A3\u8FB9\u7684\u65CB\u94AE\u7BA1\uFF09": { en: "Right = echoes repeat longer (how much is sent is set on the send knob)" },
  "\u6BCF\u6B21 {e} dB": { en: "Each {e} dB" },
  "\u5F80\u53F3 = \u8D8A\u5BBD\u3001\u8D8A\u50CF\u597D\u51E0\u4E2A\u4EBA\uFF08\u53D1\u591A\u5C11\u7531\u53D1\u9001\u90A3\u8FB9\u7684\u65CB\u94AE\u7BA1\uFF09": { en: "Right = wider, more like several people (how much is sent is set on the send knob)" },
  "\u6296\u52A8 {w} ms": { en: "Depth {w} ms" },
  "{name}\uFF08\u5173\uFF09": { en: "{name} (off)" },
  "{name}\uFF08\u5168\u91CF\uFF09": { en: "{name} (full)" },
  " \u4F4E\u5207": { en: " low cut" },
  "\uFF08\u5E73\uFF09": { en: " (flat)" },
  " \u539A": { en: " warm" },
  " \u4EAE": { en: " bright" },
  "\u70B9 = \u9690\u85CF / \u663E\u793A\uFF1B\u957F\u6309\uFF08\u7535\u8111\u53F3\u952E\uFF09= \u53EA\u770B\u5B83": { en: "Tap = hide / show; long-press (right-click on a computer) = show only this part" },
  "\u70B9 = \u9759\u97F3 / \u51FA\u58F0\uFF1B\u957F\u6309\uFF08\u7535\u8111\u53F3\u952E\uFF09= \u72EC\u594F": { en: "Tap = mute / unmute; long-press (right-click on a computer) = solo" },
  "\u8C31\u79CD\u548C\u7EB8\uFF1A{paperLabel}": { en: "Notation and paper: {paperLabel}" },
  "\u8FD9\u4E00\u6BB5\u7684\u83DC\u5355": { en: "This section's menu" },
  "\u9690\u85CF {n}": { en: "{n} hidden" },
  "\u8FD9\u4E00\u6BB5\u6709 {n} \u4F4D\u9690\u85CF\u7740\uFF08\u4E0D\u6392\u3001\u4E0D\u5360\u5730\u65B9\uFF09\uFF1A\u70B9\u5F00\u770B\u662F\u8C01\u3001\u653E\u51FA\u6765": { en: "{n} {n|part is|parts are} hidden in this section (not laid out, no space taken): tap to see who and show them" },
  "\u4E0A\u4E00\u6BB5": { en: "Previous section" },
  "\u4E0B\u4E00\u6BB5": { en: "Next section" },
  "\u53EA\u770B\u672C\u6BB5\uFF08\u518D\u70B9 = \u770B\u5168\u90E8\u66F2\u6BB5\uFF09": { en: "Show only this section (tap again = all sections)" },
  "\u53EA\u770B\u672C\u6BB5": { en: "Show only this section" },
  "\u66F2\u6BB5\u540D": { en: "Section name" },
  "\u8FD9\u4E00\u6BB5\u9690\u85CF\u7740\uFF1A\u4E0D\u653E\u3001\u4E0D\u5370\uFF08\u300C\u22EF\u300D\u91CC\u80FD\u653E\u51FA\u6765\uFF09": { en: "This section is hidden: not played, not printed (unhide it from \u201C\u22EF\u201D)" },
  "\uFF08\u8FD9\u5F20\u7EB8\u4E0A\u6CA1\u6709\u58F0\u90E8\uFF09": { en: "(no parts on this sheet)" },
  "\uFF0B \u65B0\u66F2\u6BB5": { en: "\uFF0B New section" },
  "\u9690\u85CF {n} \u6BB5": { en: "{n} hidden {n|section|sections}" },
  "\u6709 {n} \u6BB5\u9690\u85CF\u7740\uFF08\u4E0D\u653E\u3001\u4E0D\u5370\u3001\u4E0D\u5360\u5730\u65B9\uFF09\uFF1A\u70B9\u5F00\u53BB\u770B\u6216\u653E\u51FA\u6765": { en: "{n} hidden {n|section|sections} (not played, not printed, no space taken): open to go to one or unhide it" },
  "\u6B4C\u540D": { en: "Title" },
  "\u4F5C\u8005": { en: "Author" },
  "\u4E0D\u5199 = \u6BCF\u5F20\u7EB8\u6309\u987A\u5E8F\u5404\u653E\u4E00\u904D\uFF08\u4F8B\uFF1A\u524D\u594F (A A1)\xD73 A A2 [\u526F\u6B4C]\uFF09": { en: "Empty = each sheet plays once in order (e.g. Intro (A A1)\xD73 A A2 [Chorus])" },
  "\u5C0F\u8C03\uFF1A\u548C\u5F26\u7EA7\u6570\u4ECE la \u6570\u3002\u70B9 = \u8C31\u53F7 / \u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6": { en: "Minor: chord degrees count from la. Tap = clef / key / time / tempo" },
  "\u8FD9\u91CC\u662F C \u8C03\uFF08\u6CA1\u6709\u5347\u964D\u53F7\uFF09\uFF1A\u70B9 = \u8C31\u53F7 / \u8C03\u53F7 / \u62CD\u53F7 / \u901F\u5EA6": { en: "C major here (no sharps or flats): tap = clef / key / time / tempo" },
  "\u8FD9\u4E00\u5BB6\u5C55\u5F00\u7740\uFF1A\u70B9 = \u53E0\u56DE\u53BB\uFF08\u5149\u6807\u632A\u5230\u4E0B\u4E00\u4F4D\uFF09": { en: "This family is spread out: tap = fold it back (the cursor moves to the next part)" },
  "\u73B0\u5728\u7684\u7F29\u653E\uFF08100% = \u7EB8\u7684\u5B9E\u9645\u5C3A\u5BF8\uFF09\uFF1B\u70B9 = \u56DE\u5230\u81EA\u52A8\u5927\u5C0F\uFF08Ctrl / \u2318 + 0\uFF09\u3002Ctrl / \u2318 + \u6EDA\u8F6E\u3001\u634F\u5408 = \u7F29\u653E\uFF1BCtrl / \u2318 + = / \u2212 = \u4E00\u6863\u4E00\u6863": { en: "Current zoom (100% = the paper's real size); tap = back to auto size (Ctrl / \u2318 + 0). Ctrl / \u2318 + wheel or pinch = zoom; Ctrl / \u2318 + = / \u2212 = step by step" },
  "\u8D77\u70B9\uFF1A|\u25B6 \u4ECE\u8FD9\u513F\u653E\uFF08\u957F\u6309 / \u53F3\u952E\u7A7A\u767D\u5904\u300C\u4ECE\u8FD9\u513F\u653E\u300D\u632A\u5B83\uFF1B\u7F16\u8F91\u4E0D\u52A8\u5B83\uFF09": { en: "Start point: |\u25B6 plays from here (long-press / right-click blank space, \u201CPlay from here\u201D, to move it; editing doesn't move it)" },
  "\u8FD9\u5F20\u7EB8\u4E0A\u53EA\u6709\u8FD9\u4E00\u5BB6\uFF1A\u6CA1\u6709\u522B\u7684\u58F0\u90E8\u53EF\u4EE5\u632A\u8FC7\u53BB\uFF08\u5207\u5230\u300C\u542C\u300D\u5C31\u90FD\u53E0\u8D77\u6765\uFF09": { en: "This sheet only has this family: no other part to move to (switch to \u201CListen\u201D and they all stack)" },
  "\u540E\u9762\u6CA1\u6709\u7A7A\u7740\u7684\u97F3\u4E86\uFF0C\u5B57\u53EA\u80FD\u632A\u5230\u8FD9\u513F": { en: "No empty notes after this one, so the syllable can only move this far" },
  "\u524D\u9762\u9694\u7740\u53E5\u53F7\uFF08\u6216\u8005\u6CA1\u6709\u97F3\u4E86\uFF09\uFF0C\u5B57\u632A\u4E0D\u8FC7\u53BB": { en: "A phrase end is in the way (or no more notes), so the syllable can't move there" },
  "\u987A\u624B\u53BB\u6389\u4E86 {removed} \u4E2A\u4E0D\u518D\u7BA1\u4EFB\u4F55\u97F3\u7684\u529B\u5EA6\u8BB0\u53F7 / \u6E10\u5F3A\u6E10\u5F31\uFF08\u64A4\u9500\u80FD\u627E\u56DE\u6765\uFF09": { en: "Also removed {removed} dynamics / hairpins that no longer govern any note (undo brings them back)" },
  "\u5F3A\u540E\u5F31": { en: "fp" },
  "\u5F80\u4E0A\u4E00\u7EA7\uFF08\u8C03\u5185\uFF09": { en: "Up a scale step" },
  "\u5F80\u4E0B\u4E00\u7EA7\uFF08\u8C03\u5185\uFF09": { en: "Down a scale step" },
  "\u5347\u534A\u97F3": { en: "Up a semitone" },
  "\u964D\u534A\u97F3": { en: "Down a semitone" },
  "\u9AD8\u516B\u5EA6": { en: "Up an octave" },
  "\u4F4E\u516B\u5EA6": { en: "Down an octave" },
  "\u65F6\u503C\u51CF\u534A": { en: "Halve durations" },
  "\u65F6\u503C\u52A0\u500D": { en: "Double durations" },
  "\u9644\u70B9": { en: "Dot" },
  "\u52A0\u9644\u70B9\uFF08\u90FD\u6709\u9644\u70B9 = \u53BB\u6389\uFF09": { en: "Add a dot (all dotted = removes them)" },
  "{sel} \u4E2A": { en: "{sel} selected" },
  "\u64CD\u4F5C\u2026": { en: "Actions\u2026" },
  "\u7C98\u8D34\u5230\u5149\u6807\u5904": { en: "Paste at the cursor" },
  "\u57FA\u7840": { en: "Basics" },
  "\u589E\u76CA\u3001\u58F0\u50CF\u3001\u9759\u97F3 / \u72EC\u594F\uFF1A\u5148\u628A\u51E0\u6761\u8F68\u7684\u97F3\u91CF\u6446\u5E73\u3001\u5DE6\u53F3\u6446\u5F00\uFF08\u6DF7\u97F3\u7684\u7B2C\u4E00\u6B65\uFF09": { en: "Gain, pan, mute / solo: first balance the tracks' levels and spread them left and right (step one of mixing)" },
  "\u6BCF\u6761\u8F68\u7684\u9ED8\u8BA4 EQ\uFF1A\u4E24\u6837\u4E1C\u897F\u7CCA\u5728\u4E00\u8D77\u3001\u592A\u95F7 / \u592A\u523A": { en: "Each track's default EQ: for two things blurring together, too muddy / too harsh" },
  "\u6BCF\u6761\u8F68\u4E0A\u7684\u7B2C\u4E00\u4E2A\u538B\u7F29\uFF1A\u628A\u5FFD\u5927\u5FFD\u5C0F\u62C9\u5E73": { en: "The first compressor on each track: evens out loud and soft" },
  "\u53D1\u9001": { en: "Sends" },
  "\u51FA\u5230\u54EA\u3001\u63A8\u5B50\u540E\u53D1\u7ED9\u54EA\u51E0\u6761\u6DF7\u97F3\u8F68\uFF08\u6DF7\u54CD / \u5EF6\u8FDF\u653E\u5728\u6DF7\u97F3\u8F68\u4E0A\uFF0C\u51E0\u6761\u8F68\u5171\u7528\uFF09": { en: "Where it outputs, and which buses it sends to post-fader (reverb / delay live on a bus, shared by several tracks)" },
  "\u94FE": { en: "Chain" },
  "\u6BCF\u6761\u8F68\u4E0A\u7684\u5168\u90E8\u63D2\u4EF6\u683C\uFF1A\u968F\u4FBF\u63D2\u3001\u5F00\u5173\u3001\u62FF\u6389": { en: "All plugin slots on each track: insert anything, toggle, remove" },
  "\u589E\u76CA\uFF08\u63A8\u5B50\uFF09\uFF1A\u8FD9\u6761\u8F68\u6574\u4F53\u7684\u97F3\u91CF\u3002\u6DF7\u97F3\u7684\u7B2C\u4E00\u6B65 = \u5148\u628A\u51E0\u6761\u8F68\u7684\u97F3\u91CF\u6446\u5E73": { en: "Gain (fader): this track's overall volume. Step one of mixing = balance the tracks' levels first" },
  "\u58F0\u50CF\uFF1A\u5728\u5DE6\u53F3\u54EA\u4E2A\u4F4D\u7F6E\u3002\u51E0\u6761\u8F68\u5DE6\u53F3\u9519\u5F00\u4E00\u70B9\uFF0C\u5C31\u4E0D\u4F1A\u90FD\u6324\u5728\u6B63\u4E2D\u95F4\u3002\u6570\u5B57 = \u5F80\u4E00\u8FB9\u63A8\u4E86\u591A\u5C11\uFF08\u7B49\u529F\u7387\uFF1A\u600E\u4E48\u6446\u603B\u54CD\u5EA6\u4E0D\u53D8\uFF09\uFF1A\u4E2D = \u4E24\u4E2A\u5587\u53ED\u5404 \u22123 dB\uFF1B50 = \u8FD9\u8FB9 \u22120.7 dB\u3001\u90A3\u8FB9 \u22128.3 dB\uFF08\u5DEE 7.7 dB\uFF09\uFF1B100 = \u5168\u5728\u8FD9\u8FB9\uFF0C\u53E6\u4E00\u8FB9\u6CA1\u58F0": { en: "Pan: where it sits between left and right. Spread tracks a little so they don't all crowd the center. The number = how far it's pushed to one side (equal power: total loudness stays the same): center = \u22123 dB on each speaker; 50 = this side \u22120.7 dB, that side \u22128.3 dB (7.7 dB apart); 100 = all on this side, nothing on the other" },
  "\u603B\u8F68\u589E\u76CA\uFF1A\u6240\u6709\u8F68\u6DF7\u5728\u4E00\u8D77\u4E4B\u540E\u6574\u4F53\u518D\u8C03\u5927\u8C03\u5C0F": { en: "Master gain: overall louder / softer after all tracks are mixed" },
  "\u51FA\u5230\uFF1A\u8FD9\u6761\u8F68\u7684\u58F0\u97F3\u6700\u540E\u53BB\u54EA\u2014\u2014\u76F4\u63A5\u53BB\u603B\u8F68\uFF0C\u6216\u8005\u5148\u8FDB\u4E00\u6761\u6DF7\u97F3\u8F68\uFF08\u5728\u90A3\u91CC\u4E00\u8D77\u8FC7\u6548\u679C\uFF09": { en: "Output to: where this track's sound finally goes \u2014 straight to master, or into a bus first (to share effects there)" },
  "\u53D1\u9001\uFF1A\u63A8\u5B50\u4E4B\u540E\u518D\u590D\u5236\u4E00\u4EFD\u7ED9\u8FD9\u6761\u6DF7\u97F3\u8F68\u2014\u2014\u8DDF\u7740\u8FD9\u6761\u8F68\u7684\u589E\u76CA\u548C\u58F0\u50CF\u8D70\uFF1A\u63A8\u5B50\u62C9\u4F4E 3 dB\uFF0C\u53D1\u8FC7\u53BB\u7684\u4E5F\u4F4E 3 dB\uFF08\u539F\u58F0\u548C\u6548\u679C\u7684\u6BD4\u4F8B\u4E0D\u53D8\uFF09\uFF1B\u9759\u97F3\u4E86\u5C31\u4E0D\u53D1\u3002\u8FD9\u91CC\u7684\u6570 = \u8FD9\u4E00\u4F4D\u8FDB\u90A3\u8FB9\u7684\u91CF\uFF0C\u8D8A\u5927\u90A3\u8FB9\u7684\u6548\u679C\uFF08\u6DF7\u54CD / \u5EF6\u8FDF\uFF09\u8D8A\u591A\uFF1B\u539F\u58F0\u7167\u65E7\u8D70\u300C\u51FA\u5230\u300D": { en: "Send: a post-fader copy goes to this bus \u2014 it follows this track's gain and pan: pull the fader down 3 dB and the send drops 3 dB too (dry-to-effect ratio stays); muted means no send. The number = how much enters that bus; higher means more of its effect (reverb / delay); the dry sound still goes to \u201COutput to\u201D" },
  "\u6DF7\u97F3\u8F68\u589E\u76CA\uFF1A\u4ECE\u8FD9\u6761\u6DF7\u97F3\u8F68\u51FA\u6765\u7684\u603B\u91CF\u3002\u6DF7\u54CD / \u5EF6\u8FDF\u8FD9\u7C7B\u5168\u6E7F\u7684\u6DF7\u97F3\u8F68 = \u90A3\u8FB9\u7684\u6548\u679C\u6709\u591A\u5927\uFF0C\u53D1\u7ED9\u5B83\u7684\u51E0\u4F4D\u4E00\u8D77\u53D8\uFF08\u6BCF\u4F4D\u5355\u72EC\u591A\u5C11\u770B\u5404\u81EA\u7684\u300C\u53D1\u9001\u300D\uFF09\u3002\u8981\u662F\u6709\u51E0\u4F4D\u662F\u300C\u51FA\u5230\u300D\u5B83\uFF08\u539F\u58F0\u4E5F\u8FDB\u6765\uFF09\uFF0C\u90A3\u8FD9\u4E2A\u63A8\u5B50\u8FDE\u539F\u58F0\u4E00\u8D77\u8C03": { en: "Bus gain: the total coming out of this bus. For fully wet buses (reverb / delay) = how big the effect is, for everyone sending to it (each one's amount is on their own \u201CSend\u201D). If some parts \u201COutput to\u201D it (dry sound too), this fader moves the dry sound as well" },
  "\u9650\u5E45\uFF08\u603B\u8F68\u6700\u540E\u4E00\u9053\uFF09\uFF1A\u8D85\u8FC7\u5929\u82B1\u677F\uFF08\u22120.18 dBFS\uFF09\u7684\u90A3\u4E00\u5C0F\u6BB5\u5F88\u5FEB\u538B\u4E0B\u6765\uFF0C\u4E0D\u8D85\u7684\u5730\u65B9\u4E00\u4E2A\u91C7\u6837\u90FD\u4E0D\u52A8\uFF0C\u4E0D\u6539\u97F3\u8272\u3002\u5173\u6389 = \u8D85\u4E86\u5C31\u524A\u6CE2\uFF08\u7206\u97F3\u3001\u5BFC\u51FA\u7684\u6587\u4EF6\u91CC\u4E5F\u662F\uFF09\u3002\u4E00\u822C\u4E00\u76F4\u5F00\u7740\uFF1B\u60F3\u770B\u81EA\u5DF1\u7684\u6DF7\u97F3\u5230\u5E95\u591A\u54CD\uFF0C\u53EF\u4EE5\u5148\u5173\u4E86\u770B\u5CF0\u503C": { en: "Limiter (the final stage on master): quickly brings down the bit that exceeds the ceiling (\u22120.18 dBFS); everywhere else not one sample changes, and timbre is untouched. Off = clipping when over (crackle, in exported files too). Usually left on; to see how loud your mix really is, turn it off and watch the peak" },
  "\u5CF0\u503C\uFF1A\u6700\u8FD1\u8FD9\u4E00\u4E0B\u6700\u54CD\u7684\u90A3\u4E2A\u91C7\u6837\uFF08dBFS\uFF09\u30020 dB = \u6EE1\u683C\uFF0C\u518D\u5927\u5C31\u524A\u6CE2\uFF1B\u9650\u5E45\u5F00\u7740\u65F6\u6700\u591A\u5230 \u22120.18 dB\u3002\u9876\u4E0A\u7684\u7EC6\u7EBF\u662F\u540C\u4E00\u4E2A\u6570": { en: "Peak: the loudest sample just now (dBFS). 0 dB = full scale, above that clips; with the limiter on it tops out at \u22120.18 dB. The thin line on top shows the same number" },
  "\u5E73\u5747\u7535\u5E73\uFF08RMS\uFF0C\u6700\u8FD1 0.3 \u79D2\uFF0C\u63A8\u5B50\u4E4B\u540E\uFF0CdBFS\uFF09\uFF1A\u6BD4\u5CF0\u503C\u66F4\u63A5\u8FD1\u8033\u6735\u89C9\u5F97\u7684\u54CD\u3002\u51E0\u6761\u8F68\u6446\u5E73\u97F3\u91CF\u770B\u8FD9\u4E2A\uFF1B\u9876\u4E0A\u7684\u7EC6\u7EBF\uFF08\u5CF0\u503C\uFF09\u770B\u4F1A\u4E0D\u4F1A\u7206": { en: "Average level (RMS, last 0.3 s, post-fader, dBFS): closer to perceived loudness than peak. Use this to balance tracks; use the thin line on top (peak) to watch for clipping" },
  "\u5DE6\u53F3\u76F8\u5173\uFF08\u22121 \u5230 +1\uFF09\uFF1A+1 = \u5DE6\u53F3\u4E00\u6837\uFF08\u5355\u58F0\u9053\uFF09\uFF1B0 \u9644\u8FD1 = \u5F88\u5BBD\uFF1B\u5C0F\u4E8E 0 = \u5DE6\u53F3\u53CD\u76F8\uFF0C\u624B\u673A\u5916\u653E / \u5355\u58F0\u9053\u4E00\u5408\u5C31\u4F1A\u53D8\u5C0F\u3001\u53D8\u7A7A\u3002\u80CC\u666F\u7684\u56FE\uFF1A\u7AD6\u7EBF = \u5355\u58F0\u9053\uFF0C\u8D8A\u5706\u8D8A\u5BBD\uFF0C\u6A2A\u7740 = \u53CD\u76F8\uFF1B\u5F80\u5DE6\u4E0A\u659C = \u504F\u5DE6\u58F0\u9053\u3001\u5F80\u53F3\u4E0A\u659C = \u504F\u53F3": { en: "Stereo correlation (\u22121 to +1): +1 = left and right identical (mono); around 0 = very wide; below 0 = out of phase, which gets thin and quiet on phone speakers / mono. The background figure: vertical line = mono, rounder = wider, horizontal = out of phase; tilting up-left = left-heavy, up-right = right-heavy" },
  "\u538B\u4E86\u591A\u5C11\uFF1A\u8FD9\u6761\u8F68\u4E0A\u7B2C\u4E00\u53F0\u538B\u7F29\u6B64\u523B\u628A\u58F0\u97F3\u538B\u4F4E\u4E86\u51E0 dB\uFF08\u4E0B\u9762\u644A\u5F00\u7684\u5C31\u662F\u5B83\uFF09\u3002\u4E00\u76F4\u538B\u5F88\u591A = \u9608\u503C\u592A\u4F4E\u6216\u6BD4\u4F8B\u592A\u5927": { en: "Gain reduction: how many dB the first compressor on this track is reducing right now (it's the one shown below). Constantly a lot = threshold too low or ratio too high" },
  "\u88AB\u8C01\u538B\uFF08\u4FA7\u94FE\uFF09\uFF1A\u538B\u7F29\u5668\u4E0D\u770B\u81EA\u5DF1\uFF0C\u800C\u770B\u53E6\u4E00\u6761\u8F68\u6709\u591A\u54CD\u2014\u2014\u6BD4\u5982\u5C0F\u6708\u76F8\u4E00\u5531\uFF0C\u4F34\u594F\u81EA\u5DF1\u8BA9\u4E00\u70B9": { en: "Compressed by (sidechain): the compressor listens to another track instead of itself \u2014 say, the backing ducks a bit when Tsukuyomi-chan sings" },
  "\u5E73\u5747": { en: "Average" },
  "\u5DE6\u53F3\u76F8\u5173": { en: "Stereo correlation" },
  "\u62F7\u8FD9\u4E00\u683C\u7684\u53C2\u6570\uFF08\u79CD\u7C7B + \u5168\u90E8\u53C2\u6570\uFF1B\u4E0D\u62F7\u5F00\u5173\u3001\u4E0D\u62F7\u88AB\u8C01\u538B\uFF09": { en: "Copy this slot's parameters (kind + all parameters; not on/off, not \u201Ccompressed by\u201D)" },
  "\u62F7\u53C2\u6570": { en: "Copy params" },
  "\u628A\u62F7\u7684\u53C2\u6570\uFF08\u6765\u81EA\u300C{from}\u300D\uFF09\u76D6\u5230\u8FD9\u4E00\u683C\u4E0A\uFF1B\u5F00\u5173 / \u88AB\u8C01\u538B\u7167\u65E7\uFF1B\u80FD\u64A4\u9500": { en: "Applies the copied parameters (from \u201C{from}\u201D) to this slot; on/off and \u201Ccompressed by\u201D stay; can be undone" },
  "\u7C98\u53C2\u6570": { en: "Paste params" },
  "\u64AD\u653E\uFF08\u7A7A\u683C\uFF09": { en: "Play (Space)" },
  "\u52A0\u4E00\u6761\u6DF7\u97F3\u8F68\uFF08\u8DEF\u7531\u8F68\uFF09\uFF1A\u51E0\u6761\u8F68\u53D1\u8FC7\u6765\u4E00\u8D77\u8FC7\u6548\u679C\uFF0C\u6BD4\u5982\u5171\u7528\u4E00\u4E2A\u6DF7\u54CD": { en: "Add a bus (routing track): several tracks send here to share effects, such as one reverb" },
  "\uFF0B \u6DF7\u97F3\u8F68": { en: "\uFF0B Bus" },
  "\u66F4\u591A\uFF1A\u6392\u6570\u2026": { en: "More: rows\u2026" },
  "\u6536\u8D77\u6DF7\u97F3\u53F0\uFF1A\u5E95\u5EA7\u8BA9\u51FA\u6765\u3001\u8FD8\u5728\u300C\u542C\u300D\uFF08Esc = \u56DE\u53BB\u5199\uFF09": { en: "Collapses the mixer: frees the dock, still in \u201CListen\u201D (Esc = back to writing)" },
  "\u6548\u679C\u5168\u5173\u7740\uFF1A\u63D2\u4EF6\u548C\u53D1\u9001\u90FD\u4E0D\u54CD\uFF0C\u53EA\u5269\u63A8\u5B50\u3001\u58F0\u50CF\u3001\u51FA\u5230\u548C\u603B\u8F68\u9650\u5E45\u2014\u2014\u542C\u8C31\u5B50\u672C\u8EAB / \u542C\u5DEE\u522B\u7528\uFF1B\u518D\u70B9\u4E00\u4E0B\u56DE\u6765\u3002\u5BFC\u51FA\u7167\u5E38\u5E26\u6548\u679C\u3002": { en: "All effects off: plugins and sends are silent, leaving only faders, pan, outputs and the master limiter \u2014 for hearing the score itself / comparing; tap again to return. Exports still include effects." },
  "\u4E0D\u518D\u53D1\u7ED9 {to}": { en: "Stop sending to {to}" },
  "\u5F00 / \u5173": { en: "On / off" },
  "{strip} \u7C98\u6210\u65B0\u7684\u4E00\u683C\uFF1A{kind}": { en: "{strip} pasted as a new slot: {kind}" },
  "\u6539\u6210\u6700\u63A5\u8FD1\u7684\u4E00\u952E": { en: "Switch to the nearest Simple" },
  "\u53D1\u7ED9 {to} {v}": { en: "Send to {to} {v}" },
  "\u53D1\u7ED9 {value}": { en: "Send to {value}" },
  "\u88AB\u8C01\u538B": { en: "Compressed by" },
  "\u51E0\u4E2A\u5927\u65CB\u94AE\uFF0C\u6309\u516C\u5F0F\u8C03\u4E0B\u9762\u5168\u91CF\u7684\u53C2\u6570\uFF08\u53EA\u6362\u8FD9\u4E00\u683C\uFF09": { en: "A few big knobs that set the full parameters below by formula (this slot only)" },
  "\u4E00\u952E": { en: "Simple" },
  "\u6BCF\u4E00\u4E2A\u53C2\u6570\u90FD\u644A\u5F00\uFF08\u53EA\u6362\u8FD9\u4E00\u683C\uFF09": { en: "Every parameter laid out (this slot only)" },
  "\u5168\u91CF": { en: "Full" },
  "{track} \u63D2\u4E0A{kind}": { en: "{track} inserted {kind}" },
  "{track} \u62FF\u6389{gone}": { en: "{track} removed {gone}" },
  "\u4E0D\u7528\uFF08\u81EA\u5DF1\u538B\u81EA\u5DF1\uFF09": { en: "None (compresses itself)" },
  "\u5728\u5168\u91CF\u91CC\u8C03\u8FC7\uFF0C\u4E00\u952E\u8868\u8FBE\u4E0D\u4E86\uFF1A\u4E00\u952E\u5148\u9501\u7740\uFF0C\u514D\u5F97\u4E00\u78B0\u5C31\u76D6\u6389\u3002": { en: "Adjusted in Full in a way Simple can't express: Simple stays locked so a touch can't overwrite it." },
  "\u6309\u6700\u63A5\u8FD1\u7684\u4E00\u952E\u6570\u503C\u6539\u5199\u2014\u2014\u5168\u91CF\u91CC\u591A\u8C03\u7684\u4F1A\u4E22\u6389\uFF08\u6BD4\u5982\u4E2D\u9891\u90A3\u4E00\u5200\uFF09\uFF1B\u80FD\u64A4\u9500": { en: "Rewrites to the nearest Simple values \u2014 extra adjustments in Full are lost (like that mid-band cut); can be undone" },
  "\u6DF7\u97F3\u8F68 / \u603B\u8F68\u4E0A\u6CA1\u6709\u97F3\uFF0C\u7528\u4E0D\u4E0A{v}": { en: "Buses / master have no notes, so {v} isn't usable" },
  "\uFF08\u5F00\u7740\u4E5F\u4E0D\u5207\uFF09": { en: " (no cut even when on)" },
  "\u81EA\u52A8\uFF1A{hz} Hz\uFF08\u8FD9\u4F4D\u6700\u4F4E\u7684\u97F3\u5F80\u4E0B\u56DB\u4E2A\u534A\u97F3\uFF09": { en: "Auto: {hz} Hz (four semitones below this part's lowest note)" },
  "\u81EA\u52A8\uFF08\u8FD9\u6761\u8F68\u6CA1\u6709\u97F3 = \u4E0D\u5207\uFF09": { en: "Auto (no notes on this track = no cut)" },
  "\u5F80\u8FD9\u6761\u8F68\u4E0A\u63D2\u4E00\u4E2A{kind}": { en: "Insert a {kind} on this track" },
  "\u5173 = \u8FD9\u4E00\u683C\u8DF3\u8FC7\uFF08\u53C2\u6570\u7559\u7740\uFF09": { en: "Off = this slot is skipped (parameters stay)" },
  "\u5173\u7740": { en: "Off" },
  "\u5F00\u7740": { en: "On" },
  "\u8FD8\u6709 {p} \u4E2A{kind}\u5728\u300C\u94FE\u300D\u91CC": { en: "{p} more {kind} in \u201CChain\u201D" },
  "\u538B\u4E86": { en: "Reduced" },
  "\u51FA\u5230": { en: "Output to" },
  "{out}\uFF08\u63A5\u4E0D\u4E0A\uFF09": { en: "{out} (can't connect)" },
  "\u53D1\u7ED9 {to}": { en: "Send to {to}" },
  "\u4E0D\u518D\u53D1\u7ED9\u5B83": { en: "Stop sending to it" },
  "\u63A8\u5B50\u4E4B\u540E\u53D1\u4E00\u4EFD\u5230\u4E00\u6761\u6DF7\u97F3\u8F68\uFF08\u6DF7\u54CD / \u5EF6\u8FDF\u8FD9\u7C7B\u653E\u5728\u6DF7\u97F3\u8F68\u4E0A\uFF0C\u51E0\u6761\u8F68\u5171\u7528\uFF09": { en: "Sends a post-fader copy to a bus (reverb / delay live on buses, shared by several tracks)" },
  "\uFF0B \u53D1\u9001\u5230\u2026": { en: "\uFF0B Send to\u2026" },
  "\u8FD8\u6CA1\u6709\u6DF7\u97F3\u8F68\uFF08\u9876\u680F\u300C\uFF0B \u6DF7\u97F3\u8F68\u300D\u52A0\uFF09": { en: "No buses yet (add one with \u201C\uFF0B Bus\u201D at the top)" },
  "\u300C{out}\u300D\u4E0A\u7684{kind}\u662F\u5168\u6E7F\u7684\uFF1A\u51FA\u5230\u5B83 = \u539F\u58F0\u6CA1\u4E86\uFF0C\u53EA\u5269{kind2}\u3002\u8981\u539F\u58F0\u52A0{kind3}\uFF1A\u51FA\u5230\u603B\u8F68\uFF0C\u7528\u4E0B\u9762\u7684\u300C\u53D1\u9001\u300D\u3002": { en: "The {kind} on \u201C{out}\u201D is fully wet: outputting there = no dry sound, only {kind2}. For dry plus {kind3}: output to master and use \u201CSend\u201D below." },
  "\u51FA\u5230\u300C{out}\u300D= \u6574\u6761\u58F0\u97F3\u90FD\u8FC7\u5B83\u7684{kind}\uFF1A\u51FA\u5230\u5B83\u7684\u51E0\u6761\u8F68{kind2}\u4E00\u6837\u591A{dryDb}\u3002\u60F3\u6BCF\u6761\u8F68\u5404\u81EA\u591A\u5C11\uFF1A\u51FA\u5230\u603B\u8F68\u3001\u7528\u4E0B\u9762\u7684\u300C\u53D1\u9001\u300D\uFF0C\u90A3\u6761\u6DF7\u97F3\u8F68\u4E0A\u7684{kind3}\u6539\u6210\u5168\u6E7F\u3002": { en: "Outputting to \u201C{out}\u201D = the whole sound passes through its {kind}: tracks output there all get the same {kind2}{dryDb}. For a different amount per track: output to master, use \u201CSend\u201D below, and make the {kind3} on that bus fully wet." },
  "\uFF0C\u539F\u58F0\u4E5F\u88AB\u5B83\u5173\u5C0F {dryDb}\uFF08\u63A8\u5B50\u4E0A\u770B\u4E0D\u51FA\u6765\uFF09": { en: ", and it also reduces the dry sound by {dryDb} (not visible on the fader)" },
  "{kind}\uFF1A\u70B9\u5F00\u8C03{DEFAULT_EQ_ID}": { en: "{kind}: tap to adjust{DEFAULT_EQ_ID}" },
  "\uFF08\u9ED8\u8BA4\u90A3\u4E00\u683C\uFF1A\u80FD\u5173\u3001\u80FD\u6362\u9762\u677F\uFF0C\u4E0D\u80FD\u5220\uFF09": { en: " (the default slot: can be toggled and its panel switched, not deleted)" },
  "\u94FE\u5C3E\u52A0\u4E00\u683C\uFF1A\u62F7\u7684\u90A3\u4E00\u683C\uFF08\u6765\u81EA\u300C{from}\u300D\uFF09\u7684\u79CD\u7C7B\u548C\u53C2\u6570": { en: "Adds a slot at the end of the chain: the kind and parameters of the copied slot (from \u201C{from}\u201D)" },
  "\u7C98\u6210\u65B0\u7684\u4E00\u683C\uFF1A{kind}": { en: "Paste as a new slot: {kind}" },
  "\u63D2\u4E00\u4E2A\u63D2\u4EF6\uFF08\u4EFB\u4F55\u63D2\u4EF6\u90FD\u80FD\u63D2\u5728\u4EFB\u4F55\u8F68\u4E0A\uFF09": { en: "Insert a plugin (any plugin works on any track)" },
  "\u4ECE\u8FD9\u6761\u8F68\u4E0A\u62FF\u6389\uFF08\u80FD\u64A4\u9500\uFF09": { en: "Remove from this track (can be undone)" },
  "\u8D34\u5728\u5E95\u4E0B\u65F6\u663E\u793A\u51E0\u6392\u5361\u7247\uFF08\u540C\u5C0F\u952E\u76D8\u7684\u300C\u884C\u300D\uFF09\uFF1A\u81EA\u52A8 = \u534A\u5C4F\u653E\u5F97\u4E0B\u7684\u6700\u591A\u6392\uFF1B\u624B\u52A8\u6700\u591A\u5230\u5C4F\u5E55\u653E\u5F97\u4E0B\u3001\u8C31\u8FD8\u9732\u4E00\u6761\u4E3A\u6B62\u3002\u6A2A\u7740\u653E / \u5168\u5C4F\u65F6\u4E0D\u7BA1": { en: "How many rows of cards to show when docked at the bottom (like the keypad rows): Auto = as many as fit in half the screen; manual goes up to what the screen can hold while a strip of the score stays visible. Ignored when docked at the side or full screen" },
  "\u6392\u6570": { en: "Rows" },
  "\u5C11\u4E00\u6392": { en: "One row fewer" },
  "\u591A\u4E00\u6392": { en: "One row more" },
  "\u6548\u679C\u5168\u5173": { en: "All FX off" },
  "\u6548\u679C\u5F00\u7740": { en: "FX on" },
  "\u73B0\u5728\uFF1A\u63D2\u4EF6\u548C\u53D1\u9001\u90FD\u4E0D\u54CD\uFF08\u63A8\u5B50 / \u58F0\u50CF\u7559\u7740\uFF09\u3002\u70B9 = \u6548\u679C\u56DE\u6765": { en: "Now: plugins and sends are silent (faders / pan stay). Tap = effects back" },
  "\u70B9 = \u6682\u65F6\u5173\u6389\u5168\u90E8\u6548\u679C\uFF08\u63D2\u4EF6 + \u53D1\u9001\uFF09\uFF0C\u542C\u8C31\u5B50\u672C\u8EAB / \u542C\u5DEE\u522B\uFF1B\u63A8\u5B50\u3001\u58F0\u50CF\u7559\u7740": { en: "Tap = temporarily turn off all effects (plugins + sends), to hear the score itself / compare; faders and pan stay" },
  "\u8FD8\u539F\uFF1A\u56DE\u5230\u5E95\u5EA7": { en: "Restore: back to the dock" },
  "\u6DF7\u97F3\u53F0\u94FA\u6EE1\uFF08\u63A8\u5230\u6700\u4E0A\u9762\uFF0C\u5361\u7247\u6392\u6210\u597D\u51E0\u5217\uFF0C\u4E00\u773C\u770B\u5168\uFF09\uFF1B\u518D\u70B9 = \u56DE\u5230\u5E95\u5EA7": { en: "Fills the screen with the mixer (cards in several columns, all in view); tap again = back to the dock" },
  "\u8FD8\u539F": { en: "Restore" },
  "\u5168\u5C4F": { en: "Full screen" },
  "\u9650\u5E45": { en: "Limiter" },
  "\u5173\u7740\uFF08\u53EF\u80FD\u524A\u6CE2\uFF09": { en: "Off (may clip)" },
  "\u5CF0\u503C": { en: "Peak" },
  "\u603B\u8F68\u5C31\u662F\u8F93\u51FA\uFF0C\u4E0D\u518D\u53D1\u7ED9\u522B\u5904": { en: "Master is the output; it doesn't send anywhere else" },
  "\u6240\u6709\u58F0\u90E8\u6DF7\u5728\u4E00\u8D77\u4E4B\u540E": { en: "After all parts are mixed" },
  "\u58F0\u50CF": { en: "Pan" },
  "\u65C1\u901A\uFF1A\u8FD9\u6761\u6DF7\u97F3\u8F68\u4E0A\u7684\u63D2\u4EF6\u5168\u8DF3\u8FC7\uFF08\u63A8\u5B50 / \u58F0\u50CF / \u51FA\u5230 / \u53D1\u9001\u7167\u65E7\uFF09\uFF1B\u518D\u70B9 = \u56DE\u6765": { en: "Bypass: all plugins on this bus are skipped (fader / pan / output / sends stay); tap again = back" },
  "\u65C1\u901A\u4E2D": { en: "Bypassed" },
  "\u5F80\u524D\u632A\u4E00\u4F4D": { en: "Move earlier" },
  "\u5F80\u540E\u632A\u4E00\u4F4D": { en: "Move later" },
  "\u5220\u6389\u8FD9\u6761\u6DF7\u97F3\u8F68\uFF08\u53D1\u7ED9\u5B83\u7684\u3001\u51FA\u5230\u5B83\u7684\u90FD\u6539\u56DE\u603B\u8F68\uFF1B\u80FD\u64A4\u9500\uFF09": { en: "Delete this bus (tracks sending or outputting to it go back to master; can be undone)" },
  "\u540D\u5B57\uFF08\u70B9\u4E86\u6539\uFF09": { en: "Name (tap to change)" },
  "\u9759\u97F3\uFF1A\u8FD9\u6761\u6DF7\u97F3\u8F68\u4E0D\u51FA\u58F0\u3001\u4E5F\u4E0D\u5F80\u4E0B\u53D1\uFF08\u53D1\u7ED9\u5B83\u7684\u90A3\u51E0\u4F4D\u539F\u58F0\u7167\u65E7\uFF09": { en: "Mute: this bus is silent and sends nothing onward (the dry sound of parts sending to it is unaffected)" },
  "\u9759": { en: "M" },
  "\u6DF7\u97F3\u8F68 \xB7 \u65C1\u901A\u4E2D\uFF08\u63D2\u4EF6\u5168\u8DF3\u8FC7\uFF09": { en: "Bus \xB7 bypassed (all plugins skipped)" },
  "\u5F80\u524D\u632A\u4E00\u4F4D\uFF08\u8C31\u4E0A\u8FD9\u4E2A\u58F0\u90E8\u4E5F\u5F80\u4E0A\u632A\uFF09": { en: "Move earlier (this part also moves up on the score)" },
  "\u5F80\u540E\u632A\u4E00\u4F4D\uFF08\u8C31\u4E0A\u8FD9\u4E2A\u58F0\u90E8\u4E5F\u5F80\u4E0B\u632A\uFF09": { en: "Move later (this part also moves down on the score)" },
  "\u5728 {refs} \u5F20\u7EB8\u4E0A": { en: "On {refs} {refs|sheet|sheets}" },
  "\u54EA\u5F20\u7EB8\u4E0A\u90FD\u6CA1\u6709": { en: "Not on any sheet" },
  "\u5220\u6389\u8FD9\u4E2A\u58F0\u90E8\uFF08\u5B83\u7684\u4E50\u5668\u8BBE\u7F6E\u4E00\u8D77\u5220\uFF1B\u80FD\u64A4\u9500\uFF09": { en: "Delete this part (its instrument settings go too; undoable)" },
  "\u5220\u6389\u8FD9\u4E2A\u58F0\u90E8": { en: "Delete this part" },
  "\u9759\u97F3\uFF08\u8FD9\u4F4D\u4E0D\u51FA\u58F0\uFF1B\u548C\u8C31\u4E0A\u58F0\u90E8\u540D\u4E0B\u9762\u7684\u300C\u9759\u300D\u662F\u540C\u4E00\u4E2A\uFF09": { en: "Mute (this part is silent; same as \u201CM\u201D under the part name on the score)" },
  "\u72EC\u594F\uFF08\u53EA\u542C\u72EC\u594F\u7684\u51E0\u4F4D\uFF1B\u548C\u8C31\u4E0A\u7684\u300C\u72EC\u300D\u662F\u540C\u4E00\u4E2A\uFF09": { en: "Solo (only hear the parts on solo; same as \u201CS\u201D on the score)" },
  "\u72EC": { en: "S" }
};

// src/device-kv.ts
var PREFIX = "moonsinger-5b1e7c0a92d34f6e:";
var _mem = /* @__PURE__ */ new Map();
function _ls() {
  try {
    const ls = globalThis.localStorage;
    ls.getItem(PREFIX + "__probe");
    return ls;
  } catch {
    return null;
  }
}
function deviceKvGet(key) {
  const k = PREFIX + key;
  const ls = _ls();
  if (ls) {
    try {
      return ls.getItem(k);
    } catch {
    }
  }
  return _mem.get(k) ?? null;
}

// src/i18n/index.ts
var LANGS = ["zh", "en"];
var valid = (v) => LANGS.includes(v) ? v : null;
function detect() {
  const g = globalThis;
  if (g.process?.versions?.node) return "zh";
  if (typeof g.document === "undefined") {
    const m = typeof g.name === "string" ? /^lang=(\w+)/.exec(g.name) : null;
    return valid(m?.[1]) ?? "zh";
  }
  const saved = valid(deviceKvGet("lang"));
  if (saved) return saved;
  return (g.navigator?.language ?? "en").toLowerCase().startsWith("zh") ? "zh" : "en";
}
var _lang = null;
function lang() {
  return _lang ??= detect();
}
function fill(raw, params) {
  if (!params) return raw;
  return raw.replace(/\{(\w+)(?:\|([^|}]*)\|([^}]*))?\}/g, (m, k, one, many) => {
    if (!(k in params)) return m;
    return one !== void 0 ? Number(params[k]) === 1 ? one : many ?? "" : String(params[k]);
  });
}
var TABLE = typeof __I18N_OFF__ !== "undefined" && __I18N_OFF__ ? {} : S;
function lookup(key, l = lang()) {
  if (l === "zh") {
    const i = key.indexOf("##");
    return i < 0 ? key : key.slice(0, i);
  }
  const e = TABLE[key];
  return e?.en || key;
}
function _t(key, params) {
  return fill(lookup(key), params);
}
function _tIn(l, key, params) {
  return fill(lookup(key, l), params);
}

// src/score/paper.ts
var DENSITIES = [{ id: "cozy", label: _t("\u8212\u9002"), note: _t("\u8C31\u5927\u3001\u97F3\u8DDD\u6B63\u5E38\uFF1A\u6478\u4E3B\u65CB\u5F8B\u3001\u5199\u6B4C\u8BCD") }, { id: "compact", label: _t("\u7D27\u51D1"), note: _t("\u8C31\u5C0F\u3001\u97F3\u8DDD\u7D27\u3001\u884C\u8DDD\u518D\u5377\u4E00\u70B9\uFF1A\u914D\u5668\uFF1B\u6B4C\u540D\u548C\u58F0\u90E8\u540D\u7167\u5927\u7684\uFF0C\u6B4C\u8BCD\u7528\u5C0F\u5B57") }];
var densityOf = (p) => p.density ?? "cozy";
var SIZES = { A3L: { w: 420, h: 297, m: 18 }, A4: { w: 210, h: 297, m: 15 }, A5: { w: 148, h: 210, m: 16 }, A6: { w: 105, h: 148, m: 10 } };
var DEFAULT_PAPER = "A5";
var PAPER_NOTE = { A3L: _t("\u6A2A\u653E\uFF1A\u603B\u8C31 / \u5927\u5C4F"), A4: _t("\u6B63\u7ECF\u7EB8"), A5: _t("\u5C0F\u518C\u5B50\uFF08A4 \u5BF9\u6298\uFF09"), A6: _t("\u53E3\u888B\u672C") };
var PAPER_LABEL = { A3L: _t("A3 \u6A2A"), A4: "A4", A5: "A5", A6: "A6" };
function paperOf(kind, density = "cozy") {
  const s2 = SIZES[kind];
  return { kind, widthMm: s2.w, heightMm: s2.h, marginMm: { l: s2.m, r: s2.m, t: s2.m, b: s2.m }, ...density === "compact" ? { density } : {} };
}

// src/score/pitch.ts
var STEPS = ["C", "D", "E", "F", "G", "A", "B"];
var STEP_SEMI = [0, 2, 4, 5, 7, 9, 11];
var HOME = { step: "D", alter: 0, octave: 4 };
var stepIndex = (s2) => STEPS.indexOf(s2);
function midiOf(p) {
  return (p.octave + 1) * 12 + STEP_SEMI[stepIndex(p.step)] + p.alter;
}
function diatonicIndex(p) {
  return p.octave * 7 + stepIndex(p.step);
}
var SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
var FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];
function keyAlter(step, fifths) {
  if (fifths > 0) return SHARP_ORDER.slice(0, fifths).includes(step) ? 1 : 0;
  if (fifths < 0) return FLAT_ORDER.slice(0, -fifths).includes(step) ? -1 : 0;
  return 0;
}
function tonicStepIndex(fifths) {
  return (4 * fifths % 7 + 7) % 7;
}
function spellMidi(midi, fifths, prefer = fifths < 0 ? -1 : 1) {
  const cands = [];
  for (const step of STEPS) for (let o = Math.floor(midi / 12) - 2; o <= Math.floor(midi / 12); o++) {
    const alter = midi - midiOf({ step, alter: 0, octave: o });
    if (Math.abs(alter) <= 1) cands.push({ step, alter, octave: o });
  }
  return cands.find((p) => p.alter === keyAlter(p.step, fifths)) ?? cands.find((p) => p.alter === prefer) ?? cands.find((p) => p.alter === 0) ?? cands[0];
}
function transposeInterval(p, steps, semis) {
  const d = diatonicIndex(p) + steps, step = STEPS[(d % 7 + 7) % 7], octave = Math.floor(d / 7);
  return { step, alter: midiOf(p) + semis - midiOf({ step, alter: 0, octave }), octave };
}
function keyInterval(f0, f1) {
  let semis = (7 * (f1 - f0) % 12 + 12) % 12;
  if (semis > 6) semis -= 12;
  let steps = ((tonicStepIndex(f1) - tonicStepIndex(f0)) % 7 + 7) % 7;
  if (semis < 0 && steps > 0) steps -= 7;
  return { steps, semis };
}
var KEY_LABEL = { [-7]: "C\u266D", [-6]: "G\u266D", [-5]: "D\u266D", [-4]: "A\u266D", [-3]: "E\u266D", [-2]: "B\u266D", [-1]: "F", 0: "C", 1: "G", 2: "D", 3: "A", 4: "E", 5: "B", 6: "F\u266F", 7: "C\u266F" };
var MINOR_LABEL = { [-7]: "A\u266D", [-6]: "E\u266D", [-5]: "B\u266D", [-4]: "F", [-3]: "C", [-2]: "G", [-1]: "D", 0: "A", 1: "E", 2: "B", 3: "F\u266F", 4: "C\u266F", 5: "G\u266F", 6: "D\u266F", 7: "A\u266F" };
var keyText = (fifths, minor = false) => minor ? `6=${MINOR_LABEL[fifths] ?? "?"}` : `1=${KEY_LABEL[fifths] ?? "?"}`;

// src/score/repeats.ts
function navWhy(song, paper, partId, t) {
  if (!(t.kind === "nav" || t.kind === "bar" && t.repeat)) return null;
  const owner = tempoOwner(song, paper);
  if (owner && owner !== partId) return _t("\u53CD\u590D / \u8DF3\u8F6C\u53EA\u770B\u8FD9\u5F20\u7EB8\u6700\u4E0A\u9762\u90A3\u4E2A\u58F0\u90E8\u90A3\u4E00\u884C");
  if (t.kind === "nav" && (t.what === "ds" || t.what === "dsFine" || t.what === "dsCoda") && !paper.tracks[partId]?.some((x) => x.kind === "nav" && x.what === "segno")) return _t("\u8FD9\u5F20\u7EB8\u4E0A\u6CA1\u6709 Segno\uFF0CD.S. \u8DF3\u4E0D\u4E86");
  if (t.kind === "nav" && (t.what === "dcCoda" || t.what === "dsCoda") && !paper.tracks[partId]?.some((x) => x.kind === "nav" && x.what === "toCoda")) return _t("\u6CA1\u6709 To Coda\uFF1A\u8DF3\u56DE\u6765\u4E4B\u540E\u4E00\u8DEF\u653E\u5230\u7EB8\u5C3E");
  return null;
}

// src/score/song.ts
var TPQ = 1680;
var WHOLE = TPQ * 4;
var LADDER = [TPQ / 8, TPQ / 4, TPQ / 2, TPQ, TPQ * 2, WHOLE];
var MIN_DUR = TPQ / 8 * 4 / 7;
var MAX_DUR = WHOLE * 4;
var NAV_LABEL = { segno: "Segno", coda: "Coda", fine: "Fine", toCoda: "To Coda", dc: "D.C.", dcFine: "D.C. al Fine", dcCoda: "D.C. al Coda", ds: "D.S.", dsFine: "D.S. al Fine", dsCoda: "D.S. al Coda" };
var endingLabel = (nums) => nums && nums.length ? nums.map((n2) => `${n2}.`).join(" ") : "1.";
var SWELL_NAME = { "<": _t("\u97F3\u5185\u6E10\u5F3A"), ">": _t("\u97F3\u5185\u6E10\u5F31"), "<>": _t("\u97F3\u5185\u9F13\u8D77") };
var ART_NAME = { staccato: _t("\u8DF3\u97F3"), accent: _t("\u91CD\u97F3"), marcato: _t("\u5F3A\u97F3"), sfz: _t("\u7A81\u5F3A"), fp: _t("\u5F3A\u540E\u5373\u5F31"), tenuto: _t("\u4FDD\u6301"), breath: _t("\u547C\u5438"), stress: _t("\u6B21\u91CD\u97F3"), unstress: _t("\u5F31\u5316"), ghost: _t("\u5E7D\u7075\u97F3"), whisper: _t("\u6C14\u58F0"), swellUp: _t("\u97F3\u5185\u6E10\u5F3A"), swellDown: _t("\u97F3\u5185\u6E10\u5F31"), swellBoth: _t("\u97F3\u5185\u9F13\u8D77"), arpeggio: _t("\u7436\u97F3"), roll: _t("\u6EDA\u594F") };
function swellOf(t) {
  if (t?.kind !== "note" || !t.art) return void 0;
  return t.art.includes("swellUp") ? "<" : t.art.includes("swellDown") ? ">" : t.art.includes("swellBoth") ? "<>" : void 0;
}
var DYNS = ["ppp", "pp", "p", "mp", "mf", "f", "ff", "fff"];
var CLEFS = ["G", "G8vb", "G8va", "G15ma", "F", "F8vb"];
var SPLIT_MIDI = 60;
var DEFAULT_KEY = 0;
var DEFAULT_TIME = { beats: 4, beatType: 4 };
var DEFAULT_BPM = 90;
var isTimed = (t) => t.kind === "note" || t.kind === "rest";
var isMark = (t) => t.kind === "key" || t.kind === "time" || t.kind === "tempo";
function headLen(tokens) {
  let n2 = 0;
  while (n2 < tokens.length && isMark(tokens[n2])) n2++;
  return n2;
}
function prevPitch(tokens, i) {
  for (let j = i - 1; j >= 0; j--) {
    const t = tokens[j];
    if (t.kind === "note" && t.pitch) return t.pitch;
  }
  return null;
}
function effectivePitch(tokens, i) {
  const t = tokens[i];
  if (t.kind === "note" && t.pitch) return t.pitch;
  return prevPitch(tokens, i) ?? HOME;
}
var allPitches = (t) => t.pitch ? [t.pitch, ...t.chord ?? []] : [];
function tempoAt(tokens, i) {
  let v = DEFAULT_BPM;
  for (let j = 0; j < i && j < tokens.length; j++) {
    const t = tokens[j];
    if (t.kind === "tempo") v = t.bpm;
  }
  return v;
}
var TEMPO_WORDS = [
  { from: 0, it: "Largo", zh: _t("\u5E7F\u677F"), typical: 50 },
  { from: 60, it: "Larghetto", zh: _t("\u5C0F\u5E7F\u677F"), typical: 63 },
  { from: 66, it: "Adagio", zh: _t("\u67D4\u677F"), typical: 70 },
  { from: 76, it: "Andante", zh: _t("\u884C\u677F"), typical: 88 },
  { from: 100, it: "Moderato", zh: _t("\u4E2D\u677F"), typical: 108 },
  { from: 112, it: "Allegretto", zh: _t("\u5C0F\u5FEB\u677F"), typical: 116 },
  { from: 120, it: "Allegro", zh: _t("\u5FEB\u677F"), typical: 132 },
  { from: 156, it: "Vivace", zh: _t("\u6D3B\u677F"), typical: 160 },
  { from: 176, it: "Presto", zh: _t("\u6025\u677F"), typical: 184 },
  { from: 200, it: "Prestissimo", zh: _t("\u6700\u6025\u677F"), typical: 208 }
];
function tempoWord(bpm) {
  let w = TEMPO_WORDS[0];
  for (const x of TEMPO_WORDS) if (bpm >= x.from) w = x;
  return w;
}
function beatTicks(beats, beatType) {
  return beatType === 8 && beats >= 3 && beats % 3 === 0 ? WHOLE * 3 / 8 : WHOLE / beatType;
}
var artOf = (t) => t.art ?? [];
function rampTarget(tokens, i, end = tokens.length) {
  for (let j = i + 1; j < end; j++) {
    const t = tokens[j];
    if (t.kind === "hairpin") return -1;
    if (t.kind === "dyn") return t.ramp ? j : -1;
  }
  return -1;
}
function rampSource(tokens, j, start = 0) {
  for (let k = j - 1; k >= start; k--) {
    const t = tokens[k];
    if (t.kind === "hairpin") return "hairpin";
    if (t.kind === "dyn") return k;
  }
  return "none";
}
var HEADER_KINDS = /* @__PURE__ */ new Set(["key", "time", "tempo", "clef"]);
function headerSpot(tokens, i) {
  let a = Math.max(0, Math.min(i, tokens.length)), b = a;
  while (a > 0 && HEADER_KINDS.has(tokens[a - 1].kind)) a--;
  while (b < tokens.length && HEADER_KINDS.has(tokens[b].kind)) b++;
  return { a, b, head: a === 0 };
}
function headClefOf(tokens) {
  if (!tokens) return null;
  const spot = headerSpot(tokens, 0);
  for (let i = spot.a; i < spot.b; i++) {
    const t = tokens[i];
    if (t.kind === "clef") return t.clef;
  }
  return null;
}
function tempoOwner(song, paper) {
  return song.parts.find((p) => paper.tracks[p.id])?.id ?? null;
}
function sheetEndBpm(song, paper) {
  const o = tempoOwner(song, paper);
  return o ? tempoAt(paper.tracks[o], paper.tracks[o].length) : null;
}
function autoStaffs(tokens, staves) {
  let last = 1;
  return tokens.map((t, i) => {
    if (staves !== 2) return 1;
    if (t.kind === "note") last = midiOf(effectivePitch(tokens, i)) < SPLIT_MIDI ? 2 : 1;
    return last;
  });
}
function staffOfTokens(tokens, staves) {
  const auto = autoStaffs(tokens, staves);
  let last = 1;
  return tokens.map((t, i) => {
    if (staves !== 2) return 1;
    const s2 = (t.kind === "note" || t.kind === "rest") && t.staff ? t.staff : t.kind === "note" ? auto[i] : last;
    last = s2;
    return s2;
  });
}
function swingDelta(T, origin, r) {
  const u = ((T - origin) % TPQ + TPQ) % TPQ, h = TPQ / 2;
  return (u <= h ? u * 2 * r : r * TPQ + (u - h) * 2 * (1 - r)) - u;
}
var SWING_GRID = TPQ / 16;
function timeline(tokens, tempoMap) {
  const out = [];
  let t = 0, bar = 0, sec = 0, bpm = DEFAULT_BPM, k = 0, sw = 0, org = 0, bt = DEFAULT_TIME.beatType;
  tokens.forEach((tok, index) => {
    if (tok.kind === "bar") {
      bar = t;
      return;
    }
    if (tok.kind === "tempo") {
      if (!tempoMap) bpm = tok.bpm;
      return;
    }
    if (tok.kind === "time") {
      bt = tok.beatType;
      return;
    }
    if (!isTimed(tok)) return;
    if (tempoMap) {
      while (k < tempoMap.length && tempoMap[k].tick <= t) {
        const e = tempoMap[k];
        bpm = e.bpm;
        if (e.swing !== void 0) {
          sw = e.swing;
          org = e.origin ?? 0;
        }
        k++;
      }
    }
    const len = tok.dur / TPQ * (60 / bpm);
    const swOn = sw !== 0 && (bt === 4 || bt === 2) && tok.dur % SWING_GRID === 0;
    const d0 = swOn ? swingDelta(t, org, sw) : 0, d1 = swOn ? swingDelta(t + tok.dur, org, sw) : 0;
    if (d0 || d1) {
      const spt = 60 / (bpm * TPQ);
      out.push({ index, tok, start: t, inBar: t - bar, bpm, t0: sec + d0 * spt, t1: sec + len + d1 * spt, dw0: d0, dw1: d1 });
    } else out.push({ index, tok, start: t, inBar: t - bar, bpm, t0: sec, t1: sec + len });
    t += tok.dur;
    sec += len;
  });
  return out;
}

// src/score/arrange.ts
var REP = /^(?:[×xX*])(\d+)/;
function parseArrangement(text, papers, l = lang()) {
  const src = (text ?? "").trim();
  if (!src) return { order: papers.filter((p) => !p.hidden).map((p) => p.id), loop: null, issues: [], explicit: false };
  const issues = [];
  let i = 0;
  const ws = () => {
    while (i < src.length && /[\s、,，→]/.test(src[i])) i++;
  };
  const findPaper = (name) => {
    const byName = papers.find((p) => p.name.trim() === name);
    if (byName) return byName.id;
    if (/^\d+$/.test(name)) {
      const k = Number(name);
      if (k >= 1 && k <= papers.length) return papers[k - 1].id;
    }
    return null;
  };
  const rep = () => {
    const save = i;
    while (src[i] === " ") i++;
    const m = REP.exec(src.slice(i));
    if (!m) {
      i = save;
      return null;
    }
    i += m[0].length;
    return Number(m[1]);
  };
  const seq = (close) => {
    const out = [];
    for (; ; ) {
      ws();
      if (i >= src.length) {
        if (close) issues.push({ at: src.length, len: 0, why: _tIn(l, "\u5C11\u4E86\u300C{close}\u300D", { close }) });
        return out;
      }
      const c = src[i];
      if (close && c === close) {
        i++;
        return out;
      }
      if (c === ")" || c === "]") {
        issues.push({ at: i, len: 1, why: _tIn(l, "\u591A\u4E86\u300C{c}\u300D", { c }) });
        i++;
        continue;
      }
      if (c === "[") return out;
      let node;
      const at = i;
      if (c === "(") {
        i++;
        node = { kind: "rep", body: seq(")"), n: 1 };
      } else {
        let name = "";
        while (i < src.length && !/[\s、,，→()[\]×*]/.test(src[i]) && !(/[xX]/.test(src[i]) && /\d/.test(src[i + 1] ?? "") && name)) name += src[i++];
        if (!name) {
          issues.push({ at: i, len: 1, why: _tIn(l, "\u770B\u4E0D\u61C2\u300C{p}\u300D", { p: src[i] }) });
          i++;
          continue;
        }
        const paper = findPaper(name);
        if (!paper) {
          issues.push({ at, len: name.length, why: _tIn(l, "\u6CA1\u6709\u53EB\u300C{name}\u300D\u7684\u7EB8\uFF08\u5199\u66F2\u6BB5\u540D\uFF0C\u6216\u8005\u7B2C\u51E0\u5F20\u7EB8\u7684\u5E8F\u53F7\uFF09", { name }) });
          node = { kind: "rep", body: [], n: 1 };
        } else node = { kind: "ref", paper, text: name, at };
      }
      const n2 = rep();
      if (n2 !== null) {
        if (n2 < 1 || n2 > 99) issues.push({ at, len: i - at, why: _tIn(l, "\u91CD\u590D\u6B21\u6570\u8981\u5728 1 \u5230 99 \u4E4B\u95F4") });
        if (n2 >= 1) node = { kind: "rep", body: [node], n: Math.min(99, n2) };
      }
      out.push(node);
    }
  };
  const main = seq(null);
  let loopNodes = null;
  ws();
  if (i < src.length && src[i] === "[") {
    const at = i;
    i++;
    loopNodes = seq("]");
    if (!loopNodes.length) issues.push({ at, len: i - at, why: _tIn(l, "\u5FAA\u73AF\u6BB5\u662F\u7A7A\u7684") });
    ws();
    if (i < src.length) {
      issues.push({ at: i, len: src.length - i, why: _tIn(l, "\u5FAA\u73AF\u6BB5\u53EA\u80FD\u653E\u5728\u6700\u540E\uFF1A\u540E\u9762\u7684\u6C38\u8FDC\u653E\u4E0D\u5230") });
    }
  }
  const expand = (ns) => ns.flatMap((n2) => n2.kind === "ref" ? [n2.paper] : Array.from({ length: n2.n }, () => expand(n2.body)).flat());
  const loop = loopNodes ? expand(loopNodes) : null;
  return { order: expand(main), loop: loop && loop.length ? loop : null, issues, explicit: true };
}

// src/render/spacing.ts
function indexRods(rods, n2) {
  const into = Array.from({ length: n2 }, () => []);
  for (const r of rods) into[r.to]?.push(r);
  return { into };
}
var isZero = (c) => c.fixed !== void 0 && c.fixed <= EPS;
var EPS = 1e-6;
var LOOSE = [[TPQ / 8, 2.2], [TPQ / 4, 2.2], [TPQ / 2, 2.85], [TPQ, 3.6], [TPQ * 2, 4.35], [TPQ * 4, 5.1]];
var DENSE = [[TPQ / 8, 1.6], [TPQ / 4, 1.9], [TPQ / 2, 2.85], [TPQ, 3.6], [TPQ * 2, 4.35], [TPQ * 4, 5.1]];
var TIGHT = [[TPQ / 8, 1.5], [TPQ / 4, 1.7], [TPQ / 2, 2.35], [TPQ, 3], [TPQ * 2, 3.6], [TPQ * 4, 4.2]];
var lerpLog = (pts, ticks) => {
  if (ticks <= pts[0][0]) return pts[0][1];
  const last = pts[pts.length - 1], prev = pts[pts.length - 2];
  if (ticks >= last[0]) return last[1] + (last[1] - prev[1]) / Math.log2(last[0] / prev[0]) * Math.log2(ticks / last[0]);
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1], b = pts[k];
    if (ticks <= b[0]) return a[1] + (b[1] - a[1]) * Math.log2(ticks / a[0]) / Math.log2(b[0] / a[0]);
  }
  return last[1];
};
var curveOf = (m) => {
  const t = m === true || m === "normal" ? DENSE : m === "tight" ? TIGHT : LOOSE;
  return (ticks) => lerpLog(t, ticks);
};
var SP_DEFAULTS = { pad: 0.3, emptyBar: 4.5 };
function idealGaps(cols, endTick, o) {
  const out = new Array(cols.length).fill(0), sounding = /* @__PURE__ */ new Map();
  cols.forEach((c, k) => {
    if (c.fixed !== void 0) {
      out[k] = c.fixed;
      return;
    }
    for (const it of c.items) {
      if (it.dur !== void 0 && it.dur > EPS) sounding.set(it.row, { dur: it.dur, end: c.tick + it.dur });
      else sounding.delete(it.row);
    }
    let next = endTick;
    for (let j = k + 1; j < cols.length; j++) if (cols[j].tick > c.tick + EPS) {
      next = cols[j].tick;
      break;
    }
    const dt = next - c.tick;
    if (dt <= EPS) return;
    let d = Infinity;
    for (const a of sounding.values()) if (a.end > c.tick + EPS) d = Math.min(d, a.dur);
    out[k] = d === Infinity ? Math.min(o.curve(dt), o.emptyBar) : o.curve(d) * Math.min(1, dt / d);
  });
  return out;
}
function rodsOf(cols, o) {
  const rods = [], last = /* @__PURE__ */ new Map();
  let wall = null;
  cols.forEach((c, k) => {
    if (isZero(c)) return;
    if (c.fixed !== void 0) {
      for (const l of last.values()) rods.push({ from: l.col, to: k, min: l.right + o.pad });
      if (wall && !last.size) rods.push({ from: wall.col, to: k, min: wall.right });
      last.clear();
      wall = { col: k, right: c.fixed };
      return;
    }
    for (const it of c.items) {
      const l = last.get(it.row);
      if (l) rods.push({ from: l.col, to: k, min: l.right + it.left + o.pad });
      else if (wall) rods.push({ from: wall.col, to: k, min: wall.right + it.left });
      last.set(it.row, { col: k, right: it.right });
    }
  });
  return rods;
}
var leftOf = (c) => c.fixed !== void 0 ? 0 : c.items.reduce((m, it) => Math.max(m, it.left), 0);
var rightOf = (c) => c.fixed !== void 0 ? c.fixed : c.items.reduce((m, it) => Math.max(m, it.right), 0);
function placeLine(cols, gaps, rods, from, to, s2) {
  const n2 = to - from, xs = new Array(n2).fill(0);
  if (n2 <= 0) return { xs, end: 0 };
  const ix = "into" in rods ? rods : indexRods(rods, cols.length);
  const gap = (k) => cols[k].fixed !== void 0 ? gaps[k] : gaps[k] * (1 + s2);
  for (let k = from; k < to; k++) {
    let x = k === from ? 0 : xs[k - 1 - from] + gap(k - 1);
    x = Math.max(x, leftOf(cols[k]));
    for (const r of ix.into[k] ?? []) if (r.from >= from) x = Math.max(x, xs[r.from - from] + r.min);
    xs[k - from] = x;
  }
  for (let k = to - 2; k >= from; k--) if (isZero(cols[k])) xs[k - from] = xs[k + 1 - from];
  const lastK = to - 1;
  return { xs, end: xs[n2 - 1] + Math.max(gap(lastK), rightOf(cols[lastK])) };
}
function fitLine(cols, gaps, rods, from, to, width, opt) {
  const ix = "into" in rods ? rods : indexRods(rods, cols.length), at = (s3) => placeLine(cols, gaps, ix, from, to, s3), nat = at(0);
  const solve = (lo, hi2) => {
    for (let i = 0; i < 48; i++) {
      const mid = (lo + hi2) / 2;
      if (at(mid).end > width) hi2 = mid;
      else lo = mid;
    }
    return lo;
  };
  if (nat.end > width + EPS) {
    const tight = at(-opt.squeeze);
    if (tight.end > width + EPS) return { ...tight, stretch: -opt.squeeze, over: true };
    const s3 = solve(-opt.squeeze, 0);
    return { ...at(s3), stretch: s3, over: false };
  }
  if (!opt.justify) return { ...nat, stretch: 0, over: false };
  let hi = 1;
  while (at(hi).end < width && hi < 4096) hi *= 2;
  if (at(hi).end < width) return { ...nat, stretch: 0, over: false };
  const s2 = solve(0, hi);
  return { ...at(s2), stretch: s2, over: false };
}

// src/gm/percussion.gen.ts
var PERC = { "0:119": { "staff": 1, "line": 0, "head": "normal", "stem": "up", "hitSec": 1.389, "kitKey": 57 }, "0:120": { "staff": 1, "line": 0, "head": "normal", "stem": "up", "hitSec": 0.057 }, "0:121": { "staff": 1, "line": 0, "head": "normal", "stem": "up", "hitSec": 0.077 }, "0:122": { "staff": 1, "line": 0, "head": "normal", "stem": "up" }, "0:123": { "staff": 1, "line": 0, "head": "normal", "stem": "up" }, "0:124": { "staff": 1, "line": 0, "head": "normal", "stem": "up" }, "0:125": { "staff": 1, "line": 0, "head": "normal", "stem": "up" }, "0:126": { "staff": 1, "line": 0, "head": "normal", "stem": "up" }, "0:127": { "staff": 1, "line": 0, "head": "normal", "stem": "up", "hitSec": 7e-3 }, "128:0:35": { "staff": 5, "line": 8, "head": "normal", "stem": "down", "hitSec": 0.037 }, "128:0:36": { "staff": 5, "line": 7, "head": "normal", "stem": "down", "hitSec": 7e-3 }, "128:0:37": { "staff": 5, "line": 3, "head": "slashed1", "stem": "up", "hitSec": 2e-3 }, "128:0:38": { "staff": 5, "line": 3, "head": "normal", "stem": "up", "hitSec": 7e-3 }, "128:0:39": { "staff": 5, "line": -2, "head": "plus", "stem": "up", "hitSec": 0.012 }, "128:0:40": { "staff": 5, "line": 3, "head": "slash", "stem": "up", "hitSec": 7e-3 }, "128:0:41": { "staff": 5, "line": 6, "head": "normal", "stem": "up", "hitSec": 0.017 }, "128:0:42": { "staff": 5, "line": -1, "head": "x", "stem": "up", "hitSec": 2e-3 }, "128:0:43": { "staff": 5, "line": 5, "head": "normal", "stem": "up", "hitSec": 0.017 }, "128:0:44": { "staff": 5, "line": 9, "head": "x", "stem": "down", "hitSec": 0.012 }, "128:0:45": { "staff": 5, "line": 4, "head": "normal", "stem": "up", "hitSec": 0.012 }, "128:0:46": { "staff": 5, "line": -1, "head": "circle-x", "stem": "up", "hitSec": 0.022 }, "128:0:47": { "staff": 5, "line": 2, "head": "normal", "stem": "up", "hitSec": 7e-3 }, "128:0:48": { "staff": 5, "line": 1, "head": "normal", "stem": "up", "hitSec": 0.012 }, "128:0:49": { "staff": 5, "line": -2, "head": "x", "stem": "up", "hitSec": 0.057 }, "128:0:50": { "staff": 5, "line": 0, "head": "normal", "stem": "up", "hitSec": 2e-3 }, "128:0:51": { "staff": 5, "line": 0, "head": "x", "stem": "up", "hitSec": 2e-3 }, "128:0:52": { "staff": 5, "line": -3, "head": "normal", "stem": "up", "hitSec": 0.027 }, "128:0:53": { "staff": 5, "line": 0, "head": "diamond", "stem": "up", "hitSec": 2e-3 }, "128:0:54": { "staff": 5, "line": 1, "head": "diamond", "stem": "up", "hitSec": 2e-3 }, "128:0:55": { "staff": 5, "line": -4, "head": "x", "stem": "up", "hitSec": 0.067 }, "128:0:56": { "staff": 5, "line": 1, "head": "triangle-down", "stem": "up", "hitSec": 2e-3 }, "128:0:57": { "staff": 5, "line": -3, "head": "x", "stem": "up", "hitSec": 0.057 }, "128:0:58": { "staff": 5, "line": 0, "head": "ti", "stem": "up", "hitSec": 2e-3 }, "128:0:59": { "staff": 5, "line": 2, "head": "x", "stem": "up", "hitSec": 2e-3 }, "128:0:60": { "staff": 5, "line": -1, "head": "normal", "stem": "up", "hitSec": 2e-3 }, "128:0:61": { "staff": 5, "line": 0, "head": "normal", "stem": "up", "hitSec": 7e-3 }, "128:0:62": { "staff": 5, "line": 1, "head": "custom", "stem": "up", "smufl": "noteheadXOrnate", "hitSec": 0.012 }, "128:0:63": { "staff": 5, "line": 1, "head": "normal", "stem": "up", "hitSec": 0.012 }, "128:0:64": { "staff": 5, "line": 2, "head": "normal", "stem": "up", "hitSec": 0.017 }, "128:0:65": { "staff": 5, "line": 5, "head": "normal", "stem": "up", "hitSec": 0.012 }, "128:0:66": { "staff": 5, "line": 7, "head": "normal", "stem": "up", "hitSec": 2e-3 }, "128:0:67": { "staff": 5, "line": -2, "head": "triangle-down", "stem": "up", "hitSec": 2e-3 }, "128:0:68": { "staff": 5, "line": -1, "head": "triangle-down", "stem": "up", "hitSec": 7e-3 }, "128:0:69": { "staff": 5, "line": 2, "head": "diamond", "stem": "up", "hitSec": 0.032 }, "128:0:70": { "staff": 5, "line": 4, "head": "diamond", "stem": "up", "hitSec": 0.032 }, "128:0:71": { "staff": 5, "line": -3, "head": "x", "stem": "up", "hitSec": 0.072 }, "128:0:72": { "staff": 5, "line": -3, "head": "ti", "stem": "up", "hitSec": 0.022 }, "128:0:73": { "staff": 5, "line": -1, "head": "x", "stem": "up", "hitSec": 0.012 }, "128:0:74": { "staff": 5, "line": -1, "head": "slashed1", "stem": "up", "hitSec": 0.222 }, "128:0:75": { "staff": 5, "line": 0, "head": "la", "stem": "up", "hitSec": 2e-3 }, "128:0:76": { "staff": 5, "line": 5, "head": "la", "stem": "up", "hitSec": 2e-3 }, "128:0:77": { "staff": 5, "line": 7, "head": "la", "stem": "up", "hitSec": 2e-3 }, "128:0:78": { "staff": 5, "line": 8, "head": "x", "stem": "up", "hitSec": 0.062 }, "128:0:79": { "staff": 5, "line": 8, "head": "slashed2", "stem": "up", "hitSec": 0.042 }, "128:0:80": { "staff": 5, "line": 0, "head": "x", "stem": "up", "hitSec": 2e-3 }, "128:0:81": { "staff": 5, "line": 0, "head": "triangle-up", "stem": "up", "hitSec": 0.022 }, "128:0:27": { "staff": 5, "line": 8, "head": "slash", "stem": "up", "hitSec": 0.012 }, "128:0:28": { "staff": 5, "line": 4, "head": "custom", "stem": "up", "smufl": "noteheadSlashX", "hitSec": 0.012 }, "128:0:29": { "staff": 5, "line": 6, "head": "slash", "stem": "up", "hitSec": 0.092 }, "128:0:30": { "staff": 5, "line": 6, "head": "slash", "stem": "up", "hitSec": 0.077 }, "128:0:31": { "staff": 5, "line": -1, "head": "plus", "stem": "up", "hitSec": 7e-3 }, "128:0:32": { "staff": 5, "line": 10, "head": "plus", "stem": "up", "hitSec": 2e-3 }, "128:0:33": { "staff": 5, "line": 10, "head": "x", "stem": "up", "hitSec": 2e-3 }, "128:0:34": { "staff": 5, "line": 10, "head": "triangle-up", "stem": "up", "hitSec": 2e-3 }, "128:0:82": { "staff": 5, "line": 5, "head": "diamond", "stem": "up", "hitSec": 0.027 }, "128:0:83": { "staff": 5, "line": 3, "head": "triangle-down", "stem": "up", "hitSec": 0.072 }, "128:0:84": { "staff": 5, "line": 2, "head": "ti", "stem": "up" }, "128:0:85": { "staff": 5, "line": 2, "head": "la", "stem": "up", "hitSec": 2e-3 }, "128:0:86": { "staff": 5, "line": 4, "head": "custom", "stem": "up", "smufl": "noteheadSlashX", "hitSec": 7e-3 }, "128:0:87": { "staff": 5, "line": 4, "head": "slash", "stem": "up", "hitSec": 0.027 }, "0:112": { "staff": 1, "line": 0, "head": "normal", "stem": "up", "hitSec": 2e-3, "kitKey": 84, "from": "Q1621499" }, "0:113": { "staff": 1, "line": -1, "head": "normal", "stem": "up", "hitSec": 7e-3, "kitKey": 67, "from": "Q395212" }, "0:115": { "staff": 1, "line": -1, "head": "normal", "stem": "up", "hitSec": 2e-3, "kitKey": 76, "from": "Q957212" }, "0:116": { "staff": 1, "line": 0, "head": "normal", "stem": "up", "hitSec": 0.027, "kitKey": 87, "from": "Q221769" }, "0:117": { "staff": 5, "line": 5, "head": "normal", "stem": "up", "hitSec": 7e-3, "kitKey": 45, "from": "Q849349" }, "0:118": { "staff": 5, "line": 0, "head": "normal", "stem": "up", "hitSec": 7e-3, "from": "Q1327480" } };

// src/gm/percussion.ts
function percOf(bank, program, note) {
  if (bank === 128) return note === void 0 ? null : PERC[`128:0:${note}`] ?? null;
  return (note !== void 0 ? PERC[`${bank}:${program}:${note}`] : void 0) ?? PERC[`${bank}:${program}`] ?? null;
}

// src/score/lyrics.ts
var MELISMA_MARK = "\u30FC";
var ELISION = "\u203F";
var CJK_CHAR = /[぀-ヿ\p{Script=Han}]/u;
var lyricShow = (s2) => s2.split(ELISION).reduce((a, b) => !a ? b : CJK_CHAR.test(a.slice(-1)) && CJK_CHAR.test(b.slice(0, 1)) ? a + b : `${a}${ELISION}${b}`, "");
var SMALL = /* @__PURE__ */ new Set([..."\u3083\u3085\u3087\u3041\u3043\u3045\u3047\u3049\u308E\u3095\u3096\u30E3\u30E5\u30E7\u30A1\u30A3\u30A5\u30A7\u30A9\u30EE\u30F5\u30F6", "\u3063", "\u30C3"]);

// src/render/glyph-box.gen.ts
var GLYPH_BOX = {
  "\uE040": [0, 1.464, -4, 0],
  "\uE041": [4e-3, 1.468, -4, 0],
  "\uE042": [4e-3, 2.432, -4, 0],
  "\uE047": [0.016, 2.2, -3.036, 0.108],
  "\uE048": [-0.016, 3.82, -3.592, 0.632],
  "\uE050": [0, 2.684, -4.392, 2.632],
  "\uE052": [0, 2.684, -4.392, 3.512],
  "\uE053": [0, 2.684, -5.28, 2.632],
  "\uE054": [0, 2.684, -5.276, 2.632],
  "\uE062": [-0.02, 2.736, -1.048, 2.54],
  "\uE064": [-0.02, 2.736, -1.048, 2.976],
  "\uE069": [0, 1.528, -1, 1],
  "\uE080": [0.08, 1.8, -1.004, 1],
  "\uE081": [0.08, 1.256, -1.004, 1],
  "\uE082": [0.08, 1.704, -1.016, 1.028],
  "\uE083": [0.08, 1.604, -0.996, 1.004],
  "\uE084": [0.08, 1.8, -1.004, 1],
  "\uE085": [0.08, 1.532, -0.984, 1.004],
  "\uE086": [0.08, 1.656, -1.004, 0.996],
  "\uE087": [0.08, 1.684, -0.996, 1],
  "\uE088": [0.08, 1.664, -1.036, 1.036],
  "\uE089": [0.08, 1.656, -1.004, 0.996],
  "\uE0A2": [0, 1.688, -0.5, 0.5],
  "\uE0A3": [0, 1.18, -0.5, 0.5],
  "\uE0A4": [0, 1.18, -0.5, 0.5],
  "\uE0A7": [0, 1.508, -0.5, 0.5],
  "\uE0A8": [0, 1.336, -0.5, 0.5],
  "\uE0A9": [0, 1.16, -0.5, 0.5],
  "\uE0AA": [0, 0.988, -0.504, 0.504],
  "\uE0AD": [0, 1.14, -0.5, 0.5],
  "\uE0AE": [0, 1.044, -0.5, 0.5],
  "\uE0AF": [-4e-3, 0.996, -0.5, 0.5],
  "\uE0B1": [0, 0.996, -0.5, 0.5],
  "\uE0B2": [0, 1, -0.5, 0.5],
  "\uE0B3": [0, 0.996, -0.5, 0.5],
  "\uE0B8": [0, 1.252, -0.5, 0.5],
  "\uE0B9": [0, 1.252, -0.5, 0.5],
  "\uE0BB": [0, 1.276, -0.5, 0.5],
  "\uE0BC": [0, 1.14, -0.5, 0.5],
  "\uE0BE": [0, 1.172, -0.5, 0.5],
  "\uE0C4": [0, 1.276, -0.5, 0.5],
  "\uE0C5": [0, 1.14, -0.5, 0.5],
  "\uE0C7": [0, 1.168, -0.5, 0.5],
  "\uE0CC": [0, 1.112, -0.5, 0.5],
  "\uE0CD": [0, 1.112, -0.5, 0.5],
  "\uE0CF": [-0.32, 1.5, -0.668, 0.66],
  "\uE0D0": [-0.316, 1.504, -0.672, 0.656],
  "\uE0D1": [-0.268, 1.544, -0.64, 0.568],
  "\uE0D2": [-0.292, 1.52, -0.672, 0.536],
  "\uE0D3": [-0.088, 1.732, -0.592, 0.628],
  "\uE0D4": [-0.072, 1.744, -0.604, 0.616],
  "\uE0D8": [1e-3, 1.666, -0.564, 0.564],
  "\uE0D9": [0, 0.98, -0.564, 0.564],
  "\uE0DB": [0, 0.98, -0.564, 0.564],
  "\uE0F5": [0, 0.436, -0.724, 0.724],
  "\uE0F6": [-0.144, 0.292, -0.724, 0.724],
  "\uE101": [0, 2.12, -1, 1],
  "\uE102": [0, 3.92, -1, 1],
  "\uE103": [0, 3.12, -1, 1],
  "\uE106": [0, 2.12, -1, 1],
  "\uE1D2": [0, 1.836, -0.544, 0.548],
  "\uE1D3": [0, 1.364, -3.5, 0.58],
  "\uE1D5": [0, 1.328, -3.5, 0.564],
  "\uE1D7": [0, 2.264, -3.492, 0.552],
  "\uE1D9": [0, 2.324, -3.492, 0.552],
  "\uE1DB": [0, 2.252, -4.092, 0.552],
  "\uE1E7": [0, 0.4, -0.2, 0.2],
  "\uE222": [-0.6, 0.6, -1.112, 1.12],
  "\uE240": [0, 1.056, -0.036, 3.24],
  "\uE241": [0, 1.224, -3.232, 0.056],
  "\uE242": [0, 1.116, -8e-3, 3.252],
  "\uE243": [0, 1.164, -3.248, 0.036],
  "\uE244": [0, 1.044, -0.596, 3.248],
  "\uE245": [0, 1.092, -3.248, 0.688],
  "\uE260": [0, 0.904, -1.756, 0.7],
  "\uE261": [0, 0.672, -1.364, 1.34],
  "\uE262": [0, 0.996, -1.4, 1.392],
  "\uE263": [0, 0.988, -0.508, 0.5],
  "\uE264": [0, 1.644, -1.748, 0.7],
  "\uE4A0": [0, 1.356, -0.98, -4e-3],
  "\uE4A1": [0, 1.356, 0, 0.976],
  "\uE4A2": [0, 0.336, -0.336, 0],
  "\uE4A3": [0, 0.336, 0, 0.336],
  "\uE4A4": [-4e-3, 1.352, -0.192, 0],
  "\uE4A5": [-4e-3, 1.352, 0, 0.192],
  "\uE4A8": [4e-3, 0.356, -1.16, 0],
  "\uE4A9": [4e-3, 0.356, 0, 1.16],
  "\uE4AC": [-4e-3, 0.94, -1.012, 4e-3],
  "\uE4AD": [-4e-3, 0.94, 0, 1.016],
  "\uE4B6": [0, 0.932, -0.948, -0.02],
  "\uE4B7": [0.016, 0.944, 0, 0.936],
  "\uE4B8": [0, 1.528, -0.828, 0],
  "\uE4B9": [4e-3, 1.532, 0, 0.828],
  "\uE4CE": [4e-3, 0.608, -1.004, -8e-3],
  "\uE4E3": [0, 1.128, -0.036, 0.54],
  "\uE4E4": [0, 1.128, -0.568, 8e-3],
  "\uE4E5": [4e-3, 1.08, -1.492, 1.5],
  "\uE4E6": [0, 0.988, -0.696, 1.004],
  "\uE4E7": [0, 1.28, -0.716, 2],
  "\uE4E8": [0, 1.452, -1.704, 2],
  "\uE511": [0, 3.54, -1.852, 0.04],
  "\uE512": [0, 3.356, -1.852, 0.04],
  "\uE515": [0, 5.26, -1.844, 0.04],
  "\uE520": [-0.356, 1.464, -1.096, 0.568],
  "\uE522": [-0.564, 1.456, -1.776, 0.608],
  "\uE52A": [-0.368, 4.292, -1.096, 0.568],
  "\uE52B": [-0.328, 2.912, -1.096, 0.568],
  "\uE52C": [-0.08, 3.3, -1.096, 0.568],
  "\uE52D": [-0.08, 3.272, -1.724, 0.66],
  "\uE52F": [-0.54, 2.44, -1.776, 0.608],
  "\uE530": [-0.62, 3.32, -1.776, 0.608],
  "\uE534": [-0.564, 2.476, -1.776, 0.608],
  "\uE539": [0, 2.932, -1.776, 0.608],
  "\uE880": [0, 1.272, -1.5, 0.032],
  "\uE881": [0.04, 1.024, -1.488, 0],
  "\uE882": [0.04, 1.316, -1.5, 0.024],
  "\uE883": [0.04, 1.224, -1.5, 0.032],
  "\uE884": [0.04, 1.252, -1.488, 0],
  "\uE885": [0.04, 1.308, -1.492, 0.032],
  "\uE886": [0.04, 1.256, -1.5, 0.032],
  "\uE887": [0.12, 1.332, -1.488, 0.016],
  "\uE888": [0.04, 1.292, -1.5, 0.032],
  "\uE889": [0.04, 1.256, -1.5, 0.032],
  "\uEAA9": [-0.132, 1.168, -0.476, 0],
  "\uECA5": [0, 1.328, -2.752, 0.564]
};

// src/render/skyline.ts
var STEP = 0.25;
var Skyline = class {
  up;
  dn;
  /** 行高要算进去的那部分（歌词另算——它有自己的行距规矩）：最高 / 最低。 */
  hUp = Infinity;
  hDn = -Infinity;
  constructor(widthSp) {
    const n2 = Math.max(1, Math.ceil(widthSp / STEP) + 1);
    this.up = new Float64Array(n2).fill(Infinity);
    this.dn = new Float64Array(n2).fill(-Infinity);
  }
  span(x0, x1) {
    const n2 = this.up.length;
    return [Math.max(0, Math.min(n2 - 1, Math.floor(x0 / STEP))), Math.max(0, Math.min(n2 - 1, Math.floor(x1 / STEP)))];
  }
  /** 记一块墨（count = 算不算进行高）。 */
  ink(x0, x1, y0, y1, count = true) {
    if (!(x1 >= x0) || !(y1 >= y0)) return;
    const [a, b] = this.span(x0, x1);
    for (let i = a; i <= b; i++) {
      if (y0 < this.up[i]) this.up[i] = y0;
      if (y1 > this.dn[i]) this.dn[i] = y1;
    }
    if (count) {
      if (y0 < this.hUp) this.hUp = y0;
      if (y1 > this.hDn) this.hDn = y1;
    }
  }
  /** x0–x1 这一段往上最远到哪（没有墨 = Infinity）。 */
  top(x0, x1) {
    const [a, b] = this.span(x0, x1);
    let v = Infinity;
    for (let i = a; i <= b; i++) if (this.up[i] < v) v = this.up[i];
    return v;
  }
  /** x0–x1 这一段往下最远到哪（没有墨 = −Infinity）。 */
  bottom(x0, x1) {
    const [a, b] = this.span(x0, x1);
    let v = -Infinity;
    for (let i = a; i <= b; i++) if (this.dn[i] > v) v = this.dn[i];
    return v;
  }
};
function primInk(p, sp, measure, emit) {
  switch (p.t) {
    case "glyph": {
      const size = p.size ?? 4 * sp, k = size / 4;
      let x = p.x;
      for (const ch of p.ch) {
        const b = GLYPH_BOX[ch];
        if (b) {
          emit(x + b[0] * k, x + b[1] * k, p.y + b[2] * k, p.y + b[3] * k);
          x += b[1] * k;
        } else {
          emit(x, x + k, p.y - k / 2, p.y + k / 2);
          x += k;
        }
      }
      return;
    }
    case "text": {
      const size = p.size ?? LYRIC_EM * sp, w = measure(p.s, size) * (p.sx ?? 1), x0 = p.anchor === "middle" ? p.x - w / 2 : p.anchor === "end" ? p.x - w : p.x;
      emit(x0, x0 + w, p.y - size * INK_EST.a, p.y + size * INK_EST.d);
      return;
    }
    case "line": {
      const h = p.w / 2;
      flatten([[p.x1, p.y1], [p.x2, p.y2]], sp, h, emit);
      return;
    }
    case "rect":
      emit(p.x, p.x + p.w, p.y, p.y + p.h);
      return;
    case "path":
      for (const poly of pathPolys(p.d)) flatten(poly, sp, 0, emit);
      return;
  }
}
function flatten(pts, sp, pad, emit) {
  if (pts.length === 1) {
    const [x, y] = pts[0];
    emit(x - pad, x + pad, y - pad, y + pad);
    return;
  }
  const cell = STEP * sp;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    if (ay === by || ax === bx) {
      emit(Math.min(ax, bx) - pad, Math.max(ax, bx) + pad, Math.min(ay, by) - pad, Math.max(ay, by) + pad);
      continue;
    }
    const n2 = Math.max(1, Math.ceil(Math.abs(bx - ax) / cell));
    for (let k = 0; k < n2; k++) {
      const x0 = ax + (bx - ax) * k / n2, x1 = ax + (bx - ax) * (k + 1) / n2, y0 = ay + (by - ay) * k / n2, y1 = ay + (by - ay) * (k + 1) / n2;
      emit(Math.min(x0, x1) - pad, Math.max(x0, x1) + pad, Math.min(y0, y1) - pad, Math.max(y0, y1) + pad);
    }
  }
}
function numAt(d, i) {
  while (i < d.length && (d[i] === "," || d[i] === " ")) i++;
  const s2 = i;
  if (d[i] === "-" || d[i] === "+") i++;
  while (i < d.length) {
    const ch = d.charCodeAt(i);
    if (ch >= 48 && ch <= 57 || ch === 46) i++;
    else if ((ch === 101 || ch === 69) && (d[i + 1] === "-" || d[i + 1] === "+")) i += 2;
    else if (ch === 101 || ch === 69) i++;
    else break;
  }
  return i > s2 ? [Number(d.slice(s2, i)), i] : null;
}
function pathPolys(d) {
  const out = [];
  let cur = [], x = 0, y = 0, i = 0;
  const v = [];
  while (i < d.length) {
    const c = d[i].toUpperCase();
    i++;
    v.length = 0;
    for (let r = numAt(d, i); r; r = numAt(d, i)) {
      v.push(r[0]);
      i = r[1];
    }
    if (c === "M") {
      if (cur.length) out.push(cur);
      x = v[0];
      y = v[1];
      cur = [[x, y]];
      for (let k = 2; k + 1 < v.length; k += 2) {
        x = v[k];
        y = v[k + 1];
        cur.push([x, y]);
      }
    } else if (c === "L") for (let k = 0; k + 1 < v.length; k += 2) {
      x = v[k];
      y = v[k + 1];
      cur.push([x, y]);
    }
    else if (c === "Q") for (let k = 0; k + 3 < v.length; k += 4) {
      const cx = v[k], cy = v[k + 1], ex = v[k + 2], ey = v[k + 3];
      for (let n2 = 1; n2 <= 8; n2++) {
        const t = n2 / 8, u = 1 - t;
        cur.push([u * u * x + 2 * u * t * cx + t * t * ex, u * u * y + 2 * u * t * cy + t * t * ey]);
      }
      x = ex;
      y = ey;
    }
    else if (c === "C") for (let k = 0; k + 5 < v.length; k += 6) {
      const ax = v[k], ay = v[k + 1], bx = v[k + 2], by = v[k + 3], ex = v[k + 4], ey = v[k + 5];
      for (let n2 = 1; n2 <= 8; n2++) {
        const t = n2 / 8, u = 1 - t;
        cur.push([u * u * u * x + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * ex, u * u * u * y + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * ey]);
      }
      x = ex;
      y = ey;
    }
    else if (c === "Z" && cur.length) {
      cur.push(cur[0]);
      x = cur[0][0];
      y = cur[0][1];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}
function shiftPrim(p, dy) {
  if (!dy) return;
  switch (p.t) {
    case "glyph":
    case "text":
    case "rect":
      p.y += dy;
      return;
    case "line":
      p.y1 += dy;
      p.y2 += dy;
      return;
    case "path": {
      const d = p.d;
      let out = "", i = 0;
      for (let c = d.indexOf(","); c >= 0; c = d.indexOf(",", i)) {
        let e = c + 1;
        if (d[e] === "-") e++;
        while (e < d.length) {
          const ch = d.charCodeAt(e);
          if (ch >= 48 && ch <= 57 || ch === 46) e++;
          else if ((ch === 101 || ch === 69) && (d[e + 1] === "-" || d[e + 1] === "+")) e += 2;
          else if (ch === 101 || ch === 69) e++;
          else break;
        }
        out += d.slice(i, c + 1) + String(Number(d.slice(c + 1, e)) + dy);
        i = e;
      }
      p.d = out + d.slice(i);
      return;
    }
    default: {
      const never = p;
      throw new Error(`shiftPrim: unknown prim ${JSON.stringify(never)}`);
    }
  }
}

// src/score/view-in-c.ts
var realFifthsOf = (t) => t.realFifths ?? t.fifths;
function toC(p, fifths) {
  if (fifths === 0) return p;
  const iv = keyInterval(fifths, 0);
  return transposeInterval(p, iv.steps, iv.semis);
}
function trackInC(tokens) {
  let f = 0;
  return tokens.map((t) => {
    if (t.kind === "key") {
      f = t.fifths;
      return { ...t, fifths: 0, realFifths: t.fifths };
    }
    if (t.kind === "note" && t.pitch && f !== 0) return { ...t, pitch: toC(t.pitch, f), ...t.chord ? { chord: t.chord.map((c) => toC(c, f)) } : {} };
    return t;
  });
}
function songInC(song, skip) {
  return { ...song, papers: song.papers.map((p) => ({ ...p, tracks: Object.fromEntries(Object.entries(p.tracks).map(([id, toks]) => [id, skip(id) ? toks : trackInC(toks)])) })) };
}

// src/score/song-view.ts
var NOTATIONS = ["staff", "jianpu"];
var CHORDS_MODES = ["stacked", "auto", "fold"];
var UNWRITTEN = Object.freeze({ notation: "staff", chordTags: true, viewInC: false, chords: "auto", density: "cozy", lyricFit: "rhythm", barNumbers: true });
var isNotation = (v) => NOTATIONS.includes(v);
var MOVABLE_DO = { staff: false, jianpu: true };
var isChords = (v) => CHORDS_MODES.includes(v);
function songViewOf(song) {
  const chords = /* @__PURE__ */ new Map();
  for (const p of song.parts) if (isChords(p.chords)) chords.set(p.id, p.chords);
  const notation = isNotation(song.notation) ? song.notation : UNWRITTEN.notation, viewInC = song.viewInC === true ? true : UNWRITTEN.viewInC;
  return {
    notation,
    chordTags: song.chordTags === false ? false : UNWRITTEN.chordTags,
    viewInC,
    inCActive: viewInC && !MOVABLE_DO[notation],
    chordsOf: (part) => chords.get(part) ?? UNWRITTEN.chords,
    density: densityOf(song.paper ?? paperOf(DEFAULT_PAPER)),
    lyricFit: song.lyricFit === "lyrics" ? "lyrics" : UNWRITTEN.lyricFit,
    barNumbers: song.barNumbers === "off" ? false : UNWRITTEN.barNumbers
  };
}

// src/score/grooves.gen.ts
var GROOVE_STYLES = [
  {
    "id": "none",
    "name": {
      "zh": "\u65E0",
      "en": "None",
      "ja": "\u306A\u3057"
    },
    "aliases": [
      "\u65E0\u98CE\u683C",
      "Off"
    ],
    "meters": {},
    "phase": null,
    "fallback": "none",
    "follow": {
      "piano": 0,
      "chromatic-percussion": 0,
      "organ": 0,
      "guitar": 0,
      "bass": 0,
      "strings": 0,
      "ensemble": 0,
      "brass": 0,
      "reed": 0,
      "pipe": 0,
      "synth-lead": 0,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0,
      "percussive": 0,
      "sound-effects": 0,
      "percussion": 0,
      "voice": 0
    },
    "swing": null
  },
  {
    "id": "classical",
    "name": {
      "zh": "\u53E4\u5178",
      "en": "Classical",
      "ja": "\u30AF\u30E9\u30B7\u30C3\u30AF"
    },
    "aliases": [
      "Classic",
      "\u53E4\u5178\u6D3E"
    ],
    "meters": {
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "3/4": {
        "grid": 12,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "2/4": {
        "grid": 8,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "2/2": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5,
          0,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5
        ]
      },
      "6/8": {
        "grid": 12,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "12/8": {
        "grid": 24,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.5,
      "chromatic-percussion": 0.6,
      "organ": 0.2,
      "guitar": 0.6,
      "bass": 0.6,
      "strings": 0.5,
      "ensemble": 0.3,
      "brass": 0.5,
      "reed": 0.4,
      "pipe": 0.4,
      "synth-lead": 0.4,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 1,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.3
    },
    "swing": null
  },
  {
    "id": "pop",
    "name": {
      "zh": "\u6D41\u884C",
      "en": "Pop",
      "ja": "\u30DD\u30C3\u30D7\u30B9"
    },
    "aliases": [
      "Rock",
      "\u6447\u6EDA",
      "\u30ED\u30C3\u30AF",
      "R&B",
      "Backbeat",
      "\u53CD\u62CD"
    ],
    "meters": {
      "4/4": {
        "grid": 16,
        "weights": [
          0.5,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25,
          0.5,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25
        ]
      },
      "12/8": {
        "grid": 24,
        "weights": [
          0.5,
          -0.25,
          0,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25,
          0,
          -0.25,
          0.5,
          -0.25,
          0,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25,
          0,
          -0.25
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.6,
      "chromatic-percussion": 0.5,
      "organ": 0.3,
      "guitar": 0.8,
      "bass": 1,
      "strings": 0.2,
      "ensemble": 0.1,
      "brass": 0.6,
      "reed": 0.3,
      "pipe": 0.2,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 0.8,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.3
    },
    "swing": null
  },
  {
    "id": "waltz",
    "name": {
      "zh": "\u534E\u5C14\u5179",
      "en": "Waltz",
      "ja": "\u30EF\u30EB\u30C4"
    },
    "aliases": [
      "\u5706\u821E\u66F2",
      "Valse",
      "Walzer"
    ],
    "meters": {
      "3/4": {
        "grid": 12,
        "weights": [
          1,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.8,
      "chromatic-percussion": 0.6,
      "organ": 0.3,
      "guitar": 0.8,
      "bass": 1,
      "strings": 0.5,
      "ensemble": 0.3,
      "brass": 0.5,
      "reed": 0.3,
      "pipe": 0.3,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 0.8,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.3
    },
    "swing": null
  },
  {
    "id": "march",
    "name": {
      "zh": "\u8FDB\u884C\u66F2",
      "en": "March",
      "ja": "\u30DE\u30FC\u30C1"
    },
    "aliases": [
      "\u884C\u8FDB\u66F2",
      "Marcia",
      "\u884C\u9032\u66F2"
    ],
    "meters": {
      "2/4": {
        "grid": 8,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "2/2": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5,
          0.5,
          -0.5,
          -0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.5,
          -0.5
        ]
      },
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5
        ]
      },
      "6/8": {
        "grid": 12,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.6,
      "chromatic-percussion": 0.6,
      "organ": 0.3,
      "guitar": 0.6,
      "bass": 1,
      "strings": 0.5,
      "ensemble": 0.3,
      "brass": 0.8,
      "reed": 0.6,
      "pipe": 0.6,
      "synth-lead": 0.4,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 1,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.4
    },
    "swing": null
  },
  {
    "id": "swing",
    "name": {
      "zh": "Swing",
      "en": "Swing",
      "ja": "\u30B9\u30A6\u30A3\u30F3\u30B0"
    },
    "aliases": [
      "\u6447\u6446",
      "\u7235\u58EB",
      "Jazz",
      "\u30B8\u30E3\u30BA"
    ],
    "meters": {
      "4/4": {
        "grid": 16,
        "weights": [
          0.25,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25,
          0.25,
          -0.25,
          0,
          -0.25,
          1,
          -0.25,
          0,
          -0.25
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.5,
      "chromatic-percussion": 0.4,
      "organ": 0.3,
      "guitar": 0.6,
      "bass": 0.4,
      "strings": 0.2,
      "ensemble": 0.1,
      "brass": 0.5,
      "reed": 0.5,
      "pipe": 0.3,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.4,
      "percussive": 0.6,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.2
    },
    "swing": {
      "unit": "8th",
      "ratio": 0.667,
      "range": [
        0.5,
        0.75
      ]
    }
  },
  {
    "id": "four-on-the-floor",
    "name": {
      "zh": "\u56DB\u62CD\u5E95\u9F13",
      "en": "Four on the floor",
      "ja": "4\u3064\u6253\u3061"
    },
    "aliases": [
      "\u7535\u5B50",
      "\u8FEA\u65AF\u79D1",
      "Disco",
      "EDM",
      "House",
      "\u30C7\u30A3\u30B9\u30B3"
    ],
    "meters": {
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          0,
          0.5,
          0,
          1,
          0,
          0.5,
          0,
          1,
          0,
          0.5,
          0,
          1,
          0,
          0.5,
          0
        ]
      }
    },
    "phase": null,
    "fallback": "classical",
    "follow": {
      "piano": 0.6,
      "chromatic-percussion": 0.4,
      "organ": 0.3,
      "guitar": 0.6,
      "bass": 0.8,
      "strings": 0.2,
      "ensemble": 0.1,
      "brass": 0.5,
      "reed": 0.3,
      "pipe": 0.2,
      "synth-lead": 0.5,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.4,
      "percussive": 0.8,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.2
    },
    "swing": null
  },
  {
    "id": "bossa-nova",
    "name": {
      "zh": "\u6CE2\u8428",
      "en": "Bossa nova",
      "ja": "\u30DC\u30B5\u30CE\u30F4\u30A1"
    },
    "aliases": [
      "Bossa",
      "\u5DF4\u8428\u8BFA\u74E6",
      "\u30DC\u30B5\u30CE\u30D0",
      "Samba-reggae"
    ],
    "meters": {
      "2/4": {
        "grid": 8,
        "weights": [
          1,
          -0.25,
          -0.25,
          0.75,
          0.5,
          -0.25,
          0.75,
          0.25,
          0.5,
          -0.25,
          0.75,
          0.25,
          0.5,
          0.75,
          -0.25,
          0.25
        ],
        "bars": 2
      },
      "2/2": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.25,
          -0.5,
          0.5,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.25,
          -0.5
        ],
        "bars": 2
      },
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.25,
          -0.5,
          0.5,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0.25,
          -0.5,
          0.5,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.25,
          -0.5
        ],
        "bars": 2
      }
    },
    "phase": "3-2",
    "fallback": "classical",
    "follow": {
      "piano": 0.6,
      "chromatic-percussion": 0.4,
      "organ": 0.3,
      "guitar": 1,
      "bass": 0.6,
      "strings": 0.1,
      "ensemble": 0.1,
      "brass": 0.3,
      "reed": 0.3,
      "pipe": 0.3,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.5,
      "percussive": 1,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.1
    },
    "swing": null
  },
  {
    "id": "latin",
    "name": {
      "zh": "\u62C9\u4E01\uFF08\u514B\u62C9\u7EF4\uFF09",
      "en": "Latin (son clave)",
      "ja": "\u30E9\u30C6\u30F3\uFF08\u30BD\u30F3\u30FB\u30AF\u30E9\u30FC\u30D9\uFF09"
    },
    "aliases": [
      "\u62C9\u4E01",
      "Latin",
      "Son",
      "Salsa",
      "\u8428\u5C14\u8428",
      "Mambo",
      "\u66FC\u6CE2",
      "\u30B5\u30EB\u30B5",
      "\u30E9\u30C6\u30F3",
      "Clave",
      "\u514B\u62C9\u7EF4"
    ],
    "meters": {
      "2/4": {
        "grid": 8,
        "weights": [
          1,
          -0.25,
          -0.25,
          0.75,
          0,
          -0.25,
          0.75,
          -0.25,
          0.25,
          -0.25,
          0.75,
          -0.25,
          0.75,
          -0.25,
          -0.25,
          -0.25
        ],
        "bars": 2
      },
      "2/2": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ],
        "bars": 2
      },
      "4/4": {
        "grid": 16,
        "weights": [
          1,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          0,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.25,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          0.75,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5,
          -0.25,
          -0.5
        ],
        "bars": 2
      }
    },
    "phase": "3-2",
    "fallback": "classical",
    "follow": {
      "piano": 0.8,
      "chromatic-percussion": 0.5,
      "organ": 0.3,
      "guitar": 0.6,
      "bass": 0.8,
      "strings": 0.3,
      "ensemble": 0.1,
      "brass": 0.6,
      "reed": 0.4,
      "pipe": 0.4,
      "synth-lead": 0.3,
      "synth-pad": 0,
      "synth-effects": 0,
      "ethnic": 0.6,
      "percussive": 1,
      "sound-effects": 0,
      "percussion": 1,
      "voice": 0.3
    },
    "swing": null
  }
];

// src/score/groove.ts
var grooveStyle = (id) => GROOVE_STYLES.find((s2) => s2.id === id) ?? null;
var grooveNameEn = (style) => {
  const s2 = grooveStyle(style);
  return style === "none" ? "none" : s2 ? s2.name.en : style;
};
var grooveLabel = (t) => `Style: ${grooveNameEn(t.style)}${t.shift && grooveHasPhase(grooveStyle(t.style)) ? " 2-3" : ""}${t.amount !== void 0 && t.amount !== 1 && t.style !== "none" ? ` \xD7${t.amount}` : ""}`;
var grooveHasPhase = (s2) => !!s2 && Object.values(s2.meters).some((m) => (m.bars ?? 1) > 1);
var BEAT_NO = [_t("\u4E00"), _t("\u4E8C"), _t("\u4E09"), _t("\u56DB"), _t("\u4E94"), _t("\u516D"), _t("\u4E03"), _t("\u516B"), _t("\u4E5D"), _t("\u5341"), _t("\u5341\u4E00"), _t("\u5341\u4E8C")];
function meterPositions(tokens, bounds = [0], withTies = false) {
  const out = /* @__PURE__ */ new Map(), starts = new Set(bounds);
  let time = { ...DEFAULT_TIME }, len = time.beats * WHOLE / time.beatType, inBar = 0, measureNo = 0, first = [];
  tokens.forEach((t, i) => {
    if (starts.has(i)) {
      inBar = 0;
      measureNo = 0;
      first = [];
    }
    if (t.kind === "bar") {
      if (measureNo === 0 && inBar > 0 && inBar < len) for (const k of first) {
        const e = out.get(k);
        e.pos += len - inBar;
        e.pickup = true;
      }
      inBar = 0;
      measureNo++;
      first = [];
      return;
    }
    if (t.kind === "time") {
      if (inBar > 0) {
        inBar = 0;
        measureNo++;
      }
      time = { beats: t.beats, beatType: t.beatType };
      len = t.beats * WHOLE / t.beatType;
      return;
    }
    if (!isTimed(t)) return;
    while (inBar >= len && inBar > 0) {
      inBar -= len;
      measureNo++;
    }
    if (t.kind === "note" && (withTies || !t.tie)) {
      out.set(i, { pos: inBar, ...time, bar: measureNo, ...t.tie ? { tie: true } : {} });
      if (measureNo === 0) first.push(i);
    }
    inBar += t.dur;
  });
  return out;
}

// src/theory/western.ts
var TPLS = [
  { id: "maj", iv: [0, 4, 7], minor: false, rs: "", sym: "" },
  { id: "min", iv: [0, 3, 7], minor: true, rs: "", sym: "m" },
  { id: "dim", iv: [0, 3, 6], minor: true, rs: "\xB0", sym: "dim" },
  { id: "aug", iv: [0, 4, 8], minor: false, rs: "+", sym: "aug" },
  { id: "sus4", iv: [0, 5, 7], minor: false, rs: "sus4", sym: "sus4" },
  { id: "sus2", iv: [0, 2, 7], minor: false, rs: "sus2", sym: "sus2" },
  { id: "7", iv: [0, 4, 10], opt: [7], minor: false, rs: "7", sym: "7" },
  { id: "m7", iv: [0, 3, 10], opt: [7], minor: true, rs: "7", sym: "m7" },
  { id: "maj7", iv: [0, 4, 11], opt: [7], minor: false, rs: "maj7", sym: "maj7" },
  { id: "6", iv: [0, 4, 9], opt: [7], minor: false, rs: "6", sym: "6" },
  { id: "m6", iv: [0, 3, 9], opt: [7], minor: true, rs: "6", sym: "m6" },
  { id: "m7b5", iv: [0, 3, 6, 10], minor: true, rs: "\xF87", sym: "m7\u266D5" },
  { id: "dim7", iv: [0, 3, 6, 9], minor: true, rs: "\xB07", sym: "dim7" },
  { id: "mMaj7", iv: [0, 3, 11], opt: [7], minor: true, rs: "(maj7)", sym: "m(maj7)" },
  { id: "aug7", iv: [0, 4, 8, 10], minor: false, rs: "+7", sym: "aug7" },
  { id: "7sus4", iv: [0, 5, 10], opt: [7], minor: false, rs: "7sus4", sym: "7sus4" },
  { id: "add9", iv: [0, 4, 2], opt: [7], minor: false, rs: "add9", sym: "add9" },
  { id: "madd9", iv: [0, 3, 2], opt: [7], minor: true, rs: "(add9)", sym: "m(add9)" },
  { id: "69", iv: [0, 4, 9, 2], opt: [7], minor: false, rs: "6/9", sym: "6/9" },
  { id: "9", iv: [0, 4, 10, 2], opt: [7], minor: false, rs: "9", sym: "9" },
  { id: "m9", iv: [0, 3, 10, 2], opt: [7], minor: true, rs: "9", sym: "m9" },
  { id: "maj9", iv: [0, 4, 11, 2], opt: [7], minor: false, rs: "maj9", sym: "maj9" },
  { id: "7b9", iv: [0, 4, 10, 1], opt: [7], minor: false, rs: "7\u266D9", sym: "7\u266D9" },
  { id: "7s9", iv: [0, 4, 10, 3], opt: [7], minor: false, rs: "7\u266F9", sym: "7\u266F9" },
  { id: "11", iv: [0, 10, 5], opt: [7, 2], minor: false, rs: "11", sym: "11" },
  { id: "m11", iv: [0, 3, 10, 5], opt: [7, 2], minor: true, rs: "11", sym: "m11" },
  { id: "13", iv: [0, 4, 10, 9], opt: [7, 2], minor: false, rs: "13", sym: "13" },
  { id: "m13", iv: [0, 3, 10, 9], opt: [7, 2], minor: true, rs: "13", sym: "m13" },
  { id: "maj13", iv: [0, 4, 11, 9], opt: [7, 2], minor: false, rs: "maj13", sym: "maj13" },
  // 缺三度的（排在最后、算省了一个音）：A E G = Am7 还是 A7 分不出来，大小按调里的写，候选里明说
  { id: "7no3", iv: [0, 7, 10], no3: true, minor: false, rs: "7(no3)", sym: "7(no3)" },
  { id: "maj7no3", iv: [0, 7, 11], no3: true, minor: false, rs: "maj7(no3)", sym: "maj7(no3)" }
];
var ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
var ACC = (a) => a === 0 ? "" : a > 0 ? "\u266F".repeat(a) : "\u266D".repeat(-a);
var pc = (p) => (midiOf(p) % 12 + 12) % 12;
var modeOf = (n2) => n2.minor ? "la" : "do";
var ID = "western";
function degreeOf(p, fifths, mode = "do") {
  const deg = ((stepIndex(p.step) - tonicStepIndex(fifths)) % 7 + 7) % 7, acc = p.alter - keyAlter(p.step, fifths);
  if (mode === "do") return { deg: deg + 1, acc };
  const d = (deg - 5 + 7) % 7 + 1;
  return { deg: d, acc: d === 7 && acc === 1 ? 0 : acc };
}
var stepName = (p) => `${p.step}${ACC(p.alter)}`;
function diatonicThird(root, fifths) {
  const st = STEPS[(stepIndex(root.step) + 2) % 7], up = stepIndex(root.step) + 2 >= 7 ? 1 : 0;
  return ((midiOf({ step: st, alter: keyAlter(st, fifths), octave: root.octave + up }) - midiOf({ ...root, alter: keyAlter(root.step, fifths) })) % 12 + 12) % 12;
}
function readChord(pitches, fifths, mode = "do") {
  const ps = [...pitches].sort((a, b) => midiOf(a) - midiOf(b));
  const set = new Set(ps.map(pc));
  const bass = ps[0], bassPc = pc(bass);
  if (set.size === 2) {
    const [a, b] = [...set], rootPc = (a + 7) % 12 === b ? a : (b + 7) % 12 === a ? b : null;
    if (rootPc === null) return thirdDyad(ps, fifths, mode);
    const root = ps.find((p) => pc(p) === rootPc), r = degreeOf(root, fifths, mode), bd = degreeOf(bass, fifths, mode), slash = rootPc === bassPc ? "" : `/${ACC(bd.acc)}${bd.deg}`;
    const g = { root, bass, tpl: "5", label: ACC(r.acc) + ROMAN[r.deg - 1] + "5" + slash, name: stepName(root) + "5" + (slash ? `/${stepName(bass)}` : ""), cost: (rootPc === bassPc ? 0 : 1) + (r.acc === 0 ? 0 : 0.25), omitted: 1, no3: true };
    return { theory: ID, best: g, ties: [g], all: [g], ...mode === "la" ? { mode } : {} };
  }
  if (set.size < 3) return null;
  const out = [];
  for (const rootPc of set) {
    const root = ps.find((p) => pc(p) === rootPc);
    TPLS.forEach((t, ti) => {
      const req = new Set(t.iv.map((i) => (rootPc + i) % 12)), opt = new Set((t.opt ?? []).map((i) => (rootPc + i) % 12));
      for (const x of set) if (!req.has(x) && !opt.has(x)) return;
      for (const x of req) if (!set.has(x)) return;
      const omitted = [...opt].filter((x) => !set.has(x)).length + (t.no3 ? 1 : 0);
      const r = degreeOf(root, fifths, mode), inKey = r.acc === 0;
      const minor = t.no3 ? diatonicThird(root, fifths) === 3 : t.minor;
      const cost = (rootPc === bassPc ? 0 : 1) + omitted * 1.2 + (inKey ? 0 : 0.25) + ti * 0.01;
      const numeral = ACC(r.acc) + (minor ? ROMAN[r.deg - 1].toLowerCase() : ROMAN[r.deg - 1]) + t.rs;
      const b = degreeOf(bass, fifths, mode), slash = rootPc === bassPc ? "" : `/${ACC(b.acc)}${b.deg}`;
      out.push({ root, bass, tpl: t.id, label: numeral + slash, name: stepName(root) + (t.no3 && minor ? "m" : "") + t.sym + (slash ? `/${stepName(bass)}` : ""), cost, omitted, no3: !!t.no3 });
    });
  }
  if (!out.length) return null;
  out.sort((a, b) => a.cost - b.cost);
  const best = out[0];
  return { theory: ID, best, ties: out.filter((g) => g.cost - best.cost < 0.1), all: out, ...mode === "la" ? { mode } : {} };
}
function thirdDyad(ps, fifths, mode) {
  const [a, b] = [...new Set(ps.map(pc))], d = (b - a + 12) % 12;
  const rootPc = d === 3 || d === 4 ? a : d === 8 || d === 9 ? b : null;
  if (rootPc === null) return null;
  const root = ps.find((p) => pc(p) === rootPc), st = STEPS[(stepIndex(root.step) + 4) % 7];
  const r = readChord([...ps, { step: st, alter: keyAlter(st, fifths), octave: ps[ps.length - 1].octave + 1 }], fifths, mode);
  const all = (r?.all ?? []).filter((g) => pc(g.root) === rootPc).map((g) => ({ ...g, omitted: g.omitted + 1, cost: g.cost + 1.2 }));
  if (!all.length) return null;
  return { theory: ID, best: all[0], ties: all.filter((g) => g.cost - all[0].cost < 0.1), all, ...mode === "la" ? { mode } : {} };
}
var chordLabel = (r) => r.ties.slice(0, 2).map((g) => g.label).join(" / ") + (r.stale ? "?" : "");
function guessOf(root, tplId, bass, fifths, mode) {
  if (tplId.startsWith(FREE)) {
    const nm = stepName(root) + tplId.slice(FREE.length) + (pc(root) === pc(bass) ? "" : `/${stepName(bass)}`);
    return { root, bass, tpl: tplId, label: nm, name: nm, cost: 0, omitted: 0, no3: false };
  }
  const r = degreeOf(root, fifths, mode), b = degreeOf(bass, fifths, mode), slash = pc(root) === pc(bass) ? "" : `/${ACC(b.acc)}${b.deg}`, nameSlash = slash ? `/${stepName(bass)}` : "";
  if (tplId === "5") return { root, bass, tpl: "5", label: ACC(r.acc) + ROMAN[r.deg - 1] + "5" + slash, name: stepName(root) + "5" + nameSlash, cost: 0, omitted: 1, no3: true };
  const t = TPLS.find((x) => x.id === tplId);
  if (!t) return null;
  const minor = t.no3 ? diatonicThird(root, fifths) === 3 : t.minor;
  return { root, bass, tpl: t.id, label: ACC(r.acc) + (minor ? ROMAN[r.deg - 1].toLowerCase() : ROMAN[r.deg - 1]) + t.rs + slash, name: stepName(root) + (t.no3 && minor ? "m" : "") + t.sym + nameSlash, cost: 0, omitted: 0, no3: !!t.no3 };
}
var FREE = "?";
var XML_KIND = {
  maj: "major",
  min: "minor",
  dim: "diminished",
  aug: "augmented",
  sus4: "suspended-fourth",
  sus2: "suspended-second",
  "7": "dominant",
  m7: "minor-seventh",
  maj7: "major-seventh",
  "6": "major-sixth",
  m6: "minor-sixth",
  m7b5: "half-diminished",
  dim7: "diminished-seventh",
  mMaj7: "major-minor",
  aug7: "augmented-seventh",
  "9": "dominant-ninth",
  m9: "minor-ninth",
  maj9: "major-ninth",
  "11": "dominant-11th",
  m11: "minor-11th",
  "13": "dominant-13th",
  m13: "minor-13th",
  maj13: "major-13th",
  "5": "power"
};
var KIND_BY_XML = Object.fromEntries(Object.entries(XML_KIND).map(([k, v]) => [v, k]));
var XML_OTHER_TEXT = { "7sus4": "7sus4", add9: "add9", madd9: "m(add9)", "69": "6/9", "7b9": "7\u266D9", "7s9": "7\u266F9", "7no3": "7(no3)", maj7no3: "maj7(no3)" };
var OTHER_TEXT_ALIAS = { "7b9": "7b9", "7#9": "7s9", "madd9": "madd9", "69": "69", "6add9": "69" };
var KIND_BY_OTHER_TEXT = { ...OTHER_TEXT_ALIAS, ...Object.fromEntries(Object.entries(XML_OTHER_TEXT).map(([k, v]) => [v, k])) };
var PIN_KIND_IDS = [...TPLS.map((t) => t.id), "5"];
var samePin = (a, b) => pc(a.root) === pc(b.root) && a.tpl === b.tpl && pc(a.bass) === pc(b.bass);
function pinRead(pin, at, auto) {
  const root = { ...pin.root, octave: 4 }, bass = { ...pin.bass ?? pin.root, octave: 3 }, mode = at.minor ? "la" : "do";
  const g = guessOf(root, pin.kind, bass, at.fifths, mode);
  if (!g) return null;
  const others = (auto?.all ?? []).filter((x) => !samePin(x, g));
  const stale = !!auto && others.length === auto.all.length;
  return { theory: ID, best: g, ties: [g], all: [g, ...others], pinned: true, ...auto ? { auto } : {}, ...stale ? { stale: true } : {}, ...mode === "la" ? { mode } : {} };
}
var pinOf = (guess) => {
  const g = guess;
  return { root: { step: g.root.step, alter: g.root.alter }, kind: g.tpl, ...pc(g.bass) !== pc(g.root) ? { bass: { step: g.bass.step, alter: g.bass.alter } } : {} };
};
var BROKEN_OK = /* @__PURE__ */ new Set(["maj", "min", "dim", "aug", "sus4", "sus2", "7", "m7", "maj7", "dim7", "m7b5"]);
function brokenInBar(bar, prev) {
  const beatLen = beatTicks(bar.beats, bar.beatType), nb = Math.max(1, Math.round(bar.beats * WHOLE / bar.beatType / beatLen));
  const beats = Array.from({ length: nb }, () => []);
  for (const n2 of bar.notes) if (!n2.tie) beats[Math.min(nb - 1, Math.max(0, Math.floor(n2.pos / beatLen + 1e-9)))].push({
    i: n2.index,
    p: n2.tok.pitch,
    stacked: !!n2.tok.chord?.length,
    fifths: n2.fifths,
    mode: modeOf(n2),
    pin: n2.tok.harm ? guessOf({ ...n2.tok.harm.root, octave: 4 }, n2.tok.harm.kind, { ...n2.tok.harm.bass ?? n2.tok.harm.root, octave: 3 }, n2.fifths, modeOf(n2))?.label ?? null : null
  });
  const tags = [];
  const groupOf = (ns) => {
    const us = ns.filter((n2) => n2.p && !n2.stacked), ps = us.map((n2) => n2.p);
    if (new Set(ps.map(pc)).size < 3) return null;
    for (let k = 1; k < ps.length; k++) {
      const d = Math.abs(midiOf(ps[k]) - midiOf(ps[k - 1]));
      if (d === 1 || d === 2) return null;
    }
    const rd = readChord(ps, us[0].fifths, us[0].mode);
    return rd && rd.best.omitted === 0 && BROKEN_OK.has(rd.best.tpl) ? rd : null;
  };
  const look = (b0, b1) => {
    const ns = beats.slice(b0, b1).flat();
    if (!ns.some((n2) => n2.p && !n2.stacked)) return;
    const rd = groupOf(ns);
    if (rd) {
      const label = chordLabel(rd);
      if (label !== prev) tags.push({ index: ns.find((n2) => n2.p && !n2.stacked).i, read: rd });
      prev = label;
      for (const n2 of ns) if (n2.pin && !n2.stacked) prev = n2.pin;
      return;
    }
    const len = b1 - b0;
    if (len === 1) {
      prev = "";
      return;
    }
    if (len % 2 === 0 && len > 2) {
      const mid = b0 + len / 2;
      look(b0, mid);
      look(mid, b1);
      return;
    }
    for (let b = b0; b < b1; b++) look(b, b + 1);
  };
  look(0, nb);
  return { tags, prev };
}
function readBar(bar, carry, opts) {
  const tags = [];
  for (const n2 of bar.notes) {
    const t = n2.tok;
    if (t.pitch && t.chord?.length) {
      const rd = readChord([t.pitch, ...t.chord], n2.fifths, modeOf(n2));
      if (rd) tags.push({ index: n2.index, read: rd });
    }
  }
  let prev = carry?.prev ?? "";
  if (opts.broken) {
    const b = brokenInBar(bar, prev);
    tags.push(...b.tags);
    prev = b.prev;
  }
  return { tags: tags.sort((a, b) => a.index - b.index), carry: { prev } };
}
var western = {
  id: ID,
  readBar,
  label: chordLabel,
  pinRead,
  pinOf,
  howTo: () => _t("\u600E\u4E48\u8BA4\u7684\uFF1A\u51D1\u5F97\u6210\u5B8C\u6574\u548C\u5F26\u7684\u4F18\u5148\uFF08\u4E0D\u7701\u97F3\uFF09\u2192 \u6700\u4F4E\u97F3\u5F53\u6839\u97F3\u7684\u4F18\u5148 \u2192 \u6839\u97F3\u5728\u8FD9\u4E2A\u8C03\u91CC\u7684\u4F18\u5148 \u2192 \u7B80\u5355\u7684\u4F18\u5148\u3002\u6253\u5E73\u7684\u4E24\u4E2A\u90FD\u5199\u5728\u8C31\u4E0A\u3002"),
  explain: (guess) => {
    const g = guess;
    return [g.root.step !== g.bass.step || g.root.alter !== g.bass.alter ? _t("\u8F6C\u4F4D\uFF08\u6700\u4F4E\u97F3\u4E0D\u662F\u6839\u97F3\uFF09") : "", g.no3 ? _t("\u6CA1\u6709\u4E09\u5EA6\uFF1A\u5927\u4E09\u548C\u5F26\u8FD8\u662F\u5C0F\u4E09\u548C\u5F26\u5206\u4E0D\u51FA\u6765\uFF0C\u6309\u8FD9\u4E2A\u8C03\u91CC\u7684\u5199") : "", g.omitted - (g.no3 ? 1 : 0) > 0 ? _t("\u7701\u4E86 {n} \u4E2A\u97F3", { n: g.omitted - (g.no3 ? 1 : 0) }) : ""].filter(Boolean);
  }
};

// src/theory/index.ts
var THEORIES = { [western.id]: western };
var DEFAULT_THEORY = western.id;
var harmonyTheory = (id = DEFAULT_THEORY) => THEORIES[id] ?? THEORIES[DEFAULT_THEORY];
function barsOf(tokens) {
  const at = meterPositions(tokens, [0], true), bars = [];
  let fifths = DEFAULT_KEY, minor = false;
  tokens.forEach((t, i) => {
    if (t.kind === "key") {
      fifths = t.fifths;
      minor = t.mode === "minor";
      return;
    }
    const m = at.get(i);
    if (!m || t.kind !== "note") return;
    let bar = bars[bars.length - 1];
    if (!bar || bar.no !== m.bar) bars.push(bar = { no: m.bar, beats: m.beats, beatType: m.beatType, notes: [] });
    bar.notes.push({ index: i, tok: t, pos: m.pos, fifths, ...minor ? { minor: true } : {}, ...m.tie ? { tie: true } : {} });
  });
  return bars;
}
function harmonyTags(theory, track) {
  const out = [], opts = { broken: track.broken !== false }, bars = barsOf(track.tokens);
  let carry;
  for (const bar of bars) {
    const r = theory.readBar(bar, carry, opts);
    out.push(...r.tags);
    carry = r.carry;
  }
  const pins = bars.flatMap((b) => b.notes).filter((n2) => n2.tok.harm);
  if (!pins.length) return out;
  const byIndex = new Map(out.map((t) => [t.index, t]));
  for (const n2 of pins) {
    const rd = theory.pinRead(n2.tok.harm, { fifths: n2.fifths, minor: !!n2.minor }, byIndex.get(n2.index)?.read);
    if (rd) byIndex.set(n2.index, { index: n2.index, read: rd });
  }
  return [...byIndex.values()].sort((a, b) => a.index - b.index);
}

// src/render/frame/params.ts
var SCROLL_TAIL = 6;
var ABBR_REF = "Vln.Vc.";
var NAME_MAX = 6.5;
var NAME_MIN = 3 * 2 + 0.4;
var ROW_STEP = 1;
var MARGIN = 1.2;
var BAR_W = 1.6;
var TITLE_H = 5.4;
var PAPER_H = 3.4;
var PAPER_GAP = 1.6;
var CTL_H = 3;
var SYSTEM_LINE_W = 0.16 * 1.4;

// src/render/layout-params.ts
var PAPER_PARAMS = {
  staff: { cozy: { sysGap: 0.4, curve: "normal", squeeze: 0.15, maxStretch: Infinity }, compact: { sysGap: 0, curve: "tight", squeeze: 0.15, maxStretch: Infinity } },
  // 简谱：一行最多拉宽约 1.3 倍，放不满就让右边空着（UX 稿第 8 节 §51）
  jianpu: { cozy: { sysGap: 0.4, curve: "normal", squeeze: 0.15, maxStretch: 1.3 }, compact: { sysGap: 0, curve: "tight", squeeze: 0.15, maxStretch: 1.3 } }
};
var ROW_PARAMS = {
  staff: { cozy: { above: 4.6, rowH: 13.4, rowHNoLyric: 11, graveUpper: 9.4, lyricBelow: 4.4, clear: 2.4 }, compact: { above: 4, rowH: 12.2, rowHNoLyric: 9.6, graveUpper: 8.6, lyricBelow: 4, clear: 2.4 } },
  // 数字行（行身 = 小节线那一段，jianpu/glyphs.ts JP_BODY）：没有五条线，比五线谱的行矮；数字行不分大谱表（graveUpper 用不上，照没歌词的填）
  jianpu: { cozy: { above: 2.6, rowH: 10, rowHNoLyric: 7, graveUpper: 7, lyricBelow: 3.2, clear: 0.8 }, compact: { above: 2.2, rowH: 9, rowHNoLyric: 6.2, graveUpper: 6.2, lyricBelow: 2.9, clear: 0.8 } }
};

// src/render/frame/furniture.ts
var NO_LINE_START = /* @__PURE__ */ new Set([..."\u3001\u3002\uFF0C\uFF0E\u30FB\uFF1A\uFF1B\uFF1F\uFF01\uFF09\u300D\u300F\u3011\u3015\u3009\u300B\u30FC\uFF5E\u3041\u3043\u3045\u3047\u3049\u3063\u3083\u3085\u3087\u308E\u30A1\u30A3\u30A5\u30A7\u30A9\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6,.;:!?)]}"]);
function wrapTitle(s2, w, max) {
  if (w(s2) <= max) return [s2];
  const lines = [];
  let cur = "";
  const push = () => {
    if (cur.trim()) lines.push(cur.trim());
    cur = "";
  };
  for (const word of s2.match(/\S+\s*/g) ?? [s2]) {
    if (w((cur + word).trimEnd()) <= max) {
      cur += word;
      continue;
    }
    if (cur.trim()) push();
    if (w(word.trimEnd()) <= max) {
      cur = word;
      continue;
    }
    for (const ch of word) {
      if (cur && w((cur + ch).trimEnd()) > max) {
        if (NO_LINE_START.has(ch) && [...cur].length > 1) {
          const cs = [...cur], last = cs.pop();
          cur = cs.join("");
          push();
          cur = last;
        } else push();
      }
      cur += ch;
    }
  }
  push();
  return lines.length ? lines : [s2];
}

// src/score/clef.ts
var CLEF_SHIFT = { G: 0, G8vb: 7, G8va: -7, G15ma: -14, F: 12, F8vb: 19 };
var isFClef = (c) => c === "F" || c === "F8vb";
var baseClef = (c) => isFClef(c) ? "F" : "G";
var ottavaShift = (s2) => -7 * s2;
var CLEF_LABEL = { G: _t("\u9AD8\u97F3"), G8vb: _t("\u9AD8\u97F3 8vb"), G8va: _t("\u9AD8\u97F3 8va"), G15ma: _t("\u9AD8\u97F3 15ma"), F: _t("\u4F4E\u97F3"), F8vb: _t("\u4F4E\u97F3 8vb") };
var CLEF_TITLE = {
  G: _t("\u9AD8\u97F3\u8C31\u53F7"),
  G8vb: _t("\u9AD8\u97F3\u8C31\u53F7\u4E0B\u9762\u6302 8\uFF1A\u8C31\u4E0A\u5199\u7684\u97F3\u5B9E\u9645\u4F4E\u4E00\u4E2A\u516B\u5EA6\u54CD\uFF08\u5409\u4ED6\u3001\u7537\u9AD8\u97F3\uFF09"),
  G8va: _t("\u9AD8\u97F3\u8C31\u53F7\u4E0A\u9762\u6302 8\uFF1A\u5B9E\u9645\u9AD8\u4E00\u4E2A\u516B\u5EA6\uFF08\u77ED\u7B1B\uFF09"),
  G15ma: _t("\u9AD8\u97F3\u8C31\u53F7\u4E0A\u9762\u6302 15\uFF1A\u5B9E\u9645\u9AD8\u4E24\u4E2A\u516B\u5EA6\uFF08\u949F\u7434\u3001\u94C3\uFF09"),
  F: _t("\u4F4E\u97F3\u8C31\u53F7"),
  F8vb: _t("\u4F4E\u97F3\u8C31\u53F7\u4E0B\u9762\u6302 8\uFF1A\u5B9E\u9645\u4F4E\u4E00\u4E2A\u516B\u5EA6\uFF08\u4F4E\u97F3\u63D0\u7434\u3001\u8D1D\u65AF\uFF09")
};
var OTTAVA_LABEL = { 1: "8va", 2: "15ma", [-1]: "8vb", 0: _t("\u7ED3\u675F\u516B\u5EA6\u7EBF") };
var BOTTOM = 30;
var TOP = 38;
var ledgerLines = (pos) => pos > TOP ? Math.floor((pos - TOP) / 2) : pos < BOTTOM ? Math.floor((BOTTOM - pos) / 2) : 0;
var ledgerCost = (pos) => {
  const l = ledgerLines(pos);
  return l * (l + 1) / 2;
};
var BIAS = { G: 0, F: 0.1, G8vb: 1, G8va: 1, G15ma: 1.5, F8vb: 1.5 };
function autoClef(positions, prev = null) {
  if (!positions.length) return prev ?? "G";
  return pickClef((c) => positions.reduce((a, x) => a + ledgerCost(x + CLEF_SHIFT[c]) + BIAS[c], 0), positions.length, prev);
}
function pickClef(cost, n2, prev) {
  let best = "G", bc = Infinity;
  for (const c of CLEFS) {
    const v = cost(c);
    if (v < bc - 1e-9) {
      bc = v;
      best = c;
    }
  }
  if (prev && cost(prev) <= bc + Math.max(1, 0.1 * n2)) return prev;
  return best;
}
var RUN_COST = 3;
function startClef(tokens, partClef, prev, autoOtt = false) {
  if (partClef) return partClef;
  if (autoOtt) {
    const cut = tokens.findIndex((t) => t.kind === "clef"), seg = cut < 0 ? tokens : tokens.slice(0, cut);
    let n2 = 0;
    for (const t of seg) if (t.kind === "note" && t.pitch) n2 += 1 + (t.chord?.length ?? 0);
    if (!n2) return prev ?? "G";
    return pickClef((c) => {
      const ao = autoOttava(seg, displayStates(seg, c));
      let v = ao.runs.length * RUN_COST;
      seg.forEach((t, i) => {
        if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) v += ledgerCost(diatonicIndex(p) + CLEF_SHIFT[c] + ottavaShift(ao.ott[i] ?? 0)) + BIAS[c];
      });
      return v;
    }, n2, prev);
  }
  const pos = [];
  let o = 0;
  for (const t of tokens) {
    if (t.kind === "clef") break;
    if (t.kind === "ottava") {
      o = t.shift;
      continue;
    }
    if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) pos.push(diatonicIndex(p) + ottavaShift(o));
  }
  return autoClef(pos, prev);
}
var GRAND_BIAS = 0.5;
function wantsGrand(tokens) {
  const pos = [];
  for (const t of tokens) if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) pos.push(diatonicIndex(p));
  if (pos.length < 2) return false;
  const c = startClef(tokens, void 0, null, true), ao = autoOttava(tokens, displayStates(tokens, c));
  let single = ao.runs.length * RUN_COST;
  tokens.forEach((t, i) => {
    if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) single += ledgerCost(diatonicIndex(p) + CLEF_SHIFT[c] + ottavaShift(ao.ott[i] ?? 0));
  });
  const grand = pos.reduce((a, d) => a + ledgerCost(d >= MIDDLE_C ? d : d + CLEF_SHIFT.F), 0) + GRAND_BIAS * pos.length;
  return grand < single;
}
var MIDDLE_C = 28;
function displayStates(tokens, start) {
  const clef = new Array(tokens.length), ott = new Array(tokens.length);
  let c = start, o = 0;
  tokens.forEach((t, i) => {
    if (t.kind === "clef") c = t.clef;
    else if (t.kind === "ottava") o = t.shift;
    clef[i] = c;
    ott[i] = o;
  });
  return { clef, ott };
}
function autoOttava(tokens, ds) {
  const ott = ds.ott.slice(), auto = new Array(tokens.length).fill(false), runs = [];
  const items = [];
  tokens.forEach((t, i) => {
    if (!isTimed(t)) return;
    const manual = (ds.ott[i] ?? 0) !== 0;
    if (t.kind !== "note" || !t.pitch) {
      items.push({ i, note: false, hi: NaN, lo: NaN, dir: 0, manual });
      return;
    }
    const pos = [t.pitch, ...t.chord ?? []].map((p) => diatonicIndex(p) + CLEF_SHIFT[ds.clef[i]]);
    const hi = Math.max(...pos), lo = Math.min(...pos);
    const up = hi > TOP && ledgerLines(hi) >= 3, down = lo < BOTTOM && ledgerLines(lo) >= 3;
    items.push({ i, note: true, hi, lo, dir: up && !down ? 1 : down && !up ? -1 : 0, manual });
  });
  const notes = items.filter((x) => x.note).length, cands = items.filter((x) => x.dir && !x.manual).length;
  if (cands < 2 || cands * 3 > notes) return { ott, auto, runs };
  const okGap = (x, dir) => !x.manual && (!x.note || (dir === 1 ? !(x.lo - 7 < BOTTOM && ledgerLines(x.lo - 7) >= 3) : !(x.hi + 7 > TOP && ledgerLines(x.hi + 7) >= 3)));
  for (let k = 0; k < items.length; ) {
    const it = items[k];
    if (!it.dir || it.manual) {
      k++;
      continue;
    }
    const dir = it.dir;
    let e = k, n2 = 1;
    for (; ; ) {
      const a = items[e + 1], b = items[e + 2];
      if (a && a.dir === dir && !a.manual) {
        e += 1;
        n2++;
        continue;
      }
      if (a && b && b.dir === dir && !b.manual && okGap(a, dir)) {
        e += 2;
        n2++;
        continue;
      }
      break;
    }
    if (n2 >= 2) {
      const span = items.slice(k, e + 1).filter((x) => x.note);
      const shift = dir === -1 ? -1 : span.some((x) => x.hi - 7 > TOP && ledgerLines(x.hi - 7) >= 3) ? 2 : 1;
      const from = items[k].i, to = items[e].i;
      for (let j = from; j <= to; j++) {
        ott[j] = shift;
        auto[j] = true;
      }
      runs.push({ from, to, shift });
    }
    k = e + 1;
  }
  return { ott, auto, runs };
}
var GRAND_MIN = 8;
var GRAND_SIDE = 0.2;
var GRAND_GAIN = 2.5;
var GRAND_KEEP = 1.5;
function autoGrand(tokens, single, autoOtt, prevGrand) {
  if (tokens.some((t) => t.kind === "clef")) return false;
  const pos = [];
  let o = 0;
  for (const t of tokens) {
    if (t.kind === "ottava") o = t.shift;
    else if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) pos.push(diatonicIndex(p) + ottavaShift(o));
  }
  const n2 = pos.length;
  if (n2 < GRAND_MIN) return false;
  const up = pos.filter((d) => d >= MIDDLE_C).length;
  if (up < GRAND_SIDE * n2 || n2 - up < GRAND_SIDE * n2) return false;
  const ao = autoOtt ? autoOttava(tokens, displayStates(tokens, single)) : null, ds = displayStates(tokens, single);
  let one = (ao?.runs.length ?? 0) * RUN_COST;
  tokens.forEach((t, i) => {
    if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) one += ledgerCost(diatonicIndex(p) + CLEF_SHIFT[ds.clef[i] ?? single] + ottavaShift((ao ? ao.ott[i] : ds.ott[i]) ?? 0));
  });
  const stf = staffOfTokens(tokens, 2);
  let two = 0;
  tokens.forEach((t, i) => {
    if (t.kind === "note" && t.pitch) for (const p of [t.pitch, ...t.chord ?? []]) two += ledgerCost(diatonicIndex(p) + (stf[i] === 2 ? CLEF_SHIFT.F : 0) + ottavaShift(ds.ott[i] ?? 0));
  });
  return (one - two) / n2 > (prevGrand ? GRAND_KEEP : GRAND_GAIN);
}
function resolveSongLooks(song, noAutoGrand) {
  const out = /* @__PURE__ */ new Map(), last = /* @__PURE__ */ new Map(), lastGrand = /* @__PURE__ */ new Map();
  const shared = new Set(song.parts.flatMap((p) => p.host ? [p.id, p.host] : []));
  for (const paper of song.papers) {
    const m = /* @__PURE__ */ new Map();
    out.set(paper.id, m);
    for (const part of song.parts) {
      const toks = paper.tracks[part.id];
      if (!toks) continue;
      const look = paper.looks?.[part.id] ?? {}, autoOtt = look.autoOttava !== false;
      const hc = headClefOf(toks), c = hc ?? startClef(toks, void 0, last.get(part.id) ?? null, autoOtt), ds = displayStates(toks, c);
      const grand = look.grand ? "explicit" : !shared.has(part.id) && !noAutoGrand?.has(part.id) && autoGrand(toks, c, autoOtt, lastGrand.get(part.id) ?? false) ? "auto" : null;
      const fi = toks.findIndex((t) => t.kind === "note"), first = hc ?? (fi >= 0 ? ds.clef[fi] ?? c : c);
      m.set(part.id, { staves: grand ? 2 : 1, clef: c, first, autoOtt, grand });
      last.set(part.id, ds.clef.length ? ds.clef[ds.clef.length - 1] : c);
      lastGrand.set(part.id, !!grand);
    }
  }
  return out;
}

// src/score/merge.ts
var HEAD_ARTS = ["ghost", "whisper"];
var SWITCH = 5;
function planHands(tracks, wantsGrand2, homes, force = false) {
  const host = tracks[0] ?? [], time = host.find((t) => t.kind === "time");
  const bar = (time?.beats ?? 4) * WHOLE / (time?.beatType ?? 4), meas = (t) => Math.floor(t / bar + 1e-9);
  const med = (xs) => {
    const a = [...xs].sort((x, y) => x - y);
    return a.length ? a[a.length >> 1] : NaN;
  };
  const per = tracks.map((toks) => {
    const notes = [];
    let t = 0;
    for (let i = headLen(toks); i < toks.length; i++) {
      const k = toks[i];
      if (!isTimed(k)) continue;
      if (k.kind === "note" && k.pitch) notes.push({ t, m: [k.pitch, ...k.chord ?? []].map(midiOf) });
      t += k.dur;
    }
    return notes;
  });
  const mid = per.map((ns) => med(ns.flatMap((n2) => n2.m))), home = mid.map((x, i) => homes?.[i] ?? (Number.isNaN(x) || x >= 60 ? 0 : 1));
  const present = mid.map((x, i) => Number.isNaN(x) ? -1 : i).filter((i) => i >= 0);
  if (force && present.length >= 2 && new Set(present.map((i) => home[i])).size < 2) {
    const order = [...present].sort((x, y) => mid[y] - mid[x]);
    let cut = 1, g = -1;
    for (let k = 0; k + 1 < order.length; k++) {
      const d = mid[order[k]] - mid[order[k + 1]];
      if (d > g) {
        g = d;
        cut = k + 1;
      }
    }
    order.forEach((m, k) => {
      home[m] = k < cut ? 0 : 1;
    });
  }
  const grand = force || new Set(present.map((i) => home[i])).size > 1 && wantsGrand2(mergeTracks(tracks));
  const staffCache = /* @__PURE__ */ new Map(), staffOf = (m, ms) => {
    if (!grand) return 0;
    const key = `${m}:${ms}`, hit = staffCache.get(key);
    if (hit !== void 0) return hit;
    const mm = med(per[m].filter((n2) => meas(n2.t) === ms).flatMap((n2) => n2.m));
    const st = Number.isNaN(mm) ? home[m] : home[m] === 1 && mm >= 60 + SWITCH ? 0 : home[m] === 0 && mm < 60 - SWITCH ? 1 : home[m];
    staffCache.set(key, st);
    return st;
  };
  const voiceCache = /* @__PURE__ */ new Map(), voiceOf = (m, ms) => {
    const key = `${m}:${ms}`, hit = voiceCache.get(key);
    if (hit !== void 0) return hit;
    const s2 = staffOf(m, ms), mates = present.filter((j) => staffOf(j, ms) === s2 && per[j].some((n2) => meas(n2.t) === ms)).sort((x, y) => mid[y] - mid[x]);
    let cut = mates.length;
    if (mates.length >= 2) {
      let g = -1;
      for (let i = 0; i + 1 < mates.length; i++) {
        const d = mid[mates[i]] - mid[mates[i + 1]];
        if (d > g) {
          g = d;
          cut = i + 1;
        }
      }
    }
    for (let i = 0; i < mates.length; i++) voiceCache.set(`${mates[i]}:${ms}`, i < cut ? 1 : 2);
    return voiceCache.get(key) ?? 1;
  };
  return { grand, pick: (staff, voice) => (m, t) => staffOf(m, meas(t)) === staff && voiceOf(m, meas(t)) === voice };
}
function mergeTracks(tracks, opt = {}) {
  const { keyOf, pick, hits } = opt, barsOnly = opt.marks === "bars";
  const host = tracks[0] ?? [], head = host.slice(0, headLen(host));
  const evs = [], marks = [];
  let end = 0;
  tracks.forEach((toks, m) => {
    let t = 0;
    for (let i = headLen(toks); i < toks.length; i++) {
      const k = toks[i];
      if (isTimed(k)) {
        if (k.kind === "note" && k.pitch) {
          const ps = [k.pitch, ...k.chord ?? []].map((p) => keyOf ? keyOf(m, p) : p);
          if (!pick || pick(m, t)) evs.push({ t0: t, t1: t + k.dur, ps, host: m === 0 && !barsOnly ? k : null, heads: (k.art ?? []).filter((a) => HEAD_ARTS.includes(a)) });
        }
        t += k.dur;
      } else if (m === 0 && k.kind !== "clef" && k.kind !== "ottava" && (!barsOnly || k.kind === "bar" || k.kind === "key" || k.kind === "time")) marks.push({ t, tok: k });
    }
    end = Math.max(end, t);
  });
  const cuts = [.../* @__PURE__ */ new Set([0, end, ...evs.flatMap((e) => [e.t0, e.t1]), ...marks.map((x) => x.t)])].filter((x) => x <= end).sort((a, b) => a - b);
  const out = [...head];
  let id = -1e3, prevChord = false, prevOn = [];
  for (let i = 0; i < cuts.length; i++) {
    const a = cuts[i], b = cuts[i + 1];
    for (const x of marks) if (x.t === a) out.push(x.tok);
    if (b === void 0) break;
    let on = evs.filter((e) => e.t0 <= a && e.t1 > a);
    if (hits && on.length) {
      const struck = on.filter((e) => e.t0 === a);
      on = struck.length ? struck : prevChord && on.length === prevOn.length && on.every((e) => prevOn.includes(e)) ? on : [];
    }
    if (!on.length) {
      const last = out[out.length - 1];
      if (last && last.kind === "rest" && last.id <= -1e3) out[out.length - 1] = { ...last, dur: last.dur + (b - a) };
      else out.push({ kind: "rest", id: id--, dur: b - a });
      prevChord = false;
      prevOn = [];
      continue;
    }
    const freshK = /* @__PURE__ */ new Set(), seen = /* @__PURE__ */ new Set();
    for (const e of on) if (e.t0 === a) for (const p of e.ps) freshK.add(midiOf(p));
    const all = on.flatMap((e) => e.ps).filter((p) => {
      const k = midiOf(p);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((x, y) => midiOf(y) - midiOf(x));
    const ps = all;
    const fresh = ps.some((p) => freshK.has(midiOf(p))), h = on.find((e) => e.host && e.t0 === a)?.host ?? null;
    const src = on.filter((e) => e.t0 === a).length ? on.filter((e) => e.t0 === a) : on, art2 = HEAD_ARTS.filter((x) => src.every((e) => e.heads.includes(x)));
    out.push({ kind: "note", id: id--, pitch: ps[0], ...ps.length > 1 ? { chord: ps.slice(1) } : {}, dur: b - a, lyric: h?.lyric ?? null, ...h?.hyph ? { hyph: true } : {}, ...!fresh && prevChord ? { tie: true } : {}, ...art2.length ? { art: art2 } : {} });
    prevChord = true;
    prevOn = on;
  }
  return out;
}

// src/render/smufl.ts
var GLYPH = {
  metNoteQuarterUp: "\uECA5",
  // 速度记号里的四分音符（metronome mark）
  gClef: "\uE050",
  fClef: "\uE062",
  // 低音谱号（2026-10-08）
  gClef8vb: "\uE052",
  gClef8va: "\uE053",
  gClef15ma: "\uE054",
  fClef8vb: "\uE064",
  // 八度谱号（2026-10-10 v0.9.28：吉他 / 男高音 8vb、短笛 8va、钟琴 15ma、贝斯 8vb）
  ottavaAlta: "\uE511",
  ottavaBassa: "\uE512",
  quindicesimaAlta: "\uE515",
  // 八度线开头的字：8va / 8vb / 15ma
  noteheadWhole: "\uE0A2",
  noteheadHalf: "\uE0A3",
  noteheadBlack: "\uE0A4",
  noteheadXWhole: "\uE0A7",
  noteheadXHalf: "\uE0A8",
  noteheadXBlack: "\uE0A9",
  // × 符头（2026-10-08：演奏者固定敲一个键的声部；user「披露就用x」）
  augmentationDot: "\uE1E7",
  flag8thUp: "\uE240",
  flag8thDown: "\uE241",
  flag16thUp: "\uE242",
  flag16thDown: "\uE243",
  flag32ndUp: "\uE244",
  flag32ndDown: "\uE245",
  accidentalFlat: "\uE260",
  accidentalNatural: "\uE261",
  accidentalSharp: "\uE262",
  accidentalDoubleSharp: "\uE263",
  accidentalDoubleFlat: "\uE264",
  restWhole: "\uE4E3",
  restHalf: "\uE4E4",
  restQuarter: "\uE4E5",
  rest8th: "\uE4E6",
  rest16th: "\uE4E7",
  rest32nd: "\uE4E8"
};
var timeSigDigits = (n2) => [...String(n2)].map((d) => String.fromCodePoint(57472 + Number(d))).join("");
var PERC_CLEF = "\uE069";
var PERC_HEAD = {
  normal: { ch: ["\uE0A4", "\uE0A3", "\uE0A2"], w: [1.18, 1.18, 1.688] },
  x: { ch: ["\uE0A9", "\uE0A8", "\uE0A7"], w: [1.16, 1.34, 1.51] },
  "circle-x": { ch: ["\uE0B3", "\uE0B2", "\uE0B1"], w: [0.996, 1, 0.996] },
  slash: { ch: ["\uE101", "\uE103", "\uE102"], w: [2.124, 3.12, 3.92] },
  slashed1: { ch: ["\uE0CF", "\uE0D1", "\uE0D3"], w: [1.18, 1.168, 1.672] },
  slashed2: { ch: ["\uE0D0", "\uE0D2", "\uE0D4"], w: [1.18, 1.172, 1.672] },
  diamond: { ch: ["\uE0DB", "\uE0D9", "\uE0D8"], w: [0.98, 0.98, 1.664] },
  "triangle-up": { ch: ["\uE0BE", "\uE0BC", "\uE0BB"], w: [1.172, 1.14, 1.276] },
  "triangle-down": { ch: ["\uE0C7", "\uE0C5", "\uE0C4"], w: [1.168, 1.14, 1.276] },
  plus: { ch: ["\uE0AF", "\uE0AE", "\uE0AD"], w: [0.996, 1.044, 1.14] },
  la: { ch: ["\uE0B9", "\uE0B8", "\uE0B8"], w: [1.252, 1.252, 1.252] },
  ti: { ch: ["\uE0CD", "\uE0CC", "\uE0CC"], w: [1.112, 1.112, 1.112] }
};
var PERC_SMUFL = {
  noteheadXOrnate: { ch: ["\uE0AA", "\uE0AA", "\uE0AA"], w: [0.992, 0.992, 0.992] },
  noteheadSlashX: { ch: ["\uE106", "\uE106", "\uE106"], w: [2.124, 2.124, 2.124] }
};
var W = {
  noteheadBlack: 1.18,
  noteheadHalf: 1.18,
  noteheadWhole: 1.688,
  noteheadXBlack: 1.16,
  noteheadXHalf: 1.34,
  noteheadXWhole: 1.51,
  // 2026-10-08 在浏览器里用 measureText 量的 advance（400px Bravura；黑符头同法量得 1.18 = 上面那行，方法对得上）
  gClef: 2.684,
  fClef: 2.736,
  sharp: 0.996,
  flat: 0.904,
  natural: 0.672,
  doubleSharp: 1,
  doubleFlat: 1.644,
  dot: 0.4,
  timeSigDigit: 1.8,
  restWhole: 1.128,
  restHalf: 1.128,
  restQuarter: 1.08,
  rest8th: 0.988,
  rest16th: 1.28,
  rest32nd: 1.452
};
var ENGRAVE = {
  staffLine: 0.13,
  stem: 0.12,
  ledger: 0.16,
  ledgerExt: 0.4,
  beam: 0.5,
  beamGap: 0.25,
  thinBar: 0.16,
  tieMid: 0.22
};
var STEM_UP_SE = [1.18, 0.168];
var STEM_DOWN_NW = [0, -0.168];
var FLAG_ANCHOR_UP = { 1: -0.04, 2: -0.088, 3: 0.376 };
var FLAG_ANCHOR_DOWN = { 1: 0.132, 2: 0.128, 3: -0.448 };
var FLAG_W = { up: [1.056, 1.116, 1.044], down: [1.224, 1.164, 1.092] };

// src/render/staff/notation.ts
var MIN_PLAIN = TPQ / 8;
var NOTATABLE = [];
for (let b = WHOLE; b >= MIN_PLAIN; b /= 2) {
  NOTATABLE.push({ ticks: b * 1.5, base: b, dotted: true }, { ticks: b, base: b, dotted: false });
}
NOTATABLE.sort((a, b) => b.ticks - a.ticks);
function splitDur(dur) {
  const out = [];
  let left = dur;
  while (left > 0) {
    const n2 = NOTATABLE.find((v) => v.ticks <= left && (v.dotted ? v.base >= MIN_PLAIN * 2 : true));
    if (!n2) {
      out.push({ base: MIN_PLAIN, dotted: false, ticks: left });
      break;
    }
    out.push(n2);
    left -= n2.ticks;
  }
  return out;
}
var RATIOS = [[3, 2], [5, 4], [6, 4], [7, 4]];
function notate(dur) {
  if (dur % MIN_PLAIN === 0) return { ratio: null, chunks: splitDur(dur) };
  for (const [n2, m] of RATIOS) {
    const written = dur * n2 / m;
    if (Number.isInteger(written) && written % MIN_PLAIN === 0) return { ratio: [n2, m], chunks: splitDur(written).map((c) => ({ ...c, ticks: c.ticks * m / n2 })) };
  }
  return { ratio: null, chunks: [{ base: MIN_PLAIN, dotted: false, ticks: dur }] };
}
var baseWidth = (base) => Math.max(2.2, 3.6 + 0.75 * Math.log2(base / TPQ));

// src/render/staff/units.ts
var CLEF_CUE = 0.72;
var CLEF_CUE_W = 2.74 * CLEF_CUE + 0.9;
var CLEF_GLYPH = { G: GLYPH.gClef, G8vb: GLYPH.gClef8vb, G8va: GLYPH.gClef8va, G15ma: GLYPH.gClef15ma, F: GLYPH.fClef, F8vb: GLYPH.fClef8vb };
var KEY_LABEL_W = 3.5;
var keyWidth = (fifths, prev) => (fifths === 0 ? Math.abs(prev) * 0.8 : Math.abs(fifths) * 1.05) + 1;
var timeWidth = (beats, beatType) => Math.max([...String(beats)].length, [...String(beatType)].length) * W.timeSigDigit;
function unitsOf(tokens, o) {
  const H = headLen(tokens);
  let fifths = DEFAULT_KEY, real = DEFAULT_KEY, minor = false, time = { ...DEFAULT_TIME }, bpm = DEFAULT_BPM;
  const headIdx = {};
  for (let i = 0; i < H; i++) {
    const t = tokens[i];
    if (t.kind === "key") {
      fifths = t.fifths;
      real = realFifthsOf(t);
      minor = t.mode === "minor";
    } else if (t.kind === "time") time = { beats: t.beats, beatType: t.beatType };
    else if (t.kind === "tempo") bpm = t.bpm;
    if (t.kind === "key" || t.kind === "time" || t.kind === "tempo") headIdx[t.kind] = i;
  }
  const head = { key: fifths, real, minor, time, bpm, idx: headIdx };
  const units = [], measureLen = (b, bt) => b * WHOLE / bt;
  let accState = /* @__PURE__ */ new Map(), inBar = 0, measureNo = 0, shortBars = 0, tick = 0, pickup = false;
  let beat = beatTicks(time.beats, time.beatType), len = measureLen(time.beats, time.beatType);
  const pushHead = () => {
    units.push({ kind: "head", index: -1, w: 0, x: 0, system: 0, tick, staff: 1 });
  };
  const pushBar = (index, auto) => {
    const rb = index >= 0 ? tokens[index] : null, repeat = rb?.repeat;
    const warn = inBar !== len && measureNo > 0 && !(repeat === "start" && inBar === 0);
    if (warn) shortBars++;
    const style = !repeat ? rb?.style : void 0;
    units.push({ kind: "bar", index, w: repeat ? (repeat === "both" ? 2.43 : 1.47) + 0.8 : style ? BAR_W + 0.7 : BAR_W, x: 0, system: 0, tick, staff: 1, warn, auto, ...repeat ? { repeat, ...rb?.times ? { times: rb.times } : {} } : {}, ...style ? { style } : {} });
    const empty = inBar === 0;
    if (measureNo === 0 && inBar > 0 && inBar < len) pickup = true;
    accState = /* @__PURE__ */ new Map();
    inBar = 0;
    if (!(repeat === "start" && empty)) measureNo++;
  };
  const flushFull = () => {
    if (o.autoBars && inBar >= len && inBar > 0) pushBar(-1, true);
  };
  tokens.forEach((t, i) => {
    if (i < H) return;
    if (t.kind === "bar") {
      pushBar(i, false);
      return;
    }
    if (t.kind === "key") {
      flushFull();
      const rf = realFifthsOf(t), inC = rf !== t.fifths || "realFifths" in t;
      units.push({ kind: "key", index: i, fifths: t.fifths, prev: fifths, w: inC ? Math.max(KEY_LABEL_W * (TEXT_STYLES["key-label"].ruler === "text" ? o.ts ?? 1 : 1), keyWidth(t.fifths, fifths)) : keyWidth(t.fifths, fifths), x: 0, system: 0, tick, staff: 1, real: rf, minor: t.mode === "minor" });
      fifths = t.fifths;
      accState = /* @__PURE__ */ new Map();
      return;
    }
    if (t.kind === "time") {
      if (o.autoBars && inBar > 0) pushBar(-1, true);
      units.push({ kind: "time", index: i, beats: t.beats, beatType: t.beatType, w: timeWidth(t.beats, t.beatType) + 1.2, x: 0, system: 0, tick, staff: 1 });
      beat = beatTicks(t.beats, t.beatType);
      len = measureLen(t.beats, t.beatType);
      return;
    }
    if (t.kind === "tempo") {
      flushFull();
      units.push({ kind: "tempo", index: i, bpm: t.bpm, w: 0.3, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "dyn") {
      flushFull();
      units.push({ kind: "dyn", index: i, value: t.value, w: 0, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "hairpin") {
      flushFull();
      units.push({ kind: "hairpin", index: i, dir: t.dir, w: 0, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "groove") {
      flushFull();
      units.push({ kind: "groove", index: i, w: 0, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "clef") {
      if (i < H || tokens.slice(H, i).every((x) => x.kind === "clef")) return;
      flushFull();
      units.push({ kind: "clef", index: i, clef: t.clef, w: CLEF_CUE_W, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "ottava") {
      flushFull();
      units.push({ kind: "ottava", index: i, w: 0, x: 0, system: 0, tick, staff: 1 });
      return;
    }
    if (t.kind === "nav") {
      const head2 = t.what === "ending" || t.what === "segno" || t.what === "coda";
      if (head2) flushFull();
      units.push({ kind: "nav", index: i, w: 0, x: 0, system: 0, tick, staff: 1, slot: head2 ? 0.5 : -0.5 });
      return;
    }
    const isNote = t.kind === "note", nt = t;
    const pitch = isNote ? effectivePitch(tokens, i) : null;
    const pitches = isNote ? nt.pitch ? allPitches(nt) : [pitch] : [];
    let left = t.dur, j = 0, lastChunk = null;
    while (left > 1e-6) {
      flushFull();
      const piece = o.autoBars ? Math.min(left, len - inBar) : left;
      const { ratio, chunks } = notate(piece);
      const mrest = !isNote && inBar < 1e-6 && Math.abs(piece - len) < 1e-6;
      let off = 0;
      for (const c of chunks) {
        const accs = pitches.map((pp) => {
          if (j !== 0 || isNote && nt.tie) return null;
          const key = `${pp.step}${pp.octave}`, cur = accState.has(key) ? accState.get(key) : keyAlter(pp.step, fifths);
          if (pp.alter !== cur) {
            accState.set(key, pp.alter);
            return pp.alter;
          }
          return null;
        });
        const acc = accs[0] ?? null;
        const lyric = isNote && j === 0 && !nt.tie ? nt.lyric : null;
        const accW = accs.some((a) => a !== null) ? 1.3 : 0;
        let w = accW + baseWidth(c.base) + (c.dotted ? 0.6 : 0);
        const lyW = lyric && lyric !== MELISMA_MARK && !o.rhythm ? lyricWidth(o.measure, lyricShow(lyric), o.sp, o.ts ?? 1) : void 0;
        if (lyW !== void 0) w = Math.max(w, accW + lyW + (nt.hyph ? 1.4 : 0.7));
        const u = {
          kind: "chunk",
          index: i,
          j,
          last: false,
          m: measureNo,
          base: c.base,
          dotted: c.dotted,
          note: isNote,
          ratio,
          ticks: c.ticks,
          pitch,
          ghost: isNote && nt.pitch === null,
          tie: isNote && !!nt.tie && j === 0,
          lyric,
          hyph: !!(isNote && nt.hyph && j === 0),
          inBar: inBar + off,
          beat,
          acc,
          w,
          accW,
          x: 0,
          system: 0,
          tick: tick + off,
          staff: 1,
          pitches,
          accs,
          art: isNote && j === 0 ? (nt.art ?? []).filter((a) => a !== "breath") : [],
          breath: false,
          ...isNote && nt.art?.includes("whisper") ? { whisper: true } : {},
          ...lyW !== void 0 ? { lyW } : {},
          ...mrest ? { mrest: off < 1e-6 ? "draw" : "skip" } : {},
          ...o.padFrom !== void 0 && i >= o.padFrom ? { pad: true } : {}
        };
        units.push(u);
        lastChunk = u;
        off += c.ticks;
        j++;
      }
      inBar += piece;
      left -= piece;
      tick += piece;
    }
    if (lastChunk) {
      lastChunk.last = true;
      if (isNote && nt.art?.includes("breath")) {
        lastChunk.breath = true;
        lastChunk.w += 0.8;
        if (nt.inhale) {
          lastChunk.inhale = nt.inhale;
          lastChunk.w += nt.inhale === "big" ? 2.1 : 1.2;
        }
      }
    }
  });
  flushFull();
  if (o.tail) pushHead();
  return { units, head, shortBars, pickup };
}

// src/render/staff/rows.ts
function staffRows(paper, visible, fold, lookAt) {
  const absorbed = /* @__PURE__ */ new Map(), virt = /* @__PURE__ */ new Map(), lowOf = /* @__PURE__ */ new Map();
  const voice2Of = /* @__PURE__ */ new Map(), shareWith = /* @__PURE__ */ new Map(), startFor = /* @__PURE__ */ new Map();
  const drumNames = /* @__PURE__ */ new Map(), virtualOut = {};
  for (const { host: fid, members: ms } of fold) {
    const hp = ms[0], ten = ms.slice(1), drums = ms.every((m) => !!m.perc);
    const kitKeyOf = (m) => {
      const pk = ms[m].perc;
      return pk.kind === "one" ? pk.info.kitKey ?? (pk.info.staff === 5 && !pk.info.from ? pk.key : 0) : null;
    };
    const keyOf = drums ? (m, p) => {
      const k = kitKeyOf(m);
      return k !== null ? spellMidi(k, 0) : p;
    } : void 0;
    const tracksM = ms.map((m) => paper.tracks[m.id]);
    if (drums) {
      const lineOfKey = (key) => percOf(128, 0, key)?.line ?? 4;
      const rep = ms.map((_, m) => {
        const k = kitKeyOf(m);
        if (k !== null) return lineOfKey(k);
        const ls = (tracksM[m] ?? []).flatMap((t) => t.kind === "note" ? allPitches(t) : []).map((p) => lineOfKey(midiOf(p))).sort((a, b) => a - b);
        return ls.length ? ls[ls.length >> 1] : 4;
      });
      drumNames.set(hp.id, ms.map((_, m) => m).sort((a, b) => rep[a] - rep[b] || a - b).map((m) => ms[m]));
    }
    absorbed.set(hp.id, ten);
    const staffOf = (sid, mo, all) => {
      startFor.set(sid, startClef(mergeTracks(tracksM, all), void 0, null, true));
      const v1 = mergeTracks(tracksM, mo(1)), v2 = mergeTracks(tracksM, mo(2));
      virt.set(sid, v1);
      virtualOut[`${paper.id}:${sid}`] = v1;
      if (v2.some((t) => t.kind === "note")) {
        const vid = `${sid}~v2`;
        virt.set(vid, v2);
        virtualOut[`${paper.id}:${vid}`] = v2;
        voice2Of.set(sid, vid);
        shareWith.set(vid, sid);
        startFor.set(vid, startFor.get(sid));
      }
    };
    if (drums) {
      const whole = mergeTracks(tracksM, { keyOf, hits: true });
      virt.set(hp.id, whole);
      virtualOut[`${paper.id}:${hp.id}`] = whole;
      startFor.set(hp.id, "G");
    } else {
      const homes = ms.map((m) => {
        const l = lookAt(paper.id, m.id);
        if (!l || l.staves === 2) return null;
        return isFClef(l.first) ? 1 : 0;
      });
      const plan = planHands(tracksM, wantsGrand, homes, lookAt(paper.id, fid)?.grand === "explicit"), staffOpts = (S2, top) => (v) => ({ pick: plan.pick(S2, v), marks: top && v === 1 ? "all" : "bars" });
      const both = (S2) => ({ pick: (m, t) => plan.pick(S2, 1)(m, t) || plan.pick(S2, 2)(m, t), marks: "bars" });
      staffOf(hp.id, staffOpts(0, true), both(0));
      if (plan.grand) {
        const lid = `${hp.id}~lo`;
        lowOf.set(hp.id, lid);
        staffOf(lid, staffOpts(1, false), both(1));
      }
    }
  }
  const gone = new Set([...absorbed.values()].flat().map((p) => p.id));
  const parts = visible.filter((p) => !gone.has(p.id)).flatMap((p) => {
    if (!virt.has(p.id)) return [p];
    const drums = [p, ...absorbed.get(p.id)].every((m) => !!m.perc), lid = lowOf.get(p.id);
    const v = { ...p, staves: void 0, perc: drums ? { kind: "kit" } : void 0, mono: false, xHead: false, ignores: [], lyricMute: void 0 };
    const fake = (id) => ({ id, name: "", empty: false, first: false, hidden: false, badges: [] }), v2 = (sid) => voice2Of.has(sid) ? [fake(voice2Of.get(sid))] : [];
    return [v, ...v2(p.id), ...lid ? [fake(lid), ...v2(lid)] : []];
  });
  return { parts, absorbed, virt, lowOf, voice2Of, shareWith, startFor, drumNames, loIds: new Set(lowOf.values()), virtualOut };
}
function staffTracks(rows, c) {
  const { paper, lookAt } = c;
  const trackOf = (id) => rows.virt.get(id) ?? paper.tracks[id];
  const clefStart = (partId) => {
    const l = lookAt(paper.id, partId);
    return l && l.staves === 1 ? l.clef : void 0;
  };
  let shortBars = 0;
  const per = rows.parts.map((p, pi) => {
    const real = trackOf(p.id), vrt = rows.virt.has(p.id), focused = !vrt && c.at.paper === paper.id && c.at.part === p.id, staves = p.staves === 2 || !vrt && lookAt(paper.id, p.id)?.staves === 2 ? 2 : 1;
    const gap = c.paperLen - c.lens[pi];
    const padT = (dur, id) => ({ kind: "rest", id, dur });
    const tokens = gap > 1e-6 ? [...real, padT(gap, -2)] : real;
    const u = unitsOf(tokens, { tail: focused && c.tailOpen, autoBars: c.autoBars, measure: c.measure, sp: c.sp, ts: c.ts, rhythm: c.look.lyricFit === "rhythm", padFrom: real.length });
    shortBars += u.shortBars;
    if (staves === 2) {
      const stf = staffOfTokens(tokens, 2);
      let last = 1;
      for (const x of u.units) {
        if (x.kind === "chunk") {
          x.staff = stf[x.index];
          last = x.staff;
        } else if (x.kind === "head") x.staff = last;
      }
    }
    const start = staves === 2 ? "G" : vrt ? rows.startFor.get(p.id) ?? startClef(tokens, void 0, null, true) : clefStart(p.id) ?? "G";
    const ds0 = displayStates(tokens, start), ao = staves === 2 || p.perc || rows.shareWith.has(p.id) || !vrt && lookAt(paper.id, p.id)?.autoOtt === false ? null : autoOttava(tokens, ds0);
    const ds = ao ? { clef: ds0.clef, ott: ao.ott, auto: ao.auto, runs: ao.runs } : { ...ds0, auto: null, runs: [] };
    const fFam = staves === 2 || isFClef(start) || tokens.some((t) => t.kind === "clef" && isFClef(t.clef));
    return { p, tokens, realLen: real.length, realTicks: c.lens[pi], focused, staves, start, ds, fFam, vrt, ...u, pmode: !p.perc ? null : p.perc.kind === "kit" ? "five" : "one", v2: false, hasV2: rows.voice2Of.has(p.id) };
  });
  const rowHost = per.map((q) => {
    const h = rows.shareWith.get(q.p.id);
    return h ? per.findIndex((x) => x.p.id === h) : -1;
  });
  per.forEach((q, pi) => {
    q.v2 = rowHost[pi] >= 0;
  });
  return { per, rowHost, shortBars };
}

// src/render/stems.ts
var TOP_LINE = 38;
var MID_LINE = 34;
var yLocal = (d) => (TOP_LINE - d) * 0.5;
var flagLevel = (base) => base >= TPQ ? 0 : Math.round(Math.log2(TPQ / base));
var LOCAL = { u: 1, y: (d) => yLocal(d) };
function layoutStems(seq, dir, f = LOCAL) {
  const groups = [];
  let group = [], groupBeat = -1, groupSys = -1;
  const endGroup = () => {
    if (group.length) groups.push(group);
    group = [];
    groupBeat = -1;
  };
  for (const u of seq) {
    if (!u || u.base >= WHOLE) {
      endGroup();
      continue;
    }
    if (u.base > TPQ / 2) {
      endGroup();
      groups.push([u]);
      continue;
    }
    if (group.length && (u.beat !== groupBeat || u.system !== groupSys || u.staff !== group[0].staff)) endGroup();
    group.push(u);
    groupBeat = u.beat;
    groupSys = u.system;
  }
  endGroup();
  const U = (v) => v * f.u;
  const notes = /* @__PURE__ */ new Map(), out = [];
  for (const g of groups) {
    const up = dir === "down" ? false : dir === "up" ? true : dir === "kit" ? g.some((s2) => !!s2.handUp) : g.reduce((a, s2) => a + (s2.dHi + s2.dLo) / 2, 0) / g.length < MID_LINE;
    const sx = (s2) => up ? s2.x + U(STEM_UP_SE[0] - ENGRAVE.stem / 2) : s2.x + U(STEM_DOWN_NW[0] + ENGRAVE.stem / 2);
    const y = (s2) => f.y(s2.dHi, s2), yLow = (s2) => f.y(s2.dLo, s2);
    const sy0 = (s2) => up ? yLow(s2) - U(STEM_UP_SE[1]) : y(s2) - U(STEM_DOWN_NW[1]);
    const beams = [];
    out.push({ keys: g.map((s2) => s2.key), beams });
    if (g.length === 1) {
      const s2 = g[0], mid = f.y(MID_LINE, s2);
      let tip = up ? y(s2) - U(3.5) : yLow(s2) + U(3.5);
      if (up && s2.dHi < 27) tip = Math.min(tip, mid);
      if (!up && s2.dLo > 41) tip = Math.max(tip, mid);
      const lv = flagLevel(s2.base);
      notes.set(s2.key, { up, x: sx(s2), y0: sy0(s2), tip, top: up ? tip : y(s2), beamed: false, flag: lv > 0 ? { x: sx(s2) - U(ENGRAVE.stem / 2), y: up ? tip + U(FLAG_ANCHOR_UP[lv]) : tip + U(FLAG_ANCHOR_DOWN[lv]), level: lv } : null });
      continue;
    }
    const xa = sx(g[0]), xb = sx(g[g.length - 1]);
    const k = Math.max(-0.2, Math.min(0.2, (y(g[g.length - 1]) - y(g[0])) / (xb - xa) * 0.5));
    const at = (xx, yy0) => yy0 + k * (xx - xa);
    const yb0 = up ? Math.min(...g.map((s2) => y(s2) - U(3.5) - k * (sx(s2) - xa))) : Math.max(...g.map((s2) => yLow(s2) + U(3.5) - k * (sx(s2) - xa)));
    for (const s2 of g) notes.set(s2.key, { up, x: sx(s2), y0: sy0(s2), tip: at(sx(s2), yb0), top: up ? Math.min(at(sx(s2), yb0) - U(ENGRAVE.beam), y(s2)) : y(s2), beamed: true, flag: null });
    const step = U(ENGRAVE.beam + ENGRAVE.beamGap) * (up ? 1 : -1), th = U(ENGRAVE.beam) * (up ? 1 : -1), ghost = g.every((s2) => s2.ghost);
    const beam = (xL, xR, lvl) => {
      const of = step * lvl;
      beams.push({ xL: xL - U(ENGRAVE.stem / 2), yL: at(xL, yb0) + of, xR: xR + U(ENGRAVE.stem / 2), yR: at(xR, yb0) + of, th, ghost });
    };
    beam(xa, xb, 0);
    const maxLv = Math.max(...g.map((s2) => flagLevel(s2.base)));
    for (let lvl = 2; lvl <= maxLv; lvl++) {
      let runStart = -1;
      for (let n2 = 0; n2 <= g.length; n2++) {
        const has = n2 < g.length && flagLevel(g[n2].base) >= lvl;
        if (has && runStart < 0) runStart = n2;
        if (!has && runStart >= 0) {
          const L = runStart, R = n2 - 1;
          if (L === R) {
            const stub = U(1.1), toRight = L < g.length - 1;
            beam(toRight ? sx(g[L]) : sx(g[L]) - stub, toRight ? sx(g[L]) + stub : sx(g[L]), lvl - 1);
          } else beam(sx(g[L]), sx(g[R]), lvl - 1);
          runStart = -1;
        }
      }
    }
  }
  return { notes, groups: out };
}

// src/render/frame/columns.ts
var SLOT = { bar: 0, nav: 0.5, clef: 0.8, key: 1, time: 2, tempo: 3, groove: 3.3, dyn: 3.5, ottava: 3.6, hairpin: 3.7, tail: 4, note: 5 };

// src/render/signs.ts
var G = (above, below, w, h) => ({ kind: "glyph", above, ...below ? { below } : {}, ...w !== void 0 ? { w } : {}, ...h !== void 0 ? { h } : {} });
var D = (how) => ({ kind: "drawn", how });
var DYN_G = {
  ppp: { kind: "glyph", above: "\uE52A", ink: [-0.4, 4.3, 1.1, 0.6] },
  pp: { kind: "glyph", above: "\uE52B", ink: [-0.4, 3, 1.1, 0.6] },
  p: { kind: "glyph", above: "\uE520", ink: [-0.4, 1.5, 1.1, 0.6] },
  mp: { kind: "glyph", above: "\uE52C", ink: [-0.1, 3.3, 1.1, 0.6] },
  mf: { kind: "glyph", above: "\uE52D", ink: [-0.1, 3.3, 1.7, 0.7] },
  f: { kind: "glyph", above: "\uE522", ink: [-0.6, 1.5, 1.8, 0.6] },
  ff: { kind: "glyph", above: "\uE52F", ink: [-0.6, 2.5, 1.8, 0.6] },
  fff: { kind: "glyph", above: "\uE530", ink: [-0.6, 3.4, 1.8, 0.6] }
};
var DYN_ZH = { ppp: "\u6781\u5F31", pp: "\u5F88\u5F31", p: "\u5F31", mp: "\u4E2D\u5F31", mf: "\u4E2D\u5F3A", f: "\u5F3A", ff: "\u5F88\u5F3A", fff: "\u6781\u5F3A" };
var art = (a, name, says, lane, staff, jianpu) => ({ id: `art:${a}`, name, says, lane, draw: { staff, jianpu } });
var ART_SIGNS = {
  "art:staccato": art("staccato", (l) => _tIn(l, "\u8DF3\u97F3"), (l) => _tIn(l, "\u8FD9\u4E2A\u97F3\u77ED\u4E00\u70B9\u3001\u548C\u4E0B\u4E00\u4E2A\u97F3\u65AD\u5F00"), "note", G("\uE4A2", "\uE4A3", 0.28, 0.28), G("\uE4A8", "\uE4A9", 0.4, 0.9)),
  // 简谱 = 窄小的楔形（点被八度占了；UX 稿第 5 节）
  "art:accent": art("accent", (l) => _tIn(l, "\u91CD\u97F3"), (l) => _tIn(l, "\u8FD9\u4E2A\u97F3\u7684\u97F3\u5934\u91CD\u4E00\u70B9"), "strength", G("\uE4A0", "\uE4A1", 1.36, 0.99), G("\uE4A0", "\uE4A1", 1.36, 0.99)),
  "art:marcato": art("marcato", (l) => _tIn(l, "\u5F3A\u97F3"), (l) => _tIn(l, "\u6BD4\u91CD\u97F3\u66F4\u91CD\u7684\u97F3\u5934"), "strength", G("\uE4AC", "\uE4AD", 1, 1.08), G("\uE4AC", "\uE4AD", 1, 1.08)),
  "art:stress": art("stress", (l) => _tIn(l, "\u6B21\u91CD\u97F3"), (l) => _tIn(l, "\u6BD4\u91CD\u97F3\u8F7B\u4E00\u6863\u7684\u91CD\uFF08\u56DB\u62CD\u5B50\u91CC\u7684\u7B2C\u4E09\u62CD\u90A3\u79CD\uFF09"), "strength", G("\uE4B6", "\uE4B7", 1, 1), G("\uE4A0", "\uE4A1", 1.36, 0.99)),
  // 简谱 = 细一号的 >（UX 稿第 5 节：画的时候缩小）
  "art:unstress": art("unstress", (l) => _tIn(l, "\u5F31\u5316"), (l) => _tIn(l, "\u8FD9\u4E2A\u97F3\u8F7B\u4E00\u70B9"), "strength", G("\uE4B8", "\uE4B9", 1.6, 0.9), G("\uE4B8", "\uE4B9", 1.6, 0.9)),
  "art:ghost": art("ghost", (l) => _tIn(l, "\u5E7D\u7075\u97F3"), (l) => _tIn(l, "\u51E0\u4E4E\u542C\u4E0D\u89C1\u7684\u97F3\uFF08\u53EA\u7559\u4E2A\u5F71\u5B50\uFF09"), "note", D("\u7B26\u5934\u52A0\u62EC\u53F7"), D("\u6570\u5B57\u753B\u5C0F\u4E00\u53F7")),
  // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:tenuto": art("tenuto", (l) => _tIn(l, "\u4FDD\u6301"), (l) => _tIn(l, "\u8FD9\u4E2A\u97F3\u5531 / \u594F\u6EE1\uFF0C\u4E0D\u548C\u4E0B\u4E00\u4E2A\u97F3\u65AD\u5F00"), "note", G("\uE4A4", "\uE4A5", 1.35, 0.17), G("\uE4A4", "\uE4A5", 1.35, 0.17)),
  "art:breath": art("breath", (l) => _tIn(l, "\u547C\u5438"), (l) => _tIn(l, "\u8FD9\u4E2A\u97F3\u540E\u9762\u6362\u6C14"), "note", G("\uE4CE"), D("\u97F3\u540E\u9762\u4E00\u4E2A V\uFF08\u51FA\u58F0\u7684\u6362\u6C14\u5199\u300CV \u5438\u300D\uFF09")),
  // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:sfz": art("sfz", (l) => _tIn(l, "\u7A81\u5F3A"), (l) => _tIn(l, "\u97F3\u5934\u7A81\u7136\u51B2\u4E00\u4E0B\u3001\u518D\u56DE\u5230\u5F53\u4E0B\u7684\u529B\u5EA6"), "noteDynamics", G("\uE539"), G("\uE539")),
  "art:fp": art("fp", (l) => _tIn(l, "\u5F3A\u540E\u5373\u5F31"), (l) => _tIn(l, "\u97F3\u5934\u6309\u5F3A\u3001\u9A6C\u4E0A\u843D\u5230\u5F31\uFF0C\u540E\u9762\u7684\u97F3\u90FD\u662F\u5F31"), "noteDynamics", G("\uE534"), G("\uE534")),
  "art:whisper": art("whisper", (l) => _tIn(l, "\u6C14\u58F0"), (l) => _tIn(l, "\u4E0D\u5531\u97F3\u9AD8\u3001\u7528\u6C14\u58F0\u5FF5\uFF08\u97F3\u9AD8\u7167\u5199\u5728\u8C31\u4E0A\uFF09"), "note", D("\xD7 \u7B26\u5934"), D("\u6570\u5B57 + \xD7")),
  // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:swellUp": art("swellUp", (l) => _tIn(l, "\u97F3\u5185\u6E10\u5F3A"), (l) => _tIn(l, "\u8FD9\u4E2A\u97F3\u91CC\u9762\u4ECE\u5F31\u957F\u5230\u5199\u7684\u529B\u5EA6"), "noteDynamics", D("\u8FD9\u4E2A\u97F3\u4E0A\u65B9\u7684\u5C0F\u53D1\u5939 <"), D("\u8FD9\u4E2A\u97F3\u4E0A\u65B9\u7684\u5C0F\u6954\u5F62 <")),
  // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:swellDown": art("swellDown", (l) => _tIn(l, "\u97F3\u5185\u6E10\u5F31"), (l) => _tIn(l, "\u8FD9\u4E2A\u97F3\u91CC\u9762\u4ECE\u5199\u7684\u529B\u5EA6\u6536\u5F31"), "noteDynamics", D("\u8FD9\u4E2A\u97F3\u4E0A\u65B9\u7684\u5C0F\u53D1\u5939 >"), D("\u8FD9\u4E2A\u97F3\u4E0A\u65B9\u7684\u5C0F\u6954\u5F62 >")),
  // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:swellBoth": art("swellBoth", (l) => _tIn(l, "\u97F3\u5185\u9F13\u8D77"), (l) => _tIn(l, "\u8FD9\u4E2A\u97F3\u91CC\u9762\u5148\u957F\u540E\u6536\uFF08messa di voce\uFF09"), "noteDynamics", D("\u8FD9\u4E2A\u97F3\u4E0A\u65B9\u7684\u5C0F\u53D1\u5939 <>"), D("\u8FD9\u4E2A\u97F3\u4E0A\u65B9\u7684\u5C0F\u6954\u5F62 <>")),
  // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:arpeggio": art("arpeggio", (l) => _tIn(l, "\u7436\u97F3"), (l) => _tIn(l, "\u548C\u5F26\u4ECE\u4F4E\u5230\u9AD8\u4E00\u4E2A\u4E2A\u62E8\u51FA\u6765"), "note", D("\u548C\u5F26\u5DE6\u8FB9\u4E00\u6761\u7AD6\u7684\u6CE2\u6D6A\u7EBF"), D("\u548C\u5F26\u5DE6\u8FB9\u4E00\u6761\u7AD6\u7684\u6CE2\u6D6A\u7EBF\uFF08\u591A\u58F0\u90E8 = \u7B2C\u4E94\u5200\uFF09")),
  // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "art:roll": art("roll", (l) => _tIn(l, "\u6EDA\u594F"), (l) => _tIn(l, "\u8FD9\u4E2A\u97F3\u5FEB\u901F\u5730\u53CD\u590D\u6572\uFF08\u6EDA\uFF09"), "note", D("\u7B26\u5E72\u4E0A\u4E09\u9053\u659C\u7EBF"), D("\u6570\u5B57\u4E0B\u9762\u4E09\u9053\u77ED\u659C\u7EBF"))
  // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
};
var dynSign = (d) => ({ id: `dyn:${d}`, name: () => d, says: (l) => _tIn(l, "\u529B\u5EA6\u8BB0\u53F7\uFF1A\u4ECE\u8FD9\u4E2A\u97F3\u8D77\u662F\u8FD9\u4E2A\u5F3A\u5F31\uFF0C\u7BA1\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7"), lane: "dynamics", draw: { staff: DYN_G[d], jianpu: { kind: "word", zh: DYN_ZH[d], other: DYN_G[d] } } });
var DYN_SIGNS = { "dyn:ppp": dynSign("ppp"), "dyn:pp": dynSign("pp"), "dyn:p": dynSign("p"), "dyn:mp": dynSign("mp"), "dyn:mf": dynSign("mf"), "dyn:f": dynSign("f"), "dyn:ff": dynSign("ff"), "dyn:fff": dynSign("fff") };
var SIGNS = {
  ...ART_SIGNS,
  ...DYN_SIGNS,
  "hairpin:cresc": { id: "hairpin:cresc", name: (l) => _tIn(l, "\u6E10\u5F3A"), says: (l) => _tIn(l, "\u4ECE\u8FD9\u91CC\u8D77\u8D8A\u6765\u8D8A\u5F3A\uFF0C\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u4E3A\u6B62"), lane: "dynamics", draw: { staff: D("\u53D1\u5939 <\uFF08\u592A\u957F\u5199 cresc. - - -\uFF09"), jianpu: D("\u6954\u5F62 <") } },
  // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  "hairpin:dim": { id: "hairpin:dim", name: (l) => _tIn(l, "\u6E10\u5F31"), says: (l) => _tIn(l, "\u4ECE\u8FD9\u91CC\u8D77\u8D8A\u6765\u8D8A\u5F31\uFF0C\u5230\u4E0B\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u4E3A\u6B62"), lane: "dynamics", draw: { staff: D("\u53D1\u5939 >\uFF08\u592A\u957F\u5199 dim. - - -\uFF09"), jianpu: D("\u6954\u5F62 >") } },
  // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
  ramp: { id: "ramp", name: (l) => _tIn(l, "\u6E10\u5230"), says: (l) => _tIn(l, "\u4ECE\u4E0A\u4E00\u4E2A\u529B\u5EA6\u8BB0\u53F7\u5747\u5300\u53D8\u5230\u8FD9\u4E00\u4E2A"), lane: "dynamics", draw: { staff: D("\u865A\u7EBF\u53D1\u5939"), jianpu: D("\u865A\u7EBF\u6954\u5F62") } }
  // i18n-keep（「画成什么」这一栏是写给开发看的说明，不是界面字）
};
function dynDepiction(d, notation, l) {
  const dep = SIGNS[`dyn:${d}`].draw[notation], g = dep.kind === "word" ? l === "zh" ? null : dep.other : dep;
  if (dep.kind === "word" && l === "zh") return { text: dep.zh };
  if (g && g.kind === "glyph" && g.ink) return { glyph: g.above, ink: g.ink };
  throw new Error(`signs: dyn ${d} has no drawable depiction for ${notation}`);
}

// src/render/staff/glyphs.ts
var TOP_LINE2 = 38;
var MID_LINE2 = 34;
var BOTTOM_LINE = 30;
var glyphOf = (id) => {
  const d = SIGNS[id].draw.staff;
  if (d.kind !== "glyph") throw new Error(`signs: ${id} has no staff glyph`);
  return { above: d.above, below: d.below ?? d.above, w: d.w ?? 0, h: d.h ?? 0 };
};
var ART_GLYPH = Object.fromEntries(["stress", "unstress", "accent", "marcato", "staccato", "tenuto"].map((a) => [a, glyphOf(`art:${a}`)]));
var GLYPH_BREATH = glyphOf("art:breath").above;
var DYN_GLYPH = Object.fromEntries(DYNS.map((d) => [d, glyphOf(`dyn:${d}`).above]));
var SHARP_POS = [38, 35, 39, 36, 33, 37, 34];
var FLAT_POS = [34, 37, 33, 36, 32, 35, 31];
var GLYPH_TUPLET = (n2) => [...String(n2)].map((d) => String.fromCodePoint(59520 + Number(d))).join("");

// src/render/staff/measure.ts
var shAt = (q, staff, index) => {
  return q.staves === 2 ? staff === 2 ? 12 : 0 : CLEF_SHIFT[(index >= 0 ? q.ds.clef[index] : void 0) ?? q.start] + ottavaShift(index >= 0 ? q.ds.ott[index] ?? 0 : 0);
};
var percAt = (q, p) => {
  const pk = q.p.perc;
  return !pk ? null : pk.kind === "kit" ? percOf(128, 0, midiOf(p)) : pk.info;
};
var posD = (q, p, staff, index) => {
  const m = q.pmode;
  if (m && q.p.perc) {
    const pi = percAt(q, p);
    return m === "one" ? MID_LINE2 - (pi && pi.staff === 1 ? pi.line : 0) : TOP_LINE2 - (pi ? pi.line : 4);
  }
  return diatonicIndex(p) + shAt(q, staff, index);
};
var stemInput = (q, xOf) => {
  const pm = q.pmode, percHere = !!pm && !!q.p.perc, seq = [];
  for (const u of q.units) {
    if (u.kind === "bar" || u.kind === "key" || u.kind === "time") {
      seq.push(null);
      continue;
    }
    if (u.kind !== "chunk") continue;
    if (!u.note || u.base >= WHOLE) {
      seq.push(null);
      continue;
    }
    const ps = u.pitches.length ? u.pitches : [u.pitch], ds = ps.map((pp) => posD(q, pp, u.staff, u.index));
    seq.push({
      key: u,
      x: xOf(u),
      dHi: ds[0],
      dLo: ds[ds.length - 1],
      base: u.base,
      beat: Math.floor(u.inBar / u.beat),
      system: u.system,
      staff: u.staff,
      ghost: u.ghost,
      ...percHere && pm !== "one" && ps.some((p) => percAt(q, p)?.stem !== "down") ? { handUp: true } : {}
    });
  }
  return { seq, dir: q.v2 ? "down" : q.hasV2 ? "up" : percHere ? pm === "one" ? "up" : "kit" : "auto" };
};
var restW = (base) => base >= WHOLE ? W.restWhole : base >= TPQ * 2 ? W.restHalf : base >= TPQ ? W.restQuarter : base >= TPQ / 2 ? W.rest8th : base >= TPQ / 4 ? W.rest16th : W.rest32nd;
var COLUMN_KIND = { bar: "bar", nav: "nav", clef: "clef", key: "key", time: "time", tempo: "tempo", groove: "groove", dyn: "dyn", ottava: "ottava", hairpin: "hairpin", head: "tail", chunk: "note" };
function measureTrack(q) {
  const flagRight = /* @__PURE__ */ new Map();
  {
    const si = stemInput(q, () => 0.35);
    for (const [c, st] of layoutStems(si.seq, si.dir).notes) if (st.flag) flagRight.set(c, st.flag.x + FLAG_W[st.up ? "up" : "down"][st.flag.level - 1]);
  }
  const inkL = /* @__PURE__ */ new Map();
  const lane = (staff) => (staff - 1) * 2;
  const spItems = (u) => {
    const out = [], row = lane(u.staff);
    if (!u.note) {
      if (u.pad || q.v2 || u.mrest) return out;
      out.push({ row, left: -0.35, right: 0.35 + (u.dotted ? 1.5 + 0.45 : restW(u.base)), dur: u.ticks });
      return out;
    }
    const nhw = u.base >= WHOLE ? W.noteheadWhole : W.noteheadBlack, perc = !!q.pmode && !!q.p.perc;
    const ds = (u.pitches.length ? u.pitches : u.pitch ? [u.pitch] : []).map((pp) => posD(q, pp, u.staff, u.index));
    const second = ds.some((d, k) => k > 0 && Math.abs(ds[k - 1] - d) === 1);
    let right = 0.35 + nhw * (second ? 1.95 : 1), left = -0.35;
    if (u.dotted) right = Math.max(right, 0.35 + nhw + 0.3 + 0.45);
    const fr = flagRight.get(u);
    if (fr !== void 0) right = Math.max(right, fr);
    const nAcc = perc ? [] : u.accs.map((a, k) => a === null ? -1 : k).filter((k) => k >= 0);
    if (nAcc.length) left = 1.1 + (nAcc.some((k, i) => i > 0 && Math.abs(ds[nAcc[i - 1]] - ds[k]) < 3) ? 1.1 : 0);
    const ghost = u.art.includes("ghost");
    if (ghost) {
      left = nAcc.length ? left + 0.6 : Math.max(left, 0.15);
      right += 0.45;
    }
    if (u.art.includes("arpeggio")) left = Math.max(left, (nAcc.length ? 1.3 : 0) + 0.83);
    if (u.breath) right = Math.max(right, 0.35 + nhw + 0.55 + 0.85);
    if (u.breath && u.inhale) right = Math.max(right, 0.35 + nhw + 1.35 + (u.inhale === "big" ? 2.3 : 1.15));
    inkL.set(u, Math.max(0, left));
    out.push({ row, left, right, dur: u.ticks });
    if (u.lyW !== void 0 && !q.v2) out.push({ row: lane(q.staves) + 1, left: u.lyW / 2 - 0.94, right: 0.94 + u.lyW / 2 + 0.4 + (u.hyph ? 0.7 : 0) });
    return out;
  };
  const entries = q.units.map((u) => ({ tick: u.tick, slot: u.kind === "nav" ? u.slot : SLOT[COLUMN_KIND[u.kind]], w: u.w, ...u.kind === "bar" ? { bar: true } : {}, ...u.kind === "chunk" ? { chunk: { items: spItems(u), span: u.ticks } } : {}, ref: u }));
  return { entries, inkL };
}
var clefW = (q) => q.fFam ? W.fClef : W.gClef;
var lineStartWidth = (q, key, first, base) => base + 0.6 + clefW(q) + 1 + Math.abs(key) * 1.05 + (key ? 0.8 : 0) + (first ? timeWidth(q.head.time.beats, q.head.time.beatType) + 1.2 : 0.4);
var lyricAnchors = (q) => q.units.filter((u) => u.kind === "chunk" && !!u.lyric && u.lyric !== MELISMA_MARK).map((u) => ({ index: u.index, system: u.system, cx: u.x + 0.6, lyric: u.lyric, hyph: u.hyph }));

// src/singer/packs.gen.ts
var SINGER = { "voice": "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007", "runtime": "runtime-onnxruntime-web-1.30.0-20261001", "lang": { "ja": "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001", "zh": "lang-zh-pinyin-20261001", "en": "lang-en-cmudict-20261001" } };
var PACKS = {
  "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007": { "packId": "56d81c8eb51e693e937397e2557ac3af4dff328e420b761c6e5df8b8b5b80ca6", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 25165824, "name": "chunk-000", "sha256": "269d70de8efb9ef41cdfd5de0a4acd220eb263163c8d1586c2b627c8cb1eaec6" }, { "bytes": 14503410, "name": "chunk-001", "sha256": "56131bbd5133d34a5d7cf4bd668c83a2da1fe8157fbbb849a94c4d1b9569b4ff" }], "createdAt": "2026-10-07", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "piper-plus-voice", "sampleRate": 22050, "speakers": 1 }, "files": [{ "bytes": 39662905, "offset": 0, "path": "model.onnx", "sha256": "d10f3806abeda0ec9ee294d0e39ef5f3884c47b4b09028d23375b71db4107712" }, { "bytes": 6329, "offset": 39662905, "path": "config.json", "sha256": "f6a373726beef08f9094e97f434185b1f9840b76ced0a73281fc40023b02d02d" }], "lang": ["ja", "en", "zh", "es", "fr", "pt"], "license": { "attribution": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\uFF08CV.\u5922\u524D\u9ECE\uFF09https://tyc.rei-yumesaki.net/material/corpus/ \uFF1Bmodel: derivative of ayousanz/piper-plus-tsukuyomi-chan; zh/en language vectors from ayousanz/piper-plus-base (CC-BY-4.0)", "file": "LICENSE.txt", "name": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04\uFF08\u884D\u751F\u6A21\u578B\uFF1Bmodel card: license other / tsukuyomi-chan-corpus\uFF09+ base model CC-BY-4.0", "sha256": "ff76774a797dfedbd00d6b0b167cebf5ceb341d380d865ed4cba495310ace4d9" }, "name": "\u6708\u8BFB\uFF08\u4E2D\u82F1\u589E\u5F3A\uFF0C\u65F6\u957F\u53EF\u63A5\u7BA1\uFF09\u2014 \u3064\u304F\u3088\u307F\u3061\u3083\u3093 piper-plus \u516D\u8BED\u5355\u97F3\u8272\uFF0Cfp16\uFF0C\u4E2D\u82F1\u6539\u8BFB\u5E95\u6A21\u7684\u8BED\u8A00\u5411\u91CF + dur_override \u8F93\u5165\uFF08\u5531\u6B4C\u7528\uFF09", "notes": "Modified model (see LICENSE.txt \xA7[4]). Needs the runtime pack (onnxruntime-web) and one text-frontend pack per language. With dur_override all zeros it reads exactly like voice-tsukuyomi-chan-zhen-6lang-fp16-20261002. The credit block and the four prohibited uses must be shown in the product UI.", "sha256": "466803b3eba2be734c26955c1b701a7e64e566a3e997474c4c744666768e56f9", "slug": "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007", "source": { "converted": "dur_override input on top of voice-tsukuyomi-chan-zhen-6lang-fp16-20261002 (see LICENSE.txt \xA7[4]); all zeros = that pack, sample-identical", "file": "voice-tsukuyomi-chan-zhen-6lang-fp16-20261002/model.onnx @ sha256 ae7ab68a\u2026 + piper-plus/dur-override-exp/make_dur_override.py; config.json = that pack's", "model": "https://huggingface.co/ayousanz/piper-plus-tsukuyomi-chan" }, "task": "tts", "totalBytes": 39669234, "v": 1 } },
  "runtime-onnxruntime-web-1.30.0-20261001": { "packId": "f76668f9383b922aef483f4c0a374fb727b9a9203d230cb2fceabb34fc4459be", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 3687160, "name": "chunk-000", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "onnxruntime-web", "engineConfig": { "kind": "wasm-runtime", "version": "1.30.0" }, "files": [{ "bytes": 3687160, "offset": 0, "path": "ort-wasm-simd-threaded.wasm.gz", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788" }], "lang": [""], "license": { "attribution": "ONNX Runtime (Microsoft)", "file": "LICENSE.txt", "name": "MIT (Microsoft, onnxruntime)", "sha256": "2f07c72751aed99790b8a4869cf2311df85a860b22ded05fa22803587a48922c" }, "name": "onnxruntime-web 1.30.0\uFF08WASM \u63A8\u7406\u8FD0\u884C\u65F6\uFF0C\u5355\u7EBF\u7A0B SIMD\uFF09", "notes": "Engine binary. The matching JS glue (ort.wasm.bundle.min.mjs) is vendored in the app, not in this pack.", "sha256": "09e7a4d1376f589d6f6d4005d49db7d33b707175acb13e475c8a47858efdf788", "slug": "runtime-onnxruntime-web-1.30.0-20261001", "source": { "converted": "", "file": "dist/ort-wasm-simd-threaded.wasm (unmodified)", "model": "https://www.npmjs.com/package/onnxruntime-web/v/1.30.0" }, "task": "runtime", "totalBytes": 3687160, "v": 1 } },
  "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001": { "packId": "b66632d8ab153a865e2727d745794da248a9c748558920bfd004443cdb9f2d4c", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 24471527, "name": "chunk-000", "sha256": "3e1d7f8ff18204a56d4170da09258cf655bb01bb61114bcd84e8bb2441941b60" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "ja" }, "files": [{ "bytes": 22438129, "offset": 0, "path": "ja/sys.dic.gz", "sha256": "b1804e8c2e6244bb36c7c24eb5af9d4307a80acfb481dcffdc71c7aa60ede055" }, { "bytes": 1867237, "offset": 22438129, "path": "ja/matrix.bin.gz", "sha256": "824f60e50360fb2b186b16d1fe5fd6312919f03c33a73bc86ece37a301b3f0b8" }, { "bytes": 643, "offset": 24305366, "path": "ja/char.bin.gz", "sha256": "335d6f4a6c6cd50ab1d0782dbf6b13ab9e2bed08ed1fd34c97d499d4a05fb665" }, { "bytes": 782, "offset": 24306009, "path": "ja/unk.dic.gz", "sha256": "03721395b79e257fbd2b0e742a4faaed6073ecb79b0cf615fbe352995581b603" }, { "bytes": 147207, "offset": 24306791, "path": "ja/ojt.wasm.gz", "sha256": "97a8738abbdc773b4785b1f6ba849c432a5764cf13c1637df4da630a82f45f8a" }, { "bytes": 17529, "offset": 24453998, "path": "ja/nani-model.json.gz", "sha256": "0427c6cfe53f6c4d771f6c3e50fea06ddeaac96f5e24bdab4f49493395c9630a" }], "lang": ["ja"], "license": { "attribution": "Open JTalk (Nagoya Institute of Technology); MeCab (Taku Kudo, NTT); NAIST Japanese Dictionary; pyopenjtalk / pyopenjtalk-plus (tsukumijima et al.)", "file": "LICENSE.txt", "name": "Modified BSD (Open JTalk) + BSD (MeCab) + BSD-3-Clause style (NAIST-jdic / Open JTalk dictionary) + MIT (pyopenjtalk-plus)", "sha256": "b8dd3d66249df450fc71f3f8f8f29da02b5b01b8b47c03f412af8bc16090c1bb" }, "name": "\u65E5\u8BED\u6587\u672C\u524D\u7AEF\uFF08OpenJTalk + pyopenjtalk-plus \u8BCD\u5178\uFF09", "notes": "ojt.wasm is an engine binary built on 2026-10-01 from the upstream sources (wrapper source: backend/vendor/ojt/ojt_wasm.c). 160 MB initial heap.", "sha256": "3e1d7f8ff18204a56d4170da09258cf655bb01bb61114bcd84e8bb2441941b60", "slug": "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001", "source": { "converted": "", "file": "dictionary: wheel pyopenjtalk/dictionary/; ojt.wasm: built from the sdist (sha256 cdcb0746659857554c6dad23956cad77e21f76c9f3dfa000ea2f8d4f0ba11d99) with Emscripten 6.0.10; nani-model.json: exported from pyopenjtalk/yomi_model/", "model": "https://pypi.org/project/pyopenjtalk-plus/0.4.1.post9/" }, "task": "tts-frontend", "totalBytes": 24471527, "v": 1 } },
  "lang-zh-pinyin-20261001": { "packId": "a84c73d781c805a65b73deb3b39ac9f5fedd15f0cdf3d66b925005c8152af9e3", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 686220, "name": "chunk-000", "sha256": "acad023c61ddf4ed42720c63be1b35737cff734cbf4a6c8ab671b50f7fe39ae1" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "zh" }, "files": [{ "bytes": 186217, "offset": 0, "path": "zh/pinyin_single.tone3.json.gz", "sha256": "ec5c44ed3cd18eda41a04a7831f8d069600cdfb19e55e5b001a42bbdf3a4ad82" }, { "bytes": 500003, "offset": 186217, "path": "zh/pinyin_phrases.tone3.json.gz", "sha256": "43dd0534a63c6bddb4c0f20ee88f19f5933875ff3979acc777652028a66f5ba8" }], "lang": ["zh"], "license": { "attribution": "pypinyin, pinyin-data, phrase-pinyin-data (mozillazg)", "file": "LICENSE.txt", "name": "MIT (pypinyin / pinyin-data / phrase-pinyin-data)", "sha256": "82783f291266e986df7494586db072217e2940227f93208f4f920a53b7a7d91e" }, "name": "\u4E2D\u6587\u62FC\u97F3\u8BCD\u5178\uFF08pypinyin \u6570\u636E\uFF09", "notes": "Tone marks converted to tone-number style (the form the model's phoneme table expects).", "sha256": "acad023c61ddf4ed42720c63be1b35737cff734cbf4a6c8ab671b50f7fe39ae1", "slug": "lang-zh-pinyin-20261001", "source": { "converted": "", "file": "piper-plus 82ee4e7 src/rust/piper-plus-g2p/data/pinyin_{single,phrases}.json, tone marks converted to tone numbers", "model": "https://github.com/ayutaz/piper-plus" }, "task": "tts-frontend", "totalBytes": 686220, "v": 1 } },
  "lang-en-cmudict-20261001": { "packId": "e54e7243870cef39d5015a51fe7fc57917da946908223a3d5baa5cab85956226", "manifest": { "chunkBytes": 25165824, "chunks": [{ "bytes": 868090, "name": "chunk-000", "sha256": "21dc3f65ea440c904746ee1ee59a2e24c88aaf0696b1450b0aedcc001aca1926" }], "createdAt": "2026-10-01", "createdBy": "tools/pack.py (Claude Fable 5.1)", "engine": "piper-plus", "engineConfig": { "kind": "text-frontend", "lang": "en" }, "files": [{ "bytes": 863232, "offset": 0, "path": "en/cmudict_data.json.gz", "sha256": "3083a0cf26e01398a6877c8834150f03a230baf6965832b00bfae699063208f4" }, { "bytes": 4858, "offset": 863232, "path": "en/homographs.json.gz", "sha256": "2ef14b6d49476790fdb2008150d417cb9069f7dcb74c25706a43bcc3fe5c4187" }], "lang": ["en"], "license": { "attribution": "CMU Pronouncing Dictionary (Carnegie Mellon University); g2p-en (Kyubyong Park & Jongseok Kim)", "file": "LICENSE.txt", "name": "BSD-2-Clause style (CMU Pronouncing Dictionary) + Apache-2.0 (g2p-en homographs)", "sha256": "3d3a944042879fa3c5a25c317ea7e609c0efa7cf0900c0c298ba331953c27039" }, "name": "\u82F1\u8BED\u53D1\u97F3\u8BCD\u5178\uFF08CMUdict + \u540C\u5F62\u5F02\u97F3\u8868\uFF09", "notes": "homographs.json is a format conversion of g2p-en's homographs.en (Apache-2.0 \xA74: modified file notice).", "sha256": "21dc3f65ea440c904746ee1ee59a2e24c88aaf0696b1450b0aedcc001aca1926", "slug": "lang-en-cmudict-20261001", "source": { "converted": "", "file": "cmudict_data.json: piper-plus 82ee4e7 src/rust/piper-plus-g2p/data/; homographs.json: PyPI g2p-en 2.1.0 g2p_en/homographs.en converted to JSON (content unchanged)", "model": "https://github.com/ayutaz/piper-plus" }, "task": "tts-frontend", "totalBytes": 868090, "v": 1 } }
};
var CREDIT = { "credit": "\u672C\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u306E\u97F3\u58F0\u5408\u6210\u306B\u306F\u3001\u30D5\u30EA\u30FC\u7D20\u6750\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u300C\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u300D\uFF08\xA9 Rei Yumesaki\uFF09\u304C\u7121\u6599\u516C\u958B\u3057\u3066\u3044\u308B\u97F3\u58F0\u30C7\u30FC\u30BF\u3092\u4F7F\u7528\u3057\u3066\u3044\u307E\u3059\u3002\n\u25A0\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\uFF08CV.\u5922\u524D\u9ECE\uFF09\nhttps://tyc.rei-yumesaki.net/material/corpus/", "terms": "\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u306E\u58F0\u8CEA\u3092\u4F7F\u7528\u3059\u308B\u5834\u5408\u306F\u3001\u51FA\u529B\u3057\u305F\u97F3\u58F0\u3092\u6B21\u306E\u76EE\u7684\u3067\u4F7F\u7528\u3059\u308B\u3053\u3068\u3092\u7981\u6B62\u3057\u307E\u3059\u3002\n\u3010\u7981\u6B62\u4E8B\u9805\u3011\n\u25A0\u4EBA\u3092\u6279\u5224\u30FB\u653B\u6483\u3059\u308B\u3053\u3068\u3002\uFF08\u300C\u6279\u5224\u30FB\u653B\u6483\u300D\u306E\u5B9A\u7FA9\u306F\u3001\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u30E9\u30A4\u30BB\u30F3\u30B9\u306B\u6E96\u3058\u307E\u3059\uFF09\n\u25A0\u7279\u5B9A\u306E\u653F\u6CBB\u7684\u7ACB\u5834\u30FB\u5B97\u6559\u30FB\u601D\u60F3\u3078\u306E\u8CDB\u540C\u307E\u305F\u306F\u53CD\u5BFE\u3092\u547C\u3073\u304B\u3051\u308B\u3053\u3068\u3002\n\u25A0\u523A\u6FC0\u306E\u5F37\u3044\u8868\u73FE\u3092\u30BE\u30FC\u30CB\u30F3\u30B0\u306A\u3057\u3067\u516C\u958B\u3059\u308B\u3053\u3068\u3002\n\u25A0\u4ED6\u8005\u306B\u5BFE\u3057\u3066\u4E8C\u6B21\u5229\u7528\uFF08\u7D20\u6750\u3068\u3057\u3066\u306E\u5229\u7528\uFF09\u3092\u8A31\u53EF\u3059\u308B\u5F62\u3067\u516C\u958B\u3059\u308B\u3053\u3068\u3002", "termsUrl": "https://tyc.rei-yumesaki.net/material/corpus/", "attribution": ["ayousanz/piper-plus-tsukuyomi-chan \u2014 \u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04 (modified: zh / en language vectors)", "ayousanz/piper-plus-base \u2014 CC-BY-4.0 (zh / en language vectors)", "Open JTalk \xB7 MeCab \xB7 NAIST-jdic \xB7 pyopenjtalk-plus \xB7 CMUdict \xB7 g2p-en \xB7 pypinyin \xB7 ONNX Runtime"] };

// src/format/performance.ts
var TSUKUYOMI_CREDIT = {
  attribution: [CREDIT.credit, ...CREDIT.attribution],
  license: { name: _t("\u3064\u304F\u3088\u307F\u3061\u3083\u3093\u30B3\u30FC\u30D1\u30B9\u5229\u7528\u898F\u7D04\uFF08\u884D\u751F\u6A21\u578B\uFF09"), url: CREDIT.termsUrl, text: CREDIT.terms }
};
var TSUKUYOMI_MODEL = { pack: SINGER.voice, sha256: PACKS[SINGER.voice].packId };

// src/score/perform.ts
function hairpinEnd(tokens, i, bounds) {
  const pe = paperEndOf(i, tokens.length, bounds);
  for (let j = i + 1; j < pe; j++) {
    const k = tokens[j].kind;
    if (k === "dyn" || k === "hairpin") return { kind: k, at: j };
  }
  return { kind: "end", at: pe };
}
var paperEndOf = (i, n2, bounds) => {
  for (const b of bounds ?? []) if (b > i) return b;
  return n2;
};
function dynLevels(tokens, map, table, def, step, bounds) {
  const out = /* @__PURE__ */ new Map(), tl = timeline(tokens, map), at = new Map(tl.map((x) => [x.index, x]));
  const lo = Math.min(...Object.values(table)), hi = Math.max(...Object.values(table));
  const onsetFrom = (j, stop = tokens.length) => {
    for (let k = j; k < stop; k++) {
      const x = at.get(k);
      if (x) return x;
    }
    return null;
  };
  const endBefore = (j) => {
    for (let k = j - 1; k >= 0; k--) {
      const x = at.get(k);
      if (x) return x.t1;
    }
    return 0;
  };
  let cur = def, ramp = null;
  const lvl = (t) => ramp ? ramp.from + (ramp.to - ramp.from) * Math.max(0, Math.min(1, ramp.T1 > ramp.T0 ? (t - ramp.T0) / (ramp.T1 - ramp.T0) : 1)) : cur;
  for (let i = 0; i < tokens.length; i++) {
    if (ramp && i >= ramp.end) {
      cur = ramp.to;
      ramp = null;
    }
    const t = tokens[i];
    if (t.kind === "dyn") {
      if (!ramp) cur = table[t.value];
      const pe = paperEndOf(i, tokens.length, bounds), j = ramp ? -1 : rampTarget(tokens, i, pe), start = j >= 0 ? onsetFrom(i + 1, j) : null;
      if (j >= 0 && start) ramp = { from: cur, to: table[tokens[j].value], T0: start.t0, T1: onsetFrom(j, pe)?.t0 ?? endBefore(j), end: j };
      continue;
    }
    if (t.kind === "hairpin") {
      const e = hairpinEnd(tokens, i, bounds), start = onsetFrom(i + 1, e.at);
      if (!start) continue;
      const endVal = e.kind === "dyn" ? table[tokens[e.at].value] : null, oneStep = Math.max(lo, Math.min(hi, cur + (t.dir === "cresc" ? step : -step)));
      const agrees = endVal !== null && (t.dir === "cresc" ? endVal > cur : endVal < cur);
      const to = agrees ? endVal : oneStep;
      const T1 = e.kind === "end" ? endBefore(e.at) : onsetFrom(e.at, paperEndOf(i, tokens.length, bounds))?.t0 ?? endBefore(e.at);
      ramp = { from: cur, to, T0: start.t0, T1, end: e.at };
      continue;
    }
    const x = at.get(i);
    if (!x) continue;
    out.set(i, { at0: lvl(x.t0), at1: lvl(x.t1) });
    if (t.kind === "note" && !ramp && artOf(t).includes("fp")) cur = table.p;
  }
  return out;
}
function dynOverridden(tokens, bounds) {
  const out = /* @__PURE__ */ new Set();
  const T = { ppp: 0, pp: 1, p: 2, mp: 3, mf: 4, f: 5, ff: 6, fff: 7 };
  const fpNotes = /* @__PURE__ */ new Set();
  tokens.forEach((t, k) => {
    if (t.kind === "note" && artOf(t).includes("fp")) fpNotes.add(k);
  });
  if (!fpNotes.size) return out;
  const levels = (ts) => [...dynLevels(ts, void 0, T, 0, 0.5, bounds)].filter(([k]) => !fpNotes.has(k)).map(([k, l]) => `${k}:${l.at0}:${l.at1}`).join("|");
  let base = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind !== "dyn") continue;
    let j = i + 1;
    while (j < tokens.length && !isTimed(tokens[j])) j++;
    if (!fpNotes.has(j)) continue;
    base ??= levels(tokens);
    const alt = (v) => levels(tokens.map((x, k) => k === i ? { ...t, value: v } : x));
    if (alt(t.value === "pp" ? "ff" : "pp") === base && alt(t.value === "mf" ? "p" : "mf") === base) out.add(i);
  }
  return out;
}

// src/render/ornaments/index.ts
var PIN_GAP = 0.7;
var PIN_WORD = { w: { cresc: 4.7, dim: 3.5 } };
var DASH = { len: 0.6, gap: 1 };
var RAMP_DASH = { len: 0.5, gap: 0.4 };
var ZH_DYN = { em: 1.6, w: 1.6, up: 1.3, dn: 0.3 };
function tempoAt2(c, r, x0, v, cls, index, change, y) {
  const { P, tx, TR, RS, mw, prims, marks } = c;
  const fs = tx("tempo-word"), word = tempoWord(v).it, k = RS("tempo-word");
  if (change) prims.push({ t: "text", x: P(x0 - 0.3), y, s: change === "up" ? "\u2191" : "\u2193", cls: "tempo-change ann", size: fs, anchor: "end" });
  const ww = mw("tempo-word", word), num = `= ${v}`, nw = mw("tempo-num", num);
  prims.push({ t: "text", x: P(x0), y, s: word, cls: `${cls} tempo-word`, size: fs, anchor: "start" });
  const gx = x0 + ww + 0.7 * k;
  prims.push({ t: "glyph", x: P(gx), y: y - TR("tempo-word", 0.3), ch: GLYPH.metNoteQuarterUp, cls, size: fs * 1.75 });
  prims.push({ t: "text", x: P(gx + 1.3 * k), y, s: num, cls: `${cls} tempo-num`, size: fs, anchor: "start" });
  marks.push({ index, kind: "tempo", system: r, x: P(x0 - 0.3), y: y - TR("tempo-word", TEMPO_EM * 1.1), w: P(gx + 1.3 * k + nw + 0.6 * k - x0), h: TR("tempo-word", TEMPO_EM * 1.5) });
}
function layTempo(c, r, x0, v, cls, index, change) {
  c.attach(r, "tempo", () => {
    c.placeAbove(r, 0.5, (y) => tempoAt2(c, r, x0, v, cls, index, change, y));
  });
}
function layGroove(c, u) {
  const { P, tx, TR, mw, prims, dyns, tokens } = c;
  const gt = tokens[u.index], gr = c.row(u.system), label = grooveLabel(gt), known = !!grooveStyle(gt.style);
  const fs = tx("groove-mark"), gw = P(mw("groove-mark", label)), gx = P(u.x + 0.3);
  c.attach(gr, "groove", () => c.placeAbove(gr, 0.5, (gy) => {
    prims.push({ t: "text", x: gx, y: gy, s: label, tok: gt.id, cls: ["groove-mark", known ? "" : "groove-unknown"].filter(Boolean).join(" "), size: fs, anchor: "start" });
    dyns.push({ index: u.index, kind: "groove", system: gr, x: P(u.x), y: gy - TR("groove-mark", TEMPO_EM * 1.1), w: gw + TR("groove-mark", 0.6), h: TR("groove-mark", TEMPO_EM * 1.5) });
  }));
}
function layNav(c, u, repeatBarX) {
  const { P, tx, TR, mw, sp, prims, dyns, tokens, units, navMute } = c;
  const t = tokens[u.index], cls = "nav-mark" + navMute(u.index), tok = t.id, row0 = c.row(u.system);
  const fs = tx("nav-mark"), x = P(u.x + 0.4);
  if (t.what === "ending") {
    const ui = units.indexOf(u);
    let end = null, closed = false, fallback = null, sawNote = false;
    for (let k = ui + 1; k < units.length; k++) {
      const v = units[k];
      if (v.kind === "chunk") sawNote = true;
      if (v.kind === "bar" && (v.repeat === "end" || v.repeat === "both")) {
        end = v;
        closed = true;
        break;
      }
      if (v.kind === "nav" && tokens[v.index].what === "ending") {
        end = v;
        closed = true;
        break;
      }
      if (v.kind === "bar" && v.repeat === "start") {
        if (!fallback) fallback = v;
        break;
      }
      if (v.kind === "bar" && sawNote && !fallback) fallback = v;
    }
    if (!end) end = fallback;
    const h = TR("nav-mark", 1.6);
    const endX = (v, sys) => v && v.system === sys ? v.kind === "bar" ? repeatBarX(v) : P(v.x) - P(0.3) : P(c.right);
    const seg = (sys, xa, openL, xb, hookR, first) => {
      const rr = c.row(sys);
      c.attach(rr, "nav", () => c.placeAbove(rr, 0.6, (yy) => {
        prims.push({ t: "path", d: `${openL ? `M${xa},${yy}` : `M${xa},${yy + h}L${xa},${yy}`}L${xb},${yy}${hookR ? `L${xb},${yy + h}` : ""}`, cls: "volta" + navMute(u.index) });
        if (!first) return;
        prims.push({ tok, t: "text", x: x + TR("nav-mark", 0.3), y: yy + TR("nav-mark", 1.25), s: endingLabel(t.nums), cls, size: fs, anchor: "start" });
        dyns.push({ index: u.index, kind: "nav", system: row0, x: x - P(0.4), y: yy - TR("nav-mark", 0.4), w: TR("nav-mark", 3), h: h + TR("nav-mark", 0.8) });
      }));
    };
    const endSys = end ? end.system : u.system;
    seg(u.system, x - P(0.2), false, endX(endSys === u.system ? end : null, u.system), closed && endSys === u.system, true);
    for (let s2 = u.system + 1; s2 <= endSys; s2++) {
      const first = units.find((w) => w.system === s2);
      seg(s2, P((first?.x ?? MARGIN) - 0.3), true, endX(s2 === endSys ? end : null, s2), closed && s2 === endSys, false);
    }
    return;
  }
  if (t.what === "segno" || t.what === "coda") {
    const gs = 4 * sp * 0.7;
    c.attach(row0, "nav", () => c.placeAbove(row0, 0.6, (y) => {
      prims.push({ tok, t: "glyph", x, y, ch: t.what === "segno" ? "\uE047" : "\uE048", cls: cls.replace("nav-mark", "nav-sign"), size: gs });
      dyns.push({ index: u.index, kind: "nav", system: row0, x: x - P(0.3), y: y - gs * 0.8, w: gs * (t.what === "segno" ? 0.6 : 1), h: gs * 0.95 });
    }));
    return;
  }
  const label = NAV_LABEL[t.what], tw = P(mw("nav-word", label)), atEnd = x - tw > P(MARGIN + 6);
  c.attach(row0, "nav", () => c.placeAbove(row0, 0.6, (y) => {
    prims.push({ tok, t: "text", x: atEnd ? x : x - P(0.2), y, s: label, cls: cls + " nav-word", size: fs, anchor: atEnd ? "end" : "start" });
    dyns.push({ index: u.index, kind: "nav", system: row0, x: atEnd ? x - tw - P(0.3) : x - P(0.5), y: y - TR("nav-word", TEMPO_EM * 1.1), w: tw + TR("nav-word", 0.8), h: TR("nav-word", TEMPO_EM * 1.5) });
  }));
}
function layDynamics(c) {
  const { P, tx, prims, dyns, tokens, units, dynOff, o, notation } = c;
  const right = c.right;
  const dynOf = (v) => {
    const d = dynDepiction(v, notation, o.locale);
    if ("glyph" in d) return { ink: d.ink, draw: (x, y, tok, cls) => prims.push({ t: "glyph", x, y, ch: d.glyph, tok, cls }) };
    const w = [...d.text].length * ZH_DYN.w;
    return { ink: [0, w, ZH_DYN.up, ZH_DYN.dn], draw: (x, y, tok, cls) => prims.push({ t: "text", x, y, s: d.text, tok, cls: `${cls} jp-dyn`, size: P(ZH_DYN.em), anchor: "start" }) };
  };
  const dynItems = [];
  for (const u of units) {
    if (u.kind !== "dyn") continue;
    const dr = c.row(u.system), ui = units.indexOf(u), dd = dynOf(u.value), [il, ir, iu, id] = dd.ink;
    dynItems.push({ row: dr, x0: P(u.x + 0.3 + il), keys: [`${dr}|d${ui}`], draw: (dy) => {
      dd.draw(P(u.x + 0.3), dy, tokens[u.index].id, "dyn" + (dynOff.has(u.index) ? " art-mute" : ""));
      dyns.push({ index: u.index, kind: "dyn", system: dr, x: P(u.x + 0.3 + il - 0.3), y: dy - P(iu + 0.4), w: P(ir - il + 0.6), h: P(iu + id + 0.8) });
    } });
  }
  const LEVELS = DYNS;
  const lastChunk = [...units].reverse().find((u) => u.kind === "chunk");
  const dynKey = (u) => `${c.row(u.system)}|d${units.indexOf(u)}`;
  const wedgeKey = (index, sy) => `${c.row(sy)}|w${index}:${sy}`;
  const inkOf = (u) => dynOf(u.value).ink;
  const wedgeItems = (index, dir, s0, startX, s1, endX, ramp, k0, k1, tail) => {
    const leftOf2 = (sy) => Math.min(...units.filter((u) => u.kind === "chunk" && u.system === sy).map((ch) => c.noteX(ch)), P(right)) - P(1);
    const segs = [];
    for (let sy = s0; sy <= s1; sy++) segs.push([sy, sy === s0 ? startX : leftOf2(sy), sy === s1 ? endX : P(right) - P(0.3)]);
    const total = segs.reduce((n2, [, a, b]) => n2 + Math.max(0, b - a), 0) || 1, H = P(0.5), long = total > P(right - MARGIN);
    const word = dir === "cresc" ? "cresc." : "dim.", ww = P(PIN_WORD.w[dir === "cresc" ? "cresc" : "dim"]);
    let said = false, acc = 0, tailDone = false;
    segs.forEach(([sy, a0, b], i) => {
      if (b - a0 < P(0.3)) return;
      const row = c.row(sy), keys = [wedgeKey(index, sy)], last = i === segs.length - 1;
      if (i === 0 && k0) keys.push(k0);
      if (last && k1) keys.push(k1);
      if (last) tailDone = true;
      if (long) {
        const writeWord = !said && b - a0 >= ww + P(1);
        if (writeWord) said = true;
        dynItems.push({ row, x0: a0, keys, draw: (base) => {
          const midY = base - P(0.5);
          let a = a0;
          if (writeWord) {
            prims.push({ t: "text", x: a, y: midY + P(0.5), s: word, tok: tokens[index].id, cls: ["dyn-word", ramp ? "ramp" : ""].filter(Boolean).join(" "), size: tx("dyn-word"), anchor: "start" });
            a += ww + P(0.6);
          }
          for (let x = a; x + P(DASH.len) <= b; x += P(DASH.len + DASH.gap)) prims.push({ t: "line", x1: x, y1: midY, x2: x + P(DASH.len), y2: midY, w: P(0.12), cls: "dyn-dash" });
          dyns.push({ index, kind: "hairpin", system: row, x: a0, y: midY - P(1.4), w: b - a0, h: P(2.8) });
          if (last && tail) tail(base);
        } });
        return;
      }
      const f0 = acc / total, f1 = (acc + b - a0) / total;
      acc += b - a0;
      const [h0, h1] = dir === "cresc" ? [H * f0, H * f1] : [H * (1 - f0), H * (1 - f1)];
      dynItems.push({ row, x0: a0, keys, draw: (base) => {
        const y = base - P(0.5), a = a0;
        let d = `M${a},${y - h0}L${b},${y - h1}M${a},${y + h0}L${b},${y + h1}`;
        if (ramp) {
          const hAt = (x) => h0 + (h1 - h0) * ((x - a) / (b - a)), on = P(RAMP_DASH.len), per = P(RAMP_DASH.len + RAMP_DASH.gap);
          d = "";
          for (let x = a; x < b - P(0.05); x += per) {
            const x2 = Math.min(b, x + on);
            d += `M${x},${y - hAt(x)}L${x2},${y - hAt(x2)}M${x},${y + hAt(x)}L${x2},${y + hAt(x2)}`;
          }
        }
        prims.push({ tok: tokens[index].id, t: "path", d, cls: ["hairpin", ramp ? "ramp" : ""].filter(Boolean).join(" ") });
        dyns.push({ index, kind: "hairpin", system: row, x: a, y: y - P(1.4), w: b - a, h: P(2.8) });
        if (last && tail) tail(base);
      } });
    });
    if (!tailDone && tail) dynItems.push({ row: c.row(s1), x0: endX, keys: [wedgeKey(index, s1), ...k1 ? [k1] : []], draw: tail });
  };
  units.forEach((h, hi) => {
    if (h.kind !== "hairpin" || !lastChunk) return;
    const prevU = units[hi - 1];
    const dynBefore = prevU && prevU.kind === "dyn" && prevU.system === h.system ? prevU : null;
    const startX = Math.max(P(h.x + 0.3), dynBefore ? P(dynBefore.x + 0.3 + inkOf(dynBefore)[1] + PIN_GAP) : 0), s0 = h.system;
    const endU = units.slice(hi + 1).find((u) => u.kind === "dyn" || u.kind === "hairpin");
    let curDyn = "mf";
    for (let j = h.index - 1; j >= 0; j--) {
      const t = tokens[j];
      if (t.kind === "dyn") {
        curDyn = t.value;
        break;
      }
    }
    const ci = LEVELS.indexOf(curDyn), against = !!endU && endU.kind === "dyn" && (h.dir === "cresc" ? LEVELS.indexOf(endU.value) <= ci : LEVELS.indexOf(endU.value) >= ci);
    const IMPLIED_W = 3;
    const endX = endU ? P(endU.x + 0.3 + (endU.kind === "dyn" ? inkOf(endU)[0] : 0) - PIN_GAP - (against ? IMPLIED_W + 0.4 : 0)) : c.noteEnd(lastChunk) + P(0.8), s1 = endU ? endU.system : lastChunk.system;
    if (s1 < s0) return;
    let endXd = endX, labelAbove = false;
    const MIN_PIN = P(1.4);
    if (s1 === s0 && endXd - startX < MIN_PIN) {
      const roomy = against ? endXd + P(IMPLIED_W + 0.4) : endXd;
      if (against) labelAbove = true;
      endXd = Math.max(startX + MIN_PIN, Math.min(roomy, startX + MIN_PIN * 2));
    }
    const k1 = !endU ? void 0 : endU.kind === "dyn" ? dynKey(endU) : wedgeKey(endU.index, endU.system);
    const tail = !endU || against ? (base) => {
      const k = Math.max(0, Math.min(LEVELS.length - 1, ci + (h.dir === "cresc" ? 1 : -1)));
      prims.push({ t: "text", x: labelAbove ? endXd - P(1.2) : endXd + P(0.4), y: base + P(labelAbove ? -1.9 : 0.1), s: `(${LEVELS[k]})`, cls: "dyn-implied ann", size: tx("dyn-implied"), anchor: "start" });
    } : void 0;
    wedgeItems(h.index, h.dir, s0, startX, s1, endXd, false, dynBefore ? dynKey(dynBefore) : void 0, k1, tail);
  });
  for (const u of units) {
    if (u.kind !== "dyn" || !tokens[u.index].ramp) continue;
    const src = rampSource(tokens, u.index);
    if (typeof src !== "number") continue;
    const pu = units.find((x) => x.kind === "dyn" && x.index === src);
    if (!pu) continue;
    const a = LEVELS.indexOf(pu.value), b = LEVELS.indexOf(u.value);
    if (a === b) continue;
    const sx = P(pu.x + 0.3 + inkOf(pu)[1] + PIN_GAP);
    let ex = P(u.x + 0.3 + inkOf(u)[0] - PIN_GAP);
    if (u.system === pu.system && ex - sx < P(1.4)) ex = sx + P(1.4);
    if (u.system < pu.system) continue;
    wedgeItems(u.index, b > a ? "cresc" : "dim", pu.system, sx, u.system, ex, true, dynKey(pu), dynKey(u));
  }
  if (!dynItems.length) return;
  const parent = dynItems.map((_, i) => i), find = (i) => parent[i] === i ? i : parent[i] = find(parent[i]);
  const byKey = /* @__PURE__ */ new Map();
  dynItems.forEach((it, i) => {
    for (const k of it.keys) {
      const j = byKey.get(k);
      if (j === void 0) byKey.set(k, i);
      else parent[find(i)] = find(j);
    }
  });
  const chains = /* @__PURE__ */ new Map();
  dynItems.forEach((_, i) => {
    const root = find(i), l = chains.get(root);
    if (l) l.push(i);
    else chains.set(root, [i]);
  });
  const minX = (ch) => Math.min(...ch.map((i) => dynItems[i].x0));
  for (const ch of [...chains.values()].sort((a, b) => minX(a) - minX(b))) {
    const row = dynItems[ch[0]].row;
    c.attach(row, "dynamics", () => {
      c.placeAbove(row, 0.4, (y) => {
        for (const i of ch) dynItems[i].draw(y);
      });
    });
  }
}
function layNoteDynamics(c, row, _ch, a) {
  const { P, prims } = c, { cx, tok, cls, ign, swl, atk } = a;
  c.attach(row, "noteDynamics", () => c.placeAbove(row, 0.5, (y) => {
    let xa = a.x0;
    for (const k of atk) {
      const ch = k === "sfz" ? "\uE539" : "\uE534", w = P(GLYPH_BOX[ch]?.[1] ?? 2.6), gx = cx - w / 2;
      prims.push({ tok, t: "glyph", x: gx, y, ch, cls: ["dyn", ign.has(k) ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
      xa = Math.max(xa, gx + w + P(0.3));
    }
    if (!swl) return;
    const ym = y - P(0.5), xb = Math.max(xa + P(1.6), a.x0 + a.w - P(0.8)), H = P(0.35);
    const cl = ["hairpin", ign.has(swl === ">" ? "swellFade" : "swellGrow") ? "art-mute" : ""].filter(Boolean).join(" "), mx = (xa + xb) / 2;
    const d = swl === "<" ? `M${xb},${ym - H}L${xa},${ym}L${xb},${ym + H}` : swl === ">" ? `M${xa},${ym - H}L${xb},${ym}L${xa},${ym + H}` : `M${xa},${ym}L${mx},${ym - H}L${xb},${ym}M${xa},${ym}L${mx},${ym + H}L${xb},${ym}`;
    prims.push({ t: "path", d, cls: cl });
  }));
}

// src/render/frame/carets.ts
function caretStops(q, o) {
  const { tokens, units, realLen } = q, { cx, shiftAt, rowOf, P, cols, slots, heads } = o;
  const H = headLen(tokens);
  const firstUnitOf = /* @__PURE__ */ new Map();
  for (const u of units) if (u.kind !== "head" && u.index >= 0 && !firstUnitOf.has(u.index)) firstUnitOf.set(u.index, u);
  for (let c = H; c <= realLen; c++) {
    const u = c < tokens.length ? firstUnitOf.get(c) : void 0;
    const last = u ? null : [...units].reverse().find((v) => v.kind !== "head");
    const sys = u ? u.system : last ? last.system : 0, x = u ? cx(u) : last ? P(last.x + last.w) : P(o.sysStart0);
    for (let k = 0; k < q.staves; k++) slots.push({ caret: c, system: rowOf(sys, k), x });
  }
  for (let c = H; c <= realLen; c++) {
    const u0 = c < tokens.length ? firstUnitOf.get(c) : void 0;
    let sys, x;
    if (!u0) {
      const last = [...units].reverse().find((v) => v.kind !== "head");
      sys = last ? last.system : 0;
      x = last ? P(last.x + last.w) : P(o.sysStart0);
    } else if (u0.kind === "chunk") {
      sys = u0.system;
      x = cx(u0);
    } else {
      const T = u0.tick, ch = units.find((v) => v.kind === "chunk" && v.index >= c && Math.abs(v.tick - T) < 1e-6);
      if (ch) {
        sys = ch.system;
        x = cx(ch);
      } else {
        const same = units.filter((v) => v.kind !== "head" && v.index >= c && Math.abs(v.tick - T) < 1e-6), lastT = same[same.length - 1] ?? u0;
        sys = lastT.system;
        x = P(lastT.x + lastT.w);
      }
    }
    const sh = shiftAt(c);
    for (let k = 0; k < q.staves; k++) heads.push({ caret: c, system: rowOf(sys, k), x, shift: sh[k] });
  }
  for (const u of units) if (u.kind === "chunk" && u.pad && (u.inBar ?? 0) < 1e-6 && u.tick - q.realTicks > 1e-6) {
    const sh = shiftAt(realLen);
    for (let k = 0; k < q.staves; k++) {
      slots.push({ caret: realLen, system: rowOf(u.system, k), x: P(u.x), lead: u.tick - q.realTicks });
      heads.push({ caret: realLen, system: rowOf(u.system, k), x: P(u.x), shift: sh[k], lead: u.tick - q.realTicks });
    }
  }
  let lastSys = -1;
  for (let c = H; c < Math.min(tokens.length, realLen + 1); c++) {
    const u = firstUnitOf.get(c);
    if (!u) continue;
    const crossed = lastSys >= 0 && u.system > lastSys;
    lastSys = u.system;
    if (!crossed) continue;
    const prevRow = cols.filter((cc) => cc.system === u.system - 1);
    if (!prevRow.length) continue;
    const x = P(Math.max(...prevRow.map((cc) => cc.x + cc.w)));
    const sh = shiftAt(c);
    for (let k = 0; k < q.staves; k++) {
      slots.push({ caret: c, system: rowOf(u.system - 1, k), x, end: true });
      heads.push({ caret: c, system: rowOf(u.system - 1, k), x, shift: sh[k], end: true });
    }
  }
}

// src/render/staff/geometry.ts
var yAt = (staffTop, d, half) => staffTop + (TOP_LINE2 - d) * half;
var anchors = (staffTop, half) => ({ top: yAt(staffTop, TOP_LINE2, half), mid: yAt(staffTop, MID_LINE2, half), bottom: yAt(staffTop, BOTTOM_LINE, half) });

// src/render/staff/draw.ts
var STAFF_LANES = ["strength", "noteDynamics", "dynamics", "ottavaAbove", "nav", "tempo", "groove", "barNumber", "chordTag", "lyrics", "ottavaBelow"];
function drawStaff(c, mine) {
  const lyricParts = [];
  const own = mine ? new Set(mine) : null, skip = (r) => own !== null && !own.has(r);
  const { song, look, paper, o, P, tx, TR, RS, mw, sp, ts, put, hitRow, prims, notes, chordHeads, rests, lyrics, marks, dyns, clefs, keyHints, chordTagsOut, slots, heads, bars, rows, staffTop, lyricY, rowOf, placeAbove, placeBelow, attach, per, rowHost, pmode, measured, nSys, sysStarts, sysKeys, staffEnd, cols, right, ind0, indN, owner, prevBpm } = c;
  const yOf = (r, d) => yAt(staffTop(r), d, P(0.5));
  const clefAtSys = (q, s2) => {
    const u = q.units.find((x) => x.system === s2 && x.index >= 0);
    if (u) return q.ds.clef[u.index] ?? q.start;
    let c2 = q.start;
    for (const x of q.units) if (x.system < s2 && x.index >= 0) c2 = q.ds.clef[x.index] ?? c2;
    return c2;
  };
  const clefSrcAtSys = (q, s2) => {
    const u = q.units.find((x) => x.system === s2 && x.index >= 0), upto = u ? u.index : q.tokens.length - 1;
    for (let i = upto; i >= 0; i--) if (q.tokens[i]?.kind === "clef") return i;
    return -1;
  };
  const staffHit = (r) => ({ y: yOf(r, TOP_LINE2) - P(1.2), h: yOf(r, BOTTOM_LINE) - yOf(r, TOP_LINE2) + P(2.4) });
  const drawTime = (r, x0, beats, beatType, cls) => {
    const num = timeSigDigits(beats), den = timeSigDigits(beatType);
    const wn = [...num].length * W.timeSigDigit, wd = [...den].length * W.timeSigDigit, cw = Math.max(wn, wd);
    put(r, { t: "glyph", x: P(x0 + (cw - wn) / 2), y: yOf(r, 36), ch: num, cls });
    put(r, { t: "glyph", x: P(x0 + (cw - wd) / 2), y: yOf(r, 32), ch: den, cls });
    return cw;
  };
  const keyLabel = (r, x0, f, hint, index, minor = false) => {
    const y = staffTop(r) - P(0.8);
    if (hint) {
      keyHints.push({ system: r, index, x: P(x0), y, size: tx("key-hint"), s: keyText(f, minor) });
      return;
    }
    put(r, { t: "text", x: P(x0), y, s: keyText(f, minor), cls: "keysig key-label", size: tx("key-label"), anchor: "start" });
    marks.push({ index, kind: "key", system: r, x: P(x0 - 0.2), y: y - TR("key-label", TEMPO_EM * 0.95), w: TR("key-label", KEY_LABEL_W), h: TR("key-label", TEMPO_EM * 1.2) });
  };
  const drawKeySig = (r, x0, f, cls, clef = "G") => {
    const pos = f > 0 ? SHARP_POS : FLAT_POS, ch = f > 0 ? GLYPH.accidentalSharp : GLYPH.accidentalFlat, off = clef === "F" ? -2 : 0;
    for (let k = 0; k < Math.abs(f); k++) put(r, { t: "glyph", x: P(x0 + k * 1.05), y: yOf(r, pos[k] + off), ch, cls });
  };
  const ornCache = /* @__PURE__ */ new Map();
  const ornOf = (q, r, noteEnd) => {
    const hit = ornCache.get(r);
    if (hit && !noteEnd) return hit;
    const oc = {
      song,
      paper,
      o,
      notation: "staff",
      P,
      tx,
      TR,
      RS,
      mw,
      sp,
      prims,
      dyns,
      marks,
      placeAbove,
      attach,
      right,
      tokens: q.tokens,
      units: q.units,
      row: (sy) => rowOf(sy, r, 0),
      noteX: (ch) => P(ch.x + 0.35),
      noteEnd: noteEnd ?? ((ch) => P(ch.x + 0.35)),
      dynOff: dynOverridden(q.tokens),
      navMute: (i) => navWhy(song, paper, q.p.id, q.tokens[i]) ? " art-mute" : ""
    };
    ornCache.set(r, oc);
    return oc;
  };
  for (let s2 = 0; s2 < nSys; s2++) {
    const ind = s2 === 0 ? ind0 : indN;
    per.forEach((q, r) => {
      if (rowHost[r] >= 0 || skip(r)) return;
      const f = sysKeys[s2].get(q.p.id) ?? q.head.key;
      for (let k = 0; k < q.staves; k++) {
        const row = rowOf(s2, r, k), clef = q.staves === 2 ? k ? "F" : "G" : clefAtSys(q, s2), base = baseClef(clef);
        if (rows[row]) rows[row].x1 = P(staffEnd[s2]);
        const pm = pmode[r];
        for (let L = 0; L < 5; L++) {
          if (pm === "one" && L !== 2) continue;
          const y = yOf(row, BOTTOM_LINE + 2 * L);
          put(row, { t: "line", x1: P(MARGIN + ind), y1: y, x2: P(staffEnd[s2]), y2: y, w: P(ENGRAVE.staffLine), cls: "staff" });
        }
        let hx = MARGIN + ind + 0.6;
        if (pm) put(row, { t: "glyph", x: P(hx), y: yOf(row, MID_LINE2), ch: PERC_CLEF, cls: "clef perc-clef" });
        else put(row, { t: "glyph", x: P(hx), y: yOf(row, base === "F" ? 36 : 32), ch: CLEF_GLYPH[clef], cls: "clef" });
        if (!pm && !q.vrt) clefs.push({ kind: "start", paper: paper.id, part: q.p.id, index: clefSrcAtSys(q, s2), system: row, x: P(hx - 0.3), ...staffHit(row), w: P(clefW(q) + 0.6) });
        hx += clefW(q) + 1;
        const keyX0 = hx;
        const fk = pm ? 0 : f;
        drawKeySig(row, hx, fk, "keysig", base);
        hx += Math.abs(fk) * 1.05;
        if (s2 === 0) {
          if (q.head.idx.key !== void 0) marks.push({ index: q.head.idx.key, kind: "key", system: row, x: P(keyX0 - 0.3), ...staffHit(row), w: P(Math.max(1.2, hx - keyX0 + 0.3)) });
          const lab = k === 0 && !pm && q.head.idx.key !== void 0 ? look.inCActive ? q.head.real : fk === 0 || q.head.minor ? fk : null : null;
          if (lab !== null) keyLabel(row, keyX0 - 0.1, lab, !look.inCActive, q.head.idx.key, q.head.minor);
          if (fk) hx += 0.8;
          const cw = drawTime(row, hx, q.head.time.beats, q.head.time.beatType, "timesig");
          if (q.head.idx.time !== void 0) marks.push({ index: q.head.idx.time, kind: "time", system: row, x: P(hx - 0.3), ...staffHit(row), w: P(cw + 0.6) });
          if (k === 0 && q.p.id === owner && q.head.idx.tempo !== void 0) {
            const ti = q.head.idx.tempo;
            layTempo(ornOf(q, r), row, MARGIN + ind + 0.6, q.head.bpm, "tempo", ti, prevBpm === null || prevBpm === q.head.bpm ? void 0 : q.head.bpm > prevBpm ? "up" : "down");
          }
        }
      }
    });
  }
  per.forEach((q, r) => {
    if (skip(r)) return;
    const tokens = q.tokens, focused = q.focused, v2 = rowHost[r] >= 0;
    const units = q.units, tag = v2 ? { part: q.p.id } : {};
    const dynOff = dynOverridden(tokens);
    const clefOf = (staff, index = -1) => q.staves === 2 ? staff === 2 ? "F" : "G" : baseClef((index >= 0 ? q.ds.clef[index] : void 0) ?? q.start);
    const dIdx = (p, staff, index = -1) => posD(q, p, staff, index);
    const RW = (u) => rowOf(u.system, r, u.staff - 1);
    const lyricRow = (s2) => rowOf(s2, r, q.staves - 1);
    const navMute = (i) => navWhy(song, paper, q.p.id, tokens[i]) ? " art-mute" : "";
    const nhX = (c2) => P(c2.x + 0.35);
    const pm = pmode[r], percHere = !!pm && !!q.p.perc;
    const xHead = !!q.p.xHead && !percHere;
    const percHead = (c2, p) => {
      const pi = percAt(q, p), hd = (pi?.head === "custom" && pi.smufl ? PERC_SMUFL[pi.smufl] : void 0) ?? PERC_HEAD[pi?.head ?? "normal"] ?? PERC_HEAD.normal, k = c2.base >= WHOLE ? 2 : c2.base >= TPQ * 2 ? 1 : 0;
      return { ch: hd.ch[k], w: hd.w[k] };
    };
    const xOf = (c2) => xHead || !!c2.whisper;
    const nhW = (c2) => P(xOf(c2) ? c2.base >= WHOLE ? W.noteheadXWhole : c2.base >= TPQ * 2 ? W.noteheadXHalf : W.noteheadXBlack : percHere && c2.pitch ? percHead(c2, c2.pitch).w : c2.base >= WHOLE ? W.noteheadWhole : W.noteheadBlack);
    const whisperMute = (q.p.ignores ?? []).includes("whisper");
    const clsOf = (c2) => [c2.ghost ? "ghost" : "", c2.pad ? "pad-rest" : ""].filter(Boolean).join(" ") || void 0;
    const tokOf = (c2) => c2.index >= 0 && !c2.pad ? tokens[c2.index]?.id : void 0;
    const spots = [];
    lyricParts.push({ r, lrow: lyricRow, spots });
    const orn = ornOf(q, r, (ch) => nhX(ch) + nhW(ch));
    const drawChunk = (c2) => {
      const cls = clsOf(c2), row = RW(c2);
      if (!c2.note) {
        if (c2.pad || v2 || c2.mrest === "skip") return;
        if (c2.mrest === "draw") {
          const k = units.indexOf(c2);
          let L = sysStarts[c2.system] ?? c2.x, R = staffEnd[c2.system] ?? right;
          for (let i = k - 1; i >= 0; i--) {
            const v = units[i];
            if (v.system !== c2.system) break;
            if (v.kind === "chunk" || v.w <= 1e-6) continue;
            L = v.kind === "bar" ? v.x + (v.repeat ? v.w - 0.4 : 0.7) : v.x + v.w;
            break;
          }
          for (let i = k + 1; i < units.length; i++) {
            const v = units[i];
            if (v.system !== c2.system) break;
            if (v.kind === "bar") {
              R = v.x + 0.7;
              break;
            }
          }
          const rx = P((L + R) / 2 - W.restWhole / 2), ry2 = pm !== "one" ? yOf(row, 36) : yOf(row, MID_LINE2);
          put(row, { tok: tokOf(c2), t: "glyph", x: rx, y: ry2, ch: GLYPH.restWhole, cls: cls ? `rest ${cls}` : "rest" });
          if (c2.j === 0 && c2.index >= 0) rests.push({ index: c2.index, system: row, x: rx, y: yOf(row, MID_LINE2), w: P(1.2) });
          return;
        }
        const g = c2.base >= WHOLE ? GLYPH.restWhole : c2.base >= TPQ * 2 ? GLYPH.restHalf : c2.base >= TPQ ? GLYPH.restQuarter : c2.base >= TPQ / 2 ? GLYPH.rest8th : c2.base >= TPQ / 4 ? GLYPH.rest16th : GLYPH.rest32nd;
        const ry = c2.base >= WHOLE && pm !== "one" ? yOf(row, 36) : yOf(row, MID_LINE2);
        put(row, { tok: tokOf(c2), t: "glyph", x: P(c2.x + 0.35), y: ry, ch: g, cls: cls ? `rest ${cls}` : "rest" });
        if (c2.j === 0 && c2.index >= 0 && !c2.pad) rests.push({ index: c2.index, system: row, x: P(c2.x + 0.35), y: yOf(row, MID_LINE2), w: P(1.2) });
        if (c2.dotted) put(row, { tok: tokOf(c2), t: "glyph", x: P(c2.x + 0.35 + 1.5), y: yOf(row, 35), ch: GLYPH.augmentationDot, cls });
        return;
      }
      const ds = (c2.pitches.length ? c2.pitches : [c2.pitch]).map((pp) => dIdx(pp, c2.staff, c2.index));
      const d = ds[0], y = yOf(row, d), x0 = nhX(c2);
      c2.accs.forEach((a, k) => {
        if (a === null || percHere) return;
        const ag = a === 1 ? GLYPH.accidentalSharp : a === -1 ? GLYPH.accidentalFlat : a === 2 ? GLYPH.accidentalDoubleSharp : a === -2 ? GLYPH.accidentalDoubleFlat : GLYPH.accidentalNatural;
        const near = c2.accs.slice(0, k).some((b, kk) => b !== null && Math.abs(ds[kk] - ds[k]) < 3);
        put(row, { tok: tokOf(c2), t: "glyph", x: P(c2.x - 1.1) - (near ? P(1.1) : 0) - (c2.art.includes("ghost") ? P(0.6) : 0), y: yOf(row, ds[k]), ch: ag, cls });
      });
      const ledgers = /* @__PURE__ */ new Set();
      for (const dd of ds) {
        for (let L = 28; L >= dd; L -= 2) ledgers.add(L);
        for (let L = 40; L <= dd; L += 2) ledgers.add(L);
      }
      for (const L of ledgers) put(row, { t: "line", x1: x0 - P(ENGRAVE.ledgerExt), y1: yOf(row, L), x2: x0 + nhW(c2) + P(ENGRAVE.ledgerExt), y2: yOf(row, L), w: P(ENGRAVE.ledger), cls: "ledger" });
      const ng = xOf(c2) ? c2.base >= WHOLE ? GLYPH.noteheadXWhole : c2.base >= TPQ * 2 ? GLYPH.noteheadXHalf : GLYPH.noteheadXBlack : c2.base >= WHOLE ? GLYPH.noteheadWhole : c2.base >= TPQ * 2 ? GLYPH.noteheadHalf : GLYPH.noteheadBlack;
      let shifted = false;
      ds.forEach((dd, k) => {
        const second = k > 0 && Math.abs(ds[k - 1] - dd) === 1 && !shifted;
        shifted = second;
        const mute = k > 0 && !!q.p.mono;
        if (c2.j === 0 && k > 0) chordHeads.push({ ...tag, index: c2.index, system: row, x: second ? x0 + nhW(c2) * 0.95 : x0, y: yOf(row, dd), w: nhW(c2) });
        const hch = percHere && !xOf(c2) ? percHead(c2, (c2.pitches.length ? c2.pitches : [c2.pitch])[k]).ch : ng;
        put(row, { tok: tokOf(c2), t: "glyph", x: second ? x0 + nhW(c2) * 0.95 : x0, y: yOf(row, dd), ch: hch, cls: ["note", cls ?? "", mute ? "chord-mute" : "", c2.whisper && whisperMute ? "art-mute" : ""].filter(Boolean).join(" ") });
        if (c2.art.includes("ghost")) {
          const hx = second ? x0 + nhW(c2) * 0.95 : x0, pc2 = ["note-paren", cls ?? ""].filter(Boolean).join(" ");
          put(row, { tok: tokOf(c2), t: "glyph", x: hx - P(0.6), y: yOf(row, dd), ch: "\uE0F5", cls: pc2 });
          put(row, { tok: tokOf(c2), t: "glyph", x: hx + nhW(c2) + P(0.25), y: yOf(row, dd), ch: "\uE0F6", cls: pc2 });
        }
      });
      if (c2.dotted) put(row, { tok: tokOf(c2), t: "glyph", x: x0 + nhW(c2) + P(0.3), y: yOf(row, d % 2 === 0 ? d + 1 : d), ch: GLYPH.augmentationDot, cls });
      if (c2.j === 0) notes.push({ ...tag, index: c2.index, system: row, x: x0, y, w: nhW(c2), d: diatonicIndex(c2.pitch) });
      if (c2.j === 0 && !c2.tie) spots.push({ index: c2.index, sys: c2.system, row, cx0: x0 + nhW(c2) / 2, mx0: x0 - P(0.6), mx1: x0 + nhW(c2) + P(0.4), lyric: c2.lyric, tok: tokOf(c2), cls, mute: !!q.p.lyricMute?.has(tokens[c2.index]?.id ?? -1), hyph: !!tokens[c2.index].hyph });
    };
    for (const u of units) {
      const row = RW(u);
      if (u.kind === "dyn") continue;
      if (u.kind === "groove") {
        layGroove(orn, u);
        continue;
      }
      if (u.kind === "head") continue;
      if (v2 && (u.kind === "bar" || u.kind === "key" || u.kind === "time")) continue;
      if (u.kind === "bar" || u.kind === "key" || u.kind === "time") {
        for (let k = 0; k < q.staves; k++) {
          const rr = rowOf(u.system, r, k), clef = clefOf(k + 1, u.index), sh = clef === "F" ? 12 : 0;
          if (u.kind === "bar") bars.push({ system: rr, x: P(u.x + 0.7) });
          if (u.kind === "bar" && u.repeat) {
            put(rr, { t: "glyph", x: P(u.x + 0.4), y: yOf(rr, BOTTOM_LINE), ch: u.repeat === "start" ? "\uE040" : u.repeat === "end" ? "\uE041" : "\uE042", cls: "repeat-bar" + navMute(u.index), tok: tokens[u.index].id });
            if (u.times && u.times > 2 && k === 0) {
              const times = u.times, bx = P(u.x + 0.4 + (u.repeat === "both" ? 1.2 : 1.47)), cl = "nav-mark" + navMute(u.index);
              attach(rr, "nav", () => placeAbove(rr, 0.6, (y) => prims.push({ t: "text", x: bx, y, s: `\xD7${times}`, cls: cl, size: tx("nav-mark"), anchor: "end" })));
            }
          } else if (u.kind === "bar") {
            const bx = P(u.x + 0.7), bcls = u.auto ? "bar auto" : "bar";
            const [bt, bb] = pmode[r] === "one" ? [MID_LINE2 + 2, MID_LINE2 - 2] : [TOP_LINE2, BOTTOM_LINE];
            put(rr, { t: "line", x1: bx, y1: yOf(rr, bt), x2: bx, y2: yOf(rr, bb), w: P(ENGRAVE.thinBar), cls: bcls });
            if (u.style === "double") put(rr, { t: "line", x1: bx + P(0.45), y1: yOf(rr, bt), x2: bx + P(0.45), y2: yOf(rr, bb), w: P(ENGRAVE.thinBar), cls: bcls });
            if (u.style === "final") put(rr, { t: "line", x1: bx + P(0.6), y1: yOf(rr, bt), x2: bx + P(0.6), y2: yOf(rr, bb), w: P(0.5), cls: bcls });
            if (u.warn && k === 0) put(rr, { t: "rect", x: bx - P(0.3), y: yOf(rr, TOP_LINE2) - P(1.6), w: P(0.6), h: P(0.6), cls: "warn ann" });
          } else if (u.kind === "key") {
            if (pmode[r]) {
              marks.push({ index: u.index, kind: "key", system: rr, x: P(u.x), ...staffHit(rr), w: P(Math.max(u.w, 1.6)) });
              continue;
            }
            const cls = "keysig";
            if (u.fifths === 0) {
              const pos = u.prev > 0 ? SHARP_POS : FLAT_POS;
              for (let j = 0; j < Math.abs(u.prev); j++) put(rr, { t: "glyph", x: P(u.x + 0.4 + j * 0.8), y: yOf(rr, pos[j] - (sh ? 2 : 0)), ch: GLYPH.accidentalNatural, cls });
            } else drawKeySig(rr, u.x + 0.4, u.fifths, cls, clef);
            if (k === 0) {
              if (look.inCActive) keyLabel(rr, u.x + 0.2, u.real, false, u.index, u.minor);
              else if (u.fifths === 0 && u.prev === 0) keyLabel(rr, u.x + 0.2, 0, false, u.index, u.minor);
              else if (u.fifths === 0 || u.minor) keyLabel(rr, u.x + 0.2, u.fifths, true, u.index, u.minor);
            }
            marks.push({ index: u.index, kind: "key", system: rr, x: P(u.x), ...staffHit(rr), w: P(Math.max(u.w, 1.6)) });
          } else {
            const cls = "timesig";
            drawTime(rr, u.x + 0.6, u.beats, u.beatType, cls);
            marks.push({ index: u.index, kind: "time", system: rr, x: P(u.x), ...staffHit(rr), w: P(u.w) });
          }
        }
        continue;
      }
      if (u.kind === "tempo") {
        if (q.p.id === owner) layTempo(orn, row, u.x + 0.3, u.bpm, "tempo", u.index);
        continue;
      }
      if (u.kind === "hairpin") continue;
      if (u.kind === "nav") {
        layNav(orn, u, (v) => P(v.x + (v.kind === "bar" && v.repeat ? 0.4 + (v.repeat === "both" ? 1.2 : 1.47) : 0.7)));
        continue;
      }
      if (u.kind === "ottava") continue;
      if (u.kind === "clef") {
        if (q.staves === 2) continue;
        const first = !units.some((x) => x.system === u.system && x.index >= 0 && x.index < u.index && x.kind !== "ottava");
        const base = baseClef(u.clef), cls = "clef cue";
        if (!first) put(row, { t: "glyph", x: P(u.x + 0.35), y: yOf(row, base === "F" ? 36 : 32), ch: CLEF_GLYPH[u.clef], cls, size: P(4 * CLEF_CUE) });
        clefs.push({ kind: "mid", paper: paper.id, part: q.p.id, index: u.index, system: row, x: P(u.x), ...staffHit(row), w: P(Math.max(u.w, 1.6)) });
        continue;
      }
      drawChunk(u);
    }
    if (q.staves === 1) {
      const SIG = { 1: GLYPH.ottavaAlta, 2: GLYPH.quindicesimaAlta, [-1]: GLYPH.ottavaBassa };
      const SIG_W = { 1: 3.54, 2: 5.26, [-1]: 3.36 };
      for (let sy = 0; sy < nSys; sy++) {
        const row0 = rowOf(sy, r, 0);
        const us = units.filter((x) => x.system === sy && x.kind === "chunk").sort((a, b) => a.x - b.x);
        let k = 0;
        while (k < us.length) {
          const v = q.ds.ott[us[k].index] ?? 0;
          if (!v) {
            k++;
            continue;
          }
          const isAuto = !!q.ds.auto?.[us[k].index];
          let e = k;
          while (e + 1 < us.length && (q.ds.ott[us[e + 1].index] ?? 0) === v && !!q.ds.auto?.[us[e + 1].index] === isAuto) e++;
          const up = v > 0;
          {
            const sk = k, se = e;
            attach(row0, up ? "ottavaAbove" : "ottavaBelow", () => {
              const pl = up ? placeAbove : placeBelow;
              pl(row0, 0.6, (y) => {
                const k2 = sk, e2 = se;
                const prevIdx = us[k2].index - 1, cont = k2 === 0 && prevIdx >= 0 && (q.ds.ott[prevIdx] ?? 0) === v && units.some((x) => x.index >= 0 && x.index <= prevIdx && x.system < sy);
                const nextU = us[e2 + 1], lastIdx = us[e2].index, endsHere = !!nextU || (q.ds.ott[lastIdx + 1] ?? 0) !== v || lastIdx + 1 >= q.tokens.length || !units.some((x) => x.system > sy && x.index > lastIdx);
                const x0 = P(us[k2].x - 0.2), x1 = P(us[e2].x + us[e2].w - 0.3), sz = P(4 * 0.85), gw = P(SIG_W[v] * 0.85);
                const src = units.find((x) => x.kind === "ottava" && x.index <= us[k2].index && (q.ds.ott[x.index] ?? 0) === v && x.system === sy) ?? null;
                if (cont) prims.push({ t: "text", x: x0, y: y + P(0.5), s: `(${v === 2 ? "15ma" : v > 0 ? "8va" : "8vb"})`, cls: "ottava cont", size: tx("ottava"), anchor: "start" });
                else prims.push({ t: "glyph", x: x0, y: y + P(up ? 0.4 : 0.4), ch: SIG[v], cls: isAuto ? "ottava auto" : "ottava", size: sz });
                const lx = x0 + (cont ? P(4.2) : gw) + P(0.4), ly = y - P(up ? 0.55 : 0.55);
                for (let x = lx; x + P(0.6) <= x1; x += P(1)) prims.push({ t: "line", x1: x, y1: ly, x2: x + P(0.6), y2: ly, w: P(0.1), cls: "ottava-line" });
                if (endsHere) prims.push({ t: "line", x1, y1: ly, x2: x1, y2: ly + P(up ? 1.1 : -1.1), w: P(0.1), cls: "ottava-line" });
                const hitIdx = src ? src.index : (() => {
                  for (let i = us[k2].index; i >= 0; i--) if (q.tokens[i]?.kind === "ottava") return i;
                  return -1;
                })();
                const run2 = isAuto ? q.ds.runs.find((rr) => us[k2].index >= rr.from && us[k2].index <= rr.to) : void 0;
                if (q.vrt) {
                } else if (run2) clefs.push({ kind: "ottava", paper: paper.id, part: q.p.id, index: -1, run: run2, system: row0, x: x0, y: y - P(1.6), w: Math.max(gw, P(3)), h: P(2.2) });
                else if (hitIdx >= 0) clefs.push({ kind: "ottava", paper: paper.id, part: q.p.id, index: hitIdx, system: row0, x: x0, y: y - P(1.6), w: Math.max(gw, P(3)), h: P(2.2) });
              });
            });
          }
          k = e + 1;
        }
      }
    }
    const stemIn = stemInput(per[r], nhX);
    const stems = layoutStems(stemIn.seq, stemIn.dir, { u: sp, y: (d, n2) => yOf(RW(n2.key), d) });
    const upOf = /* @__PURE__ */ new Map();
    const tipOf = /* @__PURE__ */ new Map();
    const stemXOf = /* @__PURE__ */ new Map();
    for (const g of stems.groups) {
      for (const c2 of g.keys) {
        const st = stems.notes.get(c2);
        upOf.set(c2, st.up);
        tipOf.set(c2, st.tip);
        stemXOf.set(c2, st.x);
        put(RW(c2), { tok: tokOf(c2), t: "line", x1: st.x, y1: st.y0, x2: st.x, y2: st.tip, w: P(ENGRAVE.stem), cls: clsOf(c2) });
        if (st.flag) put(RW(c2), { tok: tokOf(c2), t: "glyph", x: st.flag.x, y: st.flag.y, ch: (st.up ? [GLYPH.flag8thUp, GLYPH.flag16thUp, GLYPH.flag32ndUp] : [GLYPH.flag8thDown, GLYPH.flag16thDown, GLYPH.flag32ndDown])[st.flag.level - 1], cls: clsOf(c2) });
      }
      for (const bm of g.beams) put(RW(g.keys[0]), { t: "path", d: `M${bm.xL},${bm.yL}L${bm.xR},${bm.yR}L${bm.xR},${bm.yR + bm.th}L${bm.xL},${bm.yL + bm.th}Z`, cls: ["beam", bm.ghost ? "ghost" : ""].filter(Boolean).join(" ") });
    }
    const rollMute = (q.p.ignores ?? []).includes("roll");
    for (const c2 of units) {
      if (c2.kind !== "chunk" || !c2.note || c2.index < 0) continue;
      const t = tokens[c2.index];
      if (t?.kind !== "note" || !(t.art ?? []).includes("roll")) continue;
      const st = stems.notes.get(c2), sx = stemXOf.get(c2);
      let cx2, cy;
      if (st && sx !== void 0) {
        cx2 = sx;
        cy = st.y0 + (st.tip - st.y0) * 0.55;
      } else {
        const ds = (c2.pitches.length ? c2.pitches : [c2.pitch]).map((pp) => dIdx(pp, c2.staff, c2.index));
        cx2 = nhX(c2) + nhW(c2) / 2;
        cy = yOf(RW(c2), Math.max(...ds)) - P(1.7);
      }
      const W2 = P(1.2), T = P(0.24), R = P(0.36), G2 = P(0.5), cls = ["roll", rollMute ? "art-mute" : "", clsOf(c2) ?? ""].filter(Boolean).join(" ");
      for (const k of [-1, 0, 1]) {
        const y = cy + k * G2;
        put(RW(c2), { tok: tokOf(c2), t: "path", d: `M${cx2 - W2 / 2},${y + R / 2}L${cx2 + W2 / 2},${y - R / 2}L${cx2 + W2 / 2},${y - R / 2 + T}L${cx2 - W2 / 2},${y + R / 2 + T}Z`, cls });
      }
    }
    const ign = new Set(q.p.ignores ?? []);
    const artEdge = /* @__PURE__ */ new Map();
    for (const c2 of units) {
      if (c2.kind !== "chunk" || !c2.note || !c2.art.length && !c2.breath) continue;
      const row = RW(c2), cls = clsOf(c2), cx2 = nhX(c2) + nhW(c2) / 2;
      const dsC = (c2.pitches.length ? c2.pitches : [c2.pitch]).map((pp) => dIdx(pp, c2.staff, c2.index)), dHi = dsC[0], dLo = dsC[dsC.length - 1];
      const below = upOf.get(c2) ?? false, sgn = below ? -1 : 1;
      const inStaff = (d2) => d2 >= BOTTOM_LINE && d2 <= TOP_LINE2;
      let d = below ? dLo - 2 : dHi + 2;
      const artCls = (a) => ["art", ign.has(a) ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ");
      for (const a of ["staccato", "tenuto"].filter((x) => c2.art.includes(x))) {
        if (inStaff(d) && d % 2 === 0) d += sgn;
        const m = ART_GLYPH[a], g = below ? m.below : m.above;
        const gy = yOf(row, d) + (below ? -P(m.h / 2) : P(m.h / 2));
        put(row, { tok: tokOf(c2), t: "glyph", x: cx2 - P(m.w / 2), y: gy, ch: g, cls: artCls(a) });
        artEdge.set(c2, { below, y: below ? gy + P(m.h) : gy - P(m.h) });
        d += sgn * 2;
      }
      const strong = ["accent", "marcato", "stress", "unstress"].filter((x) => c2.art.includes(x));
      if (strong.length) attach(row, "strength", () => {
        for (const a of strong) {
          const m = ART_GLYPH[a];
          placeAbove(row, 0.4, (y) => prims.push({ tok: tokOf(c2), t: "glyph", x: cx2 - P(m.w / 2), y, ch: m.above, cls: artCls(a) }));
        }
      });
      const swl = c2.j === 0 ? swellOf(tokens[c2.index]) : void 0;
      const atk = ["sfz", "fp"].filter((x) => c2.art.includes(x));
      if (swl || atk.length) layNoteDynamics(orn, row, c2, { cx: cx2, x0: nhX(c2), w: P(c2.w), tok: tokOf(c2), cls, ign, swl, atk });
      if (c2.art.includes("arpeggio")) {
        const yTop = yOf(row, dHi) - P(0.7), yBot = yOf(row, dLo) + P(0.7), x0 = nhX(c2) - P(c2.accW + 0.9), amp = P(0.28), step = P(0.5);
        let dd = `M${x0},${yBot}`;
        for (let y = yBot, k = 0; y > yTop; y -= step, k++) dd += `Q${x0 + (k % 2 ? -amp : amp) * 2},${y - step / 2} ${x0},${Math.max(yTop, y - step)}`;
        put(row, { tok: tokOf(c2), t: "path", d: dd, cls: ["arpeggio", ign.has("arpeggio") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
      }
      if (c2.breath) put(row, { tok: tokOf(c2), t: "glyph", x: nhX(c2) + nhW(c2) + P(0.55), y: yOf(row, TOP_LINE2 + 1), ch: GLYPH_BREATH, cls: ["breath", ign.has("breath") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" ") });
      if (c2.breath && c2.inhale) put(row, { tok: tokOf(c2), t: "text", x: nhX(c2) + nhW(c2) + P(1.35), y: yOf(row, TOP_LINE2 + 1) + P(0.45), s: c2.inhale === "big" ? _tIn(o.locale, "\u6DF1\u5438##\u8BB0\u53F7") : _tIn(o.locale, "\u5438##\u8BB0\u53F7"), cls: ["breath-label", ign.has("inhale") ? "art-mute" : "", cls ?? ""].filter(Boolean).join(" "), size: tx("breath-label"), anchor: "start" });
    }
    const tieArc = (row, d, x1, x2, ghost) => {
      const len = Math.abs(x2 - x1), sgn = d < MID_LINE2 ? 1 : -1, y = yOf(row, d) + sgn * P(0.8), h = Math.min(len * 0.25, Math.max(P(0.5), Math.min(P(1.6), len * 0.12)));
      put(row, { t: "path", d: `M${x1},${y}Q${(x1 + x2) / 2},${y + sgn * h} ${x2},${y}`, cls: ghost ? "tie ghost" : "tie" });
    };
    const tieBetween = (a, b) => {
      if (a.staff !== b.staff || !a.pitch || !b.pitch) return;
      const da = dIdx(a.pitch, a.staff, a.index), db = dIdx(b.pitch, b.staff, b.index);
      if (a.system === b.system) {
        tieArc(RW(b), db, nhX(a) + nhW(a) * 0.8, nhX(b) + nhW(b) * 0.2, b.ghost);
        return;
      }
      tieArc(RW(a), da, nhX(a) + nhW(a) * 0.8, Math.max(nhX(a) + nhW(a) * 0.8 + P(2), P(right) - P(0.3)), b.ghost);
      tieArc(RW(b), db, Math.max(P((sysStarts[b.system] ?? 0) - 1.6), nhX(b) - P(3)), nhX(b) + nhW(b) * 0.2, b.ghost);
    };
    const realChunks = units.filter((u) => u.kind === "chunk");
    for (let n2 = 1; n2 < realChunks.length; n2++) {
      const a = realChunks[n2 - 1], b = realChunks[n2];
      if (!a.note || !b.note) continue;
      if (b.j > 0 && a.index === b.index || b.tie && a.last) tieBetween(a, b);
    }
    const headOf = /* @__PURE__ */ new Map();
    for (const c2 of realChunks) if (c2.note && c2.j === 0 && !headOf.has(c2.index)) headOf.set(c2.index, c2);
    const noteIdx = [...headOf.keys()].sort((x, y) => x - y), slurOf = (k) => !!tokens[noteIdx[k]].slur;
    const ext = (c2, below) => {
      const ds = (c2.pitches.length ? c2.pitches : [c2.pitch]).map((pp) => dIdx(pp, c2.staff, c2.index));
      return yOf(RW(c2), below ? Math.min(...ds) : Math.max(...ds));
    };
    const ART_CLR = 0.5;
    const reach = (c2, below, head) => {
      const sgn = below ? 1 : -1, h = ext(c2, below) + sgn * P(head), a = artEdge.get(c2);
      return a && a.below === below ? below ? Math.max(h, a.y + P(ART_CLR)) : Math.min(h, a.y - P(ART_CLR)) : h;
    };
    for (let k = 0; k < noteIdx.length; k++) {
      if (!slurOf(k) || k > 0 && slurOf(k - 1)) continue;
      let e = k;
      while (e < noteIdx.length - 1 && slurOf(e)) e++;
      if (e === k) continue;
      const run2 = noteIdx.slice(k, e + 1).map((x) => headOf.get(x)).filter((c2) => c2.pitch), below = upOf.get(run2[0]) ?? false, sgn = below ? 1 : -1;
      const groups = [];
      for (const c2 of run2) {
        const g = groups[groups.length - 1];
        if (g && g[0].system === c2.system) g.push(c2);
        else groups.push([c2]);
      }
      groups.forEach((g, gi) => {
        const f = g[0], l = g[g.length - 1], openL = gi > 0, openR = gi < groups.length - 1;
        const xa = openL ? nhX(f) - P(2) : nhX(f) + nhW(f) / 2, xb = openR ? nhX(l) + nhW(l) + P(2) : nhX(l) + nhW(l) / 2;
        if (xb - xa < P(1)) return;
        const ya = reach(f, below, 1.2), yb = reach(l, below, 1.2);
        const peak = g.map((c2) => ext(c2, below) + sgn * P(2.2));
        let cy = below ? Math.max(ya, yb, ...peak) + P(0.6) : Math.min(ya, yb, ...peak) - P(0.6);
        const k1 = xa + (xb - xa) * 0.2, k2 = xb - (xb - xa) * 0.2;
        const bez = (t, p0, p1, p2, p3) => {
          const u = 1 - t;
          return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
        };
        for (const c2 of g.slice(1, -1)) {
          const a = artEdge.get(c2);
          if (!a || a.below !== below) continue;
          const x = nhX(c2) + nhW(c2) / 2;
          let lo = 0, hi = 1;
          for (let it = 0; it < 30; it++) {
            const m = (lo + hi) / 2;
            if (bez(m, xa, k1, k2, xb) < x) lo = m;
            else hi = m;
          }
          const t = (lo + hi) / 2, B = 3 * t * (1 - t), A = (1 - t) ** 3 * ya + t ** 3 * yb, need = reach(c2, below, 0);
          if (B > 1e-6) cy = below ? Math.max(cy, (need - A) / B) : Math.min(cy, (need - A) / B);
        }
        put(RW(f), { t: "path", d: `M${xa},${ya}C${xa + (xb - xa) * 0.2},${cy} ${xb - (xb - xa) * 0.2},${cy} ${xb},${yb}`, cls: ["slur", ign.has("slur") ? "art-mute" : ""].filter(Boolean).join(" ") });
      });
    }
    layDynamics(orn);
    if (look.chordTags && !v2 && !q.vrt) {
      const fs = tx("chord-tag");
      const theory = harmonyTheory(), tagged = new Map(harmonyTags(theory, { tokens, broken: look.chordsOf(q.p.id) !== "stacked" }).map((x) => [x.index, x.read]));
      for (const c2 of units) {
        if (c2.kind !== "chunk" || !c2.note || c2.j !== 0 || c2.index < 0 || c2.pad) continue;
        const t = tokens[c2.index];
        if (t?.kind !== "note" || !t.pitch) continue;
        const rd = tagged.get(c2.index);
        if (!rd) continue;
        const ds = (c2.pitches.length ? c2.pitches : [c2.pitch]).map((pp) => dIdx(pp, c2.staff, c2.index)), second = ds.some((dd, k) => k > 0 && Math.abs(ds[k - 1] - dd) === 1);
        const headR = nhX(c2) + nhW(c2) * (second ? 1.95 : 1), sx = stemXOf.get(c2), low = ds.some((dd) => dd < BOTTOM_LINE - 1);
        const atStem = sx !== void 0 && !(low && headR > sx + P(0.1));
        const label = theory.label(rd), tx2 = atStem ? sx - P(ENGRAVE.stem / 2) : headR + P(0.3), w = [...label].length * fs * 0.6 + TR("chord-tag", 0.6);
        const row = RW(c2), cls = `chord-tag${rd.pinned ? " is-pinned" : ""}${rd.stale ? " is-stale" : ""}`;
        attach(row, "chordTag", () => placeBelow(row, 0.3, (y) => {
          prims.push({ t: "text", x: tx2, y, s: label, cls, size: fs, anchor: "start" });
          chordTagsOut.push({ x: tx2 - TR("chord-tag", 0.3), y: y - fs * 1.05, w, h: fs * 1.4, read: rd, system: row, index: c2.index });
        }));
      }
    }
    const bracket = (cs, openL, openR, num) => {
      const row = RW(cs[0]), n2 = cs[0].ratio[0];
      const xa = openL ? Math.min(nhX(cs[0]) - P(1.2), nhX(cs[0])) : nhX(cs[0]), last = cs[cs.length - 1], xb = openR ? nhX(last) + nhW(last) + P(1.2) : nhX(last) + nhW(last);
      const top = Math.min(...cs.map((c2) => Math.min(c2.pitch ? yOf(row, dIdx(c2.pitch, c2.staff, c2.index)) : yOf(row, MID_LINE2), tipOf.get(c2) ?? Infinity)), yOf(row, TOP_LINE2)) - P(1.6);
      const mid = (xa + xb) / 2, gap = num ? P(1) : 0;
      const left = openL ? `M${xa},${top}` : `M${xa},${top + P(0.6)}L${xa},${top}`, right2 = openR ? `L${xb},${top}` : `L${xb},${top}L${xb},${top + P(0.6)}`;
      put(row, { t: "path", d: num ? `${left}L${mid - gap},${top}M${mid + gap},${top}${right2}` : `${left}${right2}`, cls: "tuplet-bracket" });
      if (num) put(row, { t: "glyph", x: mid - P(0.55), y: top + P(0.55), ch: GLYPH_TUPLET(n2), cls: "tuplet" });
    };
    let run = [], runRatio = null, acc = 0, minBase = Infinity, segStart = 0;
    const flushSeg = (openR) => {
      const cs = run.slice(segStart);
      if (cs.length && cs[0].ratio) bracket(cs, segStart > 0, openR, segStart === 0);
      segStart = run.length;
    };
    const closeRun = () => {
      if (run.length) flushSeg(false);
      run = [];
      runRatio = null;
      acc = 0;
      minBase = Infinity;
      segStart = 0;
    };
    for (const c2 of realChunks) {
      const rr = c2.ratio ? c2.ratio.join(":") : null;
      if (rr !== runRatio || run.length && c2.staff !== run[0].staff) closeRun();
      else if (run.length && c2.system !== run[run.length - 1].system) flushSeg(true);
      if (!rr) continue;
      run.push(c2);
      runRatio = rr;
      acc += c2.ticks;
      minBase = Math.min(minBase, c2.base);
      if (acc >= c2.ratio[1] * minBase - 1e-6) closeRun();
    }
    closeRun();
    const H = headLen(tokens), realLen = q.realLen;
    const inkL = measured[r].inkL, cx = (u) => {
      const k = u.kind === "chunk" ? inkL.get(u) : void 0;
      return P(u.x - (k ? k + 0.2 : 0));
    };
    const shiftAt = (c2) => {
      const kk = Math.min(c2, realLen) - 1, si = kk >= H ? kk : -1;
      return Array.from({ length: q.staves }, (_, k) => shAt(q, k + 1, si));
    };
    caretStops(q, { cx, shiftAt, rowOf: (sy, k) => rowOf(sy, r, k), P, sysStart0: sysStarts[0], cols, slots, heads });
  });
  return { lyricParts };
}

// src/render/staff/index.ts
function staffLooks(song, noAutoGrand) {
  const looks = resolveSongLooks(song, noAutoGrand);
  return (paperId, partId) => looks.get(paperId)?.get(partId);
}

// src/render/jianpu/glyphs.ts
var DIGIT_EM = 2.5;
var DIGIT_W = 1.4;
var BASE_Y = 2.95;
var DIGIT_TOP = 1.15;
var DIGIT_MID = 2.05;
var UL_Y0 = 3.35;
var UL_GAP = 0.3;
var UL_W = 0.11;
var DOT_R = 0.16;
var DOT_GAP = 0.3;
var DOT_STEP = 0.42;
var ACC_EM = 1.3;
var ACC_DX = 1;
var ACC_Y = 1.75;
var ACC_W = 0.95;
var DASH_L = 1;
var DASH_W = 0.13;
var DASH_Y = DIGIT_MID;
var DASH_PITCH = 2.4;
var AUG_DX = 0.35;
var AUG_R = 0.14;
var BAR_Y0 = 0.75;
var BAR_Y1 = 3.55;
var BAR_DX = 0.5;
var BAR_THIN = 0.12;
var BAR_THICK = 0.4;
var BAR_GAP = 0.35;
var BAR_W_J = 1.2;
var JP_BODY = { top: BAR_Y0, bottom: BAR_Y1 };
var MID_TEXT_EM = 1.4;
var MID_TEXT_CH = 0.62;
var BREATH_W = 0.35 + 0.9;
var INHALE_W = 2.2;
var dotPath = (cx, cy, r) => {
  const k = 0.5523 * r, f = (v) => (Math.round(v * 100) / 100).toString();
  return `M${f(cx + r)},${f(cy)}C${f(cx + r)},${f(cy + k)} ${f(cx + k)},${f(cy + r)} ${f(cx)},${f(cy + r)}C${f(cx - k)},${f(cy + r)} ${f(cx - r)},${f(cy + k)} ${f(cx - r)},${f(cy)}C${f(cx - r)},${f(cy - k)} ${f(cx - k)},${f(cy - r)} ${f(cx)},${f(cy - r)}C${f(cx + k)},${f(cy - r)} ${f(cx + r)},${f(cy - k)} ${f(cx + r)},${f(cy)}Z`;
};
var accText = (rel) => rel > 0 ? "\u266F".repeat(rel) : rel < 0 ? "\u266D".repeat(-rel) : "\u266E";

// src/render/jianpu/measure.ts
function extraGlyphs(u) {
  if (u.note) {
    if (u.j > 0 && u.base >= TPQ) return Math.max(0, Math.round(u.ticks / TPQ) - 1);
    if (u.base >= TPQ * 2) return Math.round(u.base / TPQ) - 1 + (u.dotted ? Math.round(u.base / (TPQ * 2)) : 0);
    return 0;
  }
  if (u.base >= TPQ) return Math.max(0, Math.floor(u.ticks / TPQ + 1e-6) - 1);
  return 0;
}
function hasAugDot(u) {
  if (u.note) return u.dotted && u.base < TPQ * 2 && !(u.j > 0 && u.base >= TPQ);
  return u.base >= TPQ ? Math.floor(u.ticks / TPQ + 1e-6) * TPQ < u.ticks - 1e-6 : u.dotted;
}
var underlines = (u) => u.base < TPQ ? Math.max(1, Math.round(Math.log2(TPQ / u.base))) : 0;
var COLUMN_KIND2 = { bar: "bar", nav: "nav", clef: "clef", key: "key", time: "time", tempo: "tempo", groove: "groove", dyn: "dyn", ottava: "ottava", hairpin: "hairpin", head: "tail", chunk: "note" };
var midTextW = (s2) => [...s2].length * MID_TEXT_CH * MID_TEXT_EM + 0.6;
function unitW(u) {
  switch (u.kind) {
    case "bar":
      return u.repeat ? BAR_W_J + 1 : u.style ? BAR_W_J + 0.5 : BAR_W_J;
    case "key":
      return midTextW("1=\u266DB");
    case "time":
      return midTextW(`${u.beats}/${u.beatType}`);
    case "clef":
    case "ottava":
      return 2.6;
    // 小灰标「谱号」/「8va」写得下（字号 1 sp，两个汉字 / 四个字母）
    default:
      return 0;
  }
}
function measureJianpu(q) {
  const inkL = /* @__PURE__ */ new Map();
  const spItems = (u) => {
    if (u.pad) return [];
    const n2 = extraGlyphs(u), acc = u.note && u.j === 0 && u.acc !== null;
    const breathW = u.note && u.breath ? BREATH_W + (u.inhale ? INHALE_W : 0) : 0;
    const left = acc ? ACC_W : -0.1, right = 0.1 + DIGIT_W + 0.15 + n2 * DASH_PITCH + (hasAugDot(u) ? AUG_DX + 2 * AUG_R + 0.1 : 0) + breathW;
    inkL.set(u, Math.max(0, left));
    const out = [{ row: 0, left, right, dur: u.ticks }];
    const cx = 0.1 + DIGIT_W / 2;
    if (u.lyW !== void 0) out.push({ row: 1, left: u.lyW / 2 - cx, right: cx + u.lyW / 2 + 0.4 + (u.hyph ? 0.7 : 0) });
    return out;
  };
  const entries = q.units.map((u) => ({ tick: u.tick, slot: u.kind === "nav" ? u.slot : SLOT[COLUMN_KIND2[u.kind]], w: u.kind === "chunk" ? u.w : unitW(u), ...u.kind === "bar" ? { bar: true } : {}, ...u.kind === "chunk" ? { chunk: { items: spItems(u), span: u.ticks } } : {}, ref: u }));
  return { entries, inkL };
}
var jianpuLineStart = (_q, _key, _first, base) => base + 0.6;
var jianpuLyricAnchors = (q) => q.units.filter((u) => u.kind === "chunk" && !!u.lyric && u.lyric !== MELISMA_MARK).map((u) => ({ index: u.index, system: u.system, cx: u.x + 0.1 + DIGIT_W / 2, lyric: u.lyric, hyph: u.hyph }));

// src/score/degree.ts
function toDegree(p, fifths) {
  const tonicD = 4 * 7 + tonicStepIndex(fifths), d = diatonicIndex(p) - tonicD;
  return { degree: (d % 7 + 7) % 7 + 1, shift: Math.floor(d / 7), acc: p.alter - keyAlter(p.step, fifths) };
}
function fewestDotsBase(shifts) {
  if (!shifts.length) return 0;
  const s2 = [...shifts].sort((a, b) => a - b), lo = s2[s2.length - 1 >> 1], hi = s2[s2.length >> 1];
  return lo <= 0 && hi >= 0 ? 0 : Math.abs(lo) <= Math.abs(hi) ? lo : hi;
}

// src/render/jianpu/draw.ts
var JIANPU_LANES = ["strength", "noteDynamics", "dynamics", "nav", "tempo", "groove", "barNumber", "chordTag", "lyrics"];
var jpGlyph = (a) => {
  const d = SIGNS[`art:${a}`]?.draw.jianpu;
  return d && d.kind === "glyph" ? { above: d.above, w: d.w ?? 1, h: d.h ?? 1 } : null;
};
var keyHead = (fifths, minor) => keyText(fifths, minor).replace(/=([A-G])([♭♯])$/, "=$2$1");
function drawJianpu(c, mine) {
  const lyricParts = [];
  const { song, paper, o, P, tx, put, notes, rests, marks, slots, heads, bars, rows, staffTop, rowOf, placeAbove, per, measured, nSys, sysStarts, staffEnd, cols, ind0 } = c;
  const Y = (row, v) => staffTop(row) + P(v);
  for (const r of mine) {
    const q = per[r], units = q.units, tokens = q.tokens;
    for (let s2 = 0; s2 < nSys; s2++) {
      const row = rowOf(s2, r, 0);
      if (rows[row]) rows[row].x1 = P(staffEnd[s2]);
    }
    const tokOf = (u) => u.index >= 0 && !u.pad ? tokens[u.index]?.id : void 0;
    const orn = {
      song,
      paper,
      o,
      notation: "jianpu",
      P,
      tx,
      TR: c.TR,
      RS: c.RS,
      mw: c.mw,
      sp: c.sp,
      prims: c.prims,
      dyns: c.dyns,
      marks,
      placeAbove,
      attach: c.attach,
      right: c.right,
      tokens,
      units,
      row: (sy) => rowOf(sy, r, 0),
      noteX: (ch) => P(ch.x + 0.1),
      noteEnd: (ch) => P(ch.x + 0.1 + DIGIT_W),
      dynOff: dynOverridden(tokens),
      navMute: (i) => navWhy(song, paper, q.p.id, tokens[i]) ? " art-mute" : ""
    };
    let f0 = q.head.key;
    const shifts = [];
    for (const u of units) {
      if (u.kind === "key") f0 = u.fifths;
      else if (u.kind === "chunk" && u.note && u.pitch && !u.pad) shifts.push(toDegree(u.pitch, f0).shift);
    }
    const base = fewestDotsBase(shifts);
    for (let s2 = 0; s2 < nSys; s2++) {
      const row = rowOf(s2, r, 0);
      if (rows[row]) rows[row].octBase = base;
    }
    const row0 = rowOf(0, r, 0), hx = P(MARGIN + ind0 + 0.6);
    const keyS = keyHead(q.head.key, q.head.minor), timeS = `${q.head.time.beats}/${q.head.time.beatType}`, hs = tx("tempo-num");
    const tempoHere = q.p.id === c.owner && q.head.idx.tempo !== void 0;
    c.attach(row0, "tempo", () => placeAbove(row0, 0.5, (y) => {
      const kw = P(midTextW(keyS)), tw = P(midTextW(timeS));
      put(row0, { t: "text", x: hx, y, s: keyS, cls: "jp-head", size: hs, anchor: "start" });
      put(row0, { t: "text", x: hx + kw, y, s: timeS, cls: "jp-head", size: hs, anchor: "start" });
      if (tempoHere) tempoAt2(orn, row0, MARGIN + ind0 + 0.6 + midTextW(keyS) + midTextW(timeS) + 0.6, q.head.bpm, "tempo", q.head.idx.tempo, c.prevBpm === null || c.prevBpm === q.head.bpm ? void 0 : q.head.bpm > c.prevBpm ? "up" : "down", y);
      if (q.head.idx.key !== void 0) marks.push({ index: q.head.idx.key, kind: "key", system: row0, x: hx - P(0.3), y: y - hs, w: kw, h: hs * 1.4 });
      if (q.head.idx.time !== void 0) marks.push({ index: q.head.idx.time, kind: "time", system: row0, x: hx + kw - P(0.3), y: y - hs, w: tw, h: hs * 1.4 });
    }));
    const spots = [];
    lyricParts.push({ r, lrow: (s2) => rowOf(s2, r, 0), spots });
    const ign = new Set(q.p.ignores ?? []);
    const artCls = (a, base2 = "art") => [base2, ign.has(a) ? "art-mute" : ""].filter(Boolean).join(" ");
    const arcAt = /* @__PURE__ */ new Map();
    const ul = [];
    let fifths = q.head.key;
    for (const u of units) {
      if (u.kind === "key") {
        fifths = u.fifths;
        const row2 = rowOf(u.system, r, 0), s2 = keyHead(u.fifths, u.minor), x = P(u.x + 0.3);
        put(row2, { tok: tokens[u.index]?.id, t: "text", x, y: Y(row2, BASE_Y - 0.3), s: s2, cls: "jp-head jp-mid", size: P(MID_TEXT_EM), anchor: "start" });
        marks.push({ index: u.index, kind: "key", system: row2, x: x - P(0.3), y: Y(row2, BASE_Y - 1.6), w: P(midTextW(s2)), h: P(2.2) });
        continue;
      }
      if (u.kind === "time") {
        const row2 = rowOf(u.system, r, 0), s2 = `${u.beats}/${u.beatType}`, x = P(u.x + 0.3);
        put(row2, { tok: tokens[u.index]?.id, t: "text", x, y: Y(row2, BASE_Y - 0.3), s: s2, cls: "jp-head jp-mid", size: P(MID_TEXT_EM), anchor: "start" });
        marks.push({ index: u.index, kind: "time", system: row2, x: x - P(0.3), y: Y(row2, BASE_Y - 1.6), w: P(midTextW(s2)), h: P(2.2) });
        continue;
      }
      if (u.kind === "bar") {
        const row2 = rowOf(u.system, r, 0), x = P(u.x + BAR_DX), y0 = Y(row2, BAR_Y0), y1 = Y(row2, BAR_Y1), tok2 = u.index >= 0 ? tokens[u.index]?.id : void 0;
        const line = (lx, w) => put(row2, { ...tok2 !== void 0 ? { tok: tok2 } : {}, t: "line", x1: lx, y1: y0, x2: lx, y2: y1, w: P(w), cls: "bar jp-bar" });
        if (u.style === "final" || u.repeat === "end") {
          line(x - P(BAR_GAP + BAR_THICK / 2), BAR_THIN);
          line(x, BAR_THICK);
        } else if (u.style === "double" || u.repeat) {
          line(x - P(BAR_GAP), BAR_THIN);
          line(x, BAR_THIN);
        } else line(x, BAR_THIN);
        const rdot = (dx) => {
          for (const yy of [DIGIT_MID - 0.55, DIGIT_MID + 0.55]) put(row2, { ...tok2 !== void 0 ? { tok: tok2 } : {}, t: "path", d: dotPath(x + P(dx), Y(row2, yy), P(0.15)), cls: "jp-dot repeat-dot" });
        };
        if (u.repeat === "start" || u.repeat === "both") rdot(0.4);
        if (u.repeat === "end" || u.repeat === "both") rdot(-(BAR_GAP + BAR_THICK + 0.4));
        if (u.repeat && u.times && u.times > 2) {
          const times = u.times, cl = "nav-mark" + orn.navMute(u.index);
          c.attach(row2, "nav", () => placeAbove(row2, 0.6, (yy) => c.prims.push({ t: "text", x: x - P(0.6), y: yy, s: `\xD7${times}`, cls: cl, size: tx("nav-mark"), anchor: "start" })));
        }
        bars.push({ system: row2, x });
        continue;
      }
      if (u.kind === "clef" || u.kind === "ottava") {
        const row2 = rowOf(u.system, r, 0), x = P(u.x + 0.2), t = tokens[u.index];
        const label = u.kind === "clef" ? _tIn(o.locale, "\u8C31\u53F7") : t.shift === 0 ? "loco" : t.shift === 2 ? "15ma" : t.shift > 0 ? "8va" : "8vb";
        put(row2, { tok: t.id, t: "text", x, y: Y(row2, 0.45), s: label, cls: "jp-staffonly ann", size: P(1), anchor: "start" });
        c.clefs.push({ kind: u.kind === "clef" ? "mid" : "ottava", paper: paper.id, part: q.p.id, index: u.index, system: row2, x: x - P(0.2), y: Y(row2, -0.5), w: P(2.6), h: P(1.3) });
        continue;
      }
      if (u.kind === "groove") {
        layGroove(orn, u);
        continue;
      }
      if (u.kind === "nav") {
        layNav(orn, u, (v) => P(v.x + BAR_DX));
        continue;
      }
      if (u.kind === "tempo") {
        if (q.p.id === c.owner) layTempo(orn, rowOf(u.system, r, 0), u.x + 0.3, u.bpm, "tempo", u.index);
        continue;
      }
      if (u.kind !== "chunk" || u.pad) continue;
      const row = rowOf(u.system, r, 0), tok = tokOf(u), x0 = P(u.x + 0.1), cx = x0 + P(DIGIT_W / 2), T = tok !== void 0 ? { tok } : {};
      const n2 = extraGlyphs(u), contDash = u.note && u.j > 0 && u.base >= TPQ;
      const tailW = (hasAugDot(u) ? AUG_DX + 2 * AUG_R + 0.1 : 0) + (u.note && u.breath ? BREATH_W + (u.inhale ? INHALE_W : 0) : 0);
      const step = n2 ? Math.max(DASH_PITCH, (u.w - tailW) / (n2 + 1)) : 0;
      const gx = (k) => cx + P(k * step);
      const small = u.art.includes("ghost");
      const digit = (x, s2) => put(row, { ...T, t: "text", x, y: Y(row, BASE_Y), s: s2, cls: u.ghost ? "jp-digit ghost" : small ? "jp-digit art-ghost" : "jp-digit", size: P(small ? DIGIT_EM * 0.72 : DIGIT_EM), anchor: "middle" });
      const dash = (x) => put(row, { ...T, t: "line", x1: x - P(DASH_L / 2), y1: Y(row, DASH_Y), x2: x + P(DASH_L / 2), y2: Y(row, DASH_Y), w: P(DASH_W), cls: "jp-dash" });
      const nUL = underlines(u);
      if (u.note && (u.ghost || !u.pitch)) {
        if (contDash) for (let k = 0; k <= n2; k++) dash(gx(k));
        else {
          digit(cx, "x");
          for (let k = 1; k <= n2; k++) dash(gx(k));
        }
        if (u.j === 0) notes.push({ index: u.index, system: row, x: x0, y: Y(row, DIGIT_MID), w: P(DIGIT_W), d: NaN });
        if (u.j === 0 && !u.tie) spots.push({ index: u.index, sys: u.system, row, cx0: cx, mx0: x0 - P(0.6), mx1: x0 + P(DIGIT_W) + P(0.4), lyric: u.lyric, tok, cls: "ghost", mute: !!q.p.lyricMute?.has(tokens[u.index]?.id ?? -1), hyph: !!tokens[u.index]?.hyph });
      } else if (u.note && u.pitch) {
        const d = toDegree(u.pitch, fifths), dots = d.shift - base;
        if (contDash) for (let k = 0; k <= n2; k++) dash(gx(k));
        else {
          digit(cx, String(d.degree));
          for (let k = 1; k <= n2; k++) dash(gx(k));
          if (u.j === 0 && u.acc !== null) put(row, { ...T, t: "text", x: cx - P(ACC_DX), y: Y(row, ACC_Y), s: accText(d.acc), cls: "jp-acc", size: P(ACC_EM), anchor: "middle" });
          for (let k = 0; k < Math.abs(dots); k++) {
            const yy = dots > 0 ? DIGIT_TOP - DOT_GAP - DOT_R - k * DOT_STEP : (nUL ? UL_Y0 + (nUL - 1) * UL_GAP : BASE_Y) + DOT_GAP + DOT_R + k * DOT_STEP;
            put(row, { ...T, t: "path", d: dotPath(cx, Y(row, yy), P(DOT_R)), cls: "jp-dot" });
          }
        }
        if (!contDash) {
          let top = dots > 0 ? DIGIT_TOP - DOT_GAP - DOT_R * 2 - (dots - 1) * DOT_STEP : DIGIT_TOP;
          for (const a of ["staccato", "tenuto"].filter((x) => u.art.includes(x))) {
            const g = jpGlyph(a);
            put(row, { ...T, t: "glyph", x: cx - P(g.w / 2), y: Y(row, top - 0.25), ch: g.above, cls: artCls(a) });
            top -= 0.25 + g.h;
          }
          arcAt.set(u, { row, cx, top });
          const strong = ["accent", "marcato", "stress", "unstress"].filter((x) => u.art.includes(x));
          if (strong.length) c.attach(row, "strength", () => {
            for (const a of strong) {
              const g = jpGlyph(a), k = a === "stress" ? 0.72 : 1;
              placeAbove(row, 0.4, (y) => c.prims.push({ ...T, t: "glyph", x: cx - P(g.w * k / 2), y, ch: g.above, cls: artCls(a), ...k !== 1 ? { size: P(4 * k) } : {} }));
            }
          });
          const swl = u.j === 0 ? swellOf(tokens[u.index]) : void 0, atk = ["sfz", "fp"].filter((x) => u.art.includes(x));
          if (swl || atk.length) layNoteDynamics(orn, row, u, { cx, x0, w: P(u.w), tok, cls: void 0, ign, swl, atk });
          if (u.whisper) put(row, { ...T, t: "text", x: cx + P(DIGIT_W * 0.55), y: Y(row, DIGIT_TOP + 0.5), s: "\xD7", cls: artCls("whisper", "jp-acc whisper"), size: P(ACC_EM), anchor: "start" });
          if (u.art.includes("roll")) for (let k = 0; k < 3; k++) {
            const yy = (nUL ? UL_Y0 + nUL * UL_GAP : BASE_Y) + 0.35 + (Math.min(0, dots) ? -dots * DOT_STEP + 0.2 : 0) + k * 0.28;
            put(row, { ...T, t: "line", x1: cx - P(0.4), y1: Y(row, yy + 0.18), x2: cx + P(0.4), y2: Y(row, yy - 0.18), w: P(0.11), cls: artCls("roll", "jp-roll") });
          }
        }
        if (u.j === 0) notes.push({ index: u.index, system: row, x: x0, y: Y(row, DIGIT_MID), w: P(DIGIT_W), d: NaN });
        if (u.j === 0 && !u.tie) spots.push({ index: u.index, sys: u.system, row, cx0: cx, mx0: x0 - P(0.6), mx1: x0 + P(DIGIT_W) + P(0.4), lyric: u.lyric, tok, cls: void 0, mute: !!q.p.lyricMute?.has(tokens[u.index]?.id ?? -1), hyph: !!tokens[u.index]?.hyph });
      } else if (!u.note) {
        for (let k = 0; k <= n2; k++) digit(gx(k), "0");
        if (u.j === 0 && u.index >= 0) rests.push({ index: u.index, system: row, x: x0, y: Y(row, DIGIT_MID), w: P(DIGIT_W) });
      }
      if (hasAugDot(u)) put(row, { ...T, t: "path", d: dotPath(gx(n2) + P(DIGIT_W / 2 + AUG_DX + AUG_R), Y(row, BASE_Y - 0.55), P(AUG_R)), cls: "jp-dot" });
      if (u.note && u.breath) {
        const bx = gx(n2) + P(DIGIT_W / 2 + (hasAugDot(u) ? AUG_DX + 2 * AUG_R : 0) + 0.35);
        put(row, { ...T, t: "text", x: bx, y: Y(row, DIGIT_TOP + 0.35), s: "V", cls: artCls("breath", "jp-acc breath"), size: P(ACC_EM), anchor: "start" });
        if (u.inhale) put(row, { ...T, t: "text", x: bx + P(1), y: Y(row, DIGIT_TOP + 0.35), s: u.inhale === "big" ? _tIn(o.locale, "\u6DF1\u5438##\u8BB0\u53F7") : _tIn(o.locale, "\u5438##\u8BB0\u53F7"), cls: artCls("inhale", "breath-label"), size: tx("breath-label"), anchor: "start" });
      }
      if (nUL) {
        const bar0 = u.tick - u.inBar;
        ul.push({ row, x0: x0 - P(0.05), x1: x0 + P(DIGIT_W + 0.05) + (hasAugDot(u) ? P(AUG_DX + 2 * AUG_R) : 0), level: nUL, group: `${u.system}|${bar0}|${Math.floor((u.inBar + 1e-6) / u.beat)}`, tok });
      }
    }
    const maxL = Math.max(0, ...ul.map((e) => e.level));
    for (let L = 1; L <= maxL; L++) {
      let i = 0;
      while (i < ul.length) {
        if (ul[i].level < L) {
          i++;
          continue;
        }
        let j = i;
        while (j + 1 < ul.length && ul[j + 1].level >= L && ul[j + 1].group === ul[i].group) j++;
        const a = ul[i], b = ul[j], y = Y(a.row, UL_Y0 + (L - 1) * UL_GAP);
        put(a.row, { ...i === j && a.tok !== void 0 ? { tok: a.tok } : {}, t: "line", x1: a.x0, y1: y, x2: b.x1, y2: y, w: P(UL_W), cls: "jp-ul" });
        i = j + 1;
      }
    }
    const arc = (a, b, cls, lift) => {
      const seg = (row, x1, x2, top) => {
        const y = Y(row, top - lift), len = Math.abs(x2 - x1), h = Math.min(len * 0.25, Math.max(P(0.4), Math.min(P(1.2), len * 0.12)));
        put(row, { t: "path", d: `M${x1},${y}Q${(x1 + x2) / 2},${y - h} ${x2},${y}`, cls });
      };
      if (a.row === b.row) seg(a.row, a.cx + P(0.3), b.cx - P(0.3), Math.min(a.top, b.top));
      else {
        seg(a.row, a.cx + P(0.3), P(c.right) - P(0.2), a.top);
        seg(b.row, b.cx - P(2.4), b.cx - P(0.3), b.top);
      }
    };
    const chunks = units.filter((v) => v.kind === "chunk" && v.note && !v.pad && arcAt.has(v));
    for (let i = 1; i < chunks.length; i++) {
      const b = chunks[i], a = chunks[i - 1];
      if (b.j > 0 && b.index === a.index || b.j === 0 && b.tie) arc(arcAt.get(a), arcAt.get(b), "tie jp-tie", 0.2);
    }
    for (let i = 0; i < chunks.length; i++) {
      const a = chunks[i];
      if (a.j !== 0 || !tokens[a.index]?.slur) continue;
      let j = i;
      while (j + 1 < chunks.length && (tokens[chunks[j].index]?.slur || chunks[j + 1].index === chunks[j].index)) j++;
      if (j > i) arc(arcAt.get(a), arcAt.get(chunks[j]), artCls("slur", "slur jp-slur"), 0.75);
      i = j;
    }
    {
      let run = [], acc = 0, minBase = Infinity;
      const flush = () => {
        if (run.length && run[0].ratio) {
          const first = run[0], last = run[run.length - 1], row = rowOf(first.system, r, 0), x1 = P(first.x + 0.1), x2 = last.system === first.system ? P(last.x + 0.1 + DIGIT_W) : P(c.right), mid = (x1 + x2) / 2;
          const top = Math.min(...run.map((v) => arcAt.get(v)?.top ?? DIGIT_TOP)) - 0.35, num = String(first.ratio[0]);
          put(row, { t: "text", x: mid, y: Y(row, top), s: num, cls: "tuplet jp-tuplet", size: P(1.1), anchor: "middle" });
          if (!run.some((v) => underlines(v))) put(row, { t: "path", d: `M${x1},${Y(row, top - 0.1)}L${x1},${Y(row, top - 0.45)}L${mid - P(0.45)},${Y(row, top - 0.45)}M${mid + P(0.45)},${Y(row, top - 0.45)}L${x2},${Y(row, top - 0.45)}L${x2},${Y(row, top - 0.1)}`, cls: "tuplet-bracket" });
        }
        run = [];
        acc = 0;
        minBase = Infinity;
      };
      for (const v of units) {
        if (v.kind !== "chunk" || v.pad) continue;
        const rr = v.ratio ? v.ratio.join(":") : null;
        if (!rr || run.length && run[0].ratio.join(":") !== rr) {
          flush();
          if (!rr) continue;
        }
        run.push(v);
        acc += v.ticks;
        minBase = Math.min(minBase, v.base);
        if (acc >= v.ratio[1] * minBase - 1e-6) flush();
      }
      flush();
    }
    layDynamics(orn);
    const inkL = measured[r].inkL;
    caretStops(q, { cx: (u) => {
      const k = u.kind === "chunk" ? inkL.get(u) : void 0;
      return P(u.x - (k ? k + 0.2 : 0));
    }, shiftAt: () => Array.from({ length: q.staves }, () => 0), rowOf: (sy, k) => rowOf(sy, r, k), P, sysStart0: sysStarts[0], cols, slots, heads });
  }
  return { lyricParts };
}

// src/render/jianpu/geometry.ts
var jianpuAnchors = (origin, half) => ({ top: origin + JP_BODY.top * 2 * half, mid: origin + (JP_BODY.top + JP_BODY.bottom) / 2 * 2 * half, bottom: origin + JP_BODY.bottom * 2 * half });

// src/render/notations.ts
var DRAWERS = {
  staff: { kind: "staff", measure: measureTrack, lineStart: lineStartWidth, lyricAnchors, draw: (c, mine) => drawStaff(c, mine), lanes: STAFF_LANES, anchors },
  // 数字行的行身 = 小节线那一段（jianpu/glyphs.ts JP_BODY；第四刀 4-5 起不再借五线谱的 0–4）
  jianpu: { kind: "jianpu", measure: measureJianpu, lineStart: jianpuLineStart, lyricAnchors: jianpuLyricAnchors, draw: (c, mine) => drawJianpu(c, mine), lanes: JIANPU_LANES, anchors: jianpuAnchors }
};
var jianpuCan = (q) => !q.vrt && !q.v2 && !q.hasV2 && !q.pmode && !q.p.perc && !q.p.xHead && !q.tokens.some((t) => t.kind === "note" && !!t.chord?.length);
var NOTATIONS2 = {
  staff: { id: "staff", home: "staff", rowKindOf: () => "staff" },
  jianpu: { id: "jianpu", home: "jianpu", rowKindOf: (q) => jianpuCan(q) ? "jianpu" : "staff" }
};
var BUILD = { looks: staffLooks, rows: staffRows, tracks: staffTracks };

// src/render/frame/lanes.ts
var INK_UP_TO = "nav";

// src/render/frame/arrange.ts
function mergeColumns(tracks) {
  const map = /* @__PURE__ */ new Map();
  tracks.forEach((tr2, t) => {
    const seen = /* @__PURE__ */ new Map();
    for (const e of tr2.entries) {
      const base = `${e.tick}:${e.slot}`, n2 = seen.get(base) ?? 0;
      seen.set(base, n2 + 1);
      const key = `${base}:${n2}`;
      let c = map.get(key);
      if (!c) {
        c = { tick: e.tick, slot: e.slot, n: n2, w: 0, bar: false, chunk: false, members: [] };
        map.set(key, c);
      }
      c.members.push({ track: t, entry: e });
      c.w = Math.max(c.w, e.w);
      if (e.bar) c.bar = true;
      if (e.chunk) c.chunk = true;
    }
  });
  return [...map.values()].sort((a, b) => a.tick - b.tick || a.slot - b.slot || a.n - b.n);
}
function arrangeColumns(cols, tracks, o) {
  const spCols = cols.map((c) => c.chunk ? { tick: c.tick, items: c.members.flatMap(({ track, entry }) => entry.chunk ? entry.chunk.items.map((it) => ({ ...it, row: tracks[track].laneBase + it.row })) : []) } : { tick: c.tick, fixed: c.w, items: [] });
  const spans = cols.flatMap((c) => c.members.flatMap(({ entry }) => entry.chunk ? [[entry.tick, entry.tick + entry.chunk.span]] : []));
  const breakableAt = (tick) => !spans.some(([a, b]) => a < tick - 1e-6 && b > tick + 1e-6);
  const gaps = idealGaps(spCols, o.paperLen, o.spacing), rodIx = indexRods(rodsOf(spCols, o.spacing), spCols.length);
  const brk = o.width, n2 = cols.length, lineFrom = [], sysStarts = [];
  const tail = (to) => cols[to - 1].bar ? 0 : o.endPad;
  const lineW = (from, to, s2) => placeLine(spCols, gaps, rodIx, from, to, s2).end + tail(to);
  const segs = [];
  for (let k = 0; k < n2; k++) if (k === n2 - 1 || cols[k].bar && breakableAt(cols[k].tick)) segs.push(k + 1);
  if (brk !== Infinity) {
    const fine = [];
    let from = 0;
    for (const end of segs) {
      let a = from;
      while (a < end && lineW(a, end, -o.squeeze) > brk - o.lineStart(a, a === 0)) {
        let k = a;
        while (k + 1 < end && lineW(a, k + 2, -o.squeeze) <= brk - o.lineStart(a, a === 0)) k++;
        fine.push(k + 1);
        a = k + 1;
      }
      if (a < end) fine.push(end);
      from = end;
    }
    segs.splice(0, segs.length, ...fine);
  }
  const segStart = (i) => i === 0 ? 0 : segs[i - 1];
  if (brk === Infinity || segs.length <= 1) lineFrom.push(0);
  else {
    const S2 = segs.length, best = new Array(S2 + 1).fill(Infinity), prev = new Array(S2 + 1).fill(-1);
    best[0] = 0;
    for (let i = 0; i < S2; i++) {
      if (best[i] === Infinity) continue;
      const from = segStart(i), avail = brk - o.lineStart(from, i === 0);
      for (let j = i + 1; j <= S2; j++) {
        const to = segs[j - 1], tight = lineW(from, to, -o.squeeze);
        if (tight > avail + 1e-6 && j > i + 1) break;
        const nat = lineW(from, to, 0), last = j === S2;
        const cost = nat > avail ? 400 * ((nat - avail) / avail) ** 2 : last ? 0 : 100 * ((avail - nat) / avail) ** 2;
        if (best[i] + cost + 2 < best[j]) {
          best[j] = best[i] + cost + 2;
          prev[j] = i;
        }
      }
    }
    const starts = [];
    for (let j = S2; j > 0; j = prev[j]) starts.push(segStart(prev[j]));
    lineFrom.push(...starts.reverse());
  }
  for (const k of lineFrom) sysStarts.push(o.lineStart(k, k === 0));
  const nSys = lineFrom.length, xs = new Array(n2).fill(0), ws = new Array(n2).fill(0), system = new Array(n2).fill(0);
  let prevStretch = 0;
  for (let s2 = 0; s2 < nSys; s2++) {
    const from = lineFrom[s2], to = s2 + 1 < nSys ? lineFrom[s2 + 1] : n2;
    if (from >= to) continue;
    const avail = brk - sysStarts[s2], nat = placeLine(spCols, gaps, rodIx, from, to, 0);
    const reach = nat.end > avail + 1e-6 ? avail : Math.min(avail, nat.end * o.maxStretch);
    let f = brk !== Infinity && (nat.end > avail + 1e-6 || s2 !== nSys - 1 && nat.end >= avail * 0.6) ? fitLine(spCols, gaps, rodIx, from, to, reach, { squeeze: o.squeeze, justify: true }) : nat;
    if (s2 === nSys - 1 && s2 > 0 && f === nat && prevStretch > 0 && brk !== Infinity) {
      const g = placeLine(spCols, gaps, rodIx, from, to, prevStretch);
      f = g.end <= avail + 1e-6 ? { ...g, stretch: prevStretch } : fitLine(spCols, gaps, rodIx, from, to, avail, { squeeze: o.squeeze, justify: true });
    }
    prevStretch = f.stretch ?? 0;
    for (let k = from; k < to; k++) {
      const x0 = sysStarts[s2] + f.xs[k - from], x1 = sysStarts[s2] + (k + 1 < to ? f.xs[k + 1 - from] : f.end);
      xs[k] = x0;
      system[k] = s2;
      ws[k] = Math.max(0, x1 - x0);
    }
  }
  return { lineFrom, sysStarts, xs, ws, system };
}

// src/render/engrave.ts
function engrave(song, o) {
  if (!o.locale) throw new Error("engrave: opts.locale is required (the layout never reads the page language itself)");
  const lookAt = BUILD.looks(song, new Set(o.parts.filter((p) => p.perc || p.xHead).map((p) => p.id)));
  const songLook = songViewOf(song);
  if (songLook.inCActive) {
    const perc = new Set(o.parts.filter((p) => p.perc).map((p) => p.id));
    song = songInC(song, (id) => perc.has(id));
  }
  const sp = o.sp, P = (v) => v * sp, ts = o.textScale ?? 1, T = (v) => v * sp * ts;
  const density = songLook.density;
  const PPAR = PAPER_PARAMS[songLook.notation][density];
  const PG = o.page ?? null, PAGE_GAP = 3, MX = o.page ?? o.margins ?? { l: 0, r: 0, t: 0, b: 1.5 };
  const pageTopY = (k) => P(k * ((PG?.h ?? 0) + PAGE_GAP));
  const contentTop = (k) => pageTopY(k) + P(PG?.t ?? 0), contentBottom = (k) => pageTopY(k) + P((PG?.h ?? 0) - (PG?.b ?? 0));
  let pageNo = 0;
  const TOP2 = P(MX.t);
  const SYS_GAP = PPAR.sysGap;
  const prims = [];
  if (o.__noAnn) {
    const push = prims.push.bind(prims);
    prims.push = (...ps) => push(...ps.filter((p) => !/(^|\s)ann(\s|$)/.test(p.cls ?? "")));
  }
  const autoBars = o.autoBars !== false;
  const baseRight = o.width / sp - MARGIN;
  let right = baseRight, sheetRight = baseRight;
  const PART_EM = TEXT_STYLES["part-name"].em, tx = (role) => textPx(role, sp, ts);
  const RS = (role) => TEXT_STYLES[role].ruler === "text" ? ts : 1, TR = (role, v) => v * sp * RS(role);
  const mw = (role, str) => o.measure.width(role, str, sp, ts);
  const nameW = (s2) => mw("part-name", s2);
  const NMAX = NAME_MAX * ts;
  const nameLines = (name, staves) => {
    if (nameW(name) <= NMAX) return [name];
    const toks = name.match(/[A-Za-z0-9'’.\-()&]+\s*|\s+|./gu) ?? [name], lines2 = [];
    let cur = "";
    for (const t of toks) {
      if (!cur.trim() || nameW((cur + t).trimEnd()) <= NMAX) cur += t;
      else {
        lines2.push(cur.trimEnd());
        cur = t.trimStart();
      }
    }
    if (cur.trim()) lines2.push(cur.trimEnd());
    const out = lines2.flatMap((l) => {
      if (nameW(l) <= NMAX) return [l];
      const latin = /^[A-Za-z0-9'’.\-()&]+$/.test(l), hy = latin ? "-" : "";
      const ps = [];
      let c = "";
      for (const ch of [...l]) {
        if (c && nameW(c + ch + hy) > NMAX) {
          ps.push(c);
          c = ch;
        } else c += ch;
      }
      if (c) ps.push(c);
      if (latin && ps.length > 1) {
        const last = ps.length - 1, need = 3 - [...ps[last]].length, prev = [...ps[last - 1]];
        if (need > 0 && prev.length > need + 2) {
          ps[last] = prev.slice(-need).join("") + ps[last];
          ps[last - 1] = prev.slice(0, -need).join("");
        }
        for (let k = 0; k < last; k++) ps[k] += hy;
      }
      return ps;
    });
    const max = staves === 2 ? 5 : 3;
    if (out.length > max) {
      out.length = max;
      let last = out[max - 1];
      while (last && nameW(`${last}\u2026`) > NMAX) last = [...last].slice(0, -1).join("");
      out[max - 1] = `${last}\u2026`;
    }
    return out;
  };
  const titleSize = tx("song-title"), titleBase = TOP2 + T(TITLE_H * 0.62);
  const titleLines = song.title ? wrapTitle(song.title, (t) => P(mw("song-title", t)) * 1.08, o.width - P(2 * (MARGIN + CTL_H + 1))) : [];
  const titleLH = titleSize * 1.2, titleExtra = Math.max(0, titleLines.length - 1) * titleLH;
  titleLines.forEach((t, k) => prims.push({ t: "text", x: o.width / 2, y: titleBase + k * titleLH, s: t, cls: "song-title", size: titleSize, anchor: "middle" }));
  const title = { x: P(MARGIN), y: TOP2 + T(0.3), w: o.width - P(2 * MARGIN), h: T(TITLE_H) + titleExtra, baseline: titleBase, size: titleSize };
  const lines = song.credits ? song.credits.split("\n") : [];
  let credits = null;
  const cs = tx("credits"), rx = o.width - P(MARGIN), y0 = TOP2 + T(TITLE_H + 1) + titleExtra;
  if (lines.length) {
    lines.forEach((s2, k) => prims.push({ t: "text", x: rx, y: y0 + k * cs * 1.35, s: s2, cls: "credits", size: cs, anchor: "end" }));
    const w = Math.max(...lines.map((s2) => P(mw("credits", s2)))) + T(0.6);
    credits = { x: rx - w, y: y0 - cs * 1.1, w: w + T(0.3), h: cs * 1.35 * lines.length + cs * 0.4 };
  }
  let arrangement = null, arrLast = 0;
  if (!o.onlyPaper) {
    const as = tx("arr"), wOf = (role, t) => P(mw(role, t)), row = Math.max(lines.length, 1), base = y0 + row * cs * 1.35;
    const arr = parseArrangement(song.arrangement, song.papers, o.locale), txt = song.arrangement?.trim() ?? "";
    const label = _tIn(o.locale, "\u7F16\u6392\u3000"), lw = wOf("arr-label", label), x0 = P(MARGIN) + lw, avail = o.width - P(2 * MARGIN) - lw;
    if (txt) prims.push({ t: "text", x: P(MARGIN), y: base, s: label, cls: "arr-label", size: as, anchor: "start" });
    arrLast = base;
    if (txt) {
      prims.push({ t: "text", x: x0, y: base, s: txt, cls: "arr", size: as, anchor: "start" });
      if (arr.issues.length) {
        const why = `\xB7 ${arr.issues[0].why}${arr.issues.length > 1 ? _tIn(o.locale, " \u7B49 {n} \u5904", { n: arr.issues.length }) : ""}`, tw = wOf("arr", txt) + T(0.8), fits = tw + wOf("arr-issue", why) <= avail;
        prims.push({ t: "text", x: fits ? x0 + tw : x0, y: fits ? base : base + cs * 1.35, s: why, cls: "arr-issue ann", size: tx("arr-issue"), anchor: "start" });
        if (!fits) arrLast = base + cs * 1.35;
      }
    }
    arrangement = { x: x0 - T(0.3), y: base - as * 1.15, w: avail + T(0.3), h: as * 1.6, baseline: base, size: as };
  }
  let yCur = Math.max(TOP2 + T(TITLE_H + 0.5) + titleExtra, credits && lines.length ? credits.y + credits.h + T(0.3) : 0, arrangement ? arrLast + T(0.8) : 0);
  const ensure = (h) => {
    if (PG && yCur + h > contentBottom(pageNo) && yCur > contentTop(pageNo) + 1) {
      pageNo++;
      yCur = contentTop(pageNo);
    }
  };
  const bars = [];
  const chordHeads = [];
  const chordTagsOut = [];
  const sharedRows = [], virtualOut = {}, measures = [], families = [];
  const rows = [], notes = [], slots = [], heads = [], lyrics = [], marks = [], dyns = [], rests = [], clefs = [];
  const partsHit = [], papersHit = [], names = [], keyHints = [];
  let shortBars = 0;
  const rowTop = /* @__PURE__ */ new Map();
  const rowAbove = /* @__PURE__ */ new Map(), lyricOff = /* @__PURE__ */ new Map();
  const staffTop = (r) => rowTop.get(r) + P(rowAbove.get(r) ?? 0);
  const anc = (r) => DRAWERS[rows[r].kind].anchors(staffTop(r), P(0.5));
  const body = (r) => DRAWERS[rows[r].kind].anchors(0, 0.5);
  const rowPar = (r) => ROW_PARAMS[rows[r].kind][density];
  const lyricY = (r) => anc(r).bottom + P(lyricOff.get(r) ?? rowPar(r).lyricBelow);
  const showPaperLine = song.papers.length > 1 || song.papers.some((p) => p.name);
  let drawn = 0;
  const underOf = (paper) => {
    const h = o.chrome?.underPaper;
    if (!h || PG || paper.hidden && !o.onlyPaper) return void 0;
    let low = yCur;
    rows.forEach((r, k) => {
      if (r.paper === paper.id) low = Math.max(low, lyricY(k) + T(1.2));
    });
    const box = { x: P(MARGIN), y: low + T(1), w: P(right) - P(MARGIN), h: T(h) };
    yCur = box.y + box.h + T(0.4);
    return box;
  };
  song.papers.forEach((paper, paperK) => {
    const before = drawn;
    drawPaper(paper, paperK);
    if (drawn > before) {
      const u = underOf(paper);
      if (u) papersHit[papersHit.length - 1].under = u;
    }
  });
  let tailBottom = 0, tail = null;
  const lastPaper = song.papers.at(-1);
  if (o.chrome?.tail && lastPaper && !(o.onlyPaper && !PG)) {
    const h = T(o.chrome.tail), paperId = o.onlyPaper ?? lastPaper.id;
    if (PG) {
      tail = { paper: paperId, x: P(MARGIN), y: pageTopY(pageNo) + P(PG.h) + P(1.2), w: P(baseRight - MARGIN), h };
      tailBottom = tail.y + h + P(1);
    } else {
      tail = { paper: lastPaper.id, x: P(MARGIN), y: yCur + P(0.6), w: P(baseRight - MARGIN), h };
      yCur = tail.y + h + P(0.4);
    }
  }
  function drawPaper(paper, paperK) {
    right = baseRight;
    if (o.onlyPaper && paper.id !== o.onlyPaper) return;
    if (paper.hidden && !o.onlyPaper) {
      papersHit.push({ id: paper.id, title: { x: 0, y: yCur, w: 0, h: 0, baseline: yCur, size: 0, shown: false }, top: yCur, bottom: yCur, hidden: true, hiddenParts: [] });
      return;
    }
    if (drawn++ > 0) yCur += P(PAPER_GAP);
    const owner = tempoOwner(song, paper), prevPaper = song.papers.slice(0, paperK).reverse().find((x) => !x.hidden), prevBpm = prevPaper ? sheetEndBpm(song, prevPaper) : null;
    const paperTop = yCur;
    const pSize = tx("paper-name");
    const pTitle = { x: P(MARGIN), y: yCur, w: o.width - P(2 * MARGIN) - T(o.chrome?.navRoom && song.papers.length > 1 ? o.chrome.navRoom : 4), h: T(PAPER_H), baseline: 0, size: pSize, shown: showPaperLine };
    const drawPaperTitle = (firstBlock) => {
      if (!showPaperLine) return;
      ensure(T(PAPER_H) + firstBlock);
      const pBase = yCur + T(PAPER_H * 0.68);
      pTitle.y = yCur;
      pTitle.baseline = pBase;
      if (paper.name) prims.push({ t: "text", x: P(MARGIN), y: pBase, s: paper.name, cls: "paper-name", size: pSize, anchor: "start" });
      yCur += T(PAPER_H);
    };
    const present = o.parts.filter((p) => paper.tracks[p.id]), visible = present.filter((p) => !p.hidden), hiddenParts = present.filter((p) => p.hidden);
    const hostOf = (id) => song.parts.find((x) => x.id === id)?.host;
    const editingHere = !o.foldAll && o.at.paper === paper.id ? o.at.part : null;
    const famOf = (id) => hostOf(id) ?? (song.parts.some((x) => x.host === id) ? id : null);
    const famIds = [...new Set(visible.map((p) => famOf(p.id)).filter((x) => !!x))];
    const famHere = (fid) => visible.filter((p) => famOf(p.id) === fid);
    const fold = famIds.filter((fid) => famHere(fid).length >= 2 && !(editingHere !== null && famOf(editingHere) === fid)).map((fid) => ({ host: fid, members: famHere(fid) }));
    const rowsS = BUILD.rows(paper, visible, fold, lookAt);
    Object.assign(virtualOut, rowsS.virtualOut);
    const { absorbed, lowOf, drumNames, loIds, parts } = rowsS;
    const openFams = famIds.filter((fid) => famHere(fid).length >= 2 && !absorbed.has(famHere(fid)[0].id)).map((fid) => ({ host: fid, ids: famHere(fid).map((p) => p.id) }));
    const trackOf = (id) => rowsS.virt.get(id) ?? paper.tracks[id];
    if (!parts.length) {
      drawPaperTitle(T(hiddenParts.length ? 0 : 3.2));
      let emptyBox;
      if (!hiddenParts.length) {
        emptyBox = { x: P(MARGIN), y: yCur, w: P(right - MARGIN), h: T(3.2) };
        yCur += T(3.2);
      }
      papersHit.push({ id: paper.id, title: pTitle, top: paperTop, bottom: yCur, hiddenParts: hiddenParts.map((p) => p.id), ...emptyBox ? { empty: emptyBox } : {} });
      return;
    }
    const lenOf = (t) => t.reduce((n3, x) => n3 + (isTimed(x) ? x.dur : 0), 0);
    const lens = parts.map((p) => lenOf(trackOf(p.id) ?? [])), paperLen = Math.max(0, ...lens);
    const built = BUILD.tracks(rowsS, { song, look: songLook, paper, lookAt, at: o.at, tailOpen: !!o.tailOpen, autoBars, measure: o.measure, sp, ts, lens, paperLen });
    const per0 = built.per, rowHost = built.rowHost;
    shortBars += built.shortBars;
    const kinds = per0.map((q) => NOTATIONS2[songLook.notation].rowKindOf(q));
    per0.forEach((q, i) => {
      if (kinds[i] === "jianpu") q.staves = 1;
    });
    const pmode = per0.map((q) => q.pmode);
    const hasV2 = per0.map((q) => q.hasV2);
    const measured = per0.map((q, i) => DRAWERS[kinds[i]].measure(q));
    const atracks = per0.map((_q, pi) => ({ entries: measured[pi].entries, laneBase: (rowHost[pi] >= 0 ? rowHost[pi] : pi) * 4 }));
    const merged = mergeColumns(atracks), n2 = merged.length;
    const FAM_W = openFams.length ? (o.chrome?.famGap ?? 0) * ts : 0;
    const ind0 = Math.max(NAME_MIN, ...parts.map((p) => Math.max(...nameLines(p.name, p.staves === 2 || song.papers.some((pp) => lookAt(pp.id, p.id)?.staves === 2) ? 2 : 1).map(nameW)))) + 1.4 * ts + FAM_W;
    const indN = parts.some((p) => p.abbr) ? Math.max(nameW(ABBR_REF), ...parts.map((p) => nameW(p.abbr ?? ""))) + 1.4 * ts + FAM_W : 0;
    const keyAtCol = [];
    {
      const now = new Map(per0.map((q) => [q.p.id, q.head.key]));
      for (let k = 0; k <= n2; k++) {
        keyAtCol.push(new Map(now));
        if (k < n2) {
          for (const { track, entry } of merged[k].members) if (entry.ref.kind === "key") now.set(per0[track].p.id, entry.ref.fifths);
        }
      }
    }
    const headAt = (k, first) => {
      const keys = keyAtCol[k], base = (first ? ind0 : indN) + MARGIN;
      return Math.max(...per0.map((q, i) => DRAWERS[kinds[i]].lineStart(q, keys.get(q.p.id), first, base)));
    };
    const spO = { curve: curveOf(PPAR.curve), ...SP_DEFAULTS };
    const ar = arrangeColumns(merged, atracks, { paperLen, spacing: spO, width: o.scroll ? Infinity : right, squeeze: PPAR.squeeze, maxStretch: PPAR.maxStretch, endPad: BAR_W, lineStart: headAt });
    const { lineFrom, sysStarts } = ar, nSys = lineFrom.length, sysKeys = lineFrom.map((k) => new Map(keyAtCol[k]));
    const cols = merged.map((c, k) => ({ tick: c.tick, slot: c.slot, n: c.n, x: ar.xs[k], w: ar.ws[k], system: ar.system[k], bar: c.bar, units: c.members.map((m) => m.entry.ref) }));
    const at = /* @__PURE__ */ new Map();
    for (const c of cols) for (const u of c.units) at.set(u, { x: c.x, system: c.system, w: u.kind === "chunk" ? c.w : u.w });
    const copyOf = /* @__PURE__ */ new Map();
    const per = per0.map((q) => ({ ...q, units: q.units.map((u) => {
      const v = { ...u, ...at.get(u) };
      copyOf.set(u, v);
      return v;
    }) }));
    const inkLs = measured.map((m) => new Map([...m.inkL].map(([u, v]) => [copyOf.get(u), v])));
    const placedCols = cols;
    if (o.scroll) {
      right = Math.max(baseRight, ...cols.map((c) => c.x + c.w)) + SCROLL_TAIL;
      sheetRight = Math.max(sheetRight, right);
    }
    const rowBase = rows.length, nR = parts.length;
    const effStaves = (i) => rowHost[i] >= 0 ? 0 : per[i].staves;
    const rowStart = per.map((_, i) => per.slice(0, i).reduce((a, _q, j) => a + effStaves(j), 0)), nRowsSys = per.reduce((a, _q, j) => a + effStaves(j), 0);
    const rowOf = (s2, r, k = 0) => rowBase + s2 * nRowsSys + rowStart[rowHost[r] >= 0 ? rowHost[r] : r] + k;
    const lyricsOf = per.map((q) => q.tokens.some((t) => t.kind === "note" && t.lyric));
    const lyrPlan = /* @__PURE__ */ new Map();
    const look = lyricLook(ts);
    const lyrUnit = (str) => lyricWidth(o.measure, str, sp, ts);
    const lyrSpace = lyrUnit(" ") * LYRIC_SPACE, lyrHyphen = lyrUnit("-") * HYPHEN_SX;
    const lyrGaps = { space: lyrSpace, hyphen: lyrHyphen + lyrSpace, floor: look.gapFloor };
    if (songLook.lyricFit === "rhythm") per.forEach((q, r) => {
      if (!lyricsOf[r]) return;
      const bySys = /* @__PURE__ */ new Map();
      for (const u of DRAWERS[kinds[r]].lyricAnchors(q)) {
        const arr = bySys.get(u.system) ?? [];
        bySys.set(u.system, arr);
        arr.push({ index: u.index, cx: u.cx, w: lyrUnit(lyricShow(u.lyric)), hy: u.hyph, block: isBlockScript(u.lyric) && [...lyricShow(u.lyric)].length <= 1 });
      }
      for (const items of bySys.values()) items.sort((a, b) => a.cx - b.cx);
      const blockSx = Math.min(1, ...[...bySys.values()].map((items) => lyricBlockSx(items, LYRIC_MIN_SX, lyrGaps)));
      for (const items of bySys.values()) fitLyrics(items, blockSx, LYRIC_MIN_SX, lyrGaps).forEach((f, k) => lyrPlan.set(`${r}:${items[k].index}`, { ...f, hw: items[k].w * f.sx / 2 }));
    });
    const put = (row, p) => {
      const n0 = prims.length;
      prims.push(p);
      if (prims.length > n0) primRow[n0] = row;
    };
    const hitRowOf = /* @__PURE__ */ new WeakMap(), hitRow = (hit, row) => {
      hitRowOf.set(hit, row);
    };
    const skies = [];
    for (let s2 = 0; s2 < nSys; s2++) for (let r = 0; r < nR; r++) for (let k = 0; k < effStaves(r); k++) {
      const row = rowOf(s2, r, k);
      rowTop.set(row, 0);
      rowAbove.set(row, 0);
      rows[row] = { top: 0, staffTop: 0, bottom: 0, paper: paper.id, part: parts[r].id, sys: s2, staff: k + 1, inkTop: 0, inkBottom: 0, kind: kinds[r] };
      skies[row - rowBase] = new Skyline(right + MARGIN + 8);
      if (per[r].vrt) sharedRows.push(row);
    }
    const sky = (row) => skies[row - rowBase];
    const loc = (row, y) => (y - staffTop(row)) / sp;
    const textW = (str, size) => o.measure.widthPx(str, size, sp, ts);
    const isAnn = (p) => /(^|\s)ann(\s|$)/.test(p.cls ?? "");
    const primRow = [];
    const hitLists = () => [notes, chordHeads, rests, lyrics, marks, dyns, clefs, keyHints, chordTagsOut];
    const mark = () => ({ p: prims.length, h: hitLists().map((l) => l.length) });
    const shiftSince = (m, dy) => {
      if (!dy) return;
      for (let i = m.p; i < prims.length; i++) shiftPrim(prims[i], dy);
      hitLists().forEach((l, j) => {
        for (let i = m.h[j]; i < l.length; i++) l[i].y += dy;
      });
    };
    const inkSince = (m, row, f) => {
      const t = staffTop(row);
      for (let i = m.p; i < prims.length; i++) {
        const p = prims[i];
        if (isAnn(p)) continue;
        primInk(p, sp, textW, (x0, x1, y02, y1) => f(x0 / sp, x1 / sp, (y02 - t) / sp, (y1 - t) / sp));
      }
    };
    const pieces = [];
    const collect = (m, row) => {
      pieces.length = 0;
      inkSince(m, row, (x0, x1, y02, y1) => {
        pieces.push(x0, x1, y02, y1);
      });
    };
    const commit = (sk, dy, count) => {
      for (let i = 0; i < pieces.length; i += 4) sk.ink(pieces[i], pieces[i + 1], pieces[i + 2] + dy, pieces[i + 3] + dy, count);
    };
    const tagSince = (m, row) => {
      for (let i = m.p; i < prims.length; i++) if (primRow[i] === void 0) primRow[i] = row;
    };
    const placeAbove = (row, gap, draw) => {
      const m = mark();
      draw(staffTop(row));
      tagSince(m, row);
      collect(m, row);
      let need = Infinity;
      const sk = sky(row);
      for (let i = 0; i < pieces.length; i += 4) {
        const t = sk.top(pieces[i], pieces[i + 1]);
        if (t < Infinity) need = Math.min(need, t - gap - pieces[i + 3]);
      }
      const dy = need === Infinity ? body(row).top - rowPar(row).clear : need;
      shiftSince(m, P(dy));
      commit(sk, dy, true);
      return dy;
    };
    const placeBelow = (row, gap, draw, o2 = {}) => {
      const m = mark();
      draw(staffTop(row));
      tagSince(m, row);
      collect(m, row);
      let need = -Infinity;
      const sk = sky(row);
      for (let i = 0; i < pieces.length; i += 4) {
        const b = sk.bottom(pieces[i], pieces[i + 1]);
        if (b > -Infinity) need = Math.max(need, b + gap - pieces[i + 2]);
      }
      let dy = Math.max(need === -Infinity ? 0 : need, o2.min ?? -Infinity);
      if (o2.step && o2.min !== void 0 && dy > o2.min + 1e-9) dy = o2.min + Math.ceil((dy - o2.min) / o2.step - 1e-9) * o2.step;
      shiftSince(m, P(dy));
      commit(sk, dy, o2.count !== false);
      return dy;
    };
    const attached = /* @__PURE__ */ new Map();
    const attach = (row, lane, run) => {
      if (!(row >= rowBase && row - rowBase < skies.length && skies[row - rowBase])) throw new Error(`engrave: attach on row ${row} outside this paper`);
      let m = attached.get(row);
      if (!m) attached.set(row, m = /* @__PURE__ */ new Map());
      const l = m.get(lane);
      if (l) l.push(run);
      else m.set(lane, [run]);
    };
    const p0 = mark();
    const staffEnd = Array.from({ length: nSys }, (_, s2) => {
      const row = placedCols.filter((c) => c.system === s2);
      if (!row.length) return right;
      const last = row.reduce((a, c) => c.x > a.x || c.x === a.x && (c.slot > a.slot || c.slot === a.slot && c.n > a.n) ? c : a);
      return last.bar ? Math.min(right, last.x + 0.7) : right;
    });
    const drawSystemsChrome = () => {
      for (let s2 = 0; s2 < nSys; s2++) {
        const ind = s2 === 0 ? ind0 : indN;
        per.forEach((q, r) => {
          if (rowHost[r] >= 0) return;
          const ten = absorbed.get(q.p.id) ?? [];
          const pr = lowOf.has(q.p.id) ? per.findIndex((x) => x.p.id === lowOf.get(q.p.id)) : r, rEnd = (sy) => rowOf(sy, pr, per[pr].staves - 1);
          if (loIds.has(q.p.id)) return;
          if (s2 === 0) {
            const r0 = rowOf(s2, r, 0), r1 = rEnd(s2), lines2 = nameLines(q.p.name, pr !== r ? 2 : q.staves), LH = PART_EM * 1.15 * ts;
            const tl = ten.map((t) => nameLines(t.name, 1)[0] ?? ""), nAll = lines2.length + tl.length;
            const ny = (anc(r0).mid + anc(r1).mid) / 2 + T(0.55 * PART_EM) - P(LH * (nAll - 1) / 2);
            const nameBlock = (wid) => names.push({ paper: paper.id, part: q.p.id, x0: P(MARGIN - 0.95), x1: P(MARGIN) + P(wid), top: ny - T(PART_EM * 0.95) });
            const ncls = q.p.empty ? "part-name empty" : q.focused ? "part-name focus" : "part-name";
            const dn = drumNames.get(q.p.id);
            if (dn) {
              const at2 = (k) => ny + P(LH * k), hk = Math.max(0, dn.findIndex((m) => m.id === q.p.id));
              dn.forEach((m, k) => {
                prims.push({ t: "text", x: P(MARGIN), y: at2(k), s: nameLines(m.name, 1)[0] ?? "", cls: m.id === q.p.id ? ncls : "part-name tenant", size: tx("part-name"), anchor: "start" });
                partsHit.push({ paper: paper.id, part: m.id, x: P(MARGIN - 0.4), y: at2(k) - T(PART_EM * 0.95), w: P(ind0 + 0.2), h: P(LH) });
              });
              nameBlock(Math.max(...dn.map((m) => nameW(nameLines(m.name, 1)[0] ?? ""))));
              if (q.p.badges?.length) prims.push({ t: "text", x: P(MARGIN), y: at2(dn.length - 1) + P(LH), s: q.p.badges.join(" "), cls: "part-badge ann", size: tx("part-badge"), anchor: "start" });
              if (q.p.colorIdx !== void 0) prims.push({ t: "rect", x: P(MARGIN - 0.95), y: at2(hk) - T(PART_EM * 0.62), w: T(0.6), h: T(0.6), cls: `cat-dot ann cat-${q.p.colorIdx}` });
            } else {
              lines2.forEach((ln, k) => prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * k), s: ln, cls: ncls, size: tx("part-name"), anchor: "start" }));
              tl.forEach((ln, k) => prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * (lines2.length + k)), s: ln, cls: "part-name tenant", size: tx("part-name"), anchor: "start" }));
              if (ten.length) {
                const lineTop = (i) => ny + P(LH * i) - T(PART_EM * 0.95);
                ten.forEach((t, k) => partsHit.push({ paper: paper.id, part: t.id, x: P(MARGIN - 0.4), y: lineTop(lines2.length + k), w: P(ind0 + 0.2), h: P(LH) }));
              }
              nameBlock(Math.max(...[...lines2, ...tl].map(nameW)));
              {
                if (q.p.badges?.length) prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * (nAll - 1)) + T(1.4), s: q.p.badges.join(" "), cls: "part-badge ann", size: tx("part-badge"), anchor: "start" });
              }
              {
                const y02 = anc(r0).top - P(1.2), yEnd = ten.length ? ny + P(LH * lines2.length) - T(PART_EM * 0.95) : anc(r1).bottom + P(1.2);
                partsHit.push({ paper: paper.id, part: q.p.id, x: P(MARGIN - 0.4), y: y02, w: P(ind0 + 0.2), h: yEnd - y02 });
              }
              if (q.p.colorIdx !== void 0) prims.push({ t: "rect", x: P(MARGIN - 0.95), y: ny - T(PART_EM * 0.62), w: T(0.6), h: T(0.6), cls: `cat-dot ann cat-${q.p.colorIdx}` });
            }
          } else if (q.p.abbr) {
            const r0 = rowOf(s2, r, 0), r1 = rEnd(s2), LH = PART_EM * 1.15 * ts;
            const order = drumNames.get(q.p.id) ?? [q.p, ...ten], hk = Math.max(0, order.findIndex((m) => m.id === q.p.id));
            const ny = (anc(r0).mid + anc(r1).mid) / 2 + T(0.55 * PART_EM) - P(LH * (order.length - 1) / 2);
            order.forEach((m, k) => {
              if (m.id === q.p.id) {
                prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * k), s: q.p.abbr, cls: q.p.empty ? "part-name abbr empty" : q.focused ? "part-name abbr focus" : "part-name abbr", size: tx("part-name"), anchor: "start" });
                return;
              }
              prims.push({ t: "text", x: P(MARGIN), y: ny + P(LH * k), s: m.abbr ?? "", cls: "part-name abbr tenant", size: tx("part-name"), anchor: "start" });
              partsHit.push({ paper: paper.id, part: m.id, x: P(MARGIN - 0.4), y: ny + P(LH * k) - T(PART_EM * 0.95), w: P(indN + 0.2), h: P(LH) });
            });
            if (q.p.colorIdx !== void 0) prims.push({ t: "rect", x: P(MARGIN - 0.95), y: ny + P(LH * hk) - T(PART_EM * 0.62), w: T(0.6), h: T(0.6), cls: `cat-dot ann cat-${q.p.colorIdx}` });
            partsHit.push({ paper: paper.id, part: q.p.id, x: P(MARGIN - 0.4), y: anc(r0).top - P(1.2), w: P(indN + 0.2), h: anc(r1).bottom - anc(r0).top + P(2.4) });
          }
          if (q.p.colorIdx !== void 0) {
            const r0 = rowOf(s2, r, 0), r1 = rEnd(s2);
            prims.push({ t: "rect", x: P(MARGIN + ind - 0.8), y: anc(r0).top, w: P(0.3), h: anc(r1).bottom - anc(r0).top, cls: `cat-bar ann cat-${q.p.colorIdx}` });
          }
          if (q.staves === 2 || pr !== r) {
            const bx = P(MARGIN + ind - 0.7), y02 = anc(rowOf(s2, r, 0)).top, y1 = anc(rEnd(s2)).bottom;
            prims.push({ t: "path", d: `M${bx + P(0.5)},${y02}Q${bx - P(0.3)},${y02 + P(0.6)} ${bx},${(y02 + y1) / 2}Q${bx - P(0.3)},${y1 - P(0.6)} ${bx + P(0.5)},${y1}`, cls: "brace" });
          }
        });
        if (ind > 0 && o.chrome?.famGap) for (const fam of openFams) {
          const rs = fam.ids.map((id) => per.findIndex((q) => q.p.id === id)).filter((i) => i >= 0);
          if (rs.length < 2) continue;
          const r0 = Math.min(...rs), r1 = Math.max(...rs), x = P(MARGIN + ind - 1.55), y02 = anc(rowOf(s2, r0, 0)).top - P(0.6), y1 = anc(rowOf(s2, r1, per[r1].staves - 1)).bottom + P(0.6);
          families.push({ paper: paper.id, host: fam.host, x: x - P(0.6), y: y02, w: P(1.3), h: y1 - y02 });
        }
        if (nRowsSys > 1) prims.push({ t: "line", x1: P(MARGIN + ind), y1: anc(rowOf(s2, 0, 0)).top, x2: P(MARGIN + ind), y2: anc(rowOf(s2, nR - 1, per[nR - 1].staves - 1)).bottom, w: P(SYSTEM_LINE_W), cls: "bar" });
      }
    };
    {
      const q0 = per.find((q) => rowHost[per.indexOf(q)] < 0) ?? per[0];
      let t = 0, cur = null;
      for (const u of q0.units) {
        if (u.kind !== "chunk") continue;
        const m = u.m ?? 0;
        if (!cur || cur.m !== m) {
          cur = { paper: paper.id, t0: t, t1: t, row: rowOf(u.system, per.indexOf(q0), 0), x: P(u.x) };
          cur.m = m;
          measures.push(cur);
        }
        t += u.ticks;
        cur.t1 = t;
      }
      for (const x of measures) delete x.m;
    }
    const drawCtx = { song, look: songLook, paper, o, P, tx, TR, RS, mw, sp, ts, put, hitRow, prims, notes, chordHeads, rests, lyrics, marks, dyns, clefs, keyHints, chordTagsOut, slots, heads, bars, rows, staffTop, lyricY, rowOf, placeAbove, placeBelow, attach, per, rowHost, pmode, measured: inkLs.map((inkL) => ({ inkL })), nSys, sysStarts, sysKeys, staffEnd, cols, right, ind0, indN, owner, prevBpm };
    if (songLook.barNumbers && per[0]) for (let s2 = 0; s2 < nSys; s2++) {
      const ind = s2 === 0 ? ind0 : indN, q0 = per.find((q) => q.units.some((u) => u.kind === "chunk" && u.system === s2)) ?? per[0];
      const c0 = q0.units.find((u) => u.kind === "chunk" && u.system === s2);
      const num = c0 ? (c0.m ?? 0) + (q0.pickup ? 0 : 1) : null, row0 = rowOf(s2, 0, 0);
      if (num !== null && !(s2 === 0 && num <= 1)) attach(row0, "barNumber", () => placeAbove(row0, 0.3, (y) => prims.push({ t: "text", x: P(MARGIN + ind), y, s: String(num), cls: "bar-no", size: tx("bar-no"), anchor: "start" })));
    }
    const kIdx = (k) => per.map((_q, i) => i).filter((i) => kinds[i] === k);
    const ctxFor = (idx, who) => {
      const own = /* @__PURE__ */ new Set();
      for (const r of idx) for (let s2 = 0; s2 < nSys; s2++) for (let k = 0; k < effStaves(r) || rowHost[r] >= 0 && k < 1; k++) own.add(rowOf(s2, r, k));
      const chk = (row) => {
        if (!own.has(row)) throw new Error(`engrave: the ${who} drawer drew on row ${row}, which is not one of its rows`);
      };
      return {
        ...drawCtx,
        put: (row, p) => {
          chk(row);
          put(row, p);
        },
        hitRow: (h, row) => {
          chk(row);
          hitRow(h, row);
        },
        attach: (row, lane, run) => {
          chk(row);
          attach(row, lane, run);
        },
        placeAbove: (row, gap, d) => {
          chk(row);
          return placeAbove(row, gap, d);
        },
        placeBelow: (row, gap, d, o2) => {
          chk(row);
          return placeBelow(row, gap, d, o2);
        }
      };
    };
    const sIdx = kIdx("staff"), jIdx = kIdx("jianpu");
    const staffOut = DRAWERS.staff.draw(ctxFor(sIdx, "staff"), sIdx), jpOut = jIdx.length ? DRAWERS.jianpu.draw(ctxFor(jIdx, "jianpu"), jIdx) : { lyricParts: [] };
    const layLyrics = ({ r, lrow, spots }) => {
      const run = (c, partLyrics) => {
        const fit = lyrPlan.get(`${r}:${c.index}`), ly0 = lyricY(lrow(c.sys)), cx0 = c.cx0;
        const ly = ly0, cx = cx0 + (fit ? P(fit.dx) : 0);
        {
          const lh = { index: c.index, system: c.row, x: cx, y: ly, ...fit?.tight ? { tight: true } : {} };
          partLyrics.push(lh);
          hitRow(lh, lrow(c.sys));
        }
        if (c.lyric === MELISMA_MARK) put(lrow(c.sys), { t: "line", x1: c.mx0, y1: ly0, x2: c.mx1, y2: ly0, w: P(0.12), cls: "melisma" });
        else if (c.lyric) put(lrow(c.sys), { tok: c.tok, t: "text", x: cx, y: ly, s: lyricShow(c.lyric), ...look.k !== 1 || ts !== 1 ? { size: lyricSizePx(sp, ts) } : {}, ...look.sx * (fit?.sx ?? 1) !== 1 ? { sx: look.sx * (fit?.sx ?? 1) } : {}, cls: ["lyric", c.mute ? "lyric-mute" : "", fit?.tight ? "lyric-tight" : "", c.cls ?? ""].filter(Boolean).join(" ") });
      };
      const bySys = /* @__PURE__ */ new Map();
      for (const c of spots) {
        const l = bySys.get(c.sys);
        if (l) l.push(c);
        else bySys.set(c.sys, [c]);
      }
      if (!lyricsOf[r]) {
        for (const [sy, cs2] of bySys) attach(lrow(sy), "lyrics", () => {
          const part = [];
          for (const c of cs2) run(c, part);
          lyrics.push(...part);
        });
        return;
      }
      for (let sy = 0; sy < nSys; sy++) {
        const row = lrow(sy), cs2 = bySys.get(sy), base = rowPar(row).lyricBelow + (o.lyricRaise ?? 0);
        attach(row, "lyrics", () => {
          lyricOff.set(row, base);
          if (!cs2) return;
          const partLyrics = [];
          const dy = placeBelow(row, 0.5, () => {
            const from = partLyrics.length;
            for (const c of cs2) run(c, partLyrics);
            const mine = partLyrics.slice(from), byIdx = new Map(cs2.map((c) => [c.index, c]));
            const syls = mine.map((L) => {
              const pl = lyrPlan.get(`${r}:${L.index}`), c = byIdx.get(L.index), lyr = c.lyric ?? "";
              return { x: L.x, hy: c.hyph, hw: pl ? P(pl.hw) : void 0, sx: pl?.sx, ...pl ? {} : { nw: P(lyrUnit(lyricShow(lyr))) / 2 }, cjk: isBlockScript(lyricShow(lyr)), row: L.system };
            });
            hyphens(syls, P(lyrHyphen), P(1.6)).forEach((h, n3) => {
              if (h) prims.push({ t: "text", x: h.x, y: mine[n3].y, s: "-", cls: "lyric hyphen", ...look.k !== 1 || ts !== 1 ? { size: lyricSizePx(sp, ts) } : {}, sx: look.sx * h.hf * HYPHEN_SX });
            });
            lyrics.push(...partLyrics.slice(from));
          }, { min: 0, count: false, step: ROW_STEP });
          lyricOff.set(row, base + dy);
        });
      }
    };
    for (const lp of [...staffOut.lyricParts, ...jpOut.lyricParts]) layLyrics(lp);
    for (let i = p0.p; i < prims.length; i++) {
      const p = prims[i];
      if (isAnn(p)) continue;
      const row = primRow[i];
      if (row === void 0) throw new Error(`engrave: prim ${i} has no row (draw with put(row, \u2026) or inside placeAbove / placeBelow)`);
      if (row < rowBase || row - rowBase >= skies.length || !skies[row - rowBase]) continue;
      const t = staffTop(row);
      primInk(p, sp, textW, (x0, x1, y02, y1) => sky(row).ink(x0 / sp, x1 / sp, (y02 - t) / sp, (y1 - t) / sp));
    }
    const upToNav = [];
    for (let row = rowBase; row - rowBase < skies.length; row++) {
      if (!skies[row - rowBase]) continue;
      const m = attached.get(row), lanes = DRAWERS[rows[row].kind].lanes;
      for (const lane of lanes) {
        for (const f of m?.get(lane) ?? []) f();
        if (lane === INK_UP_TO) upToNav[row - rowBase] = sky(row).hUp;
      }
      if (m) {
        for (const lane of m.keys()) if (!lanes.includes(lane)) throw new Error(`engrave: row ${row} (${rows[row].kind}) has no lane "${lane}"`);
      }
    }
    const pEnd = mark();
    const PAD = 0.8, fin = (v, d) => Number.isFinite(v) ? v : d;
    const stepUp = (min, need) => need <= min + 1e-9 ? min : min + Math.ceil((need - min) / ROW_STEP - 1e-9) * ROW_STEP;
    const geo = (s2, r, k) => {
      const q = per[r], row = rowOf(s2, r, k), R = rowPar(row), b = body(row), bodyH = b.bottom - b.top, sk = sky(row), hUp = fin(sk.hUp, b.top), hDn = fin(sk.hDn, b.bottom);
      const minBelow = q.staves === 2 && k === 0 ? R.graveUpper - R.above - bodyH : (lyricsOf[r] ? R.rowH : R.rowHNoLyric) - R.above - bodyH;
      const lyr = lyricsOf[r] && k === q.staves - 1 ? lyricOff.get(row) : void 0, row2 = 0, lyricTail = R.rowH - R.above - bodyH - R.lyricBelow;
      let need = hDn - b.bottom + PAD;
      if (lyr !== void 0) need = Math.max(need, lyr + lyricTail + row2);
      const below = stepUp(minBelow, need), above = stepUp(R.above, b.top - hUp + PAD);
      return { above, below, h: above + bodyH + below, origin: above - b.top, inkTop: Math.min(b.top, fin(upToNav[row - rowBase] ?? Infinity, b.top)), inkBottom: Math.max(b.bottom, hDn, lyr !== void 0 ? b.bottom + lyr + 0.5 + row2 : b.bottom) };
    };
    const G2 = Array.from({ length: nSys }, (_, s2) => per.map((_q, r) => Array.from({ length: effStaves(r) }, (_2, k) => geo(s2, r, k))));
    const sysH = (s2) => P(G2[s2].reduce((n3, gs) => n3 + gs.reduce((m, g) => m + g.h, 0), 0) + SYS_GAP);
    drawPaperTitle(nSys ? sysH(0) : P(ROW_PARAMS[NOTATIONS2[songLook.notation].home][density].rowH));
    let note;
    if (paper.hidden) {
      const nx = P(MARGIN) + (paper.name ? P(mw("paper-name", paper.name)) : 0) + T(1);
      note = { x: nx, y: pTitle.y, w: Math.max(T(4), pTitle.x + pTitle.w - nx), h: T(PAPER_H) };
    }
    const delta = /* @__PURE__ */ new Map();
    for (let s2 = 0; s2 < nSys; s2++) {
      ensure(sysH(s2));
      for (let r = 0; r < nR; r++) for (let k = 0; k < effStaves(r); k++) {
        const top = yCur, row = rowOf(s2, r, k), g = G2[s2][r][k], st = top + P(g.origin);
        delta.set(row, st);
        rowTop.set(row, top);
        rowAbove.set(row, g.origin);
        Object.assign(rows[row], { top, staffTop: st, bottom: top + P(g.h), inkTop: st + P(g.inkTop), inkBottom: st + P(g.inkBottom) });
        yCur += P(g.h);
      }
      yCur += P(SYS_GAP);
    }
    for (let i = p0.p; i < pEnd.p; i++) shiftPrim(prims[i], delta.get(primRow[i]) ?? 0);
    hitLists().forEach((l, j) => {
      for (let i = p0.h[j]; i < pEnd.h[j]; i++) {
        const h = l[i];
        h.y += delta.get(hitRowOf.get(h) ?? h.system) ?? 0;
      }
    });
    drawSystemsChrome();
    papersHit.push({ id: paper.id, title: pTitle, top: paperTop, bottom: yCur, hiddenParts: hiddenParts.map((p) => p.id), ...note ? { note } : {} });
  }
  const pages = [];
  if (PG) {
    const frames = [];
    for (let k = 0; k <= pageNo; k++) {
      const top = pageTopY(k);
      frames.push({ t: "rect", x: -P(PG.l), y: top, w: o.width + P(PG.l + PG.r), h: P(PG.h), cls: "page ann" });
      prims.push({ t: "text", x: o.width / 2, y: top + P(PG.h - PG.b / 2), s: String(k + 1), cls: "page-no", size: tx("page-no"), anchor: "middle" });
      pages.push({ top, h: P(PG.h) });
    }
    prims.unshift(...frames);
  }
  const height = PG ? Math.max(pageTopY(pageNo) + P(PG.h), tailBottom) : yCur + P(MX.b);
  return { prims, width: o.scroll ? P(sheetRight + MARGIN) : o.width, height, sp, tp: sp * ts, systems: rows, bars, notes, chordHeads, chordTags: chordTagsOut, names, sharedRows, virtual: virtualOut, measures, families, slots, heads, lyrics, marks, dyns, rests, title, clefs, arrangement, credits, parts: partsHit, papers: papersHit, keyHints, tail, creditsLine: { x: rx, y: y0, size: cs }, content: { left: P(MARGIN), right: o.width - P(MARGIN) }, pageX: { left: P(MX.l), right: P(MX.r) }, pages, shortBars, lyricYs: rows.map((_, r) => lyricY(r)) };
}

// src/render/svg.ts
var esc = (s2) => s2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var n = (v) => (Math.round(v * 100) / 100).toString();
function primSvg(p, fs, lfs, rx) {
  const c = (p.cls ? ` class="${p.cls}"` : "") + (p.tok !== void 0 ? ` data-tok="${p.tok}"` : "");
  switch (p.t) {
    case "line":
      return `<line${c} x1="${n(p.x1)}" y1="${n(p.y1)}" x2="${n(p.x2)}" y2="${n(p.y2)}" stroke-width="${n(p.w)}"/>`;
    case "glyph":
      return `<text${c} x="${n(p.x)}" y="${n(p.y)}" font-family="Bravura" font-size="${p.size ? n(p.size) : fs}">${p.ch}</text>`;
    case "text":
      return `<text${c} x="${n(p.x)}" y="${n(p.y)}" font-size="${p.size ? n(p.size) : lfs}" text-anchor="${p.anchor ?? "middle"}"${p.sx && p.sx !== 1 ? ` transform="matrix(${n(p.sx)} 0 0 1 ${n(p.x * (1 - p.sx))} 0)"` : ""}>${esc(p.s)}</text>`;
    // sx = 以 x 为中心横向压窄（紧凑档的歌词）
    case "path":
      return `<path${c} d="${p.d}"/>`;
    case "rect":
      return `<rect${c} x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" rx="${rx}"/>`;
  }
}
function yOfPrim(p) {
  switch (p.t) {
    case "line":
      return (p.y1 + p.y2) / 2;
    case "glyph":
    case "text":
      return p.y;
    case "rect":
      return p.y + p.h / 2;
    case "path": {
      const m = /^\s*M\s*-?[\d.]+[\s,]+(-?[\d.]+)/.exec(p.d);
      return m ? Number(m[1]) : null;
    }
  }
}
function toSvgParts(l) {
  const L = l.pageX?.left ?? 0, R = l.pageX?.right ?? 0, W2 = l.width + L + R;
  const open = `<svg xmlns="http://www.w3.org/2000/svg" class="staff-svg" width="${n(W2)}" height="${n(l.height)}" viewBox="${n(-L)} 0 ${n(W2)} ${n(l.height)}">`;
  const fs = n(4 * l.sp), lfs = n(LYRIC_EM * l.sp), rx = n(l.sp * 0.6);
  const boxes = l.systems.map((s2) => [s2.top, s2.bottom]);
  const buckets = Array.from({ length: boxes.length + 1 }, () => []);
  for (const p of l.prims) {
    const y = p.t === "rect" && /(^|\s)page(\s|$)/.test(p.cls ?? "") ? null : yOfPrim(p);
    let k = 0;
    if (y !== null) {
      for (let i = 0; i < boxes.length; i++) if (y >= boxes[i][0] && y < boxes[i][1]) {
        k = i + 1;
        break;
      }
    }
    buckets[k].push(primSvg(p, fs, lfs, rx));
  }
  return { open, groups: buckets.map((b, k) => `<g data-sys="${k - 1}">${b.join("")}</g>`), close: "</svg>" };
}

// src/render/layout-worker.ts
function runLayoutJob(job, raw, now = () => performance.now()) {
  const t0 = now();
  const data = engrave(job.song, { ...job.opts, measure: createTextMeasure(raw) });
  const parts = toSvgParts(data);
  return { seq: job.seq, parts, data, ms: now() - t0 };
}
if (typeof document === "undefined" && typeof self !== "undefined" && typeof self.postMessage === "function" && typeof OffscreenCanvas !== "undefined") {
  const ws = self;
  const raw = canvasMeasure(new OffscreenCanvas(1, 1).getContext("2d"));
  ws.onmessage = (e) => {
    const job = e.data;
    try {
      ws.postMessage(runLayoutJob(job, raw));
    } catch (err) {
      ws.postMessage({ seq: job.seq, error: String(err?.stack ?? err) });
    }
  };
}
export {
  runLayoutJob
};
//# sourceMappingURL=layout-worker-f5448bd2604b.mjs.map
