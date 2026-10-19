import base64
import unittest

import numpy as np

import landmask


class LandmaskTest(unittest.TestCase):
    def test_square_is_filled_and_outside_is_empty(self):
        square = np.array([[-10, -10], [10, -10], [10, 10], [-10, 10], [-10, -10]], dtype=float)
        mask = landmask.rasterise([square])
        self.assertTrue(mask[90, 180])
        self.assertFalse(mask[90, 200])
        self.assertFalse(mask[60, 180])
        self.assertEqual(mask.sum(), 20 * 20)

    def test_hole_is_left_empty(self):
        outer = np.array([[-20, -20], [20, -20], [20, 20], [-20, 20], [-20, -20]], dtype=float)
        hole = np.array([[-5, -5], [5, -5], [5, 5], [-5, 5], [-5, -5]], dtype=float)
        mask = landmask.rasterise([outer, hole])
        self.assertFalse(mask[90, 180])
        self.assertTrue(mask[90, 165])

    def test_ts_roundtrips_bits(self):
        mask = np.zeros((180, 360), dtype=bool)
        mask[10, 20] = True
        ts = landmask.to_ts(mask)
        b64 = ts.split('LAND_B64 = "')[1].split('"')[0]
        bits = np.unpackbits(np.frombuffer(base64.b64decode(b64), dtype=np.uint8))[: 180 * 360].reshape(180, 360)
        self.assertTrue(bits[10, 20])
        self.assertEqual(bits.sum(), 1)


if __name__ == "__main__":
    unittest.main()
