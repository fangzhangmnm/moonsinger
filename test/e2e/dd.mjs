// dd.mjs —— E2E 里操作本仓的下拉框（7-T：下拉 = 界面零件库的下拉标准件，一颗按钮 + 挂在 body 上的弹层，不再是原生下拉框，playwright 的 selectOption 用不了）。
//   created 2026-11-12 by Claude Opus 5.5（MoonSinger小弟）。这是帮手文件，不是一份 E2E（areas.mjs HELPERS 里登记了）。
//   pick = 点开下拉、点那一项（弹层里的项是 [data-id="值"]），跟人点一样走真的点击；ddOptions = 点开读一遍所有项再收起（closeList 等它真收了）；ddLabel = 钮面上写的字。
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
  await closeList(p);
  return out;
}
/** 按 Esc 收起开着的列表，等它真收了再回。库的弹层把键盘监听放在 setTimeout(0) 里挂（防止打开那一下把自己关掉），
 *  开完立刻按的 Esc 可能赶在监听挂上之前、谁都不接——人手按不了这么快，测试里收不掉就再按一次（header-panel 2026-11-12 撞上过）。 */
export async function closeList(p) {
  const open = () => p.evaluate(() => [...document.querySelectorAll(".popup-menu")].some((m) => !m.classList.contains("hidden") && m.getBoundingClientRect().width > 0));
  //   按一下就等它真收了再看要不要再按（收的那几帧还在版面里）：多按的一下没有列表可收 = 落到面板外壳上、把整张面板关了（2026-11-13 设置 / 页面设置搬到壳上之后撞上；人连按两下 Esc 本来就是先收列表再关面板）
  //   第一下之前也等一会：库的列表开了之后 setTimeout(0) 才挂键盘监听，赶在它前面的 Esc 列表收不到、落到面板外壳上把整张面板关了（2026-11-13 机器忙时 only1 撞上；人手按不了这么快）
  if (await open()) await p.waitForTimeout(50);
  for (let i = 0; i < 5 && (await open()); i++) {
    await p.keyboard.press("Escape");
    for (let k = 0; k < 8 && (await open()); k++) await p.waitForTimeout(40 + 20 * i);
  }
  if (await open()) throw new Error("dd.mjs closeList: list still open after Escape ×5");
}
/** 钮面上写的字（= 现在选着的那一项的名字）。 */
export const ddLabel = (p, sel) => p.$eval(sel, (b) => b.querySelector(".select-field-label")?.textContent ?? "");
/** 分页面板（设置 / 页面设置，7-C）里的下拉：它在哪一页（.set-page[data-page]）没露着就先点那一页的页签，再选。 */
export async function pickOnPage(p, sel, value) {
  const pg = await p.$eval(sel, (b) => { const page = b.closest(".set-page"); return page && page.hidden ? page.dataset.page : null; });
  if (pg) { await p.click(`[data-tab="${css(pg)}"]`); await p.waitForTimeout(60); }
  await pick(p, sel, value);
}
/** 下拉现在的值。 */
export const ddValue = (p, sel) => p.$eval(sel, (b) => b.value);
