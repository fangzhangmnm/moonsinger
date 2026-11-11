export declare const MODEL_SOURCE_DEFAULT = "https://fangzhangmnm.github.io/pwa-models";
export interface ModelSources {
    /** 设置里填的模型来源（这次打开里有效；空 = 出厂默认）。 */
    source: string;
    /** 逐个试的地址：同一个网站下的 pwa-models/ 先，再设置里的。 */
    bases(): string[];
}
export declare function createModelSources(): ModelSources;
