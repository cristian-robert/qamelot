import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class CreateAutomationRunDto {
  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  @MinLength(1)
  projectId!: string;

  @ApiProperty({ example: 'clxyz456' })
  @IsString()
  @MinLength(1)
  planId!: string;

  @ApiProperty({ example: 'CI Run #42' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: ['tests/login.spec.ts > should login'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @IsString({ each: true })
  automationIds!: string[];

  @ApiPropertyOptional({ example: 'https://ci.example.com/jobs/42' })
  @IsUrl()
  @IsOptional()
  ciJobUrl?: string;
}
