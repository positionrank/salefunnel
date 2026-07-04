import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as LeadService from '@/services/lead.service';
import { z } from 'zod';

const UpdateSchema = z.object({
  status: z.enum(['NEW','ENRICHING','ENRICHED','ENRICHMENT_FAILED','READY','IN_CAMPAIGN','REPLIED','OPTED_OUT','ARCHIVED']).optional(),
  notes: z.string().optional(),
  contactId: z.string().uuid().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const lead = await LeadService.getById(params.id);
  if (!lead) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  return NextResponse.json({ data: lead });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 });

  const { status, ...rest } = parsed.data;
  if (status) await LeadService.updateStatus(params.id, status, session.user.id);
  if (Object.keys(rest).length) await LeadService.update(params.id, rest);

  const lead = await LeadService.getById(params.id);
  return NextResponse.json({ data: lead });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  await LeadService.remove(params.id);
  return new NextResponse(null, { status: 204 });
}
