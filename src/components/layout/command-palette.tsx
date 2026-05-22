"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Store,
  Users,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or jump to a page..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/inbox")}>
            <Inbox className="h-4 w-4" /> Inbox
          </CommandItem>
          <CommandItem onSelect={() => go("/reviews")}>
            <MessageSquare className="h-4 w-4" /> Reviews
          </CommandItem>
          <CommandItem onSelect={() => go("/dealerships")}>
            <Store className="h-4 w-4" /> Dealerships
          </CommandItem>
          <CommandItem onSelect={() => go("/team")}>
            <Users className="h-4 w-4" /> Team
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings className="h-4 w-4" /> Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
