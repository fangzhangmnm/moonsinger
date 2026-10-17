// midi.test.ts —— MIDI 键盘（src/keyboard/midi.ts）：消息解析 + 按下 / 松开的簿记 + 插拔 + 许可。假的 Web MIDI，不碰浏览器。created 2026-10-16 by Claude Opus 5.5
import { describe, it, eq, assert, tick } from "./runner.mjs";
import { parseMidi, createMidiKeyboard, type MidiNavigator, type MidiStatus } from "../src/keyboard/midi.ts";

/** 假的 MIDIAccess：inputs 可加可拔，send(portId, bytes) 往那个口发一条。 */
function fakeMidi(names: string[] = ["Piano"], perm = "prompt") {
  type Port = { id: string; name: string; state: string; type: string; onmidimessage: ((e: { data: Uint8Array | null }) => void) | null };
  const ports = new Map<string, Port>(names.map((n, i) => [`p${i}`, { id: `p${i}`, name: n, state: "connected", type: "input", onmidimessage: null }]));
  const access = { inputs: { forEach: (cb: (p: Port) => void) => ports.forEach(cb) }, onstatechange: null as ((e: { port: Port | null }) => void) | null };
  let asked = 0, deny = false;
  const nav: MidiNavigator = {
    requestMIDIAccess: () => { asked++; return deny ? Promise.reject(Object.assign(new Error("Permission denied"), { name: "NotAllowedError" })) : Promise.resolve(access as never); },
    permissions: { query: async () => ({ state: perm }) },
  };
  return {
    nav, ports, get asked() { return asked; }, denyNext() { deny = true; },
    send: (id: string, ...b: number[]) => ports.get(id)!.onmidimessage?.({ data: new Uint8Array(b) }),
    plug: (id: string, name: string) => { const p: Port = { id, name, state: "connected", type: "input", onmidimessage: null }; ports.set(id, p); access.onstatechange?.({ port: p }); },
    unplug: (id: string) => { const p = ports.get(id)!; p.state = "disconnected"; access.onstatechange?.({ port: p }); },
  };
}
function recorder() {
  const log: string[] = [], plugs: string[] = [], st: MidiStatus[] = [];
  return { log, plugs, st, h: {
    down: (n: number, v: number, id: string) => log.push(`down ${n} ${v.toFixed(2)} ${id}`),
    up: (id: string) => log.push(`up ${id}`),
    plug: (name: string, on: boolean) => plugs.push(`${on ? "+" : "-"}${name}`),
    status: (s: MidiStatus) => st.push(s),
  } };
}

describe("MIDI 消息解析", () => {
  it("按下 / 松开 / 按下力度 0 = 松开 / 控制器；任何通道", () => {
    eq(JSON.stringify(parseMidi([0x90, 60, 100])), JSON.stringify({ k: "on", ch: 0, note: 60, vel: 100 }));
    eq(JSON.stringify(parseMidi([0x93, 61, 1])), JSON.stringify({ k: "on", ch: 3, note: 61, vel: 1 }));
    eq(JSON.stringify(parseMidi([0x90, 60, 0])), JSON.stringify({ k: "off", ch: 0, note: 60 }));
    eq(JSON.stringify(parseMidi([0x8f, 60, 64])), JSON.stringify({ k: "off", ch: 15, note: 60 }));
    eq(JSON.stringify(parseMidi([0xb0, 64, 127])), JSON.stringify({ k: "cc", ch: 0, cc: 64, value: 127 }));
  });
  it("时钟 / 心跳 / 弯音 / 不完整的 = null", () => {
    eq(parseMidi([0xf8]), null); eq(parseMidi([0xfe]), null); eq(parseMidi([0xe0, 0, 64]), null); eq(parseMidi([0x90, 60]), null);
  });
});

describe("MIDI 键盘：按下 / 松开的簿记", () => {
  it("浏览器没有 Web MIDI = unsupported，连接 / resume 什么都不做", async () => {
    const r = recorder(), k = createMidiKeyboard(r.h, {});
    eq(k.status.k, "unsupported"); eq((await k.connect()).k, "unsupported"); await k.resume(); eq(r.st.length, 0);
  });
  it("连接 = 问一次许可、认出插着的琴；琴键按下 / 松开带同一个 id；力度换成 0–1", async () => {
    const f = fakeMidi(["Yamaha PSR"]), r = recorder(), k = createMidiKeyboard(r.h, f.nav);
    eq(k.status.k, "off");
    const s = await k.connect();
    eq(JSON.stringify(s), JSON.stringify({ k: "on", inputs: ["Yamaha PSR"] })); eq(f.asked, 1);
    eq(r.st.map((x) => x.k).join(","), "asking,on");
    f.send("p0", 0x90, 60, 127); f.send("p0", 0x80, 60, 0);
    eq(r.log.join(" | "), "down 60 1.00 midi:p0:0:60 | up midi:p0:0:60");
    await k.connect(); eq(f.asked, 1, "连上了再点不再问");
  });
  it("没松又按同一个键 = 先松再按；没按过的松开 / 时钟 / 踏板不报", async () => {
    const f = fakeMidi(), r = recorder(), k = createMidiKeyboard(r.h, f.nav); await k.connect();
    f.send("p0", 0x90, 62, 64); f.send("p0", 0x90, 62, 64); f.send("p0", 0x80, 62, 0); f.send("p0", 0x80, 62, 0);
    f.send("p0", 0xf8); f.send("p0", 0xb0, 64, 127);
    eq(r.log.map((l) => l.split(" ")[0]).join(","), "down,up,down,up");
  });
  it("几个键一起按 = 各自一个 id（和弦）", async () => {
    const f = fakeMidi(), r = recorder(), k = createMidiKeyboard(r.h, f.nav); await k.connect();
    f.send("p0", 0x90, 60, 80); f.send("p0", 0x90, 64, 80); f.send("p0", 0x90, 67, 80);
    eq(new Set(r.log.map((l) => l.split(" ")[3])).size, 3);
  });
  it("拔掉 = 它按着的键都松开 + 报一声；插上新的 = 认 + 报一声", async () => {
    const f = fakeMidi(["A"]), r = recorder(), k = createMidiKeyboard(r.h, f.nav); await k.connect();
    f.send("p0", 0x90, 60, 80); f.send("p0", 0x90, 64, 80);
    f.unplug("p0");
    eq(r.log.filter((l) => l.startsWith("up")).length, 2, "拔掉时两个按着的键都松开");
    eq(r.plugs.join(","), "-A"); eq(JSON.stringify(k.status), JSON.stringify({ k: "on", inputs: [] }));
    f.plug("p1", "B"); eq(r.plugs.join(","), "-A,+B"); eq(JSON.stringify(k.status), JSON.stringify({ k: "on", inputs: ["B"] }));
    f.send("p1", 0x90, 72, 80); assert(r.log.at(-1)!.startsWith("down 72"), "新插的琴能弹");
    f.plug("p1", "B"); eq(r.plugs.length, 2, "同一台重复报 = 不重复认");
  });
  it("没给许可 = denied，可以再点连接", async () => {
    const f = fakeMidi(), r = recorder(), k = createMidiKeyboard(r.h, f.nav);
    f.denyNext(); const s = await k.connect();
    eq(s.k, "denied"); assert(s.k === "denied" && s.why.includes("Permission denied"), "带上原因");
  });
  it("resume：浏览器记住了允许 = 静默接上；没记住 = 不问", async () => {
    const g = fakeMidi(["X"], "granted"), r1 = recorder(), k1 = createMidiKeyboard(r1.h, g.nav);
    await k1.resume(); eq(k1.status.k, "on"); eq(g.asked, 1);
    const p = fakeMidi(["X"], "prompt"), r2 = recorder(), k2 = createMidiKeyboard(r2.h, p.nav);
    await k2.resume(); await tick(); eq(k2.status.k, "off"); eq(p.asked, 0, "没记住允许 = 不弹浏览器的框");
  });
});
