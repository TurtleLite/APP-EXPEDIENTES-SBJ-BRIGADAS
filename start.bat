@echo off
chcp 65001 >nul
title APP EXPEDIENTES SBJ BRIGADAS
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0start-full.ps1"
