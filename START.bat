@echo off
rem Burrito GenDex launcher (1.4.6) - PRODUCTION MODE.
rem
rem   1. FIRST RUN of a new version (or after source changes): builds the
rem      production bundle once with `electron-forge package` (a few
rem      minutes), writes a stamp with the version it built, then launches.
rem      The whole build is SAVED to build-log.txt as it happens.
rem   2. EVERY LATER RUN: sees the stamp matches package.json, finds the
rem      packaged exe, and starts it directly - no Node, no npm, no console.
rem
rem 1.2.0 - IF THE BUILD FAILS you are never stranded: the launcher shows
rem the last lines of build-log.txt (the real error, not a guess), and
rem offers [R]etry, [D]evelopment mode (npm start) so the app still opens,
rem or [N]othing. A version bump in package.json invalidates the stamp
rem automatically. To force a rebuild, delete the .prod-stamp file.

setlocal EnableExtensions
cd /d "%~dp0"

rem ---------------------------------------------------------------------------
rem 1. Read the app version out of package.json ("version": "X.Y.Z").
rem ---------------------------------------------------------------------------
set "PKG_VER="
for /f "usebackq tokens=1,2 delims=:," %%a in (`findstr /b /c:"  \"version\":" package.json`) do (
    set "PKG_VER=%%b"
)
if not defined PKG_VER set "PKG_VER=0.0.0"
set "PKG_VER=%PKG_VER: =%"
set "PKG_VER=%PKG_VER:"=%"
if "%PKG_VER%"=="0.0.0" (
    echo [START] Could not read the version from package.json - is the source folder intact?
    pause
    exit /b 1
)

rem ---------------------------------------------------------------------------
rem 2. Find the packaged exe (out\<name>-win32-x64\Burrito GenDex.exe).
rem ---------------------------------------------------------------------------
set "EXE="
if exist "out" (
    for /d %%d in ("out\*win32-x64") do (
        if exist "%%d\Burrito GenDex.exe" set "EXE=%%d\Burrito GenDex.exe"
    )
)

rem ---------------------------------------------------------------------------
rem 3. Up to date? Launch the production build directly.
rem ---------------------------------------------------------------------------
set "STAMP="
if exist ".prod-stamp" set /p STAMP=<.prod-stamp
if defined EXE if "%STAMP%"=="%PKG_VER%" (
    echo [START] Launching Burrito GenDex v%PKG_VER% ^(production^)...
    start "" "%EXE%"
    endlocal
    exit /b 0
)

rem ---------------------------------------------------------------------------
rem 4. Stale or missing: build the production bundle once, stamp, launch.
rem    (This is the only leg that needs Node + npm on PATH.)
rem ---------------------------------------------------------------------------
where npm >nul 2>nul
if errorlevel 1 (
    echo [START] npm was not found on PATH. The production build for v%PKG_VER%
    echo        is not built yet, and building needs Node.js ^(LTS^) from nodejs.org.
    if defined EXE echo        ^(An older packaged build exists in out\ - install Node to rebuild.^)
    pause
    exit /b 1
)

if not exist "node_modules\electron" (
    echo [START] node_modules is missing or incomplete. Run:
    echo            npm install --ignore-scripts
    echo        then start this launcher again.
    pause
    exit /b 1
)

:build
echo [START] Building the v%PKG_VER% production bundle ^(first run of this version, a few minutes^)...
echo [START] The full build log is being saved to build-log.txt
echo.

rem Run the build with LIVE output and a saved log at the same time.
rem PowerShell's Tee-Object mirrors everything; exit $LASTEXITCODE keeps
rem npm's own exit code (a plain pipe would swallow it). If PowerShell is
rem unavailable, fall back to a plain live run (no log).
where powershell >nul 2>nul
if errorlevel 1 (
    call npm run package
    goto :build_done
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "npm run package 2>&1 | Tee-Object -FilePath 'build-log.txt'; exit $LASTEXITCODE"

:build_done
if errorlevel 1 goto :build_failed

set "EXE="
for /d %%d in ("out\*win32-x64") do (
    if exist "%%d\Burrito GenDex.exe" set "EXE=%%d\Burrito GenDex.exe"
)
if not defined EXE (
    echo [START] The build finished but the packaged exe was not found in out\.
    goto :offer_fallback
)

echo %PKG_VER%> .prod-stamp
echo.
echo [START] Launching Burrito GenDex v%PKG_VER% ^(production^)...
start "" "%EXE%"
endlocal
exit /b 0

rem ---------------------------------------------------------------------------
rem The build failed - show WHY (the real error from the log), then make
rem sure the user still gets their app if they want it.
rem ---------------------------------------------------------------------------
:build_failed
echo.
echo [START] The production build FAILED. The last lines of build-log.txt:
echo ==============================================================================
if exist "build-log.txt" (
    powershell -NoProfile -Command "Get-Content -Path 'build-log.txt' -Tail 30"
) else (
    echo ^(no build-log.txt was written^)
)
echo ==============================================================================
echo [START] The complete log is in build-log.txt - open it in a text editor.
echo        If it mentions missing modules, run:  npm install --ignore-scripts
echo.

:offer_fallback
choice /c RDN /n /t 45 /d D /m "[R]etry the build   [D]open in development mode   [N]othing (default D in 45s)"
if errorlevel 3 goto :give_up
if errorlevel 2 goto :dev_mode
goto :build

:dev_mode
echo.
echo [START] Opening Burrito GenDex v%PKG_VER% in DEVELOPMENT mode...
echo        ^(Slower to start; the console window must stay open. To fix the
echo        production build later, read build-log.txt and try again.^)
call npm start
endlocal
exit /b 0

:give_up
echo [START] Nothing launched. The build log is in build-log.txt.
endlocal
exit /b 1
