import { util } from '@kit.ArkTS'
import { UrlUtils } from '../common/UrlUtils'

/**
 * 一条已保存的网页收藏。
 * groupId 为空 / 缺省表示「未分组」，兼容旧数据。
 */
export interface SessionItem {
  id: string
  name: string
  url: string
  createdAt: number
  updatedAt: number
  lastOpenAt: number
  groupId?: string
}

/** 一个收藏分组（单层，不支持嵌套）。 */
export interface GroupItem {
  id: string
  name: string
  order: number
}

/**
 * 会话的创建与展示辅助。
 */
export class SessionItemFactory {
  static create(name: string, url: string, groupId: string = ''): SessionItem {
    const now = Date.now()
    const item: SessionItem = {
      id: util.generateRandomUUID(true),
      name: name,
      url: url,
      createdAt: now,
      updatedAt: now,
      lastOpenAt: 0,
      groupId: groupId
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

export class GroupItemFactory {
  static create(name: string, order: number): GroupItem {
    const group: GroupItem = {
      id: util.generateRandomUUID(true),
      name: name,
      order: order
    }
    return group
  }
}
