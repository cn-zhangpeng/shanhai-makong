"""生成「码控」应用图标（216x216 PNG）：玄青 × 鎏金的方印。

深青底、鎏金细边、居中一枚鎏金「码」，与《山海界》的玄青 / 鎏金同一套色。
用法：python scripts/gen_icon.py
"""
import os

from PIL import Image, ImageDraw, ImageFont

SIZE = 216
S = 4  # 超采样倍数，保证边缘平滑
W = SIZE * S

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = [
    os.path.join(ROOT, 'AppScope', 'resources', 'base', 'media', 'app_icon.png'),
    os.path.join(ROOT, 'entry', 'src', 'main', 'resources', 'base', 'media', 'app_icon.png'),
]

# 玄青：底与收口
XUAN_TOP = (23, 59, 58)
XUAN_BOTTOM = (13, 34, 33)
# 鎏金：印文与细边
GOLD_LIGHT = (227, 196, 106)

FONT_CANDIDATES = [
    r'C:\Windows\Fonts\NotoSerifSC-VF.ttf',
    r'C:\Windows\Fonts\simhei.ttf',
    r'C:\Windows\Fonts\msyhbd.ttc',
]


def px(value):
    return int(round(value * S))


def load_font(size):
    """宋体优先（有笔锋），按 Black 字重取；找不到再退黑体。"""
    for path in FONT_CANDIDATES:
        if not os.path.exists(path):
            continue
        try:
            font = ImageFont.truetype(path, px(size))
        except OSError:
            continue
        try:
            font.set_variation_by_name('Black')
        except (AttributeError, OSError, ValueError):
            pass
        return font
    return ImageFont.load_default()


def draw_glyph(draw, text, font, fill):
    """按字形墨迹居中，避免不同字体基线带来的偏移。"""
    box = font.getbbox(text)
    x = W / 2 - (box[0] + box[2]) / 2
    y = W / 2 - (box[1] + box[3]) / 2
    draw.text((x, y), text, font=font, fill=fill)


def build():
    # 玄青底：自上而下极轻的收深，避免大片纯色发平
    strip = Image.new('RGB', (1, W))
    for y in range(W):
        t = y / (W - 1)
        strip.putpixel((0, y), (
            int(XUAN_TOP[0] + (XUAN_BOTTOM[0] - XUAN_TOP[0]) * t),
            int(XUAN_TOP[1] + (XUAN_BOTTOM[1] - XUAN_TOP[1]) * t),
            int(XUAN_TOP[2] + (XUAN_BOTTOM[2] - XUAN_TOP[2]) * t),
        ))
    icon = strip.resize((W, W)).convert('RGBA')

    layer = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # 鎏金发丝边：不抢字，只在暗底上勾出印面
    inset = 0.075 * SIZE
    d.rounded_rectangle(
        [px(inset), px(inset), px(SIZE - inset), px(SIZE - inset)],
        radius=px(0.155 * SIZE),
        outline=GOLD_LIGHT + (120,), width=px(0.005 * SIZE))

    # 鎏金「码」
    draw_glyph(d, '码', load_font(0.52 * SIZE), GOLD_LIGHT + (255,))

    icon = Image.alpha_composite(icon, layer)
    return icon.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    icon = build()
    for path in TARGETS:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        icon.save(path, 'PNG')
        print('written', path, icon.size)


if __name__ == '__main__':
    main()
