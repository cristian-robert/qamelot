import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
} from 'class-validator';
import { TestResultStatus } from '@app/shared';

export class BulkSubmitResultsDto {
  @ApiProperty({ type: [String], description: 'Array of test run case IDs' })
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  testRunCaseIds!: string[];

  @ApiProperty({
    enum: [TestResultStatus.PASSED, TestResultStatus.FAILED, TestResultStatus.BLOCKED, TestResultStatus.RETEST],
    example: TestResultStatus.PASSED,
  })
  @IsEnum(TestResultStatus, {
    message: 'Status must be PASSED, FAILED, BLOCKED, or RETEST',
  })
  status!: TestResultStatus;

  @ApiPropertyOptional({ example: 'Bulk status update', maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;
}
