import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SharedStepItemDto } from './shared-step-item.dto';

export class CreateSharedStepDto {
  @ApiProperty({ example: 'Login flow', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiProperty({ type: [SharedStepItemDto], description: 'Ordered step items' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SharedStepItemDto)
  items!: SharedStepItemDto[];
}
