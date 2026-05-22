import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = session.activeOrgId
    ? await prisma.organization.findUnique({
        where: { id: session.activeOrgId },
        select: { name: true },
      })
    : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={session.user} orgName={org?.name ?? "—"} />
        <main className="flex-1 overflow-auto bg-background">
          <div className="mx-auto w-full max-w-7xl p-6 animate-fade-in">{children}</div>
        </main>
        <CommandPalette />
      </div>
    </div>
  );
}
