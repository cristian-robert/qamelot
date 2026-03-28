import { Test, TestingModule } from '@nestjs/testing';
import { SharedStepsController } from './shared-steps.controller';
import { SharedStepsService } from './shared-steps.service';

const PROJECT_ID = 'proj-1';
const SHARED_STEP_ID = 'ss-1';

const mockSharedStep = {
  id: SHARED_STEP_ID,
  title: 'Login flow',
  projectId: PROJECT_ID,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    {
      id: 'ssi-1',
      sharedStepId: SHARED_STEP_ID,
      stepNumber: 1,
      description: 'Navigate to login page',
      expectedResult: 'Login page is displayed',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

describe('SharedStepsController', () => {
  let controller: SharedStepsController;

  const mockService = {
    create: jest.fn(),
    findAllByProject: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharedStepsController],
      providers: [{ provide: SharedStepsService, useValue: mockService }],
    }).compile();
    controller = module.get<SharedStepsController>(SharedStepsController);
  });

  it('create delegates to service', async () => {
    mockService.create.mockResolvedValue(mockSharedStep);

    const dto = {
      title: 'Login flow',
      items: [{ description: 'Navigate to login page', expectedResult: 'Login page is displayed' }],
    };
    const result = await controller.create(PROJECT_ID, dto);

    expect(mockService.create).toHaveBeenCalledWith(PROJECT_ID, dto);
    expect(result).toEqual(mockSharedStep);
  });

  it('findAll delegates to service with pagination', async () => {
    const paginated = { data: [mockSharedStep], total: 1, page: 1, pageSize: 50, totalPages: 1 };
    mockService.findAllByProject.mockResolvedValue(paginated);

    const result = await controller.findAll(PROJECT_ID);

    expect(mockService.findAllByProject).toHaveBeenCalledWith(PROJECT_ID, {
      page: undefined,
      pageSize: undefined,
    });
    expect(result).toEqual(paginated);
  });

  it('findOne delegates to service', async () => {
    mockService.findOne.mockResolvedValue(mockSharedStep);

    const result = await controller.findOne(PROJECT_ID, SHARED_STEP_ID);

    expect(mockService.findOne).toHaveBeenCalledWith(PROJECT_ID, SHARED_STEP_ID);
    expect(result).toEqual(mockSharedStep);
  });

  it('update delegates to service', async () => {
    const updated = { ...mockSharedStep, title: 'Updated' };
    mockService.update.mockResolvedValue(updated);

    const result = await controller.update(PROJECT_ID, SHARED_STEP_ID, { title: 'Updated' });

    expect(mockService.update).toHaveBeenCalledWith(PROJECT_ID, SHARED_STEP_ID, { title: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('remove delegates to service', async () => {
    const deleted = { ...mockSharedStep, deletedAt: new Date() };
    mockService.softDelete.mockResolvedValue(deleted);

    const result = await controller.remove(PROJECT_ID, SHARED_STEP_ID);

    expect(mockService.softDelete).toHaveBeenCalledWith(PROJECT_ID, SHARED_STEP_ID);
    expect(result).toEqual(deleted);
  });
});
