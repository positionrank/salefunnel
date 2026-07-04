import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as CompanyService from '@/services/company.service';
import { z } from 'zod';

const CreateSchema = z.object({
  name: z.string().min(1),
  website: z.string().url().optional().or(z.literal('')),
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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const search = req.nextUrl.searchParams.get('search') ?? undefined;
  const companies = await CompanyService.list(search);
  return NextResponse.json({ data: companies });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 });

  const company = await CompanyService.create(parsed.data, session.user.id);
  return NextResponse.json({ data: company }, { status: 201 });
}
