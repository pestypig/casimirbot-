"""Frozen four-level radial cross-grid convergence diagnostic.

This module evaluates only caller-supplied states on the preregistered
``N=64,96,128,256`` compactified Lobatto grids.  It does not import or run an
initializer, Newton/continuation solver, candidate executor, replay service,
output writer, or registry.  Coarse states are used only in this diagnostic
projection and can never become predictors for a finer solve.

The returned receipt is bounded and calculation-only.  It records observed
binary64 comparisons, not candidate admission, replay agreement, a Theory
Graph lamp, physical viability, propulsion, or transport authority.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import hashlib
import importlib.util
import math
from pathlib import Path
import struct
from types import MappingProxyType
from typing import Final


RADIAL_CROSS_GRID_CONVERGENCE_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_v2_radial_cross_grid_convergence/v1"
)
CANDIDATE_ID: Final[str] = (
    "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1"
)

BRANCH_SELECTION_RAW_SOURCE_PATH: Final[str] = (
    "shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts"
)
BRANCH_SELECTION_RAW_SOURCE_SHA256: Final[str] = (
    "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82"
)
BRANCH_SELECTION_RAW_SOURCE_SIZE_BYTES: Final[int] = 44_912
BRANCH_SELECTION_SEMANTIC_SHA256_DOMAIN: Final[str] = (
    "nhm2-spherical-boson-star-v2-branch-selection-numerics/v1\n"
)
BRANCH_SELECTION_SEMANTIC_SHA256: Final[str] = (
    "221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa"
)
BRANCH_SELECTION_PLAIN_CANONICAL_SHA256: Final[str] = (
    "913b9d524071c20669e8f0abfd838ef6daa7b2e17b1bd5775a1fafc1e2282962"
)
BRANCH_SELECTION_CANONICAL_SIZE_BYTES: Final[int] = 41_280

BINARY64_ENVIRONMENT_SOURCE_PATH: Final[str] = (
    "tools/nhm2-spherical-boson-star-branch/binary64_environment.py"
)
BINARY64_ENVIRONMENT_SOURCE_SHA256: Final[str] = (
    "ec973351fa34efd1c76b3358e6b87da91688a06a648e5299d0aa800767e11a47"
)
BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES: Final[int] = 12_642
LOBATTO_GRID_SOURCE_PATH: Final[str] = (
    "tools/nhm2-spherical-boson-star-branch/radial_lobatto_grid.py"
)
LOBATTO_GRID_SOURCE_SHA256: Final[str] = (
    "ea424885abed4788d989cd228b7c4dd7b8907909bd4a0931b2e009d021d4d385"
)
LOBATTO_GRID_SOURCE_SIZE_BYTES: Final[int] = 6_704
LOBATTO_GRID_GENERATOR_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_1s_compactified_lobatto_grid/v1"
)
LOBATTO_RHO_MPFR_PRECISION_BITS: Final[int] = 256
LOBATTO_RHO_SNAPSHOT_OPERATION_GRAPH: Final[str] = (
    "endpoints_literal_positive_zero_and_one;interior_per_node_"
    "rho=get_d_RNDN(div_RNDN(sub_RNDN(1,cos_RNDN(div_RNDN("
    "mul_RNDN(const_pi_RNDN,set_ui(i)),set_ui(N-1)))),2))"
)

LEVEL_NODE_COUNTS: Final[tuple[int, ...]] = (64, 96, 128, 256)
LEVEL_IDS: Final[tuple[str, ...]] = ("L0", "L1", "L2", "L3")
PAIR_IDS: Final[tuple[str, ...]] = (
    "64_to_96",
    "96_to_128",
    "128_to_256",
)
PROJECTED_FIELDS: Final[tuple[str, ...]] = ("F0", "F1", "varphi")
COMPONENT_ORDER: Final[tuple[str, ...]] = ("F0", "F1", "varphi", "w")
PACKED_STATE_ORDER: Final[tuple[str, ...]] = (
    "F0_nodes_ascending_rho",
    "F1_nodes_ascending_rho",
    "varphi_nodes_ascending_rho",
    "w",
)

PROJECTION_OPERATION_GRAPH: Final[str] = (
    "second_form_chebyshev_lobatto_barycentric;"
    "b_j=(-1)^j*(one_half_at_endpoints_else_one);"
    "exact_binary64_node_hit_copies_source;"
    "nonhit_terms_created_j_ascending;"
    "maximum_abs_term_selected_with_exact_ties_retaining_lowest_j;"
    "each_term_divided_by_that_maximum_before_math_fsum;"
    "numerator=math_fsum_j_ascending(scaled_term_j*value_j);"
    "denominator=math_fsum_j_ascending(scaled_term_j);"
    "quotient_binary64;output_zero_canonicalized_positive"
)
ERROR_OPERATION_GRAPH: Final[str] = (
    "components_in_F0_F1_varphi_w_order;fine_nodes_ascending;"
    "difference=abs(fine-projected);"
    "normalizer=absolute+relative*max(abs(fine),abs(projected));"
    "normalized=difference/normalizer;"
    "Linf_maximum_exact_ties_retain_lowest_ordinal;"
    "w_compared_directly_without_projection;pair_pass_iff_overall_E<=1;"
    "all_three_pairs_evaluated_in_frozen_order_and_first_failure_preserved"
)

_RHO_SNAPSHOT_DOMAIN: Final[bytes] = (
    b"nhm2-radial-lobatto-rho-binary64-snapshot/v1\n"
)
_LEVEL_STATE_DOMAIN: Final[bytes] = (
    b"nhm2-radial-cross-grid-level-state-binary64/v1\n"
)
_PACKED_STATE_DOMAIN: Final[bytes] = (
    b"nhm2-radial-cross-grid-packed-state-binary64/v1\n"
)
_COMBINED_INPUT_DOMAIN: Final[bytes] = (
    b"nhm2-radial-cross-grid-four-level-input/v1\n"
)
_PROJECTION_GEOMETRY_DOMAIN: Final[bytes] = (
    b"nhm2-radial-cross-grid-projection-geometry/v1\n"
)
_PROJECTED_STATE_DOMAIN: Final[bytes] = (
    b"nhm2-radial-cross-grid-projected-state/v1\n"
)
_RECEIPT_DOMAIN: Final[bytes] = b"nhm2-radial-cross-grid-receipt/v1\n"


@dataclass(frozen=True, slots=True)
class SourceByteBinding:
    role: str
    relative_path: str
    sha256: str
    size_bytes: int


@dataclass(frozen=True, slots=True)
class BranchSelectionContractBinding:
    raw_source: SourceByteBinding
    semantic_sha256_domain: str
    semantic_sha256: str
    plain_canonical_sha256: str
    canonical_size_bytes: int


SOURCE_BYTE_BINDINGS: Final[tuple[SourceByteBinding, ...]] = (
    SourceByteBinding(
        role="branch_selection_policy_raw_source",
        relative_path=BRANCH_SELECTION_RAW_SOURCE_PATH,
        sha256=BRANCH_SELECTION_RAW_SOURCE_SHA256,
        size_bytes=BRANCH_SELECTION_RAW_SOURCE_SIZE_BYTES,
    ),
    SourceByteBinding(
        role="binary64_environment_boundary",
        relative_path=BINARY64_ENVIRONMENT_SOURCE_PATH,
        sha256=BINARY64_ENVIRONMENT_SOURCE_SHA256,
        size_bytes=BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
    ),
    SourceByteBinding(
        role="mpfr256_lobatto_grid_snapshot_producer",
        relative_path=LOBATTO_GRID_SOURCE_PATH,
        sha256=LOBATTO_GRID_SOURCE_SHA256,
        size_bytes=LOBATTO_GRID_SOURCE_SIZE_BYTES,
    ),
)
BRANCH_SELECTION_CONTRACT_BINDING: Final[BranchSelectionContractBinding] = (
    BranchSelectionContractBinding(
        raw_source=SOURCE_BYTE_BINDINGS[0],
        semantic_sha256_domain=BRANCH_SELECTION_SEMANTIC_SHA256_DOMAIN,
        semantic_sha256=BRANCH_SELECTION_SEMANTIC_SHA256,
        plain_canonical_sha256=BRANCH_SELECTION_PLAIN_CANONICAL_SHA256,
        canonical_size_bytes=BRANCH_SELECTION_CANONICAL_SIZE_BYTES,
    )
)

_MODULE_DIRECTORY = Path(__file__).resolve().parent
_REPOSITORY_ROOT = _MODULE_DIRECTORY.parents[1]
_BINARY64_ENVIRONMENT_PATH = _REPOSITORY_ROOT.joinpath(
    *BINARY64_ENVIRONMENT_SOURCE_PATH.split("/")
)


def _assert_bound_source_bytes() -> None:
    for ordinal, binding in enumerate(SOURCE_BYTE_BINDINGS):
        path = _REPOSITORY_ROOT.joinpath(*binding.relative_path.split("/"))
        try:
            payload = path.read_bytes()
        except OSError as error:
            raise RuntimeError(
                f"cross_grid_bound_source_read_failed:{ordinal}"
            ) from error
        observed_hash = hashlib.sha256(payload).hexdigest()
        if (
            len(payload) != binding.size_bytes
            or observed_hash != binding.sha256
        ):
            raise RuntimeError(
                "cross_grid_bound_source_pin_mismatch:"
                f"{ordinal}:{observed_hash}/{len(payload)}"
            )


_assert_bound_source_bytes()

# Import only the already byte-pinned arithmetic environment.  The Lobatto
# generator is deliberately not imported or executed: its authenticated rho
# snapshots are embedded below, and no solver-adjacent import is needed.
_BINARY64_ENVIRONMENT_MODULE_NAME = (
    "_nhm2_cross_grid_binary64_environment_v2"
)
_binary64_environment_spec = importlib.util.spec_from_file_location(
    _BINARY64_ENVIRONMENT_MODULE_NAME,
    _BINARY64_ENVIRONMENT_PATH,
)
if (
    _binary64_environment_spec is None
    or _binary64_environment_spec.loader is None
):
    raise RuntimeError("cross_grid_binary64_environment_import_spec_invalid")
_binary64_environment_module = importlib.util.module_from_spec(
    _binary64_environment_spec
)
try:
    _binary64_environment_spec.loader.exec_module(
        _binary64_environment_module
    )
except BaseException as error:
    raise RuntimeError(
        "cross_grid_binary64_environment_import_execution_failed"
    ) from error

BINARY64_ENVIRONMENT_VERSION = (
    _binary64_environment_module.BINARY64_ENVIRONMENT_VERSION
)
BINARY64_ROUNDING_MODE = _binary64_environment_module.BINARY64_ROUNDING_MODE
BINARY64_RUNTIME_FAMILY = _binary64_environment_module.BINARY64_RUNTIME_FAMILY
OBSERVED_GLIBC_VERSION = _binary64_environment_module.OBSERVED_GLIBC_VERSION
nearest_binary64 = _binary64_environment_module.nearest_binary64
if (
    type(_binary64_environment_module.__file__) is not str
    or Path(_binary64_environment_module.__file__).resolve()
    != _BINARY64_ENVIRONMENT_PATH
    or BINARY64_ENVIRONMENT_VERSION
    != "nhm2_spherical_boson_star_binary64_environment/v2"
    or BINARY64_ROUNDING_MODE != "round_to_nearest_ties_to_even"
    or nearest_binary64.__module__ != _BINARY64_ENVIRONMENT_MODULE_NAME
):
    raise RuntimeError("cross_grid_binary64_environment_import_identity_mismatch")


@dataclass(frozen=True, slots=True)
class ComponentTolerance:
    component: str
    absolute: float
    relative: float
    absolute_exact: str
    relative_exact: str
    absolute_binary64_word: str
    relative_binary64_word: str


COMPONENT_TOLERANCES: Final[tuple[ComponentTolerance, ...]] = (
    ComponentTolerance(
        "F0",
        2.0**-36,
        2.0**-24,
        "2^-36",
        "2^-24",
        "3db0000000000000",
        "3e70000000000000",
    ),
    ComponentTolerance(
        "F1",
        2.0**-36,
        2.0**-24,
        "2^-36",
        "2^-24",
        "3db0000000000000",
        "3e70000000000000",
    ),
    ComponentTolerance(
        "varphi",
        2.0**-40,
        2.0**-24,
        "2^-40",
        "2^-24",
        "3d70000000000000",
        "3e70000000000000",
    ),
    ComponentTolerance(
        "w",
        2.0**-40,
        2.0**-32,
        "2^-40",
        "2^-32",
        "3d70000000000000",
        "3df0000000000000",
    ),
)


# Big-endian binary64 words generated once by the exact pinned MPFR256 Lobatto
# node operation graph.  Import-time SHA checks below authenticate every word.
_AUTHENTICATED_RHO_HEX = MappingProxyType(
    {
        64: (
            "00000000000000003f445dd9ad82558b3f645a9c14ac5a803f76dfdd20b0f9b3"
            "3f844da9d101957c3f8faa34316612443f96bf29446733a83f9ee09bdadd2e46"
            "3fa41a228df9817e3fa95a1ab1a51c793faf2cdef7bbb3413fb2c75d48b51aee"
            "3fb63dceced016313fb9f78fdf7314893fbdf24174c2bf1b3fc115ad9a0e0936"
            "3fc35016855d43063fc5a6f071d2e3463fc818be3ae8245d3fcaa3f194a04bee"
            "3fcd46ec09084afd3fd00000000000003fd166b8e8529bac3fd2d6bc6dd932be"
            "3fd44f20570eb1b83fd5cef5159e9b093fd755465edc8f0f3fd8e11bc73f6e9f"
            "3fda7179607d231e3fdc056059e26b0e3fdd9bcfa2809e033fdf33c48cca2fad"
            "3fe0661db99ae82a3fe132182ebfb0ff3fe1fd4fd30eca793fe2c7434fc16e71"
            "3fe38f721c6048b03fe4555cd091b8793fe518857530b27b3fe5d86fd478a724"
            "3fe694a1c91366a13fe74ca38bd6b22a3fe80000000000003fe8ae44fdbded41"
            "3fe957039ad7ed053fe9f9d07145f6e93fea9643e38b472f3feb2bfa5ea8af3e"
            "3febba94997c7db23fec41b7d167a81d3fecc10e04119d6f3fed38462625fd3a"
            "3feda71456e95ca23fee0d32108444cc3fee6a5e54e5ae383feebe5dd72067e8"
            "3fef08fb2129168e3fef4a06b5dcc6633fef81572f3a67b73fefaec958bbf9aa"
            "3fefd24045be9e0d3fefeba563eb53a63feffae889949f6b3ff0000000000000"
        ),
        96: (
            "00000000000000003f31ea68eb86c9373f51e927f2f387be3f6423f34c2aaf06"
            "3f71e424c4537c713f7bee9adec353633f84174633a809413f8b5045c1f8ae09"
            "3f91d023411a1b403f96827a61021dbf3f9bbdd7adce41ea3fa0c0621c8aa410"
            "3fa3e4d190efb0033fa74b59041d12e13faaf304c5a5d7c03faedacee8e0b038"
            "3fb180cfc71d14063fb3b32698c68e4b3fb603ce7eb5c4c83fb8722191a02d61"
            "3fbafd719c18cb733fbda5084b5471b53fc03413b119c4e53fc1a30477418c02"
            "3fc31eefc033097d3fc4a76b31ebc6023fc63c08ee1ac7bc3fc7dc57b0e208c9"
            "3fc987e2f08b58083fcb3e32fe27c40f3fccfecd27106e6d3fcec933d73f6659"
            "3fd04e735e3b76ad3fd13cb17516a75d3fd22f117f199dcb3fd3254fa305348b"
            "3fd41f26f270fe883fd51c517d17136a3fd61c8864680b583fd71f83ef61aef2"
            "3fd824fb9ea2cdf13fd92ca640b69d8b3fda363a0691f04c3fdb416c983c8b0c"
            "3fdc4df329a0ce663fdd5b828f7be1413fde69cf54687ffc3fdf788dcdfe8c3f"
            "3fe043b91900b9e03fe0cb1855cbc0023fe1523eb8420f5f3fe1d9066b2f98cd"
            "3fe25f49b3e1ba7a3fe2e4e2fcb707da3fe369acdfa4b13b3fe3ed8230ae9908"
            "3fe4703e084f28873fe4f1bbcdcbfa543fe571d74174764b3fe5f06c86c780bc"
            "3fe66d582e7d65ba3fe6e8774073311b3fe761a74574ac523fe7d8c650e244a9"
            "3fe84db30a30266a3fe8c04cb63be4653fe9307340760efc3fe99e0743dd29fe"
            "3fea08ea13c77dce3fea70fdc4794e113fead62533850e7f3feb38440ff33da1"
            "3feb973ee22f9cff3febf2fb13b98ec73fec4b5ef69571c93feca051cc7ce692"
            "3fecf1bbcdcbfa543fed3f86302947673fed899b2ce72e373fedcfe6071c5d7f"
            "3fee12531171f4fc3fee50cfb3a5a2843fee8b4a6fbe2ed23feec1b2e6f10500"
            "3feef3f9de3755bf3fef221142918df13fef4bec2cf7ef123fef717ee5f72f26"
            "3fef92bee8f81d483fefafa2e7315fdb3fefc822ca4279593fefdc37b6775907"
            "3fefebdc0cb3d5513feff70b6c06863c3feffdc2b2e28f273ff0000000000000"
        ),
        128: (
            "00000000000000003f240cde17ab38b33f440c1515fe95e03f568c1ee558f343"
            "3f6408f14e43beb83f6f4a4b83825a0c3f76842d5d540bcc3f7ea07befd55faf"
            "3f83fc661e2227443f8945d3c2cb3d1a3f8f2bb2e4b59b113f92d68b809da195"
            "3f96647d9ca660223f9a3f213d271d043f9e65dbd55f82d73fa16c0376a92d31"
            "3fa3ca781dec83213fa64dece1486e913fa8f5fcf5cf01543fabc23dd49f8ad4"
            "3faeb23f4b9660a33fb0e2c5c76ffdb83fb27dd3a5b653ca3fb42a08dd20f2a2"
            "3fb5e7225a5338eb3fb7b4da6492e88b3fb992e8a8b406063fbb8102446d1ca8"
            "3fbd7ed9d21221253fbf8c1f74b41c4b3fc0d4407251dbd23fc1e9d4be2a5b2d"
            "3fc306a122d02abd3fc42a7903b240033fc5552ea9beda353fc686934a8cb581"
            "3fc7be770faf5faa3fc8fca91e3588153fca40f79e501ec63fcb8b2fc3210f76"
            "3fccdb1dd2b05f9c3fce308d2e06705c3fcf8b48596a1f6f3fd0758c8260be3a"
            "3fd127e40a09e15e3fd1dc8ed415a1343fd2937093aaef583fd34c6ca3216124"
            "3fd40766087df3463fd4c43f79fd02a63fd582db62a8c4ba3fd6431be6fb8734"
            "3fd704e2e98cfd4d3fd7c8120fc9df0e3fd88c8ac6b51d823fd9522e47b1ed0e"
            "3fda18dd9d55e5fb3fdae079a84279cc3fdba8e32404faf93fdc71faabfc7381"
            "3fdd3ba0c04485fb3fde05b5caa493ea3fded01a238263753fdf9aae16d77e28"
            "3fe032a8f49440ec3fe097f2ee3ece463fe0fd251aadb60b3fe1622f9fddbd02"
            "3fe1c702aa01c6403fe22b8e6dfd82843fe28fc32bdec31a3fe2f39131550d03"
            "3fe356e8dc2709793fe3b9ba9ca5713f3fe41bf6f81b10793fe47d8e8b39815a"
            "3fe4de720c823c663fe53e924eab9da33fe59de043017ead3fe5fc4cfbc1065d"
            "3fe659c9ae6f4f6e3fe6b647b62a88543fe711b895f52f663fe76c0dfafb0f51"
            "3fe7c539becfa0e33fe81d2de9a578243fe873dcb47e63e93fe8c9388b53e819"
            "3fe91d340f37bc223fe96fc2186bf84e3fe9c0d5b8729dfb3fea10623c142815"
            "3fea5e5b2d5cd2a03feaaab4559049733feaf561bf136fff3feb3e57b74bf551"
            "3feb858ad07569353febcaefe36b890b3fec0e7c11697c773fec5024c5bdbbdb"
            "3fec8fdfb7725c6b3feccda2eae97f3f3fed0964b36da2ef3fed431bb4b598e3"
            "3fed7abee45be1ac3fedb0458b4935873fede3a7471200493fee14dc0b4699f6"
            "3fee43dc22b607533fee70a030a30feb3fee9b2131eb79173feec3587e2137ce"
            "3feee93fc8956d2d3fef0cd1215503e93fef2e06f616c7183fef4cdc131accff"
            "3fef694ba3fb12f33fef8351346d29943fef9ae8b0f4d30c3fefb00e67877763"
            "3fefc2bf082055413fefd2f7a54557e83fefe0b5b47c7da63fefebf70eb1bc41"
            "3feff4b9f08d53863feffafcfaba805b3feffebf321e854c3ff0000000000000"
        ),
        256: (
            "00000000000000003f03e4e24cb28f613f23e4b0d3eb26fc3f3660ea2ce8b4a4"
            "3f43e3eaf4a5b2b83f4f133742ec12783f565ef55ff884c03f5e71bebcfe908f"
            "3f63e0d3b51006833f6927296343a2c03f6f0babf14528663f72c71060efb7c8"
            "3f7657238a6213373f7a35ec0487f3373f7e634350059e103f816f7ff00a21a2"
            "3f83d47a8e0fa3fb3f866079b0bff00f3f89136402ab71953f8bed1eab4264e8"
            "3f8eed8d4fdfe0a63f910a490a71efdb3f92b106cf6e205c3f946aef89de57a9"
            "3f9637f20e12b5a63f9817fc725c70563f9a0afc0fc001d63f9c10dd82aeb148"
            "3f9e298cabc76f8a3fa02a7a584f80183fa1497ffe47b3793fa271cc20c748cd"
            "3fa3a3533c861afd3fa4de09726b6db23fa621e2880403563fa76ed1e7fbbfcc"
            "3fa8c4caa29ad31e3faa23bf6e4667443fab8ba2a804cc0e3facfc6654051bff"
            "3fae75fc1e2a54de3faff8555a99de983fb0c1b18326bd6d3fb18b8ae3d44be8"
            "3fb259aef788800e3fb32c15bbc5711a3fb402b703ac14863fb4dd8a784d8fe6"
            "3fb5bc8798fe2d2e3fb69fa5bba9ee1f3fb786dc0d2abb953fb8722191a02d61"
            "3fb9616d24c8e73d3fba54b57a5d876a3fbb4bf11e6d23673fbc471675bb4f36"
            "3fbd461bbe1fab733fbe48f70ee6f6a13fbf4f9e59359dcc3fc02d03b435e460"
            "3fc0b413f1456ef83fc13cfaa44e3d003fc1c7b27b8d6b963fc25436132d5019"
            "3fc2e27ff57b15723fc3728a9b1d0b0b3fc404506b49a3573fc497cbbbff1fd5"
            "3fc52cf6d23be8503fc5c3cbe2378b443fc65c450f9c65173fc6f65c6dc1ec00"
            "3fc7920bffe79e483fc82f4db97090a23fc8ce1b7e1f9a493fc96e6f22541c8a"
            "3fca10426b4763643fcab38f0f4a9cd13fcb584eb60564603fcbfe7af8b4e09b"
            "3fcca60d626b6fe03fcd4eff7050e21a3fcdf94a91e33cee3fcea4e8293807cf"
            "3fcf51d18b3e1d6f3fd00000000000003fd057b6617356dd3fd0b008817e797d"
            "3fd108f2f1999bb63fd162723d51e1cc3fd1bc82ea6bbe193fd2172179058837"
            "3fd2724a63ba4c613fd2cdfa1fc4d1a43fd32a2d1d22d5943fd386dfc6b87c0c"
            "3fd3e40e8273f1bb3fd441b5b1713ffc3fd49fd1b01e50a93fd4fe5ed65f2078"
            "3fd55d5977b21e823fd5bcbde354b77e3fd61c8864680b583fd67cb54215cba2"
            "3fd6dd40bfb5417c3fd73e271cf079803fd79f6495e994453fd800f5636039f9"
            "3fd862d5bad72faf3fd8c501ceba0cda3fd92775ce830f8a3fd98a2de6e10ded"
            "3fd9ed2641dd83a23fda505b0702b9503fdab3c85b8205263fdb176a625a22a2"
            "3fdb7b3d3c7da0403fdbdf3d08f961853fdc4365e51b33e73fdca7b3ec987512"
            "3fdd0c2339b4c9143fdd70afe568dedc3fddd5560789419d3fde3a11b6ed3588"
            "3fde9edf09959e5e3fdf03ba14d3ee553fdf689eed711bcf3fdfcd89a7d49c61"
            "3fe0193b2c15b1cf3fe04bb0894772183fe07e22f59608d53fe0b0907b3530d1"
            "3fe0e2f72489653c3fe11554fc3b5f313fe147a80d4b90923fe179ee63259b76"
            "3fe1ac2609b3c5773fe1de4d0d72660d3fe210617b834f3d3fe2426161c12fe0"
            "3fe2744aced2eeaf3fe2a61bd23efd6d3fe2d7d27c7ea3583fe3096cdf113e2f"
            "3fe33ae90c8f79093fe36c4518be783b3fe39d7f18a2f9933fe3ce9522946828"
            "3fe3ff854e4fe3033fe4304db50b35de3fe460ec7187c3403fe4915fa0255f42"
            "3fe4c1a55ef51a2f3fe4f1bbcdcbfa543fe521a10e55a4413fe551534426f0bf"
            "3fe580d094d06fc43fe5b01727f0d7ab3fe5df25274760023fe60df8bec60723"
            "3fe63c901ca3c1fa3fe66ae9716e95363fe69902f01d972e3fe6c6dace22d9d0"
            "3fe6f46f437d3be43fe721be8aca20f33fe74ec6e1570f1a3fe77b8687333225"
            "3fe7a7fbbf40c3413fe7d424cf4654913fe80000000000003fe82b8b9d3078a4"
            "3fe856c5f5b1fe0c3fe881ad5b8730c43fe8ac4023ebc77a3fe8d67ca7652408"
            "3fe9006141d2c7d93fe929ec527ea6e83fe9531c3c2d58cc3fe97bef652e2727"
            "3fe9a464376af8dd3fe9cc792078196e3fe9f42c91a3dbd83fea1b7d0006186e"
            "3fea4268e48f85003fea68eebc18e6ba3fea8f0d07721d2f3feab4c24b7105ec"
            "3feada0d1100380b3feafeebe52d972a3feb235d5938bd3d3feb476002a13aa3"
            "3feb6af27b34abfa3feb8e13611ca51a3febb0c156ec70c03febd2fb03aea442"
            "3febf4bf12f286e83fec160c34d94c473fec36e11e23212c3fec573c883c0a92"
            "3fec771d314896193fec9681dc325b933fecb56950b44f133fecd3d25b66e318"
            "3fecf1bbcdcbfa543fed0f247e5aa88d3fed2c0b488ac23c3fed486f0ce03a5a"
            "3fed644eb0f64e033fed7fa91f8a7d6f3fed9a7d488751dd3fedb4ca210eeffe"
            "3fedce8ea38576833fede7c9cf9b28523fee007aaa5662173fee18a03e1d5ab2"
            "3fee30399abfae403fee4745d57fb33f3fee5dc4091b998c3fee73b355d652ce"
            "3fee8912e18044033fee9de1d77fbfcb3feeb21f68d949253feec5cacc379e50"
            "3feed8e33df38b733feeeb68001b84c83feefd585a7b07ff3fef0eb39aa1c484"
            "3fef1f7913ea8a763fef2fa81f81fff13fef3f401c6d1c7d3fef4e406f8f6a53"
            "3fef5ca883b10d433fef6a77c9848efd3fef77adb7ac70813fef8449cac0807d"
            "3fef904b8552f66c3fef9bb26ff5523a3fefa67e193d00403fefb0ae15c7c170"
            "3fefba42003fd7793fefc339795ff4c43fefcb9427f6f01a3fefd351b8eb3bda"
            "3fefda71df3e20903fefe0f4540ebad83fefe6d8d69cbc5d3fefec1f2c4aeff9"
            "3feff0c720a180b83feff4d0855003be3feff83b322f44fb3feffb070542d693"
            "3feffd33e2ba62e93feffec1b4f2c14e3fefffb06c76cd363ff0000000000000"
        ),
    }
)

_EXPECTED_RHO_SNAPSHOT_SHA256 = MappingProxyType(
    {
        64: "d23d0163fd585a960572b78e44fbd09e66b073de71015cf1c56bb56e8c3ef65f",
        96: "fc1f48f84af4153e53d5b7297f5f86d923aa2b0fc604a21e23e058c75f73919a",
        128: "fc2db55f9a24286758f73937f09a216335e042679682d08c74a2610461abbbe0",
        256: "94393bd4b9991020887813a197b7aa1417a6aa174af4070ac3b8e2ac2bc9426a",
    }
)


def _float_word(value: float) -> str:
    return struct.pack(">d", value).hex()


def _same_binary64(left: float, right: float) -> bool:
    return struct.pack(">d", left) == struct.pack(">d", right)


def _positive_zero(value: float) -> float:
    return 0.0 if value == 0.0 else value


def _snapshot_sha256(node_count: int, bits: bytes) -> str:
    digest = hashlib.sha256()
    digest.update(_RHO_SNAPSHOT_DOMAIN)
    digest.update(struct.pack(">I", node_count))
    digest.update(bits)
    return digest.hexdigest()


def _decode_and_validate_rho_snapshots() -> MappingProxyType:
    snapshots: dict[int, tuple[float, ...]] = {}
    if tuple(_AUTHENTICATED_RHO_HEX) != LEVEL_NODE_COUNTS:
        raise RuntimeError("cross_grid_rho_snapshot_level_set_mismatch")
    for node_count in LEVEL_NODE_COUNTS:
        try:
            bits = bytes.fromhex(_AUTHENTICATED_RHO_HEX[node_count])
        except ValueError as error:
            raise RuntimeError("cross_grid_rho_snapshot_hex_invalid") from error
        if len(bits) != 8 * node_count:
            raise RuntimeError("cross_grid_rho_snapshot_size_mismatch")
        observed_hash = _snapshot_sha256(node_count, bits)
        if observed_hash != _EXPECTED_RHO_SNAPSHOT_SHA256[node_count]:
            raise RuntimeError(
                f"cross_grid_rho_snapshot_hash_mismatch:{node_count}"
            )
        values = tuple(value[0] for value in struct.iter_unpack(">d", bits))
        if (
            not _same_binary64(values[0], 0.0)
            or not _same_binary64(values[-1], 1.0)
            or any(
                not values[index] > values[index - 1]
                for index in range(1, node_count)
            )
        ):
            raise RuntimeError(
                f"cross_grid_rho_snapshot_order_mismatch:{node_count}"
            )
        snapshots[node_count] = values
    return MappingProxyType(snapshots)


_AUTHENTICATED_RHO = _decode_and_validate_rho_snapshots()


def authenticated_lobatto_rho_snapshot(node_count: int) -> tuple[float, ...]:
    """Return one immutable authenticated rho-bit snapshot, never a grid solve."""

    if type(node_count) is not int or node_count not in LEVEL_NODE_COUNTS:
        raise ValueError("node_count must be exactly one of 64,96,128,256")
    return _AUTHENTICATED_RHO[node_count]


@dataclass(frozen=True, slots=True)
class FrozenRadialLevelState:
    """Untrusted caller data container; exact validation occurs on evaluation."""

    rho: tuple[float, ...]
    F0: tuple[float, ...]
    F1: tuple[float, ...]
    varphi: tuple[float, ...]
    w: float


@dataclass(frozen=True, slots=True)
class LevelInputReceipt:
    level_id: str
    node_count: int
    rho_snapshot_sha256: str
    packed_state_sha256: str
    complete_level_sha256: str


@dataclass(frozen=True, slots=True)
class ComponentConvergenceResult:
    component: str
    absolute_tolerance_exact: str
    relative_tolerance_exact: str
    absolute_tolerance_binary64_word: str
    relative_tolerance_binary64_word: str
    normalized_linf: float
    normalized_linf_binary64_word: str
    maximum_ordinal: int | None
    absolute_difference_at_maximum: float
    absolute_difference_binary64_word: str
    normalizer_at_maximum: float
    normalizer_binary64_word: str
    fine_value_at_maximum_binary64_word: str
    comparison_value_at_maximum_binary64_word: str
    passed: bool


@dataclass(frozen=True, slots=True)
class PairConvergenceResult:
    pair_index: int
    pair_id: str
    coarse_node_count: int
    fine_node_count: int
    projection_exact_hit_count: int
    projection_interpolated_count: int
    projection_geometry_sha256: str
    projected_fields_sha256: str
    components: tuple[ComponentConvergenceResult, ...]
    overall_normalized_linf: float
    overall_normalized_linf_binary64_word: str
    maximum_component_ordinal: int
    maximum_component: str
    passed: bool
    first_failing_component: str | None


@dataclass(frozen=True, slots=True)
class RadialCrossGridConvergenceReceipt:
    candidate_id: str
    operation_version: str
    branch_selection_binding: BranchSelectionContractBinding
    dependency_source_bindings: tuple[SourceByteBinding, ...]
    binary64_environment_version: str
    binary64_rounding_mode: str
    binary64_runtime_family: str
    observed_glibc_version: str | None
    rho_snapshot_generator_version: str
    rho_snapshot_mpfr_precision_bits: int
    rho_snapshot_operation_graph: str
    state_packing_order: tuple[str, ...]
    projected_fields: tuple[str, ...]
    component_order: tuple[str, ...]
    pair_order: tuple[str, ...]
    projection_operation_graph: str
    error_operation_graph: str
    level_inputs: tuple[LevelInputReceipt, ...]
    combined_input_sha256: str
    pairs: tuple[PairConvergenceResult, ...]
    overall_normalized_linf: float
    overall_normalized_linf_binary64_word: str
    maximum_pair_index: int
    maximum_pair_id: str
    all_pairs_within_tolerance: bool
    first_failing_pair_index: int | None
    first_failing_pair_id: str | None
    diagnostic_disposition: str
    calculation_receipt_sha256: str
    calculation_implemented: bool = field(default=True, init=False)
    bounded_four_level_three_pair_receipt: bool = field(default=True, init=False)
    all_three_pairs_evaluated: bool = field(default=True, init=False)
    first_failure_preserved: bool = field(default=True, init=False)
    only_F0_F1_varphi_interpolated: bool = field(default=True, init=False)
    w_compared_directly_without_projection: bool = field(default=True, init=False)
    coarse_state_used_as_predictor: bool = field(default=False, init=False)
    retry_allowed: bool = field(default=False, init=False)
    retune_allowed: bool = field(default=False, init=False)
    tolerance_change_allowed: bool = field(default=False, init=False)
    alternate_grid_allowed: bool = field(default=False, init=False)
    alternate_initializer_allowed: bool = field(default=False, init=False)
    declared_lever_tensor_read: bool = field(default=False, init=False)
    candidate_instance_ready: bool = field(default=False, init=False)
    candidate_admissible: bool = field(default=False, init=False)
    execution_authorized: bool = field(default=False, init=False)
    candidate_execution_authority: bool = field(default=False, init=False)
    execution_observed: bool = field(default=False, init=False)
    primary_replay_ready: bool = field(default=False, init=False)
    independent_replay_ready: bool = field(default=False, init=False)
    replay_authority: bool = field(default=False, init=False)
    pair_agreement_authority: bool = field(default=False, init=False)
    diagnostic_pass_authority: bool = field(default=False, init=False)
    stress_noise_lamp: bool = field(default=False, init=False)
    constraint_algebra_lamp: bool = field(default=False, init=False)
    theory_graph_lamp: bool = field(default=False, init=False)
    theory_graph_authority: bool = field(default=False, init=False)
    output_written: bool = field(default=False, init=False)
    registry_promoted: bool = field(default=False, init=False)
    physical_authority: bool = field(default=False, init=False)
    physical_viability: bool = field(default=False, init=False)
    propulsion_authority: bool = field(default=False, init=False)
    transport_authority: bool = field(default=False, init=False)


@dataclass(frozen=True, slots=True)
class _ValidatedLevel:
    level_id: str
    node_count: int
    rho: tuple[float, ...]
    F0: tuple[float, ...]
    F1: tuple[float, ...]
    varphi: tuple[float, ...]
    w: float
    receipt: LevelInputReceipt


@dataclass(frozen=True, slots=True)
class _ProjectionInstruction:
    exact_source_ordinal: int | None
    scale_ordinal: int | None
    scaled_terms: tuple[float, ...]
    denominator: float | None


def _assert_policy_literals() -> None:
    if (
        LEVEL_NODE_COUNTS != (64, 96, 128, 256)
        or LEVEL_IDS != ("L0", "L1", "L2", "L3")
        or PAIR_IDS != ("64_to_96", "96_to_128", "128_to_256")
        or PROJECTED_FIELDS != ("F0", "F1", "varphi")
        or COMPONENT_ORDER != ("F0", "F1", "varphi", "w")
        or PACKED_STATE_ORDER
        != (
            "F0_nodes_ascending_rho",
            "F1_nodes_ascending_rho",
            "varphi_nodes_ascending_rho",
            "w",
        )
        or tuple(policy.component for policy in COMPONENT_TOLERANCES)
        != COMPONENT_ORDER
    ):
        raise RuntimeError("cross_grid_frozen_policy_literal_mismatch")
    for policy in COMPONENT_TOLERANCES:
        if (
            _float_word(policy.absolute) != policy.absolute_binary64_word
            or _float_word(policy.relative) != policy.relative_binary64_word
        ):
            raise RuntimeError(
                f"cross_grid_tolerance_word_mismatch:{policy.component}"
            )


def _validated_float_tuple(
    value: object, *, name: str, expected_length: int
) -> tuple[float, ...]:
    if type(value) is not tuple or len(value) != expected_length:
        raise ValueError(f"{name} must be an exact tuple of length {expected_length}")
    output = value
    for index, entry in enumerate(output):
        if type(entry) is not float or not math.isfinite(entry):
            raise ValueError(f"{name}[{index}] must be an exact finite float")
        if entry == 0.0 and not _same_binary64(entry, 0.0):
            raise ValueError(f"{name}[{index}] must canonicalize zero as +0")
    return output


def _hash_packed_state(
    node_count: int,
    F0: tuple[float, ...],
    F1: tuple[float, ...],
    varphi: tuple[float, ...],
    w: float,
) -> tuple[str, bytes]:
    packed = b"".join(
        struct.pack(">d", value)
        for values in (F0, F1, varphi)
        for value in values
    ) + struct.pack(">d", w)
    digest = hashlib.sha256()
    digest.update(_PACKED_STATE_DOMAIN)
    digest.update(struct.pack(">I", node_count))
    digest.update(packed)
    return digest.hexdigest(), packed


def _validate_level(
    state: FrozenRadialLevelState, *, level_id: str, node_count: int
) -> _ValidatedLevel:
    rho = _validated_float_tuple(
        state.rho, name=f"{level_id}.rho", expected_length=node_count
    )
    F0 = _validated_float_tuple(
        state.F0, name=f"{level_id}.F0", expected_length=node_count
    )
    F1 = _validated_float_tuple(
        state.F1, name=f"{level_id}.F1", expected_length=node_count
    )
    varphi = _validated_float_tuple(
        state.varphi, name=f"{level_id}.varphi", expected_length=node_count
    )
    w = state.w
    if type(w) is not float or not math.isfinite(w):
        raise ValueError(f"{level_id}.w must be an exact finite float")
    if w == 0.0 and not _same_binary64(w, 0.0):
        raise ValueError(f"{level_id}.w must canonicalize zero as +0")

    rho_bits = b"".join(struct.pack(">d", value) for value in rho)
    expected_rho_bits = bytes.fromhex(_AUTHENTICATED_RHO_HEX[node_count])
    if rho_bits != expected_rho_bits:
        raise ValueError(f"{level_id}.rho does not match the authenticated grid")
    if any(not rho[index] > rho[index - 1] for index in range(1, node_count)):
        raise ValueError(f"{level_id}.rho must be strictly ascending")

    rho_hash = _snapshot_sha256(node_count, rho_bits)
    packed_hash, packed = _hash_packed_state(node_count, F0, F1, varphi, w)
    complete = hashlib.sha256()
    complete.update(_LEVEL_STATE_DOMAIN)
    complete.update(struct.pack(">I", node_count))
    complete.update(rho_bits)
    complete.update(packed)
    receipt = LevelInputReceipt(
        level_id=level_id,
        node_count=node_count,
        rho_snapshot_sha256=rho_hash,
        packed_state_sha256=packed_hash,
        complete_level_sha256=complete.hexdigest(),
    )
    return _ValidatedLevel(
        level_id=level_id,
        node_count=node_count,
        rho=rho,
        F0=F0,
        F1=F1,
        varphi=varphi,
        w=w,
        receipt=receipt,
    )


def _barycentric_weights(node_count: int) -> tuple[float, ...]:
    if type(node_count) is not int or node_count < 2:
        raise ValueError("node_count must be an exact integer at least two")
    return tuple(
        (-1.0 if index % 2 else 1.0)
        * (0.5 if index in (0, node_count - 1) else 1.0)
        for index in range(node_count)
    )


def _projection_instruction(
    coarse_rho: tuple[float, ...],
    weights: tuple[float, ...],
    target: float,
) -> _ProjectionInstruction:
    for source_ordinal, source_rho in enumerate(coarse_rho):
        if _same_binary64(source_rho, target):
            return _ProjectionInstruction(source_ordinal, None, (), None)

    terms: list[float] = []
    maximum_magnitude = -1.0
    scale_ordinal = -1
    for source_ordinal in range(len(coarse_rho)):
        difference = target - coarse_rho[source_ordinal]
        if difference == 0.0 or not math.isfinite(difference):
            raise ValueError("cross_grid_projection_difference_invalid")
        term = weights[source_ordinal] / difference
        if not math.isfinite(term):
            raise ValueError("cross_grid_projection_term_nonfinite")
        terms.append(term)
        magnitude = abs(term)
        if magnitude > maximum_magnitude:
            maximum_magnitude = magnitude
            scale_ordinal = source_ordinal
    if (
        scale_ordinal < 0
        or maximum_magnitude <= 0.0
        or not math.isfinite(maximum_magnitude)
    ):
        raise ValueError("cross_grid_projection_scale_invalid")
    scaled_terms = tuple(term / maximum_magnitude for term in terms)
    if any(not math.isfinite(term) for term in scaled_terms):
        raise ValueError("cross_grid_projection_scaled_term_nonfinite")
    try:
        denominator = math.fsum(scaled_terms)
    except (OverflowError, ValueError) as error:
        raise ValueError("cross_grid_projection_denominator_invalid") from error
    if denominator == 0.0 or not math.isfinite(denominator):
        raise ValueError("cross_grid_projection_denominator_invalid")
    return _ProjectionInstruction(
        None,
        scale_ordinal,
        scaled_terms,
        denominator,
    )


def _projection_instructions(
    coarse_rho: tuple[float, ...], fine_rho: tuple[float, ...]
) -> tuple[_ProjectionInstruction, ...]:
    weights = _barycentric_weights(len(coarse_rho))
    return tuple(
        _projection_instruction(coarse_rho, weights, target)
        for target in fine_rho
    )


def _apply_projection(
    source_values: tuple[float, ...],
    instructions: tuple[_ProjectionInstruction, ...],
) -> tuple[float, ...]:
    projected: list[float] = []
    for instruction in instructions:
        if instruction.exact_source_ordinal is not None:
            value = source_values[instruction.exact_source_ordinal]
        else:
            if instruction.denominator is None:
                raise RuntimeError("cross_grid_projection_instruction_invalid")
            products = tuple(
                instruction.scaled_terms[index] * source_values[index]
                for index in range(len(source_values))
            )
            if any(not math.isfinite(product) for product in products):
                raise ValueError("cross_grid_projection_product_nonfinite")
            try:
                numerator = math.fsum(products)
                value = numerator / instruction.denominator
            except (OverflowError, ValueError) as error:
                raise ValueError("cross_grid_projection_quotient_invalid") from error
            if not math.isfinite(value):
                raise ValueError("cross_grid_projection_quotient_nonfinite")
        projected.append(_positive_zero(value))
    return tuple(projected)


def _projection_geometry_sha256(
    coarse_node_count: int,
    fine_node_count: int,
    instructions: tuple[_ProjectionInstruction, ...],
) -> str:
    digest = hashlib.sha256()
    digest.update(_PROJECTION_GEOMETRY_DOMAIN)
    digest.update(struct.pack(">II", coarse_node_count, fine_node_count))
    for instruction in instructions:
        if instruction.exact_source_ordinal is not None:
            digest.update(b"H")
            digest.update(struct.pack(">i", instruction.exact_source_ordinal))
        else:
            if instruction.scale_ordinal is None or instruction.denominator is None:
                raise RuntimeError("cross_grid_projection_instruction_invalid")
            digest.update(b"I")
            digest.update(struct.pack(">i", instruction.scale_ordinal))
            digest.update(struct.pack(">d", instruction.denominator))
            digest.update(struct.pack(">I", len(instruction.scaled_terms)))
            for term in instruction.scaled_terms:
                digest.update(struct.pack(">d", term))
    return digest.hexdigest()


def _component_tolerance(component: str) -> ComponentTolerance:
    for policy in COMPONENT_TOLERANCES:
        if policy.component == component:
            return policy
    raise RuntimeError(f"cross_grid_component_policy_missing:{component}")


def _normalized_component(
    *,
    component: str,
    fine_values: tuple[float, ...],
    comparison_values: tuple[float, ...],
) -> ComponentConvergenceResult:
    if len(fine_values) != len(comparison_values) or not fine_values:
        raise RuntimeError("cross_grid_component_shape_invalid")
    policy = _component_tolerance(component)
    maximum = -1.0
    maximum_ordinal = -1
    maximum_difference = 0.0
    maximum_normalizer = 0.0
    maximum_fine = 0.0
    maximum_comparison = 0.0
    for ordinal in range(len(fine_values)):
        fine = fine_values[ordinal]
        comparison = comparison_values[ordinal]
        difference = abs(fine - comparison)
        scale = max(abs(fine), abs(comparison))
        normalizer = policy.absolute + policy.relative * scale
        if (
            not math.isfinite(difference)
            or not math.isfinite(normalizer)
            or normalizer <= 0.0
        ):
            raise ValueError("cross_grid_normalized_error_operand_invalid")
        normalized = difference / normalizer
        if not math.isfinite(normalized):
            raise ValueError("cross_grid_normalized_error_nonfinite")
        if normalized > maximum:
            maximum = normalized
            maximum_ordinal = ordinal
            maximum_difference = difference
            maximum_normalizer = normalizer
            maximum_fine = fine
            maximum_comparison = comparison
    normalized_linf = _positive_zero(maximum)
    absolute_difference = _positive_zero(maximum_difference)
    return ComponentConvergenceResult(
        component=component,
        absolute_tolerance_exact=policy.absolute_exact,
        relative_tolerance_exact=policy.relative_exact,
        absolute_tolerance_binary64_word=policy.absolute_binary64_word,
        relative_tolerance_binary64_word=policy.relative_binary64_word,
        normalized_linf=normalized_linf,
        normalized_linf_binary64_word=_float_word(normalized_linf),
        maximum_ordinal=None if component == "w" else maximum_ordinal,
        absolute_difference_at_maximum=absolute_difference,
        absolute_difference_binary64_word=_float_word(absolute_difference),
        normalizer_at_maximum=maximum_normalizer,
        normalizer_binary64_word=_float_word(maximum_normalizer),
        fine_value_at_maximum_binary64_word=_float_word(maximum_fine),
        comparison_value_at_maximum_binary64_word=_float_word(maximum_comparison),
        passed=normalized_linf <= 1.0,
    )


def _validated_component_values(
    level: _ValidatedLevel, component: str
) -> tuple[float, ...]:
    if component == "F0":
        return level.F0
    if component == "F1":
        return level.F1
    if component == "varphi":
        return level.varphi
    raise RuntimeError(f"cross_grid_projected_component_invalid:{component}")


def _evaluate_pair(
    pair_index: int,
    coarse: _ValidatedLevel,
    fine: _ValidatedLevel,
) -> PairConvergenceResult:
    pair_id = PAIR_IDS[pair_index]
    if pair_id != f"{coarse.node_count}_to_{fine.node_count}":
        raise RuntimeError("cross_grid_pair_chronology_mismatch")
    instructions = _projection_instructions(coarse.rho, fine.rho)
    exact_hits = sum(
        instruction.exact_source_ordinal is not None
        for instruction in instructions
    )
    geometry_hash = _projection_geometry_sha256(
        coarse.node_count, fine.node_count, instructions
    )

    projected_by_component: list[tuple[float, ...]] = []
    component_results: list[ComponentConvergenceResult] = []
    for component in PROJECTED_FIELDS:
        projected = _apply_projection(
            _validated_component_values(coarse, component), instructions
        )
        projected_by_component.append(projected)
        component_results.append(
            _normalized_component(
                component=component,
                fine_values=_validated_component_values(fine, component),
                comparison_values=projected,
            )
        )

    component_results.append(
        _normalized_component(
            component="w",
            fine_values=(fine.w,),
            comparison_values=(coarse.w,),
        )
    )
    components = tuple(component_results)
    if tuple(result.component for result in components) != COMPONENT_ORDER:
        raise RuntimeError("cross_grid_component_order_mismatch")

    projected_digest = hashlib.sha256()
    projected_digest.update(_PROJECTED_STATE_DOMAIN)
    projected_digest.update(struct.pack(">II", coarse.node_count, fine.node_count))
    for component, values in zip(
        PROJECTED_FIELDS, projected_by_component, strict=True
    ):
        encoded_name = component.encode("ascii")
        projected_digest.update(struct.pack(">B", len(encoded_name)))
        projected_digest.update(encoded_name)
        for value in values:
            projected_digest.update(struct.pack(">d", value))

    maximum_component_ordinal = 0
    overall = components[0].normalized_linf
    for ordinal in range(1, len(components)):
        candidate = components[ordinal].normalized_linf
        if candidate > overall:
            overall = candidate
            maximum_component_ordinal = ordinal
    overall = _positive_zero(overall)
    passed = overall <= 1.0
    first_failing_component = next(
        (result.component for result in components if not result.passed),
        None,
    )
    return PairConvergenceResult(
        pair_index=pair_index,
        pair_id=pair_id,
        coarse_node_count=coarse.node_count,
        fine_node_count=fine.node_count,
        projection_exact_hit_count=exact_hits,
        projection_interpolated_count=len(instructions) - exact_hits,
        projection_geometry_sha256=geometry_hash,
        projected_fields_sha256=projected_digest.hexdigest(),
        components=components,
        overall_normalized_linf=overall,
        overall_normalized_linf_binary64_word=_float_word(overall),
        maximum_component_ordinal=maximum_component_ordinal,
        maximum_component=components[maximum_component_ordinal].component,
        passed=passed,
        first_failing_component=first_failing_component,
    )


def _combined_input_sha256(levels: tuple[_ValidatedLevel, ...]) -> str:
    digest = hashlib.sha256()
    digest.update(_COMBINED_INPUT_DOMAIN)
    for level in levels:
        payload = bytes.fromhex(level.receipt.complete_level_sha256)
        digest.update(struct.pack(">I", len(payload)))
        digest.update(payload)
    return digest.hexdigest()


def _calculation_receipt_sha256(
    *,
    combined_input_sha256: str,
    pairs: tuple[PairConvergenceResult, ...],
    first_failing_pair_index: int | None,
) -> str:
    digest = hashlib.sha256()
    digest.update(_RECEIPT_DOMAIN)
    digest.update(bytes.fromhex(combined_input_sha256))
    for pair in pairs:
        pair_name = pair.pair_id.encode("ascii")
        digest.update(struct.pack(">B", len(pair_name)))
        digest.update(pair_name)
        digest.update(bytes.fromhex(pair.projection_geometry_sha256))
        digest.update(bytes.fromhex(pair.projected_fields_sha256))
        digest.update(b"\x01" if pair.passed else b"\x00")
        for component in pair.components:
            digest.update(struct.pack(">d", component.normalized_linf))
            digest.update(
                struct.pack(
                    ">i",
                    -1
                    if component.maximum_ordinal is None
                    else component.maximum_ordinal,
                )
            )
    digest.update(
        struct.pack(">i", -1 if first_failing_pair_index is None else first_failing_pair_index)
    )
    return digest.hexdigest()


@nearest_binary64
def evaluate_radial_cross_grid_convergence(
    *,
    level_64: FrozenRadialLevelState,
    level_96: FrozenRadialLevelState,
    level_128: FrozenRadialLevelState,
    level_256: FrozenRadialLevelState,
) -> RadialCrossGridConvergenceReceipt:
    """Evaluate all three frozen adjacent pairs and preserve the first failure."""

    _assert_policy_literals()
    caller_states = (level_64, level_96, level_128, level_256)
    # Exact outer types are checked for all four objects before any attribute is
    # traversed, so a hostile property-bearing substitute is never inspected.
    if any(type(state) is not FrozenRadialLevelState for state in caller_states):
        raise TypeError("all four levels must be exact FrozenRadialLevelState values")

    levels = tuple(
        _validate_level(state, level_id=level_id, node_count=node_count)
        for state, level_id, node_count in zip(
            caller_states, LEVEL_IDS, LEVEL_NODE_COUNTS, strict=True
        )
    )
    pairs = tuple(
        _evaluate_pair(pair_index, levels[pair_index], levels[pair_index + 1])
        for pair_index in range(3)
    )
    if tuple(pair.pair_id for pair in pairs) != PAIR_IDS:
        raise RuntimeError("cross_grid_evaluated_pair_order_mismatch")

    first_failing_pair_index = next(
        (pair.pair_index for pair in pairs if not pair.passed),
        None,
    )
    first_failing_pair_id = (
        None
        if first_failing_pair_index is None
        else pairs[first_failing_pair_index].pair_id
    )
    maximum_pair_index = 0
    overall = pairs[0].overall_normalized_linf
    for pair_index in range(1, len(pairs)):
        candidate = pairs[pair_index].overall_normalized_linf
        if candidate > overall:
            overall = candidate
            maximum_pair_index = pair_index
    overall = _positive_zero(overall)
    combined_hash = _combined_input_sha256(levels)
    receipt_hash = _calculation_receipt_sha256(
        combined_input_sha256=combined_hash,
        pairs=pairs,
        first_failing_pair_index=first_failing_pair_index,
    )
    return RadialCrossGridConvergenceReceipt(
        candidate_id=CANDIDATE_ID,
        operation_version=RADIAL_CROSS_GRID_CONVERGENCE_VERSION,
        branch_selection_binding=BRANCH_SELECTION_CONTRACT_BINDING,
        dependency_source_bindings=SOURCE_BYTE_BINDINGS[1:],
        binary64_environment_version=BINARY64_ENVIRONMENT_VERSION,
        binary64_rounding_mode=BINARY64_ROUNDING_MODE,
        binary64_runtime_family=BINARY64_RUNTIME_FAMILY,
        observed_glibc_version=OBSERVED_GLIBC_VERSION,
        rho_snapshot_generator_version=LOBATTO_GRID_GENERATOR_VERSION,
        rho_snapshot_mpfr_precision_bits=LOBATTO_RHO_MPFR_PRECISION_BITS,
        rho_snapshot_operation_graph=LOBATTO_RHO_SNAPSHOT_OPERATION_GRAPH,
        state_packing_order=PACKED_STATE_ORDER,
        projected_fields=PROJECTED_FIELDS,
        component_order=COMPONENT_ORDER,
        pair_order=PAIR_IDS,
        projection_operation_graph=PROJECTION_OPERATION_GRAPH,
        error_operation_graph=ERROR_OPERATION_GRAPH,
        level_inputs=tuple(level.receipt for level in levels),
        combined_input_sha256=combined_hash,
        pairs=pairs,
        overall_normalized_linf=overall,
        overall_normalized_linf_binary64_word=_float_word(overall),
        maximum_pair_index=maximum_pair_index,
        maximum_pair_id=pairs[maximum_pair_index].pair_id,
        all_pairs_within_tolerance=first_failing_pair_index is None,
        first_failing_pair_index=first_failing_pair_index,
        first_failing_pair_id=first_failing_pair_id,
        diagnostic_disposition=(
            "all_three_pairs_within_frozen_tolerances_diagnostic_only"
            if first_failing_pair_index is None
            else "blocked_at_first_failing_pair_no_retry_retune_or_fallback"
        ),
        calculation_receipt_sha256=receipt_hash,
    )


def radial_cross_grid_receipt_grants_authority(value: object) -> bool:
    """Copies, replacements, or mutations of a receipt never grant authority."""

    del value
    return False


__all__ = [
    "BINARY64_ENVIRONMENT_SOURCE_PATH",
    "BINARY64_ENVIRONMENT_SOURCE_SHA256",
    "BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES",
    "BRANCH_SELECTION_CANONICAL_SIZE_BYTES",
    "BRANCH_SELECTION_CONTRACT_BINDING",
    "BRANCH_SELECTION_RAW_SOURCE_PATH",
    "BRANCH_SELECTION_RAW_SOURCE_SHA256",
    "BRANCH_SELECTION_RAW_SOURCE_SIZE_BYTES",
    "BRANCH_SELECTION_SEMANTIC_SHA256",
    "CANDIDATE_ID",
    "COMPONENT_ORDER",
    "COMPONENT_TOLERANCES",
    "ComponentConvergenceResult",
    "ERROR_OPERATION_GRAPH",
    "FrozenRadialLevelState",
    "LEVEL_NODE_COUNTS",
    "LOBATTO_GRID_SOURCE_PATH",
    "LOBATTO_GRID_SOURCE_SHA256",
    "LOBATTO_GRID_SOURCE_SIZE_BYTES",
    "LOBATTO_GRID_GENERATOR_VERSION",
    "LOBATTO_RHO_MPFR_PRECISION_BITS",
    "LOBATTO_RHO_SNAPSHOT_OPERATION_GRAPH",
    "PACKED_STATE_ORDER",
    "PAIR_IDS",
    "PROJECTED_FIELDS",
    "PROJECTION_OPERATION_GRAPH",
    "PairConvergenceResult",
    "RADIAL_CROSS_GRID_CONVERGENCE_VERSION",
    "RadialCrossGridConvergenceReceipt",
    "authenticated_lobatto_rho_snapshot",
    "evaluate_radial_cross_grid_convergence",
    "radial_cross_grid_receipt_grants_authority",
]
