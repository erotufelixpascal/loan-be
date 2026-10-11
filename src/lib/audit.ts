import { AppDataSource } from '../config/data-source';
import { AuditLog } from '../entities/audit-log.entity';

export async function recordAudit(entry: {
  actorId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await AppDataSource.getRepository(AuditLog).save({
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: entry.metadata ?? null,
  });
}
