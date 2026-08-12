const releaseMode = process.env.CASIMIR_DESKTOP_RELEASE === "1";
const publisherName = process.env.WINDOWS_PUBLISHER_NAME?.trim();

if (releaseMode && !publisherName) {
  throw new Error(
    "WINDOWS_PUBLISHER_NAME is required for a signed desktop release",
  );
}

module.exports = {
  appId: "com.casimirbot.desktop",
  productName: "CasimirBot",
  protocols: [
    {
      name: "CasimirBot OAuth callback",
      schemes: ["casimirbot"],
    },
  ],
  asar: true,
  asarUnpack: ["node_modules/sharp/**", "node_modules/@img/**"],
  npmRebuild: false,
  files: ["dist/**", "package.json"],
  extraResources: [
    {
      from: "runtime",
      to: "runtime",
      filter: [
        "dist/public/**",
        "configs/ideology-verifiers.json",
        "docs/ethos/ideology.json",
        "codex-marketplace/**",
        "bin/tunnel-client.exe",
        "licenses/openai-tunnel-client-LICENSE",
        "runtime-manifest.json",
      ],
    },
  ],
  directories: { output: "release" },
  publish: {
    provider: "github",
    owner: "pestypig",
    repo: "casimirbot-",
    releaseType: "draft",
  },
  win: {
    target: ["nsis"],
    icon: "dist/icon.png",
    artifactName: "CasimirBot-${version}-${arch}-setup.${ext}",
    forceCodeSigning: releaseMode,
    verifyUpdateCodeSignature: true,
    ...(publisherName ? { publisherName: [publisherName] } : {}),
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
};
