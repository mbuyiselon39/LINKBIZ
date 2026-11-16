import { db } from "@/db";
import { invoices } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getInvoices } from "@/lib/data";

export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getInvoices(s.company.id));
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.clientName || !b.items?.length) return Response.json({ error: "Client and at least one line item are required" }, { status: 400 });
  const items = b.items.map((i: { desc: string; qty: number; price: number }) => ({ desc: i.desc, qty: Number(i.qty) || 1, price: Number(i.price) || 0 }));
  const sub = items.reduce((a: number, i: { qty: number; price: number }) => a + i.qty * i.price, 0);
  const total = Math.round(sub * (1 + (Number(b.taxPct) || 0) / 100));
  const count = (await getInvoices(s.company.id)).length;
  const [inv] = await db.insert(invoices).values({
    companyId: s.company.id,
    number: `INV-${new Date().getFullYear()}-${String(count + 101).padStart(4, "0")}`,
    clientName: b.clientName, items, taxPct: Number(b.taxPct) || 0, total,
    dueDate: b.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    status: b.status === "sent" ? "sent" : "draft",
  }).returning();
  return Response.json({ ok: true, invoice: inv });
}
