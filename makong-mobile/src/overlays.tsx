import { Text, View, safeArea, type JSX } from "nsh";
import { Dialog } from "nsh/base";
import { C, R } from "./theme";
import { toastText, toastVisible } from "./toast";

const SCRIM = "rgba(28, 22, 16, 0.42)";

/** 底部纸面面板；`open` 传访问器，内容固定由调用方写好。 */
export function BottomSheet(props: { open: () => boolean; onClose: () => void; children: JSX.Element }) {
  return (
    <Dialog
      open={props.open()}
      animation="slide"
      onOpenChange={(event) => {
        if (!event.open) props.onClose();
      }}
      backdropStyle={{ backgroundColor: SCRIM }}
      style={{ flex: 1, justifyContent: "flex-end" }}
    >
      <View
        style={{
          backgroundColor: C.surface,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 10,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
          borderTopWidth: 1,
          borderColor: C.border,
        }}
      >
        <View style={{ alignItems: "center", paddingBottom: 8 }}>
          <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: C.borderLight }} />
        </View>
        {props.children}
      </View>
    </Dialog>
  );
}

export interface ConfirmState {
  title: string;
  message: string;
  confirmText: string;
  danger?: boolean;
}

/** 纸面确认框，替掉系统 AlertDialog。 */
export function ConfirmSheet(props: {
  open: () => boolean;
  state: () => ConfirmState | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const EMPTY: ConfirmState = { title: "", message: "", confirmText: "确定", danger: true };
  const s = () => props.state() ?? EMPTY;
  return (
    <Dialog
      open={props.open()}
      animation="fade"
      role="alertdialog"
      accessibilityLabel={s().title}
      accessibilityDescription={s().message}
      onOpenChange={(event) => {
        if (!event.open) props.onClose();
      }}
      backdropStyle={{ backgroundColor: SCRIM }}
      style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
    >
      <View
        style={{
          width: 316,
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 22,
          paddingBottom: 18,
          backgroundColor: C.surface,
          borderRadius: R.xl,
          borderWidth: 1,
          borderColor: C.border,
          boxShadow: "0 20px 44px rgba(38, 33, 27, 0.22)",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "700", letterSpacing: 1.2, color: C.text }}>{s().title}</Text>
        <Text style={{ fontSize: 12.5, lineHeight: 20, textAlign: "center", color: C.text2, marginTop: 10 }}>
          {s().message}
        </Text>
        <View style={{ flexDirection: "row", gap: 10, width: "100%", marginTop: 20 }}>
          <View
            role="button"
            onPress={props.onClose}
            activeStyle={{ opacity: 0.75 }}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 22,
              backgroundColor: C.surfaceAlt,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 13.5, letterSpacing: 2, color: C.text2 }}>取 消</Text>
          </View>
          <View
            role="button"
            onPress={props.onConfirm}
            activeStyle={{ opacity: 0.82 }}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 22,
              backgroundColor: s().danger === false ? C.brand : C.danger,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 13.5, fontWeight: "600", letterSpacing: 2, color: C.cream }}>
              {s().confirmText}
            </Text>
          </View>
        </View>
      </View>
    </Dialog>
  );
}

/** 轻量吐司。 */
export function ToastHost() {
  return (
    <If when={toastVisible()}>
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 90 + safeArea().bottom,
          alignItems: "center",
        }}
      >
        <View
          style={{
            maxWidth: "82%",
            paddingLeft: 18,
            paddingRight: 18,
            paddingTop: 11,
            paddingBottom: 11,
            borderRadius: 22,
            backgroundColor: "rgba(29, 24, 19, 0.92)",
            boxShadow: "0 10px 24px rgba(20, 16, 12, 0.28)",
          }}
        >
          <Text style={{ fontSize: 13, color: "#FBF8F3", letterSpacing: 0.4 }}>{toastText()}</Text>
        </View>
      </View>
    </If>
  );
}
