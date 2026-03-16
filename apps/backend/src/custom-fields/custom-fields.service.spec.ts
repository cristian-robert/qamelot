import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomFieldType, CustomFieldEntityType } from '@app/shared';
import { CustomFieldsService } from './custom-fields.service';
import { PrismaService } from '../prisma/prisma.service';

const mockDefinition = {
  id: 'def-1',
  name: 'Browser',
  fieldType: CustomFieldType.DROPDOWN,
  options: ['Chrome', 'Firefox', 'Safari'],
  required: false,
  entityType: CustomFieldEntityType.TEST_CASE,
  projectId: 'proj-1',
  position: 0,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockValue = {
  id: 'val-1',
  definitionId: 'def-1',
  entityType: CustomFieldEntityType.TEST_CASE,
  entityId: 'case-1',
  value: 'Chrome',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CustomFieldsService', () => {
  let service: CustomFieldsService;
  let prisma: {
    project: { findFirst: jest.Mock };
    customFieldDefinition: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    customFieldValue: {
      findMany: jest.Mock;
      upsert: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      project: { findFirst: jest.fn() },
      customFieldDefinition: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      customFieldValue: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomFieldsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CustomFieldsService>(CustomFieldsService);
  });

  describe('createDefinition', () => {
    it('should create a custom field definition', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      prisma.customFieldDefinition.create.mockResolvedValue(mockDefinition);

      const result = await service.createDefinition('proj-1', {
        name: 'Browser',
        fieldType: CustomFieldType.DROPDOWN,
        options: ['Chrome', 'Firefox', 'Safari'],
        entityType: CustomFieldEntityType.TEST_CASE,
      });

      expect(result).toEqual(mockDefinition);
      expect(prisma.customFieldDefinition.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Browser',
          fieldType: CustomFieldType.DROPDOWN,
          options: ['Chrome', 'Firefox', 'Safari'],
          projectId: 'proj-1',
        }),
      });
    });

    it('should throw if project not found', async () => {
      prisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.createDefinition('proj-missing', {
          name: 'Test',
          fieldType: CustomFieldType.STRING,
          entityType: CustomFieldEntityType.TEST_CASE,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if dropdown field has no options', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });

      await expect(
        service.createDefinition('proj-1', {
          name: 'Test',
          fieldType: CustomFieldType.DROPDOWN,
          entityType: CustomFieldEntityType.TEST_CASE,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findDefinitions', () => {
    it('should return definitions for a project', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      prisma.customFieldDefinition.findMany.mockResolvedValue([mockDefinition]);

      const result = await service.findDefinitions('proj-1');

      expect(result).toEqual([mockDefinition]);
    });

    it('should filter by entity type', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      prisma.customFieldDefinition.findMany.mockResolvedValue([mockDefinition]);

      await service.findDefinitions('proj-1', CustomFieldEntityType.TEST_CASE);

      expect(prisma.customFieldDefinition.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: CustomFieldEntityType.TEST_CASE,
          }),
        }),
      );
    });
  });

  describe('updateDefinition', () => {
    it('should update a definition', async () => {
      prisma.customFieldDefinition.findFirst.mockResolvedValue(mockDefinition);
      prisma.customFieldDefinition.update.mockResolvedValue({
        ...mockDefinition,
        name: 'Updated',
      });

      const result = await service.updateDefinition('proj-1', 'def-1', {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
    });

    it('should throw if definition not found', async () => {
      prisma.customFieldDefinition.findFirst.mockResolvedValue(null);

      await expect(
        service.updateDefinition('proj-1', 'def-missing', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteDefinition', () => {
    it('should soft-delete a definition', async () => {
      prisma.customFieldDefinition.findFirst.mockResolvedValue(mockDefinition);
      prisma.customFieldDefinition.update.mockResolvedValue({
        ...mockDefinition,
        deletedAt: new Date(),
      });

      const result = await service.deleteDefinition('proj-1', 'def-1');

      expect(result.deletedAt).toBeTruthy();
      expect(prisma.customFieldDefinition.update).toHaveBeenCalledWith({
        where: { id: 'def-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('getValues', () => {
    it('should return values with definitions', async () => {
      prisma.customFieldValue.findMany.mockResolvedValue([
        { ...mockValue, definition: mockDefinition },
      ]);

      const result = await service.getValues(
        CustomFieldEntityType.TEST_CASE,
        'case-1',
      );

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('Chrome');
    });
  });

  describe('setValues', () => {
    it('should upsert values in a transaction', async () => {
      prisma.customFieldDefinition.findMany.mockResolvedValue([mockDefinition]);
      prisma.$transaction.mockResolvedValue([mockValue]);

      const result = await service.setValues(
        CustomFieldEntityType.TEST_CASE,
        'case-1',
        { values: [{ definitionId: 'def-1', value: 'Chrome' }] },
      );

      expect(result).toEqual([mockValue]);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw if definition not found', async () => {
      prisma.customFieldDefinition.findMany.mockResolvedValue([]);

      await expect(
        service.setValues(CustomFieldEntityType.TEST_CASE, 'case-1', {
          values: [{ definitionId: 'def-missing', value: 'test' }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if entity type mismatch', async () => {
      prisma.customFieldDefinition.findMany.mockResolvedValue([mockDefinition]);

      await expect(
        service.setValues(CustomFieldEntityType.TEST_RESULT, 'result-1', {
          values: [{ definitionId: 'def-1', value: 'Chrome' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate number field values', async () => {
      const numDef = {
        ...mockDefinition,
        fieldType: CustomFieldType.NUMBER,
        options: null,
      };
      prisma.customFieldDefinition.findMany.mockResolvedValue([numDef]);

      await expect(
        service.setValues(CustomFieldEntityType.TEST_CASE, 'case-1', {
          values: [{ definitionId: 'def-1', value: 'not-a-number' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate checkbox field values', async () => {
      const checkDef = {
        ...mockDefinition,
        fieldType: CustomFieldType.CHECKBOX,
        options: null,
      };
      prisma.customFieldDefinition.findMany.mockResolvedValue([checkDef]);

      await expect(
        service.setValues(CustomFieldEntityType.TEST_CASE, 'case-1', {
          values: [{ definitionId: 'def-1', value: 'invalid' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate dropdown field values against options', async () => {
      prisma.customFieldDefinition.findMany.mockResolvedValue([mockDefinition]);

      await expect(
        service.setValues(CustomFieldEntityType.TEST_CASE, 'case-1', {
          values: [{ definitionId: 'def-1', value: 'Edge' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('searchByFieldValue', () => {
    it('should return entity IDs matching the search', async () => {
      prisma.customFieldDefinition.findFirst.mockResolvedValue(mockDefinition);
      prisma.customFieldValue.findMany.mockResolvedValue([
        { entityId: 'case-1' },
        { entityId: 'case-2' },
      ]);

      const result = await service.searchByFieldValue('proj-1', 'def-1', 'Chrome');

      expect(result).toEqual(['case-1', 'case-2']);
    });
  });
});
