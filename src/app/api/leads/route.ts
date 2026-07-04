import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as LeadService from '@/services/lead.service';
import { z } from 'zod';

const CreateSchema = z.object({
  companyId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const rawStatus = searchParams.get('status');
  const leads = await LeadService.list({
    search: searchParams.get('search') ?? undefined,
    status: rawStatus ? (rawStatus as import('@prisma/client').LeadStatus) : undefined,
    source: searchParams.get('source') ?? undefined,
  });

  return NextResponse.json({ data: leads });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 });

  const lead = await LeadService.create(parsed.data, session.user.id);
  return NextResponse.json({ data: lead }, { status: 201 });
}
