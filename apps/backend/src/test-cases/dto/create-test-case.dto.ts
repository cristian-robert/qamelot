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
} from 'class-validator';
import { Type } from 'class-transformer';
import { TestCaseStepDto } from './test-case-step.dto';

export class CreateTestCaseDto {
  @ApiProperty({ example: 'Verify login with valid credentials', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'User must exist in the system', maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  preconditions?: string;

  @ApiPropertyOptional({ type: [TestCaseStepDto], description: 'Ordered test steps' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseStepDto)
  @IsOptional()
  steps?: TestCaseStepDto[];

  @ApiPropertyOptional({ enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' })
  @IsIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  @IsOptional()
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  @ApiPropertyOptional({
    enum: ['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY'],
    default: 'FUNCTIONAL',
  })
  @IsIn(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY'])
  @IsOptional()
  type?: 'FUNCTIONAL' | 'REGRESSION' | 'SMOKE' | 'ACCEPTANCE' | 'EXPLORATORY';

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  automationFlag?: boolean;
}
