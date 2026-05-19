import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpdateCareReceiver, useCareGivers } from "@/hooks/use-care-data";
import { EditableField } from "@/components/caregiver-profile/EditableField";
import { toast } from "sonner";
import {
  User, MapPin, Phone, Mail, Home, Heart, Hash, Calendar,
  Briefcase, Stethoscope, Pill, KeyRound, ShieldAlert, GraduationCap,
  Star, Plus, Pencil, Trash2, Clock, Activity, StickyNote, UserCog,
} from "lucide-react";
import {
  TITLE_OPTIONS, SUFFIX_OPTIONS, SEX_OPTIONS, GENDER_OPTIONS,
  SEXUAL_ORIENTATION_OPTIONS, ETHNICITY_OPTIONS, MARITAL_STATUS_OPTIONS,
  RELIGION_OPTIONS, RELATIONSHIP_OPTIONS,
} from "@/lib/profile-options";
import type { Tables } from "@/integrations/supabase/types";

type CareReceiver = Tables<"care_receivers">;

/* ------------------------- helpers ------------------------- */
function todayIsoDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}
function isActiveDnarSetting(row: any, today = todayIsoDate()) {
  return (
    row.status?.toLowerCase() === "active" &&
    (!row.applies_from || row.applies_from <= today) &&
    (!row.applies_until || row.applies_until >= today)
  );
}
async function syncCareReceiverDnarFlag(careReceiverId: string) {
  const { data, error } = await supabase
    .from("receiver_dnar_settings" as any)
    .select("status,applies_from,applies_until")
    .eq("care_receiver_id", careReceiverId);
  if (error) throw error;
  const hasActiveDnar = ((data ?? []) as any[]).some((row) => isActiveDnarSetting(row));
  const { error: updateError } = await supabase
    .from("care_receivers")
    .update({ dnacpr: hasActiveDnar } as any)
    .eq("id", careReceiverId);
  if (updateError) throw updateError;
}

function HoursRow({ hours }: { hours: any }) {
  const h = hours ? (typeof hours === "string" ? JSON.parse(hours) : hours) : {};
  return (
    <div className="grid grid-cols-2 gap-3">
      {["week1", "week2", "week3", "week4"].map((w, i) => (
        <div key={w} className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Week {i + 1}</p>
          <p className="text-lg font-bold text-foreground flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {h[w] || "00:00"}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------- main ------------------------- */
export function ReceiverDetailedProfileTab({ cr }: { cr: CareReceiver }) {
  const updateMutation = useUpdateCareReceiver();
  const [editHoursOpen, setEditHoursOpen] = useState(false);

  const save = async (field: string, value: any) => {
    try {
      const updates: any = { id: cr.id, [field]: value };
      if (field === "forename") updates.name = `${value} ${(cr as any).surname || ""}`.trim();
      else if (field === "surname") updates.name = `${(cr as any).forename || ""} ${value}`.trim();
      await updateMutation.mutateAsync(updates);
      toast.success(`${field.replace(/_/g, " ")} updated`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    }
  };

  return (
    <div className="space-y-6">
      {/* Service Member Details */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Service Member Details</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={User} label="Title" value={(cr as any).title} onSave={(v) => save("title", v)} options={TITLE_OPTIONS} />
            <EditableField icon={User} label="Forename" value={(cr as any).forename ?? cr.name?.split(" ")[0]} onSave={(v) => save("forename", v)} />
            <EditableField icon={User} label="Surname" value={(cr as any).surname ?? cr.name?.split(" ").slice(1).join(" ")} onSave={(v) => save("surname", v)} />
            <EditableField icon={User} label="Alias" value={(cr as any).alias} onSave={(v) => save("alias", v)} />
            <EditableField icon={User} label="Suffix" value={(cr as any).suffix} onSave={(v) => save("suffix", v)} options={SUFFIX_OPTIONS} />
            <EditableField icon={User} label="Pref" value={(cr as any).pref} onSave={(v) => save("pref", v)} />
            <EditableField icon={User} label="Sex Assigned At Birth" value={(cr as any).sex_assigned_at_birth} onSave={(v) => save("sex_assigned_at_birth", v)} options={SEX_OPTIONS} />
            <EditableField icon={User} label="Gender" value={(cr as any).gender} onSave={(v) => save("gender", v)} options={GENDER_OPTIONS} />
            <EditableField icon={User} label="Sexual Orientation" value={(cr as any).sexual_orientation} onSave={(v) => save("sexual_orientation", v)} options={SEXUAL_ORIENTATION_OPTIONS} />
            <EditableField icon={Calendar} label="DOB" value={(cr as any).dob} onSave={(v) => save("dob", v)} type="date" />
            <EditableField icon={User} label="Ethnicity" value={cr.ethnicity} onSave={(v) => save("ethnicity", v)} options={ETHNICITY_OPTIONS} />
            <EditableField icon={User} label="Marital Status" value={(cr as any).marital_status} onSave={(v) => save("marital_status", v)} options={MARITAL_STATUS_OPTIONS} />
            <EditableField icon={User} label="Religion" value={(cr as any).religion} onSave={(v) => save("religion", v)} options={RELIGION_OPTIONS} />
            <EditableField icon={Hash} label="NI Number" value={(cr as any).ni_number} onSave={(v) => save("ni_number", v)} />
            <EditableField icon={Hash} label="NHS Number" value={(cr as any).nhs_number} onSave={(v) => save("nhs_number", v)} />
            <EditableField icon={Hash} label="Authority Ref" value={(cr as any).authority_ref} onSave={(v) => save("authority_ref", v)} />
            <EditableField icon={Hash} label="Social Services ID" value={(cr as any).social_services_id} onSave={(v) => save("social_services_id", v)} />
            <EditableField icon={KeyRound} label="Keysafe" value={(cr as any).keysafe} onSave={(v) => save("keysafe", v)} />
            <EditableField icon={KeyRound} label="Mediverify" value={(cr as any).mediverify} onSave={(v) => save("mediverify", v)} />
            <EditableField icon={User} label="Preferred Language" value={(cr as any).preferred_language ?? cr.language} onSave={(v) => save("preferred_language", v)} />
            <EditableField icon={Stethoscope} label="Allergies" value={(cr as any).allergies} onSave={(v) => save("allergies", v)} />
            <EditableField icon={Phone} label="Phone Number" value={(cr as any).phone_number} onSave={(v) => save("phone_number", v)} type="tel" />
            <div className="flex items-center gap-3 py-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Phone Appears On App</p>
                <Switch checked={(cr as any).phone_appears_on_app ?? true} onCheckedChange={(v) => save("phone_appears_on_app", v)} />
              </div>
            </div>
            <EditableField icon={Home} label="Address" value={cr.address} onSave={(v) => save("address", v)} />
          </div>
        </CardContent>
      </Card>


      {/* Account Details */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Account Details</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={Hash} label="Reference No" value={(cr as any).reference_no} onSave={(v) => save("reference_no", v)} />
            <EditableField icon={UserCog} label="Sub Status" value={(cr as any).sub_status} onSave={(v) => save("sub_status", v)} />
            <EditableField icon={UserCog} label="Account Status" value={(cr as any).account_status} onSave={(v) => save("account_status", v)} options={["Active", "On Hold", "Discharged"]} />
            <EditableField icon={Calendar} label="Service Start Date" value={(cr as any).service_start_date} onSave={(v) => save("service_start_date", v)} type="date" />
            <EditableField icon={UserCog} label="Carer Pref" value={(cr as any).carer_pref ?? cr.preference} onSave={(v) => save("carer_pref", v)} options={["Either", "Male", "Female"]} />
            <EditableField icon={ShieldAlert} label="Risk Rating" value={cr.risk_rating} onSave={(v) => save("risk_rating", v)} options={["None", "Low", "Medium", "High"]} />
            <EditableField icon={StickyNote} label="Risk Rating Description" value={(cr as any).risk_rating_description} onSave={(v) => save("risk_rating_description", v)} />
            <EditableField icon={Hash} label="NPC Number" value={(cr as any).npc_number} onSave={(v) => save("npc_number", v)} />
            <EditableField icon={Briefcase} label="Contract Type" value={(cr as any).contract_type} onSave={(v) => save("contract_type", v)} options={["Scheduled", "Live-In", "Ad-Hoc"]} />
            <EditableField icon={MapPin} label="Area Name" value={(cr as any).area_name} onSave={(v) => save("area_name", v)} />
            <EditableField icon={UserCog} label="Onboarding Status" value={(cr as any).onboarding_status} onSave={(v) => save("onboarding_status", v)} options={["None","Pending","In Progress","Awaiting Documents","Complete","On Hold"]} />
            <div className="flex items-center gap-3 py-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Under Regulated Activity</p>
                <Switch checked={(cr as any).under_regulated_activity ?? false} onCheckedChange={(v) => save("under_regulated_activity", v)} />
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">DNACPR</p>
                <div className="flex items-center gap-2 mt-1">
                  <Switch checked={cr.dnacpr ?? false} onCheckedChange={(v) => save("dnacpr", v)} />
                  <Badge variant={cr.dnacpr ? "destructive" : "secondary"} className="text-xs">
                    {cr.dnacpr ? "Active" : "Not Active"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Of Kin */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Next Of Kin</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={User} label="Name" value={cr.next_of_kin} onSave={(v) => save("next_of_kin", v)} />
            <EditableField icon={Home} label="Address" value={cr.next_of_kin_address} onSave={(v) => save("next_of_kin_address", v)} />
            <EditableField icon={Phone} label="Tel" value={cr.next_of_kin_phone} onSave={(v) => save("next_of_kin_phone", v)} type="tel" />
            <EditableField icon={Mail} label="Email" value={cr.next_of_kin_email} onSave={(v) => save("next_of_kin_email", v)} type="email" />
          </div>
        </CardContent>
      </Card>

      {/* Doctor */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Doctor</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={Stethoscope} label="Name" value={cr.doctor_name} onSave={(v) => save("doctor_name", v)} />
            <EditableField icon={Home} label="Address" value={cr.doctor_address} onSave={(v) => save("doctor_address", v)} />
            <EditableField icon={Phone} label="Phone" value={cr.doctor_phone} onSave={(v) => save("doctor_phone", v)} type="tel" />
            <EditableField icon={Mail} label="Email" value={cr.doctor_contact} onSave={(v) => save("doctor_contact", v)} type="email" />
          </div>
        </CardContent>
      </Card>

      {/* Pharmacy */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Pharmacy</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={Pill} label="Name" value={cr.pharmacy_name} onSave={(v) => save("pharmacy_name", v)} />
            <EditableField icon={Home} label="Address" value={cr.pharmacy_address} onSave={(v) => save("pharmacy_address", v)} />
            <EditableField icon={Phone} label="Phone" value={cr.pharmacy_phone} onSave={(v) => save("pharmacy_phone", v)} type="tel" />
          </div>
        </CardContent>
      </Card>

      {/* Medical Login Details */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Medical Login Details</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            <EditableField icon={Hash} label="Company Number" value={(cr as any).medical_company_number} onSave={(v) => save("medical_company_number", v)} />
            <EditableField icon={Hash} label="Service Member Number" value={(cr as any).medical_service_user_number} onSave={(v) => save("medical_service_user_number", v)} />
            <EditableField icon={KeyRound} label="Password" value={(cr as any).medical_password} onSave={(v) => save("medical_password", v)} />
          </div>
          <p className="text-[11px] text-destructive italic pt-3">This login will display all Service Member medical info and is intended for doctor/paramedic use.</p>
        </CardContent>
      </Card>

      {/* DNAR settings (CRUD) */}
      <DnarSettingsCard careReceiverId={cr.id} />

      {/* Qualification Requirements (CRUD) */}
      <QualificationRequirementsCard careReceiverId={cr.id} />

      {/* User Preferences */}
      <UserPreferencesCard careReceiverId={cr.id} careReceiverName={cr.name} />

      {/* Requested Hours */}
      <Card className="border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-6 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Clock className="h-4 w-4" /> Requested Hours
          </h3>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditHoursOpen(true)}>
            <Pencil className="h-3 w-3" /> Edit
          </Button>
        </div>
        <CardContent className="p-5">
          <HoursRow hours={(cr as any).requested_hours} />
        </CardContent>
      </Card>

      <EditHoursDialog open={editHoursOpen} onOpenChange={setEditHoursOpen} cr={cr} onSave={(v) => save("requested_hours", v)} />
    </div>
  );
}

/* ============================================================
   DNAR Settings (full CRUD)
============================================================ */
function DnarSettingsCard({ careReceiverId }: { careReceiverId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState({ status: "Active", applies_from: "", applies_until: "", document_ref: "", notes: "" });
  const [delId, setDelId] = useState<string | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["receiver_dnar_settings", careReceiverId],
    queryFn: async () => {
      const { data, error } = await supabase.from("receiver_dnar_settings" as any).select("*").eq("care_receiver_id", careReceiverId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        care_receiver_id: careReceiverId,
        status: draft.status,
        applies_from: draft.applies_from || null,
        applies_until: draft.applies_until || null,
        document_ref: draft.document_ref || null,
        notes: draft.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from("receiver_dnar_settings" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receiver_dnar_settings" as any).insert(payload);
        if (error) throw error;
      }
      await syncCareReceiverDnarFlag(careReceiverId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receiver_dnar_settings", careReceiverId] });
      qc.invalidateQueries({ queryKey: ["care_receivers", careReceiverId] });
      qc.invalidateQueries({ queryKey: ["care_receivers"] });
      setOpen(false); setEditing(null);
      toast.success(editing ? "DNAR setting updated" : "DNAR setting added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receiver_dnar_settings" as any).delete().eq("id", id);
      if (error) throw error;
      await syncCareReceiverDnarFlag(careReceiverId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receiver_dnar_settings", careReceiverId] });
      qc.invalidateQueries({ queryKey: ["care_receivers", careReceiverId] });
      qc.invalidateQueries({ queryKey: ["care_receivers"] });
      setDelId(null);
      toast.success("Removed");
    },
  });

  return (
    <Card className="border border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> DNAR Settings
          </h3>
          <Button size="sm" className="h-7 px-2.5 text-[11px] gap-1" onClick={() => { setEditing(null); setDraft({ status: "Active", applies_from: "", applies_until: "", document_ref: "", notes: "" }); setOpen(true); }}>
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        <Separator className="mb-4" />
        {rows.length === 0 ? (
          <p className="text-[12px] text-muted-foreground italic">No DNAR records.</p>
        ) : (
          <div className="border border-border rounded">
            <div className="grid grid-cols-[1fr_120px_120px_140px_60px] gap-2 px-2 py-1.5 bg-muted/40 text-[11px] font-semibold text-muted-foreground border-b border-border">
              <div>Status / Notes</div><div>From</div><div>Until</div><div>Doc Ref</div><div className="text-right">Actions</div>
            </div>
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_120px_120px_140px_60px] gap-2 px-2 py-2 text-[12px] border-b border-border last:border-b-0">
                <div className="space-y-0.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.status === "Active" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
                  {r.notes && <p className="text-muted-foreground text-[11px] truncate">{r.notes}</p>}
                </div>
                <div className="text-muted-foreground">{r.applies_from ?? "—"}</div>
                <div className="text-muted-foreground">{r.applies_until ?? "—"}</div>
                <div className="text-muted-foreground truncate">{r.document_ref ?? "—"}</div>
                <div className="flex items-center gap-0.5 justify-end">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditing(r); setDraft({ status: r.status, applies_from: r.applies_from ?? "", applies_until: r.applies_until ?? "", document_ref: r.document_ref ?? "", notes: r.notes ?? "" }); setOpen(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setDelId(r.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit DNAR Setting" : "Add DNAR Setting"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Active","Inactive","Revoked"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Applies From</Label><Input type="date" value={draft.applies_from} onChange={e => setDraft({ ...draft, applies_from: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Applies Until</Label><Input type="date" value={draft.applies_until} onChange={e => setDraft({ ...draft, applies_until: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Document Ref</Label><Input value={draft.document_ref} onChange={e => setDraft({ ...draft, document_ref: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Notes</Label><Textarea rows={3} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete DNAR record?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => delId && del.mutate(delId)}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ============================================================
   Qualification Requirements
============================================================ */
function QualificationRequirementsCard({ careReceiverId }: { careReceiverId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState({ qualification: "", mandatory: true, notes: "" });
  const [delId, setDelId] = useState<string | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["receiver_qual_req", careReceiverId],
    queryFn: async () => {
      const { data, error } = await supabase.from("receiver_qualification_requirements" as any).select("*").eq("care_receiver_id", careReceiverId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { care_receiver_id: careReceiverId, qualification: draft.qualification.trim(), mandatory: draft.mandatory, notes: draft.notes || null };
      if (!payload.qualification) throw new Error("Qualification required");
      if (editing) {
        const { error } = await supabase.from("receiver_qualification_requirements" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("receiver_qualification_requirements" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_qual_req", careReceiverId] }); setOpen(false); setEditing(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("receiver_qualification_requirements" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_qual_req", careReceiverId] }); setDelId(null); toast.success("Removed"); },
  });

  return (
    <Card className="border border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Qualification Requirements
          </h3>
          <Button size="sm" className="h-7 px-2.5 text-[11px] gap-1" onClick={() => { setEditing(null); setDraft({ qualification: "", mandatory: true, notes: "" }); setOpen(true); }}>
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        <Separator className="mb-4" />
        {rows.length === 0 ? (
          <p className="text-[12px] text-muted-foreground italic">No qualification requirements set.</p>
        ) : (
          <div className="border border-border rounded">
            <div className="grid grid-cols-[1fr_120px_1fr_60px] gap-2 px-2 py-1.5 bg-muted/40 text-[11px] font-semibold text-muted-foreground border-b border-border">
              <div>Qualification</div><div>Mandatory</div><div>Notes</div><div className="text-right">Actions</div>
            </div>
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_120px_1fr_60px] gap-2 px-2 py-2 text-[12px] border-b border-border last:border-b-0 items-center">
                <div className="text-foreground">{r.qualification}</div>
                <div><span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.mandatory ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{r.mandatory ? "Mandatory" : "Optional"}</span></div>
                <div className="text-muted-foreground truncate">{r.notes ?? "—"}</div>
                <div className="flex items-center gap-0.5 justify-end">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditing(r); setDraft({ qualification: r.qualification, mandatory: r.mandatory, notes: r.notes ?? "" }); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setDelId(r.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Qualification Requirement" : "Add Qualification Requirement"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Qualification *</Label><Input value={draft.qualification} onChange={e => setDraft({ ...draft, qualification: e.target.value })} placeholder="e.g. Manual Handling, Medication Admin" /></div>
            <div className="flex items-center gap-2"><Switch checked={draft.mandatory} onCheckedChange={(v) => setDraft({ ...draft, mandatory: v })} /><Label className="text-xs">Mandatory</Label></div>
            <div className="space-y-1"><Label className="text-xs">Notes</Label><Textarea rows={3} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>{editing ? "Save" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove qualification requirement?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => delId && del.mutate(delId)}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ============================================================
   User Preferences (caregiver star ratings)
============================================================ */
function UserPreferencesCard({ careReceiverId, careReceiverName }: { careReceiverId: string; careReceiverName: string }) {
  const qc = useQueryClient();
  const { data: caregivers = [] } = useCareGivers();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ care_giver_id: string; rating: number; description: string }>({ care_giver_id: "", rating: 0, description: "" });
  const [search, setSearch] = useState("");
  const [delId, setDelId] = useState<string | null>(null);

  const { data: prefs = [] } = useQuery({
    queryKey: ["receiver_user_prefs", careReceiverId],
    queryFn: async () => {
      const { data, error } = await supabase.from("receiver_user_preferences" as any).select("*").eq("care_receiver_id", careReceiverId).order("rating", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const cgById = useMemo(() => Object.fromEntries(caregivers.map((c: any) => [c.id, c])), [caregivers]);

  const enriched = useMemo(() =>
    prefs.map((p) => ({ ...p, caregiver_name: cgById[p.care_giver_id]?.name ?? "Unknown caregiver" }))
      .filter((r) => !search.trim() || r.caregiver_name.toLowerCase().includes(search.toLowerCase()))
  , [prefs, cgById, search]);

  const upsert = useMutation({
    mutationFn: async () => {
      if (!draft.care_giver_id) throw new Error("Select a caregiver");
      const { error } = await supabase
        .from("receiver_user_preferences" as any)
        .upsert({ care_receiver_id: careReceiverId, care_giver_id: draft.care_giver_id, rating: draft.rating, description: draft.description || null }, { onConflict: "care_receiver_id,care_giver_id" } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_user_prefs", careReceiverId] }); setOpen(false); toast.success("Preference saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("receiver_user_preferences" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["receiver_user_prefs", careReceiverId] }); setDelId(null); toast.success("Removed"); },
  });

  const updateRating = useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      const { error } = await supabase.from("receiver_user_preferences" as any).update({ rating }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["receiver_user_prefs", careReceiverId] }),
  });

  return (
    <Card className="border border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> User Preferences
          </h3>
          <Button size="sm" className="h-7 px-2.5 text-[11px] gap-1" onClick={() => { setDraft({ care_giver_id: "", rating: 0, description: "" }); setOpen(true); }}>
            <Plus className="h-3 w-3" /> Add Preference
          </Button>
        </div>
        <Separator className="mb-4" />

        <div className="flex items-center justify-end gap-2 pb-2">
          <Label className="text-xs">Search:</Label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-7 w-48 text-xs" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border border-border rounded overflow-hidden">
            <thead className="bg-muted/40 text-foreground">
              <tr>
                <th className="w-10 px-2 py-2"></th>
                <th className="text-left px-3 py-2 font-semibold">Service Member</th>
                <th className="text-left px-3 py-2 font-semibold">Rating</th>
                <th className="text-left px-3 py-2 font-semibold">Care Giver</th>
                <th className="text-left px-3 py-2 font-semibold">Description</th>
                <th className="w-12 px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {enriched.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground italic">No preferences set</td></tr>
              ) : enriched.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-2 py-2"><Pencil className="h-3 w-3 text-muted-foreground" /></td>
                  <td className="px-3 py-2 text-foreground">{careReceiverName}</td>
                  <td className="px-3 py-2"><StarRating value={r.rating} onChange={(v) => updateRating.mutate({ id: r.id, rating: v })} title={r.description ?? ""} /></td>
                  <td className="px-3 py-2 text-primary">{r.caregiver_name}</td>
                  <td className="px-3 py-2 text-muted-foreground italic">{r.description || "No Preference"}</td>
                  <td className="px-2 py-2"><Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => setDelId(r.id)}><Trash2 className="h-3 w-3" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Care Giver Preference</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Care Giver</Label>
              <Select value={draft.care_giver_id} onValueChange={(v) => setDraft({ ...draft, care_giver_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select care giver" /></SelectTrigger>
                <SelectContent>{caregivers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rating</Label>
              <StarRating value={draft.rating} onChange={(v) => setDraft({ ...draft, rating: v })} title="" large />
            </div>
            <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Why this preference" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove preference?</AlertDialogTitle><AlertDialogDescription>This will remove the rating between this care giver and service member.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => delId && del.mutate(delId)}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function StarRating({ value, onChange, title, large }: { value: number; onChange: (v: number) => void; title?: string; large?: boolean }) {
  const sz = large ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5" title={title}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="hover:scale-110 transition-transform">
          <Star className={`${sz} ${n <= value ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40"}`} />
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   Edit Hours Dialog
============================================================ */
function EditHoursDialog({ open, onOpenChange, cr, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; cr: CareReceiver; onSave: (p: any) => void }) {
  const initial = (cr as any).requested_hours
    ? typeof (cr as any).requested_hours === "string" ? JSON.parse((cr as any).requested_hours) : (cr as any).requested_hours
    : { week1: "00:00", week2: "00:00", week3: "00:00", week4: "00:00" };
  const [h, setH] = useState(initial);
  useMemo(() => { if (open) setH(initial); }, [open]); // eslint-disable-line
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Requested Weekly Hours</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {(["week1","week2","week3","week4"] as const).map((w, i) => (
            <div key={w} className="space-y-1"><Label className="text-xs">Week {i+1}</Label><Input value={h[w] ?? "00:00"} onChange={(e) => setH({ ...h, [w]: e.target.value })} placeholder="00:00" /></div>
          ))}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => { onSave(h); onOpenChange(false); }}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
