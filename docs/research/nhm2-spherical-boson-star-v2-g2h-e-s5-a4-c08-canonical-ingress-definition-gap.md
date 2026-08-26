Program gate: G2H-E-S5 / A4
Workstream: authenticated classical and quantum control branch
Capability or component: C08-002 canonical JSON/hash ingress resource policy
Current maturity: definition gap confirmed; implementation intentionally not started
Target maturity: versioned additive candidate-neutral definition with independently acknowledged fixed ingress bounds
Required frozen inputs: checkpoint ABI `6fbf6cdb...911ca`; acknowledged Borel growth/quadrature `7dd4d30a...94737`; inherited S4 wire/hash domains
Required evidence: exact byte/depth/node limits, failure precedence, domain bindings, exact audit and independent acknowledgement
Stop/fail criteria: inventing numeric limits in source, accepting unbounded ingress, weakening RFC8785 rejection, selected-member ingress, or authority promotion
Explicit non-goals: changing mathematical equations, candidate identity, grids, thresholds, chronology, scientific handlers, authorization, or execution
Downstream gate unlocked: candidate-neutral implementation and fixture audit of C08-002

# G2H-E-S5 A4 C08 canonical-ingress definition gap

## Verdict

`STOP_AT_ADDITIVE_DEFINITION_REVIEW`

The current frozen checkpoint ABI requires a UTF-8 RFC8785-compatible object
and rejects an "out-of-range resource", but it does not define the applicable
general JSON resource range. Repository audit found only the separate
authorization-record limit of 4,096 bytes and the descriptor-manifest inventory
limit of 256 records with checked cumulative bytes. Neither freezes the
canonical C08 payload's maximum byte length, nesting depth or parsed-node
count.

## Missing total-definition fields

An additive successor must freeze, at minimum:

1. maximum raw input bytes, including whether a terminating newline is
   admitted;
2. maximum JSON nesting depth with an exact root-depth convention;
3. maximum total values/nodes and maximum object-member/array-element counts;
4. maximum decoded string bytes or Unicode scalar count and maximum printable
   ASCII key bytes;
5. exact failure precedence among oversize input, invalid UTF-8, duplicate
   keys, unpaired surrogates, nonfinite/noncanonical numbers and resource
   exhaustion;
6. the inherited raw, canonical-payload, record and self-hash domain strings
   used by C08-002;
7. fixtures at every boundary and one-above-boundary case.

The definition may retain the already frozen restrictions: UTF-8 without BOM,
duplicate-key rejection before object construction, unpaired-surrogate
rejection, UTF-16 key ordering, minimal string escaping, finite binary64 number
canonicalization, printable-ASCII contract keys, and domain-separated SHA-256.
This review selects no numeric bound.

## Authority and chronology

No candidate byte was loaded, no positive chart was sampled, and no candidate,
authorization or execution root was created during this review. C08-002 and all
later C08 stages remain incomplete. This gap does not invalidate the isolated
C08-001 identity gate or the previously received C08-016 through C08-020
flat-remainder evidence; it prevents either slice from being represented as a
complete C08 producer.

## Additive-definition disposition

The gap now has an exact proposed disposition in
`nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-resource-contract.v1.json`
at raw SHA-256
`efbff4c1f9490803e7283ff8d1906fbdeedae787d78047d42f3061bd975efc48`.
Its exact audit passes 32/32 and its source-disjoint Node replay passes 30/30.
The proposal remains unsealed and implementation-ineligible pending the exact
independent acknowledgement requested separately. This disposition does not
erase the original gap finding or authorize source implementation.
