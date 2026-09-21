# CFP-1 D07 finite-lease cost-token technical review — 2026-09-20

## Review scope and verdict

An independent read-only technical review of [assay specification 218](2026-09-20-cfp1-cost-token-finite-lease-assay-218.md) and its three linked D07, pilot and PBT work packets returned **PASS; no correction required**. The reviewer checked the finite-lease database-time bound, all four worked examples, the [Replit five-minute production-database idle rule](https://docs.replit.com/features/data-and-storage/development-and-production), relative links, PBT/model-token/effect/customer-charge separation and the CFP-1 stage claims. The local link/whitespace check found no issue, and `npm run helix:environment-harness:docs-audit` returned `ok: true`, zero failures.

For disjoint admitted intervals during the 10,080-minute trial, each room-origin request interval plus a five-minute idle tail lies within its admitted interval plus five minutes **only under the stated stop condition**. Therefore the union is at most `min(H + 5K, 10,085)` minutes. The examples evaluate to 100 and 200 minutes for ten separated five-/fifteen-minute visits, and 300 and 600 minutes for thirty. Background activity and overlapping tails can lower incremental attributed use; hidden post-suspension room requests invalidate this conditional bound. Other meters, pricing, useful trial capacity and per-sponsor attribution remain unmeasured.

This is a technical specification review, not the qualified financial/privacy D11 return or a D07 customer price/limit selection. CFP-1 remains active at `specified`; D07/D11/D12 remain open, CFP-2/3 blocked and G8 active.
