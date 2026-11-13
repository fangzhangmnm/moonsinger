export interface GmRef {
    program: number;
    bank: number;
    note?: number;
}
export interface Concept {
    id: string;
    ids: {
        wikidata: string | null;
        local: string | null;
        musicxml: string | null;
        gm: GmRef[];
        hs: string | null;
    };
    names: {
        zh: string;
        en: string;
        ja?: string;
        tok?: string;
    };
    kind: "instrument" | "model" | "ensemble" | "voice" | "sound";
    year: number | null;
    yearApprox?: boolean;
    lineageYear?: number | null;
    era?: string | null;
    regions?: string[];
    family: string[];
    wikipedia?: string;
    styles?: {
        tag: string;
        ear: string;
        as?: string;
        weight?: number;
    }[];
    substitutes?: {
        program: number;
        bank: number;
        note?: number;
        gmNumber: number;
        gmName: string;
        basis: "official" | "lineage" | "imitation" | "family" | "name-only";
        hsCommon?: string;
        reason?: string;
    }[];
    icon?: {
        id: string | null;
        candidates?: string[];
        license?: string;
        borrowedFrom?: string;
    } | null;
    fundamentalRank: number | null;
    /** 常用音域（MIDI，实际发声，移调乐器已换算）：v5 起由仓鼠的百科表给（user 2026-10-08「让仓鼠调查」）；没有 = 不画提示。basis = 依据（「原文（Violin）」「AI 常识」…）。 */
    range?: {
        low: number;
        high: number;
        basis?: string;
    } | null;
    /** 音效在现实里最像的那个键（v5；电话 = 102，GS 采样实测 2951 Hz；user「电话铃感觉就是老实的，以你听到的为准」）。 */
    naturalKey?: {
        note: number;
        hz?: number;
        basis?: string;
    } | null;
    /** 出版谱简写（v12；MuseScore instruments.xml 的 shortName，如 Vln. / Pno. / Glock.）：总谱第二行起每行谱前写它（user「乐手名和颜色同意」）。没有 zh（仓鼠没找到中文通行简称的出处，不现编）。 */
    abbr?: {
        en: string;
        basis?: string;
    } | null;
    /** 谱上名（v15）：谱表开头印的、乐手对这个声部的叫法（Western concert flute → Flute、各型号 → 功能名 Electric Guitar / Synthesizer）；names = 详细说明（百科名），不上谱。
     *  user 2026-11-07「为什么我从era里面选的flute在sheet上面显示western concept flute」「所以应该是有详细解释，名字，简写？」「不只是长笛，而是系统的看一下」。 */
    scoreName?: {
        en: string;
        basis?: string;
    } | null;
    /** 记谱惯例（v12）：clef = 按惯例写谱的谱号；concertClef = 按实际音高显示时的谱号（钟琴 G15ma、短笛 / 木琴 G8va、低音提琴 F8vb）；
     *  sounds = 实际音高 − 按基础谱号读的谱面音高（半音）；octave = sounds 里整八度的部分。 */
    notation?: {
        clef: string;
        clefs?: string[];
        concertClef: string;
        concertClefs?: string[];
        sounds: number;
        octave: number;
        basis?: string;
        wikipedia?: unknown;
    } | null;
}
/** 铃类的八度实测（v12，gm-map GM 9–16 / 99 / 113 / 115）：measured = 最强分音比键名高几个半音；perceived = 耳朵听到的音比键名高几个半音（null = 判不准）。 */
export interface OctaveCheck {
    keys: number[];
    measured: number;
    measuredOctave: number;
    lowest: number;
    perceived: number | null;
    perceivedNote?: string;
    basis?: string;
    sources?: unknown;
}
export interface GmRow {
    program: number;
    bank: number;
    note?: number;
    gmNumber: number;
    gmName: string;
    family?: string;
    concept: string;
    relation: "self" | "substitute";
    primary?: boolean;
    /** 这个音色自己在哪些风里（仓鼠 v8 起逐个音色判；本尊行才有）：as = 在这种风里顶替哪个概念（平替认领）。概念上的 styles 是这些聚合出来的，只拿来说「这件乐器属于哪些风」。 */
    styles?: {
        tag: string;
        ear: string;
        weight?: number;
        as?: string;
    }[];
    musicxmlSound?: string;
    year?: number | null;
    era?: string;
    basis?: string;
    reason?: string;
    /** GM 116–128 音效：在 GS + TinySoundFont 里按哪个键是采样原速（v8 按 TSF 的音高公式重算；换音色库 / 引擎就不算数）。 */
    joint?: RowJoint;
    excitation?: {
        id: string;
        basis?: string;
    };
    breath?: {
        id: string;
        basis?: string;
    };
    sustain?: {
        id: string;
        attackMs?: number;
        noteOffCuts?: boolean;
        basis?: string;
    };
    velLayers?: {
        soundfont?: string;
        key?: number;
        count: number;
        ranges: [number, number][];
        mpMfSwitchesLayer?: boolean;
        basis?: string;
    };
    octaveCheck?: OctaveCheck;
    sampleKey?: {
        soundfont: string;
        engine?: string;
        recommended: number;
        recommendedBasis?: string;
        layers?: {
            sample?: string;
            originalSpeedKey?: number;
            centsPerKey?: number;
            keyRange?: string;
            peakAtRecommended?: {
                hz: number;
                midi: number;
                pitched: boolean;
            } | null;
        }[];
    };
}
/** 演奏元数据（仓鼠 v11 起，gm-map 每行都有，各带 basis 依据；W-13：中文标签从 defs 取，不写死）。
 *  joint = 不写记号时音和下一个音怎么接（连断的底色）；鼓件 / 音效 / 一下就完的 id = null。 */
export interface RowJoint {
    id: string | null;
    gapMs: number | null;
    basis?: string;
}
export interface Defs {
    eras: {
        id: string;
        zh: string;
        from: number | null;
        to: number | null;
    }[];
    families: {
        id: string;
        en: string;
        zh: string;
    }[];
    kinds: {
        id: string;
        zh: string;
    }[];
    styles?: {
        id?: string;
        tag?: string;
        zh?: string;
        en?: string;
    }[];
    weights?: {
        id: number;
        zh: string;
    }[];
}
export interface Catalog {
    version: number;
    concepts: Concept[];
    byId: Map<string, Concept>;
    gmSelf: Map<string, GmRow>;
    rows: GmRow[];
    defs: Defs;
}
/** 一个概念的「谁能演」（GM 这边）：本尊预设；没本尊时列平替（写明依据）。bank 128 = 鼓组。 */
export interface Provider {
    kind: "self" | "substitute";
    bank: number;
    program: number;
    note?: number;
    gmName: string;
    sound: string | null;
    basis?: string;
    reason?: string;
}
export declare const gmKey: (g: {
    bank: number;
    program: number;
    note?: number;
}) => string;
export declare function loadCatalogFromJson(concepts: {
    v?: number;
    defs: Defs;
    concepts: Concept[];
}, gmMap: {
    rows: GmRow[];
    defs?: Partial<Defs> & Record<string, unknown>;
}): Catalog;
/** 打开找人视图时才加载（两份 JSON 共 260 KB）。 */
export declare function loadCatalog(): Promise<Catalog>;
/** 图标 sprite（103 KB，49 个），核过 sha256 的字节。 */
export declare function loadIconSprite(): Promise<string>;
export declare function providersOf(cat: Catalog, c: Concept): Provider[];
/** 这个概念在 pad 上提示哪几个键（提示条 / 试听时窗口跟进用）：有常用音域 = 那一段；音效有「最像的键」= 就那一个；都没有 = null。 */
export declare function rangeOf(c: Concept | undefined): {
    lo: number;
    hi: number;
    title: string;
} | null;
/** GS 的音效预设在 TinySoundFont 里的原速键（按它采样不拉伸不压缩；仓鼠 v8）；不是 GS 的音效 = null。
 *  只对家族音源库的 GeneralUser GS 成立——调用方确认演奏者用的就是它（origin.library）。 */
export declare function sampleKeyOf(cat: Catalog, bank: number, program: number): {
    key: number;
    title: string;
    midi?: number;
    centsPerKey?: number;
} | null;
/** 连断的底色（仓鼠 v11 的 joint）：这个 GM 号建议音和音之间留多大缝 + 中文名 + 依据。目录里没有 / 没写（旧版目录、鼓件、音效）= null。
 *  按 GM 号逐个（user 2026-10-08「midi的string系乐器是有不同的演奏方法的，你不能按乐器一刀切」）。 */
export declare function jointOf(cat: Catalog, bank: number, program: number, note?: number): {
    gapSec: number;
    zh: string;
    basis: string;
} | null;
/** 这个预设能不能一直响（仓鼠 v11 实测）："sustained" / "decaying" / "oneshot"；没有 = null。 */
export declare function sustainOf(cat: Catalog, bank: number, program: number, note?: number): string | null;
/** GS 预设上场 / 试听时带的键设置：鼓件 = 固定那个键；音效（GM 116–128，仓鼠 v8 的 sampleKey）= **默认固定原速**（note = 原速键）+ 按值抄原速键和音高锚点（sfx）；
 *  其余不带（user 2026-10-08「固定原速同意，默认开。碰到猫叫歌才关，但这个时候也许需要音高修正」）。 */
export declare function castArgsOf(cat: Catalog, bank: number, program: number, drumNote?: number): {
    note?: number;
    sfx?: {
        key: number;
        midi?: number;
        centsPerKey?: number;
    };
    gapSec?: number;
    canSwell?: boolean;
};
/** 这个预设在 GS 里的力度层（仓鼠 v11 实测；在 key 那个键上测的）。没有 = null。 */
export declare function velLayersOf(cat: Catalog, bank: number, program: number, note?: number): {
    count: number;
    ranges: [number, number][];
    key?: number;
} | null;
/** 铃类的八度实测（仓鼠 v12，GM 9–16 / 99 / 113 / 115）。 */
export declare function octaveCheckOf(cat: Catalog, bank: number, program: number, note?: number): OctaveCheck | null;
/** 角色记着的概念（id 束）→ 目录里的那件。 */
export declare function conceptOfIds(cat: Catalog, ids: {
    wikidata?: string | null;
    local?: string | null;
} | undefined): Concept | undefined;
/** 乐器页「八度」那一行说的话（v0.9.32；user「几个铃的到底哪个八度算数还是没有弄清楚。不过先向用户披露」）：没有可说的 = null。clefLabel = 谱号的中文名（「高音 15ma」）。 */
export declare function octaveDisclosure(nt: Concept["notation"] | undefined, oc: OctaveCheck | null, clefLabel: (c: string) => string): string | null;
/** GS 在家族音源库里的 id（sampleKey 只对它成立）。常数住在 library-ids.ts（读文件的门口也要用，不拖进这里的取数），这里照旧导出。 */
export { GS_LIBRARY_ID } from "./library-ids.ts";
/** 谱上写的角色名：目录里的英文名首字母大写（打谱惯例；Vocals / Piano 同款）。 */
/** 谱上写的名字 = 目录的谱上名（v15）；老目录没有 = 百科英文名去掉括号、首字母大写（原来整个百科名上谱：「Western concert flute」「Solid-body electric guitar (Fender Stratocaster)」）。 */
export declare const roleNameOf: (c: Concept) => string;
/** 角色的官方乐器语义 id：概念自己的；没有就用本尊预设的；再没有 = null（角色沿用原来的）。 */
export declare const roleSoundOf: (cat: Catalog, c: Concept) => string | null;
export type SortMode = "family" | "year" | "hs" | "style" | "kind";
export declare const SORT_LABEL: Record<SortMode, string>;
/** 列表里的一行：一个概念；按曲风时可以是概念名下的**一个音色**（preset = 那一行 GM 映射，星级 / 入选按它自己的，user 2026-10-08「音色为单位而不是家族一把捞」）。 */
export interface Entry {
    concept: Concept;
    preset?: GmRow;
    weight?: number;
    as?: string;
}
export interface Group {
    id: string;
    label: string;
    items: Entry[];
}
/** 分组 + 组内排序。搜索词按中 / 英 / 日名子串过滤（按曲风时音色行也认 GM 名：搜「Pad」）。 */
export declare function groupConcepts(cat: Catalog, mode: SortMode, query?: string): Group[];
export declare const weightLabel: (cat: Catalog, w: number) => string;
export declare const fmtYear: (y: number) => string;
export declare const eraLabel: (cat: Catalog, c: Concept) => string;
