from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import httpx


@dataclass
class PlanStep:
    name: str
    endpoint: str
    payload: Dict[str, Any]
    kind: str
    output_key: Optional[str] = None


@dataclass
class RunNode:
    name: str
    endpoint: str
    payload: Dict[str, Any]
    output_key: Optional[str]
    kind: str
    status: str
    outputs: Dict[str, Any] = field(default_factory=dict)
    checks: List[Dict[str, Any]] = field(default_factory=list)


class RunDAG:
    def __init__(self) -> None:
        self.nodes: List[RunNode] = []
        self.artifacts: Dict[str, Any] = {}
        self.checks: List[Dict[str, Any]] = []

    def add_node(self, node: RunNode) -> None:
        self.nodes.append(node)
        if node.output_key and node.outputs:
            self.artifacts[node.output_key] = node.outputs
        if node.checks:
            self.checks.extend(node.checks)

    def rerun_from(self, index: int) -> None:
        if index < 0 or index >= len(self.nodes):
            return
        self.nodes = self.nodes[:index]
        self.artifacts = {}
        self.checks = []


class ToolClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.client = httpx.Client(timeout=60.0)

    def post(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        response = self.client.post(f"{self.base_url}{endpoint}", json=payload)
        response.raise_for_status()
        return response.json()


class Orchestrator:
    def __init__(self, base_url: str) -> None:
        self.client = ToolClient(base_url)

    def run_plan(self, steps: List[PlanStep]) -> RunDAG:
        dag = RunDAG()
        return self._execute_steps(dag, steps, start_index=0)

    def rerun_from(self, dag: RunDAG, steps: List[PlanStep], start_index: int) -> RunDAG:
        dag.rerun_from(start_index)
        return self._execute_steps(dag, steps, start_index=start_index)

    def _execute_steps(self, dag: RunDAG, steps: List[PlanStep], start_index: int) -> RunDAG:
        for step in steps[start_index:]:
            try:
                response = self.client.post(step.endpoint, step.payload)
                status = "ok"
            except Exception as exc:
                response = {"error": str(exc)}
                status = "fail"
            outputs: Dict[str, Any] = {}
            checks: List[Dict[str, Any]] = []
            if step.kind == "artifact":
                outputs = response
            elif step.kind == "scalar":
                outputs = response
            elif step.kind == "invariants":
                outputs = response
            elif step.kind == "checks":
                if "checks" in response:
                    checks = response.get("checks", [])
                else:
                    checks = [response]
            dag.add_node(
                RunNode(
                    name=step.name,
                    endpoint=step.endpoint,
                    payload=step.payload,
                    output_key=step.output_key,
                    kind=step.kind,
                    status=status,
                    outputs=outputs,
                    checks=checks,
                )
            )
        return dag

    def run_metric_pipeline(self, metric: Dict[str, Any]) -> RunDAG:
        metric_payload = {
            key: value
            for key, value in metric.items()
            if key not in ("vacuum_sample_points", "vacuum_epsilon")
        }
        vacuum_payload: Dict[str, Any] = {"metric": metric_payload}
        if metric.get("vacuum_sample_points"):
            vacuum_payload["sample_points"] = metric.get("vacuum_sample_points")
        if metric.get("vacuum_epsilon") is not None:
            vacuum_payload["epsilon"] = metric.get("vacuum_epsilon")
        steps = [
            PlanStep(
                name="metric_validate",
                endpoint="/physics/metric-validate",
                payload=metric_payload,
                kind="checks",
            ),
            PlanStep(
                name="christoffel",
                endpoint="/physics/christoffel",
                payload=metric_payload,
                kind="artifact",
                output_key="christoffel",
            ),
            PlanStep(
                name="riemann",
                endpoint="/physics/riemann",
                payload=metric_payload,
                kind="artifact",
                output_key="riemann",
            ),
            PlanStep(
                name="ricci",
                endpoint="/physics/ricci",
                payload=metric_payload,
                kind="artifact",
                output_key="ricci",
            ),
            PlanStep(
                name="ricci_scalar",
                endpoint="/physics/ricci-scalar",
                payload=metric_payload,
                kind="scalar",
                output_key="ricci_scalar",
            ),
            PlanStep(
                name="einstein",
                endpoint="/physics/einstein-tensor",
                payload=metric_payload,
                kind="artifact",
                output_key="einstein",
            ),
            PlanStep(
                name="invariants",
                endpoint="/physics/invariants",
                payload=metric_payload,
                kind="invariants",
                output_key="invariants",
            ),
            PlanStep(
                name="check_metric_symmetry",
                endpoint="/physics/check-metric-symmetry",
                payload=metric_payload,
                kind="checks",
            ),
            PlanStep(
                name="check_christoffel_symmetry",
                endpoint="/physics/check-christoffel-symmetry",
                payload=metric_payload,
                kind="checks",
            ),
            PlanStep(
                name="check_riemann_symmetries",
                endpoint="/physics/check-riemann-symmetries",
                payload=metric_payload,
                kind="checks",
            ),
            PlanStep(
                name="check_contracted_bianchi",
                endpoint="/physics/check-contracted-bianchi",
                payload=metric_payload,
                kind="checks",
            ),
            PlanStep(
                name="check_vacuum",
                endpoint="/physics/check-vacuum",
                payload=vacuum_payload,
                kind="checks",
            ),
        ]
        return self.run_plan(steps)


def build_report(metric: Dict[str, Any], dag: RunDAG) -> Dict[str, Any]:
    failed = [check for check in dag.checks if not check.get("passed", False)]
    return {
        "assumptions": {
            "coords": metric.get("coords"),
            "signature": metric.get("signature", "-+++"),
            "units_internal": "geometrized",
        },
        "artifacts": list(dag.artifacts.keys()),
        "checks": dag.checks,
        "failed_checks": failed,
        "passed": len(failed) == 0,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run GR assistant pipeline via local tool server.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--metric-json", required=True, help="Path to metric JSON input.")
    parser.add_argument("--out", default="-", help="Output JSON report path or '-' for stdout.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    with open(args.metric_json, "r", encoding="utf-8") as handle:
        metric = json.load(handle)
    orchestrator = Orchestrator(args.base_url)
    dag = orchestrator.run_metric_pipeline(metric)
    report = build_report(metric, dag)
    output = json.dumps(report, indent=2)
    if args.out in ("-", "", None):
        print(output)
    else:
        with open(args.out, "w", encoding="utf-8") as handle:
            handle.write(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
