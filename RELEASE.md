# Releasing Burrito GenDex

The full recipe for cutting a release: version bump, build, optional code
signing, packaging, and publishing to GitHub.

> **Never commit secrets.** The signing certificate (`signing-cert.pfx`) and
> its password stay on your machine, never in the repository. The `.gitignore`
> already refuses `*.pfx` — keep it that way. Commands below use
> `<YOUR-PFX-PASSWORD>` as a placeholder; type the real password in your
> terminal only.

---

## 1. Version bump

1. `package.json` → `"version": "X.Y.Z"`
2. `src/constants/index.js` → `version: 'X.Y.Z'` (the About page reads this)
3. Add the entry at the top of `CHANGELOG.md`
4. Update the version shown in `README.md`

## 2. Build + package

```powershell
npm install        # once per machine
npm run make       # builds and produces the installer
```

Output lands in `out\make\squirrel.windows\x64\` — the key artifacts:

- `Burrito GenDex-X.Y.Z Setup.exe` — the installer users run
- `burrito_gendex-X.Y.Z-full.nupkg` — the Squirrel update package
- `RELEASES` — the releases index Squirrel uses for auto-updates

## 3. Code signing (optional but recommended)

A self-signed cert removes the "Unknown publisher" line and lets Squirrel
updates install without extra prompts. **One-time setup** (Windows PowerShell,
Windows SDK installed):

```powershell
# create the certificate in your personal store
$cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject "CN=NuriDerBurrito" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -FriendlyName "Burrito GenDex Signing Cert"

# export a backup copy (KEEP THIS FILE PRIVATE — it is your signature)
$pwd = Read-Host -AsSecureString "PFX password"
Export-PfxCertificate -Cert $cert -FilePath "$env:USERPROFILE\signing-cert.pfx" -Password $pwd

# the thumbprint you will sign with
Write-Host "Certificate Thumbprint: $($cert.Thumbprint)"
```

**Sign the artifacts** (adjust the signtool path to your Windows SDK version):

```powershell
$thumbprint = "<PASTE-YOUR-THUMBPRINT-HERE>"
$files = @(
  "C:\path\to\out\make\squirrel.windows\x64\burrito_gendex-X.Y.Z-full.nupkg",
  "C:\path\to\out\make\squirrel.windows\x64\Burrito GenDex-X.Y.Z Setup.exe"
)
foreach ($f in $files) {
  & "C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64\signtool.exe" sign `
      /fd SHA256 /sha1 $thumbprint `
      /tr http://timestamp.digicert.com /td SHA256 `
      $f
}
```

Notes:

- Signing with `/sha1 <thumbprint>` pulls the cert straight from your store —
  no password on the command line, nothing to leak.
- If you ever sign from the exported `.pfx` instead, pass the password through
  a variable typed at the prompt (`Read-Host -AsSecureString`), never inline.
- `signtool verify /pa /v <file>` checks a signature when you're done.

## 4. Publish the GitHub release

There are two roads now — the CI road (preferred) and the by-hand road.

### The CI road (preferred)

Push a `v*` tag and the pipeline does the rest:

```bash
git add -A
git commit -m "X.Y.Z — <short summary>"
git tag vX.Y.Z
git push origin main --tags
```

`.github/workflows/ci.yml` then runs the whole test battery, builds the
installers on **Windows and Linux**, and publishes them to the repo's
GitHub Releases automatically (`GITHUB_TOKEN` is provided by Actions — no
secrets to set up). The release shows up as a draft only if publish fails
halfway; normally it is live in a few minutes. The in-app UPDATE CHANNEL
reads this same feed, so every installed copy learns the new version
exists on its next launch.

After CI finishes, open the release on github.com and paste the changelog
entry into the body (CI attaches the files; the words are still yours).

### The by-hand road (fallback)

If you ever need to publish without CI, run `npm run make` on each platform
and attach from `out\make\squirrel.windows\x64\` to a manually drafted
release:

- `Burrito GenDex-X.Y.Z Setup.exe` — the installer users run
- `burrito_gendex-X.Y.Z-full.nupkg` — the Squirrel update package
- `RELEASES` — the releases index Squirrel uses for auto-updates
- (optional) a `Burrito_GenDex_X.Y.Z_source.zip` of the source

## 5. Sanity checklist before shipping

- The newest suite passes (`node scripts/gendex_123_batch_dom.test.mjs` —
  whatever the newest one is)
- The full battery is green:
  `for f in scripts/*.test.mjs; do node "$f" || echo "FAILED: $f"; done`
- `npm start` boots, a card can be created, images reorder, the viewer opens
- The About page shows the new version
- No `*.pfx`, password, or token appears anywhere in `git status`
- CI agrees: the Actions tab shows the test + build lanes green before you
  tag, and the release lane green after
