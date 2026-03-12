import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TestCasePriority, TestCaseType } from '@app/shared';
import { TestCaseStepDto } from './test-case-step.dto';

export class CreateTestCaseDto {
  @ApiProperty({ example: 'Verify login with valid credentials', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional({ example: 'User must exist in the system', maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  preconditions?: string;

  @ApiPropertyOptional({ type: [TestCaseStepDto], description: 'Ordered test steps' })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => TestCaseStepDto)
  @IsOptional()
  steps?: TestCaseStepDto[];

  @ApiPropertyOptional({ enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' })
  @IsIn(Object.values(TestCasePriority))
  @IsOptional()
  priority?: TestCasePriority;

  @ApiPropertyOptional({
    enum: ['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY'],
    default: 'FUNCTIONAL',
  })
  @IsIn(Object.values(TestCaseType))
  @IsOptional()
  type?: TestCaseType;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  automationFlag?: boolean;
}
