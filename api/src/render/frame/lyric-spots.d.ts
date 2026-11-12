/** 一个音的歌词锚点（框架照着写字、拖腔线、点击框；施工单 1b-7）：index = token 下标；sys = 第几行（行内序号）；row = 点击框归哪一行；
 *  cx0 = 字的中心（px，对齐符头中心）；mx0 / mx1 = 拖腔线的左右端；lyric = 字（null = 空着的歌词位）；tok / cls = 图元的 tok 和 class；mute = 唱不出来（画灰）；hyph = 词没完（连字符）。 */
export interface LyricSpot {
    index: number;
    sys: number;
    row: number;
    cx0: number;
    mx0: number;
    mx1: number;
    lyric: string | null;
    tok: number | undefined;
    cls: string | undefined;
    mute: boolean;
    hyph: boolean;
}
/** 一条轨的歌词锚点 + 歌词挂在哪一行（第 s 行 → 行号；大谱表 = 下面那条）。r = 这条轨在这张纸上的序号。 */
export interface LyricPart {
    r: number;
    lrow: (s: number) => number;
    spots: LyricSpot[];
}
