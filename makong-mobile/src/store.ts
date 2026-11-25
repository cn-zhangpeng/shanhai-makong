import { signal } from "nsh";
import { Storage } from "nsh";
import { UrlUtils } from "./url";

/** 一条已保存的网页收藏。 */
export interface SessionItem {
  id: string;
  name: string;
  url: string;
  createdAt: number;
  updatedAt: number;
  lastOpenAt: number;
}

const KEY_ITEMS = "items";
const KEY_LAST = "last_session_id";
const KEY_AUTO = "auto_resume";

export const sessions = signal<SessionItem[]>([]);
export const lastSessionId = signal("");
export const autoResume = signal(false);
export const storeReady = signal(false);

let loaded = false;

function sortItems(items: SessionItem[]): SessionItem[] {
  return items.slice().sort((left, right) => {
    const lt = left.lastOpenAt > 0 ? left.lastOpenAt : left.updatedAt;
    const rt = right.lastOpenAt > 0 ? right.lastOpenAt : right.updatedAt;
    return rt - lt;
  });
}

export async function loadStore(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await Storage.getItem(KEY_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw) as SessionItem[];
      if (Array.isArray(parsed)) sessions.set(sortItems(parsed.filter((it) => it && typeof it.id === "string")));
    }
  } catch {
    sessions.set([]);
  }
  try {
    lastSessionId.set((await Storage.getItem(KEY_LAST)) ?? "");
    autoResume.set((await Storage.getItem(KEY_AUTO)) === "1");
  } catch {
    lastSessionId.set("");
    autoResume.set(false);
  }
  storeReady.set(true);
}

function persist(): void {
  Storage.setItem(KEY_ITEMS, JSON.stringify(sessions())).catch(() => {});
}

function persistLast(): void {
  Storage.setItem(KEY_LAST, lastSessionId()).catch(() => {});
}

export function getSession(id: string): SessionItem | undefined {
  for (const item of sessions()) {
    if (item.id === id) return item;
  }
  return undefined;
}

export function lastSession(): SessionItem | undefined {
  return getSession(lastSessionId());
}

export function newId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

export function createSession(name: string, url: string): SessionItem {
  const now = Date.now();
  const item: SessionItem = { id: newId(), name, url, createdAt: now, updatedAt: now, lastOpenAt: 0 };
  sessions.set(sortItems([item, ...sessions()]));
  persist();
  return item;
}

export function updateSession(id: string, name: string, url: string): SessionItem | undefined {
  let changed: SessionItem | undefined;
  const next = sessions().map((item) => {
    if (item.id !== id) return item;
    changed = { ...item, name, url, updatedAt: Date.now() };
    return changed;
  });
  sessions.set(sortItems(next));
  persist();
  return changed;
}

export function removeSession(id: string): void {
  sessions.set(sessions().filter((item) => item.id !== id));
  if (lastSessionId() === id) {
    lastSessionId.set("");
    persistLast();
  }
  persist();
}

export function clearSessions(): void {
  sessions.set([]);
  lastSessionId.set("");
  persist();
  persistLast();
}

export function markOpened(id: string): void {
  const now = Date.now();
  sessions.set(sortItems(sessions().map((item) => (item.id === id ? { ...item, lastOpenAt: now } : item))));
  lastSessionId.set(id);
  persist();
  persistLast();
}

export function setAutoResume(value: boolean): void {
  autoResume.set(value);
  Storage.setItem(KEY_AUTO, value ? "1" : "0").catch(() => {});
}

/** 列表展示名：优先用户起的名字，否则退化为域名。 */
export function labelOf(item: SessionItem): string {
  const trimmed = item.name.trim();
  return trimmed.length > 0 ? trimmed : UrlUtils.hostOf(item.url);
}

/** 卡片左侧印章里的首字。 */
export function badgeOf(item: SessionItem): string {
  const label = labelOf(item);
  return label.length > 0 ? label.substring(0, 1).toUpperCase() : "#";
}

/** 按关键词过滤（名称 / 网址）。 */
export function filterSessions(keyword: string): SessionItem[] {
  const kw = keyword.trim().toLowerCase();
  if (kw.length === 0) return sessions();
  return sessions().filter((item) => {
    return labelOf(item).toLowerCase().includes(kw) || item.url.toLowerCase().includes(kw);
  });
}

function pad(value: number): string {
  return value < 10 ? "0" + value : "" + value;
}

/** 「刚刚打开 / 12 分钟前 / 今天 18:20 / 11月25日」。 */
export function timeText(item: SessionItem): string {
  if (item.lastOpenAt <= 0) return "还没打开过";
  const ts = item.lastOpenAt;
  const diff = Date.now() - ts;
  if (diff < 60000) return "刚刚打开";
  if (diff < 3600000) return Math.floor(diff / 60000) + " 分钟前";
  const date = new Date(ts);
  const now = new Date();
  if (date.getFullYear() !== now.getFullYear()) {
    return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
  }
  if (date.getMonth() === now.getMonth() && date.getDate() === now.getDate()) {
    return "今天 " + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }
  return date.getMonth() + 1 + "月" + date.getDate() + "日";
}
