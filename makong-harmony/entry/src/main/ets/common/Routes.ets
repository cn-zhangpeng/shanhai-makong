/**
 * 页面路由参数定义。
 */

/** 打开内嵌网页页：会话 id。 */
export interface WebRouteParams {
  id: string
}

/** 新增 / 编辑会话页：有 id 表示编辑，否则为新增。 */
export interface EditRouteParams {
  id?: string
  url?: string
  name?: string
}
