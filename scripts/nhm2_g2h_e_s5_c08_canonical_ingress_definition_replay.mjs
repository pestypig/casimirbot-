#!/usr/bin/env node
// Source-disjoint candidate-neutral replay of the proposed C08-002 resource definition.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const proposalPath = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-resource-contract.v1.json";
const borelPath = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json";
const expected = new Map([
  [proposalPath, "efbff4c1f9490803e7283ff8d1906fbdeedae787d78047d42f3061bd975efc48"],
  ["docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-wire-record-contract.v1.json", "c225865343ccf3c2874b59e305c70891cdd944fa3f3a88179bc55eccbf59c160"],
  [borelPath, "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737"],
  ["docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json", "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc"],
  ["docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v2.json", "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c"],
  ["docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-checkpoint-abi.v1.json", "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca"],
]);
const protectedPaths = [
  "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
  "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
  "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
  "artifacts/nhm2/g2h-e-s5/executions",
];

function raw(relative) { return fs.readFileSync(path.join(root, relative)); }
function sha(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }
function utf16Compare(left, right) { return left < right ? -1 : left > right ? 1 : 0; }
function canonical(value) {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error("noncanonical scalar");
    return encoded;
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort(utf16Compare).map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}
function metrics(rootValue) {
  const result = { maximum_depth: 0, total_value_nodes: 0, maximum_members_in_one_object: 0,
    maximum_elements_in_one_array: 0, maximum_decoded_string_utf8_bytes: 0,
    maximum_decoded_object_key_utf8_bytes: 0, numeric_value_count: 0 };
  function visit(value, depth) {
    result.total_value_nodes += 1;
    result.maximum_depth = Math.max(result.maximum_depth, depth);
    if (typeof value === "number") result.numeric_value_count += 1;
    else if (typeof value === "string") result.maximum_decoded_string_utf8_bytes = Math.max(result.maximum_decoded_string_utf8_bytes, Buffer.byteLength(value));
    else if (Array.isArray(value)) {
      result.maximum_elements_in_one_array = Math.max(result.maximum_elements_in_one_array, value.length);
      value.forEach((child) => visit(child, depth + 1));
    } else if (value && typeof value === "object") {
      const keys = Object.keys(value);
      result.maximum_members_in_one_object = Math.max(result.maximum_members_in_one_object, keys.length);
      keys.forEach((key) => {
        result.maximum_decoded_object_key_utf8_bytes = Math.max(result.maximum_decoded_object_key_utf8_bytes, Buffer.byteLength(key));
        visit(value[key], depth + 1);
      });
    }
  }
  visit(rootValue, 0);
  return result;
}

const checks = [];
function check(name, condition) { checks.push([name, Boolean(condition)]); }
for (const [relative, hash] of expected) check(`raw_hash:${relative}`, sha(raw(relative)) === hash);
check("protected_roots_absent", protectedPaths.every((relative) => !fs.existsSync(path.join(root, relative))));

const proposal = JSON.parse(raw(proposalPath).toString("utf8"));
const borelBytes = raw(borelPath);
const borel = JSON.parse(borelBytes.toString("utf8"));
const measured = metrics(borel);
const expectedMeasured = proposal.measured_frozen_contract_footprint;
for (const key of Object.keys(measured)) check(`measured:${key}`, measured[key] === expectedMeasured[key]);
check("measured_raw_bytes", borelBytes.length === expectedMeasured.raw_input_bytes && borelBytes.length === 54972);
check("numeric_inventory", (() => { let ok = true; const walk = (v) => { if (typeof v === "number") ok &&= Number.isInteger(v) && v >= 0 && v <= 65536; else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") Object.values(v).forEach(walk); }; walk(borel); return ok; })());

const canonicalBytes = Buffer.from(canonical(borel), "utf8");
const domain = Buffer.from(proposal.hash_bindings.canonical_domain_utf8, "utf8");
const canonicalHash = sha(Buffer.concat([domain, canonicalBytes]));
check("canonical_bytes", canonicalBytes.length === 49780 && canonicalBytes.length === proposal.hash_bindings.expected_canonical_bytes);
check("canonical_hash", canonicalHash === "665b6d9ddd9d2108274652414ec9d6a0a2fb43f86f28ab3ab64db70003c7f520" && canonicalHash === proposal.hash_bindings.expected_canonical_sha256);

const bounds = proposal.fixed_ingress_resource_bounds;
const exactBounds = { maximum_raw_input_bytes: 65536, maximum_canonical_output_bytes: 65536,
  maximum_depth: 8, maximum_total_value_nodes: 1024, maximum_members_per_object: 64,
  maximum_elements_per_array: 64, maximum_decoded_string_utf8_bytes: 1024,
  maximum_decoded_object_key_utf8_bytes: 128, maximum_cumulative_decoded_string_utf8_bytes: 65536,
  maximum_number_lexeme_bytes: 64 };
check("exact_bounds", Object.entries(exactBounds).every(([key, value]) => bounds[key] === value));
check("power_of_two_bounds", Object.values(exactBounds).every((value) => value > 0 && (value & (value - 1)) === 0));
check("measured_inside_bounds", borelBytes.length < bounds.maximum_raw_input_bytes
  && canonicalBytes.length < bounds.maximum_canonical_output_bytes
  && measured.maximum_depth < bounds.maximum_depth
  && measured.total_value_nodes < bounds.maximum_total_value_nodes
  && measured.maximum_members_in_one_object < bounds.maximum_members_per_object
  && measured.maximum_elements_in_one_array < bounds.maximum_elements_per_array
  && measured.maximum_decoded_string_utf8_bytes < bounds.maximum_decoded_string_utf8_bytes
  && measured.maximum_decoded_object_key_utf8_bytes < bounds.maximum_decoded_object_key_utf8_bytes);
check("scope_borel_only", proposal.scope.admitted_raw_bytes === 54972
  && proposal.scope.admitted_raw_sha256 === expected.get(borelPath)
  && proposal.scope.excluded.includes("C08 scientific output payload")
  && proposal.scope.excluded.includes("C08-021 record envelope or ledger stream"));
check("failure_code", proposal.scope.c08_failure_code === "C08-002_CANONICAL_JSON_OR_HASH");
check("ordered_validation", proposal.ordered_validation_and_failure_precedence.length === 10
  && proposal.ordered_validation_and_failure_precedence.every((value, index) => value.startsWith(String(index + 1).padStart(3, "0") + " ")));
check("domains", proposal.hash_bindings.inherited_payload_domain_utf8 === "nhm2-g2h-e-s4/payload/v1\n"
  && proposal.hash_bindings.inherited_record_domain_utf8 === "nhm2-g2h-e-s4/record/v1\n"
  && proposal.hash_bindings.inherited_manifest_self_domain_utf8 === "nhm2-g2h-e-s4/manifest-self/v1\n"
  && proposal.hash_bindings.inherited_stream_domain_utf8 === "nhm2-g2h-e-s4/stream/v1\n");
check("fail_closed_wire", proposal.wire_and_canonicalization.bom === "reject"
  && proposal.wire_and_canonicalization.invalid_utf8 === "reject"
  && proposal.wire_and_canonicalization.nonfinite_number === "reject"
  && proposal.wire_and_canonicalization.duplicate_rule.includes("before object construction"));
check("fixture_inventory", proposal.candidate_neutral_fixture_matrix.length === 18);
check("acknowledgement_gate", proposal.acknowledgement_boundary.required_before_implementation === true
  && proposal.readiness.independent_parent_acknowledgement_complete === false
  && proposal.readiness.implementation_authorized === false);
check("unsealed", proposal.status === "proposal_unsealed_pending_independent_parent_acknowledgement_no_implementation_authority");
check("authority_false", Object.values(proposal.authority).every((value) => value === false));

const passed = checks.filter(([, ok]) => ok).length;
const report = { schema: "nhm2.g2h_e_s5.c08_canonical_ingress_definition_replay.v1",
  status: passed === checks.length ? "PASS" : "FAIL", checks_passed: passed, checks_total: checks.length,
  failures: checks.filter(([, ok]) => !ok).map(([name]) => name), proposal_raw_sha256: sha(raw(proposalPath)),
  borel_contract_canonical_bytes: canonicalBytes.length, borel_contract_canonical_sha256: canonicalHash,
  candidate_evaluations: 0, positive_parameter_samples: 0, candidate_roots_created: false,
  implementation_authorized: false, authority_promoted: false };
process.stdout.write(`${JSON.stringify(report)}\n`);
process.exit(report.status === "PASS" ? 0 : 1);
