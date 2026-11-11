export type Availability = "best-effort" | "session" | "unavailable";
export interface Health {
    level: "ok" | "degraded" | "unavailable";
    reasons: string[];
}
/** 这一页的存储靠不靠得住（第一次问时探一次，之后只会往下降）。 */
export declare function availability(): Availability;
/** 健康 + 人话理由。 */
export declare function health(): Health;
/** 半路降级时通知（开局就不可用的不通知——开局那一句由宿主读 availability() 说）。返回退订。 */
export declare function onHealth(cb: (h: Health) => void): () => void;
