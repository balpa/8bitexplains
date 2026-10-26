import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import numpy as np

import tts


class GapsTest(unittest.TestCase):
    def test_outro_holds_a_beat_for_the_loop_title(self):
        scene = {"beat": "outro", "vo": ["And that's why"]}
        self.assertEqual(tts.gaps_after(scene), [tts.LOOP_HOLD_S])

    def test_other_scenes_use_the_normal_gap(self):
        scene = {"beat": "how", "vo": ["One.", "Two."]}
        self.assertEqual(tts.gaps_after(scene), [tts.GAP_S, tts.GAP_S])


class CoverTest(unittest.TestCase):
    SCENES = [{"visual": "a-hook", "durationInFrames": 90}, {"visual": "a-peak", "durationInFrames": 60}]

    def test_a_frame_inside_the_scene_passes(self):
        tts.check_cover({"title": "X", "scene": "a-peak", "t": 1.9}, self.SCENES)

    def test_an_unknown_scene_is_rejected(self):
        with self.assertRaises(ValueError):
            tts.check_cover({"title": "X", "scene": "a-peek", "t": 1.0}, self.SCENES)

    def test_a_time_past_the_scene_end_is_rejected(self):
        with self.assertRaises(ValueError):
            tts.check_cover({"title": "X", "scene": "a-peak", "t": 2.0}, self.SCENES)


class MainTest(unittest.TestCase):
    PHONEMES = {"Hello there.": "həlˈoʊ ðˈɛɹ.", "Hi.": "hˈaɪ.", "Follow Eight Bit Explains.": "fˈɑːloʊ ˈeɪt bˈɪt ɛksplˈeɪnz."}

    def test_main_stores_the_phoneme_token_count_of_every_line(self):
        episode = {"id": "ep999", "title": "t", "voice": "am_michael", "speed": 1.2, "scenes": [
            {"beat": "hook", "vo": ["Hello there."]},
            {"beat": "outro", "vo": ["Hi.", "Follow Eight Bit Explains."]},
        ]}
        kokoro = mock.Mock()
        kokoro.create.return_value = (np.zeros(2400, dtype=np.float32), 24000)
        kokoro.tokenizer.phonemize.side_effect = lambda text, lang: self.PHONEMES[text] if lang == "en-us" else ""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "ep999.json").write_text(json.dumps(episode))
            with (
                mock.patch.object(tts, "ROOT", root),
                mock.patch.object(tts, "Kokoro", return_value=kokoro),
                mock.patch.object(tts, "EspeakConfig"),
                mock.patch.object(tts, "espeak_data_path", return_value="data"),
                contextlib.redirect_stdout(io.StringIO()),
            ):
                tts.main(str(root / "ep999.json"))
            manifest = json.loads((root / "remotion" / "src" / "generated" / "ep999.json").read_text())
        tokens = [(l["text"], l["tokens"]) for s in manifest["scenes"] for l in s["lines"]]
        self.assertEqual(tokens, [(text, len(phonemes)) for text, phonemes in self.PHONEMES.items()])


class MainCoverTest(unittest.TestCase):
    def run_main(self, cover):
        episode = {"id": "ep999", "title": "t", "voice": "am_michael", "speed": 1.2, "cover": cover, "scenes": [
            {"visual": "a-hook", "beat": "hook", "vo": ["Hello there."]},
            {"visual": "a-peak", "beat": "peak", "vo": ["Hi."]},
        ]}
        kokoro = mock.Mock()
        kokoro.create.return_value = (np.zeros(2400, dtype=np.float32), 24000)
        kokoro.tokenizer.phonemize.return_value = "hˈaɪ."
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "ep999.json").write_text(json.dumps(episode))
            with (
                mock.patch.object(tts, "ROOT", root),
                mock.patch.object(tts, "Kokoro", return_value=kokoro),
                mock.patch.object(tts, "EspeakConfig"),
                mock.patch.object(tts, "espeak_data_path", return_value="data"),
                contextlib.redirect_stdout(io.StringIO()),
            ):
                tts.main(str(root / "ep999.json"))
            return json.loads((root / "remotion" / "src" / "generated" / "ep999.json").read_text())

    def test_main_copies_the_cover_into_the_manifest(self):
        cover = {"title": "Why?", "scene": "a-peak", "t": 0.5}
        manifest = self.run_main(cover)
        self.assertEqual(manifest["cover"], cover)

    def test_main_rejects_a_cover_time_outside_its_scene(self):
        with self.assertRaises(ValueError):
            self.run_main({"title": "Why?", "scene": "a-peak", "t": 2.0})
