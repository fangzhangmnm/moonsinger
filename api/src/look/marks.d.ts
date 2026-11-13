/** 渐强渐弱和两头的字之间留多少（sp）；比一整行还长 = 写「cresc. - - -」（字的大概宽 / 虚线一节多长、隔多远）；渐到的虚线。原样从 staff/glyphs.ts 搬来。 */
export declare const PIN_GAP = 0.7;
/** 一个楔形（发夹 / 渐到）最短多长（sp）：整条短于它就拉到它；折到下一行的那一段短于它就不画。 */
export declare const PIN_MIN = 1.4;
export declare const PIN_WORD: {
    readonly w: {
        readonly cresc: 4.7;
        readonly dim: 3.5;
    };
}, DASH: {
    readonly len: 0.6;
    readonly gap: 1;
};
/** 渐到的虚线（统筹看样张 ⑩：原来固定 0.5 / 0.4 的小段，A5 上短的发夹碎成一串点）：段数跟着这一段发夹的长度定——每段大约 len（sp）、空隙 = 段长 × gapK，
 *  至少两段；短的发夹 = 更少、更长的段，两头都落在发夹的两端。空隙是段长的一半 = 一眼看得出是虚线（渐到），不是实线（手写的渐强渐弱）。 */
export declare const RAMP_DASH: {
    readonly len: 1.2;
    readonly gapK: 0.5;
    readonly min: 2;
};
/** 踏板线的几何（sp；原 src/render/ornaments/index.ts，画法和规矩写在那边 layPedals 上面）：字缩多少、离上面的东西多远、字和线之间、钩多高、换踏板的尖多深、钩往里收多少。 */
export declare const PEDAL: {
    readonly scale: 0.8;
    readonly gap: 1;
    readonly textGap: 0.3;
    readonly hook: 1.1;
    readonly notch: 0.45;
    readonly hookIn: 0.3;
};
/** 行中间换谱号：小一号的谱号（谱号的 0.72）占多宽（sp）。（原 src/render/staff/units.ts） */
export declare const CLEF_CUE = 0.72, CLEF_CUE_W: number;
/** 「1=F♯」这几个字大约多宽（sp，TEMPO_EM × 0.85 的字号）：按 C 调看时中途换调那一处至少留这么宽。（原 src/render/staff/units.ts） */
export declare const KEY_LABEL_W = 3.5;
/** 五线谱各种单元在字形宽之外留的白（sp；原来写在 src/render/staff/units.ts STAFF_WIDTHS 的式子里，17-2 拆出来，数一个没改）。
 *  repeat = 反复小节线字形两边、barStyle = 段落线 / 终止线比一根小节线多宽、time = 拍号字之外、tempo = 速度那一格、acc = 有临时记号的音前面、dot = 附点、
 *  lyricHyph / lyricPlain = 按歌词排时字后面（有连字符 / 没有）、breath = 呼吸逗号、inhale = 出声的换气（逗号后面的字）。 */
export declare const STAFF_UNIT: {
    readonly repeat: 0.8;
    readonly barStyle: 0.7;
    readonly time: 1.2;
    readonly tempo: 0.3;
    readonly acc: 1.3;
    readonly dot: 0.6;
    readonly lyricHyph: 1.4;
    readonly lyricPlain: 0.7;
    readonly breath: 0.8;
    readonly inhale: {
        readonly soft: 1.2;
        readonly big: 2.1;
    };
};
/** 调号多宽（sp；原来写在 src/render/staff/units.ts keyWidth 和 staff/measure.ts lineStartWidth 的式子里，统筹「v0.17.22 收」第 2 条起名字，数不改）。
 *  acc = 调号里每个升降号占多宽（行首和行中换调同一个数，只定义这一次）；natural = 行中换成 C 调时每个还原号占多宽；after = 行中换调之后留多少。 */
export declare const KEY_SIG: {
    readonly acc: 1.05;
    readonly natural: 0.8;
    readonly after: 1;
};
/** 五线谱行首（sp；原 src/render/staff/measure.ts lineStartWidth 式子里的数）：谱号前、谱号后、有调号时调号后、第一行拍号后、没有拍号的行首尾巴。 */
export declare const LINE_START: {
    readonly beforeClef: 0.6;
    readonly afterClef: 1;
    readonly afterKey: 0.8;
    readonly afterTime: 1.2;
    readonly noTime: 0.4;
};
