@echo off
REM Emscripten Build Script for Windows

echo Building Opus WASM Engine...

REM Activate Emscripten environment if emsdk exists locally
if exist "emsdk\emsdk_env.bat" (
    echo Activating Emscripten environment...
    call emsdk\emsdk_env.bat >nul
)

REM Check if Emscripten is installed
where emcc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Emscripten not found!
    echo Please install Emscripten SDK first:
    echo 1. Download from: https://github.com/emscripten-core/emsdk
    echo 2. Run: emsdk install latest
    echo 3. Run: emsdk activate latest
    echo 4. Run: emsdk_env.bat
    exit /b 1
)

REM Compile C++ to WASM
emcc src\wasm\bindings.cpp ^
    -O3 ^
    --bind ^
    -s WASM=1 ^
    -s ALLOW_MEMORY_GROWTH=1 ^
    -s MODULARIZE=1 ^
    -s EXPORT_NAME="OpusEngine" ^
    -I src\cpp ^
    -o build\opus_engine.js

if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: WASM compiled to build\opus_engine.js
    echo Files created:
    echo   - build\opus_engine.js
    echo   - build\opus_engine.wasm
) else (
    echo ERROR: Compilation failed!
    exit /b 1
)
