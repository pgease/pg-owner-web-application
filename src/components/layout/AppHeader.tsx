import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Building2,
  ChevronDown,
  Check,
  Plus,
  LogOut,
  Globe,
  Sun,
  Moon,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { authStorage } from "@/api/http";
import { useTutorials } from "@/context/TutorialContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import mascotRent from "@/assets/mascot/mascot-rent.png";
import { cn } from "@/lib/utils";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
import { EditProfileModal } from "@/components/settings/EditProfileModal";

interface AppHeaderProps {
  onMenuToggle: () => void;
}

const AppHeader = ({ onMenuToggle }: AppHeaderProps) => {
  const { properties, selectedPgId, setSelectedPgId, language, setLanguage } = useApp();
  const navigate = useNavigate();
  const { openYouTubeTutorial, currentRouteTutorialKey } = useTutorials();
  const entitlements = useEntitlements();
  const subAccess = useSubscriptionAccess();
  const [trialExpiredOpen, setTrialExpiredOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  const list = properties;
  const selectedPg = useMemo(
    () => (Array.isArray(list) ? list.find((p) => p.id === selectedPgId) : null),
    [list, selectedPgId],
  );

  const [owner, setOwner] = useState(() => authStorage.getPropertyOwner());
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  useEffect(() => {
    const handleOwnerUpdate = () => {
      setOwner(authStorage.getPropertyOwner());
    };
    const handleOpenEditProfile = () => {
      setEditProfileOpen(true);
    };
    window.addEventListener("pgease-owner-updated", handleOwnerUpdate);
    window.addEventListener("pgease-auth-token-updated", handleOwnerUpdate);
    window.addEventListener("open-edit-profile", handleOpenEditProfile);
    return () => {
      window.removeEventListener("pgease-owner-updated", handleOwnerUpdate);
      window.removeEventListener("pgease-auth-token-updated", handleOwnerUpdate);
      window.removeEventListener("open-edit-profile", handleOpenEditProfile);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  const handleLogout = () => {
    authStorage.clear();
    navigate("/login");
  };

  const handleAddProperty = () => {
    if (subAccess.isExpired) {
      setTrialExpiredOpen(true);
    } else {
      navigate("/my-pgs/structure");
    }
  };

  const initials = (owner?.name || "O").trim().slice(0, 2).toUpperCase();

  // Single source of truth for plan badge across the entire application
  const planChip = (() => {
    if (entitlements.isLoading) return null;
    if (entitlements.isExpired) {
      return {
        label: "Plan expired",
        tone: "text-[#B42318] bg-[#FEF1F0] border border-[#F6C7C2]",
      };
    }
    const days = Math.max(0, entitlements.daysRemaining);
    const daysLabel = `${days} ${days === 1 ? "day" : "days"} left`;
    if (entitlements.isTrial) {
      return {
        label: `Pro Trial · ${daysLabel}`,
        tone: "text-[#A15C07] bg-[#FFF7E6] border border-[#F5D9A8]",
      };
    }
    if (entitlements.isPro) {
      return {
        label: days > 0 ? `Pro · ${daysLabel}` : "Pro",
        tone: "text-[#006B6B] bg-[#E8F4F4] border border-[#CCE6E6]",
      };
    }
    if (entitlements.isLite) {
      return {
        label: "Lite",
        tone: "text-[#556270] bg-[#EEF1F3] border border-[#E2E6EA]",
      };
    }
    if (days > 0) {
      return {
        label: `Pro Trial · ${daysLabel}`,
        tone: "text-[#A15C07] bg-[#FFF7E6] border border-[#F5D9A8]",
      };
    }
    return {
      label: "Lite",
      tone: "text-[#556270] bg-[#EEF1F3] border border-[#E2E6EA]",
    };
  })();

  return (
    <>
      <header className="sticky top-0 z-30 h-[56px] border-b border-[#E2E6EA] bg-white">
        <div className="flex h-full items-center gap-2 px-3 md:gap-3 md:px-5">
          {/* Mobile: menu + logo */}
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-[4px] p-2 text-[#556270] hover:bg-[#EEF1F3] hover:text-[#18212B] md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/dashboard" className="flex items-center md:hidden" aria-label="PG Ease dashboard">
            <img src={pgeaseLogo} alt="" className="h-7 w-7 rounded-[4px] object-cover" />
          </Link>

          {/* Property switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-[36px] max-w-[200px] gap-2 px-2.5 sm:max-w-[260px] text-[#18212B] border-[#C8CFD6]"
                aria-label="Switch property"
              >
                <Building2 className="h-4 w-4 shrink-0 text-[#008080]" />
                <span className="truncate text-[13px] font-medium">
                  {selectedPg ? selectedPg.name : list.length ? "Select a PG" : "No PG yet"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[240px] shadow-pop border-[#E2E6EA] bg-white">
              <DropdownMenuLabel className="text-xs text-[#6B7785]">Your properties</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#E2E6EA]" />
              {list.length === 0 ? (
                <DropdownMenuItem disabled className="text-xs text-[#98A2AE]">No properties added yet</DropdownMenuItem>
              ) : (
                list.map((pg) => (
                  <DropdownMenuItem
                    key={pg.id}
                    onClick={() => setSelectedPgId(pg.id)}
                    className="gap-2 cursor-pointer text-[13px]"
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-[#6B7785]" />
                    <span className="flex-1 truncate">{pg.name}</span>
                    {selectedPgId === pg.id ? <Check className="h-4 w-4 text-[#008080]" aria-label="Selected" /> : null}
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator className="bg-[#E2E6EA]" />
              <DropdownMenuItem
                onClick={handleAddProperty}
                className="gap-2 font-medium text-[#008080] focus:text-[#008080] focus:bg-[#E8F4F4] cursor-pointer text-[13px]"
              >
                <Plus className="h-4 w-4 shrink-0" />
                Add new property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Plan badge (single source of truth) */}
          {planChip ? (
            <button
              type="button"
              onClick={() => navigate("/plans")}
              className={cn(
                "hidden shrink-0 whitespace-nowrap rounded-[4px] px-2 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-80 lg:inline-flex",
                planChip.tone,
              )}
              title="View plans & billing"
            >
              {planChip.label}
            </button>
          ) : null}

          <div className="ml-auto flex items-center gap-1">
            {/* Contextual tutorial */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void openYouTubeTutorial(currentRouteTutorialKey)}
                  className="h-[36px] gap-1.5 px-2.5 text-[#556270] hover:text-[#008080]"
                  aria-label="Watch this page’s tutorial on YouTube"
                >
                  <svg
                    className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
                      fill="#FF0000"
                    />
                    <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
                  </svg>
                  <span className="hidden text-[13px] font-medium sm:inline">Tutorial</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Opens this page’s tutorial on YouTube</TooltipContent>
            </Tooltip>

            {/* Ease Buddy Trigger in Header */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-ease-buddy"))}
                  className="h-[36px] gap-1.5 px-2 text-[#008080] hover:bg-[#E8F4F4]"
                  aria-label="Open Ease Buddy AI"
                >
                  <img
                    src={mascotRent}
                    alt="Ease Buddy Mascot"
                    className="h-5 w-5 rounded-full object-cover object-top border border-[#008080]/30 shadow-2xs shrink-0"
                  />
                  <span className="hidden text-[13px] font-medium lg:inline">Ease Buddy</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Ask Ease Buddy operational questions</TooltipContent>
            </Tooltip>

            {/* User Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ml-1 flex items-center gap-2 rounded-[4px] p-1 pr-2 text-left hover:bg-[#EEF1F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008080]"
                  aria-label="Account menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F4F4] text-[12px] font-semibold text-[#008080]">
                    {initials}
                  </span>
                  <span className="hidden min-w-0 lg:block">
                    <span className="block max-w-[120px] truncate text-[13px] font-medium leading-tight text-[#18212B]">
                      {owner?.name ?? "Owner"}
                    </span>
                    <span className="block text-[11px] leading-tight text-[#6B7785]">PG owner</span>
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 opacity-60 lg:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 shadow-pop border-[#E2E6EA] bg-white">
                <DropdownMenuLabel className="font-normal pb-2">
                  <p className="truncate text-sm font-semibold text-[#18212B]">{owner?.name ?? "Owner"}</p>
                  {owner?.email && <p className="truncate text-xs text-[#6B7785]">{owner.email}</p>}
                  <p className="text-[11px] font-medium text-[#008080] mt-0.5">{entitlements.planDisplayName}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#E2E6EA]" />
                <DropdownMenuItem onClick={() => setEditProfileOpen(true)} className="gap-2 cursor-pointer text-[13px] font-medium text-[#18212B]">
                  <User className="h-4 w-4 text-[#008080]" /> Edit Profile (Name & Email)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 cursor-pointer text-[13px]">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDark((v) => !v)} className="gap-2 cursor-pointer text-[13px]">
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {isDark ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#E2E6EA]" />
                <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-[#6B7785]">
                  <Globe className="h-3.5 w-3.5" /> Language
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setLanguage("en-US")} className="justify-between cursor-pointer text-[13px]">
                  English {language === "en-US" ? <Check className="h-4 w-4 text-[#008080]" /> : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("hi-IN")} className="justify-between cursor-pointer text-[13px]">
                  हिन्दी {language === "hi-IN" ? <Check className="h-4 w-4 text-[#008080]" /> : null}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#E2E6EA]" />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-[#B42318] focus:bg-[#FEF1F0] focus:text-[#B42318] cursor-pointer text-[13px]">
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <TrialExpiredGateModal open={trialExpiredOpen} onOpenChange={setTrialExpiredOpen} featureName="Add New Property" />
      <EditProfileModal open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    </>
  );
};

export default AppHeader;
