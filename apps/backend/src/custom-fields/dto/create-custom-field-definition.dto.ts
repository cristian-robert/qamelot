import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { CustomFieldType, CustomFieldEntityType } from '@app/shared';

export class CreateCustomFieldDefinitionDto {
  @ApiProperty({ example: 'Browser', description: 'Field name' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    enum: CustomFieldType,
    example: CustomFieldType.STRING,
    description: 'Field data type',
  })
  @IsEnum(CustomFieldType)
  fieldType!: CustomFieldType;

  @ApiPropertyOptional({
    example: ['Chrome', 'Firefox', 'Safari'],
    description: 'Options for dropdown fields',
  })
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({ example: false, description: 'Whether the field is required' })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiProperty({
    enum: CustomFieldEntityType,
    example: CustomFieldEntityType.TEST_CASE,
    description: 'Which entity type this field applies to',
  })
  @IsEnum(CustomFieldEntityType)
  entityType!: CustomFieldEntityType;

  @ApiPropertyOptional({ example: 0, description: 'Display position' })
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;
}
