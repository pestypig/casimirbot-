"""Inventory the DataCite metadata for LZ's HEPData release and table DOIs.

This reads public DOI metadata only. It does not retrieve or infer table values,
and it is not a substitute for the HEPData record payload.
"""
from __future__ import annotations

import concurrent.futures
import json
import re
import urllib.request
from pathlib import Path


PARENT_DOI = "10.17182/hepdata.182472.v1"
PARENT_API = "https://api.datacite.org/dois/" + PARENT_DOI


def fetch(doi: str) -> dict:
    request = urllib.request.Request(
        "https://api.datacite.org/dois/" + doi,
        headers={"User-Agent": "CasimirBot research inventory/1.0"},
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        return json.load(response)["data"]["attributes"]


def title(attrs: dict) -> str:
    return "; ".join(item.get("title", "") for item in attrs.get("titles", []))


def description(attrs: dict) -> str:
    return "; ".join(item.get("description", "") for item in attrs.get("descriptions", []))


def main() -> None:
    parent = fetch(PARENT_DOI)
    child_dois = [
        item["relatedIdentifier"]
        for item in parent.get("relatedIdentifiers", [])
        if item.get("relationType") == "HasPart" and item.get("relatedIdentifierType") == "DOI"
    ]
    if len(child_dois) != 46:
        raise SystemExit(f"Expected 46 table DOIs from frozen release metadata; got {len(child_dois)}")
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        children = list(pool.map(fetch, child_dois))

    tables = []
    for number, (doi, attrs) in enumerate(zip(child_dois, children), start=1):
        tables.append({
            "table_number": number,
            "doi": doi,
            "title": title(attrs),
            "description": description(attrs),
            "record_url": attrs.get("url"),
            "resource_type": attrs.get("types", {}).get("resourceTypeGeneral"),
        })
    if not all("Science Sample Data" in tables[i]["title"] for i in (0,)):
        raise SystemExit("Unexpected first table title")
    if "Prompt Veto Sample Data" not in tables[1]["title"] or "Delayed Veto Sample Data" not in tables[2]["title"]:
        raise SystemExit("Unexpected sample-data table ordering")
    model_labels = [re.search(r'"(L\d\d[sv]|O\d\d[sv])"', row["title"]).group(1) for row in tables[3:]]
    expected_labels = [f"L{i:02d}{suffix}" for i in range(1, 21) for suffix in ("s", "v")] + ["O01s", "O01v", "O04s"]
    if model_labels != expected_labels:
        raise SystemExit("Unexpected result-table labels or ordering")
    if not all("Limits and Significance" in row["description"] for row in tables[3:]):
        raise SystemExit("Unexpected result-table descriptions")

    result = {
        "classification": "DataCite DOI metadata inventory only; HEPData table payloads not retrieved",
        "retrieved_date": "2026-09-25",
        "parent_doi": PARENT_DOI,
        "parent_api": PARENT_API,
        "record_url": parent.get("url"),
        "table_count": len(tables),
        "tables_1_to_3": "Science, prompt-veto, and delayed-veto event samples in log10(S2)-S1 coordinates",
        "tables_4_to_46": "43 result tables: L01-L20 scalar/vector (40), O01s/O01v, and O04s; metadata describes limits and/or significance",
        "payload_access": "Direct HEPData record/download endpoints return a Cloudflare anti-bot challenge in this environment; metadata are obtained from the public DataCite API.",
        "limits": [
            "DataCite titles/descriptions do not reveal the numeric table payloads.",
            "This metadata inventory does not establish whether the HEPData record has additional non-table resource files.",
            "No detector-level event-response PDF, migration kernel, background likelihood, or IDM reinterpretation is reconstructed by this script.",
        ],
        "tables": tables,
    }
    output = Path(__file__).with_suffix(".json")
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"table_count": len(tables), "first_three": tables[:3], "last_three": tables[-3:]}, indent=2))


if __name__ == "__main__":
    main()
