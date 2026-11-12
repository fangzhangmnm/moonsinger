import type { LoungeRoleV2 } from "../contract.ts";
type Concept = NonNullable<LoungeRoleV2["concept"]>;
export declare const LEGACY_PRESETS: readonly {
    sound: string;
    en: string;
    concept: Concept;
}[];
export declare const LEGACY_LABELS: {
    readonly byWikidata: Readonly<Record<string, {
        en: string;
        abbr?: string;
    }>>;
    readonly byLocal: Readonly<Record<string, {
        en: string;
        abbr?: string;
    }>>;
};
export {};
