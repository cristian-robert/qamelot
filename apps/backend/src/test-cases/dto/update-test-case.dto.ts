import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  ValidateIf,
  MinLength,
  MaxLength,
} from 'class-validator';
import { CasePriority, CaseType, TemplateType, AutomationStatus } from '@app/shared';

export class UpdateTestCaseDto {
  @ApiPropertyOptional({ example: 'Updated test title', maxLength: 300 })
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

  @ApiPropertyOptional({ example: 'Full test description for TEXT template', maxLength: 10000 })
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  body?: string;

  @ApiPropertyOptional({ enum: TemplateType })
  @IsIn(Object.values(TemplateType))
  @IsOptional()
  templateType?: TemplateType;

  @ApiPropertyOptional({ enum: CasePriority })
  @IsIn(Object.values(CasePriority))
  @IsOptional()
  priority?: CasePriority;

  @ApiPropertyOptional({ enum: CaseType })
  @IsIn(Object.values(CaseType))
  @IsOptional()
  type?: CaseType;

  @ApiPropertyOptional({ example: 300, description: 'Estimated duration in seconds', nullable: true })
  @ValidateIf((o) => o.estimate !== null)
  @IsInt()
  @Min(0)
  @IsOptional()
  estimate?: number | null;

  @ApiPropertyOptional({ example: 'JIRA-123,JIRA-456', maxLength: 1000, nullable: true })
  @ValidateIf((o) => o.references !== null)
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  references?: string | null;

  @ApiPropertyOptional({ example: 'tests/login.spec.ts > Auth > should login', nullable: true })
  @ValidateIf((o) => o.automationId !== null)
  @IsString()
  @IsOptional()
  @MaxLength(500)
  automationId?: string | null;

  @ApiPropertyOptional({ example: 'tests/login.spec.ts', nullable: true })
  @ValidateIf((o) => o.automationFilePath !== null)
  @IsString()
  @IsOptional()
  @MaxLength(500)
  automationFilePath?: string | null;

  @ApiPropertyOptional({ enum: AutomationStatus })
  @IsIn(Object.values(AutomationStatus))
  @IsOptional()
  automationStatus?: AutomationStatus;
}
