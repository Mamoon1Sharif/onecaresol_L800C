import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Smile, Frown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useShiftTasks, useToggleShiftTask } from "@/hooks/use-care-data";

interface Props {
  visitId?: string;
  assignedTo: string;
  date: string;
  /** e.g. "Morning Tasks", "Evening Tasks" — for the header chip */
  group?: string;
}

export function ShiftTasksSection({ visitId, assignedTo, date, group }: Props) {
  const { data: tasks = [], isLoading } = useShiftTasks(visitId);
  const toggle = useToggleShiftTask();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [bulk, setBulk] = useState("bulk");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Realtime subscription — invalidate query on any change for this visit
  useEffect(() => {
    if (!visitId) return;
    const channel = supabase
      .channel(`shift_tasks:${visitId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shift_tasks", filter: `daily_visit_id=eq.${visitId}` },
        () => qc.invalidateQueries({ queryKey: ["shift_tasks", visitId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [visitId, qc]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (tasks as any[]).filter((t) => !q || t.title?.toLowerCase().includes(q));
  }, [tasks, search]);

  const allChecked = filtered.length > 0 && filtered.every((t) => checked[t.id]);
  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    filtered.forEach((t) => (next[t.id] = v));
    setChecked(next);
  };

  const selectedIds = Object.entries(checked).filter(([, v]) => v).map(([k]) => k);

  const runBulk = async () => {
    if (bulk === "bulk") {
      toast.info("Select a bulk action first");
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Select at least one task");
      return;
    }
    const mark = bulk === "complete";
    await Promise.all(
      selectedIds.map((id) =>
        toggle.mutateAsync({ id, is_completed: mark, completed_by: mark ? assignedTo : undefined }),
      ),
    );
    toast.success(`${selectedIds.length} task(s) ${mark ? "completed" : "reopened"}`);
    setChecked({});
    setBulk("bulk");
  };

  const completeAll = async () => {
    const pending = (tasks as any[]).filter((t) => !t.is_completed);
    if (pending.length === 0) {
      toast.info("All tasks already complete");
      return;
    }
    await Promise.all(
      pending.map((t) =>
        toggle.mutateAsync({ id: t.id, is_completed: true, completed_by: assignedTo }),
      ),
    );
    toast.success(`${pending.length} task(s) completed`);
  };

  const completedCount = (tasks as any[]).filter((t) => t.is_completed).length;

  return (
    <section className="border border-border rounded-sm overflow-hidden">
      <div className="border-t-2 border-t-primary/70 flex items-center justify-between px-3 py-2 bg-card">
        <h3 className="text-sm font-semibold text-foreground">Tasks Required</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Group: <span className="font-semibold text-foreground">{group ?? "—"}</span>
          </span>
          <Button
            size="sm"
            className="h-7 gap-1 bg-success hover:bg-success/90 text-success-foreground"
            onClick={completeAll}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Complete Tasks
          </Button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Select value={bulk} onValueChange={setBulk}>
            <SelectTrigger className="h-8 w-[220px] text-xs">
              <SelectValue placeholder="Task Bulk Actions..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bulk">Task Bulk Actions...</SelectItem>
              <SelectItem value="complete">Mark Complete</SelectItem>
              <SelectItem value="reopen">Mark Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8 bg-success hover:bg-success/90 text-success-foreground"
            onClick={runBulk}
          >
            Go
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Label className="text-xs">Search:</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 text-xs"
              placeholder="Search tasks..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="bg-muted/40">
                <th className="p-2 border border-border w-8">
                  <Checkbox checked={allChecked} onCheckedChange={(v) => toggleAll(!!v)} />
                </th>
                <th className="p-2 border border-border text-left w-14">Order</th>
                <th className="p-2 border border-border text-left">Task</th>
                <th className="p-2 border border-border text-left">Status</th>
                <th className="p-2 border border-border text-left">Task Description</th>
                <th className="p-2 border border-border text-left">Required</th>
                <th className="p-2 border border-border text-left">Assigned To</th>
                <th className="p-2 border border-border text-left">Date</th>
                <th className="p-2 border border-border text-center">Outcome</th>
                <th className="p-2 border border-border text-left">Task Notes</th>
                <th className="p-2 border border-border text-center">Audited</th>
                <th className="p-2 border border-border text-left">Audit Notes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={12} className="p-3 text-center text-xs text-muted-foreground border border-border">
                    Loading tasks…
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-3 text-center text-xs text-muted-foreground border border-border">
                    {search ? "No tasks match your search." : "No tasks recorded for this shift."}
                  </td>
                </tr>
              )}
              {filtered.map((t: any, idx: number) => {
                const completedDate = t.completed_at
                  ? new Date(t.completed_at).toLocaleDateString("en-GB")
                  : new Date(date).toLocaleDateString("en-GB");
                return (
                  <tr key={t.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-2 border border-border">
                      <Checkbox
                        checked={!!checked[t.id]}
                        onCheckedChange={(v) => setChecked((p) => ({ ...p, [t.id]: !!v }))}
                      />
                    </td>
                    <td className="p-2 border border-border">{idx + 1}</td>
                    <td className="p-2 border border-border font-medium">{t.title}</td>
                    <td className="p-2 border border-border">
                      {t.is_completed ? (
                        <div>
                          <button
                            className="text-success font-semibold inline-flex items-center gap-1 hover:underline"
                            onClick={() =>
                              toggle.mutate({ id: t.id, is_completed: false })
                            }
                          >
                            Completed By <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <div className="text-foreground">{t.completed_by || assignedTo}</div>
                        </div>
                      ) : (
                        <button
                          className="text-muted-foreground inline-flex items-center gap-1 hover:underline"
                          onClick={() =>
                            toggle.mutate({ id: t.id, is_completed: true, completed_by: assignedTo })
                          }
                        >
                          Pending
                        </button>
                      )}
                    </td>
                    <td className="p-2 border border-border text-foreground/80">{t.description || ""}</td>
                    <td className="p-2 border border-border">
                      <span className="text-info">Desirable</span>
                    </td>
                    <td className="p-2 border border-border">{assignedTo}</td>
                    <td className="p-2 border border-border">{completedDate}</td>
                    <td className="p-2 border border-border text-center">
                      {t.is_completed ? (
                        <Smile className="h-4 w-4 text-success inline" />
                      ) : (
                        <Frown className="h-4 w-4 text-muted-foreground inline" />
                      )}
                    </td>
                    <td className="p-2 border border-border">{t.notes || ""}</td>
                    <td className="p-2 border border-border text-center">
                      <XCircle className="h-4 w-4 text-destructive inline" />
                    </td>
                    <td className="p-2 border border-border" />
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground pt-2">
            Showing {filtered.length} of {tasks.length} · {completedCount} completed
          </p>
        </div>
      </div>
    </section>
  );
}
