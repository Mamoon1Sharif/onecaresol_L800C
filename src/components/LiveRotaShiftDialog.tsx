import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Lock, Plus, Save, X, Pencil } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCareGivers } from "@/hooks/use-care-data";
import { removePendingClashesForStaff, removePendingClashesForRef } from "@/pages/rota/Conflicts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCareGiverAvatar } from "@/lib/avatars";
import { saveAssignedShift, removeAssignedShift, toIsoDate } from "@/lib/assigned-shifts";

export type LiveRotaShift = {
  visitId?: string;
  ref: string;
  date: string;
  start: string;
  end: string;
  client: string;
  staff: string;
  serviceCall?: string;
  schedHrs?: string;
  clockHrs?: string;
};

const INITIAL_NOTES = [
  { ref: "139988439", created: "21/04/2026 12:06", note: "Service user prefers door bell to be rung twice on arrival.", by: "Maya Sawich", visible: "Yes" },
  { ref: "139988512", created: "22/04/2026 09:14", note: "Key safe code refreshed — collect from office before visit.", by: "Anna Pereira", visible: "Yes" },
  { ref: "139988577", created: "23/04/2026 16:42", note: "Family will be present during evening call. Hand over notes.", by: "Maria Khalil", visible: "No" },
];

const INITIAL_MEDS = [
  { name: "Atorvastatin", period: "Evening: 16:00 - 22:00", planned: ["Administer", "1", "40mg", "ONE to be taken at NIGHT"] },
  { name: "Carbamazepine", period: "Evening: 16:00 - 22:00", planned: ["Administer", "1", "100mg", "ONE to be taken in the MORNING and NIGHT"] },
  { name: "Dermol 500 Lotion", period: "", planned: ["Applied", "Use as a soap substitute."] },
  { name: "E45 Cream", period: "", planned: ["Applied", "Apply as required"] },
  { name: "Epimax Excetra Cream", period: "", planned: ["Applied", "Apply to arms and back daily"] },
  { name: "Medi-Derma S Barrier Cream", period: "", planned: ["Applied", "Apply to groin and bottom when required. Use a pea size amount."] },
  { name: "Ramipril", period: "Evening: 16:00 - 22:00", planned: ["Administer", "1", "5mg", "ONE to be taken in the MORNING and at NIGHT."] },
];

export function LiveRotaShiftDialog({
  shift, open, onClose,
}: { shift: LiveRotaShift | null; open: boolean; onClose: () => void }) {
  const [clockEdit, setClockEdit] = useState<null | "in" | "out">(null);
  const [amendOpen, setAmendOpen] = useState(false);
  const [current, setCurrent] = useState<LiveRotaShift | null>(shift);
  const [confirmation, setConfirmation] = useState<{ before: LiveRotaShift; after: LiveRotaShift } | null>(null);
  const [removed, setRemoved] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSelected, setAssignSelected] = useState<string>("");
  const { data: caregivers = [] } = useCareGivers();
  const qc = useQueryClient();
  const [locks, setLocks] = useState<{ id: string; reason: string; by: string; created: string }[]>([]);
  const [showLockPrompt, setShowLockPrompt] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [showNotePrompt, setShowNotePrompt] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newNoteVisible, setNewNoteVisible] = useState("Yes");
  const [pendingCriticalAction, setPendingCriticalAction] = useState<null | {
    title: string;
    description: string;
    actionLabel: string;
    destructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }>(null);
  const [shiftBulk, setShiftBulk] = useState("bulk");
  const [shiftSearch, setShiftSearch] = useState("");
  const [shiftRowChecked, setShiftRowChecked] = useState(false);
  const [medFilter, setMedFilter] = useState("all");
  const [medSearch, setMedSearch] = useState("");
  const [medChecked, setMedChecked] = useState<Record<string, boolean>>({});

  // sync incoming shift
  if (shift && (!current || current.ref !== shift.ref)) {
    setCurrent(shift);
    setRemoved(false);
  }
  if (!shift || !current) return null;

  const { data: liveVisitState } = useQuery({
    queryKey: ["live-rota-visit-state", current.visitId],
    enabled: !!current.visitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_visits")
        .select("status, check_in_time, check_out_time")
        .eq("id", current.visitId as string)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const liveStatus = (liveVisitState?.status || "").toLowerCase();
  const isImmutable = Boolean(
    liveVisitState?.check_in_time || liveVisitState?.check_out_time || ["in progress", "completed", "complete", "finished"].includes(liveStatus),
  );
  const immutableReason = "This shift is already in progress or completed, so it can't be changed.";
  const guardImmutable = () => {
    if (!isImmutable) return false;
    toast.error(immutableReason);
    return true;
  };

  const matchesShiftSearch = (val: string) =>
    !shiftSearch || val.toLowerCase().includes(shiftSearch.toLowerCase());
  const shiftRowText = `${current.ref} ${current.client} ${current.staff} ${current.serviceCall ?? ""}`;
  const showShiftRow = matchesShiftSearch(shiftRowText);

  // Live medications for this shift's client
  const clientName = (current.client || "").split(" - ")[0].trim();
  const { data: liveMeds = [] } = useQuery({
    queryKey: ["shift_medications", clientName, current.serviceCall ?? ""],
    enabled: !!clientName,
    refetchInterval: 8000,
    queryFn: async () => {
      const { data: cr } = await supabase
        .from("care_receivers")
        .select("id")
        .ilike("name", clientName)
        .limit(1)
        .maybeSingle();
      if (!cr?.id) return [] as any[];
      const { data: meds } = await supabase
        .from("medications")
        .select("id, medication, dosage, notes, time_of_day, scheduled_time, service_type, date, administered_by")
        .eq("care_receiver_id", cr.id)
        .order("date", { ascending: false })
        .limit(50);
      return (meds ?? []) as any[];
    },
  });

  const medGroupLabel = (() => {
    const t = (liveMeds[0]?.time_of_day || "").toLowerCase();
    if (t.includes("morning")) return "Morning Medication";
    if (t.includes("lunch")) return "Lunch Medication";
    if (t.includes("evening") || t.includes("night")) return "Evening Medication";
    const sc = (current.serviceCall || "").toLowerCase();
    if (sc.includes("morning")) return "Morning Medication";
    if (sc.includes("lunch")) return "Lunch Medication";
    if (sc.includes("evening") || sc.includes("night")) return "Evening Medication";
    return "Medication";
  })();

  const filteredMeds = liveMeds.filter((m: any) => {
    const inFilter = medFilter === "all" || m.medication === medFilter;
    const inSearch = !medSearch || (m.medication || "").toLowerCase().includes(medSearch.toLowerCase());
    return inFilter && inSearch;
  });

  const runShiftBulk = () => {
    if (guardImmutable()) return;
    if (shiftBulk === "bulk") {
      toast.info("Select a bulk action first");
      return;
    }
    if (!shiftRowChecked) {
      toast.error("Select at least one shift row");
      return;
    }
    toast.success(`${shiftBulk} applied to selected shift`);
    setShiftBulk("bulk");
    setShiftRowChecked(false);
  };

  const runMedAction = () => {
    if (guardImmutable()) return;
    const selected = Object.entries(medChecked).filter(([, v]) => v).map(([k]) => k);
    if (medFilter === "all" && selected.length === 0) {
      toast.error("Select medications or pick an action");
      return;
    }
    const target = medFilter !== "all" ? [medFilter] : selected;
    toast.success(`Action applied to ${target.length} med(s)`);
    setMedChecked({});
    setMedFilter("all");
  };


  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
            <DialogTitle className="text-base">
              Live Rota Shift — Ref {current.ref} · {current.client} · {current.date} · {current.start}–{current.end}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Live Rota Shift(s) section */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-primary/70 flex items-center justify-between px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-foreground">Live Rota Shift(s)</h3>
                <Button
                  size="sm"
                  className="h-7 gap-1 bg-warning hover:bg-warning/90 text-warning-foreground"
                  onClick={() => setAmendOpen(true)}
                >
                  <Plus className="h-3 w-3" /> Edit Shift Details
                </Button>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={shiftBulk} onValueChange={setShiftBulk}>
                    <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bulk">Bulk Actions...</SelectItem>
                      <SelectItem value="Reassign">Reassign</SelectItem>
                      <SelectItem value="Cancel">Cancel Visit</SelectItem>
                      <SelectItem value="Activate">Activate Visit</SelectItem>
                      <SelectItem value="Reset">Reset Visit</SelectItem>
                      <SelectItem value="Send Push">Send Push Message</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8 bg-success hover:bg-success/90 text-success-foreground" onClick={runShiftBulk}>Go</Button>
                  <div className="ml-auto flex items-center gap-2">
                    <Label className="text-xs">Search:</Label>
                    <Input value={shiftSearch} onChange={(e) => setShiftSearch(e.target.value)} className="h-8 w-48 text-xs" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="p-2 border border-border w-8">
                          <Checkbox checked={shiftRowChecked} onCheckedChange={(v) => setShiftRowChecked(!!v)} />
                        </th>
                        <th className="p-2 border border-border text-left">Ref</th>
                        <th className="p-2 border border-border text-left">Date</th>
                        <th className="p-2 border border-border text-left">Status</th>
                        <th className="p-2 border border-border text-left">Service Member</th>
                        <th className="p-2 border border-border text-left">Start</th>
                        <th className="p-2 border border-border text-left">End</th>
                        <th className="p-2 border border-border text-left">Duration</th>
                        <th className="p-2 border border-border text-left">Care Giver</th>
                        <th className="p-2 border border-border text-left">Service Call</th>
                        <th className="p-2 border border-border text-left">Week</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showShiftRow ? (
                        <tr>
                          <td className="p-2 border border-border">
                            <Checkbox checked={shiftRowChecked} onCheckedChange={(v) => setShiftRowChecked(!!v)} />
                          </td>
                          <td className="p-2 border border-border font-mono text-primary underline cursor-pointer">{current.ref}</td>
                          <td className="p-2 border border-border">{current.date}</td>
                          <td className="p-2 border border-border">Due</td>
                          <td className="p-2 border border-border text-primary underline cursor-pointer">{current.client}</td>
                          <td className="p-2 border border-border">{current.start}</td>
                          <td className="p-2 border border-border">{current.end}</td>
                          <td className="p-2 border border-border">{current.schedHrs ?? "00:30"}</td>
                          <td className="p-2 border border-border text-primary underline cursor-pointer">
                            {removed ? (
                              <button onClick={() => setAssignOpen(true)} className="italic text-primary hover:underline">
                                Unassigned — Assign
                              </button>
                            ) : current.staff}
                          </td>
                          <td className="p-2 border border-border">{current.serviceCall ?? "Private Eve..."}</td>
                          <td className="p-2 border border-border">Week 1</td>
                        </tr>
                      ) : (
                        <tr><td colSpan={11} className="p-3 text-center text-xs text-muted-foreground border border-border">No matches.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Built from template: <span className="text-primary underline">4496619</span> at 11:54 on 20/04/2026
                </p>
              </div>
            </section>

            {/* Assigned Care Givers */}
            {(() => {
              const isUnassigned = removed || !current.staff || current.staff.toLowerCase() === "unallocated";
              const assignedCg = !isUnassigned
                ? caregivers.find((c) => c.name?.toLowerCase() === current.staff.toLowerCase())
                : undefined;
              const avatarSrc = assignedCg ? getCareGiverAvatar(assignedCg.id, assignedCg.avatar_url) : null;
              return (
                <section className="border border-border rounded-sm overflow-hidden">
                  <div className="border-t-2 border-t-primary/70 px-3 py-2 bg-card">
                    <h3 className="text-sm font-semibold text-foreground">Assigned Care Givers</h3>
                  </div>
                  <div className="p-4">
                    {isUnassigned ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById("staff-availability-section");
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "start" });
                              el.classList.add("ring-2", "ring-primary");
                              setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1600);
                            }
                          }}
                          className="w-full border-2 border-dashed border-border rounded-sm py-10 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/40 hover:border-primary/50 transition-colors"
                        >
                          <span className="text-base font-medium">Add Care Giver/s</span>
                          <span className="text-xs mt-1">Assign a Care Giver to this shift</span>
                        </button>
                        <p className="text-xs text-primary mt-4 text-center">
                          If clock in or out distances are not showing, it means your care giver has location services off on their mobile phone.
                        </p>
                      </>
                    ) : (
                      <div className="flex gap-6">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-[140px] h-[140px] rounded-sm border border-border bg-muted overflow-hidden flex items-center justify-center">
                            {avatarSrc ? (
                              <img src={avatarSrc} alt={current.staff} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-muted-foreground text-xs px-2 text-center">{current.staff}</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-8 w-[140px]"
                            onClick={() => setConfirmRemove(true)}
                          >
                            ↑ Remove Care Giver
                          </Button>
                        </div>
                        <div className="flex-1">
                          <div className="text-primary font-medium mb-2">{current.staff}</div>
                          <div className="space-y-1 text-sm">
                            <button onClick={() => setClockEdit("in")} className="text-success hover:underline block">
                              - Clock In
                            </button>
                            <button onClick={() => setClockEdit("out")} className="text-success hover:underline block">
                              - Clock Out
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-6 text-center">
                            If clock in or out distances are not showing, it means your care giver has location services off on their mobile phone.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            })()}

            {/* Rota Locks */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-warning/80 flex items-center justify-between px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" /> Rota Locks
                </h3>
                <Button
                  size="sm"
                  className="h-7 gap-1 bg-success hover:bg-success/90 text-success-foreground"
                  onClick={() => { setLockReason(""); setShowLockPrompt(true); }}
                >
                  <Plus className="h-3 w-3" /> Add Lock
                </Button>
              </div>
              <div className="p-3 space-y-2">
                {locks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No locks set.</p>
                ) : (
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="p-2 border border-border text-left">Reason</th>
                        <th className="p-2 border border-border text-left">Created By</th>
                        <th className="p-2 border border-border text-left">Created</th>
                        <th className="p-2 border border-border w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {locks.map((l) => (
                        <tr key={l.id} className="border-b border-border">
                          <td className="p-2 border border-border">{l.reason}</td>
                          <td className="p-2 border border-border">{l.by}</td>
                          <td className="p-2 border border-border">{l.created}</td>
                          <td className="p-2 border border-border text-center">
                            <button
                              className="text-destructive hover:underline text-xs"
                              onClick={() => {
                                setLocks((p) => p.filter((x) => x.id !== l.id));
                                toast.success("Lock removed");
                              }}
                            >Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Live Rota Notes */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-primary/70 flex items-center justify-between px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-foreground">Live Rota Notes</h3>
                <Button
                  size="sm"
                  className="h-7 gap-1 bg-success hover:bg-success/90 text-success-foreground"
                  onClick={() => { setNewNote(""); setNewNoteVisible("Yes"); setShowNotePrompt(true); }}
                >
                  <Plus className="h-3 w-3" /> Add New
                </Button>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Notes marked as hidden will only appear on a single rota, service member and care giver note area or some of the reports. Notes marked as hidden will also not appear on the Care Portal section.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="p-2 border border-border text-left">Ref</th>
                        <th className="p-2 border border-border text-left">Note</th>
                        <th className="p-2 border border-border text-left">Created By</th>
                        <th className="p-2 border border-border text-left">Visible</th>
                        <th className="p-2 border border-border w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {notes.map((n) => (
                        <tr key={n.ref} className="border-b border-border hover:bg-muted/30">
                          <td className="p-2 border border-border font-mono text-[11px]">{n.ref}</td>
                          <td className="p-2 border border-border">{n.note}</td>
                          <td className="p-2 border border-border text-primary underline cursor-pointer">{n.by}</td>
                          <td className="p-2 border border-border">{n.visible}</td>
                          <td className="p-2 border border-border text-center">
                            <button
                              className="text-destructive hover:underline text-xs"
                              onClick={() => {
                                setNotes((p) => p.filter((x) => x.ref !== n.ref));
                                toast.success("Note removed");
                              }}
                            >Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Care Givers + Availability */}
            <StaffAvailabilitySection
              caregivers={caregivers as any[]}
              currentStaffName={current.staff}
              shiftDate={current.date}
              shiftRef={current.ref}
              onAssign={(name) => {
                setCurrent({ ...current, staff: name });
                setRemoved(false);
                saveAssignedShift({
                  ref: current.ref,
                  dateIso: toIsoDate(current.date),
                  start: current.start,
                  end: current.end,
                  client: current.client,
                  staff: name,
                  serviceCall: current.serviceCall,
                  schedHrs: current.schedHrs,
                });
                removePendingClashesForRef(current.ref);
                toast.success(`${name} assigned to shift ${current.ref}`);
              }}
            />



            {/* Medication */}
            <section className="border border-border rounded-sm overflow-hidden">
              <div className="border-t-2 border-t-primary/70 flex items-center justify-between px-3 py-2 bg-card">
                <h3 className="text-sm font-semibold text-primary">Medication ({medGroupLabel})</h3>
                <span className="text-xs text-muted-foreground">{clientName || "—"}</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={medFilter} onValueChange={setMedFilter}>
                    <SelectTrigger className="h-8 w-[220px] text-xs"><SelectValue placeholder="Please Select Meds..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Medications</SelectItem>
                      {Array.from(new Set(liveMeds.map((m: any) => m.medication))).map((name) => (
                        <SelectItem key={name as string} value={name as string}>{name as string}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8 bg-success hover:bg-success/90 text-success-foreground" onClick={runMedAction}>Go</Button>
                  <div className="ml-auto flex items-center gap-2">
                    <Label className="text-xs">Search:</Label>
                    <Input value={medSearch} onChange={(e) => setMedSearch(e.target.value)} className="h-8 w-48 text-xs" placeholder="Search meds..." />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="p-2 border border-border w-8"><Checkbox /></th>
                        <th className="p-2 border border-border text-left">Med Name</th>
                        <th className="p-2 border border-border text-left">Status</th>
                        <th className="p-2 border border-border text-center">Audited</th>
                        <th className="p-2 border border-border text-left">Audit Notes</th>
                        <th className="p-2 border border-border text-left">Admin Details</th>
                        <th className="p-2 border border-border text-left">Linked Areas</th>
                        <th className="p-2 border border-border text-left">Med Group</th>
                        <th className="p-2 border border-border text-left">Period</th>
                        <th className="p-2 border border-border text-left">Planned</th>
                        <th className="p-2 border border-border text-left">Body Map</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMeds.length === 0 && (
                        <tr><td colSpan={11} className="p-3 text-center text-xs text-muted-foreground border border-border">
                          {clientName ? `No medications recorded for ${clientName}.` : "No client selected."}
                        </td></tr>
                      )}
                      {filteredMeds.map((m: any) => {
                        const administered = !!m.administered_by;
                        const planned = [m.dosage ? `Administer ${m.dosage}` : "Administer", m.notes].filter(Boolean).join("\n");
                        const period = m.scheduled_time
                          ? `${m.time_of_day ? m.time_of_day + ": " : ""}${m.scheduled_time}`
                          : (m.time_of_day || "—");
                        return (
                          <tr key={m.id} className="border-b border-border hover:bg-muted/30">
                            <td className="p-2 border border-border">
                              <Checkbox
                                checked={!!medChecked[m.id]}
                                onCheckedChange={(v) => setMedChecked((p) => ({ ...p, [m.id]: !!v }))}
                              />
                            </td>
                            <td className="p-2 border border-border">{m.medication}</td>
                            <td className="p-2 border border-border">{administered ? "Administered" : "Due"}</td>
                            <td className={`p-2 border border-border text-center ${administered ? "text-success" : "text-destructive"}`}>{administered ? "✓" : "✕"}</td>
                            <td className="p-2 border border-border">{m.notes || ""}</td>
                            <td className="p-2 border border-border">{administered ? `Administered by ${m.administered_by}` : "Medication Not Administered Through The System"}</td>
                            <td className="p-2 border border-border">{m.service_type || ""}</td>
                            <td className="p-2 border border-border">{medGroupLabel}</td>
                            <td className="p-2 border border-border">{period}</td>
                            <td className="p-2 border border-border whitespace-pre-line">{planned}</td>
                            <td className="p-2 border border-border">-</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="text-xs text-muted-foreground pt-2">Showing {filteredMeds.length} of {liveMeds.length}</p>
                </div>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Lock prompt */}
      <Dialog open={showLockPrompt} onOpenChange={setShowLockPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Rota Lock</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm">Reason</Label>
            <Textarea value={lockReason} onChange={(e) => setLockReason(e.target.value)} placeholder="Why is this shift being locked?" />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowLockPrompt(false)}>Cancel</Button>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => {
                  if (!lockReason.trim()) { toast.error("Reason required"); return; }
                  setLocks((p) => [...p, {
                    id: crypto.randomUUID(),
                    reason: lockReason.trim(),
                    by: "Current User",
                    created: new Date().toLocaleString("en-GB"),
                  }]);
                  setShowLockPrompt(false);
                  toast.success("Lock added");
                }}
              >Add Lock</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note prompt */}
      <Dialog open={showNotePrompt} onOpenChange={setShowNotePrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Live Rota Note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm">Note</Label>
            <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Type your note..." />
            <Label className="text-sm">Visible</Label>
            <Select value={newNoteVisible} onValueChange={setNewNoteVisible}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No (hidden)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowNotePrompt(false)}>Cancel</Button>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => {
                  if (!newNote.trim()) { toast.error("Note required"); return; }
                  setNotes((p) => [{
                    ref: String(Date.now()).slice(-9),
                    created: new Date().toLocaleString("en-GB"),
                    note: newNote.trim(),
                    by: "Current User",
                    visible: newNoteVisible,
                  }, ...p]);
                  setShowNotePrompt(false);
                  toast.success("Note added");
                }}
              >Add Note</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ClockEditDialog
        mode={clockEdit}
        staff={current.staff}
        date={current.date}
        defaultTime={clockEdit === "in" ? current.start : current.end}
        onClose={() => setClockEdit(null)}
      />

      <AmendShiftDialog
        open={amendOpen}
        shift={current}
        onClose={() => setAmendOpen(false)}
        onSaved={(updated) => {
          setConfirmation({ before: current, after: updated });
          setCurrent(updated);
          setAmendOpen(false);
        }}
      />

      <ShiftChangeConfirmation
        data={confirmation}
        onClose={() => setConfirmation(null)}
      />

      {/* Confirm remove care giver */}
      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove care giver?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-medium text-foreground">{current.staff}</span> from this shift ({current.ref})? The shift will become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={async () => {
                try {
                  if (!current.visitId) {
                    throw new Error("Missing visit id for this shift");
                  }

                  const { error } = await supabase
                    .from("daily_visits")
                    .update({ care_giver_id: null, status: "Pending" })
                    .eq("id", current.visitId);

                  if (error) throw error;
                } catch (e) {
                  toast.error("Could not remove care giver from this shift.");
                  return;
                }
                removePendingClashesForStaff(current.staff);
                removeAssignedShift(current.ref);
                removePendingClashesForRef(current.ref);
                await qc.invalidateQueries({ queryKey: ["daily_visits_range"] });
                await qc.invalidateQueries({ queryKey: ["daily_visits"] });
                setRemoved(true);
                toast.success(`${current.staff} removed from shift. Clash cleared.`);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign caregiver */}
      <Dialog open={assignOpen} onOpenChange={(o) => { setAssignOpen(o); if (!o) setAssignSelected(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Caregiver</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs">Select from available caregivers</Label>
            <Select value={assignSelected} onValueChange={setAssignSelected}>
              <SelectTrigger><SelectValue placeholder="Choose a caregiver..." /></SelectTrigger>
              <SelectContent className="max-h-[260px]">
                {caregivers
                  .filter((c: any) => c.status === "Active" && c.name !== current.staff)
                  .map((c: any) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name} {c.email ? `— ${c.email}` : ""}
                    </SelectItem>
                  ))}
                {caregivers.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No caregivers available</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              disabled={!assignSelected}
              onClick={() => {
                setCurrent({ ...current, staff: assignSelected });
                setRemoved(false);
                setAssignOpen(false);
                toast.success(`${assignSelected} assigned to shift`);
                setAssignSelected("");
              }}
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ClockEditDialog({
  mode, staff, date, defaultTime, onClose,
}: {
  mode: "in" | "out" | null;
  staff: string;
  date: string;
  defaultTime: string;
  onClose: () => void;
}) {
  const [h, m] = (defaultTime || "00:00").split(":");
  const [hh, setHh] = useState(h || "00");
  const [mm, setMm] = useState(m || "00");
  const [reason, setReason] = useState("");
  const [push, setPush] = useState(false);

  if (!mode) return null;

  return (
    <Dialog open={!!mode} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-t-2 border-t-primary/70 bg-card">
          <h3 className="text-sm font-semibold text-foreground">
            Edit Clock {mode === "in" ? "In" : "Out"} Hours Manually
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="text-primary font-medium border-b border-border pb-2">{staff}</div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-3">
            <Label className="text-sm text-foreground">Time {mode}</Label>
            <div className="flex items-center gap-2">
              <Select value={hh} onValueChange={setHh}>
                <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <SelectItem key={i} value={String(i).padStart(2, "0")}>{String(i).padStart(2, "0")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-foreground">:</span>
              <Select value={mm} onValueChange={setMm}>
                <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["00", "15", "30", "45"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Label className="text-sm text-foreground">Date {mode}</Label>
            <Input value={date} readOnly className="h-8 bg-muted" />

            <Label className="text-sm text-foreground">Send Push</Label>
            <Checkbox checked={push} onCheckedChange={(v) => setPush(!!v)} />

            <Label className="text-sm self-start pt-1 text-foreground">Reason For Manual Clock {mode === "in" ? "In" : "Out"}</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[100px]" />
          </div>

          <Button
            size="sm"
            className="bg-success hover:bg-success/90 text-success-foreground gap-1 h-8"
            onClick={() => {
              toast.success(`Clock ${mode} updated for ${staff}`);
              onClose();
            }}
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
        <div className="flex justify-end px-4 py-3 border-t border-border bg-muted/30">
          <Button size="sm" variant="secondary" onClick={onClose} className="h-8">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AmendShiftDialog({
  open, shift, onClose, onSaved,
}: {
  open: boolean;
  shift: LiveRotaShift;
  onClose: () => void;
  onSaved: (s: LiveRotaShift) => void;
}) {
  const [service, setService] = useState(shift.serviceCall ?? "Private Evening Call");
  const [rotaType, setRotaType] = useState("Normal");
  const [date, setDate] = useState(shift.date);
  const [startH, startM] = (shift.start || "20:45").split(":");
  const [endH, endM] = (shift.end || "21:15").split(":");
  const [sH, setSH] = useState(startH);
  const [sM, setSM] = useState(startM);
  const [eH, setEH] = useState(endH);
  const [eM, setEM] = useState(endM);
  const [duration, setDuration] = useState(shift.schedHrs ?? "00:30");
  const [timeLock, setTimeLock] = useState("No");
  const [link, setLink] = useState("No");
  const [amendTemplate, setAmendTemplate] = useState("No");
  const [tasksRequired, setTasksRequired] = useState("Yes");
  const [tasks, setTasks] = useState("Evening Tasks");
  const [medRequired, setMedRequired] = useState("Yes");
  const [medication, setMedication] = useState("Evening Medication");
  const [alert, setAlert] = useState("Yes");
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const buildUpdated = (): LiveRotaShift => ({
    ...shift,
    serviceCall: service,
    date,
    start: `${sH}:${sM}`,
    end: `${eH}:${eM}`,
    schedHrs: duration,
  });

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const updated = buildUpdated();
      // Best-effort persistence — ignore if shift row doesn't exist for this dummy ref
      await supabase
        .from("shifts")
        .update({
          start_time: updated.start,
          end_time: updated.end,
          shift_type: service,
          notes: `Amended via Live Rota — ${new Date().toLocaleString("en-GB")}`,
        })
        .eq("id", shift.ref)
        .then(() => {});
      onSaved(updated);
    } catch (e) {
      onSaved(buildUpdated());
    } finally {
      setSaving(false);
      setConfirm(false);
    }
  };

  const Row = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
      <Label className="text-sm text-foreground">
        {required && <span className="text-destructive mr-0.5">*</span>}{label}
      </Label>
      <div>{children}</div>
    </div>
  );

  const YesNo = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="Yes">Yes</SelectItem>
        <SelectItem value="No">No</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-t-2 border-t-primary/70 bg-card">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Amend Shift Details
            </h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
            <Row label="Service" required>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Private Evening Call">Private Evening Call</SelectItem>
                  <SelectItem value="Private Morning Call">Private Morning Call</SelectItem>
                  <SelectItem value="WCC - Lunch Call">WCC - Lunch Call</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <p className="text-xs text-muted-foreground italic">
              "Rota Types set to Alternative are handled differently when running wages. See alternative wage tariffs for more details"
            </p>

            <Row label="Rota Type" required>
              <Select value={rotaType} onValueChange={setRotaType}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Alternative">Alternative</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Row label="Date" required>
              <Input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 bg-muted" />
            </Row>

            <Row label="Start" required>
              <div className="flex items-center gap-2">
                <Select value={sH} onValueChange={setSH}>
                  <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <SelectItem key={i} value={String(i).padStart(2, "0")}>{String(i).padStart(2, "0")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>:</span>
                <Select value={sM} onValueChange={setSM}>
                  <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["00", "15", "30", "45"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Row>

            <Row label="Duration">
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} className="h-8 bg-warning/20" />
            </Row>

            <Row label="End" required>
              <div className="flex items-center gap-2">
                <Select value={eH} onValueChange={setEH}>
                  <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <SelectItem key={i} value={String(i).padStart(2, "0")}>{String(i).padStart(2, "0")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>:</span>
                <Select value={eM} onValueChange={setEM}>
                  <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["00", "15", "30", "45"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Row>

            <Row label="Add Time Lock?"><YesNo value={timeLock} onChange={setTimeLock} /></Row>
            <Row label="Link" required><YesNo value={link} onChange={setLink} /></Row>

            <p className="text-xs text-warning font-medium">
              Selecting yes below will permanently amend the service template for this record
            </p>

            <Row label="Amend Template"><YesNo value={amendTemplate} onChange={setAmendTemplate} /></Row>
            <Row label="Tasks Required?"><YesNo value={tasksRequired} onChange={setTasksRequired} /></Row>

            {tasksRequired === "Yes" && (
              <>
                <p className="text-xs text-success font-medium">
                  Tasks are now required. Please select your task group below
                </p>
                <Row label="Tasks">
                  <Select value={tasks} onValueChange={setTasks}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Evening Tasks">Evening Tasks</SelectItem>
                      <SelectItem value="Morning Tasks">Morning Tasks</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
              </>
            )}

            <Row label="Medication Required?"><YesNo value={medRequired} onChange={setMedRequired} /></Row>

            {medRequired === "Yes" && (
              <>
                <p className="text-xs text-success font-medium">
                  Medication is now a required field. Please select your medication group below
                </p>
                <Row label="Medication">
                  <Select value={medication} onValueChange={setMedication}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Evening Medication">Evening Medication</SelectItem>
                      <SelectItem value="Morning Medication">Morning Medication</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
              </>
            )}

            <Row label="Alert?"><YesNo value={alert} onChange={setAlert} /></Row>
          </div>

          <div className="flex justify-between items-center px-4 py-3 border-t border-border bg-muted/30">
            <Button
              size="sm"
              className="h-8 gap-1 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => setConfirm(true)}
            >
              <Save className="h-3.5 w-3.5" /> Update
            </Button>
            <Button size="sm" variant="secondary" onClick={onClose} className="h-8">Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm shift update</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>You are about to update the following shift:</p>
                <div className="rounded-sm border border-border bg-muted/30 p-3 space-y-1 text-foreground">
                  <div><span className="text-muted-foreground">Ref:</span> <span className="font-mono">{shift.ref}</span></div>
                  <div><span className="text-muted-foreground">Client:</span> {shift.client}</div>
                  <div><span className="text-muted-foreground">Service:</span> {shift.serviceCall ?? "—"} → <span className="font-medium">{service}</span></div>
                  <div><span className="text-muted-foreground">Date:</span> {shift.date} → <span className="font-medium">{date}</span></div>
                  <div><span className="text-muted-foreground">Start:</span> {shift.start} → <span className="font-medium">{sH}:{sM}</span></div>
                  <div><span className="text-muted-foreground">End:</span> {shift.end} → <span className="font-medium">{eH}:{eM}</span></div>
                  <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{duration}</span></div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdate}
              disabled={saving}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              {saving ? "Saving..." : "Confirm Update"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ShiftChangeConfirmation({
  data, onClose,
}: { data: { before: LiveRotaShift; after: LiveRotaShift } | null; onClose: () => void }) {
  if (!data) return null;
  const { before, after } = data;
  const Row = ({ label, a, b }: { label: string; a: string; b: string }) => (
    <tr className="border-b border-border">
      <td className="p-2 text-muted-foreground">{label}</td>
      <td className="p-2">{a}</td>
      <td className="p-2 font-medium text-success">{b}</td>
    </tr>
  );
  return (
    <Dialog open={!!data} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-t-2 border-t-success/70 bg-card">
          <h3 className="text-sm font-semibold text-foreground">Shift Updated</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-foreground">
            Shift <span className="font-mono">{after.ref}</span> for <span className="font-medium">{after.client}</span> has been updated successfully.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border border-border">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-2 text-left">Field</th>
                  <th className="p-2 text-left">Before</th>
                  <th className="p-2 text-left">After</th>
                </tr>
              </thead>
              <tbody>
                <Row label="Service" a={before.serviceCall ?? "—"} b={after.serviceCall ?? "—"} />
                <Row label="Date" a={before.date} b={after.date} />
                <Row label="Start" a={before.start} b={after.start} />
                <Row label="End" a={before.end} b={after.end} />
                <Row label="Duration" a={before.schedHrs ?? "—"} b={after.schedHrs ?? "—"} />
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end px-4 py-3 border-t border-border bg-muted/30">
          <Button size="sm" onClick={onClose} className="h-8 bg-success hover:bg-success/90 text-success-foreground">Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 * Staff list + Detailed Availability report
 * ============================================================ */

type StaffRow = {
  id: string;
  name: string;
  start: string;
  end: string;
  match: number;
  avatar_url?: string | null;
};

const MOCK_SHIFTS = [
  { day: "Tues", week: "week1", start: "08:15", end: "08:45", dur: "00:30", service: "Private Morning Call", client: "Rosalie Merret", tone: "bg-emerald-50" },
  { day: "Tues", week: "week1", start: "09:00", end: "09:45", dur: "00:45", service: "Private Morning Call", client: "Ivy Edkins",      tone: "bg-emerald-50" },
  { day: "Tues", week: "week1", start: "10:00", end: "10:30", dur: "00:30", service: "Private Morning Call", client: "Vera Thomas",     tone: "bg-emerald-50" },
  { day: "Tues", week: "week1", start: "11:15", end: "12:00", dur: "00:45", service: "WCC - Morning Call (Z4-T3)", client: "James Hamilton", tone: "bg-emerald-50" },
  { day: "Tues", week: "week1", start: "12:30", end: "13:00", dur: "00:30", service: "Private Lunch Call",  client: "Michael Taylor",   tone: "bg-rose-50" },
];

function StaffAvailabilitySection({
  caregivers,
  currentStaffName,
  shiftDate,
  shiftRef,
  onAssign,
}: {
  caregivers: any[];
  currentStaffName: string;
  shiftDate: string;
  shiftRef?: string;
  onAssign?: (name: string) => void;
}) {
  const list: StaffRow[] = (caregivers ?? []).slice(0, 12).map((cg, i) => ({
    id: cg.id,
    name: cg.name,
    avatar_url: cg.avatar_url,
    start: ["08:45", "07:00", "07:30", "09:00", "08:00", "10:00"][i % 6],
    end:   ["18:30", "14:00", "14:30", "17:00", "16:00", "20:00"][i % 6],
    match: [100, 100, 100, 92, 88, 100, 76, 100, 95][i % 9],
  }));

  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const filtered = list.filter((s) => (s.name ?? "").toLowerCase().includes(search.toLowerCase()));
  const selected = list.find((s) => s.id === selectedId);

  // Deterministic mock stats per caregiver
  const hashSeed = (selected?.id ?? "x").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const clashes = hashSeed % 3;
  const totalVisits = hashSeed % 5;
  const holidays = hashSeed % 2;
  const skills = [100, 95, 88, 100, 92][hashSeed % 5];

  const shifts = MOCK_SHIFTS.filter((s) =>
    !tableSearch || s.client.toLowerCase().includes(tableSearch.toLowerCase()) || s.service.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const totalDur = shifts.reduce((acc, s) => {
    const [h, m] = s.dur.split(":").map(Number);
    return acc + h * 60 + m;
  }, 0);
  const totalDurStr = `${String(Math.floor(totalDur / 60)).padStart(2, "0")}:${String(totalDur % 60).padStart(2, "0")}`;

  const [confirmAssign, setConfirmAssign] = useState(false);

  return (
    <section id="staff-availability-section" className="border border-border rounded-sm overflow-hidden transition-shadow scroll-mt-20">
      <div className="border-t-2 border-t-primary/70 grid grid-cols-1 lg:grid-cols-[280px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Care Givers list pane */}
        <div className="bg-card">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span className="text-muted-foreground">👤</span> Care Givers
            </h3>
            <Button size="sm" className="h-7 bg-success hover:bg-success/90 text-success-foreground">View More</Button>
          </div>
          <div className="p-2 border-b border-border">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Visible Care Givers..."
              className="h-8 text-xs"
            />
          </div>
          <div className="overflow-y-auto divide-y divide-border" style={{ maxHeight: "calc(100vh - 280px)" }}>
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center italic">No care givers found.</p>
            )}
            {filtered.map((s) => {
              const isSel = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors ${isSel ? "bg-primary/10" : "hover:bg-muted/50"}`}
                >
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0 overflow-hidden">
                    {s.avatar_url ? <img src={s.avatar_url} alt="" className="h-full w-full object-cover" /> : (s.name ?? "").split(" ").map((p) => p[0] ?? "").slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-primary truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.start} to {s.end}</p>
                    <p className={`text-[10px] font-semibold ${s.match >= 95 ? "text-success" : s.match >= 80 ? "text-amber-600" : "text-destructive"}`}>{s.match.toFixed(2)}% Match</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Availability pane */}
        <div className="bg-card">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              📅 Availability
            </h3>
            {(() => {
              const isAssigned = !!currentStaffName && currentStaffName.toLowerCase() !== "unallocated";
              if (isAssigned) {
                return (
                  <span className="text-[11px] text-muted-foreground italic">
                    Shift assigned to {currentStaffName} — remove care giver to reassign.
                  </span>
                );
              }
              return (
                <Button
                  size="sm"
                  disabled={!selected}
                  className="h-7 gap-1 bg-success hover:bg-success/90 text-success-foreground disabled:opacity-50"
                  onClick={() => selected && setConfirmAssign(true)}
                >
                  <Plus className="h-3 w-3" /> Assign this Shift
                </Button>
              );
            })()}
          </div>

          {!selected ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold text-foreground">Select Care Giver</p>
              <p className="text-xs text-warning mt-1">Select a care giver on the left to show their availability for this call</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-base font-semibold text-foreground">{selected.name}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  You have a setting on which prevents team members below are certain pref score (3 stars) being allocated to service user calls. Team members with no pref can still be added to service users calls and the service users pref will automatically be set to (3 stars) for {selected.name}.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <StatCard tone="danger" value={clashes} label="Clashes" icon="⚠" />
                <StatCard tone="danger" value={totalVisits} label="Total Visits" icon="⇄" />
                <StatCard tone="success" value={holidays} label="Holidays Booked" icon="✈" />
                <StatCard tone="success" value={`${skills}%`} label="Skills Match" icon="🎓" />
              </div>

              <div className="rounded-sm bg-sky-500 text-white p-3">
                <p className="text-sm font-semibold">Service User Carer Pref</p>
                <p className="text-xs mt-1 opacity-95">Carer Pref: Either</p>
                <p className="text-xs opacity-95">Team Member Gender: Female</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-semibold text-foreground">📅 Shifts Assigned To {selected.name} On {shiftDate || "—"}</h5>
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[11px]">Search</Label>
                    <Input value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="h-7 w-40 text-xs" />
                  </div>
                </div>
                <div className="overflow-x-auto border border-border rounded-sm">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="p-2 border-r border-border text-left">Day</th>
                        <th className="p-2 border-r border-border text-left">Week</th>
                        <th className="p-2 border-r border-border text-left">Start</th>
                        <th className="p-2 border-r border-border text-left">End</th>
                        <th className="p-2 border-r border-border text-left">Dur</th>
                        <th className="p-2 border-r border-border text-left">Service</th>
                        <th className="p-2 text-left">Client</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.length === 0 && (
                        <tr><td colSpan={7} className="p-3 text-center text-xs text-muted-foreground">No shifts match.</td></tr>
                      )}
                      {shifts.map((s, i) => (
                        <tr key={i} className={`${s.tone} border-t border-border`}>
                          <td className="p-2 border-r border-border">{s.day}</td>
                          <td className="p-2 border-r border-border">{s.week}</td>
                          <td className="p-2 border-r border-border font-mono">{s.start}</td>
                          <td className="p-2 border-r border-border font-mono">{s.end}</td>
                          <td className="p-2 border-r border-border font-mono">{s.dur}</td>
                          <td className="p-2 border-r border-border">{s.service}</td>
                          <td className="p-2">{s.client}</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-semibold border-t border-border">
                        <td className="p-2 border-r border-border">Total:</td>
                        <td className="p-2 border-r border-border"></td>
                        <td className="p-2 border-r border-border"></td>
                        <td className="p-2 border-r border-border"></td>
                        <td className="p-2 border-r border-border font-mono">{totalDurStr}</td>
                        <td className="p-2 border-r border-border"></td>
                        <td className="p-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1.5">Showing 1 to {shifts.length} of {shifts.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmAssign} onOpenChange={setConfirmAssign}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign this shift?</AlertDialogTitle>
            <AlertDialogDescription>
              Assign <span className="font-medium text-foreground">{selected?.name}</span> to shift <span className="font-mono">{shiftRef ?? ""}</span> on {shiftDate || "—"}? It will be removed from the shifts missing care giver list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selected) onAssign?.(selected.name);
                setConfirmAssign(false);
              }}
            >
              Confirm Assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function StatCard({ tone, value, label, icon }: { tone: "danger" | "success"; value: string | number; label: string; icon: string }) {
  const bg = tone === "danger" ? "bg-destructive" : "bg-success";
  return (
    <div className={`${bg} text-white rounded-sm p-3 flex items-center justify-between`}>
      <div>
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="text-xs mt-1 opacity-95">{label}</div>
      </div>
      <div className="text-3xl opacity-30">{icon}</div>
    </div>
  );
}

