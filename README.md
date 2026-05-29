# AI Vendor Contract Risk Monitor

Runnable Next.js full-stack app for Vendor Contract Risk Monitor.

## Workflows

- `/vendor-inventory` - Vendor Inventory (Vendor Risk): Vendors, owners, systems, contract value, risk tier, and renewal timing.
- `/contract-ingestion` - Contract Ingestion (Contracts): Uploaded agreements, extracted terms, obligations, dates, and missing documents.
- `/renewal-risk` - Renewal Risk (Commercial): Auto-renewals, notice windows, price escalators, usage growth, and negotiation risk.
- `/data-processing-terms` - Data Processing Terms (Privacy): DPA clauses, subprocessors, transfer terms, retention, and deletion rights.
- `/ai-act-exposure` - AI Act Exposure (Regulatory): AI usage disclosures, high-risk signals, model obligations, and evidence gaps.
- `/dora-nis2-mapping` - DORA NIS2 Mapping (Regulatory): Resilience requirements, incident timelines, vendor controls, and accountability.
- `/security-obligations` - Security Obligations (Security): Security commitments, audit rights, breach notices, and control evidence.
- `/negotiation-playbook` - Negotiation Playbook (Commercial): Fallback language, leverage points, target terms, and approval route.
- `/exception-approvals` - Exception Approvals (Governance): Accepted risks, business justification, approvers, expiry, and compensating controls.
- `/vendor-briefings` - Vendor Briefings (Reporting): Executive summaries, open risks, renewal plan, and owner action list.

## Local Run

```bash
cd ai-vendor-contract-risk-monitor/frontend
npm run dev
```

Demo login: `admin@vendor-contract-risk.local` / `admin123`
