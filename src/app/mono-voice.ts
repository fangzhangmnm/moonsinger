// mono-voice.ts —— 单声乐器试听的「后按的顶掉前面的」（像单音合成器：last-note priority + 松开回到前一个）。纯函数。
//   created 2026-11-09 by Claude Fable 5.1。user 11-09：「两个键同时按有一个不认 即兴 小月相…很难受」→ AI 提「单声乐器在即兴时的标准做法：后按的顶掉前面的（像单音合成器），
//   松开后按的、前面那个还按着就回到它」→ user「可以」。
//   栈 = 还按着的键按先后排，最后一个在响。按下：前面在响的都停（只停声，不出栈——松手时要回去）；松开：出栈，栈顶还有 = 重新响它。
//   只管「谁在响」；什么音高、怎么出声归宿主（main.ts sound）。写谱那层的 50 ms 护栏（chords.ts monoClash）和这里无关、没动。
export interface MonoHeld<P> { id: string; p: P }
/** 按下 id（音 p）：返回新栈 + 要停声的那些 id（前面在响的）。同一个 id 再按 = 挪到栈顶。 */
export function monoDown<P>(stack: readonly MonoHeld<P>[], id: string, p: P): { stack: MonoHeld<P>[]; silence: string[] } {
  const rest = stack.filter((h) => h.id !== id);
  return { stack: [...rest, { id, p }], silence: rest.map((h) => h.id) };
}
/** 松开 id：返回新栈 + 要回到的那个（松的是正在响的那个、前面还有按着的 = 回到前一个；松的是被顶掉的 = 没有要回的）。 */
export function monoUp<P>(stack: readonly MonoHeld<P>[], id: string): { stack: MonoHeld<P>[]; back: MonoHeld<P> | null } {
  const i = stack.findIndex((h) => h.id === id);
  if (i < 0) return { stack: [...stack], back: null };
  const next = stack.filter((h) => h.id !== id);
  const wasTop = i === stack.length - 1;
  return { stack: next, back: wasTop && next.length ? next[next.length - 1]! : null };
}
