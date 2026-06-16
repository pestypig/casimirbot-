# Interface Localization Contract

This contract freezes the Account tab pilot as the pattern for expanding interface localization across workstation panels.

## Scope

English is the canonical source UI. Every user-facing interface string that moves into localization must have:

- a stable message ID
- a default English message
- a description and context
- placeholder metadata when the string interpolates values
- an explicit surface tag when it belongs to a known UI surface

Target language catalogs may be procedural and incomplete while marked as such. Fallback to English is allowed, but fallback must remain observable through the interface i18n debug channel.

## Account Tab Baseline

The Account tab is the first complete pilot surface. Its catalog covers static labels, helper text, empty states, buttons, compact status labels, security boundary labels, and known display states.

Known backend state values must render through a display-name mapping layer, not inline string replacement in JSX. Unknown backend values may fall back to the raw value so diagnostics are not hidden.

The following values intentionally stay raw:

- profile IDs, account IDs, session IDs, archive IDs, job IDs, token prefixes, and URLs
- user-entered labels, titles, names, email addresses, objectives, summaries, and timestamps
- unknown backend enum values that have no display mapping yet

## Product Terms

Do not translate product and platform terms unless the glossary says they are approved for that locale. Current retained terms include profile, workstation, Ingress, API, server, token, Discord, Google, Minehut, Helix, and Helix Ask.

## Expansion Rules

For each new workstation panel:

1. Extract visible UI copy into `client/src/lib/i18n/messages/source.ts`.
2. Add target catalog entries to the locale catalog.
3. Keep English complete by construction through `enMessages`.
4. Add switch or map-based display labels for known enum/status values.
5. Leave raw IDs, URLs, timestamps, and user-authored content raw.
6. Add focused component or resolver tests for the panel's localized rendering.
7. Run `npm run i18n:check` and the focused tests for the edited surface.

Avoid live runtime machine translation for product UI. Candidate translations can be machine-assisted, but committed product text must go through the catalog pipeline and remain reviewable.
