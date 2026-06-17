/**
 * FIFA 2026 knockout bracket geometry — which teams can meet at each stage.
 * Used to filter impossible conditional opponents (e.g. same SF half → not a Final foe).
 */

export const FIXED_WINNER_SLOTS: Array<{ slot: number; group: string; pos: "W" | "R" }> = [
  { slot: 0, group: "E", pos: "W" },
  { slot: 2, group: "I", pos: "W" },
  { slot: 4, group: "A", pos: "R" },
  { slot: 5, group: "B", pos: "R" },
  { slot: 6, group: "F", pos: "W" },
  { slot: 7, group: "C", pos: "R" },
  { slot: 8, group: "K", pos: "R" },
  { slot: 9, group: "L", pos: "R" },
  { slot: 10, group: "H", pos: "W" },
  { slot: 11, group: "J", pos: "R" },
  { slot: 12, group: "D", pos: "W" },
  { slot: 14, group: "G", pos: "W" },
  { slot: 16, group: "C", pos: "W" },
  { slot: 17, group: "F", pos: "R" },
  { slot: 18, group: "E", pos: "R" },
  { slot: 19, group: "I", pos: "R" },
  { slot: 20, group: "A", pos: "W" },
  { slot: 22, group: "L", pos: "W" },
  { slot: 24, group: "J", pos: "W" },
  { slot: 25, group: "H", pos: "R" },
  { slot: 26, group: "D", pos: "R" },
  { slot: 27, group: "G", pos: "R" },
  { slot: 28, group: "B", pos: "W" },
  { slot: 30, group: "K", pos: "W" },
];

export const THIRD_PLACE_SLOT_POOLS: Record<number, string[]> = {
  1: ["A", "B", "C", "D", "F"],
  3: ["C", "D", "F", "G", "H"],
  13: ["B", "E", "F", "I", "J"],
  15: ["A", "E", "H", "I", "J"],
  21: ["C", "E", "F", "H", "I"],
  23: ["E", "H", "I", "J", "K"],
  29: ["E", "F", "G", "I", "J"],
  31: ["D", "E", "I", "J", "L"],
};

export type KnockoutStage =
  | "round_of_32"
  | "round_of_16"
  | "quarterfinal"
  | "semifinal"
  | "final";

export type GroupFinish = "1st" | "2nd" | "3rd";

function quadrant(slot: number): number {
  return Math.floor(slot / 8);
}

function semifinalSide(slot: number): 1 | 2 {
  return quadrant(slot) < 2 ? 1 : 2;
}

function r16HalfWithinQuadrant(slot: number): number {
  return Math.floor((slot % 8) / 4);
}

/** Bracket slots for a team that finished 1st or 2nd in its group (fixed by FIFA matrix). */
export function fixedSlotsForFinish(group: string, finish: "1st" | "2nd"): number[] {
  const pos = finish === "1st" ? "W" : "R";
  return FIXED_WINNER_SLOTS.filter((s) => s.group === group && s.pos === pos).map((s) => s.slot);
}

/** Possible R32 slots if the team advances as one of the eight best third-place teams. */
export function thirdPlaceSlotsForGroup(group: string): number[] {
  return Object.entries(THIRD_PLACE_SLOT_POOLS)
    .filter(([, pool]) => pool.includes(group))
    .map(([slot]) => Number(slot));
}

export function slotsForGroupFinish(group: string, finish: GroupFinish): number[] {
  if (finish === "3rd") return thirdPlaceSlotsForGroup(group);
  return fixedSlotsForFinish(group, finish);
}

/** Whether two bracket slots can face each other at a given knockout stage. */
export function canSlotsMeetAtStage(slotA: number, slotB: number, stage: KnockoutStage): boolean {
  if (slotA === slotB) return false;

  const qA = quadrant(slotA);
  const qB = quadrant(slotB);

  switch (stage) {
    case "round_of_32":
      return qA === qB && Math.abs(slotA - slotB) === 1;
    case "round_of_16":
      return qA === qB && r16HalfWithinQuadrant(slotA) !== r16HalfWithinQuadrant(slotB);
    case "quarterfinal":
      return qA === qB;
    case "semifinal":
      return semifinalSide(slotA) === semifinalSide(slotB);
    case "final":
      return semifinalSide(slotA) !== semifinalSide(slotB);
    default:
      return true;
  }
}

export function canGroupFinishesMeetAtStage(
  teamGroup: string,
  teamFinish: GroupFinish,
  oppGroup: string,
  oppFinish: GroupFinish,
  stage: KnockoutStage,
): boolean {
  if (teamGroup === oppGroup) return false;

  const teamSlots = slotsForGroupFinish(teamGroup, teamFinish);
  const oppSlots = slotsForGroupFinish(oppGroup, oppFinish);
  if (teamSlots.length === 0 || oppSlots.length === 0) return true;

  return teamSlots.some((ts) => oppSlots.some((os) => canSlotsMeetAtStage(ts, os, stage)));
}

export function topFinishKey(counts: Record<string, number>): GroupFinish | null {
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  const top = entries.sort((a, b) => b[1] - a[1])[0][0];
  if (top === "1st" || top === "2nd" || top === "3rd") return top;
  return null;
}
