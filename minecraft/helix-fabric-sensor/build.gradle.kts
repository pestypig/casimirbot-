plugins {
    id("fabric-loom") version "1.11.8"
    java
}

group = "com.casimirbot"
version = "0.2.0"

base {
    archivesName.set("HelixFabricSensor")
}

repositories {
    mavenCentral()
    maven("https://maven.fabricmc.net/")
}

java {
    toolchain.languageVersion.set(JavaLanguageVersion.of(21))
    withSourcesJar()
}

dependencies {
    minecraft("com.mojang:minecraft:1.21.8")
    mappings(loom.officialMojangMappings())
    modImplementation("net.fabricmc:fabric-loader:0.18.4")
    modImplementation("net.fabricmc.fabric-api:fabric-api:0.136.1+1.21.8")

    val connectorCore = implementation(
        "com.casimirbot:helix-minecraft-connector-core:0.2.0"
    )
    include(connectorCore!!)

    testImplementation(platform("org.junit:junit-bom:5.10.2"))
    testImplementation("org.junit.jupiter:junit-jupiter")
}

tasks.processResources {
    inputs.property("version", project.version)
    filesMatching("fabric.mod.json") {
        expand("version" to project.version)
    }
}

tasks.test {
    useJUnitPlatform()
}
