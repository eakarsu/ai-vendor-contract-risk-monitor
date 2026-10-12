import { requestWorkbenchAI, persistWorkbenchResult, workbenchError } from '@/lib/WorkbenchAIRuntime';
import { NextRequest, NextResponse } from 'next/server';
import { aiTools, getAITool } from '@/lib/aiTools';
import { appendAuditEntry } from '@/lib/auditStore';
import { requireSession } from '@/lib/requestAuth';
import { ensurePostgres } from '@/lib/postgres';

async function callConfiguredAI(system: string, prompt: string, signal: AbortSignal) { return requestWorkbenchAI(system, prompt, signal); }

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  const db = await ensurePostgres();
  const saved = await db.query<{
    id: string;
    feature: string;
    input: string;
    output: string;
    model: string;
    created_at: Date;
  }>(`SELECT id, feature, input, output, model, created_at
      FROM vendor_app_ai_results
      WHERE tenant_id = $1 AND identity_id = $2
      ORDER BY created_at DESC
      LIMIT 25`, [session.tenantId, session.identityId]);

  return NextResponse.json({
    tools: aiTools,
    results: saved.rows.map((row) => ({
      id: row.id,
      tool: getAITool(row.feature),
      input: row.input,
      response: row.output,
      provider: 'openrouter',
      model: row.model,
      createdAt: row.created_at.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) return session;

  try {
  const body = await request.json().catch(() => null) as { toolId?: string; input?: string } | null;
  const tool = getAITool(body?.toolId || 'suite-assistant');
  const input = body?.input?.trim();
  if (!input) return NextResponse.json({ error: 'Input is required' }, { status: 400 });
  const system = 'You are ' + tool.title + '. Stay inside this suite workflow. Return concise operational guidance with risks, next actions, and audit notes.';

  const aiResponse = await callConfiguredAI(system, input, request.signal);
  const db = await ensurePostgres();
  const inserted = await persistWorkbenchResult(request.signal, db, client => client.query<{ id: string }>(`INSERT INTO vendor_app_ai_results
    (tenant_id, identity_id, feature, input, output, model)
    VALUES($1, $2, $3, $4, $5, $6) RETURNING id`, [session.tenantId, session.identityId, tool.id, input, aiResponse.content, aiResponse.model]));

  request.signal.throwIfAborted();

  await appendAuditEntry('AI Tools', ((session.firstName + ' ' + session.lastName).trim() || session.email) + ' ran ' + tool.title);

  return NextResponse.json({
    tool,
    input,
    id: inserted.rows[0].id,
    response: aiResponse.content,
    provider: 'openrouter',
    model: aiResponse.model,
    createdAt: new Date().toISOString(),
  });
  } catch (error) { const failure = workbenchError(error, request.signal); return NextResponse.json({error: failure.error}, {status: failure.status}); }
}
