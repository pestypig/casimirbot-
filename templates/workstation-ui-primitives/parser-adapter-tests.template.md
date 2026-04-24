# parser-adapter-tests.template.md

## Parser tests (Helix Ask)
- Positive mapping:
- "<utterance A>" -> `run_panel_action` `<panel_id>.<action_id>` with exact args.
- "<utterance B>" -> `run_panel_action` `<panel_id>.<action_id>` with exact args.
- Negative mapping:
- Ambiguous phrase does not mutate state and returns null.

Example expectation
```ts
expect(parseWorkstationActionCommand("create a note called Mission Log")).toEqual({
  action: "run_panel_action",
  panel_id: "workstation-notes",
  action_id: "create_note",
  args: { title: "Mission Log", topic: "Mission Log" },
});
```

## Adapter tests
- Required arg validation returns `ok: false` + message.
- Destructive action without confirmation returns `requires_confirmation` artifact.
- Success path returns deterministic artifact payload.

## Store tests
- ID generation remains deterministic.
- Mutation updates expected fields/timestamps.
- Clear/delete behavior updates counts and active references.

## Regression tests
- Existing docs viewer actions unchanged.
- Existing open/focus/close panel actions unchanged.
