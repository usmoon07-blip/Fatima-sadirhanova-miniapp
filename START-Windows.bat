@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js topilmadi. https://nodejs.org dan LTS versiyasini ornating. & pause & exit /b)
node scripts\launch.js
pause
