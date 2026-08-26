#!/usr/bin/env bash
# ====================================================
#  PWA to APK — One-Click Linux/macOS Build Script
# ====================================================

set -e

echo ""
echo "==================================="
echo "  هِمَّتِي Hemmaty - PWA to APK Builder"
echo "==================================="
echo ""

echo "[1/4] بناء مشروع الويب ..."
npm run build

echo ""
echo "[2/4] مزامنة Capacitor ..."
npx cap sync android

echo ""
echo "[3/4] بناء APK ..."
cd android
chmod +x gradlew || true
./gradlew assembleDebug
cd ..

echo ""
echo "==================================="
echo "✅ تم بناء APK بنجاح!"
echo ""
echo "📦 الملف موجود في:"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo "==================================="
echo ""
