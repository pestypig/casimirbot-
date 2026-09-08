from pathlib import Path
import math,json
V=.5;z=5;hold=.25;rows=[]
for D in [.029511464722144533,5.583442461599607e-4,1e-5,4.0008228792481166e-19]:
 loss=-math.expm1(-D);N=4*z*z/(V*V*loss*loss)
 assert abs(V*loss*math.sqrt(N)/2-z)<1e-12
 rows.append(dict(D_hypothetical=D,fractional_visibility_loss=loss,conservative_total_accepted_shots=N,hold_only_serial_years=N*hold/(365.25*86400)))
out=dict(status='illustrative_binary_readout_statistics_budget_not_measured_sensitivity',baseline_visibility=V,nominal_normal_SNR=z,hold_seconds=hold,rows=rows,assumptions=['independent Bernoulli readout','equal allocation to two settings','known same baseline visibility and phase','valid control isolates D','no drift, technical noise or selection bias','no preparation/reset overhead'],warning='An upper bound on D is not an expected signal; this is neither a universal sample lower bound nor a discovery power calculation.')
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
