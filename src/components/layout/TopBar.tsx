import { Bell, Search, Plus, HelpCircle, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MobileSidebar } from "./MobileSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-6 gap-3">
      {/* Mobile menu + Search */}
      <div className="flex items-center gap-3 flex-1">
        <MobileSidebar />
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search prompts, citations..."
            className="pl-9 pr-12 bg-secondary border-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden md:flex">
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium flex items-center justify-center text-destructive-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="secondary" className="text-xs">3 new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <span className="font-medium">Lost citation detected</span>
              </div>
              <span className="text-xs text-muted-foreground pl-4">
                A major review site removed your brand mention
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-warning" />
                <span className="font-medium">New competitor detected</span>
              </div>
              <span className="text-xs text-muted-foreground pl-4">
                A new entrant is now appearing in your tracked prompts
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="font-medium">Visibility increased</span>
              </div>
              <span className="text-xs text-muted-foreground pl-4">
                Your AI visibility score improved by 5.2%
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* LLM Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              All LLMs
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>All LLMs</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>ChatGPT</DropdownMenuItem>
            <DropdownMenuItem>Claude</DropdownMenuItem>
            <DropdownMenuItem>Gemini</DropdownMenuItem>
            <DropdownMenuItem>Perplexity</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button className="gap-2 bg-primary hover:bg-primary/90 hidden sm:flex">
          <Plus className="h-4 w-4" />
          Add Prompt
        </Button>
      </div>
    </header>
  );
}
