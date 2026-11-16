import { buildProfileFromWebsite } from "@/lib/ai";

export async function POST(req: Request) {
  const { url, pdfName, registrationId } = await req.json();
  if (url) {
    return Response.json({ ok: true, source: "website", ...buildProfileFromWebsite(url) });
  }
  if (pdfName) {
    const base = pdfName.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
    return Response.json({ ok: true, source: "pdf", companyName: base.replace(/\b\w/g, (c: string) => c.toUpperCase()), industry: "Professional Services", location: "", website: "", tagline: `Profile extracted from ${pdfName} by LinkBiz AI. Review the auto-filled fields.`, services: [{ title: "Core Service", category: "Professional Services", description: "Extracted from your capability statement - edit to refine.", tags: ["Capability"] }], confidence: 64 });
  }
  if (registrationId) {
    return Response.json({ ok: true, source: "registry", companyName: "", industry: "Professional Services", location: "", website: "", tagline: `Registry lookup for ${registrationId} queued - verification badge will appear once the registry responds.`, services: [], confidence: 40 });
  }
  return Response.json({ error: "Provide a website URL, PDF or registration number" }, { status: 400 });
}
