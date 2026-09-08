"""Single-insertion penguin flavor zero and dated conditional epsilon scale."""
import hashlib,json,math
from pathlib import Path
import sympy as s
p=Path(__file__).with_name('casimir-dp-axion-ndr-qcd-evolution-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='e705f95fbad0b65809030e4aa8b4b48f9ab7edc0f9d85d13130ddb1878626087'
qcd=json.loads(p.read_text());chat=qcd['rows'][1]['C_RGI_imag_GeV_minus2']
inputs=p.with_name('casimir-dp-axion-epsilon-kaon-conversion-2026-09-07.py')
assert hashlib.sha256(inputs.read_bytes()).hexdigest()=='bd235a57712bffa9209ccde48bcd08c3364183575fc5439fbc56c29c553d12b8'
# Retain the dated comparison values explicitly; no precision update is implied.
mK=.497611;fK=.1557;Bhat=.7625;kappa=.92;dm=3.484e-15;exp=.002228
matrix_over_2m=fK*fK*mK*Bhat/3
M12_imag=chat*matrix_over_2m
epsilon=kappa*M12_imag/(math.sqrt(2)*dm)
alternative=chat*kappa*fK*fK*mK*Bhat/(3*math.sqrt(2)*dm)
A=s.Matrix(3,3,s.symbols('a0:9'));b0,b1,b2,b3=s.symbols('b0:4');delta=s.eye(3)
def penguin(i,j,k,l):
    return b0*delta[i,j]*A[k,l]+b1*delta[k,l]*A[i,j]+b2*delta[i,l]*A[k,j]+b3*delta[k,j]*A[i,l]
zeros=[s.expand(penguin(1,0,1,0)),s.expand(penguin(0,1,0,1))]
checks=dict(single_insertion_flavor_zero=bool(all(z==0 for z in zeros)),matrix_normalization=bool(abs(alternative/epsilon-1)<1e-12))
assert all(checks.values())
out=dict(scope='Conditional hadronic scale with dated Bhat and charged-kaon fK proxy. Flavor proof covers single QCD/QED penguin with one flavor-diagonal produced current; not all finite scheme corrections or bilocal insertions.',C_RGI_imag_GeV_minus2=chat,inputs=dict(mK=mK,fK_proxy=fK,Bhat=Bhat,kappa=kappa,dmK=dm,experimental_magnitude=exp),M12_imag_GeV=M12_imag,conditional_epsilon_NP_magnitude=abs(epsilon),fraction_of_experimental_magnitude=abs(epsilon)/exp,ratio_to_old_approximate_NP=.0 if epsilon==0 else abs(epsilon)/.0010085201023,symbolic_penguin_zeros=[str(z) for z in zeros],checks=checks,exclusion_or_fit=False,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
