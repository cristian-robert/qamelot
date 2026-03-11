import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    // Prevent real DB connection in unit tests
    jest
      .spyOn(service as unknown as { $connect: () => Promise<void> }, '$connect')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as unknown as { $disconnect: () => Promise<void> }, '$disconnect')
      .mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
