import { CARD_SHADOW, R_XL } from '../common/Theme'

/**
 * 纸面确认框：替代系统 AlertDialog，保持宣纸 × 朱砂的视觉语言。
 * 用于删除名帖、清空全部等不可逆操作。
 */
@CustomDialog
export struct ConfirmDialog {
  controller: CustomDialogController = new CustomDialogController({
    builder: ConfirmDialog()
  })
  title: string = ''
  message: string = ''
  confirmText: string = '确定'
  danger: boolean = true
  onConfirm: () => void = () => {
  }

  build() {
    Column() {
      Text(this.title)
        .fontSize(17)
        .fontWeight(FontWeight.Bold)
        .letterSpacing(1.2)
        .fontColor($r('app.color.text_primary'))

      Text(this.message)
        .fontSize(12.5)
        .lineHeight(20)
        .textAlign(TextAlign.Center)
        .fontColor($r('app.color.text_secondary'))
        .margin({ top: 10 })

      Row({ space: 10 }) {
        Button({ type: ButtonType.Capsule, stateEffect: true }) {
          Text('取 消')
            .fontSize(13.5)
            .letterSpacing(2)
            .fontColor($r('app.color.text_secondary'))
        }
        .layoutWeight(1)
        .height(44)
        .backgroundColor($r('app.color.surface_alt'))
        .onClick(() => {
          this.controller.close()
        })

        Button({ type: ButtonType.Capsule, stateEffect: true }) {
          Text(this.confirmText)
            .fontSize(13.5)
            .fontWeight(FontWeight.Medium)
            .letterSpacing(2)
            .fontColor('#FFF8EF')
        }
        .layoutWeight(1)
        .height(44)
        .backgroundColor(this.danger ? $r('app.color.danger') : $r('app.color.brand'))
        .onClick(() => {
          this.controller.close()
          this.onConfirm()
        })
      }
      .width('100%')
      .margin({ top: 20 })
    }
    .width('86%')
    .padding({ left: 20, right: 20, top: 22, bottom: 18 })
    .backgroundColor($r('app.color.surface'))
    .borderRadius(R_XL)
    .border({ width: 1, color: $r('app.color.border') })
    .shadow(CARD_SHADOW)
    .alignItems(HorizontalAlign.Center)
  }
}
