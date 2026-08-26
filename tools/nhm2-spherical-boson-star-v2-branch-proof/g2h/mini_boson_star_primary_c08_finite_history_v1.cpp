#include "mini_boson_star_primary_c08_finite_history_v1.hpp"

#include "mini_boson_star_sha256_v1.hpp"

#include <arb_hypgeom.h>
#include <flint/flint.h>

#include <algorithm>
#include <array>
#include <limits>
#include <set>
#include <string>
#include <utility>

namespace nhm2::g2h_e_s5::primary_c08_finite_history_v1 {
namespace {

constexpr std::array<std::size_t, chronology::kTailSplitAttemptCount>
    kOnsets = chronology::kTailWitnessOnsets;
constexpr char kLedgerDomain[] = "nhm2-g2h-e-s5/c08-011c-ledger/v1\n";

void fail(Result *result, FailureDetail detail) {
    const auto finite_failure = result->propagated_finite_failure;
    *result = Result{};
    result->detail = detail;
    result->propagated_finite_failure = finite_failure;
}

bool valid_onset(std::size_t t0, std::size_t terminal_t) {
    return std::find(kOnsets.begin(), kOnsets.end(), t0) != kOnsets.end()
        && t0 <= std::numeric_limits<std::size_t>::max() / 2U
        && terminal_t == 2U * t0;
}

void append_u64(std::string &bytes, std::uint64_t value) {
    for (unsigned shift = 0U; shift < 64U; shift += 8U)
        bytes.push_back(static_cast<char>((value >> shift) & 0xffU));
}

bool append_arb(std::string &bytes, arb_srcptr value) {
    if (value == nullptr || !arb_is_finite(value)) return false;
    char *dump = arb_dump_str(value);
    if (dump == nullptr) return false;
    const std::string serialized(dump);
    flint_free(dump);
    append_u64(bytes, serialized.size());
    bytes.append(serialized);
    return true;
}

bool append_model(std::string &bytes, const ledger::ModelView &model) {
    append_u64(bytes, model.ordinal);
    bytes.push_back(static_cast<char>(model.kind));
    append_u64(bytes, model.order);
    append_u64(bytes, model.coefficient_count);
    append_u64(bytes, model.remainder_count);
    if (!append_arb(bytes, model.left_endpoint)
        || !append_arb(bytes, model.right_endpoint)
        || !append_arb(bytes, model.expansion_center))
        return false;
    if (model.coefficients == nullptr || model.remainders == nullptr)
        return false;
    for (std::size_t i = 0U; i < model.coefficient_count; ++i)
        if (!append_arb(bytes, model.coefficients + i)) return false;
    for (std::size_t i = 0U; i < model.remainder_count; ++i)
        if (!append_arb(bytes, model.remainders + i)) return false;
    return true;
}

bool valid_set_shape(LedgerSetView view) {
    if (view.ledgers == nullptr || view.ledger_count == 0U
        || view.ledger_count > kMaximumTaggedLedgers)
        return false;
    std::uint32_t prior = 0U;
    for (std::size_t index = 0U; index < view.ledger_count; ++index) {
        const TaggedLedgerView &tagged = view.ledgers[index];
        if (index != 0U && tagged.identity <= prior) return false;
        if (tagged.ledger.models == nullptr || tagged.ledger.model_count == 0U
            || tagged.ledger.model_count > ledger::kMaximumLedgerModels)
            return false;
        prior = tagged.identity;
    }
    return true;
}

bool serialize_set(LedgerSetView view,
                   const std::vector<std::size_t> *prefix_counts,
                   std::string *bytes, std::size_t *model_count) {
    if (bytes == nullptr || model_count == nullptr || !valid_set_shape(view))
        return false;
    if (prefix_counts != nullptr && prefix_counts->size() != view.ledger_count)
        return false;
    bytes->assign(kLedgerDomain);
    append_u64(*bytes, view.ledger_count);
    *model_count = 0U;
    for (std::size_t index = 0U; index < view.ledger_count; ++index) {
        const TaggedLedgerView &tagged = view.ledgers[index];
        const std::size_t count = prefix_counts == nullptr
            ? tagged.ledger.model_count : (*prefix_counts)[index];
        if (count == 0U || count > tagged.ledger.model_count) return false;
        append_u64(*bytes, tagged.identity);
        append_u64(*bytes, count);
        if (*model_count > std::numeric_limits<std::size_t>::max() - count)
            return false;
        *model_count += count;
        for (std::size_t model = 0U; model < count; ++model)
            if (!append_model(*bytes, tagged.ledger.models[model])) return false;
    }
    return true;
}

bool hex_nibble(char value, std::uint8_t *out) {
    if (value >= '0' && value <= '9') *out = value - '0';
    else if (value >= 'a' && value <= 'f') *out = value - 'a' + 10U;
    else return false;
    return true;
}

bool digest_bytes(const std::string &bytes,
                  std::array<std::uint8_t, kDigestBytes> *digest) {
    const std::string hex = sha256_v1::text(bytes);
    if (hex.size() != 2U * digest->size()) return false;
    for (std::size_t i = 0U; i < digest->size(); ++i) {
        std::uint8_t high = 0U, low = 0U;
        if (!hex_nibble(hex[2U * i], &high)
            || !hex_nibble(hex[2U * i + 1U], &low))
            return false;
        (*digest)[i] = static_cast<std::uint8_t>((high << 4U) | low);
    }
    return true;
}

const TaggedLedgerView *find_ledger(LedgerSetView view,
                                    std::uint32_t identity) {
    for (std::size_t index = 0U; index < view.ledger_count; ++index)
        if (view.ledgers[index].identity == identity)
            return view.ledgers + index;
    return nullptr;
}

bool validate_terminal_ledger(const TaggedLedgerView &tagged,
                              std::size_t terminal_t,
                              std::size_t *models_validated) {
    arb_t zero, one, terminal;
    arb_init(zero); arb_init(one); arb_init(terminal);
    arb_zero(zero); arb_one(one); arb_set_ui(terminal, terminal_t);
    ledger::Output coverage;
    ledger::Result result{};
    const ledger::Input input{tagged.ledger, zero, terminal, zero, one};
    const bool accepted = ledger::evaluate(input, &coverage, &result);
    arb_clear(terminal); arb_clear(one); arb_clear(zero);
    if (!accepted) return false;
    *models_validated += result.models_validated;
    return true;
}

bool evaluate_model_at(arb_ptr value, const ledger::ModelView &model,
                       arb_srcptr point, std::size_t jet) {
    arb_t offset, power, term;
    arb_init(offset); arb_init(power); arb_init(term);
    arb_sub(offset, point, model.expansion_center, kPrecisionBits);
    arb_zero(value);
    for (unsigned degree = 0U; degree <= model.order; ++degree) {
        arb_pow_ui(power, offset, degree, kPrecisionBits);
        arb_mul(term, model.coefficients
                    + static_cast<std::size_t>(degree) * kJetCount + jet,
                power, kPrecisionBits);
        arb_add(value, value, term, kPrecisionBits);
    }
    arb_add(value, value, model.remainders + jet, kPrecisionBits);
    const bool finite = arb_is_finite(value);
    arb_clear(term); arb_clear(power); arb_clear(offset);
    return finite;
}

bool onset_box(arb_ptr value, const ledger::LedgerView &view,
               arb_srcptr point, std::size_t jet, std::size_t *models_hulled) {
    bool found = false;
    arb_t candidate;
    arb_init(candidate);
    for (std::size_t index = 0U; index < view.model_count; ++index) {
        const ledger::ModelView &model = view.models[index];
        if (!arb_le(model.left_endpoint, point)
            || !arb_le(point, model.right_endpoint))
            continue;
        if (!evaluate_model_at(candidate, model, point, jet)) {
            arb_clear(candidate);
            return false;
        }
        if (!found) arb_set(value, candidate);
        else arb_union(value, value, candidate, kPrecisionBits);
        found = true;
        ++*models_hulled;
    }
    arb_clear(candidate);
    return found && arb_is_finite(value);
}

bool exact_upper(arb_ptr output, arb_srcptr input) {
    if (!arb_is_finite(input)) return false;
    arf_t upper;
    arf_init(upper);
    arb_get_ubound_arf(upper, input, kPrecisionBits);
    const bool finite = arf_is_finite(upper);
    if (finite) arb_set_arf(output, upper);
    arf_clear(upper);
    return finite;
}

bool produce_p_norms(const Input &input, LedgerSetView after, Output *output,
                     Result *result) {
    std::array<const TaggedLedgerView *, kStateCount> states{};
    std::set<std::uint32_t> identities;
    for (std::size_t state = 0U; state < kStateCount; ++state) {
        const std::uint32_t identity =
            input.scalar_state_ledger_identities[state];
        states[state] = find_ledger(after, identity);
        if (states[state] == nullptr || !identities.insert(identity).second)
            return false;
    }
    arb_t onset;
    arb_init(onset); arb_set_ui(onset, input.t0);
    for (std::size_t jet = 0U; jet < kJetCount; ++jet)
        for (std::size_t state = 0U; state < kStateCount; ++state)
            if (!onset_box(output->onset_state(jet, state),
                           states[state]->ledger, onset, jet,
                           &result->onset_models_hulled)) {
                arb_clear(onset);
                return false;
            }
    arb_clear(onset);
    result->onset_boxes_produced = kJetCount * kStateCount;

    arb_t p, yi, yj, term, sum, root;
    arb_init(p); arb_init(yi); arb_init(yj); arb_init(term);
    arb_init(sum); arb_init(root);
    for (std::size_t jet = 0U; jet < kJetCount; ++jet) {
        arb_zero(sum);
        for (std::size_t i = 0U; i < kStateCount; ++i) {
            arb_abs(yi, output->onset_state(jet, i));
            for (std::size_t j = 0U; j < kStateCount; ++j) {
                arb_set_fmpq(p, fmpq_mat_entry(input.tail_witness->p_lyap,
                                               i, j), kPrecisionBits);
                arb_abs(p, p);
                arb_abs(yj, output->onset_state(jet, j));
                arb_mul(term, p, yi, kPrecisionBits);
                arb_mul(term, term, yj, kPrecisionBits);
                arb_add(sum, sum, term, kPrecisionBits);
                ++result->p_norm_quadratic_terms;
            }
        }
        if (!arb_is_finite(sum) || arb_is_negative(sum)) {
            arb_clear(root); arb_clear(sum); arb_clear(term); arb_clear(yj);
            arb_clear(yi); arb_clear(p);
            return false;
        }
        arb_set(output->onset_qp.data() + jet, sum);
        arb_sqrt(root, sum, kPrecisionBits);
        if (!exact_upper(output->onset_norm_p_upper.data() + jet, root)) {
            arb_clear(root); arb_clear(sum); arb_clear(term); arb_clear(yj);
            arb_clear(yi); arb_clear(p);
            return false;
        }
    }
    arb_set(output->c0o, output->onset_norm_p_upper.data());
    arb_set(output->c1o, output->onset_norm_p_upper.data() + 1U);
    for (std::size_t jet = 2U; jet <= 3U; ++jet)
        arb_max(output->c1o, output->c1o,
                output->onset_norm_p_upper.data() + jet, kPrecisionBits);
    arb_set(output->c2o, output->onset_norm_p_upper.data() + 4U);
    for (std::size_t jet = 5U; jet < kJetCount; ++jet)
        arb_max(output->c2o, output->c2o,
                output->onset_norm_p_upper.data() + jet, kPrecisionBits);
    arb_clear(root); arb_clear(sum); arb_clear(term); arb_clear(yj);
    arb_clear(yi); arb_clear(p);
    return arb_is_finite(output->c0o) && arb_is_finite(output->c1o)
        && arb_is_finite(output->c2o);
}

bool moment(arb_ptr output, arb_srcptr sigma, arb_srcptr h, unsigned degree,
            Result *result) {
    if (arb_is_zero(sigma)) {
        arb_pow_ui(output, h, degree + 1U, kPrecisionBits);
        arb_div_ui(output, output, degree + 1U, kPrecisionBits);
        ++result->exact_zero_sigma_moments;
        return arb_is_finite(output) && !arb_is_negative(output);
    }
    if (!arb_is_positive(sigma)) return false;
    arb_t shape, z, gamma, denominator;
    arb_init(shape); arb_init(z); arb_init(gamma); arb_init(denominator);
    arb_set_ui(shape, degree + 1U);
    arb_mul(z, sigma, h, kPrecisionBits);
    arb_hypgeom_gamma_lower(gamma, shape, z, 0, kPrecisionBits);
    arb_pow_ui(denominator, sigma, degree + 1U, kPrecisionBits);
    arb_div(output, gamma, denominator, kPrecisionBits);
    ++result->incomplete_gamma_moments;
    const bool valid = arb_is_finite(output) && !arb_is_negative(output);
    arb_clear(denominator); arb_clear(gamma); arb_clear(z); arb_clear(shape);
    return valid;
}

bool integrate_history_request(const HistoryRequest &request,
                               std::size_t request_ordinal,
                               const TaggedLedgerView &tagged,
                               std::size_t t0, Output *output,
                               Result *result) {
    arb_t onset, clipped_right, h, exponential, sigma_left;
    arb_t coefficient_mag, remainder_mag, weighted_moment, term, panel_sum;
    arb_init(onset); arb_init(clipped_right); arb_init(h); arb_init(exponential);
    arb_init(sigma_left); arb_init(coefficient_mag); arb_init(remainder_mag);
    arb_init(weighted_moment); arb_init(term); arb_init(panel_sum);
    arb_set_ui(onset, t0);
    for (std::size_t model_index = 0U;
         model_index < tagged.ledger.model_count; ++model_index) {
        const ledger::ModelView &model = tagged.ledger.models[model_index];
        if (!arb_lt(model.left_endpoint, onset)) break;
        if (arb_le(model.right_endpoint, onset))
            arb_set(clipped_right, model.right_endpoint);
        else
            arb_set(clipped_right, onset);
        arb_sub(h, clipped_right, model.left_endpoint, kPrecisionBits);
        if (!arb_is_positive(h)) {
            arb_clear(panel_sum); arb_clear(term); arb_clear(weighted_moment);
            arb_clear(remainder_mag); arb_clear(coefficient_mag);
            arb_clear(sigma_left); arb_clear(exponential); arb_clear(h);
            arb_clear(clipped_right); arb_clear(onset);
            return false;
        }
        arb_mul(sigma_left, request.sigma, model.left_endpoint,
                kPrecisionBits);
        arb_neg(sigma_left, sigma_left);
        arb_exp(exponential, sigma_left, kPrecisionBits);
        if (!arb_is_finite(exponential) || arb_is_negative(exponential)) {
            arb_clear(panel_sum); arb_clear(term); arb_clear(weighted_moment);
            arb_clear(remainder_mag); arb_clear(coefficient_mag);
            arb_clear(sigma_left); arb_clear(exponential); arb_clear(h);
            arb_clear(clipped_right); arb_clear(onset);
            return false;
        }
        for (std::size_t jet = 0U; jet < kJetCount; ++jet) {
            arb_zero(panel_sum);
            for (unsigned degree = 0U; degree <= model.order; ++degree) {
                if (!moment(weighted_moment, request.sigma, h, degree,
                            result)) {
                    arb_clear(panel_sum); arb_clear(term);
                    arb_clear(weighted_moment); arb_clear(remainder_mag);
                    arb_clear(coefficient_mag); arb_clear(sigma_left);
                    arb_clear(exponential); arb_clear(h);
                    arb_clear(clipped_right); arb_clear(onset);
                    return false;
                }
                arb_abs(coefficient_mag,
                        model.coefficients
                        + static_cast<std::size_t>(degree) * kJetCount + jet);
                arb_mul(term, coefficient_mag, weighted_moment,
                        kPrecisionBits);
                arb_add(panel_sum, panel_sum, term, kPrecisionBits);
                ++result->state_coefficients_read;
            }
            if (!moment(weighted_moment, request.sigma, h, 0U, result)) {
                arb_clear(panel_sum); arb_clear(term); arb_clear(weighted_moment);
                arb_clear(remainder_mag); arb_clear(coefficient_mag);
                arb_clear(sigma_left); arb_clear(exponential); arb_clear(h);
                arb_clear(clipped_right); arb_clear(onset);
                return false;
            }
            arb_abs(remainder_mag, model.remainders + jet);
            arb_mul(term, remainder_mag, weighted_moment, kPrecisionBits);
            arb_add(panel_sum, panel_sum, term, kPrecisionBits);
            arb_mul(panel_sum, panel_sum, exponential, kPrecisionBits);
            if (!arb_is_finite(panel_sum) || arb_is_negative(panel_sum)) {
                arb_clear(panel_sum); arb_clear(term); arb_clear(weighted_moment);
                arb_clear(remainder_mag); arb_clear(coefficient_mag);
                arb_clear(sigma_left); arb_clear(exponential); arb_clear(h);
                arb_clear(clipped_right); arb_clear(onset);
                return false;
            }
            PanelContribution contribution;
            contribution.request_ordinal = request_ordinal;
            contribution.orientation = request.orientation;
            contribution.ledger_identity = request.ledger_identity;
            contribution.model_ordinal = model.ordinal;
            contribution.jet_ordinal = jet;
            arb_set(contribution.left_endpoint, model.left_endpoint);
            arb_set(contribution.right_endpoint, clipped_right);
            arb_set(contribution.contribution, panel_sum);
            output->panel_contributions.push_back(std::move(contribution));
            arb_add(output->history_total(request_ordinal, jet),
                    output->history_total(request_ordinal, jet), panel_sum,
                    kPrecisionBits);
            ++result->history_panels_integrated;
        }
    }
    arb_clear(panel_sum); arb_clear(term); arb_clear(weighted_moment);
    arb_clear(remainder_mag); arb_clear(coefficient_mag);
    arb_clear(sigma_left); arb_clear(exponential); arb_clear(h);
    arb_clear(clipped_right); arb_clear(onset);
    return true;
}

bool produce_histories(const Input &input, LedgerSetView after, Output *output,
                       Result *result, FailureDetail *detail) {
    if (input.history_request_count == 0U
        || input.history_request_count > kMaximumHistoryRequests
        || input.history_requests == nullptr) {
        *detail = FailureDetail::history_inventory_or_sigma;
        return false;
    }
    std::set<std::uint32_t> orientations;
    for (std::size_t request = 0U; request < input.history_request_count;
         ++request) {
        const HistoryRequest &item = input.history_requests[request];
        const TaggedLedgerView *tagged = find_ledger(after,
                                                     item.ledger_identity);
        if (tagged == nullptr || item.sigma == nullptr
            || !arb_is_finite(item.sigma)
            || !(arb_is_zero(item.sigma) || arb_is_positive(item.sigma))
            || !orientations.insert(item.orientation).second) {
            *detail = FailureDetail::history_inventory_or_sigma;
            return false;
        }
        if (!integrate_history_request(item, request, *tagged, input.t0,
                                       output, result)) {
            *detail = FailureDetail::weighted_history_moment_failed;
            return false;
        }
    }
    result->increasing_panel_chronology = true;
    return true;
}

void reset(Output *output) {
    output->ledger_digest_before.fill(0U);
    output->reused_prefix_digest.fill(0U);
    output->ledger_digest_after.fill(0U);
    output->ledger_models_before = 0U;
    output->ledger_models_after = 0U;
    for (auto &value : output->onset_state_boxes) arb_zero(&value);
    for (auto &value : output->onset_qp) arb_zero(&value);
    for (auto &value : output->onset_norm_p_upper) arb_zero(&value);
    arb_zero(output->c0o); arb_zero(output->c1o); arb_zero(output->c2o);
    output->panel_contributions.clear();
    for (auto &value : output->history_totals) arb_clear(&value);
    output->history_totals.clear();
}

}  // namespace

PanelContribution::PanelContribution() {
    arb_init(left_endpoint); arb_init(right_endpoint); arb_init(contribution);
}

PanelContribution::~PanelContribution() {
    arb_clear(contribution); arb_clear(right_endpoint); arb_clear(left_endpoint);
}

PanelContribution::PanelContribution(PanelContribution &&other) noexcept
    : request_ordinal(other.request_ordinal), orientation(other.orientation),
      ledger_identity(other.ledger_identity), model_ordinal(other.model_ordinal),
      jet_ordinal(other.jet_ordinal) {
    arb_init(left_endpoint); arb_init(right_endpoint); arb_init(contribution);
    arb_swap(left_endpoint, other.left_endpoint);
    arb_swap(right_endpoint, other.right_endpoint);
    arb_swap(contribution, other.contribution);
}

PanelContribution &PanelContribution::operator=(PanelContribution &&other) noexcept {
    if (this != &other) {
        request_ordinal = other.request_ordinal;
        orientation = other.orientation;
        ledger_identity = other.ledger_identity;
        model_ordinal = other.model_ordinal;
        jet_ordinal = other.jet_ordinal;
        arb_swap(left_endpoint, other.left_endpoint);
        arb_swap(right_endpoint, other.right_endpoint);
        arb_swap(contribution, other.contribution);
    }
    return *this;
}

Output::Output()
    : onset_state_boxes(kJetCount * kStateCount), onset_qp(kJetCount),
      onset_norm_p_upper(kJetCount) {
    for (auto &value : onset_state_boxes) arb_init(&value);
    for (auto &value : onset_qp) arb_init(&value);
    for (auto &value : onset_norm_p_upper) arb_init(&value);
    arb_init(c0o); arb_init(c1o); arb_init(c2o);
}

Output::~Output() {
    for (auto &value : history_totals) arb_clear(&value);
    arb_clear(c2o); arb_clear(c1o); arb_clear(c0o);
    for (auto &value : onset_norm_p_upper) arb_clear(&value);
    for (auto &value : onset_qp) arb_clear(&value);
    for (auto &value : onset_state_boxes) arb_clear(&value);
}

arb_ptr Output::onset_state(std::size_t jet, std::size_t state) {
    return onset_state_boxes.data() + jet * kStateCount + state;
}

arb_srcptr Output::onset_state(std::size_t jet, std::size_t state) const {
    return onset_state_boxes.data() + jet * kStateCount + state;
}

arb_ptr Output::history_total(std::size_t request, std::size_t jet) {
    return history_totals.data() + request * kJetCount + jet;
}

arb_srcptr Output::history_total(std::size_t request, std::size_t jet) const {
    return history_totals.data() + request * kJetCount + jet;
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr || input.tail_witness == nullptr
        || input.tail_result == nullptr || input.continuation_provider == nullptr) {
        fail(result, FailureDetail::missing_output_or_input);
        return false;
    }
    reset(output);
    if (!valid_onset(input.t0, input.terminal_t)) {
        fail(result, FailureDetail::invalid_onset_or_split);
        return false;
    }
    if (!input.tail_result->accepted
        || input.tail_witness_t0 != input.t0
        || input.tail_result->detail != tail::FailureDetail::none) {
        fail(result, FailureDetail::early_tail_not_passed);
        return false;
    }
    if (!valid_set_shape(input.accepted_before)) {
        fail(result, FailureDetail::ledger_set_resource_or_identity);
        return false;
    }

    std::string before_bytes;
    if (!serialize_set(input.accepted_before, nullptr, &before_bytes,
                       &output->ledger_models_before)
        || !digest_bytes(before_bytes, &output->ledger_digest_before)) {
        fail(result, FailureDetail::ledger_set_resource_or_identity);
        return false;
    }
    FiniteContinuationResponse response{};
    const FiniteContinuationRequest request{
        input.t0, input.terminal_t, input.accepted_before};
    result->continuation_requested_after_early_tail = true;
    const bool provider_succeeded = input.continuation_provider(
        request, &response, input.continuation_context);
    if (!provider_succeeded) {
        result->propagated_finite_failure = response.failure;
        if (response.failure == chronology::FiniteFailureCode::none)
            fail(result, FailureDetail::continuation_provider_contract);
        else
            fail(result, FailureDetail::finite_producer_failure);
        return false;
    }
    if (response.failure != chronology::FiniteFailureCode::none
        || !response.c08_006_passed || !response.c08_007_passed
        || !response.c08_008_passed || !response.c08_009_passed
        || !response.c08_010_passed || !valid_set_shape(response.accepted_after)
        || response.accepted_after.ledger_count
            != input.accepted_before.ledger_count) {
        fail(result, FailureDetail::continuation_provider_contract);
        return false;
    }

    std::vector<std::size_t> prefix_counts;
    prefix_counts.reserve(input.accepted_before.ledger_count);
    for (std::size_t index = 0U; index < input.accepted_before.ledger_count;
         ++index) {
        const TaggedLedgerView &before = input.accepted_before.ledgers[index];
        const TaggedLedgerView &after = response.accepted_after.ledgers[index];
        if (before.identity != after.identity
            || after.ledger.model_count < before.ledger.model_count) {
            fail(result, FailureDetail::append_only_prefix_violation);
            return false;
        }
        prefix_counts.push_back(before.ledger.model_count);
        result->prefix_models_compared += before.ledger.model_count;
    }
    std::string prefix_bytes, after_bytes;
    std::size_t prefix_models = 0U;
    if (!serialize_set(response.accepted_after, &prefix_counts, &prefix_bytes,
                       &prefix_models)
        || prefix_bytes != before_bytes
        || !digest_bytes(prefix_bytes, &output->reused_prefix_digest)
        || !serialize_set(response.accepted_after, nullptr, &after_bytes,
                          &output->ledger_models_after)
        || !digest_bytes(after_bytes, &output->ledger_digest_after)) {
        fail(result, FailureDetail::append_only_prefix_violation);
        return false;
    }
    result->append_only_prefix_reused_byte_for_byte = true;

    for (std::size_t index = 0U; index < response.accepted_after.ledger_count;
         ++index)
        if (!validate_terminal_ledger(response.accepted_after.ledgers[index],
                                      input.terminal_t,
                                      &result->terminal_models_validated)) {
            fail(result, FailureDetail::terminal_ledger_invalid_or_uncovered);
            return false;
        }
    result->ledgers_validated = response.accepted_after.ledger_count;

    if (!produce_p_norms(input, response.accepted_after, output, result)) {
        fail(result, result->onset_boxes_produced == 0U
                         ? FailureDetail::scalar_state_inventory
                         : FailureDetail::p_norm_failed);
        return false;
    }

    try {
        output->history_totals.resize(input.history_request_count * kJetCount);
        for (auto &value : output->history_totals) {
            arb_init(&value);
            arb_zero(&value);
        }
        FailureDetail history_detail = FailureDetail::none;
        if (!produce_histories(input, response.accepted_after, output, result,
                               &history_detail)) {
            fail(result, history_detail);
            return false;
        }
    } catch (...) {
        fail(result, FailureDetail::weighted_history_moment_failed);
        return false;
    }

    result->accepted = true;
    result->detail = FailureDetail::none;
    result->signed_remainder_cancellation_used = false;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::missing_output_or_input:
        return "C08-011C_MISSING_OUTPUT_OR_INPUT";
    case FailureDetail::early_tail_not_passed:
        return "C08-011C_EARLY_TAIL_NOT_PASSED";
    case FailureDetail::invalid_onset_or_split:
        return "C08-011C_INVALID_ONSET_OR_SPLIT";
    case FailureDetail::ledger_set_resource_or_identity:
        return "C08-011C_LEDGER_SET_RESOURCE_OR_IDENTITY";
    case FailureDetail::continuation_provider_contract:
        return "C08-011C_CONTINUATION_PROVIDER_CONTRACT";
    case FailureDetail::finite_producer_failure:
        return "C08-011C_FINITE_PRODUCER_FAILURE";
    case FailureDetail::append_only_prefix_violation:
        return "C08-011C_APPEND_ONLY_PREFIX_VIOLATION";
    case FailureDetail::terminal_ledger_invalid_or_uncovered:
        return "C08-011C_TERMINAL_LEDGER_INVALID_OR_UNCOVERED";
    case FailureDetail::scalar_state_inventory:
        return "C08-011C_SCALAR_STATE_INVENTORY";
    case FailureDetail::onset_evaluation_failed:
        return "C08-011C_ONSET_EVALUATION_FAILED";
    case FailureDetail::p_norm_failed: return "C08-011C_P_NORM_FAILED";
    case FailureDetail::history_inventory_or_sigma:
        return "C08-011C_HISTORY_INVENTORY_OR_SIGMA";
    case FailureDetail::weighted_history_moment_failed:
        return "C08-011C_WEIGHTED_HISTORY_MOMENT_FAILED";
    }
    return "C08-011C_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_finite_history_v1
