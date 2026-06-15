@echo off
setlocal
title ProcureFlow - Extractor

rem Always work from the folder this .bat lives in
cd /d "%~dp0"

set "ZIP=ProcureFlow.zip"
set "DEST=ProcureFlow"

echo ============================================================
echo   ProcureFlow - Extracting application...
echo ============================================================
echo.

if not exist "%ZIP%" (
    echo ERROR: "%ZIP%" was not found next to this file.
    echo Make sure you copied the WHOLE folder, then try again.
    echo.
    pause
    exit /b 1
)

if exist "%DEST%\ProcureFlow.exe" (
    echo Looks like ProcureFlow is already extracted.
    echo.
    goto :launch
)

echo This can take a minute. Please wait...
echo.

rem Use PowerShell's Expand-Archive to unzip into the DEST folder
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Expand-Archive -LiteralPath '%ZIP%' -DestinationPath '%DEST%' -Force"

if errorlevel 1 (
    echo.
    echo ERROR: Extraction failed.
    echo.
    pause
    exit /b 1
)

echo.
echo Done! Extracted to the "%DEST%" folder.
echo.

:launch
echo Launching ProcureFlow...
if exist "%DEST%\ProcureFlow.exe" (
    start "" "%DEST%\ProcureFlow.exe"
) else (
    echo Could not find "%DEST%\ProcureFlow.exe".
    echo Open the "%DEST%" folder and double-click ProcureFlow.exe manually.
)

echo.
echo You can close this window.
timeout /t 5 >nul
endlocal
