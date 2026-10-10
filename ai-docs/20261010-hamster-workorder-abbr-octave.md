# 给音乐仓鼠的工单：乐器简写 + 记谱八度 / 铃的八度（MoonSinger）

> created 20261010 by Claude Opus 5.5 · as-of MoonSinger v0.9.26 / 2026-10-10
> 起因：user 2026-10-10「小件做，仓鼠给简写」「几个铃的到底哪个八度算数还是没有弄清楚。不过先向用户披露」「铃铛会很高。8va可以做了吗」。
> 交付照以前：进 `export/moonsinger/` 的乐器数据（新版本号，只增不改），MoonSinger 用 `scripts/gen-instruments.mjs` 取货。数据结构下面只是推荐稿，你觉得不对直接改、告诉我。

## 1. 乐器简写（总谱第二行起每行谱前写的短名）

- 每个概念（instruments 表）加可选字段 `abbr`：`{ en: "Vn.", zh: "小提", ja?: "Vn." }`。
- en 用出版总谱的通行写法（Vn. / Vla. / Vc. / Cb. / Fl. / Picc. / Ob. / Cl. / Bsn. / Hn. / Tpt. / Tbn. / Tba. / Pno. / Hp. / Glock. / Xyl. / Vib. / Timp. / Perc. / Gtr. / B. Gtr. / Dr. / S. A. T. B. …），带出处（比如 Gould《Behind Bars》、MusicXML `<part-abbreviation>` 的惯例、维基）。
- zh：中文总谱 / 民乐总谱里有通行简称的照抄（带出处），没有通行写法的就空着（MoonSinger 会退回 en 或截名字），**不要现编**。
- 民族乐器（二胡、古筝…）同样：有通行简称才写。
- 月读 / 人声类：给一个人声的简写（如 Vo.）即可，月读本人的显示名 MoonSinger 自己管。

## 2. 记谱八度（谱上写的 vs 实际响的）

- 每个有音高的概念加可选字段 `notation`：`{ clef: "G" | "G8vb" | "G8va" | "G15ma" | "F" | "F8vb", sounds: 半音数, source }`，意思 = 这件乐器的谱**惯例**用什么谱号写、谱上写的音比实际响的低 / 高多少（例：吉他 G8vb、−12；低音提琴 F、−12；短笛 G、+12；钢片琴 G、+12；木琴 G、+12；钟琴 G、+24；管钟？）。
- 降 B 单簧管、F 调圆号这类非八度的移调乐器也可以顺手给（W-22 那条，MoonSinger 暂时只用八度的那部分）。
- MoonSinger 这边的用法：谱号「自动」的时候参考它（铃会挑 15ma / 8va），以及乐器页上披露「这件乐器的谱惯例写低两个八度」。数据里存的音高永远是实际音高，不动。

## 3. 铃的八度到底哪个算数（GS 实测）

user 的疑问：几个铃（钟琴、管钟、音乐盒、钢片琴、颤音琴、铃…）听起来的八度和写的对不上。请按以前「音效原速键」那套 TinySoundFont 实测的办法，对 GS 2.0.3 里这些音色：
- 按某几个键，量最强的那个频率（以及能听出来的「音高」那一个，如果不一样），记下 **MIDI 键 → 实际最强频率对应的音** 差几个八度；
- 钟类有「打击音」（strike tone）比基音低一个八度、耳朵常听成低八度的现象，有出处就写上；
- 交付成 gm-map 每行一个可选字段，比如 `octaveCheck: { measured: 半音差, perceivedNote?: "…", source }`。

MoonSinger 先做的是「向用户披露还没核对」，拿到数据以后改成按数据披露。

## 4. 不急的

- 分类颜色（tab20 按类别）MoonSinger 会用现有的 family / kind，暂时不用新字段。
