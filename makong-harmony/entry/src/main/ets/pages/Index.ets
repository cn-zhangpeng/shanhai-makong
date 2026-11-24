import { router, promptAction } from '@kit.ArkUI'
import { BusinessError } from '@kit.BasicServicesKit'
import { Want } from '@kit.AbilityKit'
import { scanBarcode, scanCore } from '@kit.ScanKit'
import { AppContext } from '../common/AppContext'
import { EditRouteParams, WebRouteParams } from '../common/Routes'
import {
  CARD_GAP,
  CARD_SHADOW,
  FLOAT_SHADOW,
  HEAD_TOP,
  INK_GRADIENT,
  PAD,
  PAPER_GRADIENT,
  R_LG,
  R_MD,
  SEAL_SHADOW
} from '../common/Theme'
import { UrlUtils } from '../common/UrlUtils'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NameSeal, RoundIconButton, SealMark } from '../components/Brand'
import { SessionItem, SessionItemFactory } from '../model/SessionItem'
import { SessionStore } from '../store/SessionStore'

function toast(message: string): void {
  promptAction.showToast({ message: message, duration: 2000 })
}

@Entry
@Component
struct Index {
  @State sessions: SessionItem[] = []
  @State keyword: string = ''
  @State autoResume: boolean = false
  @State showSettings: boolean = false
  @State resumeItem: SessionItem | undefined = undefined
  @State confirmTitle: string = ''
  @State confirmMessage: string = ''
  @State confirmActionText: string = '删 除'
  private store: SessionStore = SessionStore.getInstance()
  private autoResumeDone: boolean = false
  private pendingAction: () => void = () => {
  }
  private confirmCtrl: CustomDialogController = new CustomDialogController({
    builder: ConfirmDialog({
      title: this.confirmTitle,
      message: this.confirmMessage,
      confirmText: this.confirmActionText,
      danger: true,
      onConfirm: () => {
        this.pendingAction()
      }
    }),
    autoCancel: true,
    customStyle: true,
    alignment: DialogAlignment.Center
  })

  aboutToAppear(): void {
    this.reload()
    this.autoResume = this.store.getAutoResume()
  }

  onPageShow(): void {
    this.reload()
    this.autoResume = this.store.getAutoResume()
    // 冷启动后自动进入上次会话，只执行一次，避免从网页返回时反复跳转。
    if (this.autoResume && !this.autoResumeDone) {
      this.autoResumeDone = true
      const last = this.store.getLastSession()
      if (last !== undefined) {
        this.openSession(last)
      }
    }
  }

  private reload(): void {
    this.sessions = this.store.getAll()
    this.resumeItem = this.store.getLastSession()
  }

  private hasKeyword(): boolean {
    return this.keyword.trim().length > 0
  }

  private filtered(): SessionItem[] {
    const kw = this.keyword.trim().toLowerCase()
    if (kw.length === 0) {
      return this.sessions
    }
    const result: SessionItem[] = []
    for (const item of this.sessions) {
      const label = SessionItemFactory.labelOf(item).toLowerCase()
      if (label.includes(kw) || item.url.toLowerCase().includes(kw)) {
        result.push(item)
      }
    }
    return result
  }

  private resumeLabel(): string {
    const item = this.resumeItem
    return item !== undefined ? SessionItemFactory.labelOf(item) : ''
  }

  private resumeHost(): string {
    const item = this.resumeItem
    return item !== undefined ? UrlUtils.hostOf(item.url) : ''
  }

  private badgeOf(item: SessionItem): string {
    return SessionItemFactory.badgeOf(item)
  }

  private timeText(item: SessionItem): string {
    if (item.lastOpenAt <= 0) {
      return '还没打开过'
    }
    const ts = item.lastOpenAt
    const diff = Date.now() - ts
    if (diff < 60000) {
      return '刚刚打开'
    }
    if (diff < 3600000) {
      return Math.floor(diff / 60000) + ' 分钟前'
    }
    const date = new Date(ts)
    const now = new Date()
    const pad = (value: number): string => {
      return value < 10 ? '0' + value : '' + value
    }
    if (date.getFullYear() !== now.getFullYear()) {
      return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate()
    }
    const sameDay = date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
    if (sameDay) {
      return '今天 ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
    }
    return (date.getMonth() + 1) + '月' + date.getDate() + '日'
  }

  private openSession(item: SessionItem): void {
    this.store.markOpened(item.id)
    const params: WebRouteParams = { id: item.id }
    router.pushUrl({ url: 'pages/WebViewPage', params: params }).catch((error: BusinessError) => {
      toast('页面跳转失败：' + error.message)
    })
  }

  private resumeSession(): void {
    const item = this.resumeItem
    if (item !== undefined) {
      this.openSession(item)
    }
  }

  private gotoEdit(params: EditRouteParams): void {
    router.pushUrl({ url: 'pages/EditPage', params: params }).catch((error: BusinessError) => {
      toast('页面跳转失败：' + error.message)
    })
  }

  private createSession(): void {
    const params: EditRouteParams = {}
    this.gotoEdit(params)
  }

  private editSession(item: SessionItem): void {
    const params: EditRouteParams = { id: item.id }
    this.gotoEdit(params)
  }

  private scanToAdd(): void {
    const options: scanBarcode.ScanOptions = {
      scanTypes: [scanCore.ScanType.ALL],
      enableMultiMode: false,
      enableAlbum: true
    }
    scanBarcode.startScanForResult(AppContext.get(), options)
      .then((result: scanBarcode.ScanResult) => {
        const url = UrlUtils.normalize(result.originalValue)
        if (!UrlUtils.isWebUrl(url)) {
          toast('识别到的内容不是网址')
          return
        }
        const params: EditRouteParams = { url: url, name: UrlUtils.hostOf(url) }
        this.gotoEdit(params)
      })
      .catch((error: BusinessError) => {
        // 1000500002 表示用户主动取消扫码，无需提示。
        if (error.code === 1000500002) {
          return
        }
        toast('扫码失败：' + error.message)
      })
  }

  private openInBrowser(item: SessionItem): void {
    const want: Want = {
      action: 'ohos.want.action.viewData',
      entities: ['entity.system.browsable'],
      uri: item.url
    }
    AppContext.get().startAbility(want).catch((error: BusinessError) => {
      toast('没有可用的浏览器')
    })
  }

  private askConfirm(title: string, message: string, actionText: string, action: () => void): void {
    this.confirmTitle = title
    this.confirmMessage = message
    this.confirmActionText = actionText
    this.pendingAction = action
    this.confirmCtrl.open()
  }

  private confirmDelete(item: SessionItem): void {
    this.askConfirm('删除收藏', '确定删除「' + SessionItemFactory.labelOf(item) + '」吗？', '删 除', () => {
      this.store.remove(item.id)
      this.reload()
      toast('已删除')
    })
  }

  private confirmClearAll(): void {
    this.askConfirm('清空全部收藏', '将删除本机保存的全部收藏，且无法恢复。', '清 空', () => {
      this.store.clear()
      this.reload()
      this.showSettings = false
      toast('已清空')
    })
  }

  @Builder
  CardMenu(item: SessionItem) {
    Menu() {
      MenuItem({ content: '编辑' })
        .onClick(() => {
          this.editSession(item)
        })
      MenuItem({ content: '在浏览器打开' })
        .onClick(() => {
          this.openInBrowser(item)
        })
      MenuItem({ content: '删除' })
        .contentFontColor($r('app.color.danger'))
        .onClick(() => {
          this.confirmDelete(item)
        })
    }
  }

  /** 页头：山海纹样 + 朱砂印 + 墨色标题 */
  @Builder
  Hero() {
    Stack({ alignContent: Alignment.Top }) {
      Image($r('app.media.img_ridge'))
        .width('100%')
        .height(150)
        .fillColor($r('app.color.text_primary'))
        .opacity(0.07)
        .objectFit(ImageFit.Cover)
        .draggable(false)

      Column() {
        Row({ space: 12 }) {
          SealMark({ text: '码', side: 46 })
          Column({ space: 3 }) {
            Text('SHANHAI · 码 控')
              .fontSize(9)
              .fontWeight(FontWeight.Medium)
              .letterSpacing(2.4)
              .fontColor($r('app.color.gold'))
            Text('码控')
              .fontSize(26)
              .fontWeight(FontWeight.Bold)
              .letterSpacing(2)
              .fontColor($r('app.color.text_primary'))
            Text('会控页面收藏夹')
              .fontSize(11)
              .letterSpacing(0.5)
              .fontColor($r('app.color.text_tertiary'))
          }
          .layoutWeight(1)
          .alignItems(HorizontalAlign.Start)

          RoundIconButton({
            icon: $r('app.media.ic_add'),
            onTap: () => {
              this.createSession()
            }
          })
          RoundIconButton({
            icon: $r('app.media.ic_settings'),
            onTap: () => {
              this.showSettings = true
            }
          })
        }
        .width('100%')
        .padding({ left: PAD, right: PAD, top: HEAD_TOP })

        // 山海纹样分隔：两道发丝线夹一枚山形小印
        Row({ space: 10 }) {
          Divider().layoutWeight(1).color($r('app.color.divider'))
          Image($r('app.media.ic_shanhai'))
            .width(22)
            .height(22)
            .fillColor($r('app.color.gold'))
            .opacity(0.9)
            .draggable(false)
          Divider().layoutWeight(1).color($r('app.color.divider'))
        }
        .width('100%')
        .padding({ left: 26, right: 26, top: 14, bottom: 2 })

        this.SearchBar()
      }
      .width('100%')
    }
    .width('100%')
  }

  @Builder
  SearchBar() {
    Row() {
      Search({ value: this.keyword, placeholder: '搜索名称或网址' })
        .width('100%')
        .height(44)
        .backgroundColor($r('app.color.surface'))
        .borderRadius(R_MD)
        .border({ width: 1, color: $r('app.color.border_light') })
        .placeholderColor($r('app.color.text_tertiary'))
        .placeholderFont({ size: 13 })
        .textFont({ size: 14 })
        .fontColor($r('app.color.text_primary'))
        .onChange((value: string) => {
          this.keyword = value
        })
    }
    .width('100%')
    .padding({ left: PAD, right: PAD, top: 12, bottom: 8 })
  }

  @Builder
  ResumeCard() {
    Row({ space: 12 }) {
      Column({ space: 4 }) {
        Text('上次打开')
          .fontSize(9)
          .letterSpacing(3)
          .fontColor($r('app.color.gold'))
        Text(this.resumeLabel())
          .fontSize(17)
          .fontWeight(FontWeight.Medium)
          .fontColor('#FBF8F3')
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        Text(this.resumeHost())
          .fontSize(11)
          .fontColor('rgba(251, 248, 243, 0.55)')
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
      }
      .layoutWeight(1)
      .alignItems(HorizontalAlign.Start)

      Stack() {
        Image($r('app.media.ic_chevron'))
          .width(13)
          .height(13)
          .fillColor('#FBF8F3')
          .draggable(false)
      }
      .width(34)
      .height(34)
      .borderRadius(17)
      .backgroundColor('rgba(255, 255, 255, 0.10)')
    }
    .width('100%')
    .padding(16)
    .borderRadius(R_LG)
    .linearGradient(INK_GRADIENT)
    .shadow(FLOAT_SHADOW)
    .onClick(() => {
      this.resumeSession()
    })
  }

  @Builder
  SectionHeader() {
    Row({ space: 8 }) {
      Divider()
        .vertical(true)
        .height(12)
        .strokeWidth(3)
        .color($r('app.color.brand'))
      Text('我的收藏')
        .fontSize(12)
        .fontWeight(FontWeight.Medium)
        .letterSpacing(1.5)
        .fontColor($r('app.color.text_secondary'))
      Blank()
      Text('共 ' + this.sessions.length + ' 条')
        .fontSize(10.5)
        .fontColor($r('app.color.text_tertiary'))
    }
    .width('100%')
    .padding({ left: PAD + 2, right: PAD + 2, top: 6 })
  }

  @Builder
  ListFoot() {
    Row({ space: 10 }) {
      Divider()
        .width(22)
        .color($r('app.color.border'))
      Text('收藏只保存在本机')
        .fontSize(9.5)
        .letterSpacing(2)
        .fontColor($r('app.color.text_tertiary'))
      Divider()
        .width(22)
        .color($r('app.color.border'))
    }
    .width('100%')
    .justifyContent(FlexAlign.Center)
    .padding({ top: 26, bottom: 6 })
  }

  @Builder
  SessionCard(item: SessionItem) {
    Row({ space: 12 }) {
      NameSeal({ text: this.badgeOf(item), side: 44 })

      Column({ space: 4 }) {
        Text(SessionItemFactory.labelOf(item))
          .fontSize(16)
          .fontWeight(FontWeight.Medium)
          .fontColor($r('app.color.text_primary'))
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        Text(UrlUtils.hostOf(item.url))
          .fontSize(11.5)
          .fontColor($r('app.color.text_secondary'))
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        Row({ space: 8 }) {
          Text(this.timeText(item))
            .fontSize(10.5)
            .fontColor($r('app.color.text_tertiary'))
          if (UrlUtils.isPlainHttp(item.url)) {
            Text('明文')
              .fontSize(9)
              .fontColor($r('app.color.brand'))
              .border({ width: 1, color: $r('app.color.brand_line') })
              .borderRadius(4)
              .padding({ left: 4, right: 4, top: 1, bottom: 1 })
          }
        }
      }
      .layoutWeight(1)
      .alignItems(HorizontalAlign.Start)

      Image($r('app.media.ic_chevron'))
        .width(13)
        .height(13)
        .fillColor($r('app.color.text_tertiary'))
        .opacity(0.7)
        .draggable(false)
    }
    .width('100%')
    .padding(14)
    .backgroundColor($r('app.color.surface'))
    .borderRadius(R_LG)
    .border({ width: 1, color: $r('app.color.border') })
    .shadow(CARD_SHADOW)
    .alignItems(VerticalAlign.Center)
    .onClick(() => {
      this.openSession(item)
    })
    .bindContextMenu(this.CardMenu(item), ResponseType.LongPress)
  }

  @Builder
  EmptyState() {
    Column() {
      Stack({ alignContent: Alignment.TopStart }) {
        Image($r('app.media.img_empty_art'))
          .width(228)
          .height(190)
          .fillColor($r('app.color.gold'))
          .draggable(false)
        Circle()
          .width(30)
          .height(30)
          .fill($r('app.color.brand'))
          .opacity(0.82)
          .margin({ left: 152, top: 30 })
      }

      Text('还没有收藏')
        .fontSize(18)
        .fontWeight(FontWeight.Medium)
        .letterSpacing(2)
        .fontColor($r('app.color.text_primary'))
        .margin({ top: 10 })

      Text('扫会控页上的二维码，或点右上角「＋」\n填一个网址，收藏后点开就能用。')
        .fontSize(12)
        .lineHeight(20)
        .textAlign(TextAlign.Center)
        .fontColor($r('app.color.text_secondary'))
        .margin({ top: 8 })

      Button({ type: ButtonType.Capsule, stateEffect: true }) {
        Text('扫码添加')
          .fontSize(14)
          .fontWeight(FontWeight.Medium)
          .letterSpacing(1)
          .fontColor('#FFF8EF')
      }
      .height(44)
      .padding({ left: 26, right: 26 })
      .margin({ top: 22 })
      .backgroundColor($r('app.color.brand'))
      .shadow(SEAL_SHADOW)
      .onClick(() => {
        this.scanToAdd()
      })
    }
    .width('100%')
    .layoutWeight(1)
    .justifyContent(FlexAlign.Center)
    .padding({ bottom: 70 })
  }

  @Builder
  NoResult() {
    Column({ space: 8 }) {
      Image($r('app.media.ic_shanhai'))
        .width(30)
        .height(30)
        .fillColor($r('app.color.text_tertiary'))
        .opacity(0.5)
        .draggable(false)
        .margin({ bottom: 6 })
      Text('没有找到')
        .fontSize(16)
        .fontWeight(FontWeight.Medium)
        .letterSpacing(2)
        .fontColor($r('app.color.text_primary'))
      Text('换个关键词，或扫码添加新的收藏')
        .fontSize(12)
        .fontColor($r('app.color.text_tertiary'))
    }
    .width('100%')
    .layoutWeight(1)
    .justifyContent(FlexAlign.Center)
    .padding({ bottom: 80 })
  }

  @Builder
  Fab() {
    Button({ type: ButtonType.Capsule, stateEffect: true }) {
      Row({ space: 8 }) {
        Image($r('app.media.ic_scan'))
          .width(18)
          .height(18)
          .fillColor('#FFF8EF')
          .draggable(false)
        Text('扫码添加')
          .fontSize(13.5)
          .fontWeight(FontWeight.Medium)
          .letterSpacing(1)
          .fontColor('#FFF8EF')
      }
      .padding({ left: 16, right: 20 })
    }
    .height(50)
    .backgroundColor($r('app.color.brand'))
    .shadow({ radius: 20, color: 'rgba(168, 62, 44, 0.35)', offsetX: 0, offsetY: 8 })
    .margin({ right: PAD + 2, bottom: 22 })
    .onClick(() => {
      this.scanToAdd()
    })
  }

  @Builder
  SettingsSheet() {
    Column() {
      Column({ space: 4 }) {
        Text('SHANHAI · 设 置')
          .fontSize(8.5)
          .letterSpacing(2.4)
          .fontColor($r('app.color.gold'))
        Text('设置')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor($r('app.color.text_primary'))
      }
      .width('100%')
      .alignItems(HorizontalAlign.Start)
      .padding({ top: 4, bottom: 14 })

      Divider().color($r('app.color.divider'))

      Row({ space: 12 }) {
        Column({ space: 3 }) {
          Text('启动时打开上次的页面')
            .fontSize(15)
            .fontColor($r('app.color.text_primary'))
          Text('打开应用后直接进入上次访问的页面')
            .fontSize(10.5)
            .fontColor($r('app.color.text_tertiary'))
        }
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Start)

        Toggle({ type: ToggleType.Switch, isOn: this.autoResume })
          .selectedColor($r('app.color.brand'))
          .onChange((isOn: boolean) => {
            this.autoResume = isOn
            this.store.setAutoResume(isOn)
          })
      }
      .width('100%')
      .padding({ top: 16, bottom: 16 })

      Divider().color($r('app.color.divider'))

      Row() {
        Column({ space: 3 }) {
          Text('清空全部收藏')
            .fontSize(15)
            .fontColor($r('app.color.danger'))
          Text('删除后无法恢复')
            .fontSize(10.5)
            .fontColor($r('app.color.text_tertiary'))
        }
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Start)

        Text('清空')
          .fontSize(13)
          .fontColor($r('app.color.danger'))
      }
      .width('100%')
      .padding({ top: 14, bottom: 14 })
      .onClick(() => {
        this.confirmClearAll()
      })

      Text('收藏只保存在本机 · 长按可编辑或删除')
        .fontSize(10.5)
        .fontColor($r('app.color.text_tertiary'))
        .width('100%')
        .textAlign(TextAlign.Center)
        .margin({ top: 22, bottom: 8 })
    }
    .width('100%')
    .height('100%')
    .padding({ left: 20, right: 20, top: 12 })
    .alignItems(HorizontalAlign.Start)
    .backgroundColor($r('app.color.surface'))
  }

  build() {
    Stack({ alignContent: Alignment.BottomEnd }) {
      Column() {
        this.Hero()

        if (this.sessions.length === 0) {
          this.EmptyState()
        } else if (this.filtered().length === 0) {
          this.NoResult()
        } else {
          Column({ space: CARD_GAP }) {
            this.SectionHeader()
            List({ space: CARD_GAP }) {
              if (!this.hasKeyword() && this.resumeLabel().length > 0) {
                ListItem() {
                  this.ResumeCard()
                }
              }
              // key 带上时间戳：名称、打开时间变化时让卡片真正重建，
              // 否则 ForEach 只认 id，从网页页返回后列表仍显示旧文案。
              ForEach(this.filtered(), (item: SessionItem) => {
                ListItem() {
                  this.SessionCard(item)
                }
              }, (item: SessionItem) => item.id + '-' + item.updatedAt + '-' + item.lastOpenAt)
              if (!this.hasKeyword()) {
                ListItem() {
                  this.ListFoot()
                }
              }
            }
            .layoutWeight(1)
            .width('100%')
            .padding({ left: PAD, right: PAD, top: 4, bottom: 100 })
            .scrollBar(BarState.Off)
            .edgeEffect(EdgeEffect.Spring)
          }
          .layoutWeight(1)
          .width('100%')
        }
      }
      .width('100%')
      .height('100%')
      .linearGradient(PAPER_GRADIENT)

      // 空态已有主按钮，不再重复漂浮按钮
      if (this.sessions.length > 0) {
        this.Fab()
      }
    }
    .width('100%')
    .height('100%')
    .bindSheet($$this.showSettings, this.SettingsSheet(), {
      height: 286,
      dragBar: true,
      showClose: false,
      backgroundColor: $r('app.color.surface')
    })
  }
}
