import java.util.Properties

plugins {
    id("com.android.application")
}

// Optional release signing: create keystore.properties (git-ignored) with
// storeFile / storePassword / keyAlias / keyPassword to sign release builds.
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile.exists()) {
        keystorePropertiesFile.inputStream().use { load(it) }
    }
}
val hasReleaseKeystore = keystorePropertiesFile.exists()

android {
    namespace = "app.subscriptionstats.offline"
    compileSdk = 36

    defaultConfig {
        applicationId = "app.subscriptionstats.offline"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }

    signingConfigs {
        if (hasReleaseKeystore) {
            create("release") {
                storeFile = rootProject.file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (hasReleaseKeystore) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    // Name APKs after the app and version, e.g. subscription-stats-v0.1.0-debug.apk.
    androidComponents {
        onVariants { variant ->
            val versionName = defaultConfig.versionName
            val buildTypeName = variant.buildType
            variant.outputs.forEach { output ->
                output.outputFileName.set("subscription-stats-v${versionName}-${buildTypeName}.apk")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
