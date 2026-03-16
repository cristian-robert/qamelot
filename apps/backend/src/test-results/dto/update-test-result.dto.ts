import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
  ValidateIf,
  IsString,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TestResultStatus } from '@app/shared';
import { StepResultDto } from './submit-test-result.dto';

export class UpdateTestResultDto {
  @ApiPropertyOptional({
    enum: TestResultStatus,
    example: TestResultStatus.FAILED,
  })
  @IsEnum(TestResultStatus)
  @IsOptional()
  status?: TestResultStatus;

  @ApiPropertyOptional({ description: 'Whether the overall status was manually overridden' })
  @IsBoolean()
  @IsOptional()
  statusOverride?: boolean;

  @ApiPropertyOptional({ example: 'Updated comment', maxLength: 2000, nullable: true })
  @ValidateIf((o) => o.comment !== null)
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string | null;

  @ApiPropertyOptional({ example: 120, description: 'Elapsed time in seconds', nullable: true })
  @ValidateIf((o) => o.elapsed !== null)
  @IsInt()
  @IsOptional()
  @Min(0)
  elapsed?: number | null;

  @ApiPropertyOptional({ description: 'Step-level results (for STEPS template type)', type: [StepResultDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepResultDto)
  @IsOptional()
  stepResults?: StepResultDto[];
}
