import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AttachmentEntityType, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@app/shared';

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', './uploads');
  }

  async upload(
    file: Express.Multer.File,
    entityType: AttachmentEntityType,
    entityId: string,
    uploadedById: string,
  ) {
    this.validateFile(file);
    await this.verifyEntity(entityType, entityId);

    const subDir = path.join(this.uploadDir, entityType.toLowerCase(), entityId);
    await fs.promises.mkdir(subDir, { recursive: true });

    const uniqueName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(subDir, uniqueName);

    await fs.promises.writeFile(filePath, file.buffer);
    this.logger.log(`File saved: ${filePath} (${file.size} bytes)`);

    return this.prisma.attachment.create({
      data: {
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        entityType,
        entityId,
        uploadedById,
      },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    });
  }

  async findByEntity(entityType: AttachmentEntityType, entityId: string) {
    return this.prisma.attachment.findMany({
      where: { entityType, entityId },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    return attachment;
  }

  async remove(id: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    try {
      await fs.promises.unlink(attachment.path);
      this.logger.log(`File deleted: ${attachment.path}`);
    } catch (err) {
      this.logger.warn(`Failed to delete file: ${attachment.path} — ${err}`);
    }

    return this.prisma.attachment.delete({ where: { id } });
  }

  async getFilePath(id: string): Promise<{ filePath: string; filename: string; mimeType: string }> {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const exists = fs.existsSync(attachment.path);
    if (!exists) {
      throw new NotFoundException('File not found on disk');
    }

    return {
      filePath: attachment.path,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
    };
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as typeof ALLOWED_MIME_TYPES[number])) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
  }

  private async verifyEntity(entityType: AttachmentEntityType, entityId: string) {
    if (entityType === AttachmentEntityType.TEST_CASE) {
      // TestCase is stored in the DB but managed outside the Prisma schema.
      // Verify existence via raw query to avoid schema coupling.
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "TestCase" WHERE id = ${entityId} AND "deletedAt" IS NULL LIMIT 1
      `;
      if (!rows.length) {
        throw new NotFoundException('Test case not found');
      }
    } else if (entityType === AttachmentEntityType.TEST_RESULT) {
      const testResult = await this.prisma.testResult.findUnique({
        where: { id: entityId },
      });
      if (!testResult) {
        throw new NotFoundException('Test result not found');
      }
    }
  }
}
