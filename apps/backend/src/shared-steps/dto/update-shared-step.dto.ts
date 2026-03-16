import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SharedStepItemDto } from './shared-step-item.dto';

export class UpdateSharedStepDto {
  @ApiPropertyOptional({ example: 'Updated login flow', maxLength: 300 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({ type: [SharedStepItemDto], description: 'Ordered step items' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SharedStepItemDto)
  @IsOptional()
  items?: SharedStepItemDto[];
}
