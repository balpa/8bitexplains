import unittest

import numpy as np

import mix

SR = 48000


def tone(seconds: float, amp: float, freq: float = 440.0) -> np.ndarray:
    t = np.arange(int(seconds * SR)) / SR
    return amp * np.sin(2 * np.pi * freq * t)


class MixTest(unittest.TestCase):
    def test_gain_brings_signal_to_target_loudness(self):
        quiet = tone(3.0, 0.05)
        g = mix.gain_to(quiet, SR, -20.0)
        self.assertAlmostEqual(mix.loudness(quiet * g, SR), -20.0, places=1)

    def test_soft_limit_never_exceeds_ceiling_and_keeps_quiet_parts(self):
        loud = tone(0.5, 3.0)
        limited = mix.soft_limit(loud, 0.8)
        self.assertLessEqual(np.abs(limited).max(), 0.8)
        quiet = tone(0.5, 0.2)
        np.testing.assert_allclose(mix.soft_limit(quiet, 0.8), quiet)

    def test_lowpass_attenuates_high_frequencies_more_than_low(self):
        low = mix.lowpass(tone(0.2, 0.5, 200), SR, 2000)
        high = mix.lowpass(tone(0.2, 0.5, 12000), SR, 2000)
        self.assertGreater(np.abs(low[2000:]).max(), 3 * np.abs(high[2000:]).max())


if __name__ == "__main__":
    unittest.main()
