import { type EditorState, type Token } from "./song.ts";
import { stepIndex } from "./pitch.ts";
/** 选中的那一段（没选中 = null）。原样切片，id 原样（贴的时候重编）。 */
export declare function copyTokens(st: EditorState): Token[] | null;
/** 选区真正的起点：往前带上紧挨着第一个音、挂在它身上的记号（力度 / 渐强渐弱 / 风格——它们记在音的前面，v0.7.27 起「落在光标前那个音」）。
 *  2026-10-08 深夜 Opus 5.5，user「复制一段歌的时候第一个音头上的力度符号没被选进来」。小节线 / 句号 / 调号拍号速度不带。 */
export declare function clipFrom(st: EditorState): number;
/** 贴：有选中 = 替换选中；没有 = 插在光标处。id 从 nextId 重编；光标落在贴的末尾；本次输入记录清空。 */
export declare function pasteTokens(st: EditorState, toks: Token[]): EditorState;
/** 剪切 = 复制 + 删掉选中（光标留在原处）。 */
export declare function cutTokens(st: EditorState): {
    st: EditorState;
    toks: Token[];
} | null;
/** 全选 = 这条 track 谱头之后的全部（文本框的范围：这张纸上这个声部）。 */
export declare function selectAll(st: EditorState): EditorState;
export { toDegree, fromDegree } from "./degree.ts";
/** 一段 token → 简谱文字（相对 fifths）。 */
export declare function toJianpu(toks: Token[], fifths: number): string;
/** 简谱文字 → token（相对 fifths；读不懂的词 = 整段不认，返回 null——别把别人聊天里的话当谱）。id 从 0 起（贴的时候重编）。 */
export declare function fromJianpu(text: string, fifths: number): Token[] | null;
/** 选区开头 / 光标处生效的调（简谱文字相对它写 / 读）。 */
export declare const fifthsAtSel: (st: EditorState) => number;
export { stepIndex };
