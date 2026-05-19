/**
 * Shared generator for the dummy "unallocated" shifts shown in the Conflicts
 * screen. Exposed here so the Daily Rota and Advanced Rota can display the
 * same pool of shifts that are missing a care giver, matched by date.
 */

import { isShiftAssigned } from "./assigned-shifts";

const CALL_TYPES = [
  "WCC - Lunch Call (Z4-...",
  "WCC - Lunch Call (Z4-...",
  "WCC - Evening Call (...",
  "WCC - Morning Call (...",
  "Private Morning Call",
];

export type UnassignedShift = {
  id: string;
  ref: string;
  dateIso: string;       // YYYY-MM-DD
  date: string;          // DD/MM/YYYY (display)
  status: string;
  isCancelled: boolean;
  serviceUser: string;
  receiverId: string;
  start: string;         // HH:MM
  end: string;           // HH:MM
  duration: string;
  teamMember: "Unallocated";
  serviceCall: string;
  week: string;
  weekNum: number;
};

function fmtDateUK(d: Date) {
  return d.toLocaleDateString("en-GB");
}
function fmtIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildUnassignedShifts(careReceivers: { id: string; name: string; address?: string }[]): UnassignedShift[] {
  const today = new Date();
  const pool = careReceivers.length > 0
    ? careReceivers
    : [{ id: "", name: "—", address: "" }];
  const count = Math.max(26, pool.length);
  const rows: UnassignedShift[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + (i % 14) + 1);
    const isCancelled = i === 3 || i === 6;
    const startH = 7 + (i % 8);
    const startM = i % 2 === 0 ? 0 : 30;
    const durMin = [30, 45, 60, 15][i % 4];
    const endTotal = startH * 60 + startM + durMin;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    const fmt = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const cr = pool[i % pool.length];
    const label = cr.address ? `${cr.name} - ${cr.address}` : cr.name;
    rows.push({
      id: `cf-${i}`,
      ref: String(147039184 + i * 137),
      date: fmtDateUK(d),
      dateIso: fmtIso(d),
      status: isCancelled ? "Cancelled" : "Due",
      isCancelled,
      serviceUser: label,
      receiverId: cr.id,
      start: fmt(startH, startM),
      end: fmt(endH, endM),
      duration: fmt(Math.floor(durMin / 60), durMin % 60),
      teamMember: "Unallocated",
      serviceCall: CALL_TYPES[i % CALL_TYPES.length],
      week: i % 9 === 7 ? "All Weeks" : "Week 2",
      weekNum: 18,
    });
  }
  return rows;
}

/** Unassigned shifts for a given ISO date (excludes any that have since been assigned). */
export function getUnassignedShiftsForDate(
  careReceivers: { id: string; name: string; address?: string }[],
  dateIso: string,
): UnassignedShift[] {
  return buildUnassignedShifts(careReceivers).filter(
    (r) => r.dateIso === dateIso && !isShiftAssigned(r.ref),
  );
}
