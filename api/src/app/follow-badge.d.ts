export type Follow = "song" | "account" | "device";
/** 那句话（设计稿第四节的表；「跟歌库」那句补了没连歌库时的去处——不连也照样记着，不能让人以为没存）。 */
export declare const FOLLOW_TEXT: Record<Follow, () => string>;
/** 名字后面那枚（HTML）。 */
export declare function followBadge(f: Follow): string;
/** 在根上挂一次：点（或回车）那枚 = 说出那句话。回一个解绑。 */
export declare function wireFollowBadges(root: HTMLElement, say: (text: string) => void): () => void;
