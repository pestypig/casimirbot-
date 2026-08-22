// Native directed-model base for the NHM2 spherical boson-star v2 G2-D tail.
//
// Program gate: G2 — classical branch proof and terminal state
// Workstream: exact proof-definition implementation
// Capability or component: MPFR256 model/source/endpoint quotient algebra
// Current maturity: native calculation canary; no proof issuer or manifest
// Target maturity: complete audited native Volterra bound assembler
// Required frozen inputs: degree 32, chi=17/16, analytic order 512, MPFR 4.2.2
// Required evidence: exact oracle agreement, runtime identity, hostile tests
// Stop/fail criteria: missing symbol, ABI/version drift, flag, containment miss
// Explicit non-goals: proof/candidate execution, radius, terminal state, lamps
// Downstream gate unlocked: complete radial-cover assembly and audit

#define WIN32_LEAN_AND_MEAN
#include <windows.h>

#include <array>
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include "tail_endpoint_sparse_algebra_generated.hpp"

namespace {

constexpr int kPrecision = 256;
constexpr int kDegree = 32;
constexpr int kAnalyticOrder = 512;
constexpr int kJetVariables = 7;
constexpr int kJetSecondCount = 28;
constexpr int kRndN = 0;
constexpr int kRndU = 2;
constexpr int kRndD = 3;
constexpr long kEmin = -1000000;
constexpr long kEmax = 1000000;
constexpr unsigned int kAllFlags = 63;

struct MpfrRaw {
  std::int32_t precision;
  std::int32_t sign;
  std::int32_t exponent;
  std::int32_t padding;
  void* limbs;
};

static_assert(sizeof(MpfrRaw) == 24, "unexpected MPFR ABI layout");

struct Api {
  HMODULE module = nullptr;
  void (*init2)(MpfrRaw*, long) = nullptr;
  void (*clear)(MpfrRaw*) = nullptr;
  int (*set)(MpfrRaw*, const MpfrRaw*, int) = nullptr;
  int (*setUi)(MpfrRaw*, unsigned long, int) = nullptr;
  int (*setSi)(MpfrRaw*, long, int) = nullptr;
  int (*setStr)(MpfrRaw*, const char*, int, int) = nullptr;
  int (*add)(MpfrRaw*, const MpfrRaw*, const MpfrRaw*, int) = nullptr;
  int (*sub)(MpfrRaw*, const MpfrRaw*, const MpfrRaw*, int) = nullptr;
  int (*mul)(MpfrRaw*, const MpfrRaw*, const MpfrRaw*, int) = nullptr;
  int (*div)(MpfrRaw*, const MpfrRaw*, const MpfrRaw*, int) = nullptr;
  int (*divUi)(MpfrRaw*, const MpfrRaw*, unsigned long, int) = nullptr;
  int (*uiDiv)(MpfrRaw*, unsigned long, const MpfrRaw*, int) = nullptr;
  int (*exp)(MpfrRaw*, const MpfrRaw*, int) = nullptr;
  int (*log)(MpfrRaw*, const MpfrRaw*, int) = nullptr;
  int (*sqrt)(MpfrRaw*, const MpfrRaw*, int) = nullptr;
  int (*cmp)(const MpfrRaw*, const MpfrRaw*) = nullptr;
  double (*getD)(const MpfrRaw*, int) = nullptr;
  int (*numberP)(const MpfrRaw*) = nullptr;
  const char* (*version)() = nullptr;
  void (*clearFlags)() = nullptr;
  int (*underflowP)() = nullptr;
  int (*overflowP)() = nullptr;
  int (*divzeroP)() = nullptr;
  int (*nanflagP)() = nullptr;
  int (*erangeP)() = nullptr;
  long (*getEmin)() = nullptr;
  long (*getEmax)() = nullptr;
  int (*setEmin)(long) = nullptr;
  int (*setEmax)(long) = nullptr;
  unsigned int (*flagsSave)() = nullptr;
  void (*flagsRestore)(unsigned int, unsigned int) = nullptr;
};

Api g_api;
std::mutex g_runtimeMutex;

template <typename T>
T symbol(HMODULE module, const char* name) {
  const auto raw = GetProcAddress(module, name);
  if (raw == nullptr) {
    throw std::runtime_error(std::string("missing_symbol:") + name);
  }
  return reinterpret_cast<T>(raw);
}

void loadApi() {
  if (g_api.module != nullptr) {
    return;
  }
  HMODULE module = GetModuleHandleW(L"libmpfr-6.dll");
  if (module == nullptr) {
    throw std::runtime_error("mpfr_module_not_preloaded");
  }
  g_api.module = module;
  g_api.init2 = symbol<decltype(g_api.init2)>(module, "mpfr_init2");
  g_api.clear = symbol<decltype(g_api.clear)>(module, "mpfr_clear");
  g_api.set = symbol<decltype(g_api.set)>(module, "mpfr_set");
  g_api.setUi = symbol<decltype(g_api.setUi)>(module, "mpfr_set_ui");
  g_api.setSi = symbol<decltype(g_api.setSi)>(module, "mpfr_set_si");
  g_api.setStr = symbol<decltype(g_api.setStr)>(module, "mpfr_set_str");
  g_api.add = symbol<decltype(g_api.add)>(module, "mpfr_add");
  g_api.sub = symbol<decltype(g_api.sub)>(module, "mpfr_sub");
  g_api.mul = symbol<decltype(g_api.mul)>(module, "mpfr_mul");
  g_api.div = symbol<decltype(g_api.div)>(module, "mpfr_div");
  g_api.divUi = symbol<decltype(g_api.divUi)>(module, "mpfr_div_ui");
  g_api.uiDiv = symbol<decltype(g_api.uiDiv)>(module, "mpfr_ui_div");
  g_api.exp = symbol<decltype(g_api.exp)>(module, "mpfr_exp");
  g_api.log = symbol<decltype(g_api.log)>(module, "mpfr_log");
  g_api.sqrt = symbol<decltype(g_api.sqrt)>(module, "mpfr_sqrt");
  g_api.cmp = symbol<decltype(g_api.cmp)>(module, "mpfr_cmp");
  g_api.getD = symbol<decltype(g_api.getD)>(module, "mpfr_get_d");
  g_api.numberP = symbol<decltype(g_api.numberP)>(module, "mpfr_number_p");
  g_api.version = symbol<decltype(g_api.version)>(module, "mpfr_get_version");
  g_api.clearFlags =
      symbol<decltype(g_api.clearFlags)>(module, "mpfr_clear_flags");
  g_api.underflowP =
      symbol<decltype(g_api.underflowP)>(module, "mpfr_underflow_p");
  g_api.overflowP =
      symbol<decltype(g_api.overflowP)>(module, "mpfr_overflow_p");
  g_api.divzeroP =
      symbol<decltype(g_api.divzeroP)>(module, "mpfr_divby0_p");
  g_api.nanflagP =
      symbol<decltype(g_api.nanflagP)>(module, "mpfr_nanflag_p");
  g_api.erangeP = symbol<decltype(g_api.erangeP)>(module, "mpfr_erangeflag_p");
  g_api.getEmin = symbol<decltype(g_api.getEmin)>(module, "mpfr_get_emin");
  g_api.getEmax = symbol<decltype(g_api.getEmax)>(module, "mpfr_get_emax");
  g_api.setEmin = symbol<decltype(g_api.setEmin)>(module, "mpfr_set_emin");
  g_api.setEmax = symbol<decltype(g_api.setEmax)>(module, "mpfr_set_emax");
  g_api.flagsSave =
      symbol<decltype(g_api.flagsSave)>(module, "mpfr_flags_save");
  g_api.flagsRestore =
      symbol<decltype(g_api.flagsRestore)>(module, "mpfr_flags_restore");
  if (std::strcmp(g_api.version(), "4.2.2") != 0) {
    throw std::runtime_error("mpfr_version_mismatch");
  }
}

class ContextGuard {
 public:
  ContextGuard()
      : oldEmin_(g_api.getEmin()),
        oldEmax_(g_api.getEmax()),
        oldFlags_(g_api.flagsSave()) {
    if (g_api.setEmin(kEmin) != 0 || g_api.setEmax(kEmax) != 0) {
      restore();
      throw std::runtime_error("mpfr_context_configuration_failed");
    }
    g_api.clearFlags();
    active_ = true;
  }

  ContextGuard(const ContextGuard&) = delete;
  ContextGuard& operator=(const ContextGuard&) = delete;

  ~ContextGuard() { restore(); }

 private:
  void restore() noexcept {
    if (restored_) {
      return;
    }
    g_api.setEmax(oldEmax_);
    g_api.setEmin(oldEmin_);
    g_api.flagsRestore(oldFlags_, kAllFlags);
    restored_ = true;
    active_ = false;
  }

  long oldEmin_;
  long oldEmax_;
  unsigned int oldFlags_;
  bool active_ = false;
  bool restored_ = false;
};

void beginOp() { g_api.clearFlags(); }

void endOp(const char* label, const MpfrRaw& value) {
  if (g_api.numberP(&value) == 0 || g_api.underflowP() != 0 ||
      g_api.overflowP() != 0 || g_api.divzeroP() != 0 ||
      g_api.nanflagP() != 0 || g_api.erangeP() != 0) {
    throw std::runtime_error(std::string("mpfr_operation_failed:") + label);
  }
}

class Mp {
 public:
  Mp() {
    g_api.init2(&raw_, kPrecision);
    beginOp();
    g_api.setUi(&raw_, 0, kRndN);
    endOp("zero", raw_);
  }

  explicit Mp(long value) : Mp() { setSi(value, kRndN); }

  Mp(const Mp& source) : Mp() {
    beginOp();
    const int ternary = g_api.set(&raw_, &source.raw_, kRndN);
    endOp("copy", raw_);
    if (ternary != 0) {
      throw std::runtime_error("mpfr_copy_inexact");
    }
  }

  Mp(Mp&& source) noexcept : raw_(source.raw_), active_(source.active_) {
    source.active_ = false;
  }

  Mp& operator=(const Mp& source) {
    if (this != &source) {
      beginOp();
      const int ternary = g_api.set(&raw_, &source.raw_, kRndN);
      endOp("assign", raw_);
      if (ternary != 0) {
        throw std::runtime_error("mpfr_assign_inexact");
      }
    }
    return *this;
  }

  Mp& operator=(Mp&& source) noexcept {
    if (this != &source) {
      if (active_) {
        g_api.clear(&raw_);
      }
      raw_ = source.raw_;
      active_ = source.active_;
      source.active_ = false;
    }
    return *this;
  }

  ~Mp() {
    if (active_) {
      g_api.clear(&raw_);
    }
  }

  MpfrRaw* ptr() { return &raw_; }
  const MpfrRaw* ptr() const { return &raw_; }

  void setSi(long value, int rounding) {
    beginOp();
    g_api.setSi(&raw_, value, rounding);
    endOp("set_si", raw_);
  }

  void setDecimalInteger(const char* value, int rounding) {
    if (value == nullptr || *value == '\0') {
      throw std::runtime_error("decimal_integer_empty");
    }
    beginOp();
    const int status = g_api.setStr(&raw_, value, 10, rounding);
    endOp("set_str_integer", raw_);
    if (status != 0) {
      throw std::runtime_error("decimal_integer_parse_failed");
    }
  }

  double asDouble(int rounding) const { return g_api.getD(&raw_, rounding); }

 private:
  MpfrRaw raw_{};
  bool active_ = true;
};

void setFraction(Mp& output, long numerator, unsigned long denominator,
                 int rounding) {
  Mp temporary(numerator);
  beginOp();
  g_api.divUi(output.ptr(), temporary.ptr(), denominator, rounding);
  endOp("set_fraction", *output.ptr());
}

void add(Mp& output, const Mp& left, const Mp& right, int rounding) {
  beginOp();
  g_api.add(output.ptr(), left.ptr(), right.ptr(), rounding);
  endOp("add", *output.ptr());
}

void sub(Mp& output, const Mp& left, const Mp& right, int rounding) {
  beginOp();
  g_api.sub(output.ptr(), left.ptr(), right.ptr(), rounding);
  endOp("sub", *output.ptr());
}

void mul(Mp& output, const Mp& left, const Mp& right, int rounding) {
  beginOp();
  g_api.mul(output.ptr(), left.ptr(), right.ptr(), rounding);
  endOp("mul", *output.ptr());
}

void div(Mp& output, const Mp& left, const Mp& right, int rounding) {
  beginOp();
  g_api.div(output.ptr(), left.ptr(), right.ptr(), rounding);
  endOp("div", *output.ptr());
}

void divUi(Mp& output, const Mp& value, unsigned long denominator,
           int rounding) {
  beginOp();
  g_api.divUi(output.ptr(), value.ptr(), denominator, rounding);
  endOp("div_ui", *output.ptr());
}

void expValue(Mp& output, const Mp& value, int rounding) {
  beginOp();
  g_api.exp(output.ptr(), value.ptr(), rounding);
  endOp("exp", *output.ptr());
}

void logValue(Mp& output, const Mp& value, int rounding) {
  beginOp();
  g_api.log(output.ptr(), value.ptr(), rounding);
  endOp("log", *output.ptr());
}

void sqrtValue(Mp& output, const Mp& value, int rounding) {
  beginOp();
  g_api.sqrt(output.ptr(), value.ptr(), rounding);
  endOp("sqrt", *output.ptr());
}

int compare(const Mp& left, const Mp& right) {
  return g_api.cmp(left.ptr(), right.ptr());
}

void minAssign(Mp& target, const Mp& candidate) {
  if (compare(candidate, target) < 0) {
    target = candidate;
  }
}

void maxAssign(Mp& target, const Mp& candidate) {
  if (compare(candidate, target) > 0) {
    target = candidate;
  }
}

struct Interval {
  Mp lower;
  Mp upper;
};

Mp absUpper(const Interval& value);

Interval exactFraction(long numerator, unsigned long denominator) {
  Interval result;
  setFraction(result.lower, numerator, denominator, kRndD);
  setFraction(result.upper, numerator, denominator, kRndU);
  return result;
}

Interval exactDecimalFraction(const char* numerator, const char* denominator) {
  Mp numeratorValue;
  Mp denominatorValue;
  numeratorValue.setDecimalInteger(numerator, kRndN);
  denominatorValue.setDecimalInteger(denominator, kRndN);
  const Mp zero;
  if (compare(denominatorValue, zero) <= 0) {
    throw std::runtime_error("decimal_fraction_denominator_nonpositive");
  }
  Interval result;
  div(result.lower, numeratorValue, denominatorValue, kRndD);
  div(result.upper, numeratorValue, denominatorValue, kRndU);
  return result;
}

Interval intervalAdd(const Interval& left, const Interval& right) {
  Interval result;
  add(result.lower, left.lower, right.lower, kRndD);
  add(result.upper, left.upper, right.upper, kRndU);
  return result;
}

Interval intervalNeg(const Interval& value) {
  const Interval minusOne = exactFraction(-1, 1);
  Interval result;
  mul(result.lower, value.upper, minusOne.lower, kRndD);
  mul(result.upper, value.lower, minusOne.upper, kRndU);
  return result;
}

Interval intervalSub(const Interval& left, const Interval& right) {
  return intervalAdd(left, intervalNeg(right));
}

Interval intervalMul(const Interval& left, const Interval& right) {
  std::array<Mp, 4> lower;
  std::array<Mp, 4> upper;
  const std::array<const Mp*, 2> l = {&left.lower, &left.upper};
  const std::array<const Mp*, 2> r = {&right.lower, &right.upper};
  std::size_t ordinal = 0;
  for (const Mp* a : l) {
    for (const Mp* b : r) {
      mul(lower[ordinal], *a, *b, kRndD);
      mul(upper[ordinal], *a, *b, kRndU);
      ++ordinal;
    }
  }
  Interval result{lower[0], upper[0]};
  for (std::size_t index = 1; index < lower.size(); ++index) {
    minAssign(result.lower, lower[index]);
    maxAssign(result.upper, upper[index]);
  }
  return result;
}

Interval intervalDivUi(const Interval& value, unsigned long denominator) {
  Interval result;
  divUi(result.lower, value.lower, denominator, kRndD);
  divUi(result.upper, value.upper, denominator, kRndU);
  return result;
}

Interval intervalScaleFraction(const Interval& value, long numerator,
                               unsigned long denominator) {
  return intervalMul(value, exactFraction(numerator, denominator));
}

Interval intervalExp(const Interval& value) {
  Interval result;
  expValue(result.lower, value.lower, kRndD);
  expValue(result.upper, value.upper, kRndU);
  return result;
}

Interval intervalReciprocal(const Interval& value) {
  const Mp zero;
  if (compare(value.lower, zero) <= 0 && compare(value.upper, zero) >= 0) {
    throw std::runtime_error("interval_reciprocal_contains_zero");
  }
  Interval result;
  beginOp();
  g_api.uiDiv(result.lower.ptr(), 1, value.upper.ptr(), kRndD);
  endOp("reciprocal.L", *result.lower.ptr());
  beginOp();
  g_api.uiDiv(result.upper.ptr(), 1, value.lower.ptr(), kRndU);
  endOp("reciprocal.U", *result.upper.ptr());
  return result;
}

Interval intervalDiv(const Interval& numerator, const Interval& denominator) {
  return intervalMul(numerator, intervalReciprocal(denominator));
}

std::vector<Interval> intervalPowers(const Interval& base,
                                    std::size_t maximumExponent) {
  std::vector<Interval> result;
  result.reserve(maximumExponent + 1);
  result.push_back(exactFraction(1, 1));
  for (std::size_t exponent = 1; exponent <= maximumExponent; ++exponent) {
    result.push_back(intervalMul(result.back(), base));
  }
  return result;
}

template <std::size_t OffsetCount, std::size_t TermCount>
std::vector<Interval> evaluateLaurentCoefficients(
    const Interval& sValue, const Interval& mValue, const Interval& kValue,
    const std::array<std::size_t, OffsetCount>& offsets,
    const std::array<nhm2_tail_endpoint_generated::LaurentTerm, TermCount>&
        terms) {
  if (OffsetCount < 2 || offsets.front() != 0 ||
      offsets.back() != terms.size()) {
    throw std::runtime_error("laurent_generated_shape_mismatch");
  }
  const auto sPowers = intervalPowers(sValue, 34);
  const auto mPowers = intervalPowers(mValue, 34);
  const auto kPositivePowers = intervalPowers(kValue, 36);
  const auto kNegativePowers = intervalPowers(intervalReciprocal(kValue), 16);
  std::vector<Interval> coefficients;
  coefficients.reserve(OffsetCount - 1);
  for (std::size_t ordinal = 0; ordinal + 1 < OffsetCount; ++ordinal) {
    Interval accumulated = exactFraction(0, 1);
    for (std::size_t index = offsets[ordinal];
         index < offsets[ordinal + 1]; ++index) {
      const auto& term = terms[index];
      const std::size_t sExponent =
          static_cast<std::uint8_t>(term.sExponent);
      const std::size_t mExponent =
          static_cast<std::uint8_t>(term.mExponent);
      const int kExponent = term.kExponent;
      if (sExponent >= sPowers.size() || mExponent >= mPowers.size() ||
          kExponent < -16 || kExponent > 36) {
        throw std::runtime_error("laurent_exponent_out_of_range");
      }
      const Interval& kPower =
          kExponent < 0
              ? kNegativePowers[static_cast<std::size_t>(-kExponent)]
              : kPositivePowers[static_cast<std::size_t>(kExponent)];
      Interval value = exactDecimalFraction(term.numerator, term.denominator);
      value = intervalMul(value, sPowers[sExponent]);
      value = intervalMul(value, mPowers[mExponent]);
      value = intervalMul(value, kPower);
      accumulated = intervalAdd(accumulated, value);
    }
    coefficients.push_back(std::move(accumulated));
  }
  return coefficients;
}

Interval evaluateSeries(const std::vector<Interval>& coefficients,
                        const Interval& variable) {
  if (coefficients.empty()) {
    throw std::runtime_error("series_coefficients_empty");
  }
  Interval result = coefficients.back();
  for (std::size_t ordinal = coefficients.size() - 1; ordinal > 0;
       --ordinal) {
    result = intervalAdd(intervalMul(result, variable),
                         coefficients[ordinal - 1]);
  }
  return result;
}

struct SeriesValueDerivative {
  Interval value;
  Interval derivative;
};

SeriesValueDerivative evaluateSeriesValueDerivative(
    const std::vector<Interval>& coefficients, const Interval& variable) {
  const Interval value = evaluateSeries(coefficients, variable);
  Interval derivative = exactFraction(0, 1);
  for (std::size_t ordinal = coefficients.size() - 1; ordinal > 0;
       --ordinal) {
    derivative = intervalAdd(
        intervalMul(derivative, variable),
        intervalScaleFraction(
            coefficients[ordinal], static_cast<long>(ordinal), 1));
  }
  return {value, derivative};
}

Interval endpointQuotient(const Interval& sValue, const Interval& mValue,
                          const Interval& kValue, const Interval& tValue) {
  using namespace nhm2_tail_endpoint_generated;
  if (std::strcmp(
          kQuotientSemanticSha256,
          "c19b4795d314597d72d18ab8ad6e8dbfe55d16f58f31472402fff548417022a7") !=
          0 ||
      kQuotientWireSizeBytes != 99867) {
    throw std::runtime_error("endpoint_quotient_generated_binding_mismatch");
  }
  return evaluateSeries(
      evaluateLaurentCoefficients(
          sValue, mValue, kValue, kQuotientOffsets, kQuotientTerms),
      tValue);
}

SeriesValueDerivative scalarJetValueDerivative(
    const Interval& sValue, const Interval& mValue, const Interval& kValue,
    const Interval& zValue) {
  using namespace nhm2_tail_endpoint_generated;
  if (std::strcmp(
          kScalarSemanticSha256,
          "858e83405870b2a6bb170b42f9b85817f7cfd9413e6206faba1fbbd1ae27826d") !=
          0 ||
      kScalarWireSizeBytes != 12234) {
    throw std::runtime_error("scalar_jet_generated_binding_mismatch");
  }
  return evaluateSeriesValueDerivative(
      evaluateLaurentCoefficients(
          sValue, mValue, kValue, kScalarOffsets, kScalarTerms),
      zValue);
}

Interval intervalPhi1Separated(const Interval& argument) {
  const Mp zero;
  if (compare(argument.lower, zero) <= 0 &&
      compare(argument.upper, zero) >= 0) {
    throw std::runtime_error("interval_phi1_argument_contains_zero");
  }
  return intervalDiv(
      intervalSub(intervalExp(argument), exactFraction(1, 1)), argument);
}

Interval intervalQ0Separated(const Interval& sValue,
                             const Interval& vValue) {
  const Interval argument = intervalScaleFraction(
      intervalMul(sValue, vValue), -2, 1);
  return intervalScaleFraction(
      intervalMul(vValue, intervalPhi1Separated(argument)), -2, 1);
}

struct IntervalSourceOutputs {
  Interval deltaRhOverD;
  Interval deltaRv1OverD;
  Interval scalar;
};

IntervalSourceOutputs evaluateRegularSourceInterval(const Interval& yInverse) {
  const Interval one = exactFraction(1, 1);
  const Interval two = exactFraction(2, 1);
  const Interval sValue = exactFraction(1, 10);
  const Interval nu = exactFraction(1, 20);
  const Interval dValue = exactFraction(1, 100);
  const Interval hS = exactFraction(1, 5);
  const Interval v1S = exactFraction(1, 6);
  const Interval hSy = exactFraction(1, 20);
  const Interval v1Sy = exactFraction(1, 25);
  const Interval fValue = exactFraction(1, 4);
  const Interval fY = exactFraction(1, 30);
  const Interval sigma = exactFraction(1, 8);
  const Interval bValue = intervalAdd(
      exactFraction(-1, 2), intervalMul(sigma, yInverse));
  const Interval w2 = intervalAdd(
      one, intervalScaleFraction(intervalMul(sValue, nu), 2, 1));
  const Interval f2 = intervalMul(fValue, fValue);
  const Interval uCombination = intervalAdd(
      fY, intervalMul(bValue, fValue));
  const Interval uCombination2 = intervalMul(uCombination, uCombination);
  const Interval expMetricMixed = intervalExp(intervalScaleFraction(
      intervalMul(sValue, intervalSub(intervalScaleFraction(v1S, 2, 1), hS)),
      2, 1));
  const Interval expV1 = intervalExp(
      intervalScaleFraction(intervalMul(sValue, v1S), 2, 1));
  const Interval commonPositive = intervalMul(
      intervalMul(expMetricMixed, w2), f2);
  const Interval commonMass = intervalMul(expV1, f2);

  Interval rv1Bracket = commonPositive;
  rv1Bracket = intervalAdd(
      rv1Bracket, intervalMul(sValue, uCombination2));
  rv1Bracket = intervalAdd(rv1Bracket, commonMass);
  const Interval deltaRv1OverD =
      intervalScaleFraction(rv1Bracket, -1, 2);

  Interval deltaRhOverD = commonPositive;
  deltaRhOverD = intervalSub(
      deltaRhOverD, intervalMul(sValue, uCombination2));
  deltaRhOverD = intervalSub(deltaRhOverD, commonMass);

  const Interval hMinusV1 = intervalSub(hS, v1S);
  const Interval e0 = intervalExp(intervalScaleFraction(
      intervalMul(sValue, hMinusV1), -2, 1));
  const Interval aScalar = intervalAdd(
      intervalScaleFraction(yInverse, 2, 1), intervalMul(sValue, hSy));
  const Interval vScalar = intervalMul(
      expV1,
      intervalAdd(
          intervalQ0Separated(sValue, hMinusV1),
          intervalScaleFraction(intervalMul(nu, e0), 2, 1)));
  const Interval pTilde = intervalAdd(
      intervalMul(
          intervalAdd(intervalScaleFraction(sigma, 2, 1), two), yInverse),
      intervalMul(sValue, hSy));
  Interval qTilde = intervalScaleFraction(
      intervalMul(sigma, intervalMul(yInverse, yInverse)), -1, 1);
  qTilde = intervalAdd(qTilde, intervalMul(bValue, bValue));
  qTilde = intervalAdd(qTilde, intervalMul(aScalar, bValue));
  qTilde = intervalAdd(qTilde, vScalar);
  Interval scalar = intervalScaleFraction(intervalMul(pTilde, fY), -1, 1);
  scalar = intervalSub(scalar, intervalMul(qTilde, fValue));
  (void)dValue;
  (void)v1Sy;
  return {deltaRhOverD, deltaRv1OverD, scalar};
}

struct RegularCoverSummary {
  Mp rhAbsUpper;
  Mp rvAbsUpper;
  Mp scalarAbsUpper;
  std::size_t visited = 0;
};

RegularCoverSummary evaluateRegularCoverCanary() {
  RegularCoverSummary result;
  for (std::size_t cell = 1; cell <= 255; ++cell) {
    Interval eta;
    setFraction(eta.lower, static_cast<long>(cell), 256, kRndD);
    setFraction(eta.upper, static_cast<long>(cell + 1), 256, kRndU);
    const Interval yInverse = intervalScaleFraction(eta, 1, 64);
    const IntervalSourceOutputs source =
        evaluateRegularSourceInterval(yInverse);
    maxAssign(result.rhAbsUpper, absUpper(source.deltaRhOverD));
    maxAssign(result.rvAbsUpper, absUpper(source.deltaRv1OverD));
    maxAssign(result.scalarAbsUpper, absUpper(source.scalar));
    ++result.visited;
  }
  if (result.visited != 255) {
    throw std::runtime_error("regular_radial_cover_incomplete");
  }
  return result;
}

Interval intervalLogPositive(const Interval& value) {
  const Mp zero;
  if (compare(value.lower, zero) <= 0) {
    throw std::runtime_error("interval_log_nonpositive");
  }
  Interval result;
  logValue(result.lower, value.lower, kRndD);
  logValue(result.upper, value.upper, kRndU);
  return result;
}

Interval intervalSqrtPositive(const Interval& value) {
  const Mp zero;
  if (compare(value.lower, zero) <= 0) {
    throw std::runtime_error("interval_sqrt_nonpositive");
  }
  Interval result;
  sqrtValue(result.lower, value.lower, kRndD);
  sqrtValue(result.upper, value.upper, kRndU);
  return result;
}

Mp absUpper(const Interval& value) {
  const Interval minusOne = exactFraction(-1, 1);
  Mp negativeLower;
  Mp negativeUpper;
  mul(negativeLower, value.lower, minusOne.upper, kRndU);
  mul(negativeUpper, value.upper, minusOne.upper, kRndU);
  Mp result = value.lower;
  maxAssign(result, value.upper);
  maxAssign(result, negativeLower);
  maxAssign(result, negativeUpper);
  return result;
}

struct Model {
  std::array<Interval, kDegree + 1> coefficients;
  Mp residual;
};

bool modelIsConstant(const Model& value);

Model modelConstant(long numerator, unsigned long denominator) {
  Model result;
  result.coefficients[0] = exactFraction(numerator, denominator);
  return result;
}

Model modelAdd(const Model& left, const Model& right) {
  if (modelIsConstant(left) && modelIsConstant(right)) {
    Model result;
    result.coefficients[0] =
        intervalAdd(left.coefficients[0], right.coefficients[0]);
    return result;
  }
  Model result;
  for (int index = 0; index <= kDegree; ++index) {
    result.coefficients[index] =
        intervalAdd(left.coefficients[index], right.coefficients[index]);
  }
  add(result.residual, left.residual, right.residual, kRndU);
  return result;
}

Model modelSub(const Model& left, const Model& right) {
  if (modelIsConstant(left) && modelIsConstant(right)) {
    Model result;
    result.coefficients[0] =
        intervalSub(left.coefficients[0], right.coefficients[0]);
    return result;
  }
  Model result;
  for (int index = 0; index <= kDegree; ++index) {
    result.coefficients[index] =
        intervalSub(left.coefficients[index], right.coefficients[index]);
  }
  add(result.residual, left.residual, right.residual, kRndU);
  return result;
}

Model modelDivUi(const Model& value, unsigned long denominator) {
  if (modelIsConstant(value)) {
    Model result;
    result.coefficients[0] =
        intervalDivUi(value.coefficients[0], denominator);
    return result;
  }
  Model result;
  for (int index = 0; index <= kDegree; ++index) {
    result.coefficients[index] =
        intervalDivUi(value.coefficients[index], denominator);
  }
  divUi(result.residual, value.residual, denominator, kRndU);
  return result;
}

Model modelScaleFraction(const Model& value, long numerator,
                         unsigned long denominator) {
  const Interval scalar = exactFraction(numerator, denominator);
  if (modelIsConstant(value)) {
    Model result;
    result.coefficients[0] = intervalMul(value.coefficients[0], scalar);
    return result;
  }
  Model result;
  for (int index = 0; index <= kDegree; ++index) {
    result.coefficients[index] =
        intervalMul(value.coefficients[index], scalar);
  }
  const Mp magnitude = absUpper(scalar);
  mul(result.residual, value.residual, magnitude, kRndU);
  return result;
}

Model modelScaleInterval(const Model& value, const Interval& scalar) {
  if (modelIsConstant(value)) {
    Model result;
    result.coefficients[0] = intervalMul(value.coefficients[0], scalar);
    return result;
  }
  Model result;
  for (int index = 0; index <= kDegree; ++index) {
    result.coefficients[index] =
        intervalMul(value.coefficients[index], scalar);
  }
  const Mp magnitude = absUpper(scalar);
  mul(result.residual, value.residual, magnitude, kRndU);
  return result;
}

Mp polynomialNorm(const Model& value) {
  Mp total;
  Mp weight(1);
  const Mp chiNumerator(17);
  for (int index = 0; index <= kDegree; ++index) {
    Mp term;
    const Mp magnitude = absUpper(value.coefficients[index]);
    mul(term, magnitude, weight, kRndU);
    Mp next;
    add(next, total, term, kRndU);
    total = std::move(next);
    Mp scaled;
    mul(scaled, weight, chiNumerator, kRndU);
    Mp nextWeight;
    divUi(nextWeight, scaled, 16, kRndU);
    weight = std::move(nextWeight);
  }
  return total;
}

Mp modelNorm(const Model& value) {
  if (modelIsConstant(value)) {
    return absUpper(value.coefficients[0]);
  }
  Mp result;
  const Mp polynomial = polynomialNorm(value);
  add(result, polynomial, value.residual, kRndU);
  return result;
}

bool modelIsExactZero(const Model& value) {
  const Mp zero;
  if (compare(value.residual, zero) != 0) {
    return false;
  }
  for (const Interval& coefficient : value.coefficients) {
    if (compare(coefficient.lower, zero) != 0 ||
        compare(coefficient.upper, zero) != 0) {
      return false;
    }
  }
  return true;
}

bool modelIsConstant(const Model& value) {
  const Mp zero;
  if (compare(value.residual, zero) != 0) {
    return false;
  }
  for (std::size_t index = 1; index < value.coefficients.size(); ++index) {
    if (compare(value.coefficients[index].lower, zero) != 0 ||
        compare(value.coefficients[index].upper, zero) != 0) {
      return false;
    }
  }
  return true;
}

Model modelConstantInterval(const Interval& value) {
  Model result;
  result.coefficients[0] = value;
  return result;
}

Model modelMul(const Model& left, const Model& right) {
  if (modelIsConstant(left) && modelIsConstant(right)) {
    return modelConstantInterval(
        intervalMul(left.coefficients[0], right.coefficients[0]));
  }
  std::array<Interval, 2 * kDegree + 1> product;
  for (int i = 0; i <= kDegree; ++i) {
    for (int j = 0; j <= kDegree; ++j) {
      const Interval half = intervalDivUi(
          intervalMul(left.coefficients[i], right.coefficients[j]), 2);
      product[i + j] = intervalAdd(product[i + j], half);
      product[std::abs(i - j)] =
          intervalAdd(product[std::abs(i - j)], half);
    }
  }

  Model result;
  for (int index = 0; index <= kDegree; ++index) {
    result.coefficients[index] = product[index];
  }

  Mp dropped;
  Mp weight(1);
  const Mp chiNumerator(17);
  for (int index = 0; index <= 2 * kDegree; ++index) {
    if (index > kDegree) {
      Mp term;
      const Mp magnitude = absUpper(product[index]);
      mul(term, magnitude, weight, kRndU);
      Mp next;
      add(next, dropped, term, kRndU);
      dropped = std::move(next);
    }
    Mp scaled;
    mul(scaled, weight, chiNumerator, kRndU);
    Mp nextWeight;
    divUi(nextWeight, scaled, 16, kRndU);
    weight = std::move(nextWeight);
  }

  const Mp leftNorm = polynomialNorm(left);
  const Mp rightNorm = polynomialNorm(right);
  Mp crossLeft;
  Mp crossRight;
  Mp crossResidual;
  mul(crossLeft, leftNorm, right.residual, kRndU);
  mul(crossRight, rightNorm, left.residual, kRndU);
  mul(crossResidual, left.residual, right.residual, kRndU);
  Mp accumulated;
  add(accumulated, dropped, crossLeft, kRndU);
  Mp next;
  add(next, accumulated, crossRight, kRndU);
  add(result.residual, next, crossResidual, kRndU);
  return result;
}

Model modelMulSparse(const Model& left, const Model& right) {
  if (modelIsExactZero(left) || modelIsExactZero(right)) {
    return Model{};
  }
  return modelMul(left, right);
}

Mp midpoint(const Interval& value) {
  Mp sum;
  Mp result;
  add(sum, value.lower, value.upper, kRndN);
  divUi(result, sum, 2, kRndN);
  return result;
}

Model modelExp(const Model& value) {
  if (modelIsConstant(value)) {
    return modelConstantInterval(intervalExp(value.coefficients[0]));
  }
  const Mp center = midpoint(value.coefficients[0]);
  Model centerModel;
  beginOp();
  g_api.set(centerModel.coefficients[0].lower.ptr(), center.ptr(), kRndD);
  endOp("center.L", *centerModel.coefficients[0].lower.ptr());
  beginOp();
  g_api.set(centerModel.coefficients[0].upper.ptr(), center.ptr(), kRndU);
  endOp("center.U", *centerModel.coefficients[0].upper.ptr());
  const Model h = modelSub(value, centerModel);

  Model result = modelConstant(1, 1);
  Model term = modelConstant(1, 1);
  for (unsigned long ordinal = 1; ordinal <= kAnalyticOrder; ++ordinal) {
    term = modelDivUi(modelMul(term, h), ordinal);
    result = modelAdd(result, term);
  }

  Interval centerInterval;
  beginOp();
  g_api.set(centerInterval.lower.ptr(), center.ptr(), kRndD);
  endOp("center_copy.L", *centerInterval.lower.ptr());
  beginOp();
  g_api.set(centerInterval.upper.ptr(), center.ptr(), kRndU);
  endOp("center_copy.U", *centerInterval.upper.ptr());
  const Interval exponential = intervalExp(centerInterval);
  for (Interval& coefficient : result.coefficients) {
    coefficient = intervalMul(coefficient, exponential);
  }
  mul(result.residual, result.residual, exponential.upper, kRndU);

  const Mp q = modelNorm(h);
  Mp qPower(1);
  for (unsigned long ordinal = 1; ordinal <= kAnalyticOrder + 1; ++ordinal) {
    Mp nextPower;
    mul(nextPower, qPower, q, kRndU);
    qPower = std::move(nextPower);
  }
  Mp factorial(1);
  for (unsigned long ordinal = 2; ordinal <= kAnalyticOrder + 1; ++ordinal) {
    Mp factor;
    factor.setSi(static_cast<long>(ordinal), kRndN);
    Mp nextFactorial;
    mul(nextFactorial, factorial, factor, kRndD);
    factorial = std::move(nextFactorial);
  }
  Mp centerPlusQ;
  add(centerPlusQ, centerInterval.upper, q, kRndU);
  Mp envelope;
  expValue(envelope, centerPlusQ, kRndU);
  Mp numerator;
  mul(numerator, envelope, qPower, kRndU);
  Mp tail;
  div(tail, numerator, factorial, kRndU);
  Mp finalResidual;
  add(finalResidual, result.residual, tail, kRndU);
  result.residual = std::move(finalResidual);
  return result;
}

Interval pointInterval(const Mp& value) {
  Interval result;
  beginOp();
  const int lowerTernary =
      g_api.set(result.lower.ptr(), value.ptr(), kRndD);
  endOp("point_interval.L", *result.lower.ptr());
  beginOp();
  const int upperTernary =
      g_api.set(result.upper.ptr(), value.ptr(), kRndU);
  endOp("point_interval.U", *result.upper.ptr());
  if (lowerTernary != 0 || upperTernary != 0) {
    throw std::runtime_error("point_interval_inexact");
  }
  return result;
}

Mp powerUp(const Mp& value, unsigned long exponent) {
  Mp result(1);
  for (unsigned long ordinal = 0; ordinal < exponent; ++ordinal) {
    Mp next;
    mul(next, result, value, kRndU);
    result = std::move(next);
  }
  return result;
}

Mp factorialDown(unsigned long ordinal) {
  Mp result(1);
  for (unsigned long factorOrdinal = 2; factorOrdinal <= ordinal;
       ++factorOrdinal) {
    Mp factor;
    factor.setSi(static_cast<long>(factorOrdinal), kRndN);
    Mp next;
    mul(next, result, factor, kRndD);
    result = std::move(next);
  }
  return result;
}

Model modelWithResidual(const Model& value, const Mp& extra) {
  Model result = value;
  add(result.residual, value.residual, extra, kRndU);
  return result;
}

struct GeometricCenter {
  Model unitOffset;
  Interval center;
  Mp radius;
};

GeometricCenter geometricCenter(const Model& value, const char* primitive) {
  const Mp centerValue = midpoint(value.coefficients[0]);
  const Interval center = pointInterval(centerValue);
  const Mp zero;
  if (compare(center.lower, zero) <= 0) {
    throw std::runtime_error(std::string(primitive) + "_center_nonpositive");
  }
  Model centerModel;
  centerModel.coefficients[0] = center;
  const Model h = modelSub(value, centerModel);
  const Model unitOffset =
      modelScaleInterval(h, intervalReciprocal(center));
  const Mp radius = modelNorm(unitOffset);
  const Mp one(1);
  if (compare(radius, one) >= 0) {
    throw std::runtime_error(std::string(primitive) + "_neumann_margin");
  }
  return {unitOffset, center, radius};
}

Mp oneMinusRadiusDown(const Mp& radius) {
  const Mp one(1);
  Mp result;
  sub(result, one, radius, kRndD);
  const Mp zero;
  if (compare(result, zero) <= 0) {
    throw std::runtime_error("analytic_radius_margin_nonpositive");
  }
  return result;
}

Model modelReciprocal(const Model& value) {
  if (modelIsConstant(value)) {
    return modelConstantInterval(
        intervalReciprocal(value.coefficients[0]));
  }
  const GeometricCenter geometry = geometricCenter(value, "reciprocal");
  Model result = modelConstant(1, 1);
  Model power = modelConstant(1, 1);
  for (unsigned long ordinal = 1; ordinal <= kAnalyticOrder; ++ordinal) {
    power = modelMul(power, geometry.unitOffset);
    if ((ordinal & 1U) == 0U) {
      result = modelAdd(result, power);
    } else {
      result = modelSub(result, power);
    }
  }
  result = modelScaleInterval(result, intervalReciprocal(geometry.center));

  const Mp radiusPower =
      powerUp(geometry.radius, kAnalyticOrder + 1);
  const Mp centerLower = geometry.center.lower;
  const Mp margin = oneMinusRadiusDown(geometry.radius);
  Mp denominator;
  mul(denominator, centerLower, margin, kRndD);
  Mp tail;
  div(tail, radiusPower, denominator, kRndU);
  return modelWithResidual(result, tail);
}

Model modelLogPositive(const Model& value) {
  if (modelIsConstant(value)) {
    return modelConstantInterval(
        intervalLogPositive(value.coefficients[0]));
  }
  const GeometricCenter geometry = geometricCenter(value, "log_positive");
  Model result;
  result.coefficients[0] = intervalLogPositive(geometry.center);
  Model power = modelConstant(1, 1);
  for (unsigned long ordinal = 1; ordinal <= kAnalyticOrder; ++ordinal) {
    power = modelMul(power, geometry.unitOffset);
    const long sign = (ordinal & 1U) == 0U ? -1 : 1;
    result = modelAdd(
        result, modelScaleFraction(power, sign, ordinal));
  }

  const Mp radiusPower =
      powerUp(geometry.radius, kAnalyticOrder + 1);
  Mp orderValue;
  orderValue.setSi(kAnalyticOrder + 1, kRndN);
  const Mp margin = oneMinusRadiusDown(geometry.radius);
  Mp denominator;
  mul(denominator, orderValue, margin, kRndD);
  Mp tail;
  div(tail, radiusPower, denominator, kRndU);
  return modelWithResidual(result, tail);
}

Model modelSqrtPositive(const Model& value) {
  if (modelIsConstant(value)) {
    return modelConstantInterval(
        intervalSqrtPositive(value.coefficients[0]));
  }
  const GeometricCenter geometry = geometricCenter(value, "sqrt_positive");
  Model result = modelConstant(1, 1);
  Model term = modelConstant(1, 1);
  for (unsigned long ordinal = 1; ordinal <= kAnalyticOrder; ++ordinal) {
    term = modelMul(term, geometry.unitOffset);
    const long numerator = 3 - 2 * static_cast<long>(ordinal);
    term = modelScaleFraction(term, numerator, 2 * ordinal);
    result = modelAdd(result, term);
  }
  const Interval centerRoot = intervalSqrtPositive(geometry.center);
  result = modelScaleInterval(result, centerRoot);

  const Mp radiusPower =
      powerUp(geometry.radius, kAnalyticOrder + 1);
  const Mp margin = oneMinusRadiusDown(geometry.radius);
  Mp numerator;
  mul(numerator, centerRoot.upper, radiusPower, kRndU);
  Mp tail;
  div(tail, numerator, margin, kRndU);
  return modelWithResidual(result, tail);
}

Model modelPhi1(const Model& value) {
  if (modelIsConstant(value)) {
    const Mp zero;
    const Interval& point = value.coefficients[0];
    if (compare(point.lower, zero) == 0 && compare(point.upper, zero) == 0) {
      return modelConstant(1, 1);
    }
    if (compare(point.lower, zero) > 0 || compare(point.upper, zero) < 0) {
      return modelConstantInterval(intervalPhi1Separated(point));
    }
  }
  Model result = modelConstant(1, 1);
  Model term = modelConstant(1, 1);
  for (unsigned long ordinal = 1; ordinal <= kAnalyticOrder; ++ordinal) {
    term = modelDivUi(modelMul(term, value), ordinal + 1);
    result = modelAdd(result, term);
  }
  const Mp q = modelNorm(value);
  const Mp qPower = powerUp(q, kAnalyticOrder + 1);
  const Mp denominator = factorialDown(kAnalyticOrder + 2);
  Mp envelope;
  expValue(envelope, q, kRndU);
  Mp numerator;
  mul(numerator, envelope, qPower, kRndU);
  Mp tail;
  div(tail, numerator, denominator, kRndU);
  return modelWithResidual(result, tail);
}

Model modelPhi1Derivative(const Model& value, int derivativeOrder) {
  if (derivativeOrder < 0 || derivativeOrder > 2) {
    throw std::runtime_error("phi1_derivative_order_invalid");
  }
  if (derivativeOrder == 0) {
    return modelPhi1(value);
  }
  Model term = modelConstant(1, derivativeOrder + 1);
  Model result = term;
  for (unsigned long powerOrdinal = 0;
       powerOrdinal < kAnalyticOrder; ++powerOrdinal) {
    term = modelMul(term, value);
    const unsigned long numerator =
        powerOrdinal + derivativeOrder + 1;
    const unsigned long denominator =
        (powerOrdinal + 1) * (powerOrdinal + derivativeOrder + 2);
    term = modelScaleFraction(term, static_cast<long>(numerator),
                              denominator);
    result = modelAdd(result, term);
  }
  const Mp q = modelNorm(value);
  const Mp qPower = powerUp(q, kAnalyticOrder + 1);
  const Mp denominator = factorialDown(kAnalyticOrder + 1);
  Mp envelope;
  expValue(envelope, q, kRndU);
  Mp numerator;
  mul(numerator, envelope, qPower, kRndU);
  Mp tail;
  div(tail, numerator, denominator, kRndU);
  return modelWithResidual(result, tail);
}

struct LogDividedModels {
  std::array<Model, 3> derivative;
};

LogDividedModels modelLogDividedModels(const Model& value, bool plus) {
  if (modelIsExactZero(value)) {
    if (plus) {
      return {{{modelConstant(1, 1), modelConstant(-1, 2),
                modelConstant(2, 3)}}};
    }
    return {{{modelConstant(-1, 1), modelConstant(-1, 2),
              modelConstant(-2, 3)}}};
  }
  LogDividedModels result;
  Model power = modelConstant(1, 1);
  for (unsigned long ordinal = 0; ordinal <= kAnalyticOrder; ++ordinal) {
    for (int derivativeOrder = 0; derivativeOrder <= 2; ++derivativeOrder) {
      const unsigned long shifted =
          ordinal + static_cast<unsigned long>(derivativeOrder);
      unsigned long numerator = 1;
      for (int factor = 0; factor < derivativeOrder; ++factor) {
        numerator *= shifted - static_cast<unsigned long>(factor);
      }
      const unsigned long denominator = shifted + 1;
      long signedNumerator = static_cast<long>(numerator);
      if (!plus || ((shifted & 1U) != 0U)) {
        signedNumerator = -signedNumerator;
      }
      result.derivative[derivativeOrder] = modelAdd(
          result.derivative[derivativeOrder],
          modelScaleFraction(power, signedNumerator, denominator));
    }
    if (ordinal < kAnalyticOrder) {
      power = modelMul(power, value);
    }
  }
  const Mp q = modelNorm(value);
  const Mp qPower = powerUp(q, kAnalyticOrder + 1);
  const Mp margin = oneMinusRadiusDown(q);
  Mp orderValue;
  orderValue.setSi(kAnalyticOrder + 2, kRndN);
  Mp valueDenominator;
  mul(valueDenominator, orderValue, margin, kRndD);
  Mp valueTail;
  div(valueTail, qPower, valueDenominator, kRndU);
  result.derivative[0] = modelWithResidual(result.derivative[0], valueTail);
  Mp firstTail;
  div(firstTail, qPower, margin, kRndU);
  result.derivative[1] = modelWithResidual(result.derivative[1], firstTail);
  Mp secondNumerator;
  mul(secondNumerator, qPower, orderValue, kRndU);
  Mp marginSquared;
  mul(marginSquared, margin, margin, kRndD);
  Mp secondTail;
  div(secondTail, secondNumerator, marginSquared, kRndU);
  result.derivative[2] =
      modelWithResidual(result.derivative[2], secondTail);
  return result;
}

Model modelQ0(const Model& sValue, const Model& vValue) {
  const Model argument =
      modelScaleFraction(modelMul(sValue, vValue), -2, 1);
  return modelScaleFraction(modelMul(vValue, modelPhi1(argument)), -2, 1);
}

constexpr int secondIndex(int left, int right) {
  return left * kJetVariables - (left * (left - 1)) / 2 +
         (right - left);
}

static_assert(secondIndex(0, 0) == 0);
static_assert(secondIndex(0, 6) == 6);
static_assert(secondIndex(1, 1) == 7);
static_assert(secondIndex(6, 6) == 27);

struct JetStorage {
  Model value;
  std::array<Model, kJetVariables> first;
  std::array<Model, kJetSecondCount> second;
};

class Jet2 {
 public:
  Jet2() : storage_(std::make_unique<JetStorage>()) {}

  Jet2(const Jet2& source)
      : storage_(std::make_unique<JetStorage>(*source.storage_)) {}

  Jet2(Jet2&&) noexcept = default;

  Jet2& operator=(const Jet2& source) {
    if (this != &source) {
      *storage_ = *source.storage_;
    }
    return *this;
  }

  Jet2& operator=(Jet2&&) noexcept = default;

  Model& value() { return storage_->value; }
  const Model& value() const { return storage_->value; }
  Model& first(int ordinal) { return storage_->first[ordinal]; }
  const Model& first(int ordinal) const { return storage_->first[ordinal]; }
  Model& second(int ordinal) { return storage_->second[ordinal]; }
  const Model& second(int ordinal) const { return storage_->second[ordinal]; }

 private:
  std::unique_ptr<JetStorage> storage_;
};

Jet2 jetConstant(const Model& value) {
  Jet2 result;
  result.value() = value;
  return result;
}

Jet2 jetVariable(const Model& value, int variable) {
  if (variable < 0 || variable >= kJetVariables) {
    throw std::runtime_error("jet_variable_ordinal_invalid");
  }
  Jet2 result = jetConstant(value);
  result.first(variable) = modelConstant(1, 1);
  return result;
}

Jet2 jetAdd(const Jet2& left, const Jet2& right) {
  Jet2 result;
  result.value() = modelAdd(left.value(), right.value());
  for (int ordinal = 0; ordinal < kJetVariables; ++ordinal) {
    result.first(ordinal) =
        modelAdd(left.first(ordinal), right.first(ordinal));
  }
  for (int ordinal = 0; ordinal < kJetSecondCount; ++ordinal) {
    result.second(ordinal) =
        modelAdd(left.second(ordinal), right.second(ordinal));
  }
  return result;
}

Jet2 jetSub(const Jet2& left, const Jet2& right) {
  Jet2 result;
  result.value() = modelSub(left.value(), right.value());
  for (int ordinal = 0; ordinal < kJetVariables; ++ordinal) {
    result.first(ordinal) =
        modelSub(left.first(ordinal), right.first(ordinal));
  }
  for (int ordinal = 0; ordinal < kJetSecondCount; ++ordinal) {
    result.second(ordinal) =
        modelSub(left.second(ordinal), right.second(ordinal));
  }
  return result;
}

Jet2 jetScaleFraction(const Jet2& value, long numerator,
                      unsigned long denominator) {
  Jet2 result;
  result.value() =
      modelScaleFraction(value.value(), numerator, denominator);
  for (int ordinal = 0; ordinal < kJetVariables; ++ordinal) {
    result.first(ordinal) = modelScaleFraction(
        value.first(ordinal), numerator, denominator);
  }
  for (int ordinal = 0; ordinal < kJetSecondCount; ++ordinal) {
    result.second(ordinal) = modelScaleFraction(
        value.second(ordinal), numerator, denominator);
  }
  return result;
}

Jet2 jetMul(const Jet2& left, const Jet2& right) {
  Jet2 result;
  result.value() = modelMul(left.value(), right.value());
  for (int ordinal = 0; ordinal < kJetVariables; ++ordinal) {
    result.first(ordinal) = modelAdd(
        modelMulSparse(left.first(ordinal), right.value()),
        modelMulSparse(left.value(), right.first(ordinal)));
  }
  for (int leftOrdinal = 0; leftOrdinal < kJetVariables; ++leftOrdinal) {
    for (int rightOrdinal = leftOrdinal; rightOrdinal < kJetVariables;
         ++rightOrdinal) {
      const int output = secondIndex(leftOrdinal, rightOrdinal);
      Model accumulated =
          modelMulSparse(left.second(output), right.value());
      accumulated = modelAdd(
          accumulated,
          modelMulSparse(left.first(leftOrdinal),
                         right.first(rightOrdinal)));
      accumulated = modelAdd(
          accumulated,
          modelMulSparse(left.first(rightOrdinal),
                         right.first(leftOrdinal)));
      accumulated = modelAdd(
          accumulated,
          modelMulSparse(left.value(), right.second(output)));
      result.second(output) = std::move(accumulated);
    }
  }
  return result;
}

Jet2 jetAnalytic(const Jet2& argument, const Model& value,
                 const Model& firstDerivative,
                 const Model& secondDerivative) {
  Jet2 result;
  result.value() = value;
  for (int ordinal = 0; ordinal < kJetVariables; ++ordinal) {
    result.first(ordinal) =
        modelMulSparse(firstDerivative, argument.first(ordinal));
  }
  for (int leftOrdinal = 0; leftOrdinal < kJetVariables; ++leftOrdinal) {
    for (int rightOrdinal = leftOrdinal; rightOrdinal < kJetVariables;
         ++rightOrdinal) {
      const int output = secondIndex(leftOrdinal, rightOrdinal);
      result.second(output) = modelAdd(
          modelMulSparse(
              secondDerivative,
              modelMulSparse(argument.first(leftOrdinal),
                             argument.first(rightOrdinal))),
          modelMulSparse(firstDerivative, argument.second(output)));
    }
  }
  return result;
}

Jet2 jetExp(const Jet2& argument) {
  const Model exponential = modelExp(argument.value());
  return jetAnalytic(argument, exponential, exponential, exponential);
}

Jet2 jetReciprocal(const Jet2& argument) {
  const Model reciprocal = modelReciprocal(argument.value());
  const Model reciprocal2 = modelMul(reciprocal, reciprocal);
  const Model reciprocal3 = modelMul(reciprocal2, reciprocal);
  return jetAnalytic(argument, reciprocal,
                     modelScaleFraction(reciprocal2, -1, 1),
                     modelScaleFraction(reciprocal3, 2, 1));
}

Jet2 jetLogPositive(const Jet2& argument) {
  const Model reciprocal = modelReciprocal(argument.value());
  return jetAnalytic(
      argument, modelLogPositive(argument.value()), reciprocal,
      modelScaleFraction(modelMul(reciprocal, reciprocal), -1, 1));
}

Jet2 jetSqrtPositive(const Jet2& argument) {
  const Model root = modelSqrtPositive(argument.value());
  const Model reciprocalRoot = modelReciprocal(root);
  const Model first = modelScaleFraction(reciprocalRoot, 1, 2);
  const Model reciprocalRoot3 = modelMul(
      modelMul(reciprocalRoot, reciprocalRoot), reciprocalRoot);
  const Model second = modelScaleFraction(reciprocalRoot3, -1, 4);
  return jetAnalytic(argument, root, first, second);
}

Jet2 jetPhi1(const Jet2& argument) {
  return jetAnalytic(argument, modelPhi1(argument.value()),
                     modelPhi1Derivative(argument.value(), 1),
                     modelPhi1Derivative(argument.value(), 2));
}

Jet2 jetLog1pOverX(const Jet2& argument) {
  const LogDividedModels models =
      modelLogDividedModels(argument.value(), true);
  return jetAnalytic(
      argument, models.derivative[0], models.derivative[1],
      models.derivative[2]);
}

Jet2 jetLog1mOverX(const Jet2& argument) {
  const LogDividedModels models =
      modelLogDividedModels(argument.value(), false);
  return jetAnalytic(
      argument, models.derivative[0], models.derivative[1],
      models.derivative[2]);
}

Jet2 jetQ0(const Jet2& sValue, const Jet2& vValue) {
  const Jet2 argument =
      jetScaleFraction(jetMul(sValue, vValue), -2, 1);
  return jetScaleFraction(jetMul(vValue, jetPhi1(argument)), -2, 1);
}

struct ParameterSourceChart {
  Jet2 s;
  Jet2 k;
  Jet2 w2;
  Jet2 sigma;
  Jet2 d;
  Jet2 b;
  Jet2 z;
  Jet2 hS;
  Jet2 v1S;
  Jet2 hSy;
  Jet2 v1Sy;
  Jet2 flatB;
  Jet2 metricD;
};

ParameterSourceChart evaluateParameterSourceChart(
    const Jet2& lambda, const Jet2& nu, const Jet2& mValue,
    const Jet2& cValue, const Model& etaModel) {
  const Jet2 one = jetConstant(modelConstant(1, 1));
  const Jet2 eta = jetConstant(etaModel);
  const Jet2 yInverse = jetScaleFraction(eta, 1, 64);
  const Jet2 sValue = jetMul(lambda, lambda);
  const Jet2 kValue = jetSqrtPositive(jetScaleFraction(nu, -2, 1));
  const Jet2 w2 = jetAdd(
      one, jetScaleFraction(jetMul(sValue, nu), 2, 1));
  const Jet2 sigma = jetSub(
      jetMul(
          jetMul(
              mValue,
              jetAdd(
                  one,
                  jetScaleFraction(jetMul(sValue, nu), 4, 1))),
          jetReciprocal(kValue)),
      one);
  const Model log64Model = modelLogPositive(modelConstant(64, 1));
  const Jet2 dValue = jetMul(
      cValue,
      jetMul(
          jetExp(jetScaleFraction(kValue, -64, 1)),
          jetExp(jetMul(sigma, jetConstant(log64Model)))));
  const Jet2 aValue =
      jetScaleFraction(jetMul(mValue, yInverse), 1, 2);
  const Jet2 rValue = jetMul(sValue, aValue);
  const Jet2 r2 = jetMul(rValue, rValue);
  const Jet2 v1S = jetScaleFraction(
      jetMul(aValue, jetLog1pOverX(rValue)), 2, 1);
  const Jet2 hS = jetMul(
      jetMul(sValue, jetMul(aValue, aValue)),
      jetLog1mOverX(r2));
  const Jet2 v1Sy = jetScaleFraction(
      jetMul(
          jetMul(aValue, yInverse),
          jetReciprocal(jetAdd(one, rValue))),
      -2, 1);
  const Jet2 hSy = jetScaleFraction(
      jetMul(
          jetMul(
              jetMul(sValue, jetMul(aValue, aValue)), yInverse),
          jetReciprocal(jetSub(one, r2))),
      2, 1);
  const Jet2 bValue = jetAdd(
      jetScaleFraction(kValue, -1, 1), jetMul(sigma, yInverse));
  const Jet2 zValue = jetMul(yInverse, jetReciprocal(kValue));
  const Jet2 inverseEta = jetReciprocal(eta);
  const Jet2 logEta = jetLogPositive(eta);
  const Jet2 logB = jetSub(
      jetScaleFraction(
          jetMul(kValue, jetSub(inverseEta, one)), -64, 1),
      jetMul(sigma, logEta));
  const Jet2 flatB = jetExp(logB);
  const Jet2 dTimesB = jetMul(dValue, flatB);
  const Jet2 metricD = jetMul(dTimesB, dTimesB);
  return {sValue, kValue, w2, sigma, dValue, bValue, zValue,
          hS,     v1S,    hSy, v1Sy,  flatB, metricD};
}

std::vector<Jet2> jetPowers(const Jet2& base, std::size_t maximumExponent) {
  std::vector<Jet2> result;
  result.reserve(maximumExponent + 1);
  result.push_back(jetConstant(modelConstant(1, 1)));
  for (std::size_t exponent = 1; exponent <= maximumExponent; ++exponent) {
    result.push_back(jetMul(result.back(), base));
  }
  return result;
}

std::vector<Model> modelPowers(const Model& base,
                               std::size_t maximumExponent) {
  std::vector<Model> result;
  result.reserve(maximumExponent + 1);
  result.push_back(modelConstant(1, 1));
  for (std::size_t exponent = 1; exponent <= maximumExponent; ++exponent) {
    result.push_back(modelMul(result.back(), base));
  }
  return result;
}

struct LaurentModelDerivatives {
  Model value;
  std::array<Model, 3> first;
  std::array<Model, 9> second;
};

Jet2 composeLaurentModelDerivatives(
    const LaurentModelDerivatives& polynomial, const Jet2& sValue,
    const Jet2& mValue, const Jet2& kValue) {
  const std::array<const Jet2*, 3> variables = {
      &sValue, &mValue, &kValue};
  Jet2 result;
  result.value() = polynomial.value;
  for (int direction = 0; direction < kJetVariables; ++direction) {
    Model accumulated;
    for (int variable = 0; variable < 3; ++variable) {
      accumulated = modelAdd(
          accumulated,
          modelMulSparse(
              polynomial.first[variable],
              variables[variable]->first(direction)));
    }
    result.first(direction) = std::move(accumulated);
  }
  for (int left = 0; left < kJetVariables; ++left) {
    for (int right = left; right < kJetVariables; ++right) {
      Model accumulated;
      for (int variable = 0; variable < 3; ++variable) {
        accumulated = modelAdd(
            accumulated,
            modelMulSparse(
                polynomial.first[variable],
                variables[variable]->second(secondIndex(left, right))));
      }
      for (int firstVariable = 0; firstVariable < 3; ++firstVariable) {
        for (int secondVariable = 0; secondVariable < 3;
             ++secondVariable) {
          accumulated = modelAdd(
              accumulated,
              modelMulSparse(
                  polynomial.second[firstVariable * 3 + secondVariable],
                  modelMulSparse(
                      variables[firstVariable]->first(left),
                      variables[secondVariable]->first(right))));
        }
      }
      result.second(secondIndex(left, right)) = std::move(accumulated);
    }
  }
  return result;
}

template <std::size_t OffsetCount, std::size_t TermCount>
std::vector<Jet2> evaluateLaurentJetCoefficients(
    const Jet2& sValue, const Jet2& mValue, const Jet2& kValue,
    const std::array<std::size_t, OffsetCount>& offsets,
    const std::array<nhm2_tail_endpoint_generated::LaurentTerm, TermCount>&
        terms) {
  if (OffsetCount < 2 || offsets.front() != 0 ||
      offsets.back() != terms.size()) {
    throw std::runtime_error("laurent_jet_generated_shape_mismatch");
  }
  const auto sPowers = modelPowers(sValue.value(), 16);
  const auto mPowers = modelPowers(mValue.value(), 16);
  const auto kPositivePowers = modelPowers(kValue.value(), 16);
  const auto kNegativePowers =
      modelPowers(modelReciprocal(kValue.value()), 18);
  const auto signedKPower = [&](int exponent) -> const Model& {
    return exponent < 0
               ? kNegativePowers[static_cast<std::size_t>(-exponent)]
               : kPositivePowers[static_cast<std::size_t>(exponent)];
  };
  const auto monomial = [&](const char* numerator, const char* denominator,
                            int sExponent, int mExponent,
                            int kExponent) -> Model {
    if (sExponent < 0 || mExponent < 0 || kExponent < -18 ||
        kExponent > 16) {
      throw std::runtime_error("laurent_derivative_exponent_out_of_range");
    }
    Model value = modelConstantInterval(
        exactDecimalFraction(numerator, denominator));
    value = modelMul(value, sPowers[static_cast<std::size_t>(sExponent)]);
    value = modelMul(value, mPowers[static_cast<std::size_t>(mExponent)]);
    return modelMul(value, signedKPower(kExponent));
  };
  std::vector<Jet2> coefficients;
  coefficients.reserve(OffsetCount - 1);
  for (std::size_t ordinal = 0; ordinal + 1 < OffsetCount; ++ordinal) {
    LaurentModelDerivatives polynomial;
    for (std::size_t index = offsets[ordinal];
         index < offsets[ordinal + 1]; ++index) {
      const auto& term = terms[index];
      const int sExponent = term.sExponent;
      const int mExponent = term.mExponent;
      const int kExponent = term.kExponent;
      if (sExponent < 0 || sExponent > 16 || mExponent < 0 ||
          mExponent > 16 || kExponent < -16 || kExponent > 16) {
        throw std::runtime_error("laurent_jet_exponent_out_of_range");
      }
      polynomial.value = modelAdd(
          polynomial.value,
          monomial(term.numerator, term.denominator, sExponent, mExponent,
                   kExponent));
      const std::array<int, 3> exponents = {
          sExponent, mExponent, kExponent};
      for (int variable = 0; variable < 3; ++variable) {
        if (exponents[variable] == 0) {
          continue;
        }
        std::array<int, 3> shifted = exponents;
        --shifted[variable];
        polynomial.first[variable] = modelAdd(
            polynomial.first[variable],
            modelScaleFraction(
                monomial(term.numerator, term.denominator, shifted[0],
                         shifted[1], shifted[2]),
                exponents[variable], 1));
      }
      for (int firstVariable = 0; firstVariable < 3; ++firstVariable) {
        for (int secondVariable = 0; secondVariable < 3;
             ++secondVariable) {
          const int firstFactor = exponents[firstVariable];
          const int secondFactor =
              exponents[secondVariable] -
              (firstVariable == secondVariable ? 1 : 0);
          if (firstFactor == 0 || secondFactor == 0) {
            continue;
          }
          std::array<int, 3> shifted = exponents;
          --shifted[firstVariable];
          --shifted[secondVariable];
          polynomial.second[firstVariable * 3 + secondVariable] =
              modelAdd(
                  polynomial.second[firstVariable * 3 + secondVariable],
                  modelScaleFraction(
                      monomial(term.numerator, term.denominator, shifted[0],
                               shifted[1], shifted[2]),
                      static_cast<long>(firstFactor * secondFactor), 1));
        }
      }
    }
    coefficients.push_back(
        composeLaurentModelDerivatives(polynomial, sValue, mValue, kValue));
  }
  return coefficients;
}

struct JetSeriesValueDerivatives {
  Jet2 value;
  Jet2 first;
  Jet2 second;
};

JetSeriesValueDerivatives evaluateScalarJetParameterSeries(
    const Jet2& sValue, const Jet2& mValue, const Jet2& kValue,
    const Jet2& zValue) {
  using namespace nhm2_tail_endpoint_generated;
  if (std::strcmp(
          kScalarSemanticSha256,
          "858e83405870b2a6bb170b42f9b85817f7cfd9413e6206faba1fbbd1ae27826d") !=
          0 ||
      kScalarWireSizeBytes != 12234) {
    throw std::runtime_error("scalar_jet_parameter_binding_mismatch");
  }
  const std::vector<Jet2> coefficients = evaluateLaurentJetCoefficients(
      sValue, mValue, kValue, kScalarOffsets, kScalarTerms);
  const std::vector<Jet2> zPowers = jetPowers(zValue, 8);
  Jet2 value = jetConstant(modelConstant(0, 1));
  Jet2 first = jetConstant(modelConstant(0, 1));
  Jet2 second = jetConstant(modelConstant(0, 1));
  for (std::size_t ordinal = 0; ordinal < coefficients.size(); ++ordinal) {
    value = jetAdd(value, jetMul(coefficients[ordinal], zPowers[ordinal]));
    if (ordinal >= 1) {
      first = jetAdd(
          first,
          jetScaleFraction(
              jetMul(coefficients[ordinal], zPowers[ordinal - 1]),
              static_cast<long>(ordinal), 1));
    }
    if (ordinal >= 2) {
      second = jetAdd(
          second,
          jetScaleFraction(
              jetMul(coefficients[ordinal], zPowers[ordinal - 2]),
              static_cast<long>(ordinal * (ordinal - 1)), 1));
    }
  }
  return {std::move(value), std::move(first), std::move(second)};
}

struct SourceInputs {
  Jet2 s;
  Jet2 nu;
  Jet2 d;
  Jet2 b;
  Jet2 hS;
  Jet2 v1S;
  Jet2 hSy;
  Jet2 v1Sy;
  Jet2 hHat;
  Jet2 vHat;
  Jet2 hHatCombination;
  Jet2 vHatCombination;
  Jet2 f;
  Jet2 fy;
  Jet2 yInverse;
  Jet2 sigma;
  Jet2 finiteJetResidual;
};

struct SourceOutputs {
  Jet2 deltaRhOverD;
  Jet2 deltaRv1OverD;
  Jet2 scalar;
};

SourceOutputs evaluateFactoredSourceDag(const SourceInputs& input) {
  const Jet2 one = jetConstant(modelConstant(1, 1));
  const Jet2 two = jetConstant(modelConstant(2, 1));
  const Jet2 h = jetAdd(input.hS, jetMul(input.d, input.hHat));
  const Jet2 v1 = jetAdd(input.v1S, jetMul(input.d, input.vHat));
  const Jet2 hy =
      jetAdd(input.hSy, jetMul(input.d, input.hHatCombination));
  const Jet2 v1y =
      jetAdd(input.v1Sy, jetMul(input.d, input.vHatCombination));
  const Jet2 w2 =
      jetAdd(one, jetScaleFraction(jetMul(input.s, input.nu), 2, 1));
  const Jet2 f2 = jetMul(input.f, input.f);
  const Jet2 uCombination =
      jetAdd(input.fy, jetMul(input.b, input.f));
  const Jet2 uCombination2 = jetMul(uCombination, uCombination);
  const Jet2 expMetricMixed = jetExp(jetScaleFraction(
      jetMul(input.s, jetSub(jetScaleFraction(v1, 2, 1), h)), 2, 1));
  const Jet2 expV1 =
      jetExp(jetScaleFraction(jetMul(input.s, v1), 2, 1));
  const Jet2 commonPositive =
      jetMul(jetMul(expMetricMixed, w2), f2);
  const Jet2 commonMass = jetMul(expV1, f2);

  const Jet2 vMetricDerivative = jetAdd(
      jetScaleFraction(jetMul(input.v1Sy, input.vHatCombination), 2, 1),
      jetMul(input.d,
             jetMul(input.vHatCombination, input.vHatCombination)));
  Jet2 rv1Bracket = jetMul(input.s, vMetricDerivative);
  rv1Bracket = jetAdd(rv1Bracket, commonPositive);
  rv1Bracket = jetAdd(rv1Bracket, jetMul(input.s, uCombination2));
  rv1Bracket = jetAdd(rv1Bracket, commonMass);
  const Jet2 deltaRv1OverD = jetScaleFraction(rv1Bracket, -1, 2);

  const Jet2 metricDifference = jetSub(input.hSy, input.v1Sy);
  const Jet2 hatCombinationDifference =
      jetSub(input.hHatCombination, input.vHatCombination);
  const Jet2 hMetricDerivative = jetAdd(
      jetScaleFraction(
          jetMul(metricDifference, hatCombinationDifference), 2, 1),
      jetMul(input.d,
             jetMul(hatCombinationDifference, hatCombinationDifference)));
  Jet2 deltaRhOverD =
      jetScaleFraction(jetMul(input.s, hMetricDerivative), -1, 1);
  deltaRhOverD = jetAdd(deltaRhOverD, commonPositive);
  deltaRhOverD = jetSub(deltaRhOverD, jetMul(input.s, uCombination2));
  deltaRhOverD = jetSub(deltaRhOverD, commonMass);

  const Jet2 hMinusV1 = jetSub(h, v1);
  const Jet2 e0 = jetExp(
      jetScaleFraction(jetMul(input.s, hMinusV1), -2, 1));
  const Jet2 aScalar = jetAdd(
      jetScaleFraction(input.yInverse, 2, 1), jetMul(input.s, hy));
  const Jet2 vScalar = jetMul(
      expV1,
      jetAdd(jetQ0(input.s, hMinusV1),
             jetScaleFraction(jetMul(input.nu, e0), 2, 1)));
  const Jet2 pTilde = jetAdd(
      jetMul(jetAdd(jetScaleFraction(input.sigma, 2, 1), two),
             input.yInverse),
      jetMul(input.s, hy));
  Jet2 qTilde = jetScaleFraction(
      jetMul(input.sigma, jetMul(input.yInverse, input.yInverse)), -1, 1);
  qTilde = jetAdd(qTilde, jetMul(input.b, input.b));
  qTilde = jetAdd(qTilde, jetMul(aScalar, input.b));
  qTilde = jetAdd(qTilde, vScalar);
  Jet2 scalar = jetScaleFraction(jetMul(pTilde, input.fy), -1, 1);
  scalar = jetSub(scalar, jetMul(qTilde, input.f));
  scalar = jetSub(scalar, input.finiteJetResidual);
  return {deltaRhOverD, deltaRv1OverD, scalar};
}

struct DerivativeCoverSummary {
  Mp valueAbsUpper;
  Mp tailFirstAbsUpper;
  Mp tailSecondAbsUpper;
  Mp parameterFirstAbsUpper;
  Mp parameterSecondAbsUpper;
  Mp mixedSecondAbsUpper;
  std::size_t visited = 0;
};

void updateModelMaximum(Mp& target, const Model& value) {
  maxAssign(target, modelNorm(value));
}

DerivativeCoverSummary evaluateRegularDerivativeCoverCanary() {
  DerivativeCoverSummary result;
  for (std::size_t cell = 1; cell <= 255; ++cell) {
    Interval eta;
    setFraction(eta.lower, static_cast<long>(cell), 256, kRndD);
    setFraction(eta.upper, static_cast<long>(cell + 1), 256, kRndU);
    const Model yInverse = modelConstantInterval(
        intervalScaleFraction(eta, 1, 64));
    const Jet2 sValue = jetVariable(modelConstant(1, 10), 3);
    const Jet2 nuValue = jetVariable(modelConstant(1, 20), 4);
    const Jet2 sigmaValue = jetVariable(modelConstant(1, 8), 5);
    const Jet2 dValue = jetVariable(modelConstant(1, 100), 6);
    const Jet2 hHat = jetVariable(modelConstant(1, 10), 0);
    const Jet2 vHat = jetVariable(modelConstant(1, 20), 1);
    const Jet2 fValue = jetVariable(modelConstant(1, 4), 2);
    const Jet2 bValue = jetAdd(
        jetConstant(modelConstant(-1, 2)),
        jetMul(sigmaValue, jetConstant(yInverse)));
    const SourceInputs input{
        sValue,
        nuValue,
        dValue,
        bValue,
        jetConstant(modelConstant(1, 5)),
        jetConstant(modelConstant(1, 6)),
        jetConstant(modelConstant(1, 20)),
        jetConstant(modelConstant(1, 25)),
        hHat,
        vHat,
        jetScaleFraction(hHat, -1, 1),
        jetScaleFraction(vHat, -1, 1),
        fValue,
        jetConstant(modelConstant(1, 30)),
        jetConstant(yInverse),
        sigmaValue,
        jetConstant(modelConstant(0, 1)),
    };
    const SourceOutputs output = evaluateFactoredSourceDag(input);
    const std::array<const Jet2*, 3> outputs = {
        &output.deltaRhOverD, &output.deltaRv1OverD, &output.scalar};
    for (const Jet2* item : outputs) {
      updateModelMaximum(result.valueAbsUpper, item->value());
      for (int variable = 0; variable < 3; ++variable) {
        updateModelMaximum(result.tailFirstAbsUpper, item->first(variable));
      }
      for (int variable = 3; variable < kJetVariables; ++variable) {
        updateModelMaximum(
            result.parameterFirstAbsUpper, item->first(variable));
      }
      for (int left = 0; left < kJetVariables; ++left) {
        for (int right = left; right < kJetVariables; ++right) {
          Mp* target = nullptr;
          if (right < 3) {
            target = &result.tailSecondAbsUpper;
          } else if (left >= 3) {
            target = &result.parameterSecondAbsUpper;
          } else {
            target = &result.mixedSecondAbsUpper;
          }
          updateModelMaximum(
              *target, item->second(secondIndex(left, right)));
        }
      }
    }
    ++result.visited;
  }
  if (result.visited != 255) {
    throw std::runtime_error("regular_derivative_cover_incomplete");
  }
  return result;
}

Interval intervalMaximum(const Interval& left, const Interval& right) {
  Interval result = left;
  maxAssign(result.lower, right.lower);
  maxAssign(result.upper, right.upper);
  return result;
}

struct KernelConstants {
  Interval alpha;
  Interval g1;
  Interval g2;
  Interval k0;
};

KernelConstants kernelConstants(const Interval& kMin,
                                const Interval& sigmaAbsMax) {
  const Mp zero;
  if (compare(kMin.lower, zero) <= 0 ||
      compare(sigmaAbsMax.lower, zero) < 0) {
    throw std::runtime_error("kernel_input_margin");
  }
  const Interval alpha = intervalSub(
      intervalScaleFraction(kMin, 2, 1),
      intervalScaleFraction(sigmaAbsMax, 1, 32));
  if (compare(alpha.lower, zero) <= 0) {
    throw std::runtime_error("kernel_alpha_nonpositive");
  }
  const Interval ai = intervalReciprocal(alpha);
  const Interval ai2 = intervalMul(ai, ai);
  const Interval ai3 = intervalMul(ai2, ai);
  const Interval ki = intervalReciprocal(kMin);
  const Interval ki2 = intervalMul(ki, ki);

  const Interval c10 = intervalAdd(
      ai2, intervalScaleFraction(ai3, 1, 32));
  const Interval c11 = intervalScaleFraction(
      intervalMul(
          intervalAdd(ai, intervalScaleFraction(ai2, 1, 64)), ki),
      1, 2);
  const Interval c12 = intervalScaleFraction(
      intervalMul(
          intervalAdd(
              exactFraction(1, 1),
              intervalAdd(intervalScaleFraction(ai, 1, 64),
                          intervalScaleFraction(ai2, 1, 4096))),
          ki2),
      1, 4);
  const Interval c21 = intervalScaleFraction(
      intervalMul(
          intervalAdd(
              ai,
              intervalAdd(intervalScaleFraction(ai2, 1, 32),
                          intervalScaleFraction(ai3, 1, 2048))),
          ki),
      1, 2);
  const Interval c22 = intervalScaleFraction(
      intervalMul(
          intervalAdd(
              exactFraction(1, 1),
              intervalAdd(
                  intervalScaleFraction(ai, 1, 32),
                  intervalAdd(intervalScaleFraction(ai2, 1, 1024),
                              intervalScaleFraction(ai3, 1, 65536)))),
          ki2),
      1, 4);
  return {alpha, intervalMaximum(c10, intervalMaximum(c11, c12)),
          intervalMaximum(c10, intervalMaximum(c21, c22)),
          intervalScaleFraction(ki2, 1, 16)};
}

std::pair<double, double> asDoublePair(const Interval& value) {
  return {value.lower.asDouble(kRndD), value.upper.asDouble(kRndU)};
}

std::pair<double, double> evaluateAtOne(const Model& value) {
  Mp lower;
  Mp upper;
  for (const Interval& coefficient : value.coefficients) {
    Mp nextLower;
    Mp nextUpper;
    add(nextLower, lower, coefficient.lower, kRndD);
    add(nextUpper, upper, coefficient.upper, kRndU);
    lower = std::move(nextLower);
    upper = std::move(nextUpper);
  }
  Mp finalLower;
  Mp finalUpper;
  sub(finalLower, lower, value.residual, kRndD);
  add(finalUpper, upper, value.residual, kRndU);
  return {finalLower.asDouble(kRndD), finalUpper.asDouble(kRndU)};
}

std::string runCanary() {
  const std::lock_guard<std::mutex> runtimeLock(g_runtimeMutex);
  loadApi();
  const ContextGuard contextGuard;
  Model input = modelConstant(1, 10);
  input.coefficients[1] = exactFraction(1, 100);
  Model sValue = modelConstant(1, 10);
  sValue.coefficients[1] = exactFraction(1, 100);
  Model vValue = modelConstant(1, 5);
  vValue.coefficients[1] = exactFraction(1, 200);
  const auto started = std::chrono::steady_clock::now();
  const auto exponential = evaluateAtOne(modelExp(input));
  const auto reciprocal = evaluateAtOne(modelReciprocal(input));
  const auto logarithm = evaluateAtOne(modelLogPositive(input));
  const auto squareRoot = evaluateAtOne(modelSqrtPositive(input));
  const auto phi1 = evaluateAtOne(modelPhi1(input));
  const auto q0 = evaluateAtOne(modelQ0(sValue, vValue));
  const Jet2 expJet = jetExp(jetVariable(input, 0));
  const auto expJetFirst = evaluateAtOne(expJet.first(0));
  const auto expJetSecond =
      evaluateAtOne(expJet.second(secondIndex(0, 0)));
  const Jet2 phi1Jet = jetPhi1(jetVariable(input, 0));
  const auto phi1JetFirst = evaluateAtOne(phi1Jet.first(0));
  const auto phi1JetSecond =
      evaluateAtOne(phi1Jet.second(secondIndex(0, 0)));
  const Jet2 log1pJet = jetLog1pOverX(jetVariable(input, 0));
  const auto log1pValue = evaluateAtOne(log1pJet.value());
  const auto log1pFirst = evaluateAtOne(log1pJet.first(0));
  const auto log1pSecond =
      evaluateAtOne(log1pJet.second(secondIndex(0, 0)));
  const Jet2 log1mJet = jetLog1mOverX(jetVariable(input, 0));
  const auto log1mValue = evaluateAtOne(log1mJet.value());
  const auto log1mFirst = evaluateAtOne(log1mJet.first(0));
  const auto log1mSecond =
      evaluateAtOne(log1mJet.second(secondIndex(0, 0)));
  const Jet2 lambdaInput = jetVariable(modelConstant(3, 4), 3);
  const Jet2 nuInput = jetVariable(modelConstant(-8, 25), 4);
  const Jet2 mInput = jetVariable(modelConstant(4, 3), 5);
  const Jet2 cInput = jetVariable(modelConstant(1, 1), 6);
  const ParameterSourceChart physicalChart = evaluateParameterSourceChart(
      lambdaInput, nuInput, mInput, cInput, modelConstant(1, 2));
  const auto chartS = evaluateAtOne(physicalChart.s.value());
  const auto chartK = evaluateAtOne(physicalChart.k.value());
  const auto chartW2 = evaluateAtOne(physicalChart.w2.value());
  const auto chartSigma = evaluateAtOne(physicalChart.sigma.value());
  const auto chartD = evaluateAtOne(physicalChart.d.value());
  const auto chartB = evaluateAtOne(physicalChart.flatB.value());
  const auto chartZ = evaluateAtOne(physicalChart.z.value());
  const auto chartH = evaluateAtOne(physicalChart.hS.value());
  const auto chartV1 = evaluateAtOne(physicalChart.v1S.value());
  const auto chartHy = evaluateAtOne(physicalChart.hSy.value());
  const auto chartV1y = evaluateAtOne(physicalChart.v1Sy.value());
  const auto chartMetricD = evaluateAtOne(physicalChart.metricD.value());
  const auto chartHLambda = evaluateAtOne(physicalChart.hS.first(3));
  const auto chartHLambda2 =
      evaluateAtOne(physicalChart.hS.second(secondIndex(3, 3)));
  const auto chartKNu = evaluateAtOne(physicalChart.k.first(4));
  const auto chartKNu2 =
      evaluateAtOne(physicalChart.k.second(secondIndex(4, 4)));
  const JetSeriesValueDerivatives physicalScalarJet =
      evaluateScalarJetParameterSeries(
          physicalChart.s, mInput, physicalChart.k, physicalChart.z);
  const Jet2 physicalScalarY = jetScaleFraction(
      jetMul(
          jetMul(
              physicalChart.k,
              jetMul(physicalChart.z, physicalChart.z)),
          physicalScalarJet.first),
      -1, 1);
  const Jet2 physicalScalarYY = jetMul(
      jetMul(physicalChart.k, physicalChart.k),
      jetAdd(
          jetMul(
              jetMul(
                  jetMul(physicalChart.z, physicalChart.z),
                  jetMul(physicalChart.z, physicalChart.z)),
              physicalScalarJet.second),
          jetScaleFraction(
              jetMul(
                  jetMul(
                      jetMul(physicalChart.z, physicalChart.z),
                      physicalChart.z),
                  physicalScalarJet.first),
              2, 1)));
  const Jet2 physicalFiniteResidual = jetSub(
      physicalScalarYY,
      jetScaleFraction(
          jetMul(physicalChart.k, physicalScalarY), 2, 1));
  const Jet2 zeroJet = jetConstant(modelConstant(0, 1));
  const SourceInputs physicalSourceInputs{
      physicalChart.s,
      nuInput,
      physicalChart.metricD,
      physicalChart.b,
      physicalChart.hS,
      physicalChart.v1S,
      physicalChart.hSy,
      physicalChart.v1Sy,
      jetVariable(modelConstant(0, 1), 0),
      jetVariable(modelConstant(0, 1), 1),
      zeroJet,
      zeroJet,
      jetAdd(
          physicalScalarJet.value,
          jetVariable(modelConstant(0, 1), 2)),
      physicalScalarY,
      jetConstant(modelConstant(1, 128)),
      physicalChart.sigma,
      physicalFiniteResidual,
  };
  const SourceOutputs physicalSources =
      evaluateFactoredSourceDag(physicalSourceInputs);
  const auto physicalRh = evaluateAtOne(physicalSources.deltaRhOverD.value());
  const auto physicalRv = evaluateAtOne(physicalSources.deltaRv1OverD.value());
  const auto physicalScalar = evaluateAtOne(physicalSources.scalar.value());
  const auto physicalRhLambda =
      evaluateAtOne(physicalSources.deltaRhOverD.first(3));
  const auto physicalRvLambda =
      evaluateAtOne(physicalSources.deltaRv1OverD.first(3));
  const auto physicalScalarLambda =
      evaluateAtOne(physicalSources.scalar.first(3));
  const auto physicalScalarLambda2 = evaluateAtOne(
      physicalSources.scalar.second(secondIndex(3, 3)));
  const KernelConstants kernels = kernelConstants(
      exactFraction(1, 2), exactFraction(1, 4));
  const auto alpha = asDoublePair(kernels.alpha);
  const auto cG1 = asDoublePair(kernels.g1);
  const auto cG2 = asDoublePair(kernels.g2);
  const auto cK0 = asDoublePair(kernels.k0);
  const Jet2 hHat = jetVariable(modelConstant(1, 10), 0);
  const SourceInputs sourceInputs{
      jetConstant(modelConstant(1, 10)),
      jetConstant(modelConstant(1, 20)),
      jetConstant(modelConstant(1, 100)),
      jetConstant(modelConstant(-1, 2)),
      jetConstant(modelConstant(1, 5)),
      jetConstant(modelConstant(1, 6)),
      jetConstant(modelConstant(1, 20)),
      jetConstant(modelConstant(1, 25)),
      hHat,
      jetConstant(modelConstant(0, 1)),
      jetScaleFraction(hHat, -1, 1),
      jetConstant(modelConstant(0, 1)),
      jetConstant(modelConstant(1, 4)),
      jetConstant(modelConstant(1, 30)),
      jetConstant(modelConstant(1, 64)),
      jetConstant(modelConstant(1, 8)),
      jetConstant(modelConstant(0, 1)),
  };
  const SourceOutputs sources = evaluateFactoredSourceDag(sourceInputs);
  const auto rhValue = evaluateAtOne(sources.deltaRhOverD.value());
  const auto rhFirst = evaluateAtOne(sources.deltaRhOverD.first(0));
  const auto rhSecond = evaluateAtOne(
      sources.deltaRhOverD.second(secondIndex(0, 0)));
  const auto rvValue = evaluateAtOne(sources.deltaRv1OverD.value());
  const auto rvFirst = evaluateAtOne(sources.deltaRv1OverD.first(0));
  const auto rvSecond = evaluateAtOne(
      sources.deltaRv1OverD.second(secondIndex(0, 0)));
  const auto scalarValue = evaluateAtOne(sources.scalar.value());
  const auto scalarFirst = evaluateAtOne(sources.scalar.first(0));
  const auto scalarSecond =
      evaluateAtOne(sources.scalar.second(secondIndex(0, 0)));
  const Interval endpointS = exactFraction(9, 16);
  const Interval endpointM = exactFraction(4, 3);
  const Interval endpointK = exactFraction(4, 5);
  const Interval endpointT = exactFraction(1, 1);
  Interval endpointCapT;
  endpointCapT.lower.setSi(0, kRndD);
  endpointCapT.upper.setSi(1, kRndU);
  const auto endpointQuotientPoint = asDoublePair(
      endpointQuotient(endpointS, endpointM, endpointK, endpointT));
  const auto endpointQuotientCap = asDoublePair(
      endpointQuotient(endpointS, endpointM, endpointK, endpointCapT));
  const SeriesValueDerivative scalarJet = scalarJetValueDerivative(
      endpointS, endpointM, endpointK, exactFraction(1, 64));
  const auto scalarJetValue = asDoublePair(scalarJet.value);
  const auto scalarJetDerivative = asDoublePair(scalarJet.derivative);
  const RegularCoverSummary regularCover = evaluateRegularCoverCanary();
  const double regularRhAbsUpper = regularCover.rhAbsUpper.asDouble(kRndU);
  const double regularRvAbsUpper = regularCover.rvAbsUpper.asDouble(kRndU);
  const double regularScalarAbsUpper =
      regularCover.scalarAbsUpper.asDouble(kRndU);
  const DerivativeCoverSummary derivativeCover =
      evaluateRegularDerivativeCoverCanary();
  const auto stopped = std::chrono::steady_clock::now();
  const auto elapsed = std::chrono::duration_cast<std::chrono::microseconds>(
                           stopped - started)
                           .count();
  char buffer[6144];
  const int count = std::snprintf(
      buffer, sizeof(buffer),
      "{\"status\":\"calculation_only\",\"analyticOrder\":512,"
      "\"parameterDegree\":32,"
      "\"exp\":[%.17g,%.17g],\"reciprocal\":[%.17g,%.17g],"
      "\"log\":[%.17g,%.17g],\"sqrt\":[%.17g,%.17g],"
      "\"phi1\":[%.17g,%.17g],\"q0\":[%.17g,%.17g],"
      "\"expJetFirst\":[%.17g,%.17g],"
      "\"expJetSecond\":[%.17g,%.17g],"
      "\"phi1JetFirst\":[%.17g,%.17g],"
      "\"phi1JetSecond\":[%.17g,%.17g],"
      "\"log1pOverX\":[%.17g,%.17g],"
      "\"log1pOverXFirst\":[%.17g,%.17g],"
      "\"log1pOverXSecond\":[%.17g,%.17g],"
      "\"log1mOverX\":[%.17g,%.17g],"
      "\"log1mOverXFirst\":[%.17g,%.17g],"
      "\"log1mOverXSecond\":[%.17g,%.17g],"
      "\"chartS\":[%.17g,%.17g],\"chartK\":[%.17g,%.17g],"
      "\"chartW2\":[%.17g,%.17g],"
      "\"chartSigma\":[%.17g,%.17g],"
      "\"chartD\":[%.17g,%.17g],\"chartB\":[%.17g,%.17g],"
      "\"chartZ\":[%.17g,%.17g],\"chartH\":[%.17g,%.17g],"
      "\"chartV1\":[%.17g,%.17g],\"chartHy\":[%.17g,%.17g],"
      "\"chartV1y\":[%.17g,%.17g],"
      "\"chartMetricD\":[%.17g,%.17g],"
      "\"chartHLambda\":[%.17g,%.17g],"
      "\"chartHLambda2\":[%.17g,%.17g],"
      "\"chartKNu\":[%.17g,%.17g],"
      "\"chartKNu2\":[%.17g,%.17g],"
      "\"physicalRh\":[%.17g,%.17g],"
      "\"physicalRv\":[%.17g,%.17g],"
      "\"physicalScalar\":[%.17g,%.17g],"
      "\"physicalRhLambda\":[%.17g,%.17g],"
      "\"physicalRvLambda\":[%.17g,%.17g],"
      "\"physicalScalarLambda\":[%.17g,%.17g],"
      "\"physicalScalarLambda2\":[%.17g,%.17g],"
      "\"parameterSourceChartCanaryImplemented\":true,"
      "\"alpha\":[%.17g,%.17g],\"cG1\":[%.17g,%.17g],"
      "\"cG2\":[%.17g,%.17g],\"cK0\":[%.17g,%.17g],"
      "\"rh\":[%.17g,%.17g],\"rhD1\":[%.17g,%.17g],"
      "\"rhD2\":[%.17g,%.17g],\"rv\":[%.17g,%.17g],"
      "\"rvD1\":[%.17g,%.17g],\"rvD2\":[%.17g,%.17g],"
      "\"scalar\":[%.17g,%.17g],\"scalarD1\":[%.17g,%.17g],"
      "\"scalarD2\":[%.17g,%.17g],"
      "\"endpointQuotientSemanticSha256\":"
      "\"c19b4795d314597d72d18ab8ad6e8dbfe55d16f58f31472402fff548417022a7\","
      "\"endpointQuotientTerms\":3053,"
      "\"endpointQuotientAtOne\":[%.17g,%.17g],"
      "\"endpointQuotientCap\":[%.17g,%.17g],"
      "\"scalarJetSemanticSha256\":"
      "\"858e83405870b2a6bb170b42f9b85817f7cfd9413e6206faba1fbbd1ae27826d\","
      "\"scalarJetTerms\":516,"
      "\"scalarJetValue\":[%.17g,%.17g],"
      "\"scalarJetDerivative\":[%.17g,%.17g],"
      "\"radialCoverOrdinals\":256,"
      "\"regularCellsVisited\":%llu,"
      "\"regularRhAbsUpper\":%.17g,"
      "\"regularRvAbsUpper\":%.17g,"
      "\"regularScalarAbsUpper\":%.17g,"
      "\"radialCoverTraversalImplemented\":true,"
      "\"derivativeCellsVisited\":%llu,"
      "\"derivativeValueAbsUpper\":%.17g,"
      "\"tailFirstAbsUpper\":%.17g,"
      "\"tailSecondAbsUpper\":%.17g,"
      "\"parameterFirstAbsUpper\":%.17g,"
      "\"parameterSecondAbsUpper\":%.17g,"
      "\"mixedSecondAbsUpper\":%.17g,"
      "\"regularDerivativeCoverImplemented\":true,"
      "\"parameterCoordinateRelationsFrozen\":false,"
      "\"radialCoverImplemented\":false,"
      "\"elapsedMicroseconds\":%lld,\"proofAuthority\":false,"
      "\"candidateExecuted\":false,\"physicalAuthority\":false}",
      exponential.first, exponential.second, reciprocal.first,
      reciprocal.second, logarithm.first, logarithm.second, squareRoot.first,
      squareRoot.second, phi1.first, phi1.second, q0.first, q0.second,
      expJetFirst.first, expJetFirst.second, expJetSecond.first,
      expJetSecond.second,
      phi1JetFirst.first, phi1JetFirst.second, phi1JetSecond.first,
      phi1JetSecond.second,
      log1pValue.first, log1pValue.second, log1pFirst.first,
      log1pFirst.second, log1pSecond.first, log1pSecond.second,
      log1mValue.first, log1mValue.second, log1mFirst.first,
      log1mFirst.second, log1mSecond.first, log1mSecond.second,
      chartS.first, chartS.second, chartK.first, chartK.second,
      chartW2.first, chartW2.second, chartSigma.first, chartSigma.second,
      chartD.first, chartD.second, chartB.first, chartB.second,
      chartZ.first, chartZ.second, chartH.first, chartH.second,
      chartV1.first, chartV1.second, chartHy.first, chartHy.second,
      chartV1y.first, chartV1y.second, chartMetricD.first,
      chartMetricD.second, chartHLambda.first, chartHLambda.second,
      chartHLambda2.first, chartHLambda2.second, chartKNu.first,
      chartKNu.second, chartKNu2.first, chartKNu2.second,
      physicalRh.first, physicalRh.second, physicalRv.first,
      physicalRv.second, physicalScalar.first, physicalScalar.second,
      physicalRhLambda.first, physicalRhLambda.second,
      physicalRvLambda.first, physicalRvLambda.second,
      physicalScalarLambda.first, physicalScalarLambda.second,
      physicalScalarLambda2.first, physicalScalarLambda2.second,
      alpha.first, alpha.second, cG1.first, cG1.second, cG2.first,
      cG2.second, cK0.first, cK0.second,
      rhValue.first, rhValue.second, rhFirst.first, rhFirst.second,
      rhSecond.first, rhSecond.second, rvValue.first, rvValue.second,
      rvFirst.first, rvFirst.second, rvSecond.first, rvSecond.second,
      scalarValue.first, scalarValue.second, scalarFirst.first,
      scalarFirst.second, scalarSecond.first, scalarSecond.second,
      endpointQuotientPoint.first, endpointQuotientPoint.second,
      endpointQuotientCap.first, endpointQuotientCap.second,
      scalarJetValue.first, scalarJetValue.second,
      scalarJetDerivative.first, scalarJetDerivative.second,
      static_cast<unsigned long long>(regularCover.visited),
      regularRhAbsUpper, regularRvAbsUpper, regularScalarAbsUpper,
      static_cast<unsigned long long>(derivativeCover.visited),
      derivativeCover.valueAbsUpper.asDouble(kRndU),
      derivativeCover.tailFirstAbsUpper.asDouble(kRndU),
      derivativeCover.tailSecondAbsUpper.asDouble(kRndU),
      derivativeCover.parameterFirstAbsUpper.asDouble(kRndU),
      derivativeCover.parameterSecondAbsUpper.asDouble(kRndU),
      derivativeCover.mixedSecondAbsUpper.asDouble(kRndU),
      static_cast<long long>(elapsed));
  if (count <= 0 || static_cast<std::size_t>(count) >= sizeof(buffer)) {
    throw std::runtime_error("canary_encoding_failed");
  }
  return std::string(buffer, static_cast<std::size_t>(count));
}

}  // namespace

extern "C" __declspec(dllexport) int nhm2_tail_native_canary(
    char* output, std::size_t capacity) noexcept {
  if (output == nullptr || capacity == 0) {
    return 2;
  }
  try {
    const std::string payload = runCanary();
    if (payload.size() + 1 > capacity) {
      return 3;
    }
    std::memcpy(output, payload.c_str(), payload.size() + 1);
    return 0;
  } catch (const std::exception& error) {
    const int count = std::snprintf(output, capacity,
                                    "{\"status\":\"blocked\","
                                    "\"error\":\"%.160s\"}",
                                    error.what());
    return count > 0 ? 1 : 4;
  } catch (...) {
    std::snprintf(output, capacity,
                  "{\"status\":\"blocked\","
                  "\"error\":\"non_standard_exception\"}");
    return 5;
  }
}
