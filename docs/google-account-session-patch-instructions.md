# Google Account Session Patch Instructions

## Goal

Migrate CasimirBot account entry from the retired demo sign-in pattern to a Google Identity Services web-auth flow while keeping the existing Account Session / Workstation panel as the user-facing profile hub.

The account model must be:

```text
Google account verification
  -> CasimirBot profile session
  -> explicit profile-scoped workstation memory
```

Do not store Google passwords, ask agents to collect credentials, or use email as the durable account identifier.

## Current Repo Anchors

- `client/src/pages/sign-in.tsx` is a compatibility handoff only. It must not block the site or host the primary sign-in UI.
- `client/src/lib/auth/session.ts` stores the demo browser user under `helix:demo-user`; this should become a compatibility shim or be retired after server-backed account session is authoritative.
- `client/src/components/workstation/AccountSessionPanel.tsx` is the account/profile panel that should remain the visible profile hub.
- `server/routes/account-session.ts` exposes `/api/account/session`, local dev sign-in/sign-out, and profile-ingress token actions.
- `server/services/helix-account/account-session-store.ts` already declares the production boundary: web/OAuth handoff, no raw password storage, and no agent credential collection.
- `shared/helix-account-session.ts` already supports `auth_mode: "web_auth" | "local_dev_profile"`.
- `client/src/store/useWorkstationSessionMemoryStore.ts` is browser-session-only memory and must not become silent profile memory.

## External Auth Rules

Use Google Identity Services for browser sign-in.

Official implementation anchors:

- Google Identity Services setup: `https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid`
- Server-side ID token verification: `https://developers.google.com/identity/gsi/web/guides/verify-google-id-token`
- JavaScript API reference: `https://developers.google.com/identity/gsi/web/reference/js-reference`

Required Google behavior:

- Configure an OAuth 2.0 Web application client ID.
- Add local and production Authorized JavaScript origins.
- Frontend uses `VITE_GOOGLE_CLIENT_ID`.
- Backend uses private `GOOGLE_CLIENT_ID` for audience verification.
- Load the Google Identity Services script from `https://accounts.google.com/gsi/client`.
- Receive the Google ID token from the `credential` field.
- Verify CSRF using Google's `g_csrf_token` double-submit cookie/body pattern when using the GIS credential post flow.
- Verify the ID token server-side using `google-auth-library`.
- Verify signature, audience, issuer, and expiry through the library.
- Use the ID token `sub` claim as the stable provider subject.
- Do not use email as the durable account key. Email can be profile metadata only.

## Patch Classification

Classify this patch as account/profile authentication and profile memory admission.

It is not a Helix Ask solver-runtime change. Do not add private model sampling, private tool execution, sandboxing, approval lifecycle, compaction, subagent orchestration, or terminal-completion machinery.

## Implementation Steps

1. Add environment configuration.

   Required variables:

   ```bash
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   VITE_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   SESSION_SECRET="replace-with-a-long-random-secret"
   ```

   `VITE_GOOGLE_CLIENT_ID` is public. `SESSION_SECRET` is private and must fail closed when missing in production.

2. Extend the shared account-session contract.

   In `shared/helix-account-session.ts`:

   - Add `"google"` to `HelixAccountLinkedAccount.provider`.
   - Add optional profile metadata:
     - `provider?: "google" | "local" | null`
     - `provider_subject?: string | null`
     - `picture_url?: string | null`
   - Keep `raw_password_stored: false`.
   - Keep `credential_collection_allowed_in_agents: false`.
   - Keep the recommended production flow as `web_auth_or_oauth_link`.

3. Add server-side web-auth session creation.

   In `server/services/helix-account/account-session-store.ts`:

   - Keep `signInLocalAccountSession` for local development.
   - Add `signInWebAccountSession`.
   - Require `provider: "google"` and a verified `provider_subject`.
   - Build the durable profile ID from the provider subject, for example `google:<sub>`.
   - Store email, display name, and picture URL as profile metadata only.
   - Set `auth_mode: "web_auth"` and `memory_scope: "profile"`.
   - Return the same receipt schema and explicitly preserve password-safety fields.

4. Add the Google auth route.

   Create a route such as `server/routes/google-auth.ts` and mount it under `/api/auth`.

   Required endpoints:

   - `POST /api/auth/google`
   - `POST /api/auth/google/sign-out`

   `POST /api/auth/google` must:

   - Reject requests when `GOOGLE_CLIENT_ID` is missing.
   - Read `credential` from the JSON body.
   - Read `g_csrf_token` from both body and cookie and require equality.
   - Call `OAuth2Client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID })`.
   - Reject missing or invalid `payload.sub`.
   - Call `signInWebAccountSession`.
   - Issue a CasimirBot-owned session cookie, not a long-lived Google token.
   - Use `httpOnly`, `sameSite: "lax"`, `secure` in production, and a bounded max age.

   `POST /api/auth/google/sign-out` must clear the app session cookie and sign out the account session.

5. Move account-session state off the process-global singleton before multi-user release.

   The current `activeSession` singleton is acceptable for local dev only. Production must use a per-user session boundary:

   - `express-session` plus a durable store, or
   - a signed internal JWT plus server-side profile lookup, or
   - another explicit session store.

   Do not ship a multi-user build where all browsers share one process-global `activeSession`.

6. Retire the `/sign-in` demo form as a blocking surface.

   In `client/src/pages/sign-in.tsx`:

   - Keep `/sign-in` as a backwards-compatible route.
   - Do not render a required sign-in page.
   - Set the pending desktop panel to `account-session`.
   - Route the user to `/desktop`, where the Account & Sessions panel hosts the sign-in feature.
   - Existing links to `/sign-in` must remain non-blocking and must not display a password or demo credential form.

7. Connect the Account Session / Workstation panel to the web session.

   In `AccountSessionPanel.tsx`:

   - Render the visible Google Identity Services button inside the unauthenticated session state.
   - Keep the workstation usable without a profile session.
   - Explain that Google sign-in is only for profile-scoped memory and remembered procedures.
   - Show Google-linked profile metadata when available.
   - Keep local dev sign-in available only behind a development/debug affordance.
   - Keep profile-ingress token controls attached to the signed-in profile.
   - Make sign-out call the Google/app auth sign-out route when the active session is web-auth.

8. Define the workstation memory boundary.

   Keep `useWorkstationSessionMemoryStore` as session-only unless a separate profile-memory promotion path exists.

   Required rule:

   ```text
   sessionStorage workstation memory
     -> explicit user-visible promotion
     -> typed profile memory candidate
     -> profile-scoped persistence
   ```

   Do not inject workstation drafts, scroll positions, clipboard receipts, live-card projections, or process graph observations into profile memory by default.

   The profile-memory promotion path must record:

   - source surface
   - source key
   - user-visible label
   - memory class
   - created/updated timestamps
   - profile ID
   - context-injection policy

## Required Tests

Add or update focused tests before handoff:

- `server/__tests__/account-session-panel.test.ts`
  - web-auth session creates `auth_mode: "web_auth"`
  - provider is Google
  - profile ID is based on `sub`, not email
  - raw password is never stored
  - agent credential collection remains false

- New auth route test, for example `server/__tests__/google-auth.test.ts`
  - rejects missing `GOOGLE_CLIENT_ID`
  - rejects missing credential
  - rejects CSRF mismatch
  - rejects verification failure
  - accepts verified Google payload and issues app session receipt

- Client sign-in test
  - loads/render button path without falling back to demo credentials
  - posts `credential` and `g_csrf_token` to `/api/auth/google`
  - handles failure without writing a fake local profile

- Workstation memory test
  - confirms existing session memory remains `surface_session_only`
  - confirms profile memory is not written without explicit promotion

## Verification Commands

During implementation loops:

```bash
npx vitest run server/__tests__/account-session-panel.test.ts --pool=forks
npx vitest run server/__tests__/google-auth.test.ts --pool=forks
npx vitest run client/src --pool=forks --runInBand
```

Before handoff:

```bash
npm run casimir:verify
```

Report:

- test commands run
- Casimir verifier verdict
- first failing HARD constraint, if any
- certificate hash
- certificate integrity status
- trace export status if exported

Do not claim completion unless the verifier returns PASS and certificate integrity is OK when policy requires a certificate.

## Non-Goals

- Do not add Google API data scopes beyond authentication (`openid`, `email`, `profile`) unless a separate feature requires them.
- Do not implement password login in agents, Discord, voice, or workstation action flows.
- Do not persist Google ID tokens as long-lived app sessions.
- Do not use email as the stable account ID.
- Do not silently attach transient workstation session memory to profile memory.
