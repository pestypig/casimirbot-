import unittest
from h2_p8p_discovery_guarded_entry import run_guarded
import h2_p8p_discovery_containment_test as fixture_module
ATTEMPT = fixture_module.ATTEMPT


class GuardedTests(unittest.TestCase):
    def setUp(self):
        self.fixture = fixture_module.ContainmentTests()
        self.fixture.setUp()
        self.calls = []

    def capture(self, plan, payload):
        self.assertEqual(plan['seconds'], 5)
        return {'stdout': self.fixture.raw(), 'stderr': b'', 'failure': None,
                'exit_code': 0, 'leader_reaped': True, 'group_absent': True}

    def session(self, attempt, root, **kwargs):
        self.calls.append((attempt, root))
        return {'journal_complete': True}

    def test_verified_guard_admits_session(self):
        result = run_guarded(ATTEMPT, capture=self.capture,
                             membership=lambda: self.fixture.cgroup,
                             pid=lambda: 123, session=self.session)
        self.assertIsNone(result['failure'])
        self.assertEqual(len(self.calls), 1)
        self.assertTrue(self.calls[0][1].endswith('/evidence'))

    def test_wrong_policy_never_dispatches(self):
        self.fixture.fields['KillMode'] = 'process'
        result = run_guarded(ATTEMPT, capture=self.capture,
                             membership=lambda: self.fixture.cgroup,
                             pid=lambda: 123, session=self.session)
        self.assertEqual(self.calls, [])
        self.assertEqual(result['failure'], 'ValueError')
        self.assertIsNotNone(result['guard_capture'])

    def test_guard_timeout_preserves_output(self):
        def capture(*args):
            value = self.capture(*args)
            value.update(failure='worker_timeout', stdout=b'partial')
            return value
        result = run_guarded(ATTEMPT, capture=capture, session=self.session)
        self.assertEqual(self.calls, [])
        self.assertEqual(result['guard_capture']['stdout'], 'cGFydGlhbA==')


if __name__ == '__main__':
    unittest.main()
