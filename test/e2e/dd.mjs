// dd.mjs —— E2E 里操作本仓的下拉框（7-T：下拉 = 界面零件库的下拉标准件，一颗按钮 + 挂在 body 上的弹层，不再是原生下拉框，playwright 的 selectOption 用不了）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。这是帮手文件，不是一份 E2E（areas.mjs HELPERS 里登记了）。
//   pick = 点开下拉、点那一项（弹层里的项是 [data-id="值"]），跟人点一样走真的点击；ddOptions = 点开读一遍所有项再收起；ddLabel = 钮面上写的字。
const css = (v) => String(v).replace(/["\\]/g, "\\$&");
/** 点开 sel 那个下拉，选值为 value 的那一项。 */
export async function pick(p, sel, value) {
  await p.locator(sel).first().click();
  const it = p.locator(`.popup-menu:not(.hidden) [data-id="${css(value)}"]`).last();
  await it.waitFor({ state: "visible", timeout: 3000 });
  await it.click();
  await p.waitForTimeout(60);
}
/** sel 那个下拉的所有项（值 + 写的字；组标题不算）：点开读完按 Esc 收起。 */
export async function ddOptions(p, sel) {
  await p.locator(sel).first().click();
  await p.locator(".popup-menu:not(.hidden) [data-id]").first().waitFor({ state: "visible", timeout: 3000 });
  const out = await p.$$eval(".popup-menu:not(.hidden) [data-id]", (bs) => bs.filter((b) => !b.dataset.id.startsWith("__group:")).map((b) => ({ value: b.dataset.id, label: b.textContent.trim() })));
  await p.keyboard.press("Escape"); await p.waitForTimeout(60);
  return out;
}
/** 钮面上写的字（= 现在选着的那一项的名字）。 */
export const ddLabel = (p, sel) => p.$eval(sel, (b) => b.querySelector(".select-field-label")?.textContent ?? "");
