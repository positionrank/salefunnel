import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as CampaignService from '@/services/campaign.service';
import { z } from 'zod';

const SequenceSchema = z.object({
  stepNumber: z.number().int().min(1),
  name: z.string().min(1),
  subject: z.string().optional(),
  templateId: z.string().uuid().optional(),
  delayDays: z.number().int().min(0),
});

const CreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  autoSend: z.boolean().default(false),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional(),
  dailySendLimit: z.number().int().min(1).max(500).default(50),
  sequences: z.array(SequenceSchema).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const campaigns = await CampaignService.list();
  return NextResponse.json({ data: campaigns });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 });

  const campaign = await CampaignService.create(parsed.data, session.user.id);
  return NextResponse.json({ data: campaign }, { status: 201 });
}
