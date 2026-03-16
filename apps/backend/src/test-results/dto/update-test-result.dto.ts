import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, MaxLength, IsInt, Min, ValidateIf, IsString } from 'class-validator';
import { TestResultStatus } from '@app/shared';

export class UpdateTestResultDto {
  @ApiPropertyOptional({
    enum: TestResultStatus,
    example: TestResultStatus.FAILED,
  })
  @IsEnum(TestResultStatus)
  @IsOptional()
  status?: TestResultStatus;

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
}
