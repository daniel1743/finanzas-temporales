@echo off
echo ========================================
echo   DESPLIEGUE FINANZAS MENSUALES
echo ========================================
echo.

echo [1/5] Verificando archivos necesarios...
if not exist "index.html" (
    echo ERROR: index.html no encontrado
    pause
    exit /b 1
)
if not exist "style.css" (
    echo ERROR: style.css no encontrado
    pause
    exit /b 1
)
if not exist "app.js" (
    echo ERROR: app.js no encontrado
    pause
    exit /b 1
)
echo ✓ Archivos principales encontrados

echo.
echo [2/5] Verificando iconos PWA...
if not exist "public\icon-192.png" (
    echo ADVERTENCIA: icon-192.png no encontrado
    echo Abre public\generar-iconos.html para generarlos
    start public\generar-iconos.html
    echo.
    echo Presiona cualquier tecla cuando hayas descargado los iconos...
    pause
)
if not exist "public\icon-512.png" (
    echo ADVERTENCIA: icon-512.png no encontrado
    echo Abre public\generar-iconos.html para generarlos
    start public\generar-iconos.html
    echo.
    echo Presiona cualquier tecla cuando hayas descargado los iconos...
    pause
)
echo ✓ Iconos verificados

echo.
echo [3/5] Preparando Git...
git add .
git status
echo.

echo [4/5] ¿Hacer commit? (S/N)
set /p commit="Respuesta: "
if /i "%commit%"=="S" (
    set /p message="Mensaje del commit: "
    git commit -m "%message%"
    echo ✓ Commit realizado
) else (
    echo - Commit omitido
)

echo.
echo [5/5] ¿Desplegar en Vercel? (S/N)
set /p deploy="Respuesta: "
if /i "%deploy%"=="S" (
    echo.
    echo Ejecutando: vercel --prod
    vercel --prod
) else (
    echo.
    echo Para desplegar manualmente, ejecuta:
    echo   vercel --prod
)

echo.
echo ========================================
echo   DESPLIEGUE COMPLETADO
echo ========================================
echo.
echo Revisa el enlace de Vercel para ver tu app
pause
