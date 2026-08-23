@echo off
REM ====================================================
REM  PWA to APK — One-Click Build Script
REM ====================================================

set "ANDROID_SDK_ROOT=C:\android-sdk"
set "ANDROID_HOME=C:\android-sdk"

echo.
echo ===================================
echo   هِمَّتِي Hemmaty - PWA to APK Builder
echo ===================================
echo.

echo [1/4] بناء مشروع الويب ...
call npm run build
if %errorlevel% neq 0 (
  echo ❌ فشل بناء المشروع
  exit /b %errorlevel%
)

echo.
echo [2/4] مزامنة Capacitor ...
call npx cap sync android
if %errorlevel% neq 0 (
  echo ❌ فشل المزامنة
  exit /b %errorlevel%
)

echo.
echo [3/4] بناء APK ...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
  echo ❌ فشل بناء APK
  cd ..
  exit /b %errorlevel%
)
cd ..

echo.
echo ===================================
echo ✅ تم بناء APK بنجاح!
echo.
echo 📦 الملف موجود في:
echo    android\app\build\outputs\apk\debug\app-debug.apk
echo ===================================
echo.
pause
