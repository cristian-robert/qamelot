import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, ValidateIf } from 'class-validator';

export class UpdateDefectDto {
  @ApiPropertyOptional({ example: 'PROJ-456', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(500)
  reference?: string;

  @ApiPropertyOptional({ example: 'Updated description', maxLength: 1000, nullable: true })
  @ValidateIf((o) => o.description !== null)
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string | null;
}
