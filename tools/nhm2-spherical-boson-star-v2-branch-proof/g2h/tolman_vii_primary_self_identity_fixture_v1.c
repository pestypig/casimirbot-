#define main g2h_candidate_entrypoint_not_invoked
#include "tolman_vii_primary_proof_v2.c"
#undef main

static int fixture_write_all(int descriptor, const char *value) {
    const size_t length = strlen(value);
    return write(descriptor, value, length) == (ssize_t)length;
}

int main(void) {
    char directory[] = "/tmp/nhm2-g2h-e-r1-XXXXXX";
    if (mkdtemp(directory) == NULL) {
        return 90;
    }
    char regular_path[512];
    char symlink_path[512];
    if (snprintf(regular_path, sizeof(regular_path), "%s/regular", directory) <= 0
        || snprintf(symlink_path, sizeof(symlink_path), "%s/link", directory) <= 0) {
        return 91;
    }

    const int direct = open("/proc/self/exe", O_RDONLY | O_CLOEXEC | O_NOFOLLOW);
    const int direct_errno = errno;
    if (direct >= 0) {
        (void)close(direct);
        return 92;
    }
    if (direct_errno != ELOOP) {
        return 93;
    }

    char self_hash[65];
    unsigned long self_bytes = 0;
    if (!primary_hash_self_executable(self_hash, &self_bytes) || self_bytes == 0) {
        return 94;
    }

    int descriptor = open(regular_path, O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC | O_NOFOLLOW,
                          S_IRUSR | S_IWUSR);
    if (descriptor < 0 || !fixture_write_all(descriptor, "before") || close(descriptor) != 0) {
        return 95;
    }
    if (symlink("regular", symlink_path) != 0) {
        return 96;
    }

    char before_hash[65];
    unsigned long before_bytes = 0;
    if (!primary_hash_file(regular_path, before_hash, &before_bytes) || before_bytes != 6) {
        return 97;
    }
    char rejected_hash[65];
    unsigned long rejected_bytes = 0;
    errno = 0;
    if (primary_hash_file(symlink_path, rejected_hash, &rejected_bytes) || errno != ELOOP) {
        return 98;
    }

    descriptor = open(regular_path, O_WRONLY | O_TRUNC | O_CLOEXEC | O_NOFOLLOW);
    if (descriptor < 0 || !fixture_write_all(descriptor, "after!") || close(descriptor) != 0) {
        return 99;
    }
    char after_hash[65];
    unsigned long after_bytes = 0;
    if (!primary_hash_file(regular_path, after_hash, &after_bytes) || after_bytes != 6
        || strcmp(before_hash, after_hash) == 0) {
        return 100;
    }

    printf("{\"arbitrary_symlink_rejected\":true,\"candidate_entrypoint_invocations\":0,"
           "\"mutation_detected\":true,\"procfs_nofollow_errno\":%d,"
           "\"regular_file_hashing\":true,\"self_bytes\":%lu,"
           "\"self_sha256\":\"%s\"}\n",
           direct_errno, self_bytes, self_hash);
    return 0;
}
