import type { Pool, PoolClient } from 'pg';

export class WorkbenchAIError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function requestWorkbenchAI(system: string, prompt: string, signal: AbortSignal) {
  signal.throwIfAborted();
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
  if (!apiKey || !model || baseUrl !== 'https://openrouter.ai/api/v1') throw new WorkbenchAIError('OpenRouter is not configured for this workspace.', 503);
  const provider = new AbortController();
  const cancel = () => provider.abort(signal.reason);
  signal.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => provider.abort(new DOMException('Provider request timed out.', 'TimeoutError')), 120000);
  try {
  signal.throwIfAborted();
  const response = await fetch(baseUrl + '/chat/completions', {
    method: 'POST', signal: provider.signal,
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }], temperature: 0.2 }),
  });
  if (!response.ok) throw new WorkbenchAIError('OpenRouter could not complete the request. Try again shortly.', 502);
  const payload = await response.json();
  provider.signal.throwIfAborted();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new WorkbenchAIError('OpenRouter returned no substantive report.', 502);
  return { content: content.trim(), model: String(payload.model || model), providerReceipt: { id: String(payload.id || ''), provider: 'openrouter', created: payload.created ?? null }, usage: payload.usage ?? null };
  } finally { clearTimeout(timeout); signal.removeEventListener('abort', cancel); }
}

/** Keep the existing insert in its native pool and roll back cancellation during I/O. */
export async function persistWorkbenchResult<T>(signal: AbortSignal, pool: Pick<Pool, 'connect'>, work: (client: PoolClient) => Promise<T>): Promise<T> {
  signal.throwIfAborted();
  const client = await pool.connect();
  let began = false;
  try {
    signal.throwIfAborted();
    await client.query('BEGIN'); began = true;
    signal.throwIfAborted();
    const result = await work(client);
    signal.throwIfAborted();
    await client.query('COMMIT'); began = false;
    return result;
  } catch (error) {
    if (began) await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

export function workbenchError(error: unknown, signal: AbortSignal) {
  if (signal.aborted) return { error: 'AI request cancelled.', status: 499 };
  if (error instanceof WorkbenchAIError) return { error: error.message, status: error.status };
  return { error: 'The AI report could not complete. Try again shortly.', status: 502 };
}
