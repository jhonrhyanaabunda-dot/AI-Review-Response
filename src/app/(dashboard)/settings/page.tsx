import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getOrg } from "@/lib/demo/store";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const org = await getOrg();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage organization, AI behavior, and integrations.</p>
      </div>
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{org.name}</CardTitle>
              <CardDescription>Agency slug: {org.slug}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              General settings (logo, working hours, default escalation list) belong here.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI behavior</CardTitle>
              <CardDescription>Default tone, sign-off, and confidence thresholds.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Configure per-dealership overrides under each dealership&apos;s page.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Connected platforms</CardTitle>
              <CardDescription>OAuth and API key status for Google, Yelp, DealerRater, Cars.com, Facebook.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Tokens are encrypted at rest with AES-256-GCM. Rotate from the ApiToken table.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>Plan: {org.plan}. Billing email: {org.billingEmail ?? "-"}.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Stripe integration goes here. See docs/architecture.md.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
