@echo off
chcp 65001 >nul
title SISTEMA DE EXPEDIENTES SBJ
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0start-full.ps1"
