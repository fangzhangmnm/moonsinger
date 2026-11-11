export declare const INSTRUMENTS_VERSION = 15;
export declare const INSTRUMENT_FILES: {
    readonly concepts: {
        readonly file: "vendor/instruments/instruments-v15.json";
        readonly bytes: 317869;
        readonly sha256: "4340e7b473321f2abc5f861066244cf60bdccfc5288fdc37e111b763d8aa7139";
    };
    readonly gmMap: {
        readonly file: "vendor/instruments/gm-map-v15.json";
        readonly bytes: 434160;
        readonly sha256: "41cd2fe8ece13b2d5f6baa867796f3894d94e592c67e9432a7f15bda2f1aa921";
    };
    readonly icons: {
        readonly file: "vendor/instruments/instrument-icons-20261107-v15.svg";
        readonly bytes: 139014;
        readonly sha256: "a94929205faabf3403223cea2ff6b69ebc2443f7b19d164434125552ecd138f0";
    };
    readonly iconCredits: {
        readonly file: "vendor/instruments/icon-credits-v15.json";
        readonly bytes: 20670;
        readonly sha256: "ac545e5c65df0dc99e499329a6d066faaa932c6ebfef935347be8cdeace76592";
    };
    readonly licenses: {
        readonly file: "vendor/instruments/LICENSES-chosen-v15.md";
        readonly bytes: 145790;
        readonly sha256: "4fafc7fdd1ba7b07113d6a34f9589406de78edafa93ebbe2edcbc15c190b89d9";
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
