import unittest
from h2_p8p_discovery_export import encode_export, decode_export, EXPORT_CAP

A = 'a' * 64


class ExportTests(unittest.TestCase):
    def test_partial_invalid_record_preserved(self):
        records = [b'{"valid":true}', b'{"partial":']
        raw = encode_export(A, records, b'partial stderr')
        self.assertEqual(decode_export(raw, A), (records, b'partial stderr'))

    def test_maximum_fits(self):
        records = [b'x' * 131072] * 4
        report = b'y' * 65536
        raw = encode_export(A, records, report)
        self.assertLess(len(raw), EXPORT_CAP)
        self.assertEqual(decode_export(raw, A), (records, report))

    def test_alteration_rejected(self):
        raw = encode_export(A, [b'abc'], b'')
        with self.assertRaises(ValueError):
            decode_export(raw.replace(b'00.json', b'01.json'), A)
        with self.assertRaises(ValueError):
            decode_export(raw, 'b' * 64)

    def test_bounds(self):
        for records in ([b''] * 17, [b'x' * 131073], [b'x' * 131072] * 5):
            with self.assertRaises(ValueError):
                encode_export(A, records, b'')


if __name__ == '__main__':
    unittest.main()
