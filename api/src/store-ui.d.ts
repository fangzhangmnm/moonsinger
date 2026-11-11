import type { StoreUI } from "@internal/store";
import { type CloudGate } from "./cloud-gate.ts";
/** 文件夹的权限中途掉了（provider 原样抛 NotAllowedError）：宿主画 chip（家族工单 H3）。isFolder = 家是不是文件夹（本文件被 app-store 引，不能反过来 import 它）。 */
export declare function attachFolderLost(cb: () => void, isFolder: () => boolean): void;
/** app 组装层把闸门递进来（store-ui 在 createStore 时就要，闸门要等 app 起来才有）。 */
export declare function attachGate(g: CloudGate): void;
export declare const storeUI: StoreUI;
