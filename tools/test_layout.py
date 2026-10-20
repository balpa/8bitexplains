import re
import unittest
from pathlib import Path

EPISODE = Path(__file__).resolve().parent.parent / "remotion" / "src" / "Episode.tsx"


class LayoutTest(unittest.TestCase):
    def test_font_sizes_land_on_the_3px_art_grid(self):
        src = EPISODE.read_text()
        sizes = [int(n) for expr in re.findall(r"fontSize: ([^,}]+)", src) for n in re.findall(r"\b\d+\b", expr)]
        sizes += [int(n) for n in re.findall(r"\d+", re.search(r"sizes = \[([^\]]+)\]", src).group(1))]
        self.assertTrue(sizes)
        self.assertEqual([s for s in sizes if s % 24], [])


if __name__ == "__main__":
    unittest.main()
