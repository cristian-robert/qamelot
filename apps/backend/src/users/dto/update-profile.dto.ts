import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'New Name' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'currentPassword123' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  currentPassword?: string;

  @ApiPropertyOptional({ example: 'newSecurePassword123', minLength: 8 })
  @IsString()
  @IsOptional()
  @MinLength(8)
  newPassword?: string;
}
