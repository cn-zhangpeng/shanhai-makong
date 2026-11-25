import { signal } from "nsh";

/** 轻量吐司：纸面深色胶囊，两秒后淡出。 */
export const toastText = signal("");
export const toastVisible = signal(false);

let timer: ReturnType<typeof setTimeout> | null = null;

export function toast(message: string, duration = 2000): void {
  toastText.set(message);
  toastVisible.set(true);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    toastVisible.set(false);
    timer = null;
  }, duration);
}
