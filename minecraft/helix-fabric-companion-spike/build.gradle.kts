plugins {
    id("fabric-loom") version "1.11.8"
    java
}

group = "com.casimirbot"
version = "0.1.0-feasibility"

base {
    archivesName.set("HelixFabricCompanionSpike")
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

    testImplementation(platform("org.junit:junit-bom:5.10.2"))
    testImplementation("org.junit.jupiter:junit-jupiter")
}

fabricApi {
    configureTests {
        createSourceSet = true
        modId = "helix_fabric_companion_spike_gametest"
        enableGameTests = true
        eula = true
    }
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

// Keep focused acceptance lanes reproducible without editing the registered
// GameTest catalog. Example: -PgametestFilter=companion_inventory_custody
if (project.hasProperty("gametestFilter")) {
    tasks.named<JavaExec>("runGameTest") {
        systemProperty(
            "fabric-api.gametest.filter",
            project.property("gametestFilter").toString()
        )
    }
}
