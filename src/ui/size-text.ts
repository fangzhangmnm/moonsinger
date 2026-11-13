// size-text.ts —— 多大，给人看（KB / MB）。created 2026-11-13 by Claude Opus 5.5（MoonSinger小弟）：原来 main.ts 和 panels/inst-settings.ts 各抄一份一样的，
//   施工单 13-2 设置的音源 / 维护两页也要用 = 第三处，收成一份。（resource-watch.ts 那一份带 GB、取整不同，是给开发者页的数，不并。）
export const sizeText = (n: number): string => (n < 1e6 ? `${Math.max(1, Math.round(n / 1e3))} KB` : `${(n / 1e6).toFixed(1)} MB`);
