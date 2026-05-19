/**
 * Shared store for shifts that have been assigned to a care giver from the
 * conflicts → live single rota flow. Stored in localStorage so the Daily Rota
 * and Advanced Rota views can render them alongside real DB visits.
 */

export type AssignedShift = {
  ref: string;
  dateIso: string;     // "YYYY-MM-DD"
  start: string;       // "HH:MM"
  end: string;         // "HH:MM"
  client: string;
  staff: string;
  serviceCall?: string;
  schedHrs?: string;
};

const KEY = "assigned_shifts_v1";

// Allow legacy `{ [ref]: name }` shape to coexist (older entries).
type Stored = Record<string, AssignedShift | string>;

function readRaw(): Stored {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function writeRaw(map: Stored) {
  localStorage.setItem(KEY, JSON.stringify(map));
  // Notify same-tab listeners (storage event only fires cross-tab).
  try { window.dispatchEvent(new Event("assigned-shifts-changed")); } catch {}
}

/** Convert "DD/MM/YYYY" → "YYYY-MM-DD" (passes through if already ISO). */
export function toIsoDate(input: string): string {
  if (!input) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const [d, m, y] = input.split("/");
  if (!d || !m || !y) return input;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function saveAssignedShift(s: AssignedShift) {
  const map = readRaw();
  map[s.ref] = { ...s, dateIso: toIsoDate(s.dateIso) };
  writeRaw(map);
}

export function removeAssignedShift(ref: string) {
  const map = readRaw();
  if (ref in map) {
    delete map[ref];
    writeRaw(map);
  }
}

export function getAssignedShifts(): AssignedShift[] {
  const map = readRaw();
  const out: AssignedShift[] = [];
  for (const [ref, v] of Object.entries(map)) {
    if (typeof v === "string") {
      // Legacy entry: only the staff name was stored. Skip — no date info.
      continue;
    }
    out.push({ ...v, ref });
  }
  return out;
}

/** Returns true if a shift with this ref has been assigned. */
export function isShiftAssigned(ref: string): boolean {
  const map = readRaw();
  return ref in map;
}

export function getAssignedStaffForRef(ref: string): string | null {
  const map = readRaw();
  const v = map[ref];
  if (!v) return null;
  return typeof v === "string" ? v : v.staff;
}

/** Subscribe to changes (same-tab + cross-tab). Returns unsubscribe fn. */
export function subscribeAssignedShifts(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  const onLocal = () => cb();
  window.addEventListener("storage", onStorage);
  window.addEventListener("assigned-shifts-changed", onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("assigned-shifts-changed", onLocal);
  };
}

/** Parse "HH:MM" → decimal hours. */
export function timeToHours(t: string): number {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}
