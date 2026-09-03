# ========================================================
# SoundEngg Android ProGuard & R8 Optimization Rules
# ========================================================

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

# Capacitor Core & Native Plugins
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class com.getcapacitor.community.** { *; }
-keep class io.ionic.libs.ionicon.** { *; }
-keep class com.capawesome.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# Google Mobile Ads (AdMob) & Play Services
-keep class com.google.android.gms.ads.** { *; }
-keep interface com.google.android.gms.ads.** { *; }
-keep class com.google.ads.mediation.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.dynamic.** { *; }

# InMobi Mediation SDK
-keep class com.inmobi.** { *; }
-dontwarn com.inmobi.**
-keep public class com.google.ads.mediation.inmobi.InMobiMediationAdapter { *; }
-keep class com.iab.omid.** { *; }
-dontwarn com.iab.omid.**

# Unity Ads Mediation SDK
-keep class com.unity3d.ads.** { *; }
-keep class com.unity3d.services.** { *; }
-dontwarn com.unity3d.ads.**
-dontwarn com.unity3d.services.**
-keep public class com.google.ads.mediation.unity.UnityMediationAdapter { *; }

# RevenueCat Purchases SDK
-keep class com.revenuecat.purchases.** { *; }
-dontwarn com.revenuecat.purchases.**
-keep class kotlin.Metadata { *; }

# Razorpay Payment Gateway SDK
-keep class com.razorpay.** { *; }
-dontwarn com.razorpay.**
-keep class com.google.android.gms.auth.api.phone.** { *; }
-dontwarn com.google.android.gms.auth.api.phone.**

# AndroidX Core & Splash Screen
-keep class androidx.core.splashscreen.** { *; }
-keep class androidx.appcompat.** { *; }
-dontwarn androidx.**

# Third-party HTTP & Platform Dependencies
-dontwarn org.conscrypt.**
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn com.amazon.**
-dontwarn com.amazon.device.iap.**

