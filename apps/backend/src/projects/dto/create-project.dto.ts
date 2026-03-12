import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Project', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Project description', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
