/**
 * Shared constants and message types for the Scenario Controller ↔ Main App
 * BroadcastChannel. Both tabs import from here so the contract stays in one place.
 */

export const SCENARIO_CHANNEL = "desk-nexgen-scenario";

export type CaseKey = "jordan" | "sofia" | "marcus" | "terry" | "diana";
export type CaseStatus = "idle" | "queued" | "active" | "resolved";

/** Messages sent controller page → main app */
export type ControllerMsg =
  | { type: "HELLO" }
  | { type: "BYE" }
  | { type: "TRIGGER"; case: CaseKey };

/** Messages sent main app → controller page */
export type AppMsg =
  | { type: "APP_READY"; statuses?: Partial<Record<CaseKey, CaseStatus>> }
  | { type: "CASE_STATUS"; case: CaseKey; status: CaseStatus };
