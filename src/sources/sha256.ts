// sha256.ts —— 字节的 sha256（十六进制）：音源包 / 子集 / 模型分片到手先核的那把尺子。created 2026-10-15 by Claude Fable 5.1（从 src/app/main.ts 搬来，刀 4 音源来源接缝）
export const sha256Hex = async (b: Uint8Array): Promise<string> => [...new Uint8Array(await crypto.subtle.digest("SHA-256", b as unknown as BufferSource))].map((x) => x.toString(16).padStart(2, "0")).join("");
