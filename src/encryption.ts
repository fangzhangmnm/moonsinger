// encryption 器官 —— app 的内容加密单例（@internal/encryption 实例）。created 2026-10-08 by Claude Fable 5.1
// MoonSinger 这一版**不加密**：传零 codec 的 createEncryption()（探测照常、pack / unpack 响亮抛）——store 0.7.0 起 encryption 是必填表态，
//   没有 dormant 替身。以后要加密再 vendor zip.js + 7z-wasm 照 WXHW 接 codec。
// 这是 @internal/encryption 在本仓的**唯一值级 import 点**（test/redline-guard.test.mjs 守着）。
import { createEncryption } from "@internal/encryption";

export const appEncryption = createEncryption();
