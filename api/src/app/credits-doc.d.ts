export interface DocSection {
    id: string;
    title: string;
    body: string;
}
/** 小月相的署名与使用条款那一节的 id（设置「音源」页她那一栏的「全文…」只开这一节；「关于」页开别的几节，13-2）。 */
export declare const VOICE_CREDIT_SECTION = "tsukuyomi";
/** 这一篇的各节（顺序 = 文里的顺序）。lang = 界面语言（中文界面多给中文译文；英文译文都给）。 */
export declare function creditsSections(lang: string): DocSection[];
/** 整篇的 HTML（每节一个 section，id = doc-<节 id>，跳转用）。 */
export declare function sectionsHtml(sections: readonly DocSection[]): string;
