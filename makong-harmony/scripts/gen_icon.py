"""生成「码控」应用图标（216x216 PNG），宣纸 × 墨色 × 朱砂的山海风格。

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

PAPER_TOP = (250, 247, 241)
PAPER_BOTTOM = (243, 237, 226)
INK = (38, 33, 27)
CINNABAR = (168, 62, 44)
CINNABAR_DARK = (140, 48, 33)

FONT_CANDIDATES = [
    r'C:\Windows\Fonts\msyhbd.ttc',
    r'C:\Windows\Fonts\msyh.ttc',
    r'C:\Windows\Fonts\simhei.ttf',
]


def px(value):
    return int(round(value * S))


def load_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, px(size))
            except OSError:
                continue
    return ImageFont.load_default()


def build():
    # 宣纸底：极轻的上下渐变
    grad = Image.new('RGB', (1, W))
    for y in range(W):
        t = y / (W - 1)
        grad.putpixel((0, y), (
            int(PAPER_TOP[0] + (PAPER_BOTTOM[0] - PAPER_TOP[0]) * t),
            int(PAPER_TOP[1] + (PAPER_BOTTOM[1] - PAPER_TOP[1]) * t),
            int(PAPER_TOP[2] + (PAPER_BOTTOM[2] - PAPER_TOP[2]) * t),
        ))
    icon = grad.resize((W, W)).convert('RGBA')

    layer = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # 山脊：三层极淡墨色，从底部起势
    ridges = [
        (0.62, 0.18, [(0, 150), (34, 116), (62, 132), (96, 96), (130, 126),
                      (168, 104), (206, 130), (216, 120)]),
        (0.70, 0.10, [(0, 168), (40, 140), (78, 156), (120, 128), (160, 150),
                      (200, 132), (216, 144)]),
        (0.78, 0.06, [(0, 186), (52, 164), (104, 178), (150, 158), (196, 172), (216, 166)]),
    ]
    for start, alpha, points in ridges:
        poly = [(px(x), px(y)) for x, y in points]
        poly.append((W, W))
        poly.append((0, W))
        d.polygon(poly, fill=INK + (int(255 * alpha),))

    # 朱砂方印：居中略上，圆角方章
    seal = 108
    left = (SIZE - seal) / 2
    top = 42
    d.rounded_rectangle(
        [px(left), px(top), px(left + seal), px(top + seal)],
        radius=px(26), fill=CINNABAR + (255,))
    # 印章外缘加一道深朱砂细边，像石印的边款
    d.rounded_rectangle(
        [px(left), px(top), px(left + seal), px(top + seal)],
        radius=px(26), outline=CINNABAR_DARK + (255,), width=px(1.4))

    # 白文「码」
    font = load_font(62)
    d.text((px(SIZE / 2), px(top + seal / 2 + 1)), '码',
           font=font, fill=(255, 248, 239, 255), anchor='mm')

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
