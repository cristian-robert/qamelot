import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MilestoneStatus,
  type CreateMilestoneInput,
  type UpdateMilestoneInput,
  type MilestoneTreeNode,
  type MilestoneProgress,
} from '@app/shared';

interface MilestoneRow {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  parentId: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  status: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, data: CreateMilestoneInput) {
    await this.verifyProject(projectId);

    if (data.parentId) {
      await this.verifyParentMilestone(data.parentId, projectId);
    }

    return this.prisma.milestone.create({
      data: {
        name: data.name,
        ...(data.description !== undefined && { description: data.description }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        projectId,
      },
    });
  }

  async findAllByProject(
    projectId: string,
    filters?: { status?: string },
  ) {
    await this.verifyProject(projectId);

    return this.prisma.milestone.findMany({
      where: {
        projectId,
        deletedAt: null,
        ...(filters?.status && { status: filters.status as 'OPEN' | 'CLOSED' }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTreeByProject(projectId: string): Promise<MilestoneTreeNode[]> {
    await this.verifyProject(projectId);

    const milestones = await this.prisma.milestone.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return this.buildTree(milestones as MilestoneRow[]);
  }

  async findOne(id: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: { id, deletedAt: null },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    return milestone;
  }

  async update(id: string, data: UpdateMilestoneInput) {
    const result = await this.prisma.milestone.updateMany({
      where: { id, deletedAt: null },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
    if (result.count === 0) {
      throw new NotFoundException('Milestone not found');
    }
    return this.prisma.milestone.findUnique({ where: { id } });
  }

  async softDelete(id: string) {
    const result = await this.prisma.milestone.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Milestone not found');
    }
    return this.prisma.milestone.findUnique({ where: { id } });
  }

  /** Build a tree from a flat list of milestones with progress aggregation */
  buildTree(milestones: MilestoneRow[]): MilestoneTreeNode[] {
    const map = new Map<string, MilestoneTreeNode>();

    for (const m of milestones) {
      map.set(m.id, {
        id: m.id,
        name: m.name,
        description: m.description,
        projectId: m.projectId,
        parentId: m.parentId,
        startDate: m.startDate?.toISOString() ?? null,
        dueDate: m.dueDate?.toISOString() ?? null,
        status: m.status as MilestoneStatus,
        deletedAt: m.deletedAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        children: [],
        progress: { open: 0, closed: 0, total: 0, percent: 0 },
      });
    }

    const roots: MilestoneTreeNode[] = [];

    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortByName = (a: MilestoneTreeNode, b: MilestoneTreeNode) =>
      a.name.localeCompare(b.name);

    function sortRecursive(nodes: MilestoneTreeNode[]) {
      nodes.sort(sortByName);
      for (const n of nodes) {
        sortRecursive(n.children);
      }
    }

    sortRecursive(roots);

    // Compute progress bottom-up
    function computeProgress(node: MilestoneTreeNode): MilestoneProgress {
      let open = node.status === 'OPEN' ? 1 : 0;
      let closed = node.status === 'CLOSED' ? 1 : 0;

      for (const child of node.children) {
        const childProgress = computeProgress(child);
        open += childProgress.open;
        closed += childProgress.closed;
      }

      const total = open + closed;
      const percent = total > 0 ? Math.round((closed / total) * 100) : 0;

      node.progress = { open, closed, total, percent };
      return node.progress;
    }

    for (const root of roots) {
      computeProgress(root);
    }

    return roots;
  }

  private async verifyProject(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async verifyParentMilestone(parentId: string, projectId: string) {
    const parent = await this.prisma.milestone.findFirst({
      where: { id: parentId, projectId, deletedAt: null },
    });
    if (!parent) {
      throw new BadRequestException(
        'Parent milestone not found or belongs to a different project',
      );
    }
  }
}
