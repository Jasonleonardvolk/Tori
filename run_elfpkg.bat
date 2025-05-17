@echo off
echo ELFIN Package Manager
echo ---------------------

REM This batch file helps run the ELFIN package manager
REM Usage: run_elfpkg.bat [command] [options]

REM Set Python path
set PYTHONPATH=%PYTHONPATH%;%~dp0

REM Parse commands
set command=%1
shift

REM Run the appropriate command
if "%command%"=="new" (
    python -m alan_backend.elfin.cli.packaging_cli new %*
) else if "%command%"=="build" (
    python -m alan_backend.elfin.cli.packaging_cli build %*
) else if "%command%"=="publish" (
    python -m alan_backend.elfin.cli.packaging_cli publish %*
) else if "%command%"=="install" (
    python -m alan_backend.elfin.cli.packaging_cli install %*
) else if "%command%"=="fmt" (
    python -m alan_backend.elfin.cli.packaging_cli fmt %*
) else if "%command%"=="clippy" (
    python -m alan_backend.elfin.cli.packaging_cli clippy %*
) else if "%command%"=="setup-registry" (
    python -m alan_backend.elfin.cli.packaging_cli setup_registry %*
) else if "%command%"=="semver-check" (
    python -m alan_backend.elfin.cli.packaging_cli semver_check %*
) else if "%command%"=="" (
    echo Available commands:
    echo   new            - Create a new ELFIN package
    echo   build          - Build the package
    echo   publish        - Publish the package to the registry
    echo   install        - Install a package from the registry
    echo   fmt            - Format ELFIN source files
    echo   clippy         - Run the ELFIN linter
    echo   setup-registry - Initialize a local package registry
    echo   semver-check   - Check if two versions are semver compatible
    echo.
    echo Example usage:
    echo   run_elfpkg.bat new my_package
    echo   run_elfpkg.bat build --release
    echo   run_elfpkg.bat install elfin-core
) else (
    echo Unknown command: %command%
    echo Use 'run_elfpkg.bat' without arguments to see available commands
    exit /b 1
)
