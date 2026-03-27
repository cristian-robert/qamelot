import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { CasePriority, CaseType, TemplateType } from '@app/shared';

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

  @ApiPropertyOptional({ example: 'Full test description for TEXT template', maxLength: 10000 })
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  body?: string;

  @ApiPropertyOptional({ enum: TemplateType, default: 'TEXT' })
  @IsIn(Object.values(TemplateType))
  @IsOptional()
  templateType?: TemplateType;

  @ApiPropertyOptional({ enum: CasePriority, default: 'MEDIUM' })
  @IsIn(Object.values(CasePriority))
  @IsOptional()
  priority?: CasePriority;

  @ApiPropertyOptional({ enum: CaseType, default: 'FUNCTIONAL' })
  @IsIn(Object.values(CaseType))
  @IsOptional()
  type?: CaseType;

  @ApiPropertyOptional({ example: 300, description: 'Estimated duration in seconds' })
  @IsInt()
  @Min(0)
  @IsOptional()
  estimate?: number | null;

  @ApiPropertyOptional({ example: 'JIRA-123,JIRA-456', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  references?: string | null;
}
