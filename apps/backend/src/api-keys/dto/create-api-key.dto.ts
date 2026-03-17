import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsDateString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'CI Pipeline Key', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  @MinLength(1)
  projectId!: string;

  @ApiPropertyOptional({ example: '2027-01-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
