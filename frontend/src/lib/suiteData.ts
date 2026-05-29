export type Metric = { label: string; value: string; note: string };
export const sourceSystems = [
  {
    "name": "Vendor contracts",
    "ownership": "Vendor contracts contributes operating evidence, workflows, control signals, and reporting inputs to Vendor Contract Risk Monitor.",
    "coverage": [
      "Vendor Inventory",
      "Contract Ingestion",
      "AI tools",
      "Audit evidence"
    ]
  },
  {
    "name": "DPA terms",
    "ownership": "DPA terms contributes operating evidence, workflows, control signals, and reporting inputs to Vendor Contract Risk Monitor.",
    "coverage": [
      "Contract Ingestion",
      "Renewal Risk",
      "AI tools",
      "Audit evidence"
    ]
  },
  {
    "name": "Renewal calendar",
    "ownership": "Renewal calendar contributes operating evidence, workflows, control signals, and reporting inputs to Vendor Contract Risk Monitor.",
    "coverage": [
      "Renewal Risk",
      "Data Processing Terms",
      "AI tools",
      "Audit evidence"
    ]
  },
  {
    "name": "Security reviews",
    "ownership": "Security reviews contributes operating evidence, workflows, control signals, and reporting inputs to Vendor Contract Risk Monitor.",
    "coverage": [
      "Data Processing Terms",
      "AI Act Exposure",
      "AI tools",
      "Audit evidence"
    ]
  }
];

export const dashboardMetrics: Metric[] = [
  { label: 'Workflow Areas', value: '10', note: 'Dedicated modules' },
  { label: 'Evidence Sources', value: '4', note: 'Mapped sources' },
  { label: 'AI Tools', value: '13', note: 'Suite copilots' },
  { label: 'Open Work', value: '64', note: 'Across workflows' },
];

export const healthMetrics: Metric[] = [
  { label: 'Connector Health', value: '96%', note: 'Pilot baseline' },
  { label: 'Audit Coverage', value: '100%', note: 'All workflows logged' },
  { label: 'Review Queue', value: '22', note: 'Needs owner action' },
  { label: 'Automation Runs', value: '341', note: 'Last 24 hours' },
];

export const dashboardModules = [
  "Vendor Inventory operating view",
  "Contract Ingestion operating view",
  "Renewal Risk operating view",
  "Data Processing Terms operating view",
  "AI Act Exposure operating view",
  "DORA NIS2 Mapping operating view",
  "Security Obligations operating view",
  "Negotiation Playbook operating view"
];
export const workflowHighlights = [
  "Vendor Inventory workflow with records, AI assist, approvals, audit, and reporting",
  "Contract Ingestion workflow with records, AI assist, approvals, audit, and reporting",
  "Renewal Risk workflow with records, AI assist, approvals, audit, and reporting",
  "Data Processing Terms workflow with records, AI assist, approvals, audit, and reporting",
  "AI Act Exposure workflow with records, AI assist, approvals, audit, and reporting",
  "DORA NIS2 Mapping workflow with records, AI assist, approvals, audit, and reporting"
];
