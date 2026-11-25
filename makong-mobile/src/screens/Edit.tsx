import { Clipboard, Scroll, Text, View, signal } from "nsh";
import { Input, NavPage } from "nsh/base";
import icBack from "../../assets/ic_back.svg";
import icClipboard from "../../assets/ic_clipboard.svg";
import icScan from "../../assets/ic_scan.svg";
import icShanhai from "../../assets/ic_shanhai.svg";
import { nav } from "../nav";
import { ConfirmSheet, type ConfirmState } from "../overlays";
import { openScanner } from "../scanner/scanner";
import { createSession, getSession, removeSession, updateSession } from "../store";
import { C, PAD, R, cardShadow, paperGradient } from "../theme";
import { toast } from "../toast";
import { Icon, PrimaryButton, RoundIconButton, SealMark } from "../ui";
import { UrlUtils } from "../url";

export function Edit(props: { id?: string; url?: string; title?: string }) {
  const existing = props.id ? getSession(props.id) : undefined;
  const editing = !!existing;
  const name = signal(existing ? existing.name : (props.title ?? ""));
  const url = signal(existing ? existing.url : (props.url ?? ""));
  const confirm = signal<ConfirmState | null>(null);

  function fillUrl(text: string) {
    const normalized = UrlUtils.normalize(text);
    if (!UrlUtils.isWebUrl(normalized) || UrlUtils.hostOf(normalized).length === 0) return false;
    url.set(normalized);
    if (name().trim().length === 0) name.set(UrlUtils.hostOf(normalized));
    return true;
  }

  function scan() {
    openScanner((text) => {
      if (!fillUrl(text)) {
        toast("识别到的内容不是网址");
        return;
      }
      toast("已识别网址");
    });
  }

  function paste() {
    Clipboard.readText()
      .then((text) => {
        if (!text || !fillUrl(text)) {
          toast("剪贴板里没有网址");
          return;
        }
        toast("已粘贴网址");
      })
      .catch(() => toast("读取剪贴板失败"));
  }

  function save() {
    const normalized = UrlUtils.normalize(url());
    if (!UrlUtils.isWebUrl(normalized) || UrlUtils.hostOf(normalized).length === 0) {
      toast("请输入 http:// 或 https:// 开头的网址");
      return;
    }
    let label = name().trim();
    if (label.length === 0) label = UrlUtils.hostOf(normalized);
    if (editing && existing) {
      if (!getSession(existing.id)) {
        toast("这条收藏已不存在");
        return;
      }
      updateSession(existing.id, label, normalized);
    } else {
      createSession(label, normalized);
    }
    toast("已保存");
    nav.pop();
  }

  function askDelete() {
    if (!existing) return;
    confirm.set({
      title: "删除收藏",
      message: "确定要删除「" + (name().trim() || UrlUtils.hostOf(url())) + "」吗？",
      confirmText: "删 除",
      danger: true,
    });
  }

  function runDelete() {
    confirm.set(null);
    if (!existing) return;
    removeSession(existing.id);
    toast("已删除");
    nav.pop();
  }

  return (
    <NavPage headerVisible={false} title={editing ? "编辑收藏" : "添加收藏"} style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: C.page, backgroundImage: paperGradient }}>
        <View style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingLeft: PAD,
              paddingRight: PAD,
              paddingTop: 10,
              paddingBottom: 10,
            }}
          >
            <RoundIconButton icon={icBack} onPress={() => nav.pop()} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8.5, letterSpacing: 2.4, color: C.gold, fontWeight: "600" }}>
                SHANHAI · 码 控
              </Text>
              <Text style={{ fontSize: 21, fontWeight: "700", letterSpacing: 1.5, color: C.text, marginTop: 3 }}>
                {editing ? "编辑收藏" : "添加收藏"}
              </Text>
            </View>
            <SealMark text="码" size={34} />
          </View>
        </View>

        <Scroll
          style={{ flex: 1 }}
          scrollbar={false}
          keyboardShouldPersistTaps="handled"
          contentStyle={{ paddingLeft: 18, paddingRight: 18, paddingTop: 4, paddingBottom: 28 }}
        >
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: R.lg,
              borderWidth: 1,
              borderColor: C.border,
              boxShadow: cardShadow,
              padding: 18,
            }}
          >
            <Text style={{ fontSize: 10.5, fontWeight: "600", letterSpacing: 2.2, color: C.text3 }}>名 称</Text>
            <Input
              value={name()}
              onChange={(event) => name.set(event.value)}
              placeholder="例如：会控台 / dsh"
              maxLength={60}
              style={{
                width: "100%",
                height: 46,
                marginTop: 8,
                paddingLeft: 12,
                paddingRight: 12,
                fontSize: 15,
                color: C.text,
                placeholderColor: C.text3,
                backgroundColor: C.surfaceAlt,
                borderRadius: R.sm,
              }}
            />

            <View style={{ height: 1, backgroundColor: C.divider, marginTop: 16, marginBottom: 16 }} />

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 10.5, fontWeight: "600", letterSpacing: 2.2, color: C.text3 }}>网 址</Text>
              <View style={{ flex: 1 }} />
              <View
                role="button"
                onPress={paste}
                activeStyle={{ opacity: 0.6 }}
                hitSlop={8}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 8 }}
              >
                <Icon src={icClipboard} size={13} color={C.brand} />
                <Text style={{ fontSize: 12, color: C.brand }}>粘贴</Text>
              </View>
              <View
                role="button"
                onPress={scan}
                activeStyle={{ opacity: 0.6 }}
                hitSlop={8}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 12 }}
              >
                <Icon src={icScan} size={13} color={C.brand} />
                <Text style={{ fontSize: 12, color: C.brand }}>扫一扫</Text>
              </View>
            </View>

            <Input
              value={url()}
              onChange={(event) => url.set(event.value)}
              placeholder="https://192.168.1.9:3081/"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={2048}
              style={{
                width: "100%",
                height: 46,
                marginTop: 8,
                paddingLeft: 12,
                paddingRight: 12,
                fontSize: 14,
                color: C.text,
                placeholderColor: C.text3,
                backgroundColor: C.surfaceAlt,
                borderRadius: R.sm,
              }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginTop: 14,
              padding: 14,
              backgroundColor: C.surfaceAlt,
              borderRadius: R.md,
              alignItems: "flex-start",
            }}
          >
            <View style={{ marginTop: 1 }}>
              <Icon src={icShanhai} size={20} color={C.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: C.text }}>怎么获取网址</Text>
              <Text style={{ fontSize: 11.5, lineHeight: 18, color: C.text2, marginTop: 4 }}>
                在电脑上打开会控页，把地址栏里的链接生成二维码扫进来即可；内网 http 地址也能保存，用电脑上的二维码工具生成就行。
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 22 }}>
            <PrimaryButton label="保 存" onPress={save} height={50} />
          </View>

          <If when={editing}>
            <View
              role="button"
              onPress={askDelete}
              activeStyle={{ opacity: 0.6 }}
              style={{ marginTop: 10, height: 44, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontSize: 13, color: C.danger }}>删除</Text>
            </View>
          </If>

          <Text
            style={{
              fontSize: 10.5,
              color: C.text3,
              width: "100%",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            收藏只保存在这台机器上
          </Text>
        </Scroll>

        <ConfirmSheet
          open={() => confirm() !== null}
          state={confirm}
          onConfirm={runDelete}
          onClose={() => confirm.set(null)}
        />
      </View>
    </NavPage>
  );
}
