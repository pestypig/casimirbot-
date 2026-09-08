"""Stationary-target elastic capture kinematics and favorable-collision counts."""
import json,math
from pathlib import Path
m=100.;v=776.;escape=11.2;r=escape/v
rows=[]
for A in [16,24,28,56,58,96,107,108,131]:
 mass=A*.93149410242;beta=4*m*mass/(m+mass)**2;remaining=((m-mass)/(m+mass))**2
 assert abs(remaining-(1-beta))<1e-14
 count=max(1,math.ceil(math.log(r*r)/math.log(remaining)))
 assert remaining**count<=r*r and (count==1 or remaining**(count-1)>r*r)
 rows.append(dict(target_mass_number=A,target_mass_GeV=mass,max_energy_fraction_lost=beta,
  minimum_outgoing_speed_km_s=v*math.sqrt(remaining),capture_in_one_collision=remaining<=r*r,
  minimum_maximal_transfer_collisions_at_fixed_potential=count))
out=dict(status='elastic_capture_kinematics_not_capture_rate',incident_mass_GeV=m,
 local_incident_speed_km_s=v,chosen_escape_speed_km_s=escape,
 one_collision_target_mass_interval_GeV=[m*(1-r)/(1+r),m*(1+r)/(1-r)],rows=rows,
 assumptions=['stationary free nuclei and nonrelativistic elastic two-body kinematics',
 'chosen fixed gravitational potential, 776 km/s is local speed',
 'multiple-collision count grants maximal energy transfer every time on the same target species'],
 limitations=['approximate nuclear masses A times u; no abundance or terrestrial profile',
 'kinematically open is not a predicted or likely collision','no form factors, transport, thermal motion or retention',
 'counts are favorable kinematic minima, not required mean optical depths'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
