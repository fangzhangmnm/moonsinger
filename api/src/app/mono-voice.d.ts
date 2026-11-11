export interface MonoHeld<P> {
    id: string;
    p: P;
}
/** 按下 id（音 p）：返回新栈 + 要停声的那些 id（前面在响的）。同一个 id 再按 = 挪到栈顶。 */
export declare function monoDown<P>(stack: readonly MonoHeld<P>[], id: string, p: P): {
    stack: MonoHeld<P>[];
    silence: string[];
};
/** 松开 id：返回新栈 + 要回到的那个（松的是正在响的那个、前面还有按着的 = 回到前一个；松的是被顶掉的 = 没有要回的）。 */
export declare function monoUp<P>(stack: readonly MonoHeld<P>[], id: string): {
    stack: MonoHeld<P>[];
    back: MonoHeld<P> | null;
};
