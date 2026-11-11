export interface El {
    name: string;
    attrs: Record<string, string>;
    children: (El | string)[];
}
export declare const esc: (s: string) => string;
/** 解析整份 XML，返回根元素。格式不对就抛错（说清在哪）。 */
export declare function parseXml(src: string): El;
export declare const kids: (el: El | undefined, name?: string) => El[];
export declare const kid: (el: El | undefined, name: string) => El | undefined;
export declare const text: (el: El | undefined) => string;
/** 子元素的文字（去首尾空白）；没有 = undefined。 */
export declare const childText: (el: El | undefined, name: string) => string | undefined;
