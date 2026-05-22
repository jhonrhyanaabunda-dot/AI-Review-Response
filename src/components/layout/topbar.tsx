"use client";
import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, User as UserIcon } from "lucide-react";
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
  const initials = (user.name ?? user.email ?? "?").slice(0, 2).toUpperCase();
  return (
    <header className="flex h-[68px] items-center justify-between border-b bg-background/85 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-tight">{orgName}</h1>
        <span className="hidden rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-primary sm:inline">
          Agency
        </span>
      </div>
      <div className="flex items-center gap-2">
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
            <DropdownMenuItem>
              <UserIcon className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => (window.location.href = "/api/auth/signout")}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
