import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as ImportService from '@/services/import.service';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.rows || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: 'rows array required' }, { status: 400 });
  }

  const result = await ImportService.importCsv(body.rows, body.fileName ?? 'upload.csv', session.user.id);
  return NextResponse.json({ data: result }, { status: 201 });
}
