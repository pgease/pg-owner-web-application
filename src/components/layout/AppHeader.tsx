import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  LogOut,
  ChevronDown,
  Building2,
  Plus,
  Check,
  PlayCircle,
  LifeBuoy,
  Moon,
  Sun,
  Settings,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import { authStorage } from "@/api/http";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useApp } from "@/context/AppContext";
import { useTutorial } from "@/context/TutorialContext";
import { SupportLearningHubModal } from "@/components/common/SupportLearningHubModal";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { useEntitlements } from "@/hooks/useEntitlements";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  onMenuToggle?: () => void;
}

const THEME_KEY = "pgease_theme";

function readStoredTheme(): boolean {
  try {
    return localStorage.getItem(THEME_KEY) === "dark";
  } catch {
    return false;
  }
}

const AppHeader = ({ onMenuToggle }: AppHeaderProps) => {
  const [isDark, setIsDark] = useState<boolean>(readStoredTheme);
  const [supportHubOpen, setSupportHubOpen] = useState(false);
  const [trialExpiredOpen, setTrialExpiredOpen] = useState(false);
  const subAccess = useSubscriptionAccess();
  const entitlements = useEntitlements();

  const navigate = useNavigate();
  const { language, setLanguage, selectedPgId, setSelectedPgId, properties } = useApp();
  const { openTutorial, currentRouteTutorialKey } = useTutorial();
  const owner = authStorage.getPropertyOwner();
  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);

  // Apply persisted theme on mount and whenever it changes.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch {
      // ignore storage failures
    }
  }, [isDark]);

  const handleLogout = () => {
    authStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleAddProperty = () => {
    if (subAccess.isExpired) {
      setTrialExpiredOpen(true);
    } else {
      navigate("/onboarding", { state: { forceShowForm: true } });
    }
  };

  const initials = (owner?.name || "O").trim().slice(0, 2).toUpperCase();

  // Compact plan chip — informative, not promotional.
  const planChip = (() => {
    if (entitlements.isLoading) return null;
    if (entitlements.isExpired) return { label: "Plan expired", tone: "text-destructive bg-destructive/10" };
    if (entitlements.isTrial) return { label: `Trial · ${entitlements.daysRemaining}d left`, tone: "text-amber-700 bg-warning/15 dark:text-amber-300" };
    if (entitlements.isPro) return { label: "Pro", tone: "text-primary bg-primary/10" };
    return { label: "Lite", tone: "text-muted-foreground bg-muted" };
  })();

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-2 px-3 md:gap-3 md:px-5">
          {/* Mobile: menu + logo */}
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/dashboard" className="flex items-center md:hidden" aria-label="PG Ease dashboard">
            <img src={pgeaseLogo} alt="" className="h-7 w-7 rounded-md object-cover" />
          </Link>

          {/* Property switcher — the most important header control */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 max-w-[200px] gap-2 px-2.5 sm:max-w-[260px]" aria-label="Switch property">
                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-sm font-medium">
                  {selectedPg ? selectedPg.name : list.length ? "Select a PG" : "No PG yet"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[240px]">
              <DropdownMenuLabel>Your properties</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {list.length === 0 ? (
                <DropdownMenuItem disabled>No properties added yet</DropdownMenuItem>
              ) : (
                list.map((pg) => (
                  <DropdownMenuItem key={pg.id} onClick={() => setSelectedPgId(pg.id)} className="gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{pg.name}</span>
                    {selectedPgId === pg.id ? <Check className="h-4 w-4 text-primary" aria-label="Selected" /> : null}
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAddProperty} className="gap-2 font-medium text-primary focus:text-primary">
                <Plus className="h-4 w-4 shrink-0" />
                Add new property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {planChip ? (
            <button
              type="button"
              onClick={() => navigate("/plans")}
              className={cn("hidden shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80 lg:inline-flex", planChip.tone)}
              title="View plans & billing"
            >
              {planChip.label}
            </button>
          ) : null}

          <div className="ml-auto flex items-center gap-1">
            {/* Contextual tutorial for the current page */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void openTutorial(currentRouteTutorialKey)}
                  className="h-9 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
                  aria-label="Watch tutorial for this page"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span className="hidden text-sm sm:inline">Tutorial</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Watch a short video about this page</TooltipContent>
            </Tooltip>

            {/* Help & support */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSupportHubOpen(true)}
                  className="h-9 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
                  aria-label="Help and support"
                >
                  <LifeBuoy className="h-4 w-4" />
                  <span className="hidden text-sm sm:inline">Help</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Contact support or browse tutorials</TooltipContent>
            </Tooltip>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ml-1 flex items-center gap-2 rounded-md p-1 pr-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Account menu"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                  </span>
                  <span className="hidden min-w-0 lg:block">
                    <span className="block max-w-[120px] truncate text-sm font-medium leading-tight text-foreground">
                      {owner?.name ?? "Owner"}
                    </span>
                    <span className="block text-[11px] leading-tight text-muted-foreground">PG owner</span>
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 opacity-60 lg:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-medium">{owner?.name ?? "Owner"}</p>
                  <p className="text-xs text-muted-foreground">{entitlements.planDisplayName}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDark((v) => !v)} className="gap-2">
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {isDark ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" /> Language
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setLanguage("en-US")} className="justify-between">
                  English {language === "en-US" ? <Check className="h-4 w-4 text-primary" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("hi-IN")} className="justify-between">
                  हिन्दी {language === "hi-IN" ? <Check className="h-4 w-4 text-primary" /> : null}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <SupportLearningHubModal open={supportHubOpen} onOpenChange={setSupportHubOpen} />
      <TrialExpiredGateModal open={trialExpiredOpen} onOpenChange={setTrialExpiredOpen} featureName="Add New Property" />
    </>
  );
};

export default AppHeader;
