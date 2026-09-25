# LZ HEPData release metadata inventory

Date: September 25, 2026. Public metadata intake only; this does not reproduce the LZ analysis or likelihood.

## What is identified

The DataCite API for [HEPData DOI 10.17182/hepdata.182472.v1](https://doi.org/10.17182/hepdata.182472.v1) identifies 46 table DOIs. Its first three tables are the Science, Prompt Veto, and Delayed Veto samples, described as points in `log10(S2)-S1` space. The remaining 43 are result tables: L01-L20 scalar/vector (40 tables), O01s/O01v, and O04s. Their metadata describes coupling limits and significance.

This gives us a better audit map than the paper abstract: the release indexes event/sample coordinates and model-result summaries. Those categories alone do not demonstrate that it contains the detector-level signal-energy PDF, NR energy migration kernel, background PDFs, or nuisance priors needed to reconstruct the IDM one-event likelihood. The LZ paper states that best-fit NEST response parameters are in the release, while its supplement also prints model details and the efficiency curve. This inventory does not prove that no additional, non-table resource file exists.

## Access and evidence limits

The parent and child DOI metadata were retrieved from DataCite's public API. Attempts to read the HEPData record and download routes in the shell and the user's existing Chrome session displayed a Cloudflare bot-verification page. I stopped at that barrier; I did not solve or bypass it. DataCite metadata exposes table titles, short descriptions, child DOIs, and record URLs, but not the numeric table payloads. Accordingly, no table values have been extracted and no claim is made that the complete response release is inaccessible.

The next prediction step does not need to wait for those numeric event tables: continue the physics-side IDM/TNG50 fold, with local H fraction explicit. For the detector-likelihood gate, the HEPData record payload or an authorized source mirror is still needed to inspect the 46 tables and any resource attachments. If the tabular release contains only the indexed categories, the LZ information supports published-model comparison but not an independent IDM profile-likelihood reconstruction; retain that as a detector-input limitation and do not infer missing PDFs from the single candidate energy.

## Reproduction

Run:

```powershell
python docs/research/casimir-dp-lz-hepdata-inventory-2026-09-25.py
```

The script fetches the parent and 46 child DOI records from `https://api.datacite.org/dois/`, checks the table count and first-three ordering, and writes all metadata to the adjacent JSON. The inventory is time-stamped because public metadata can change.

Sources: [LZ result, arXiv:2609.02823](https://arxiv.org/abs/2609.02823); [HEPData release DOI](https://doi.org/10.17182/hepdata.182472.v1); [DataCite public API documentation](https://support.datacite.org/docs/api).
