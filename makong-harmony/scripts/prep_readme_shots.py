from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / ".screenshots"
DST = ROOT / "docs" / "screenshots"
DST.mkdir(parents=True, exist_ok=True)

SHOTS = [
    ("list.jpeg", "01-list.jpg"),
    ("empty.jpeg", "02-empty.jpg"),
    ("edit.jpeg", "03-edit.jpg"),
    ("web.jpeg", "04-webview.jpg"),
    ("settings.jpeg", "05-settings.jpg"),
    ("dialog.jpeg", "06-dialog.jpg"),
    ("error.jpeg", "07-error.jpg"),
    ("menu.jpeg", "08-menu.jpg"),
]

# 去掉系统状态栏与底部手势条，只保留应用画面（1316×2832 → 1316×2597）
CROP_TOP = 137
CROP_BOTTOM = 2734
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
