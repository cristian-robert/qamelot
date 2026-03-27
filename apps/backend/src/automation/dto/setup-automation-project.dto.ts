import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class SetupAutomationProjectDto {
  @ApiProperty({ example: 'Playwright Integration Test', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  projectName!: string;

  @ApiProperty({ example: 'Automation Plan', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  planName!: string;

  @ApiPropertyOptional({ example: 'Auto-created for CI testing', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  projectDescription?: string;
}
