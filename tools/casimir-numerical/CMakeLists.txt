cmake_minimum_required(VERSION 3.24)
project(casimir_scientific_evidence_closure_v1 C)

if(NOT DEFINED LANYON_IMPLEMENTATIONS_DIR)
  message(FATAL_ERROR "LANYON_IMPLEMENTATIONS_DIR must name the pinned Lanyon implementations directory")
endif()

function(add_closure_lane target source diffusivity)
  add_executable(${target} ${source})
  target_compile_features(${target} PRIVATE c_std_11)
  target_compile_definitions(${target} PRIVATE CASIMIR_DIFFUSIVITY=${diffusivity})
  if(MSVC)
    target_compile_options(${target} PRIVATE /W4 /fp:strict)
  else()
    target_compile_options(${target} PRIVATE -Wall -Wextra -Wpedantic)
    target_link_libraries(${target} PRIVATE m)
  endif()
endfunction()

add_closure_lane(
  scientific-evidence-primary-baseline
  advection-diffusion-lanyon-closure-primary.c
  0.01
)
target_include_directories(
  scientific-evidence-primary-baseline
  PRIVATE "${LANYON_IMPLEMENTATIONS_DIR}"
)

add_closure_lane(
  scientific-evidence-primary-intervention
  advection-diffusion-lanyon-closure-primary.c
  0.02
)
target_include_directories(
  scientific-evidence-primary-intervention
  PRIVATE "${LANYON_IMPLEMENTATIONS_DIR}"
)

add_closure_lane(
  scientific-evidence-independent-baseline
  advection-diffusion-independent-rk2.c
  0.01
)

add_closure_lane(
  scientific-evidence-independent-intervention
  advection-diffusion-independent-rk2.c
  0.02
)
