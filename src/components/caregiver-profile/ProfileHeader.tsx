import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCareGiverAvatar } from "@/lib/avatars";
import { AvatarUpload } from "@/components/AvatarUpload";
import { useDeleteCareGiver, useUpdateCareGiver } from "@/hooks/use-care-data";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CalendarDays, Phone, Mail, Trash2, Loader2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { CAREGIVER_STATUS_OPTIONS } from "@/lib/profile-options";
import type { Tables } from "@/integrations/supabase/types";

type CareGiver = Tables<"care_givers">;

interface Props {
  cg: CareGiver;
}

export function ProfileHeader({ cg }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const deleteMutation = useDeleteCareGiver();
  const updateMutation = useUpdateCareGiver();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleStatusChange = async (status: string) => {
    try {
      await updateMutation.mutateAsync({ id: cg.id, status } as any);
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message ?? "Could not update status.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(cg.id);
      toast({ title: "Care giver deleted", description: `${cg.name} has been removed.` });
      navigate("/caregivers");
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message ?? "Could not delete care giver.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/caregivers")} className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Care Givers
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/caregivers/${cg.id}/schedule`)} className="gap-2">
            <CalendarDays className="h-4 w-4" /> View Schedule
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Card className="border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-6">
          <div className="flex items-start gap-6">
            <AvatarUpload
              table="care_givers"
              recordId={cg.id}
              currentSrc={getCareGiverAvatar(cg.id, cg.avatar_url)}
              invalidateKeys={[["care_givers"], ["care_givers", cg.id]]}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{cg.name}</h1>
                <Select value={cg.status ?? ""} onValueChange={handleStatusChange}>
                  <SelectTrigger
                    className={cn(
                      "h-7 w-auto gap-1.5 rounded-full border px-3 py-0 text-xs font-medium",
                      cg.status === "Active" && "bg-success/15 text-success border-success/20",
                      cg.status === "Onboarding" && "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800",
                      cg.status === "Inactive" && "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    <Activity className="h-3 w-3" />
                    <SelectValue placeholder="Set status" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAREGIVER_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{cg.role_title || "Homecare Assistant"}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {cg.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{cg.phone}</span>}
                {cg.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{cg.email}</span>}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {cg.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this care giver and is not reversible.
              Linked schedule entries, reminders, and other records may also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting…</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" /> Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
