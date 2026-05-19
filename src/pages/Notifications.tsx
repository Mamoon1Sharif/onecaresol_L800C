import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plane, FileText, Handshake, Pill, Bell, AlertOctagon, AlertTriangle, MessageSquare, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const formatCount = (n: number) => (n > 99 ? "99+" : String(n));

type Row = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  to: string;
  count: number;
};

function useLiveCounts() {
  return useQuery({
    queryKey: ["notifications-live-counts"],
    refetchInterval: 5000,
    queryFn: async () => {
      const head = { count: "exact" as const, head: true };
      const in60d = new Date(Date.now() + 60 * 86400 * 1000).toISOString().slice(0, 10);

      const [absences, certs, conflicts, meds, careRem, recRem, incidents, messages] = await Promise.all([
        supabase.from("caregiver_holidays").select("id", head).eq("status", "Pending"),
        supabase.from("caregiver_qualifications").select("id", head).lte("expiry_date", in60d),
        supabase.from("caregiver_incidents").select("id", head),
        supabase.from("shift_task_medician").select("id", head).eq("status", "missed"),
        supabase.from("caregiver_reminders").select("id", head),
        supabase.from("receiver_reminders").select("id", head),
        supabase.from("receiver_incidents").select("id", head),
        supabase.from("communication_logs").select("id", head),
      ]);

      return {
        absences: absences.count ?? 0,
        certs: certs.count ?? 0,
        conflicts: conflicts.count ?? 0,
        meds: meds.count ?? 0,
        reminders: (careRem.count ?? 0) + (recRem.count ?? 0),
        incidents: incidents.count ?? 0,
        messages: messages.count ?? 0,
      };
    },
  });
}

export default function Notifications() {
  const navigate = useNavigate();
  const { data, isFetching, dataUpdatedAt, refetch } = useLiveCounts();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const c = data ?? { absences: 0, certs: 0, conflicts: 0, meds: 0, reminders: 0, incidents: 0, messages: 0 };
  const total = c.absences + c.certs + c.conflicts + c.meds + c.reminders + c.incidents + c.messages;

  const rows: Row[] = [
    { key: "absences",  label: "Staff Absence Requests",     icon: Plane,         tone: "text-sky-500 bg-sky-500/10",         to: "/holidays-absence",  count: c.absences },
    { key: "certs",     label: "Expiring Certificates",      icon: FileText,      tone: "text-amber-500 bg-amber-500/10",     to: "/caregivers",        count: c.certs },
    { key: "conflicts", label: "Conflicting Templates",      icon: Handshake,     tone: "text-emerald-600 bg-emerald-500/10", to: "/rota/conflicts",    count: c.conflicts },
    { key: "meds",      label: "Medication Not Administered",icon: Pill,          tone: "text-rose-500 bg-rose-500/10",       to: "/incidents",         count: c.meds },
    { key: "reminders", label: "Reminders",                  icon: Bell,          tone: "text-orange-500 bg-orange-500/10",   to: "/notifications",     count: c.reminders },
    { key: "incidents", label: "Open Incidents",             icon: AlertOctagon,  tone: "text-destructive bg-destructive/10", to: "/incidents",         count: c.incidents },
    { key: "rota",      label: "Rota Conflicts",             icon: AlertTriangle, tone: "text-amber-600 bg-amber-500/10",     to: "/rota/conflicts",    count: c.conflicts },
    { key: "messages",  label: "Unread Messages",            icon: MessageSquare, tone: "text-blue-500 bg-blue-500/10",       to: "/communication-log", count: c.messages },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              You have <span className="font-semibold text-foreground">{total.toLocaleString()}</span> notifications
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live · {now.toLocaleTimeString("en-GB")}
            </span>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => refetch()}>
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <ScrollArea className="max-h-[calc(100vh-220px)]">
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const Icon = r.icon;
                return (
                  <li key={r.key}>
                    <button
                      onClick={() => navigate(r.to)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", r.tone)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground">
                        <span className="font-bold tabular-nums mr-1.5">{formatCount(r.count)}</span>
                        {r.label}
                      </span>
                      <span className="text-xs text-muted-foreground">View →</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
          <div className="px-5 py-2.5 text-[11px] text-muted-foreground border-t border-border bg-muted/30 flex items-center justify-between">
            <span>Auto-refreshing every 5s</span>
            <span>Last update: {new Date(dataUpdatedAt || Date.now()).toLocaleTimeString("en-GB")}</span>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
