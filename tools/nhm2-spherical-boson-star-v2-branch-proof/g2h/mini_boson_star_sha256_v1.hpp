#pragma once

#include <array>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <string>

namespace nhm2::g2h_e_s5::sha256_v1 {

struct Context {
    std::array<std::uint32_t, 8> state{};
    std::uint64_t bits = 0;
    std::array<unsigned char, 64> block{};
    std::size_t used = 0;
};

inline std::uint32_t rotr(std::uint32_t value, unsigned amount) {
    return (value >> amount) | (value << (32U - amount));
}

inline void compress(Context &context, const unsigned char *block) {
    static constexpr std::uint32_t k[64] = {
        0x428a2f98U,0x71374491U,0xb5c0fbcfU,0xe9b5dba5U,0x3956c25bU,0x59f111f1U,0x923f82a4U,0xab1c5ed5U,
        0xd807aa98U,0x12835b01U,0x243185beU,0x550c7dc3U,0x72be5d74U,0x80deb1feU,0x9bdc06a7U,0xc19bf174U,
        0xe49b69c1U,0xefbe4786U,0x0fc19dc6U,0x240ca1ccU,0x2de92c6fU,0x4a7484aaU,0x5cb0a9dcU,0x76f988daU,
        0x983e5152U,0xa831c66dU,0xb00327c8U,0xbf597fc7U,0xc6e00bf3U,0xd5a79147U,0x06ca6351U,0x14292967U,
        0x27b70a85U,0x2e1b2138U,0x4d2c6dfcU,0x53380d13U,0x650a7354U,0x766a0abbU,0x81c2c92eU,0x92722c85U,
        0xa2bfe8a1U,0xa81a664bU,0xc24b8b70U,0xc76c51a3U,0xd192e819U,0xd6990624U,0xf40e3585U,0x106aa070U,
        0x19a4c116U,0x1e376c08U,0x2748774cU,0x34b0bcb5U,0x391c0cb3U,0x4ed8aa4aU,0x5b9cca4fU,0x682e6ff3U,
        0x748f82eeU,0x78a5636fU,0x84c87814U,0x8cc70208U,0x90befffaU,0xa4506cebU,0xbef9a3f7U,0xc67178f2U,
    };
    std::uint32_t words[64]{};
    for (std::size_t i = 0; i < 16; ++i) {
        words[i] = (static_cast<std::uint32_t>(block[4*i]) << 24U)
            | (static_cast<std::uint32_t>(block[4*i+1]) << 16U)
            | (static_cast<std::uint32_t>(block[4*i+2]) << 8U)
            | static_cast<std::uint32_t>(block[4*i+3]);
    }
    for (std::size_t i = 16; i < 64; ++i) {
        const auto s0 = rotr(words[i-15], 7) ^ rotr(words[i-15], 18) ^ (words[i-15] >> 3U);
        const auto s1 = rotr(words[i-2], 17) ^ rotr(words[i-2], 19) ^ (words[i-2] >> 10U);
        words[i] = words[i-16] + s0 + words[i-7] + s1;
    }
    std::uint32_t a=context.state[0], b=context.state[1], c=context.state[2], d=context.state[3];
    std::uint32_t e=context.state[4], f=context.state[5], g=context.state[6], h=context.state[7];
    for (std::size_t i = 0; i < 64; ++i) {
        const auto s1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
        const auto ch = (e & f) ^ (~e & g);
        const auto t1 = h + s1 + ch + k[i] + words[i];
        const auto s0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
        const auto maj = (a & b) ^ (a & c) ^ (b & c);
        const auto t2 = s0 + maj;
        h=g; g=f; f=e; e=d+t1; d=c; c=b; b=a; a=t1+t2;
    }
    context.state[0]+=a; context.state[1]+=b; context.state[2]+=c; context.state[3]+=d;
    context.state[4]+=e; context.state[5]+=f; context.state[6]+=g; context.state[7]+=h;
}

inline void init(Context &context) {
    context.state = {0x6a09e667U,0xbb67ae85U,0x3c6ef372U,0xa54ff53aU,
        0x510e527fU,0x9b05688cU,0x1f83d9abU,0x5be0cd19U};
    context.bits = 0; context.used = 0;
}

inline void update(Context &context, const unsigned char *data, std::size_t length) {
    context.bits += static_cast<std::uint64_t>(length) * 8U;
    while (length != 0U) {
        const auto take = length < 64U-context.used ? length : 64U-context.used;
        std::memcpy(context.block.data()+context.used, data, take);
        context.used += take; data += take; length -= take;
        if (context.used == 64U) { compress(context, context.block.data()); context.used = 0; }
    }
}

inline std::string finish(Context &context) {
    context.block[context.used++] = 0x80U;
    if (context.used > 56U) {
        std::memset(context.block.data()+context.used, 0, 64U-context.used);
        compress(context, context.block.data()); context.used = 0;
    }
    std::memset(context.block.data()+context.used, 0, 56U-context.used);
    for (std::size_t i=0; i<8; ++i) context.block[63U-i] = static_cast<unsigned char>(context.bits >> (8U*i));
    compress(context, context.block.data());
    static constexpr char hex[] = "0123456789abcdef";
    std::string out(64, '0');
    for (std::size_t w=0; w<8; ++w) for (std::size_t b=0; b<4; ++b) {
        const auto value = static_cast<unsigned char>(context.state[w] >> (24U-8U*b));
        out[8U*w+2U*b] = hex[value >> 4U]; out[8U*w+2U*b+1U] = hex[value & 15U];
    }
    return out;
}

inline std::string text(const std::string &value) {
    Context context; init(context);
    update(context, reinterpret_cast<const unsigned char *>(value.data()), value.size());
    return finish(context);
}

} // namespace nhm2::g2h_e_s5::sha256_v1
