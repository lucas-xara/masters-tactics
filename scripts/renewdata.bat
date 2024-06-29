@echo off
REM Environment variables for scripts
set RENEWDATA_MODE=hertz_wiki
set PYTHONUNBUFFERED=1

REM Capture current date and time
for /f "tokens=1-4 delims=-:/ " %%a in ('echo %DATE%-%TIME%') do (
    set DATE=%%a-%%b-%%c-%%d
)

if "%2%" NEQ "--hackin" (
    echo --------------------------------------------------------- >> fehupdate-%DATE%.log 2>&1
    echo Updating FeH datamined dumps... >> fehupdate-%DATE%.log 2>&1
    for /f "tokens=*" %%i in ('git -C feh-assets-json/ rev-parse HEAD') do set currenthead=%%i
    git submodule update --remote >> fehupdate-%DATE%.log 2>&1
    for /f "tokens=*" %%i in ('git -C feh-assets-json/ rev-parse HEAD') do set newcurrenthead=%%i
)

if "%currenthead%" == "%newcurrenthead%" if "%1%" NEQ "--force" (
    echo        - Datamined dumps were not updated. >> fehupdate-%DATE%.log 2>&1
    echo --------------------------------------------------------- >> fehupdate-%DATE%.log 2>&1
) else (
    echo        - Datamined dumps have been updated. >> fehupdate-%DATE%.log 2>&1
    echo --------------------------------------------------------- >> fehupdate-%DATE%.log 2>&1
    echo Parsing and preparing all necessary data: >> fehupdate-%DATE%.log 2>&1
    echo        - Other... >> fehupdate-%DATE%.log 2>&1
    node other.js >> fehupdate-%DATE%.log 2>&1
    echo        - Languages... >> fehupdate-%DATE%.log 2>&1
    node languages.js >> fehupdate-%DATE%.log 2>&1
    echo        - Skills... >> fehupdate-%DATE%.log 2>&1
    node skills.js >> fehupdate-%DATE%.log 2>&1
    echo        - Heroes... >> fehupdate-%DATE%.log 2>&1
    node units.js >> fehupdate-%DATE%.log 2>&1
    echo        - Copying outputs to destination... >> fehupdate-%DATE%.log 2>&1
    move *skills.json *other.json *pools.json *units.json ..\data\content\
    move *languages*.json ..\data\languages\
    echo        - Compressing outputs... >> fehupdate-%DATE%.log 2>&1
    gzip -fk ..\data\content\*json
    gzip -fk ..\data\languages\*json
    brotli -f ..\data\languages\*json
    brotli -f ..\data\content\*json
    echo --------------------------------------------------------- >> fehupdate-%DATE%.log 2>&1
)

if "%2%" NEQ "--hackin" (
    echo Downloading missing assets from wiki... >> fehupdate-%DATE%.log 2>&1
    node renewdata-assets.js >> fehupdate-%DATE%.log 2>&1
)
