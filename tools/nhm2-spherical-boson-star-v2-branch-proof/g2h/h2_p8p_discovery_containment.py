"""Closed transient-service plan and pure observed-property guard.

No service is created by this module. Startup must check unit absence before
one dispatch and bind the guarded entry file to the frozen source manifest.
"""
from h2_p8p_discovery_worker import worker_plan

PROPERTIES = ('Id', 'Type', 'ActiveState', 'SubState', 'MainPID', 'ControlGroup',
              'KillMode', 'SendSIGKILL', 'RuntimeMaxUSec', 'TimeoutStopUSec', 'Restart')


def unit_name(attempt):
    worker_plan('observe', attempt)
    return 'nhm2-discovery-' + attempt + '.service'


def service_plan(attempt):
    unit = unit_name(attempt)
    root = '/var/lib/nhm2-discovery-' + attempt
    return {'unit': unit, 'root': root,
            'argv': ['/usr/bin/systemd-run', '--unit=' + unit, '--wait', '--pipe',
                     '--service-type=exec', '--property=KillMode=control-group',
                     '--property=Restart=no',
                     '--property=SendSIGKILL=yes', '--property=RuntimeMaxSec=120s',
                     '--property=TimeoutStopSec=10s', '/usr/bin/python3', '-B',
                     root + '/h2_p8p_discovery_guarded_entry.py', '--session-once', attempt],
            'show_argv': ['/usr/bin/systemctl', 'show', unit, '--no-pager',
                          '--property=' + ','.join(PROPERTIES)]}


def verify_containment(attempt, properties, cgroup, pid):
    """Verify bounded raw systemctl and proc observations; no process execution."""
    unit = unit_name(attempt)
    if type(pid) is not int or pid <= 1:
        raise ValueError('containment_pid')
    if not isinstance(properties, bytes) or len(properties) > 4096:
        raise ValueError('containment_properties_cap')
    if not isinstance(cgroup, bytes) or len(cgroup) > 4096:
        raise ValueError('containment_cgroup_cap')
    fields = {}
    for line in properties.decode('ascii').splitlines():
        key, sep, value = line.partition('=')
        if not sep or key in fields or key not in PROPERTIES:
            raise ValueError('containment_properties_shape')
        fields[key] = value
    group = '/system.slice/' + unit
    expected = {'Id': unit, 'Type': 'exec', 'ActiveState': 'active', 'SubState': 'running',
                'MainPID': str(pid), 'ControlGroup': group, 'KillMode': 'control-group',
                'SendSIGKILL': 'yes', 'RuntimeMaxUSec': '2min', 'TimeoutStopUSec': '10s', 'Restart': 'no'}
    if fields != expected:
        raise ValueError('containment_properties_mismatch')
    if cgroup != ('0::' + group + '\n').encode('ascii'):
        raise ValueError('containment_membership')
    return {'unit': unit, 'pid': pid, 'cgroup': group, 'runtime_seconds': 120,
            'stop_seconds': 10, 'whole_tree_policy_observed': True,
            'cleanup_confirmed': False, 'authority': False}
