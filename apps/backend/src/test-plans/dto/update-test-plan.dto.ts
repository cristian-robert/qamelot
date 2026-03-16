import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, ValidateIf, IsEnum } from 'class-validator';
import { TestPlanStatus } from '@app/shared';

export class UpdateTestPlanDto {
  @ApiPropertyOptional({ example: 'Updated Plan Name', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description', maxLength: 500, nullable: true })
  @ValidateIf((o) => o.description !== null)
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ enum: TestPlanStatus, example: TestPlanStatus.ACTIVE })
  @IsEnum(TestPlanStatus)
  @IsOptional()
  status?: TestPlanStatus;
}
