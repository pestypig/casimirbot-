# Java connector helper

`HelixConnectorClient` is a JDK 21 reference transport for polling and result
submission. It intentionally stores the device credential only in memory and
never logs request headers, lease tokens, or response bodies.

The Minecraft Paper connector can adopt this helper after its Gradle build
publishes the in-repository SDK as a normal dependency. The current machine's
system Java is older than the Paper project's Java 21 toolchain, so the Java
source must also run in the repository's JDK-capable CI or developer build.

