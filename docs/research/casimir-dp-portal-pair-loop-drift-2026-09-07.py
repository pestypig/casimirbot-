"""Subtraction-independent two-light-scalar bubble drift; not absolute one-loop matching."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent;src=base/'casimir-dp-portal-force-tradeoff-2026-09-06.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='a578be25fbfaffc74331e3b77247ea834d5f361159eed282653e32d906813b94'
p=json.loads(src.read_text());radius=2.76302362398029e-7;qsoft=1.973269804e-7/radius # eV
qhard=.25e9;m=.001176 # homogeneous stable light mass benchmark, eV
# Integral log[1+x(1-x)q^2/m^2]. Counterterm cancels in differences.
def bubble(q):
    if q==0:return 0.
    return 2*math.sqrt(1+4*m*m/(q*q))*math.asinh(q/(2*m))-2
I=bubble(qhard)-bubble(qsoft)
direct=quad(lambda x:math.log((m*m+x*(1-x)*qhard*qhard)/(m*m+x*(1-x)*qsoft*qsoft)),0,1,epsabs=1e-9,epsrel=1e-10)[0]
# Representative Xe nucleus for a within-spectrum diagnostic; not isotope recast.
ma=122.;qlo=math.sqrt(2*ma*5.4e-6)*1e9;qhi=math.sqrt(2*ma*269.9e-6)*1e9
Ix=bubble(qhi)-bubble(qlo)
rows=[]
for r in p['rows']:
    delta=r['lambda_threshold_shift'];drift=delta*I/(16*math.pi**2)
    rows.append({'b_GeV':r['b_GeV'],'lambda_threshold_shift':delta,'absolute_bubble_coefficient_difference_over_tree_C_soft_to_hard':drift,'absolute_bubble_coefficient_difference_over_tree_C_Xe_window':delta*Ix/(16*math.pi**2),'satisfies_declared_10percent_cross_scale_drift':drift<=.1,'tree_confinement_threshold_Hz':r['required_confinement_frequency_Hz']})
checks={'Feynman_parameter_vs_closed_form':math.isclose(I,direct,rel_tol=1e-9),'logarithmic_hard_limit':abs(I/(2*math.log(qhard/qsoft))-1)<1e-4,'subtraction_reference_cancels':math.isclose((bubble(qhard)-bubble(1.))-(bubble(qsoft)-bubble(1.)),I,rel_tol=1e-12),'within_Xe_drift_smaller_than_cross_scale':0<Ix<I}
assert all(checks.values())
out={'checks':checks,'q_soft_eV':qsoft,'q_hard_eV':qhard,'light_mass_eV_benchmark':m,'bubble_log_difference':I,'within_Xe_log_difference':Ix,'Delta_lambda_max_for_diagnostic_10percent_drift':.1*16*math.pi**2/I,'rows':rows,'scope':'Vacuum Gaussian light bubble at two spacelike momenta, low-energy quadratic vertices. Finite momentum dependence only; does not fix counterterm/absolute amplitude. Medium occupations, full heavy matching, other diagrams and renormalization-group improvement absent.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
