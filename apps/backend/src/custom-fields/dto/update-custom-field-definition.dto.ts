import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
  MaxLength,
  MinLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { CustomFieldType } from '@app/shared';

export class UpdateCustomFieldDefinitionDto {
  @ApiPropertyOptional({ example: 'Browser Version', description: 'Field name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    enum: CustomFieldType,
    example: CustomFieldType.DROPDOWN,
    description: 'Field data type',
  })
  @IsEnum(CustomFieldType)
  @IsOptional()
  fieldType?: CustomFieldType;

  @ApiPropertyOptional({
    example: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    description: 'Options for dropdown fields',
  })
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({ example: true, description: 'Whether the field is required' })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Display position' })
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;
}
