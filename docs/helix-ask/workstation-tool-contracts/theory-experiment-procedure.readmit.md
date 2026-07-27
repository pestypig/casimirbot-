# theory-experiment-procedure.readmit

Maturity: `draft`

Architecture: [Theory Experiment Procedure](../../architecture/theory-experiment-procedure.md)

## Purpose

Readmit one previously prepared theory-experiment procedure into a later turn
without allowing the caller to reconstruct, relabel, or substitute it. The
capability retrieves the exact retained procedure and emits a fresh
current-turn observation. It does not execute a procedure, run Lanyon or Lean,
start a numerical job, mutate the retained artifact, or answer the user.

## Owner

- Capability id: `theory-experiment-procedure.readmit`
- Panel: `workflow-demo-lab`
- Action id: `readmit_theory_experiment_procedure`
- Permission profile: `read`
- Account policy: `developer`
- Mode: read/observe
- Confirmation: not required
- Terminal eligible: `false`

The retention owner key is the exact account type, developer profile id, and
session id that prepared the procedure. A different profile or session cannot
readmit it, even when the procedure id and digest are known.

## Inputs

All three fields are required:

- `procedure_artifact_ref`: the original procedure observation reference;
- `procedure_id`: the exact retained `theory_experiment_procedure/v1`
  `procedureId`; and
- `procedure_sha256`: the exact 64-character lowercase SHA-256 digest stored as
  the retained procedure's `procedureSha256`.

The artifact reference must be byte-for-byte equal to the exact observation
reference issued and retained by the preparation gateway. Merely matching an
origin-turn prefix or a syntactically valid Codex-normalized/workstation
gateway shape is insufficient. Aliases, never-issued sibling references, a
reference from a different origin turn, a mismatched procedure id, or a
mismatched SHA do not fall back to a looser lookup.

## Retention Boundary

Prepared procedures are retained only in the current server process:

- retention lifetime: 24 hours from preparation;
- scope: exact account type, profile id, and session id;
- capacity: at most 256 retained procedures in the process;
- durability: none across process restart, deployment, or another server
  process.

Preparation without both a nonempty developer profile id and session id remains
usable for current-turn evaluation but is not retained or advertised for
readmission.

Expired or evicted procedures fail closed as `retained_procedure_not_found`.
This cache is a bounded continuation aid, not an artifact repository or
long-term evidence store.

## Observation

Successful readmission returns
`casimir.theory_experiment_procedure.observation.v1` with:

- the integrity-validated retained procedure;
- the unchanged procedure id and procedure SHA;
- the requested original artifact reference;
- the origin turn id and the current readmission turn id; and
- downstream evidence-only affordances derived from the retained procedure.

The observation always keeps:

```txt
terminal_eligible=false
post_tool_model_step_required=true
assistant_answer=false
raw_content_included=false
```

The fresh observation may enter the current-turn evidence ledger, but neither
the observation nor its artifact reference is answer authority.

## Host Projection

The host may display the readmission status, exact procedure id/SHA, origin
turn, current readmission turn, missing requirements, and downstream
evidence-only affordances. It must not project the observation as an executed
experiment, verified claim, or completed answer.

## Negative Admission

Readmission fails closed for:

- a non-developer account;
- a missing profile, session, or current turn binding;
- a missing or malformed artifact reference, procedure id, or procedure SHA;
- a different account/profile/session owner;
- an expired, evicted, or process-lost retained procedure;
- a forged, aliased, or never-issued artifact reference;
- a mismatched procedure id or digest; or
- retained procedure integrity failure.

## Visible Trace

```txt
Tool request: theory-experiment-procedure.readmit with exact ref/id/SHA
Tool observation: same-owner retained procedure or typed failure
Current-turn evidence re-entry
Model reasoning, next tool request, or accurate limitation
```

## Tests

- exact same-owner cross-turn readmission succeeds;
- different-session lookup fails as `retained_procedure_not_found`;
- a forged artifact reference fails as
  `procedure_artifact_ref_not_original`;
- the observation preserves the exact procedure id/SHA and remains
  non-terminal; and
- the provider inventory pins the read-only manifest and required input triple.
