# Scientific Toolchain Doctor

Use this command to verify the local scientific rendering + validation stack:

```bash
npm run render:toolchain:doctor
```

It checks:
- CUDA (`nvcc`) and `nvidia-smi`
- Visual Studio C++ toolchain
- RenderDoc installation
- ParaView installation
- Nsight Graphics installation
- OWL clone/build presence (`C:\owl-src`, `C:\owl-build\Release\owl.dll`)
- Active Windows Installer lock (`msiexec`) that can block MSI-based installs

Exit codes:
- `0` = ready
- `1` = partial (usable, but missing required tools)
- `2` = blocked (core prerequisites missing)

## Current machine notes

- ParaView install can fail with MSI `1618` if another installer transaction is in progress.
- Nsight Graphics is not available from `winget` on this machine; use NVIDIA Developer installer.
