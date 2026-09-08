"""Necessary population requirements inside the conditional additive envelope."""
import hashlib,json,math
from pathlib import Path
base=Path(__file__).parent; root=base.parents[1]
p=base/'casimir-dp-exothermic-additive-coherence-2026-09-07.json'
x=json.loads(p.read_text())
cfg=root/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
c=json.loads(cfg.read_text()); r=x['rows'][1]; f=r['excited_fraction']
K=r['D_rigid_additive_ceiling']*f*f/(1-f)
rows=[]
for target in [1e-6,1e-3,c['frozen_diosi']['gaussian_exponent_at_hold']]:
    # Positive root, rationalized to avoid catastrophic subtraction.
    fmax=2*K/(K+math.sqrt(K*K+4*target*K))
    assert abs(K*(1-fmax)/fmax**2/target-1)<1e-12
    assert K*(1-2*fmax)/(2*fmax)**2<target
    rows.append(dict(target_D=target,necessary_excited_fraction_max=fmax,
        minimum_alphaD_epsilon_squared=1.7e-17/fmax,
        epsilon_at_alphaD_point1=math.sqrt(1.7e-17/(.1*fmax)),
        population_reduction_from_point0062=.0062/fmax))
out=dict(status='necessary_not_sufficient_conditional_requirements',
    source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),K=K,rows=rows,
    caveats=['Hypothetical thresholds except frozen theoretical comparator; none is measured sensitivity',
    'No population evolution, laboratory exclusion, or perturbative validity at extrapolated points established',
    'Inherited additive-amplitude envelope is not a full solid or field-theory bound'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
