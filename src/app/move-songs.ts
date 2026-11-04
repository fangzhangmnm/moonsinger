// move-songs.ts —— 搬家：把旧的「只在浏览器里」的歌搬进刚选的家（家族 ai-docs/20261103-library-needs-a-home.md §4 第 3 步）。created 2026-11-03 by Claude Opus 5.5（家族工单 H3）
//   纯函数 + 注入：node 直测（test/move-songs.test.mjs）；真 FSA + 真 store = test/e2e/folder-home.mjs。
//   铁律（工单 H3 ③，Fable 看 diff）：**逐首读字节 → 写进新家 → 从新家真的读回来比字节相等 → 才从旧库移走**。顺序不许反；任何一步不对 = 这一首留在旧库、进名单，接着搬下一首。
//   两类歌：
//     move = 从没同步过（float / local-only）：世界上只有浏览器这一份 → 搬走。
//     copy = 连着网盘的谱系、这台有没传上去的改动（unpushed / conflict / ghost）→ 拷一份进新家，**旧的不动**：
//            从旧库移走它 = 库在离线时排一条云端删除（delete.ts：有 base etag 就排队），回线就把网盘上那份也删了。
//     其余（synced 等）= 正本在网盘上，不算「只在浏览器里」，不碰。
//   撞名不覆盖：新家已有同名的 → 字节相同 = 算搬成（不重写）；不同 = 换个名字（-hex4），两份都在。

export type MoveKind = "move" | "copy";
export interface SongToMove { identifier: string; kind: MoveKind }
/** 这首歌该怎么搬（syncState = 库的列举状态）。null = 不归搬家管。 */
export function moveKindOf(syncState: string | undefined): MoveKind | null {
  if (syncState === "float" || syncState === "local-only") return "move";
  if (syncState === "unpushed" || syncState === "conflict" || syncState === "ghost") return "copy";
  return null;
}

export interface MovePorts {
  /** 旧库里这首的字节；拿不到 = null。 */
  read(identifier: string): Promise<Uint8Array | null>;
  /** 新家里这个身份现在的字节（**从新家真的读**，不走任何本机缓存）；没有 = null。 */
  readBack(identifier: string): Promise<Uint8Array | null>;
  /** 写进新家（撞名不覆盖：身份已被占就抛）。 */
  write(identifier: string, bytes: Uint8Array): Promise<void>;
  /** 从旧库移走（进旧库的回收站，可恢复）。只会对 kind = move 调。 */
  remove(identifier: string): Promise<void>;
  /** 撞名时换一个没人用的身份。 */
  altName(identifier: string): string;
  progress?(done: number, total: number, identifier: string): void;
}
export interface MoveResult {
  /** 字节核过、旧库已移走。 */
  moved: { from: string; to: string }[];
  /** 字节核过、旧的留着（连着网盘的）。 */
  copied: { from: string; to: string }[];
  /** 没搬成：旧库里那份一个字节没动。 */
  failed: { identifier: string; why: string }[];
  /** 新家里已经有了（字节核过），但旧库没移走成：不算丢，但旧库还没空。 */
  stuck: { identifier: string; why: string }[];
}

export const sameBytes = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};
const why = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export async function moveSongs(songs: SongToMove[], p: MovePorts): Promise<MoveResult> {
  const r: MoveResult = { moved: [], copied: [], failed: [], stuck: [] };
  let done = 0;
  for (const s of songs) {
    p.progress?.(done, songs.length, s.identifier);
    done++;
    // ① 读旧的
    let bytes: Uint8Array | null;
    try { bytes = await p.read(s.identifier); } catch (e) { r.failed.push({ identifier: s.identifier, why: why(e) }); continue; }
    if (!bytes) { r.failed.push({ identifier: s.identifier, why: "这台设备上读不到它的字节" }); continue; }
    // ② 写进新家（撞名不覆盖）
    let target = s.identifier;
    try {
      const there = await p.readBack(target);
      if (!there || !sameBytes(there, bytes)) {
        if (there) target = p.altName(s.identifier);
        await p.write(target, bytes);
      }
      // ③ 从新家真的读回来比字节
      const back = await p.readBack(target);
      if (!back) { r.failed.push({ identifier: s.identifier, why: "写完在新家里找不到" }); continue; }
      if (!sameBytes(back, bytes)) { r.failed.push({ identifier: s.identifier, why: "写进去的字节和原来的对不上" }); continue; }
    } catch (e) { r.failed.push({ identifier: s.identifier, why: why(e) }); continue; }
    // ④ 核对过了才动旧库；连着网盘的不动
    if (s.kind === "copy") { r.copied.push({ from: s.identifier, to: target }); continue; }
    try { await p.remove(s.identifier); r.moved.push({ from: s.identifier, to: target }); }
    catch (e) { r.stuck.push({ identifier: s.identifier, why: why(e) }); }
  }
  p.progress?.(songs.length, songs.length, "");
  return r;
}

/** 这趟搬完，旧库算不算空了（只有全部搬成才退役；连着网盘的留着不影响：它们的正本谱系在网盘）。 */
export const moveFinished = (r: MoveResult): boolean => r.failed.length === 0 && r.stuck.length === 0;

/** 结果说一句人话（带名单：UX 误导 = 数据安全缺陷，家族 10-26）。 */
export function moveSay(r: MoveResult, home: string, stemOf: (id: string) => string): { text: string; bad: boolean } {
  const names = (l: { identifier: string }[]) => l.slice(0, 5).map((x) => stemOf(x.identifier)).join("、") + (l.length > 5 ? ` 等 ${l.length} 首` : "");
  const parts: string[] = [];
  if (r.moved.length) parts.push(`搬好了 ${r.moved.length} 首到「${home}」`);
  if (r.copied.length) parts.push(`${r.copied.length} 首连着网盘的拷了一份过去，浏览器里那份留着（登录后照常同步）`);
  if (r.stuck.length) parts.push(`${r.stuck.length} 首已经在「${home}」里了，但浏览器里的旧的没移走：${names(r.stuck)}`);
  if (r.failed.length) parts.push(`${r.failed.length} 首没搬成，还在浏览器里，一个字节没动：${names(r.failed)}`);
  if (!parts.length) parts.push("没有要搬的歌");
  return { text: parts.join("；"), bad: r.failed.length > 0 || r.stuck.length > 0 };
}
