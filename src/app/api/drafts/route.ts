import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as DraftService from '@/services/draft.service';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const drafts = await DraftService.listPendingApproval();
  return NextResponse.json({ data: drafts });
}
