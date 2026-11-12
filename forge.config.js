const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

// Optional env-based code signing: set SIGNING_CERT_PATH (and optionally
// SIGNING_CERT_PASSWORD) before running `npm run make` to sign the installer.
const squirrelConfig = {
  name: 'burrito_gendex',
  setupIcon: './installer.ico',
};

if (process.env.SIGNING_CERT_PATH) {
  squirrelConfig.certificateFile = process.env.SIGNING_CERT_PATH;
  if (process.env.SIGNING_CERT_PASSWORD) {
    squirrelConfig.certificatePassword = process.env.SIGNING_CERT_PASSWORD;
  }
}

module.exports = {
  packagerConfig: {
    name: 'Burrito GenDex',
    executableName: 'Burrito GenDex',
    asar: true,
    icon: './Icon.ico',
    // Embedded runtime checksums: keeps builds offline-safe against SHASUMS
    // fetch flakes. 1.1.7 — the map must name EVERY platform zip a build can
    // request: @electron/get turns this map into the whole SHASUMS256.txt and
    // hard-fails any artifact missing from it ("No checksum found in checksum
    // file"). The 1.1.6 map carried only the win32-x64 zip, so the Windows
    // build passed validation and died later (at the fuses key), while every
    // non-Windows package run (the CI BUILD lane) died right here. All six
    // v42.9.3 platform zips below are cross-verified against the official
    // release SHASUMS256.txt.
    download: {
      checksums: {
        'electron-v42.9.3-darwin-x64.zip':
          '190b7e40410a0e00c4c9804a72e0e10491ba93c98a2a803023dd7af779cbc784',
        'electron-v42.9.3-darwin-arm64.zip':
          'ea14213b15708bf571f4685772fb562a6469bcb9c49f4148077727d681e82e57',
        'electron-v42.9.3-linux-x64.zip':
          '46fc1cd5d70de57c372fbc0f36870c4c4d80b127a0d452d80bd577c5a7d39b7d',
        'electron-v42.9.3-linux-arm64.zip':
          '1064e5cc5aa6490bb094b5e665cad4c8d520dcd4d52581ad68877793199fb903',
        'electron-v42.9.3-win32-x64.zip':
          '51b68cd32c09b6de4f468a8c2a19dddf765d450e3af13a32e790c7a7fb4aeddf',
        'electron-v42.9.3-win32-arm64.zip':
          '9871b4292ec595868d91d32caa5ad03437a919ce54e092079d7bbfa881c33975',
      },
    },
    win32metadata: {
      FileDescription: 'Burrito GenDex',
      OriginalFilename: 'Burrito GenDex.exe',
      ProductName: 'Burrito GenDex',
      CompanyName: 'Genesis Iterations',
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: squirrelConfig,
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: { options: { name: 'burrito-gendex' } },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: { options: { name: 'burrito-gendex' } },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              name: 'main_window',
              html: './src/index.html',
              js: './src/renderer.js',
              preload: {
                js: './src/preload.js',
              },
            },
          ],
        },
      },
    },
    {
      name: '@electron-forge/plugin-fuses',
      config: {
        // 1.1.7 — THE KEY IS `version`, NOT `fuseVersion`. The 1.1.6 config
        // said `fuseVersion:` — a key @electron/fuses never reads (its
        // FuseConfig wants `version`), so flipFuses answered "Unsupported
        // fuse version number: undefined" and killed `electron-forge
        // package` on the very first real run ("The production build
        // failed… ■ Running postPackage hook" on every machine that ever
        // tried). Verified against the real electron-v42.9.3-win32-x64.zip
        // (sha256 51b68cd3…): the `version` key flips all six fuses in
        // ~450 ms; the `fuseVersion` key throws before touching a byte.
        version: FuseVersion.V1,
        [FuseV1Options.RunAsNode]: false,
        [FuseV1Options.EnableCookieEncryption]: true,
        [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
        [FuseV1Options.EnableNodeCliInspectArguments]: false,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,
      },
    },
  ],
};
