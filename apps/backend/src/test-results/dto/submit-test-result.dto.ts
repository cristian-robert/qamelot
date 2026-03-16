import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MaxLength, IsInt, Min, MinLength } from 'class-validator';
import { TestResultStatus } from '@app/shared';

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
}
