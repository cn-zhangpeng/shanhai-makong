import { SEAL_SHADOW } from '../common/Theme'

/**
 * 朱砂印章：品牌标识，方形圆角 + 白字，像盖在纸面上的印。
 * 用在首页与编辑页页头，作为「山海 · 码控」的落款。
 */
@Component
export struct SealMark {
  @Prop text: string = '码'
  @Prop side: number = 46

  build() {
    Stack() {
      Text(this.text)
        .fontSize(this.side * 0.44)
        .fontWeight(FontWeight.Bold)
        .fontColor('#FFF8EF')
    }
    .width(this.side)
    .height(this.side)
    .backgroundColor($r('app.color.brand'))
    .borderRadius(this.side * 0.24)
    .border({ width: 1, color: $r('app.color.brand_dark') })
    .shadow(SEAL_SHADOW)
  }
}

/**
 * 名帖印章：列表卡片左侧的浅朱砂方印，印上首字，替代通用圆形头像。
 * 字色与底色都淡，像宣纸上钤的小印。
 */
@Component
export struct NameSeal {
  @Prop text: string = ''
  @Prop side: number = 44

  build() {
    Stack() {
      Text(this.text)
        .fontSize(this.side * 0.4)
        .fontWeight(FontWeight.Medium)
        .fontColor($r('app.color.brand'))
    }
    .width(this.side)
    .height(this.side)
    .backgroundColor($r('app.color.brand_soft'))
    .borderRadius(this.side * 0.26)
    .border({ width: 1, color: $r('app.color.brand_line') })
  }
}

/**
 * 圆形图标按钮：纸白底 + 发丝边，图标用墨色或朱砂染色。
 */
@Component
export struct RoundIconButton {
  icon: Resource = $r('app.media.ic_add')
  tint: ResourceColor = $r('app.color.text_primary')
  bg: ResourceColor = $r('app.color.surface')
  onTap: () => void = () => {
  }

  build() {
    Button({ type: ButtonType.Circle, stateEffect: true }) {
      Image(this.icon)
        .width(18)
        .height(18)
        .fillColor(this.tint)
        .draggable(false)
    }
    .width(40)
    .height(40)
    .backgroundColor(this.bg)
    .border({ width: 1, color: $r('app.color.border') })
    .onClick(() => {
      this.onTap()
    })
  }
}

/** 细分隔线，配合纸面留白使用 */
@Component
export struct PaperDivider {
  build() {
    Divider()
      .width('100%')
      .color($r('app.color.divider'))
  }
}
