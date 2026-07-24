import { NextRequest, NextResponse } from 'next/server';
import { aiTools, getAITool } from '@/lib/aiTools';
import { appendAuditEntry } from '@/lib/auditStore';
import { requireSession } from '@/lib/requestAuth';
import { ensurePostgres } from '@/lib/postgres';

async function callConfiguredAI(system: string, prompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENROUTER_BASE_URL;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !baseUrl || !model) throw new Error('OpenRouter runtime is not configured');

  const response = await fetch(baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error('AI provider returned ' + response.status);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content as string | undefined;
  if (!content?.trim()) throw new Error('AI provider returned an empty response');
  return { content: content.trim(), model };
}

export async function GET(request: NextRequest) {
  const session = requireSession(request);
  if (session instanceof NextResponse) return session;
  return NextResponse.json({ tools: aiTools });
}

export async function POST(request: NextRequest) {
  const session = requireSession(request);
  if (session instanceof NextResponse) return session;

  const body = await request.json().catch(() => null) as { toolId?: string; input?: string } | null;
  const tool = getAITool(body?.toolId || 'suite-assistant');
  const input = body?.input?.trim();
  if (!input) return NextResponse.json({ error: 'Input is required' }, { status: 400 });
  const system = 'You are ' + tool.title + '. Stay inside this suite workflow. Return concise operational guidance with risks, next actions, and audit notes.';

  const aiResponse = await callConfiguredAI(system, input);
  const db = await ensurePostgres();
  const inserted = await db.query<{ id: string }>(`INSERT INTO vendor_app_ai_results
    (tenant_id, identity_id, feature, input, output, model)
    VALUES($1, $2, $3, $4, $5, $6) RETURNING id`,
    [session.tenantId, session.identityId, tool.id, input, aiResponse.content, aiResponse.model]);

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
}
