import unittest

import tts


class GapsTest(unittest.TestCase):
    def test_outro_pauses_before_the_follow_line(self):
        scene = {"beat": "outro", "vo": ["Takeaway.", "Follow Eight Bit Explains."]}
        self.assertEqual(tts.gaps_after(scene), [tts.OUTRO_PAUSE_S, tts.GAP_S])

    def test_other_scenes_use_the_normal_gap(self):
        scene = {"beat": "how", "vo": ["One.", "Two."]}
        self.assertEqual(tts.gaps_after(scene), [tts.GAP_S, tts.GAP_S])
