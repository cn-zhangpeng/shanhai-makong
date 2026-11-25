import { CARD_SHADOW, R_SM, R_XL } from '../common/Theme'

/**
 * 纸面输入框：新建 / 重命名分组时使用，保持与 ConfirmDialog 一致的山海视觉。
 */
@CustomDialog
export struct GroupNameDialog {
  controller: CustomDialogController = new CustomDialogController({
    builder: GroupNameDialog()
  })
  title: string = '新建分组'
  initial: string = ''
  placeholder: string = '例如：会控 / 彩排'
  onSubmit: (name: string) => void = () => {
  }
  @State value: string = ''

  aboutToAppear(): void {
    this.value = this.initial
  }

  build() {
    Column() {
      Text(this.title)
        .fontSize(17)
        .fontWeight(FontWeight.Bold)
        .letterSpacing(1.2)
        .fontColor($r('app.color.text_primary'))

      TextInput({ text: this.value, placeholder: this.placeholder })
        .width('100%')
        .height(44)
        .margin({ top: 14 })
        .padding({ left: 12, right: 12 })
        .fontSize(14)
        .fontColor($r('app.color.text_primary'))
        .placeholderColor($r('app.color.text_tertiary'))
        .placeholderFont({ size: 13 })
        .caretColor($r('app.color.brand'))
        .backgroundColor($r('app.color.surface_alt'))
        .borderRadius(R_SM)
        .maxLength(16)
        .onChange((value: string) => {
          this.value = value
        })

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
          Text('确 定')
            .fontSize(13.5)
            .fontWeight(FontWeight.Medium)
            .letterSpacing(2)
            .fontColor('#FFF8EF')
        }
        .layoutWeight(1)
        .height(44)
        .backgroundColor($r('app.color.brand'))
        .enabled(this.value.trim().length > 0)
        .opacity(this.value.trim().length > 0 ? 1 : 0.45)
        .onClick(() => {
          const name = this.value.trim()
          if (name.length === 0) {
            return
          }
          this.controller.close()
          this.onSubmit(name)
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
