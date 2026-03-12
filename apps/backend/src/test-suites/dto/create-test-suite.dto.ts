import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateTestSuiteDto {
  @ApiProperty({ example: 'Login Tests', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Tests for the login flow', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'clxyz123abc', description: 'Parent suite ID for nesting' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  parentId?: string;
}
