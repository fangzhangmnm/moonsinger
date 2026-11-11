/** 画多少个点（隔几个采样取一个）。v0.10.41 起 = **散点**（user「顺便李萨如试一下散点」；对数半径之后再试一次）。
 *  历史：v0.10.17 user「李萨如图既然采样率就是个笑话，用散点？」→「还是用线不要用散点，就是能让线看起来圆润一点吗」= 过中点的二次曲线连（v0.10.17–40）。 */
export declare const SCOPE_POINTS = 512;
/** 一帧左右采样 → SVG path（viewBox -1 -1 2 2；每个点一小截圆头的线 = 一个圆点）+ 左右相关（−1…+1；几乎没声 = null）。 */
export declare function stereoShape(L: Float32Array, R: Float32Array): {
    path: string;
    corr: number | null;
};
