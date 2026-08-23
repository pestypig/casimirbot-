/* Candidate-neutral C17/MPFR directed-square-root replay. */
#define _POSIX_C_SOURCE 200809L
#include <gmp.h>
#include <mpfr.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

#define PREC_BITS 512

typedef struct { const char *id; unsigned long coefficient; int exponent10; } vector;

static void exact_decimal(mpq_t result, unsigned long coefficient, int exponent10) {
  mpz_t power;
  mpz_init(power);
  mpz_ui_pow_ui(power, 10, (unsigned long)(exponent10 < 0 ? -exponent10 : exponent10));
  mpq_set_ui(result, coefficient, 1);
  if (exponent10 < 0) mpz_set(mpq_denref(result), power);
  else mpz_set(mpq_numref(result), power), mpz_mul_ui(mpq_numref(result), mpq_numref(result), coefficient);
  mpq_canonicalize(result);
  mpz_clear(power);
}

static int compare_square(const mpfr_t value, const mpq_t radicand) {
  mpfr_t square;
  mpq_t exact_square;
  int comparison;
  mpfr_init2(square, 2 * PREC_BITS + 8);
  mpq_init(exact_square);
  mpfr_mul(square, value, value, MPFR_RNDN);
  mpfr_get_q(exact_square, square);
  comparison = mpq_cmp(exact_square, radicand);
  mpq_clear(exact_square);
  mpfr_clear(square);
  return comparison;
}

static bool check_vector(const vector *item) {
  mpq_t exact;
  mpfr_t input_lo, input_hi, lower, upper, adjacent;
  bool lower_ok, upper_ok, lower_tight, upper_tight, exact_root;
  int adjustments;
  if (item->coefficient == 0) return true;
  mpq_init(exact);
  exact_decimal(exact, item->coefficient, item->exponent10);
  mpfr_init2(input_lo, 4096);
  mpfr_init2(input_hi, 4096);
  mpfr_init2(lower, PREC_BITS);
  mpfr_init2(upper, PREC_BITS);
  mpfr_init2(adjacent, PREC_BITS);
  mpfr_set_q(input_lo, exact, MPFR_RNDD);
  mpfr_set_q(input_hi, exact, MPFR_RNDU);
  mpfr_sqrt(lower, input_lo, MPFR_RNDD);
  mpfr_sqrt(upper, input_hi, MPFR_RNDU);
  for (adjustments = 0; adjustments < 8 && compare_square(lower, exact) > 0; ++adjustments)
    mpfr_nextbelow(lower);
  for (adjustments = 0; adjustments < 8; ++adjustments) {
    mpfr_set(adjacent, lower, MPFR_RNDN);
    mpfr_nextabove(adjacent);
    if (compare_square(adjacent, exact) > 0) break;
    mpfr_set(lower, adjacent, MPFR_RNDN);
  }
  for (adjustments = 0; adjustments < 8 && compare_square(upper, exact) < 0; ++adjustments)
    mpfr_nextabove(upper);
  for (adjustments = 0; adjustments < 8; ++adjustments) {
    mpfr_set(adjacent, upper, MPFR_RNDN);
    mpfr_nextbelow(adjacent);
    if (mpfr_sgn(adjacent) < 0 || compare_square(adjacent, exact) < 0) break;
    mpfr_set(upper, adjacent, MPFR_RNDN);
  }
  lower_ok = compare_square(lower, exact) <= 0;
  upper_ok = compare_square(upper, exact) >= 0;
  exact_root = mpfr_equal_p(lower, upper) && compare_square(lower, exact) == 0;
  mpfr_set(adjacent, lower, MPFR_RNDN);
  mpfr_nextabove(adjacent);
  lower_tight = exact_root || compare_square(adjacent, exact) > 0;
  mpfr_set(adjacent, upper, MPFR_RNDN);
  mpfr_nextbelow(adjacent);
  upper_tight = exact_root || mpfr_sgn(adjacent) < 0 || compare_square(adjacent, exact) < 0;
  mpfr_clear(adjacent);
  mpfr_clear(upper);
  mpfr_clear(lower);
  mpfr_clear(input_hi);
  mpfr_clear(input_lo);
  mpq_clear(exact);
  return lower_ok && upper_ok && lower_tight && upper_tight;
}

int main(void) {
  const vector vectors[] = {
    {"zero", 0, 0}, {"unit", 1, 0}, {"quarter-square", 25, -2},
    {"sqrt-two", 2, 0}, {"sqrt-ten", 10, 0}, {"tiny-square", 1, -1000},
    {"tiny-irrational", 2, -1000}, {"huge-square", 1, 1000},
    {"interval-endpoints-lower", 2, 0}, {"interval-endpoints-upper", 3, 0}
  };
  size_t i, count = sizeof(vectors) / sizeof(vectors[0]);
  printf("{\"candidateEvaluated\":false,\"precisionBits\":512,\"schema\":\"nhm2.g2e.directed-sqrt.independent-result.v1\",\"status\":\"PASS\",\"vectors\":[");
  for (i = 0; i < count; ++i) {
    bool pass = check_vector(&vectors[i]);
    if (!pass) {
      fprintf(stderr, "directed_sqrt_contract_failed:%s\n", vectors[i].id);
      return 1;
    }
    printf("%s{\"id\":\"%s\",\"status\":\"PASS\"}", i ? "," : "", vectors[i].id);
  }
  puts("]}");
  return 0;
}
