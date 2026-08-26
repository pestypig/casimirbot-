#define main g2h_candidate_entrypoint_not_invoked
#include "tolman_vii_primary_proof_v3.c"
#undef main

#define TOKEN "622dfe119a646715cf8cf3855955cb1d23404b3b6a34cce1957cdd47b0a3d34a"
#define EXE_SHA "1764b6bec075061eea815a2a9c44cba3ff459fb8cc0709c813762863225246e1"

static int fixture_write(const char *path, const char *schema, const char *decision,
                         const char *lane, const char *token_sha, const char *contract_sha,
                         const char *executable_sha, const char *output_root) {
    const int descriptor = open(path, O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC | O_NOFOLLOW,
                                S_IRUSR | S_IWUSR);
    if (descriptor < 0) return 0;
    char record[2048];
    const int length = snprintf(record, sizeof(record),
        "schema=%s\ndecision=%s\nlane=%s\ntoken_sha256=%s\n"
        "contract_sha256=%s\nexecutable_sha256=%s\noutput_root=%s\n",
        schema, decision, lane, token_sha, contract_sha, executable_sha, output_root);
    const int written = length > 0 && (size_t)length < sizeof(record)
        && write(descriptor, record, (size_t)length) == length;
    return close(descriptor) == 0 && written;
}

static int fixture_case(unsigned index, const char *schema, const char *decision,
                        const char *lane, const char *token_sha, const char *contract_sha,
                        const char *executable_sha, const char *output_root,
                        const char *token, const char *self_hash, int expected) {
    char path[64];
    if (snprintf(path, sizeof(path), "auth-%u.txt", index) <= 0
        || !fixture_write(path, schema, decision, lane, token_sha, contract_sha,
                          executable_sha, output_root)) return 0;
    const int actual = primary_verify_authorization(path, token, self_hash);
    return actual == expected;
}

int main(void) {
    const char *v2 = "nhm2.g2h_execution_authorization.v2";
    const char *v1 = "nhm2.g2h_execution_authorization.v1";
    const char *good_decision = "AUTHORIZED";
    const char *good_lane = "primary";
    const char *good_contract = CONTRACT_SHA256;
    const char *good_root = PRIMARY_ROOT;
    const char *bad_hash = ZERO_HASH;
    int passed = 0;
    passed += fixture_case(0, v2, good_decision, good_lane, TOKEN_SHA256,
                            good_contract, EXE_SHA, good_root, TOKEN, EXE_SHA, 1);
    passed += fixture_case(1, v1, good_decision, good_lane, TOKEN_SHA256,
                            good_contract, EXE_SHA, good_root, TOKEN, EXE_SHA, 0);
    passed += fixture_case(2, v2, "DENIED", good_lane, TOKEN_SHA256,
                            good_contract, EXE_SHA, good_root, TOKEN, EXE_SHA, 0);
    passed += fixture_case(3, v2, good_decision, "independent", TOKEN_SHA256,
                            good_contract, EXE_SHA, good_root, TOKEN, EXE_SHA, 0);
    passed += fixture_case(4, v2, good_decision, good_lane, bad_hash,
                            good_contract, EXE_SHA, good_root, TOKEN, EXE_SHA, 0);
    passed += fixture_case(5, v2, good_decision, good_lane, TOKEN_SHA256,
                            bad_hash, EXE_SHA, good_root, TOKEN, EXE_SHA, 0);
    passed += fixture_case(6, v2, good_decision, good_lane, TOKEN_SHA256,
                            good_contract, bad_hash, good_root, TOKEN, EXE_SHA, 0);
    passed += fixture_case(7, v2, good_decision, good_lane, TOKEN_SHA256,
                            good_contract, EXE_SHA, "wrong/root", TOKEN, EXE_SHA, 0);
    passed += fixture_case(8, v2, good_decision, good_lane, TOKEN_SHA256,
                            good_contract, EXE_SHA, good_root, "wrong-token", EXE_SHA, 0);
    passed += fixture_case(9, v2, good_decision, good_lane, TOKEN_SHA256,
                            good_contract, EXE_SHA, good_root, TOKEN, bad_hash, 0);
    printf("{\"candidate_entrypoint_invocations\":0,\"cases_passed\":%d,"
           "\"exact_v2_admitted\":%s,\"v1_and_mutations_rejected\":%s}\n",
           passed, passed >= 1 ? "true" : "false", passed == 10 ? "true" : "false");
    return passed == 10 ? 0 : 91;
}
