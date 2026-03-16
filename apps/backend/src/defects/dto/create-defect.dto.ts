import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateDefectDto {
  @ApiProperty({ example: 'PROJ-123', description: 'External ticket ID or URL', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reference!: string;

  @ApiPropertyOptional({ example: 'Login fails when password contains special chars', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'result-abc123', description: 'Linked test result ID' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  testResultId?: string;
}
