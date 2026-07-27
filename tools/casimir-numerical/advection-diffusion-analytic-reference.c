#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

static const uint32_t CASIMIR_LEVELS[] = {32u, 64u, 128u};
static const double CASIMIR_A = 0.5;
static const double CASIMIR_D = 0.01;
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
  const double decay =
      exp(-4.0 * M_PI * M_PI * CASIMIR_D * CASIMIR_FINAL_TIME);
  for (uint32_t level = 0; !failed && level < level_count; ++level) {
    const uint32_t cells = CASIMIR_LEVELS[level];
    failed = write_exact(stream, &cells, sizeof(cells));
    for (uint32_t index = 0; !failed && index < cells; ++index) {
      const double x = ((double)index + 0.5) / (double)cells;
      const double value =
          1.0 +
          0.25 * decay *
              sin(2.0 * M_PI * (x - CASIMIR_A * CASIMIR_FINAL_TIME));
      failed = write_exact(stream, &value, sizeof(value));
    }
  }
  if (fclose(stream) != 0) failed = 1;
  return failed ? 4 : 0;
}

