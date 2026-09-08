"""Direct-archive binding of the bounded guest lifecycle; no run on import."""
import sys
import signal
from h2_p8p_hostkey_guest_main import main
from h2_p8p_direct_archive_linux import DirectArchiveOps
from h2_p8p_direct_archive import collect_archive
from h2_p8p_fixture_transport import run_and_export

if __name__=='__main__':
    if len(sys.argv)!=3:raise SystemExit('invalid_invocation')
    def cancel(signum,frame):raise RuntimeError('guest_cancelled')
    signal.signal(signal.SIGTERM,cancel);signal.signal(signal.SIGINT,cancel)
    run_and_export(sys.argv[1])  # failure prevents evidence discovery/mounting
    raise SystemExit(main(sys.argv[1],sys.argv[2],ops_factory=DirectArchiveOps,collector=collect_archive))
