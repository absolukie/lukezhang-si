# Second Brain — personal information-retrieval console

A real search engine over **your own Gmail + Google Calendar**, running entirely
in the browser: BM25 keyword search, 32-dim LSA semantic search, hybrid
retrieval, a second-pass reranker, extractive Ask, temporal histogram, and an
entity knowledge graph.

## The corpus is real data

`data.js` is generated from your actual mail and calendar — not demo content.
The retrieval engine (`ir.js`) is untouched; only the input changed.

Rebuild it anytime:

```bash
python3 tools/build-corpus.py
```

Knobs:

| Flag | Default | What it does |
|---|---|---|
| `--days N` | 90 | Mail lookback window (calendar also pulls 30 days upcoming) |
| `--max N` | 500 | Cap on total documents, newest first |
| `--include-promos` | off | Also index Promotions/Social mail |
| `--full-bodies` | off | Fetch full email bodies instead of snippets |
| `--out PATH` | `data.js` | Output path |

## Privacy notes

- Default output contains **email subjects + Gmail snippets only** — no full
  bodies. The committed corpus is therefore searchable but shallow by design.
- This repo and its Pages site are private; the corpus is your own data.
  If you'd rather not have even snippets in git history, add `data.js` to
  `.gitignore` and deploy with a locally generated file instead.
- `--full-bodies` builds a richer local corpus. **Do not commit that output.**
- `data.js` is generated — never hand-edit it; change the exporter and rebuild.
- The generated file header records when it was built and from what window.
- Suggested example queries in the UI come from `window.CORPUS_META.examples`
  (top entities/topics in the current corpus), so they always match real data.

## Tests

```bash
node test/smoke.js
```

Headless DOM-stub test: loads `data.js` + `ir.js` + `app.js`, runs searches in
all three modes, checks the pipeline strip, histogram, ask mode, and empty
states. Data-driven — it derives its query from the actual corpus.
