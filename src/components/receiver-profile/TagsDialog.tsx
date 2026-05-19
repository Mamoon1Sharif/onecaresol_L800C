import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { RECEIVER_TAG_OPTIONS, getTagDef } from "@/lib/receiver-tags";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string[];
  onSave: (tags: string[]) => void;
}

export function TagsDialog({ open, onOpenChange, value, onSave }: Props) {
  const [selected, setSelected] = useState<string[]>(value ?? []);
  const [search, setSearch] = useState("");

  useEffect(() => { if (open) { setSelected(value ?? []); setSearch(""); } }, [open, value]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return RECEIVER_TAG_OPTIONS;
    return RECEIVER_TAG_OPTIONS.filter((t) => t.label.toLowerCase().includes(q));
  }, [search]);

  const toggle = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Tags</DialogTitle>
        </DialogHeader>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border">
            {selected.map((label) => {
              const t = getTagDef(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggle(label)}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold hover:opacity-80"
                  style={{ backgroundColor: t.bg, color: t.fg }}
                >
                  {label}
                  <X className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        )}

        <Input
          placeholder="Search tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm"
          autoFocus
        />

        <div className="max-h-[55vh] overflow-y-auto space-y-1.5 pr-1">
          {filtered.map((t) => {
            const isSelected = selected.includes(t.label);
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => toggle(t.label)}
                className="w-full flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-muted/50 transition-colors"
              >
                <span
                  className="inline-flex items-center rounded px-2 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: t.bg, color: t.fg }}
                >
                  {t.label}
                </span>
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6 italic">No tags match your search.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(selected); onOpenChange(false); }}>Save Tags</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
