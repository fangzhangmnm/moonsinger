export interface ConceptLabel {
    readonly score: {
        readonly zh: string;
        readonly en: string;
        readonly ja?: string;
    };
    readonly abbr?: {
        readonly en?: string;
    };
}
export declare const CONCEPT_LABELS: {
    readonly byWikidata: Record<string, ConceptLabel>;
    readonly byLocal: Record<string, ConceptLabel>;
};
