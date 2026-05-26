"use client";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, LogOut, User as UserIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar({ user, orgName }: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  orgName: string;
}) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [resetting, startReset] = useTransition();
  const initials = (user.name ?? user.email ?? "?").slice(0, 2).toUpperCase();

  const resetDemo = () => {
    startReset(async () => {
      try {
        await fetch("/api/demo/reset", { method: "POST" });
        toast.success("Demo reset to default state");
        router.refresh();
      } catch {
        toast.error("Couldn't reset the demo - try again?");
      }
    });
  };

  return (
    <header className="flex h-[68px] items-center justify-between border-b bg-background/85 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-tight">{orgName}</h1>
        <span className="hidden rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-primary sm:inline">
          Demo
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={resetDemo}
          disabled={resetting}
          className="hidden text-xs text-muted-foreground hover:text-foreground sm:inline-flex"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
          Reset demo
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                {user.image && <AvatarImage src={user.image} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user.name ?? user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <UserIcon className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={resetDemo}>
              <RotateCcw className="h-4 w-4" /> Reset demo
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
