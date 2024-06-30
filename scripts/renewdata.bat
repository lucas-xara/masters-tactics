@echo off
REM Environment variables for scripts
set RENEWDATA_MODE=hertz_wiki
set PYTHONUNBUFFERED=1

REM Capture current date and time
for /f "tokens=1-4 delims=-:/ " %%a in ('echo %DATE%-%TIME%') do (
    set DATE=%%a-%%b-%%c-%%d
)

REM Define the path to the assets folder
set "assetsPath=data\img"

setlocal EnableDelayedExpansion

REM Check for missing files and log if they are already updated
set "filesUpdated=0"
for %%f in (%assetsPath%\*) do (
    if exist "%%f" (
        call :log "%%~nxf already updated, skipping..."
    ) else (
        set filesUpdated=1
    )
)

REM Redirect output to log file and console
call :log "---------------------------------------------------------"
call :log "Checking for updates..."

if "%filesUpdated%"=="0" if "%1%" NEQ "--force" (
    call :log "       - Datamined dumps were not updated."
    call :log "---------------------------------------------------------"
) else (
    call :log "       - Datamined dumps have been updated."
    call :log "---------------------------------------------------------"
    call :log "Parsing and preparing all necessary data:"
    call :log "       - Other..."
    node other.js >> fehupdate-%DATE%.log 2>&1
    call :log "       - Languages..."
    node languages.js >> fehupdate-%DATE%.log 2>&1
    call :log "       - Skills..."
    node skills.js >> fehupdate-%DATE%.log 2>&1
    call :log "       - Heroes..."
    node units.js >> fehupdate-%DATE%.log 2>&1
    call :log "       - Compressing outputs..."
    gzip -fk %assetsPath%\*json >> fehupdate-%DATE%.log 2>&1
    brotli -f %assetsPath%\*json >> fehupdate-%DATE%.log 2>&1
    call :log "---------------------------------------------------------"
)

if "%2%" NEQ "--hackin" (
    call :log "Downloading missing assets from wiki..."
    node renewdata-assets.js >> fehupdate-%DATE%.log 2>&1
)

exit /b

:log
echo %~1
echo %~1 >> fehupdate-%DATE%.log
exit /b
