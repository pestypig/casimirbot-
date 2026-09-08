"""Guest journal/supervisor binding, callable only inside bounded containment.

No CLI, cloud lifecycle, implicit worker dispatch, or acceptance promotion.
The startup caller must supply a trusted root and enforce whole-tree shutdown.
"""
import time
from h2_p8p_discovery_journal import Journal
from h2_p8p_discovery_supervisor import DiscoverySupervisor
from h2_p8p_discovery_worker import worker_plan


def run_session(attempt, root, *, worker, now=time.monotonic):
    worker_plan('observe', attempt)  # Validate identity before creating evidence.
    journal = Journal(root)
    journal({'phase': 'session_begin', 'attempt_id': attempt})
    outcome = DiscoverySupervisor().run(attempt, record=journal, worker=worker, now=now)
    # No completion marker can be emitted after uncertain persistence.
    if journal.failed:
        return {'attempt_id': attempt, 'journal_complete': False,
                'outcome': outcome, 'authority': False}
    journal({'phase': 'session_end', 'attempt_id': attempt, 'outcome': outcome})
    return {'attempt_id': attempt, 'journal_complete': True,
            'record_count': journal.count, 'record_bytes': journal.total,
            'tail_sha256': journal.previous, 'outcome': outcome, 'authority': False}
