"""生成 1024x1024 应用图标：玄青底 + 鎏金细边 + 居中「码」。

用法：python scripts/gen_icon.py
"""
from PIL import Image, ImageDraw, ImageFont

SIZE = 1024
TOP = (23, 59, 58)      # #173B3A
BOTTOM = (13, 34, 33)   # #0D2221
GOLD = (200, 158, 96)   # #C89E60
GOLD_DIM = (200, 158, 96, 70)
FONT = r"C:\Windows\Fonts\NotoSerifSC-VF.ttf"


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


img = Image.new("RGB", (SIZE, SIZE), TOP)
px = img.load()
for y in range(SIZE):
    color = lerp(TOP, BOTTOM, y / (SIZE - 1))
    for x in range(SIZE):
        px[x, y] = color

draw = ImageDraw.Draw(img, "RGBA")

# 山脊暗纹
ridge = [(0, 760), (150, 700), (300, 742), (470, 668), (640, 736), (800, 690), (1024, 748)]
for offset, alpha in ((0, 30), (70, 18)):
    pts = [(x, y + offset) for x, y in ridge]
    draw.line(pts, fill=(200, 158, 96, alpha), width=3)

# 鎏金细边（内缩 78px）
inset = 78
draw.rounded_rectangle([inset, inset, SIZE - inset, SIZE - inset], radius=86,
                       outline=(*GOLD, 120), width=5)
draw.rounded_rectangle([inset + 16, inset + 16, SIZE - inset - 16, SIZE - inset - 16],
                       radius=70, outline=(*GOLD, 46), width=2)

# 居中的「码」
font = ImageFont.truetype(FONT, 440)
bbox = draw.textbbox((0, 0), "码", font=font)
w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
x = (SIZE - w) / 2 - bbox[0] + 14
y = (SIZE - h) / 2 - bbox[1] - 4
draw.text((x, y), "码", font=font, fill=(*GOLD, 255))

img.save(r"assets/icon.png", "PNG")
print("wrote assets/icon.png", img.size)
