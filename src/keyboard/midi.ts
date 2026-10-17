// midi.ts —— MIDI 键盘（Web MIDI）：插在电脑上的电子琴 / MIDI 键盘 = 又一个只发按键的输入设备。created 2026-10-16 by Claude Opus 5.5
//   user 2026-10-16「今天把midi键盘做一下吧，最好ipad也能支持，可以插电子琴上弄」（10-09 杂事账「midi键盘能做就做」）。
// 键盘模块的规矩照旧（ai-docs/20261014-editing-mental-model.md §2）：只管交互，不懂音乐——发出来的是「第几号琴键按下 / 松开」，
//   琴键号怎么拼成谱上的音、写还是只响，归宿主（main.ts → pad-host.ts 的同一个翻译层：写 / 改 / 叠音观望 / 单声护栏 / 弹）。
// 线程：浏览器只在主线程给 MIDI 消息（requestMIDIAccess 只在 window 的 navigator 上，端口不能交给 worker），所以这里也在主线程。
// iPad / iPhone：Safari（以及 iOS 上所有浏览器，都是同一个 WebKit）没有 Web MIDI——status 报 unsupported，宿主照实说；绕路是 wishlist。
// 许可：Chrome 系第一次 requestMIDIAccess 会弹浏览器自己的许可框，所以只在人点「连接」时问；浏览器记住「允许」以后，开 app 时 resume() 静默接上。
// 只认音符的按下 / 松开（任何通道）；控制器（推子 / 旋钮 / 踏板）解析出来但不接（以后路由推子 = wishlist），时钟 / 心跳等系统消息丢掉。

/** 一条 MIDI 消息（只解析用得到的）。vel 0–127。 */
export type MidiMsg =
  | { k: "on"; ch: number; note: number; vel: number }
  | { k: "off"; ch: number; note: number }
  | { k: "cc"; ch: number; cc: number; value: number };

/** 解析一条消息：按下力度 0 = 松开（很多琴这样发松开）；别的（弯音 / 触后 / 系统消息 / 不完整的）= null。 */
export function parseMidi(data: ArrayLike<number>): MidiMsg | null {
  if (data.length < 3) return null;
  const st = data[0] & 0xf0, ch = data[0] & 0x0f, a = data[1] & 0x7f, b = data[2] & 0x7f;
  if (st === 0x90) return b > 0 ? { k: "on", ch, note: a, vel: b } : { k: "off", ch, note: a };
  if (st === 0x80) return { k: "off", ch, note: a };
  if (st === 0xb0) return { k: "cc", ch, cc: a, value: b };
  return null;
}

export type MidiStatus =
  | { k: "unsupported" }                    // 这个浏览器没有 Web MIDI（iPad / iPhone）
  | { k: "off" }                            // 还没连（没问过 / 浏览器没记住允许）
  | { k: "asking" }                         // 等浏览器的许可框
  | { k: "denied"; why: string }            // 没给 / 出错
  | { k: "on"; inputs: string[] };          // 连上了；inputs = 现在插着的琴（可以是空的：插上就认）

export interface MidiHandlers {
  /** 一个琴键按下：note = 琴键号（60 = 中央 C），vel = 力度 0–1，id = 这个键的来源 id（松开时同一个）。 */
  down(note: number, vel: number, id: string): void;
  up(id: string): void;
  /** 插上 / 拔掉一台（连上以后才报；连上那一刻已经插着的不报）。 */
  plug?(name: string, on: boolean): void;
  status?(s: MidiStatus): void;
}

export interface MidiKeyboard {
  readonly status: MidiStatus;
  /** 人点了「连接」：问浏览器要许可（第一次会弹浏览器自己的框）。 */
  connect(): Promise<MidiStatus>;
  /** 开 app 时：浏览器已经记住「允许」就静默接上，没记住什么也不做（不弹框）。 */
  resume(): Promise<void>;
}

// 只用到的那一小块 Web MIDI 形状（lib.dom 里有，但写在这里测试好造假的）
interface PortLike { id: string; name?: string | null; manufacturer?: string | null; state?: string; type?: string; onmidimessage: ((e: { data: Uint8Array | null }) => void) | null }
interface AccessLike { inputs: { forEach(cb: (p: PortLike) => void): void }; onstatechange: ((e: { port: PortLike | null }) => void) | null }
export interface MidiNavigator {
  requestMIDIAccess?: (o?: { sysex?: boolean }) => Promise<AccessLike>;
  permissions?: { query(d: { name: string }): Promise<{ state: string }> };
}

const portName = (p: PortLike): string => (p.name || p.manufacturer || "MIDI 键盘").trim();

export function createMidiKeyboard(h: MidiHandlers, nav: MidiNavigator = navigator as unknown as MidiNavigator): MidiKeyboard {
  let status: MidiStatus = typeof nav.requestMIDIAccess === "function" ? { k: "off" } : { k: "unsupported" };
  let access: AccessLike | null = null;
  const ports = new Map<string, PortLike>();          // 接着的输入口
  const held = new Map<string, string>();             // 按着的键 id → 哪个口（拔掉时松开它的）
  const set = (s: MidiStatus): void => { status = s; h.status?.(s); };
  const report = (): void => { if (access) set({ k: "on", inputs: [...ports.values()].map(portName) }); };
  const release = (portId: string): void => { for (const [id, p] of [...held]) if (p === portId) { held.delete(id); h.up(id); } };

  function attach(p: PortLike): boolean {
    if (ports.has(p.id)) return false;
    ports.set(p.id, p);
    p.onmidimessage = (e) => {
      const m = e.data ? parseMidi(e.data) : null;
      if (!m || m.k === "cc") return;
      const id = `midi:${p.id}:${m.ch}:${m.note}`;
      if (m.k === "off") { if (held.delete(id)) h.up(id); return; }
      if (held.has(id)) h.up(id);                     // 同一个键没松又按（有的琴这样发）：先松再按
      held.set(id, p.id); h.down(m.note, m.vel / 127, id);
    };
    return true;
  }
  function detach(p: PortLike): boolean {
    const had = ports.get(p.id); if (!had) return false;
    had.onmidimessage = null; ports.delete(p.id); release(p.id);
    return true;
  }
  function adopt(a: AccessLike): void {
    access = a;
    a.inputs.forEach((p) => { if (p.state !== "disconnected") attach(p); });
    a.onstatechange = (e) => {
      const p = e.port; if (!p || (p.type && p.type !== "input")) return;
      const changed = p.state === "disconnected" ? detach(p) : attach(p);
      if (changed) { h.plug?.(portName(p), p.state !== "disconnected"); report(); }
    };
    report();
  }

  let pending: Promise<MidiStatus> | null = null;
  function connect(): Promise<MidiStatus> {
    if (access || status.k === "unsupported") return Promise.resolve(status);
    if (pending) return pending;
    set({ k: "asking" });
    pending = nav.requestMIDIAccess!({ sysex: false })
      .then((a) => { adopt(a); return status; })
      .catch((e: unknown) => { set({ k: "denied", why: e instanceof Error ? e.message || e.name : String(e) }); return status; })
      .finally(() => { pending = null; });
    return pending;
  }
  async function resume(): Promise<void> {
    if (access || status.k === "unsupported" || !nav.permissions) return;
    let state = "";
    try { state = (await nav.permissions.query({ name: "midi" })).state; } catch { return; }   // 不认识 "midi" 这个名字的浏览器：等人点「连接」
    if (state === "granted") await connect();
  }
  return { get status() { return status; }, connect, resume };
}
