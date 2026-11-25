import { router, promptAction } from '@kit.ArkUI'
import { BusinessError } from '@kit.BasicServicesKit'
import { scanBarcode, scanCore } from '@kit.ScanKit'
import { AppContext } from '../common/AppContext'
import { EditRouteParams } from '../common/Routes'
import { CARD_SHADOW, PAD, PAPER_GRADIENT, R_LG, R_MD, R_SM, SEAL_SHADOW } from '../common/Theme'
import { UrlUtils } from '../common/UrlUtils'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { GroupNameDialog } from '../components/GroupNameDialog'
import { RoundIconButton } from '../components/Brand'
import { GroupItem, SessionItem, SessionItemFactory } from '../model/SessionItem'
import { SessionStore } from '../store/SessionStore'

function toast(message: string): void {
  promptAction.showToast({ message: message, duration: 2000 })
}

@Entry
@Component
struct EditPage {
  @State nameInput: string = ''
  @State urlInput: string = ''
  @State isEditing: boolean = false
  @State confirmTitle: string = ''
  @State confirmMessage: string = ''
  @State groupId: string = ''
  @State groups: GroupItem[] = []
  @State groupDialogTitle: string = '新建分组'
  @State groupDialogInitial: string = ''
  private sessionId: string = ''
  private store: SessionStore = SessionStore.getInstance()
  private pendingGroupName: (name: string) => void = () => {
  }
  private pendingAction: () => void = () => {
  }
  private groupNameCtrl: CustomDialogController = new CustomDialogController({
    builder: GroupNameDialog({
      title: this.groupDialogTitle,
      initial: this.groupDialogInitial,
      onSubmit: (name: string) => {
        this.pendingGroupName(name)
      }
    }),
    autoCancel: true,
    customStyle: true,
    alignment: DialogAlignment.Center
  })
  private confirmCtrl: CustomDialogController = new CustomDialogController({
    builder: ConfirmDialog({
      title: this.confirmTitle,
      message: this.confirmMessage,
      confirmText: '删 除',
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
    this.groups = this.store.getGroups()
    const params = router.getParams() as EditRouteParams
    if (params === undefined) {
      return
    }
    if (params.id !== undefined && params.id.length > 0) {
      const item = this.store.get(params.id)
      if (item !== undefined) {
        this.sessionId = item.id
        this.nameInput = item.name
        this.urlInput = item.url
        this.groupId = item.groupId ?? ''
        this.isEditing = true
        return
      }
    }
    if (params.url !== undefined) {
      this.urlInput = params.url
    }
    if (params.name !== undefined) {
      this.nameInput = params.name
    }
    if (params.groupId !== undefined && this.store.getGroup(params.groupId) !== undefined) {
      this.groupId = params.groupId
    }
  }

  private scanToFill(): void {
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
        this.urlInput = url
        if (this.nameInput.trim().length === 0) {
          this.nameInput = UrlUtils.hostOf(url)
        }
        toast('已识别网址')
      })
      .catch((error: BusinessError) => {
        if (error.code === 1000500002) {
          return
        }
        toast('扫码失败：' + error.message)
      })
  }

  private openCreateGroup(): void {
    this.groupDialogTitle = '新建分组'
    this.groupDialogInitial = ''
    this.pendingGroupName = (name: string) => {
      const created = this.store.addGroup(name)
      if (created === undefined) {
        toast('分组已存在，或名称不能为空')
        return
      }
      this.groups = this.store.getGroups()
      this.groupId = created.id
      toast('已创建分组')
    }
    this.groupNameCtrl.open()
  }

  private save(): void {
    const url = UrlUtils.normalize(this.urlInput)
    if (!UrlUtils.isWebUrl(url)) {
      toast('请输入 http:// 或 https:// 开头的网址')
      return
    }
    let name = this.nameInput.trim()
    if (name.length === 0) {
      name = UrlUtils.hostOf(url)
    }
    if (this.isEditing) {
      const item = this.store.get(this.sessionId)
      if (item === undefined) {
        toast('这条收藏已不存在')
        return
      }
      item.name = name
      item.url = url
      item.groupId = this.groupId
      item.updatedAt = Date.now()
      this.store.upsert(item)
    } else {
      this.store.upsert(SessionItemFactory.create(name, url, this.groupId))
    }
    toast('已保存')
    router.back()
  }

  private confirmDelete(): void {
    const draft: SessionItem = {
      id: this.sessionId,
      name: this.nameInput,
      url: this.urlInput,
      createdAt: 0,
      updatedAt: 0,
      lastOpenAt: 0,
      groupId: this.groupId
    }
    this.confirmTitle = '删除收藏'
    this.confirmMessage = '确定要删除「' + SessionItemFactory.labelOf(draft) + '」吗？'
    this.pendingAction = () => {
      this.store.remove(this.sessionId)
      toast('已删除')
      router.back()
    }
    this.confirmCtrl.open()
  }

  /** 页头：返回圆钮 + 山海小字 + 墨色标题 */
  @Builder
  Header() {
    Row({ space: 12 }) {
      RoundIconButton({
        icon: $r('app.media.ic_back'),
        onTap: () => {
          router.back()
        }
      })

      Column({ space: 3 }) {
        Text('SHANHAI · 码 控')
          .fontSize(8.5)
          .fontWeight(FontWeight.Medium)
          .letterSpacing(2.4)
          .fontColor($r('app.color.gold'))
        Text(this.isEditing ? '编辑收藏' : '添加收藏')
          .fontSize(22)
          .fontWeight(FontWeight.Bold)
          .letterSpacing(1.5)
          .fontColor($r('app.color.text_primary'))
      }
      .layoutWeight(1)
      .alignItems(HorizontalAlign.Start)
    }
    .width('100%')
    .padding({ left: PAD, right: PAD, top: 14, bottom: 10 })
  }

  /** 字段标签：小字、疏排、淡墨 */
  @Builder
  FieldLabel(text: string) {
    Text(text)
      .fontSize(10.5)
      .fontWeight(FontWeight.Medium)
      .letterSpacing(2.2)
      .fontColor($r('app.color.text_tertiary'))
  }

  @Builder
  GroupChip(label: string, key: string, onTap: () => void) {
    Row() {
      Text(label)
        .fontSize(12.5)
        .fontWeight(this.groupId === key ? FontWeight.Medium : FontWeight.Normal)
        .fontColor(this.groupId === key ? $r('app.color.brand') : $r('app.color.text_secondary'))
        .maxLines(1)
    }
    .height(32)
    .padding({ left: 14, right: 14 })
    .borderRadius(16)
    .backgroundColor(this.groupId === key ? $r('app.color.brand_soft') : $r('app.color.surface'))
    .border({
      width: 1,
      color: this.groupId === key ? $r('app.color.brand_line') : $r('app.color.border')
    })
    .onClick(onTap)
  }

  @Builder
  FormCard() {
    Column() {
      Column({ space: 8 }) {
        this.FieldLabel('名 称')
        TextInput({ text: this.nameInput, placeholder: '例如：会控台 / dsh' })
          .width('100%')
          .height(46)
          .padding({ left: 12, right: 12 })
          .fontSize(15)
          .fontColor($r('app.color.text_primary'))
          .placeholderColor($r('app.color.text_tertiary'))
          .placeholderFont({ size: 13.5 })
          .caretColor($r('app.color.brand'))
          .backgroundColor($r('app.color.surface_alt'))
          .borderRadius(R_SM)
          .maxLength(60)
          .onChange((value: string) => {
            this.nameInput = value
          })
      }
      .width('100%')
      .alignItems(HorizontalAlign.Start)

      Divider()
        .color($r('app.color.divider'))
        .margin({ top: 16, bottom: 16 })

      Column({ space: 8 }) {
        Row() {
          this.FieldLabel('网 址')
          Blank()
          Row({ space: 4 }) {
            Image($r('app.media.ic_scan'))
              .width(13)
              .height(13)
              .fillColor($r('app.color.brand'))
              .draggable(false)
            Text('扫一扫')
              .fontSize(12)
              .fontColor($r('app.color.brand'))
          }
          .padding({ left: 8, right: 2, top: 2, bottom: 2 })
          .onClick(() => {
            this.scanToFill()
          })
        }
        .width('100%')

        TextInput({ text: this.urlInput, placeholder: 'https://192.168.1.9:3081/' })
          .width('100%')
          .height(46)
          .padding({ left: 12, right: 12 })
          .fontSize(14)
          .fontColor($r('app.color.text_primary'))
          .placeholderColor($r('app.color.text_tertiary'))
          .placeholderFont({ size: 13.5 })
          .caretColor($r('app.color.brand'))
          .backgroundColor($r('app.color.surface_alt'))
          .borderRadius(R_SM)
          .type(InputType.URL)
          .maxLength(2048)
          .onChange((value: string) => {
            this.urlInput = value
          })
      }
      .width('100%')
      .alignItems(HorizontalAlign.Start)

      Divider()
        .color($r('app.color.divider'))
        .margin({ top: 16, bottom: 16 })

      Column({ space: 8 }) {
        Row() {
          this.FieldLabel('分 组')
          Blank()
          Text('长按首页分组可重命名或删除')
            .fontSize(10)
            .fontColor($r('app.color.text_tertiary'))
        }
        .width('100%')

        Scroll() {
          Row({ space: 8 }) {
            this.GroupChip('未分组', '', () => {
              this.groupId = ''
            })
            ForEach(this.groups, (group: GroupItem) => {
              this.GroupChip(group.name, group.id, () => {
                this.groupId = group.id
              })
            }, (group: GroupItem) => group.id + '-' + group.name)
            this.GroupChip('＋ 新建', '__new__', () => {
              this.openCreateGroup()
            })
          }
        }
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
        .align(Alignment.Start)
        .width('100%')
        .height(38)
      }
      .width('100%')
      .alignItems(HorizontalAlign.Start)
    }
    .width('100%')
    .padding(18)
    .backgroundColor($r('app.color.surface'))
    .borderRadius(R_LG)
    .border({ width: 1, color: $r('app.color.border') })
    .shadow(CARD_SHADOW)
    .alignItems(HorizontalAlign.Start)
  }

  @Builder
  HintCard() {
    Row({ space: 10 }) {
      Image($r('app.media.ic_shanhai'))
        .width(20)
        .height(20)
        .fillColor($r('app.color.gold'))
        .draggable(false)
        .margin({ top: 1 })
      Column({ space: 4 }) {
        Text('怎么获取网址')
          .fontSize(12.5)
          .fontWeight(FontWeight.Medium)
          .fontColor($r('app.color.text_primary'))
        Text('在电脑上打开会控页，把地址栏里的链接生成二维码扫进来即可；内网 http 地址也能保存，用电脑上的二维码工具生成就行。')
          .fontSize(11.5)
          .lineHeight(18)
          .fontColor($r('app.color.text_secondary'))
      }
      .layoutWeight(1)
      .alignItems(HorizontalAlign.Start)
    }
    .width('100%')
    .padding(14)
    .backgroundColor($r('app.color.surface_alt'))
    .borderRadius(R_MD)
    .alignItems(VerticalAlign.Top)
  }

  build() {
    Column() {
      this.Header()

      Scroll() {
        Column({ space: 14 }) {
          this.FormCard()
          this.HintCard()

          Button({ type: ButtonType.Capsule, stateEffect: true }) {
            Text('保 存')
              .fontSize(14.5)
              .fontWeight(FontWeight.Medium)
              .letterSpacing(4)
              .fontColor('#FFF8EF')
          }
          .width('100%')
          .height(50)
          .margin({ top: 8 })
          .backgroundColor($r('app.color.brand'))
          .shadow(SEAL_SHADOW)
          .onClick(() => {
            this.save()
          })

          if (this.isEditing) {
            Button('删除')
              .type(ButtonType.Capsule)
              .width('100%')
              .height(44)
              .fontSize(13)
              .fontColor($r('app.color.danger'))
              .backgroundColor(Color.Transparent)
              .onClick(() => {
                this.confirmDelete()
              })
          }

          Text('收藏只保存在这台机器上')
            .fontSize(10.5)
            .fontColor($r('app.color.text_tertiary'))
            .width('100%')
            .textAlign(TextAlign.Center)
            .margin({ top: 6 })
        }
        .width('100%')
        .padding({ left: 18, right: 18, top: 4, bottom: 28 })
        .alignItems(HorizontalAlign.Start)
      }
      .layoutWeight(1)
      .width('100%')
      .scrollBar(BarState.Off)
      .edgeEffect(EdgeEffect.Spring)
      .align(Alignment.Top)
    }
    .width('100%')
    .height('100%')
    .linearGradient(PAPER_GRADIENT)
  }
}
