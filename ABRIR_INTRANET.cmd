@echo off
title Intranet SSP
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar-intranet.ps1"
if not errorlevel 1 exit /b 0

if errorlevel 1 (
  echo.
  echo Nao foi possivel iniciar a Intranet SSP.
  echo Consulte a mensagem acima ou o arquivo logs\server-error.log.
  echo.
  pause
  exit /b 1
)
