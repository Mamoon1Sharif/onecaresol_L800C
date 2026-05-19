import { useState } from "react";
import { Bell, ChevronDown, ToggleLeft, AlertOctagon, AlertTriangle, MessageSquare, Settings, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useFeatureToggles } from "@/hooks/use-feature-toggles";
import { useCurrentCompany } from "@/hooks/use-company";
import { toast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FeatureTogglesDialog } from "@/components/FeatureTogglesDialog";
import { cn } from "@/lib/utils";

type QuickAction = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  tone: "danger" | "warning" | "info" | "primary";
  to: string;
};

const TONE_STYLES: Record<QuickAction["tone"], { icon: string; badge: string; ring: string }> = {
  danger:  { icon: "text-destructive",                badge: "bg-destructive text-destructive-foreground",            ring: "hover:bg-destructive/10" },
  warning: { icon: "text-amber-500",                  badge: "bg-amber-500 text-white",                                ring: "hover:bg-amber-500/10" },
  info:    { icon: "text-sky-500",                    badge: "bg-sky-500 text-white",                                  ring: "hover:bg-sky-500/10" },
  primary: { icon: "text-primary",                    badge: "bg-primary text-primary-foreground",                     ring: "hover:bg-primary/10" },
};

const formatCount = (n: number) => (n > 99 ? "99+" : String(n));

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  if (typeof window !== "undefined") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const t = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(t);
    }, []);
  }
  return now;
}

export function AppHeader() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isEnabled } = useFeatureToggles();
  const { data: company } = useCurrentCompany();
  const [togglesOpen, setTogglesOpen] = useState(false);

  const companyName = (company as any)?.companies?.name ?? "CareAdmin";

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logged out", description: "You have been signed out." });
      navigate("/login", { replace: true });
    } catch (e: any) {
      toast({ title: "Logout failed", description: e?.message ?? "Try again.", variant: "destructive" });
    }
  };

  const actions: QuickAction[] = [
    { key: "incidents",     label: "Incidents",        icon: AlertOctagon,   count: 1167, tone: "danger",  to: "/incidents" },
    { key: "conflicts",     label: "Rota Conflicts",   icon: AlertTriangle,  count: 9,    tone: "warning", to: "/rota/conflicts" },
    { key: "messages",      label: "Messages",         icon: MessageSquare,  count: 228,  tone: "info",    to: "/messaging" },
    { key: "notifications", label: "Notifications",    icon: Bell,           count: 1602, tone: "primary", to: "/reminders" },
  ];

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger />
      </div>

      {/* Center: company badge */}
      <div className="hidden md:flex flex-1 items-center justify-center min-w-0 px-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15 max-w-full">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0">
            <Building2 className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-semibold text-foreground truncate" title={companyName}>{companyName}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-1.5">
        {isEnabled("notifications") && (
          <TooltipProvider delayDuration={120}>
            <div className="hidden sm:flex items-center gap-0.5 mr-1 pr-2 border-r border-border">
              {actions.map((a) => {
                const Icon = a.icon;
                const tone = TONE_STYLES[a.tone];
                return (
                  <Tooltip key={a.key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(a.to)}
                        aria-label={`${a.label} (${a.count})`}
                        className={cn(
                          "relative p-2 rounded-md transition-colors",
                          tone.ring
                        )}
                      >
                        <Icon className={cn("h-[18px] w-[18px]", tone.icon)} />
                        {a.count > 0 && (
                          <span
                            className={cn(
                              "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none flex items-center justify-center shadow-sm ring-2 ring-card",
                              tone.badge
                            )}
                          >
                            {formatCount(a.count)}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {a.label}: {a.count.toLocaleString()}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate("/settings")}
                    aria-label="Settings"
                    className="p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Settings className="h-[18px] w-[18px] text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Settings</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                AD
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-foreground leading-none">Admin User</p>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Super Admin</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => navigate("/profile")}>My Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTogglesOpen(true)}>
              <ToggleLeft className="h-4 w-4 mr-2" />
              Feature Toggles
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>Log Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <FeatureTogglesDialog open={togglesOpen} onOpenChange={setTogglesOpen} />
    </header>
  );
}
