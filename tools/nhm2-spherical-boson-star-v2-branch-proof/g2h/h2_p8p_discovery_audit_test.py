import json
import unittest
import base64
import hashlib
import tempfile
from pathlib import Path
import h2_p8p_discovery_supervisor_test as supervisor_fixture
import h2_p8p_discovery_containment_test as containment_fixture
from h2_p8p_discovery_session import run_session
from h2_p8p_discovery_containment import verify_containment
from h2_p8p_discovery_audit import audit_serial
from h2_p8p_discovery_export import encode_export
from h2_p8p_discovery_serial import serial_frames
from h2_p8p_discovery_diagnostic import INSTANCE

A = 'a' * 64


class AuditTests(unittest.TestCase):
    def success_fixture(self, mutate=None):
        attempt = supervisor_fixture.ATTEMPT
        f = supervisor_fixture.SupervisorTests(); f.setUp()
        def worker(role, *args):
            result = f.worker(role, *args)
            result['role'] = '--' + role + '-once'
            return result
        with tempfile.TemporaryDirectory() as parent:
            root = Path(parent) / 'evidence'
            session = run_session(attempt, root, worker=worker)
            events = [json.loads(p.read_bytes())['event'] for p in sorted(root.iterdir())]
        if mutate:
            mutate(events)
        records = []; previous = '0' * 64
        for index, event in enumerate(events):
            raw = (json.dumps({'sequence': index, 'previous_sha256': previous, 'event': event}, sort_keys=True,
                              separators=(',', ':'), ensure_ascii=True) + '\n').encode()
            records.append(raw); previous = hashlib.sha256(raw).hexdigest()
        session.update(tail_sha256=previous, record_bytes=sum(map(len, records)))
        def capture(raw):
            return {'stdout': base64.b64encode(raw).decode(), 'stderr': '', 'exit_code': 0,
                    'failure': None, 'leader_reaped': True, 'group_absent': True}
        c = containment_fixture.ContainmentTests(); c.setUp()
        props = c.raw().replace(containment_fixture.ATTEMPT.encode(), attempt.encode())
        membership = c.cgroup.replace(containment_fixture.ATTEMPT.encode(), attempt.encode())
        guarded = {'attempt_id': attempt, 'failure': None, 'authority': False, 'session': session,
                   'guard_capture': capture(props), 'membership': base64.b64encode(membership).decode(),
                   'containment': verify_containment(attempt, props, membership, 123)}
        report = {'attempt_id': attempt, 'authority': False, 'failure': None, 'cleanup_failure': None,
                  'service_stopped': True, 'dispatch': capture(json.dumps(guarded).encode()),
                  'stop_receipt': {'cgroup_empty': True, 'observation': capture(b'MainPID=0\nActiveState=inactive\nLoadState=loaded\n')}}
        return attempt, records, report

    def framed(self, attempt, records, report):
        return b''.join(serial_frames(attempt, encode_export(attempt, records, json.dumps(report).encode())))

    def test_complete_synthetic_success(self):
        attempt, records, report = self.success_fixture()
        self.assertTrue(audit_serial(self.framed(attempt, records, report), attempt, INSTANCE)['diagnosticComplete'])

    def test_rehashed_failed_workers_rejected(self):
        for index in [2, 5]:
            for key, value in [('failure', 'worker_timeout'), ('exit_code', True), ('leader_reaped', False), ('group_absent', False)]:
                with self.subTest(index=index, key=key):
                    attempt, records, report = self.success_fixture(lambda events: events[index]['result'].update({key: value}))
                    with self.assertRaises(ValueError):
                        audit_serial(self.framed(attempt, records, report), attempt, INSTANCE)

    def test_stop_observation_failure_rejected(self):
        attempt, records, report = self.success_fixture()
        report['stop_receipt']['observation']['exit_code'] = 1
        with self.assertRaises(ValueError):
            audit_serial(self.framed(attempt, records, report), attempt, INSTANCE)

    def serial(self, failure, records=None):
        report = {'attempt_id': A, 'authority': False, 'failure': failure}
        return b''.join(serial_frames(A, encode_export(A, records or [], json.dumps(report).encode())))

    def test_failure_evidence_is_not_complete(self):
        result = audit_serial(self.serial('OSError', [b'partial']), A, INSTANCE)
        self.assertFalse(result['diagnosticComplete'])
        self.assertEqual(result['journalValidPrefix'], 0)

    def test_missing_stop_cannot_pass(self):
        with self.assertRaises(ValueError):
            audit_serial(self.serial(None), A, INSTANCE)

    def test_wrong_instance_and_missing_tail_rejected(self):
        with self.assertRaises(ValueError):
            audit_serial(self.serial('failure'), A, 'other')
        with self.assertRaises(ValueError):
            audit_serial(self.serial('failure').rsplit(b'\n', 2)[0], A, INSTANCE)


if __name__ == '__main__':
    unittest.main()
