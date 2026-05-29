export type SourceAIToolField = {
  name: string;
  label: string;
  type: string;
  defaultValue: string;
  placeholder: string;
  options: string[];
  required?: boolean;
  source: string;
};

export const sourceAIToolFieldsByToolId: Record<string, SourceAIToolField[]> = {
  "vendor-inventory-copilot": [
    {
      "name": "objective",
      "label": "Objective",
      "type": "textarea",
      "defaultValue": "Improve Vendor Inventory and produce an audit-ready action plan.",
      "placeholder": "Describe the decision or workflow goal",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "source_context",
      "label": "Source Context",
      "type": "textarea",
      "defaultValue": "Paste records, notes, documents, metrics, or evidence for Vendor Inventory.",
      "placeholder": "Paste source context",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "output_format",
      "label": "Output Format",
      "type": "select",
      "defaultValue": "Action plan",
      "placeholder": "Select output format",
      "options": [
        "Action plan",
        "Executive summary",
        "Evidence table",
        "Checklist"
      ],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    }
  ],
  "contract-ingestion-copilot": [
    {
      "name": "objective",
      "label": "Objective",
      "type": "textarea",
      "defaultValue": "Improve Contract Ingestion and produce an audit-ready action plan.",
      "placeholder": "Describe the decision or workflow goal",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "source_context",
      "label": "Source Context",
      "type": "textarea",
      "defaultValue": "Paste records, notes, documents, metrics, or evidence for Contract Ingestion.",
      "placeholder": "Paste source context",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "output_format",
      "label": "Output Format",
      "type": "select",
      "defaultValue": "Action plan",
      "placeholder": "Select output format",
      "options": [
        "Action plan",
        "Executive summary",
        "Evidence table",
        "Checklist"
      ],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    }
  ],
  "renewal-risk-copilot": [
    {
      "name": "objective",
      "label": "Objective",
      "type": "textarea",
      "defaultValue": "Improve Renewal Risk and produce an audit-ready action plan.",
      "placeholder": "Describe the decision or workflow goal",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "source_context",
      "label": "Source Context",
      "type": "textarea",
      "defaultValue": "Paste records, notes, documents, metrics, or evidence for Renewal Risk.",
      "placeholder": "Paste source context",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "output_format",
      "label": "Output Format",
      "type": "select",
      "defaultValue": "Action plan",
      "placeholder": "Select output format",
      "options": [
        "Action plan",
        "Executive summary",
        "Evidence table",
        "Checklist"
      ],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    }
  ],
  "data-processing-terms-copilot": [
    {
      "name": "objective",
      "label": "Objective",
      "type": "textarea",
      "defaultValue": "Improve Data Processing Terms and produce an audit-ready action plan.",
      "placeholder": "Describe the decision or workflow goal",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "source_context",
      "label": "Source Context",
      "type": "textarea",
      "defaultValue": "Paste records, notes, documents, metrics, or evidence for Data Processing Terms.",
      "placeholder": "Paste source context",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "output_format",
      "label": "Output Format",
      "type": "select",
      "defaultValue": "Action plan",
      "placeholder": "Select output format",
      "options": [
        "Action plan",
        "Executive summary",
        "Evidence table",
        "Checklist"
      ],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    }
  ],
  "ai-act-exposure-copilot": [
    {
      "name": "objective",
      "label": "Objective",
      "type": "textarea",
      "defaultValue": "Improve AI Act Exposure and produce an audit-ready action plan.",
      "placeholder": "Describe the decision or workflow goal",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "source_context",
      "label": "Source Context",
      "type": "textarea",
      "defaultValue": "Paste records, notes, documents, metrics, or evidence for AI Act Exposure.",
      "placeholder": "Paste source context",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "output_format",
      "label": "Output Format",
      "type": "select",
      "defaultValue": "Action plan",
      "placeholder": "Select output format",
      "options": [
        "Action plan",
        "Executive summary",
        "Evidence table",
        "Checklist"
      ],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    }
  ],
  "dora-nis2-mapping-copilot": [
    {
      "name": "objective",
      "label": "Objective",
      "type": "textarea",
      "defaultValue": "Improve DORA NIS2 Mapping and produce an audit-ready action plan.",
      "placeholder": "Describe the decision or workflow goal",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "source_context",
      "label": "Source Context",
      "type": "textarea",
      "defaultValue": "Paste records, notes, documents, metrics, or evidence for DORA NIS2 Mapping.",
      "placeholder": "Paste source context",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "output_format",
      "label": "Output Format",
      "type": "select",
      "defaultValue": "Action plan",
      "placeholder": "Select output format",
      "options": [
        "Action plan",
        "Executive summary",
        "Evidence table",
        "Checklist"
      ],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    }
  ],
  "security-obligations-copilot": [
    {
      "name": "objective",
      "label": "Objective",
      "type": "textarea",
      "defaultValue": "Improve Security Obligations and produce an audit-ready action plan.",
      "placeholder": "Describe the decision or workflow goal",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "source_context",
      "label": "Source Context",
      "type": "textarea",
      "defaultValue": "Paste records, notes, documents, metrics, or evidence for Security Obligations.",
      "placeholder": "Paste source context",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "output_format",
      "label": "Output Format",
      "type": "select",
      "defaultValue": "Action plan",
      "placeholder": "Select output format",
      "options": [
        "Action plan",
        "Executive summary",
        "Evidence table",
        "Checklist"
      ],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    }
  ],
  "negotiation-playbook-copilot": [
    {
      "name": "objective",
      "label": "Objective",
      "type": "textarea",
      "defaultValue": "Improve Negotiation Playbook and produce an audit-ready action plan.",
      "placeholder": "Describe the decision or workflow goal",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "source_context",
      "label": "Source Context",
      "type": "textarea",
      "defaultValue": "Paste records, notes, documents, metrics, or evidence for Negotiation Playbook.",
      "placeholder": "Paste source context",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "output_format",
      "label": "Output Format",
      "type": "select",
      "defaultValue": "Action plan",
      "placeholder": "Select output format",
      "options": [
        "Action plan",
        "Executive summary",
        "Evidence table",
        "Checklist"
      ],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    }
  ],
  "exception-approvals-copilot": [
    {
      "name": "objective",
      "label": "Objective",
      "type": "textarea",
      "defaultValue": "Improve Exception Approvals and produce an audit-ready action plan.",
      "placeholder": "Describe the decision or workflow goal",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "source_context",
      "label": "Source Context",
      "type": "textarea",
      "defaultValue": "Paste records, notes, documents, metrics, or evidence for Exception Approvals.",
      "placeholder": "Paste source context",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "output_format",
      "label": "Output Format",
      "type": "select",
      "defaultValue": "Action plan",
      "placeholder": "Select output format",
      "options": [
        "Action plan",
        "Executive summary",
        "Evidence table",
        "Checklist"
      ],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    }
  ],
  "vendor-briefings-copilot": [
    {
      "name": "objective",
      "label": "Objective",
      "type": "textarea",
      "defaultValue": "Improve Vendor Briefings and produce an audit-ready action plan.",
      "placeholder": "Describe the decision or workflow goal",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "source_context",
      "label": "Source Context",
      "type": "textarea",
      "defaultValue": "Paste records, notes, documents, metrics, or evidence for Vendor Briefings.",
      "placeholder": "Paste source context",
      "options": [],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    },
    {
      "name": "output_format",
      "label": "Output Format",
      "type": "select",
      "defaultValue": "Action plan",
      "placeholder": "Select output format",
      "options": [
        "Action plan",
        "Executive summary",
        "Evidence table",
        "Checklist"
      ],
      "required": true,
      "source": "Vendor Contract Risk Monitor"
    }
  ]
};
