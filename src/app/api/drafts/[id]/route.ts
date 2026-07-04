import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as DraftService from '@/services/draft.service';
import { z } from 'zod';

const UpdateSchema = z.object({
  subject: z.string().min(1),
  bodyText: z.string().min(1),
  bodyHtml: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const draft = await DraftService.getById(params.id);
  if (!draft) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ data: draft });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 });
  const draft = await DraftService.update(params.id, parsed.data.subject, parsed.data.bodyText, parsed.data.bodyHtml);
  return NextResponse.json({ data: draft });
}
