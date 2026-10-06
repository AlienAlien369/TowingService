import { describe, expect, it } from "vitest";
import { canTransition, DRIVER_NEXT, TERMINAL } from "./state";

describe("booking state machine", () => {
  it("walks the happy path", () => {
    const path = ["PENDING_DISPATCH", "OFFERED", "ASSIGNED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"] as const;
    for (let i = 0; i < path.length - 1; i++) expect(canTransition(path[i], path[i + 1])).toBe(true);
  });
  it("blocks skipping steps and leaving terminal states", () => {
    expect(canTransition("ASSIGNED", "COMPLETED")).toBe(false);
    expect(canTransition("EN_ROUTE", "IN_PROGRESS")).toBe(false);
    for (const t of TERMINAL) for (const to of ["ASSIGNED", "PENDING_DISPATCH", "CANCELLED"] as const) expect(canTransition(t, to)).toBe(false);
  });
  it("does not allow cancelling once service is in progress", () => {
    expect(canTransition("IN_PROGRESS", "CANCELLED")).toBe(false);
  });
  it("every driver step is a legal transition", () => {
    for (const [from, step] of Object.entries(DRIVER_NEXT)) expect(canTransition(from as never, step!.to)).toBe(true);
  });
});
