/** 这一下滚轮走几步（往下滚 = 正）；acc = 上次攒下的零头，返回新的零头。 */
export declare function wheelSteps(e: Pick<WheelEvent, "deltaMode" | "deltaY">, acc: number): {
    steps: number;
    acc: number;
};
