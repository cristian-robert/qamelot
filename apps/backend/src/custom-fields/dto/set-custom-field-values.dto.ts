import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  MaxLength,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CustomFieldValueItemDto {
  @ApiProperty({ example: 'def-123', description: 'Custom field definition ID' })
  @IsString()
  @MinLength(1)
  definitionId!: string;

  @ApiProperty({ example: 'Chrome', description: 'Field value as string' })
  @IsString()
  @MaxLength(5000)
  value!: string;
}

export class SetCustomFieldValuesDto {
  @ApiProperty({ type: [CustomFieldValueItemDto], description: 'Array of field values to set' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldValueItemDto)
  @ArrayMaxSize(100)
  values!: CustomFieldValueItemDto[];
}
