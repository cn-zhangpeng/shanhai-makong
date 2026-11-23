import { util } from '@kit.ArkTS'
import { UrlUtils } from '../common/UrlUtils'

/**
 * 一条已保存的网页会话。
 */
export interface SessionItem {
  id: string
  name: string
  url: string
  createdAt: number
  updatedAt: number
  lastOpenAt: number
}

/**
 * 会话的创建与展示辅助。
 */
export class SessionItemFactory {
  static create(name: string, url: string): SessionItem {
    const now = Date.now()
    const item: SessionItem = {
      id: util.generateRandomUUID(true),
      name: name,
      url: url,
      createdAt: now,
      updatedAt: now,
      lastOpenAt: 0
    }
    return item
  }

  /**
   * 列表展示名：优先使用用户起的名字，否则退化为主机名。
   */
  static labelOf(item: SessionItem): string {
    const trimmed = item.name.trim()
    return trimmed.length > 0 ? trimmed : UrlUtils.hostOf(item.url)
  }

  /**
   * 头像占位字符。
   */
  static badgeOf(item: SessionItem): string {
    const label = SessionItemFactory.labelOf(item)
    return label.length > 0 ? label.substring(0, 1).toUpperCase() : '#'
  }
}
