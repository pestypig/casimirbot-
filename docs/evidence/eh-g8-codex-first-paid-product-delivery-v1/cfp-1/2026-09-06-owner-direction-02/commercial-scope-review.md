# Broader harness subscription and Minecraft proof of concept

Owner direction recorded 2026-09-06 America/New_York. This supplements the
immutable earlier checkpoint; it is not a stage closure or legal clearance.

The subscription is for the broader CasimirBot harness. Minecraft supplies a
visible reference environment for testing how observation, reasoning, governed
effects and evidence work together. No Minecraft-only paid SKU, commercial
server-hosting offer, or automatic paid in-game action gate is selected.

## Existing Stripe method

The owner reports an existing Stripe account and $5/$10 presets. Source inspection
finds a $10 `starter_monthly` sandbox purchase with included credits and a
separate $5 prepaid-credit purchase in
`server/routes/__tests__/stripe-sandbox-acceptance.test.ts`. The schema exposes
`billing_checkout:plan:starter_monthly` and `billing_checkout:prepaid:500`.
These are not evidence of two software subscription tiers. The $25 hard account
ceiling is a ledger limit, not the subscription price.

Reuse SPB4 Checkout/Portal, step-up, webhook/idempotency and ledger foundations.
CFP3 must explicitly map existing Stripe products/prices to software access,
hosted services and optional provider credits; do not silently convert purchased
credits to software authorization. Dashboard configuration, interval and final
software benefits remain unverified. The ordinary-user paid journey remains
unfinished even though deterministic billing infrastructure already exists.

## Server monetization comparison

The official [Minecraft Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines)
expressly allow specified server monetization. Charging for server access has
conditions, including operator ownership/control and equal access charges;
gameplay entitlements have further restrictions. The same document separately
restricts mods checking outside-product access affecting in-game functions.
The [EULA](https://www.minecraft.net/en-us/eula) also limits monetizing mods.

Our inspected reference topology is a harness connected to the user's local
game through a companion, rather than a sale of admission to an operator-owned
server. Therefore server monetization permissions do not, by themselves,
establish permission for this offer. This is an architecture-based inference,
not a ruling that a general-purpose harness cannot be sold. Its broader scope
is relevant to review but does not alone decide the terms' application.

Keep technical reference work under its existing authorization. Before a
Minecraft-dependent commercial claim or payment-controlled function is accepted,
the reviewer must examine the actual purchased service, payment-to-function
dependencies, server ownership, distributed components and marketing. Establish
the applicable permission basis, seeking written permission when necessary.
Do not redesign labels or routing merely to disguise the same paid function.
Public promotional use of gameplay requires its own applicable-guideline check;
an internal proof of concept is not automatically approved marketing material.

## Distribution rights method

The owner accepts three classes: established first-party ownership; third-party
material distributable under existing terms; unclear material needing evidence,
replacement or exclusion. A copyright assignment is not automatically required
for a dependency whose license permits the intended use. The
[MIT license](https://opensource.org/license/mit) permits commercial distribution
and sublicensing subject to its notice conditions. No blanket proprietary
ownership or revocation of existing licensed copies follows.

Existing component-specific obligations (including native libraries, tunnel
notices and assets) stay assigned in the component matrix. Removing navigation
evaluation mods remains a separate release requirement. No license, installed
mod, payment, source visibility or production setting changed in this review.
