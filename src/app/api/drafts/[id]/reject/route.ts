import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as DraftService from '@/services/draft.service';
import { z } from 'zod';

const Schema = z.object({ reason: z.string().optional() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { reason } = Schema.parse(body);
  const draft = await DraftService.reject(params.id, session.user.id, reason);
  return NextResponse.json({ data: draft });
}
