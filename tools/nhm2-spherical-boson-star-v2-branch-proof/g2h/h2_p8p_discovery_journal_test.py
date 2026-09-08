import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from h2_p8p_discovery_journal import Journal


class JournalTests(unittest.TestCase):
    def test_parent_sync_failure_leaves_exclusive_root(self):
        with tempfile.TemporaryDirectory() as parent:
            root = Path(parent) / 'capture'
            with patch.object(Journal, '_sync_directory', side_effect=OSError('parent_sync')) as sync:
                with self.assertRaises(OSError):
                    Journal(root)
                sync.assert_called_once_with(root.parent)
            self.assertTrue(root.is_dir())
            with self.assertRaises(FileExistsError):
                Journal(root)

    def test_chain(self):
        with tempfile.TemporaryDirectory() as root:
            journal = Journal(Path(root) / 'evidence')
            journal({'kind': 'intent'})
            journal({'kind': 'failure', 'partial': 'abc'})
            first = (journal.root / '00.json').read_bytes()
            second = json.loads((journal.root / '01.json').read_bytes())
            self.assertEqual(second['previous_sha256'], hashlib.sha256(first).hexdigest())
            self.assertEqual(second['sequence'], 1)
            self.assertEqual(journal.count, 2)

    def test_existing_root_preserved(self):
        with tempfile.TemporaryDirectory() as root:
            with self.assertRaises(FileExistsError):
                Journal(root)

    def test_cap_poison(self):
        with tempfile.TemporaryDirectory() as root:
            journal = Journal(Path(root) / 'evidence')
            with self.assertRaises(ValueError):
                journal({'data': 'x' * 131072})
            with self.assertRaises(RuntimeError):
                journal({})
            self.assertEqual(list(journal.root.iterdir()), [])

    def test_sync_failure_preserves_file(self):
        with tempfile.TemporaryDirectory() as root:
            journal = Journal(Path(root) / 'evidence')
            with patch('h2_p8p_discovery_journal.os.fsync', side_effect=OSError('disk')):
                with self.assertRaises(OSError):
                    journal({'failure': 'captured'})
            self.assertTrue((journal.root / '00.json').is_file())
            self.assertEqual(journal.count, 0)
            with self.assertRaises(RuntimeError):
                journal({})


if __name__ == '__main__':
    unittest.main()
