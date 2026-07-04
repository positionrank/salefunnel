import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as DraftService from '@/services/draft.service';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const draft = await DraftService.approve(params.id, session.user.id);
  return NextResponse.json({ data: draft });
}
