#include "mini_boson_star_wire_primary.hpp"

#include <gmp.h>

#include <cctype>
#include <cstdint>
#include <set>
#include <string>
#include <string_view>

namespace nhm2::g2h_e_s4::primary_wire {
namespace {

bool printable_ascii_key(const std::string &value) {
    if (value.empty()) return false;
    for (const unsigned char byte : value) {
        if (byte < 0x20U || byte > 0x7eU) return false;
    }
    return true;
}

void append_utf8(std::string *target, uint32_t scalar) {
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

int hex_digit(unsigned char byte) {
    if (byte >= '0' && byte <= '9') return static_cast<int>(byte - '0');
    if (byte >= 'a' && byte <= 'f') return 10 + static_cast<int>(byte - 'a');
    if (byte >= 'A' && byte <= 'F') return 10 + static_cast<int>(byte - 'A');
    return -1;
}

class Parser {
public:
    explicit Parser(std::string_view input) : input_(input) {}

    bool parse() {
        if (input_.size() >= 3U
            && static_cast<unsigned char>(input_[0]) == 0xefU
            && static_cast<unsigned char>(input_[1]) == 0xbbU
            && static_cast<unsigned char>(input_[2]) == 0xbfU) return false;
        skip_space();
        if (!value()) return false;
        skip_space();
        return position_ == input_.size();
    }

private:
    bool value() {
        if (position_ >= input_.size()) return false;
        const unsigned char byte = static_cast<unsigned char>(input_[position_]);
        if (byte == '{') return object();
        if (byte == '[') return array();
        if (byte == '"') {
            std::string ignored;
            return string(&ignored);
        }
        if (byte == 't') return literal("true");
        if (byte == 'f') return literal("false");
        if (byte == 'n') return literal("null");
        return number();
    }

    bool object() {
        ++position_;
        skip_space();
        if (consume('}')) return true;
        std::set<std::string> keys;
        for (;;) {
            std::string key;
            if (!string(&key) || !printable_ascii_key(key) || !keys.insert(key).second) return false;
            skip_space();
            if (!consume(':')) return false;
            skip_space();
            if (!value()) return false;
            skip_space();
            if (consume('}')) return true;
            if (!consume(',')) return false;
            skip_space();
        }
    }

    bool array() {
        ++position_;
        skip_space();
        if (consume(']')) return true;
        for (;;) {
            if (!value()) return false;
            skip_space();
            if (consume(']')) return true;
            if (!consume(',')) return false;
            skip_space();
        }
    }

    bool string(std::string *decoded) {
        if (!consume('"')) return false;
        while (position_ < input_.size()) {
            const unsigned char byte = static_cast<unsigned char>(input_[position_++]);
            if (byte == '"') return true;
            if (byte < 0x20U) return false;
            if (byte == '\\') {
                if (position_ >= input_.size()) return false;
                const unsigned char escape = static_cast<unsigned char>(input_[position_++]);
                if (escape == '"' || escape == '\\' || escape == '/') {
                    decoded->push_back(static_cast<char>(escape));
                } else if (escape == 'b') decoded->push_back('\b');
                else if (escape == 'f') decoded->push_back('\f');
                else if (escape == 'n') decoded->push_back('\n');
                else if (escape == 'r') decoded->push_back('\r');
                else if (escape == 't') decoded->push_back('\t');
                else if (escape == 'u') {
                    uint32_t scalar = 0;
                    if (!hex_quad(&scalar)) return false;
                    if (scalar >= 0xd800U && scalar <= 0xdbffU) {
                        if (position_ + 2U > input_.size() || input_[position_] != '\\'
                            || input_[position_ + 1U] != 'u') return false;
                        position_ += 2U;
                        uint32_t low = 0;
                        if (!hex_quad(&low) || low < 0xdc00U || low > 0xdfffU) return false;
                        scalar = 0x10000U + ((scalar - 0xd800U) << 10U) + (low - 0xdc00U);
                    } else if (scalar >= 0xdc00U && scalar <= 0xdfffU) return false;
                    append_utf8(decoded, scalar);
                } else return false;
                continue;
            }
            if (byte < 0x80U) {
                decoded->push_back(static_cast<char>(byte));
                continue;
            }
            --position_;
            uint32_t scalar = 0;
            if (!raw_utf8(&scalar)) return false;
            append_utf8(decoded, scalar);
        }
        return false;
    }

    bool hex_quad(uint32_t *value) {
        if (position_ + 4U > input_.size()) return false;
        uint32_t result = 0;
        for (unsigned index = 0; index < 4U; ++index) {
            const int digit = hex_digit(static_cast<unsigned char>(input_[position_++]));
            if (digit < 0) return false;
            result = (result << 4U) | static_cast<uint32_t>(digit);
        }
        *value = result;
        return true;
    }

    bool raw_utf8(uint32_t *value) {
        const unsigned char first = static_cast<unsigned char>(input_[position_++]);
        unsigned count = 0;
        uint32_t scalar = 0;
        uint32_t minimum = 0;
        if (first >= 0xc2U && first <= 0xdfU) {
            count = 1; scalar = first & 0x1fU; minimum = 0x80U;
        } else if (first >= 0xe0U && first <= 0xefU) {
            count = 2; scalar = first & 0x0fU; minimum = 0x800U;
        } else if (first >= 0xf0U && first <= 0xf4U) {
            count = 3; scalar = first & 0x07U; minimum = 0x10000U;
        } else return false;
        if (position_ + count > input_.size()) return false;
        for (unsigned index = 0; index < count; ++index) {
            const unsigned char next = static_cast<unsigned char>(input_[position_++]);
            if ((next & 0xc0U) != 0x80U) return false;
            scalar = (scalar << 6U) | (next & 0x3fU);
        }
        if (scalar < minimum || scalar > 0x10ffffU
            || (scalar >= 0xd800U && scalar <= 0xdfffU)) return false;
        *value = scalar;
        return true;
    }

    bool number() {
        const size_t start = position_;
        const bool negative = consume('-');
        if (position_ >= input_.size()) return false;
        if (input_[position_] == '0') {
            ++position_;
            if (position_ < input_.size()
                && std::isdigit(static_cast<unsigned char>(input_[position_])) != 0) return false;
        } else if (input_[position_] >= '1' && input_[position_] <= '9') {
            do { ++position_; } while (position_ < input_.size()
                && input_[position_] >= '0' && input_[position_] <= '9');
        } else return false;
        if (position_ < input_.size() && (input_[position_] == '.'
                || input_[position_] == 'e' || input_[position_] == 'E')) return false;
        size_t digit_start = start + (negative ? 1U : 0U);
        while (digit_start < position_ && input_[digit_start] == '0') ++digit_start;
        const size_t digits = position_ - digit_start;
        static constexpr char limit[] = "9007199254740991";
        return digits < 16U || (digits == 16U
            && input_.substr(digit_start, digits) <= std::string_view(limit));
    }

    bool literal(std::string_view expected) {
        if (input_.substr(position_, expected.size()) != expected) return false;
        position_ += expected.size();
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
    size_t position_ = 0;
};

bool integer_decimal(std::string_view value) {
    if (value.empty() || value == "-0") return false;
    size_t index = value[0] == '-' ? 1U : 0U;
    if (index == value.size()) return false;
    if (value[index] == '0' && index + 1U != value.size()) return false;
    if (value[index] < '0' || value[index] > '9') return false;
    for (++index; index < value.size(); ++index) {
        if (value[index] < '0' || value[index] > '9') return false;
    }
    return true;
}

bool positive_decimal(std::string_view value) {
    return integer_decimal(value) && value[0] != '-' && value != "0";
}

bool reduced_rational(const char *numerator, const char *denominator) {
    if (!integer_decimal(numerator) || !positive_decimal(denominator)) return false;
    mpz_t left, right, divisor;
    mpz_init_set_str(left, numerator, 10);
    mpz_abs(left, left);
    mpz_init_set_str(right, denominator, 10);
    mpz_init(divisor);
    mpz_gcd(divisor, left, right);
    const bool reduced = mpz_cmp_ui(divisor, 1U) == 0
        && (mpz_sgn(left) != 0 || mpz_cmp_ui(right, 1U) == 0);
    mpz_clear(left); mpz_clear(right); mpz_clear(divisor);
    return reduced;
}

bool normal_dyadic(std::string_view mantissa, int64_t exponent) {
    if (!integer_decimal(mantissa)) return false;
    const bool zero = mantissa == "0";
    return zero ? exponent == 0 : (((mantissa.back() - '0') & 1) == 1);
}

bool parse_wire(std::string_view value) { return Parser(value).parse(); }

}  // namespace

bool run_wire_scalar_fixture_suite() {
    const std::string invalid_utf8 = std::string("\"") + static_cast<char>(0xffU) + "\"";
    const std::string bom = std::string("\xef\xbb\xbf", 3) + "{}";
    const bool ingress =
        parse_wire("{\"a\":1,\"b\":[true,false,null],\"text\":\"ok\"}")
        && parse_wire("{\"text\":\"\\ud83d\\ude80\"}")
        && parse_wire("{\"text\":\"\xf0\x9f\x9a\x80\"}")
        && !parse_wire("{\"a\":1,\"a\":2}")
        && !parse_wire("{\"a\":1,\"\\u0061\":2}")
        && !parse_wire(bom) && !parse_wire(invalid_utf8)
        && !parse_wire("\"\\ud800\"") && !parse_wire("\"\\udc00\"")
        && !parse_wire("{}{}") && !parse_wire("9007199254740992")
        && parse_wire("-9007199254740991")
        && !parse_wire("0.5") && !parse_wire("1e2")
        && !parse_wire("{\"\\u00e9\":1}");
    const bool scalars = integer_decimal("0") && integer_decimal("-42")
        && !integer_decimal("-0") && !integer_decimal("01")
        && reduced_rational("6", "5") && !reduced_rational("12", "10")
        && reduced_rational("0", "1") && !reduced_rational("0", "2")
        && normal_dyadic("3", -4) && !normal_dyadic("6", -5)
        && normal_dyadic("0", 0) && !normal_dyadic("0", 4)
        && normal_dyadic("-1", 0);
    static constexpr char canonical_record[] =
        "{\"authority\":{\"candidate_admitted\":false},"
        "\"candidate_evaluations\":0,\"schema\":\"fixture\",\"sequence\":0}";
    return ingress && scalars && parse_wire(canonical_record)
        && std::string_view(canonical_record).find(' ') == std::string_view::npos;
}

}  // namespace nhm2::g2h_e_s4::primary_wire
