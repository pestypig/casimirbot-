#include "mini_boson_star_primary_c08_p2_ledger_v1.hpp"
#include "mini_boson_star_primary_c08_p_ledgers_v1.hpp"
#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"

#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <flint/fmpq.h>

#include <array>
#include <cstddef>
#include <iostream>
#include <vector>

namespace p2 = nhm2::g2h_e_s5::primary_c08_p2_ledger_v1;
namespace p = nhm2::g2h_e_s5::primary_c08_p_ledgers_v1;
namespace scalar = nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;

namespace {

constexpr char kGrowthHash[] =
    "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
constexpr char kJetHash[] =
    "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc";
constexpr char kGridHash[] =
    "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c";
constexpr char kAbiHash[] =
    "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca";
// Lowest admitted origin-ledger order; keeps the fixture bounded while still
// traversing the real selector and its exact order grammar.
constexpr unsigned kManufacturedOrder = 32U;

struct Ball {
    Ball() { arb_init(value); }
    ~Ball() { arb_clear(value); }
    arb_t value;
};

struct Storage {
    explicit Storage(std::size_t count) : values(count) {
        for (auto &value : values) {
            arb_init(&value); arb_indeterminate(&value);
        }
    }
    ~Storage() { for (auto &value : values) arb_clear(&value); }
    std::vector<arb_struct> values;
};

void rational(arb_t value, long numerator, long denominator) {
    fmpq_t q;
    fmpq_init(q); fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, p::kPrecisionBits); fmpq_clear(q);
}

identity::InputIdentity make_identity(Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash,
            identity::Chart::positive, 1U, 64L,
            storage.values.size(), storage.values.data()};
}

scalar::Input make_scalar_input(identity::InputIdentity &input_identity,
                                Ball &h0, Ball &kappa, Ball &mass, Ball &eta) {
    margins::Input margin_input{&input_identity, true, h0.value, kappa.value,
                                mass.value, eta.value};
    return {{{margin_input}}, {10U, 20U, 30U, 40U}};
}

p::Input make_p_input(const scalar::Context &context, Ball &kappa,
                      Ball &mass) {
    return {scalar::published(context), {10U, 20U, 30U, 40U}, 50U, 60U,
            {p::analytic::Chart::positive, kappa.value, mass.value, nullptr}};
}

struct Dependencies {
    Ball left;
    Ball right;
    Ball center;
    std::array<std::vector<arb_struct>, p2::kDependencyCount> coefficients;
    std::array<std::array<arb_struct, p::kJetCount>, p2::kDependencyCount>
        remainders{};
    std::array<p2::ledger::ModelView, p2::kDependencyCount> models{};
    std::array<p2::finite::TaggedLedgerView, p2::kDependencyCount> tags{};

    Dependencies(const p::Context &, const scalar::Context &) {
        arb_zero(left.value); arb_zero(center.value);
        rational(right.value, 1L, 256L);
        const std::size_t coefficient_count =
            (static_cast<std::size_t>(kManufacturedOrder) + 1U)
            * p::kJetCount;
        for (std::size_t dependency = 0U;
             dependency < p2::kDependencyCount; ++dependency) {
            coefficients[dependency].resize(coefficient_count);
            for (auto &value : coefficients[dependency]) {
                arb_init(&value); arb_zero(&value);
            }
            for (auto &value : remainders[dependency]) {
                arb_init(&value); arb_zero(&value);
            }
            models[dependency] = {
                0U, p2::ledger::ModelKind::origin, left.value, right.value,
                center.value, kManufacturedOrder,
                coefficients[dependency].size(), coefficients[dependency].data(),
                remainders[dependency].size(), remainders[dependency].data()};
        }
        // Exact manufactured dependencies: P=-1/2, Pprime=0, B=1, V=0.
        // Thus P2=P diamond P is exactly 1/4 on the complete origin panel.
        rational(&coefficients[0][p::analytic::value_jet()], -1L, 2L);
        arb_one(&coefficients[2][p::analytic::value_jet()]);
        tags = {{{50U, {1U, &models[0]}}, {60U, {1U, &models[1]}},
                 {10U, {1U, &models[2]}}, {20U, {1U, &models[3]}}}};
    }

    ~Dependencies() {
        for (auto &dependency : remainders)
            for (auto &value : dependency) arb_clear(&value);
        for (auto &dependency : coefficients)
            for (auto &value : dependency) arb_clear(&value);
    }

    p2::Input input() const {
        return {{tags.size(), tags.data()}, {50U, 60U, 10U, 20U}, 70U};
    }
};

bool neutral(const p2::Result &result) {
    return result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created
        && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool p_neutral(const p::Result &result) {
    return result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created
        && !result.scientific_handler_linked
        && !result.authority_promoted;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage storage(514U);
    auto input_identity = make_identity(storage);
    Ball h0, kappa, mass, eta, expected, zero, one;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    rational(expected.value, 1L, 4L); arb_zero(zero.value); arb_one(one.value);

    auto scalar_input = make_scalar_input(input_identity, h0, kappa, mass, eta);
    scalar::Context scalar_context;
    scalar::Result scalar_result{};
    checks.push_back(scalar::initialize(scalar_input, &scalar_context,
                                        &scalar_result));
    auto p_input = make_p_input(scalar_context, kappa, mass);
    p::Context p_context;
    p::Result p_result{};
    checks.push_back(p::initialize(p_input, &p_context, &p_result)
                     && p_result.accepted && p_result.model_pairs_appended == 1U
                     && p_neutral(p_result));

    Dependencies dependencies(p_context, scalar_context);
    auto input = dependencies.input();
    p2::Context context;
    p2::Result initial{};
    const bool p2_initialized = p2::initialize(input, &context, &initial);
    checks.push_back(p2_initialized
                     && initial.accepted && initial.models_appended == 1U
                     && initial.exact_p2_orientation
                     && initial.p2_c08_010_passed && neutral(initial));
    if (!p2_initialized) {
        std::size_t passed = 0U;
        for (const bool check : checks) passed += check ? 1U : 0U;
        std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_p2_ledger_fixture.v1\""
                  << ",\"status\":\"FAIL\",\"phase\":\"p2_initialize\""
                  << ",\"detail\":\"" << p2::failure_detail_name(initial.detail)
                  << "\",\"checks_passed\":" << passed
                  << ",\"checks_total\":" << checks.size()
                  << ",\"candidate_evaluations\":0"
                  << ",\"positive_parameter_samples\":0"
                  << ",\"candidate_roots_created\":false"
                  << ",\"scientific_handler_linked\":false"
                  << ",\"authority_promoted\":false}\n";
        return 1;
    }
    const auto publication = p2::published(context);
    checks.push_back(publication.model_count == 1U
                     && publication.models[0].kind
                        == p2::ledger::ModelKind::origin
                     && publication.models[0].order == kManufacturedOrder
                     && arb_contains(publication.models[0].coefficients,
                                     expected.value));
    p2::ledger::Output ledger_output;
    p2::ledger::Result ledger_result{};
    const p2::ledger::Input ledger_input{publication, zero.value,
                                         publication.models[0].right_endpoint,
                                         zero.value, one.value};
    checks.push_back(p2::ledger::evaluate(ledger_input, &ledger_output,
                                          &ledger_result)
                     && ledger_result.accepted
                     && ledger_result.models_validated == 1U);

    p2::Result no_op{};
    checks.push_back(p2::extend(input, &context, &no_op)
                     && no_op.accepted && no_op.models_appended == 0U
                     && no_op.source_prefix_digests_checked == 4U
                     && neutral(no_op));

    arb_ptr mutable_lineage = const_cast<arb_ptr>(
        input.dependency_ledgers.ledgers[3].ledger.models[0].coefficients);
    arb_t saved;
    arb_init(saved); arb_set(saved, mutable_lineage);
    arb_add_ui(mutable_lineage, mutable_lineage, 1U, p::kPrecisionBits);
    p2::Result prefix_result{};
    checks.push_back(!p2::extend(input, &context, &prefix_result)
                     && prefix_result.detail
                        == p2::FailureDetail::dependency_inventory_or_prefix
                     && p2::published(context).model_count == 1U);
    arb_set(mutable_lineage, saved); arb_clear(saved);

    auto duplicate_input = input;
    duplicate_input.dependency_ledger_identities = {50U, 50U, 10U, 20U};
    p2::Context duplicate_context;
    p2::Result duplicate_result{};
    checks.push_back(!p2::initialize(duplicate_input, &duplicate_context,
                                     &duplicate_result));
    auto colliding_output = input;
    colliding_output.p2_ledger_identity = 50U;
    checks.push_back(!p2::initialize(colliding_output, &duplicate_context,
                                     &duplicate_result));
    checks.push_back(!p2::initialize(input, nullptr, &duplicate_result)
                     && duplicate_result.detail
                        == p2::FailureDetail::input_or_output);
    checks.push_back(!p2::initialize(input, &duplicate_context, nullptr));

    std::size_t passed = 0U;
    for (const bool check : checks) passed += check ? 1U : 0U;
    char *origin_dump = publication.model_count == 0U
        ? nullptr : arb_dump_str(publication.models[0].coefficients);
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_p2_ledger_fixture.v1\""
              << ",\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL") << "\""
              << ",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"failed_indices\":[";
    bool first_failed = true;
    for (std::size_t index = 0U; index < checks.size(); ++index) {
        if (checks[index]) continue;
        if (!first_failed) std::cout << ',';
        std::cout << index;
        first_failed = false;
    }
    std::cout << ']'
              << ",\"p2_models\":" << publication.model_count
              << ",\"p2_origin_order\":"
              << (publication.model_count == 0U
                      ? 0U : publication.models[0].order)
              << ",\"p2_origin_contains_quarter\":"
              << (publication.model_count != 0U
                      && arb_contains(publication.models[0].coefficients,
                                      expected.value) ? "true" : "false")
              << ",\"p2_origin_dump\":\""
              << (origin_dump == nullptr ? "" : origin_dump) << "\""
              << ",\"manufactured_order\":" << kManufacturedOrder
              << ",\"candidate_evaluations\":0"
              << ",\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    if (origin_dump != nullptr) flint_free(origin_dump);
    return passed == checks.size() ? 0 : 1;
}
