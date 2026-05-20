package com.casimirbot.helixsensor.snapshot.adapters;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.bukkit.Location;
import org.bukkit.entity.Player;

public final class ActorStateAdapter {
    public Map<String, Object> build(Player player) {
        Location location = player.getLocation();
        Location eye = player.getEyeLocation();
        List<String> flags = new ArrayList<>();
        if (player.isOnGround()) flags.add("on_ground");
        if (player.isSneaking()) flags.add("sneaking");
        if (player.isSprinting()) flags.add("sprinting");
        if (player.isSwimming()) flags.add("swimming");
        return Map.of(
            "sensor_scope", "player_observable",
            "pose", Map.of(
                "position", AdapterUtil.position(location),
                "eye", AdapterUtil.position(eye),
                "yaw", AdapterUtil.round(location.getYaw()),
                "pitch", AdapterUtil.round(location.getPitch()),
                "facing", AdapterUtil.facing(location.getYaw())
            ),
            "health", AdapterUtil.round(player.getHealth()),
            "food_level", player.getFoodLevel(),
            "saturation", AdapterUtil.round(player.getSaturation()),
            "mode", player.getGameMode().name(),
            "status_flags", flags
        );
    }
}
