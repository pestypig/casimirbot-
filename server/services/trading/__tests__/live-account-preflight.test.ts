import { describe, expect, it } from "vitest";
import { extractLiveAccountPreflight } from "../live-account-preflight";

describe("live account preflight normalization", () => {
  it("extracts one buying-power/P&L value and counts only active positions/orders", () => {
    expect(extractLiveAccountPreflight({
      portfolio: { buying_power: "340.00", todays_pnl: "-1.25" },
      positions: { positions: [
        { symbol: "OLD", quantity: "0" },
        { symbol: "OPEN", quantity: "1.5" },
      ] },
      orders: { orders: [
        { order_id: "filled", status: "filled" },
        { order_id: "pending", status: "pending" },
      ] },
      symbol: "TEST",
    })).toEqual({
      buying_power_cents: 34_000,
      daily_pnl_cents: -125,
      open_position_count: 1,
      open_order_count: 1,
      symbol_position_open: false,
    });
  });

  it("fails closed on missing or ambiguous money fields", () => {
    expect(() => extractLiveAccountPreflight({
      portfolio: { buying_power: "340.00" },
      positions: [], orders: [], symbol: "TEST",
    })).toThrow(/daily-P&L projection is missing or ambiguous/u);
    expect(() => extractLiveAccountPreflight({
      portfolio: {
        buying_power: "340.00",
        nested: { buying_power: "341.00" },
        todays_pnl: "0.00",
      },
      positions: [], orders: [], symbol: "TEST",
    })).toThrow(/missing or ambiguous/u);
  });
});
