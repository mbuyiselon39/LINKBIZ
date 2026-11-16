import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getConversations } from "@/lib/data";
import { Messenger } from "@/components/Messenger";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ c?: string; to?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const sp = await searchParams;
  let activeId = sp.c ? Number(sp.c) : undefined;

  // Deep link: /messages?to=<companyId> opens (or creates) a general inquiry thread
  if (sp.to && Number(sp.to) !== session.company.id) {
    const other = Number(sp.to);
    const me = session.company.id;
    let [conv] = await db.select().from(conversations).where(and(eq(conversations.kind, "general"), or(and(eq(conversations.companyAId, me), eq(conversations.companyBId, other)), and(eq(conversations.companyAId, other), eq(conversations.companyBId, me)))));
    if (!conv) [conv] = await db.insert(conversations).values({ companyAId: me, companyBId: other, kind: "general", subject: "General inquiry" }).returning();
    activeId = conv.id;
  }

  const list = await getConversations(session.company.id);
  return <Messenger initial={JSON.parse(JSON.stringify(list))} me={session.company.id} initialActive={activeId ?? list[0]?.id} />;
}
