import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as CampaignService from '@/services/campaign.service';
import { z } from 'zod';

const UpdateSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  leadId: z.string().uuid().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const campaign = await CampaignService.getById(params.id);
  if (!campaign) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ data: campaign });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 });

  if (parsed.data.status) {
    await CampaignService.updateStatus(params.id, parsed.data.status, session.user.id);
  }
  if (parsed.data.leadId) {
    await CampaignService.addLead(params.id, parsed.data.leadId, session.user.id);
  }

  const campaign = await CampaignService.getById(params.id);
  return NextResponse.json({ data: campaign });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  await CampaignService.remove(params.id);
  return new NextResponse(null, { status: 204 });
}
