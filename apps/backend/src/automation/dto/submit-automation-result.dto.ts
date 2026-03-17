import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitAutomationResultDto {
  @ApiProperty({ example: 'tests/login.spec.ts > should login' })
  @IsString()
  @MinLength(1)
  automationId!: string;

  @ApiProperty({ enum: ['PASSED', 'FAILED', 'BLOCKED'] })
  @IsEnum(['PASSED', 'FAILED', 'BLOCKED'] as const)
  status!: 'PASSED' | 'FAILED' | 'BLOCKED';

  @ApiPropertyOptional({ example: 1500, description: 'Duration in ms' })
  @IsInt()
  @Min(0)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ example: 'Expected 200 but got 404' })
  @IsString()
  @MaxLength(10000)
  @IsOptional()
  error?: string;

  @ApiPropertyOptional({ description: 'stdout/stderr log' })
  @IsString()
  @MaxLength(50000)
  @IsOptional()
  log?: string;
}

export class BulkSubmitAutomationResultsDto {
  @ApiProperty({ type: [SubmitAutomationResultDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => SubmitAutomationResultDto)
  results!: SubmitAutomationResultDto[];
}

export class SyncAutomationTestDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  automationId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  filePath!: string;
}

export class SyncAutomationTestsDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  projectId!: string;

  @ApiProperty({ type: [SyncAutomationTestDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10000)
  @ValidateNested({ each: true })
  @Type(() => SyncAutomationTestDto)
  tests!: SyncAutomationTestDto[];
}
