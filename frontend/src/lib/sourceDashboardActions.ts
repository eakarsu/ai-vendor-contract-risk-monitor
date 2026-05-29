export type SourceDashboardAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  sourceProjects: string[];
  examples: string[];
  count: number;
};

export const sourceDashboardActions: SourceDashboardAction[] = [
  {
    "id": "vendor-inventory",
    "label": "Vendor Inventory",
    "description": "Vendor Inventory action group for Vendor Contract Risk Monitor.",
    "href": "/vendor-inventory",
    "sourceProjects": [
      "Vendor contracts",
      "DPA terms"
    ],
    "examples": [
      "Open Vendor Inventory",
      "Review Vendor Risk",
      "Run Vendor Inventory AI check"
    ],
    "count": 3
  },
  {
    "id": "contract-ingestion",
    "label": "Contract Ingestion",
    "description": "Contract Ingestion action group for Vendor Contract Risk Monitor.",
    "href": "/contract-ingestion",
    "sourceProjects": [
      "DPA terms",
      "Renewal calendar"
    ],
    "examples": [
      "Open Contract Ingestion",
      "Review Contracts",
      "Run Contract Ingestion AI check"
    ],
    "count": 3
  },
  {
    "id": "renewal-risk",
    "label": "Renewal Risk",
    "description": "Renewal Risk action group for Vendor Contract Risk Monitor.",
    "href": "/renewal-risk",
    "sourceProjects": [
      "Renewal calendar",
      "Security reviews"
    ],
    "examples": [
      "Open Renewal Risk",
      "Review Commercial",
      "Run Renewal Risk AI check"
    ],
    "count": 3
  },
  {
    "id": "data-processing-terms",
    "label": "Data Processing Terms",
    "description": "Data Processing Terms action group for Vendor Contract Risk Monitor.",
    "href": "/data-processing-terms",
    "sourceProjects": [
      "Security reviews"
    ],
    "examples": [
      "Open Data Processing Terms",
      "Review Privacy",
      "Run Data Processing Terms AI check"
    ],
    "count": 3
  },
  {
    "id": "ai-act-exposure",
    "label": "AI Act Exposure",
    "description": "AI Act Exposure action group for Vendor Contract Risk Monitor.",
    "href": "/ai-act-exposure",
    "sourceProjects": [
      "Vendor contracts",
      "DPA terms"
    ],
    "examples": [
      "Open AI Act Exposure",
      "Review Regulatory",
      "Run AI Act Exposure AI check"
    ],
    "count": 3
  },
  {
    "id": "dora-nis2-mapping",
    "label": "DORA NIS2 Mapping",
    "description": "DORA NIS2 Mapping action group for Vendor Contract Risk Monitor.",
    "href": "/dora-nis2-mapping",
    "sourceProjects": [
      "DPA terms",
      "Renewal calendar"
    ],
    "examples": [
      "Open DORA NIS2 Mapping",
      "Review Regulatory",
      "Run DORA NIS2 Mapping AI check"
    ],
    "count": 3
  },
  {
    "id": "security-obligations",
    "label": "Security Obligations",
    "description": "Security Obligations action group for Vendor Contract Risk Monitor.",
    "href": "/security-obligations",
    "sourceProjects": [
      "Renewal calendar",
      "Security reviews"
    ],
    "examples": [
      "Open Security Obligations",
      "Review Security",
      "Run Security Obligations AI check"
    ],
    "count": 3
  },
  {
    "id": "negotiation-playbook",
    "label": "Negotiation Playbook",
    "description": "Negotiation Playbook action group for Vendor Contract Risk Monitor.",
    "href": "/negotiation-playbook",
    "sourceProjects": [
      "Security reviews"
    ],
    "examples": [
      "Open Negotiation Playbook",
      "Review Commercial",
      "Run Negotiation Playbook AI check"
    ],
    "count": 3
  },
  {
    "id": "exception-approvals",
    "label": "Exception Approvals",
    "description": "Exception Approvals action group for Vendor Contract Risk Monitor.",
    "href": "/exception-approvals",
    "sourceProjects": [
      "Vendor contracts",
      "DPA terms"
    ],
    "examples": [
      "Open Exception Approvals",
      "Review Governance",
      "Run Exception Approvals AI check"
    ],
    "count": 3
  },
  {
    "id": "vendor-briefings",
    "label": "Vendor Briefings",
    "description": "Vendor Briefings action group for Vendor Contract Risk Monitor.",
    "href": "/vendor-briefings",
    "sourceProjects": [
      "DPA terms",
      "Renewal calendar"
    ],
    "examples": [
      "Open Vendor Briefings",
      "Review Reporting",
      "Run Vendor Briefings AI check"
    ],
    "count": 3
  }
];
