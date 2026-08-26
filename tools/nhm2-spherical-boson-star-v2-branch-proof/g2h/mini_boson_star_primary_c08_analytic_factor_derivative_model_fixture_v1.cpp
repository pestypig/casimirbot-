#include "mini_boson_star_primary_c08_analytic_factor_derivative_model_v1.hpp"

#include <flint/fmpq.h>

#include <cstddef>
#include <iostream>
#include <vector>

namespace derivative = nhm2::g2h_e_s5::primary_c08_analytic_factor_derivative_model_v1;
namespace analytic = nhm2::g2h_e_s5::primary_c08_analytic_parameter_jets_v1;
namespace factor = nhm2::g2h_e_s5::primary_c08_analytic_factor_model_v1;

namespace {
struct Ball { Ball(){arb_init(value);} ~Ball(){arb_clear(value);} arb_t value; };
void rational(arb_t value, long n, long d) {
    fmpq_t q; fmpq_init(q); fmpq_set_si(q,n,d);
    arb_set_fmpq(value,q,derivative::kPrecisionBits); fmpq_clear(q);
}
bool equal(arb_srcptr value,long n,long d){Ball expected;rational(expected.value,n,d);return arb_equal(value,expected.value);}
bool neutral(const derivative::Result &r){return r.candidate_evaluations==0U&&r.positive_parameter_samples==0U&&!r.candidate_root_created&&!r.scientific_handler_linked&&!r.authority_promoted;}
bool valid_remainders(const derivative::Output &o){for(std::size_t m=0;m<derivative::kDerivativeCount;++m){const auto v=o.view(static_cast<derivative::Derivative>(m));for(std::size_t j=0;j<derivative::kJetCount;++j)if(!arb_is_finite(v.remainders+j)||!arb_contains_zero(v.remainders+j))return false;}return true;}
}

int main(){
    std::vector<bool> checks;
    Ball kappa,mu,left,right; rational(kappa.value,1,2); rational(mu.value,1,4); arb_zero(left.value); rational(right.value,1,256);
    analytic::Output parameters; analytic::Result parameter_result{};
    checks.push_back(analytic::evaluate({analytic::Chart::positive,kappa.value,mu.value,nullptr},&parameters,&parameter_result));
    factor::Output factors; factor::Result factor_result{};
    checks.push_back(factor::evaluate({0U,derivative::ledger::ModelKind::origin,left.value,right.value,32U,&parameters},&factors,&factor_result));
    derivative::Output output; derivative::Result result{};
    const derivative::Input input{factors.view(factor::Factor::F),factors.view(factor::Factor::E1),factors.view(factor::Factor::E2),&parameters};
    checks.push_back(derivative::evaluate(input,&output,&result)&&result.accepted&&result.derivative_models_written==3U&&result.exact_fprime_formula&&result.exact_e1prime_formula&&result.exact_e2prime_formula&&neutral(result));
    const auto fp=output.view(derivative::Derivative::Fprime),e1p=output.view(derivative::Derivative::E1prime),e2p=output.view(derivative::Derivative::E2prime);
    checks.push_back(equal(fp.coefficients,-1,2)&&equal(e1p.coefficients,1,2)&&equal(e1p.coefficients+derivative::kJetCount,1,4)&&equal(e2p.coefficients,1,1)&&equal(e2p.coefficients+derivative::kJetCount,3,4));
    const auto mu_first=analytic::first_jet(2U);
    checks.push_back(equal(fp.coefficients+mu_first,-2,1)&&equal(e1p.coefficients+mu_first,2,1)&&equal(e2p.coefficients+mu_first,4,1));
    checks.push_back(valid_remainders(output)&&arb_is_zero(fp.remainders)&&result.complete_ordered_13_jet_inventory&&result.both_mixed_orientations_retained);
    Ball pleft,pright;rational(pleft.value,1,256);rational(pright.value,3,512);
    factor::Output positive; factor::Result positive_factor_result{};
    checks.push_back(factor::evaluate({1U,derivative::ledger::ModelKind::positive_panel,pleft.value,pright.value,24U,&parameters},&positive,&positive_factor_result));
    derivative::Output positive_output; derivative::Result positive_result{};
    checks.push_back(derivative::evaluate({positive.view(factor::Factor::F),positive.view(factor::Factor::E1),positive.view(factor::Factor::E2),&parameters},&positive_output,&positive_result)&&positive_output.view(derivative::Derivative::E2prime).order==24U&&neutral(positive_result));
    auto bad=input;bad.e2=positive.view(factor::Factor::E2);derivative::Result rejected{};
    checks.push_back(!derivative::evaluate(bad,&output,&rejected)&&rejected.detail==derivative::FailureDetail::source_geometry&&output.view(derivative::Derivative::Fprime).coefficients==nullptr);
    checks.push_back(!derivative::evaluate(input,nullptr,&rejected)&&rejected.detail==derivative::FailureDetail::input_or_output);
    checks.push_back(!derivative::evaluate(input,&output,nullptr));
    std::size_t passed=0;for(bool check:checks)passed+=check?1U:0U;
    std::cout<<"{\"schema\":\"nhm2.g2h_e_s5.c08_analytic_factor_derivative_model_fixture.v1\",\"status\":\""<<(passed==checks.size()?"PASS":"FAIL")<<"\",\"checks_passed\":"<<passed<<",\"checks_total\":"<<checks.size()<<",\"candidate_evaluations\":0,\"positive_parameter_samples\":0,\"candidate_roots_created\":false,\"scientific_handler_linked\":false,\"authority_promoted\":false}\n";
    return passed==checks.size()?0:1;
}
