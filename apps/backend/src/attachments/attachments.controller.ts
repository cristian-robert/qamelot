import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { Role, AttachmentEntityType } from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttachmentsService } from './attachments.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';

interface AuthenticatedRequest {
  user: { id: string; email: string; role: string };
}

@ApiTags('attachments')
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file attachment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        entityType: { type: 'string', enum: ['TEST_CASE', 'TEST_RESULT'] },
        entityId: { type: 'string' },
      },
      required: ['file', 'entityType', 'entityId'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or missing data' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAttachmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attachmentsService.upload(file, dto.entityType, dto.entityId, req.user.id);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'List attachments for an entity' })
  @ApiResponse({ status: 200, description: 'Array of attachments' })
  findByEntity(
    @Param('entityType') entityType: AttachmentEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.attachmentsService.findByEntity(entityType, entityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attachment metadata' })
  @ApiResponse({ status: 200, description: 'Attachment details' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  findOne(@Param('id') id: string) {
    return this.attachmentsService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download an attachment file' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const { filePath, filename, mimeType } = await this.attachmentsService.getFilePath(id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.sendFile(filePath, { root: '/' });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Delete an attachment' })
  @ApiResponse({ status: 200, description: 'Attachment deleted' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  remove(@Param('id') id: string) {
    return this.attachmentsService.remove(id);
  }
}
