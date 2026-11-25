import { Clipboard, Picker, Text, View, WebView, signal, type WebViewRef } from "nsh";
import { Dialog } from "nsh/base";
import icClose from "../../assets/ic_close.svg";
import icImage from "../../assets/ic_image.svg";
import { C } from "../theme";
import { Icon } from "../ui";
import { isOpenableUrl, UrlUtils } from "../url";
import { SCANNER_HTML } from "./page";

const open = signal(false);
let handler: ((text: string) => void) | null = null;

/** 打开扫码页，识别到网址后回调（自动补全协议）。 */
export function openScanner(onResult: (text: string) => void): void {
  handler = onResult;
  open.set(true);
}

export function ScannerDialog() {
  const status = signal("将二维码放入框内，即可自动识别");
  const busy = signal(false);
  let web: WebViewRef | undefined;

  function close() {
    if (web) web.postMessage(JSON.stringify({ type: "stop" }));
    open.set(false);
    status.set("将二维码放入框内，即可自动识别");
    busy.set(false);
  }

  function finish(text: string) {
    const normalized = UrlUtils.normalize(text);
    if (!isOpenableUrl(normalized)) {
      status.set("识别到的内容不是网址");
      busy.set(false);
      return;
    }
    const callback = handler;
    close();
    if (callback) callback(normalized);
  }

  function onPageMessage(data: string) {
    let message: { type?: string; text?: string; message?: string } = {};
    try {
      message = JSON.parse(data) as typeof message;
    } catch {
      return;
    }
    if (message.type === "result" && message.text) {
      finish(message.text);
    } else if (message.type === "camera-ready") {
      status.set("对准二维码即可自动识别");
    } else if (message.type === "camera-error") {
      status.set("摄像头不可用，可从相册选择二维码截图");
    } else if (message.type === "image-none") {
      status.set("没有识别到二维码，换一张试试");
      busy.set(false);
    }
  }

  function pickImage() {
    if (busy()) return;
    busy.set(true);
    status.set("正在打开相册…");
    Picker.pickImages({ maxDimension: 1200, quality: 0.86 })
      .then(async (images) => {
        if (!images.length) {
          busy.set(false);
          status.set("将二维码放入框内，即可自动识别");
          return;
        }
        const file = images[0].file;
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const chunk = 0x8000;
        for (let offset = 0; offset < bytes.length; offset += chunk) {
          const part = bytes.subarray(offset, Math.min(offset + chunk, bytes.length));
          binary += String.fromCharCode.apply(null, Array.from(part));
        }
        const base64 = btoa(binary);
        const type = file.type && file.type.length > 0 ? file.type : "image/jpeg";
        status.set("正在识别图片…");
        if (web) web.postMessage(JSON.stringify({ type: "image", dataUrl: "data:" + type + ";base64," + base64 }));
      })
      .catch(() => {
        busy.set(false);
        status.set("打开相册失败");
      });
  }

  function pasteUrl() {
    Clipboard.readText()
      .then((text) => {
        if (!text) {
          status.set("剪贴板里没有内容");
          return;
        }
        const normalized = UrlUtils.normalize(text);
        if (!isOpenableUrl(normalized)) {
          status.set("剪贴板里没有网址");
          return;
        }
        finish(normalized);
      })
      .catch(() => status.set("读取剪贴板失败"));
  }

  return (
    <Dialog
      open={open()}
      animation="fade"
      closeOnBackdropPress={false}
      onOpenChange={(event) => {
        if (!event.open) close();
      }}
      style={{ flex: 1 }}
    >
      <If when={open()}>
        <View
          style={{
            flex: 1,
            backgroundColor: "#14100C",
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
            }}
          >
            <View
              role="button"
              onPress={close}
              activeStyle={{ opacity: 0.6 }}
              hitSlop={8}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: "rgba(200,158,96,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon src={icClose} size={17} color={C.cream} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", letterSpacing: 2, color: C.cream }}>扫一扫</Text>
              <Text style={{ fontSize: 10.5, color: "rgba(245,238,226,0.5)", marginTop: 2 }}>
                扫描会控页上的二维码
              </Text>
            </View>
            <View
              role="button"
              onPress={pickImage}
              activeStyle={{ opacity: 0.6 }}
              hitSlop={8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingLeft: 12,
                paddingRight: 12,
                height: 34,
                borderRadius: 17,
                backgroundColor: "rgba(200,158,96,0.14)",
                borderWidth: 1,
                borderColor: "rgba(200,158,96,0.3)",
              }}
            >
              <Icon src={icImage} size={14} color={C.gold} />
              <Text style={{ fontSize: 12, color: "#E8C58C" }}>相册</Text>
            </View>
          </View>

          <View style={{ flex: 1, overflow: "hidden" }}>
            <WebView
              ref={(node) => {
                web = node;
              }}
              html={SCANNER_HTML}
              baseUrl="https://makong.local/"
              style={{ flex: 1 }}
              javaScriptEnabled
              onMessage={(event) => onPageMessage(event.data)}
              onError={(event) => status.set("扫码页加载失败：" + event.message)}
            />
          </View>

          <View style={{ paddingLeft: 18, paddingRight: 18, paddingTop: 12, paddingBottom: 14 }}>
            <Text style={{ fontSize: 12, color: "rgba(245,238,226,0.62)", textAlign: "center" }}>{status()}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <View
                role="button"
                onPress={pickImage}
                activeStyle={{ opacity: 0.82 }}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: C.brand,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <Icon src={icImage} size={17} color={C.cream} />
                <Text style={{ fontSize: 14, fontWeight: "600", letterSpacing: 1, color: C.cream }}>从相册识别</Text>
              </View>
              <View
                role="button"
                onPress={pasteUrl}
                activeStyle={{ opacity: 0.7 }}
                style={{
                  width: 118,
                  height: 46,
                  borderRadius: 23,
                  borderWidth: 1,
                  borderColor: "rgba(200,158,96,0.35)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 13, color: "#E8C58C" }}>粘贴网址</Text>
              </View>
            </View>
            <Text
              style={{
                fontSize: 10,
                color: "rgba(245,238,226,0.38)",
                textAlign: "center",
                marginTop: 10,
              }}
            >
              也可以把二维码截图存进相册，再点「从相册识别」
            </Text>
          </View>
        </View>
      </If>
    </Dialog>
  );
}
