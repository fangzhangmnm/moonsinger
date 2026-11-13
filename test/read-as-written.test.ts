// 读 = 文件上怎么写就怎么读（施工单第 16 条 16-2，2026-11-12）。created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。
// 守：乐手读不到 ≠ 小月相（没人上场、存的时候不替它造一位）；新歌在创建那一刻按模板写了乐手；别家的谱没写速度 / 调号 / 拍号 = 打开时照实说一句；
//   混音轨之间的「出到 / 发送」接没接上只有一个判法（录音房和混音台共用）；升级链整个没了、开歌时不补力度不理顺。
import { describe, it, eq, assert } from "./runner.mjs";
import { openBytes, saveMxl, emptyExtras, templateExtras, activeInstrument, activeId, candidates, type Extras } from "../src/format/project.ts";
import { busLinkStates } from "../src/engine/studio.ts";
import { initState } from "../src/score/song.ts";
import { strToU8, unzipSync } from "../vendor/fflate/fflate.esm.js";
const fs = (await import("node:fs" as string)) as { existsSync(u: URL): boolean; readFileSync(u: URL, e: "utf8"): string; readdirSync(u: URL, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[] };
const ROOT = new URL("../", import.meta.url);

describe("乐手读不到 ≠ 小月相", () => {
  it("歌里没有这个声部的乐手 = 没人上场（不是小月相）；存的时候不替它造一位", () => {
    const song = initState().song, role = song.parts[0]!.role;
    eq(activeInstrument(emptyExtras(), role), null); eq(activeId(emptyExtras(), role), ""); eq(candidates(emptyExtras(), role).length, 0);
    const files = unzipSync(saveMxl({ song, hum: "n", extras: emptyExtras(), app: "t", date: "2026-11-12T00:00:00.000Z" }));
    assert(!Object.keys(files).some((p) => p.startsWith(".moonsinger/lounge/")), "没有乐手的声部存的时候不写休息室");
    eq(activeInstrument(openBytes("x.mxl", saveMxl({ song, hum: "n", extras: emptyExtras(), app: "t", date: "2026-11-12T00:00:00.000Z" })).extras, role), null, "读回来还是没人上场");
  });
  it("新歌按模板把乐手写进去：每个声部都有、上场的是小月相；存了再开一样", () => {
    const song = initState().song, x: Extras = templateExtras(song), role = song.parts[0]!.role;
    eq(activeInstrument(x, role)?.engine, "tsukuyomi");
    eq(activeInstrument(openBytes("x.mxl", saveMxl({ song, hum: "n", extras: x, app: "t", date: "2026-11-12T00:00:00.000Z" })).extras, role)?.engine, "tsukuyomi");
  });
});

describe("别家的谱：没写的谱头照实说", () => {
  const xml = (attrs: string, dir = "") => `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Flute</part-name></score-part></part-list>` +
    `<part id="P1"><measure number="1"><attributes><divisions>1</divisions>${attrs}</attributes>${dir}<note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>`;
  it("没写速度 / 调号 / 拍号 = 打开时那一串话里各一句；都写了 = 不说", () => {
    const o = openBytes("a.musicxml", strToU8(xml("")));
    assert(o.notices.some((n) => /没写速度/.test(n) && /没写调号/.test(n) && /没写拍号/.test(n)), JSON.stringify(o.notices));
    const full = openBytes("b.musicxml", strToU8(xml("<key><fifths>1</fifths></key><time><beats>3</beats><beat-type>4</beat-type></time>", `<direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>100</per-minute></metronome></direction-type><sound tempo="100"/></direction>`)));
    assert(!full.notices.some((n) => /没写(速度|调号|拍号)/.test(n)), JSON.stringify(full.notices));
  });
});

describe("混音轨之间接没接上：一个判法（录音房和混音台共用）", () => {
  it("去处不是一条混音轨 = missing；接上会成环的那一条 = cycle（按顺序，先接上的留着）；出到总轨不算连线", () => {
    const has = (id: string) => ["b1", "b2"].includes(id);
    const st = busLinkStates([{ id: "b1", to: "b2", sends: [{ to: "b9" }] }, { id: "b2", to: "master", sends: [{ to: "b1" }] }], has);
    eq(st.get("b1")!.to, "ok"); eq(st.get("b1")!.sends[0], "missing");
    eq(st.get("b2")!.to, null); eq(st.get("b2")!.sends[0], "cycle", "b2 → b1 会接成环（b1 已经出到 b2）");
    eq(busLinkStates([{ id: "b1", to: "b1" }], has).get("b1")!.to, "cycle", "出到自己 = 环");
  });
});

describe("结构：没有升级链；开歌时不补不理顺", () => {
  it("src/format/migrate/ 不存在；src 里没有 migrate( / loungeRoleNames / legacyLooks", () => {
    assert(!fs.existsSync(new URL("src/format/migrate/", ROOT)), "升级链文件夹还在");
    const walk = (u: URL): string[] => fs.readdirSync(u, { withFileTypes: true }).flatMap((e) => { const v = new URL(e.name + (e.isDirectory() ? "/" : ""), u); return e.isDirectory() ? walk(v) : /\.ts$/.test(e.name) ? [v.href] : []; });
    const bad = walk(new URL("src/", ROOT)).filter((f) => { const c = fs.readFileSync(new URL(f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""); return /\bmigrate\s*\(|\bloungeRoleNames\b|\blegacyLooks\b/.test(c); });
    eq(bad.map((f) => f.slice(ROOT.href.length)).join(", "), "");
  });
  it("开歌（main.ts loadDocInner）不补力度、不理顺先后：只有人改谱时补（document 的 normalize）", () => {
    const src = fs.readFileSync(new URL("src/app/main.ts", ROOT), "utf8"), i = src.indexOf("function loadDocInner("), body = src.slice(i, src.indexOf("\n}\n", i));
    assert(i > 0 && !/ensureStartDyns|withStartDyns/.test(body.replace(/\/\/.*$/gm, "")), "loadDocInner 里又补力度了");
  });
});
