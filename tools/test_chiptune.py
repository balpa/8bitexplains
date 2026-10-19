import unittest

import numpy as np

import chiptune


class ChiptuneTest(unittest.TestCase):
    def test_note_frequencies(self):
        self.assertAlmostEqual(chiptune.freq("A4"), 440.0)
        self.assertAlmostEqual(chiptune.freq("A5"), 880.0)
        self.assertAlmostEqual(chiptune.freq("C4"), 261.63, places=2)

    def test_music_matches_requested_length_and_fades_out(self):
        audio = chiptune.music(5.0)
        self.assertEqual(len(audio), int(5.0 * chiptune.SR))
        self.assertEqual(audio[-1], 0.0)
        self.assertGreater(np.abs(audio).max(), 0.0)

    def test_place_ignores_clips_past_the_end(self):
        track = np.zeros(100)
        chiptune.place(track, np.ones(50), at=10.0)
        chiptune.place(track, np.ones(10**6), at=10.0)
        chiptune.place(track, np.ones(50), at=80 / chiptune.SR)
        self.assertEqual(track.sum(), 20.0)

    def test_sfx_are_non_empty_and_bounded(self):
        for name, clip in chiptune.sfx().items():
            self.assertGreater(len(clip), 0, name)
            self.assertLessEqual(np.abs(clip).max(), 1.0 + 1e-9, name)


if __name__ == "__main__":
    unittest.main()
