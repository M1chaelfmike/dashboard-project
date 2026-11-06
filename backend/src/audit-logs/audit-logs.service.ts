
import { Injectable } from '@nestjs/common';

import type {
  AuditLogCategory,
  AuditLogResult,
  UserRole,
  Prisma,
} from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';


export interface AuditActorContext {
  actorId: string;
  actorName: string | null;
  actorRole: UserRole;

  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Audit log write input.
 *
 * Only pass explicitly selected, non-sensitive metadata.
 */
export interface CreateAuditLogInput {
  category: AuditLogCategory;
  action: string;
  result: AuditLogResult;

  actorId?: string | null;
  actorName?: string | null;
  actorRole?: UserRole | null;

  targetType?: string | null;
  targetId?: string | null;
  targetName?: string | null;

  metadata?: Prisma.InputJsonValue;

  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Remove sensitive properties recursively from metadata.
 */
const SENSITIVE_KEY_PATTERN =
  /password|token|cookie|authorization|secret|credential/i;

function sanitizeMetadata(
  value: Prisma.InputJsonValue,
): Prisma.InputJsonValue {
  if (Array.isArray(value)) {
    return value.map((item) =>
      item === null ? null : sanitizeMetadata(item),
    );
  }

  if (typeof value === 'object' && value !== null) {
    const sanitized: Record<
      string,
      Prisma.InputJsonValue | null
    > = {};

    for (const [key, nested] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        continue;
      }

      sanitized[key] =
        nested === null
          ? null
          : sanitizeMetadata(nested as Prisma.InputJsonValue);
    }

    return sanitized;
  }

  return value;
}

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Write an audit log.
   *
   * When tx is provided, the audit record participates
   * in the caller's database transaction.
   *
   * Errors are intentionally not swallowed.
   */
  async record(
    input: CreateAuditLogInput,
    tx?: Prisma.TransactionClient,
  ) {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      category: input.category,
      action: input.action,
      result: input.result,

      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      actorRole: input.actorRole ?? null,

      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      targetName: input.targetName ?? null,

      ...(input.metadata !== undefined
        ? { metadata: sanitizeMetadata(input.metadata) }
        : {}),

      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    };

    if (tx) {
      return tx.auditLog.create({ data });
    }

    return this.prisma.auditLog.create({ data });
  }
}
