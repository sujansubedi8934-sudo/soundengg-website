# ========================================================
# SoundEngg Android ProGuard & R8 Optimization Rules
# ========================================================

# Google Play Console High Optimization Flags
-allowaccessmodification
-optimizationpasses 5

# Preserve line numbers and source files for Google Play crash symbolication
-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod

# Javascript Interfaces & WebViews
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
    public *;
}

# Capacitor Core & Native Plugins (Allow optimization while keeping reflection entrypoints)
-keep,allowoptimization class com.getcapacitor.** { *; }
-keep,allowoptimization class com.getcapacitor.community.** { *; }
-keep,allowoptimization class io.ionic.libs.ionicon.** { *; }
-keep,allowoptimization class com.capawesome.** { *; }
-keep class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}

# Google Mobile Ads (AdMob) & Play Services (Allow R8 optimization)
-keep,allowoptimization class com.google.android.gms.ads.** { *; }
-keep,allowoptimization class com.google.ads.mediation.** { *; }
-keep,allowoptimization class com.google.android.gms.common.** { *; }
-keep,allowoptimization class com.google.android.gms.dynamic.** { *; }

# InMobi Mediation SDK
-keep,allowoptimization class com.inmobi.** { *; }
-dontwarn com.inmobi.**
-keep public class com.google.ads.mediation.inmobi.InMobiMediationAdapter { *; }
-keep class com.iab.omid.** { *; }
-dontwarn com.iab.omid.**

# Unity Ads Mediation SDK
-keep,allowoptimization class com.unity3d.ads.** { *; }
-keep,allowoptimization class com.unity3d.services.** { *; }
-dontwarn com.unity3d.ads.**
-dontwarn com.unity3d.services.**
-keep public class com.google.ads.mediation.unity.UnityMediationAdapter { *; }

# RevenueCat Purchases SDK
-keep,allowoptimization class com.revenuecat.purchases.** { *; }
-dontwarn com.revenuecat.purchases.**
-keep class kotlin.Metadata { *; }

# Razorpay Payment Gateway SDK
-keep,allowoptimization class com.razorpay.** { *; }
-dontwarn com.razorpay.**
-keep class com.google.android.gms.auth.api.phone.** { *; }
-dontwarn com.google.android.gms.auth.api.phone.**

# AndroidX Core & Splash Screen
-keep,allowoptimization class androidx.core.splashscreen.** { *; }
-keep,allowoptimization class androidx.appcompat.** { *; }
-dontwarn androidx.**

# Third-party HTTP & Platform Dependencies
-dontwarn org.conscrypt.**
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn com.amazon.**
-dontwarn com.amazon.device.iap.**

