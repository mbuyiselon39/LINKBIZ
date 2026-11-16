import type { Company, Tender } from "@/lib/data";
import { money } from "@/lib/format";

/* LinkBiz AI engine - deterministic on-platform intelligence.
   Runs entirely on verified platform data (capabilities, deals, benchmarks). */

const INDUSTRY_TO_CATEGORY: Record<string, string[]> = {
  Construction: ["Construction", "Facilities & Maintenance"],
  "IT Services": ["IT & Technology", "Professional Services"],
  Logistics: ["Logistics"],
  Manufacturing: ["Manufacturing", "Construction"],
  Energy: ["Energy", "Construction"],
};

const STOP = new Set(["the", "and", "for", "with", "of", "in", "a", "to", "our", "we", "is", "are", "on", "at", "by", "an", "be", "this", "that", "from", "or", "as", "per"]);

function keywords(text: string): string[] {
  return Array.from(new Set(text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w))));
}

export function scoreMatch(
  company: Company,
  svcTags: string[],
  target: { category: string; region: string; text: string }
): number {
  let score = 20;
  const cats = INDUSTRY_TO_CATEGORY[company.industry] ?? [company.industry];
  if (cats.includes(target.category)) score += 35;
  const kws = keywords(target.text);
  const cap = keywords([company.tagline ?? "", company.overview ?? "", ...svcTags].join(" "));
  const overlap = kws.filter((k) => cap.includes(k)).length;
  score += Math.min(25, overlap * 5);
  const regionHint = company.location.toLowerCase();
  const regionMap: Record<string, string[]> = { Africa: ["south africa", "nigeria", "ghana", "kenya", "lagos", "johannesburg"], Asia: ["india", "mumbai", "singapore", "chennai"], Europe: ["germany", "stuttgart", "eu", "uk"], "North America": ["usa", "tx", "canada", "austin"] };
  if (target.region === "Global" || target.region === "Remote" || (regionMap[target.region] ?? []).some((r) => regionHint.includes(r))) score += 10;
  if (company.verified) score += 5;
  if (company.taxCompliant) score += 3;
  if (company.capacityStatus === "available") score += 5;
  if (company.capacityStatus === "full") score -= 15;
  return Math.max(5, Math.min(98, score));
}

export function buildPitch(company: Company, svcTitles: string[], target: { title: string; company: string; budget?: string }) {
  const svc = svcTitles.slice(0, 2).join(" and ") || company.industry + " services";
  return [
    `Hello ${target.company} team,`,
    ``,
    `LinkBiz's match agent flagged your need: "${target.title}". ${company.name} is a verified ${company.industry.toLowerCase()} business (${company.creditTier} credit tier, ${company.taxCompliant ? "tax compliant" : "verification in progress"}) specialising in ${svc}.`,
    ``,
    `Current capacity: ${company.capacityNote ?? "available"}. Typical lead time: ${company.leadTime ?? "on request"}.`,
    target.budget ? `We can work within your ${target.budget} guide and would like to submit a structured offer.` : `We would like to submit a structured offer.`,
    ``,
    `Our verified track record and transaction-reviewed references are attached automatically from our LinkBiz profile. May we open a deal room to share pricing and terms?`,
    ``,
    `- ${company.name} (via LinkBiz AI Agent)`,
  ].join("\n");
}

export function buildProposalOutline(company: Company, svc: { title: string; description: string }[], ach: { title: string; client: string | null; year: number | null }[], tender: Tender) {
  const relSvc = svc.slice(0, 3);
  const relAch = ach.filter((a) => a.client).slice(0, 3);
  return [
    `PROPOSAL OUTLINE - ${tender.title}`,
    `Prepared by ${company.name} - drafted 80% complete by LinkBiz AI. Review highlighted sections before submission.`,
    ``,
    `1. EXECUTIVE SUMMARY [DRAFTED]`,
    `${company.name} (${company.location}) proposes to deliver the full scope for ${tender.title}. ${company.overview?.split(".")[0] ?? company.tagline}. We are ${company.verified ? "a verified business" : "completing verification"} with ${company.certifications.slice(0, 3).join(", ") || "certifications in progress"}.`,
    ``,
    `2. SCOPE RESPONSE [DRAFTED - CONFIRM LINE ITEMS]`,
    ...tender.scope.split(/(?<=\.)\s+/).slice(0, 4).map((s, i) => `2.${i + 1} ${s}`),
    ``,
    `3. CAPABILITY MAPPING [DRAFTED]`,
    ...relSvc.map((s) => `- ${s.title}: ${s.description}`),
    relSvc.length === 0 ? `- [TODO: add service catalog entries]` : ``,
    ``,
    `4. TRACK RECORD & REFERENCES [AUTO-FILLED FROM VERIFIED DEALS]`,
    ...relAch.map((a) => `- ${a.title}${a.client ? ` (${a.client}${a.year ? `, ${a.year}` : ""})` : ""}`),
    ``,
    `5. ELIGIBILITY CHECKLIST [AUTO-CHECKED]`,
    ...tender.eligibility.map((e) => `- [${company.certifications.some((c) => e.toLowerCase().includes(c.toLowerCase().split(" ")[0])) ? "x" : " "}] ${e}`),
    ``,
    `6. COMMERCIALS [TODO: PRICING]`,
    `Budget guide: ${money(tender.budgetMin, tender.currency)} - ${money(tender.budgetMax, tender.currency)}. Suggested positioning: ${money(Math.round(tender.budgetMin + (tender.budgetMax - tender.budgetMin) * 0.55), tender.currency)} (55th percentile of guide, competitive vs anonymised platform median).`,
    `Payment terms: Net 30 recommended (platform median for your segment). Escrow-backed milestones available via LinkBiz Deal Rooms.`,
    ``,
    `7. PROGRAMME [TODO: CONFIRM DATES]`,
    `Mobilisation: ${company.leadTime ?? "2 weeks from award"}. Submission deadline: ${new Date(tender.deadline).toDateString()}.`,
    ``,
    `8. COMPLIANCE PACK [AUTO-ATTACHED]`,
    `Registration ${company.registrationId}, tax compliance ${company.taxCompliant ? "verified" : "pending"}, insurance ${company.insuranceVerified ? "verified" : "pending"}, credit tier ${company.creditTier}.`,
  ].filter((l) => l !== undefined).join("\n");
}

export type CopilotResult = {
  flags: { level: "warn" | "ok" | "info"; text: string }[];
  marketNote: string;
  counterOffer: string;
};

export function copilotAnalysis(texts: string[], opts: { budgetMax?: number; medianTerms: number; medianMargin: number }): CopilotResult {
  const all = texts.join("\n").toLowerCase();
  const flags: CopilotResult["flags"] = [];
  const terms = all.match(/net[\s-]?(\d{2,3})/);
  if (terms) {
    const d = Number(terms[1]);
    if (d > opts.medianTerms) flags.push({ level: "warn", text: `Net ${d} payment terms detected - ${d - opts.medianTerms} days longer than the anonymised median (Net ${opts.medianTerms}) for your segment. Cash-flow risk.` });
    else flags.push({ level: "ok", text: `Net ${d} terms are at or better than the segment median (Net ${opts.medianTerms}).` });
  } else {
    flags.push({ level: "info", text: "No explicit payment terms found in the thread. Ask for Net 30 or escrow-backed milestones before signing." });
  }
  if (/upfront|100% advance|full advance|prepay/.test(all)) flags.push({ level: "warn", text: "Full/upfront payment language detected. Counter with 20% mobilisation + escrow-released milestones." });
  if (/penalt|liquidated damages|ld clause/.test(all)) flags.push({ level: "warn", text: "Penalty / liquidated-damages language detected. Cap LDs at 5-10% of contract value and add force-majeure carve-outs." });
  if (/exclusiv/.test(all)) flags.push({ level: "warn", text: "Exclusivity clause language detected. Limit scope and duration (e.g. 6 months, this project only)." });
  if (/nda|confidential/.test(all)) flags.push({ level: "ok", text: "NDA referenced - use the Deal Room e-sign so both parties are covered before documents are exchanged." });
  const amounts = Array.from(all.matchAll(/\$\s?([\d,]{4,})/g)).map((m) => Number(m[1].replace(/,/g, "")));
  const quoted = amounts.length ? Math.max(...amounts) : null;
  let marketNote = `Anonymised peers in your segment run a ${opts.medianMargin}% median gross margin.`;
  if (quoted && opts.budgetMax) {
    const pct = Math.round((quoted / opts.budgetMax) * 100);
    marketNote += ` Latest quoted figure ($${quoted.toLocaleString()}) sits at ${pct}% of the tender budget ceiling.`;
    if (pct > 95) flags.push({ level: "warn", text: "Quote is within 5% of the budget ceiling - competitive bids on LinkBiz average 78-85% of ceiling." });
  }
  const counterOffer = quoted && opts.budgetMax
    ? `Suggested counter: $${Math.round(Math.min(quoted * 0.92, opts.budgetMax * 0.82)).toLocaleString()} with Net ${opts.medianTerms} terms, 20% mobilisation, balance released per verified milestone via escrow.`
    : `Suggested position: Net ${opts.medianTerms} terms, 20% mobilisation, milestone-based escrow releases, LDs capped at 7.5%.`;
  return { flags, marketNote, counterOffer };
}

export function buildProfileFromWebsite(url: string) {
  let host = url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  const base = host.split(".")[0] || "newco";
  const name = base.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const tld = host.split(".").pop() ?? "";
  const regionGuess: Record<string, string> = { za: "Johannesburg, South Africa", de: "Berlin, Germany", in: "Mumbai, India", ng: "Lagos, Nigeria", uk: "London, United Kingdom", au: "Sydney, Australia" };
  const industryGuess = /build|construct|civil|eng/.test(base) ? "Construction" : /cloud|soft|tech|data|cyber|io/.test(host) ? "IT Services" : /log|freight|cargo|ship/.test(base) ? "Logistics" : /steel|forge|manu|fab|works/.test(base) ? "Manufacturing" : /solar|energy|power/.test(base) ? "Energy" : "Professional Services";
  const svcMap: Record<string, { title: string; category: string; description: string; tags: string[] }[]> = {
    Construction: [
      { title: "General Contracting", category: "Construction", description: "Design-and-build delivery for commercial and industrial projects.", tags: ["Design-Build", "Commercial"] },
      { title: "Civil Works", category: "Civil Engineering", description: "Earthworks, roads and bulk services.", tags: ["Civil", "Infrastructure"] },
    ],
    "IT Services": [
      { title: "Managed IT & Cloud", category: "Cloud", description: "Migration, hosting and 24/7 managed operations.", tags: ["Cloud", "Managed"] },
      { title: "Software Development", category: "Software", description: "Custom platforms, integrations and data pipelines.", tags: ["Software", "Integration"] },
    ],
    Logistics: [
      { title: "Freight & Distribution", category: "Logistics", description: "Multimodal freight with tracking and customs support.", tags: ["Freight", "Distribution"] },
    ],
    Manufacturing: [
      { title: "Precision Fabrication", category: "Manufacturing", description: "Certified fabrication and machining to drawing.", tags: ["Fabrication", "CNC"] },
    ],
    Energy: [
      { title: "Solar EPC", category: "Energy", description: "Commercial PV and storage design, procurement and construction.", tags: ["Solar", "EPC"] },
    ],
    "Professional Services": [
      { title: "Advisory & Delivery", category: "Professional Services", description: "Specialist consulting and project delivery.", tags: ["Advisory"] },
    ],
  };
  return {
    companyName: name,
    website: url.startsWith("http") ? url : `https://${url}`,
    industry: industryGuess,
    location: regionGuess[tld] ?? "",
    tagline: `${industryGuess} company - profile drafted by LinkBiz AI from ${host}. Review and publish.`,
    services: svcMap[industryGuess],
    confidence: 72,
  };
}
