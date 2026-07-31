#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 * Scientific Evidence Closure v1 independent lane.
 *
 * This implementation does not include or call the Lanyon-generated kernel.
 * It discretizes the PDE directly with centered spatial differences and a
 * two-stage Runge-Kutta method-of-lines integrator. Its source lineage and
 * build manifest are distinct from the primary finite-volume lane.
 */
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#ifndef CASIMIR_DIFFUSIVITY
#error "CASIMIR_DIFFUSIVITY must be fixed by the enrolled build manifest"
#endif

static const uint32_t CASIMIR_LEVELS[] = {64u, 128u, 256u};
static const double CASIMIR_A = 0.5;
static const double CASIMIR_D = CASIMIR_DIFFUSIVITY;
static const double CASIMIR_FINAL_TIME = 0.05;

static const char *output_path(int argc, char **argv) {
  for (int index = 1; index + 1 < argc; ++index) {
    if (strcmp(argv[index], "--output") == 0) return argv[index + 1];
  }
  return NULL;
}

static int write_exact(FILE *stream, const void *value, size_t size) {
  return fwrite(value, 1, size, stream) == size ? 0 : 1;
}

static void spatial_operator(const double *state, double *derivative,
                             uint32_t cells, double dx) {
  const double inverse_two_dx = 1.0 / (2.0 * dx);
  const double inverse_dx_squared = 1.0 / (dx * dx);
  for (uint32_t index = 0; index < cells; ++index) {
    const uint32_t left = (index + cells - 1u) % cells;
    const uint32_t right = (index + 1u) % cells;
    const double first_derivative =
        (state[right] - state[left]) * inverse_two_dx;
    const double second_derivative =
        (state[right] - 2.0 * state[index] + state[left]) *
        inverse_dx_squared;
    derivative[index] =
        -CASIMIR_A * first_derivative + CASIMIR_D * second_derivative;
  }
}

static int solve_level(FILE *stream, uint32_t cells) {
  const double dx = 1.0 / (double)cells;
  double *state = (double *)calloc(cells, sizeof(double));
  double *stage = (double *)calloc(cells, sizeof(double));
  double *rhs_first = (double *)calloc(cells, sizeof(double));
  double *rhs_second = (double *)calloc(cells, sizeof(double));
  if (!state || !stage || !rhs_first || !rhs_second) {
    free(state);
    free(stage);
    free(rhs_first);
    free(rhs_second);
    return 1;
  }
  for (uint32_t index = 0; index < cells; ++index) {
    const double x = ((double)index + 0.5) * dx;
    state[index] = 1.0 + 0.25 * sin(2.0 * M_PI * x);
  }

  double time = 0.0;
  while (time < CASIMIR_FINAL_TIME) {
    const double dt_advection = 0.2 * dx / fabs(CASIMIR_A);
    const double dt_diffusion = 0.1 * dx * dx / CASIMIR_D;
    double dt = fmin(dt_advection, dt_diffusion);
    if (time + dt > CASIMIR_FINAL_TIME) dt = CASIMIR_FINAL_TIME - time;

    spatial_operator(state, rhs_first, cells, dx);
    for (uint32_t index = 0; index < cells; ++index) {
      stage[index] = state[index] + dt * rhs_first[index];
    }
    spatial_operator(stage, rhs_second, cells, dx);
    for (uint32_t index = 0; index < cells; ++index) {
      state[index] += 0.5 * dt * (rhs_first[index] + rhs_second[index]);
    }
    time += dt;
  }

  const int failed =
      write_exact(stream, &cells, sizeof(cells)) ||
      write_exact(stream, state, sizeof(double) * (size_t)cells);
  free(state);
  free(stage);
  free(rhs_first);
  free(rhs_second);
  return failed;
}

int main(int argc, char **argv) {
  const char *path = output_path(argc, argv);
  if (!path) return 2;
  FILE *stream = fopen(path, "wb");
  if (!stream) return 3;
  const unsigned char magic[8] = {'C', 'A', 'S', 'N', 'U', 'M', '1', '\0'};
  const uint32_t level_count =
      (uint32_t)(sizeof(CASIMIR_LEVELS) / sizeof(CASIMIR_LEVELS[0]));
  int failed = write_exact(stream, magic, sizeof(magic)) ||
               write_exact(stream, &level_count, sizeof(level_count));
  for (uint32_t level = 0; !failed && level < level_count; ++level) {
    failed = solve_level(stream, CASIMIR_LEVELS[level]);
  }
  if (fclose(stream) != 0) failed = 1;
  return failed ? 4 : 0;
}
