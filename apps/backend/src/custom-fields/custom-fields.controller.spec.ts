import { Test, TestingModule } from '@nestjs/testing';
import { CustomFieldType, CustomFieldEntityType } from '@app/shared';
import { CustomFieldsController } from './custom-fields.controller';
import { CustomFieldsService } from './custom-fields.service';

const mockDefinition = {
  id: 'def-1',
  name: 'Browser',
  fieldType: CustomFieldType.DROPDOWN,
  options: ['Chrome', 'Firefox'],
  required: false,
  entityType: CustomFieldEntityType.TEST_CASE,
  projectId: 'proj-1',
  position: 0,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CustomFieldsController', () => {
  let controller: CustomFieldsController;
  let service: {
    createDefinition: jest.Mock;
    findDefinitions: jest.Mock;
    findDefinition: jest.Mock;
    updateDefinition: jest.Mock;
    deleteDefinition: jest.Mock;
    getValues: jest.Mock;
    setValues: jest.Mock;
    searchByFieldValue: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createDefinition: jest.fn(),
      findDefinitions: jest.fn(),
      findDefinition: jest.fn(),
      updateDefinition: jest.fn(),
      deleteDefinition: jest.fn(),
      getValues: jest.fn(),
      setValues: jest.fn(),
      searchByFieldValue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomFieldsController],
      providers: [{ provide: CustomFieldsService, useValue: service }],
    }).compile();

    controller = module.get<CustomFieldsController>(CustomFieldsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createDefinition', () => {
    it('should call service.createDefinition', async () => {
      service.createDefinition.mockResolvedValue(mockDefinition);

      const result = await controller.createDefinition('proj-1', {
        name: 'Browser',
        fieldType: CustomFieldType.DROPDOWN,
        options: ['Chrome', 'Firefox'],
        entityType: CustomFieldEntityType.TEST_CASE,
      });

      expect(result).toEqual(mockDefinition);
      expect(service.createDefinition).toHaveBeenCalledWith('proj-1', expect.any(Object));
    });
  });

  describe('findDefinitions', () => {
    it('should call service.findDefinitions', async () => {
      service.findDefinitions.mockResolvedValue([mockDefinition]);

      const result = await controller.findDefinitions('proj-1', CustomFieldEntityType.TEST_CASE);

      expect(result).toEqual([mockDefinition]);
      expect(service.findDefinitions).toHaveBeenCalledWith(
        'proj-1',
        CustomFieldEntityType.TEST_CASE,
      );
    });
  });

  describe('findDefinition', () => {
    it('should call service.findDefinition', async () => {
      service.findDefinition.mockResolvedValue(mockDefinition);

      const result = await controller.findDefinition('proj-1', 'def-1');

      expect(result).toEqual(mockDefinition);
    });
  });

  describe('updateDefinition', () => {
    it('should call service.updateDefinition', async () => {
      service.updateDefinition.mockResolvedValue({ ...mockDefinition, name: 'Updated' });

      const result = await controller.updateDefinition('proj-1', 'def-1', {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
    });
  });

  describe('deleteDefinition', () => {
    it('should call service.deleteDefinition', async () => {
      service.deleteDefinition.mockResolvedValue({ ...mockDefinition, deletedAt: new Date() });

      const result = await controller.deleteDefinition('proj-1', 'def-1');

      expect(result.deletedAt).toBeTruthy();
    });
  });

  describe('getValues', () => {
    it('should call service.getValues', async () => {
      service.getValues.mockResolvedValue([]);

      await controller.getValues(CustomFieldEntityType.TEST_CASE, 'case-1');

      expect(service.getValues).toHaveBeenCalledWith(
        CustomFieldEntityType.TEST_CASE,
        'case-1',
      );
    });
  });

  describe('setValues', () => {
    it('should call service.setValues', async () => {
      service.setValues.mockResolvedValue([]);

      await controller.setValues(
        CustomFieldEntityType.TEST_CASE,
        'case-1',
        { values: [{ definitionId: 'def-1', value: 'Chrome' }] },
      );

      expect(service.setValues).toHaveBeenCalledWith(
        CustomFieldEntityType.TEST_CASE,
        'case-1',
        expect.any(Object),
      );
    });
  });

  describe('searchByFieldValue', () => {
    it('should call service.searchByFieldValue', async () => {
      service.searchByFieldValue.mockResolvedValue(['case-1']);

      const result = await controller.searchByFieldValue('proj-1', 'def-1', 'Chrome');

      expect(result).toEqual(['case-1']);
    });
  });
});
