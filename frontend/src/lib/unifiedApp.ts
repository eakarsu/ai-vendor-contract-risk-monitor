import {
  Activity,
  BarChart3,
  Bell,
  Blocks,
  Bot,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardList,
  Database,
  FileText,
  Files,
  LayoutDashboard,
  PackageCheck,
  Plug,
  ShieldCheck,
  UserRound,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { label: string; href: string; icon: LucideIcon };
export type FeatureDefinition = { title: string; href: string; category: string; summary: string; bullets: string[] };
export type PageDefinition = {
  title: string;
  eyebrow: string;
  subtitle: string;
  category: string;
  summary: string;
  bullets: string[];
  metrics: Array<{ label: string; value: string; note: string }>;
};
export type FeatureContext = {
  sourceOwners: string[];
  operatingQueues: string[];
  outputs: string[];
  relatedRoutes: Array<{ label: string; href: string }>;
};

const suiteSourceOwners = ["Vendor contracts","DPA terms","Renewal calendar","Security reviews"];

const features = [
  {
    slug: "vendor-inventory",
    title: "Vendor Inventory",
    href: "/vendor-inventory",
    category: "Vendor Risk",
    icon: Bot,
    summary: "Vendors, owners, systems, contract value, risk tier, and renewal timing.",
    bullets: ["Vendor Inventory queue","AI assisted review","Audit-ready output"],
    metrics: [
      { label: "Vendor Inventory", value: "24", note: 'Active records' },
      { label: 'Exceptions', value: "2", note: 'Need review' },
      { label: 'Due Soon', value: "4", note: 'Next 14 days' },
    ],
  },
  {
    slug: "contract-ingestion",
    title: "Contract Ingestion",
    href: "/contract-ingestion",
    category: "Contracts",
    icon: Workflow,
    summary: "Uploaded agreements, extracted terms, obligations, dates, and missing documents.",
    bullets: ["Contract Ingestion queue","AI assisted review","Audit-ready output"],
    metrics: [
      { label: "Contract Ingestion", value: "33", note: 'Active records' },
      { label: 'Exceptions', value: "3", note: 'Need review' },
      { label: 'Due Soon', value: "5", note: 'Next 14 days' },
    ],
  },
  {
    slug: "renewal-risk",
    title: "Renewal Risk",
    href: "/renewal-risk",
    category: "Commercial",
    icon: Users,
    summary: "Auto-renewals, notice windows, price escalators, usage growth, and negotiation risk.",
    bullets: ["Renewal Risk queue","AI assisted review","Audit-ready output"],
    metrics: [
      { label: "Renewal Risk", value: "42", note: 'Active records' },
      { label: 'Exceptions', value: "4", note: 'Need review' },
      { label: 'Due Soon', value: "6", note: 'Next 14 days' },
    ],
  },
  {
    slug: "data-processing-terms",
    title: "Data Processing Terms",
    href: "/data-processing-terms",
    category: "Privacy",
    icon: CalendarCheck,
    summary: "DPA clauses, subprocessors, transfer terms, retention, and deletion rights.",
    bullets: ["Data Processing Terms queue","AI assisted review","Audit-ready output"],
    metrics: [
      { label: "Data Processing Terms", value: "51", note: 'Active records' },
      { label: 'Exceptions', value: "5", note: 'Need review' },
      { label: 'Due Soon', value: "7", note: 'Next 14 days' },
    ],
  },
  {
    slug: "ai-act-exposure",
    title: "AI Act Exposure",
    href: "/ai-act-exposure",
    category: "Regulatory",
    icon: ClipboardList,
    summary: "AI usage disclosures, high-risk signals, model obligations, and evidence gaps.",
    bullets: ["AI Act Exposure queue","AI assisted review","Audit-ready output"],
    metrics: [
      { label: "AI Act Exposure", value: "60", note: 'Active records' },
      { label: 'Exceptions', value: "6", note: 'Need review' },
      { label: 'Due Soon', value: "8", note: 'Next 14 days' },
    ],
  },
  {
    slug: "dora-nis2-mapping",
    title: "DORA NIS2 Mapping",
    href: "/dora-nis2-mapping",
    category: "Regulatory",
    icon: FileText,
    summary: "Resilience requirements, incident timelines, vendor controls, and accountability.",
    bullets: ["DORA NIS2 Mapping queue","AI assisted review","Audit-ready output"],
    metrics: [
      { label: "DORA NIS2 Mapping", value: "69", note: 'Active records' },
      { label: 'Exceptions', value: "2", note: 'Need review' },
      { label: 'Due Soon', value: "9", note: 'Next 14 days' },
    ],
  },
  {
    slug: "security-obligations",
    title: "Security Obligations",
    href: "/security-obligations",
    category: "Security",
    icon: BarChart3,
    summary: "Security commitments, audit rights, breach notices, and control evidence.",
    bullets: ["Security Obligations queue","AI assisted review","Audit-ready output"],
    metrics: [
      { label: "Security Obligations", value: "78", note: 'Active records' },
      { label: 'Exceptions', value: "3", note: 'Need review' },
      { label: 'Due Soon', value: "4", note: 'Next 14 days' },
    ],
  },
  {
    slug: "negotiation-playbook",
    title: "Negotiation Playbook",
    href: "/negotiation-playbook",
    category: "Commercial",
    icon: PackageCheck,
    summary: "Fallback language, leverage points, target terms, and approval route.",
    bullets: ["Negotiation Playbook queue","AI assisted review","Audit-ready output"],
    metrics: [
      { label: "Negotiation Playbook", value: "87", note: 'Active records' },
      { label: 'Exceptions', value: "4", note: 'Need review' },
      { label: 'Due Soon', value: "5", note: 'Next 14 days' },
    ],
  },
  {
    slug: "exception-approvals",
    title: "Exception Approvals",
    href: "/exception-approvals",
    category: "Governance",
    icon: ShieldCheck,
    summary: "Accepted risks, business justification, approvers, expiry, and compensating controls.",
    bullets: ["Exception Approvals queue","AI assisted review","Audit-ready output"],
    metrics: [
      { label: "Exception Approvals", value: "96", note: 'Active records' },
      { label: 'Exceptions', value: "5", note: 'Need review' },
      { label: 'Due Soon', value: "6", note: 'Next 14 days' },
    ],
  },
  {
    slug: "vendor-briefings",
    title: "Vendor Briefings",
    href: "/vendor-briefings",
    category: "Reporting",
    icon: Activity,
    summary: "Executive summaries, open risks, renewal plan, and owner action list.",
    bullets: ["Vendor Briefings queue","AI assisted review","Audit-ready output"],
    metrics: [
      { label: "Vendor Briefings", value: "105", note: 'Active records' },
      { label: 'Exceptions', value: "6", note: 'Need review' },
      { label: 'Due Soon', value: "7", note: 'Next 14 days' },
    ],
  },
  {
    slug: "documents",
    title: "Documents",
    href: "/documents",
    category: "Core Platform",
    icon: Files,
    summary: "Vendor Contract Risk Monitor documents, evidence, attachments, and exports.",
    bullets: ["Documents","Controls","Audit trail"],
    metrics: [
      { label: "Documents", value: "48", note: 'Tracked' },
      { label: 'Open', value: "7", note: 'Needs review' },
      { label: 'Updated', value: "21", note: 'This week' },
    ],
  },
  {
    slug: "notifications",
    title: "Notifications",
    href: "/notifications",
    category: "Core Platform",
    icon: Bell,
    summary: "Vendor Contract Risk Monitor alerts, reminders, exceptions, and approvals.",
    bullets: ["Notifications","Controls","Audit trail"],
    metrics: [
      { label: "Notifications", value: "65", note: 'Tracked' },
      { label: 'Open', value: "10", note: 'Needs review' },
      { label: 'Updated', value: "29", note: 'This week' },
    ],
  },
  {
    slug: "integrations",
    title: "Integrations",
    href: "/integrations",
    category: "Core Platform",
    icon: Plug,
    summary: "Vendor Contract Risk Monitor connector health, sync status, and integration warnings.",
    bullets: ["Integrations","Controls","Audit trail"],
    metrics: [
      { label: "Integrations", value: "82", note: 'Tracked' },
      { label: 'Open', value: "13", note: 'Needs review' },
      { label: 'Updated', value: "37", note: 'This week' },
    ],
  },
  {
    slug: "profiles",
    title: "Profiles",
    href: "/profiles",
    category: "Core Platform",
    icon: UserRound,
    summary: "Vendor Contract Risk Monitor users, roles, teams, permissions, and ownership settings.",
    bullets: ["Profiles","Controls","Audit trail"],
    metrics: [
      { label: "Profiles", value: "99", note: 'Tracked' },
      { label: 'Open', value: "16", note: 'Needs review' },
      { label: 'Updated', value: "45", note: 'This week' },
    ],
  },
] as const;

const aiFeatures = [
  {
    slug: 'ai-assistant',
    title: 'AI Assistant',
    href: '/features/ai-assistant',
    category: 'Intelligence Layer',
    icon: Bot,
    summary: "Vendor Contract Risk Monitor assistant for triage, drafting, analysis, recommendations, and operational review.",
    bullets: ['Triage support', 'Drafting', 'Review guidance'],
    metrics: [
      { label: 'Sessions', value: '128', note: 'Last 24 hours' },
      { label: 'Drafts', value: '204', note: 'Generated' },
      { label: 'Escalations', value: '14', note: 'Expert review' },
    ],
  },
  {
    slug: 'ai-tools',
    title: 'AI Tools',
    href: '/features/ai-tools',
    category: 'Intelligence Layer',
    icon: Activity,
    summary: "Vendor Contract Risk Monitor AI tools for scoring, generation, extraction, classification, exception review, and reporting.",
    bullets: ['Scoring', 'Classification', 'Exception review'],
    metrics: [
      { label: 'Runs', value: '318', note: 'Last 24 hours' },
      { label: 'Signals', value: '88', note: 'New alerts' },
      { label: 'Accepted', value: '117', note: 'Reviewer accepted' },
    ],
  },
] as const;

const allFeatures = [...features, ...aiFeatures];

export const primaryNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'All Features', href: '/features', icon: Blocks },
  { label: 'Documents', href: '/documents', icon: Files },
  { label: 'Source Tables', href: '/source-tables', icon: Database },
  { label: 'Profiles', href: '/profiles', icon: UserRound },
];

export const featureNav: NavItem[] = allFeatures.map((feature) => ({ label: feature.title, href: feature.href, icon: feature.icon }));
export const featureCatalog: FeatureDefinition[] = allFeatures.map((feature) => ({ title: feature.title, href: feature.href, category: feature.category, summary: feature.summary, bullets: [...feature.bullets] }));

export const featureFamilies = [
  {
    "name": "Vendor Risk",
    "features": [
      "Vendor Inventory"
    ]
  },
  {
    "name": "Contracts",
    "features": [
      "Contract Ingestion"
    ]
  },
  {
    "name": "Commercial",
    "features": [
      "Renewal Risk",
      "Negotiation Playbook"
    ]
  },
  {
    "name": "Privacy",
    "features": [
      "Data Processing Terms"
    ]
  },
  {
    "name": "Regulatory",
    "features": [
      "AI Act Exposure",
      "DORA NIS2 Mapping"
    ]
  },
  {
    "name": "Security",
    "features": [
      "Security Obligations"
    ]
  },
  {
    "name": "Governance",
    "features": [
      "Exception Approvals"
    ]
  },
  {
    "name": "Reporting",
    "features": [
      "Vendor Briefings"
    ]
  },
  {
    "name": "Core Platform",
    "features": [
      "Documents",
      "Notifications",
      "Integrations",
      "Profiles"
    ]
  },
  {
    "name": "Intelligence Layer",
    "features": [
      "AI Assistant",
      "AI Tools"
    ]
  }
];

function toPage(feature: (typeof allFeatures)[number]): PageDefinition {
  return {
    title: feature.title,
    eyebrow: feature.category,
    subtitle: feature.summary,
    category: feature.category,
    summary: feature.title + ' is implemented as a dedicated Vendor Contract Risk Monitor workflow with records, AI assistance, approvals, audit, and reporting.',
    bullets: [...feature.bullets],
    metrics: [...feature.metrics],
  };
}

export const pageRegistry: Record<string, PageDefinition> = Object.fromEntries(features.map((feature) => [feature.slug, toPage(feature)]));
export const aiFeatureRegistry: Record<string, PageDefinition> = Object.fromEntries(aiFeatures.map((feature) => [feature.slug, toPage(feature)]));
export const featureContexts: Record<string, FeatureContext> = Object.fromEntries(
  allFeatures.map((feature) => [
    feature.title,
    {
      sourceOwners: suiteSourceOwners,
      operatingQueues: [feature.title + ' records', feature.title + ' approvals', feature.title + ' exceptions'],
      outputs: [feature.title + ' dashboard', feature.title + ' export', feature.title + ' audit trail'],
      relatedRoutes: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'All Features', href: '/features' }, { label: 'AI Tools', href: '/features/ai-tools' }],
    },
  ]),
);
