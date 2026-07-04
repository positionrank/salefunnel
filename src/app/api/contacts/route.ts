import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as ContactService from '@/services/contact.service';
import { z } from 'zod';

const CreateSchema = z.object({
  companyId: z.string().uuid().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  linkedinUrl: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const contacts = await ContactService.list(
    searchParams.get('companyId') ?? undefined,
    searchParams.get('search') ?? undefined,
  );
  return NextResponse.json({ data: contacts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 });

  const contact = await ContactService.create(parsed.data);
  return NextResponse.json({ data: contact }, { status: 201 });
}
