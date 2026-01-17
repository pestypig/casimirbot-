#!/usr/bin/env python3
import json
import sys
from pathlib import Path

try:
    from jsonschema import Draft202012Validator
except ImportError:
    print("Missing dependency: jsonschema. Install with: pip install jsonschema", file=sys.stderr)
    sys.exit(2)


def load_json(path: Path):
    with path.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def validate_schema(instance, schema, label):
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(instance), key=lambda e: e.path)
    if errors:
        print(f"\nSchema errors in {label}:")
        for err in errors[:50]:
            print(f"  - {list(err.path)}: {err.message}")
        return False
    return True


def find_repo_root(start: Path) -> Path | None:
    current = start.resolve()
    for _ in range(8):
        candidate = current / "docs" / "ethos" / "ideology.json"
        if candidate.exists():
            return current
        if current.parent == current:
            break
        current = current.parent
    return None


def main():
    if len(sys.argv) < 2:
        print("Usage: validate.py <packRoot>", file=sys.stderr)
        sys.exit(2)

    pack_root = Path(sys.argv[1]).resolve()
    schemas_dir = pack_root / "schemas"

    schemas = {
        "crosswalk": load_json(schemas_dir / "crosswalk.schema.json"),
        "gate": load_json(schemas_dir / "gateSpec.schema.json"),
        "workflow": load_json(schemas_dir / "workflowSpec.schema.json"),
        "artifact": load_json(schemas_dir / "artifactSpec.schema.json"),
        "receipt": load_json(schemas_dir / "receipt.schema.json"),
        "curiosity": load_json(schemas_dir / "curiosityReceipt.schema.json"),
    }

    crosswalk_path = pack_root / "crosswalk" / "ethos-crosswalk.json"
    crosswalk = load_json(crosswalk_path)
    if not validate_schema(crosswalk, schemas["crosswalk"], "crosswalk"):
        sys.exit(1)

    gate_specs = {}
    for path in (pack_root / "gates").glob("*.json"):
        obj = load_json(path)
        if not validate_schema(obj, schemas["gate"], f"gate:{path.name}"):
            sys.exit(1)
        gate_specs[obj["id"]] = obj

    artifact_specs = {}
    for path in (pack_root / "artifacts").glob("*.json"):
        obj = load_json(path)
        if not validate_schema(obj, schemas["artifact"], f"artifact:{path.name}"):
            sys.exit(1)
        artifact_specs[obj["id"]] = obj

    workflow_specs = []
    for path in (pack_root / "workflows").rglob("*.json"):
        obj = load_json(path)
        if not validate_schema(obj, schemas["workflow"], f"workflow:{path.relative_to(pack_root)}"):
            sys.exit(1)
        workflow_specs.append(obj)

    examples_dir = pack_root / "examples"
    if examples_dir.exists():
        for path in examples_dir.glob("*.json"):
            schema = schemas["curiosity"] if "curiosity" in path.name else schemas["receipt"]
            if not validate_schema(load_json(path), schema, f"example:{path.name}"):
                sys.exit(1)

    check_ids = {check["id"] for check in crosswalk.get("checks", [])}
    failures = 0

    for workflow in workflow_specs:
        for gate_id in workflow.get("gates", []):
            if gate_id not in gate_specs:
                print(f"Missing gate reference: workflow {workflow['id']} references {gate_id}")
                failures += 1
        for check_id in workflow.get("requiredChecks", []):
            if check_id not in check_ids:
                print(f"Missing check reference: workflow {workflow['id']} references {check_id}")
                failures += 1
        for artifact_id in workflow.get("requiredArtifacts", []):
            if artifact_id not in artifact_specs:
                print(f"Missing artifact reference: workflow {workflow['id']} references {artifact_id}")
                failures += 1

        if workflow.get("kind") == "entrepreneur.rung":
            if "rung" not in workflow or "scores" not in workflow:
                print(f"Missing rung or scores for {workflow['id']}")
                failures += 1
            elif workflow["rung"] != "R0":
                if workflow["scores"]["integritySafety"]["min"] < 2:
                    print(f"IntegritySafety min < 2 for {workflow['id']}")
                    failures += 1
            if "gate.eligibility.zen-handrails.v1" not in workflow.get("gates", []):
                print(f"Eligibility gate missing for {workflow['id']}")
                failures += 1

    repo_root = find_repo_root(pack_root)
    if repo_root:
        ideology_path = repo_root / "docs" / "ethos" / "ideology.json"
        ideology = load_json(ideology_path)
        node_ids = {node["id"] for node in ideology.get("nodes", [])}
        for check in crosswalk.get("checks", []):
            for node_ref in check.get("nodeRefs", []):
                if node_ref not in node_ids:
                    print(f"Unknown nodeRef in crosswalk check {check['id']}: {node_ref}")
                    failures += 1
        for workflow in workflow_specs:
            for node_ref in workflow.get("valuesRefs", []):
                if node_ref not in node_ids:
                    print(f"Unknown valuesRef in workflow {workflow['id']}: {node_ref}")
                    failures += 1

    if failures:
        print(f"\nFAILED with {failures} issue(s).")
        sys.exit(1)

    print("OK: all specs validated.")


if __name__ == "__main__":
    main()
