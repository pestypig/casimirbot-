Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.POLICY / D02 independent specification review
Capability or component: Fresh-factor operation receipt and lost-response P1 grant renewal
Lifecycle stage: sensitive-operation admission and client-grant renewal
Reaction timescale: at protected-operation consumption and successor recovery delivery
Authority owner: Independent technical reviewer checks specification coherence; account/security owner retains D02 acceptance
Current maturity: specified
Target maturity: specified with account/security-approved terms and executable CFP-2 fixtures
Required evidence: refinement 293, D02 lifecycle packet, D02 owner queue, P1S packet and passing documentation audit
Explicit non-goals: no factor/provider clearance, security sign-off, runtime proof, signed customer artifact or stage promotion
Downstream gate unlocked: none automatically; D02 review and CFP-1 exit rule remain controlling

# CFP-1 D02 refinement independent specification review — 2026-09-21

An independent read-only reviewer checked [refinement 293](2026-09-21-cfp1-d02-freshness-and-renewal-contract-refinement-293.md), the linked [lifecycle packet](../../../work-packets/eh-g8-cfp1-public-session-and-client-grant-lifecycle-decision-v1.md), owner queue and P1S packet. The first pass found that recovery delivery of an already committed successor needed a **new check at delivery** of the current same-profile web session, active nonrevoked device/generation, unrevoked grant revision and original pending-attempt ownership. The lifecycle row and fixture 2 were corrected. The reviewer rechecked those exact changes and returned **PASS** for bounded specification coherence with no remaining correction.

This review confirms the proposed five-minute factor-event age is measured at protected-operation receipt consumption, the receipt has its separate two-minute lifetime, and a lost renewal response either recovers one original successor under current authority or enters typed fresh approval. It does **not** accept the authentication provider, clock-skew rule, Windows custody/IPC design, account/security threat model, installed behavior or customer wording. `npm run helix:environment-harness:docs-audit` returned `ok: true`, with G8 active and no audit failures. CFP-1 remains active (`specified`); CFP-2/3 stay blocked.
