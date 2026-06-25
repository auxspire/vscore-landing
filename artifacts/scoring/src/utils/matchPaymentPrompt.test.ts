import { describe, expect, it } from "vitest";
import {
  findPlayerPaymentShare,
  isMatchCompleted,
  shouldShowPlayerOwesBanner,
  shouldShowSplitTurfCostCta,
  splitTurfCostCtaMessage,
} from "./matchPaymentPrompt";

describe("matchPaymentPrompt", () => {
  it("detects completed matches", () => {
    expect(isMatchCompleted({ completedAt: "2026-06-15T10:00:00Z" })).toBe(true);
    expect(isMatchCompleted({ status: "Full Time" })).toBe(true);
    expect(isMatchCompleted({ status: "live" })).toBe(false);
  });

  it("shows split CTA for owner on completed match without payment", () => {
    const match = { id: 1, completedAt: "2026-06-15", status: "Full Time" };
    expect(shouldShowSplitTurfCostCta(match, { isOwner: true })).toBe(true);
    expect(shouldShowSplitTurfCostCta(match, { isOwner: false })).toBe(false);
    expect(
      shouldShowSplitTurfCostCta({ ...match, paymentData: { total: 1600 } }, { isOwner: true }),
    ).toBe(false);
  });

  it("returns contextual CTA copy", () => {
    expect(splitTurfCostCtaMessage(true)).toContain("Match done");
    expect(splitTurfCostCtaMessage(false)).toContain("Split turf rent");
  });

  it("finds player share and shows owes banner for non-owner", () => {
    const match = {
      completedAt: "2026-06-15",
      paymentData: {
        playerShares: [{ playerId: 5, playerName: "Rahul", amount: 200, isPaid: false }],
      },
    };
    expect(findPlayerPaymentShare(match, { playerId: 5, playerName: "Rahul" })).toEqual({
      amount: 200,
      isPaid: false,
    });
    expect(
      shouldShowPlayerOwesBanner(match, {
        isOwner: false,
        linkedPlayer: { playerId: 5, playerName: "Rahul" },
      }),
    ).toBe(true);
    expect(
      shouldShowPlayerOwesBanner(match, {
        isOwner: true,
        linkedPlayer: { playerId: 5, playerName: "Rahul" },
      }),
    ).toBe(false);
  });
});
