export declare const INSTRUMENTS_VERSION = 16;
export declare const INSTRUMENT_FILES: {
    readonly concepts: {
        readonly file: "vendor/instruments/instruments-v16.json";
        readonly bytes: 327672;
        readonly sha256: "676b9c2372ae80fa6cc4cc30ba16c1539a16247789ccfd0b78c032414941b465";
    };
    readonly gmMap: {
        readonly file: "vendor/instruments/gm-map-v16.json";
        readonly bytes: 434160;
        readonly sha256: "76cd490654dded61b5996846ea5b88801805f0d9422f1abb81b2f9c78993f8bb";
    };
    readonly icons: {
        readonly file: "vendor/instruments/instrument-icons-20261113-v16.svg";
        readonly bytes: 139014;
        readonly sha256: "0ef2d1ace2522d369740e0b300fdb5c966de3bb3bd33998506e07a98e1abb02f";
    };
    readonly iconCredits: {
        readonly file: "vendor/instruments/icon-credits-v16.json";
        readonly bytes: 20670;
        readonly sha256: "3174f2b4340806fb67a51228aecfae2afe342ca70b313261825e00aa269fbc42";
    };
    readonly licenses: {
        readonly file: "vendor/instruments/LICENSES-chosen-v16.md";
        readonly bytes: 145790;
        readonly sha256: "edd6244d484905834110560e38d3b0dbfe7b79a790115a67e68bfc58025b18f6";
    };
};
/** 图标署名（第三方图标，随 app vendor；设置里显示）。modified = 派生图标（--tile）改了什么（CC-BY 要求注明改动；v4 起）。 */
export declare const ICON_CREDITS: {
    id: string;
    set: string;
    author: string;
    license: string;
    url: string;
    modified?: string;
}[];
