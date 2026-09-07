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

echo "[1/5] فحص جودة الكود والأنواع (Type-Check)..."
npm run lint

echo ""
echo "[2/5] بناء مشروع الويب..."
npm run build

echo ""
echo "[3/5] مزامنة Capacitor Android..."
npx cap sync android

echo ""
echo "[4/5] بناء حزمة APK (Debug)..."
cd android
chmod +x gradlew || true
./gradlew assembleDebug
cd ..

echo ""
echo "[5/5] حساب البصمة الرقمية SHA-256..."
if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
  cd android/app/build/outputs/apk/debug
  sha256sum app-debug.apk > app-debug.apk.sha256 2>/dev/null || shasum -a 256 app-debug.apk > app-debug.apk.sha256
  cd - > /dev/null
fi

echo ""
echo "==================================="
echo "✅ تم بناء APK بنجاح!"
echo ""
echo "📦 الملف موجود في:"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo "==================================="
echo ""
