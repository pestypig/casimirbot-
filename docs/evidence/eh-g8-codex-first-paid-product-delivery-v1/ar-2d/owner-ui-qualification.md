# AR-2D owner result-sharing qualification

Status: deterministically verified for the developer-owner UI and catalog; no installed or live acceptance.

## Implemented journey

The present developer owner opens Shared Live Room, refreshes the private task
report picker, selects a returned report, writes the explanation request and
checks the disclosure before clicking **Explain to room**. Checking the picker
does not call a model. It returns only the current mission's receipt metadata,
with account-link, owner, mission and exact durable source checks. No private
report text or provider credential is returned to the browser catalog.

The browser sends the existing AR-2C JSON request. Its request ID uses the exact
result reference; the server also binds the full selection, owner and question.
An unchanged retry, including after reopening the panel, therefore uses the same
Ask turn identity. Changing the question requires a fresh disclosure checkbox.
A synchronous submission lock prevents double-click duplicates. Unmount aborts
the browser request and prevents its late completion from reopening an old room;
this does not claim that every server operation can be undone by disconnecting.

Pending, uncertain and typed-failure responses do not become shared answers.
The owner UI waits for the existing room public-terminal projection. That panel
now displays the originating participant's name, or a former-member label when
the participant has left. Private HTTP answer text is never copied into that
public panel. An `unable` task report remains visibly unable rather than being
relabeled as task success.

The new catalog is bounded to the 20 most recent result candidates. A revoked or
unavailable current source fails closed; discovery is not durable permission to
run the later Ask. AR-2C rechecks permission before source use and publication.

## Validation

[Focused test report](focused-tests.json): **101/101 passed** across eight files.

| Surface | Observed deterministic result |
| --- | --- |
| Owner panel | 8/8: explicit selection/disclosure, actual request shape, unknown-outcome retry, double-click suppression, changed question, pending/failure, wrong-room response and unmount handling. |
| Catalog HTTP boundary | 19/19: metadata-only receipt, no-mission state, unauthorized users/guests, account locks, revoked links/missions/consent, cross-room/mission/event/profile and mid-read session changes. |
| Encrypted repository | 1/1: exact owner/room/mission/revision query isolation within the existing encrypted-result fixture. |
| Integrated mission/voice/HTTP/MCP | 24/24: extends the actual dispatch/result fixture through catalog discovery to the existing Ask/solver/publication path; private text appears in the fake provider prompt but never the browser catalog. |
| Existing AR-2C boundary | 40/40. |
| Public result, controls and dialog regressions | 9/9, including participant attribution. |
| Ask discipline quick check | Passed. The broader dirty tree triggers heuristic warnings; this patch adds source admission and presentation, not runtime reasoning. |
| Client/server builds | Both passed. Client: 3,339 modules, 43.18 seconds, with existing browsers-data/external-module/eval/chunk warnings. Server: four duplicate-key/case warnings in unchanged demonstration, halobank-solar and starsim files. No installed package was produced. |
| Documentation audit | Passed: G8 active, six backlink files, seven canonical targets, 40 capability rows and 14 acceptance claims; no failures. |

These are observed fixture pass fractions, not estimates of live-model success.
No paid provider call, live environment effect or deployment was performed.
Casimir physics verification does not apply to this nonphysics UI/read-only
catalog patch; no physics adapter or certificate integrity claim is made.

The [source snapshot](source-manifest.json) hashes the changed implementation
and fixture files. It records a dirty local tree, not a releasable commit.

## Installed/domain readiness

[Readiness snapshot](runtime-readiness.json) records safe metadata only:

- `https://casimirbot.com/` and the documented parity fingerprint endpoint
  returned HTTP 200. The domain reports compiled production commit
  `42c5b19b4be2a95d2d2de937ef9f550df8b6f2b4`, built September 1, 2026.
- The available `apps/desktop/release/win-unpacked` package's runtime manifest
  reports commit `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93`, generated September 21.
  It is not today's patched source. The retained September 20 NAV package was
  left untouched.
- No CasimirBot EXE process was running during inspection. No listener appeared
  on the checked development ports (3000, 5000, 5050, 5173, 5174, 8787); the
  localhost:5050 fingerprint request failed. This is not a scan of every possible
  service or proof that no alternative keyed origin exists.
- Browser automation could not initialize (`failed to write kernel assets`,
  path not found). Signed-in Chrome/Replit state and the actual UI were not
  inspected. Public domain reachability does not establish authenticated parity.

## Next admission

Prepare a fresh, explicitly identified developer EXE/runtime and compare its
artifact/source fingerprint with this tested tree. Start or reconnect the user's
approved keyed runtime, restore browser automation, and verify the owner room,
selected external mission, live exact-task association and a returned result.
The mission selection/dispatch journey still lacks its own browser UI; this
packet only exposes already-selected missions and their returned results.

Then exercise the installed result picker without a model call, followed by one
separately admitted provider-funded explanation and member observation. A domain
update must satisfy its clean-source/release/parity gate; the old production
deployment is not silently updated from this dirty working tree. Signing,
three-member capacity, provider economics, controlled live reasoning and full
AR-2/G8/CFP-1 acceptance remain open.
