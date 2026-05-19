import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { LiveRotaShiftDialog, type LiveRotaShift } from "@/components/LiveRotaShiftDialog";

/**
 * Full-page "Live Single Rota" view. Reuses the rich LiveRotaShiftDialog so
 * every shift action (assign, lock, notes, meds, amend, etc.) stays in one
 * place. The dialog is always open here and closing navigates back.
 */
export default function LiveSingleRota() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const shift = useMemo<LiveRotaShift>(() => ({
    visitId: params.get("visitId") ?? undefined,
    ref: params.get("ref") ?? "—",
    date: params.get("date") ?? "",
    start: params.get("start") ?? "",
    end: params.get("end") ?? "",
    client: params.get("client") ?? "",
    staff: params.get("staff") ?? "Unallocated",
    serviceCall: params.get("serviceCall") ?? undefined,
    schedHrs: params.get("schedHrs") ?? "00:00",
    clockHrs: params.get("clockHrs") ?? "00:00",
  }), [params]);

  const handleClose = () => {
    const from = params.get("from");
    navigate(from === "conflicts" ? "/rota/conflicts" : -1 as any);
  };

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        <LiveRotaShiftDialog shift={shift} open={true} onClose={handleClose} />
      </div>
    </AppLayout>
  );
}
