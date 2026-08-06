package com.casimirbot.helixplayer.fabric;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;

/** Optional, reflection-only bridge to Baritone's public API. */
final class BaritoneFacade {
    private final Object baritone;
    private final Object goalProcess;
    private final Object pathingBehavior;
    private final Constructor<?> goalBlockConstructor;
    private final Method setGoalAndPath;
    private final Method isPathing;
    private final Method cancelEverything;
    private final String version;

    private BaritoneFacade(
        Object baritone,
        Object goalProcess,
        Object pathingBehavior,
        Constructor<?> goalBlockConstructor,
        Method setGoalAndPath,
        Method isPathing,
        Method cancelEverything,
        String version
    ) {
        this.baritone = baritone;
        this.goalProcess = goalProcess;
        this.pathingBehavior = pathingBehavior;
        this.goalBlockConstructor = goalBlockConstructor;
        this.setGoalAndPath = setGoalAndPath;
        this.isPathing = isPathing;
        this.cancelEverything = cancelEverything;
        this.version = version;
    }

    static BaritoneFacade discover() {
        try {
            Class<?> apiClass = Class.forName("baritone.api.BaritoneAPI");
            Object provider = apiClass.getMethod("getProvider").invoke(null);
            Object baritone = provider.getClass().getMethod("getPrimaryBaritone").invoke(provider);
            Object goalProcess = baritone.getClass().getMethod("getCustomGoalProcess").invoke(baritone);
            Object pathingBehavior = baritone.getClass().getMethod("getPathingBehavior").invoke(baritone);
            Class<?> goalClass = Class.forName("baritone.api.pathing.goals.Goal");
            Class<?> goalBlockClass = Class.forName("baritone.api.pathing.goals.GoalBlock");
            Method setGoalAndPath = goalProcess.getClass().getMethod("setGoalAndPath", goalClass);
            Method isPathing = pathingBehavior.getClass().getMethod("isPathing");
            Method cancelEverything = pathingBehavior.getClass().getMethod("cancelEverything");
            String version = apiClass.getPackage() == null ||
                apiClass.getPackage().getImplementationVersion() == null
                ? "installed"
                : apiClass.getPackage().getImplementationVersion();
            return new BaritoneFacade(
                baritone,
                goalProcess,
                pathingBehavior,
                goalBlockClass.getConstructor(int.class, int.class, int.class),
                setGoalAndPath,
                isPathing,
                cancelEverything,
                version
            );
        } catch (ReflectiveOperationException | LinkageError unavailable) {
            return new BaritoneFacade(null, null, null, null, null, null, null, "unavailable");
        }
    }

    boolean available() {
        return baritone != null;
    }

    String version() {
        return version;
    }

    boolean start(int x, int y, int z) {
        if (!available()) return false;
        try {
            Object goal = goalBlockConstructor.newInstance(x, y, z);
            setGoalAndPath.invoke(goalProcess, goal);
            return true;
        } catch (ReflectiveOperationException error) {
            return false;
        }
    }

    boolean isPathing() {
        if (!available()) return false;
        try {
            return Boolean.TRUE.equals(isPathing.invoke(pathingBehavior));
        } catch (ReflectiveOperationException error) {
            return false;
        }
    }

    void cancel() {
        if (!available()) return;
        try {
            cancelEverything.invoke(pathingBehavior);
        } catch (ReflectiveOperationException ignored) {
            // Control release remains mandatory even if the optional engine disappeared.
        }
    }
}
