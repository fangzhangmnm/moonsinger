import type { EmbeddedPack } from "@internal/model-packs";
export declare const SINGER: {
    readonly voice: "voice-tsukuyomi-chan-zhen-dur-6lang-fp16-20261007";
    readonly runtime: "runtime-onnxruntime-web-1.30.0-20261001";
    readonly lang: {
        readonly ja: "lang-ja-pyopenjtalk-plus-0.4.1.post9-20261001";
        readonly zh: "lang-zh-pinyin-20261001";
        readonly en: "lang-en-cmudict-20261001";
    };
};
export declare const PACKS: Record<string, EmbeddedPack>;
/** 月读（つくよみちゃん）的署名块和禁止用途：出货时必须显示在界面上（包内 LICENSE.txt [1][2]）。 */
export declare const CREDIT: {
    credit: string;
    terms: string;
    termsUrl: string;
    attribution: string[];
};
