#include <cinttypes>
#include <cstdint>
#include <cstdio>
#include <ctime>
#include <unistd.h>

namespace {

constexpr std::size_t kMaximumDepth = 16384;
constexpr std::size_t kBucketCount = 16384;

struct Frame {
  std::uintptr_t function;
  std::uint64_t entered_ns;
  std::uint64_t child_ns;
};

struct Bucket {
  std::uintptr_t function;
  std::uint64_t calls;
  std::uint64_t inclusive_ns;
  std::uint64_t self_ns;
};

Frame frames[kMaximumDepth]{};
Bucket buckets[kBucketCount]{};
std::size_t depth = 0;
std::uint64_t depth_overflow = 0;
std::uint64_t bucket_overflow = 0;
thread_local bool inside_hook = false;

__attribute__((no_instrument_function)) std::uint64_t monotonic_ns() noexcept {
  timespec value{};
  if (clock_gettime(CLOCK_MONOTONIC_RAW, &value) != 0) {
    return 0;
  }
  return static_cast<std::uint64_t>(value.tv_sec) * 1000000000ULL +
         static_cast<std::uint64_t>(value.tv_nsec);
}

__attribute__((no_instrument_function)) std::size_t bucket_index(
    std::uintptr_t function) noexcept {
  std::uintptr_t mixed = function;
  mixed ^= mixed >> 17U;
  mixed *= static_cast<std::uintptr_t>(0xed5ad4bbU);
  mixed ^= mixed >> 11U;
  return static_cast<std::size_t>(mixed) & (kBucketCount - 1U);
}

__attribute__((no_instrument_function)) void record(
    std::uintptr_t function,
    std::uint64_t inclusive_ns,
    std::uint64_t self_ns) noexcept {
  std::size_t index = bucket_index(function);
  for (std::size_t probe = 0; probe < kBucketCount; ++probe) {
    Bucket& bucket = buckets[index];
    if (bucket.function == 0 || bucket.function == function) {
      bucket.function = function;
      ++bucket.calls;
      bucket.inclusive_ns += inclusive_ns;
      bucket.self_ns += self_ns;
      return;
    }
    index = (index + 1U) & (kBucketCount - 1U);
  }
  ++bucket_overflow;
}

__attribute__((destructor, no_instrument_function)) void emit_profile() noexcept {
  char line[256];
  for (const Bucket& bucket : buckets) {
    if (bucket.function == 0) {
      continue;
    }
    const int length = std::snprintf(
        line, sizeof(line), "H2_PROFILE_V4|0x%" PRIxPTR "|%" PRIu64
                            "|%" PRIu64 "|%" PRIu64 "\n",
        bucket.function, bucket.calls, bucket.inclusive_ns, bucket.self_ns);
    if (length > 0) {
      const std::size_t count = static_cast<std::size_t>(length) < sizeof(line)
                                    ? static_cast<std::size_t>(length)
                                    : sizeof(line) - 1U;
      static_cast<void>(write(STDERR_FILENO, line, count));
    }
  }
  const int length = std::snprintf(
      line, sizeof(line), "H2_PROFILE_V4_META|%" PRIu64 "|%" PRIu64
                          "|%zu\n",
      depth_overflow, bucket_overflow, depth);
  if (length > 0) {
    const std::size_t count = static_cast<std::size_t>(length) < sizeof(line)
                                  ? static_cast<std::size_t>(length)
                                  : sizeof(line) - 1U;
    static_cast<void>(write(STDERR_FILENO, line, count));
  }
}

}  // namespace

extern "C" {

__attribute__((no_instrument_function)) void __cyg_profile_func_enter(
    void* function_address, void*) noexcept {
  if (inside_hook) {
    return;
  }
  inside_hook = true;
  if (depth < kMaximumDepth) {
    frames[depth++] = Frame{
        reinterpret_cast<std::uintptr_t>(function_address), monotonic_ns(), 0};
  } else {
    ++depth_overflow;
  }
  inside_hook = false;
}

__attribute__((no_instrument_function)) void __cyg_profile_func_exit(
    void* function_address, void*) noexcept {
  if (inside_hook) {
    return;
  }
  inside_hook = true;
  if (depth > 0) {
    const std::uint64_t exited_ns = monotonic_ns();
    const Frame frame = frames[--depth];
    const std::uintptr_t function =
        reinterpret_cast<std::uintptr_t>(function_address);
    if (frame.function == function && exited_ns >= frame.entered_ns) {
      const std::uint64_t inclusive_ns = exited_ns - frame.entered_ns;
      const std::uint64_t self_ns = inclusive_ns >= frame.child_ns
                                        ? inclusive_ns - frame.child_ns
                                        : 0;
      record(function, inclusive_ns, self_ns);
      if (depth > 0) {
        frames[depth - 1U].child_ns += inclusive_ns;
      }
    } else {
      ++depth_overflow;
    }
  } else {
    ++depth_overflow;
  }
  inside_hook = false;
}

}  // extern "C"
