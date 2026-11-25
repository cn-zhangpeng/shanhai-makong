import { Clipboard, Text, View, WebView, openUrl, signal, type WebViewRef, type WebViewNavigation } from "nsh";
import { NavPage } from "nsh/base";
import icBack from "../../assets/ic_back.svg";
import icCopy from "../../assets/ic_copy.svg";
import icGlobe from "../../assets/ic_globe.svg";
import icMore from "../../assets/ic_more.svg";
import icRefresh from "../../assets/ic_refresh.svg";
import icWarning from "../../assets/ic_warning.svg";
import { nav } from "../nav";
import { BottomSheet } from "../overlays";
import { getSession, labelOf } from "../store";
import { C, PAD, paperGradient } from "../theme";
import { toast } from "../toast";
import { Hairline, Icon, RoundIconButton } from "../ui";
import { UrlUtils } from "../url";

export function WebPage(props: { id: string }) {
  const session = getSession(props.id);
  const targetUrl = session ? session.url : "";
  const currentUrl = signal(targetUrl);
  const pageTitle = signal(session ? labelOf(session) : "");
  const loading = signal(true);
  const failed = signal(false);
  const errorMessage = signal("");
  const canGoBack = signal(false);
  const menuOpen = signal(false);
  let web: WebViewRef | undefined;

  function sameUrl(left: string, right: string): boolean {
    const strip = (value: string) => value.replace(/\/+$/, "").toLowerCase();
    return strip(left) === strip(right);
  }

  function sync(state: WebViewNavigation) {
    if (state.url) currentUrl.set(state.url);
    canGoBack.set(state.canGoBack);
    if (!state.loading && state.title) {
      const title = state.title;
      if (title !== targetUrl && title !== UrlUtils.hostOf(targetUrl)) pageTitle.set(title);
    }
  }

  function retry() {
    failed.set(false);
    loading.set(true);
    if (web) web.reload();
  }

  function copyLink() {
    Clipboard.writeText(currentUrl())
      .then(() => toast("链接已复制"))
      .catch(() => toast("复制失败"));
  }

  function openInBrowser() {
    openUrl(currentUrl())
      .then((result) => {
        if (!result.opened) toast("没有可用的浏览器");
      })
      .catch(() => toast("没有可用的浏览器"));
  }

  function errorHint(): string {
    const message = errorMessage().toLowerCase();
    if (message.includes("cleartext") || message.includes("access denied") || message.includes("err_access_denied")) {
      return "系统拦截了对这个地址的访问。常见原因是明文 http 被安全策略限制，或这个地址只能在电脑本机打开。";
    }
    return "请确认手机和电脑在同一网络，并且这个地址在手机上能打开。如果是 http 明文地址，部分系统版本会拦截。";
  }

  if (!session) {
    return (
      <NavPage headerVisible={false} title="网页" style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: C.page, backgroundImage: paperGradient }}>
          <View style={{ paddingTop: "env(safe-area-inset-top)", padding: PAD }}>
            <RoundIconButton icon={icBack} onPress={() => nav.pop()} />
          </View>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
            <Text style={{ fontSize: 17, fontWeight: "600", color: C.text }}>这条收藏不存在</Text>
            <Text style={{ fontSize: 12, color: C.text3, marginTop: 8 }}>它可能已经被删除</Text>
          </View>
        </View>
      </NavPage>
    );
  }

  return (
    <NavPage
      headerVisible={false}
      title={pageTitle()}
      popOnBack={false}
      onBackPress={() => {
        // 网页历史里退过一层才留在网页内，已在收藏地址上就直接回列表。
        if (web && canGoBack() && !sameUrl(currentUrl(), targetUrl)) {
          web.goBack();
          return;
        }
        nav.pop();
      }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: C.page }}>
        <View style={{ paddingTop: "env(safe-area-inset-top)", backgroundColor: C.page }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingLeft: PAD,
              paddingRight: PAD,
              paddingTop: 8,
              paddingBottom: 8,
            }}
          >
            <RoundIconButton icon={icBack} onPress={() => nav.pop()} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15.5,
                  fontWeight: "600",
                  letterSpacing: 0.4,
                  color: C.text,
                  numberOfLines: 1,
                  textOverflow: "ellipsis",
                }}
              >
                {pageTitle() || "网页"}
              </Text>
              <Text
                style={{
                  fontSize: 10.5,
                  color: C.text3,
                  marginTop: 2,
                  numberOfLines: 1,
                  textOverflow: "ellipsis",
                }}
              >
                {UrlUtils.hostOf(currentUrl())}
              </Text>
            </View>
            <RoundIconButton icon={icMore} onPress={() => menuOpen.set(true)} />
          </View>
          <Hairline />
        </View>

        <View style={{ flex: 1 }}>
          <WebView
            ref={(node) => {
              web = node;
            }}
            src={targetUrl}
            style={{ flex: 1 }}
            zoomable={false}
            onLoadStart={(state) => {
              loading.set(true);
              failed.set(false);
              errorMessage.set("");
              if (state.url) currentUrl.set(state.url);
            }}
            onLoad={(state) => {
              loading.set(false);
              sync(state);
            }}
            onNavigationStateChange={sync}
            onError={(event) => {
              loading.set(false);
              failed.set(true);
              errorMessage.set(event.message);
            }}
          />

          <If when={loading() && !failed()}>
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 2,
                backgroundColor: C.surfaceAlt,
              }}
            >
              <View style={{ width: "38%", height: 2, backgroundColor: C.brand }} />
            </View>
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: C.page,
                backgroundImage: paperGradient,
              }}
            >
              <View style={{ width: 46, height: 3, borderRadius: 2, backgroundColor: C.brand, opacity: 0.85 }} />
              <Text style={{ fontSize: 12, letterSpacing: 2, color: C.text2, marginTop: 14 }}>正在加载…</Text>
            </View>
          </If>

          <If when={failed()}>
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: C.page,
                backgroundImage: paperGradient,
                paddingLeft: 30,
                paddingRight: 30,
                paddingBottom: 20,
              }}
            >
              <View
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: 37,
                  backgroundColor: C.dangerSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon src={icWarning} size={34} color={C.danger} />
              </View>
              <Text style={{ fontSize: 19, fontWeight: "700", letterSpacing: 3, color: C.text, marginTop: 16 }}>
                网页打不开
              </Text>
              <Text style={{ fontSize: 12, lineHeight: 19, color: C.text2, textAlign: "center", marginTop: 10 }}>
                {errorHint()}
              </Text>
              <If when={errorMessage().length > 0}>
                <Text
                  style={{
                    fontSize: 10,
                    color: C.text3,
                    textAlign: "center",
                    marginTop: 10,
                    numberOfLines: 2,
                    textOverflow: "ellipsis",
                  }}
                >
                  {errorMessage()}
                </Text>
              </If>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
                <View
                  role="button"
                  onPress={retry}
                  activeStyle={{ opacity: 0.82 }}
                  style={{
                    height: 44,
                    paddingLeft: 30,
                    paddingRight: 30,
                    borderRadius: 22,
                    backgroundColor: C.brand,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 13.5, fontWeight: "600", letterSpacing: 2, color: C.cream }}>重 试</Text>
                </View>
                <View
                  role="button"
                  onPress={openInBrowser}
                  activeStyle={{ opacity: 0.7 }}
                  style={{
                    height: 44,
                    paddingLeft: 20,
                    paddingRight: 20,
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: C.brandLine,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, color: C.brand }}>用浏览器打开</Text>
                </View>
              </View>
            </View>
          </If>
        </View>

        <BottomSheet open={() => menuOpen()} onClose={() => menuOpen.set(false)}>
          <View style={{ paddingTop: 4, paddingBottom: 10 }}>
            <Text style={{ fontSize: 9, letterSpacing: 2.4, color: C.gold, fontWeight: "600" }}>SHANHAI · 网 页</Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: C.text,
                marginTop: 4,
                numberOfLines: 1,
                textOverflow: "ellipsis",
              }}
            >
              {pageTitle() || "网页"}
            </Text>
          </View>
          <Hairline />
          <MenuRow
            icon={icRefresh}
            label="刷新"
            onPress={() => {
              menuOpen.set(false);
              retry();
            }}
          />
          <MenuRow
            icon={icCopy}
            label="复制链接"
            onPress={() => {
              menuOpen.set(false);
              copyLink();
            }}
          />
          <MenuRow
            icon={icGlobe}
            label="在浏览器打开"
            onPress={() => {
              menuOpen.set(false);
              openInBrowser();
            }}
          />
          <View
            role="button"
            onPress={() => menuOpen.set(false)}
            activeStyle={{ opacity: 0.75 }}
            style={{
              marginTop: 12,
              height: 48,
              borderRadius: 16,
              backgroundColor: C.surfaceAlt,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 14, color: C.text2, letterSpacing: 1 }}>取消</Text>
          </View>
        </BottomSheet>
      </View>
    </NavPage>
  );
}

function MenuRow(props: { icon: typeof icMore; label: string; onPress: () => void }) {
  return (
    <View
      role="button"
      onPress={props.onPress}
      activeStyle={{ backgroundColor: C.surfaceAlt }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingTop: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderColor: C.divider,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: C.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon src={props.icon} size={17} color={C.text2} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, color: C.text }}>{props.label}</Text>
    </View>
  );
}
