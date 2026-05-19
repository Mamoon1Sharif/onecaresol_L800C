import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, Copy, Trash2, Plus, HelpCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

type Contract = {
  id: string;
  name: string;
  description: string;
  leaveYear: string;
  patternLabel: string;
  patternHours: string;
  patternDays: string;
  contractualLeave: number;
  carryOver: number;
  members: number;
};

const SEED: Contract[] = [
  { id: "c1", name: "37 hour Salaried Staff", description: "Use for all senior staff on Salary", leaveYear: "1st January / 31st December", patternLabel: "Fixed Pattern", patternHours: "37 Hrs p/w", patternDays: "5 Days p/w", contractualLeave: 0, carryOver: 0, members: 3 },
  { id: "c2", name: "27.5 hour Salaried Staff", description: "Use for all senior staff on Salary", leaveYear: "1st January / 31st December", patternLabel: "Fixed Pattern", patternHours: "27.5 Hrs p/w", patternDays: "5 Days p/w", contractualLeave: 0, carryOver: 0, members: 1 },
  { id: "c3", name: "Variable Hours Staff", description: "Use for all Homecare Assistants on hourly rates", leaveYear: "1st January / 31st December", patternLabel: "Irregular Pattern", patternHours: "Based On Clocked Hours", patternDays: "Not Paid Weekly", contractualLeave: 0, carryOver: 0, members: 31 },
  { id: "c4", name: "22.5 hour Salaried Staff", description: "3 day Working Week", leaveYear: "1st January / 31st December", patternLabel: "Fixed Pattern", patternHours: "22.5 Hrs p/w", patternDays: "3 Days p/w", contractualLeave: 0, carryOver: 0, members: 1 },
  { id: "c5", name: "25 hour Salaried Staff", description: "7 day Working Fortnight Rota", leaveYear: "1st January / 31st December", patternLabel: "Fixed Pattern", patternHours: "25 Hrs p/w", patternDays: "3.5 Days p/w", contractualLeave: 0, carryOver: 0, members: 2 },
  { id: "c6", name: "Live-In Care", description: "Use for all live-in staff", leaveYear: "1st January / 31st December", patternLabel: "Irregular Pattern", patternHours: "Based On Scheduled Hours", patternDays: "Not Paid Weekly", contractualLeave: 0, carryOver: 0, members: 5 },
  { id: "c7", name: "16 hour Salaried Staff", description: "Use for all senior staff on Salary", leaveYear: "1st January / 31st December", patternLabel: "Fixed Pattern", patternHours: "16 Hrs p/w", patternDays: "3 Days p/w", contractualLeave: 0, carryOver: 0, members: 1 },
  { id: "c8", name: "15 Hour Salaried Staff", description: "2 day working week", leaveYear: "1st January / 31st December", patternLabel: "Fixed Pattern", patternHours: "15 Hrs p/w", patternDays: "2 Days p/w", contractualLeave: 0, carryOver: 0, members: 1 },
];

export default function StaffContracts() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data: unassigned = [] } = useQuery({
    queryKey: ["caregivers-unassigned-contract"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_givers")
        .select("id, name, permission, role_title")
        .order("name")
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(
    () => SEED.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  return (
    <AppLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <Button size="sm" className="bg-sky-500 hover:bg-sky-600 gap-1" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Team Member Contract List</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 gap-1" onClick={() => navigate("/staff-absence-requests")}>
              → Go To Holidays & Absence
            </Button>
            <Button size="sm" variant="outline" className="rounded-full h-8 w-8 p-0">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-foreground border-b-2 border-primary/60 pb-1">All Contracts</div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1"><Plus className="h-4 w-4" /> Add New</Button>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>Search:</span>
            <Input className="h-7 w-48" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border">
                <tr className="text-foreground">
                  {["View", "Duplicate", "Delete", "Details", "Leave Year", "Working Pattern", "Contractual Leave", "Maximum Carry-Over", "Team Member"].map((h) => (
                    <th key={h} className="text-left font-semibold py-2 px-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className={i % 2 ? "bg-muted/30" : ""}>
                    <td className="py-3 px-2"><Eye className="h-4 w-4 text-emerald-600 cursor-pointer" /></td>
                    <td className="py-3 px-2"><Copy className="h-4 w-4 text-sky-600 cursor-pointer" /></td>
                    <td className="py-3 px-2"><Trash2 className="h-4 w-4 text-rose-600 cursor-pointer" /></td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-foreground">{c.name}</div>
                      <div className="text-muted-foreground">{c.description}</div>
                    </td>
                    <td className="py-3 px-2 text-orange-600 text-center">
                      <div>1st January /</div>
                      <div>31st December</div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="font-semibold text-foreground">{c.patternLabel}</div>
                      <div className="text-sky-600">{c.patternHours}</div>
                      <div className="text-sky-600">{c.patternDays}</div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="font-semibold">{c.contractualLeave} Days</div>
                      <div className="text-muted-foreground">Contractual Leave</div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="font-semibold">{c.carryOver} Days</div>
                      <div className="text-muted-foreground">Maximum Carry-Over</div>
                    </td>
                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      <Badge variant="outline" className="border-primary/40 text-primary">{c.members} Team Member On Contract</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-muted-foreground">Showing 1 to {filtered.length} of {SEED.length} entries</div>
        </Card>

        <Card className="p-4 space-y-3 border-amber-300/60">
          <div className="text-sm font-semibold text-amber-600 border-b border-amber-300/60 pb-1">
            Team Member Not Assigned To A Contract
          </div>
          <p className="text-xs text-muted-foreground">
            Team Member are required to have a contract in order for certain features within the system to become available.
            Below is a list of all of the team member within your company who have not been added to a contract. To add team member to a contract,
            first click into the contract from the list above and click the "Add Team Member" button, then select the team member you wish to add.
          </p>
          <ScrollArea className="max-h-80">
            <table className="w-full text-xs">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left font-semibold py-2 px-2">Team Member Name</th>
                  <th className="text-left font-semibold py-2 px-2">Permission</th>
                  <th className="text-left font-semibold py-2 px-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {unassigned.map((u: any, i: number) => (
                  <tr key={u.id} className={i % 2 ? "bg-muted/30" : ""}>
                    <td className="py-2 px-2">{u.name}</td>
                    <td className="py-2 px-2 text-muted-foreground">{u.permission || "Field User"}</td>
                    <td className="py-2 px-2 text-muted-foreground">{u.role_title || "Homecare Assistant - Basic"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </Card>
      </div>
    </AppLayout>
  );
}
