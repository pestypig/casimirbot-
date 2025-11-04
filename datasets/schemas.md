## JSONL Task Schemas

This repository uses lightweight JSON line (`.jsonl`) corpora for supervised fine-tuning (SFT), continued instruction tuning, and retrieval augmentation evaluation. Each record is a single JSON object with the fields described below.

### Cite-first summarization (`datasets/schema.cite-first.json`)

- `system`: instruction shown to the model before the user prompt. Keep ASCII and ≤200 characters.
- `input`: the user request.
- `output`: response that opens with claims supported by citations, followed by prose.
- `references`: ordered list of source descriptors. The response must cite each entry by `[id]`.
- `meta`: task bookkeeping. Always set `"task": "cite_first"` and `"topic": "physics"`.

### Equation / term explanation

- `system`: direct instruction that demands symbol definitions plus citations.
- `input`: term or equation description that must be grounded.
- `output`: one or more sentences, each naming a symbol and citing the defining passage.
- `references`: every cited symbol maps to at least one bibliography entry.
- `meta`: include `"task": "equation_explain"`.

### Compare / contrast

- `system`: explicitly request parity between the two sources.
- `input`: comparison question (papers, models, or experimental setups).
- `output`: balanced contrast with at least one citation per side.
- `references`: exactly the sources quoted in the answer.
- `meta`: include `"task": "compare"`.

### Abstention / failure

- `system`: instruct the model to refuse unsupported claims.
- `input`: question that may not be covered by the supplied corpus.
- `output`: must begin with `Insufficient evidence` when retrieval confidence is low.
- `references`: cite the closest supporting material even when abstaining.
- `meta`: include `"task": "abstain"`.

#### General guidance

- Keep quotes under 25 words and prefer paraphrasing.
- Use `[id]` citation markers that correspond to `references[].id`.
- Ensure bibliography `span` strings match stable section headers (e.g., `§1.7 dCSL`).
- For dev splits, mirror the train schema but vary phrasing to reduce memorization.
