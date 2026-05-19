import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Heart, MapPin, Phone, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { AvatarUpload } from "@/components/AvatarUpload";
import { getCareReceiverAvatar } from "@/lib/avatars";
import { useDeleteCareReceiver, useUpdateCareReceiver } from "@/hooks/use-care-data";
import { useToast } from "@/hooks/use-toast";
import { TagsDialog } from "./TagsDialog";
import { getTagDef } from "@/lib/receiver-tags";
import type { Tables } from "@/integrations/supabase/types";

type CareReceiver = Tables<"care_receivers">;

interface Props {
  cr: CareReceiver;
  onEdit?: () => void;
}

export function ReceiverProfileHeader({ cr, onEdit }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const deleteMutation = useDeleteCareReceiver();
  const updateMutation = useUpdateCareReceiver();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  const tags: string[] = Array.isArray((cr as any).tags) ? (cr as any).tags : [];

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(cr.id);
      toast({ title: "Service user deleted", description: `${cr.name} has been removed.` });
      navigate("/carereceivers");
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message ?? "Could not delete service member.", variant: "destructive" });
    }
  };

  const handleSaveTags = async (next: string[]) => {
    try {
      await updateMutation.mutateAsync({ id: cr.id, tags: next } as any);
      toast({ title: "Tags updated", description: `${next.length} tag${next.length === 1 ? "" : "s"} saved.` });
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message ?? "Could not save tags.", variant: "destructive" });
    }
  };

  return (
    <>
      <Card className="border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            {(() => {
              const from = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;
              const isConflicts = from === "conflicts";
              return (
                <Button variant="ghost" size="sm" onClick={() => navigate(isConflicts ? "/rota/conflicts" : "/carereceivers")} className="gap-2 text-muted-foreground -ml-2">
                  <ArrowLeft className="h-4 w-4" /> {isConflicts ? "Back to Conflicts" : "Back to Service Members"}
                </Button>
              );
            })()}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setTagsOpen(true)} className="gap-2">
                <Tag className="h-4 w-4" /> Edit Tags
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-6">
            <AvatarUpload
              table="care_receivers"
              recordId={cr.id}
              currentSrc={cr.avatar_url || getCareReceiverAvatar(cr.id)}
              hasUploadedAvatar={!!cr.avatar_url}
              fallback={<Heart className="h-12 w-12 text-primary" />}
              invalidateKeys={[["care_receivers"], ["care_receivers", cr.id]]}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{cr.name}</h1>
                {cr.dnacpr && <Badge variant="destructive" className="text-xs">DNACPR</Badge>}
                {(() => {
                  const status = cr.account_status ?? cr.care_status ?? "Active";
                  return (
                    <Badge
                      variant="default"
                      className={
                        status === "Active" ? "bg-success/15 text-success border-0" :
                        status === "On Hold" ? "bg-warning/15 text-warning border-0" :
                        "bg-muted text-muted-foreground border-0"
                      }
                    >
                      {status}
                    </Badge>
                  );
                })()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Age {cr.age ?? "—"}</p>
              {cr.dob && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  DOB {new Date(cr.dob).toLocaleDateString("en-GB")}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{cr.address || "—"}</span>
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{cr.next_of_kin_phone || "—"}</span>
              </div>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap gap-1.5">
              {tags.map((label) => {
                const t = getTagDef(label);
                return (
                  <span
                    key={label}
                    className="inline-flex items-center rounded px-2.5 py-1 text-[11px] font-semibold shadow-sm"
                    style={{ backgroundColor: t.bg, color: t.fg }}
                    title={label}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <TagsDialog open={tagsOpen} onOpenChange={setTagsOpen} value={tags} onSave={handleSaveTags} />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {cr.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this service member and is not reversible.
              Linked rota entries, medications, reminders, and other records may also be affected.
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
