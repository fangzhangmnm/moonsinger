// link.test.ts —— 从链接打开（src/sources/link.ts）：认网址里的链接、换成直链、认字节、下载的几种失败。created 2026-11-11 by Claude Opus 5.5
import { describe, it, eq, assert } from "./runner.mjs";
import { linkParam, withoutLinkParam, planLink, sniff, fetchLink, fileNameFor, type LinkPlan } from "../src/sources/link.ts";

const ok = (r: ReturnType<typeof planLink>): LinkPlan => { if ("error" in r) throw new Error("expected a plan, got: " + r.error); return r; };
const err = (r: ReturnType<typeof planLink>): string => { if (!("error" in r)) throw new Error("expected an error, got: " + r.url); return r.error; };
const bytesOf = (s: string) => new TextEncoder().encode(s);

describe("从链接打开：认网址里的 file=", () => {
  it("没编码的整段都算（链接自己的 & 参数也在里面）；编码过的到下一个 & 为止；没有 = null", () => {
    eq(linkParam("https://sing.weebpaint.com/?file=dropbox.com/scl/fi/abc/song.mxl?rlkey=k1&dl=0"), "dropbox.com/scl/fi/abc/song.mxl?rlkey=k1&dl=0");
    eq(linkParam("https://sing.weebpaint.com/dev/?file=https%3A%2F%2Fexample.org%2Fa%20b.mxl&x=1"), "https://example.org/a b.mxl");
    eq(linkParam("https://sing.weebpaint.com/?lang=en&file=https://example.org/s.mxl"), "https://example.org/s.mxl");
    eq(linkParam("https://sing.weebpaint.com/"), null);
    eq(linkParam("https://sing.weebpaint.com/?file="), null);
    eq(linkParam("https://sing.weebpaint.com/?profile=1"), null, "profile= 不是 file=");
  });
  it("拿掉 file= 那一段（连同后面的），别的参数留着", () => {
    eq(withoutLinkParam("https://sing.weebpaint.com/?file=dropbox.com/x?rlkey=1&dl=0"), "https://sing.weebpaint.com/");
    eq(withoutLinkParam("https://sing.weebpaint.com/dev/?lang=en&file=https://e.org/s.mxl"), "https://sing.weebpaint.com/dev/?lang=en");
    eq(withoutLinkParam("https://sing.weebpaint.com/dev/?lang=en"), "https://sing.weebpaint.com/dev/?lang=en");
  });
});

describe("从链接打开：几家网盘换成直链", () => {
  it("裸链接原样；没写协议 = https；http 只认本机", () => {
    const p = ok(planLink("https://example.org/songs/My%20Song.mxl"));
    eq(p.url, "https://example.org/songs/My%20Song.mxl"); eq(p.via, "bare"); eq(p.host, "example.org"); eq(p.name, "My Song.mxl");
    eq(ok(planLink("example.org/a.musicxml")).url, "https://example.org/a.musicxml");
    assert(err(planLink("http://example.org/a.mxl")).includes("https"), "http 链接 = 说清楚");
    eq(ok(planLink("http://127.0.0.1:8710/a.mxl")).url, "http://127.0.0.1:8710/a.mxl", "本机 http 认（开发 / 测试）");
    eq(ok(planLink("http://localhost:8710/a.mxl")).via, "bare");
    assert(err(planLink("ftp://example.org/a.mxl")).includes("https"));
    eq(ok(planLink("https://example.org/download?id=3")).name, null, "看不出文件名 = null");
  });
  it("Dropbox：分享页 → dl.dropboxusercontent.com，rlkey 照带、dl / raw 去掉；文件夹链接 = 说清楚", () => {
    const p = ok(planLink("https://www.dropbox.com/scl/fi/abc123/Once%20upon.mxl?rlkey=k1&st=s2&dl=0"));
    eq(p.url, "https://dl.dropboxusercontent.com/scl/fi/abc123/Once%20upon.mxl?rlkey=k1&st=s2"); eq(p.via, "dropbox"); eq(p.host, "Dropbox"); eq(p.name, "Once upon.mxl");
    eq(ok(planLink("dropbox.com/s/xyz/a.mxl?dl=1")).url, "https://dl.dropboxusercontent.com/s/xyz/a.mxl");
    eq(ok(planLink("https://dl.dropboxusercontent.com/s/xyz/a.mxl")).via, "dropbox");
    assert(err(planLink("https://www.dropbox.com/scl/fo/abc/xyz?rlkey=1")).includes("文件夹"));
  });
  it("GitHub / Gist：页面 → 原始文件；仓库首页 = 说清楚", () => {
    eq(ok(planLink("https://github.com/someone/songs/blob/main/dir/a.mxl")).url, "https://raw.githubusercontent.com/someone/songs/main/dir/a.mxl");
    eq(ok(planLink("https://github.com/someone/songs/raw/v1/a.mxl")).url, "https://raw.githubusercontent.com/someone/songs/v1/a.mxl");
    assert(err(planLink("https://github.com/someone/songs")).includes("GitHub"));
    eq(ok(planLink("https://gist.github.com/someone/0123abcd")).url, "https://gist.githubusercontent.com/someone/0123abcd/raw");
    eq(ok(planLink("https://gist.github.com/someone/0123abcd/raw/a.musicxml")).url, "https://gist.githubusercontent.com/someone/0123abcd/raw/a.musicxml");
    eq(ok(planLink("https://raw.githubusercontent.com/someone/songs/main/a.mxl")).via, "bare", "已经是直链 = 原样");
  });
  it("OneDrive：整条分享链接编进匿名分享接口（u! + base64url，没有 = 号）；Google Drive = 不去请求、说清楚", () => {
    const share = "https://1drv.ms/u/s!AbCdEf?e=xyz";
    const p = ok(planLink(share));
    const want = "u!" + btoa(share).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");   // 链接都是 ASCII，btoa 够用
    eq(p.url, `https://api.onedrive.com/v1.0/shares/${want}/root/content`); eq(p.via, "onedrive");
    eq(ok(planLink("https://onedrive.live.com/?cid=1&resid=2&authkey=3")).via, "onedrive");
    for (const g of ["https://drive.google.com/file/d/abc/view", "https://docs.google.com/uc?id=1", "https://drive.usercontent.google.com/download?id=1"])
      assert(err(planLink(g)).includes("Google Drive"), g);
  });
});

describe("从链接打开：认拿回来的字节", () => {
  it("zip / MusicXML / 网页 / 别的", () => {
    eq(sniff(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0])), "zip");
    eq(sniff(bytesOf('﻿  <?xml version="1.0"?><score-partwise/>')), "xml");
    eq(sniff(bytesOf("<score-partwise version=\"4.0\"></score-partwise>")), "xml");
    eq(sniff(bytesOf("<!DOCTYPE html><html><body>Dropbox</body></html>")), "html");
    eq(sniff(bytesOf("<html lang=en>")), "html");
    eq(sniff(bytesOf("{\"a\":1}")), "other");
    eq(sniff(new Uint8Array([0x50, 0x4b, 0x05, 0x06])), "other", "空 zip 不算");
  });
  it("没文件名 = 按内容给一个", () => {
    const p = ok(planLink("https://example.org/download?id=3"));
    eq(fileNameFor(p, "zip"), "link.mxl"); eq(fileNameFor(p, "xml"), "link.musicxml");
    eq(fileNameFor(ok(planLink("https://example.org/a.mxl")), "zip"), "a.mxl");
  });
});

describe("从链接打开：下载", () => {
  const plan = ok(planLink("https://example.org/a.mxl"));
  const reply = (body: Uint8Array | null, init: ResponseInit & { headers?: Record<string, string> }) => (async () => new Response(body as BodyInit | null, init)) as unknown as typeof fetch;
  it("不带登录信息、不带来源页、只 GET；拿到原样的字节；进度报得到", async () => {
    let seen: RequestInit | undefined, url = "";
    const body = new Uint8Array(3000).map((_, i) => i & 255);
    const f = (async (u: string, init?: RequestInit) => { url = u; seen = init; return new Response(body); }) as unknown as typeof fetch;
    let last = 0;
    const got = await fetchLink(plan, { fetchImpl: f, onProgress: (n) => { last = n; } });
    eq(url, "https://example.org/a.mxl"); eq(seen?.method, "GET"); eq(seen?.credentials, "omit"); eq(seen?.referrerPolicy, "no-referrer");
    eq(got.length, 3000); eq(got[2999], 2999 & 255); eq(last, 3000);
  });
  it("网断 / 不放行 / 404 / 403 / 别的状态 = 人话；超过上限 = 不打开（有长度先看长度，没有边读边数）", async () => {
    const fail = (async () => { throw new TypeError("Failed to fetch"); }) as unknown as typeof fetch;
    const msg = async (f: typeof fetch, max?: number) => { try { await fetchLink(plan, { fetchImpl: f, max }); return "no error"; } catch (e) { return (e as Error).message; } };
    assert((await msg(fail)).includes("不让别的网页读"));
    assert((await msg(reply(null, { status: 404 }))).includes("不在了"));
    assert((await msg(reply(null, { status: 403 }))).includes("知道链接的人"));
    assert((await msg(reply(null, { status: 500 }))).includes("500"));
    assert((await msg(reply(new Uint8Array(10), { status: 200, headers: { "content-length": "999999999" } }), 1000)).includes("超过"));
    assert((await msg(reply(new Uint8Array(2000), { status: 200 }), 1000)).includes("超过"), "没有长度头也拦得住");
  });
});
