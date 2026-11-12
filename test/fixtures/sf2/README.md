# sf2 测试样本

> created 20261007 by Claude Fable 5.1

- `gu-square-castanets.sf2`（24 090 字节，sha256 `b6969c02c95515da4c17bf18b04f2077b189f9b1beed36be76db3c41e800f0d1`）：
  用 `src/gm/sf2-subset.ts` 从 **GeneralUser GS 2.0.3 BETA**（S. Christian Collins，<https://github.com/mrbumpy409/GeneralUser-GS>；
  本机检疫桶那份 sha256 `9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe`）切出来的两个预设：
  `0:80 Square Lead`（有循环点的合成波）+ `8:115 Castanets`（一次性打击）。
- 许可证：GeneralUser GS License v2.0（上游 `documentation/LICENSE.txt`；原文也在这个 sf2 的 INFO/ICMT 块里，子集化原样保留）：
  「You may use GeneralUser GS without restriction … Please feel free to use it in your software projects, and to modify the SoundFont bank or its packaging to suit your needs.」
- 用途：`test/sf2.test.ts` 的 hermetic 部分（TinySoundFont 能载、预设列表、确定性渲染、子集化幂等）。整包不进仓；检疫桶里有整包时另跑「子集 ≡ 整包」的比对。
- 重生成：`node --experimental-strip-types` 跑 `subsetSf2(整包, [{bank:0,program:80},{bank:8,program:115}])`，字节必须和这里的一样（测试守着）。
- `gu-sine-wave.sf2`（8492 字节，sha256 `6d823b7cd5d7f2a40e896beafb5e47084691fb750495d6bffc267bce7af6b1bc`；added 2026-11-08 by Claude Fable 5.1）：同一个整包切出来的一个预设 `8:80 Sine Wave`
  （一个周期循环的正弦波，收音 100 ms）。用途：`test/synth-wasm.test.ts`「音量包络不出台阶」——正弦波自己没有棱角，音量一跳一跳就是二阶差分上的尖峰，
  量得最干净（没打补丁的合成器 = 按住时的 17 倍，打了 = 0.9 倍；补丁见 `vendor/tsf/patch-tsf.py`）。重生成：`subsetSf2(整包, [{bank:8,program:80}])`。
- `gu-tonewheel-novel.sf2`（42 870 字节，sha256 `f667e2a73b0c98123f564a8ba6b402fa776e7cfca1ce878b5c6e57620d5f493c`；added 2026-11-12 by Claude Opus 5.5（MoonSinger小弟））：
  同一个整包切出来的 `11:16 Tonewheel Org noVel`——库里定成按多重都一样响（力度深度 0）的那一类。用途：施工单 9-4 的对照要盖到深度 800、0 和一件打击乐
  （仓里原有的三件都是 800）。重生成：`subsetSf2(整包, [{bank:11,program:16}])`。
- `fluidsynth-reference.json`（added 2026-11-12）：标准播放器（这台机器的 FluidSynth，版本和设置写在表里）对上面四个预设 × 八档力度出的响度对照表，
  `test/sf-loudness.test.ts` 拿我们的引擎同一个量法（`loudness.mjs`）比。重出：`python3 scripts/fluidsynth-reference.py --sf2=…（三个文件各一个）--cases=fixtures --out=test/fixtures/sf2/fluidsynth-reference.json`。
  整包的对照手动跑：`python3 scripts/fluidsynth-reference.py --sf2=<整包> --cases=gs --out=<表>` + `node scripts/compare-fluidsynth.mjs --sf2=<整包> --ref=<表>`。
