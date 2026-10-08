// 生成物：node scripts/gen-sounds.mjs（源 = ../20261007 PWA Sounds 的 index.json）。勿手改。
// 音源库（pwa-sounds）= 跟人走的声音素材，不是 AI 模型；app 只当货架，选中的那一件子集化嵌进歌（契约 §10.2）。文件到手先对这里钉的 sha256。
export interface SoundEntry { id: string; kind: string; name: string; description?: string; file: string; format: string; bytes: number; sha256: string;
  license: { name: string; summary?: string; file?: string; bytes?: number; sha256?: string }; attribution: string; homepage?: string; source?: string; date?: string; notes?: string }
/** 出厂预填的音源库地址（设置里能改；先找同源 pwa-sounds/）。 */
export const SOUNDS_SOURCE_DEFAULT = "https://fangzhangmnm.github.io/pwa-sounds";
export const SOUNDS: Record<string, SoundEntry> = {
 "generaluser-gs-2.0.3": {
  "id": "generaluser-gs-2.0.3",
  "kind": "instrument",
  "name": "GeneralUser GS 2.0.3",
  "description": "GM / GS 通用音色库：287 件乐器（bank 0 的 128 件 + GS 变体）含 13 套鼓组（bank 128）",
  "file": "generaluser-gs-2.0.3/GeneralUser-GS.sf2",
  "format": "SoundFont 2",
  "bytes": 32319396,
  "sha256": "9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe",
  "license": {
   "name": "GeneralUser GS License v2.0",
   "summary": "私用商用随便用；可放进软件项目、可改包装；别直链作者的下载文件（要么链他网站，要么自己放一份）；不强制署名",
   "file": "generaluser-gs-2.0.3/LICENSE.txt",
   "bytes": 2317,
   "sha256": "7b32efefdf95ce38a043799f0659853ddc00fbaa14d8c50f0aca16b9b8b405be"
  },
  "attribution": "GeneralUser GS 2.0.3 by S. Christian Collins",
  "homepage": "https://www.schristiancollins.com/generaluser.php",
  "source": "https://github.com/mrbumpy409/GeneralUser-GS",
  "date": "2026-02-22",
  "notes": "字节 = 上游仓原样（文件内 INAM 写的是「2.0.3 BETA」，2.0.3 正式版里就是这个字串）。残余风险按作者原话：部分采样来源他不能 100% 确定，2000 年至今没人投诉。"
 }
};
