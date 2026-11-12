import { type Extras, type Engine } from "../../format/project.ts";
import { type Hum, type Song } from "../../score/song.ts";
import { type Catalog } from "../../gm/catalog.ts";
export interface InstSettingsHost {
    shown(): boolean;
    extras(): Extras;
    song(): Song;
    at(): {
        paper: string;
        part: string;
    };
    role(): string;
    engine(): Engine;
    catalog(): Catalog | null;
    needCatalog(): void;
    padHidden(): boolean;
    abbr(k: number): string;
    sessionHas(sha256: string): boolean;
    bankBytes(sha256: string): Uint8Array | undefined;
    commit(next: Extras, label: string, gesture?: string): void;
    setHum(h: Hum): void;
    setPart(id: string): void;
    silence(): void;
    back(): void;
    togglePad(): void;
    openFinder(): void;
    findBankFile(candId: string): void;
}
/** el = 页面的容器（宿主建好、挂进 #stage）。返回 draw = 重画（开着才画）。 */
export declare function createInstSettings(el: HTMLElement, h: InstSettingsHost): {
    draw(): void;
};
