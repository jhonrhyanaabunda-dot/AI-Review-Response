"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Store,
  Users,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dealerships", label: "Dealerships", icon: Store },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden border-r bg-a3-surface md:flex md:w-64 md:flex-col">
      <div className="flex h-[68px] items-center gap-2.5 border-b border-border/70 px-5">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-extrabold tracking-tight">A3 BRANDS</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            AI Review Response
          </span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                active
                  ? "bg-primary/10 text-foreground"
                  : "hover:bg-background",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/70 p-4 text-[11px] text-muted-foreground">
        <div className="font-semibold text-foreground">Quick search</div>
        <div className="mt-1 flex items-center gap-1.5">
          <kbd className="rounded-sm border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          <span>to open command palette</span>
        </div>
      </div>
    </aside>
  );
}
