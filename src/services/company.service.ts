import { db } from '@/lib/db';
import { log } from './activity.service';

export interface CreateCompanyInput {
  name: string;
  website?: string;
  domain?: string;
  description?: string;
  industry?: string;
  size?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  linkedinUrl?: string;
  notes?: string;
}

export interface UpdateCompanyInput extends Partial<CreateCompanyInput> {}

export async function list(search?: string) {
  return db.company.findMany({
    where: {
      active: true,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { leads: true, contacts: true } } },
  });
}

export async function getById(id: string) {
  return db.company.findFirst({
    where: { id, active: true },
    include: {
      contacts: { where: { active: true } },
      leads: {
        where: { active: true },
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
      },
      enrichmentRecords: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
}

export async function create(input: CreateCompanyInput, userId?: string) {
  const company = await db.company.create({ data: input });
  await log({ type: 'LEAD_CREATED', description: `Company "${company.name}" created`, userId, metadata: { companyId: company.id } });
  return company;
}

export async function update(id: string, input: UpdateCompanyInput) {
  return db.company.update({ where: { id }, data: input });
}

export async function remove(id: string) {
  return db.company.update({ where: { id }, data: { active: false, deletedAt: new Date() } });
}
