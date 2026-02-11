import { Bell, Search, Moon, Sun, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import pgeaseLogo from "@/assets/pgease-logo.jpg";
import { authStorage } from "@/api/http";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  onMenuToggle?: () => void;
}

const AppHeader = ({ onMenuToggle }: AppHeaderProps) => {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

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
        {/* Mobile hamburger + logo */}
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
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
          {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-2 flex items-center gap-2.5 rounded-full border border-border bg-card px-2 py-1 hover:bg-accent">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                RP
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">Rajesh Patel</p>
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
