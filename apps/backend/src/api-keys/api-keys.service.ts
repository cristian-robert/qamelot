import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { ApiKeyCreatedDto, ApiKeyDto } from '@app/shared';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: { name: string; projectId: string; expiresAt?: string },
    userId: string,
  ): Promise<ApiKeyCreatedDto> {
    await this.verifyProject(data.projectId);

    const rawKey = `qam_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: data.name,
        keyHash,
        keyPrefix,
        projectId: data.projectId,
        createdById: userId,
        ...(data.expiresAt && { expiresAt: new Date(data.expiresAt) }),
      },
    });

    this.logger.log(`API key "${data.name}" created for project ${data.projectId}`);

    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      projectId: apiKey.projectId,
      createdById: apiKey.createdById,
      lastUsedAt: null,
      expiresAt: apiKey.expiresAt?.toISOString() ?? null,
      revokedAt: null,
      createdAt: apiKey.createdAt.toISOString(),
      rawKey,
    };
  }

  async listByProject(projectId: string): Promise<ApiKeyDto[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: { projectId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      projectId: k.projectId,
      createdById: k.createdById,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      expiresAt: k.expiresAt?.toISOString() ?? null,
      revokedAt: k.revokedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  }

  async revoke(keyId: string, projectId: string): Promise<ApiKeyDto> {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, projectId, revokedAt: null },
    });
    if (!key) throw new NotFoundException('API key not found');

    const updated = await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`API key "${key.name}" revoked`);

    return {
      id: updated.id,
      name: updated.name,
      keyPrefix: updated.keyPrefix,
      projectId: updated.projectId,
      createdById: updated.createdById,
      lastUsedAt: updated.lastUsedAt?.toISOString() ?? null,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
      revokedAt: updated.revokedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  private async verifyProject(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
