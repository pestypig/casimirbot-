import unittest
from types import SimpleNamespace
from unittest.mock import patch
from h2_p8p_discovery_native import Native, bounded_drain

A = 'a' * 64


class NativeTests(unittest.TestCase):
    def test_drain_restores_signal_on_success_and_failure(self):
        for fails in (False, True):
            calls = []
            signal = SimpleNamespace(ITIMER_REAL=0, SIGALRM=14,
                getitimer=lambda which: (0.0, 0.0), getsignal=lambda which: 'original',
                signal=lambda *args: calls.append(('handler', args)),
                setitimer=lambda *args: calls.append(('timer', args)))
            def drain(fd):
                if fails:
                    raise TimeoutError('simulated_alarm')
            with patch.dict('sys.modules', {'signal': signal, 'termios': SimpleNamespace(tcdrain=drain)}), \
                 patch('h2_p8p_discovery_native.time.monotonic', return_value=1):
                if fails:
                    with self.assertRaises(TimeoutError):
                        bounded_drain(1, 2)
                else:
                    bounded_drain(1, 2)
            self.assertEqual(calls[-2:], [('timer', (0, 0)), ('handler', (14, 'original'))])

    def setUp(self):
        self.calls = []
        self.outputs = []
        def capture(plan, payload):
            self.calls.append(plan)
            return {'stdout': self.outputs.pop(0), 'stderr': b'', 'exit_code': 0,
                    'failure': None, 'leader_reaped': True, 'group_absent': True}
        self.native = Native(A, capture=capture)

    def test_absence_requires_exact_marker(self):
        self.outputs = [b'LoadState=not-found\n', b'LoadState=loaded\n']
        self.assertTrue(self.native.absent(self.native.plan['unit']))
        self.assertFalse(self.native.absent(self.native.plan['unit']))

    def test_stop_requires_empty_cgroup(self):
        self.outputs = [b'', b'MainPID=0\nActiveState=inactive\nLoadState=loaded\n']
        with patch('h2_p8p_discovery_native.cgroup_empty', return_value=False):
            self.assertFalse(self.native.stop_service(self.native.plan['unit']))

    def test_stop_success(self):
        self.outputs = [b'', b'MainPID=0\nActiveState=failed\nLoadState=loaded\n']
        with patch('h2_p8p_discovery_native.cgroup_empty', return_value=True):
            self.assertTrue(self.native.stop_service(self.native.plan['unit']))

    def test_failed_stop_still_observes_unloaded(self):
        def capture(plan, payload):
            self.calls.append(plan)
            stop = 'stop' in plan['argv']
            return {'stdout': b'' if stop else b'MainPID=0\nActiveState=inactive\nLoadState=not-found\n',
                    'stderr': b'', 'exit_code': 5 if stop else 0,
                    'failure': 'worker_nonzero' if stop else None,
                    'leader_reaped': True, 'group_absent': True}
        native = Native(A, capture=capture)
        with patch('h2_p8p_discovery_native.cgroup_empty', return_value=True):
            self.assertTrue(native.stop_service(native.plan['unit']))
        self.assertEqual(len(self.calls), 2)
        self.assertEqual(native.stop_receipt['command']['exit_code'], 5)

    def test_substitution_no_dispatch(self):
        with self.assertRaises(ValueError):
            self.native.dispatch({})
        self.assertEqual(self.calls, [])

    def test_poweroff_is_bounded_request(self):
        self.outputs = [b'']
        self.native.poweroff()
        self.assertEqual(self.calls[0]['seconds'], 5)
        self.assertEqual(self.calls[0]['argv'], ['/usr/bin/systemctl', 'poweroff', '--no-block'])


if __name__ == '__main__':
    unittest.main()
