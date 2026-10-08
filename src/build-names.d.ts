// 构建时由 scripts/build.sh 用 esbuild --define 填进来的 worker 文件名（带内容哈希）。created 2026-10-07 by Claude Opus 5.5
declare const __SINGER_WORKER__: string;
declare const __SYNTH_WORKLET__: string;   // dist/synth-worklet-<hash>.mjs（AudioWorklet 里的实时 SoundFont 合成器，src/gm/synth-processor.ts）
declare const __MP3_WORKER__: string;
/** styles.css 的内容哈希（index.html 里写成 styles.css?v=<它>）。主 bundle 引用它 = 样式一改主 bundle 的哈希也变 = 离线壳换新缓存。edited by Claude Opus 5.5 2026-10-07 */
declare const __CSS_HASH__: string;
