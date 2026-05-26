import { redirect } from "next/navigation";

// Demo mode: no login required. Skip straight to the dashboard.
export default function LoginPage() {
  redirect("/dashboard");
}
