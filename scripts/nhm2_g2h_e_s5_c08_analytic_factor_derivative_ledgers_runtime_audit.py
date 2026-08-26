#!/usr/bin/env python3
"""Independent audit for persistent candidate-neutral F'/E1'/E2' ledgers."""
from __future__ import annotations
import hashlib,json,pathlib,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
G2H=ROOT/"tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE="nhm2-g2h-e-s5-c08-analytic-factor-derivative-ledgers-fixture:v1-audit"
DOCKERFILE=G2H/"Dockerfile.primary.mini-boson-c08-analytic-factor-derivative-ledgers-fixture.v1"
EXECUTABLE="/usr/local/bin/mini-boson-star-primary-c08-analytic-factor-derivative-ledgers-fixture-v1"
EXPECTED={
"tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_factor_derivative_ledgers_v1.hpp":"ebe1a09954f70997b3edbfa9e6eae5a3d7a0be0df561ccb57581a2ca0cafe983",
"tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_factor_derivative_ledgers_v1.cpp":"296ed9312bc13d2f8e94195b5925244685dadc41f7fad7a61800891f4c69cef9",
"tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_factor_derivative_ledgers_fixture_v1.cpp":"2fcc66989e85c11ccfed364777634cfee0fab0c5c9a9610b6c2875dbc4a86f61",
"tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-analytic-factor-derivative-ledgers-fixture.v1":"62747d26609dac177e182b956e656b52d9b9a78a516f4e7787e8b79e2dd912ea"}
EXPECTED_EXECUTABLE="5e5af69db6de193f6aadc4cbc35f61372b82f19cb2e6a7445096ddf3c152655e"
PROTECTED=("artifacts/nhm2/g2h-e-s4/mini-boson-star-primary","artifacts/nhm2/g2h-e-s4/mini-boson-star-independent","artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt","artifacts/nhm2/g2h-e-s5/executions")
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def run(cmd):return subprocess.run(cmd,cwd=ROOT,check=False,capture_output=True,text=True)
def parse(p):
 try:return json.loads(p.stdout.strip().splitlines()[-1])
 except (IndexError,json.JSONDecodeError):return{"stdout":p.stdout,"stderr":p.stderr}
def passing(path):
 p=run([sys.executable,path]);q=parse(p);return p.returncode==0 and q.get("status")=="PASS" and q.get("checks_passed")==q.get("checks_total")
def main():
 checks=[(f"hash:{p}",sha(ROOT/p)==h)for p,h in EXPECTED.items()]
 checks.append(("protected_absent_before",all(not(ROOT/p).exists()for p in PROTECTED)))
 h=(G2H/"mini_boson_star_primary_c08_analytic_factor_derivative_ledgers_v1.hpp").read_text()
 s=(G2H/"mini_boson_star_primary_c08_analytic_factor_derivative_ledgers_v1.cpp").read_text()
 f=(G2H/"mini_boson_star_primary_c08_analytic_factor_derivative_ledgers_fixture_v1.cpp").read_text()
 d=DOCKERFILE.read_text()
 checks.extend((("three_source_inventory","source_ledgers;  // F,E1,E2" in h and "kSourceCount = 3U" in h),("three_derivative_inventory","kDerivativeCount = derivative::kDerivativeCount" in h),("unique_disjoint_ids","std::set<std::uint32_t> source_ids, derivative_ids" in s and "source_ids.count(id)" in s),("all_sources_validated","for (const auto &view : input.source_ledgers)" in s and "!valid_ledger(view)" in s),("coherent_geometry","same_geometry(input.source_ledgers[0].models[ordinal]" in s),("three_prefix_locks","source_digests" in s and "digest!=impl.source_digests[source][ordinal]" in s),("parameter_identity_lock","same_parameters(input,impl)" in s),("real_derivative_producer","derivative::evaluate(model_input" in s),("three_pending_validations","selected<kDerivativeCount&&valid" in s),("atomic_commit",s.index("selected<kDerivativeCount&&valid")<s.index("impl.models.push_back")),("stable_owned_models","std::vector<std::unique_ptr<derivative::Output>> models" in s),("stable_publications","std::unique_ptr<Publication>" in s and "publications[i].push_back" in s),("resource_terminal_guard","ledger::kMaximumLedgerModels" in s and "terminal_failure_already_recorded" in s),("fixture_three_ledgers","valid(fp,target.value)" in f and "valid(e1p,target.value)" in f and "valid(e2p,target.value)" in f),("fixture_stable_prefix","same(fp0.models[0]" in f and "same(e2p0.models[0]" in f),("fixture_source_mutation","mutable_e2" in f and "source_inventory_or_prefix" in f),("fixture_parameter_mutation","changed.parameters.theta2" in f and "parameter_identity_or_prefix" in f),("candidate_neutral_no_files",all(t not in s for t in("fstream","ifstream","filesystem","fopen","shat","6/5"))),("authority_defaults_false","candidate_evaluations = 0U" in h and "authority_promoted = false" in h),("exact_docker_inventory","COPY tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/ /src/" not in d),("digest_pinned_images","@sha256:9e94d19f" in d and "@sha256:8334e977" in d),("strict_compile","-fno-fast-math" in d and "-Werror" in d),("arb_flint_gmp_mpfr",all(t in d for t in("-lflint-arb","-lflint","-lgmp","-lmpfr")))))
 checks.append(("predecessor_derivative_model",passing("scripts/nhm2_g2h_e_s5_c08_analytic_factor_derivative_model_runtime_audit.py")))
 checks.append(("predecessor_factor_ledgers",passing("scripts/nhm2_g2h_e_s5_c08_analytic_factor_ledgers_runtime_audit.py")))
 b=run(["docker","build","--network=none","--quiet","--file",str(DOCKERFILE),"--tag",IMAGE,"."]);checks.append(("docker_build",b.returncode==0));image_id="";exe="";reports=[]
 if b.returncode==0:
  i=run(["docker","image","inspect",IMAGE,"--format","{{.Id}}"]);image_id=i.stdout.strip();checks.append(("image_identity",i.returncode==0 and image_id.startswith("sha256:") and len(image_id)==71))
  e=run(["docker","run","--rm","--network","none","--entrypoint","sha256sum",IMAGE,EXECUTABLE]);exe=e.stdout.strip().split()[0]if e.returncode==0 else"";checks.append(("executable_identity",exe==EXPECTED_EXECUTABLE))
  for n in range(2):
   p=run(["docker","run","--rm","--network","none","--read-only","--cap-drop","ALL","--security-opt","no-new-privileges","--pids-limit","64",IMAGE]);q=parse(p);reports.append(q);checks.extend(((f"fixture_{n}_exit",p.returncode==0),(f"fixture_{n}_15_of_15",q.get("checks_passed")==15 and q.get("checks_total")==15),(f"fixture_{n}_inventory",q.get("models_per_derivative")==2),(f"fixture_{n}_inert",q.get("candidate_evaluations")==0 and q.get("positive_parameter_samples")==0 and q.get("candidate_roots_created")is False),(f"fixture_{n}_authority",q.get("scientific_handler_linked")is False and q.get("authority_promoted")is False)))
  checks.append(("deterministic_report",reports[0]==reports[1]))
 checks.append(("protected_absent_after",all(not(ROOT/p).exists()for p in PROTECTED)));failed=[n for n,ok in checks if not ok];payload={"schema":"nhm2.g2h_e_s5.c08_analytic_factor_derivative_ledgers_runtime_audit.v1","status":"PASS"if not failed else"FAIL","checks_passed":len(checks)-len(failed),"checks_total":len(checks),"failed":failed,"image_id":image_id,"executable_sha256":exe,"candidate_evaluations":0,"positive_parameter_samples":0,"candidate_roots_created":False,"scientific_handler_linked":False,"authority_promoted":False};print(json.dumps(payload,separators=(",",":"),sort_keys=True));return 0 if not failed else 1
if __name__=="__main__":raise SystemExit(main())
