#include "mini_boson_star_primary_c08_analytic_factor_derivative_ledgers_v1.hpp"
#include "mini_boson_star_primary_c08_analytic_factor_ledgers_v1.hpp"
#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"

#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <flint/fmpq.h>

#include <iostream>
#include <vector>

namespace derivatives = nhm2::g2h_e_s5::primary_c08_analytic_factor_derivative_ledgers_v1;
namespace derivative = nhm2::g2h_e_s5::primary_c08_analytic_factor_derivative_model_v1;
namespace factors = nhm2::g2h_e_s5::primary_c08_analytic_factor_ledgers_v1;
namespace factor = nhm2::g2h_e_s5::primary_c08_analytic_factor_model_v1;
namespace scalar = nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;

namespace {
constexpr char kGrowthHash[]="7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
constexpr char kJetHash[]="75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc";
constexpr char kGridHash[]="cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c";
constexpr char kAbiHash[]="6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca";
struct Ball{Ball(){arb_init(value);}~Ball(){arb_clear(value);}arb_t value;};
struct Storage{explicit Storage(std::size_t n):values(n){for(auto &v:values){arb_init(&v);arb_indeterminate(&v);}}~Storage(){for(auto &v:values)arb_clear(&v);}std::vector<arb_struct> values;};
void rational(arb_t value,long n,long d){fmpq_t q;fmpq_init(q);fmpq_set_si(q,n,d);arb_set_fmpq(value,q,derivative::kPrecisionBits);fmpq_clear(q);}
identity::InputIdentity make_identity(Storage &s){return{kGrowthHash,kJetHash,kGridHash,kAbiHash,identity::Chart::positive,1U,64L,s.values.size(),s.values.data()};}
scalar::Input make_scalar(identity::InputIdentity &id,Ball &h0,Ball &kappa,Ball &mass,Ball &eta){margins::Input m{&id,true,h0.value,kappa.value,mass.value,eta.value};return{{{m}},{10U,20U,30U,40U}};}
factors::Input make_factors(const scalar::Context &c,Ball &kappa,Ball &mass){return{scalar::published(c),{10U,20U,30U,40U},{50U,60U,70U},{factors::analytic::Chart::positive,kappa.value,mass.value,nullptr}};}
derivatives::Input make_derivatives(const factors::Context &c,Ball &kappa,Ball &mass){return{{factors::published(c,factor::Factor::F),factors::published(c,factor::Factor::E1),factors::published(c,factor::Factor::E2)},{50U,60U,70U},{80U,90U,100U},{derivatives::analytic::Chart::positive,kappa.value,mass.value,nullptr}};}
bool neutral(const derivatives::Result &r){return r.candidate_evaluations==0U&&r.positive_parameter_samples==0U&&!r.candidate_root_created&&!r.scientific_handler_linked&&!r.authority_promoted;}
bool valid(derivatives::ledger::LedgerView v,arb_srcptr right){derivatives::ledger::Output o;derivatives::ledger::Result r{};Ball z,one;arb_zero(z.value);arb_one(one.value);return derivatives::ledger::evaluate({v,z.value,right,z.value,one.value},&o,&r)&&r.accepted&&r.models_validated==v.model_count;}
bool same(const derivatives::ledger::ModelView &a,const derivatives::ledger::ModelView &b){if(a.coefficient_count!=b.coefficient_count||a.remainder_count!=b.remainder_count||a.kind!=b.kind||a.order!=b.order||!arb_equal(a.left_endpoint,b.left_endpoint)||!arb_equal(a.right_endpoint,b.right_endpoint))return false;for(std::size_t i=0;i<a.coefficient_count;++i)if(!arb_equal(a.coefficients+i,b.coefficients+i))return false;for(std::size_t i=0;i<a.remainder_count;++i)if(!arb_equal(a.remainders+i,b.remainders+i))return false;return true;}
}

int main(){std::vector<bool> checks;Storage storage(514U);auto id=make_identity(storage);Ball h0,kappa,mass,eta,target;arb_one(h0.value);rational(kappa.value,1,2);rational(mass.value,1,4);arb_indeterminate(eta.value);
auto scalar_input=make_scalar(id,h0,kappa,mass,eta);scalar::Context sc;scalar::Result sr{};checks.push_back(scalar::initialize(scalar_input,&sc,&sr));
auto factor_input=make_factors(sc,kappa,mass);factors::Context fc;factors::Result fr{};checks.push_back(factors::initialize(factor_input,&fc,&fr));
auto input=make_derivatives(fc,kappa,mass);derivatives::Context context;derivatives::Result initial{};checks.push_back(derivatives::initialize(input,&context,&initial)&&initial.accepted&&initial.model_triples_appended==1U&&initial.exact_derivative_identities&&neutral(initial));
const auto fp0=derivatives::published(context,derivative::Derivative::Fprime),e1p0=derivatives::published(context,derivative::Derivative::E1prime),e2p0=derivatives::published(context,derivative::Derivative::E2prime);checks.push_back(fp0.model_count==1U&&e1p0.model_count==1U&&e2p0.model_count==1U);
arb_mul_ui(target.value,scalar::right_endpoint(sc),129U,derivative::kPrecisionBits);arb_div_ui(target.value,target.value,128U,derivative::kPrecisionBits);scalar::Result sx{};checks.push_back(scalar::extend_to(&sc,target.value,&sx)&&sx.panels_appended==1U);auto fx=make_factors(sc,kappa,mass);factors::Result fer{};checks.push_back(factors::extend(fx,&fc,&fer)&&fer.model_triples_appended==1U);auto dx=make_derivatives(fc,kappa,mass);derivatives::Result extension{};checks.push_back(derivatives::extend(dx,&context,&extension)&&extension.accepted&&extension.model_triples_appended==1U&&extension.source_prefix_digests_checked==3U&&neutral(extension));
const auto fp=derivatives::published(context,derivative::Derivative::Fprime),e1p=derivatives::published(context,derivative::Derivative::E1prime),e2p=derivatives::published(context,derivative::Derivative::E2prime);checks.push_back(fp.model_count==2U&&e1p.model_count==2U&&e2p.model_count==2U&&same(fp0.models[0],fp.models[0])&&same(e2p0.models[0],e2p.models[0]));checks.push_back(valid(fp,target.value)&&valid(e1p,target.value)&&valid(e2p,target.value));
derivatives::Result noop{};checks.push_back(derivatives::extend(dx,&context,&noop)&&noop.model_triples_appended==0U&&noop.source_prefix_digests_checked==6U);
arb_ptr mutable_e2=const_cast<arb_ptr>(dx.source_ledgers[2].models[0].coefficients);arb_t saved;arb_init(saved);arb_set(saved,mutable_e2);arb_add_ui(mutable_e2,mutable_e2,1U,derivative::kPrecisionBits);derivatives::Result corrupt{};checks.push_back(!derivatives::extend(dx,&context,&corrupt)&&corrupt.detail==derivatives::FailureDetail::source_inventory_or_prefix&&derivatives::published(context,derivative::Derivative::Fprime).model_count==2U);arb_set(mutable_e2,saved);arb_clear(saved);
auto changed=dx;Ball changed_mass;rational(changed_mass.value,1,3);changed.parameters.theta2=changed_mass.value;derivatives::Result rejected{};checks.push_back(!derivatives::extend(changed,&context,&rejected)&&rejected.detail==derivatives::FailureDetail::parameter_identity_or_prefix);
auto duplicate=input;duplicate.derivative_identities={80U,80U,100U};derivatives::Context bad;checks.push_back(!derivatives::initialize(duplicate,&bad,&rejected));auto collision=input;collision.derivative_identities[0]=50U;checks.push_back(!derivatives::initialize(collision,&bad,&rejected));checks.push_back(!derivatives::initialize(input,nullptr,&rejected)&&!derivatives::initialize(input,&bad,nullptr));
std::size_t passed=0;for(bool c:checks)passed+=c?1U:0U;std::cout<<"{\"schema\":\"nhm2.g2h_e_s5.c08_analytic_factor_derivative_ledgers_fixture.v1\",\"status\":\""<<(passed==checks.size()?"PASS":"FAIL")<<"\",\"checks_passed\":"<<passed<<",\"checks_total\":"<<checks.size()<<",\"models_per_derivative\":"<<fp.model_count<<",\"candidate_evaluations\":0,\"positive_parameter_samples\":0,\"candidate_roots_created\":false,\"scientific_handler_linked\":false,\"authority_promoted\":false}\n";return passed==checks.size()?0:1;}
