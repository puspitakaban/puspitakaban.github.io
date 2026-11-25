"""Prepare web textures and UV bounds without changing the approved PNGs."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "stickers"
OUT = ROOT / "assets" / "decals"
FILES = [
    ("promised-land", "01_promised_land.png"), ("cat", "02_cat_nsfw.png"),
    ("cats", "03_budha.png"), ("disco", "04_wisconsin.png"),
    ("atlas-record", "05_atlas.png"), ("wander", "06_wander.png"),
    ("michigan-seas", "07_seas.png"), ("underground-sounds", "08_underground.png"),
    ("art-feminism", "09_aaaf.png"),
    ("its-background", "10_its.png"),
]


def prepare_decals():
    info = {}
    for sticker_id, filename in FILES:
        with Image.open(SOURCE / filename) as source:
            image = source.convert("RGBA")
            bounds = image.getchannel("A").point(lambda v: 255 if v > 127 else 0).getbbox()
            if not bounds:
                raise ValueError(f"Empty sticker: {filename}")
            x0, y0, x1, y1 = bounds
            destination = OUT / (Path(filename).stem + ".webp")
            if not destination.exists() or (SOURCE / filename).stat().st_mtime > destination.stat().st_mtime:
                image.save(destination, "WEBP", quality=95, method=6, exact=True)
            info[sticker_id] = {
                "file": "./assets/decals/" + destination.name,
                "source": "./assets/stickers/" + filename,
                "aspect": (x1-x0)/(y1-y0),
                "uv": [x0/image.width, 1-y1/image.height, x1/image.width, 1-y0/image.height],
            }
            print("Prepared", filename)
    (OUT / "texture-info.js").write_text(
        "// Generated from the approved PNGs; original files remain unchanged.\n"
        "export const stickerTextures = " + json.dumps(info, indent=2) + ";\n"
    )


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    prepare_decals()
