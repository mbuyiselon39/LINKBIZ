import { SESSION_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
