"""Optional asset maintenance: generate tiny local destination thumbnails from credited photos.

The website serves the checked-in output directly; Python/Pillow is not needed to run the app.
"""
from pathlib import Path
import re

from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
source = (root / "wwwroot/js/destinations.js").read_text(encoding="utf-8")
slugs = re.findall(r'\["[^"]+", "[^"]+", "([a-z-]+)"\]', source)
output = root / "wwwroot/images/places"
output.mkdir(parents=True, exist_ok=True)
for slug in slugs:
    with Image.open(root / "wwwroot/images/stays" / f"{slug}-800.webp") as photo:
        thumbnail = ImageOps.fit(photo.convert("RGB"), (112, 88), Image.Resampling.LANCZOS)
        thumbnail.save(output / f"{slug}.webp", format="WEBP", quality=75, method=6)
print(f"Prepared {len(slugs)} local thumbnails, {sum(p.stat().st_size for p in output.glob('*.webp')):,} bytes")
