import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Calendar, FileText, Plane, Search, FileSpreadsheet, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Holiday = {
  id: string;
  care_giver_id: string;
  entry_type: string;
  start_date: string;
  end_date: string | null;
  hours: number | null;
  status: string;
  reason: string | null;
  notes: string | null;
  updated_at: string;
};
type Caregiver = { id: string; name: string; avatar_url: string | null };

const fmt = (d?: string | null) => (d ? format(new Date(d), "dd/MM/yyyy") : "-");
const initials = (n: string) => n.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
const STATUS_PENDING = ["pending", "Pending", "PENDING"];

export default function StaffAbsenceRequests() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"team" | "client">("team");

  const { data: caregivers = [] } = useQuery({
    queryKey: ["caregivers-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_givers")
        .select("id, name, avatar_url")
        .order("name");
      if (error) throw error;
      return data as Caregiver[];
    },
  });

  const { data: requests = [], isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["staff-absence-requests"],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caregiver_holidays")
        .select("*")
        .in("status", STATUS_PENDING)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as Holiday[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("caregiver_holidays").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-absence-requests"] });
      toast.success("Updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cgMap = useMemo(() => new Map(caregivers.map((c) => [c.id, c])), [caregivers]);
  const filteredStaff = useMemo(
    () => caregivers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [caregivers, search],
  );

  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  return (
    <AppLayout>
      <div className="space-y-3">
        {/* Header bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b-2 border-primary/60">
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-bold text-foreground">Holidays & Absence Requests ({requests.length})</h1>
            <span className="text-sm text-muted-foreground">- Team Member</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live · {now.toLocaleTimeString("en-GB")}
            </span>
            <Button size="sm" variant="ghost" onClick={() => refetch()}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
            <Button size="sm" className="bg-sky-500 hover:bg-sky-600 gap-1">
              <Calendar className="h-4 w-4" /> Client Requests (0)
            </Button>
            <Button size="sm" variant="outline" className="bg-amber-500 hover:bg-amber-600 text-white border-amber-500" onClick={() => navigate("/staff-contracts")}>
              <FileText className="h-4 w-4" />
            </Button>
            <Button size="sm" className="bg-sky-400 hover:bg-sky-500">
              <Plane className="h-4 w-4" />
            </Button>
            <Button size="sm" className="bg-violet-500 hover:bg-violet-600">
              <Plane className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left: staff stats */}
          <Card className="col-span-3 p-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="team" className="flex-1 text-xs">Team Member Statistics</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative mt-3">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8 h-9" placeholder="Search User..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <ScrollArea className="h-[calc(100vh-260px)] mt-2 pr-2">
              <ul className="divide-y">
                {filteredStaff.map((cg) => (
                  <li key={cg.id} className="flex items-center gap-3 py-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={cg.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-muted">{initials(cg.name)}</AvatarFallback>
                    </Avatar>
                    <button
                      className="flex-1 text-left text-sm font-semibold text-primary hover:underline"
                      onClick={() => navigate(`/caregivers/${cg.id}`)}
                    >
                      {cg.name}
                    </button>
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground/60" />
                  </li>
                ))}
                {filteredStaff.length === 0 && (
                  <li className="text-center text-xs text-muted-foreground py-6">No staff</li>
                )}
              </ul>
            </ScrollArea>
          </Card>

          {/* Right: requests table */}
          <Card className="col-span-9 p-0 overflow-hidden">
            <div className="grid grid-cols-[1.4fr_60px_100px_1.2fr_120px_2fr_160px] gap-3 px-4 py-3 border-b text-xs font-semibold text-foreground bg-muted/30">
              <div>Staff</div><div>Rota</div><div>Type</div><div>Dates</div><div>Leave</div><div>Note</div><div className="text-right">Action</div>
            </div>
            <ScrollArea className="h-[calc(100vh-260px)]">
              {requests.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No pending absence requests</div>
              ) : (
                <ul className="divide-y">
                  {requests.map((r) => {
                    const cg = cgMap.get(r.care_giver_id);
                    return (
                      <li key={r.id} className="grid grid-cols-[1.4fr_60px_100px_1.2fr_120px_2fr_160px] gap-3 px-4 py-4 items-start hover:bg-muted/30">
                        <div className="text-sm">
                          <div className="font-medium text-foreground">{cg?.name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">
                            - Requested From The App (
                            <span className="text-rose-600 font-medium">Pending ⏳</span>)
                          </div>
                        </div>
                        <div><Calendar className="h-4 w-4 text-muted-foreground" /></div>
                        <div className="text-sm capitalize">{r.entry_type || "Holiday"}</div>
                        <div className="text-xs space-y-2">
                          <div>{fmt(r.start_date)}</div>
                          {r.end_date && r.end_date !== r.start_date && <div>{fmt(r.end_date)}</div>}
                        </div>
                        <div className="text-sm">
                          {Number(r.hours || 0).toFixed(1)} hrs
                        </div>
                        <div className="text-sm text-muted-foreground italic">{r.reason || r.notes || "-"}</div>
                        <div className="text-right space-y-1">
                          <button onClick={() => setStatus.mutate({ id: r.id, status: "approved" })} className="block w-full text-right font-semibold text-emerald-600 hover:underline text-sm">
                            Approve <input type="radio" name={`a-${r.id}`} className="ml-1" />
                          </button>
                          <button onClick={() => setStatus.mutate({ id: r.id, status: "rejected" })} className="block w-full text-right font-semibold text-rose-600 hover:underline text-sm">
                            Decline <input type="radio" name={`a-${r.id}`} className="ml-1" />
                          </button>
                          <button onClick={() => setStatus.mutate({ id: r.id, status: "unauthorised" })} className="block w-full text-right font-semibold text-amber-600 hover:underline text-sm">
                            Unauthorised <input type="radio" name={`a-${r.id}`} className="ml-1" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
            <div className="px-4 py-2 text-[11px] text-muted-foreground bg-muted/30 border-t flex items-center justify-between">
              <span>Auto-refreshing every 5s</span>
              <span>Last update: {new Date(dataUpdatedAt || Date.now()).toLocaleTimeString("en-GB")}</span>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
