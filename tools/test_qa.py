import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import numpy as np
import pyloudnorm as pyln
from PIL import Image, ImageDraw

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

    def test_long_holds_report_the_longest_hold_inside_a_still_stretch(self):
        h = np.array([4.0, 5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5, 0.0, 0.0, 0.0])
        self.assertEqual(qa.long_holds(h, until_s=7.0, fps=2), [(0.5, 5.0)])

    def test_long_holds_cut_a_still_at_the_save_point(self):
        h = np.array([0.0, 0.0, 6.0, 5.5, 5.0])
        self.assertEqual(qa.long_holds(h, until_s=2.0, fps=2), [])

    def test_short_lines_lists_lines_under_the_token_floor(self):
        manifest = {"scenes": [{"lines": [{"text": "That bang is thunder.", "tokens": 17}, {"text": "long enough", "tokens": 40}, {"text": "old manifest"}]}]}
        self.assertEqual(qa.short_lines(manifest), ["That bang is thunder."])

    def test_grid_rounds_rows_up(self):
        self.assertEqual(qa.grid(21, 7), (7, 3))
        self.assertEqual(qa.grid(22, 7), (7, 4))


class QaMainTest(unittest.TestCase):
    AUDIO_SR = 16000
    DURATION_S = 50.0

    def setUp(self):
        self.manifest = {
            "id": "ep999",
            "fps": 30,
            "scenes": [
                {"visual": "a", "beat": "aftermath", "durationInFrames": 1350, "lines": [{"text": " ".join(["w"] * 90), "startFrame": 9, "endFrame": 909}]},
                {"visual": "b", "beat": "outro", "durationInFrames": 150, "lines": [{"text": "a b c", "startFrame": 0, "endFrame": 30}, {"text": "x y z", "startFrame": 60, "endFrame": 90}]},
            ],
        }

    def audio(self):
        n = int(self.DURATION_S * self.AUDIO_SR)
        t = np.arange(n) / self.AUDIO_SR
        mask = qa.speech_mask(self.manifest, n, self.AUDIO_SR)
        mono = np.sin(2 * np.pi * 440 * t) * np.where(mask, 0.1, 0.01)
        stereo = np.stack([mono, mono], axis=1)
        return pyln.normalize.loudness(stereo, pyln.Meter(self.AUDIO_SR).integrated_loudness(stereo), -14.0)

    def frames(self, still_from: int, still_count: int):
        rng = np.random.default_rng(2)
        frames = [rng.uniform(0, 255, (49, 45)) for _ in range(int(self.DURATION_S * qa.HOLD_FPS))]
        for k in range(still_from, still_from + still_count):
            frames[k] = frames[still_from]
        return np.array(frames)

    def run_main(self, frames):
        info = {"width": 1080, "height": 1920, "fps": 30.0, "video": "h264", "audio": "aac", "duration": self.DURATION_S}
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            manifest = out / "ep999.json"
            manifest.write_text(json.dumps(self.manifest))
            with (
                mock.patch.object(qa, "probe", return_value=info),
                mock.patch.object(qa, "tool"),
                mock.patch.object(qa.sf, "read", return_value=(self.audio(), self.AUDIO_SR)),
                mock.patch.object(qa, "motion_frames", return_value=frames),
                mock.patch.object(qa, "contact_sheet"),
                contextlib.redirect_stdout(io.StringIO()),
            ):
                code = qa.main(str(out / "ep999.mp4"), str(manifest))
            return code, (out / "ep999-qa.md").read_text().splitlines()

    def test_main_fails_a_still_before_the_save_point(self):
        code, report = self.run_main(self.frames(0, 12))
        self.assertIn("- [ ] no picture holds over 4s before the save point (longest 5.5s)", report)
        self.assertEqual(code, 1)

    def test_main_exempts_a_still_after_the_save_point(self):
        code, report = self.run_main(self.frames(90, 10))
        self.assertIn("- [x] no picture holds over 4s before the save point (longest 0.0s)", report)
        self.assertEqual(code, 0)

    def test_main_lists_long_holds_and_short_lines_under_warnings(self):
        self.manifest["scenes"][1]["lines"][0].update(text="Hi.", tokens=3)
        _, report = self.run_main(self.frames(0, 12))
        warnings = report[report.index("Warnings:") + 1:]
        self.assertIn("- picture holds 5.5s from 0.0s", warnings)
        self.assertIn("- short line, Kokoro may read it weakly: 'Hi.'", warnings)


class MotionFramesTest(unittest.TestCase):
    def test_motion_frames_drops_the_caption_band(self):
        def ffmpeg(name, *args):
            for k in range(3):
                frame = Image.new("L", (1080, 1920), 0)
                ImageDraw.Draw(frame).rectangle((0, 1180, 1079, 1919), fill=255)
                frame.save(args[-1] % (k + 1))
            return ""

        with mock.patch.object(qa, "tool", side_effect=ffmpeg) as tool:
            frames = qa.motion_frames(Path("ep999.mp4"))
        self.assertEqual(frames.shape, (3, 49, 45))
        self.assertEqual(frames.max(), 0)
        args = tool.call_args.args
        self.assertEqual(args[0], "ffmpeg")
        self.assertEqual(args[args.index("-r") + 1], str(qa.HOLD_FPS))


if __name__ == "__main__":
    unittest.main()
