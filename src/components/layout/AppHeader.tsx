import { Bell, Search, Moon, Sun, Menu, LogOut, ChevronDown, Globe, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import { authStorage, appPrefs } from "@/api/http";
import { useNavigate } from "react-router-dom";
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
  const owner = authStorage.getPropertyOwner?.();
  const selectedPg = properties.find((p) => p.id === selectedPgId);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    authStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="text-muted-foreground hover:text-foreground md:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <img src={pgeaseLogo} alt="PG Ease" className="h-7 w-7 rounded-md object-cover md:hidden" />

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tenants, PGs, payments..."
            className="w-[280px] pl-9 bg-muted/50 border-transparent focus:border-primary focus:bg-card"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground h-9">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">{language === "hi-IN" ? "हिन्दी" : "English"}</span>
              <ChevronDown className="h-3.5 w-3.5" />
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

        {/* PG switcher (like Instagram account switch) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground h-9 max-w-[180px]">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate text-xs font-medium">
                {selectedPg ? selectedPg.name : properties.length ? "Select PG" : "My PGs"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuLabel>Switch PG</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {properties.length === 0 ? (
              <DropdownMenuItem disabled>No properties yet</DropdownMenuItem>
            ) : (
              properties.map((pg) => (
                <DropdownMenuItem key={pg.id} onClick={() => setSelectedPgId(pg.id)}>
                  <Building2 className="mr-2 h-4 w-4" />
                  {pg.name}
                  {selectedPgId === pg.id && " ✓"}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
          {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2.5 rounded-full border border-border bg-card px-2 py-1 hover:bg-accent">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                {(owner?.name || "O").slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none truncate max-w-[100px]">{owner?.name ?? "Owner"}</p>
                <p className="text-xs text-muted-foreground">Owner</p>
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
    </header>
  );
};

export default AppHeader;
