'use strict';

const RATINGS = new Set(['low', 'medium', 'high', 'critical']);
const SCENARIOS = new Set(['renewal', 'termination', 'data-processing', 'service-level', 'pricing']);

function evaluate(input = {}) {
  const errors = [];
  if (!String(input.contractId || '').trim() || !String(input.contractVersion || '').trim()) {
    errors.push('versioned contract required');
  }
  if (!String(input.policyId || '').trim() || !String(input.policyVersion || '').trim()) {
    errors.push('versioned policy required');
  }
  if (!String(input.ownerId || '').trim()) errors.push('accountable owner required');
  if (!SCENARIOS.has(input.scenario)) errors.push('supported contract scenario required');
  if (!String(input.jurisdiction || '').trim()) errors.push('jurisdiction required');
  if (!input.effectiveAt || Number.isNaN(Date.parse(input.effectiveAt))) errors.push('effective date required');
  if (!input.retentionUntil || Number.isNaN(Date.parse(input.retentionUntil))) errors.push('retention deadline required');
  if (!Array.isArray(input.obligations) || !input.obligations.length) errors.push('obligations required');
  const obligations = (input.obligations || []).map((obligation, index) => {
    if (!String(obligation.id || '').trim() || !String(obligation.citationRef || '').trim()) {
      errors.push(`obligations[${index}] citation required`);
    }
    if (!obligation.deadline || Number.isNaN(Date.parse(obligation.deadline))) {
      errors.push(`obligations[${index}] deadline invalid`);
    }
    if (!RATINGS.has(obligation.riskRating)) errors.push(`obligations[${index}] riskRating invalid`);
    if (!Array.isArray(obligation.evidenceRefs) || !obligation.evidenceRefs.length) {
      errors.push(`obligations[${index}] evidence required`);
    }
    return {
      id: String(obligation.id || ''), citationRef: String(obligation.citationRef || ''),
      deadline: obligation.deadline, riskRating: obligation.riskRating,
      evidenceRefs: [...(obligation.evidenceRefs || [])].map(String).sort(),
    };
  });
  if (input.changeDetected === true && !String(input.changeRef || '').trim()) {
    errors.push('changeRef required when change detected');
  }
  return {
    errors,
    result: {
      schemaVersion: 1,
      contractId: String(input.contractId || ''), contractVersion: String(input.contractVersion || ''),
      policyId: String(input.policyId || ''), policyVersion: String(input.policyVersion || ''),
      scenario: input.scenario, jurisdiction: String(input.jurisdiction || ''),
      ownerId: String(input.ownerId || ''),
      obligations: obligations.sort((a, b) => a.id.localeCompare(b.id)),
      releaseState: 'human_review_required', decisionAutomated: false,
    },
    uncertainty: {
      authoritativeInterpretationRequired: true,
      vendorAcceptanceUnknown: true,
      changeDetected: input.changeDetected === true,
    },
  };
}

module.exports = { evaluate };
