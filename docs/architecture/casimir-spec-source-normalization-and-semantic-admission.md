# Casimir Spec Source Normalization and Semantic Admission

Status: implementation candidate.

This layer introduces no competing scientific-definition format.
`casimir_spec_scientific_claim_ir/v1` remains the sole canonical semantic IR.
The `casimir_spec_source_packet/v1` object is only a strict transport envelope
for the unhashed inputs of that IR.

## Deterministic source normalization

The v1 surface is deliberately narrow: canonical JSON plus one trailing
newline. The formatter sorts object keys recursively. The parser rejects
whitespace variants, duplicate-key spellings, unknown envelope/body fields,
invalid packet identities, and any payload that the canonical claim-IR builder
rejects. It hashes the exact UTF-8 source bytes and binds that digest and the
portable source path into a `parsed_surface` claim IR.

This gives byte determinism and round-trip equality without pretending to solve
arbitrary prose or notation. A later richer author-facing grammar must compile
to the same IR and demonstrate deterministic parse/format/parse equality before
its rendering can gain authority.

## Semantic admission

`admitCasimirSpecScientificClaimIrV1` first verifies the complete claim-IR
integrity chain. It then checks:

- every declared catalog snapshot commitment;
- catalog symbol identity, type, mathematical type, unit, and frame signatures;
- registered symbol bindings and their exact provenance;
- the declared graph ID and badge membership;
- registered observable-bridge edge identity and endpoint/kind equality; and
- arity, rational dimension propagation, dimension equality, and bound-frame
  compatibility for the closed v1 core-operator family.

The output is a hash-bound
`casimir_spec_semantic_admission_receipt/v1`. A structurally sound open-world IR
may be `admitted_with_declared_blockers`; blockers are preserved rather than
silently repaired. Integrity, identity, snapshot, bridge, or operator failures
produce `rejected`.

The receipt verifies only the supplied committed bindings. It does not establish
that the source matches author intent, that the graph is complete, that a
theory is true, or that formal, numerical, empirical, or physical validation
has occurred. It is evidence for later model synthesis, never an assistant
answer or terminal product.

## Remaining admission work

- Extend operator typing beyond the closed v1 core family as new operators are
  registered.
- Add deterministic validity-domain and approximation/error-contract checks.
- Populate and govern additional catalog/graph snapshots in the repository-owned
  snapshot store as new scientific families are admitted.
- Extend the developer-only `theory-semantic-admitter.normalize` capability
  only after each new snapshot family has deterministic fixtures.
- Add richer human-readable syntax only after the frozen benchmark
  prerequisites and source-rendering study are in place.
