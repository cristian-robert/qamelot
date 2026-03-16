import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, MinLength } from 'class-validator';
import { AttachmentEntityType } from '@app/shared';

export class UploadAttachmentDto {
  @ApiProperty({ enum: ['TEST_CASE', 'TEST_RESULT'] })
  @IsIn(Object.values(AttachmentEntityType))
  entityType!: AttachmentEntityType;

  @ApiProperty({ example: 'clx1abc123...' })
  @IsString()
  @MinLength(1)
  entityId!: string;
}
