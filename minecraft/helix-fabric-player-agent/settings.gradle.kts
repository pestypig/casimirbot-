pluginManagement {
    repositories {
        maven("https://maven.fabricmc.net/")
        gradlePluginPortal()
        mavenCentral()
    }
}

includeBuild("../helix-minecraft-connector-core")

rootProject.name = "helix-fabric-player-agent"
