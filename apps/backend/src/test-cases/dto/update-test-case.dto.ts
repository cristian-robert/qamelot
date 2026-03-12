import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsArray,
  ValidateNested,
  ValidateIf,
  MinLength,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TestCasePriority, TestCaseType } from '@app/shared';
import { TestCaseStepDto } from './test-case-step.dto';

export class UpdateTestCaseDto {
  @ApiPropertyOptional({ example: 'Updated test title', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated preconditions', maxLength: 2000, nullable: true })
  @ValidateIf((o) => o.preconditions !== null)
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  preconditions?: string | null;

  @ApiPropertyOptional({ type: [TestCaseStepDto], description: 'Ordered test steps' })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => TestCaseStepDto)
  @IsOptional()
  steps?: TestCaseStepDto[];

  @ApiPropertyOptional({ enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] })
  @IsIn(Object.values(TestCasePriority))
  @IsOptional()
  priority?: TestCasePriority;

  @ApiPropertyOptional({
    enum: ['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY'],
  })
  @IsIn(Object.values(TestCaseType))
  @IsOptional()
  type?: TestCaseType;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  automationFlag?: boolean;
}
