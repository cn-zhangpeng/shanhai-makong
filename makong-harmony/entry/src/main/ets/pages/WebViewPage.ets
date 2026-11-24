import { router, promptAction } from '@kit.ArkUI'
import { BusinessError, pasteboard } from '@kit.BasicServicesKit'
import { Want } from '@kit.AbilityKit'
import { webview } from '@kit.ArkWeb'
import { AppContext } from '../common/AppContext'
import { WebRouteParams } from '../common/Routes'
import { PAPER_GRADIENT, R_MD } from '../common/Theme'
import { UrlUtils } from '../common/UrlUtils'
import { RoundIconButton } from '../components/Brand'
import { SessionItem, SessionItemFactory } from '../model/SessionItem'
import { SessionStore } from '../store/SessionStore'

function toast(message: string): void {
  promptAction.showToast({ message: message, duration: 2000 })
}

@Entry
@Component
struct WebViewPage {
  @State session: SessionItem | undefined = undefined
  @State pageTitle: string = ''
  @State currentUrl: string = ''
  @State progress: number = 0
  @State loading: boolean = true
  @State loadFailed: boolean = false
  @State errorCode: number = 0
  @State errorDetail: string = ''
  private controller: webview.WebviewController = new webview.WebviewController()
  private targetUrl: string = ''
  private store: SessionStore = SessionStore.getInstance()

  aboutToAppear(): void {
    const params = router.getParams() as WebRouteParams
    const item = params !== undefined ? this.store.get(params.id) : undefined
    if (item === undefined) {
      toast('这条收藏不存在')
      router.back()
      return
    }
    this.session = item
    this.targetUrl = item.url
    this.currentUrl = item.url
    this.pageTitle = SessionItemFactory.labelOf(item)
  }

  onBackPress(): boolean {
    try {
      if (this.controller.accessBackward()) {
        this.controller.backward()
        return true
      }
    } catch (error) {
      return false
    }
    return false
  }

  private titleText(): string {
    if (this.pageTitle.length > 0) {
      return this.pageTitle
    }
    const item = this.session
    return item !== undefined ? SessionItemFactory.labelOf(item) : '网页'
  }

  private subtitleText(): string {
    return UrlUtils.hostOf(this.currentUrl)
  }

  private handlePermission(event: OnPermissionRequestEvent): void {
    // 会控页面可能需要摄像头/麦克风，系统确认后直接授予，保证 WebRTC 可用。
    const request = event.request
    const resources = request.getAccessibleResource()
    if (resources.length === 0) {
      request.deny()
      return
    }
    try {
      request.grant(resources)
    } catch (error) {
      // 系统权限未授予等情况，拒绝网页申请，避免页面卡在等待授权。
      request.deny()
    }
  }

  private updateTitle(): void {
    // 加载失败时网页标题常退化成地址本身，这类标题不覆盖收藏名称。
    if (this.loadFailed) {
      return
    }
    try {
      const title = this.controller.getTitle()
      // 加载失败时网页标题常退化成地址本身，此类标题不覆盖收藏名称。
      if (title !== undefined && title.length > 0 && title !== this.targetUrl &&
        title !== UrlUtils.hostOf(this.targetUrl)) {
        this.pageTitle = title
      }
    } catch (error) {
      this.pageTitle = this.titleText()
    }
    try {
      const url = this.controller.getUrl()
      if (url !== undefined && url.length > 0) {
        this.currentUrl = url
      }
    } catch (error) {
      this.currentUrl = this.targetUrl
    }
  }

  private onMainFrameError(code: number, detail: string): void {
    this.loading = false
    this.progress = 100
    this.loadFailed = true
    this.errorCode = code
    this.errorDetail = detail
    // 失败页的标题仍然是收藏名，不拿地址顶替。
    const item = this.session
    if (item !== undefined) {
      this.pageTitle = SessionItemFactory.labelOf(item)
    }
  }

  private retry(): void {
    this.loadFailed = false
    this.loading = true
    this.progress = 0
    try {
      this.controller.loadUrl(this.targetUrl)
    } catch (error) {
      toast('重新加载失败')
    }
  }

  private copyLink(): void {
    const data = pasteboard.createData(pasteboard.MIMETYPE_TEXT_PLAIN, this.currentUrl)
    pasteboard.getSystemPasteboard().setData(data).then(() => {
      toast('链接已复制')
    }).catch((error: BusinessError) => {
      toast('复制失败')
    })
  }

  private openInBrowser(): void {
    const want: Want = {
      action: 'ohos.want.action.viewData',
      entities: ['entity.system.browsable'],
      uri: this.currentUrl
    }
    AppContext.get().startAbility(want).catch((error: BusinessError) => {
      toast('没有可用的浏览器')
    })
  }

  private moreMenu(): MenuElement[] {
    return [
      {
        value: '刷新',
        action: () => {
          this.retry()
        }
      },
      {
        value: '复制链接',
        action: () => {
          this.copyLink()
        }
      },
      {
        value: '在浏览器打开',
        action: () => {
          this.openInBrowser()
        }
      }
    ]
  }

  private errorTitle(): string {
    return '网页打不开'
  }

  private errorHint(): string {
    if (this.errorCode === -10) {
      return '手机系统拦截了对这个地址的访问（-10）。常见原因是明文 http 被安全策略限制，或这个地址只能在电脑本机打开。'
    }
    return '请确认手机和电脑在同一网络，并且这个地址在手机上能打开。如果是 http 明文地址，部分系统版本会拦截。'
  }

  @Builder
  Header() {
    Row({ space: 12 }) {
      RoundIconButton({
        icon: $r('app.media.ic_back'),
        onTap: () => {
          router.back()
        }
      })

      Column({ space: 2 }) {
        Text(this.titleText())
          .fontSize(15.5)
          .fontWeight(FontWeight.Medium)
          .letterSpacing(0.4)
          .fontColor($r('app.color.text_primary'))
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
        Text(this.subtitleText())
          .fontSize(10.5)
          .fontColor($r('app.color.text_tertiary'))
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
      }
      .layoutWeight(1)
      .alignItems(HorizontalAlign.Start)

      Button({ type: ButtonType.Circle, stateEffect: true }) {
        Image($r('app.media.ic_more'))
          .width(18)
          .height(18)
          .fillColor($r('app.color.text_primary'))
          .draggable(false)
      }
      .width(40)
      .height(40)
      .backgroundColor($r('app.color.surface'))
      .border({ width: 1, color: $r('app.color.border') })
      .bindMenu(this.moreMenu())
    }
    .width('100%')
    .padding({ left: 16, right: 16, top: 8, bottom: 8 })
    .backgroundColor($r('app.color.page_background'))
  }

  @Builder
  LoadingOverlay() {
    Column({ space: 12 }) {
      LoadingProgress()
        .width(34)
        .height(34)
        .color($r('app.color.brand'))
      Text('正在加载…')
        .fontSize(12)
        .letterSpacing(2)
        .fontColor($r('app.color.text_secondary'))
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .linearGradient(PAPER_GRADIENT)
  }

  @Builder
  ErrorOverlay() {
    Column({ space: 12 }) {
      Stack() {
        Image($r('app.media.ic_warning'))
          .width(34)
          .height(34)
          .fillColor($r('app.color.danger'))
          .draggable(false)
      }
      .width(74)
      .height(74)
      .backgroundColor($r('app.color.danger_soft'))
      .borderRadius(37)

      Text(this.errorTitle())
        .fontSize(19)
        .fontWeight(FontWeight.Bold)
        .letterSpacing(3)
        .fontColor($r('app.color.text_primary'))
        .margin({ top: 2 })

      Text(this.errorHint())
        .fontSize(12)
        .lineHeight(19)
        .fontColor($r('app.color.text_secondary'))
        .textAlign(TextAlign.Center)
        .padding({ left: 40, right: 40 })
        .margin({ bottom: 2 })

      if (this.errorDetail.length > 0) {
        Text('错误码 ' + this.errorCode + ' · ' + this.errorDetail)
          .fontSize(10)
          .fontColor($r('app.color.text_tertiary'))
          .textAlign(TextAlign.Center)
          .padding({ left: 36, right: 36 })
          .margin({ bottom: 8 })
      }

      Row({ space: 10 }) {
        Button({ type: ButtonType.Capsule, stateEffect: true }) {
          Text('重 试')
            .fontSize(13.5)
            .fontWeight(FontWeight.Medium)
            .letterSpacing(2)
            .fontColor('#FFF8EF')
        }
        .height(44)
        .padding({ left: 26, right: 26 })
        .backgroundColor($r('app.color.brand'))
        .onClick(() => {
          this.retry()
        })

        Button({ type: ButtonType.Capsule, stateEffect: true }) {
          Text('用浏览器打开')
            .fontSize(13)
            .letterSpacing(0.5)
            .fontColor($r('app.color.brand'))
        }
        .height(44)
        .padding({ left: 20, right: 20 })
        .backgroundColor(Color.Transparent)
        .border({ width: 1, color: $r('app.color.brand_line') })
        .onClick(() => {
          this.openInBrowser()
        })
      }
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .linearGradient(PAPER_GRADIENT)
  }

  @Builder
  PageContent() {
    Web({ src: this.targetUrl, controller: this.controller })
      .width('100%')
      .height('100%')
      .javaScriptAccess(true)
      .fileAccess(false)
      .domStorageAccess(true)
      .databaseAccess(true)
      .onlineImageAccess(true)
      .mixedMode(MixedMode.All)
      .zoomAccess(true)
      .onPageBegin((event: OnPageBeginEvent) => {
        this.loading = true
        this.loadFailed = false
        this.progress = 0
        this.currentUrl = event.url
      })
      .onProgressChange((event: OnProgressChangeEvent) => {
        this.progress = event.newProgress
        if (event.newProgress >= 100) {
          this.loading = false
        }
      })
      .onPageEnd((event: OnPageEndEvent) => {
        this.loading = false
        this.progress = 100
        this.currentUrl = event.url
        this.updateTitle()
      })
      .onErrorReceive((event: OnErrorReceiveEvent) => {
        if (!event.request.isMainFrame()) {
          return
        }
        this.onMainFrameError(event.error.getErrorCode(), event.error.getErrorInfo())
      })
      .onHttpErrorReceive((event: OnHttpErrorReceiveEvent) => {
        if (!event.request.isMainFrame()) {
          return
        }
        const code = event.response.getResponseCode()
        this.onMainFrameError(code * -1, '服务器返回 HTTP ' + code)
      })
      .onPermissionRequest((event: OnPermissionRequestEvent) => {
        this.handlePermission(event)
      })
  }

  build() {
    Column() {
      this.Header()

      // 纸色发丝分隔，让浏览区和页头有层次
      Divider()
        .color($r('app.color.divider'))

      Stack({ alignContent: Alignment.Top }) {
        // Web 组件始终保留挂载，加载失败时用覆盖层盖住，避免控制器被回收后无法重试。
        if (this.targetUrl.length > 0) {
          this.PageContent()
        }

        if (this.loading && !this.loadFailed) {
          Column() {
            Progress({ value: this.progress, total: 100, type: ProgressType.Linear })
              .width('100%')
              .height(2)
              .color($r('app.color.brand'))
              .backgroundColor($r('app.color.surface_alt'))
          }
          .width('100%')
          .height('100%')
          .justifyContent(FlexAlign.Start)

          if (this.progress === 0) {
            this.LoadingOverlay()
          }
        }

        if (this.loadFailed) {
          this.ErrorOverlay()
        }
      }
      .layoutWeight(1)
      .width('100%')
    }
    .width('100%')
    .height('100%')
    .backgroundColor($r('app.color.page_background'))
  }
}
