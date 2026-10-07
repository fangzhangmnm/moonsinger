// xml.ts —— 读写 MusicXML 用的最小 XML：解析成一棵元素树、转义写出。created 2026-10-07 by Claude Opus 5.5
// 为什么自己写：浏览器有 DOMParser，但 node 跑测试没有；MusicXML 只用到元素 / 属性 / 文字 / 注释 / DOCTYPE / 处理指令 / CDATA / 实体，
// 一百行以内能写对，比 vendor 一个 XML 库轻（家规 vendor everything，能不加依赖就不加）。不做命名空间、不做 DTD 展开。

export interface El { name: string; attrs: Record<string, string>; children: (El | string)[] }

const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decode(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e] ?? m);
}
export const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** 解析整份 XML，返回根元素。格式不对就抛错（说清在哪）。 */
export function parseXml(src: string): El {
  let i = 0;
  const fail = (what: string): never => { throw new Error(`XML 读不懂（第 ${src.slice(0, i).split("\n").length} 行）：${what}`); };
  const stack: El[] = [{ name: "#doc", attrs: {}, children: [] }];
  while (i < src.length) {
    const lt = src.indexOf("<", i);
    const text = src.slice(i, lt < 0 ? src.length : lt);
    if (text && stack.length > 1) stack[stack.length - 1].children.push(decode(text));
    if (lt < 0) break;
    i = lt;
    if (src.startsWith("<!--", i)) { const e = src.indexOf("-->", i); if (e < 0) fail("注释没收尾"); i = e + 3; continue; }
    if (src.startsWith("<![CDATA[", i)) { const e = src.indexOf("]]>", i); if (e < 0) fail("CDATA 没收尾"); stack[stack.length - 1].children.push(src.slice(i + 9, e)); i = e + 3; continue; }
    if (src.startsWith("<?", i)) { const e = src.indexOf("?>", i); if (e < 0) fail("处理指令没收尾"); i = e + 2; continue; }
    if (src.startsWith("<!", i)) {   // DOCTYPE（可能带 [内部子集]）
      let depth = 0, j = i;
      for (; j < src.length; j++) { const c = src[j]; if (c === "[") depth++; else if (c === "]") depth--; else if (c === ">" && depth === 0) break; }
      i = j + 1; continue;
    }
    if (src[i + 1] === "/") {
      const e = src.indexOf(">", i); if (e < 0) fail("结束标签没收尾");
      const name = src.slice(i + 2, e).trim(), top = stack.pop()!;
      if (!top || top.name !== name) fail(`结束标签 </${name}> 对不上 <${top?.name}>`);
      i = e + 1; continue;
    }
    const m = /^<([^\s/>]+)/.exec(src.slice(i, i + 200)); if (!m) fail("标签名");
    const el: El = { name: m![1], attrs: {}, children: [] };
    i += m![0].length;
    const attrRe = /\s*([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/y;
    for (;;) {
      attrRe.lastIndex = i;
      const a = attrRe.exec(src);
      if (!a) break;
      el.attrs[a[1]] = decode(a[3] ?? a[4] ?? "");
      i = attrRe.lastIndex;
    }
    while (/\s/.test(src[i] ?? "")) i++;
    stack[stack.length - 1].children.push(el);
    if (src.startsWith("/>", i)) { i += 2; continue; }
    if (src[i] !== ">") fail(`<${el.name}> 里有读不懂的东西`);
    i++;
    stack.push(el);
  }
  if (stack.length !== 1) fail(`<${stack[stack.length - 1].name}> 没有结束`);
  const root = stack[0].children.find((c): c is El => typeof c !== "string");
  if (!root) fail("没有根元素");
  return root!;
}

export const kids = (el: El | undefined, name?: string): El[] =>
  (el?.children ?? []).filter((c): c is El => typeof c !== "string" && (name === undefined || c.name === name));
export const kid = (el: El | undefined, name: string): El | undefined => kids(el, name)[0];
export const text = (el: El | undefined): string =>
  (el?.children ?? []).map((c) => (typeof c === "string" ? c : text(c))).join("");
/** 子元素的文字（去首尾空白）；没有 = undefined。 */
export const childText = (el: El | undefined, name: string): string | undefined => { const k = kid(el, name); return k ? text(k).trim() : undefined; };
