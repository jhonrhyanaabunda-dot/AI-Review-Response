import { listInboxItems, listRecentPublished } from "@/lib/demo/store";
import { InboxClient } from "./inbox-client";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const [items, published] = await Promise.all([
    listInboxItems(),
    listRecentPublished(),
  ]);
  return <InboxClient items={items} published={published} />;
}
