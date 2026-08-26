#include "mini_boson_star_primary_c08_canonical_ingress_v1.hpp"

#include "mini_boson_star_sha256_v1.hpp"

#include <algorithm>
#include <charconv>
#include <cmath>
#include <cstdint>
#include <limits>
#include <set>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_canonical_ingress_v1 {
namespace {

constexpr std::size_t kMaximumRawBytes = 65536U;
constexpr std::size_t kMaximumCanonicalBytes = 65536U;
constexpr std::size_t kMaximumDepth = 8U;
constexpr std::size_t kMaximumNodes = 1024U;
constexpr std::size_t kMaximumMembers = 64U;
constexpr std::size_t kMaximumElements = 64U;
constexpr std::size_t kMaximumStringBytes = 1024U;
constexpr std::size_t kMaximumKeyBytes = 128U;
constexpr std::size_t kMaximumCumulativeStringBytes = 65536U;
constexpr std::size_t kMaximumNumberBytes = 64U;
constexpr std::size_t kExpectedRawBytes = 54972U;
constexpr std::size_t kExpectedCanonicalBytes = 49780U;
constexpr char kExpectedRawHash[] =
    "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
constexpr char kCanonicalDomain[] = "nhm2-g2h-e-s5-a/borel-contract/v1\n";
constexpr char kExpectedCanonicalHash[] =
    "665b6d9ddd9d2108274652414ec9d6a0a2fb43f86f28ab3ab64db70003c7f520";

struct Value {
    enum class Kind { null_value, boolean, number, string, array, object };
    Kind kind = Kind::null_value;
    bool boolean = false;
    double number = 0.0;
    std::string string{};
    std::vector<Value> array{};
    std::vector<std::pair<std::string, Value>> object{};
};

bool checked_add(std::size_t left, std::size_t right, std::size_t maximum,
                 std::size_t *result) {
    if (right > maximum || left > maximum - right) return false;
    *result = left + right;
    return true;
}

int hex_digit(unsigned char byte) {
    if (byte >= '0' && byte <= '9') return static_cast<int>(byte - '0');
    if (byte >= 'a' && byte <= 'f') return 10 + static_cast<int>(byte - 'a');
    if (byte >= 'A' && byte <= 'F') return 10 + static_cast<int>(byte - 'A');
    return -1;
}

void append_utf8(std::string *target, std::uint32_t scalar) {
    if (scalar <= 0x7fU) {
        target->push_back(static_cast<char>(scalar));
    } else if (scalar <= 0x7ffU) {
        target->push_back(static_cast<char>(0xc0U | (scalar >> 6U)));
        target->push_back(static_cast<char>(0x80U | (scalar & 0x3fU)));
    } else if (scalar <= 0xffffU) {
        target->push_back(static_cast<char>(0xe0U | (scalar >> 12U)));
        target->push_back(static_cast<char>(0x80U | ((scalar >> 6U) & 0x3fU)));
        target->push_back(static_cast<char>(0x80U | (scalar & 0x3fU)));
    } else {
        target->push_back(static_cast<char>(0xf0U | (scalar >> 18U)));
        target->push_back(static_cast<char>(0x80U | ((scalar >> 12U) & 0x3fU)));
        target->push_back(static_cast<char>(0x80U | ((scalar >> 6U) & 0x3fU)));
        target->push_back(static_cast<char>(0x80U | (scalar & 0x3fU)));
    }
}

bool decode_utf8_scalar(std::string_view input, std::size_t *position,
                        std::uint32_t *scalar) {
    if (*position >= input.size()) return false;
    const unsigned char first = static_cast<unsigned char>(input[(*position)++]);
    if (first < 0x80U) {
        *scalar = first;
        return true;
    }
    unsigned count = 0;
    std::uint32_t value = 0;
    std::uint32_t minimum = 0;
    if (first >= 0xc2U && first <= 0xdfU) {
        count = 1U; value = first & 0x1fU; minimum = 0x80U;
    } else if (first >= 0xe0U && first <= 0xefU) {
        count = 2U; value = first & 0x0fU; minimum = 0x800U;
    } else if (first >= 0xf0U && first <= 0xf4U) {
        count = 3U; value = first & 0x07U; minimum = 0x10000U;
    } else return false;
    if (count > input.size() - *position) return false;
    for (unsigned index = 0; index < count; ++index) {
        const unsigned char next = static_cast<unsigned char>(input[(*position)++]);
        if ((next & 0xc0U) != 0x80U) return false;
        value = (value << 6U) | static_cast<std::uint32_t>(next & 0x3fU);
    }
    if (value < minimum || value > 0x10ffffU
        || (value >= 0xd800U && value <= 0xdfffU)) return false;
    *scalar = value;
    return true;
}

bool valid_utf8(std::string_view input) {
    if (input.size() >= 3U
        && static_cast<unsigned char>(input[0]) == 0xefU
        && static_cast<unsigned char>(input[1]) == 0xbbU
        && static_cast<unsigned char>(input[2]) == 0xbfU) return false;
    std::size_t position = 0;
    while (position < input.size()) {
        std::uint32_t scalar = 0;
        if (!decode_utf8_scalar(input, &position, &scalar)) return false;
    }
    return true;
}

class Parser {
public:
    Parser(std::string_view input, Metrics *metrics, FailureCode *failure)
        : input_(input), metrics_(metrics), failure_(failure) {}

    bool parse(Value *value) {
        skip_space();
        if (!parse_value(0U, value)) return false;
        skip_space();
        if (position_ != input_.size()) return fail(FailureCode::json_lexical_or_trailing);
        return true;
    }

private:
    bool fail(FailureCode failure) {
        if (*failure_ == FailureCode::none) *failure_ = failure;
        return false;
    }

    bool parse_value(std::size_t depth, Value *value) {
        if (depth > kMaximumDepth) return fail(FailureCode::structural_resource);
        if (metrics_->total_value_nodes >= kMaximumNodes)
            return fail(FailureCode::structural_resource);
        ++metrics_->total_value_nodes;
        metrics_->maximum_depth = std::max(metrics_->maximum_depth, depth);
        if (position_ >= input_.size()) return fail(FailureCode::json_lexical_or_trailing);
        const char byte = input_[position_];
        if (byte == '{') return parse_object(depth, value);
        if (byte == '[') return parse_array(depth, value);
        if (byte == '"') {
            value->kind = Value::Kind::string;
            return parse_string(false, &value->string);
        }
        if (byte == 't') return parse_literal("true", Value::Kind::boolean, true, value);
        if (byte == 'f') return parse_literal("false", Value::Kind::boolean, false, value);
        if (byte == 'n') return parse_literal("null", Value::Kind::null_value, false, value);
        return parse_number(value);
    }

    bool parse_object(std::size_t depth, Value *value) {
        ++position_;
        value->kind = Value::Kind::object;
        skip_space();
        if (consume('}')) return true;
        std::set<std::string> decoded_keys;
        for (;;) {
            if (value->object.size() >= kMaximumMembers)
                return fail(FailureCode::structural_resource);
            std::string key;
            if (!parse_string(true, &key)) return false;
            if (key.empty() || std::any_of(key.begin(), key.end(), [](unsigned char byte) {
                    return byte < 0x20U || byte > 0x7eU;
                })) return fail(FailureCode::contract_key);
            if (!decoded_keys.insert(key).second) return fail(FailureCode::duplicate_key);
            skip_space();
            if (!consume(':')) return fail(FailureCode::json_lexical_or_trailing);
            skip_space();
            Value child;
            if (!parse_value(depth + 1U, &child)) return false;
            value->object.emplace_back(std::move(key), std::move(child));
            metrics_->maximum_members_in_one_object = std::max(
                metrics_->maximum_members_in_one_object, value->object.size());
            skip_space();
            if (consume('}')) return true;
            if (!consume(',')) return fail(FailureCode::json_lexical_or_trailing);
            skip_space();
        }
    }

    bool parse_array(std::size_t depth, Value *value) {
        ++position_;
        value->kind = Value::Kind::array;
        skip_space();
        if (consume(']')) return true;
        for (;;) {
            if (value->array.size() >= kMaximumElements)
                return fail(FailureCode::structural_resource);
            Value child;
            if (!parse_value(depth + 1U, &child)) return false;
            value->array.emplace_back(std::move(child));
            metrics_->maximum_elements_in_one_array = std::max(
                metrics_->maximum_elements_in_one_array, value->array.size());
            skip_space();
            if (consume(']')) return true;
            if (!consume(',')) return fail(FailureCode::json_lexical_or_trailing);
            skip_space();
        }
    }

    bool parse_string(bool key, std::string *decoded) {
        if (!consume('"')) return fail(FailureCode::json_lexical_or_trailing);
        while (position_ < input_.size()) {
            const unsigned char byte = static_cast<unsigned char>(input_[position_++]);
            if (byte == '"') {
                const std::size_t limit = key ? kMaximumKeyBytes : kMaximumStringBytes;
                if (decoded->size() > limit) return fail(FailureCode::structural_resource);
                std::size_t cumulative = 0;
                if (!checked_add(metrics_->cumulative_decoded_string_utf8_bytes,
                                 decoded->size(), kMaximumCumulativeStringBytes, &cumulative))
                    return fail(FailureCode::structural_resource);
                metrics_->cumulative_decoded_string_utf8_bytes = cumulative;
                if (key) metrics_->maximum_decoded_object_key_utf8_bytes = std::max(
                    metrics_->maximum_decoded_object_key_utf8_bytes, decoded->size());
                else metrics_->maximum_decoded_string_utf8_bytes = std::max(
                    metrics_->maximum_decoded_string_utf8_bytes, decoded->size());
                return true;
            }
            if (byte < 0x20U) return fail(FailureCode::json_lexical_or_trailing);
            if (byte == '\\') {
                if (position_ >= input_.size()) return fail(FailureCode::json_lexical_or_trailing);
                const unsigned char escape = static_cast<unsigned char>(input_[position_++]);
                if (escape == '"' || escape == '\\' || escape == '/')
                    decoded->push_back(static_cast<char>(escape));
                else if (escape == 'b') decoded->push_back('\b');
                else if (escape == 'f') decoded->push_back('\f');
                else if (escape == 'n') decoded->push_back('\n');
                else if (escape == 'r') decoded->push_back('\r');
                else if (escape == 't') decoded->push_back('\t');
                else if (escape == 'u') {
                    std::uint32_t scalar = 0;
                    if (!hex_quad(&scalar)) return fail(FailureCode::json_lexical_or_trailing);
                    if (scalar >= 0xd800U && scalar <= 0xdbffU) {
                        if (position_ + 2U > input_.size() || input_[position_] != '\\'
                            || input_[position_ + 1U] != 'u')
                            return fail(FailureCode::json_lexical_or_trailing);
                        position_ += 2U;
                        std::uint32_t low = 0;
                        if (!hex_quad(&low) || low < 0xdc00U || low > 0xdfffU)
                            return fail(FailureCode::json_lexical_or_trailing);
                        scalar = 0x10000U + ((scalar - 0xd800U) << 10U) + (low - 0xdc00U);
                    } else if (scalar >= 0xdc00U && scalar <= 0xdfffU)
                        return fail(FailureCode::json_lexical_or_trailing);
                    append_utf8(decoded, scalar);
                } else return fail(FailureCode::json_lexical_or_trailing);
            } else if (byte < 0x80U) {
                decoded->push_back(static_cast<char>(byte));
            } else {
                --position_;
                std::uint32_t scalar = 0;
                if (!decode_utf8_scalar(input_, &position_, &scalar))
                    return fail(FailureCode::bom_or_invalid_utf8);
                append_utf8(decoded, scalar);
            }
            const std::size_t limit = key ? kMaximumKeyBytes : kMaximumStringBytes;
            if (decoded->size() > limit) return fail(FailureCode::structural_resource);
        }
        return fail(FailureCode::json_lexical_or_trailing);
    }

    bool hex_quad(std::uint32_t *value) {
        if (input_.size() - position_ < 4U) return false;
        std::uint32_t result = 0;
        for (unsigned index = 0; index < 4U; ++index) {
            const int digit = hex_digit(static_cast<unsigned char>(input_[position_++]));
            if (digit < 0) return false;
            result = (result << 4U) | static_cast<std::uint32_t>(digit);
        }
        *value = result;
        return true;
    }

    bool parse_literal(std::string_view literal, Value::Kind kind, bool boolean,
                       Value *value) {
        if (input_.substr(position_, literal.size()) != literal)
            return fail(FailureCode::json_lexical_or_trailing);
        position_ += literal.size();
        value->kind = kind;
        value->boolean = boolean;
        return true;
    }

    bool parse_number(Value *value) {
        const std::size_t start = position_;
        const bool negative = consume('-');
        if (position_ >= input_.size()) return fail(FailureCode::json_lexical_or_trailing);
        if (input_[position_] == '0') {
            ++position_;
            if (position_ < input_.size() && input_[position_] >= '0' && input_[position_] <= '9')
                return fail(FailureCode::json_lexical_or_trailing);
        } else if (input_[position_] >= '1' && input_[position_] <= '9') {
            do { ++position_; } while (position_ < input_.size()
                && input_[position_] >= '0' && input_[position_] <= '9');
        } else return fail(FailureCode::json_lexical_or_trailing);
        bool syntactic_integer = true;
        if (position_ < input_.size() && input_[position_] == '.') {
            syntactic_integer = false;
            ++position_;
            const std::size_t fraction = position_;
            while (position_ < input_.size() && input_[position_] >= '0' && input_[position_] <= '9')
                ++position_;
            if (position_ == fraction) return fail(FailureCode::json_lexical_or_trailing);
        }
        if (position_ < input_.size() && (input_[position_] == 'e' || input_[position_] == 'E')) {
            syntactic_integer = false;
            ++position_;
            if (position_ < input_.size() && (input_[position_] == '+' || input_[position_] == '-'))
                ++position_;
            const std::size_t exponent = position_;
            while (position_ < input_.size() && input_[position_] >= '0' && input_[position_] <= '9')
                ++position_;
            if (position_ == exponent) return fail(FailureCode::json_lexical_or_trailing);
        }
        const std::string_view lexeme = input_.substr(start, position_ - start);
        metrics_->maximum_number_lexeme_bytes = std::max(
            metrics_->maximum_number_lexeme_bytes, lexeme.size());
        if (lexeme.size() > kMaximumNumberBytes) return fail(FailureCode::structural_resource);
        double parsed = 0.0;
        const auto converted = std::from_chars(
            lexeme.data(), lexeme.data() + lexeme.size(), parsed, std::chars_format::general);
        if (converted.ec == std::errc::result_out_of_range) {
            const std::size_t exponent_marker = lexeme.find_first_of("eE");
            const bool underflow = exponent_marker != std::string_view::npos
                && exponent_marker + 1U < lexeme.size()
                && lexeme[exponent_marker + 1U] == '-';
            if (!underflow) return fail(FailureCode::number_semantics);
            parsed = negative ? -0.0 : 0.0;
        } else if (converted.ec != std::errc{}
            || converted.ptr != lexeme.data() + lexeme.size() || !std::isfinite(parsed)) {
            return fail(FailureCode::number_semantics);
        }
        if (syntactic_integer && std::fabs(parsed) > 9007199254740991.0)
            return fail(FailureCode::number_semantics);
        value->kind = Value::Kind::number;
        value->number = negative && parsed == 0.0 ? -0.0 : parsed;
        return true;
    }

    bool consume(char expected) {
        if (position_ >= input_.size() || input_[position_] != expected) return false;
        ++position_;
        return true;
    }

    void skip_space() {
        while (position_ < input_.size() && (input_[position_] == ' '
            || input_[position_] == '\t' || input_[position_] == '\r'
            || input_[position_] == '\n')) ++position_;
    }

    std::string_view input_;
    Metrics *metrics_;
    FailureCode *failure_;
    std::size_t position_ = 0;
};

bool append_bounded(std::string *output, std::string_view value) {
    std::size_t size = 0;
    if (!checked_add(output->size(), value.size(), kMaximumCanonicalBytes, &size)) return false;
    output->append(value);
    return output->size() == size;
}

bool append_canonical_string(std::string *output, std::string_view value) {
    static constexpr char hex[] = "0123456789abcdef";
    if (!append_bounded(output, "\"")) return false;
    for (const unsigned char byte : value) {
        if (byte == '"') {
            if (!append_bounded(output, "\\\"")) return false;
        } else if (byte == '\\') {
            if (!append_bounded(output, "\\\\")) return false;
        } else if (byte == '\b') {
            if (!append_bounded(output, "\\b")) return false;
        } else if (byte == '\f') {
            if (!append_bounded(output, "\\f")) return false;
        } else if (byte == '\n') {
            if (!append_bounded(output, "\\n")) return false;
        } else if (byte == '\r') {
            if (!append_bounded(output, "\\r")) return false;
        } else if (byte == '\t') {
            if (!append_bounded(output, "\\t")) return false;
        } else if (byte < 0x20U) {
            char escape[6] = {'\\', 'u', '0', '0', hex[byte >> 4U], hex[byte & 0x0fU]};
            if (!append_bounded(output, std::string_view(escape, sizeof escape))) return false;
        } else {
            const char character = static_cast<char>(byte);
            if (!append_bounded(output, std::string_view(&character, 1U))) return false;
        }
    }
    return append_bounded(output, "\"");
}

bool canonical_number(double value, std::string *output) {
    if (value == 0.0) return append_bounded(output, "0");
    char buffer[128]{};
    const auto converted = std::to_chars(
        buffer, buffer + sizeof buffer, value, std::chars_format::general);
    if (converted.ec != std::errc{}) return false;
    std::string raw(buffer, converted.ptr);
    std::string sign;
    std::size_t position = 0;
    if (!raw.empty() && raw[0] == '-') { sign = "-"; position = 1U; }
    const std::size_t exponent_position = raw.find_first_of("eE", position);
    const std::string mantissa = raw.substr(position, exponent_position - position);
    int exponent = 0;
    if (exponent_position != std::string::npos) {
        const std::string exponent_text = raw.substr(exponent_position + 1U);
        std::size_t exponent_start = 0;
        int exponent_sign = 1;
        if (!exponent_text.empty() && (exponent_text[0] == '+' || exponent_text[0] == '-')) {
            exponent_sign = exponent_text[0] == '-' ? -1 : 1;
            exponent_start = 1U;
        }
        if (exponent_start == exponent_text.size()) return false;
        const auto parsed = std::from_chars(
            exponent_text.data() + exponent_start,
            exponent_text.data() + exponent_text.size(), exponent);
        if (parsed.ec != std::errc{} || parsed.ptr != exponent_text.data() + exponent_text.size())
            return false;
        exponent *= exponent_sign;
    }
    const std::size_t dot = mantissa.find('.');
    std::string digits = mantissa;
    if (dot != std::string::npos) {
        digits.erase(dot, 1U);
        exponent -= static_cast<int>(mantissa.size() - dot - 1U);
    }
    const int point = static_cast<int>(digits.size()) + exponent;
    std::string normalized = sign;
    if (point > 0 && point <= 21) {
        if (point >= static_cast<int>(digits.size())) {
            normalized += digits;
            normalized.append(static_cast<std::size_t>(point) - digits.size(), '0');
        } else {
            normalized += digits.substr(0U, static_cast<std::size_t>(point));
            normalized.push_back('.');
            normalized += digits.substr(static_cast<std::size_t>(point));
        }
    } else if (point <= 0 && point > -6) {
        normalized += "0.";
        normalized.append(static_cast<std::size_t>(-point), '0');
        normalized += digits;
    } else {
        normalized.push_back(digits[0]);
        if (digits.size() > 1U) {
            normalized.push_back('.');
            normalized += digits.substr(1U);
        }
        const int scientific_exponent = point - 1;
        normalized.push_back('e');
        if (scientific_exponent >= 0) normalized.push_back('+');
        normalized += std::to_string(scientific_exponent);
    }
    return append_bounded(output, normalized);
}

bool serialize(const Value &value, std::string *output) {
    switch (value.kind) {
    case Value::Kind::null_value: return append_bounded(output, "null");
    case Value::Kind::boolean: return append_bounded(output, value.boolean ? "true" : "false");
    case Value::Kind::number: return canonical_number(value.number, output);
    case Value::Kind::string: return append_canonical_string(output, value.string);
    case Value::Kind::array:
        if (!append_bounded(output, "[")) return false;
        for (std::size_t index = 0; index < value.array.size(); ++index) {
            if (index != 0U && !append_bounded(output, ",")) return false;
            if (!serialize(value.array[index], output)) return false;
        }
        return append_bounded(output, "]");
    case Value::Kind::object: {
        if (!append_bounded(output, "{")) return false;
        std::vector<std::size_t> order(value.object.size());
        for (std::size_t index = 0; index < order.size(); ++index) order[index] = index;
        std::sort(order.begin(), order.end(), [&value](std::size_t left, std::size_t right) {
            return value.object[left].first < value.object[right].first;
        });
        for (std::size_t ordinal = 0; ordinal < order.size(); ++ordinal) {
            if (ordinal != 0U && !append_bounded(output, ",")) return false;
            const auto &entry = value.object[order[ordinal]];
            if (!append_canonical_string(output, entry.first)
                || !append_bounded(output, ":") || !serialize(entry.second, output)) return false;
        }
        return append_bounded(output, "}");
    }
    }
    return false;
}

std::string domain_hash(std::string_view domain, std::string_view payload) {
    sha256_v1::Context context;
    sha256_v1::init(context);
    sha256_v1::update(context, reinterpret_cast<const unsigned char *>(domain.data()), domain.size());
    sha256_v1::update(context, reinterpret_cast<const unsigned char *>(payload.data()), payload.size());
    return sha256_v1::finish(context);
}

}  // namespace

bool canonicalize_fixture(std::string_view raw, std::string *canonical,
                          FailureCode *failure, Metrics *metrics) {
    if (canonical == nullptr || failure == nullptr || metrics == nullptr) return false;
    *canonical = {};
    *failure = FailureCode::none;
    *metrics = {};
    metrics->raw_input_bytes = raw.size();
    if (raw.size() > kMaximumRawBytes) {
        *failure = FailureCode::raw_input_resource;
        return false;
    }
    if (!valid_utf8(raw)) {
        *failure = FailureCode::bom_or_invalid_utf8;
        return false;
    }
    Value root;
    Parser parser(raw, metrics, failure);
    if (!parser.parse(&root)) return false;
    if (!serialize(root, canonical)) {
        *failure = FailureCode::canonical_output_resource;
        canonical->clear();
        return false;
    }
    metrics->canonical_output_bytes = canonical->size();
    return true;
}

bool validate_exact_borel_contract(std::string_view raw, Result *result) {
    if (result == nullptr) return false;
    *result = {};
    std::string canonical;
    if (!canonicalize_fixture(raw, &canonical, &result->failure, &result->metrics)) return false;
    result->raw_sha256 = sha256_v1::text(std::string(raw));
    if (raw.size() != kExpectedRawBytes || result->raw_sha256 != kExpectedRawHash) {
        result->failure = FailureCode::raw_identity;
        return false;
    }
    result->canonical_bytes = canonical.size();
    if (canonical.size() > kMaximumCanonicalBytes) {
        result->failure = FailureCode::canonical_output_resource;
        return false;
    }
    result->canonical_sha256 = domain_hash(kCanonicalDomain, canonical);
    if (canonical.size() != kExpectedCanonicalBytes
        || result->canonical_sha256 != kExpectedCanonicalHash) {
        result->failure = FailureCode::canonical_identity;
        return false;
    }
    result->accepted = true;
    result->failure = FailureCode::none;
    return true;
}

bool fixture_cumulative_string_counter(std::size_t current, std::size_t addition) {
    std::size_t result = 0;
    return checked_add(current, addition, kMaximumCumulativeStringBytes, &result);
}

const char *failure_name(FailureCode failure) {
    switch (failure) {
    case FailureCode::none: return "NONE";
    case FailureCode::raw_input_resource: return "C08-002_RAW_INPUT_RESOURCE";
    case FailureCode::bom_or_invalid_utf8: return "C08-002_BOM_OR_INVALID_UTF8";
    case FailureCode::json_lexical_or_trailing: return "C08-002_JSON_LEXICAL_OR_TRAILING";
    case FailureCode::structural_resource: return "C08-002_STRUCTURAL_RESOURCE";
    case FailureCode::duplicate_key: return "C08-002_DUPLICATE_KEY";
    case FailureCode::contract_key: return "C08-002_CONTRACT_KEY";
    case FailureCode::number_semantics: return "C08-002_NUMBER_SEMANTICS";
    case FailureCode::raw_identity: return "C08-002_RAW_IDENTITY";
    case FailureCode::canonical_output_resource: return "C08-002_CANONICAL_OUTPUT_RESOURCE";
    case FailureCode::canonical_identity: return "C08-002_CANONICAL_IDENTITY";
    }
    return "C08-002_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_canonical_ingress_v1
