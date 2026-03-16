import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SharedStepItemInput {
  description: string;
  expectedResult: string;
}

interface CreateSharedStepData {
  title: string;
  items: SharedStepItemInput[];
}

interface UpdateSharedStepData {
  title?: string;
  items?: SharedStepItemInput[];
}

@Injectable()
export class SharedStepsService {
  private readonly logger = new Logger(SharedStepsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, data: CreateSharedStepData) {
    await this.verifyProject(projectId);

    return this.prisma.sharedStep.create({
      data: {
        title: data.title,
        projectId,
        items: {
          create: data.items.map((item, index) => ({
            stepNumber: index + 1,
            description: item.description,
            expectedResult: item.expectedResult,
          })),
        },
      },
      include: { items: { orderBy: { stepNumber: 'asc' } } },
    });
  }

  async findAllByProject(projectId: string) {
    await this.verifyProject(projectId);

    return this.prisma.sharedStep.findMany({
      where: { projectId, deletedAt: null },
      include: { items: { orderBy: { stepNumber: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(projectId: string, id: string) {
    await this.verifyProject(projectId);

    const sharedStep = await this.prisma.sharedStep.findFirst({
      where: { id, projectId, deletedAt: null },
      include: { items: { orderBy: { stepNumber: 'asc' } } },
    });
    if (!sharedStep) {
      throw new NotFoundException('Shared step not found');
    }
    return sharedStep;
  }

  async update(projectId: string, id: string, data: UpdateSharedStepData) {
    await this.verifyProject(projectId);
    await this.verifySharedStepInProject(id, projectId);

    return this.prisma.$transaction(async (tx) => {
      if (data.title !== undefined) {
        await tx.sharedStep.update({
          where: { id },
          data: { title: data.title },
        });
      }

      if (data.items !== undefined) {
        // Delete existing items and recreate
        await tx.sharedStepItem.deleteMany({ where: { sharedStepId: id } });
        await tx.sharedStepItem.createMany({
          data: data.items.map((item, index) => ({
            sharedStepId: id,
            stepNumber: index + 1,
            description: item.description,
            expectedResult: item.expectedResult,
          })),
        });
      }

      return tx.sharedStep.findUnique({
        where: { id },
        include: { items: { orderBy: { stepNumber: 'asc' } } },
      });
    });
  }

  async softDelete(projectId: string, id: string) {
    await this.verifyProject(projectId);
    await this.verifySharedStepInProject(id, projectId);

    return this.prisma.sharedStep.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { items: { orderBy: { stepNumber: 'asc' } } },
    });
  }

  private async verifyProject(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async verifySharedStepInProject(id: string, projectId: string) {
    const sharedStep = await this.prisma.sharedStep.findFirst({
      where: { id, projectId, deletedAt: null },
    });
    if (!sharedStep) {
      throw new NotFoundException('Shared step not found');
    }
    return sharedStep;
  }
}
