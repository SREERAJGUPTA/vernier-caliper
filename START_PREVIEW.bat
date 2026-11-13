@echo off
cd /d "%~dp0"
where node >nul 2>nul
if not errorlevel 1 (
  node scripts\serve.mjs
) else (
  where python >nul 2>nul
  if not errorlevel 1 (
    python scripts\preview.py
  ) else (
    echo Please install Node.js or Python, then run this launcher again.
    echo Instructions are in README.md.
  )
)
pause
