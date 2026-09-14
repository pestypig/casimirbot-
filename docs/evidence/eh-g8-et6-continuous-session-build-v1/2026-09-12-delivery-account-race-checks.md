# Account-link race and current source checks

O2/O3/O5 evidence under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

Extended the real HTTP fixture to remove the active account link during provider
verification. The repeated approval resolver rejects issuance with 403
pairing_account_link_required and preserves the grant count. This adds independent
account-link evidence to the prior device-trust and registration race cases;
environment membership/run races remain separately unverified.

The combined route, delivery repository/service and delivery contract selection
passes 39 tests. Scoped TypeScript checking uses repository compiler options with
delivery service, invitation service, delivery repository/service test and
migration 091 as roots; all loaded dependencies produce zero diagnostics. This
does not include a complete route-graph or whole-repository typecheck.

Current process inspection finds all six CasimirBot processes at the retained
release-onboarding-display-20260912 executable path, including prior main/service
PIDs 20528/20700. This is process identity only, not a fresh health/readiness or
artifact-content check. Current catalog still has Ready up and prompt submission
but lacks durable destination registration, pairing accept and pairing recover.
No restart, claim, human approval or provider message was requested.

The newer automatic-delivery work is source/fixture evidence and is not included
in that running package. Full original CS1–CS4, O1–O6 and ET6 acceptance remain
unfinished; no stage or dependency qualification is promoted here.
