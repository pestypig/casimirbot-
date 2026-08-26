#include <flint/fmpq.h>

#define run_fixture run_fixture_v1
#define main primary_v1_main
#include "tolman_vii_primary.c"
#undef main
#undef run_fixture

static fixture_result run_fixture_v2(const char *name) {
    if (strcmp(name, "exact_rational_positive") == 0) {
        fmpq_t exact;
        arb_t enclosure;
        fmpq_init(exact);
        arb_init(enclosure);
        fmpq_set_si(exact, 1, 5);
        arb_set_fmpq(enclosure, exact, PRECISION_BITS);
        const int accepted = fmpq_equal_si(exact, 1, 5)
            && fmpq_sgn(exact) > 0
            && arb_is_positive(enclosure)
            && arb_contains_fmpq(enclosure, exact);
        arb_clear(enclosure);
        fmpq_clear(exact);
        return (fixture_result){name, accepted,
                                "NO_CANDIDATE_EXACT_RATIONAL_FIXTURE_PASS"};
    }
    return run_fixture_v1(name);
}

int main(int argc, char **argv) {
    if (argc == 3 && strcmp(argv[1], "--fixture") == 0) {
        fixture_result result = run_fixture_v2(argv[2]);
        emit_fixture(&result);
        flint_cleanup();
        return result.pass ? 0 : 1;
    }
    if (argc == 2 && strcmp(argv[1], "--candidate") == 0) {
        return refuse_candidate_execution();
    }
    fprintf(stderr, "usage: %s --fixture NAME\n", argv[0]);
    return 64;
}
