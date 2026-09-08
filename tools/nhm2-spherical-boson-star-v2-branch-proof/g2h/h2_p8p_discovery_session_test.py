import json
import tempfile
import unittest
from pathlib import Path
from h2_p8p_discovery_session import run_session
import h2_p8p_discovery_supervisor_test as fixture_module
ATTEMPT = fixture_module.ATTEMPT


class SessionTests(unittest.TestCase):
    def setUp(self):
        self.fixture = fixture_module.SupervisorTests()
        self.fixture.setUp()

    def test_real_journal_injected_success(self):
        with tempfile.TemporaryDirectory() as parent:
            root = Path(parent) / 'capture'
            result = run_session(ATTEMPT, root, worker=self.fixture.worker)
            self.assertTrue(result['journal_complete'])
            self.assertTrue(result['outcome']['published'])
            self.assertFalse(result['authority'])
            self.assertEqual(result['record_count'], 8)
            self.assertEqual(len(list(root.iterdir())), 8)
            with self.assertRaises(FileExistsError):
                run_session(ATTEMPT, root, worker=self.fixture.worker)
            self.assertEqual(self.fixture.calls, ['observe', 'publish'])

    def test_partial_failure_is_durable_without_publish(self):
        def worker(*args):
            value = self.fixture.worker(*args)
            value.update(stdout=b'partial', failure='worker_timeout')
            return value
        with tempfile.TemporaryDirectory() as parent:
            root = Path(parent) / 'capture'
            result = run_session(ATTEMPT, root, worker=worker)
            self.assertTrue(result['journal_complete'])
            self.assertFalse(result['outcome']['published'])
            captured = json.loads((root / '02.json').read_bytes())
            self.assertEqual(captured['event']['result']['stdout'], 'cGFydGlhbA==')
            self.assertEqual(self.fixture.calls, ['observe'])


if __name__ == '__main__':
    unittest.main()
