import { createNavStack } from "nsh/base";

export type Route =
  | { name: "home" }
  | { name: "edit"; id?: string; url?: string; title?: string }
  | { name: "web"; id: string };

/** 三页结构：收藏列表 → 添加 / 编辑 → 内嵌网页（原生栈，返回键交给系统）。 */
export const nav = createNavStack<Route>([{ name: "home" }]);

export function openWeb(id: string): void {
  nav.push({ name: "web", id });
}

export function openEdit(id?: string, url?: string, title?: string): void {
  nav.push({ name: "edit", id, url, title });
}
