import { Image, Text, View, type ImageAsset, type JSX } from "nsh";
import { C, R, cardShadow, sealShadow } from "./theme";

export function Icon(props: { src: ImageAsset; size?: number; color?: string; opacity?: number }) {
  const side = props.size ?? 18;
  return (
    <Image
      src={props.src}
      style={{ width: side, height: side, tintColor: props.color ?? C.text, opacity: props.opacity ?? 1 }}
    />
  );
}

/** 品牌朱砂方印「码」。 */
export function SealMark(props: { text?: string; size?: number }) {
  const side = props.size ?? 46;
  return (
    <View
      style={{
        width: side,
        height: side,
        borderRadius: side * 0.24,
        backgroundColor: C.brand,
        borderWidth: 1,
        borderColor: C.brandDark,
        alignItems: "center",
        justifyContent: "center",
        boxShadow: sealShadow,
      }}
    >
      <Text style={{ fontSize: side * 0.44, fontWeight: "700", color: C.cream }}>{props.text ?? "码"}</Text>
    </View>
  );
}

/** 收藏卡左侧的浅朱砂首字印。 */
export function NameSeal(props: { text: string; size?: number }) {
  const side = props.size ?? 44;
  return (
    <View
      style={{
        width: side,
        height: side,
        borderRadius: side * 0.26,
        backgroundColor: C.brandSoft,
        borderWidth: 1,
        borderColor: C.brandLine,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: side * 0.4, fontWeight: "600", color: C.brand }}>{props.text}</Text>
    </View>
  );
}

/** 纸白底 + 发丝边的圆形图标按钮。 */
export function RoundIconButton(props: {
  icon: ImageAsset;
  onPress: () => void;
  tint?: string;
  size?: number;
  background?: string;
}) {
  const side = props.size ?? 40;
  return (
    <View
      role="button"
      onPress={props.onPress}
      activeStyle={{ opacity: 0.6 }}
      hitSlop={6}
      style={{
        width: side,
        height: side,
        borderRadius: side / 2,
        backgroundColor: props.background ?? C.surface,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon src={props.icon} size={side * 0.45} color={props.tint ?? C.text} />
    </View>
  );
}

/** 发丝分隔线。 */
export function Hairline(props: { color?: string }) {
  return <View style={{ height: 1, width: "100%", backgroundColor: props.color ?? C.divider }} />;
}

/** 页头品牌区：小字 SHANHAI、墨色标题、可选副标题。 */
export function BrandHeading(props: { title: string; subtitle?: string; badge?: string; badgeSize?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
      <SealMark text={props.badge ?? "码"} size={props.badgeSize ?? 46} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, letterSpacing: 2.4, color: C.gold, fontWeight: "600" }}>SHANHAI · 码 控</Text>
        <Text style={{ fontSize: 24, fontWeight: "700", letterSpacing: 2, color: C.text, marginTop: 3 }}>
          {props.title}
        </Text>
        <If when={!!props.subtitle}>
          <Text style={{ fontSize: 11, letterSpacing: 0.5, color: C.text3, marginTop: 3 }}>{props.subtitle ?? ""}</Text>
        </If>
      </View>
    </View>
  );
}

/** 山海纹样分隔：两道发丝线夹一枚山形小印。 */
export function MountainDivider(props: { icon: ImageAsset; padding?: number }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingLeft: props.padding ?? 26,
        paddingRight: props.padding ?? 26,
        paddingTop: 14,
        paddingBottom: 2,
      }}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: C.divider }} />
      <Icon src={props.icon} size={22} color={C.gold} opacity={0.9} />
      <View style={{ flex: 1, height: 1, backgroundColor: C.divider }} />
    </View>
  );
}

/** 自绘纸面开关。 */
export function PaperSwitch(props: { checked: () => boolean; onChange: (value: boolean) => void }) {
  return (
    <View
      role="switch"
      accessibilityState={{ checked: props.checked() }}
      onPress={() => props.onChange(!props.checked())}
      activeStyle={{ opacity: 0.8 }}
      style={{
        width: 50,
        height: 30,
        borderRadius: 15,
        padding: 3,
        backgroundColor: props.checked() ? C.brand : C.borderLight,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: props.checked() ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: C.surface,
          boxShadow: "0 1px 3px rgba(38, 33, 27, 0.25)",
        }}
      />
    </View>
  );
}

/** 主操作胶囊按钮。 */
export function PrimaryButton(props: {
  label: string;
  onPress: () => void;
  height?: number;
  icon?: ImageAsset;
  ghost?: boolean;
}) {
  return (
    <View
      role="button"
      onPress={props.onPress}
      activeStyle={{ opacity: 0.82 }}
      style={{
        height: props.height ?? 50,
        borderRadius: (props.height ?? 50) / 2,
        backgroundColor: props.ghost ? "transparent" : C.brand,
        borderWidth: props.ghost ? 1 : 0,
        borderColor: props.ghost ? C.brandLine : "transparent",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        boxShadow: props.ghost ? "none" : sealShadow,
      }}
    >
      <If when={!!props.icon}>
        <Icon src={props.icon!} size={18} color={props.ghost ? C.brand : C.cream} />
      </If>
      <Text
        style={{
          fontSize: 14.5,
          fontWeight: "600",
          letterSpacing: props.ghost ? 1 : 3,
          color: props.ghost ? C.brand : C.cream,
        }}
      >
        {props.label}
      </Text>
    </View>
  );
}

/** 纸卡容器。 */
export function PaperCard(props: { children: JSX.Element; padding?: number; style?: object }) {
  return (
    <View
      style={[
        {
          backgroundColor: C.surface,
          borderRadius: R.lg,
          borderWidth: 1,
          borderColor: C.border,
          boxShadow: cardShadow,
          padding: props.padding ?? 16,
        },
        props.style ?? {},
      ]}
    >
      {props.children}
    </View>
  );
}
