import unittest

import numpy as np

import qa

SR = 1000


class QaTest(unittest.TestCase):
    def setUp(self):
        self.manifest = {
            "fps": 10,
            "scenes": [
                {"visual": "a", "durationInFrames": 20, "lines": [{"startFrame": 2, "endFrame": 12}]},
                {"visual": "b", "durationInFrames": 20, "lines": [{"startFrame": 5, "endFrame": 15}]},
            ],
        }

    def test_speech_mask_follows_line_timings_across_scenes(self):
        mask = qa.speech_mask(self.manifest, 4 * SR, SR)
        self.assertFalse(mask[100])
        self.assertTrue(mask[500])
        self.assertFalse(mask[1300])
        self.assertTrue(mask[2600])
        self.assertFalse(mask[3600])

    def test_scene_balance_flags_loud_background(self):
        mono = np.full(4 * SR, 0.01)
        mask = qa.speech_mask(self.manifest, len(mono), SR)
        mono[mask] = 0.5
        mono[2000:] = np.where(mask[2000:], 0.5, 0.4)
        rows = qa.scene_balance(self.manifest, mono, SR)
        self.assertTrue(rows[0]["ok"])
        self.assertFalse(rows[1]["ok"])

    def test_true_peak_catches_intersample_overs(self):
        t = np.arange(SR) / SR
        tone = 0.99 * np.sin(2 * np.pi * (SR / 4) * t + np.pi / 4)
        self.assertGreater(qa.true_peak_db(tone), qa.db(np.abs(tone).max()))

    def test_grid_rounds_rows_up(self):
        self.assertEqual(qa.grid(21, 7), (7, 3))
        self.assertEqual(qa.grid(22, 7), (7, 4))


if __name__ == "__main__":
    unittest.main()
