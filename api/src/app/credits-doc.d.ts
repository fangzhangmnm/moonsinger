export interface DocSection {
    id: string;
    title: string;
    body: string;
}
/** 这一篇的各节（顺序 = 文里的顺序）。lang = 界面语言（中文界面多给中文译文；英文译文都给）。 */
export declare function creditsSections(lang: string): DocSection[];
/** 整篇的 HTML（每节一个 section，id = doc-<节 id>，跳转用）。 */
export declare function sectionsHtml(sections: readonly DocSection[]): string;
