#define main g2h_candidate_entrypoint_not_invoked
#include "tolman_vii_primary_proof_v2.c"
#undef main

static int fixture_write(const char *path, const char *schema) {
    const int descriptor = open(path, O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC | O_NOFOLLOW,
                                S_IRUSR | S_IWUSR);
    if (descriptor < 0) {
        return 0;
    }
    char record[1024];
    const int length = snprintf(
        record, sizeof(record),
        "schema=%s\n"
        "decision=AUTHORIZED\n"
        "lane=primary\n"
        "token_sha256=d54ee55da5967062bfbc080bcfb3d962b07ed69b08e4316b3973aa5b24d2ff4b\n"
        "contract_sha256=30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d\n"
        "executable_sha256=666ba126413e63318275bf0861b860707ce7046bcd278c3ee73b1f65f9369028\n"
        "output_root=artifacts/research/nhm2/g2h/tolman-vii-primary-v2\n",
        schema);
    const int written = length > 0 && (size_t)length < sizeof(record)
        && write(descriptor, record, (size_t)length) == length;
    return close(descriptor) == 0 && written;
}

int main(void) {
    const char *v1_path = "/tmp/authorization-v1.txt";
    const char *v2_path = "/tmp/authorization-v2.txt";
    if (!fixture_write(v1_path, "nhm2.g2h_execution_authorization.v1")
        || !fixture_write(v2_path, "nhm2.g2h_execution_authorization.v2")) {
        return 90;
    }
    primary_authorization authorization;
    const int v1_admitted = primary_parse_authorization(v1_path, &authorization);
    const int v2_admitted = primary_parse_authorization(v2_path, &authorization);
    printf("{\"candidate_entrypoint_invocations\":0,\"v1_admitted\":%s,"
           "\"v2_rejected\":%s}\n",
           v1_admitted ? "true" : "false", v2_admitted ? "false" : "true");
    return v1_admitted && !v2_admitted ? 0 : 91;
}
