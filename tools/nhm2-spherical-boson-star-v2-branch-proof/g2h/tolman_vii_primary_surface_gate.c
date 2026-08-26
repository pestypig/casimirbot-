#include <flint/fmpq.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

typedef struct {
    int pass;
    const char *typed_result;
    const char *coefficient;
    unsigned long first_disjoint_order;
    char interior_exact[96];
    char exterior_exact[96];
} primary_surface_gate_report;

static void primary_set_fraction(fmpq_t value, slong numerator, ulong denominator) {
    fmpq_set_si(value, numerator, denominator);
    fmpq_canonicalise(value);
}

static void primary_format_fraction(char *target, size_t target_size, const fmpq_t value) {
    char *raw = fmpq_get_str(NULL, 10, value);
    if (raw == NULL) {
        if (target_size > 0) {
            target[0] = '\0';
        }
        return;
    }
    (void)snprintf(target, target_size, "%s", raw);
    flint_free(raw);
}

/*
 * Compare one-sided analytic germs at x=1.  The interior B=1/Z uses
 * Z(1)=3/5, Z'(1)=2/5, Z''(1)=26/5.  The exterior B=1/F uses
 * F(1)=3/5, F'(1)=2/5, F''(1)=-4/5.  Thus B and B' match exactly while
 * B'' is the first disjoint jet.  No floating-point operation is used.
 */
int primary_surface_regularity_gate(primary_surface_gate_report *report) {
    if (report == NULL) {
        return 0;
    }

    fmpq_t z, z_prime, z_second, exterior_second_source;
    fmpq_t value_interior, value_exterior, first_interior, first_exterior;
    fmpq_t second_interior, second_exterior, scratch, denominator;
    fmpq_init(z);
    fmpq_init(z_prime);
    fmpq_init(z_second);
    fmpq_init(exterior_second_source);
    fmpq_init(value_interior);
    fmpq_init(value_exterior);
    fmpq_init(first_interior);
    fmpq_init(first_exterior);
    fmpq_init(second_interior);
    fmpq_init(second_exterior);
    fmpq_init(scratch);
    fmpq_init(denominator);

    primary_set_fraction(z, 3, 5);
    primary_set_fraction(z_prime, 2, 5);
    primary_set_fraction(z_second, 26, 5);
    primary_set_fraction(exterior_second_source, -4, 5);

    fmpq_inv(value_interior, z);
    fmpq_set(value_exterior, value_interior);

    fmpq_mul(denominator, z, z);
    fmpq_div(first_interior, z_prime, denominator);
    fmpq_neg(first_interior, first_interior);
    fmpq_set(first_exterior, first_interior);

    /* B'' = 2*(F')^2/F^3 - F''/F^2. */
    fmpq_mul(scratch, z_prime, z_prime);
    fmpq_mul_ui(scratch, scratch, 2);
    fmpq_mul(denominator, z, z);
    fmpq_mul(denominator, denominator, z);
    fmpq_div(second_interior, scratch, denominator);
    fmpq_mul(denominator, z, z);
    fmpq_div(scratch, z_second, denominator);
    fmpq_sub(second_interior, second_interior, scratch);

    fmpq_mul(scratch, z_prime, z_prime);
    fmpq_mul_ui(scratch, scratch, 2);
    fmpq_mul(denominator, z, z);
    fmpq_mul(denominator, denominator, z);
    fmpq_div(second_exterior, scratch, denominator);
    fmpq_mul(denominator, z, z);
    fmpq_div(scratch, exterior_second_source, denominator);
    fmpq_sub(second_exterior, second_exterior, scratch);

    const int lower_jets_match = fmpq_equal(value_interior, value_exterior)
        && fmpq_equal(first_interior, first_exterior);
    const int second_jets_disjoint = !fmpq_equal(second_interior, second_exterior);

    memset(report, 0, sizeof(*report));
    report->pass = lower_jets_match && !second_jets_disjoint;
    report->typed_result = report->pass
        ? "GLOBAL_STATIC_STATE_SURFACE_GERMS_IDENTICAL"
        : "GLOBAL_STATIC_STATE_FAIL";
    report->coefficient = "B";
    report->first_disjoint_order = second_jets_disjoint ? 2UL : 0UL;
    primary_format_fraction(report->interior_exact, sizeof(report->interior_exact),
                            second_interior);
    primary_format_fraction(report->exterior_exact, sizeof(report->exterior_exact),
                            second_exterior);

    fmpq_clear(denominator);
    fmpq_clear(scratch);
    fmpq_clear(second_exterior);
    fmpq_clear(second_interior);
    fmpq_clear(first_exterior);
    fmpq_clear(first_interior);
    fmpq_clear(value_exterior);
    fmpq_clear(value_interior);
    fmpq_clear(exterior_second_source);
    fmpq_clear(z_second);
    fmpq_clear(z_prime);
    fmpq_clear(z);
    return lower_jets_match;
}
