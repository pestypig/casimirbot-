package com.casimirbot.helixcompanion.spike;

import net.minecraft.world.SimpleContainer;
import net.minecraft.world.item.ItemStack;

/**
 * Minimal exact-prestate settlement for S0. The visible companion inventory is
 * canonical; the detached mechanics subject contributes only a measured delta.
 */
public final class CompanionMiningSettlement {
    private CompanionMiningSettlement() {}

    public record Result(
        boolean applied,
        String outcome,
        int canonicalDamageBefore,
        int canonicalDamageAfter
    ) {}

    public static Result settleToolWear(
        SpikeCompanionEntity companion,
        int slot,
        ItemStack expectedCanonicalBefore,
        PlayerSemanticMiningProbe.ProgressiveResult mechanics
    ) {
        SimpleContainer inventory = companion.canonicalInventory();
        if (slot < 0 || slot >= inventory.getContainerSize()) {
            return new Result(false, "slot_out_of_scope", -1, -1);
        }
        ItemStack current = inventory.getItem(slot);
        int damageBefore = current.isEmpty() ? 0 : current.getDamageValue();
        if (!ItemStack.matches(current, expectedCanonicalBefore)) {
            return new Result(
                false,
                "canonical_prestate_mismatch",
                damageBefore,
                damageBefore
            );
        }
        if (!mechanics.blockDestroyed() || !"none".equals(mechanics.failureCode())) {
            return new Result(
                false,
                "mechanics_not_successful",
                damageBefore,
                damageBefore
            );
        }
        int wear = mechanics.toolDamageDelta();
        if (wear < 0 || (wear > 0 && !current.isDamageableItem())) {
            return new Result(
                false,
                "invalid_tool_wear_delta",
                damageBefore,
                damageBefore
            );
        }
        int damageAfter = damageBefore + wear;
        if (current.isDamageableItem() && damageAfter >= current.getMaxDamage()) {
            return new Result(
                false,
                "tool_break_settlement_not_in_s0",
                damageBefore,
                damageBefore
            );
        }
        ItemStack settled = current.copy();
        settled.setDamageValue(damageAfter);
        inventory.setItem(slot, settled);
        return new Result(true, "settled", damageBefore, damageAfter);
    }
}
