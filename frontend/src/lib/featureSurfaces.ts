export type FeatureSurfaceRow = { id: string; item: string; status: string; owner: string; nextStep: string };
export type FeatureSurface = {
  workItems: FeatureSurfaceRow[];
  quickActions: string[];
  controlChecks: Array<{ id: string; label: string; done: boolean }>;
  activityLog: Array<{ id: string; message: string; at: string }>;
};

const featureSeeds = [
  [
    "vendor-inventory",
    "Vendor Inventory",
    "Vendor Inventory operating queue",
    "Vendor Risk Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "contract-ingestion",
    "Contract Ingestion",
    "Contract Ingestion operating queue",
    "Contracts Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "renewal-risk",
    "Renewal Risk",
    "Renewal Risk operating queue",
    "Commercial Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "data-processing-terms",
    "Data Processing Terms",
    "Data Processing Terms operating queue",
    "Privacy Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "ai-act-exposure",
    "AI Act Exposure",
    "AI Act Exposure operating queue",
    "Regulatory Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "dora-nis2-mapping",
    "DORA NIS2 Mapping",
    "DORA NIS2 Mapping operating queue",
    "Regulatory Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "security-obligations",
    "Security Obligations",
    "Security Obligations operating queue",
    "Security Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "negotiation-playbook",
    "Negotiation Playbook",
    "Negotiation Playbook operating queue",
    "Commercial Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "exception-approvals",
    "Exception Approvals",
    "Exception Approvals operating queue",
    "Governance Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "vendor-briefings",
    "Vendor Briefings",
    "Vendor Briefings operating queue",
    "Reporting Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "documents",
    "Documents",
    "Documents operating queue",
    "Core Platform Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "notifications",
    "Notifications",
    "Notifications operating queue",
    "Core Platform Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "integrations",
    "Integrations",
    "Integrations operating queue",
    "Core Platform Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "profiles",
    "Profiles",
    "Profiles operating queue",
    "Core Platform Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "ai-assistant",
    "AI Assistant",
    "AI Assistant operating queue",
    "Intelligence Layer Lead",
    "Review evidence, assign owner, and record next action"
  ],
  [
    "ai-tools",
    "AI Tools",
    "AI Tools operating queue",
    "Intelligence Layer Lead",
    "Review evidence, assign owner, and record next action"
  ]
] as const;

function buildSurface(slug: string, title: string, item: string, owner: string, nextStep: string): FeatureSurface {
  return {
    workItems: [
      { id: `${slug}-1`, item, status: 'Open', owner, nextStep },
      { id: `${slug}-2`, item: `${title} exception review`, status: 'Review', owner: 'Operations', nextStep: 'Investigate exception and assign owner' },
      { id: `${slug}-3`, item: `${title} weekly operating queue`, status: 'Queued', owner: 'Team Lead', nextStep: 'Prioritize next actions' },
    ],
    quickActions: [`Create ${title} record`, `Export ${title} list`, `Review ${title} exceptions`],
    controlChecks: [
      { id: `${slug}-check-1`, label: `${title} owner assigned`, done: true },
      { id: `${slug}-check-2`, label: `${title} next step documented`, done: false },
      { id: `${slug}-check-3`, label: `${title} audit trail current`, done: true },
    ],
    activityLog: [
      { id: `${slug}-log-1`, message: `${title} queue refreshed`, at: '2026-05-29 09:00' },
      { id: `${slug}-log-2`, message: `${title} exception assigned`, at: '2026-05-29 11:30' },
    ],
  };
}

export const featureSurfaceBySlug: Record<string, FeatureSurface> = Object.fromEntries(featureSeeds.map(([slug, title, item, owner, nextStep]) => [slug, buildSurface(slug, title, item, owner, nextStep)]));
export const featureSurfaces: Record<string, FeatureSurface> = Object.fromEntries(featureSeeds.map(([slug, title]) => [title, featureSurfaceBySlug[slug]]));
