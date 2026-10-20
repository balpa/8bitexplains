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

    def test_holds_measure_how_long_a_picture_stays_put(self):
        rng = np.random.default_rng(0)
        still = rng.uniform(0, 255, (49, 45))
        frames = np.array([still] * 8 + [rng.uniform(0, 255, (49, 45)) for _ in range(4)])
        h = qa.holds(frames, fps=2)
        self.assertEqual(h[0], 3.5)
        self.assertEqual(h[8], 0.0)

    def test_holds_ignore_a_global_brightness_flash(self):
        rng = np.random.default_rng(1)
        still = rng.uniform(50, 150, (49, 45))
        frames = np.array([still, still * 1.6 + 20, still, still, rng.uniform(0, 255, (49, 45))])
        self.assertEqual(qa.holds(frames, fps=2)[0], 1.5)

    def test_long_holds_flag_stills_and_exempt_the_save_point(self):
        h = np.array([0.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5, 0.0, 0.0, 6.0, 5.5])
        self.assertEqual(qa.long_holds(h, until_s=6.0, fps=2), [(0.5, 4.5)])
        self.assertEqual(qa.long_holds(np.full(10, 0.5), until_s=5.0, fps=2), [])

    def test_long_holds_cut_a_still_at_the_save_point(self):
        h = np.array([0.0, 0.0, 6.0, 5.5, 5.0])
        self.assertEqual(qa.long_holds(h, until_s=2.0, fps=2), [])

    def test_short_lines_lists_lines_under_the_token_floor(self):
        manifest = {"scenes": [{"lines": [{"text": "That bang is thunder.", "tokens": 17}, {"text": "long enough", "tokens": 40}, {"text": "old manifest"}]}]}
        self.assertEqual(qa.short_lines(manifest), ["That bang is thunder."])

    def test_grid_rounds_rows_up(self):
        self.assertEqual(qa.grid(21, 7), (7, 3))
        self.assertEqual(qa.grid(22, 7), (7, 4))


if __name__ == "__main__":
    unittest.main()
