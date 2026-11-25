import { Image, Scroll, Text, View, effect, safeArea, signal, openUrl } from "nsh";
import { Input, NavPage } from "nsh/base";
import icAdd from "../../assets/ic_add.svg";
import icChevron from "../../assets/ic_chevron.svg";
import icMore from "../../assets/ic_more.svg";
import icScan from "../../assets/ic_scan.svg";
import icSearch from "../../assets/ic_search.svg";
import icSettings from "../../assets/ic_settings.svg";
import icShanhai from "../../assets/ic_shanhai.svg";
import icTrash from "../../assets/ic_trash.svg";
import icGlobe from "../../assets/ic_globe.svg";
import icEdit from "../../assets/ic_edit.svg";
import imgEmpty from "../../assets/img_empty.svg";
import imgRidge from "../../assets/img_ridge.svg";
import { openEdit, openWeb } from "../nav";
import { BottomSheet, ConfirmSheet, type ConfirmState } from "../overlays";
import { openScanner } from "../scanner/scanner";
import {
  autoResume,
  badgeOf,
  clearSessions,
  filterSessions,
  labelOf,
  lastSession,
  markOpened,
  removeSession,
  sessions,
  setAutoResume,
  storeReady,
  timeText,
  type SessionItem,
} from "../store";
import { C, PAD, R, fabShadow, floatShadow, inkGradient, paperGradient } from "../theme";
import { toast } from "../toast";
import { Hairline, Icon, MountainDivider, NameSeal, PaperSwitch, PrimaryButton, RoundIconButton, SealMark } from "../ui";
import { UrlUtils } from "../url";

interface LocalConfirm extends ConfirmState {
  kind: "delete" | "clear";
  id?: string;
}

export function Home() {
  const keyword = signal("");
  const settingsOpen = signal(false);
  const menuOpen = signal(false);
  const menuItem = signal<SessionItem | null>(null);
  const confirm = signal<LocalConfirm | null>(null);

  const hasKeyword = () => keyword().trim().length > 0;

  // 冷启动后自动进入上次会话：在首页挂载完成后再跳，避免 WebView 抢在首帧布局前挂载。
  effect(() => {
    if (!storeReady()) return;
    const scope = globalThis as unknown as { __makongResumed?: boolean };
    if (scope.__makongResumed) return;
    scope.__makongResumed = true;
    if (!autoResume()) return;
    const item = lastSession();
    if (item) {
      setTimeout(() => {
        markOpened(item.id);
        openWeb(item.id);
      }, 450);
    }
  });

  function openSession(item: SessionItem) {
    markOpened(item.id);
    openWeb(item.id);
  }

  function resume() {
    const item = lastSession();
    if (item) openSession(item);
  }

  function openInBrowser(url: string) {
    openUrl(url)
      .then((result) => {
        if (!result.opened) toast("没有可用的浏览器");
      })
      .catch(() => toast("没有可用的浏览器"));
  }

  function askDelete(item: SessionItem) {
    confirm.set({
      kind: "delete",
      id: item.id,
      title: "删除收藏",
      message: "确定删除「" + labelOf(item) + "」吗？",
      confirmText: "删 除",
      danger: true,
    });
  }

  function askClear() {
    confirm.set({
      kind: "clear",
      title: "清空全部收藏",
      message: "将删除本机保存的全部收藏，且无法恢复。",
      confirmText: "清 空",
      danger: true,
    });
  }

  function runConfirm() {
    const state = confirm();
    confirm.set(null);
    if (!state) return;
    if (state.kind === "delete" && state.id) {
      removeSession(state.id);
      toast("已删除");
    } else if (state.kind === "clear") {
      clearSessions();
      settingsOpen.set(false);
      toast("已清空");
    }
  }

  function scanToAdd() {
    openScanner((text) => {
      const url = UrlUtils.normalize(text);
      if (!UrlUtils.isWebUrl(url)) {
        toast("识别到的内容不是网址");
        return;
      }
      openEdit(undefined, url, UrlUtils.hostOf(url));
    });
  }

  return (
    <NavPage headerVisible={false} title="码控" style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: C.page, backgroundImage: paperGradient }}>
        <View style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <View>
            <Image
              src={imgRidge}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 150,
                opacity: 0.08,
                tintColor: C.text,
                objectFit: "cover",
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingLeft: PAD,
                paddingRight: PAD,
                paddingTop: 14,
              }}
            >
              <SealMark text="码" size={46} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, letterSpacing: 2.4, color: C.gold, fontWeight: "600" }}>
                  SHANHAI · 码 控
                </Text>
                <Text style={{ fontSize: 26, fontWeight: "700", letterSpacing: 2, color: C.text, marginTop: 3 }}>
                  码控
                </Text>
                <Text style={{ fontSize: 11, letterSpacing: 0.5, color: C.text3, marginTop: 2 }}>
                  会控页面收藏夹
                </Text>
              </View>
              <RoundIconButton icon={icAdd} onPress={() => openEdit()} />
              <RoundIconButton icon={icSettings} onPress={() => settingsOpen.set(true)} />
            </View>
            <MountainDivider icon={icShanhai} />
            <View style={{ paddingLeft: PAD, paddingRight: PAD, paddingTop: 12, paddingBottom: 8 }}>
              <View
                style={{
                  height: 44,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: C.surface,
                  borderWidth: 1,
                  borderColor: C.borderLight,
                  borderRadius: R.md,
                  paddingLeft: 12,
                  paddingRight: 12,
                }}
              >
                <Icon src={icSearch} size={15} color={C.text3} />
                <Input
                  value={keyword()}
                  onChange={(event) => keyword.set(event.value)}
                  placeholder="搜索名称或网址"
                  autoCorrect={false}
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    height: 42,
                    fontSize: 14,
                    color: C.text,
                    placeholderColor: C.text3,
                    backgroundColor: "transparent",
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        <If when={sessions().length === 0}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 64 }}>
            <Image src={imgEmpty} style={{ width: 228, height: 190 }} />
            <Text style={{ fontSize: 18, fontWeight: "600", letterSpacing: 2, color: C.text, marginTop: 10 }}>
              还没有收藏
            </Text>
            <Text style={{ fontSize: 12, lineHeight: 20, textAlign: "center", color: C.text2, marginTop: 8 }}>
              扫会控页上的二维码，或点右上角「＋」{"\n"}填一个网址，收藏后点开就能用。
            </Text>
            <View style={{ width: 156, marginTop: 22 }}>
              <PrimaryButton label="扫码添加" onPress={scanToAdd} height={44} icon={icScan} />
            </View>
          </View>
        </If>

        <If when={sessions().length > 0}>
          <Scroll
            style={{ flex: 1 }}
            scrollbar={false}
            contentStyle={{ paddingLeft: PAD, paddingRight: PAD, paddingTop: 4, paddingBottom: 116 }}
          >
            <If when={!hasKeyword() && !!lastSession()}>
              <View
                role="button"
                onPress={resume}
                activeStyle={{ opacity: 0.88 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  borderRadius: R.lg,
                  backgroundImage: inkGradient,
                  boxShadow: floatShadow,
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, letterSpacing: 3, color: C.gold, fontWeight: "600" }}>上次打开</Text>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "600",
                      color: "#FBF8F3",
                      marginTop: 5,
                      numberOfLines: 1,
                      textOverflow: "ellipsis",
                    }}
                  >
                    {labelOf(lastSession()!)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "rgba(251, 248, 243, 0.55)",
                      marginTop: 4,
                      numberOfLines: 1,
                      textOverflow: "ellipsis",
                    }}
                  >
                    {UrlUtils.hostOf(lastSession()!.url)}
                  </Text>
                </View>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: "rgba(255, 255, 255, 0.10)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon src={icChevron} size={13} color="#FBF8F3" />
                </View>
              </View>
            </If>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingLeft: 2,
                paddingRight: 2,
                paddingTop: 6,
                paddingBottom: 10,
              }}
            >
              <View style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: C.brand }} />
              <Text style={{ fontSize: 12, fontWeight: "600", letterSpacing: 1.5, color: C.text2 }}>我的收藏</Text>
              <View style={{ flex: 1 }} />
              <Text style={{ fontSize: 10.5, color: C.text3 }}>共 {sessions().length} 条</Text>
            </View>

            <If when={filterSessions(keyword()).length === 0}>
              <View style={{ alignItems: "center", paddingTop: 54, paddingBottom: 30 }}>
                <Icon src={icShanhai} size={30} color={C.text3} opacity={0.5} />
                <Text style={{ fontSize: 16, fontWeight: "600", letterSpacing: 2, color: C.text, marginTop: 12 }}>
                  没有找到
                </Text>
                <Text style={{ fontSize: 12, color: C.text3, marginTop: 6 }}>换个关键词，或扫码添加新的收藏</Text>
              </View>
            </If>

            <View style={{ gap: 12 }}>
              <Each
                of={filterSessions(keyword())}
                key={(item) => item.id + "-" + item.updatedAt + "-" + item.lastOpenAt}
              >
                {(item) => (
                  <View
                    role="button"
                    onPress={() => openSession(item())}
                    onLongPress={() => {
                      menuItem.set(item());
                      menuOpen.set(true);
                    }}
                    activeStyle={{ opacity: 0.86 }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 14,
                      backgroundColor: C.surface,
                      borderRadius: R.lg,
                      borderWidth: 1,
                      borderColor: C.border,
                      boxShadow: "0 4px 16px rgba(58, 44, 28, 0.06)",
                    }}
                  >
                    <NameSeal text={badgeOf(item())} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: C.text,
                          numberOfLines: 1,
                          textOverflow: "ellipsis",
                        }}
                      >
                        {labelOf(item())}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11.5,
                          color: C.text2,
                          marginTop: 4,
                          numberOfLines: 1,
                          textOverflow: "ellipsis",
                        }}
                      >
                        {UrlUtils.hostOf(item().url)}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <Text style={{ fontSize: 10.5, color: C.text3 }}>{timeText(item())}</Text>
                        <If when={UrlUtils.isPlainHttp(item().url)}>
                          <View
                            style={{
                              borderWidth: 1,
                              borderColor: C.brandLine,
                              borderRadius: 4,
                              paddingLeft: 4,
                              paddingRight: 4,
                              paddingTop: 1,
                              paddingBottom: 1,
                            }}
                          >
                            <Text style={{ fontSize: 9, color: C.brand }}>明文</Text>
                          </View>
                        </If>
                      </View>
                    </View>
                    <Icon src={icChevron} size={13} color={C.text3} opacity={0.7} />
                  </View>
                )}
              </Each>
            </View>

            <If when={!hasKeyword()}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  paddingTop: 26,
                  paddingBottom: 6,
                }}
              >
                <View style={{ width: 22, height: 1, backgroundColor: C.border }} />
                <Text style={{ fontSize: 9.5, letterSpacing: 2, color: C.text3 }}>收藏只保存在本机</Text>
                <View style={{ width: 22, height: 1, backgroundColor: C.border }} />
              </View>
            </If>
          </Scroll>
        </If>

        <If when={sessions().length > 0}>
          <View
            role="button"
            onPress={scanToAdd}
            activeStyle={{ opacity: 0.86 }}
            style={{
              position: "absolute",
              right: PAD + 2,
              bottom: 22 + safeArea().bottom,
              height: 50,
              borderRadius: 25,
              paddingLeft: 16,
              paddingRight: 20,
              backgroundColor: C.brand,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              boxShadow: fabShadow,
            }}
          >
            <Icon src={icScan} size={18} color={C.cream} />
            <Text style={{ fontSize: 13.5, fontWeight: "600", letterSpacing: 1, color: C.cream }}>扫码添加</Text>
          </View>
        </If>

        {/* 设置面板 */}
        <BottomSheet open={() => settingsOpen()} onClose={() => settingsOpen.set(false)}>
          <View style={{ paddingTop: 4, paddingBottom: 14 }}>
            <Text style={{ fontSize: 8.5, letterSpacing: 2.4, color: C.gold, fontWeight: "600" }}>SHANHAI · 设 置</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: C.text, marginTop: 4 }}>设置</Text>
          </View>
          <Hairline />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingTop: 16,
              paddingBottom: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: C.text }}>启动时打开上次的页面</Text>
              <Text style={{ fontSize: 10.5, color: C.text3, marginTop: 3 }}>打开应用后直接进入上次访问的页面</Text>
            </View>
            <PaperSwitch checked={() => autoResume()} onChange={(value) => setAutoResume(value)} />
          </View>
          <Hairline />
          <View
            role="button"
            onPress={askClear}
            activeStyle={{ opacity: 0.7 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingTop: 14,
              paddingBottom: 14,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: C.danger }}>清空全部收藏</Text>
              <Text style={{ fontSize: 10.5, color: C.text3, marginTop: 3 }}>删除后无法恢复</Text>
            </View>
            <Text style={{ fontSize: 13, color: C.danger }}>清空</Text>
          </View>
          <Text
            style={{
              fontSize: 10.5,
              color: C.text3,
              textAlign: "center",
              marginTop: 22,
              marginBottom: 8,
            }}
          >
            收藏只保存在本机 · 长按可编辑或删除
          </Text>
        </BottomSheet>

        {/* 长按菜单 */}
        <BottomSheet open={() => menuOpen()} onClose={() => menuOpen.set(false)}>
          <View style={{ paddingTop: 4, paddingBottom: 10 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: C.text,
                numberOfLines: 1,
                textOverflow: "ellipsis",
              }}
            >
              {menuItem() ? labelOf(menuItem()!) : ""}
            </Text>
            <Text
              style={{ fontSize: 11, color: C.text3, marginTop: 4, numberOfLines: 1, textOverflow: "ellipsis" }}
            >
              {menuItem() ? UrlUtils.hostOf(menuItem()!.url) : ""}
            </Text>
          </View>
          <Hairline />
          <MenuItemRow
            icon={icEdit}
            label="编辑"
            onPress={() => {
              const item = menuItem();
              menuOpen.set(false);
              if (item) openEdit(item.id);
            }}
          />
          <MenuItemRow
            icon={icGlobe}
            label="在浏览器打开"
            onPress={() => {
              const item = menuItem();
              menuOpen.set(false);
              if (item) openInBrowser(item.url);
            }}
          />
          <MenuItemRow
            icon={icTrash}
            label="删除"
            danger
            onPress={() => {
              const item = menuItem();
              menuOpen.set(false);
              if (item) askDelete(item);
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

        <ConfirmSheet
          open={() => confirm() !== null}
          state={confirm}
          onConfirm={runConfirm}
          onClose={() => confirm.set(null)}
        />
      </View>
    </NavPage>
  );
}

function MenuItemRow(props: { icon: typeof icMore; label: string; danger?: boolean; onPress: () => void }) {
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
          backgroundColor: props.danger ? C.dangerSoft : C.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon src={props.icon} size={17} color={props.danger ? C.danger : C.text2} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, color: props.danger ? C.danger : C.text }}>{props.label}</Text>
    </View>
  );
}
