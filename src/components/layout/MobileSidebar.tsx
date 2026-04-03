import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Search, FileText, Zap, Users, Settings,
  Menu, LogOut, TrendingUp, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";

const navigation = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Prompt Analytics", href: "/prompts", icon: Search },
  { title: "Citations", href: "/citations", icon: FileText },
  { title: "Optimization", href: "/optimization", icon: Zap },
  { title: "Competitors", href: "/competitors", icon: Users },
  { title: "Intelligence Graph", href: "/intelligence", icon: Sparkles },
  { title: "A/B Testing", href: "/prompts/testing", icon: TrendingUp },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
        <SheetContent side="left" className="p-0 bg-background border-r border-border w-72">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-6 border-b border-border">
              <Logo size="sm" />
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </NavLink>
                );
              })}
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {user?.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-medium truncate">{user?.email}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </SheetContent>
    </Sheet>
  );
}
