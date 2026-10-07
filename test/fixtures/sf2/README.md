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
