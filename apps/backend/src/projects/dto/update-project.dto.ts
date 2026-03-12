import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, ValidateIf } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Updated Name', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description', maxLength: 500, nullable: true })
  @ValidateIf((o) => o.description !== null)
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string | null;
}
