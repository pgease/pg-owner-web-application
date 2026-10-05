import { useState, useMemo, useEffect, useRef } from "react";
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
  Sparkles,
  ShieldCheck,
  Search,
  X,
  ArrowRight,
  Bell,
  Command,
  LayoutDashboard,
  Users,
  IndianRupee,
  Wrench,
} from "lucide-react";
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
import pgeaseIconColor from "@/assets/pgease-icon-color.png";
import mascotRent from "@/assets/mascot/mascot-rent.png";
import { cn } from "@/lib/utils";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
import { EditProfileModal } from "@/components/settings/EditProfileModal";

interface AppHeaderProps {
  onMenuToggle: () => void;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
}

const SEARCH_COMMANDS = [
  { title: "Dashboard", category: "Overview", icon: LayoutDashboard, url: "/dashboard", keywords: "home summary stats overview" },
  { title: "All Tenants", category: "Tenants", icon: Users, url: "/tenants", keywords: "tenant resident occupant customer find list" },
  { title: "Rent Collection & Dues", category: "Finance", icon: IndianRupee, url: "/rent-payments", keywords: "payment rent collect dues pending" },
  { title: "Payment History", category: "Finance", icon: IndianRupee, url: "/rent-payments/history", keywords: "transactions receipts ledger history" },
  { title: "Expenses Tracker", category: "Finance", icon: IndianRupee, url: "/expenses", keywords: "bills electricity maintenance spend cost" },
  { title: "Rooms & Structure", category: "Property", icon: Building2, url: "/my-pgs/structure", keywords: "rooms beds floors building layout" },
  { title: "Amenities & Facilities", category: "Property", icon: Building2, url: "/my-pgs/amenities", keywords: "ac geyser laundry gym ro water" },
  { title: "House Rules", category: "Property", icon: Building2, url: "/my-pgs/restrictions", keywords: "gate timing curfew smoking policy rules" },
  { title: "WiFi Settings", category: "Property", icon: Building2, url: "/my-pgs/wifi", keywords: "internet router password wifi ssid" },
  { title: "Notice Board", category: "Property", icon: Building2, url: "/my-pgs/notices", keywords: "announcement circular broadcast notice" },
  { title: "Complaints & Maintenance", category: "Operations", icon: Wrench, url: "/complaints", keywords: "issues repair ticket plumber electrician" },
  { title: "Food & Meal Timings", category: "Operations", icon: Sparkles, url: "/food", keywords: "mess breakfast lunch dinner menu kitchen" },
  { title: "Staff & Permissions", category: "Management", icon: User, url: "/team", keywords: "manager warden security cook team staff roles" },
  { title: "Financial Reports", category: "Reports", icon: Building2, url: "/reports", keywords: "profit loss report analytics revenue" },
  { title: "Account Settings", category: "Settings", icon: User, url: "/settings", keywords: "profile bank details password account" },
  { title: "Plans & Subscription", category: "Settings", icon: Sparkles, url: "/plans", keywords: "upgrade renew billing pro lite plan" },
];

const AppHeader = ({ onMenuToggle, onSidebarToggle, isSidebarCollapsed }: AppHeaderProps) => {
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

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchModalOpen]);

  const filteredCommands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SEARCH_COMMANDS.slice(0, 8);
    return SEARCH_COMMANDS.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        cmd.keywords.toLowerCase().includes(q) ||
        cmd.url.toLowerCase().includes(q)
    );
  }, [searchQuery]);



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

  const ownerName = owner?.name && !owner.name.startsWith("user_") ? owner.name : "PG Owner";
  const initials = (ownerName || "O").trim().slice(0, 2).toUpperCase();



  // Single source of truth for plan badge
  const planChip = (() => {
    if (entitlements.isLoading) return null;
    if (entitlements.isExpired) {
      return {
        label: "Plan expired",
        tone: "text-white bg-rose-500/30 border-rose-400/50 hover:bg-rose-500/40",
      };
    }
    const days = Math.max(0, entitlements.daysRemaining);
    const daysLabel = `${days} ${days === 1 ? "day" : "days"} left`;
    if (entitlements.isTrial) {
      return {
        label: `Pro Trial · ${daysLabel}`,
        tone: "text-amber-200 bg-amber-400/20 border-amber-300/40 hover:bg-amber-400/30 shadow-xs",
      };
    }
    if (entitlements.isPro) {
      return {
        label: days > 0 ? `Pro · ${daysLabel}` : "Pro Plan",
        tone: "text-emerald-100 bg-emerald-400/25 border-emerald-300/40 hover:bg-emerald-400/35 shadow-xs",
      };
    }
    if (entitlements.isLite) {
      return {
        label: "Lite Plan",
        tone: "text-teal-100 bg-white/10 border-white/20 hover:bg-white/20",
      };
    }
    if (days > 0) {
      return {
        label: `Pro Trial · ${daysLabel}`,
        tone: "text-amber-200 bg-amber-400/20 border-amber-300/40 hover:bg-amber-400/30",
      };
    }
    return {
      label: "Lite Plan",
      tone: "text-teal-100 bg-white/10 border-white/20 hover:bg-white/20",
    };
  })();

  return (
    <>
      {/* Header bar: fixed at the top of the app container, never scrolls */}
      <header className="h-[64px] shrink-0 bg-gradient-to-r from-[#005555] via-[#005050] to-[#004848] text-white select-none z-20">
        <div className="flex h-full items-center justify-between gap-2.5 sm:gap-4 px-3 sm:px-6">
          {/* Left section: Mobile menu + Mobile property switcher */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile-only menu toggle */}
            <button
              type="button"
              onClick={onMenuToggle}
              className="rounded-xl p-2 text-teal-100 hover:bg-white/10 hover:text-white md:hidden transition-colors shrink-0 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile-only brand & property switcher */}
            <div className="flex items-center gap-2 md:hidden min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/10 text-white text-xs font-bold truncate cursor-pointer"
                  >
                    <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0">
                      <img src={pgeaseIconColor} alt="PG Ease" className="h-full w-full object-contain" />
                    </div>
                    <span className="truncate max-w-[120px]">{selectedPg ? selectedPg.name : "My PG"}</span>
                    <ChevronDown className="h-3 w-3 text-teal-200 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-68 rounded-2xl p-2 shadow-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 z-50">
                  <div className="px-2 py-1">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Switch Active PG</p>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {list.map((pg) => (
                      <DropdownMenuItem
                        key={pg.id}
                        onClick={() => setSelectedPgId(pg.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-semibold cursor-pointer",
                          selectedPgId === pg.id ? "bg-teal-50 dark:bg-teal-950/40 text-[#008080] font-bold" : "text-slate-700 dark:text-slate-200"
                        )}
                      >
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate flex-1">{pg.name}</span>
                        {selectedPgId === pg.id ? <Check className="h-3.5 w-3.5 text-[#008080]" /> : null}
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
                  <DropdownMenuItem
                    onClick={handleAddProperty}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-bold text-[#008080] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add New Property</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Center section: Search Bar -> Opens Quick Command Palette on Click */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6 flex justify-center">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="group flex items-center justify-between gap-2.5 bg-black/25 hover:bg-black/35 focus:bg-black/45 border border-white/20 hover:border-teal-300 rounded-full px-4 py-2 w-full text-xs text-white shadow-inner transition-all ring-1 ring-teal-400/25 hover:ring-teal-400/50 cursor-pointer text-left"
              title="Click or press ⌘K to open command palette"
            >
              <div className="flex items-center gap-2.5 text-teal-100/80 group-hover:text-white transition-colors truncate">
                <Search className="h-3.5 w-3.5 text-teal-200 shrink-0" />
                <span className="text-xs truncate">Search tenants, rooms, dues, quick actions...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-teal-200 border border-white/15 shrink-0 group-hover:bg-white/20 group-hover:text-white">
                <Command className="h-3 w-3" /> K
              </kbd>
            </button>
          </div>

          {/* Right section: Action Buttons & User Menu (Matching Rentok) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Plan Badge Pill */}
            {planChip ? (
              <button
                type="button"
                onClick={() => navigate("/plans")}
                className={cn(
                  "hidden xl:inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-black border transition-all hover:scale-105 cursor-pointer shadow-xs",
                  planChip.tone,
                )}
                title="View plans & billing"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>{planChip.label}</span>
              </button>
            ) : null}

            {/* YouTube Tutorial Quick Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => void openYouTubeTutorial(currentRouteTutorialKey)}
                  className="hidden lg:flex h-9 items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3 text-xs font-bold text-white transition-all hover:scale-105 shadow-xs cursor-pointer"
                  aria-label="Watch video tutorial on YouTube"
                >
                  <svg
                    className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
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
                  <span className="hidden xl:inline">Tutorial</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs bg-slate-900 text-white border-slate-700">
                Watch step-by-step video guide on YouTube
              </TooltipContent>
            </Tooltip>

            {/* Notifications Bell [🔔] */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="relative h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all shadow-xs hover:scale-105 cursor-pointer"
                      aria-label="View notifications"
                    >
                      <Bell className="h-4 w-4 text-teal-200 hover:text-white" />
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent className="text-xs bg-slate-900 text-white border-slate-700">
                  Notifications
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                align="end"
                className="w-80 rounded-2xl p-3 shadow-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 z-50"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                  <span className="text-[10px] font-semibold text-slate-400">0 unread</span>
                </div>
                <div className="py-6 px-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-teal-50 dark:bg-teal-950/40 text-[#008080] dark:text-teal-300 flex items-center justify-center mx-auto mb-2">
                    <Bell className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">All caught up!</p>
                  <p className="text-[11px] text-slate-500 mt-1">No unread alerts or notifications right now.</p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => navigate("/settings/notifications")}
                    className="w-full text-center text-xs font-bold text-[#008080] dark:text-teal-300 hover:underline py-1"
                  >
                    Notification Preferences
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Ease Buddy AI Trigger (Rentok Mascot Style in top bar!) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-ease-buddy"))}
                  className="relative group p-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-emerald-300 transition-all shadow-md shrink-0 cursor-pointer"
                  aria-label="Open Ease Buddy AI"
                >
                  <img
                    src={mascotRent}
                    alt="Ease Buddy"
                    className="h-8 w-8 rounded-full object-cover object-top ring-2 ring-emerald-400 group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-[8px] font-black text-white px-1 rounded-full uppercase shadow-xs">
                    AI
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs bg-slate-900 text-white border-slate-700">
                Ask Ease Buddy AI operational questions
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setIsDark((v) => !v)}
                  className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all shadow-xs hover:scale-105 cursor-pointer"
                  aria-label="Toggle light or dark appearance"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4 text-amber-300" />
                  ) : (
                    <Moon className="h-4 w-4 text-teal-200" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-xs bg-slate-900 text-white border-slate-700">
                {isDark ? "Switch to light mode" : "Switch to dark mode"}
              </TooltipContent>
            </Tooltip>

            {/* Rentok-style User Avatar Pill (Solid circular with initial) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center ring-2 ring-white/50 shadow-md hover:scale-105 transition-all select-none cursor-pointer"
                  aria-label="Account menu"
                  title={ownerName}
                >
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-68 rounded-2xl p-2 shadow-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <DropdownMenuLabel className="font-normal p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-1 border border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#008080] to-[#005e5e] text-white font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-[#008080]/20">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                        {ownerName}
                      </p>
                      {owner?.email ? (
                        <p className="truncate text-[10.5px] text-slate-500 leading-tight mt-0.5">
                          {owner.email}
                        </p>
                      ) : null}
                      <span className="inline-block mt-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/50 text-[#008080] dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                        {entitlements.planDisplayName}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <div className="space-y-0.5 pt-1">
                  <DropdownMenuItem
                    onClick={() => setEditProfileOpen(true)}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <User className="h-4 w-4 text-[#008080]" />
                    <span>Edit Profile (Name & Email)</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4 text-[#008080]" />
                    <span>Business Settings & Rules</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> Language
                  </div>

                  <DropdownMenuItem
                    onClick={() => setLanguage("en-US")}
                    className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <span>English</span>
                    {language === "en-US" ? (
                      <Check className="h-4 w-4 text-[#008080] font-bold" />
                    ) : null}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setLanguage("hi-IN")}
                    className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <span>हिन्दी</span>
                    {language === "hi-IN" ? (
                      <Check className="h-4 w-4 text-[#008080] font-bold" />
                    ) : null}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>



      {/* Quick Command Palette Modal Dialog */}
      {searchModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-slate-900 border border-slate-700/80 text-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-900/90">
              <Search className="h-5 w-5 text-teal-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (filteredCommands.length > 0) {
                      navigate(filteredCommands[0].url);
                      setSearchModalOpen(false);
                    } else if (searchQuery.trim()) {
                      navigate(`/tenants?search=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchModalOpen(false);
                    }
                  }
                }}
                placeholder="Search commands, pages, rooms, dues... (Press Enter)"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              <kbd
                onClick={() => setSearchModalOpen(false)}
                className="hidden sm:inline-flex items-center rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                ESC
              </kbd>
            </div>

            {/* Results / Navigation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[380px] scrollbar-thin">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, idx) => (
                  <button
                    key={cmd.title}
                    type="button"
                    onClick={() => {
                      navigate(cmd.url);
                      setSearchModalOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer group",
                      idx === 0 ? "bg-teal-500/15 text-white" : "hover:bg-slate-800/80 text-slate-200 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 group-hover:text-teal-300 transition-colors shrink-0">
                        <cmd.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold truncate leading-tight group-hover:text-white">
                          {cmd.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                          {cmd.category} · {cmd.url}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-teal-300 transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
                  </button>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm font-semibold text-slate-300">
                    No direct command found for "{searchQuery}"
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Press <span className="text-teal-400 font-bold">Enter</span> to search directly in Tenants & Records.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/tenants?search=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchModalOpen(false);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Search Tenants for "{searchQuery}"</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 select-none">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-300">↵</kbd> Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-300">ESC</kbd> Close
                </span>
              </div>
              <span className="text-teal-400 font-medium">Quick Command Palette</span>
            </div>
          </div>
        </div>
      ) : null}

      <TrialExpiredGateModal
        open={trialExpiredOpen}
        onOpenChange={setTrialExpiredOpen}
        featureName="Add New Property"
      />
      <EditProfileModal open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    </>
  );
};

export default AppHeader;
