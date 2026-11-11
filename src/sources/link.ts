// link.ts —— 从链接打开歌：认出网址里的链接、换成能直接下载的那个、下载、认出拿回来的是不是歌文件。created 2026-11-11 by Claude Opus 5.5
// user 11-11：「我有一个想法，能不能发一个链接给别人分享工程，比如sing.weebpaint.com/?file=dropbox.com/xxxxxx」→「先支持裸链接。能支持几家就几家」（愿望单 W-56）。
// 黄线区（仓 CLAUDE.md「黄线区」）：这里是 app 唯一去「别人给的网址」拿东西的地方——只读 GET、不带登录信息（credentials omit）、不带来源页（no-referrer）、
//   有大小上限；人点了「打开」才发请求（main.ts openFromLink 先问）。拿回来的字节交给读歌文件那一层（format/project.ts openBytes，读别人的文件本来就要过的那几道检查）。
// 几家网盘（2026-11-11 拿一个通用的来源头量过它们放不放行跨站读，不是真的分享链接）：
//   · 任何 https 直链 = 原样读（对方网站得放行跨站读取；GitHub Pages / raw.githubusercontent / gist.githubusercontent 放行）。
//   · Dropbox：分享页 www.dropbox.com 不放行 → 换成 dl.dropboxusercontent.com（放行），rlkey 等参数照带、去掉 dl / raw。
//   · GitHub：github.com/…/blob|raw/… → raw.githubusercontent.com/…；gist.github.com/<人>/<编号> → gist.githubusercontent.com/<人>/<编号>/raw（单文件 gist 拿第一个文件）。
//   · OneDrive：分享链接整条编进微软的匿名分享接口 api.onedrive.com/v1.0/shares/u!<base64url>/root/content（接口放行跨站读；**真的个人分享链接没测过**）。
//   · Google Drive：不放行跨站读（drive.google.com / drive.usercontent.google.com 都不带放行头）→ 不去请求，直接说清楚。
import { _t } from "../i18n/index.ts";

/** 换好的下载计划。url = 真正去拿的地址；shown = 人给的原链接（问的时候给人看）；host = 给人看的网站名。 */
export interface LinkPlan { url: string; shown: string; host: string; via: "bare" | "dropbox" | "github" | "gist" | "onedrive"; name: string | null }
export type LinkResult = LinkPlan | { error: string };

/** 一首歌文件最多多大（带着打包的音源和参考窗的也够；再大多半不是歌）。 */
export const LINK_MAX_BYTES = 100 * 1024 * 1024;

const SONG_NAME = /\.(mxl|musicxml|xml)$/i;

/** 网址里的 `file=` 那一段（没有 = null）。两种写法都认：
 *  · 编码过的（`?file=https%3A%2F%2F…`）= 到下一个 & 为止、解码；
 *  · 没编码的（`?file=dropbox.com/scl/fi/…?rlkey=…&dl=0`）= `file=` 后面整段都算链接（它自己的 & 参数也在里面），所以 file= 要放最后。 */
export function linkParam(href: string): string | null {
  let u: URL;
  try { u = new URL(href); } catch { return null; }
  const q = u.search;   // 带「?」，不含 #
  const m = /[?&]file=/.exec(q);
  if (!m) return null;
  let raw = q.slice(m.index + m[0].length);
  if (/^https?%3a/i.test(raw) || (/%2f/i.test(raw.split("&")[0]) && !raw.split("&")[0].includes("/"))) {
    raw = raw.split("&")[0];
    try { raw = decodeURIComponent(raw); } catch { return null; }
  }
  raw = raw.trim();
  return raw || null;
}

/** 网址去掉 file= 那一段（打开过一次就从地址栏拿掉，刷新不再问）。file= 后面整段都算链接，所以连同后面的一起去掉。 */
export function withoutLinkParam(href: string): string {
  const u = new URL(href);
  const m = /[?&]file=/.exec(u.search);
  if (!m) return href;
  const rest = u.search.slice(0, m.index);
  u.search = rest.startsWith("?") ? rest : rest ? "?" + rest.replace(/^&/, "") : "";
  return u.toString();
}

const b64url = (s: string): string => {
  const bytes = new TextEncoder().encode(s);
  let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
};
const lastSeg = (path: string): string | null => {
  const seg = path.split("/").filter(Boolean).pop();
  if (!seg) return null;
  let s: string; try { s = decodeURIComponent(seg); } catch { s = seg; }
  return SONG_NAME.test(s) ? s : null;
};

/** 人给的链接 → 去哪拿。只认 https；http 只认本机（localhost / 127.0.0.1，开发和测试用——不看这一页自己的协议：那归 deployment.ts，test/deployment.test.mjs 守）。 */
export function planLink(raw: string): LinkResult {
  let s = raw.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = s.startsWith("//") ? "https:" + s : "https://" + s;   // 没写协议 = https
  let u: URL;
  try { u = new URL(s); } catch { return { error: _t("这不是一个网址：{link}", { link: raw }) }; }
  if (u.protocol !== "https:" && !(u.protocol === "http:" && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname))) return { error: _t("只认 https 开头的链接：{link}", { link: raw }) };
  const shown = u.toString(), host = u.hostname.replace(/^www\./, ""), name = lastSeg(u.pathname);
  // Google Drive：不放行跨站读，不去请求
  if (/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$|(^|\.)drive\.usercontent\.google\.com$/.test(u.hostname))
    return { error: _t("Google Drive 不让别的网页直接读里面的文件，这条链接打不开。换成 Dropbox、OneDrive、GitHub，或者自己网站上的直链。") };
  // Dropbox：分享页 → 直链主机
  if (/(^|\.)dropbox\.com$/.test(u.hostname)) {
    if (/^\/(sh|scl\/fo)\//.test(u.pathname)) return { error: _t("这是 Dropbox 的文件夹链接：要分享单个歌文件的链接。") };
    const d = new URL(u.toString());
    d.hostname = "dl.dropboxusercontent.com";
    d.searchParams.delete("dl"); d.searchParams.delete("raw");
    return { url: d.toString(), shown, host: "Dropbox", via: "dropbox", name };
  }
  if (u.hostname === "dl.dropboxusercontent.com") return { url: shown, shown, host: "Dropbox", via: "dropbox", name };
  // GitHub：页面 → 原始文件
  if (u.hostname === "github.com") {
    const m = /^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/.exec(u.pathname);
    if (!m) return { error: _t("这是 GitHub 的页面，不是文件：要链到仓库里的那个歌文件（地址里有 /blob/ 的那种）。") };
    return { url: `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`, shown, host: "GitHub", via: "github", name };
  }
  if (u.hostname === "gist.github.com") {
    const m = /^\/([^/]+)\/([0-9a-f]+)\/?(?:raw(\/.*)?)?$/i.exec(u.pathname);
    if (!m) return { error: _t("认不出这个 Gist 链接：要带用户名的那种（gist.github.com/名字/编号）。") };
    return { url: `https://gist.githubusercontent.com/${m[1]}/${m[2]}/raw${m[3] ?? ""}`, shown, host: "GitHub Gist", via: "gist", name: m[3] ? lastSeg(m[3]) : null };
  }
  // OneDrive：整条分享链接编进匿名分享接口
  if (u.hostname === "1drv.ms" || /(^|\.)onedrive\.live\.com$/.test(u.hostname))
    return { url: `https://api.onedrive.com/v1.0/shares/u!${b64url(shown)}/root/content`, shown, host: "OneDrive", via: "onedrive", name: null };
  return { url: shown, shown, host: u.hostname, via: "bare", name };
}

/** 拿回来的字节像什么：zip（.mxl）/ xml（没压缩的 MusicXML）/ html（多半是网盘的网页，不是文件）/ other。 */
export function sniff(bytes: Uint8Array): "zip" | "xml" | "html" | "other" {
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return "zip";
  const head = new TextDecoder().decode(bytes.subarray(0, 1024)).replace(/^﻿/, "").trimStart().toLowerCase();
  if (!head.startsWith("<")) return "other";
  if (/^<!doctype html|<html[\s>]/.test(head)) return "html";
  if (/score-partwise|score-timewise/.test(head) || head.startsWith("<?xml")) return "xml";
  return "other";
}

/** 给读歌那一层的文件名：链接里看得出名字就用它，看不出 = 按内容给一个。 */
export const fileNameFor = (plan: LinkPlan, kind: "zip" | "xml"): string => plan.name ?? (kind === "zip" ? "link.mxl" : "link.musicxml");

export interface FetchOpts { max?: number; onProgress?: (got: number, total: number | null) => void; signal?: AbortSignal; fetchImpl?: typeof fetch }

/** 下载。只读 GET、不带登录信息和来源页；超过上限就停（先看 Content-Length，没有就边读边数）。失败 = 抛错，话是给人看的。 */
export async function fetchLink(plan: LinkPlan, o: FetchOpts = {}): Promise<Uint8Array> {
  const max = o.max ?? LINK_MAX_BYTES, f = o.fetchImpl ?? fetch;
  let r: Response;
  try { r = await f(plan.url, { method: "GET", credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store", redirect: "follow", signal: o.signal }); }
  catch (e) {
    if ((e as { name?: string }).name === "AbortError") throw e;
    throw new Error(_t("没拿到：{host} 不让别的网页读这个文件，或者网断了。", { host: plan.host }));
  }
  if (!r.ok) throw new Error(r.status === 404 || r.status === 410 ? _t("{host} 说这个文件不在了（{status}）：链接过期了，或者没设成公开分享。", { host: plan.host, status: String(r.status) })
    : r.status === 401 || r.status === 403 ? _t("{host} 不让读（{status}）：这条链接没设成「知道链接的人都能看」。", { host: plan.host, status: String(r.status) })
    : _t("{host} 回了 {status}，没拿到文件。", { host: plan.host, status: String(r.status) }));
  const total = Number(r.headers.get("content-length")) || null;
  const tooBig = () => new Error(_t("这个文件超过 {mb} MB，不像一首歌，没打开。", { mb: String(Math.round(max / 1024 / 1024)) }));
  if (total != null && total > max) throw tooBig();
  if (!r.body) { const b = new Uint8Array(await r.arrayBuffer()); if (b.length > max) throw tooBig(); return b; }
  const reader = r.body.getReader(), parts: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    got += value.length;
    if (got > max) { void reader.cancel(); throw tooBig(); }
    parts.push(value); o.onProgress?.(got, total);
  }
  const out = new Uint8Array(got); let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}
