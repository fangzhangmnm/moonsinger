// contract.ts —— `.mxl` 里 `.moonsinger/` 各份 JSON 的形状（人读的 .h；v1 / v2 = 代码现在写的，守卫测试照它查；标「提案」的 = **推荐稿**，不是定稿——
//   user 2026-10-07「fable的任何数据结构契约都只是推荐稿，不对立刻说」：做多轨的 session 对着 0.2.x 的手感用，不对就改、报 user、知会格式 session）。
// created 2026-10-07 by Claude Fable 5.1（user「数据结构你来把关」「碰到格式问题就问你」）；2026-10-07 深夜起契约与编辑器同一个 session 管。
// 来龙去脉与 user 原话 = ai-docs/20261007-data-contract-draft.md（§3 目录表、§7 未定、§8 谁的字节、§10 音源）。
//
// 规矩（第 16 条起，2026-11-12；家规硬规则 #9、仓说明「文件就是语义：本仓的细则」）：
//   · 读 = 文件上怎么写就怎么读：只认这一版格式里有定义的键，**没有升级链、不转换、不按版本号分路**；缺的数用现行默认补；退役的键不理。
//     一个键的意思永远不变，想换意思就换一个新名字的键（不然老文件的那个键会被读成新的意思）。指向别的东西的读不到 = 断了，照实标出来，不顶替。
//   · 只拒开大版本比 app 新的；小版本更新说一次。
//   · 写（第 16 条 16-3）= 每个键都明写（等于默认也写）；只写这一版有定义的键；那一份比这一版新（同大版本、小版本更大）= 不认识的键 / 包里不认识的文件
//     **和那一份的版本记号**原样带回（统筹 2026-11-12 夜「v0.17.12 收」第一件）。版本记号的意思 =「这一份里的东西最新到哪一拍」，不是谁最后存的（谁最后存的看总目录的 app）；
//     同一个大版本里只加不改，所以旧程序重写它认识的键、留着新的记号是安全的。平常写当前拍。
//     **和家族格式纪律对不上的一处**：家族文档写「拍子永远写自己的」，别的 app 是无条件带回不认识的键、没有「记号写成自己的 → 下次认不出它新 → 又丢」这个洞；本仓按上面这句，家族文档等对账时改。
//   · 读到写坏的值（类型不对 / 这一版不认识的值）= 照转码的模型：读成默认、存的时候写默认，不逐键原样带回（比自己新的那一份里已知键的怪值也一样）。
//     原样带着的只有两处：不认识的效果种类、读不懂的引擎那一位乐手（整份）。
//   · 只加可选字段 = 不升版本，但写出来的键集合变了 → 守卫测试红，跑 node scripts/freeze-format-sample.mjs 更新形状快照、审 diff。
//   · 守卫 = test/format-guard.test.ts：形状快照、平常写当前拍 / 比自己新的照原样带回、冻结样本照写的读（读不懂的明说）。
//   · 几个键的意思（名字不一眼看得出来的；统筹 2026-11-12 夜「名字对不上的清单」，不改名、写明）：
//     - 歌词每个音节的 `xml:lang`（每张纸的 MusicXML）：程序按唱的规矩写出去的（engine/timeline.ts sungLangsOf：小月相唱的那一段里有假名 = 日…），**读的时候不看**；音符上不记语言。
//     - score.json `parts[].clef: "auto"`：这个声部每一段 MusicXML 里第一个 <clef> 是程序挑的（自动谱号的结果），不是人写的；人手选的谱号 = 纸头的谱号记号（第二个 <clef>）。
//       不写 / 写别的 = 第一个 <clef> 照写的读成人写的。不改名：改了现有每首歌纸头的谱号都会被读成人写的记号。
//     - score.json `view.pageFlow` + `view.scroll`：视图态的排法（连续 / 分页 / 横卷），两个布尔；两个都 true = 横卷。
//     - 休息室 SoundFont 乐手 `instrument.note`：写了一个键号 = 每个音都敲这个键（鼓件 / 音效固定原速）；`null` = 按写的音高敲（不固定也明写；读的时候没写和 null 一样）。
//     - 效果参数 `room` / `damp`（混响）= Freeverb（公开算法）的同名参数；各效果的 `mix` / `dry` = 线性的幅度倍数。混音台上的秒 / kHz / dB 是从它们换算出来给人看的（engine/fx.ts 各自的公式）。
//   · 参考窗目录 `.moonsinger/references/`（v0.8，2026-10-08 深夜 Opus 5.5；对齐稿 ai-docs/20261008-reference-window-alignment.md）：
//     整个目录归 @internal/reference-window（manifest.json 自带版本号和迁移 + 每张卡一个 r<i>.<ext>），这一层零知识、原样进出（project.ts REFERENCES_DIR）；
//     不列进我们的 manifest、不升 FORMAT；窗的位置在 score.json view.ref（ViewV1 可选字段）。老版本 app 读到 = 当不认识的文件原样写回。

/** 这一版能读写的各份文件的版本号（改格式 = 这里 +1 + 冻结样本；守卫测试盯着。第 16 条起没有升级链：老文件照写的读）。
 *  lounge 2（2026-10-07 深夜，user「现在开始好好做乐器这个数据结构，不要偷懒」）：候选从「月读形状 + 贴字段」改成按引擎分的乐器。
 *  manifest 2 / score 2（2026-10-08，0.5.0 多声部多纸，存法 B）：纸的顺序表 + 声部并集；每张纸一份 MusicXML 正本，score.musicxml 变派生件。
 *  lounge 3（9-2，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；user「按照SoundFont对齐，然后小月相也应该对齐」，统筹裁定走大版本）：力度 → 响度全体演奏者只有一条
 *  （响度 = 40·log10(力度 ÷ 127)，SoundFont 规范的放法；score/perform.ts velocityDb）。候选按值存的 dynamicsDb（小月相 / 元音版那张「力度字母 → dB」的表）和
 *  articulation.wedgeStepDb 退役（当时的迁移 2→3 删这两个键；第 16 条起没有迁移；16-4 起按音量走的小月相 / 元音版的 dynamicsDb 恢复成她的力度、照文件读，见下面 lounge minor 3）；新建的候选都按值带 dynamicsVel。为什么是大版本不是小版本（统筹的三条）：
 *  ① 旧版本拿「有没有 dynamicsVel」当分路的开关（gainSegments 里 vel = !!spec.dynamicsVel）：读到带表的小月相会把她当成按力度敲的，音量曲线里不再有力度水平，
 *     她又不吃力度——她的强弱整个没了。这不是「声音不太一样」，是旧读者把新数据读成了另一个意思。
 *  ② 这次改的是约定本身（力度记号多响），user 的原话是吃书：新约定下存的歌本来就不该让旧版本去放，明确拒开比提示一次之后放错好。
 *  ③ 形状守卫「删 / 改字段 → 大版本 + 迁移」照它走。代价：新版本存过的歌，旧版本（当时的正式版 v0.16.105）拒开，直到正式版也更新（统筹告诉 user）。 */
export const FORMAT = { manifest: 2, score: 2, lounge: 3, studio: 2 } as const;
export type FormatFile = keyof typeof FORMAT;
/** 家族格式版本纪律（2026-10-21，家族根 ai-docs/20261021-format-version-discipline.md；user「版本纪律能做成 catsup moonsinger 一样不同 component 有自己的拍子…这个变成全家的版本纪律」「三级语义 同意」）：
 *  `version` = major（整数拍照旧：不可兼容 / 重大安全问题才 +1；老读者只认它，比自己新 = 拒开），再加两个可选整数键 `minor` / `patch`（缺 = 0）：
 *  minor +1 = 加了可选字段 / 新的子表 / 新的默认行为（老读者能开能改能存、未知键原样带回、告诉用户一次）；patch +1 = 写法 / 默认值修正（老读者静默）。
 *  minor 1 = 追认 major 2 之后加过的所有可选字段（2026-10-08 → 10-21：manifest 的 core / final / finalRev / sounds；score 的 view / arrangement / lyricFit / barNumbers / parts.clef / host / autoOttava、
 *  papers 的 phrases / swells / hidden；lounge 的 articulation / chain / defaults 那些；studio v2 的 master.chain / bypass / sends / dry…）——以前写的文件没有这两个键 = 0.0，读起来一样。
 *  出声内容的指纹（渲染缓存的钥匙；以前是定稿的记录）不看 minor / patch（project.ts fpTextOf）。改 minor / patch 不用迁移、不用冻结样本，只跑 freeze-format-sample 更新形状快照。added 2026-10-21 by Claude Fable 5.1 */
/** score minor 2（v0.16.73，2026-11-09 Claude Opus 5.5）：parts[].brokenChords（可选，只写 false = 这位不认分解和弦）——老版本读进来会丢掉它（parts 按歌重建），所以照纪律 +1、让老版本提示一次。 */
/** score minor 3（v0.16.83，2026-11-10 Claude Opus 5.5；user 11-10 同意往歌里加）：调号上的「小调」= 每张纸 MusicXML 里 <key><mode>minor</mode>（大调照旧不写）。
 *  老版本读进来当大调、存一次就没了（音不丢），所以 +1、让老版本提示一次。这一轮后面几样（挑过的和弦名、每段的谱号 / 大谱表）也算在 minor 3 里。 */
/** score minor 4（v0.16.88，2026-11-10 Claude Opus 5.5；user 11-10「一同意」）：谱号 / 大谱表 / 自动八度线从声部搬到每一段——
 *  手选的大谱表 = 那张纸自己的 <staves>2（以前每张纸都写）、这一段关了自动八度线 = papers[].autoOttava（声部 id → false）、手选的谱号 = 纸头谱号记号；
 *  parts[].clef 照旧写 "auto"（给旧版本看），parts[].autoOttava 不再写。读：minor < 4 = 老写法，搬到每一段（project.ts songFromReads）。
 *  旧版本打开：手选了大谱表的声部整首成大谱表、每段关的自动八度线回到开着，音不丢，提示一次。 */
/** 复查（2026-11-10 Claude Fable 5.2；user「看一下文件格式的设计是否干净，还是乱。吃书是允许的」）——拿正式版 v0.15.5、v0.16.82、v0.16.87 的真代码当读者 / 写者跑过，结论和补的几处：
 *  · 「一个声部在一段里怎么画」分三处放，各有出处，不合并：手选的谱号 = 纸头的谱号记号（v0.9.28「只改这张纸」起就是这个写法，老歌里已经有）；手选的大谱表 = 那张纸 MusicXML 的 <staves>2（标准写法）；
 *    关自动八度线 = papers[].autoOttava（MusicXML 说不了「别自动画」）。自动挑出来的（谱号 / 大谱表 / 八度线）一律不算数据：正本里写的是挑好的结果或者不写，读的时候不认。
 *  · 旧版本开了新歌再存一次，实测会丢的（比上一段写的多）：小调、和弦名（旧版本会说「和弦记号 N 处没读进来」）、每段关的自动八度线；
 *    哪一段手选了大谱表 → 那个声部每一段都成大谱表，**并且这个声部每一段的谱号记号（纸头手选的、中途换的）都没了**（旧版本写大谱表时不写谱号记号）。音、歌词不丢。这就是 minor 的代价，旧版本改不了。
 *  · 大谱表那一段里的谱号记号：这一版起照写照读（<clef number="1">，musicxml.ts）——原来写的时候跳过，选过大谱表再存一次就悄悄没了。画大谱表时仍然不看它。
 *  · 没有标准名的和弦种类（7sus4 / add9 / 6/9 / 7♭9…）在 <kind text="…">other</kind> 里写的字 = 一张冻住的表（theory/western.ts XML_OTHER_TEXT），和谱上显示的字分开。
 *  · 没有改 major，也没有改 minor：补的都是「读得更多 / 不再丢」，v0.16.88–90 那一天存的歌照样开。 */
/** score minor 6（7-B 字母谱，2026-11-11 Claude Opus 5.5（MoonSinger小弟）；user「字母版本的变体的，别人还在等着要用呢」「下标放数字上标放升降号」，统筹细则 = 施工单第三½节 7-B）：
 *  顶层 notation 多一个值 "letters"（字母谱 = 简谱的变体：大写字母 + 右上角升降号 + 右下角八度数字）；顶层多一个可选的 middleC（整数，字母谱里中央 C 叫 C 几；只写不是 4 的，没写 = C4，冻住）。
 *  旧版本画不出来 = 缺功能：minor +1、让旧版本提示一次；旧版本（minor 5）读到 notation 照旧原样带回（字符串、不认识的值原样带回）、画的时候按五线谱；middleC 是未知键、原样带回。
 *  冻结样本 = test/fixtures/format/minor/score-6/。归修改锁的「看法」（锁着能切、锁着期间不写）。 */
/** score minor 5（谱面分家第三刀，2026-11-11 Claude Opus 5.5；user 11-11 夜「可以」= 把四样显示设置存进歌文件、都可选、没写就按默认、小版本号加一）：
 *  这首歌怎么看 = 顶层 notation（谱种，只写不是五线谱的；不认识的值原样带回）/ chordTags（只写 false = 不标和弦级数）/ viewInC（只写 true = 按 C 调看）+ parts[].chords（这条轨的和弦选项，
 *  只写不是 auto 的："stacked" = 只认叠在一起的、"fold" = 折叠成和弦名；不认识的值原样带回）。读 / 改 / 没写的意思只在 src/score/song-view.ts（没写 = 五线谱 / 标 / 不按 / auto，冻住不变）。
 *  parts[].brokenChords（minor 2）退役：读成 chords: "stacked"，不再写。
 *  旧版本打开：顶层三个键在 score.json 里原样带回（未知键直通），chords 按声部 id 原样带回（minor 4 起的读者），画的时候按五线谱、标和弦级数、不按 C 调看、也认拆开弹的；
 *  minor 2–4 的读者看不到「只认叠在一起的」（它们只认 brokenChords）。提示一次，音不丢。
 *  会丢的一种（知道、接受；统筹 2026-11-11 审第三刀）：新版存了 chords: "stacked" → 老版打开、把「分解和弦」关了又开 → 老版不写 brokenChords、chords 原样带回
 *  → 新版读成只认叠着的（老版最后那次改动丢了）。只写 chords 不两份都写，是为了不留两份真相。
 *  **chordTags、viewInC 永远是布尔**（统筹 2026-11-11 定）：以后要加花样（比如标和弦名）就加新键，不改这两个键的类型——这一版的读法是「不是 false / true 就当没写」、
 *  而且不带回，将来谁改了类型，这一版存一遍就丢了。notation、chords 是字符串，不认识的值原样带回，没有这个问题。
 *  viewInC 原名 inC（第三刀当天改名，带 inC 的文件一份都没出过门）：和设备上原来的键 view-in-c、setter setViewInC 统一。 */
/** score minor 7（7-M 歌词里的标点，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；user「标点符号既然没有语义，能不能不影响居中线地跟着上一个词？中文英文都一样」「我们的标点符号是纯cosmetic的，不影响articulation，也不应该灰」，统筹细则 = 施工单 7-M 第二稿）：
 *  歌词的字里可以带标点（MusicXML 的 <lyric><text> 本来就能写；结尾的挂在字后面、开头的挂在字前面），居中只按字、送去唱 / 算读音 / 判唱不唱得出来之前去掉（score/lyrics.ts lyricHang / lyricCore）。
 *  结构没变，变的是读法：minor 6 以前的版本打开会把带标点的字当成唱不出来（画灰、照字送去唱）= 行为有变化那一级：minor +1、让旧版本提示一次；旧版本照样能开能存，字原样带回。
 *  冻结样本 = test/fixtures/format/minor/score-7/（样本歌里「py,」「你。」）。 */
/** score minor 8（7-G，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；user 11-11 深夜「显示里面再加一个不显示articulation和表情的选项。打印时也许会用，相当于前面讨论的不overwhelm小孩和初学者」）：
 *  顶层多一个可选的 expressions（只写 false = 演奏法和表情不显示；没写 = 显示，冻住）。只管画——播放照写的来，歌里的记号一个不动；PDF 跟着眼前的样子。
 *  旧版本（minor 7）打开 = 不认识这个键、原样带回（未知键直通），照旧全画出来 = 缺功能：minor +1、让旧版本提示一次。归修改锁的「看法」（songLook：锁着能切、锁着期间不写）。
 *  冻结样本 = test/fixtures/format/minor/score-8/。 */
/** score minor 9（踏板 11-1，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；user 11-12「那么几种踏板也做一下，钢琴也需要」；设计 = ai-docs/20261112-pedals-and-ring-design.md）：
 *  谱里多一种记号：踏板（延音 / 持音 / 弱音 × 踩下 / 抬起 / 换踏板），MusicXML 原生写在每张纸的正本里（<pedal> / <sound …-pedal> / 弱音的 una corda / tre corde），score.json 不变。
 *  旧版本（minor 8）打开 = <pedal> 不认识（那一版连「读不了的」都不数）、照写的放；存一次踏板就没了，音不丢（每张纸的 MusicXML 按 token 重写，不认识的 MusicXML 元素带不回）
 *  = 缺功能：minor +1、让旧版本提示一次。冻结样本 = test/fixtures/format/minor/score-9/（样本歌第一张纸带延音踏板）。 */
/** score minor 10（施工单 12-4，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；user「页面设置是不是也应该有一个语言，影响打印？还是打印的时候自己调语言？think critically about it」，统筹定 = 歌里一项）：
 *  顶层多一个可选的 textLang = 谱上的字用哪种语言（"zh" / "en"；只写不是「跟着界面」的）。只管软件自己生成、印出来的字（目录 / 预设里的乐器名、简谱鼓的图例、「编排」、「吸 / 深吸」）。
 *  没写的意思在进门那一处定（project.ts songViewFields：没写 = 跟着界面），之后歌里永远有值（Song.textLang 必填）。
 *  旧版本（minor 9）打开 = 不认识这个键、原样带回（未知键直通），照界面语言印 = 缺功能：minor +1、让旧版本提示一次。归修改锁的「看法」（songLook）。
 *  冻结样本 = test/fixtures/format/minor/score-10/（样本歌写 en）。 */
/** lounge minor 1（施工单 12-4，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；user「全部声部里面翻译没有跟，以及好好想一下声部到底要不要自动翻译」→ 统筹提「名字和乐器分开」，user「同意」）：
 *  ① 角色的 name 可以没有 = 没起名字（谱上写乐器的叫法）；有 = 用户起的，原样。只有这一个来源，不另存「起没起」的旗。
 *  ② 概念多两个可选的键：score（谱上写的叫法，按语言）、abbr（谱前的简写）。上场时从目录按值抄。
 *  **老文件（minor 0）照文件读**（第 16 条，2026-11-12，user 定的甲：「我也建议是按照文件显示，照文件显示。如果我觉得烦，我可以手动改」）：存着的名字就是起了的名字、原样显示，
 *    不再判「是不是软件当年抄的」；没有概念的照名字显示，不认成预设。（12-4 那一版进门时判一次的做法和冻住的预设表一起删了。）
 *  ③ score / abbr 是按值存的副本（文件说得清自己、<part-name> 也要写），**不是显示的依据**：没起名字时显示先查现行的表（src/gm/concept-labels.gen.ts，跟着目录更新重烤），
 *      表里没有这个概念才用按值存的；存的时候按现行的表重写（12-4 改口，统筹 2026-11-12；user「我讨厌历史遗留问题导致的convention需要再记一个」）。
 *  旧版本（minor 0）读到没名字的角色 = 显示它默认的 Vocals（照 minor 的规矩提示一次）；没有受影响的老读者（正式版打不开现在的文件，开发版只有最新的在用）。
 *  冻结样本：test/fixtures/format/minor/lounge-0-named/ 和 lounge-0-unnamed/（这一版之前的代码写的，一个会被判成没起、一个是起了名字的）。 */
/** 第 16 条 16-3（2026-11-12 Claude Opus 5.5（MoonSinger小弟））：存的时候每个键都明写、版本不比自己新只写有定义的键。加了新合法值 / 新键的三份各升一个小版本：
 *  score 11：默认那一档有名字、都写——lyricFit "rhythm"、barNumbers "line"、spacing "normal"、notation "staff"、chordTags true、viewInC false、middleC 4、expressions true、
 *    textLang "ui"、arrangement ""；papers[].hidden false、papers[].autoOttava 每个在场的声部 true / false、swells {}；parts[].chords "auto"、host null；view 每一项都写（pad 多一个 auto）。
 *  lounge 2：哼的字只在乐手身上（不再整首一个、不再存的时候抄给每一位）；乐手缺的数存的时候按现行默认写全；dynamicsDb / articulation.wedgeStepDb 算有定义的键（照写照读，16-4 再定）；
 *    articulation.rollHz 可以是 null（= 按乐器）、canSwell 明写。
 *  studio 2：轨的 bypass、效果的 on 明写；效果参数表里每个参数都写；「原声」dry 没写 = 参数表的默认（原来 = 1 − 湿）。
 *  lounge 3（第 16 条 16-4，2026-11-12 夜，统筹「v0.17.12 收」四问）：按音量走力度的乐手（插件报 dynamics: "gain"，现在 = 小月相 / 元音版）的力度 = 身上的 dynamicsDb（八档 → dB；
 *    意思和老的一样：这个力度记号下她的声音乘多少 dB），程序里没有公式和深度；她们不写 dynamicsVel / articulation.wedgeStepVel。按力度敲的（SoundFont）照旧 dynamicsVel / wedgeStepVel，
 *    身上老的 dynamicsDb / wedgeStepDb 不再有定义、不写。音符上的 lang 删（xml:lang 按唱的规矩写、读的时候不看）；SoundFont 的 instrument.note 不固定也明写 null。
 *    旧读者（lounge 2）读到：dynamicsDb 是它认识、但运行时不读的键 = 照它自己的公式放（模板那八个数就是那条公式算的，新建的歌听起来一样；带老表的那几位不一样），提示一次。
 *  **力度路是契约**（统筹 2026-11-12 夜「v0.17.13 收」）：每位乐手身上写哪些键，看它的引擎插件报的 dynamics（音量 gain / 力度 velocity）——所以一个引擎名走哪条路永远不变，
 *    想换路 = 换一个新的引擎名。现在：tsukuyomi = gain、vowel-sampler = gain、soundfont = velocity（守卫钉住）。演奏法的键按路分见 CandidateV2.articulation。
 *  旧读者（小版本更小）照小版本的规矩：能开能改能存、提示一次。 */
/** lounge minor 4（第 16 条 16-4 A / B / E / F，2026-11-12 夜，统筹「v0.17.13 收」「v0.17.15 收」）：新加两个键、一个键不再写 null——
 *  ① 小月相 instrument.outputGainDb（dB）：唱法核心原始输出进她那条轨之前乘多少（新建 = 模板 6.52；原来是插件里的常数 0.89 / 0.42 = 6.5228 dB）。
 *  ② SoundFont instrument.hitSecByKey：鼓 / 固定敲一件的着力点表（键 → 秒；整套鼓 = 目录里每个键、0 也写）。出声只读这一份（原来每次放都查目录）。
 *  ③ articulation.rollHz 只写数（老的 null = 按乐器，门口按鼓 12 / 有音高 14 补成数）。
 *  老文件（lounge ≤ 3）缺的这几样 = 读文件的门口按模板 / 目录补，不说话、不算改过；存的时候写。
 *  旧读者（lounge 3）读到：outputGainDb / hitSecByKey 是不认识的键（照它自己的常数 / 目录放，值一样）；rollHz 是数 = 当成调过的（值就是默认那一档）；提示一次。 */
/** studio minor 3（第 16 条 16-4 A2 + C，2026-11-12 夜，统筹「v0.17.16 收」）：总轨多一个键 master.limiterParams（限幅器的四个数，见 LimiterParamsV2）。
 *  另外几样意思不变、从此由门口保证明写：效果格的 on（老文件没写 = 开）、轨的 bypass（没写 = 不旁通）、效果参数表里每个参数（没写 = 门口按模板补——新插一格的那一份）。
 *  存的时候不再补、不再替声部建轨；新建的歌 / 新加的声部在建的那一刻按模板建好混音轨。旧读者（studio 2）读到 limiterParams = 不认识的键（照它自己的常数限幅，数一样），提示一次。 */
export const FORMAT_MINOR: Readonly<Record<FormatFile, number>> = { manifest: 1, score: 11, lounge: 4, studio: 3 };   // lounge 3（9-2）起小版本从 0 数
/** manifest patch 1（v0.16.97，2026-11-10 Claude Fable 5.2；user 11-07「定稿取消，换修改锁」、11-10「对，以后统一不存mp3，旧的也删掉」）：这一版起**不再写** `final` / `finalRev`
 *  和 `.moonsinger/final.mp3` 这个 entry。少写一样东西、别的一个键没动：老版本读到 = 没有定稿记录 = 没定稿，照常开（所以是 patch、老读者静默）；
 *  这一版读老文件 = 认得它们，mp3 交给宿主搬进设备缓存（project.ts LegacyMp3），再存就不带了。 */
/** score patch 1（施工单 7-J，2026-11-12 Claude Opus 5.5（MoonSinger小弟）；user「现在有没有人真的在用带拼音的导出。 no, 我也建议先sunset」）：拼音字体退役，
 *  视图态 view.pdf（乐谱 PDF 的字体，只写过 "pinyin"）**不再写**。少写一个视图态的键、别的一个没动：老版本读到 = 没写 = 黑体，照常开（所以是 patch、老读者静默）；
 *  这一版读老文件里的 "pinyin" = 不理（照黑体印、不报错），再存就不带了。不用迁移、不用冻结样本（照 minor / patch 的规矩，只更新形状快照）。 */
export const FORMAT_PATCH: Readonly<Record<FormatFile, number>> = { manifest: 1, score: 1, lounge: 0, studio: 0 };

// ═══ 现役（project.ts 写的就是这些）═══════════════════════════════════════════════════════

/** `.moonsinger/manifest.json`：总目录。 */
export interface ManifestV2 {
  format: "moonsinger";
  version: 2;
  app: string;                         // 写它的 app 版本（如 v0.5.0-2026-10-08）
  saved: string;                       // ISO 时刻
  files: Record<string, number>;       // `.moonsinger/` 下每份文件 → 它的版本号（"score.json" / "studio.json" / "lounge/r1.json"…；"papers/p1.musicxml" 记 0 = 标准件）
  derived: string[];                   // 派生件（zip 根下的路径；自家读时无视、存档时重新生成）：["score.musicxml"]
  /** 2026-10-07 加（可选）：歌里嵌的音源字节（契约 §10.2 样本类 by value）。path 相对 zip 根（`.moonsinger/sounds/<sha256>.sf2`）。 */
  sounds?: { path: string; sha256: string; bytes: number }[];
  /** 2026-10-16 加（可选，不升版本；Claude Fable 5.1，W-38）：渲染核心的版本 + 哈希，**每次保存都记**（user 2026-10-13「核心的版本号和hash反而是每次保存的时候都要记的。ui壳无所谓」）。
   *  version 人定（src/core/version.ts CORE_VERSION）；hash = 构建时按核心源码（src/core src/engine src/singer src/performers src/score src/gm src/format + vendor/world vendor/tsf + assets/preview）算的 sha256 前 16 位（scripts/core-hash.mjs）。 */
  core?: { version: string; hash: string };
  /** 2026-10-16 加（可选）：定稿过几次。**2026-11-10 起不再写**（定稿退役，manifest patch 1）；老文件里有 = 读的时候不看、再存不带。 */
  finalRev?: number;
  /** 2026-10-16 加（可选）：定稿记录（src/format/final.ts FinalRecord）+ zip 里的 `.moonsinger/final.mp3`（定稿那一刻渲染的 mp3，不压缩）。
   *  **2026-11-10 起不再写**（定稿退役，manifest patch 1）。老文件里有：记录像样 ∧ mp3 在 ∧ fingerprint 和文件里的内容对得上 = 那份 mp3 交给宿主搬进设备缓存；
   *  别的情况当它不存在（不报错、不拒开）。两种情况再存都不带。歌库里还没重新存过的老文件，封面上照旧能按 entry 名尾读那份 mp3 来听。 */
  final?: unknown;
}

/** `.moonsinger/score.json` 第 2 版：纸的顺序表 + 声部并集（存法 B，§6¾）。按声部 id / 音符 id / 小节序号挂注，不复制谱的内容。 */
export interface ScoreExtV2 {
  version: 2;
  /** 顺序里的纸（纸 = 曲段）：file = 这张纸的 MusicXML 正本（`.moonsinger/papers/<id>.musicxml`）；manualBars = 声部 id → 这张纸里人插的小节线（小节序号，1 起）；
   *  unwritten = 这张纸还没写音高的音（note id）。自动小节线只画不存（0.2.x 现状）。曲段名在那份 MusicXML 的 <movement-title>。
   *  MusicXML 正本里我们自己认 id 的两样（别的软件照常显示；自家读回来按 id 认出来，不加 JSON 字段、不升版本）：
   *  渐到 = 虚线 <wedge id="ramp-…">；风格记号（拍子轻重，2026-10-08 深夜 Opus 5.5）= <direction><words id="groove.<预设 id>.<幅度百分数>.<token id>">名字</words>。
   *  谱内反复 / 跳转（2026-10-09 Opus 5.5；不升版本：MusicXML 原生、老版本 app 读到 = 不认的元素）：|: / :| / :|: = <barline location="left|right"> 的
   *  <repeat direction="forward|backward" times>（纸头的 |: 不开空小节）；房子 = <barline location="left"><ending number="1, 2" type="start">，被 :| 收 = stop、最后一个 = discontinue；
   *  Segno / Coda = <direction><direction-type><segno|coda id="nav.<种类>.<token id>"/></direction-type><sound segno|coda/>；Fine / To Coda / D.C.… / D.S.… = <words id="nav.…">字</words> +
   *  <sound fine | tocoda | dacapo | dalsegno>。纸的正本里是记号；派生的压平件 score.musicxml 已经按结构展开（没有这些记号）。
   *  老版本的 app 读到它们 = 当普通的发夹 / 文字忽略（风格记号会丢——老版本本来就不会放拍子轻重）。
   *  气声 / 出声的换气（2026-10-10 Opus 5.5；不升版本：MusicXML 原生）：气声 = <notehead>x</notehead>（和幽灵音一起 = <notehead parentheses="yes">x</notehead>；
   *  别家谱的 × 符头读进来也是气声——乐器不认、画灰，不影响出声）；出声的换气 = <breath-mark/> 后面紧跟 <other-articulation>inhale | inhale-big</other-articulation>
   *  （别的软件照样认得是换气；老版本的 app 读到 = 「不认的演奏法」数出来报，呼吸照旧）。 */
  papers: { id: string; file: string; manualBars: Record<string, number[]>; unwritten: string[]; hidden?: boolean; /** 退役（v0.16.86，句号整个去掉）：老歌里有，读的时候丢掉，不再写。 */ phrases?: Record<string, number[]>; /** v0.16.88（score minor 4，可选）：这一段关了自动八度线的声部（声部 id → false）。 */ autoOttava?: Record<string, false>;
    /** 音内的力度起伏（2026-10-08 加，可选；MusicXML 里表达不了音内的发夹）：声部 id → 音的 id → "<" / ">" / "<>"。 */
    swells?: Record<string, Record<string, "<" | ">" | "<>">> }[];   // swells：v0.9.44 起编辑器里是演奏法（Art swellUp / swellDown / swellBoth），存的时候照旧从演奏法取成这张表、读的时候挂回去——文件形状没变   // hidden（2026-10-08 加，可选）= 这张纸不放、不进压平件；phrases（同日加，可选）= 声部 id → 句号跟在哪些 token（id）后面（句号不算打谱符号，不进 MusicXML）
  /** 视图态（2026-10-08 加，可选；src/score/desk.ts）：怎么看 / 怎么听这首——范围 / 排法 / 在哪张纸 / 每个声部的隐藏·只看·静音·独奏。**存时顺手捞进来、改了不标脏、不进 undo**（照 WeebPaint desk）。只写非默认值；没有 = 全默认。 */
  view?: ViewV1;
  /** 编排（2026-10-08 深夜加，可选，不升版本；Opus 5.5）：一行字，按什么顺序放哪几张纸（曲段名 / 序号、×N、括号、最后一个 [循环段]；src/score/arrange.ts）。没有 = 每张纸各放一遍。 */
  arrangement?: string;
  /** 歌词怎么排（v0.9.40 加，可选，不升版本；Opus 5.5）：只写 "lyrics"（按歌词：长字把音推开）；没写 = 按节奏（音的位置只看时值，歌词让路；默认）。 */
  lyricFit?: "lyrics";
  /** 小节号（v0.9.42 加，可选，不升版本；Opus 5.5）：只写 "off"（不印）；没写 = 每行开头印。 */
  barNumbers?: "off";
  /** 音距（v0.16.34 加，可选，不升版本；Claude Opus 5.5）：只写 "tight"（紧）；没写 = 正常（短音符压紧）。
   *  **v0.16.43 起不再起作用**：音距跟版式走（舒适 = 正常、紧凑 = 紧；user 11-09「舒适 = 大谱、音距正常 / 紧凑 = 小谱、音距紧」），这个字段读到照样原样带着、写回，界面上没有开关了。
   *  v0.16.33 在开发版上待过一小时的 denseShort（"off" = 原来的松排法，那一档已经拿掉）读的时候丢掉、按正常排。 */
  spacing?: "tight";
  /** 歌级声部并集（总谱从上到下）：声部 → 角色 id → 麦克风 id；某张纸没有某声部 = 那张纸的 MusicXML 里没那个 part。kind 留给打击乐记谱（现在都是 pitched）。
   *  **声部就是歌手**（2026-10-08 Opus 5.5，user「嗯声部就是歌手」）：role 在 parts 里唯一（读到共用的 = 后面那个拆成一位新歌手，见 project.ts finish）；
   *  一张纸上一位歌手最多一行（tracks 按声部 id 记，天然如此）；跨纸按声部 id 接；mic 可以几位歌手共用（歌手认领麦克风）。不改形状、不升版本。 */
  /** clef（v0.9.28，可选）：声部自己的谱号，"auto" = 自动（MusicXML 里写的是挑好的那个）。autoOttava（v0.9.37，可选，只写 false）：这位不要自动八度线（没写 = 开）。都不升版本。
   *  v0.16.88（score minor 4）起这两个只是老写法：clef 一律写 "auto"、autoOttava 不写，按段的在 papers[] 和每段的谱里；minor < 4 的文件读的时候搬到每一段。 */
  parts: { id: string; role: string; mic: string; kind: "pitched" | "percussion"; clef?: string; autoOttava?: false;
    /** 2026-10-10 加（可选，不升版本；Opus 5.5）：合租——画在哪位（主人）的谱线上；主人自己不能是房客（读的时候不合规矩 = 丢掉这个字段）。user「合租还是有主人吧」。 */
    host?: string;
    /** v0.16.73 加（可选，只写 false；score minor 2）：这位不认分解和弦（没写 = 认）。score minor 5 起退役：读成 chords: "stacked"，不再写。 */
    brokenChords?: false;
    /** score minor 5（谱面分家第三刀）：这条轨的和弦选项，只写不是 auto 的——"stacked" = 只认叠在一起的和弦、"fold" = 折叠成和弦名（第五刀）。不认识的值原样带回。 */
    chords?: string }[];
  /** score minor 5（谱面分家第三刀；src/score/song-view.ts）：这首歌怎么看。都可选、只写不是「没写的意思」的值：
   *  notation = 谱种（"jianpu"…；没写 = 五线谱；不认识的值原样带回）；chordTags = false（没写 = 标和弦级数）；viewInC = true（没写 = 不按 C 调看）。chordTags / viewInC 永远是布尔（上面 minor 5 那段）。
   *  不进 view（视图态）：它们决定这首歌怎么印，进撤销、会标脏；归修改锁的「看法」（锁着能切，锁着期间不写）。 */
  notation?: string;
  chordTags?: false;
  viewInC?: true;
  /** score minor 6（7-B）：字母谱里中央 C 叫 C 几（只写不是 4 的；没写 = C4）。 */
  middleC?: number;
  /** score minor 8（7-G）：演奏法和表情不显示（只写 false；没写 = 显示）。 */
  expressions?: false;
  /** score minor 10（12-4）：谱上的字用哪种语言（"zh" / "en" / 更新的版本写的别的；没写 = 跟着界面，进门时补成 "ui"）。 */
  textLang?: string;
}

/** 视图态（推荐稿）。全是可选、只写非默认值；读的一方宽容（不认识的忽略）。 */
export interface ViewV1 { scope?: "all"; pageFlow?: true; /** 排法「横卷」（v0.9.35 加，可选、不升版本；Opus 5.5；和 pageFlow 互斥，只写 true）。 */ scroll?: true; paper?: string; parts?: Record<string, { hidden?: true; only?: true; muted?: true; solo?: true }>;
  mp3?: "small";   // mp3 = 导出歌声的音质（只写非默认的「小文件」；2026-10-08 by Claude Opus 5.5，user「音质配置就是应该也跟着吧」）
  /** 2026-10-08 深夜 / 10-09 加（可选，不升版本；Opus 5.5）：ref = 参考窗的窗（开着没有 + 位置 / 大小，CSS px；开过窗才写）；
   *  pdf = 乐谱 PDF 的字体（只写过非默认的「拼音」；**2026-11-12 起不再写、读到不理**：拼音字体退役，score patch 1）。pad = pad 的状态（同日更早加的，见 desk.ts；v0.16.9 起写了 fifths / scale = 手动拨的「1=」，都没写 = 跟谱——不加字段）。 */
  pad?: Record<string, unknown>; ref?: { open?: true; left: number; top: number; width: number; height: number }; pdf?: "pinyin";
  /** 2026-10-10 加（可选，不升版本；Opus 5.5）：存的时候在哪个模式（只写非默认的；打开 = 进这个模式，成品曲存在「听」= 打开就是听、不怕误触；user「打开时记住上次的模式」）。 */
  mode?: "lyrics" | "symbols" | "listen";
  /** 2026-11-07 加（可选，不升版本；Claude Opus 5.5）：乐器目录在这首歌里翻到哪（src/score/desk.ts FinderMemo；只写不是默认的）——排序 / 每种排序展开的组 / 滚到哪 / 点开的那件 / 试听的那位。
   *  user 11-07「乐器列表记录滚动位置的话，是每个文件自己记录，不是用户设置」。 */
  finder?: { mode?: string; open?: Record<string, string>; scroll?: number; row?: string; pick?: string } }

/** `.moonsinger/studio.json`：录音房。 */
/** 录音房 v2（2026-10-10 刀 4；user「轨还是和乐手是两个概念」）：轨是通用的条——乐手的通道（kind mic，谱上声部 `part.mic` 指着它）、总线（kind bus，没有乐手；混响 / 延迟这类「留在屋里的」）、
 *  以后的素材轨。每条：增益 / 声像 / 效果链 / 发送（推子之后发到哪条总线多少）/ 去哪（"master" 或总线 id）。总轨：增益 / 限幅 / 链。老文件（v1）读进来 = 每个麦克风一条 mic 轨、空链、直通总轨。 */
export interface StudioTrackV2 { id: string; kind: "mic" | "bus"; name: string; gainDb: number; pan: number; chain: FxV2[]; sends: { to: string; gainDb: number }[]; to: string;
  /** 2026-10-10 加（可选，不升版本；Opus 5.5）：混音轨整条旁通——链上的插件全跳过，推子 / 声像 / 出到 / 发送照旧（user「混音轨和每个插件都可以toggle bypass」）。
   *  第 16 条 16-3 起明写（false 也写，歌手轨照样写 false）。 */
  bypass?: boolean }
/** 总轨的限幅器（2026-11-12 加，16-4 C；studio 小版本 3）。是哪一种：前瞻的峰值限幅（feed-forward、左右用同一条增益）——输出比输入晚 lookaheadMs；
 *  每个采样看前瞻窗里每一个将来的样本要压多少（超过 ceiling 的 = ceiling ÷ 峰值），按「起」的指数曲线提前收下来（离那个样本 d 个采样处的增益 = 1 − (1 − 要的) · e^(−d / (attackMs·采样率))），
 *  过了峰按「放」的一阶慢慢放开（每个采样 g = min(要的, 1 − (1 − 上一个) · e^(−1 / (releaseMs·采样率)))）；最后再按天花板硬切一下兜底。
 *  ceiling = 满幅的几分之几（线性；0.98 ≈ −0.18 dBFS）；attackMs = 起（提前收的时间常数）；releaseMs = 放；lookaheadMs = 前瞻多远（独立的数；原来是「起 × 3」算出来的，9 ms）。
 *  前瞻在 44.1 kHz = 397 个采样、48 kHz = 432 个采样（和原来一样）。新建 = 模板的 0.98 / 3 / 150 / 9；老文件没写 = 读文件的门口按模板补，存的时候写。 */
export interface LimiterParamsV2 { ceiling: number; attackMs: number; releaseMs: number; lookaheadMs: number }
export interface StudioV2 {
  version: 2;
  tracks: StudioTrackV2[];
  master: { gainDb: number; limiter: boolean; chain: FxV2[]; limiterParams?: LimiterParamsV2 };
}

// ─── 休息室 v2（现役）：角色 = 谱上的功能位；候选 = 谁来演 + 怎么出声 ─────────────────────────
// 三样东西（契约草稿 §1）：谱（声部各自选角色、选麦克风）/ 休息室（角色 → 候选，手动选上场的；下线的留着不删）/ 录音房（电线）。
//   2026-10-08 Opus 5.5：声部 = 歌手（一个声部一个角色，绑定在歌手上、全曲一份，界面上照旧在谱前面的歌手名那里选）；每张纸上有谁各自定（user「新歌手只出现在当前这张纸嗯」「麦克风由歌手认领嗯」）。
// 「贝斯手不是贝斯」：角色是功能（Vocals / Guitar…，带 MusicXML 官方乐器语义 id），候选是演奏者 + 他手里的乐器配置。
// 每个候选 by value 带全纯函数要的一切（§8）：乐器（按引擎分）、默认数、力度表、演奏法、校准、链、署名、规格。不依赖 app 里的默认表。

export type Hum = "la" | "n" | "u" | "o" | "a";
export type Dynamic = "ppp" | "pp" | "p" | "mp" | "mf" | "f" | "ff" | "fff";   // ppp / fff：v0.9.23 加（只加不改；旧演奏者的表里没有 = 按它自己 pp→p / f→ff 的间隔往外推一档）

export interface LoungeRoleV2 {
  version: 2;
  id: string;                          // "r1"
  /** 用户起的名字（谱上原样写、什么语言都不翻）。**没有这个键 = 没起**：谱上写这件乐器的叫法（概念的 score，按「谱上的字」的语言；src/format/part-show.ts 唯一出口）。
   *  休息室 minor 1（施工单 12-4，2026-11-12）起可以没有。老文件（minor 0）照文件读：存着的就是起了的名字（第 16 条）。 */
  name?: string;
  sound: string;                       // MusicXML 官方乐器语义 id（<instrument-sound>，src/score/roles.ts）
  active: string;                      // 上场的候选 id（人选的；上不了场 = 不出声、报错、人换，不自动替补）
  candidates: CandidateV2[];
  /** 2026-10-07 加（可选，不升版本）：角色是什么乐器**概念**——百科的多重编号束 + 名字 by value（user「乐器的百科全书」「多重编号」）。
   *  sound（MusicXML id）仍是导出给别的软件看的；concept 是真身份，目录（vendor/instruments/）常改也不影响歌。 */
  concept?: { ids: { wikidata: string | null; local: string | null; musicxml: string | null; gm: { program: number; bank: number }[]; hs: string | null }; name: { zh: string; en: string; ja?: string };
    /** 休息室 minor 1（12-4）：谱上写的叫法（按语言；上场时从目录抄：zh = 目录中文名，en = 目录的 scoreName，没有就百科名首字母大写）。name 是百科名（英文小写「human voice」），不拿来印。 */
    score?: { zh?: string; en: string; ja?: string };
    /** 休息室 minor 1（12-4）：谱前的简写（上场时从目录抄，目录只有英文的；没有 = 从名字缩）。 */
    abbr?: { zh?: string; en?: string; ja?: string } };
}
export interface CandidateV2 {
  id: string;                          // "c1"…（c1 / c2 = 新歌默认的月读完整 / 元音版）
  name: string;                        // 候选的名字（不上谱）
  /** 2026-11-08 加（可选，不升版本；Claude Opus 5.5）：从乐器目录上场时，这一位是作为哪件乐器上的（角色名 / MusicXML sound / 概念，= withRoleConcept 那一份）。
   *  在乐器页点回它 = 角色跟着换回这件乐器（user 11-07：先选长笛再选人声，点回长笛那颗谱上还写着 Voice）。没有（旧候选 / 自己的 .sf2）= 宿主按目录反查或不动。
   *  旧 app 不认它也照常开存（候选整份写回），只是点回旧候选时名字不跟——就是它原来的样子。 */
  castAs?: { name: string; sound: string | null; concept: NonNullable<LoungeRoleV2["concept"]> };
  /** 2026-11-09 加（可选，不升版本；Claude Opus 5.5，施工单 ai-docs/20261109-work-order-instrument-pick-vs-tune.md §5 R1）：换上台那一刻这位的「设置指纹」
   *  （project.ts settingsPrint：去掉 id / castAs / asCast 后按键名排序的 JSON 的 sha256 前 16 位）。现在的指纹还等于它 = 换上来以后没调过 = 换乐器时下台就删掉。
   *  没有这个字段（旧歌 / 旧版 app 造的）= 当作调过 = 留着。旧 app 不认它、原样写回：设置变了指纹就对不上，所以不会把调过的当成没调过。内置两位（c1 / c2）不写。 */
  asCast?: string;
  instrument: InstrumentV2;            // 谁来演、怎么出声（按引擎分；不认识的引擎原样写回）
  gm: { program: number | null; variant: string | null };   // 写给别的软件看的（MusicXML <midi-program> 1 起 / <virtual-instrument>）
  calibrationDb: number;               // 响度校准（看得见、能调的默认，不偷偷自动）
  /** 2026-10-08 加（可选，不升版本；Claude Opus 5.5）：修八度 / 移调（半音）——SoundFont 出声时敲「写的音 + transpose」。默认没有 = 0；
   *  只给少数本身就差八度的音色兜底（GS 32 Guitar Harmonics 高两个八度、18 / 19 风琴听着低一个八度），不自动套用（user「大部分情况不应该动，是worst case兜底」）。 */
  transpose?: number;
  defaults: Record<string, number>;    // 一个音没画曲线时用的默认数（by value）：参数名 → 值，单位同 curves.json 的 units
  /** 力度记号 → dB（八档；by value）。按音量走力度的乐手（插件 dynamics: "gain" = 小月相 / 元音版）带，这张表就是她的力度（16-4，lounge minor 3）：
   *  渐强渐弱 / 渐到在 dB 上线性，没终点走到表里的下一档，强后即弱压到表里的 p。新建 = 模板 performance.ts DYNAMICS_DB；缺的档读的时候用模板补。按力度敲的乐手身上不写。 */
  dynamicsDb?: Record<Dynamic, number>;
  /** 力度记号 → MIDI 力度（1–127；by value）。按力度敲的乐手（SoundFont）带；没带的那一档 = 模板 performance.ts DYNAMICS_VEL。
   *  响多少跟着音色库给这件乐器写的深度（引擎自己读，SF2 规范）。accentVel / marcatoVel 加在力度上。按音量走的乐手身上不写（16-4）。 */
  dynamicsVel?: Record<Dynamic, number>;
  /** 记号怎么解读的数（by value）。哪些键有定义看这位的力度走哪条路（project.ts ART_KEYS_BY；统筹 2026-11-12 夜）：两路都读的两边都有；accentDb / marcatoDb / accentSec /
   *  sfzDb / sfzSec / stressDb / unstressDb / ghostDb 只有按音量走的有，accentVel / marcatoVel / wedgeStepVel / sfzVel / stressVel / unstressVel / ghostVel 只有按力度敲的有。
   *  tenutoGate 没有定义（哪条路都不读）。 */
  articulation: { staccatoGate?: number; accentDb?: number; gapSec?: number; marcatoDb?: number; accentVel?: number; marcatoVel?: number;
    accentSec?: number; breathSec?: number; breathShare?: number; gapShare?: number; /* wedgeStepVel：只有按力度敲的写；wedgeStepDb 不再有定义（16-4） */ wedgeStepVel?: number;
    sfzDb?: number; sfzVel?: number; sfzSec?: number; fpSec?: number; swellDb?: number;
    /** 能不能在一个音里面变强（2026-10-08 加，可选）：false = 按下去就自然衰减（钢琴 / 吉他 / 打击）——音内渐强 / 鼓起画灰、明说；音内渐弱照做。没写 = 读文件的门口按模板补（能）。
     *  SoundFont 新候选按仓鼠 v11 的 sustain（sustained = 能）by value 抄进来。 */
    canSwell?: boolean;
    /** 滚奏每秒几下（16-4 F，lounge minor 4 起只写数）。老文件的 null（= 按乐器）/ 没写 = 读文件的门口按这位是不是鼓补（鼓 12、有音高的 14，format/template.ts），存的时候写数。 */
    rollHz?: number };
  //   2026-10-08 加（可选，不升版本；Claude Opus 5.5；user「记号怎么解读应该乐器里面有explicit的配置，而不是代码写死」）：上面这些 = 记号怎么解读的数；
  //   16-4 A 起（2026-11-12 夜）：没写 = 读文件的门口按模板（format/template.ts）补、存的时候写，出声那一层只吃写全的（原来是「没写 = performance.ts MARK_DEFAULTS」）
  //   2026-10-08 深夜再加（可选，不升版本；Opus 5.5）：stressDb / stressVel（次重音）、unstressDb / unstressVel（弱化）、ghostDb / ghostVel（幽灵音）——强度的其余几级。
  /** 2026-10-08 加（可选）：月读——谱上的记号变成唱法核心哪个字前记号（^ / v / O）、放在这个字还是下一个字前面；没写 = 读文件的门口按模板补（16-4 A）。 */
  sing?: Record<string, { mark: "^" | "v" | "O"; at: "this" | "next" } | null>;   // 跳音 / 保持吃掉多长（0–1）；重音加多少 dB；
  //   gapSec（2026-10-08 加，可选，不升版本；Claude Opus 5.5）= 连断的底色：不写记号的音之间留多大缝（秒）；连线 / 保持 = 不留；没写 = 0
  /** 跟着演奏者走的效果（琴箱 / 音箱 / 琶音器；留位）。现状（统筹 2026-11-12 夜）：没有编辑入口，歌库里 0 首不空；这条链上 EQ 的自动低切 / 延迟的跟速度放的时候不换算
   *  （直接用写着的 hpHz / timeMs），存的时候也不写算出来的数——和混音台各轨的那两个开关不一样，有了编辑入口时再理。 */
  chain: FxV2[];
  credit: Credit;                      // 署名 / 许可证快照 by value（署名义务跟音源走）
  spec: Spec;                          // §10.6 vault：这个乐器怎么出声——标准格式只写名字版本；我们写的指向源码出处 + README 章节
  engines?: Record<string, unknown>;   // v1 的「引擎参数按引擎名分组」；别的工具 / 旧版写的，原样写回
}
/** 乐器 = 按引擎分的判别联合。每种引擎自带自己的配置（月读才有「哼的字」，SoundFont 才有 bank / program）。 */
export type InstrumentV2 =
  | { engine: "tsukuyomi"; model: { pack: string; sha256: string }; hum: Hum;        // 月读完整：piper（时长接管）+ WORLD；model = 家族模型包（packId = manifest 的 sha256）
      /** 2026-10-08 深夜加（可选，不升版本；Opus 5.5）：分段唱——"phrase" 每句（在休止处切）/ "sheet" 每张纸 / "whole" 一整首；没写 = phrase。
       *  user「开关是歌手的属性，可以有不同的粒度」；src/score/lab-score.ts singChunks。 */
      chunk?: "phrase" | "sheet" | "whole";
      /** 2026-11-12 加（16-4 B；lounge 小版本 +1）：唱法核心原始输出进她那条轨之前乘多少，dB（新建 = 模板 6.52 = 20·log10(0.89 ÷ 0.42)）。
       *  这是这个引擎自己的满音量；乐手的「响度」calibrationDb 在它之上另算。读到没写 = 门口按模板补，存的时候写。 */
      outputGainDb?: number }
  | { engine: "vowel-sampler"; table: "builtin"; hum: Hum }                            // 月读元音版（轻量）：app 随带的元音表（assets/preview/）
  | { engine: "soundfont"; bank: number; program: number; note?: number; source: Sf2Source;
      /** 2026-11-12 加（16-4 E；lounge 小版本 +1）：着力点——敲的键号（字符串）→ 采样开头到「砸下去那一下」几秒；放的时候这个键提前这么多秒开始，砸在写的那一拍。
       *  整套鼓（bank 128、不固定敲一个键）= 音乐目录里这套鼓的每个键都写（实测没有的写 0）；固定敲一件（note）= 那一个键；有音高的乐器没有这个键。
       *  上场、开关「固定原速」的那一刻和 note / sfx 一起从目录按值抄；老歌没写 = 读文件的门口按目录补，存的时候写。表里没列的键 = 不提前。 */
      hitSecByKey?: Record<string, number>;   // SoundFont 2 的一个预设（TinySoundFont 出声）；note = 每个音都敲这个键：鼓件（2026-10-07 加，可选）/ 音效固定原速（2026-10-08）
      /** 2026-10-08 加（可选，不升版本；Claude Opus 5.5）：音效（GS GM 116–128）上场时从目录按值抄的——key = 原速键、midi = 原速时听到的最强频率（有音高才有）、
       *  centsPerKey = 每键几音分；align = 关掉固定原速后按写的音反算键（src/gm/sf-key.ts）。user「固定原速同意，默认开。碰到猫叫歌才关，但这个时候也许需要音高修正」。 */
      sfx?: { key: number; midi?: number; centsPerKey?: number; align?: boolean } }
  | { engine: "unknown"; [k: string]: unknown };                                        // 别家谱原来的乐器 / 这一版不认识的：整份原样写回，上场 = 没人、不出声
/** SoundFont 的来源（契约 §10.2 样本类 by value）。
 *  embedded = 子集字节在歌里的路径（强引用，默认）；null = **弱引用**（user 2026-10-07：大的可以不嵌，「允许一个弱引用自己去官方和人的地方拉」）——
 *  歌里只记整包 sha256 + (bank, program) + 子集 sha256，要出声时按顺序找：歌里 → 本次内存 → 家族音源库（按整包 sha256 对条目）→ 人的文件（核 sha256）；
 *  都找不到 = 没人上场、报错、人换（= 换人的窄接口，瑞士奶酪第二层；第一层 = 哈希钉死）。子集化确定性 → 找到整包就能切出逐字节相同的子集（核 subsetSha256）。 */
export interface Sf2Source {
  embedded: string | null;
  subsetBytes: number;
  subsetSha256: string;
  origin: { name: string; fileSha256: string; bytes: number; library?: string };   // 从哪个整包切的；library = 家族音源库 pwa-sounds 的目录 id（音源不是 AI 模型，不走 pwa-models）
}
export interface Credit { attribution: string[]; license: { name: string; url?: string; text?: string; textSha256?: string } }
export type Spec =
  | { kind: "standard"; name: string; version: string }
  | { kind: "ours"; doc: string; source: { repo: string; ref: string; path: string } }   // ref = 版本号 / commit；doc = vault README 的章节锚
  | { kind: "unknown" };
/** 一个效果（2026-10-10 刀 4 定形；原草稿的 engine / owner 去掉——引擎随 app 发、主人就是它在哪条链上）：kind 见 src/engine/fx.ts FX_KINDS（eq / comp / delay / reverb / gain…；
 *  不认识的 = 不出声、原样带着、界面画灰）；params 按 kind 的参数表（量纲 / 公式在那张表里，vault 自描述）；on = false 旁通；key = 压缩器的侧链来源（轨 id）。
 *  16-4 A2（2026-11-12 夜）起：参数表里每个参数、on 都明写；新插一格 = 模板（format/template.ts）那一份；老文件没写的 = 读文件的门口补（on 没写 = 开；参数没写 = 模板那一份，
 *  按这格在不在混音轨上取）；出声那一层照写的读，缺了 = 用到它的声部不出声、清单里写缺哪几个。 */
export interface FxV2 { id: string; kind: string; on?: boolean; params: Record<string, number>; key?: string; note?: string }

// ═══ 提案（未写入文件；多轨 / 曲线 / 录音房落地时改 FORMAT + 冻结样本）══════════════════
// user 裁决（2026-10-07，契约草稿 §7.7 / §7.8 / §6¾ / §8）：
//   ① 曲线是真相：绝对值、SI；谱上的 mp / mf / < > / 跳音 / 重音从曲线算出来写进 MusicXML（低保真可视化 + 备份）；默认演绎不藏在 app，
//      一个音没画曲线就用候选快照里写明的默认数。
//   ② 调号 / 拍号 = 各声部自己的画法，不共享、不影响渲染；真相 = 音符 + 小节线（对齐标记）。速度住第一声部、仍是状态机。
//   ③ 纸 = 曲段，存法 B：一张纸一份 MusicXML（`.moonsinger/papers/<id>.musicxml`，元数据每纸自带）+ 一份派生压平的 score.musicxml 给别的软件。（0.5.0 已落地）
//   ④ 休息室是歌的一部分（不做跨歌笔架）；新建角色从 app 内置预设 by value 拷进歌；渲染 = 纯函数(文件)。

// （score.json 第 2 版 2026-10-08 已落地，见上「现役」。）

/** `.moonsinger/curves.json`（新文件）：曲线 = 真相。按音符 id；时间 = 音里 0–1；数值**绝对**、单位写明（SI 兜底）。 */
export interface CurvesV1 {
  version: 1;
  /** 每个参数的单位（第 7 题三类 + SI 兜底）：音量 "dB"、音高 "cent"（相对谱上写的音）、音色旋钮 "knob"（−1…+1，0 = 候选本色）、其余 SI 单位名。 */
  units: Record<string, CurveUnit>;
  /** 音符 id → 参数名 → 折线点 [t(0–1), value]。没有这条曲线的音 = 用候选快照里的默认数（CandidateV2.defaults）。 */
  notes: Record<string, Record<string, [number, number][]>>;
}
export type CurveUnit = "dB" | "cent" | "knob" | (string & {});

/** studio.json 第 2 版：麦克风 → 总线 → 总输出；侧链；人录的音频（§8，非破坏性）。时间线自动化（按小节:拍）以后加。 */
