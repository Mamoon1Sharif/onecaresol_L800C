// Predefined service member tags with brand colors (hex pairs: bg + text)
export type TagDef = { label: string; bg: string; fg: string };

export const RECEIVER_TAG_OPTIONS: TagDef[] = [
  { label: "Care Service Contract Issued", bg: "#7e22ce", fg: "#ffffff" },
  { label: "Care Service Contract Received", bg: "#a855f7", fg: "#ffffff" },
  { label: "Concern reported", bg: "#be185d", fg: "#ffffff" },
  { label: "Consent form done", bg: "#10b981", fg: "#ffffff" },
  { label: "CONSENT NOT GIVEN FOR INFORMATION SHARING", bg: "#dc2626", fg: "#ffffff" },
  { label: "COS Letter Received", bg: "#06b6d4", fg: "#ffffff" },
  { label: "DBS Adult & Children", bg: "#059669", fg: "#ffffff" },
  { label: "DBS Applied for", bg: "#3b82f6", fg: "#ffffff" },
  { label: "DBS Disclaimer", bg: "#0ea5e9", fg: "#ffffff" },
  { label: "Has Full UK Driving Licence", bg: "#525252", fg: "#ffffff" },
  { label: "IPA Received", bg: "#1e293b", fg: "#ffffff" },
  { label: "Medication administered not on Emar", bg: "#ef4444", fg: "#ffffff" },
  { label: "Medication collected", bg: "#fca5a5", fg: "#7f1d1d" },
  { label: "Medication incident", bg: "#b91c1c", fg: "#ffffff" },
  { label: "Medication Ordered", bg: "#dc2626", fg: "#ffffff" },
  { label: "Medication query", bg: "#1f2937", fg: "#ffffff" },
  { label: "Power of Attorney in Place", bg: "#16a34a", fg: "#ffffff" },
  { label: "Privacy Notice December 2024", bg: "#f97316", fg: "#ffffff" },
  { label: "Privacy Notice December 2025", bg: "#f59e0b", fg: "#ffffff" },
  { label: "Privacy Notice July 2024", bg: "#f97316", fg: "#ffffff" },
  { label: "Registered to DBS Update Service", bg: "#7dd3fc", fg: "#0c4a6e" },
  { label: "Safeguarding in Place", bg: "#ec4899", fg: "#ffffff" },
  { label: "Service User Guide Dec 2025", bg: "#fb923c", fg: "#ffffff" },
  { label: "Service user guide Feb 2024", bg: "#fdba74", fg: "#7c2d12" },
  { label: "Service User Guide Jan 2026", bg: "#f59e0b", fg: "#ffffff" },
  { label: "Service User pack issued", bg: "#fb7185", fg: "#ffffff" },
];

export function getTagDef(label: string): TagDef {
  return (
    RECEIVER_TAG_OPTIONS.find((t) => t.label.toLowerCase() === label.toLowerCase()) ?? {
      label,
      bg: "#64748b",
      fg: "#ffffff",
    }
  );
}
