// main.ts —— 试验页接线（M0 占位：只把版本号挂上顶栏）。created 2026-10-06 by Claude Opus 5.5
import { APP_VERSION } from "../version.ts";

const bar = document.getElementById("bar")!;
bar.innerHTML = `<span class="title">MoonSinger</span><span class="ver">${APP_VERSION}</span>`;
