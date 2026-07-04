import { Badge } from '@/components/ui/badge';
import type { LeadStatus } from '@prisma/client';

const STATUS_CONFIG: Record<LeadStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'purple' | 'outline' }> = {
  NEW:               { label: 'New',               variant: 'default' },
  ENRICHING:         { label: 'Enriching…',         variant: 'warning' },
  ENRICHED:          { label: 'Enriched',           variant: 'outline' },
  ENRICHMENT_FAILED: { label: 'Enrich Failed',      variant: 'danger' },
  READY:             { label: 'Ready',              variant: 'success' },
  IN_CAMPAIGN:       { label: 'In Campaign',        variant: 'purple' },
  REPLIED:           { label: 'Replied',            variant: 'success' },
  OPTED_OUT:         { label: 'Opted Out',          variant: 'danger' },
  ARCHIVED:          { label: 'Archived',           variant: 'secondary' },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
