# Ingestion method — how the real corpus is built

`tools/ingest.js` builds `data.js` from live literature. Run: `node tools/ingest.js [--per-sub N]`.

## Sources

- **OpenAlex** (`api.openalex.org`, free, no key, polite pool via `mailto`): papers, abstracts,
  authors, venues, years, citation counts, and `referenced_works` for the citation graph.
- **ClinicalTrials.gov API v2** (free, no key): per-assumption registered-trial counts
  (`totalCount` for a hand-picked `query.term` per assumption).

## Pipeline

1. **Fetch.** One topic query per subfield (e.g. `senolytics senescent cells aging`), filtered to
   `from_publication_date:2000-01-01`, `type:article|review`, `has_abstract:true`. Select-fields only.
2. **Dedupe.** By DOI (lowercased), falling back to normalized title.
3. **Select.** Top `--per-sub` (default 60) per subfield by `cited_by_count`. Corpus is a few hundred papers.
4. **Model detection.** Keyword counting over title+abstract → mouse / human / monkey / cell / worm.
   Falls back to `"multi"` (= model not resolved from the abstract), which the UI treats as "any".
5. **Claims.** The top 7 most-cited *primary-research* papers per subfield become *landmark claims*
   (reviews are kept as papers but never become claims — review titles make poor claim nodes); the claim
   text is the paper's (cleaned) title — aging-literature titles are usually declarative. Other papers
   whose title shares ≥ 0.55 token Jaccard (stopwords removed) with the claim also `assert` it.
6. **Contradictions.** A paper `contradicts` a claim only when its abstract matches negation language
   ("fails to", "does not", "no significant effect", "refutes", …) AND it actually cites the landmark
   paper inside this corpus. Negation language without a citation edge proved too noisy.
7. **Assumption links.** Hand-written keyword rules per assumption (`rely` / `test` in `ingest.js`):
   a paper matches when the subfield/model constraints hold and the regex sets match the
   title+abstract. E.g. A07 (p16/SA-β-gal fidelity): `sen` papers mentioning p16/SA-β-gal rely on it;
   ones mentioning macrophages or specificity problems test it.
8. **Citation edges.** Each paper's `referenced_works` intersected with the corpus's OpenAlex IDs —
   the real intra-corpus citation graph, no extra API calls.
9. **Trials.** Per-assumption `query.term` → ClinicalTrials.gov `totalCount`, stored as
   `assumption.trials = { term, count, url }`. This is what lets a gap card say
   "12 papers rely on this · zero registered trials test it."

## What's heuristic, what's real

- **Real:** every paper (title, authors, year, venue, DOI, citation count), every citation edge,
  every trial count, every claim's origin.
- **Heuristic:** which papers assert/contradict a landmark claim (title similarity + negation
  language), and which rely-on/test each assumption (keyword rules). These are documented
  approximations — the gap engine (`gaps.js`) then computes every gap *from the link structure*,
  so improving the heuristics re-ranks the feed automatically.
- **Curated (not data):** the 15 assumption statements and their study blueprints are hand-written
  (`tools/blueprints.json`). They are the instrument's analytic lens, not literature claims.

## Known limitations

- Title-as-claim is crude for review papers ("The hallmarks of aging") — still a usable claim node.
- Negation-language detection has false positives (a paper can say "X does not cause Y" while
  supporting the claim). Contradiction edges are the noisiest link type.
- OpenAlex `referenced_works` misses citations for very recent papers (indexing lag).
- ClinicalTrials.gov counts are query-sensitive; the exact `query.term` is stored for transparency.

## Refreshing

Re-run `node tools/ingest.js` any time; it rewrites `data.js` with a new `INGESTED_AT` stamp.
The previous demo corpus is preserved untouched in `data.demo.js`.
