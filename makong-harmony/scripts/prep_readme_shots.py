from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / ".screenshots"
DST = ROOT / "docs" / "screenshots"
DST.mkdir(parents=True, exist_ok=True)

SHOTS = [
    ("v5-list.jpeg", "01-list.jpg"),
    ("v3-empty2.jpeg", "02-empty.jpg"),
    ("v4-edit.jpeg", "03-edit.jpg"),
    ("v2-web.jpeg", "04-webview.jpg"),
    ("v5-settings.jpeg", "05-settings.jpg"),
    ("v3-dialog.jpeg", "06-dialog.jpg"),
    ("v2-error.jpeg", "07-error.jpg"),
    ("v4-menu.jpeg", "08-menu.jpg"),
]

# 去掉顶部状态栏与底部手势条，只保留应用画面
CROP_TOP = 132
CROP_BOTTOM = 2788
TARGET_WIDTH = 900

for src_name, dst_name in SHOTS:
    img = Image.open(SRC / src_name).convert("RGB")
    w, h = img.size
    img = img.crop((0, CROP_TOP, w, CROP_BOTTOM))
    ratio = TARGET_WIDTH / img.width
    img = img.resize((TARGET_WIDTH, round(img.height * ratio)), Image.LANCZOS)
    out = DST / dst_name
    img.save(out, "JPEG", quality=88, optimize=True, progressive=True)
    print(dst_name, img.size, out.stat().st_size // 1024, "KB")
