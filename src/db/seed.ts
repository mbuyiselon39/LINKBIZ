import { db } from "@/db";
import {
  users,
  companies,
  companyMembers,
  services,
  achievements,
  tenders,
  tenderBids,
  posts,
  reactions,
  comments,
  connections,
  conversations,
  messages,
  alerts,
  reviews,
  microRfps,
  microBids,
  benchmarks,
  benchmarkSubmissions,
  pods,
  podMembers,
  podMessages,
  resources,
  referrals,
  invoices,
} from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { sql, eq } from "drizzle-orm";

const days = (n: number) => new Date(Date.now() + n * 86400000);

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded() {
  if (!seedPromise) seedPromise = seed().catch((e) => { seedPromise = null; throw e; });
  return seedPromise;
}

async function seed() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(companies);
  if (count === 0) await seedCore();
  await seedExtras();
}

async function seedCore() {

  const pw = hashPassword("password123");
  const u = await db
    .insert(users)
    .values([
      { email: "admin@apexbuild.com", passwordHash: pw, fullName: "Thandi Mokoena" },
      { email: "admin@nexacloud.io", passwordHash: pw, fullName: "Daniel Ortega" },
      { email: "admin@swiftroute.com", passwordHash: pw, fullName: "Priya Nair" },
      { email: "admin@ironforge.co", passwordHash: pw, fullName: "Marcus Weber" },
      { email: "admin@verdant.energy", passwordHash: pw, fullName: "Aisha Bello" },
    ])
    .returning();

  const c = await db
    .insert(companies)
    .values([
      {
        slug: "apex-build-group",
        name: "Apex Build Group",
        registrationId: "2008/114522/07",
        industry: "Construction",
        size: "501-1000",
        location: "Johannesburg, South Africa",
        email: "tenders@apexbuild.com",
        website: "https://apexbuild.com",
        tagline: "Civil engineering & commercial construction, delivered on time.",
        overview:
          "Apex Build Group is a Tier-1 construction contractor specialising in commercial high-rise, civil infrastructure and industrial facilities. With 16 years of track record and over 240 completed projects, we partner with public and private sector clients across Sub-Saharan Africa.",
        logoUrl: "/logos/apex.png",
        coverUrl: "/covers/construction.jpg",
        verified: true,
        founded: 2008,
        certifications: ["ISO 9001:2015", "ISO 45001", "CIDB Grade 9", "B-BBEE Level 1"],
        executives: [
          { name: "Thandi Mokoena", title: "Chief Executive Officer" },
          { name: "Johan Pretorius", title: "Director of Operations" },
        ],
        followerCount: 12480,
      },
      {
        slug: "nexacloud-systems",
        name: "NexaCloud Systems",
        registrationId: "EIN 84-2201937",
        industry: "IT Services",
        size: "201-500",
        location: "Austin, TX, USA",
        email: "partners@nexacloud.io",
        website: "https://nexacloud.io",
        tagline: "Enterprise cloud migration, cybersecurity & managed services.",
        overview:
          "NexaCloud Systems helps enterprises modernise legacy infrastructure with secure cloud architectures, 24/7 SOC operations and custom software engineering. AWS Premier Partner and Microsoft Solutions Partner.",
        logoUrl: "/logos/nexa.png",
        coverUrl: "/covers/it.jpg",
        verified: true,
        founded: 2014,
        certifications: ["ISO 27001", "SOC 2 Type II", "AWS Premier Partner", "CMMI Level 3"],
        executives: [
          { name: "Daniel Ortega", title: "Founder & CEO" },
          { name: "Mei Lin", title: "Chief Technology Officer" },
        ],
        followerCount: 8930,
      },
      {
        slug: "swiftroute-logistics",
        name: "SwiftRoute Logistics",
        registrationId: "CIN U63090MH2011PTC",
        industry: "Logistics",
        size: "1001-5000",
        location: "Mumbai, India",
        email: "bids@swiftroute.com",
        website: "https://swiftroute.com",
        tagline: "Cold-chain, freight forwarding & last-mile distribution at scale.",
        overview:
          "SwiftRoute operates a 2,100-vehicle fleet and 38 temperature-controlled warehouses across South and Southeast Asia. We provide end-to-end 3PL services for pharma, FMCG and e-commerce clients.",
        logoUrl: "/logos/swift.png",
        coverUrl: "/covers/logistics.jpg",
        verified: true,
        founded: 2011,
        certifications: ["ISO 9001:2015", "GDP Certified", "IATA CEIV Pharma", "AEO Status"],
        executives: [
          { name: "Priya Nair", title: "Managing Director" },
          { name: "Rahul Desai", title: "Head of Network Operations" },
        ],
        followerCount: 15210,
      },
      {
        slug: "ironforge-manufacturing",
        name: "IronForge Manufacturing",
        registrationId: "HRB 198233",
        industry: "Manufacturing",
        size: "501-1000",
        location: "Stuttgart, Germany",
        email: "procurement@ironforge.co",
        website: "https://ironforge.co",
        tagline: "Precision steel fabrication & CNC machining for industry.",
        overview:
          "IronForge is a precision manufacturer supplying structural steel components, CNC-machined parts and custom assemblies to automotive, energy and construction OEMs across Europe.",
        logoUrl: "/logos/iron.png",
        coverUrl: "/covers/manufacturing.jpg",
        verified: true,
        founded: 1996,
        certifications: ["ISO 9001:2015", "ISO 14001", "EN 1090 EXC3", "IATF 16949"],
        executives: [
          { name: "Marcus Weber", title: "Geschäftsführer" },
          { name: "Sofia Brandt", title: "Head of Quality" },
        ],
        followerCount: 6750,
      },
      {
        slug: "verdant-energy-solutions",
        name: "Verdant Energy Solutions",
        registrationId: "RC 1532089",
        industry: "Energy",
        size: "51-200",
        location: "Lagos, Nigeria",
        email: "hello@verdant.energy",
        website: "https://verdant.energy",
        tagline: "Commercial solar EPC & battery storage integrators.",
        overview:
          "Verdant designs, procures and constructs solar PV and battery energy storage systems for commercial and industrial clients across West Africa, with over 85 MW installed.",
        logoUrl: "/logos/verdant.png",
        coverUrl: "/covers/energy.jpg",
        verified: false,
        founded: 2017,
        certifications: ["ISO 9001:2015", "NEMSA Certified", "IEC 62446"],
        executives: [{ name: "Aisha Bello", title: "Co-founder & CEO" }],
        followerCount: 3120,
      },
    ])
    .returning();

  const [apex, nexa, swift, iron, verdant] = c;

  await db.insert(companyMembers).values(
    c.map((co, i) => ({ companyId: co.id, userId: u[i].id, role: "admin" }))
  );

  await db.insert(services).values([
    { companyId: apex.id, title: "Commercial High-Rise Construction", category: "Construction", description: "Turnkey design-and-build for office towers, hotels and mixed-use developments up to 60 storeys.", pricingTier: "From $12M per project", capacity: "6 concurrent major projects", tags: ["Design-Build", "Commercial", "High-Rise"] },
    { companyId: apex.id, title: "Civil Infrastructure", category: "Civil Engineering", description: "Roads, bridges, water reticulation and bulk earthworks for municipal and provincial clients.", pricingTier: "Tender-based", capacity: "CIDB Grade 9 CE", tags: ["Roads", "Bridges", "Water"] },
    { companyId: apex.id, title: "Industrial Facilities", category: "Construction", description: "Warehouses, plants and distribution centres with structural steel and tilt-up concrete.", pricingTier: "From $3M", capacity: "Up to 120,000 m²", tags: ["Industrial", "Warehousing"] },
    { companyId: nexa.id, title: "Cloud Migration & Modernisation", category: "Cloud", description: "Assessment, migration and re-platforming of legacy workloads to AWS and Azure with zero-downtime cutover.", pricingTier: "From $85,000", capacity: "40+ certified architects", tags: ["AWS", "Azure", "Kubernetes"] },
    { companyId: nexa.id, title: "Managed SOC & Cybersecurity", category: "Security", description: "24/7 threat detection, incident response and compliance reporting (SOC 2, ISO 27001, HIPAA).", pricingTier: "From $9,500 / month", capacity: "Tier-3 SOC, 3 regions", tags: ["SOC", "SIEM", "Compliance"] },
    { companyId: nexa.id, title: "Custom Software Engineering", category: "Software", description: "Dedicated product squads for enterprise platforms, integrations and data pipelines.", pricingTier: "From $45 / hour", capacity: "12 squads available", tags: ["React", "Node", "Data"] },
    { companyId: swift.id, title: "Cold-Chain Distribution", category: "Logistics", description: "GDP-compliant temperature-controlled storage and transport for pharma and perishables (2–8°C, -20°C).", pricingTier: "From $0.18 / kg", capacity: "38 warehouses, 420 reefer trucks", tags: ["Pharma", "Cold-Chain", "GDP"] },
    { companyId: swift.id, title: "Freight Forwarding", category: "Logistics", description: "Air, sea and multimodal freight with customs brokerage across 60 trade lanes.", pricingTier: "Quote-based", capacity: "18,000 TEU / month", tags: ["Air", "Sea", "Customs"] },
    { companyId: swift.id, title: "Last-Mile Delivery", category: "Logistics", description: "Same-day and next-day B2B/B2C delivery with live tracking and proof-of-delivery.", pricingTier: "From $1.20 / parcel", capacity: "1.4M parcels / month", tags: ["E-commerce", "Last-Mile"] },
    { companyId: iron.id, title: "Structural Steel Fabrication", category: "Manufacturing", description: "EN 1090 certified fabrication of beams, trusses and connections, with shop drawings and galvanising.", pricingTier: "From €2,100 / tonne", capacity: "2,400 tonnes / month", tags: ["Steel", "EN 1090", "Galvanising"] },
    { companyId: iron.id, title: "CNC Precision Machining", category: "Manufacturing", description: "5-axis milling and turning of aluminium, stainless and titanium parts to ±0.005 mm.", pricingTier: "Quote-based", capacity: "64 CNC centres", tags: ["CNC", "5-Axis", "Aerospace"] },
    { companyId: verdant.id, title: "Commercial Solar EPC", category: "Energy", description: "Rooftop and ground-mount PV from 100 kW to 20 MW, including grid studies and permitting.", pricingTier: "From $0.68 / Wp", capacity: "25 MW / year", tags: ["Solar", "EPC", "C&I"] },
    { companyId: verdant.id, title: "Battery Energy Storage", category: "Energy", description: "Lithium BESS integration for peak-shaving, backup and microgrid applications.", pricingTier: "From $310 / kWh", capacity: "40 MWh / year", tags: ["BESS", "Microgrid"] },
  ]);

  await db.insert(achievements).values([
    { companyId: apex.id, type: "project", title: "Sandton Gateway Tower", description: "42-storey Grade-A office tower completed 3 weeks ahead of schedule with 1.2M LTI-free hours.", client: "Gateway Properties", year: 2024, imageUrl: "/covers/construction.jpg", verified: true },
    { companyId: apex.id, type: "award", title: "SAFCEC Contractor of the Year", description: "Recognised for excellence in civil engineering delivery and safety performance.", year: 2023, verified: true },
    { companyId: apex.id, type: "testimonial", title: "\"Exceptional delivery discipline\"", description: "Apex delivered our 80,000 m² distribution hub under budget and with zero defects at handover.", client: "Pan-African Retail Holdings", year: 2023 },
    { companyId: apex.id, type: "case_study", title: "N4 Highway Rehabilitation", description: "38 km dual carriageway rehabilitation with full traffic accommodation - $64M, delivered 2022.", client: "SANRAL", year: 2022, verified: true },
    { companyId: nexa.id, type: "case_study", title: "Regional Bank Core Migration", description: "Migrated 1,400 workloads to AWS in 9 months, cutting infra cost 38% and achieving SOC 2 Type II.", client: "Meridian Bank", year: 2024, verified: true },
    { companyId: nexa.id, type: "award", title: "AWS Migration Partner of the Year - Americas", description: "Awarded for migration excellence across regulated industries.", year: 2024, verified: true },
    { companyId: nexa.id, type: "testimonial", title: "\"A true security partner\"", description: "NexaCloud's SOC detected and contained a ransomware attempt within 11 minutes.", client: "HealthFirst Group", year: 2023 },
    { companyId: swift.id, type: "project", title: "National Vaccine Distribution", description: "Delivered 92M vaccine doses to 6,800 facilities at 99.97% temperature compliance.", client: "Ministry of Health", year: 2022, verified: true },
    { companyId: swift.id, type: "award", title: "Asia Cold-Chain Operator of the Year", description: "Awarded by the Global Cold Chain Alliance.", year: 2023, verified: true },
    { companyId: swift.id, type: "testimonial", title: "\"Reliable at national scale\"", description: "SwiftRoute cut our stock-outs by 61% with their forecast-led replenishment.", client: "Unilever South Asia", year: 2024 },
    { companyId: iron.id, type: "project", title: "Offshore Wind Jacket Components", description: "Fabricated 1,800 tonnes of EXC3 structural nodes for a 480 MW offshore wind farm.", client: "NordSee Wind GmbH", year: 2023, verified: true },
    { companyId: iron.id, type: "award", title: "Supplier Excellence Award", description: "Zero-defect PPM over 24 months for Tier-1 automotive deliveries.", client: "Daimler Truck", year: 2024, verified: true },
    { companyId: verdant.id, type: "project", title: "12 MW Industrial Park Solar", description: "Hybrid solar + 8 MWh BESS reducing diesel consumption 74% at Agbara Industrial Park.", client: "Agbara Estates", year: 2024, verified: true },
    { companyId: verdant.id, type: "testimonial", title: "\"Our energy bills fell by half\"", description: "Verdant's team handled permitting, grid studies and delivery flawlessly.", client: "Lagos Free Zone", year: 2023 },
  ]);

  const t = await db
    .insert(tenders)
    .values([
      {
        companyId: apex.id,
        title: "Supply & Install of HVAC Systems - Sandton Mixed-Use Development",
        category: "Construction",
        type: "subcontracting",
        region: "Africa",
        budgetMin: 1800000,
        budgetMax: 2400000,
        summary: "Subcontract for design, supply, installation and commissioning of HVAC across 3 towers (118,000 m²).",
        scope: "The subcontractor shall design, supply, install, test and commission complete HVAC systems including chillers, AHUs, VRF systems, ductwork and BMS integration across three towers totalling 118,000 m². Works include coordination with structural and electrical packages, 12-month defects liability and O&M manuals.",
        eligibility: ["CIDB Grade 7 ME or higher", "Minimum 3 comparable projects >$1M in the last 5 years", "ISO 9001 certified", "B-BBEE Level 4 or better"],
        documents: [{ name: "Tender Specification.pdf", size: "4.2 MB", url: "#" }, { name: "Bill of Quantities.pdf", size: "1.8 MB", url: "#" }, { name: "Mechanical Drawings.pdf", size: "22 MB", url: "#" }],
        deadline: days(18),
      },
      {
        companyId: nexa.id,
        title: "RFQ: Enterprise Endpoint Hardware - 2,500 Laptops & Peripherals",
        category: "IT & Technology",
        type: "rfq",
        region: "North America",
        budgetMin: 2200000,
        budgetMax: 3000000,
        summary: "Request for quotation for 2,500 business laptops, docking stations and monitors with 3-year on-site warranty.",
        scope: "Supply of 2,500 business-class laptops (min. 32 GB RAM, 1 TB NVMe), 2,500 USB-C docking stations and 3,000 27\" monitors. Delivery in 4 phases to Austin, Denver and Toronto. Includes asset tagging, imaging to NexaCloud golden image and 3-year NBD on-site warranty.",
        eligibility: ["Authorised reseller of Dell, Lenovo or HP", "Ability to deliver to US & Canada", "Net-60 payment terms accepted"],
        documents: [{ name: "RFQ Document.pdf", size: "860 KB", url: "#" }, { name: "Technical Specifications.pdf", size: "1.1 MB", url: "#" }],
        deadline: days(9),
      },
      {
        companyId: swift.id,
        title: "Open Tender: Construction of 12,000 m² Cold Storage Facility - Pune",
        category: "Construction",
        type: "open_tender",
        region: "Asia",
        budgetMin: 6500000,
        budgetMax: 8500000,
        summary: "Design-and-build of a multi-temperature cold storage warehouse with 14,000 pallet positions and solar roof.",
        scope: "EPC contract for a 12,000 m² cold storage facility including civil works, insulated panel envelope, ammonia/CO2 refrigeration plant, racking for 14,000 pallet positions, 18 dock doors, 1.2 MW rooftop solar and WMS-ready IT infrastructure. Target completion 14 months from award.",
        eligibility: ["Completed at least 2 cold storage facilities >8,000 m²", "Annual turnover > $20M", "ISO 9001 & ISO 45001 certified", "Registered in India or with local JV partner"],
        documents: [{ name: "Tender Notice.pdf", size: "2.4 MB", url: "#" }, { name: "Employer's Requirements.pdf", size: "9.6 MB", url: "#" }, { name: "Site Survey Report.pdf", size: "5.3 MB", url: "#" }],
        deadline: days(32),
      },
      {
        companyId: iron.id,
        title: "RFQ: Industrial Powder Coating Services - Annual Framework",
        category: "Manufacturing",
        type: "rfq",
        region: "Europe",
        budgetMin: 400000,
        budgetMax: 650000,
        summary: "Annual framework agreement for powder coating of fabricated steel components, ~1,100 tonnes/year.",
        scope: "Provision of pre-treatment and powder coating services (Qualicoat Class 2) for structural and architectural steel components. Weekly collections from Stuttgart facility, 5-day turnaround, RAL colour range, with full traceability and coating thickness reports.",
        eligibility: ["Qualicoat or GSB certified", "Located within 250 km of Stuttgart", "Capacity ≥ 100 tonnes/month"],
        documents: [{ name: "Framework RFQ.pdf", size: "720 KB", url: "#" }],
        deadline: days(14),
      },
      {
        companyId: verdant.id,
        title: "Supply of 45,000 Bifacial Solar Modules (≥ 580 Wp)",
        category: "Energy",
        type: "open_tender",
        region: "Africa",
        budgetMin: 5000000,
        budgetMax: 6200000,
        summary: "Procurement of Tier-1 bifacial PV modules for a 26 MW C&I portfolio, delivered DAP Lagos.",
        scope: "Supply of 45,000 Tier-1 bifacial N-type TOPCon modules (≥ 580 Wp), IEC 61215/61730 certified, with 30-year linear performance warranty. Delivery DAP Apapa Port, Lagos in 3 shipments. Includes flash test data and third-party inspection at factory.",
        eligibility: ["Bloomberg Tier-1 manufacturer or authorised distributor", "Bankability report available", "Minimum 500 MW shipped in last 12 months"],
        documents: [{ name: "Tender Document.pdf", size: "3.1 MB", url: "#" }, { name: "Module Technical Requirements.pdf", size: "640 KB", url: "#" }],
        deadline: days(25),
      },
      {
        companyId: nexa.id,
        title: "Subcontracting: Penetration Testing Partners - Financial Services Clients",
        category: "IT & Technology",
        type: "subcontracting",
        region: "Global",
        budgetMin: 250000,
        budgetMax: 500000,
        summary: "Seeking CREST/OSCP certified firms to deliver external & application penetration tests under NexaCloud's SOC programme.",
        scope: "Delivery of up to 60 penetration testing engagements per year (external, internal, web application and API) for regulated financial services clients. Reports must follow NexaCloud templates, include CVSS scoring and retest. Partners must sign NDA and comply with SOC 2 controls.",
        eligibility: ["CREST accredited or team with OSCP/OSCE", "Cyber liability insurance ≥ $5M", "No conflicts with US banking clients"],
        documents: [{ name: "Partner Programme Brief.pdf", size: "1.4 MB", url: "#" }, { name: "Mutual NDA.pdf", size: "210 KB", url: "#" }],
        deadline: days(41),
      },
    ])
    .returning();

  await db.insert(tenderBids).values([
    { tenderId: t[0].id, companyId: iron.id, type: "eoi", coverLetter: "IronForge would like to express interest in supplying ductwork and structural supports for the HVAC package.", attachments: ["IronForge_Capability_Statement.pdf"] },
    { tenderId: t[2].id, companyId: apex.id, type: "bid", amount: 7400000, coverLetter: "Apex Build Group submits a compliant bid leveraging our experience on 4 cold storage facilities.", attachments: ["Apex_Technical_Proposal.pdf", "Apex_Commercial_Offer.pdf"] },
  ]);

  const p = await db
    .insert(posts)
    .values([
      { companyId: apex.id, type: "milestone", content: "🏗️ Topping out today at Sandton Gateway Tower - 42 floors, 1.2 million LTI-free hours, and 3 weeks ahead of programme. Enormous thanks to our subcontractor partners and the Gateway Properties team for the trust.", imageUrl: "/covers/construction.jpg", createdAt: days(-1) },
      { companyId: apex.id, type: "tender", content: "📋 Tender Notice: We are inviting qualified mechanical subcontractors to bid on the HVAC package for our Sandton Mixed-Use Development. Three towers, 118,000 m². Briefing session next Tuesday.", tenderId: t[0].id, createdAt: days(-2) },
      { companyId: nexa.id, type: "update", content: "We're proud to be named AWS Migration Partner of the Year - Americas 🏆. In 2025 our teams migrated over 9,000 workloads for banks, hospitals and manufacturers with zero unplanned downtime. Onward.", imageUrl: "/covers/it.jpg", createdAt: days(-2) },
      { companyId: swift.id, type: "tender", content: "📋 Open Tender: SwiftRoute is expanding our network with a 12,000 m² multi-temperature cold storage facility in Pune. Design-and-build contractors with cold-chain experience are invited to bid.", tenderId: t[2].id, createdAt: days(-3) },
      { companyId: verdant.id, type: "partnership", content: "🤝 Partnership Request: Verdant is seeking EPC partners in Ghana and Côte d'Ivoire for a 40 MW C&I solar pipeline in 2026. Ideal partners have local licensing, civil capacity and HV electrical teams. DM us or request a call.", createdAt: days(-3) },
      { companyId: iron.id, type: "milestone", content: "Final shipment of 1,800 tonnes of offshore wind jacket nodes left Stuttgart this morning for NordSee Wind. 14 months, zero NCRs, every weld UT-tested. Proud of the team. ⚙️", imageUrl: "/covers/manufacturing.jpg", createdAt: days(-4) },
      { companyId: swift.id, type: "update", content: "New IATA CEIV Pharma certification secured for our Hyderabad hub ✈️ - now 6 certified air cargo facilities in the network. Pharma shippers: let's talk about your 2026 lanes.", createdAt: days(-5) },
      { companyId: nexa.id, type: "partnership", content: "🤝 Looking for CREST-accredited penetration testing partners to join our SOC programme. Up to 60 engagements a year for financial services clients. Details in the tender below.", tenderId: t[5].id, createdAt: days(-5) },
      { companyId: verdant.id, type: "milestone", content: "⚡ 12 MW solar + 8 MWh storage now live at Agbara Industrial Park - diesel use down 74% in month one. This is what the energy transition looks like for African industry.", imageUrl: "/covers/energy.jpg", createdAt: days(-6) },
      { companyId: iron.id, type: "tender", content: "📋 RFQ: Annual powder coating framework (~1,100 t/year). Qualicoat-certified coaters within 250 km of Stuttgart, we'd like to hear from you.", tenderId: t[3].id, createdAt: days(-7) },
    ])
    .returning();

  await db.insert(reactions).values([
    { postId: p[0].id, companyId: nexa.id, type: "celebrate" },
    { postId: p[0].id, companyId: swift.id, type: "celebrate" },
    { postId: p[0].id, companyId: iron.id, type: "endorse" },
    { postId: p[1].id, companyId: iron.id, type: "interested" },
    { postId: p[2].id, companyId: apex.id, type: "celebrate" },
    { postId: p[2].id, companyId: swift.id, type: "endorse" },
    { postId: p[3].id, companyId: apex.id, type: "interested" },
    { postId: p[3].id, companyId: verdant.id, type: "interested" },
    { postId: p[4].id, companyId: apex.id, type: "support" },
    { postId: p[5].id, companyId: apex.id, type: "endorse" },
    { postId: p[5].id, companyId: verdant.id, type: "celebrate" },
    { postId: p[8].id, companyId: swift.id, type: "celebrate" },
    { postId: p[8].id, companyId: nexa.id, type: "support" },
  ]);

  await db.insert(comments).values([
    { postId: p[0].id, companyId: nexa.id, content: "Congratulations to the whole Apex team - remarkable safety record." },
    { postId: p[0].id, companyId: iron.id, content: "Great to see the steel we supplied standing tall. Well done!" },
    { postId: p[3].id, companyId: apex.id, content: "Very interested - we've completed four cold storage facilities. Bid incoming." },
    { postId: p[4].id, companyId: apex.id, content: "Our civil teams are active in Ghana. Let's connect." },
    { postId: p[8].id, companyId: swift.id, content: "Impressive numbers. Could be a model for our Indian warehouses." },
  ]);

  await db.insert(connections).values([
    { requesterId: apex.id, receiverId: iron.id, kind: "vendor", status: "accepted" },
    { requesterId: apex.id, receiverId: nexa.id, kind: "partner", status: "accepted" },
    { requesterId: swift.id, receiverId: apex.id, kind: "partner", status: "accepted" },
    { requesterId: verdant.id, receiverId: apex.id, kind: "partner", status: "pending" },
    { requesterId: nexa.id, receiverId: apex.id, kind: "follow", status: "accepted" },
    { requesterId: swift.id, receiverId: apex.id, kind: "follow", status: "accepted" },
    { requesterId: verdant.id, receiverId: apex.id, kind: "follow", status: "accepted" },
    { requesterId: iron.id, receiverId: apex.id, kind: "follow", status: "accepted" },
    { requesterId: apex.id, receiverId: nexa.id, kind: "follow", status: "accepted" },
    { requesterId: apex.id, receiverId: swift.id, kind: "follow", status: "accepted" },
    { requesterId: iron.id, receiverId: nexa.id, kind: "follow", status: "accepted" },
    { requesterId: swift.id, receiverId: verdant.id, kind: "vendor", status: "accepted" },
    { requesterId: nexa.id, receiverId: swift.id, kind: "partner", status: "pending" },
  ]);

  const conv = await db
    .insert(conversations)
    .values([
      { companyAId: apex.id, companyBId: iron.id, kind: "tender", tenderId: t[0].id, subject: "HVAC package - ductwork supply" },
      { companyAId: apex.id, companyBId: nexa.id, kind: "general", subject: "Cloud migration for Apex project systems" },
      { companyAId: swift.id, companyBId: apex.id, kind: "tender", tenderId: t[2].id, subject: "Pune cold storage - clarifications" },
      { companyAId: apex.id, companyBId: verdant.id, kind: "general", subject: "Rooftop solar for Sandton Gateway" },
    ])
    .returning();

  await db.insert(messages).values([
    { conversationId: conv[0].id, senderCompanyId: iron.id, content: "Hi Apex team, we'd like to express interest in the HVAC ductwork and structural supports. Can you share the mechanical drawings package?", createdAt: days(-2) },
    { conversationId: conv[0].id, senderCompanyId: apex.id, content: "Thanks Marcus. Drawings are attached to the tender. Please also send your EN 1090 certificate and capability statement.", createdAt: days(-2) },
    { conversationId: conv[0].id, senderCompanyId: iron.id, content: "Attached as requested. Our capacity is 2,400 t/month so the schedule is comfortably achievable.", attachment: { name: "IronForge_Capability_Statement.pdf", size: "3.4 MB" }, createdAt: days(-1) },
    { conversationId: conv[1].id, senderCompanyId: nexa.id, content: "Following up on our call - here's the preliminary quote for migrating your project management systems to AWS.", attachment: { name: "NexaCloud_Quote_APX-2291.pdf", size: "1.1 MB" }, createdAt: days(-4) },
    { conversationId: conv[1].id, senderCompanyId: apex.id, content: "Received, thank you. Our IT director will review and revert by Friday.", createdAt: days(-3) },
    { conversationId: conv[2].id, senderCompanyId: apex.id, content: "Hello SwiftRoute, regarding the Pune tender: is the 1.2 MW rooftop solar within the EPC scope or a separate package?", createdAt: days(-1) },
    { conversationId: conv[2].id, senderCompanyId: swift.id, content: "Within the EPC scope - bidders may nominate a solar subcontractor. We'll issue a formal clarification to all bidders tomorrow.", createdAt: days(-1) },
    { conversationId: conv[3].id, senderCompanyId: apex.id, content: "We're exploring a 600 kW rooftop array on Gateway Tower. Can you prepare a budget estimate?", createdAt: days(-6) },
    { conversationId: conv[3].id, senderCompanyId: verdant.id, content: "Absolutely. Please sign the attached NDA and we'll share our feasibility template.", attachment: { name: "Verdant_Mutual_NDA.pdf", size: "240 KB" }, createdAt: days(-5) },
  ]);
}

/* ───────────── Extras: trust, deal flow, intelligence, community, tools ───────────── */
async function seedExtras() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(alerts);
  if (count > 0) return;

  const all = await db.select().from(companies);
  const bySlug = (s: string) => all.find((c) => c.slug === s)!;
  const apex = bySlug("apex-build-group"), nexa = bySlug("nexacloud-systems"), swift = bySlug("swiftroute-logistics"), iron = bySlug("ironforge-manufacturing"), verdant = bySlug("verdant-energy-solutions");

  const trust: [number, Partial<typeof companies.$inferInsert>][] = [
    [apex.id, { taxCompliant: true, insuranceVerified: true, creditTier: "AA", capacityStatus: "limited", capacityNote: "2 of 6 major project slots open", leadTime: "Mobilisation in 6-8 weeks", benchmarkOptIn: true, referralPct: 2, syncChannels: ["LinkedIn", "Google Business"] }],
    [nexa.id, { taxCompliant: true, insuranceVerified: true, creditTier: "A", capacityStatus: "available", capacityNote: "12 squads available this quarter", leadTime: "Kickoff within 2 weeks", benchmarkOptIn: true, referralPct: 5, syncChannels: ["LinkedIn", "Facebook"] }],
    [swift.id, { taxCompliant: true, insuranceVerified: true, creditTier: "AA", capacityStatus: "limited", capacityNote: "Reefer fleet 82% utilised", leadTime: "New lanes onboard in 10 days", benchmarkOptIn: true, referralPct: 3, syncChannels: ["LinkedIn"] }],
    [iron.id, { taxCompliant: true, insuranceVerified: true, creditTier: "A", capacityStatus: "available", capacityNote: "640 t/month fabrication capacity free", leadTime: "First article in 3 weeks", benchmarkOptIn: true, referralPct: 4, syncChannels: [] }],
    [verdant.id, { taxCompliant: false, insuranceVerified: true, creditTier: "BB", capacityStatus: "full", capacityNote: "Fully booked until next quarter", leadTime: "Pipeline waitlist ~90 days", benchmarkOptIn: false, referralPct: 6, syncChannels: ["Facebook"] }],
  ];
  for (const [id, patch] of trust) await db.update(companies).set(patch).where(eq(companies.id, id));

  await db.insert(reviews).values([
    { companyId: apex.id, reviewerCompanyId: swift.id, rating: 5, content: "Delivered our Pune cold storage civil package 2 weeks early. Zero defects at handover and transparent weekly cost reporting.", contractRef: "LB-CTR-2025-0142", invoiceAmount: 7400000 },
    { companyId: apex.id, reviewerCompanyId: verdant.id, rating: 4, content: "Strong site discipline on the Agbara solar civil works. Communication could be faster on variation orders.", contractRef: "LB-CTR-2024-0977", invoiceAmount: 620000 },
    { companyId: iron.id, reviewerCompanyId: apex.id, rating: 5, content: "1,800 tonnes of EXC3 nodes, every weld UT-tested, zero NCRs across 14 months. Our go-to fabricator.", contractRef: "LB-CTR-2024-0311", invoiceAmount: 3900000 },
    { companyId: nexa.id, reviewerCompanyId: apex.id, rating: 5, content: "Migrated our project systems to AWS with zero downtime. SOC reports are audit-ready and the team is responsive.", contractRef: "LB-CTR-2025-0208", invoiceAmount: 185000 },
    { companyId: swift.id, reviewerCompanyId: verdant.id, rating: 4, content: "Module shipments DAP Lagos arrived on schedule with full flash-test data. Customs paperwork was flawless.", contractRef: "LB-CTR-2025-0064", invoiceAmount: 240000 },
  ]);

  const micro = await db.insert(microRfps).values([
    { companyId: apex.id, title: "Structural engineer in Johannesburg for a 2-week audit", category: "Construction", location: "Johannesburg, ZA", budget: 8000, durationDays: 14, description: "Independent structural audit of a 6-storey parking structure. ECSA-registered engineer, deliver stamped findings report and remediation schedule.", expiresAt: days(4) },
    { companyId: nexa.id, title: "Penetration test sprint - payment API (5 working days)", category: "IT & Technology", location: "Remote", budget: 12000, durationDays: 5, description: "External + API penetration test of a payments service. CREST or OSCP team, CVSS-scored report with retest included.", expiresAt: days(3) },
    { companyId: swift.id, title: "Reefer container lane Mumbai-Delhi, 6 trips this month", category: "Logistics", location: "Mumbai, IN", budget: 3500, durationDays: 30, description: "2-8C pharma-grade reefer, GDP compliant, live temperature telemetry and POD per trip. 6 round trips.", expiresAt: days(2) },
    { companyId: iron.id, title: "CNC prototype batch - 40 aluminium housings", category: "Manufacturing", location: "Stuttgart, DE", budget: 6000, durationDays: 10, description: "5-axis machined 6082-T6 housings to drawing, anodised, CMM report per lot. NDA required before drawings are shared.", expiresAt: days(6) },
  ]).returning();

  await db.insert(microBids).values([
    { microRfpId: micro[0].id, companyId: iron.id, amount: 7200, timelineDays: 12, message: "Our resident SA engineer (ECSA Pr.Eng) can start Monday. Two similar audits completed in 2025." },
    { microRfpId: micro[1].id, companyId: verdant.id, amount: 11000, timelineDays: 5, message: "Partnering with a CREST-accredited lab; OSCP leads, retest included." },
    { microRfpId: micro[3].id, companyId: apex.id, amount: 5800, timelineDays: 9, message: "We can broker vetted CNC capacity through our approved vendor IronForge and manage QA." },
  ]);

  await db.insert(alerts).values([
    { industry: "Construction", category: "Regulation", severity: "critical", title: "SA CIDB grading renewal window opens", detail: "Grade 7+ contractors must renew before 31 March or lose eligibility for public tenders. Upload updated financials and track record.", region: "Africa", createdAt: days(-0.2) },
    { industry: "Construction", category: "Commodity", severity: "watch", title: "Rebar prices up 6.4% month-on-month", detail: "Billet shortages push long-product steel higher. Lock Q2 supply contracts now; spot premiums expected to persist 8 weeks.", region: "Global", createdAt: days(-0.6) },
    { industry: "Construction", category: "Grant", severity: "info", title: "Green building retrofit grant - $40M pool", detail: "Commercial retrofits with >30% energy savings qualify for 20% capex grants. Applications close in 45 days.", region: "Africa", createdAt: days(-1) },
    { industry: "IT Services", category: "Regulation", severity: "critical", title: "EU NIS2 vendor audit requirements take effect", detail: "Managed service providers serving EU essential entities must evidence ISO 27001 or equivalent. Expect procurement questionnaires to change.", region: "Europe", createdAt: days(-0.3) },
    { industry: "IT Services", category: "Commodity", severity: "watch", title: "Enterprise SSD contract prices rising 9%", detail: "NAND supply tightening; hardware RFQs should lock pricing within 30 days.", region: "Global", createdAt: days(-1.4) },
    { industry: "Logistics", category: "Logistics", severity: "critical", title: "Nhava Sheva port congestion - 4 day dwell", detail: "Berth backlog adds 3-5 days to FCL imports. Reroute time-critical pharma via Mundra; reefer plug availability limited.", region: "Asia", createdAt: days(-0.1) },
    { industry: "Logistics", category: "Tariffs", severity: "watch", title: "India-EU FTA tariff schedule published", detail: "Duty on 92% of tariff lines to phase out over 7 years. Machinery and pharma benefit first - review lane pricing.", region: "Asia", createdAt: days(-2) },
    { industry: "Manufacturing", category: "Tariffs", severity: "critical", title: "CBAM certificates required for steel imports", detail: "EU importers must report embedded emissions quarterly. Fabricators without verified EPDs risk losing EU clients.", region: "Europe", createdAt: days(-0.5) },
    { industry: "Manufacturing", category: "Commodity", severity: "info", title: "Aluminium LME settles at $2,410/t", detail: "Down 2.1% week-on-week on softer auto demand. Good window for prototype and housing quotes.", region: "Global", createdAt: days(-1.8) },
    { industry: "Energy", category: "Grant", severity: "info", title: "Nigeria C&I solar facility - $120M line open", detail: "Concessional debt for C&I solar + BESS above 500 kW. EPCs with IEC 62446 track records eligible.", region: "Africa", createdAt: days(-0.8) },
    { industry: "Energy", category: "Commodity", severity: "watch", title: "TOPCon module spot price hits $0.092/W", detail: "Record low; buyers should renegotiate framework agreements signed before Q4.", region: "Global", createdAt: days(-2.5) },
  ]);

  await db.insert(benchmarks).values([
    { industry: "Construction", size: "501-1000", region: "Africa", metric: "Gross margin", p25: 9, median: 13, p75: 18, unit: "%", sampleSize: 42 },
    { industry: "Construction", size: "501-1000", region: "Africa", metric: "Avg payment terms", p25: 45, median: 60, p75: 90, unit: "days", sampleSize: 42 },
    { industry: "Construction", size: "501-1000", region: "Africa", metric: "Bid win rate", p25: 8, median: 14, p75: 22, unit: "%", sampleSize: 38 },
    { industry: "IT Services", size: "201-500", region: "North America", metric: "Gross margin", p25: 34, median: 46, p75: 58, unit: "%", sampleSize: 61 },
    { industry: "IT Services", size: "201-500", region: "North America", metric: "Customer acquisition cost", p25: 4200, median: 7800, p75: 12500, unit: "$", sampleSize: 55 },
    { industry: "IT Services", size: "201-500", region: "North America", metric: "Software spend per employee", p25: 140, median: 230, p75: 390, unit: "$/mo", sampleSize: 55 },
    { industry: "Logistics", size: "1001-5000", region: "Asia", metric: "Gross margin", p25: 11, median: 16, p75: 23, unit: "%", sampleSize: 33 },
    { industry: "Logistics", size: "1001-5000", region: "Asia", metric: "Fleet utilisation", p25: 71, median: 80, p75: 88, unit: "%", sampleSize: 33 },
    { industry: "Manufacturing", size: "501-1000", region: "Europe", metric: "Gross margin", p25: 18, median: 26, p75: 34, unit: "%", sampleSize: 47 },
    { industry: "Manufacturing", size: "501-1000", region: "Europe", metric: "Scrap rate", p25: 1, median: 2, p75: 4, unit: "%", sampleSize: 47 },
    { industry: "Energy", size: "51-200", region: "Africa", metric: "Gross margin", p25: 15, median: 22, p75: 31, unit: "%", sampleSize: 21 },
  ]);

  await db.insert(benchmarkSubmissions).values([
    { companyId: apex.id, metric: "Gross margin", value: 11 },
    { companyId: apex.id, metric: "Avg payment terms", value: 75 },
    { companyId: nexa.id, metric: "Gross margin", value: 52 },
    { companyId: nexa.id, metric: "Customer acquisition cost", value: 6900 },
    { companyId: iron.id, metric: "Gross margin", value: 24 },
    { companyId: swift.id, metric: "Fleet utilisation", value: 82 },
  ]);

  const podRows = await db.insert(pods).values([
    { name: "Logistics Leaders Circle", industry: "Logistics", description: "10 non-competing logistics ops heads. Daily lane troubleshooting, carrier vetting and rate benchmarks.", memberLimit: 10 },
    { name: "Construction PMs Guild", industry: "Construction", description: "Site delivery leaders sharing subcontractor scorecards, safety playbooks and claim templates.", memberLimit: 10 },
    { name: "Cloud & Security Operators", industry: "IT Services", description: "MSP and SOC operators swapping incident retros, tooling benchmarks and vendor due-diligence checklists.", memberLimit: 10 },
  ]).returning();

  await db.insert(podMembers).values([
    { podId: podRows[0].id, companyId: swift.id },
    { podId: podRows[0].id, companyId: verdant.id },
    { podId: podRows[1].id, companyId: apex.id },
    { podId: podRows[1].id, companyId: iron.id },
    { podId: podRows[2].id, companyId: nexa.id },
  ]);

  await db.insert(podMessages).values([
    { podId: podRows[0].id, companyId: swift.id, content: "Nhava Sheva dwell hit 4 days this week. Anyone seeing better plug availability at Mundra for reefers?", createdAt: days(-0.4) },
    { podId: podRows[0].id, companyId: verdant.id, content: "We moved two module shipments via Mundra last week - 1 day dwell, but book plugs 72h ahead.", createdAt: days(-0.3) },
    { podId: podRows[1].id, companyId: apex.id, content: "Sharing our subcontractor scorecard template (safety 40%, programme 30%, quality 30%). Feedback welcome.", createdAt: days(-1) },
    { podId: podRows[1].id, companyId: iron.id, content: "We weight NCR history heavier for steel packages - 40% quality works better for fabrication.", createdAt: days(-0.8) },
    { podId: podRows[2].id, companyId: nexa.id, content: "Reminder: NIS2 questionnaires are landing in EU procurement. Our compliance mapping sheet is in the shared folder.", createdAt: days(-0.5) },
  ]);

  await db.insert(resources).values([
    { companyId: swift.id, type: "warehouse", title: "2,400 m2 ambient warehouse space - Bhiwandi", description: "Idle racking and floor space in a secure 3PL park. CCTV, dock levellers, WMS integration available. Minimum 1 month.", location: "Mumbai, IN", rate: 4, unit: "$/m2/week" },
    { companyId: swift.id, type: "shipping", title: "Shared 40ft container - Chennai to Singapore, weekly", description: "Consolidation slots on our weekly FCL. LCL rates from 0.9 CBM, customs brokerage included.", location: "Chennai, IN", rate: 68, unit: "$/CBM" },
    { companyId: nexa.id, type: "executive", title: "Fractional CISO - 10h/week blocks", description: "Ex-bank CISO available for security programmes, board reporting and audit prep. SOC 2 / ISO 27001 specialisation.", location: "Remote (US/EU)", rate: 220, unit: "$/hour" },
    { companyId: iron.id, type: "equipment", title: "Idle 5-axis CNC capacity - 320 h/month", description: "DMG MORI DMU 65, aluminium and stainless. Operator included, CMM reports per lot. NDA on request.", location: "Stuttgart, DE", rate: 95, unit: "$/machine-hour" },
    { companyId: apex.id, type: "equipment", title: "Site office cabins + scaffolding bundle", description: "12 furnished 6m cabins and 4,000 m2 Layher scaffolding idle between phases. Transport arranged.", location: "Johannesburg, ZA", rate: 180, unit: "$/cabin/week" },
  ]);

  await db.insert(referrals).values([
    { referrerCompanyId: apex.id, referredCompanyId: iron.id, buyerCompanyId: swift.id, note: "Recommended IronForge for the Pune cold storage steel package.", commissionPct: 2, status: "converted", createdAt: days(-12) },
    { referrerCompanyId: nexa.id, referredCompanyId: swift.id, buyerCompanyId: verdant.id, note: "Introduced SwiftRoute for Verdant's module imports DAP Lagos.", commissionPct: 3, status: "tracked", createdAt: days(-3) },
  ]);

  // Upgrade an existing thread into a live deal room
  const convs = await db.select().from(conversations);
  const hvac = convs.find((c) => c.subject?.includes("HVAC"));
  if (hvac) {
    await db.update(conversations).set({
      isDealRoom: true,
      ndaStatus: "sent",
      milestones: [
        { title: "Shop drawings approved", amount: 180000, done: true },
        { title: "Ductwork delivery - Tower A", amount: 420000, done: false },
        { title: "Installation & commissioning", amount: 900000, done: false },
      ],
      documents: [
        { name: "IronForge_Capability_Statement.pdf", size: "3.4 MB", by: iron.id, at: days(-2).toISOString() },
        { name: "HVAC_Scope_Rev_C.pdf", size: "8.1 MB", by: apex.id, at: days(-1.5).toISOString() },
        { name: "Mutual_NDA.pdf", size: "240 KB", by: apex.id, at: days(-1).toISOString() },
      ],
      escrowAmount: 180000,
      escrowStatus: "funded",
    }).where(eq(conversations.id, hvac.id));
  }

  // Cross-post sync examples
  const allPosts = await db.select().from(posts);
  const first = allPosts.find((p) => p.companyId === nexa.id && p.type === "update");
  if (first) await db.update(posts).set({ syncedTo: ["LinkedIn", "Facebook"] }).where(eq(posts.id, first.id));

  // Intent-based feed content
  await db.insert(posts).values([
    { companyId: swift.id, type: "buy", content: "LOOKING TO BUY: Warehouse automation integrator for our Bhiwandi hub. Scope: AS/RS feasibility, conveyor retrofit and WMS integration across 18,000 m2. Budget approved for Q2. Verified suppliers only - our AI agent is screening matches, but direct proposals welcome.", createdAt: days(-0.5) },
    { companyId: verdant.id, type: "buy", content: "LOOKING TO BUY: 8 MWh of LFP battery containers, IEC 62619 certified, DAP Lagos. Need bankable warranties and factory inspection. Seeking 2-3 quotes from verified distributors this week.", createdAt: days(-1.2) },
    { companyId: apex.id, type: "event", content: "B2B EVENT: Supplier briefing session for the Sandton Mixed-Use Development - 12 March, 09:00, Apex Build HQ Johannesburg. Mechanical, electrical and facade packages. Bring capability decks; pre-qualification desk on site. RSVP via message.", createdAt: days(-1.5) },
    { companyId: nexa.id, type: "event", content: "B2B EVENT: CISO roundtable - NIS2 readiness for MSPs. 20 March, virtual, 60 minutes. Limited to 12 non-competing operators. Pod members get first seats.", createdAt: days(-2.2) },
  ]);

  // Sample invoices for the tools page
  await db.insert(invoices).values([
    { companyId: apex.id, number: "INV-2026-0041", clientName: "Gateway Properties", items: [{ desc: "Progress claim 14 - Sandton Gateway", qty: 1, price: 480000 }], taxPct: 15, total: 552000, dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), status: "sent" },
    { companyId: nexa.id, number: "INV-2026-0107", clientName: "Meridian Bank", items: [{ desc: "Managed SOC - January", qty: 1, price: 9500 }, { desc: "Extra pen-test day", qty: 2, price: 1800 }], taxPct: 0, total: 13100, dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), status: "draft" },
  ]);
}
