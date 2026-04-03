import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  return (
    <div className={cn("flex items-center gap-1 select-none font-sans", className)}>
      <span className={cn(
        "font-black tracking-[0.2em] text-zinc-100 uppercase",
        sizeClasses[size]
      )}>
        Sentinel
      </span>
      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 self-end mb-2.5 animate-pulse shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
      <span className={cn(
        "font-light tracking-[0.3em] text-zinc-500 uppercase",
        sizeClasses[size]
      )}>
        AI
      </span>
    </div>
  );
}
