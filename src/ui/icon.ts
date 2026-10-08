// icon.ts —— 图标 = 指向内联 sprite 的 <use>（抄 WeebPaint / WXHW src/ui/icon.ts）。created 2026-10-08 by Claude Fable 5.1
//   图标名 = 共享库（20260708 SVG Icons）的 symbol id（assets/icons.svg 由 extract-icons.py 取、scripts/inline-sprites.py 贴进 index.html）。
export function iconHtml(name: string, opts: { size?: number; cls?: string } = {}): string {
  const { size, cls } = opts;
  const attrs = ['viewBox="0 0 24 24"', `class="ico${cls ? ` ${cls}` : ""}"`, size ? `width="${size}" height="${size}"` : "", 'aria-hidden="true"'].filter(Boolean).join(" ");
  return `<svg ${attrs}><use href="#${name}"/></svg>`;
}
