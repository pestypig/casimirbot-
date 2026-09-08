Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral existing R39 evidence recovery
Capability or component: retained-helper-v2 result and mandatory transport-design review
Current maturity: Linux safety fixture passed; archive recovery failed before mount
Target maturity: evidence-backed disk-discovery diagnosis before any successor execution
Required frozen inputs: v2 manifest, 88 linked receipts, exact retained resource identities, archive hash
Required evidence: verified stop, actual selected-device inventory and specific discovery failure code
Stop/fail criteria: consumed execution; no retry, unknown inventory, identity or read-only mismatch
Explicit non-goals: new execution authority, numerical work, candidate evaluation, relaxed partition checks, retuning, deletion, G3/SI/metric/lane work, authority promotion
Downstream gate unlocked: local infrastructure diagnosis only; no scientific gate

# Result — 2026-09-06

The single approved execute-v2 invocation began at07:51:00.212Z. Its manifest
SHA-256 is b1d8c88aaca068638fb496985812df860c2963ee6a184289f6f51579bf0d28f3.
The attempt is consumed and must not be retried.

Independent review authenticated all88 receipts under
C:/NHM2-CV2-Retained-v2/evidence, ending at SHA-256
18b70b8a7cdadf62ef55f4dfc76a08258b674d66720ae7030122ffb88fc17716.
The recorded mutations were startup replacement, restart, one read-only
clone attachment, and stop. All seven real guest Linux safety checks passed.
The guest then exported a same-attempt ValueError with mount_attempted=false
and unmounted=true. No archive was published. The exact helper
2570241336417567358 was independently observed TERMINATED at07:53:47.082Z.
The read-only clone remains attached; do not assume it is detached for a
future preflight or detach it without authority. Original source resources
and consumed evidence remain preserved.

The receiver reported archive_receipt_fields because it rejects a failure
receipt as a successful archive receipt. This is not evidence of an incorrect
archive digest or corrupt archive contents: no archive bytes were recovered.
The full0.50USD/3600second reservation remains conservatively consumed, leaving
10.40USD/9600seconds within the aggregate charter. These are reservations, not
actual billing. Stopped retained storage can still incur charges.

# Mandatory design review before another execution

The previous fixture-path correction worked in the guest. The next blocker is
in discovery, not build arithmetic or the boson-star model. In the frozen
LinuxGuestOps.discover implementation, select_partition expects one disk
with nested children, but lsblk is called with PATH,TYPE,RO,FSTYPE,MAJ:MIN and
neither NAME nor --tree. This is a concrete producer/consumer format risk.
Debian Bookworm's util-linux2.38.1 manual recommends explicit --tree where
needed for JSON and states that selected columns affect tree formatting:
https://manpages.debian.org/bookworm/util-linux/lsblk.8.en.html

The recovered receipt includes only the exception class, not the lsblk data
or precise ValueError message. Therefore the exact cause of this execution
remains unproved. Potential discovery checks include block identity/mode,
inventory shape, supported partitions and unique filesystem selection. Do not
label the failure a proven tree-format error or weaken those checks.

Highest-value next preparation:

1. Define a bounded read-only discovery diagnostic that captures only the
   exact attached clone's lsblk version, exact command and capped inventory;
   bind the response to instance, device alias and a fresh attempt identity.
2. Preserve a closed, specific discovery failure code and phase instead of
   reducing all expected validation failures to ValueError. Preserve failure
   receipts explicitly without granting them success authority.
3. Compare explicit-tree command semantics with the captured inventory;
   retain all exact device, partition, filesystem and kernel read-only gates.
   Test malformed, flat, multiple-filesystem, writable and substituted-device
   cases. A mock fixture alone cannot establish the actual guest output.
4. Review the remaining discovery/mount/export path together before proposing
   another recovery, so each attempt need not rediscover one unobserved guard.
5. Any successor must account for the now-attached read-only clone, preserve
   current resources/files, use fresh diagnostic paths, and obtain the required
   bounded restart authority. The consumed approval does not cover another
   restart. No new resource, mount, numerical or deletion authority is granted
   by this document.

No successor was prepared or executed in this review. No scientific definition
or frozen execution source was changed after preparation.
