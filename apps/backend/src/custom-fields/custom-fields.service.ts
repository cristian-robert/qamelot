import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CustomFieldEntityType, CustomFieldType } from '@app/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomFieldDefinitionDto } from './dto/create-custom-field-definition.dto';
import { UpdateCustomFieldDefinitionDto } from './dto/update-custom-field-definition.dto';
import { SetCustomFieldValuesDto } from './dto/set-custom-field-values.dto';

@Injectable()
export class CustomFieldsService {
  private readonly logger = new Logger(CustomFieldsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Create a new custom field definition for a project */
  async createDefinition(projectId: string, dto: CreateCustomFieldDefinitionDto) {
    await this.ensureProjectExists(projectId);

    if (dto.fieldType === CustomFieldType.DROPDOWN && (!dto.options || dto.options.length === 0)) {
      throw new BadRequestException('Options are required for dropdown fields');
    }

    return this.prisma.customFieldDefinition.create({
      data: {
        name: dto.name,
        fieldType: dto.fieldType,
        options: dto.fieldType === CustomFieldType.DROPDOWN && dto.options
          ? dto.options
          : Prisma.DbNull,
        required: dto.required ?? false,
        entityType: dto.entityType,
        projectId,
        position: dto.position ?? 0,
      },
    });
  }

  /** List all custom field definitions for a project, optionally filtered by entity type */
  async findDefinitions(projectId: string, entityType?: CustomFieldEntityType) {
    await this.ensureProjectExists(projectId);

    return this.prisma.customFieldDefinition.findMany({
      where: {
        projectId,
        deletedAt: null,
        ...(entityType && { entityType }),
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** Get a single custom field definition */
  async findDefinition(projectId: string, definitionId: string) {
    const definition = await this.prisma.customFieldDefinition.findFirst({
      where: { id: definitionId, projectId, deletedAt: null },
    });

    if (!definition) {
      throw new NotFoundException('Custom field definition not found');
    }

    return definition;
  }

  /** Update a custom field definition */
  async updateDefinition(
    projectId: string,
    definitionId: string,
    dto: UpdateCustomFieldDefinitionDto,
  ) {
    await this.findDefinition(projectId, definitionId);

    const fieldType = dto.fieldType;
    if (fieldType === CustomFieldType.DROPDOWN && (!dto.options || dto.options.length === 0)) {
      throw new BadRequestException('Options are required for dropdown fields');
    }

    return this.prisma.customFieldDefinition.update({
      where: { id: definitionId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.fieldType !== undefined && { fieldType: dto.fieldType }),
        ...(dto.options !== undefined && { options: dto.options ?? Prisma.DbNull }),
        ...(dto.required !== undefined && { required: dto.required }),
        ...(dto.position !== undefined && { position: dto.position }),
      },
    });
  }

  /** Soft-delete a custom field definition */
  async deleteDefinition(projectId: string, definitionId: string) {
    await this.findDefinition(projectId, definitionId);

    return this.prisma.customFieldDefinition.update({
      where: { id: definitionId },
      data: { deletedAt: new Date() },
    });
  }

  /** Get custom field values for an entity */
  async getValues(entityType: CustomFieldEntityType, entityId: string) {
    return this.prisma.customFieldValue.findMany({
      where: { entityType, entityId },
      include: { definition: true },
    });
  }

  /** Set custom field values for an entity (upsert) */
  async setValues(
    entityType: CustomFieldEntityType,
    entityId: string,
    dto: SetCustomFieldValuesDto,
  ) {
    const definitionIds = dto.values.map((v) => v.definitionId);

    // Verify all definitions exist and match entity type
    const definitions = await this.prisma.customFieldDefinition.findMany({
      where: { id: { in: definitionIds }, deletedAt: null },
    });

    const definitionMap = new Map(definitions.map((d) => [d.id, d]));

    for (const val of dto.values) {
      const def = definitionMap.get(val.definitionId);
      if (!def) {
        throw new NotFoundException(`Custom field definition '${val.definitionId}' not found`);
      }
      if (def.entityType !== entityType) {
        throw new BadRequestException(
          `Field '${def.name}' is for ${def.entityType}, not ${entityType}`,
        );
      }
      this.validateValue(def, val.value);
    }

    // Upsert values in a transaction
    const results = await this.prisma.$transaction(
      dto.values.map((val) =>
        this.prisma.customFieldValue.upsert({
          where: {
            definitionId_entityId: {
              definitionId: val.definitionId,
              entityId,
            },
          },
          create: {
            definitionId: val.definitionId,
            entityType,
            entityId,
            value: val.value,
          },
          update: {
            value: val.value,
          },
        }),
      ),
    );

    return results;
  }

  /** Search entities by custom field values */
  async searchByFieldValue(
    projectId: string,
    definitionId: string,
    searchValue: string,
  ): Promise<string[]> {
    const definition = await this.findDefinition(projectId, definitionId);

    const values = await this.prisma.customFieldValue.findMany({
      where: {
        definitionId: definition.id,
        value: { contains: searchValue, mode: 'insensitive' },
      },
      select: { entityId: true },
    });

    return values.map((v) => v.entityId);
  }

  private validateValue(
    definition: { fieldType: string; options: unknown; name: string },
    value: string,
  ) {
    switch (definition.fieldType) {
      case CustomFieldType.NUMBER: {
        if (value !== '' && isNaN(Number(value))) {
          throw new BadRequestException(`Field '${definition.name}' requires a numeric value`);
        }
        break;
      }
      case CustomFieldType.CHECKBOX: {
        if (value !== 'true' && value !== 'false') {
          throw new BadRequestException(
            `Field '${definition.name}' requires a boolean value (true/false)`,
          );
        }
        break;
      }
      case CustomFieldType.DROPDOWN: {
        const options = definition.options as string[] | null;
        if (value !== '' && options && !options.includes(value)) {
          throw new BadRequestException(
            `Field '${definition.name}' value must be one of: ${options.join(', ')}`,
          );
        }
        break;
      }
      case CustomFieldType.DATE: {
        if (value !== '' && isNaN(Date.parse(value))) {
          throw new BadRequestException(`Field '${definition.name}' requires a valid date`);
        }
        break;
      }
      // STRING type: no validation needed
    }
  }

  private async ensureProjectExists(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }
}
