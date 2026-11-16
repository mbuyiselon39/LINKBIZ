import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  registrationId: text("registration_id").notNull(),
  industry: text("industry").notNull(),
  size: text("size").notNull(),
  location: text("location").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  tagline: text("tagline"),
  overview: text("overview"),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  verified: boolean("verified").default(false).notNull(),
  founded: integer("founded"),
  certifications: jsonb("certifications").$type<string[]>().default([]).notNull(),
  executives: jsonb("executives")
    .$type<{ name: string; title: string }[]>()
    .default([])
    .notNull(),
  followerCount: integer("follower_count").default(0).notNull(),
  // Trust & instant due diligence
  taxCompliant: boolean("tax_compliant").default(false).notNull(),
  insuranceVerified: boolean("insurance_verified").default(false).notNull(),
  creditTier: text("credit_tier").default("BB").notNull(),
  // Real-time capacity
  capacityStatus: text("capacity_status").default("available").notNull(), // available | limited | full
  capacityNote: text("capacity_note"),
  leadTime: text("lead_time"),
  // Intelligence & growth
  benchmarkOptIn: boolean("benchmark_opt_in").default(false).notNull(),
  referralPct: integer("referral_pct").default(0).notNull(),
  syncChannels: jsonb("sync_channels").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companyMembers = pgTable(
  "company_members",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id").notNull(),
    userId: integer("user_id").notNull(),
    role: text("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("company_members_unique").on(t.companyId, t.userId)]
);

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  pricingTier: text("pricing_tier"),
  capacity: text("capacity"),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  client: text("client"),
  year: integer("year"),
  imageUrl: text("image_url"),
  verified: boolean("verified").default(false).notNull(),
});

export const tenders = pgTable("tenders", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(),
  region: text("region").notNull(),
  budgetMin: integer("budget_min").notNull(),
  budgetMax: integer("budget_max").notNull(),
  currency: text("currency").default("USD").notNull(),
  summary: text("summary").notNull(),
  scope: text("scope").notNull(),
  eligibility: jsonb("eligibility").$type<string[]>().default([]).notNull(),
  documents: jsonb("documents")
    .$type<{ name: string; size: string; url: string }[]>()
    .default([])
    .notNull(),
  deadline: timestamp("deadline").notNull(),
  status: text("status").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tenderBids = pgTable("tender_bids", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id").notNull(),
  companyId: integer("company_id").notNull(),
  type: text("type").notNull(),
  amount: integer("amount"),
  coverLetter: text("cover_letter").notNull(),
  attachments: jsonb("attachments").$type<string[]>().default([]).notNull(),
  includeProfile: boolean("include_profile").default(true).notNull(),
  includePortfolio: boolean("include_portfolio").default(true).notNull(),
  status: text("status").default("submitted").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  type: text("type").notNull(), // update | tender | milestone | partnership | buy | event | benchmark
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  attachments: jsonb("attachments").$type<string[]>().default([]).notNull(),
  tenderId: integer("tender_id"),
  repostOfId: integer("repost_of_id"),
  syncedTo: jsonb("synced_to").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reactions = pgTable(
  "reactions",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull(),
    companyId: integer("company_id").notNull(),
    type: text("type").notNull(),
  },
  (t) => [uniqueIndex("reactions_unique").on(t.postId, t.companyId)]
);

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  companyId: integer("company_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const connections = pgTable(
  "connections",
  {
    id: serial("id").primaryKey(),
    requesterId: integer("requester_id").notNull(),
    receiverId: integer("receiver_id").notNull(),
    kind: text("kind").notNull(),
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("connections_unique").on(t.requesterId, t.receiverId, t.kind)]
);

export type Milestone = { title: string; amount: number; done: boolean };
export type RoomDoc = { name: string; size: string; by: number; at: string };

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  companyAId: integer("company_a_id").notNull(),
  companyBId: integer("company_b_id").notNull(),
  kind: text("kind").notNull(),
  tenderId: integer("tender_id"),
  subject: text("subject"),
  // Deal room
  isDealRoom: boolean("is_deal_room").default(false).notNull(),
  ndaStatus: text("nda_status").default("none").notNull(), // none | sent | signed
  milestones: jsonb("milestones").$type<Milestone[]>().default([]).notNull(),
  documents: jsonb("documents").$type<RoomDoc[]>().default([]).notNull(),
  escrowAmount: integer("escrow_amount").default(0).notNull(),
  escrowStatus: text("escrow_status").default("none").notNull(), // none | funded | released
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderCompanyId: integer("sender_company_id").notNull(),
  content: text("content").notNull(),
  attachment: jsonb("attachment").$type<{ name: string; size: string } | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ───────────── Trust: transaction-verified reviews ───────────── */
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  reviewerCompanyId: integer("reviewer_company_id").notNull(),
  rating: integer("rating").notNull(),
  content: text("content").notNull(),
  contractRef: text("contract_ref").notNull(),
  invoiceAmount: integer("invoice_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ───────────── Micro-RFP board ───────────── */
export const microRfps = pgTable("micro_rfps", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  budget: integer("budget").notNull(),
  durationDays: integer("duration_days").notNull(),
  description: text("description").notNull(),
  status: text("status").default("open").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const microBids = pgTable("micro_bids", {
  id: serial("id").primaryKey(),
  microRfpId: integer("micro_rfp_id").notNull(),
  companyId: integer("company_id").notNull(),
  amount: integer("amount").notNull(),
  timelineDays: integer("timeline_days").notNull(),
  message: text("message").notNull(),
  status: text("status").default("submitted").notNull(), // submitted | accepted | declined
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ───────────── Market intelligence ───────────── */
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  industry: text("industry").notNull(),
  category: text("category").notNull(), // Regulation | Tariffs | Logistics | Commodity | Grant
  severity: text("severity").default("info").notNull(), // info | watch | critical
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  region: text("region").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const benchmarks = pgTable("benchmarks", {
  id: serial("id").primaryKey(),
  industry: text("industry").notNull(),
  size: text("size").notNull(),
  region: text("region").notNull(),
  metric: text("metric").notNull(),
  p25: integer("p25").notNull(),
  median: integer("median").notNull(),
  p75: integer("p75").notNull(),
  unit: text("unit").notNull(),
  sampleSize: integer("sample_size").notNull(),
});

export const benchmarkSubmissions = pgTable(
  "benchmark_submissions",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id").notNull(),
    metric: text("metric").notNull(),
    value: integer("value").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("benchmark_sub_unique").on(t.companyId, t.metric)]
);

/* ───────────── Community & referrals ───────────── */
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerCompanyId: integer("referrer_company_id").notNull(),
  referredCompanyId: integer("referred_company_id").notNull(),
  buyerCompanyId: integer("buyer_company_id"),
  note: text("note").notNull(),
  commissionPct: integer("commission_pct").default(0).notNull(),
  status: text("status").default("tracked").notNull(), // tracked | converted | credited
  postId: integer("post_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pods = pgTable("pods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  description: text("description").notNull(),
  memberLimit: integer("member_limit").default(10).notNull(),
});

export const podMembers = pgTable(
  "pod_members",
  {
    id: serial("id").primaryKey(),
    podId: integer("pod_id").notNull(),
    companyId: integer("company_id").notNull(),
  },
  (t) => [uniqueIndex("pod_members_unique").on(t.podId, t.companyId)]
);

export const podMessages = pgTable("pod_messages", {
  id: serial("id").primaryKey(),
  podId: integer("pod_id").notNull(),
  companyId: integer("company_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  type: text("type").notNull(), // warehouse | shipping | executive | equipment
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  rate: integer("rate").notNull(),
  unit: text("unit").notNull(),
  available: boolean("available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ───────────── AI agent matches ───────────── */
export const agentMatches = pgTable(
  "agent_matches",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id").notNull(),
    sourceType: text("source_type").notNull(), // tender | micro | buy
    sourceId: integer("source_id").notNull(),
    score: integer("score").notNull(),
    pitch: text("pitch").notNull(),
    outline: text("outline"),
    status: text("status").default("new").notNull(), // new | pitched | dismissed
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("agent_matches_unique").on(t.companyId, t.sourceType, t.sourceId)]
);

/* ───────────── Single-player tools ───────────── */
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  number: text("number").notNull(),
  clientName: text("client_name").notNull(),
  items: jsonb("items").$type<{ desc: string; qty: number; price: number }[]>().default([]).notNull(),
  taxPct: integer("tax_pct").default(0).notNull(),
  total: integer("total").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
