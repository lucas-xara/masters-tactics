@echo off
REM Environment variables for python scripts
set RENEWDATA_MODE=hertz_wiki
set PYTHONUNBUFFERED=1

REM Capture current date and time
for /f "tokens=1-4 delims=-:/ " %%a in ('echo %DATE%-%TIME%') do (
    set DATE=%%a-%%b-%%c-%%d
)

if "%2%" NEQ "--hackin" (
    echo --------------------------------------------------------- >> fehupdate-%DATE%.log 2>&1
    echo Updating FeH datamined dumps... >> fehupdate-%DATE%.log 2>&1
    git submodule update --remote >> fehupdate-%DATE%.log 2>&1

    REM Check if something was updated
    for /f "tokens=*" %%i in ('git -C feh-assets-json/ rev-parse HEAD') do set currenthead=%%i
    git submodule update --remote >> fehupdate-%DATE%.log 2>&1

    REM Check if something was updated
    for /f "tokens=*" %%i in ('git -C feh-assets-json/ rev-parse HEAD') do set newcurrenthead=%%i
)

if "%currenthead%" == "%newcurrenthead%" (
    echo -e "\n        - Datamined dumps were not updated." >> fehupdate-%DATE%.log 2>&1
    echo -e "\n---------------------------------------------------------" >> fehupdate-%DATE%.log 2>&1
) else (
    echo -e "\n        - Datamined dumps have been updated." >> fehupdate-%DATE%.log 2>&1
    echo -e "\n---------------------------------------------------------" >> fehupdate-%DATE%.log 2>&1
    echo Parsing and preparing all necessary data: >> fehupdate-%DATE%.log 2>&1
    echo -e "\n        - Other..." >> fehupdate-%DATE%.log 2>&1
    python other.py >> fehupdate-%DATE%.log 2>&1
    echo -e "\n        - Languages..." >> fehupdate-%DATE%.log 2>&1
    python languages.py >> fehupdate-%DATE%.log 2>&1
    echo -e "\n        - Skills..." >> fehupdate-%DATE%.log 2>&1
    python skills.py >> fehupdate-%DATE%.log 2>&1
    echo -e "\n        - Heroes..." >> fehupdate-%DATE%.log 2>&1
    python units.py >> fehupdate-%DATE%.log 2>&1
    REM FIXME: UGH
    echo -e "\n        - Summoning pools..." >> fehupdate-%DATE%.log 2>&1
    python summoning.py >> fehupdate-%DATE%.log 2>&1
    echo -e "\n        - Copying outputs to destination..." >> fehupdate-%DATE%.log 2>&1
    move *skills.json *other.json *pools.json *units.json ..\data\content\
    move *languages*.json ..\data\languages\
    echo -e "\n        - Compressing outputs..." >> fehupdate-%DATE%.log 2>&1
    gzip -fk ..\data\content\*json
    gzip -fk ..\data\languages\*json
    brotli -f ..\data\languages\*json
    brotli -f ..\data\content\*json
    echo -e "\n---------------------------------------------------------" >> fehupdate-%DATE%.log 2>&1
)

if "%2%" NEQ "--hackin" (
    echo -e "Downloading missing assets from wiki..." >> fehupdate-%DATE%.log 2>&1
    python renewdata-assets.py >> fehupdate-%DATE%.log 2>&1
)
