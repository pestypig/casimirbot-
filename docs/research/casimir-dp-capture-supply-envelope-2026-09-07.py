"""Conditional capture budget, explicitly not a local transport solution."""
import math,json,hashlib
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-darkelf-xenon-match-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='c92d809cdf9dbaac381e73a78eaed8191c974f8bd78fd86910d16c17b064ca34'
x=json.loads(p.read_text())
R=6370e5; speed=776e5; age=4.54e9*365*86400
focus=1+(11.2/776)**2
supply_volume=math.pi*R**2*speed*age*focus
earth_volume=4*math.pi*R**3/3
enhance=supply_volume/earth_volume
nsource=.3/100
fast_for_one=1/x['raw_high_counts_per_fast_cm3']
survival_for_one=fast_for_one/nsource
rows=[]
for row in x['ratios']:
    req=row['slow_to_fast_density_ratio_for_DP_and_one_raw_high_count']
    required_local=req*fast_for_one
    rows.append(dict(temperature_K=row['particle_temperature_K'],
        maximum_Veffective_times_survival_cm3=supply_volume/req,
        uniform_density_maximum_survival=enhance/req,
        required_local_density_at_reference_cross_section_cm3=required_local,
        required_local_to_maximum_earth_average=required_local/(nsource*enhance)))
assert supply_volume>0 and focus>1
out=dict(status='conditional_supply_envelope_not_local_density_bound',
    source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
    assumptions=['constant mono-speed source over Earth age','geometric capture with Earth-only focusing',
                 'perfect capture','no evaporation or annihilation','no additional sources'],
    radius_cm=R,age_s=age,speed_cm_s=speed,focusing=focus,
    capture_supply_volume_cm3=supply_volume,earth_volume_cm3=earth_volume,
    maximum_average_to_source_density=enhance,source_density_cm3=nsource,
    maximum_earth_average_density_cm3=nsource*enhance,
    surviving_fast_fraction_for_one_raw_high_count_at_reference_cross_section=survival_for_one,
    rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
