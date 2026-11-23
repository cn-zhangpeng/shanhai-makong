import { common } from '@kit.AbilityKit'

/**
 * 全局持有 UIAbilityContext，供 Preferences、Scan Kit、startAbility 等接口使用。
 */
export class AppContext {
  private static abilityContext: common.UIAbilityContext | undefined = undefined

  static set(context: common.UIAbilityContext): void {
    AppContext.abilityContext = context
  }

  static get(): common.UIAbilityContext {
    if (AppContext.abilityContext === undefined) {
      throw new Error('AppContext 尚未初始化')
    }
    return AppContext.abilityContext
  }
}
