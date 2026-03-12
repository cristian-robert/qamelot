import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, ValidateIf } from 'class-validator';

export class UpdateTestSuiteDto {
  @ApiPropertyOptional({ example: 'Login Tests v2', maxLength: 100 })
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

  @ApiPropertyOptional({
    example: 'clxyz456def',
    description: 'New parent suite ID (null to move to root)',
    nullable: true,
  })
  @ValidateIf((o) => o.parentId !== null)
  @IsString()
  @IsOptional()
  @MinLength(1)
  parentId?: string | null;
}
