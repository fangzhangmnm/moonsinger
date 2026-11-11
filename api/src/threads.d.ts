export type ThreadName = "singer-worker" | "mp3-worker" | "studio-worklet" | "layout-worker" | "encode-worker";
/** 后台线程能不能自己按网址去拿站点里的文件（WORLD / LAME / 模型包）。备用版不能：主线程读好了交过去。 */
export declare function workersFetchSiteFiles(): boolean;
/** 这个线程按顺序试的地址。 */
export declare function threadUrls(name: ThreadName): string[];
/** 线程起不来（试过所有起法）时通知（宿主说一声 + 进黑匣子）。 */
export declare function onThreadFail(cb: (name: ThreadName, why: string) => void): () => void;
export declare function reportThreadFail(name: ThreadName, why: string): void;
/** 起一个 module worker：按顺序试（data: → blob:），同步抛的换下一种；都不行 = 报健康 + 抛。 */
export declare function startWorker(name: ThreadName): Worker;
/** 出声线程（AudioWorklet）：按顺序 addModule，起不来换下一种。 */
export declare function addWorklet(ctx: BaseAudioContext, name: ThreadName): Promise<void>;
