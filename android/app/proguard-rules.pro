# ProGuard / R8 Rules for Hemmaty Android App

# Preserve line numbers and source files for debugging crashes
-keepattributes SourceFile,LineNumberTable,Signature,InnerClasses,EnclosingMethod

# Keep Capacitor Core & Plugin Interfaces
-keep public class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}
-keep public class * extends com.getcapacitor.BridgeActivity { *; }

# Keep App Specific Plugins & Services (Athan & Widgets)
-keep class com.salahpro.app.plugins.** { *; }
-keep class com.salahpro.app.widget.** { *; }
-keep class com.salahpro.app.MainActivity { *; }

# Keep AndroidX WorkManager & BroadcastReceivers
-keep class androidx.work.** { *; }
-keep class * extends androidx.work.Worker { *; }
-keep class * extends androidx.work.ListenableWorker { *; }
-keep class * extends android.app.Service { *; }
-keep class * extends android.content.BroadcastReceiver { *; }
-keep class * extends android.appwidget.AppWidgetProvider { *; }

# Keep WebKit JavaScript Interfaces & WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class android.webkit.** { *; }
-keep class androidx.webkit.** { *; }

# Keep Kotlin Metadata & Reflection for Capacitor Bridge
-keep class kotlin.Metadata { *; }
-keepclassmembers class **$WhenMappings {
    <fields>;
}

# Keep GSON / Serialization models if present
-keepattributes *Annotation*
-keepclassmembers enum * { *; }

