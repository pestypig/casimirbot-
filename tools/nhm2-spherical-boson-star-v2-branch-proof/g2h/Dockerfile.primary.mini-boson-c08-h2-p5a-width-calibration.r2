ARG BUILDER_IMAGE=nhm2-g2h-s4-primary-fixture-builder:v2
ARG RUNTIME_IMAGE=nhm2-g2h-primary-proof:v2

FROM ${BUILDER_IMAGE} AS builder
# One COPY layer is intentional: clean classic daemons using the vfs driver
# otherwise duplicate the complete builder filesystem once per source file.
COPY tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/ /src/
RUN g++ -std=c++20 -O2 -fno-fast-math -fno-common -Wall -Wextra -Werror \
      -pthread \
      -o /usr/local/bin/mini-boson-star-primary-c08-h2-p5a-width-calibration-v1 \
      /src/mini_boson_star_primary_grid_v1.cpp \
      /src/mini_boson_star_primary_c08_identity_v1.cpp \
      /src/mini_boson_star_primary_c08_margins_v1.cpp \
      /src/mini_boson_star_primary_c08_gevrey_v1.cpp \
      /src/mini_boson_star_primary_c08_successor_panel_v1.cpp \
      /src/mini_boson_star_primary_c08_origin_models_v1.cpp \
      /src/mini_boson_star_primary_c08_scalar_ledger_provider_v1.cpp \
      /src/mini_boson_star_primary_c08_convolution_ledger_v1.cpp \
      /src/mini_boson_star_primary_c08_convolution_bivariate_v1.cpp \
      /src/mini_boson_star_primary_c08_convolution_jet_v1.cpp \
      /src/mini_boson_star_primary_c08_convolution_selector_v1.cpp \
      /src/mini_boson_star_primary_c08_h2_p5a_width_calibration_v1.cpp \
      -lflint-arb -lflint -lgmp -lmpfr

FROM ${RUNTIME_IMAGE}
COPY --from=builder \
  /usr/local/bin/mini-boson-star-primary-c08-h2-p5a-width-calibration-v1 \
  /usr/local/bin/mini-boson-star-primary-c08-h2-p5a-width-calibration-v1
USER 65532:65532
ENTRYPOINT ["/usr/local/bin/mini-boson-star-primary-c08-h2-p5a-width-calibration-v1"]
