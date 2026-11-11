export type Deployment = "site" | "itch" | "local";
/** 纯函数（单测钉死）：协议 + 烤进来的标记 → 部署方式。 */
export declare function detectDeployment(protocol: string | undefined, marker: string | null | undefined): Deployment;
/** 这一页的部署方式（第一次问时认，之后不变）。没有 document / location 的环境（node 测试）= site。 */
export declare function deployment(): Deployment;
/** 被套在别人页面里（itch 的框、任何 iframe）。跨域读 top 抛异常 = 当作被套着。 */
export declare function embedded(): boolean;
