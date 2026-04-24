# Workstation UI Primitive Templates

These templates scaffold new UI action primitives for Helix Ask workstation lanes.

Files
- `panel-capability.action.template.ts`: capability entry boilerplate.
- `lexicon-resolver.template.ts`: deterministic utterance mapping boilerplate.
- `panel-adapter-handler.template.ts`: adapter execution boilerplate.
- `parser-adapter-tests.template.md`: test matrix and code stubs.

Usage
1. Define action metadata in panel capabilities first.
2. Add deterministic parse rule in Helix Ask parser.
3. Implement adapter execution and artifacts.
4. Add parser, adapter, and store tests from template matrix.
