import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentsService } from './attachments.service';
import { AttachmentEntityType } from '@app/shared';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn().mockReturnValue(true),
}));

const USER_ID = 'user-1';
const ENTITY_ID = 'case-1';

const mockFile: Express.Multer.File = {
  fieldname: 'file',
  originalname: 'screenshot.png',
  encoding: '7bit',
  mimetype: 'image/png',
  buffer: Buffer.from('fake-image-data'),
  size: 1024,
  stream: null as never,
  destination: '',
  filename: '',
  path: '',
};

const mockAttachment = {
  id: 'att-1',
  filename: 'screenshot.png',
  mimeType: 'image/png',
  size: 1024,
  path: './uploads/test_case/case-1/1234-screenshot.png',
  entityType: 'TEST_CASE',
  entityId: ENTITY_ID,
  uploadedById: USER_ID,
  uploadedBy: { id: USER_ID, name: 'Test User', email: 'test@example.com' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AttachmentsService', () => {
  let service: AttachmentsService;

  const mockPrisma = {
    attachment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $queryRaw: jest.fn(),
    testResult: {
      findUnique: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('./uploads'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfig.get.mockReturnValue('./uploads');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<AttachmentsService>(AttachmentsService);
  });

  describe('upload', () => {
    it('uploads a file and creates an attachment record', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ id: ENTITY_ID }]);
      mockPrisma.attachment.create.mockResolvedValue(mockAttachment);

      const result = await service.upload(
        mockFile,
        AttachmentEntityType.TEST_CASE,
        ENTITY_ID,
        USER_ID,
      );

      expect(fs.promises.mkdir).toHaveBeenCalled();
      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(mockPrisma.attachment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          filename: 'screenshot.png',
          mimeType: 'image/png',
          size: 1024,
          entityType: 'TEST_CASE',
          entityId: ENTITY_ID,
          uploadedById: USER_ID,
        }),
        include: { uploadedBy: { select: { id: true, name: true, email: true } } },
      });
      expect(result).toEqual(mockAttachment);
    });

    it('throws BadRequestException for oversized files', async () => {
      const bigFile = { ...mockFile, size: 11 * 1024 * 1024 };

      await expect(
        service.upload(bigFile, AttachmentEntityType.TEST_CASE, ENTITY_ID, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for disallowed mime types', async () => {
      const exeFile = { ...mockFile, mimetype: 'application/x-msdownload' };

      await expect(
        service.upload(exeFile, AttachmentEntityType.TEST_CASE, ENTITY_ID, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when test case does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await expect(
        service.upload(mockFile, AttachmentEntityType.TEST_CASE, 'nonexistent', USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when test result does not exist', async () => {
      mockPrisma.testResult.findUnique.mockResolvedValue(null);

      await expect(
        service.upload(mockFile, AttachmentEntityType.TEST_RESULT, 'nonexistent', USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEntity', () => {
    it('returns all attachments for an entity', async () => {
      mockPrisma.attachment.findMany.mockResolvedValue([mockAttachment]);

      const result = await service.findByEntity(AttachmentEntityType.TEST_CASE, ENTITY_ID);

      expect(mockPrisma.attachment.findMany).toHaveBeenCalledWith({
        where: { entityType: 'TEST_CASE', entityId: ENTITY_ID },
        include: { uploadedBy: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockAttachment]);
    });
  });

  describe('findOne', () => {
    it('returns a single attachment', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockAttachment);

      const result = await service.findOne('att-1');

      expect(mockPrisma.attachment.findUnique).toHaveBeenCalledWith({
        where: { id: 'att-1' },
        include: { uploadedBy: { select: { id: true, name: true, email: true } } },
      });
      expect(result).toEqual(mockAttachment);
    });

    it('throws NotFoundException when attachment does not exist', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the file and attachment record', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockAttachment);
      mockPrisma.attachment.delete.mockResolvedValue(mockAttachment);

      const result = await service.remove('att-1');

      expect(fs.promises.unlink).toHaveBeenCalledWith(mockAttachment.path);
      expect(mockPrisma.attachment.delete).toHaveBeenCalledWith({ where: { id: 'att-1' } });
      expect(result).toEqual(mockAttachment);
    });

    it('throws NotFoundException when attachment does not exist', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('still deletes the record when file removal fails', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockAttachment);
      mockPrisma.attachment.delete.mockResolvedValue(mockAttachment);
      (fs.promises.unlink as jest.Mock).mockRejectedValueOnce(new Error('ENOENT'));

      const result = await service.remove('att-1');

      expect(mockPrisma.attachment.delete).toHaveBeenCalledWith({ where: { id: 'att-1' } });
      expect(result).toEqual(mockAttachment);
    });
  });

  describe('getFilePath', () => {
    it('returns file path, filename, and mimeType', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockAttachment);

      const result = await service.getFilePath('att-1');

      expect(result).toEqual({
        filePath: mockAttachment.path,
        filename: 'screenshot.png',
        mimeType: 'image/png',
      });
    });

    it('throws NotFoundException when attachment does not exist', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(null);

      await expect(service.getFilePath('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when file does not exist on disk', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValue(mockAttachment);
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

      await expect(service.getFilePath('att-1')).rejects.toThrow(NotFoundException);
    });
  });
});
