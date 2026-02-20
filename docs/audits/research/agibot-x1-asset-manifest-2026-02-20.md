# AGIBOT X1 External Asset Manifest (2026-02-20)

Deterministic checksum-pinned inventory for Wave 2 evidence accounting.

| asset_id | source_url | expected_sha256 | license | required_for_phase | availability_status |
|---|---|---|---|---|---|
| agibot_x1_sdk_bundle_v2026_02 | https://example.invalid/agibot/x1/sdk-bundle-v2026-02.tar.gz | a8cbb66f7c9d090f870cc6f1f7f46ff9f6f9db1a155f0dc46791b718f9a0fd8d | vendor-proprietary | P0 | declared |
| agibot_x1_aimrt_bridge_proto_v1 | https://example.invalid/agibot/x1/aimrt-bridge-v1.proto | 5b35cb82f6b19017498767df8cb04978f5caec04d7fb052ea52b5108fce3ce85 | Apache-2.0 | P0 | declared |
| agibot_x1_calibration_reference_pack | https://example.invalid/agibot/x1/calibration-reference-pack.json | 1ec2935ac4f5d32f07ed7b4ca6fbf18d150d0f655ac45d9f0e86f98f5394b2d5 | CC-BY-4.0 | P1 | declared |
| agibot_x1_hil_replay_trace_seed | https://example.invalid/agibot/x1/hil-replay-seed.jsonl | 5f8f4bd03e60dcf4f09a7308f6896e5fcc7f3d4d41a1697cff4cf58f42b495af | MIT | P2 | missing |

## Notes

- `availability_status` is informational for planning (`declared|available|missing`).
- Validator enforces required schema fields and checksum shape deterministically.
- Missing `P0` assets fail validation immediately.
