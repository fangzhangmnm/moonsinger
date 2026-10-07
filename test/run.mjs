// 测试入口：node test/run.mjs（node 24 strip-types 直跑导入的 .ts）。created 2026-10-06 by Claude Opus 5.5（抄 CatsUp）
// 加新测试文件：在下面 import 一行即可。
import "./smoke.test.ts";
import { run } from "./runner.mjs";

await run();
