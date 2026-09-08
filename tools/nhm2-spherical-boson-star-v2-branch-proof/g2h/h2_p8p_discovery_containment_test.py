import unittest
from h2_p8p_discovery_containment import service_plan, verify_containment

ATTEMPT = 'a' * 64


class ContainmentTests(unittest.TestCase):
    def setUp(self):
        self.plan = service_plan(ATTEMPT)
        self.group = '/system.slice/' + self.plan['unit']
        self.fields = {'Id': self.plan['unit'], 'Type': 'exec', 'ActiveState': 'active',
                       'SubState': 'running', 'MainPID': '123', 'ControlGroup': self.group,
                       'KillMode': 'control-group', 'SendSIGKILL': 'yes',
                       'RuntimeMaxUSec': '2min', 'TimeoutStopUSec': '10s', 'Restart': 'no'}
        self.cgroup = ('0::' + self.group + '\n').encode()

    def raw(self):
        return ''.join(k + '=' + v + '\n' for k, v in self.fields.items()).encode()

    def test_policy_is_not_cleanup(self):
        result = verify_containment(ATTEMPT, self.raw(), self.cgroup, 123)
        self.assertTrue(result['whole_tree_policy_observed'])
        self.assertFalse(result['cleanup_confirmed'])
        self.assertIn('--property=KillMode=control-group', self.plan['argv'])

    def test_each_property_is_required(self):
        for key in self.fields:
            with self.subTest(key=key):
                old = self.fields[key]
                self.fields[key] = 'wrong'
                with self.assertRaises(ValueError):
                    verify_containment(ATTEMPT, self.raw(), self.cgroup, 123)
                self.fields[key] = old

    def test_foreign_group_duplicate_and_cap(self):
        with self.assertRaises(ValueError):
            verify_containment(ATTEMPT, self.raw(), b'0::/other\n', 123)
        with self.assertRaises(ValueError):
            verify_containment(ATTEMPT, self.raw() + b'Type=exec\n', self.cgroup, 123)
        with self.assertRaises(ValueError):
            verify_containment(ATTEMPT, b'x' * 4097, self.cgroup, 123)


if __name__ == '__main__':
    unittest.main()
