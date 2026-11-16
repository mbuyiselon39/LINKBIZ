"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Check, MessageSquare, FileText, Pencil } from "lucide-react";
import { Modal } from "./Modal";
import Link from "next/link";

export function ProfileActions({ companyId, companyName, loggedIn, isOwner, following }: { companyId: number; companyName: string; loggedIn: boolean; isOwner: boolean; following: boolean }) {
  const router = useRouter();
  const [isFollowing, setFollowing] = useState(following);
  const [quote, setQuote] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function follow() {
    if (!loggedIn) return router.push("/login");
    setFollowing((f) => !f);
    await fetch(`/api/companies/${companyId}/follow`, { method: "POST" });
    router.refresh();
  }
  async function message() {
    if (!loggedIn) return router.push("/login");
    const res = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId, kind: "general" }) });
    const data = await res.json();
    router.push(`/messages?c=${data.conversationId}`);
  }
  async function sendQuote() {
    setBusy(true);
    await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId, kind: "general", subject: "Request for Quote", content: `Request for Quote:\n\n${msg}` }) });
    setBusy(false); setSent(true);
  }

  if (isOwner) {
    return <Link href="/settings" className="btn-outline"><Pencil size={14} /> Manage page & team</Link>;
  }
  return (
    <>
      <button onClick={follow} className={isFollowing ? "btn-ghost" : "btn-primary"}>{isFollowing ? <><Check size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}</button>
      <button onClick={message} className="btn-outline"><MessageSquare size={14} /> Message</button>
      <button onClick={() => (loggedIn ? setQuote(true) : router.push("/login"))} className="btn-ghost"><FileText size={14} /> Request Quote</button>
      <Modal open={quote} onClose={() => { setQuote(false); setSent(false); setMsg(""); }} title={`Request a quote from ${companyName}`}>
        {sent ? (
          <div className="text-center py-4"><Check size={40} className="mx-auto text-emerald-600" /><p className="font-semibold mt-2">Request sent</p><p className="text-sm text-muted">Track the reply in your <Link href="/messages" className="text-action font-semibold">Messages</Link>.</p></div>
        ) : (
          <div className="space-y-3">
            <textarea rows={6} className="input" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Describe the goods or services you need, quantities, delivery location and timeline…" />
            <div className="flex justify-end gap-2"><button onClick={() => setQuote(false)} className="btn-ghost">Cancel</button><button onClick={sendQuote} disabled={!msg.trim() || busy} className="btn-primary">{busy ? "Sending…" : "Send request"}</button></div>
          </div>
        )}
      </Modal>
    </>
  );
}
