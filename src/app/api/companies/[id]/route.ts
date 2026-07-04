import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as CompanyService from '@/services/company.service';
import { z } from 'zod';

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  website: z.string().optional(),
  domain: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  linkedinUrl: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const company = await CompanyService.getById(params.id);
  if (!company) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ data: company });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 });

  const company = await CompanyService.update(params.id, parsed.data);
  return NextResponse.json({ data: company });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  await CompanyService.remove(params.id);
  return new NextResponse(null, { status: 204 });
}
