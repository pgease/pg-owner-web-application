import { Bell, Search, Moon, Sun, Menu, LogOut, ChevronDown, Globe, Building2, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import { authStorage } from "@/api/http";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/context/AppContext";

interface AppHeaderProps {
  onMenuToggle?: () => void;
}

const AppHeader = ({ onMenuToggle }: AppHeaderProps) => {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const { language, setLanguage, selectedPgId, setSelectedPgId, properties } = useApp();
  const owner = authStorage.getPropertyOwner();
  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    authStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-card/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-[52px] items-center gap-3 px-3 md:gap-4 md:px-5">
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/dashboard" className="hidden items-center gap-2 md:flex">
            <img src={pgeaseLogo} alt="PG Ease" className="h-8 w-8 rounded-lg object-cover ring-1 ring-border/60" />
          </Link>
          <img src={pgeaseLogo} alt="" className="h-7 w-7 rounded-md object-cover md:hidden" aria-hidden />
        </div>

        <div className="relative mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            readOnly
            placeholder="Search tenants or rooms…"
            className="h-10 w-full border-border/80 bg-muted/40 pl-9 pr-4 text-sm shadow-inner focus-visible:bg-background"
            onFocus={() => navigate("/tenants")}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            size="sm"
            className="hidden h-9 gap-1.5 rounded-full bg-emerald-600 px-3 text-white shadow-sm hover:bg-emerald-700 sm:inline-flex"
            asChild
          >
            <Link to="/support">
              <LifeBuoy className="h-3.5 w-3.5" />
              Help
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-1 px-2 text-muted-foreground hover:text-foreground sm:gap-1.5">
                <Globe className="h-4 w-4 shrink-0" />
                <span className="hidden text-xs sm:inline">{language === "hi-IN" ? "हिन्दी" : "EN"}</span>
                <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>App language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLanguage("en-US")}>
                English {language === "en-US" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("hi-IN")}>
                हिन्दी {language === "hi-IN" && "✓"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 max-w-[140px] gap-1.5 border-primary/20 bg-primary/[0.04] px-2.5 font-semibold text-foreground shadow-sm hover:bg-primary/10 sm:max-w-[200px]"
              >
                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-xs">{selectedPg ? selectedPg.name : list.length ? "Select PG" : "My PGs"}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              <DropdownMenuLabel>Switch property</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {list.length === 0 ? (
                <DropdownMenuItem disabled>No properties yet</DropdownMenuItem>
              ) : (
                list.map((pg) => (
                  <DropdownMenuItem key={pg.id} onClick={() => setSelectedPgId(pg.id)}>
                    <Building2 className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">{pg.name}</span>
                    {selectedPgId === pg.id ? <span className="ml-auto text-primary">✓</span> : null}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="hidden h-9 w-9 text-muted-foreground hover:text-foreground sm:flex" onClick={toggleTheme}>
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>

          <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-0.5 flex items-center gap-2 rounded-full border border-border/80 bg-muted/30 px-1.5 py-1 hover:bg-muted/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-bold text-primary-foreground shadow-sm">
                  {(owner?.name || "O").slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden text-left md:block">
                  <p className="max-w-[100px] truncate text-xs font-semibold leading-tight">{owner?.name ?? "Owner"}</p>
                  <p className="text-[10px] text-muted-foreground">Owner</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>My account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border-t border-border/60 px-3 pb-2 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            readOnly
            placeholder="Search tenants or rooms…"
            className="h-9 bg-muted/40 pl-9 text-sm"
            onFocus={() => navigate("/tenants")}
          />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
