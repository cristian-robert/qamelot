import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateConfigGroupInput, UpdateConfigGroupInput, CreateConfigItemInput, UpdateConfigItemInput } from '@app/shared';

@Injectable()
export class ConfigsService {
  private readonly logger = new Logger(ConfigsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Config Groups ──

  async createGroup(projectId: string, data: CreateConfigGroupInput) {
    await this.verifyProject(projectId);

    const group = await this.prisma.configGroup.create({
      data: {
        name: data.name,
        projectId,
      },
      include: { items: true },
    });

    this.logger.log(`Config group created: ${group.id} in project ${projectId}`);
    return group;
  }

  async findAllGroups(projectId: string) {
    await this.verifyProject(projectId);

    return this.prisma.configGroup.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findOneGroup(id: string) {
    const group = await this.prisma.configGroup.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!group) {
      throw new NotFoundException('Config group not found');
    }
    return group;
  }

  async updateGroup(id: string, data: UpdateConfigGroupInput) {
    await this.verifyGroup(id);

    return this.prisma.configGroup.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
      },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async softDeleteGroup(id: string) {
    await this.verifyGroup(id);

    return this.prisma.configGroup.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Config Items ──

  async createItem(groupId: string, data: CreateConfigItemInput) {
    await this.verifyGroup(groupId);

    const item = await this.prisma.configItem.create({
      data: {
        name: data.name,
        groupId,
      },
    });

    this.logger.log(`Config item created: ${item.id} in group ${groupId}`);
    return item;
  }

  async updateItem(id: string, data: UpdateConfigItemInput) {
    await this.verifyItem(id);

    return this.prisma.configItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
      },
    });
  }

  async softDeleteItem(id: string) {
    await this.verifyItem(id);

    return this.prisma.configItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Helpers ──

  private async verifyProject(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private async verifyGroup(id: string) {
    const group = await this.prisma.configGroup.findFirst({
      where: { id, deletedAt: null },
    });
    if (!group) {
      throw new NotFoundException('Config group not found');
    }
    return group;
  }

  private async verifyItem(id: string) {
    const item = await this.prisma.configItem.findFirst({
      where: { id, deletedAt: null },
    });
    if (!item) {
      throw new NotFoundException('Config item not found');
    }
    return item;
  }
}
