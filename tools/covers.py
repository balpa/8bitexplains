"""Profile-grid preview: the newest cover and the eight before it, cropped to 3:4 the way the grid shows them."""
import sys
from pathlib import Path

from PIL import Image

GRID_CROP = (0, 240, 1080, 1680)
TILE = (360, 480)
COLS = 3


def grid_covers(out_dir: Path, ep_id: str, count: int = 9) -> list[Path]:
    covers = sorted(p for p in out_dir.glob("ep*-cover.png") if p.name <= f"{ep_id}-cover.png")
    return covers[-count:][::-1]


def grid_preview(covers: list[Path], dest: Path) -> None:
    rows = -(-len(covers) // COLS)
    sheet = Image.new("RGB", (COLS * TILE[0], rows * TILE[1]), (5, 4, 15))
    for i, path in enumerate(covers):
        tile = Image.open(path).convert("RGB").crop(GRID_CROP).resize(TILE, Image.LANCZOS)
        sheet.paste(tile, ((i % COLS) * TILE[0], (i // COLS) * TILE[1]))
    sheet.save(dest)


if __name__ == "__main__":
    out = Path(sys.argv[1])
    grid_preview(grid_covers(out, sys.argv[2]), out / "grid-preview.png")
    print(out / "grid-preview.png")
