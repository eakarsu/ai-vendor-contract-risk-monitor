'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { aiTools, type AIToolDefinition } from '@/lib/aiTools';
import { sourceAIToolFieldsByToolId, type SourceAIToolField } from '@/lib/sourceAIToolFields';
import JsonReport from '@/components/JsonReport';

type AIWorkbenchProps = {
  mode?: 'assistant' | 'tools';
};

type AIResult = {
  id?: string;
  tool: AIToolDefinition;
  input: string;
  response: string;
  provider: string;
  model?: string;
  createdAt: string;
};

type PresetDefinition = {
  id: string;
  label: string;
  description: string;
  buildPrompt: (tool: AIToolDefinition) => string;
};

type ParsedTable = {
  columns: string[];
  rows: string[][];
};

type ParsedSection = {
  title: string;
  paragraphs: string[];
  bullets: string[];
  tables?: ParsedTable[];
};

const promptPresets: PresetDefinition[] = [
  {
    id: 'executive-summary',
    label: 'Executive Summary',
    description: 'Summarize status, risks, and recommended leadership actions.',
    buildPrompt: (tool) =>
      'Create an executive-ready summary for ' + tool.title + '. Include current status, key risks, priority decisions, and owner follow-up. Context: ' + tool.defaultPrompt,
  },
  {
    id: 'risk-review',
    label: 'Risk Review',
    description: 'Focus the AI response on risks, gaps, controls, and escalation points.',
    buildPrompt: (tool) =>
      'Review ' + tool.title + ' for operational risks, missing data, compliance gaps, weak controls, and escalation points. Return severity, evidence needed, and next action. Context: ' + tool.defaultPrompt,
  },
  {
    id: 'next-actions',
    label: 'Next Actions',
    description: 'Generate a practical owner-by-owner action plan.',
    buildPrompt: (tool) =>
      'Turn this ' + tool.title + ' context into a concrete action plan. Group actions by owner, priority, due date, blocker, and expected output. Context: ' + tool.defaultPrompt,
  },
  {
    id: 'implementation-plan',
    label: 'Implementation Plan',
    description: 'Convert the feature into workflow, data, API, and QA steps.',
    buildPrompt: (tool) =>
      'Create an implementation plan for ' + tool.title + '. Include workflow steps, required data, APIs or integrations, permissions, empty states, audit logging, and validation tests. Context: ' + tool.defaultPrompt,
  },
];

function buildFieldValues(fields: SourceAIToolField[]) {
  return Object.fromEntries(fields.map((field) => [field.name, field.defaultValue || '']));
}

function sampleForField(field: SourceAIToolField, tool: AIToolDefinition, profile = 0) {
  if (field.options.length) return field.options[profile % field.options.length];
  if (field.type === 'checkbox') return 'false';
  if (field.name === 'objective') return promptPresets[profile].buildPrompt(tool);
  if (field.name === 'source_context') return 'Fictional, deidentified planning context for ' + tool.title + '. ' + ['Prepare a status review and identify evidence that is still needed.', 'Review potential risks without asserting unsupported incidents or completed controls.', 'Propose owner follow-up and validation steps; decisions require authorized review.', 'Prepare a staged implementation proposal with testing and approval checkpoints.'][profile];
  return field.defaultValue || 'Proposed ' + field.label + ' for review; confirm source facts before use.';
}

function formatInput(prompt: string, fields: SourceAIToolField[], values: Record<string, string>) {
  const structured = fields
    .map((field) => ({ label: field.label, value: values[field.name] }))
    .filter((item) => String(item.value || '').trim())
    .map((item) => item.label + ': ' + item.value)
    .join('\n');
  return structured ? prompt + '\n\nStructured fields:\n' + structured : prompt;
}

function parseStructuredResponse(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const original = value.replace(/^\uFEFF/, '').trim();
  const fenced = original.match(/```(?:json|javascript|js)?[ \t]*(?:\r?\n)?([\s\S]*?)(?:\r?\n)?```/i);
  let candidate = (fenced?.[1] ?? original).trim();

  for (let pass = 0; pass < 2; pass += 1) {
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed !== 'string') return parsed;
      candidate = parsed.trim();
    } catch {
      break;
    }
  }

  return candidate;
}

function sectionLabel(value: string) {
  const labels: Record<string, string> = {
    summary: 'Executive Summary',
    analysis_summary: 'Executive Summary',
    key_findings: 'Key Findings',
    findings: 'Key Findings',
    recommendations: 'Recommendations',
    prioritized_actions: 'Prioritized Actions',
    actions: 'Recommended Actions',
    next_steps: 'Next Steps',
    risks: 'Risks and Safeguards',
    confidence: 'AI Confidence',
    missing_information: 'Missing Information',
    follow_up_questions: 'Follow-up Questions',
  };
  return labels[value] || value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readableValue(value: unknown): string {
  if (value == null) return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') { const parsed = parseStructuredResponse(value); return typeof parsed === 'string' ? parsed.replace(/\*\*/g, '').replace(/`/g, '').trim() : readableValue(parsed); }
  if (Array.isArray(value)) return value.map(readableValue).join('; ');
  return Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => sectionLabel(key) + ': ' + readableValue(item))
    .join(' · ');
}

function tableFromArray(value: unknown[]): ParsedTable | null {
  const rows = value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
  if (!rows.length || rows.length !== value.length) return null;
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).slice(0, 8);
  if (!columns.length) return null;
  return {
    columns,
    rows: rows.slice(0, 25).map((row) => columns.map((column) => readableValue(row[column]))),
  };
}

function sectionsFromObject(value: unknown): ParsedSection[] {
  if (Array.isArray(value)) {
    const table = tableFromArray(value);
    return [{ title: 'AI Analysis', paragraphs: [], bullets: table ? [] : value.map(readableValue), tables: table ? [table] : [] }];
  }
  if (!value || typeof value !== 'object') return [];

  const object = value as Record<string, unknown>;
  const providerContent = (object.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0]?.message?.content;
  const contentKeys = ['result', 'ai_result', 'content', 'analysis', 'structured', 'output', 'response', 'data'];
  const contentKey = contentKeys.find((key) => object[key] !== undefined && object[key] !== null && object[key] !== '');
  const metadata = new Set(['title', 'feature', 'model', 'model_used', 'provider', 'usage', 'tokens', 'cached', 'createdAt', 'created_at', 'providerReceipt']);
  const nonMetadata = Object.keys(object).filter((key) => !metadata.has(key));

  if ((contentKey || providerContent) && nonMetadata.length <= 3) {
    const nested = parseStructuredResponse(contentKey ? object[contentKey] : providerContent);
    if (nested && typeof nested === 'object') return sectionsFromObject(nested);
    if (typeof nested === 'string') return parseAIResponse(nested);
  }

  const priority = ['summary', 'analysis_summary', 'overview', 'confidence', 'key_findings', 'findings', 'recommendations', 'prioritized_actions', 'actions', 'next_steps', 'risks', 'safeguards', 'missing_information', 'assumptions', 'follow_up_questions'];
  return Object.entries(object)
    .filter(([key, item]) => !metadata.has(key) && item !== null && item !== undefined && item !== '')
    .sort(([a], [b]) => {
      const ai = priority.indexOf(a);
      const bi = priority.indexOf(b);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    })
    .map(([key, item]) => {
      if (key === 'confidence' || key === 'ai_confidence') {
        const numeric = Number.parseFloat(String(item));
        const percent = Number.isFinite(numeric) ? Math.round(Math.max(0, Math.min(100, numeric <= 1 ? numeric * 100 : numeric))) : null;
        const rating = percent === null ? '' : percent >= 80 ? 'High' : percent >= 55 ? 'Moderate' : 'Needs review';
        return { title: sectionLabel(key), paragraphs: [percent === null ? readableValue(item) : percent + '% · ' + rating], bullets: [] };
      }
      if (Array.isArray(item)) {
        const table = tableFromArray(item);
        return { title: sectionLabel(key), paragraphs: [], bullets: table ? [] : item.map(readableValue), tables: table ? [table] : [] };
      }
      if (item && typeof item === 'object') {
        const nestedTables = Object.entries(item as Record<string, unknown>)
          .filter(([, child]) => Array.isArray(child))
          .map(([, child]) => tableFromArray(child as unknown[]))
          .filter((table): table is ParsedTable => Boolean(table));
        return {
          title: sectionLabel(key),
          paragraphs: [],
          bullets: Object.entries(item as Record<string, unknown>)
            .filter(([, child]) => !Array.isArray(child) || !tableFromArray(child))
            .map(([childKey, child]) => sectionLabel(childKey) + ': ' + readableValue(child)),
          tables: nestedTables,
        };
      }
      return { title: sectionLabel(key), paragraphs: [readableValue(item)], bullets: [] };
    });
}

function parseAIResponse(response: string): ParsedSection[] {
  const structured = parseStructuredResponse(response);
  if (structured && typeof structured === 'object') {
    const sections = sectionsFromObject(structured);
    if (sections.length) return sections;
  }

  const narrative = typeof structured === 'string' ? structured : response;
  const lines = narrative
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: ParsedSection[] = [];
  let current: ParsedSection = { title: 'AI Analysis', paragraphs: [], bullets: [] };

  const pushCurrent = () => {
    if (current.paragraphs.length || current.bullets.length || current.title !== 'AI Analysis') {
      sections.push(current);
    }
  };

  for (const line of lines) {
    const markdownHeading = line.match(/^#{1,6}\s+(.+)$/);
    const plainHeading = !markdownHeading && line.length <= 72 && /:$/.test(line) && !/^https?:\/\//i.test(line);
    if (markdownHeading || plainHeading) {
      pushCurrent();
      current = {
        title: (markdownHeading ? markdownHeading[1] : line.replace(/:$/, '')).replace(/\*\*/g, ''),
        paragraphs: [],
        bullets: [],
      };
      continue;
    }

    const bullet = line.match(/^([-*•]|\d+[.)])\s+(.+)$/);
    if (bullet) current.bullets.push(bullet[2].replace(/\*\*/g, ''));
    else current.paragraphs.push(line.replace(/\*\*/g, ''));
  }

  pushCurrent();
  return sections.length ? sections : [{ title: 'AI Analysis', paragraphs: [narrative], bullets: [] }];
}

function classifySection(title: string) {
  const lower = title.toLowerCase();
  if (/risk|gap|issue|exception|concern/.test(lower)) return 'risk';
  if (/action|next|recommend|owner|task|follow/.test(lower)) return 'action';
  if (/audit|control|evidence|compliance|validation|review/.test(lower)) return 'audit';
  if (/summary|overview|analysis|finding|status/.test(lower)) return 'summary';
  return 'detail';
}

function plainResult(result: AIResult, sections: ParsedSection[]) {
  return [
    '# ' + result.tool.title,
    '',
    'Provider: ' + result.provider,
    'Generated: ' + new Date(result.createdAt).toLocaleString(),
    '',
    '## Request',
    result.input,
    '',
    ...sections.flatMap((section) => [
      '## ' + section.title,
      ...section.paragraphs,
      ...section.bullets.map((bullet) => '- ' + bullet),
      ...(section.tables || []).flatMap((table) => [
        '| ' + table.columns.map(sectionLabel).join(' | ') + ' |',
        '| ' + table.columns.map(() => '---').join(' | ') + ' |',
        ...table.rows.map((row) => '| ' + row.map((cell) => cell.replace(/\|/g, '\\|')).join(' | ') + ' |'),
      ]),
      '',
    ]),
  ].join('\n');
}

type FieldSnapshot = {
  label: string;
  value: string;
  source: string;
  required?: boolean;
};

function buildFieldSnapshot(fields: SourceAIToolField[], values: Record<string, string>): FieldSnapshot[] {
  return fields
    .map((field) => ({
      label: field.label,
      value: values[field.name] || '',
      source: field.source,
      required: field.required,
    }))
    .filter((field) => String(field.value || '').trim())
    .slice(0, 18);
}

function fieldValuesFromInput(input: string, fields: SourceAIToolField[]) {
  const marker = '\n\nStructured fields:\n';
  const structured = input.includes(marker) ? input.split(marker).slice(1).join(marker) : '';
  const byLabel = new Map<string, string>();
  for (const line of structured.split('\n')) {
    const separator = line.indexOf(':');
    if (separator > 0) byLabel.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }
  return Object.fromEntries(fields.map((field) => [field.name, byLabel.get(field.label) || '']));
}

function AIResultReport({
  result,
  fields,
  fieldValues,
}: {
  result: AIResult;
  fields: SourceAIToolField[];
  fieldValues: Record<string, string>;
}) {
  const sections = parseAIResponse(result.response);
  const createdAt = new Date(result.createdAt).toLocaleString();
  const fieldSnapshot = buildFieldSnapshot(fields, fieldValues);
  const riskCount = sections.filter((section) => classifySection(section.title) === 'risk').length;
  const actionCount = sections.reduce((sum, section) => sum + (classifySection(section.title) === 'action' ? Math.max(section.bullets.length, 1) : 0), 0);
  const auditCount = sections.filter((section) => classifySection(section.title) === 'audit').length;
  const copyText = plainResult(result, sections);
  const [showJson, setShowJson] = useState(false);

  const copyReport = async () => {
    await navigator.clipboard?.writeText(copyText);
  };

  const downloadReport = () => {
    const blob = new Blob([copyText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.tool.id + '-ai-report.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ai-report pro">
      <div className="ai-report-header pro">
        <div>
          <div className="pill">AI Result Report</div>
          <h4>{result.tool.title}</h4>
          <div className="muted">Provider: {result.provider}{result.model ? ' · Model: ' + result.model : ''} · {createdAt}</div>
        </div>
        <div className="ai-report-actions">
          <div className="ai-report-badge">{result.tool.category}</div>
          <button className="button subtle" type="button" onClick={copyReport}>Copy</button>
          <button className="button subtle" type="button" onClick={downloadReport}>Export MD</button>
          <button className="button subtle" type="button" aria-pressed={showJson} onClick={() => setShowJson((value) => !value)}>{showJson ? 'Formatted report' : 'JSON view'}</button>
        </div>
      </div>

      <div className="ai-report-scoregrid">
        <div>
          <span>Sections</span>
          <strong>{sections.length}</strong>
          <em>Structured response blocks</em>
        </div>
        <div>
          <span>Risks</span>
          <strong>{riskCount}</strong>
          <em>Risk-oriented sections</em>
        </div>
        <div>
          <span>Actions</span>
          <strong>{actionCount || sections.reduce((sum, section) => sum + section.bullets.length, 0)}</strong>
          <em>Action bullets detected</em>
        </div>
        <div>
          <span>Audit</span>
          <strong>{auditCount}</strong>
          <em>Evidence/control sections</em>
        </div>
      </div>

      {fieldSnapshot.length ? (
        <div className="ai-report-field-recap">
          <div className="section-head compact">
            <div>
              <h4>Source Field Recap</h4>
              <div className="muted">Values submitted from the donor AI feature schema.</div>
            </div>
          </div>
          <div className="ai-field-recap-grid">
            {fieldSnapshot.map((field) => (
              <div key={field.label + field.source} className="ai-field-recap-item">
                <span>{field.label}{field.required ? ' *' : ''}</span>
                <strong>{field.value}</strong>
                <em>{field.source}</em>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <details className="ai-report-request pro">
        <summary>Request sent to AI</summary>
        <p>{result.input}</p>
      </details>

      {showJson ? (
        <div className="ai-report-json pro">
          <JsonReport data={result.response} title={result.tool.title + ' — structured JSON'} model={result.model} />
        </div>
      ) : null}

      <div className="ai-report-sections pro">
        {sections.map((section, index) => {
          const kind = classifySection(section.title);
          return (
            <section key={section.title + index} className={'ai-report-section pro ' + kind}>
              <div className="ai-section-label">{kind}</div>
              <h5>{section.title}</h5>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>{paragraph}</p>
              ))}
              {section.bullets.length ? (
                <ul>
                  {section.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {(section.tables || []).map((table, tableIndex) => (
                <div className="ai-report-table-wrap" key={tableIndex}>
                  <table className="ai-report-table">
                    <thead>
                      <tr>{table.columns.map((column) => <th key={column}>{sectionLabel(column)}</th>)}</tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SavedAIResults({
  results,
  selected,
  loading,
  error,
  onSelect,
}: {
  results: AIResult[];
  selected: AIResult | null;
  loading: boolean;
  error: string;
  onSelect: (id: string) => void;
}) {
  const selectedFields = selected ? sourceAIToolFieldsByToolId[selected.tool.id] || [] : [];
  const selectedValues = selected ? fieldValuesFromInput(selected.input, selectedFields) : {};

  return (
    <section className="saved-ai-results" aria-label="Saved AI results">
      <div className="section-head compact">
        <div>
          <div className="pill">Saved Results</div>
          <h3>Saved AI Results</h3>
          <div className="muted">Recent reports saved for your account, rendered with the same structured presentation.</div>
        </div>
        <div className="ai-report-badge">{results.length} available</div>
      </div>

      {loading ? <div className="muted">Loading saved AI results…</div> : null}
      {error ? <div className="error-text">{error}</div> : null}
      {!loading && !error && !results.length ? (
        <div className="ai-empty-result compact">
          <h4>No saved AI results yet</h4>
          <p>Generated reports will appear here without replacing existing records.</p>
        </div>
      ) : null}

      {results.length ? (
        <div className="saved-ai-layout">
          <div className="saved-ai-list" role="list">
            {results.map((saved) => {
              const id = saved.id || saved.createdAt;
              return (
                <button
                  className={(selected?.id || selected?.createdAt) === id ? 'saved-ai-card active' : 'saved-ai-card'}
                  key={id}
                  type="button"
                  role="listitem"
                  onClick={() => onSelect(id)}
                >
                  <span>{saved.tool.category}</span>
                  <strong>{saved.tool.title}</strong>
                  <em>{new Date(saved.createdAt).toLocaleString()}</em>
                  <small>{saved.model || saved.provider}</small>
                </button>
              );
            })}
          </div>
          {selected ? (
            <div className="saved-ai-report">
              <AIResultReport result={selected} fields={selectedFields} fieldValues={selectedValues} />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: SourceAIToolField;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === 'select' && field.options.length) {
    return (
      <label className="ai-dynamic-field">
        <span>{field.label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {field.options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <label className="ai-dynamic-field">
        <span>{field.label}</span>
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} placeholder={field.placeholder} />
      </label>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="ai-dynamic-field check-row">
        <input type="checkbox" checked={value === 'true'} onChange={(event) => onChange(String(event.target.checked))} />
        <span>{field.label}</span>
      </label>
    );
  }

  return (
    <label className="ai-dynamic-field">
      <span>{field.label}</span>
      <input type={field.type === 'file' ? 'text' : field.type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} />
    </label>
  );
}

export default function AIWorkbench({ mode = 'tools' }: AIWorkbenchProps) {
  const initialTool = mode === 'assistant' ? aiTools[0] : aiTools.find((tool) => tool.id !== 'suite-assistant') || aiTools[0];
  const [selectedToolId, setSelectedToolId] = useState(initialTool.id);
  const selectedTool = useMemo(() => aiTools.find((tool) => tool.id === selectedToolId) || aiTools[0], [selectedToolId]);
  const selectedFields = useMemo(() => sourceAIToolFieldsByToolId[selectedTool.id] || [], [selectedTool.id]);
  const [input, setInput] = useState(selectedTool.defaultPrompt);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => buildFieldValues(sourceAIToolFieldsByToolId[initialTool.id] || []));
  const [result, setResult] = useState<AIResult | null>(null);
  const [savedResults, setSavedResults] = useState<AIResult[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const request = useRef<AbortController | null>(null);
  const selectedSavedResult = useMemo(
    () => savedResults.find((saved) => (saved.id || saved.createdAt) === selectedSavedId) || savedResults[0] || null,
    [savedResults, selectedSavedId],
  );

  useEffect(() => {
    const controller = new AbortController();
    async function loadSavedResults() {
      try {
        const response = await fetch('/api/ai-tools/run', { cache: 'no-store', signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Saved AI results could not be loaded.');
        const next = Array.isArray(payload.results) ? payload.results as AIResult[] : [];
        setSavedResults(next);
        setSelectedSavedId(next[0]?.id || next[0]?.createdAt || '');
      } catch (loadError) {
        if (!controller.signal.aborted) setHistoryError(loadError instanceof Error ? loadError.message : 'Saved AI results could not be loaded.');
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    }
    void loadSavedResults();
    return () => controller.abort();
  }, []);

  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  const cancelRequest = () => { request.current?.abort(); request.current = null; setRunning(false); setResult(null); setError(''); setStatus('Request canceled. Your inputs are ready to edit.'); };

  const selectTool = (tool: AIToolDefinition) => {
    request.current?.abort(); request.current = null; setRunning(false); setStatus('');
    setSelectedToolId(tool.id);
    setInput(tool.defaultPrompt);
    setFieldValues(buildFieldValues(sourceAIToolFieldsByToolId[tool.id] || []));
    setResult(null);
    setError('');
  };

  const applyPreset = (preset: PresetDefinition) => {
    const profile = promptPresets.indexOf(preset);
    setInput(preset.buildPrompt(selectedTool));
    setFieldValues(Object.fromEntries(selectedFields.map(field => [field.name, sampleForField(field, selectedTool, profile)])));
    setStatus('Every active input is filled, including optional fields. Review this planning example before generating.');
    setResult(null);
    setError('');
  };

  const applySignal = (signal: string) => {
    setInput(
      selectedTool.defaultPrompt +
        '\n\nFocus area: ' +
        signal +
        '\n\nReturn a professional result with summary, risks, recommended next actions, owners, and validation checks.',
    );
    setResult(null);
    setError('');
  };

  const fillDefaults = () => { setInput(selectedTool.defaultPrompt); setFieldValues(buildFieldValues(selectedFields)); setResult(null); setError(''); };
  const fillSamples = () => applyPreset(promptPresets[0]);
  const clearFields = () => setFieldValues(Object.fromEntries(selectedFields.map((field) => [field.name, ''])));

  const updateField = (name: string, value: string) => {
    setFieldValues((current) => ({ ...current, [name]: value }));
    setResult(null);
    setError('');
  };

  const runTool = async () => {
    if (request.current) return;
    const missing = selectedFields.find(field => field.required && !String(fieldValues[field.name] || '').trim());
    if (missing || !input.trim()) { setError(missing ? missing.label + ' is required.' : 'Enter a question or context.'); return; }
    const controller = new AbortController(); request.current = controller; setStatus(''); setResult(null);
    const requestInput = formatInput(input, selectedFields, fieldValues);
    setRunning(true);
    setError('');
    try {
      const response = await fetch('/api/ai-tools/run', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: selectedTool.id, input: requestInput, fields: fieldValues }),
      });
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(data.error || 'The AI report could not complete.');
      const completed = data as AIResult;
      setResult(completed);
      setSavedResults((current) => [completed, ...current.filter((saved) => (saved.id || saved.createdAt) !== (completed.id || completed.createdAt))].slice(0, 25));
      setSelectedSavedId(completed.id || completed.createdAt);
      setHistoryError('');
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'AI tool failed');
    } finally {
      if (request.current === controller) { request.current = null; setRunning(false); }
    }
  };

  return (
    <div className="card stack ai-workbench">
      <div className="section-head">
        <div>
          <div className="pill">AI Workbench</div>
          <h3>{mode === 'assistant' ? 'Suite AI Assistant' : 'Suite AI Tools'}</h3>
          <div className="muted">Cards are generated from this suite&apos;s merged capabilities, source systems, and extracted donor AI fields.</div>
        </div>
        <button className="button primary" type="button" onClick={runTool} disabled={running}>
          {running ? 'Generating…' : 'Generate with OpenRouter'}
        </button>
        {running && <button type="button" className="button secondary" onClick={cancelRequest}>Cancel request</button>}
      </div>
      {status && <p role="status" className="muted">{status}</p>}

      <div className="ai-tool-grid">
        {aiTools.map((tool) => (
          <button key={tool.id} data-tool-id={tool.id} type="button" className={tool.id === selectedTool.id ? 'ai-tool-card active' : 'ai-tool-card'} onClick={() => selectTool(tool)}>
            <span className="ai-tool-category">{tool.category}</span>
            <strong>{tool.title}</strong>
            <span>{tool.description}</span>
            <span className="ai-tool-signals">{tool.signals.slice(0, 3).join(' / ')}</span>
          </button>
        ))}
      </div>

      <div className="grid columns-2 ai-run-panel">
        <div className="stack">
          <span className="muted" style={{ fontWeight: 700 }}>{selectedTool.inputLabel}</span>
          <div className="ai-preset-panel">
            <div className="ai-preset-grid">
              {promptPresets.map((preset) => (
                <button key={preset.id} className="ai-preset-button" type="button" disabled={running} onClick={() => applyPreset(preset)}>
                  <strong>{preset.label}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>
            {selectedTool.signals.length ? (
              <div className="ai-signal-row">
                {selectedTool.signals.slice(0, 8).map((signal) => (
                  <button key={signal} className="tag-link" type="button" disabled={running} onClick={() => applySignal(signal)}>
                    {signal}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {selectedFields.length ? (
            <div className="ai-dynamic-fields">
              <div className="section-head compact">
                <div>
                  <h4>Extracted AI Fields</h4>
                  <div className="muted">{selectedFields.length} donor fields mapped for this tool.</div>
                </div>
                <div className="inline-links">
                  <button className="button subtle" type="button" disabled={running} onClick={fillDefaults}>Defaults</button>
                  <button className="button subtle" type="button" disabled={running} onClick={fillSamples}>Fill Samples</button>
                  <button className="button subtle" type="button" disabled={running} onClick={clearFields}>Clear</button>
                </div>
              </div>
              <fieldset disabled={running} className="ai-dynamic-field-grid" style={{border: 0, margin: 0, padding: 0}}>
                {selectedFields.map((field) => (
                  <DynamicField key={field.name} field={field} value={fieldValues[field.name] || ''} onChange={(value) => updateField(field.name, value)} />
                ))}
              </fieldset>
            </div>
          ) : null}

          <textarea disabled={running} value={input} onChange={(event) => setInput(event.target.value)} rows={10} />

        </div>
        <div className="stack">
          <div className="muted" style={{ fontWeight: 700 }}>{selectedTool.outputLabel}</div>
          <div className="ai-response-box">
            {error ? <div className="error-text">{error}</div> : null}
            {result ? (
              <AIResultReport result={result} fields={selectedFields} fieldValues={fieldValues} />
            ) : (
              <div className="ai-empty-result">
                <div className="pill">Ready</div>
                <h4>Professional AI result preview</h4>
                <p>Select presets, fill extracted source fields, review the request, then send it to generate a structured report.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SavedAIResults
        results={savedResults}
        selected={selectedSavedResult}
        loading={historyLoading}
        error={historyError}
        onSelect={setSelectedSavedId}
      />
    </div>
  );
}
