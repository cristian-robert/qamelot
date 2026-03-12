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
} from 'class-validator';
import { Type } from 'class-transformer';
import { TestCaseStepDto } from './test-case-step.dto';

export class UpdateTestCaseDto {
  @ApiPropertyOptional({ example: 'Updated test title', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated preconditions', maxLength: 2000, nullable: true })
  @ValidateIf((o) => o.preconditions !== null)
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  preconditions?: string | null;

  @ApiPropertyOptional({ type: [TestCaseStepDto], description: 'Ordered test steps' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseStepDto)
  @IsOptional()
  steps?: TestCaseStepDto[];

  @ApiPropertyOptional({ enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] })
  @IsIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  @IsOptional()
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  @ApiPropertyOptional({
    enum: ['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY'],
  })
  @IsIn(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY'])
  @IsOptional()
  type?: 'FUNCTIONAL' | 'REGRESSION' | 'SMOKE' | 'ACCEPTANCE' | 'EXPLORATORY';

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  automationFlag?: boolean;
}
