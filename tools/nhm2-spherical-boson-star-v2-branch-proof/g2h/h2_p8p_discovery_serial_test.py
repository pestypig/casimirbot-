import unittest
from h2_p8p_discovery_serial import serial_frames, decode_frames
from h2_p8p_discovery_export import encode_export

A = 'a' * 64


class SerialTests(unittest.TestCase):
    def test_full_export_roundtrip_under_one_megabyte(self):
        raw = encode_export(A, [b'x' * 131072] * 4, b'y' * 65536)
        frames = serial_frames(A, raw)
        self.assertLess(sum(map(len, frames)), 1048576)
        self.assertEqual(decode_frames(A, frames), raw)

    def test_missing_duplicate_reordered_rejected(self):
        frames = serial_frames(A, b'x' * 5000)
        for altered in (frames[:-1], frames + [frames[-1]],
                        [frames[0], frames[2], frames[1]] + frames[3:]):
            with self.assertRaises(ValueError):
                decode_frames(A, altered)

    def test_wrong_attempt_and_changed_bytes(self):
        frames = serial_frames(A, b'abc')
        with self.assertRaises(ValueError):
            decode_frames('b' * 64, frames)
        frames[1] = frames[1].replace(b'abc', b'abd')
        with self.assertRaises(ValueError):
            decode_frames(A, frames)


if __name__ == '__main__':
    unittest.main()
