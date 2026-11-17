from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageStat
import csv

ROOT = Path(__file__).resolve().parents[1]
PHOTOS = sorted((ROOT / "assets" / "startups").glob("*/foto.webp"))
OUT = ROOT / "evidence" / "photo-audit"
OUT.mkdir(parents=True, exist_ok=True)

thumb_w, thumb_h = 240, 180
label_h, cols, rows = 42, 4, 4
font = ImageFont.load_default()
records = []

for path in PHOTOS:
    with Image.open(path).convert("RGB") as image:
        stat = ImageStat.Stat(image.resize((64, 64)))
        mean = sum(stat.mean) / 3
        extrema = image.getextrema()
        dynamic = sum(hi - lo for lo, hi in extrema) / 3
        records.append({
            "id": path.parent.name,
            "path": str(path.relative_to(ROOT)).replace("\\", "/"),
            "width": image.width,
            "height": image.height,
            "mean": round(mean, 2),
            "dynamic": round(dynamic, 2),
            "suspect_dark": mean < 22,
        })

for page_no, start in enumerate(range(0, len(PHOTOS), cols * rows), 1):
    canvas = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), "#e9e2d5")
    draw = ImageDraw.Draw(canvas)
    for slot, path in enumerate(PHOTOS[start:start + cols * rows]):
        record = records[start + slot]
        with Image.open(path).convert("RGB") as image:
            scale = max(thumb_w / image.width, thumb_h / image.height)
            resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
            left = max(0, (resized.width - thumb_w) // 2)
            crop = resized.crop((left, 0, left + thumb_w, thumb_h))
            x = (slot % cols) * thumb_w
            y = (slot // cols) * (thumb_h + label_h)
            canvas.paste(crop, (x, y))
            draw.rectangle((x, y + thumb_h, x + thumb_w, y + thumb_h + label_h), fill="#fffaf0")
            label = f"{start + slot + 1:03d} {record['id'][:26]}\n{record['width']}x{record['height']}  mean {record['mean']}"
            draw.multiline_text((x + 6, y + thumb_h + 5), label, font=font, fill="#161616", spacing=2)
    canvas.save(OUT / f"contact-{page_no:02d}.jpg", quality=90)

with (OUT / "audit.csv").open("w", newline="", encoding="utf-8-sig") as handle:
    writer = csv.DictWriter(handle, fieldnames=records[0].keys())
    writer.writeheader()
    writer.writerows(records)

print(f"Audited {len(records)} photos in {len(list(OUT.glob('contact-*.jpg')))} sheets")
for record in records:
    if record["suspect_dark"]:
        print("DARK", record["id"], record["mean"], record["path"])
