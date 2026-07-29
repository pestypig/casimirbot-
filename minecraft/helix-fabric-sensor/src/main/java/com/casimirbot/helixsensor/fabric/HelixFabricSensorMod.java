package com.casimirbot.helixsensor.fabric;

import com.casimirbot.helixsensor.HelixSensorConfig;
import java.util.logging.Logger;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;

public final class HelixFabricSensorMod implements ModInitializer {
    public static final String MOD_ID = "helix_fabric_sensor";
    private static final Logger LOGGER = Logger.getLogger(MOD_ID);

    private FabricConnectorRuntime runtime;

    @Override
    public void onInitialize() {
        HelixSensorConfig config = FabricSensorConfigLoader.loadOrCreate(LOGGER);
        this.runtime = new FabricConnectorRuntime(config, LOGGER);
        ServerLifecycleEvents.SERVER_STARTED.register(runtime::start);
        ServerTickEvents.END_SERVER_TICK.register(runtime::tick);
        ServerLifecycleEvents.SERVER_STOPPING.register(server -> runtime.close());
        LOGGER.info(
            "Helix Fabric Sensor registered for integrated and dedicated server lifecycle events."
        );
    }
}
