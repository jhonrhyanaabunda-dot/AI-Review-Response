import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { DemoBanner } from "@/components/layout/demo-banner";
import { fixture, DEMO_ADMIN_ID } from "@/lib/demo/data";
import { getOrg } from "@/lib/demo/store";
import { config } from "@/lib/demo/config";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = fixture.users.find((u) => u.id === DEMO_ADMIN_ID) ?? fixture.users[0]!;
  const org = await getOrg();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          user={{ name: user.name, email: user.email, image: user.image }}
          orgName={org.name}
          bookACallUrl={config.bookACallUrl}
          bookACallLabel={config.bookACallLabel}
        />
        {config.demoBanner.enabled && <DemoBanner text={config.demoBanner.text} />}
        <main className="flex-1 overflow-auto bg-background">
          <div className="mx-auto w-full max-w-7xl p-4 animate-fade-in md:p-6">{children}</div>
        </main>
        <CommandPalette />
      </div>
    </div>
  );
}
