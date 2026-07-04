import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  subject: z.string().min(1),
  bodyText: z.string().min(1),
  bodyHtml: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const templates = await db.emailTemplate.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ data: templates });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 });

  const template = await db.emailTemplate.create({ data: { ...parsed.data, variables: parsed.data.variables ?? [] } });
  return NextResponse.json({ data: template }, { status: 201 });
}
