"""Local serial evidence audit; no guest/device/cloud execution."""
import base64
import hashlib
import json
from h2_p8p_discovery_serial import decode_frames
from h2_p8p_discovery_export import decode_export
from h2_p8p_discovery_accept import accept_envelope
from h2_p8p_discovery_diagnostic import INSTANCE, _pairs, _constant
from h2_p8p_discovery_containment import verify_containment
from h2_p8p_discovery_transport import encode_value


def parse(raw):
    return json.loads(raw, object_pairs_hook=_pairs, parse_constant=_constant)


def checked_capture(value, stdout_cap, stderr_cap):
    if (type(value.get('exit_code')) is not int or value['exit_code'] != 0
            or value.get('failure') is not None or value.get('leader_reaped') is not True
            or value.get('group_absent') is not True):
        raise ValueError('audit_capture_status')
    streams = []
    for key, cap in [('stdout', stdout_cap), ('stderr', stderr_cap)]:
        text = value.get(key)
        if not isinstance(text, str) or len(text) > ((cap + 2) // 3) * 4:
            raise ValueError('audit_capture_cap')
        raw = base64.b64decode(text, validate=True)
        if len(raw) > cap or base64.b64encode(raw).decode('ascii') != text:
            raise ValueError('audit_capture_encoding')
        streams.append(raw)
    return streams[0]


def audit_serial(contents, attempt, observed_instance):
    if observed_instance != INSTANCE or not isinstance(contents, bytes) or len(contents) > 1048576:
        raise ValueError('audit_identity_cap')
    prefix = ('NHM2_DISCOVERY_V1 ' + attempt + ' ').encode('ascii')
    frames = []
    for line in contents.splitlines(keepends=True):
        if line.startswith(prefix):
            if not line.endswith(b'\n'):
                raise ValueError('audit_unterminated_frame')
            frames.append(line[:-2] + b'\n' if line.endswith(b'\r\n') else line)
    records, report_raw = decode_export(decode_frames(attempt, frames), attempt)
    report = parse(report_raw)
    if report.get('attempt_id') != attempt or report.get('authority') is not False:
        raise ValueError('audit_report_identity')
    events = []
    previous = '0' * 64
    chain_failure = None
    for index, raw in enumerate(records):
        try:
            item = parse(raw)
            canonical = (json.dumps(item, sort_keys=True, separators=(',', ':'), ensure_ascii=True, allow_nan=False) + '\n').encode('ascii')
            if (canonical != raw or set(item) != {'sequence', 'previous_sha256', 'event'}
                    or type(item['sequence']) is not int or item['sequence'] != index
                    or item['previous_sha256'] != previous):
                raise ValueError('journal_binding')
            events.append(item['event'])
            previous = hashlib.sha256(raw).hexdigest()
        except (ValueError, TypeError, KeyError):
            chain_failure = 'partial_or_invalid_journal'
            break
    result = {'authenticated': True, 'helperId': INSTANCE, 'attempt': attempt,
              'mountAuthorized': False, 'recoveryAuthorized': False, 'scientificAuthority': False,
              'diagnosticComplete': False, 'failure': report.get('failure') or chain_failure,
              'journalRecords': len(records), 'journalValidPrefix': len(events),
              'serialSha256': hashlib.sha256(contents).hexdigest()}
    # Failures remain inspectable evidence, not a completed observation.
    if report.get('failure') is not None or chain_failure is not None:
        return result
    if report.get('service_stopped') is not True or report.get('cleanup_failure') is not None:
        raise ValueError('audit_service_stop')
    if report.get('stop_receipt', {}).get('cgroup_empty') is not True:
        raise ValueError('audit_cgroup_stop')
    stop = checked_capture(report['stop_receipt']['observation'], 1024, 512).splitlines()
    if len(stop) != 3 or set(stop) not in (
            {b'MainPID=0', b'ActiveState=inactive', b'LoadState=loaded'},
            {b'MainPID=0', b'ActiveState=failed', b'LoadState=loaded'},
            {b'MainPID=0', b'ActiveState=inactive', b'LoadState=not-found'}):
        raise ValueError('audit_stop_observation')
    guarded = parse(checked_capture(report['dispatch'], 32768, 4096))
    if guarded.get('failure') is not None or guarded.get('attempt_id') != attempt or guarded.get('authority') is not False:
        raise ValueError('audit_guarded_report')
    containment = verify_containment(attempt,
        checked_capture(guarded['guard_capture'], 4096, 1024),
        base64.b64decode(guarded['membership'], validate=True), guarded['containment']['pid'])
    if containment != guarded['containment']:
        raise ValueError('audit_containment')
    session = guarded['session']
    if (session.get('journal_complete') is not True or session.get('record_count') != len(records)
            or session.get('record_bytes') != sum(map(len, records))
            or session.get('tail_sha256') != previous or session.get('authority') is not False):
        raise ValueError('audit_session_binding')
    phases = [(e.get('phase'), e.get('kind')) for e in events]
    expected = [('session_begin', None), ('observe', 'intent'), ('observe', 'result'),
                ('guest_consistency', 'result'), ('publish', 'intent'), ('publish', 'result'),
                ('supervisor_terminal', 'provisional'), ('session_end', None)]
    if phases != expected:
        raise ValueError('audit_journal_sequence')
    if events[0].get('attempt_id') != attempt or events[-1].get('attempt_id') != attempt:
        raise ValueError('audit_journal_attempt')
    for index in [1, 2, 4, 5]:
        if events[index].get('attempt_id') != attempt:
            raise ValueError('audit_worker_attempt')
    raw = checked_capture(events[2]['result'], 65536, 8192)
    published_raw = checked_capture(events[5]['result'], 4096, 8192)
    for index, role, sent in [(2, '--observe-once', 0), (5, '--publish-once', len(raw))]:
        value = events[index]['result']
        if (value.get('role') != role or type(value.get('input_bytes_sent')) is not int
                or value['input_bytes_sent'] != sent):
            raise ValueError('audit_worker_identity')
    accepted = accept_envelope(raw, expected_attempt=attempt, observed_instance=INSTANCE)
    if events[3]['result'] != accepted:
        raise ValueError('audit_envelope_result')
    outcome = events[-1]['outcome']
    if (outcome != events[6]['result'] or outcome.get('failure') is not None
            or outcome.get('published') is not True or outcome.get('attempt_id') != attempt):
        raise ValueError('audit_publication_outcome')
    if session.get('outcome') != outcome:
        raise ValueError('audit_session_outcome')
    transport = encode_value(raw, attempt)
    ack = {'schema': 'nhm2-discovery-publication-v1', 'instance_id': INSTANCE,
           'attempt_id': attempt, 'namespace': transport['namespace'], 'key': 'receipt',
           'value_bytes': len(transport['value']), 'published': True}
    if published_raw != (json.dumps(ack, separators=(',', ':')) + '\n').encode('ascii'):
        raise ValueError('audit_publication_ack')
    result.update(diagnosticComplete=True, guestSucceeded=accepted['guestSucceeded'],
                  transportValueSha256=hashlib.sha256(transport['value'].encode('ascii')).hexdigest())
    return result
