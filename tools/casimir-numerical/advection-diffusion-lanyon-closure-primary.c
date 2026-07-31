#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 * Scientific Evidence Closure v1 primary lane.
 *
 * This wrapper deliberately delegates flux evaluation to the exact admitted
 * Lanyon-generated source. The build supplies that source directory and binds
 * CASIMIR_DIFFUSIVITY to one server-enrolled value.
 */
#define main casimir_lanyon_generated_main
#include "advection_diffusion_full_1d.c"
#undef main

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

static int solve_level(FILE *stream, uint32_t cells) {
  const double dx = 1.0 / (double)cells;
  double *state = (double *)calloc(cells, sizeof(double));
  double *next = (double *)calloc(cells, sizeof(double));
  double *advective = (double *)calloc(cells, sizeof(double));
  double *diffusive = (double *)calloc(cells, sizeof(double));
  if (!state || !next || !advective || !diffusive) {
    free(state);
    free(next);
    free(advective);
    free(diffusive);
    return 1;
  }
  for (uint32_t index = 0; index < cells; ++index) {
    const double x = ((double)index + 0.5) * dx;
    state[index] = 1.0 + 0.25 * sin(2.0 * M_PI * x);
  }

  const advection_diffusion_full_1d_parameters parameters = {
      .a = CASIMIR_A,
      .Dxx = CASIMIR_D,
  };
  double time = 0.0;
  while (time < CASIMIR_FINAL_TIME) {
    const double dt_advection = 0.4 * dx / fabs(CASIMIR_A);
    const double dt_diffusion = 0.2 * dx * dx / CASIMIR_D;
    double dt = fmin(dt_advection, dt_diffusion);
    if (time + dt > CASIMIR_FINAL_TIME) dt = CASIMIR_FINAL_TIME - time;

    for (uint32_t index = 0; index < cells; ++index) {
      const uint32_t right = (index + 1u) % cells;
      const advection_diffusion_full_1d_coordinates coordinate = {
          .x = ((double)index + 1.0) * dx,
      };
      const advection_diffusion_full_1d_state upwind = {.f = state[index]};
      advection_diffusion_full_1d_flux advective_flux;
      advection_diffusion_full_1d_x_flux(&coordinate, &parameters, &upwind,
                                         &advective_flux);
      advective[index] = advective_flux.flux_f;

      const advection_diffusion_full_1d_coordinates left_coordinate = {
          .x = ((double)index + 0.5) * dx,
      };
      const advection_diffusion_full_1d_coordinates right_coordinate = {
          .x = ((double)index + 1.5) * dx,
      };
      const advection_diffusion_full_1d_state left_state = {.f = state[index]};
      const advection_diffusion_full_1d_state right_state = {.f = state[right]};
      advection_diffusion_full_1d_centered_diffusion_interface_gradient
          gradient;
      advection_diffusion_full_1d_centered_diffusion_x_interface_gradient(
          &left_coordinate, &right_coordinate, &left_state, &right_state,
          &parameters, &gradient);
      const advection_diffusion_full_1d_gradient state_gradient = {
          .f_x = gradient.interface_f_x,
      };
      advection_diffusion_full_1d_diffusive_flux diffusive_flux;
      advection_diffusion_full_1d_x_diffusive_flux(
          &coordinate, &parameters, &left_state,
          (advection_diffusion_full_1d_gradient *)&state_gradient,
          &diffusive_flux);
      diffusive[index] = diffusive_flux.diffusive_flux_f;
    }
    for (uint32_t index = 0; index < cells; ++index) {
      const uint32_t left = (index + cells - 1u) % cells;
      const double divergence_advective =
          (advective[index] - advective[left]) / dx;
      const double divergence_diffusive =
          (diffusive[index] - diffusive[left]) / dx;
      next[index] =
          state[index] + dt * (-divergence_advective + divergence_diffusive);
    }
    double *swap = state;
    state = next;
    next = swap;
    time += dt;
  }

  const int failed =
      write_exact(stream, &cells, sizeof(cells)) ||
      write_exact(stream, state, sizeof(double) * (size_t)cells);
  free(state);
  free(next);
  free(advective);
  free(diffusive);
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
