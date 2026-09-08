import unittest
from h2_p8p_discovery_startup import Startup

A = 'a' * 64


class StartupTests(unittest.TestCase):
    def test_stop_receipt_enters_export(self):
        from h2_p8p_discovery_serial import decode_frames
        from h2_p8p_discovery_export import decode_export
        import json
        exports = []
        self.run_case(stop_evidence=lambda: {'cgroup_empty': True}, emit=exports.append)
        records, raw = decode_export(decode_frames(A, exports[0]), A)
        self.assertEqual(json.loads(raw)['stop_receipt'], {'cgroup_empty': True})

    def test_stop_exception_exports_summary_without_collection(self):
        def stop(*args):
            raise OSError('stop')
        result = self.run_case(stop_service=stop)
        self.assertNotIn('collect', self.calls)
        self.assertIn('emit', self.calls)
        self.assertEqual(self.calls[-1], 'poweroff')
        self.assertEqual(result['cleanup_failure'], 'OSError')

    def test_collection_exception_exports_summary(self):
        def collect(*args):
            raise OSError('read')
        result = self.run_case(collect=collect)
        self.assertIn('emit', self.calls)
        self.assertEqual(self.calls[-1], 'poweroff')
        self.assertEqual(result['cleanup_failure'], 'OSError')

    def run_case(self, **overrides):
        self.calls = []
        def step(name, value):
            def call(*args):
                self.calls.append(name)
                return value
            return call
        adapters = dict(absent=step('absent', True),
                        dispatch=step('dispatch', {'stdout': b'partial', 'stderr': b'', 'exit_code': 1}),
                        stop_service=step('stop', True), collect=step('collect', [b'partial']),
                        emit=step('emit', None), poweroff=step('poweroff', None))
        adapters.update(overrides)
        return Startup().run(A, **adapters)

    def test_failure_capture_stops_before_collect_and_powers_off(self):
        result = self.run_case()
        self.assertEqual(self.calls, ['absent', 'dispatch', 'stop', 'collect', 'emit', 'poweroff'])
        self.assertTrue(result['exported'])
        self.assertFalse(result['authority'])

    def test_ambiguous_dispatch_still_stops(self):
        def dispatch(*args):
            raise OSError('lost')
        result = self.run_case(dispatch=dispatch)
        self.assertIn('stop', self.calls)
        self.assertEqual(self.calls[-1], 'poweroff')
        self.assertEqual(result['failure'], 'OSError')

    def test_uncertain_stop_prevents_collection(self):
        self.run_case(stop_service=lambda *args: False)
        self.assertNotIn('collect', self.calls)
        self.assertEqual(self.calls[-1], 'poweroff')

    def test_export_failure_still_powers_off(self):
        def emit(*args):
            raise OSError('serial')
        result = self.run_case(emit=emit)
        self.assertFalse(result['exported'])
        self.assertEqual(self.calls[-1], 'poweroff')


if __name__ == '__main__':
    unittest.main()
