# BRIDGE Installation, Build & CI/CD Guide

## GitHub Actions Automated Builds (Recommended)

Because building WinUI 3 MSI installers requires Windows and building Android APKs requires JDK 17 + Android SDK, the repository provides ready-to-run GitHub Actions workflows under `.github/workflows/`:

1. **Android Build & Test (`.github/workflows/build-android.yml`)**
   - Runs on `ubuntu-latest` with Temurin JDK 17, Android SDK, and Gradle 8.9.
   - Executes `gradle testDebugUnitTest` and `gradle assembleDebug assembleRelease`.
   - Validates APK archive integrity (`unzip -tq`), writes `SHA256SUMS-android.txt`, and uploads `bridge-android-apk`.
   - Optional repository secrets for signed release APK: `BRIDGE_KEYSTORE_PATH`, `BRIDGE_KEYSTORE_PASSWORD`, `BRIDGE_KEY_ALIAS`, `BRIDGE_KEY_PASSWORD`.

2. **Windows Build & Test (`.github/workflows/build-windows.yml`)**
   - Runs on `windows-latest` with .NET 8 SDK and WiX Toolset v4.
   - Executes `dotnet test Bridge.Tests\Bridge.Tests.csproj -c Release`.
   - Publishes `Bridge.Desktop` (`win-x64` self-contained) and builds `Bridge-Windows-Setup.msi`.
   - Computes `SHA256SUMS-windows.txt` and uploads `bridge-windows-installer`.

3. **Combined GitHub Release (`.github/workflows/release.yml`)**
   - Triggered automatically when pushing a tag (`git tag v1.0.0 && git push origin v1.0.0`) or manually via GitHub **Actions -> Release BRIDGE Installers -> Run workflow**.
   - Publishes both installers plus `SHA256SUMS.txt` as GitHub Release assets.

4. **Connecting Real Builds to the Website Downloads Page**
   - **Option A (Local Disk)**: Place the built `Bridge-Windows-Setup.msi` and `Bridge-Android.apk` inside `downloads/` on the web server. `/api/releases` automatically detects non-empty files, computes real byte sizes and SHA-256 digests, and serves them at `/api/downloads/artifact/windows-installer` and `/api/downloads/artifact/android-apk`.
   - **Option B (Hosted GitHub Release URLs)**: Set `configuredDownloadUrl`, `version`, `releaseDate`, `sizeBytes`, and `sha256` in `config/releases.json` to the published GitHub Release asset URLs.

## Local Builds on Native Machines

### Website (Node.js / Express / React)
- `npm install && npm run build && npm start` (listens on port `3000`).

### Windows Desktop (`windows/`)
- Requires Windows 10 (19041+) / Windows 11, .NET 8 SDK, Windows App SDK 1.6, and WiX Toolset v4 (`dotnet tool install --global wix --version 4.*`):
  ```powershell
  cd windows/installer
  ./build-windows.ps1 -Configuration Release
  ```

### Android Mobile (`android/`)
- Requires JDK 17, Gradle 8.9, and Android SDK (API 35):
  ```bash
  cd android
  gradle testDebugUnitTest assembleDebug assembleRelease
  ```
