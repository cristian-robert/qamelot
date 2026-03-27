import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, ValidateIf } from 'class-validator';

export class SetupAutomationProjectDto {
  @ApiPropertyOptional({ example: 'clxyz123', description: 'Existing project ID (alternative to projectName)' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ example: 'Playwright Integration Test', maxLength: 100, description: 'Existing project name (alternative to projectId)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @ValidateIf((o) => !o.projectId)
  projectName?: string;

  @ApiPropertyOptional({ example: 'clxyz456', description: 'Existing plan ID (alternative to planName)' })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiPropertyOptional({ example: 'Automation Plan', maxLength: 100, description: 'Existing plan name (alternative to planId)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @ValidateIf((o) => !o.planId)
  planName?: string;
}
