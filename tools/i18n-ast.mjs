// tools/i18n-ast.mjs —— 「源码里哪些中文字串是界面文案」的共用判定（TypeScript 语法树）。created 2026-11-04 by Claude Opus 5.5
//   两个地方用：tools/i18n-wrap.mjs（一次性把字串包进 _t）、test/i18n-guard.test.mjs（之后防新的裸中文）。
//   判定只有一份，免得工具和守卫说法不一。
import ts from "typescript";

export const HAN = /[一-鿿]/;

/** 整个文件不进 i18n（各有各的理由，写在值里）。守卫和工具都跳过。 */
export const SKIP_FILES = {
  "src/i18n/strings.ts": "翻译表本身",
  "src/i18n/index.ts": "翻译函数本身",
  "src/singer/credit-translations.ts": "条款译文，按原文 sha256 钉住，有自己的中英（CLAUDE.md「月读条款译文」）",
  "src/singer/sing-core.mjs": "唱法核心，写歌实验室的命令行也用它：不引 app 层依赖",
  "src/singer/en-front.mjs": "同上（唱法前端）",
};

/** 生成文件（测试守着和生成脚本一致）：不包字，要显示的字在显示处翻。 */
export const isSkipFile = (rel) => !!SKIP_FILES[rel] || rel.endsWith(".gen.ts");

const SKIP_CALLS = new Set(["includes", "startsWith", "endsWith", "indexOf", "lastIndexOf", "replace", "replaceAll", "split", "test", "match", "matchAll", "search", "localeCompare"]);
const SKIP_CALLEES = new Set(["console", "diagNote", "diagLog", "_t", "_tIn"]);

/** 这个中文字面量是不是不算文案（比较、查找、日志、对象键、类型……）。 */
export function isSkippedContext(node) {
  const p = node.parent;
  if (!p) return false;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p)) return true;
  if (ts.isLiteralTypeNode(p)) return true;
  if (ts.isCaseClause(p)) return true;
  if ((ts.isPropertyAssignment(p) || ts.isEnumMember(p) || ts.isPropertySignature(p) || ts.isMethodDeclaration(p)) && p.name === node) return true;
  if (ts.isComputedPropertyName(p)) return true;
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return true;
  if (ts.isBinaryExpression(p)) {
    const k = p.operatorToken.kind;
    if (k === ts.SyntaxKind.EqualsEqualsEqualsToken || k === ts.SyntaxKind.ExclamationEqualsEqualsToken || k === ts.SyntaxKind.EqualsEqualsToken || k === ts.SyntaxKind.ExclamationEqualsToken || k === ts.SyntaxKind.InKeyword) return true;
  }
  if (ts.isCallExpression(p) && p.arguments.includes(node)) {
    const c = p.expression;
    const name = ts.isPropertyAccessExpression(c) ? c.name.text : ts.isIdentifier(c) ? c.text : "";
    const root = ts.isPropertyAccessExpression(c) ? rootName(c) : name;
    if (SKIP_CALLS.has(name) || SKIP_CALLEES.has(name) || SKIP_CALLEES.has(root)) return true;
  }
  // new RegExp("…")
  if (ts.isNewExpression(p) && ts.isIdentifier(p.expression) && p.expression.text === "RegExp") return true;
  return false;
}

function rootName(e) {
  let x = e;
  while (ts.isPropertyAccessExpression(x)) x = x.expression;
  return ts.isIdentifier(x) ? x.text : "";
}

/** 这一行尾巴上写了 `// i18n-keep`（故意不翻：写进文件的固定字、乐理里的中文词、歌词默认字……）。 */
export function hasKeepMark(sf, node) {
  const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
  const start = sf.getPositionOfLineAndCharacter(line, 0);
  const end = line + 1 < sf.getLineStarts().length ? sf.getPositionOfLineAndCharacter(line + 1, 0) : sf.text.length;
  return /\/\/.*i18n-keep/.test(sf.text.slice(start, end));
}

export function parse(path, text) {
  return ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}

/** 静态部分带中文的字面量（字串 / 模板）：守卫用。 */
export function literalHasHan(node, sf) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return HAN.test(node.text);
  if (ts.isTemplateExpression(node)) return HAN.test(node.head.text) || node.templateSpans.some((s) => HAN.test(s.literal.text));
  return false;
}
export { ts };
