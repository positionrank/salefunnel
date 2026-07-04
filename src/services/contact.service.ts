import { db } from '@/lib/db';
import type { ContactSource } from '@prisma/client';

export interface CreateContactInput {
  companyId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  source?: ContactSource;
  confidenceScore?: number;
  notes?: string;
}

export async function list(companyId?: string, search?: string) {
  return db.contact.findMany({
    where: {
      active: true,
      ...(companyId ? { companyId } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: { company: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getById(id: string) {
  return db.contact.findFirst({
    where: { id, active: true },
    include: { company: true, leads: { where: { active: true } } },
  });
}

export async function create(input: CreateContactInput) {
  const parts = [input.firstName, input.lastName].filter((p): p is string => Boolean(p));
  const fullName = input.fullName ?? (parts.length > 0 ? parts.join(' ') : undefined);
  return db.contact.create({ data: { ...input, fullName } });
}

export async function update(id: string, input: Partial<CreateContactInput>) {
  return db.contact.update({ where: { id }, data: input });
}

export async function remove(id: string) {
  return db.contact.update({ where: { id }, data: { active: false, deletedAt: new Date() } });
}
