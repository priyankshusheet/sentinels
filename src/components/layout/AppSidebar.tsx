import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  FileText,
  Zap,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Shield,
  Bell,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/ui/Logo";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Prompt Analytics",
    href: "/prompts",
    icon: Search,
  },
  {
    title: "Citations",
    href: "/citations",
    icon: FileText,
  },
  {
    title: "Optimization",
    href: "/optimization",
    icon: Zap,
  },
  {
    title: "Competitors",
    href: "/competitors",
    icon: Users,
  },
  {
    title: "Intelligence Graph",
    href: "/intelligence",
    icon: Sparkles,
  },
  {
    title: "A/B Testing",
    href: "/prompts/testing",
    icon: TrendingUp,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex h-screen flex-col border-r border-white/5 bg-transparent relative z-20"
    >
      <div className="flex h-[88px] items-center justify-between px-6">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center"
            >
              <Logo size="md" />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              !collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "group relative flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300",
                isActive
                  ? "text-cyan-400 tracking-wide shadow-[inset_0_1px_0_rgba(0,212,255,0.1)] bg-cyan-900/20"
                  : "text-[#8ba3c7] hover:text-cyan-400 hover:bg-cyan-900/10"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 top-[20%] bottom-[20%] w-1 rounded-r-md bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.8)]"
                />
              )}
              <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0 transition-colors", isActive ? "text-cyan-400" : "text-[#556987] group-hover:text-[#8ba3c7]")} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex flex-1 items-center justify-between overflow-hidden"
                  >
                    <span>{item.title}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs rounded-full",
                          item.badge === "Beta"
                            ? "bg-accent/20 text-accent"
                            : "bg-primary/20 text-primary"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mb-6 overflow-hidden"
          >
            <div className="rounded-[20px] bg-[#0f141f] p-5 border border-cyan-400/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">Pro Tip</span>
              </div>
              <div className="text-[13px] leading-relaxed text-[#8ba3c7]">
                Enterprise domains receive 20% more data throughput in the first 30 days.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t border-cyan-400/10 p-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-sm font-semibold text-white shadow-[0_0_10px_rgba(0,212,255,0.3)]">
            {user?.email?.[0]?.toUpperCase() || "?"}
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 overflow-hidden"
              >
                <div className="text-sm font-medium text-foreground truncate">{user?.user_metadata?.full_name || user?.email || "User"}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!collapsed && (
          <button onClick={handleSignOut} className="flex items-center gap-2 w-full px-3 py-2 mt-1 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        )}
      </div>
    </motion.aside>
  );
}
