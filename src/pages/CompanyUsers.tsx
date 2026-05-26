import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useCurrentCompany } from "@/hooks/use-company";
import { Users, Plus, ShieldAlert, ArrowLeft } from "lucide-react";


const CompanyUsers = () => {
  const navigate = useNavigate();
  const { data: cu, isLoading } = useCurrentCompany();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    username: "", display_name: "", password: "", role: "member",
  });

  const { data: users = [] } = useQuery({
    queryKey: ["company_users", cu?.company_id],
    enabled: !!cu,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_users")
        .select("*")
        .eq("company_id", cu!.company_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["company_user_sessions", cu?.company_id],
    enabled: !!cu,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_company_user_sessions");
      if (error) throw error;
      return data ?? [];
    },
  });

  const sessionMap = useMemo(() => {
    const m = new Map<string, { last_sign_in_at: string | null; is_logged_in: boolean }>();
    for (const s of sessions as any[]) {
      m.set(s.user_id, { last_sign_in_at: s.last_sign_in_at, is_logged_in: s.is_logged_in });
    }
    return m;
  }, [sessions]);

  // Tick every 30s so durations update for currently logged-in users
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const isAdmin = cu && (cu.role === "owner" || cu.role === "admin");
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card><CardContent className="py-10 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Company admins only</h2>
          <p className="text-sm text-muted-foreground">
            You don't have permission to manage users.
          </p>
        </CardContent></Card>
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-provision", {
        body: {
          action: "create_user",
          company_id: cu!.company_id,
          ...form,
        },
      });
      if (error || data?.error) throw new Error(data?.error ?? error?.message);
      toast({ title: "User created", description: form.username });
      setForm({ username: "", display_name: "", password: "", role: "member" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["company_users", cu!.company_id] });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" /> Users
            </h1>
            <p className="text-sm text-muted-foreground">
              Company <span className="font-mono">{(cu as any)?.companies?.company_code}</span> · {(cu as any)?.companies?.name}
            </p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New User</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add user to company</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Field label="Username / User Code" value={form.username}
                onChange={(v) => setForm({ ...form, username: v })} placeholder="jdoe" />
              <Field label="Display name (optional)" value={form.display_name}
                onChange={(v) => setForm({ ...form, display_name: v })} placeholder="John Doe" />
              <Field label="Temp password" type="password" value={form.password}
                onChange={(v) => setForm({ ...form, password: v })} placeholder="At least 8 chars" />
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={busy || !form.username || form.password.length < 8}>
                {busy ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Display name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u: any) => {
                const s = sessionMap.get(u.user_id);
                const loggedIn = !!s?.is_logged_in;
                const last = s?.last_sign_in_at ? new Date(s.last_sign_in_at) : null;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono">{u.username}</TableCell>
                    <TableCell>{u.display_name ?? "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                    <TableCell>
                      {loggedIn
                        ? <Badge variant="default">Active</Badge>
                        : <Badge variant="secondary">Offline</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {last ? last.toLocaleString("en-GB", { timeZone: "Asia/Karachi" }) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {loggedIn && last ? formatDuration(Date.now() - last.getTime()) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No users yet.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} />
    </div>
  );
}

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export default CompanyUsers;
