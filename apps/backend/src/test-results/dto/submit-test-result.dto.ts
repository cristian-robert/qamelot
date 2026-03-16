import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
  MinLength,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TestResultStatus } from '@app/shared';

export class StepResultDto {
  @ApiProperty({ example: 'step-123', description: 'Test case step ID' })
  @IsString()
  @MinLength(1)
  testCaseStepId!: string;

  @ApiProperty({
    enum: TestResultStatus,
    example: TestResultStatus.PASSED,
  })
  @IsEnum(TestResultStatus)
  status!: TestResultStatus;

  @ApiPropertyOptional({ example: 'Actual output was correct', maxLength: 5000 })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  actualResult?: string;
}

export class SubmitTestResultDto {
  @ApiProperty({ example: 'trc-123', description: 'Test run case ID' })
  @IsString()
  @MinLength(1)
  testRunCaseId!: string;

  @ApiProperty({
    enum: [TestResultStatus.PASSED, TestResultStatus.FAILED, TestResultStatus.BLOCKED, TestResultStatus.RETEST],
    example: TestResultStatus.PASSED,
  })
  @IsEnum(TestResultStatus, {
    message: 'Status must be PASSED, FAILED, BLOCKED, or RETEST',
  })
  status!: TestResultStatus;

  @ApiPropertyOptional({ description: 'Whether the overall status was manually overridden' })
  @IsBoolean()
  @IsOptional()
  statusOverride?: boolean;

  @ApiPropertyOptional({ example: 'Login successful', maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({ example: 45, description: 'Elapsed time in seconds' })
  @IsInt()
  @IsOptional()
  @Min(0)
  elapsed?: number;

  @ApiPropertyOptional({ description: 'Step-level results (for STEPS template type)', type: [StepResultDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepResultDto)
  @IsOptional()
  stepResults?: StepResultDto[];
}
