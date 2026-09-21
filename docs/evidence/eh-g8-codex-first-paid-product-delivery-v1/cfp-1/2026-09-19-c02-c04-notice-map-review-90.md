# CFP-1 C02–C04 notice-map review — 2026-09-19

The [local notice-byte map](2026-09-19-c02-c04-local-notice-byte-candidates-89.md)
adds nine exact local source/vendor/old-output hash candidates for sharp,
its Windows native package, electron-updater, Electron/Chromium and the pinned
tunnel client. A repeat local SHA-256 check found all nine hashes in the map.
An independent read-only reviewer checked package metadata, file bytes,
current stage/build selections and the old-output versus signed-release
boundary. It found one mistyped tunnel LICENSE hash; that value was corrected
and independently rechecked. The final bounded review returned **PASS**.

The current tunnel staging still selects the executable and vendor LICENSE,
while the local vendor NOTICE, third-party report and SPDX input are not in its
filter. This is a question for qualified notice review, **not** a conclusion
that every vendor file must be shipped. Local old unpacked output contains
sharp/native and Electron/Chromium license texts but is not the reserved signed
customer cohort. The full bundled module/native tree, product SBOM, required
notices and user-accessible presentation remain open for C02–C04 and C03.

The environment documentation audit returned `ok: true`, local links resolved
and `git diff --check` passed on touched tracked packets. Qualified rights
review and CFP-3 exact signed-artifact extraction remain required. CFP-1 stays
active (`specified`); CFP-2/3 remain blocked under the
[work program](../../../helix-environment-harness-work-program-v1.md).
