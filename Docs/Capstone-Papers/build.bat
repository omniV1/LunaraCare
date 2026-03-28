@echo off
REM ============================================================
REM LUNARA Capstone Project — Milestone 4 PDF Build Script
REM Requires: MiKTeX (xelatex) installed
REM ============================================================

setlocal

REM ── Locate xelatex ──
set "XELATEX=C:\Users\Owenl\AppData\Local\Programs\MiKTeX\miktex\bin\x64\xelatex.exe"

if not exist "%XELATEX%" (
    echo [ERROR] xelatex not found at: %XELATEX%
    echo Trying system PATH...
    where xelatex >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] xelatex is not in PATH either. Please install MiKTeX or update the path in this script.
        exit /b 1
    )
    set "XELATEX=xelatex"
)

set "TEX_FILE=04_MILESTONE_4.tex"
set "JOB_NAME=04_MILESTONE_4"

if not exist "%TEX_FILE%" (
    echo [ERROR] %TEX_FILE% not found in current directory.
    echo Please run this script from: Docs\Capstone-Papers\
    exit /b 1
)

echo.
echo ============================================================
echo   LUNARA Capstone Project — Building Milestone 4 PDF
echo ============================================================
echo.

REM ── First pass (generates .aux, .toc) ──
echo [1/3] First compilation pass...
"%XELATEX%" -interaction=nonstopmode -jobname="%JOB_NAME%" "%TEX_FILE%"
if errorlevel 1 (
    echo [WARNING] First pass had errors — check the .log file for details.
    echo Continuing with second pass...
)

REM ── Second pass (resolves cross-references, TOC) ──
echo.
echo [2/3] Second compilation pass (resolving references)...
"%XELATEX%" -interaction=nonstopmode -jobname="%JOB_NAME%" "%TEX_FILE%"
if errorlevel 1 (
    echo [WARNING] Second pass had errors — check the .log file for details.
)

REM ── Third pass (final) ──
echo.
echo [3/3] Third compilation pass (final)...
"%XELATEX%" -interaction=nonstopmode -jobname="%JOB_NAME%" "%TEX_FILE%"
if errorlevel 1 (
    echo [WARNING] Third pass had errors — check the .log file for details.
)

echo.

if exist "%JOB_NAME%.pdf" (
    echo ============================================================
    echo   SUCCESS: %JOB_NAME%.pdf generated!
    echo ============================================================
    echo.
    echo   File: %CD%\%JOB_NAME%.pdf
    echo.
    REM Open the PDF
    start "" "%JOB_NAME%.pdf"
) else (
    echo ============================================================
    echo   FAILED: PDF was not generated.
    echo   Check %JOB_NAME%.log for errors.
    echo ============================================================
    exit /b 1
)

REM ── Cleanup auxiliary files ──
echo Cleaning up auxiliary files...
del /q "%JOB_NAME%.aux" 2>nul
del /q "%JOB_NAME%.log" 2>nul
del /q "%JOB_NAME%.toc" 2>nul
del /q "%JOB_NAME%.out" 2>nul
del /q "%JOB_NAME%.lof" 2>nul
del /q "%JOB_NAME%.lot" 2>nul

echo Done.
endlocal
