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
                {"beat": "outro", "durationInFrames": 30, "lines": [{"text": "and that's why", "startFrame": 0, "endFrame": 10}]},
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

    def test_script_checks_reject_a_follow_line_and_a_closed_last_line(self):
        manifest = {
            "fps": 10,
            "scenes": [
                {"beat": "aftermath", "durationInFrames": 30, "lines": [{"text": " ".join(["w"] * 9), "startFrame": 3, "endFrame": 33}]},
                {"beat": "outro", "durationInFrames": 30, "lines": [{"text": "a b c.", "startFrame": 0, "endFrame": 10}, {"text": "Follow Eight Bit Explains.", "startFrame": 12, "endFrame": 25}]},
            ],
        }
        checks = dict(qa.script_checks(manifest))
        self.assertFalse(checks["outro is one takeaway line, no follow line"])
        self.assertFalse(checks["last line ends open, so the first line completes it on replay"])

    def test_life_stats_measure_motion_brightness_and_the_darkest_scene(self):
        frames = np.array([np.full((480, 270), v, float) for v in (100, 120, 100, 40, 20)])
        stats = qa.life_stats(frames, [0.0, 3.0])
        self.assertAlmostEqual(stats["motion"], 30.0)
        self.assertAlmostEqual(stats["luma"], 76.0)
        self.assertAlmostEqual(stats["darkest_scene"], 30.0)
        self.assertAlmostEqual(stats["loop"], 80.0)

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

    def test_sheet_times_stop_short_of_the_last_frame(self):
        self.assertEqual(qa.sheet_times(58.77)[-1], 56.25)

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
                {"visual": "b", "beat": "outro", "durationInFrames": 150, "lines": [{"text": "a b c and so", "startFrame": 0, "endFrame": 30}]},
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

    def life(self, loop_end=100.0):
        rng = np.random.default_rng(3)
        frames = rng.uniform(60, 140, (int(self.DURATION_S), 480, 270))
        frames[-1] = frames[0] + (loop_end - 100.0)
        return frames

    def look(self, sat=200, subject=True):
        frames = np.zeros((int(self.DURATION_S), 480, 270, 3), dtype=np.uint8)
        frames[..., 0], frames[..., 1], frames[..., 2] = 20, 200, 230
        for k, colour in enumerate([(40, 120, 220), (30, 160, 90), (20, 90, 60), (200, 230, 250), (100, 60, 200), (250, 220, 40), (240, 100, 120), (60, 40, 100)]):
            frames[:, 380 + k * 12:392 + k * 12] = colour
        if subject:
            frames[:, 120:360, 50:220] = (255, 140, 40)
        if sat < 100:
            frames[:] = 128
        return frames

    def run_main(self, frames, life=None, look=None):
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
                mock.patch.object(qa, "life_frames", return_value=self.life() if life is None else life),
                mock.patch.object(qa, "color_frames", return_value=self.look() if look is None else look),
                mock.patch.object(qa, "contact_sheet"),
                contextlib.redirect_stdout(io.StringIO()),
            ):
                code = qa.main(str(out / "ep999.mp4"), str(manifest))
            return code, (out / "ep999-qa.md").read_text().splitlines()

    def test_main_fails_a_still_before_the_outro(self):
        code, report = self.run_main(self.frames(0, 12))
        self.assertIn("- [ ] no picture holds over 4s before the outro (longest 5.5s)", report)
        self.assertEqual(code, 1)

    def test_main_exempts_a_still_in_the_outro(self):
        code, report = self.run_main(self.frames(90, 10))
        self.assertIn("- [x] no picture holds over 4s before the outro (longest 0.0s)", report)
        self.assertEqual(code, 0)

    def test_main_checks_motion_brightness_and_the_loop(self):
        code, report = self.run_main(self.frames(90, 10))
        self.assertEqual(code, 0)
        self.assertTrue(any(l.startswith("- [x] motion ") for l in report))
        self.assertTrue(any(l.startswith("- [x] brightness ") for l in report))
        self.assertTrue(any(l.startswith("- [x] last frame returns to frame 0 ") for l in report))

    def test_main_fails_a_dark_still_render_that_does_not_loop(self):
        dark = np.full((int(self.DURATION_S), 480, 270), 20.0)
        dark[-1] = 200.0
        code, report = self.run_main(self.frames(90, 10), dark)
        self.assertEqual(code, 1)
        self.assertTrue(any(l.startswith("- [ ] motion ") for l in report))
        self.assertTrue(any(l.startswith("- [ ] brightness ") for l in report))
        self.assertTrue(any(l.startswith("- [ ] last frame returns to frame 0 ") for l in report))

    def test_main_checks_the_v4_look_only_for_v4_episodes(self):
        _, report = self.run_main(self.frames(90, 10))
        self.assertFalse(any("v4 look" in l for l in report))
        self.manifest["look"] = "v4"
        code, report = self.run_main(self.frames(90, 10), self.life() + 40)
        self.assertEqual(code, 0)
        self.assertTrue(any(l.startswith("- [x] v4 look: saturation ") for l in report))
        self.assertTrue(any(l.startswith("- [x] v4 look: colour areas ") for l in report))
        self.assertTrue(any(l.startswith("- [x] brightness ") and ">= 85" in l for l in report))

    def test_main_fails_a_grey_v4_episode_without_a_subject(self):
        self.manifest["look"] = "v4"
        code, report = self.run_main(self.frames(90, 10), self.life() - 40, self.look(sat=0, subject=False))
        self.assertEqual(code, 1)
        self.assertTrue(any(l.startswith("- [ ] v4 look: saturation ") for l in report))
        self.assertTrue(any(l.startswith("- [ ] v4 look: colour areas ") for l in report))
        self.assertTrue(any(l.startswith("- [ ] brightness ") and ">= 85" in l for l in report))

    def test_main_lists_long_holds_and_short_lines_under_warnings(self):
        self.manifest["scenes"][1]["lines"][0].update(text="Hi.", tokens=3)
        _, report = self.run_main(self.frames(0, 12))
        warnings = report[report.index("Warnings:") + 1:]
        self.assertIn("- picture holds 5.5s from 0.0s", warnings)
        self.assertIn("- short line, Kokoro may read it weakly: 'Hi.'", warnings)


class LookStatsTest(unittest.TestCase):
    def test_look_stats_measure_saturation(self):
        frame = np.zeros((480, 270, 3), dtype=np.uint8)
        frame[:] = (20, 200, 230)
        frame[120:360, 50:220] = (255, 140, 40)
        stats = qa.look_stats(np.array([frame, frame]))
        self.assertGreater(stats["saturation"], 200)

    def test_look_stats_count_colour_areas_so_a_flat_ground_scores_low(self):
        flat = np.zeros((480, 270, 3), dtype=np.uint8)
        flat[:] = (20, 200, 230)
        flat[120:360, 50:220] = (255, 140, 40)
        layered = flat.copy()
        for k, colour in enumerate([(40, 120, 220), (30, 160, 90), (20, 90, 60), (200, 230, 250), (100, 60, 200), (250, 220, 40)]):
            layered[360 + k * 20:380 + k * 20] = colour
        layered[0:4] = (255, 255, 255)
        self.assertEqual(qa.look_stats(flat[None])["areas"], 2)
        self.assertEqual(qa.look_stats(layered[None])["areas"], 8)


class LifeFramesTest(unittest.TestCase):
    def test_life_frames_are_whole_grey_frames_at_one_fps(self):
        def ffmpeg(name, *args):
            for k in range(2):
                Image.new("L", (1080, 1920), 200).save(args[-1] % (k + 1))
            return ""

        with mock.patch.object(qa, "tool", side_effect=ffmpeg) as tool:
            frames = qa.life_frames(Path("ep999.mp4"))
        self.assertEqual(frames.shape, (2, 480, 270))
        self.assertEqual(frames.min(), 200)
        args = tool.call_args.args
        self.assertEqual(args[args.index("-r") + 1], "1")


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
