"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  // After sign-in we send users straight to /dashboard. If they arrived
  // here from a protected route, honour that `from` instead. Never bounce
  // back to /login itself (would create a loop).
  const sp = useSearchParams();
  const requested = sp.get("from");
  const target = requested && !requested.startsWith("/login") ? requested : "/dashboard";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setPending(false);
      toast.error("Invalid credentials");
      return;
    }
    // Hard navigation — guarantees the freshly set auth cookie is
    // included on the next server-rendered page request. `router.push`
    // would soft-nav before the cookie reaches the next RSC fetch and
    // the dashboard's `auth()` call would return null, bouncing back
    // to the landing page.
    window.location.assign(target);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
