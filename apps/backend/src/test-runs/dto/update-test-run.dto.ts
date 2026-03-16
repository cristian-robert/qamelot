import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, ValidateIf, IsEnum } from 'class-validator';
import { TestRunStatus } from '@app/shared';

export class UpdateTestRunDto {
  @ApiPropertyOptional({ example: 'Updated Run Name', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'user-456',
    description: 'New assigned user (null to unassign)',
    nullable: true,
  })
  @ValidateIf((o) => o.assignedToId !== null)
  @IsString()
  @IsOptional()
  @MinLength(1)
  assignedToId?: string | null;

  @ApiPropertyOptional({ enum: TestRunStatus, example: TestRunStatus.IN_PROGRESS })
  @IsEnum(TestRunStatus)
  @IsOptional()
  status?: TestRunStatus;
}
