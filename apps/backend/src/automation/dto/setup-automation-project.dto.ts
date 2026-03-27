import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, ValidateIf } from 'class-validator';

export class SetupAutomationProjectDto {
  @ApiPropertyOptional({ example: 'clxyz123', description: 'Existing project ID (alternative to projectName)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  projectId?: string;

  @ApiPropertyOptional({ example: 'Playwright Integration Test', maxLength: 100, description: 'Existing project name (alternative to projectId)' })
  @ValidateIf((o) => !o.projectId)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  projectName?: string;

  @ApiPropertyOptional({ example: 'clxyz456', description: 'Existing plan ID (alternative to planName)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  planId?: string;

  @ApiPropertyOptional({ example: 'Automation Plan', maxLength: 100, description: 'Existing plan name (alternative to planId)' })
  @ValidateIf((o) => !o.planId)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  planName?: string;
}
