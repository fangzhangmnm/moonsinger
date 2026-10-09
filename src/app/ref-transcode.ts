// ref-transcode.ts —— 参考窗的「压一下」（注入给 @internal/reference-window 0.4.0 的 RefTranscoder）。created 2026-10-09 by Claude Opus 5.5
// user「库升minor + mp3功能，最好加一个压制转录的injection抽象接口」「然后api的应该是图片音频视频转码都是app提供」
//   「不过我们mp3其实默认不压，导入的时候有一个对话框告诉你大小，然后问你要不要压。图片也一样」「应用内小面板 如果支持压缩的话应该有压缩选项和估计」。
// · 音频：浏览器解码（OfflineAudioContext，统一到 44.1 kHz）→ 导出 mp3 用的同一个 lamejs worker，128 kbps（单声道也 128k：扒谱要听得清）；
//   估计 = 时长 × 128 kbps（时长从 <audio> 的元数据读，不解码——估的时候不吃内存）。
// · 图片：src/image/shrink.ts（长边 ≤ 2048、256 色 PNG）；估计 = 真压一遍（记住结果，选了「压一下」直接用这份，不压第二遍）。
// · 视频：不压（库这一版也没有视频卡）。
// 本文件只 import 库的类型（接缝守卫只管值级 import；值级只在 reference-host.ts）。
import type { RefTranscoder, RefImportKind } from "@internal/reference-window";
import { encodeMp3 } from "../export/mp3.ts";
import { shrinkImage, REF_IMAGE_EDGE, REF_IMAGE_COLORS } from "../image/shrink.ts";

export const REF_MP3_KBPS = 128;
const SR = 44100;

/** 音频时长（秒；读元数据，不解码）。读不出 / 流式（Infinity）= null。 */
function durationOf(f: Blob): Promise<number | null> {
  return new Promise((ok) => {
    const a = document.createElement("audio"), url = URL.createObjectURL(f);
    const done = (v: number | null) => { clearTimeout(t); URL.revokeObjectURL(url); a.removeAttribute("src"); ok(v); };
    const t = setTimeout(() => done(null), 5000);
    a.preload = "metadata";
    a.onloadedmetadata = () => done(Number.isFinite(a.duration) && a.duration > 0 ? a.duration : null);
    a.onerror = () => done(null);
    a.src = url;
  });
}
async function decodeAudio(f: Blob): Promise<AudioBuffer> {
  const Ctx = (globalThis as { OfflineAudioContext?: typeof OfflineAudioContext; webkitOfflineAudioContext?: typeof OfflineAudioContext }).OfflineAudioContext
    ?? (globalThis as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  if (!Ctx) throw new Error("这个浏览器解不了音频");
  return await new Ctx(1, 1, SR).decodeAudioData(await f.arrayBuffer());
}

export function createRefTranscoder(): RefTranscoder {
  const images = new WeakMap<Blob, Promise<{ blob: Blob; mime: string; note: string }>>();   // 估计时压过的那份（选了「压一下」直接用）
  const image = (f: Blob) => {
    let p = images.get(f);
    if (!p) {
      p = shrinkImage(f).then((r) => ({ blob: new Blob([r.png as unknown as BlobPart], { type: "image/png" }), mime: "image/png", note: `PNG ${REF_IMAGE_COLORS} 色、${r.w} × ${r.h}（长边最多 ${REF_IMAGE_EDGE}）` }));
      images.set(f, p); p.catch(() => images.delete(f));
    }
    return p;
  };
  return {
    kinds: ["image", "audio"],
    async estimate(kind: RefImportKind, f: Blob) {
      if (kind === "image") return (await image(f)).blob.size;
      if (kind === "audio") { const d = await durationOf(f); return d === null ? null : Math.round((d * REF_MP3_KBPS * 1000) / 8); }
      return null;
    },
    async encode(kind: RefImportKind, f: Blob) {
      if (kind === "image") { const r = await image(f); images.delete(f); return r; }
      if (kind === "audio") {
        const buf = await decodeAudio(f), left = buf.getChannelData(0), right = buf.numberOfChannels > 1 ? buf.getChannelData(1) : null;
        const bytes = await encodeMp3(left, right, buf.sampleRate, REF_MP3_KBPS);
        return { blob: new Blob([bytes], { type: "audio/mpeg" }), mime: "audio/mpeg", note: `mp3 ${REF_MP3_KBPS}k${right ? "" : " 单声道"}、${(buf.duration / 60).toFixed(1)} 分钟` };
      }
      throw new Error(`不会压这种：${kind}`);
    },
  };
}
