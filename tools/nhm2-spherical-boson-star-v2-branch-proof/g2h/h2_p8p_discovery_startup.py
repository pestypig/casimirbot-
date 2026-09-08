"""Single-use outer guest lifecycle composition, without implicit execution.

Adapters must implement bounded service observation, serial emission and poweroff.
Cloud-side independently authenticated stop remains mandatory on every outcome.
"""
import base64
import json
from h2_p8p_discovery_containment import service_plan
from h2_p8p_discovery_export import encode_export
from h2_p8p_discovery_serial import serial_frames


class Startup:
    def __init__(self):
        self.used = False

    def run(self, attempt, *, absent, dispatch, stop_service, collect, emit, poweroff,
            stop_evidence=lambda: None):
        if self.used:
            raise RuntimeError('startup_consumed')
        self.used = True
        plan = service_plan(attempt)
        report = {'attempt_id': attempt, 'dispatch': None, 'service_stopped': False,
                  'failure': None, 'cleanup_failure': None, 'exported': False, 'authority': False}
        started = False
        try:
            if absent(plan['unit']) is not True:
                raise ValueError('unit_not_absent')
            started = True  # Ambiguous dispatch still requires stop.
            result = dispatch(plan)
            if (not isinstance(result, dict) or not isinstance(result.get('stdout'), bytes)
                    or len(result['stdout']) > 32768 or not isinstance(result.get('stderr'), bytes)
                    or len(result['stderr']) > 4096):
                raise ValueError('startup_capture_cap')
            report['dispatch'] = {**result,
                'stdout': base64.b64encode(result['stdout']).decode('ascii'),
                'stderr': base64.b64encode(result['stderr']).decode('ascii')}
            if result.get('exit_code') != 0 or result.get('failure') is not None:
                report['failure'] = 'service_execution_failed'
        except Exception as error:
            report['failure'] = type(error).__name__
        finally:
            records = []
            try:
                if started:
                    report['service_stopped'] = stop_service(plan['unit']) is True
                    if not report['service_stopped']:
                        report['failure'] = report['failure'] or 'service_stop_unconfirmed'
                # Never read a journal while its service might still be writing.
                records = collect(attempt) if report['service_stopped'] else []
            except Exception as error:
                report['cleanup_failure'] = type(error).__name__
                report['failure'] = report['failure'] or type(error).__name__
            try:
                report['stop_receipt'] = stop_evidence()
                summary = json.dumps(report, separators=(',', ':'), ensure_ascii=True).encode('ascii')
                if len(summary) > 65536:
                    raise ValueError('startup_report_cap')
                emit(serial_frames(attempt, encode_export(attempt, records, summary)))
                report['exported'] = True
            except Exception as error:
                report['failure'] = report['failure'] or type(error).__name__
            finally:
                try:
                    poweroff()
                except Exception as error:
                    report['failure'] = report['failure'] or type(error).__name__
        return report
