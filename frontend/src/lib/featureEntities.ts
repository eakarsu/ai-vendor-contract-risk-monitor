export type EntityRecord = { id: string; name: string; status: string; owner: string; amount?: string; dueDate?: string; priority?: string };
export type FeatureEntitySet = { title: string; columns: string[]; rows: EntityRecord[] };
const COLUMNS = ['Name', 'Status', 'Owner', 'Amount', 'Due Date', 'Priority'];
const entitySeeds = [
  [
    "vendor-inventory",
    "Vendor Inventory Records",
    "Vendor Inventory priority queue",
    "Open",
    "Vendor Inventory exception list",
    "Vendor Risk Lead",
    "$0"
  ],
  [
    "contract-ingestion",
    "Contract Ingestion Records",
    "Contract Ingestion priority queue",
    "Review",
    "Contract Ingestion exception list",
    "Contracts Lead",
    "$0"
  ],
  [
    "renewal-risk",
    "Renewal Risk Records",
    "Renewal Risk priority queue",
    "Action needed",
    "Renewal Risk exception list",
    "Commercial Lead",
    "$0"
  ],
  [
    "data-processing-terms",
    "Data Processing Terms Records",
    "Data Processing Terms priority queue",
    "Open",
    "Data Processing Terms exception list",
    "Privacy Lead",
    "$0"
  ],
  [
    "ai-act-exposure",
    "AI Act Exposure Records",
    "AI Act Exposure priority queue",
    "Review",
    "AI Act Exposure exception list",
    "Regulatory Lead",
    "$0"
  ],
  [
    "dora-nis2-mapping",
    "DORA NIS2 Mapping Records",
    "DORA NIS2 Mapping priority queue",
    "Action needed",
    "DORA NIS2 Mapping exception list",
    "Regulatory Lead",
    "$0"
  ],
  [
    "security-obligations",
    "Security Obligations Records",
    "Security Obligations priority queue",
    "Open",
    "Security Obligations exception list",
    "Security Lead",
    "$0"
  ],
  [
    "negotiation-playbook",
    "Negotiation Playbook Records",
    "Negotiation Playbook priority queue",
    "Review",
    "Negotiation Playbook exception list",
    "Commercial Lead",
    "$0"
  ],
  [
    "exception-approvals",
    "Exception Approvals Records",
    "Exception Approvals priority queue",
    "Action needed",
    "Exception Approvals exception list",
    "Governance Lead",
    "$0"
  ],
  [
    "vendor-briefings",
    "Vendor Briefings Records",
    "Vendor Briefings priority queue",
    "Open",
    "Vendor Briefings exception list",
    "Reporting Lead",
    "$0"
  ],
  [
    "documents",
    "Documents Records",
    "Documents priority queue",
    "Review",
    "Documents exception list",
    "Core Platform Lead",
    "$0"
  ],
  [
    "notifications",
    "Notifications Records",
    "Notifications priority queue",
    "Action needed",
    "Notifications exception list",
    "Core Platform Lead",
    "$0"
  ],
  [
    "integrations",
    "Integrations Records",
    "Integrations priority queue",
    "Open",
    "Integrations exception list",
    "Core Platform Lead",
    "$0"
  ],
  [
    "profiles",
    "Profiles Records",
    "Profiles priority queue",
    "Review",
    "Profiles exception list",
    "Core Platform Lead",
    "$0"
  ],
  [
    "ai-assistant",
    "AI Assistant Records",
    "AI Assistant priority queue",
    "Action needed",
    "AI Assistant exception list",
    "Intelligence Layer Lead",
    "$0"
  ],
  [
    "ai-tools",
    "AI Tools Records",
    "AI Tools priority queue",
    "Open",
    "AI Tools exception list",
    "Intelligence Layer Lead",
    "$0"
  ]
] as const;

function buildSet(slug: string, title: string, firstName: string, firstStatus: string, secondName: string, owner: string, amount: string): FeatureEntitySet {
  return {
    title,
    columns: COLUMNS,
    rows: [
      { id: `${slug}-1`, name: firstName, status: firstStatus, owner, amount, dueDate: '2026-06-03', priority: 'High' },
      { id: `${slug}-2`, name: secondName, status: 'Review', owner: 'Operations', amount, dueDate: '2026-06-06', priority: 'Medium' },
      { id: `${slug}-3`, name: `${title.replace(' Records', '')} audit queue`, status: 'Queued', owner: 'Team Lead', amount: '$0', dueDate: '2026-06-10', priority: 'Medium' },
    ],
  };
}

export const featureEntitiesBySlug: Record<string, FeatureEntitySet> = Object.fromEntries(entitySeeds.map(([slug, title, firstName, firstStatus, secondName, owner, amount]) => [slug, buildSet(slug, title, firstName, firstStatus, secondName, owner, amount)]));
