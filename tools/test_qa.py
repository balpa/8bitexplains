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

    def test_script_checks_pass_for_fast_start_good_pace_and_aftermath(self):
        manifest = {
            "fps": 10,
            "scenes": [
                {"beat": "hook", "durationInFrames": 30, "lines": [{"text": " ".join(["w"] * 9), "startFrame": 3, "endFrame": 33}]},
                {"beat": "aftermath", "durationInFrames": 20, "lines": [{"text": "a b c", "startFrame": 0, "endFrame": 10}]},
                {"beat": "outro", "durationInFrames": 30, "lines": [{"text": "x", "startFrame": 0, "endFrame": 5}, {"text": "y", "startFrame": 14, "endFrame": 18}]},
            ],
        }
        self.assertTrue(all(ok for _, ok in qa.script_checks(manifest)))

    def test_script_checks_flag_slow_start_slow_pace_and_missing_aftermath(self):
        manifest = {
            "fps": 10,
            "scenes": [
                {"durationInFrames": 60, "lines": [{"text": "one two", "startFrame": 8, "endFrame": 60}]},
                {"durationInFrames": 20, "lines": [{"text": "x", "startFrame": 0, "endFrame": 5}]},
            ],
        }
        self.assertEqual([ok for _, ok in qa.script_checks(manifest)][:3], [False, False, False])

    def test_script_checks_want_a_pause_before_the_follow_line(self):
        manifest = {
            "fps": 10,
            "scenes": [
                {"beat": "aftermath", "durationInFrames": 30, "lines": [{"text": " ".join(["w"] * 9), "startFrame": 3, "endFrame": 33}]},
                {"beat": "outro", "durationInFrames": 30, "lines": [{"text": "a b c", "startFrame": 0, "endFrame": 10}, {"text": "x", "startFrame": 12, "endFrame": 15}]},
            ],
        }
        self.assertEqual(dict(qa.script_checks(manifest))[f"pause before the follow line >= {qa.CTA_PAUSE_S}s"], False)

    def test_grid_rounds_rows_up(self):
        self.assertEqual(qa.grid(21, 7), (7, 3))
        self.assertEqual(qa.grid(22, 7), (7, 4))


if __name__ == "__main__":
    unittest.main()
