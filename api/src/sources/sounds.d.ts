import { type SoundEntry } from "../gm/sounds.gen.ts";
import type { GmCandidate } from "../format/project.ts";
export interface SoundSources {
    /** 设置里填的音源库来源（这次打开里有效；空 = 出厂默认）。 */
    source: string;
    /** 逐个试的地址：同一个网站下的 pwa-sounds/ 先，再设置里的。 */
    bases(): string[];
    /** 从音源库拿一个文件：逐个地址试，流式读（报进度），到手对目录里钉的 sha256（不对 = 不用、报出来）；核过才留在设备上。 */
    fetchSound(e: SoundEntry, onProgress: (done: number) => void): Promise<Uint8Array>;
    /** 拿到一个 SoundFont 候选的子集字节（弱引用解析链）；都找不到 = 抛错。 */
    resolveGmBytes(g: GmCandidate): Promise<Uint8Array>;
    /** 本次打开里解析到 / 加进来的子集（subsetSha256 → 字节）：keep = 记下（马上能响）；drop = 忘掉（人给了新文件，下次重新解析）。 */
    session: {
        keep(sha256: string, bytes: Uint8Array): void;
        drop(sha256: string): void;
        has(sha256: string): boolean;
        get(sha256: string): Uint8Array | undefined;
    };
}
export declare function createSoundSources(o: {
    progress(msg: string): void; /** 报错里提到的「谁」：光标所在声部的名字（原来的措辞）。 */
    roleLabel(): string;
    /** 这个音源库条目被人在设置里删了（v0.17.25）：解析链自动去拿整包那一步不下载、报「被删了」。人自己点的 fetchSound 不拦（那就是装回来）。 */ removed?(entryId: string): boolean;
}): SoundSources;
