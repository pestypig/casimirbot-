class Params(object):
  mk      =  0.497 
  mksig   =  0.000016
  mpi     =  0.134
  mpisig  =  0.00000018
  meta    =  0.547862
  metasig =  0.000017
  alpha   =  0.337848   # alpha strong at the charm mass
  beta    = -0.0293845  # alpha strong beta function
  gamma   = -0.332003   # anomalous dimension of quark mass
  gf      =  1.1663787e-05
  mu      =  0.547862
  L85     = -0.46e-3
  L85sig  =  0.20e-3
  L64     =  0.28e-3
  L64sig  =  0.17e-3
  F0      =  0.0803
  F0sig   =  0.0006
  vev     =  246.0      # Higgs vev

import numpy as np
import sys
import os 
import matplotlib.pyplot as plt
import csv

# define paths
hipsofcobra_path = os.path.dirname( os.path.abspath(__file__) )
classes_path = os.path.abspath(__file__)
input_path = '/'.join( (hipsofcobra_path, 'input' ) )
# results_path = '/'.join( (hipsofcobra_path, 'results' ) )
results_path = './results'

def get_input_file(filename):
  return '/'.join([input_path, filename])

assert os.path.isdir(input_path), "Directory 'input' must exist and contain Omnes data."
if not os.path.isdir(results_path):
  print("  'results' directory didn't exist. Creating 'results'. . . ")
  os.mkdir(results_path)

rng = np.random.default_rng(seed=None)

# Functions for computing s=0 values for all form factors. 
#
# MeanQ = True if we want to central prediction of FF, as opposed to a sampling from distributions. 
def GammaPi0(MeanQ=False): 
  _mu = Params.mu
  if MeanQ:
    _l85   = Params.L85
    _l64   = Params.L64
    _mpi   = Params.mpi
    _mk    = Params.mk
    _meta  = Params.meta
    _F0    = Params.F0
  else: 
    _l85   = rng.normal( Params.L85 , Params.L85sig  )
    _l64   = rng.normal( Params.L64 , Params.L64sig  )
    _mpi   = rng.normal( Params.mpi , Params.mpisig  )
    _mk    = rng.normal( Params.mk  , Params.mksig   )
    _meta  = rng.normal( Params.meta, Params.metasig )
    _F0    = rng.normal( Params.F0  , Params.F0sig   )
  
  return _mpi**2 + ( _mpi**4 / _F0**2 ) * ( 
    (1.0/32.0/np.pi**2) * (
      (8.0/9.0)+np.log(_mpi**2/_mu**2)- \
        (1.0/9.0)*np.log(_meta**2/_mu**2)
    ) + 8*_l85 + 16*_l64 
  )

def DeltaPi0(MeanQ=False): 
  _mu = Params.mu
  if MeanQ:
    _l85   = Params.L85
    _l64   = Params.L64
    _mpi   = Params.mpi
    _mk    = Params.mk
    _meta  = Params.meta
    _F0    = Params.F0
  else: 
    _l85   = rng.normal( Params.L85 , Params.L85sig  )
    _l64   = rng.normal( Params.L64 , Params.L64sig  )
    _mpi   = rng.normal( Params.mpi , Params.mpisig  )
    _mk    = rng.normal( Params.mk  , Params.mksig   )
    _meta  = rng.normal( Params.meta, Params.metasig )
    _F0    = rng.normal( Params.F0  , Params.F0sig   )
  
  return (_mpi**2*(_mk**2-0.5*_mpi**2))/_F0**2 * (
    -1.0/(72.0*np.pi**2)*(1.0+np.log(_meta**2/_mu**2))+16*_l64
  )

def GammaK0(MeanQ=False): 
  _mu = Params.mu
  if MeanQ:
    _l85   = Params.L85
    _l64   = Params.L64
    _mpi   = Params.mpi
    _mk    = Params.mk
    _meta  = Params.meta
    _F0    = Params.F0
  else: 
    _l85   = rng.normal( Params.L85 , Params.L85sig  )
    _l64   = rng.normal( Params.L64 , Params.L64sig  )
    _mpi   = rng.normal( Params.mpi , Params.mpisig  )
    _mk    = rng.normal( Params.mk  , Params.mksig   )
    _meta  = rng.normal( Params.meta, Params.metasig )
    _F0    = rng.normal( Params.F0  , Params.F0sig   )
  
  return 0.5*_mpi**2 * (
    1.0+np.log(_meta**2/_mpi**2)/(32*np.pi**2*_F0**2) +\
    8/_F0**2*((2*_mk**2-_mpi**2)*_l85+4*_mk**2*_l64   +\
                 _mk**2/(72*np.pi**2)*(1+np.log(_meta**2/_mu**2)) 
    )
  )
 
  '''
  return 0.5*_mpi**2+0.5*(_mpi**2/_F0**2)*(
    -_mpi**2/(32.0*np.pi**2)*np.log(_mpi**2/_mu**2)+\
    _meta**2/(32.0*np.pi**2)*np.log(_meta**2/_mu**2)+\
    (_mk**2-_mpi**2)*_l85
  ) + _mpi**2 *(_mk**2-0.5*_mpi**2) / (2.0*_F0**2) * (
    1.0/(72.0*np.pi**2)*(1.0+np.log(_meta**2/_mu**2))+\
    8*_l85+16*_l64
  )
  '''

def DeltaK0(MeanQ=False): 
  _mu = Params.mu
  if MeanQ:
    _l85   = Params.L85
    _l64   = Params.L64
    _mpi   = Params.mpi
    _mk    = Params.mk
    _meta  = Params.meta
    _F0    = Params.F0
  else: 
    _l85   = rng.normal( Params.L85 , Params.L85sig  )
    _l64   = rng.normal( Params.L64 , Params.L64sig  )
    _mpi   = rng.normal( Params.mpi , Params.mpisig  )
    _mk    = rng.normal( Params.mk  , Params.mksig   )
    _meta  = rng.normal( Params.meta, Params.metasig )
    _F0    = rng.normal( Params.F0  , Params.F0sig   )
  
  return (_mk**2-0.5*_mpi**2) * (
    1.0 + _mk**2/_F0**2 * (
      (1+np.log(_meta**2/_mu**2))/(36*np.pi**2)+8*(_l85+2*_l64) 
    )
  ) + \
  0.5*_mpi**2 * ( 
    np.log(_mpi**2/_meta**2)/(32*np.pi**2*_F0**2)-8/_F0**2*(_mk**2-_mpi**2)*_l85 
  )

  '''
  return (_mk**2-0.5*_mpi**2)+0.5*_mpi**2/_F0**2*(
    _mpi**2/(32.0*np.pi**2)*np.log(_mpi**2/_mu**2)-\
    _meta**2/(32.0*np.pi**2)*np.log(_meta**2/_mu**2)-\
    8*(_mk**2-_mpi**2)*_l85
  )+_mk**2*_mpi**2/_F0**2*(
    1.0/(36.0*np.pi**2)*(1.0+np.log(_meta**2/_mu**2))+\
    8*_l85+16*_l64
  )
  '''

def thetaPi0(MeanQ=False):
  return 2*GammaPi0(MeanQ=MeanQ)

def thetaK0(MeanQ=False):
  return 2*(DeltaK0(MeanQ=MeanQ)+GammaK0(MeanQ=MeanQ))

class HipsofCobra():
  def __init__(self, clist, Pname, method):
  # init generates the full set of G form factors 
  # for each of the iterations included in the Omnes 
  # files. These are stored in self.G_sl (sl=superlist):
  #   G_sl[0] = list of s values on which the G values are given
  #   G_sl[1] = list of iterations of G calculation
  #     G_sl[1][iter][i] = value of G from the iter-th iteration
  #                        evaluated at the i-th s value. 
    _npi = 1
    _nK  = np.sqrt(3.0)/2.0

    assert method=='DGL' or method=='BTPZ' , \
      " Method must be either 'DGL' or 'BTPZ'. "
    assert Pname=='pi' or Pname=='K' , \
      " Pname must be either 'pi' or 'K'. "
    
    if Pname=="pi": 
      self.prefactor = 3.0/16.0
      self.daughter_mass  = Params.mpi
    else: 
      self.prefactor = 0.25
      self.daughter_mass  = Params.mk

    self.clist  = clist
    self.method = method 
    self.Pname  = Pname
    self.xi_hat = self.clist[0] / Params.vev
    self.xi_s   = self.clist[1] / Params.vev
    self.xi_g   = self.clist[2]*Params.alpha**2/(3.0*np.pi*Params.vev*Params.beta) 
    #self.results_path = '/'.join( (hipsofcobra_path, 'results', 'clist='+str(self.clist) ) )
    self.results_path = '/'.join( ('./results', 'clist='+str(self.clist) ) )
    Gpi_deriv_mean =  self.xi_g 
    Gpi_deriv_std  =  abs(Gpi_deriv_mean)*0.0191309 # Unc. from (mpi/4*pi*F_pi)^2
    GK_deriv_mean  = -0.536731 / Params.vev
    GK_deriv_std   =  abs(GK_deriv_mean)*0.239351 # Unc. from (mK/4*pi*F_pi)^2

    if not os.path.isdir(self.results_path):
      print("  'results' directory for specific clist didn't exist. Creating 'results'. . . ")
      os.mkdir(self.results_path)
    # Read in C and D functions (canonical Omnes Solutions)
    #   in order to directly compute G form factors. 
    with open(get_input_file('hips_c1.txt'), 'r') as file:
      c1_sl = eval(file.read().replace('C', 'c') )
    with open(get_input_file('hips_c2.txt'), 'r') as file:
      c2_sl = eval(file.read().replace('C', 'c') )
    with open(get_input_file('hips_d1.txt'), 'r') as file:
      d1_sl = eval(file.read().replace('C', 'c') )
    with open(get_input_file('hips_d2.txt'), 'r') as file:
      d2_sl = eval(file.read().replace('C', 'c') )

    self.slist = c1_sl[0]
    number_of_inds  = len(c1_sl[0]) 
    number_of_iters = len(c1_sl[1])
    self.number_of_inds  = number_of_inds
    self.number_of_iters  = number_of_iters
    # Compute C and D derivatives
    c1_deriv = [ 0.5*( 
      (c1_sl[1][iter][1]-c1_sl[1][iter][0]) / (self.slist[1]-self.slist[0]) + \
      (c1_sl[1][iter][2]-c1_sl[1][iter][1]) / (self.slist[2]-self.slist[1])
    ) for iter in range(number_of_iters) ]
    c2_deriv = [ 0.5*( 
      (c2_sl[1][iter][1]-c2_sl[1][iter][0]) / (self.slist[1]-self.slist[0]) + \
      (c2_sl[1][iter][2]-c2_sl[1][iter][1]) / (self.slist[2]-self.slist[1])
    ) for iter in range(number_of_iters) ] 
    d1_deriv = [ 0.5*( 
      (d1_sl[1][iter][1]-d1_sl[1][iter][0]) / (self.slist[1]-self.slist[0]) + \
      (d1_sl[1][iter][2]-d1_sl[1][iter][1]) / (self.slist[2]-self.slist[1])
    ) for iter in range(number_of_iters) ] 
    d2_deriv = [ 0.5*( 
      (d2_sl[1][iter][1]-d2_sl[1][iter][0]) / (self.slist[1]-self.slist[0]) + \
      (d2_sl[1][iter][2]-d2_sl[1][iter][1]) / (self.slist[2]-self.slist[1])
    ) for iter in range(number_of_iters) ]
    
    self.G_sl = [self.slist, []]   
    for iter in range(number_of_iters):
      thetapi0_dummy  = thetaPi0()
      thetaK0_dummy   = thetaK0()
      Gpi0_dummy      = self.Gpi0()
      GK0_dummy       = self.GK0()
      Gpi_deriv_dummy = rng.normal( Gpi_deriv_mean, Gpi_deriv_std )
      GK_deriv_dummy  = rng.normal( GK_deriv_mean,  GK_deriv_std  )

      Qpi0 = _npi*Gpi0_dummy
      QK0  = _nK*GK0_dummy
      if self.method=='DGL':
        Qpi1 = _npi*Gpi_deriv_dummy-\
                  self.xi_g*(
                    _npi*thetapi0_dummy*c1_deriv[iter]+\
                    _nK*thetaK0_dummy*d1_deriv[iter]          
                  )
        QK1  = _nK*GK_deriv_dummy-\
                  self.xi_g*(
                    _nK*thetaK0_dummy*d2_deriv[iter]+\
                    _npi*thetapi0_dummy*c2_deriv[iter]
                  )
      else: 
        Qpi1 = _npi*Gpi_deriv_dummy-\
                c1_deriv[iter]*Gpi0_dummy-\
                d1_deriv[iter]*GK0_dummy
        QK1  = _nK*GK_deriv_dummy-\
                c2_deriv[iter]*Gpi0_dummy-\
                d2_deriv[iter]*GK0_dummy
      
      if Pname=='pi':
        gvals = [
          c1_sl[1][iter][i]*(Qpi0+self.slist[i]*Qpi1) +\
          d1_sl[1][iter][i]*(QK0+self.slist[i]*QK1)/_npi
          for i in range(number_of_inds)]
      else: 
        gvals = [
          c2_sl[1][iter][i]*(Qpi0+self.slist[i]*Qpi1) +\
          d2_sl[1][iter][i]*(QK0+self.slist[i]*QK1)/_nK
          for i in range(number_of_inds)]
      self.G_sl[1].append(gvals)

    # Method to extract upper- and lower- 1sigma contours of |G_P|, and
    # the values of the branching ratio associated with those. 
    
    self.G_band_list  = [] # Format: [ [svalue, mean, std], ... ]
    self.width_band_list = [] # Format: [ [svalue, central width, lower width, upper width], ... ]
    for i in range(self.number_of_inds):
      _s = self.slist[i]
      values_of_G_at_s = [abs(self.G_sl[1][iter][i]) for iter in range(self.number_of_iters)]
      G_mean = np.average( values_of_G_at_s ) 
      G_std  = np.std( values_of_G_at_s ) 
      self.G_band_list.append( [_s, G_mean, G_std] )
      self.width_band_list.append(
        [
          _s, 
          self.G_to_width(G_mean, i), 
          self.G_to_width(G_mean-G_std, i), 
          self.G_to_width(G_mean+G_std, i),
        ] 
      )
  def get_results_file(self, filename):
    return '/'.join([self.results_path, filename])
  
  # Function to write width lists out to csv. 
  def write_widths(self):
    _outfile_path = '/'.join([self.results_path, 'widths_data_'+'c='+str(self.clist)+'_'+self.Pname+'_method='+self.method+'.csv'])
    with open(_outfile_path, 'w', newline='') as f:
      writer = csv.writer(f, delimiter=',') 
      writer.writerow(['m_phi', 'width_central', 'width_lower', 'width_upper']) 
      for i in range(self.number_of_inds): 
        writer.writerow( 
          [np.sqrt(self.slist[i]), 
           self.width_band_list[i][1], 
           self.width_band_list[i][2], 
           self.width_band_list[i][3]]
        )

  # Functions to sample Gpi and GK, which depend on the 
  # instance-specific couplings and so are worth defining in-class. 
  def Gpi0(self, MeanQ=False):
    return self.xi_g*thetaPi0(MeanQ=MeanQ)-\
      (self.xi_hat+(1.0-Params.gamma)*self.xi_g)*GammaPi0(MeanQ=MeanQ)-\
      (self.xi_s+(1.0-Params.gamma)*self.xi_g)*DeltaPi0(MeanQ=MeanQ)

  def GK0(self, MeanQ=False):
    return self.xi_g*thetaK0(MeanQ=MeanQ)-\
      (self.xi_hat+(1.0-Params.gamma)*self.xi_g)*GammaK0(MeanQ=MeanQ)-\
      (self.xi_s+(1.0-Params.gamma)*self.xi_g)*DeltaK0(MeanQ=MeanQ)

  # Method to calculate widths from values of G. 
  def G_to_width(self, gval, s_index):
    if self.slist[s_index] <= 4*self.daughter_mass**2:
      return 0.0
    # Remember that v_W is included in the definition of G. 
    fac1 = self.prefactor/(np.sqrt(self.slist[s_index])*np.pi)
    fac2 = np.sqrt(1-4*self.daughter_mass**2/self.slist[s_index])
    fac3 = abs(gval)**2
    return fac1*fac2*fac3

  # Method to calculate widths of decays to leptons. 
  # def lepton_width()

  # Method to plot bundle of all the iterations. 
  def plot_sl(self, color=None, xlim=None, ylim=None, PrintQ=True, ShowQ=True):
    if PrintQ:
      print("\n  Making scatterplot of G form factor (superlist): ")
      print("    P = ", self.Pname, ", Method = ", self.method, 
            ", clist = ", self.clist, " . . . \n")
    plt.clf()
    plt.title(r'$G$ Form Factor for clist = '+str(self.clist)+' , method = '+self.method)
    for iter in range(self.number_of_iters):
      #plt.scatter( self.slist, list(map(abs, self.G_sl[1][iter])), c=color, marker='.', s=1, alpha=0.5)
      plt.scatter( self.slist, [ Params.vev*abs(g) for g in self.G_sl[1][iter] ] , c=color, marker='.', s=1, alpha=0.5)
    plt.yscale('log')
    plt.xlabel(r'$s \, [{\rm GeV^2}]$') 
    if self.Pname=='pi':
      plt.ylabel(r'$v_W |G_\pi| \, [{\rm GeV^2}]$, '+self.method) 
    if self.Pname=='K':
      plt.ylabel(r'$v_W |G_K| \, [{\rm GeV^2}]$, '+self.method) 
    if xlim:
      plt.xlim(xlim)
    if ylim:
      plt.ylim(ylim) 
    plt.savefig(self.get_results_file('scatter'+'_clist='+str(self.clist)+'_G'+self.Pname+'_'+self.method+'.pdf')) 
    if ShowQ:
      plt.show()
    plt.clf()

  # Plot G form factor, including lower- and upper-countours. 
  def plot_G_countours(self, color=None, xlim=None, ylim=None, PrintQ=True, ShowQ=True):
    if PrintQ:
      print("\n  Making plot of G form factor (contours): ")
      print("    P = ", self.Pname, ", Method = ", self.method, 
            ", clist = ", self.clist, " . . . \n")
    plt.clf()
    mean_list = np.array( [Params.vev*self.G_band_list[i][1] for i in range(self.number_of_inds) ] )
    std_list  = np.array( [Params.vev*self.G_band_list[i][2] for i in range(self.number_of_inds) ] )
    for uncflag in [0,-1,1]:
      plt.plot( 
        self.slist, mean_list + uncflag*std_list,
        c=color, alpha=0.5 
      )
    plt.yscale('log')
    plt.xlabel(r'$s \, [{\rm GeV^2}]$') 
    if self.Pname=='pi':
      plt.title(r'$G_\pi$ Form Factor for clist = '+str(self.clist)+' , method = '+str(self.method))
      plt.ylabel(r'$v_W |G_\pi| \, [{\rm GeV^2}]$, '+self.method) 
    if self.Pname=='K':
      plt.title(r'$G_K$ Form Factor for clist = '+str(self.clist)+' , method = '+str(self.method))
      plt.ylabel(r'$v_W |G_K| \, [{\rm GeV^2}]$, '+self.method) 
    if xlim:
      plt.xlim(xlim)
    if ylim:
      plt.ylim(ylim) 
    plt.savefig(self.get_results_file('G_contours'+'_clist='+str(self.clist)+'_G'+self.Pname+'_'+self.method+'.pdf')) 
    if ShowQ:
      plt.show()
    plt.clf()
 
  # Plot width contours, including lower- and upper-countours. 
  def plot_width_countours(self, color=None, xlim=None, ylim=None, PrintQ=True, ShowQ=True):
    if PrintQ:
      print("\n  Making plot of widths (contours): ")
      print("    P = ", self.Pname, ", Method = ", self.method, 
            ", clist = ", self.clist, " . . . \n")
    plt.clf()
    central_list = np.array( [self.width_band_list[i][1] for i in range(self.number_of_inds) ] )
    lower_list   = np.array( [self.width_band_list[i][2] for i in range(self.number_of_inds) ] )
    upper_list   = np.array( [self.width_band_list[i][3] for i in range(self.number_of_inds) ] )
    for foo in [central_list, lower_list, upper_list]:
      plt.plot( 
        np.sqrt( self.slist ), foo,
        c=color, alpha=0.5 
      )
    plt.yscale('log')
    plt.xlabel(r'$m_\phi \, [{\rm GeV}]$') 
    if self.Pname=='pi':
      plt.title(r'$\Gamma(\phi \to \pi \pi)$ for clist = '+str(self.clist)+' , method = '+str(self.method))
      plt.ylabel(r'$\Gamma_{\pi \pi} \, [{\rm GeV}]$') 
    if self.Pname=='K':
      plt.title(r'$\Gamma(\phi \to K K)$ for clist = '+str(self.clist)+' , method = '+str(self.method))
      plt.ylabel(r'$\Gamma_{K K} \, [{\rm GeV}]$') 
    if xlim:
      plt.xlim(xlim)
    if ylim:
      plt.ylim(ylim) 
    plt.savefig(self.get_results_file('width'+'_clist='+str(self.clist)+'_'+self.Pname+'_'+self.method+'.pdf')) 
    if ShowQ:
      plt.show()
    plt.clf()