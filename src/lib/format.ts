export const INDUSTRIES = [
  "Construction",
  "IT Services",
  "Logistics",
  "Manufacturing",
  "Energy",
  "Healthcare",
  "Financial Services",
  "Agriculture",
  "Mining",
  "Professional Services",
];

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"];

export const TENDER_CATEGORIES = [
  "Construction",
  "IT & Technology",
  "Logistics",
  "Manufacturing",
  "Energy",
  "Professional Services",
  "Facilities & Maintenance",
];

export const REGIONS = ["Africa", "Asia", "Europe", "North America", "South America", "Middle East", "Oceania", "Global"];

export const TENDER_TYPES: Record<string, string> = {
  open_tender: "Open Tender",
  rfq: "Request for Quote",
  subcontracting: "Subcontracting",
};

export const POST_TYPES: Record<string, string> = {
  update: "Business Update",
  tender: "Tender Notice",
  milestone: "Project Milestone",
  partnership: "Partnership Request",
  buy: "Looking to Buy",
  event: "B2B Event",
  benchmark: "Industry Benchmark",
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  tender_manager: "Tender Manager",
  content_editor: "Content Editor",
};

export function money(n: number, currency = "USD") {
  const sym = currency === "EUR" ? "€" : currency === "ZAR" ? "R" : "$";
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${sym}${Math.round(n / 1_000)}K`;
  return `${sym}${n}`;
}

export function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `${dd}d`;
  const w = Math.floor(dd / 7);
  if (w < 5) return `${w}w`;
  return d.toLocaleDateString();
}

export function daysLeft(deadline: Date | string) {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
