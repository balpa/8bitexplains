import tempfile
import unittest
from pathlib import Path

from PIL import Image

import covers


class CoversTest(unittest.TestCase):
    def test_grid_takes_the_newest_nine_up_to_this_episode_newest_first(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            for n in range(1, 13):
                (out / f"ep{n:03d}-cover.png").touch()
            names = [p.name for p in covers.grid_covers(out, "ep011")]
        self.assertEqual(names[0], "ep011-cover.png")
        self.assertEqual(names[-1], "ep003-cover.png")
        self.assertEqual(len(names), 9)

    def test_grid_preview_crops_each_cover_to_three_by_four(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            cover = Image.new("RGB", (1080, 1920), (255, 0, 0))
            cover.paste((0, 0, 255), (0, 0, 1080, 240))
            cover.save(out / "ep001-cover.png")
            covers.grid_preview(covers.grid_covers(out, "ep001"), out / "grid.png")
            sheet = Image.open(out / "grid.png")
            self.assertEqual(sheet.size, (1080, 480))
            self.assertEqual(sheet.getpixel((180, 5)), (255, 0, 0))


    def test_grid_preview_wraps_to_a_second_row_after_three_covers(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            paths = []
            for n, colour in enumerate([(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)]):
                path = out / f"cover{n}.png"
                Image.new("RGB", (1080, 1920), colour).save(path)
                paths.append(path)
            covers.grid_preview(paths, out / "grid.png")
            sheet = Image.open(out / "grid.png")
            self.assertEqual(sheet.size, (1080, 960))
            self.assertEqual(sheet.getpixel((180, 485)), (255, 255, 0))


if __name__ == "__main__":
    unittest.main()
