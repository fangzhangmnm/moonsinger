// cloud-gate-ui.ts —— 闸门的界面：罩 / 闸借 ui/sheets.ts 的 lockSyncGate 那个锁屏位，常驻条 = workbench-elements 的 notice。created 2026-11-03 by Claude Opus 5.5（家族工单 H；设计稿 §5）
//   锁屏位只有一个：库的冲突面来了会盖掉罩——这是对的（冲突面优先）。靠 gateGeneration 认「现在上面是不是我那张」：不是我的就不关、不抢。
//   MoonSinger 孵化中、界面只有中文：文案住这一张表，不许「失败 / 错误」当标题、不许指挥句（test/cloud-gate.test.mjs 守）。
import { _t } from "../i18n/index.ts";
import { closeNotice, showNotice } from "@internal/workbench-elements";
import { gateGeneration, isGateOpen, lockSyncGate, unlockSyncGate } from "../ui/sheets.ts";
import { reportError } from "./report-error.ts";
import type { BarState, GateReason, GateUi } from "../cloud-gate.ts";

export const GATE_TEXT = {
  checking: _t("正在核对网盘上的版本…"),
  skip: _t("先离线用"),
  title: _t("网盘没连上"),
  reason: { expired: _t("登录过期了"), offline: _t("现在没有网络"), noResponse: _t("网盘没有回应") } as Record<GateReason, string>,
  signIn: _t("重新登录"),
  offline: _t("离线继续"),
  bar: (n: number): string => (n > 0 ? _t("离线 · 还有 {n} 份没传上去", { n }) : _t("离线")),
  barSyncing: _t("已连上网盘，正在同步…"),
  barList: _t("看列表"),
  reconnect: _t("重新连接"),
};
const BAR_ID = "offline-bar";
const BAR_REFRESH_MS = 3000;   // 离线时份数会随写歌变：条开着才数（库里是一次标量读）

export interface GateUiDeps {
  dirtyCount: () => Promise<number>;
  /** 条上「看列表」= 歌库「要处理的」（gallery 0.8.8）。 */
  openList: () => void;
  /** 罩 / 闸收掉之后（把焦点还给谱）。 */
  afterRelease: () => void;
}
export function createGateUi(o: GateUiDeps): GateUi {
  let mine = -1;   // 我上一次占锁屏位时的代号
  const ownFace = () => isGateOpen() && gateGeneration() === mine;
  let barState: BarState = "hidden", barCount = -1;
  let barTimer: ReturnType<typeof setInterval> | null = null;
  async function paintCount(): Promise<void> {
    const n = await o.dirtyCount().catch((e) => { reportError(e, "log"); return 0; });
    if (barState !== "offline" || n === barCount) return;   // 数的时候网回来了 / 没变不动
    barCount = n;
    showNotice({ id: BAR_ID, level: "neutral", text: GATE_TEXT.bar(n), dismissible: false, actions: n > 0 ? [{ label: GATE_TEXT.barList, onClick: () => o.openList() }] : [] });
  }
  return {
    checking(onEscape) {
      void lockSyncGate<"skip" | null>({ title: GATE_TEXT.checking, message: "", showSpinner: true, actions: [{ label: GATE_TEXT.skip, value: "skip" }] })
        .then((v) => { if (v === "skip") onEscape(); });
      mine = gateGeneration();
    },
    blocked(reason, on) {
      void lockSyncGate<"signin" | "offline" | null>({
        title: GATE_TEXT.title, message: GATE_TEXT.reason[reason],
        actions: [{ label: GATE_TEXT.signIn, value: "signin", primary: true }, { label: GATE_TEXT.offline, value: "offline" }],
      }).then((v) => { if (v === "signin") on.signIn(); else if (v === "offline") on.offline(); });
      mine = gateGeneration();
    },
    release() {
      if (!ownFace()) return;
      unlockSyncGate();
      o.afterRelease();
    },
    foreignFaceUp: () => isGateOpen() && gateGeneration() !== mine,
    bar(state) {
      barState = state; barCount = -1;
      if (barTimer) { clearInterval(barTimer); barTimer = null; }
      if (state === "hidden") { closeNotice(BAR_ID); return; }
      if (state === "syncing") { showNotice({ id: BAR_ID, level: "neutral", text: GATE_TEXT.barSyncing, dismissible: false }); return; }
      showNotice({ id: BAR_ID, level: "neutral", text: GATE_TEXT.bar(0), dismissible: false });
      void paintCount();
      barTimer = setInterval(() => { void paintCount(); }, BAR_REFRESH_MS);
    },
  };
}
