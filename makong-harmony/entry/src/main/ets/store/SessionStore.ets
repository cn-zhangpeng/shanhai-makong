import { BusinessError } from '@kit.BasicServicesKit'
import { preferences } from '@kit.ArkData'
import { AppContext } from '../common/AppContext'
import { SessionItem } from '../model/SessionItem'

const STORE_NAME: string = 'makong_sessions'
const KEY_ITEMS: string = 'items'
const KEY_LAST_ID: string = 'last_session_id'
const KEY_AUTO_RESUME: string = 'auto_resume'

/**
 * 会话持久化：Preferences 中存一个 JSON 数组，数据量很小，无需关系型数据库。
 */
export class SessionStore {
  private static instance: SessionStore | undefined = undefined
  private prefs: preferences.Preferences | undefined = undefined
  private items: SessionItem[] = []
  private loaded: boolean = false

  static getInstance(): SessionStore {
    if (SessionStore.instance === undefined) {
      SessionStore.instance = new SessionStore()
    }
    return SessionStore.instance
  }

  private getPreferences(): preferences.Preferences {
    if (this.prefs === undefined) {
      this.prefs = preferences.getPreferencesSync(AppContext.get(), { name: STORE_NAME })
    }
    return this.prefs
  }

  private load(): void {
    if (this.loaded) {
      return
    }
    this.loaded = true
    try {
      const raw = this.getPreferences().getSync(KEY_ITEMS, '[]') as string
      const parsed = JSON.parse(raw) as SessionItem[]
      if (parsed !== null && parsed !== undefined) {
        this.items = parsed
      }
    } catch (error) {
      this.items = []
      console.error('makong: 读取本地会话失败')
    }
  }

  private sortItems(): void {
    this.items.sort((left: SessionItem, right: SessionItem) => {
      const leftTime = left.lastOpenAt > 0 ? left.lastOpenAt : left.updatedAt
      const rightTime = right.lastOpenAt > 0 ? right.lastOpenAt : right.updatedAt
      return rightTime - leftTime
    })
  }

  private persist(): void {
    const prefs = this.getPreferences()
    prefs.putSync(KEY_ITEMS, JSON.stringify(this.items))
    this.flush(prefs)
  }

  private flush(prefs: preferences.Preferences): void {
    prefs.flush().catch((error: BusinessError) => {
      console.error('makong: 写入本地会话失败, code=' + error.code)
    })
  }

  getAll(): SessionItem[] {
    this.load()
    this.sortItems()
    // 返回副本，保证赋值给 @State 时引用变化，从而触发界面刷新。
    return this.items.slice()
  }

  get(id: string): SessionItem | undefined {
    this.load()
    for (const item of this.items) {
      if (item.id === id) {
        return item
      }
    }
    return undefined
  }

  upsert(item: SessionItem): void {
    this.load()
    let found = false
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].id === item.id) {
        this.items[i] = item
        found = true
        break
      }
    }
    if (!found) {
      this.items.push(item)
    }
    this.persist()
  }

  remove(id: string): void {
    this.load()
    const next: SessionItem[] = []
    for (const item of this.items) {
      if (item.id !== id) {
        next.push(item)
      }
    }
    this.items = next
    if (this.getLastSessionId() === id) {
      this.setLastSessionId('')
    }
    this.persist()
  }

  clear(): void {
    this.load()
    this.items = []
    this.persist()
    this.setLastSessionId('')
  }

  /**
   * 记录一次打开：更新 lastOpenAt 与「上次会话」指针。
   */
  markOpened(id: string): void {
    this.load()
    const now = Date.now()
    for (const item of this.items) {
      if (item.id === id) {
        item.lastOpenAt = now
        break
      }
    }
    this.setLastSessionId(id)
    this.persist()
  }

  getLastSessionId(): string {
    return this.getPreferences().getSync(KEY_LAST_ID, '') as string
  }

  setLastSessionId(id: string): void {
    const prefs = this.getPreferences()
    prefs.putSync(KEY_LAST_ID, id)
    this.flush(prefs)
  }

  getLastSession(): SessionItem | undefined {
    return this.get(this.getLastSessionId())
  }

  getAutoResume(): boolean {
    return this.getPreferences().getSync(KEY_AUTO_RESUME, false) as boolean
  }

  setAutoResume(value: boolean): void {
    const prefs = this.getPreferences()
    prefs.putSync(KEY_AUTO_RESUME, value)
    this.flush(prefs)
  }
}
