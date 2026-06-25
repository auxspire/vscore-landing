import { describe, expect, it } from "vitest";
import { redactMatchForPublic } from "./publicMatch";
import { buildPublicMatchUrl, parseMatchIdFromPath } from "./urlRouting";

describe("urlRouting", () => {
  it("parses match id from /app/match/42", () => {
    expect(parseMatchIdFromPath("/app/match/42", "/app")).toBe("42");
  });

  it("returns null for unrelated paths", () => {
    expect(parseMatchIdFromPath("/app/", "/app")).toBeNull();
  });
});

describe("redactMatchForPublic", () => {
  it("strips payment and ownership fields", () => {
    const result = redactMatchForPublic({
      id: 1,
      team1: "A",
      team2: "B",
      scoreA: 2,
      scoreB: 1,
      status: "Full Time",
      ownedBy: "user-secret",
      paymentData: { playerShares: [{ playerName: "X", amount: 100 }] },
      events: [{ type: "goal", minute: 10, player: { id: 5, name: "Rahul", phone: "+91999" } }],
    });
    expect(result).not.toBeNull();
    expect(result!.teamA).toBe("A");
    expect(result!.events[0].player).toEqual({ name: "Rahul" });
    expect((result as any).paymentData).toBeUndefined();
    expect((result as any).ownedBy).toBeUndefined();
  });
});

describe("buildPublicMatchUrl", () => {
  it("builds path with match id", () => {
    expect(buildPublicMatchUrl(99, "https://vscor.in")).toContain("/match/99");
  });
});
