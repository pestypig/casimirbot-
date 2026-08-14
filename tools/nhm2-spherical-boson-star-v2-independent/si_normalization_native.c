/*
 * Independently authored NHM2 spherical-boson-star v2 SI normalization
 * source candidate.  This translation unit is deliberately standalone and
 * uses only the GNU MPFR 4.2.2 / GMP 6.3.0 native APIs for numeric work.
 * It does not confer implementation binding, runtime binding, persistence,
 * agreement, readiness, authority, lamps, or physical status.
 */

#include <float.h>
#include <gmp.h>
#include <math.h>
#include <mpfr.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#define PRECISION_BITS 256
#define REQUIRED_STDIN_BYTES 6180u
#define RECEIPT_CAPACITY 262145u
#define TRACE_COUNT 139u
#define MAX_MPFR_DESTINATIONS 192u

static const char REQUIRED_ARGV[] =
    "--emit-nhm2-spherical-boson-star-v2-si-normalization-receipt-v2";
static const char CODATA_SHA256[] =
    "5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61";

typedef struct {
  const char *label;
  const char *primitive;
  const char *rounding;
  const char *sources;
} TraceSpec;

#define TS(label_, primitive_, rounding_, sources_) \
  { label_, primitive_, rounding_, sources_ }

static const TraceSpec TRACE_SPECS[TRACE_COUNT] = {
  TS("d01_g_mantissa_set_z","mpfr_set_z","RNDN","frozen:g_mantissa_1"),
  TS("d01_g_lower_mul_2si","mpfr_mul_2si","RNDN","d01_g_mantissa_set_z"),
  TS("d01_g_upper_set","mpfr_set","RNDN","d01_g_lower_mul_2si"),
  TS("d02_c_lower_set_ui","mpfr_set_ui","RNDN","frozen:c_299792458"),
  TS("d02_c_upper_set","mpfr_set","RNDN","d02_c_lower_set_ui"),
  TS("d03_h_lower_set_str","mpfr_set_str","RNDD","frozen:h_6.62607015e-34"),
  TS("d03_h_upper_set_str","mpfr_set_str","RNDU","frozen:h_6.62607015e-34"),
  TS("d04_pi_lower_const_pi","mpfr_const_pi","RNDD","mathematical:pi"),
  TS("d04_pi_upper_const_pi","mpfr_const_pi","RNDU","mathematical:pi"),
  TS("d05_two_lower_set_ui","mpfr_set_ui","RNDN","frozen:integer_2"),
  TS("d05_two_upper_set","mpfr_set","RNDN","d05_two_lower_set_ui"),
  TS("d06_eight_lower_set_ui","mpfr_set_ui","RNDN","frozen:integer_8"),
  TS("d06_eight_upper_set","mpfr_set","RNDN","d06_eight_lower_set_ui"),
  TS("d07_twoPi_lower_mul","mpfr_mul","RNDD","d05_two_lower_set_ui,d04_pi_lower_const_pi"),
  TS("d07_twoPi_upper_mul","mpfr_mul","RNDU","d05_two_upper_set,d04_pi_upper_const_pi"),
  TS("d08_hbar_lower_div","mpfr_div","RNDD","d03_h_lower_set_str,d07_twoPi_upper_mul"),
  TS("d08_hbar_upper_div","mpfr_div","RNDU","d03_h_upper_set_str,d07_twoPi_lower_mul"),
  TS("d09_GCentral_lower_set_str","mpfr_set_str","RNDD","frozen:G_6.67430e-11"),
  TS("d09_GCentral_upper_set_str","mpfr_set_str","RNDU","frozen:G_6.67430e-11"),
  TS("d10_GStandardUncertainty_lower_set_str","mpfr_set_str","RNDD","frozen:G_u_1.5e-15"),
  TS("d10_GStandardUncertainty_upper_set_str","mpfr_set_str","RNDU","frozen:G_u_1.5e-15"),
  TS("d11_GOneSigma_k_lower_set_ui","mpfr_set_ui","RNDN","frozen:coverage_1"),
  TS("d11_GOneSigma_k_upper_set","mpfr_set","RNDN","d11_GOneSigma_k_lower_set_ui"),
  TS("d11_GOneSigma_radius_lower_mul","mpfr_mul","RNDU","d11_GOneSigma_k_upper_set,d10_GStandardUncertainty_upper_set_str"),
  TS("d11_GOneSigma_radius_upper_mul","mpfr_mul","RNDU","d11_GOneSigma_k_upper_set,d10_GStandardUncertainty_upper_set_str"),
  TS("d11_GOneSigma_lower_sub","mpfr_sub","RNDD","d09_GCentral_lower_set_str,d11_GOneSigma_radius_lower_mul"),
  TS("d11_GOneSigma_upper_add","mpfr_add","RNDU","d09_GCentral_upper_set_str,d11_GOneSigma_radius_upper_mul"),
  TS("d12_GAdmissionK2_k_lower_set_ui","mpfr_set_ui","RNDN","frozen:coverage_2"),
  TS("d12_GAdmissionK2_k_upper_set","mpfr_set","RNDN","d12_GAdmissionK2_k_lower_set_ui"),
  TS("d12_GAdmissionK2_radius_lower_mul","mpfr_mul","RNDU","d12_GAdmissionK2_k_upper_set,d10_GStandardUncertainty_upper_set_str"),
  TS("d12_GAdmissionK2_radius_upper_mul","mpfr_mul","RNDU","d12_GAdmissionK2_k_upper_set,d10_GStandardUncertainty_upper_set_str"),
  TS("d12_GAdmissionK2_lower_sub","mpfr_sub","RNDD","d09_GCentral_lower_set_str,d12_GAdmissionK2_radius_lower_mul"),
  TS("d12_GAdmissionK2_upper_add","mpfr_add","RNDU","d09_GCentral_upper_set_str,d12_GAdmissionK2_radius_upper_mul"),
  TS("d13_eightPi_lower_mul","mpfr_mul","RNDD","d06_eight_lower_set_ui,d04_pi_lower_const_pi"),
  TS("d13_eightPi_upper_mul","mpfr_mul","RNDU","d06_eight_upper_set,d04_pi_upper_const_pi"),
  TS("d14_c2_lower_mul","mpfr_mul","RNDD","d02_c_lower_set_ui,d02_c_lower_set_ui"),
  TS("d14_c2_upper_mul","mpfr_mul","RNDU","d02_c_upper_set,d02_c_upper_set"),
  TS("d15_c3_lower_mul","mpfr_mul","RNDD","d14_c2_lower_mul,d02_c_lower_set_ui"),
  TS("d15_c3_upper_mul","mpfr_mul","RNDU","d14_c2_upper_mul,d02_c_upper_set"),
  TS("d16_c4_lower_mul","mpfr_mul","RNDD","d14_c2_lower_mul,d14_c2_lower_mul"),
  TS("d16_c4_upper_mul","mpfr_mul","RNDU","d14_c2_upper_mul,d14_c2_upper_mul"),
  TS("d17_c5_lower_mul","mpfr_mul","RNDD","d16_c4_lower_mul,d02_c_lower_set_ui"),
  TS("d17_c5_upper_mul","mpfr_mul","RNDU","d16_c4_upper_mul,d02_c_upper_set"),
  TS("d18_c7_lower_mul","mpfr_mul","RNDD","d16_c4_lower_mul,d15_c3_lower_mul"),
  TS("d18_c7_upper_mul","mpfr_mul","RNDU","d16_c4_upper_mul,d15_c3_upper_mul"),
  TS("d19_gHbar_lower_mul","mpfr_mul","RNDD","d01_g_lower_mul_2si,d08_hbar_lower_div"),
  TS("d19_gHbar_upper_mul","mpfr_mul","RNDU","d01_g_upper_set,d08_hbar_upper_div"),
  TS("d20_gHbarC5_lower_mul","mpfr_mul","RNDD","d19_gHbar_lower_mul,d17_c5_lower_mul"),
  TS("d20_gHbarC5_upper_mul","mpfr_mul","RNDU","d19_gHbar_upper_mul,d17_c5_upper_mul"),
  TS("d21_eightPiGCentral_lower_mul","mpfr_mul","RNDD","d13_eightPi_lower_mul,d09_GCentral_lower_set_str"),
  TS("d21_eightPiGCentral_upper_mul","mpfr_mul","RNDU","d13_eightPi_upper_mul,d09_GCentral_upper_set_str"),
  TS("d22_muECentralSquared_lower_div","mpfr_div","RNDD","d20_gHbarC5_lower_mul,d21_eightPiGCentral_upper_mul"),
  TS("d22_muECentralSquared_upper_div","mpfr_div","RNDU","d20_gHbarC5_upper_mul,d21_eightPiGCentral_lower_mul"),
  TS("d23_muECentral_lower_sqrt","mpfr_sqrt","RNDD","d22_muECentralSquared_lower_div"),
  TS("d23_muECentral_upper_sqrt","mpfr_sqrt","RNDU","d22_muECentralSquared_upper_div"),
  TS("d24_hbarC_lower_mul","mpfr_mul","RNDD","d08_hbar_lower_div,d02_c_lower_set_ui"),
  TS("d24_hbarC_upper_mul","mpfr_mul","RNDU","d08_hbar_upper_div,d02_c_upper_set"),
  TS("d25_muLCentral_lower_div","mpfr_div","RNDD","d23_muECentral_lower_sqrt,d24_hbarC_upper_mul"),
  TS("d25_muLCentral_upper_div","mpfr_div","RNDU","d23_muECentral_upper_sqrt,d24_hbarC_lower_mul"),
  TS("d26_muLCentralSquared_lower_mul","mpfr_mul","RNDD","d25_muLCentral_lower_div,d25_muLCentral_lower_div"),
  TS("d26_muLCentralSquared_upper_mul","mpfr_mul","RNDU","d25_muLCentral_upper_div,d25_muLCentral_upper_div"),
  TS("d27_c4MuLCentralSquared_lower_mul","mpfr_mul","RNDD","d16_c4_lower_mul,d26_muLCentralSquared_lower_mul"),
  TS("d27_c4MuLCentralSquared_upper_mul","mpfr_mul","RNDU","d16_c4_upper_mul,d26_muLCentralSquared_upper_mul"),
  TS("d28_stressScaleCentralViaMu_lower_div","mpfr_div","RNDD","d27_c4MuLCentralSquared_lower_mul,d21_eightPiGCentral_upper_mul"),
  TS("d28_stressScaleCentralViaMu_upper_div","mpfr_div","RNDU","d27_c4MuLCentralSquared_upper_mul,d21_eightPiGCentral_lower_mul"),
  TS("d29_eightPiGCentralSquared_lower_mul","mpfr_mul","RNDD","d21_eightPiGCentral_lower_mul,d21_eightPiGCentral_lower_mul"),
  TS("d29_eightPiGCentralSquared_upper_mul","mpfr_mul","RNDU","d21_eightPiGCentral_upper_mul,d21_eightPiGCentral_upper_mul"),
  TS("d30_eightPiGCentralSquaredHbar_lower_mul","mpfr_mul","RNDD","d29_eightPiGCentralSquared_lower_mul,d08_hbar_lower_div"),
  TS("d30_eightPiGCentralSquaredHbar_upper_mul","mpfr_mul","RNDU","d29_eightPiGCentralSquared_upper_mul,d08_hbar_upper_div"),
  TS("d31_gC7_lower_mul","mpfr_mul","RNDD","d01_g_lower_mul_2si,d18_c7_lower_mul"),
  TS("d31_gC7_upper_mul","mpfr_mul","RNDU","d01_g_upper_set,d18_c7_upper_mul"),
  TS("d32_stressScaleCentral_lower_div","mpfr_div","RNDD","d31_gC7_lower_mul,d30_eightPiGCentralSquaredHbar_upper_mul"),
  TS("d32_stressScaleCentral_upper_div","mpfr_div","RNDU","d31_gC7_upper_mul,d30_eightPiGCentralSquaredHbar_lower_mul"),
  TS("d33_noiseScaleCentral_lower_mul","mpfr_mul","RNDD","d32_stressScaleCentral_lower_div,d32_stressScaleCentral_lower_div"),
  TS("d33_noiseScaleCentral_upper_mul","mpfr_mul","RNDU","d32_stressScaleCentral_upper_div,d32_stressScaleCentral_upper_div"),
  TS("d34_eightPiGOneSigma_lower_mul","mpfr_mul","RNDD","d13_eightPi_lower_mul,d11_GOneSigma_lower_sub"),
  TS("d34_eightPiGOneSigma_upper_mul","mpfr_mul","RNDU","d13_eightPi_upper_mul,d11_GOneSigma_upper_add"),
  TS("d35_muEOneSigmaSquared_lower_div","mpfr_div","RNDD","d20_gHbarC5_lower_mul,d34_eightPiGOneSigma_upper_mul"),
  TS("d35_muEOneSigmaSquared_upper_div","mpfr_div","RNDU","d20_gHbarC5_upper_mul,d34_eightPiGOneSigma_lower_mul"),
  TS("d36_muEOneSigma_lower_sqrt","mpfr_sqrt","RNDD","d35_muEOneSigmaSquared_lower_div"),
  TS("d36_muEOneSigma_upper_sqrt","mpfr_sqrt","RNDU","d35_muEOneSigmaSquared_upper_div"),
  TS("d37_muLOneSigma_lower_div","mpfr_div","RNDD","d36_muEOneSigma_lower_sqrt,d24_hbarC_upper_mul"),
  TS("d37_muLOneSigma_upper_div","mpfr_div","RNDU","d36_muEOneSigma_upper_sqrt,d24_hbarC_lower_mul"),
  TS("d38_eightPiGOneSigmaSquared_lower_mul","mpfr_mul","RNDD","d34_eightPiGOneSigma_lower_mul,d34_eightPiGOneSigma_lower_mul"),
  TS("d38_eightPiGOneSigmaSquared_upper_mul","mpfr_mul","RNDU","d34_eightPiGOneSigma_upper_mul,d34_eightPiGOneSigma_upper_mul"),
  TS("d39_eightPiGOneSigmaSquaredHbar_lower_mul","mpfr_mul","RNDD","d38_eightPiGOneSigmaSquared_lower_mul,d08_hbar_lower_div"),
  TS("d39_eightPiGOneSigmaSquaredHbar_upper_mul","mpfr_mul","RNDU","d38_eightPiGOneSigmaSquared_upper_mul,d08_hbar_upper_div"),
  TS("d40_stressScaleOneSigma_lower_div","mpfr_div","RNDD","d31_gC7_lower_mul,d39_eightPiGOneSigmaSquaredHbar_upper_mul"),
  TS("d40_stressScaleOneSigma_upper_div","mpfr_div","RNDU","d31_gC7_upper_mul,d39_eightPiGOneSigmaSquaredHbar_lower_mul"),
  TS("d41_noiseScaleOneSigma_lower_mul","mpfr_mul","RNDD","d40_stressScaleOneSigma_lower_div,d40_stressScaleOneSigma_lower_div"),
  TS("d41_noiseScaleOneSigma_upper_mul","mpfr_mul","RNDU","d40_stressScaleOneSigma_upper_div,d40_stressScaleOneSigma_upper_div"),
  TS("d42_eightPiGAdmissionK2_lower_mul","mpfr_mul","RNDD","d13_eightPi_lower_mul,d12_GAdmissionK2_lower_sub"),
  TS("d42_eightPiGAdmissionK2_upper_mul","mpfr_mul","RNDU","d13_eightPi_upper_mul,d12_GAdmissionK2_upper_add"),
  TS("d43_muEAdmissionK2Squared_lower_div","mpfr_div","RNDD","d20_gHbarC5_lower_mul,d42_eightPiGAdmissionK2_upper_mul"),
  TS("d43_muEAdmissionK2Squared_upper_div","mpfr_div","RNDU","d20_gHbarC5_upper_mul,d42_eightPiGAdmissionK2_lower_mul"),
  TS("d44_muEAdmissionK2_lower_sqrt","mpfr_sqrt","RNDD","d43_muEAdmissionK2Squared_lower_div"),
  TS("d44_muEAdmissionK2_upper_sqrt","mpfr_sqrt","RNDU","d43_muEAdmissionK2Squared_upper_div"),
  TS("d45_muLAdmissionK2_lower_div","mpfr_div","RNDD","d44_muEAdmissionK2_lower_sqrt,d24_hbarC_upper_mul"),
  TS("d45_muLAdmissionK2_upper_div","mpfr_div","RNDU","d44_muEAdmissionK2_upper_sqrt,d24_hbarC_lower_mul"),
  TS("d46_eightPiGAdmissionK2Squared_lower_mul","mpfr_mul","RNDD","d42_eightPiGAdmissionK2_lower_mul,d42_eightPiGAdmissionK2_lower_mul"),
  TS("d46_eightPiGAdmissionK2Squared_upper_mul","mpfr_mul","RNDU","d42_eightPiGAdmissionK2_upper_mul,d42_eightPiGAdmissionK2_upper_mul"),
  TS("d47_eightPiGAdmissionK2SquaredHbar_lower_mul","mpfr_mul","RNDD","d46_eightPiGAdmissionK2Squared_lower_mul,d08_hbar_lower_div"),
  TS("d47_eightPiGAdmissionK2SquaredHbar_upper_mul","mpfr_mul","RNDU","d46_eightPiGAdmissionK2Squared_upper_mul,d08_hbar_upper_div"),
  TS("d48_stressScaleAdmissionK2_lower_div","mpfr_div","RNDD","d31_gC7_lower_mul,d47_eightPiGAdmissionK2SquaredHbar_upper_mul"),
  TS("d48_stressScaleAdmissionK2_upper_div","mpfr_div","RNDU","d31_gC7_upper_mul,d47_eightPiGAdmissionK2SquaredHbar_lower_mul"),
  TS("d49_noiseScaleAdmissionK2_lower_mul","mpfr_mul","RNDD","d48_stressScaleAdmissionK2_lower_div,d48_stressScaleAdmissionK2_lower_div"),
  TS("d49_noiseScaleAdmissionK2_upper_mul","mpfr_mul","RNDU","d48_stressScaleAdmissionK2_upper_div,d48_stressScaleAdmissionK2_upper_div"),
  TS("c01_g_mantissa_set_z","mpfr_set_z","RNDN","frozen:g_mantissa_1"),
  TS("c01_gN_mul_2si","mpfr_mul_2si","RNDN","c01_g_mantissa_set_z"),
  TS("c02_cN_set_ui","mpfr_set_ui","RNDN","frozen:c_299792458"),
  TS("c03_hN_set_str","mpfr_set_str","RNDN","frozen:h_6.62607015e-34"),
  TS("c04_piN_const_pi","mpfr_const_pi","RNDN","mathematical:pi"),
  TS("c05_twoN_set_ui","mpfr_set_ui","RNDN","frozen:integer_2"),
  TS("c06_eightN_set_ui","mpfr_set_ui","RNDN","frozen:integer_8"),
  TS("c07_twoPiN_mul","mpfr_mul","RNDN","c05_twoN_set_ui,c04_piN_const_pi"),
  TS("c08_hbarN_div","mpfr_div","RNDN","c03_hN_set_str,c07_twoPiN_mul"),
  TS("c09_GN_set_str","mpfr_set_str","RNDN","frozen:G_6.67430e-11"),
  TS("c10_eightPiN_mul","mpfr_mul","RNDN","c06_eightN_set_ui,c04_piN_const_pi"),
  TS("c11_c2N_mul","mpfr_mul","RNDN","c02_cN_set_ui,c02_cN_set_ui"),
  TS("c12_c3N_mul","mpfr_mul","RNDN","c11_c2N_mul,c02_cN_set_ui"),
  TS("c13_c4N_mul","mpfr_mul","RNDN","c11_c2N_mul,c11_c2N_mul"),
  TS("c14_c5N_mul","mpfr_mul","RNDN","c13_c4N_mul,c02_cN_set_ui"),
  TS("c15_c7N_mul","mpfr_mul","RNDN","c13_c4N_mul,c12_c3N_mul"),
  TS("c16_gHbarN_mul","mpfr_mul","RNDN","c01_gN_mul_2si,c08_hbarN_div"),
  TS("c17_gHbarC5N_mul","mpfr_mul","RNDN","c16_gHbarN_mul,c14_c5N_mul"),
  TS("c18_eightPiGN_mul","mpfr_mul","RNDN","c10_eightPiN_mul,c09_GN_set_str"),
  TS("c19_muE2N_div","mpfr_div","RNDN","c17_gHbarC5N_mul,c18_eightPiGN_mul"),
  TS("c20_muEN_sqrt","mpfr_sqrt","RNDN","c19_muE2N_div"),
  TS("c21_hbarCN_mul","mpfr_mul","RNDN","c08_hbarN_div,c02_cN_set_ui"),
  TS("c22_muLN_div","mpfr_div","RNDN","c20_muEN_sqrt,c21_hbarCN_mul"),
  TS("c23_eightPiG2N_mul","mpfr_mul","RNDN","c18_eightPiGN_mul,c18_eightPiGN_mul"),
  TS("c24_eightPiG2HbarN_mul","mpfr_mul","RNDN","c23_eightPiG2N_mul,c08_hbarN_div"),
  TS("c25_gC7N_mul","mpfr_mul","RNDN","c01_gN_mul_2si,c15_c7N_mul"),
  TS("c26_stressScaleN_div","mpfr_div","RNDN","c25_gC7N_mul,c24_eightPiG2HbarN_mul"),
  TS("c27_noiseScaleN_mul","mpfr_mul","RNDN","c26_stressScaleN_div,c26_stressScaleN_div"),
  TS("o01_mu_E_central_get_d","mpfr_get_d","RNDN","c20_muEN_sqrt"),
  TS("o02_mu_L_central_get_d","mpfr_get_d","RNDN","c22_muLN_div"),
  TS("o03_stress_scale_central_closed_get_d","mpfr_get_d","RNDN","c26_stressScaleN_div"),
  TS("o04_noise_scale_central_get_d","mpfr_get_d","RNDN","c27_noiseScaleN_mul"),
};

#undef TS

typedef struct {
  int sign;
  char mantissa[80];
  long long exponent2;
  unsigned precision_bits;
  const char *direction;
} Dyadic;

typedef struct {
  const TraceSpec *spec;
  int ternary_sign;
  bool forbidden[5];
  Dyadic result;
} TraceRecord;

typedef struct Value {
  mpfr_t value;
  const char *producer;
  bool initialized;
} Value;

typedef struct {
  Value lower;
  Value upper;
} Interval;

typedef struct {
  const char *id;
  Value *source;
  Dyadic dyadic;
  uint64_t f64_bits;
} CentralReceipt;

typedef struct {
  Value *registry[MAX_MPFR_DESTINATIONS];
  size_t registry_count;
  TraceRecord trace[TRACE_COUNT];
  size_t trace_count;
  const char *error;
} Run;

typedef struct {
  Interval directed[49];
  Value directed_g_mantissa;
  Interval hull_k[2];
  Value hull_radius[4];
  Value central[27];
  Value central_g_mantissa;
} NumericState;

typedef struct {
  uint8_t data[64];
  uint32_t state[8];
  uint64_t bit_length;
  size_t data_length;
} Sha256;

static uint32_t rotr32(uint32_t x, unsigned n) {
  return (x >> n) | (x << (32u - n));
}

static void sha256_transform(Sha256 *ctx, const uint8_t block[64]) {
  static const uint32_t k[64] = {
    0x428a2f98u,0x71374491u,0xb5c0fbcfu,0xe9b5dba5u,
    0x3956c25bu,0x59f111f1u,0x923f82a4u,0xab1c5ed5u,
    0xd807aa98u,0x12835b01u,0x243185beu,0x550c7dc3u,
    0x72be5d74u,0x80deb1feu,0x9bdc06a7u,0xc19bf174u,
    0xe49b69c1u,0xefbe4786u,0x0fc19dc6u,0x240ca1ccu,
    0x2de92c6fu,0x4a7484aau,0x5cb0a9dcu,0x76f988dau,
    0x983e5152u,0xa831c66du,0xb00327c8u,0xbf597fc7u,
    0xc6e00bf3u,0xd5a79147u,0x06ca6351u,0x14292967u,
    0x27b70a85u,0x2e1b2138u,0x4d2c6dfcu,0x53380d13u,
    0x650a7354u,0x766a0abbu,0x81c2c92eu,0x92722c85u,
    0xa2bfe8a1u,0xa81a664bu,0xc24b8b70u,0xc76c51a3u,
    0xd192e819u,0xd6990624u,0xf40e3585u,0x106aa070u,
    0x19a4c116u,0x1e376c08u,0x2748774cu,0x34b0bcb5u,
    0x391c0cb3u,0x4ed8aa4au,0x5b9cca4fu,0x682e6ff3u,
    0x748f82eeu,0x78a5636fu,0x84c87814u,0x8cc70208u,
    0x90befffau,0xa4506cebu,0xbef9a3f7u,0xc67178f2u
  };
  uint32_t w[64];
  uint32_t a,b,c,d,e,f,g,h;
  unsigned i;
  for (i = 0; i < 16; ++i) {
    size_t j = (size_t)i * 4u;
    w[i] = ((uint32_t)block[j] << 24) |
           ((uint32_t)block[j + 1] << 16) |
           ((uint32_t)block[j + 2] << 8) |
           (uint32_t)block[j + 3];
  }
  for (i = 16; i < 64; ++i) {
    uint32_t s0 = rotr32(w[i - 15],7) ^ rotr32(w[i - 15],18) ^ (w[i - 15] >> 3);
    uint32_t s1 = rotr32(w[i - 2],17) ^ rotr32(w[i - 2],19) ^ (w[i - 2] >> 10);
    w[i] = w[i - 16] + s0 + w[i - 7] + s1;
  }
  a=ctx->state[0]; b=ctx->state[1]; c=ctx->state[2]; d=ctx->state[3];
  e=ctx->state[4]; f=ctx->state[5]; g=ctx->state[6]; h=ctx->state[7];
  for (i = 0; i < 64; ++i) {
    uint32_t s1=rotr32(e,6)^rotr32(e,11)^rotr32(e,25);
    uint32_t ch=(e&f)^((~e)&g);
    uint32_t t1=h+s1+ch+k[i]+w[i];
    uint32_t s0=rotr32(a,2)^rotr32(a,13)^rotr32(a,22);
    uint32_t maj=(a&b)^(a&c)^(b&c);
    uint32_t t2=s0+maj;
    h=g; g=f; f=e; e=d+t1; d=c; c=b; b=a; a=t1+t2;
  }
  ctx->state[0]+=a; ctx->state[1]+=b; ctx->state[2]+=c; ctx->state[3]+=d;
  ctx->state[4]+=e; ctx->state[5]+=f; ctx->state[6]+=g; ctx->state[7]+=h;
}

static void sha256_init(Sha256 *ctx) {
  static const uint32_t initial[8] = {
    0x6a09e667u,0xbb67ae85u,0x3c6ef372u,0xa54ff53au,
    0x510e527fu,0x9b05688cu,0x1f83d9abu,0x5be0cd19u
  };
  memcpy(ctx->state, initial, sizeof initial);
  ctx->bit_length = 0;
  ctx->data_length = 0;
}

static void sha256_update(Sha256 *ctx, const uint8_t *data, size_t length) {
  size_t i;
  for (i = 0; i < length; ++i) {
    ctx->data[ctx->data_length++] = data[i];
    if (ctx->data_length == 64u) {
      sha256_transform(ctx, ctx->data);
      ctx->bit_length += 512u;
      ctx->data_length = 0;
    }
  }
}

static void sha256_final(Sha256 *ctx, uint8_t digest[32]) {
  size_t i = ctx->data_length;
  unsigned j;
  ctx->data[i++] = 0x80u;
  if (i > 56u) {
    while (i < 64u) ctx->data[i++] = 0;
    sha256_transform(ctx, ctx->data);
    i = 0;
  }
  while (i < 56u) ctx->data[i++] = 0;
  ctx->bit_length += (uint64_t)ctx->data_length * 8u;
  for (j = 0; j < 8; ++j) {
    ctx->data[63u - j] = (uint8_t)(ctx->bit_length >> (8u * j));
  }
  sha256_transform(ctx, ctx->data);
  for (j = 0; j < 8; ++j) {
    digest[j*4u]=(uint8_t)(ctx->state[j]>>24);
    digest[j*4u+1u]=(uint8_t)(ctx->state[j]>>16);
    digest[j*4u+2u]=(uint8_t)(ctx->state[j]>>8);
    digest[j*4u+3u]=(uint8_t)ctx->state[j];
  }
}

static bool digest_matches_hex(const uint8_t digest[32], const char *hex) {
  static const char digits[] = "0123456789abcdef";
  size_t i;
  unsigned diff = 0;
  for (i = 0; i < 32u; ++i) {
    diff |= (unsigned char)hex[i*2u] ^ (unsigned char)digits[digest[i] >> 4];
    diff |= (unsigned char)hex[i*2u+1u] ^ (unsigned char)digits[digest[i] & 15u];
  }
  diff |= (unsigned char)hex[64];
  return diff == 0u;
}

static bool set_error(Run *run, const char *code) {
  if (run->error == NULL) run->error = code;
  return false;
}

static bool init_value(Run *run, Value *value) {
  size_t i;
  if (value->initialized || run->registry_count >= MAX_MPFR_DESTINATIONS) {
    return set_error(run, "E_DEST_INIT");
  }
  mpfr_init2(value->value, PRECISION_BITS);
  value->initialized = true;
  value->producer = NULL;
  if (mpfr_get_prec(value->value) != PRECISION_BITS) {
    mpfr_clear(value->value);
    value->initialized = false;
    return set_error(run, "E_PRECISION");
  }
  for (i = 0; i < run->registry_count; ++i) {
    Value *prior = run->registry[i];
    if (&prior->value[0] == &value->value[0] ||
        prior->value[0]._mpfr_d == value->value[0]._mpfr_d) {
      mpfr_clear(value->value);
      value->initialized = false;
      return set_error(run, "E_DEST_ALIAS");
    }
  }
  run->registry[run->registry_count++] = value;
  return true;
}

static bool init_interval(Run *run, Interval *interval) {
  if (!init_value(run, &interval->lower)) return false;
  if (!init_value(run, &interval->upper)) return false;
  if (&interval->lower.value[0] == &interval->upper.value[0] ||
      interval->lower.value[0]._mpfr_d == interval->upper.value[0]._mpfr_d) {
    return set_error(run, "E_ENDPOINT_ALIAS");
  }
  return true;
}

static void clear_values_reverse(Run *run) {
  while (run->registry_count > 0u) {
    Value *value = run->registry[--run->registry_count];
    mpfr_clear(value->value);
    value->initialized = false;
    value->producer = NULL;
  }
}

static mpfr_rnd_t rounding_from_name(const char *name) {
  if (strcmp(name, "RNDD") == 0) return MPFR_RNDD;
  if (strcmp(name, "RNDU") == 0) return MPFR_RNDU;
  return MPFR_RNDN;
}

static int normalized_sign(int value) {
  return (value > 0) - (value < 0);
}

static void capture_forbidden(bool out[5]) {
  out[0] = mpfr_nanflag_p() != 0;
  out[1] = mpfr_divby0_p() != 0;
  out[2] = mpfr_overflow_p() != 0;
  out[3] = mpfr_underflow_p() != 0;
  out[4] = mpfr_erangeflag_p() != 0;
}

static bool no_forbidden(const bool flags[5]) {
  return !flags[0] && !flags[1] && !flags[2] && !flags[3] && !flags[4];
}

static const TraceSpec *take_spec(Run *run, const char *primitive,
                                  const char *rounding, const char *sources) {
  const TraceSpec *spec;
  if (run->trace_count >= TRACE_COUNT) {
    set_error(run, "E_TRACE_OVERFLOW");
    return NULL;
  }
  spec = &TRACE_SPECS[run->trace_count];
  if (strcmp(spec->primitive, primitive) != 0 ||
      strcmp(spec->rounding, rounding) != 0 ||
      strcmp(spec->sources, sources) != 0) {
    set_error(run, "E_CHRONOLOGY");
    return NULL;
  }
  return spec;
}

static bool canonical_mpfr(const Value *value, const char *direction,
                           Dyadic *out) {
  mpz_t significand;
  mpfr_exp_t exponent;
  int sign;
  if (!value->initialized || !mpfr_number_p(value->value)) return false;
  mpz_init(significand);
  exponent = mpfr_get_z_2exp(significand, value->value);
  sign = mpz_sgn(significand);
  out->sign = normalized_sign(sign);
  if (sign == 0) {
    strcpy(out->mantissa, "0");
    out->exponent2 = 0;
  } else {
    if (sign < 0) mpz_neg(significand, significand);
    if (mpz_sizeinbase(significand, 16) > 64u ||
        mpz_get_str(out->mantissa, 16, significand) == NULL) {
      mpz_clear(significand);
      return false;
    }
    out->exponent2 = (long long)exponent;
  }
  out->precision_bits = PRECISION_BITS;
  out->direction = direction;
  mpz_clear(significand);
  return true;
}

static bool canonical_f64(uint64_t bits, const char *direction, Dyadic *out) {
  uint64_t exponent_bits = (bits >> 52) & UINT64_C(0x7ff);
  uint64_t fraction_bits = bits & UINT64_C(0x000fffffffffffff);
  uint64_t mantissa;
  if (exponent_bits == UINT64_C(0x7ff)) return false;
  out->sign = (bits >> 63) ? -1 : 1;
  if (exponent_bits == 0u) {
    if (fraction_bits == 0u) {
      out->sign = 0;
      strcpy(out->mantissa, "0");
      out->exponent2 = 0;
      out->precision_bits = 53u;
      out->direction = direction;
      return true;
    }
    mantissa = fraction_bits;
    out->exponent2 = -1074;
  } else {
    mantissa = UINT64_C(0x0010000000000000) | fraction_bits;
    out->exponent2 = (long long)exponent_bits - 1023ll - 52ll;
  }
  (void)snprintf(out->mantissa, sizeof out->mantissa, "%llx",
                 (unsigned long long)mantissa);
  out->precision_bits = 53u;
  out->direction = direction;
  return true;
}

static bool exact_decimal(mpq_t out, const char *text) {
  char digits[128];
  size_t digit_count = 0u;
  size_t fractional_count = 0u;
  const char *p = text;
  bool saw_dot = false;
  bool saw_digit = false;
  long exponent10 = 0;
  int exponent_sign = 1;
  mpz_t power;
  if (*p == '+') ++p;
  while (*p != '\0' && *p != 'e') {
    if (*p == '.') {
      if (saw_dot) return false;
      saw_dot = true;
    } else if (*p >= '0' && *p <= '9') {
      if (digit_count + 1u >= sizeof digits) return false;
      digits[digit_count++] = *p;
      if (saw_dot) ++fractional_count;
      saw_digit = true;
    } else {
      return false;
    }
    ++p;
  }
  if (!saw_digit) return false;
  if (*p == 'e') {
    ++p;
    if (*p == '+' || *p == '-') {
      if (*p == '-') exponent_sign = -1;
      ++p;
    }
    if (*p < '0' || *p > '9') return false;
    while (*p >= '0' && *p <= '9') {
      if (exponent10 > 100000l) return false;
      exponent10 = exponent10 * 10l + (long)(*p - '0');
      ++p;
    }
  }
  if (*p != '\0') return false;
  exponent10 = exponent_sign * exponent10 - (long)fractional_count;
  digits[digit_count] = '\0';
  if (mpz_set_str(mpq_numref(out), digits, 10) != 0) return false;
  mpz_set_ui(mpq_denref(out), 1u);
  mpz_init(power);
  if (exponent10 >= 0) {
    mpz_ui_pow_ui(power, 10u, (unsigned long)exponent10);
    mpz_mul(mpq_numref(out), mpq_numref(out), power);
  } else {
    mpz_ui_pow_ui(power, 10u, (unsigned long)(-exponent10));
    mpz_set(mpq_denref(out), power);
  }
  mpz_clear(power);
  mpq_canonicalize(out);
  return true;
}

static void mpq_set_u64(mpq_t out, uint64_t value) {
  uint8_t bytes[8];
  unsigned i;
  for (i = 0; i < 8u; ++i) bytes[i] = (uint8_t)(value >> (8u * i));
  mpz_import(mpq_numref(out), 8u, -1, 1u, 0, 0, bytes);
  mpz_set_ui(mpq_denref(out), 1u);
}

static bool exact_f64_q(mpq_t out, uint64_t bits) {
  uint64_t exponent_bits = (bits >> 52) & UINT64_C(0x7ff);
  uint64_t fraction_bits = bits & UINT64_C(0x000fffffffffffff);
  uint64_t mantissa;
  long exponent2;
  if (exponent_bits == UINT64_C(0x7ff)) return false;
  if (exponent_bits == 0u) {
    mantissa = fraction_bits;
    exponent2 = -1074l;
  } else {
    mantissa = UINT64_C(0x0010000000000000) | fraction_bits;
    exponent2 = (long)exponent_bits - 1023l - 52l;
  }
  mpq_set_u64(out, mantissa);
  if (exponent2 >= 0) {
    mpz_mul_2exp(mpq_numref(out), mpq_numref(out), (mp_bitcnt_t)exponent2);
  } else {
    mpz_mul_2exp(mpq_denref(out), mpq_denref(out),
                 (mp_bitcnt_t)(-exponent2));
    mpq_canonicalize(out);
  }
  if ((bits >> 63) != 0u) mpz_neg(mpq_numref(out), mpq_numref(out));
  return true;
}

static bool finish_ordinary(Run *run, Value *destination,
                            const TraceSpec *spec, int raw_return,
                            const bool forbidden[5], bool inexact) {
  TraceRecord *record;
  int ternary = normalized_sign(raw_return);
  if (!no_forbidden(forbidden) || inexact != (ternary != 0) ||
      !mpfr_number_p(destination->value)) {
    return set_error(run, "E_MPFR_RULE");
  }
  record = &run->trace[run->trace_count];
  record->spec = spec;
  record->ternary_sign = ternary;
  memcpy(record->forbidden, forbidden, sizeof record->forbidden);
  if (!canonical_mpfr(destination, spec->rounding, &record->result)) {
    return set_error(run, "E_DYADIC");
  }
  destination->producer = spec->label;
  ++run->trace_count;
  return true;
}

static bool finish_set_str(Run *run, Value *destination,
                           const TraceSpec *spec, int parse_status,
                           const bool forbidden[5], bool inexact,
                           const mpq_t exact) {
  TraceRecord *record;
  mpq_t actual;
  int ternary;
  if (parse_status != 0 || !no_forbidden(forbidden) ||
      !mpfr_number_p(destination->value)) {
    return set_error(run, "E_SET_STR");
  }
  mpq_init(actual);
  mpfr_get_q(actual, destination->value);
  ternary = normalized_sign(mpq_cmp(actual, exact));
  mpq_clear(actual);
  if (inexact != (ternary != 0) ||
      (strcmp(spec->rounding, "RNDD") == 0 && ternary > 0) ||
      (strcmp(spec->rounding, "RNDU") == 0 && ternary < 0)) {
    return set_error(run, "E_SET_STR_RULE");
  }
  record = &run->trace[run->trace_count];
  record->spec = spec;
  record->ternary_sign = ternary;
  memcpy(record->forbidden, forbidden, sizeof record->forbidden);
  if (!canonical_mpfr(destination, spec->rounding, &record->result)) {
    return set_error(run, "E_DYADIC");
  }
  destination->producer = spec->label;
  ++run->trace_count;
  return true;
}

static bool call_set_z(Run *run, Value *destination, const mpz_t source,
                       const char *root) {
  const TraceSpec *spec = take_spec(run, "mpfr_set_z", "RNDN", root);
  bool flags[5]; bool inexact; int raw;
  if (spec == NULL) return false;
  mpfr_clear_flags();
  raw = mpfr_set_z(destination->value, source, MPFR_RNDN);
  capture_forbidden(flags); inexact = mpfr_inexflag_p() != 0;
  return finish_ordinary(run, destination, spec, raw, flags, inexact);
}

static bool call_set_ui(Run *run, Value *destination, unsigned long source,
                        const char *root) {
  const TraceSpec *spec = take_spec(run, "mpfr_set_ui", "RNDN", root);
  bool flags[5]; bool inexact; int raw;
  if (spec == NULL) return false;
  mpfr_clear_flags();
  raw = mpfr_set_ui(destination->value, source, MPFR_RNDN);
  capture_forbidden(flags); inexact = mpfr_inexflag_p() != 0;
  return finish_ordinary(run, destination, spec, raw, flags, inexact);
}

static bool call_set(Run *run, Value *destination, const Value *source) {
  const TraceSpec *spec = take_spec(run, "mpfr_set", "RNDN", source->producer);
  bool flags[5]; bool inexact; int raw;
  if (spec == NULL) return false;
  mpfr_clear_flags();
  raw = mpfr_set(destination->value, source->value, MPFR_RNDN);
  capture_forbidden(flags); inexact = mpfr_inexflag_p() != 0;
  return finish_ordinary(run, destination, spec, raw, flags, inexact);
}

static bool call_mul_2si(Run *run, Value *destination, const Value *source,
                         long exponent) {
  const TraceSpec *spec = take_spec(run, "mpfr_mul_2si", "RNDN", source->producer);
  bool flags[5]; bool inexact; int raw;
  if (spec == NULL) return false;
  mpfr_clear_flags();
  raw = mpfr_mul_2si(destination->value, source->value, exponent, MPFR_RNDN);
  capture_forbidden(flags); inexact = mpfr_inexflag_p() != 0;
  return finish_ordinary(run, destination, spec, raw, flags, inexact);
}

static bool call_set_str(Run *run, Value *destination, const char *text,
                         const char *rounding, const char *root) {
  const TraceSpec *spec = take_spec(run, "mpfr_set_str", rounding, root);
  bool flags[5]; bool inexact; int status;
  mpq_t exact;
  if (spec == NULL) return false;
  mpq_init(exact);
  if (!exact_decimal(exact, text)) {
    mpq_clear(exact);
    return set_error(run, "E_DECIMAL");
  }
  mpfr_clear_flags();
  status = mpfr_set_str(destination->value, text, 10, rounding_from_name(rounding));
  capture_forbidden(flags); inexact = mpfr_inexflag_p() != 0;
  if (!finish_set_str(run, destination, spec, status, flags, inexact, exact)) {
    mpq_clear(exact);
    return false;
  }
  mpq_clear(exact);
  return true;
}

static bool call_const_pi(Run *run, Value *destination, const char *rounding) {
  const TraceSpec *spec = take_spec(run, "mpfr_const_pi", rounding,
                                    "mathematical:pi");
  bool flags[5]; bool inexact; int raw;
  if (spec == NULL) return false;
  mpfr_clear_flags();
  raw = mpfr_const_pi(destination->value, rounding_from_name(rounding));
  capture_forbidden(flags); inexact = mpfr_inexflag_p() != 0;
  return finish_ordinary(run, destination, spec, raw, flags, inexact);
}

static bool make_sources2(char out[192], const Value *a, const Value *b) {
  int count;
  if (a->producer == NULL || b->producer == NULL) return false;
  count = snprintf(out, 192u, "%s,%s", a->producer, b->producer);
  return count > 0 && count < 192;
}

static bool call_binary(Run *run, Value *destination, const Value *a,
                        const Value *b, const char *primitive,
                        const char *rounding) {
  char sources[192];
  const TraceSpec *spec;
  bool flags[5]; bool inexact; int raw;
  mpfr_rnd_t rnd = rounding_from_name(rounding);
  if (!make_sources2(sources, a, b)) return set_error(run, "E_SOURCE");
  spec = take_spec(run, primitive, rounding, sources);
  if (spec == NULL) return false;
  mpfr_clear_flags();
  if (strcmp(primitive, "mpfr_mul") == 0) {
    raw = mpfr_mul(destination->value, a->value, b->value, rnd);
  } else if (strcmp(primitive, "mpfr_div") == 0) {
    raw = mpfr_div(destination->value, a->value, b->value, rnd);
  } else if (strcmp(primitive, "mpfr_sub") == 0) {
    raw = mpfr_sub(destination->value, a->value, b->value, rnd);
  } else if (strcmp(primitive, "mpfr_add") == 0) {
    raw = mpfr_add(destination->value, a->value, b->value, rnd);
  } else {
    return set_error(run, "E_PRIMITIVE");
  }
  capture_forbidden(flags); inexact = mpfr_inexflag_p() != 0;
  return finish_ordinary(run, destination, spec, raw, flags, inexact);
}

static bool call_sqrt(Run *run, Value *destination, const Value *source,
                      const char *rounding) {
  const TraceSpec *spec = take_spec(run, "mpfr_sqrt", rounding, source->producer);
  bool flags[5]; bool inexact; int raw;
  if (spec == NULL) return false;
  mpfr_clear_flags();
  raw = mpfr_sqrt(destination->value, source->value, rounding_from_name(rounding));
  capture_forbidden(flags); inexact = mpfr_inexflag_p() != 0;
  return finish_ordinary(run, destination, spec, raw, flags, inexact);
}

static bool call_get_d(Run *run, const Value *source, uint64_t *bits_out) {
  const TraceSpec *spec = take_spec(run, "mpfr_get_d", "RNDN", source->producer);
  bool flags[5]; bool inexact;
  double value;
  uint64_t bits;
  mpq_t exact_double, exact_source;
  int ternary;
  TraceRecord *record;
  if (spec == NULL) return false;
  mpfr_clear_flags();
  value = mpfr_get_d(source->value, MPFR_RNDN);
  capture_forbidden(flags); inexact = mpfr_inexflag_p() != 0;
  memcpy(&bits, &value, sizeof bits);
  if (!no_forbidden(flags) || inexact ||
      ((bits >> 52) & UINT64_C(0x7ff)) == UINT64_C(0x7ff) ||
      bits == UINT64_C(0x8000000000000000)) {
    return set_error(run, "E_GET_D");
  }
  mpq_init(exact_double); mpq_init(exact_source);
  if (!exact_f64_q(exact_double, bits)) {
    mpq_clear(exact_source); mpq_clear(exact_double);
    return set_error(run, "E_GET_D_BITS");
  }
  mpfr_get_q(exact_source, source->value);
  ternary = normalized_sign(mpq_cmp(exact_double, exact_source));
  mpq_clear(exact_source); mpq_clear(exact_double);
  record = &run->trace[run->trace_count];
  record->spec = spec;
  record->ternary_sign = ternary;
  memcpy(record->forbidden, flags, sizeof record->forbidden);
  if (!canonical_f64(bits, "RNDN", &record->result)) {
    return set_error(run, "E_GET_D_DYADIC");
  }
  ++run->trace_count;
  *bits_out = bits;
  return true;
}

static bool validate_interval(Run *run, const Interval *interval) {
  if (!mpfr_number_p(interval->lower.value) ||
      !mpfr_number_p(interval->upper.value) ||
      mpfr_cmp(interval->lower.value, interval->upper.value) > 0 ||
      mpfr_sgn(interval->lower.value) <= 0 ||
      mpfr_sgn(interval->upper.value) <= 0) {
    return set_error(run, "E_INTERVAL");
  }
  return true;
}

static bool validate_central(Run *run, const Value *value) {
  if (!mpfr_number_p(value->value) || mpfr_sgn(value->value) <= 0) {
    return set_error(run, "E_CENTRAL");
  }
  return true;
}

static bool require_exact_endpoint_pair(Run *run, const Interval *interval) {
  if (!mpfr_equal_p(interval->lower.value, interval->upper.value)) {
    return set_error(run, "E_EXACT_ENDPOINT_MISMATCH");
  }
  return true;
}

static bool interval_dyadic(Run *run, Interval *out, Value *mantissa,
                            unsigned long integer, long exponent,
                            const char *root) {
  mpz_t exact;
  mpz_init_set_ui(exact, integer);
  if (!init_value(run, mantissa) || !init_interval(run, out) ||
      !call_set_z(run, mantissa, exact, root) ||
      !call_mul_2si(run, &out->lower, mantissa, exponent) ||
      !call_set(run, &out->upper, &out->lower) ||
      !require_exact_endpoint_pair(run, out)) {
    mpz_clear(exact);
    return false;
  }
  mpz_clear(exact);
  return validate_interval(run, out);
}

static bool interval_uint(Run *run, Interval *out, unsigned long integer,
                          const char *root) {
  if (!init_interval(run, out) ||
      !call_set_ui(run, &out->lower, integer, root) ||
      !call_set(run, &out->upper, &out->lower) ||
      !require_exact_endpoint_pair(run, out)) return false;
  return validate_interval(run, out);
}

static bool interval_decimal(Run *run, Interval *out, const char *decimal,
                             const char *root) {
  if (!init_interval(run, out) ||
      !call_set_str(run, &out->lower, decimal, "RNDD", root) ||
      !call_set_str(run, &out->upper, decimal, "RNDU", root)) return false;
  return validate_interval(run, out);
}

static bool interval_pi(Run *run, Interval *out) {
  if (!init_interval(run, out) ||
      !call_const_pi(run, &out->lower, "RNDD") ||
      !call_const_pi(run, &out->upper, "RNDU")) return false;
  return validate_interval(run, out);
}

static bool interval_mul(Run *run, Interval *out, const Interval *a,
                         const Interval *b) {
  if (!init_interval(run, out) ||
      !call_binary(run, &out->lower, &a->lower, &b->lower, "mpfr_mul", "RNDD") ||
      !call_binary(run, &out->upper, &a->upper, &b->upper, "mpfr_mul", "RNDU")) {
    return false;
  }
  return validate_interval(run, out);
}

static bool interval_div(Run *run, Interval *out, const Interval *a,
                         const Interval *b) {
  if (mpfr_sgn(b->lower.value) <= 0 || !init_interval(run, out) ||
      !call_binary(run, &out->lower, &a->lower, &b->upper, "mpfr_div", "RNDD") ||
      !call_binary(run, &out->upper, &a->upper, &b->lower, "mpfr_div", "RNDU")) {
    return false;
  }
  return validate_interval(run, out);
}

static bool interval_square(Run *run, Interval *out, const Interval *a) {
  if (mpfr_sgn(a->lower.value) < 0 || !init_interval(run, out) ||
      !call_binary(run, &out->lower, &a->lower, &a->lower, "mpfr_mul", "RNDD") ||
      !call_binary(run, &out->upper, &a->upper, &a->upper, "mpfr_mul", "RNDU")) {
    return false;
  }
  return validate_interval(run, out);
}

static bool interval_sqrt(Run *run, Interval *out, const Interval *a) {
  if (mpfr_sgn(a->lower.value) < 0 || !init_interval(run, out) ||
      !call_sqrt(run, &out->lower, &a->lower, "RNDD") ||
      !call_sqrt(run, &out->upper, &a->upper, "RNDU")) return false;
  return validate_interval(run, out);
}

static bool interval_symmetric_hull(Run *run, Interval *out,
                                    const Interval *center,
                                    const Interval *uncertainty,
                                    unsigned long coverage,
                                    const char *root, Interval *k,
                                    Value *radius_lower,
                                    Value *radius_upper) {
  if (!interval_uint(run, k, coverage, root) ||
      !init_value(run, radius_lower) || !init_value(run, radius_upper) ||
      !call_binary(run, radius_lower, &k->upper, &uncertainty->upper,
                   "mpfr_mul", "RNDU") ||
      !call_binary(run, radius_upper, &k->upper, &uncertainty->upper,
                   "mpfr_mul", "RNDU") ||
      !init_interval(run, out) ||
      !call_binary(run, &out->lower, &center->lower, radius_lower,
                   "mpfr_sub", "RNDD") ||
      !call_binary(run, &out->upper, &center->upper, radius_upper,
                   "mpfr_add", "RNDU")) return false;
  return validate_interval(run, out);
}

static bool central_dyadic(Run *run, Value *out, Value *mantissa,
                           unsigned long integer, long exponent,
                           const char *root) {
  mpz_t exact;
  mpz_init_set_ui(exact, integer);
  if (!init_value(run, mantissa) || !init_value(run, out) ||
      !call_set_z(run, mantissa, exact, root) ||
      !call_mul_2si(run, out, mantissa, exponent)) {
    mpz_clear(exact);
    return false;
  }
  mpz_clear(exact);
  return validate_central(run, out);
}

static bool central_uint(Run *run, Value *out, unsigned long integer,
                         const char *root) {
  if (!init_value(run, out) || !call_set_ui(run, out, integer, root)) return false;
  return validate_central(run, out);
}

static bool central_decimal(Run *run, Value *out, const char *decimal,
                            const char *root) {
  if (!init_value(run, out) ||
      !call_set_str(run, out, decimal, "RNDN", root)) return false;
  return validate_central(run, out);
}

static bool central_pi(Run *run, Value *out) {
  if (!init_value(run, out) || !call_const_pi(run, out, "RNDN")) return false;
  return validate_central(run, out);
}

static bool central_binary(Run *run, Value *out, const Value *a,
                           const Value *b, const char *primitive) {
  if (!init_value(run, out) ||
      !call_binary(run, out, a, b, primitive, "RNDN")) return false;
  return validate_central(run, out);
}

static bool central_sqrt(Run *run, Value *out, const Value *source) {
  if (!init_value(run, out) || !call_sqrt(run, out, source, "RNDN")) return false;
  return validate_central(run, out);
}

static bool execute_graphs(Run *run, NumericState *state,
                           CentralReceipt central_receipts[4]) {
  Interval *d = state->directed;
  Value *c = state->central;
  if (!interval_dyadic(run,&d[0],&state->directed_g_mantissa,1u,-40l,"frozen:g_mantissa_1") ||
      !interval_uint(run,&d[1],299792458u,"frozen:c_299792458") ||
      !interval_decimal(run,&d[2],"6.62607015e-34","frozen:h_6.62607015e-34") ||
      !interval_pi(run,&d[3]) ||
      !interval_uint(run,&d[4],2u,"frozen:integer_2") ||
      !interval_uint(run,&d[5],8u,"frozen:integer_8") ||
      !interval_mul(run,&d[6],&d[4],&d[3]) ||
      !interval_div(run,&d[7],&d[2],&d[6]) ||
      !interval_decimal(run,&d[8],"6.67430e-11","frozen:G_6.67430e-11") ||
      !interval_decimal(run,&d[9],"1.5e-15","frozen:G_u_1.5e-15") ||
      !interval_symmetric_hull(run,&d[10],&d[8],&d[9],1u,"frozen:coverage_1",
                               &state->hull_k[0],&state->hull_radius[0],&state->hull_radius[1]) ||
      !interval_symmetric_hull(run,&d[11],&d[8],&d[9],2u,"frozen:coverage_2",
                               &state->hull_k[1],&state->hull_radius[2],&state->hull_radius[3]) ||
      !interval_mul(run,&d[12],&d[5],&d[3]) ||
      !interval_mul(run,&d[13],&d[1],&d[1]) ||
      !interval_mul(run,&d[14],&d[13],&d[1]) ||
      !interval_mul(run,&d[15],&d[13],&d[13]) ||
      !interval_mul(run,&d[16],&d[15],&d[1]) ||
      !interval_mul(run,&d[17],&d[15],&d[14]) ||
      !interval_mul(run,&d[18],&d[0],&d[7]) ||
      !interval_mul(run,&d[19],&d[18],&d[16]) ||
      !interval_mul(run,&d[20],&d[12],&d[8]) ||
      !interval_div(run,&d[21],&d[19],&d[20]) ||
      !interval_sqrt(run,&d[22],&d[21]) ||
      !interval_mul(run,&d[23],&d[7],&d[1]) ||
      !interval_div(run,&d[24],&d[22],&d[23]) ||
      !interval_square(run,&d[25],&d[24]) ||
      !interval_mul(run,&d[26],&d[15],&d[25]) ||
      !interval_div(run,&d[27],&d[26],&d[20]) ||
      !interval_square(run,&d[28],&d[20]) ||
      !interval_mul(run,&d[29],&d[28],&d[7]) ||
      !interval_mul(run,&d[30],&d[0],&d[17]) ||
      !interval_div(run,&d[31],&d[30],&d[29]) ||
      !interval_square(run,&d[32],&d[31]) ||
      !interval_mul(run,&d[33],&d[12],&d[10]) ||
      !interval_div(run,&d[34],&d[19],&d[33]) ||
      !interval_sqrt(run,&d[35],&d[34]) ||
      !interval_div(run,&d[36],&d[35],&d[23]) ||
      !interval_square(run,&d[37],&d[33]) ||
      !interval_mul(run,&d[38],&d[37],&d[7]) ||
      !interval_div(run,&d[39],&d[30],&d[38]) ||
      !interval_square(run,&d[40],&d[39]) ||
      !interval_mul(run,&d[41],&d[12],&d[11]) ||
      !interval_div(run,&d[42],&d[19],&d[41]) ||
      !interval_sqrt(run,&d[43],&d[42]) ||
      !interval_div(run,&d[44],&d[43],&d[23]) ||
      !interval_square(run,&d[45],&d[41]) ||
      !interval_mul(run,&d[46],&d[45],&d[7]) ||
      !interval_div(run,&d[47],&d[30],&d[46]) ||
      !interval_square(run,&d[48],&d[47])) return false;

  if (mpfr_cmp(d[27].lower.value,d[31].upper.value)>0 ||
      mpfr_cmp(d[31].lower.value,d[27].upper.value)>0) {
    return set_error(run,"E_IDENTITY_OVERLAP");
  }

  if (!central_dyadic(run,&c[0],&state->central_g_mantissa,1u,-40l,"frozen:g_mantissa_1") ||
      !central_uint(run,&c[1],299792458u,"frozen:c_299792458") ||
      !central_decimal(run,&c[2],"6.62607015e-34","frozen:h_6.62607015e-34") ||
      !central_pi(run,&c[3]) ||
      !central_uint(run,&c[4],2u,"frozen:integer_2") ||
      !central_uint(run,&c[5],8u,"frozen:integer_8") ||
      !central_binary(run,&c[6],&c[4],&c[3],"mpfr_mul") ||
      !central_binary(run,&c[7],&c[2],&c[6],"mpfr_div") ||
      !central_decimal(run,&c[8],"6.67430e-11","frozen:G_6.67430e-11") ||
      !central_binary(run,&c[9],&c[5],&c[3],"mpfr_mul") ||
      !central_binary(run,&c[10],&c[1],&c[1],"mpfr_mul") ||
      !central_binary(run,&c[11],&c[10],&c[1],"mpfr_mul") ||
      !central_binary(run,&c[12],&c[10],&c[10],"mpfr_mul") ||
      !central_binary(run,&c[13],&c[12],&c[1],"mpfr_mul") ||
      !central_binary(run,&c[14],&c[12],&c[11],"mpfr_mul") ||
      !central_binary(run,&c[15],&c[0],&c[7],"mpfr_mul") ||
      !central_binary(run,&c[16],&c[15],&c[13],"mpfr_mul") ||
      !central_binary(run,&c[17],&c[9],&c[8],"mpfr_mul") ||
      !central_binary(run,&c[18],&c[16],&c[17],"mpfr_div") ||
      !central_sqrt(run,&c[19],&c[18]) ||
      !central_binary(run,&c[20],&c[7],&c[1],"mpfr_mul") ||
      !central_binary(run,&c[21],&c[19],&c[20],"mpfr_div") ||
      !central_binary(run,&c[22],&c[17],&c[17],"mpfr_mul") ||
      !central_binary(run,&c[23],&c[22],&c[7],"mpfr_mul") ||
      !central_binary(run,&c[24],&c[0],&c[14],"mpfr_mul") ||
      !central_binary(run,&c[25],&c[24],&c[23],"mpfr_div") ||
      !central_binary(run,&c[26],&c[25],&c[25],"mpfr_mul")) return false;

  central_receipts[0].id="mu_E_central"; central_receipts[0].source=&c[19];
  central_receipts[1].id="mu_L_central"; central_receipts[1].source=&c[21];
  central_receipts[2].id="stress_scale_central_closed"; central_receipts[2].source=&c[25];
  central_receipts[3].id="noise_scale_central"; central_receipts[3].source=&c[26];
  for (size_t i=0u;i<4u;++i) {
    if (!canonical_mpfr(central_receipts[i].source,"RNDN",&central_receipts[i].dyadic)) {
      return set_error(run,"E_CENTRAL_DYADIC");
    }
  }
  for (size_t i=0u;i<4u;++i) {
    if (!call_get_d(run,central_receipts[i].source,&central_receipts[i].f64_bits)) {
      return false;
    }
  }
  if (run->trace_count != TRACE_COUNT) return set_error(run,"E_TRACE_COUNT");
  return true;
}

typedef struct {
  char *data;
  size_t length;
  size_t capacity;
  bool ok;
} JsonWriter;

static void jw_bytes(JsonWriter *writer, const char *bytes, size_t length) {
  if (!writer->ok || length > writer->capacity - writer->length) {
    writer->ok = false;
    return;
  }
  memcpy(writer->data + writer->length, bytes, length);
  writer->length += length;
}

static void jw_text(JsonWriter *writer, const char *text) {
  jw_bytes(writer, text, strlen(text));
}

static void jw_char(JsonWriter *writer, char value) {
  jw_bytes(writer, &value, 1u);
}

static void jw_format(JsonWriter *writer, const char *format, ...) {
  char buffer[128];
  va_list args;
  int count;
  va_start(args, format);
  count = vsnprintf(buffer, sizeof buffer, format, args);
  va_end(args);
  if (count < 0 || (size_t)count >= sizeof buffer) {
    writer->ok = false;
    return;
  }
  jw_bytes(writer, buffer, (size_t)count);
}

static void jw_string(JsonWriter *writer, const char *text) {
  const unsigned char *p = (const unsigned char *)text;
  static const char hex[] = "0123456789abcdef";
  jw_char(writer, '"');
  while (*p != 0u) {
    unsigned char ch = *p++;
    if (ch == '"' || ch == '\\') {
      jw_char(writer, '\\'); jw_char(writer, (char)ch);
    } else if (ch < 0x20u) {
      char escaped[6] = {'\\','u','0','0',hex[ch >> 4],hex[ch & 15u]};
      jw_bytes(writer, escaped, sizeof escaped);
    } else {
      jw_char(writer, (char)ch);
    }
  }
  jw_char(writer, '"');
}

static void jw_dyadic(JsonWriter *writer, const Dyadic *dyadic) {
  jw_text(writer,"{\"direction\":"); jw_string(writer,dyadic->direction);
  jw_text(writer,",\"exponent2\":"); jw_format(writer,"%lld",dyadic->exponent2);
  jw_text(writer,",\"mantissaLowercaseHex\":"); jw_string(writer,dyadic->mantissa);
  jw_text(writer,",\"precisionBits\":"); jw_format(writer,"%u",dyadic->precision_bits);
  jw_text(writer,",\"sign\":"); jw_format(writer,"%d",dyadic->sign);
  jw_char(writer,'}');
}

static void jw_sources(JsonWriter *writer, const char *sources) {
  const char *cursor = sources;
  bool first = true;
  jw_char(writer,'[');
  while (*cursor != '\0') {
    const char *comma = strchr(cursor,',');
    size_t length = comma == NULL ? strlen(cursor) : (size_t)(comma-cursor);
    char source[192];
    if (length == 0u || length >= sizeof source) { writer->ok=false; return; }
    memcpy(source,cursor,length); source[length]='\0';
    if (!first) jw_char(writer,',');
    jw_string(writer,source);
    first=false;
    if (comma == NULL) break;
    cursor=comma+1;
  }
  jw_char(writer,']');
}

static const char *return_case(const char *primitive) {
  if (strcmp(primitive,"mpfr_set_str")==0) return "mpfr_set_str_parse_status";
  if (strcmp(primitive,"mpfr_get_d")==0) return "mpfr_get_d_binary64_result";
  return "ordinary_ternary_returning_mpfr_primitive";
}

static void f64le_hex(uint64_t bits, char out[17]) {
  static const char digits[]="0123456789abcdef";
  unsigned i;
  for (i=0u;i<8u;++i) {
    unsigned byte=(unsigned)(bits>>(8u*i))&0xffu;
    out[i*2u]=digits[byte>>4]; out[i*2u+1u]=digits[byte&15u];
  }
  out[16]='\0';
}

static bool build_receipt(Run *run, NumericState *state,
                          const CentralReceipt central[4],
                          char output[RECEIPT_CAPACITY], size_t *length_out) {
  static const char *const interval_ids[13] = {
    "mu_E_central","mu_L_central","stress_scale_central_via_mu",
    "stress_scale_central_closed","noise_scale_central","mu_E_one_sigma",
    "mu_L_one_sigma","stress_scale_one_sigma","noise_scale_one_sigma",
    "mu_E_admission_k2","mu_L_admission_k2","stress_scale_admission_k2",
    "noise_scale_admission_k2"
  };
  static const unsigned interval_indices[13] = {
    22u,24u,27u,31u,32u,35u,36u,39u,40u,43u,44u,47u,48u
  };
  JsonWriter writer={output,0u,RECEIPT_CAPACITY-1u,true};
  size_t i;
  jw_text(&writer,"{\"artifactStatus\":\"source_candidate_only\",\"bindings\":{");
  jw_text(&writer,"\"codata2022Raw\":{\"sha256\":\""); jw_text(&writer,CODATA_SHA256);
  jw_text(&writer,"\",\"sizeBytes\":6180},");
  jw_text(&writer,"\"normalizationV1\":{\"canonicalSha256\":\"16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24\",\"canonicalSizeBytes\":23822},");
  jw_text(&writer,"\"normalizationV2\":{\"canonicalSha256\":\"6af028d078ecc4cc9076eb45476fd87ac448503170e88fccf0ada3a98d06cafb\",\"canonicalSizeBytes\":15246,\"rawSha256\":\"6d5d539b5c93409b6a0afefe0afdf9c32aa27f98fb1d133efb8c6d19e66a86cc\",\"rawSizeBytes\":26854}},");
  jw_text(&writer,"\"centralRepresentatives\":[");
  for (i=0u;i<4u;++i) {
    char bits_hex[17];
    if (i!=0u) jw_char(&writer,',');
    f64le_hex(central[i].f64_bits,bits_hex);
    jw_text(&writer,"{\"dyadic\":"); jw_dyadic(&writer,&central[i].dyadic);
    jw_text(&writer,",\"f64leHex\":"); jw_string(&writer,bits_hex);
    jw_text(&writer,",\"id\":"); jw_string(&writer,central[i].id); jw_char(&writer,'}');
  }
  jw_text(&writer,"],\"claims\":{\"agreement\":null,\"authority\":false,\"implementationBound\":false,\"lamps\":null,\"persisted\":false,\"physical\":false,\"readiness\":false,\"runtimeBound\":false},");
  jw_text(&writer,"\"context\":{\"exponentMaximum\":1000000,\"exponentMinimum\":-1000000,\"precisionBits\":256},\"intervals\":[");
  for (i=0u;i<13u;++i) {
    Interval *interval=&state->directed[interval_indices[i]];
    Dyadic lower,upper;
    if (!canonical_mpfr(&interval->lower,"RNDD",&lower) ||
        !canonical_mpfr(&interval->upper,"RNDU",&upper)) {
      return set_error(run,"E_INTERVAL_DYADIC");
    }
    if (i!=0u) jw_char(&writer,',');
    jw_text(&writer,"{\"id\":"); jw_string(&writer,interval_ids[i]);
    jw_text(&writer,",\"lower\":"); jw_dyadic(&writer,&lower);
    jw_text(&writer,",\"upper\":"); jw_dyadic(&writer,&upper); jw_char(&writer,'}');
  }
  jw_text(&writer,"],\"lane\":\"independent\",\"protocolId\":\"nhm2_spherical_boson_star_v2_si_normalization_canonical_receipt/v2\",\"runtime\":{\"gmpVersion\":\"6.3.0\",\"mpfrVersion\":\"4.2.2\"},\"sourceCandidateOnly\":true,\"trace\":[");
  for (i=0u;i<TRACE_COUNT;++i) {
    const TraceRecord *record=&run->trace[i];
    if (i!=0u) jw_char(&writer,',');
    jw_text(&writer,"{\"canonicalResultDyadic\":"); jw_dyadic(&writer,&record->result);
    jw_text(&writer,",\"forbiddenFlagsInFrozenOrder\":[");
    for (size_t j=0u;j<5u;++j) {
      if (j!=0u) jw_char(&writer,',');
      jw_text(&writer,record->forbidden[j]?"true":"false");
    }
    jw_text(&writer,"],\"label\":"); jw_string(&writer,record->spec->label);
    jw_text(&writer,",\"ordinal\":"); jw_format(&writer,"%u",(unsigned)(i+1u));
    jw_text(&writer,",\"primitive\":"); jw_string(&writer,record->spec->primitive);
    jw_text(&writer,",\"returnCase\":"); jw_string(&writer,return_case(record->spec->primitive));
    jw_text(&writer,",\"roundingMode\":"); jw_string(&writer,record->spec->rounding);
    jw_text(&writer,",\"sources\":"); jw_sources(&writer,record->spec->sources);
    jw_text(&writer,",\"ternarySign\":"); jw_format(&writer,"%d",record->ternary_sign);
    jw_char(&writer,'}');
  }
  jw_text(&writer,"],\"traceCount\":139}");
  if (!writer.ok || writer.length == 0u || writer.length >= RECEIPT_CAPACITY) {
    return set_error(run,"E_JSON_BOUND");
  }
  output[writer.length]='\0';
  *length_out=writer.length;
  return true;
}

static int fail_code(const char *code) {
  const char *bounded = code == NULL ? "E_INTERNAL" : code;
  size_t length=strlen(bounded);
  if (length==0u || length>31u) { bounded="E_INTERNAL"; length=10u; }
  (void)fwrite(bounded,1u,length,stderr);
  (void)fwrite("\n",1u,1u,stderr);
  return 1;
}

static bool binary64_layout_ok(void) {
  static const double probes[] = {
    1.0, 1.5, -1.0, 0.0, -0.0, DBL_MIN, (double)INFINITY
  };
  static const uint64_t expected[] = {
    UINT64_C(0x3ff0000000000000), UINT64_C(0x3ff8000000000000),
    UINT64_C(0xbff0000000000000), UINT64_C(0x0000000000000000),
    UINT64_C(0x8000000000000000), UINT64_C(0x0010000000000000),
    UINT64_C(0x7ff0000000000000)
  };
  size_t i;
  if (sizeof(double)!=8u || FLT_RADIX!=2 || DBL_MANT_DIG!=53 ||
      DBL_MAX_EXP!=1024 || DBL_MIN_EXP!=-1021 ||
      sizeof probes / sizeof probes[0] != sizeof expected / sizeof expected[0]) {
    return false;
  }
  for (i=0u;i<sizeof probes / sizeof probes[0];++i) {
    uint64_t bits=0u;
    memcpy(&bits,&probes[i],sizeof bits);
    if (bits!=expected[i]) return false;
  }
  return true;
}

int main(int argc, char **argv) {
  uint8_t input[REQUIRED_STDIN_BYTES+1u];
  uint8_t digest[32];
  Sha256 sha;
  size_t input_length;
  Run run;
  NumericState state;
  CentralReceipt central[4];
  char receipt[RECEIPT_CAPACITY];
  size_t receipt_length=0u;
  mpfr_exp_t saved_emin=0,saved_emax=0;
  bool range_changed=false;
  bool success=false;

  if (argc!=2 || argv==NULL || argv[1]==NULL || strcmp(argv[1],REQUIRED_ARGV)!=0) {
    return fail_code("E_ARGV");
  }
  input_length=fread(input,1u,sizeof input,stdin);
  if (ferror(stdin) || input_length!=REQUIRED_STDIN_BYTES) {
    return fail_code("E_STDIN_SIZE");
  }
  sha256_init(&sha); sha256_update(&sha,input,input_length); sha256_final(&sha,digest);
  if (!digest_matches_hex(digest,CODATA_SHA256)) return fail_code("E_STDIN_SHA256");

  if (strcmp(mpfr_get_version(),"4.2.2")!=0 || strcmp(gmp_version,"6.3.0")!=0) {
    return fail_code("E_RUNTIME_VERSION");
  }
  if (!binary64_layout_ok()) {
    return fail_code("E_BINARY64");
  }

  memset(&run,0,sizeof run); memset(&state,0,sizeof state); memset(central,0,sizeof central);
  saved_emin=mpfr_get_emin(); saved_emax=mpfr_get_emax();
  if (mpfr_set_emin((mpfr_exp_t)-1000000)!=0 ||
      mpfr_set_emax((mpfr_exp_t)1000000)!=0) {
    (void)mpfr_set_emin(saved_emin); (void)mpfr_set_emax(saved_emax);
    return fail_code("E_EXPONENT_RANGE");
  }
  range_changed=true;

  if (execute_graphs(&run,&state,central) &&
      build_receipt(&run,&state,central,receipt,&receipt_length)) {
    success=true;
  }

  clear_values_reverse(&run);
  if (range_changed) {
    if (mpfr_set_emin(saved_emin)!=0 || mpfr_set_emax(saved_emax)!=0) {
      success=false;
      if (run.error==NULL) run.error="E_CONTEXT_RESTORE";
    }
  }
  if (!success) return fail_code(run.error);
  if (fwrite(receipt,receipt_length,1u,stdout)!=1u) return fail_code("E_STDOUT_WRITE");
  if (fflush(stdout)!=0 || ferror(stdout)) return fail_code("E_STDOUT_FLUSH");
  return 0;
}
