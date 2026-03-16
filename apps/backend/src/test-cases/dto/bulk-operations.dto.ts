import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsOptional,
  IsIn,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CasePriority, CaseType } from '@app/shared';

class BulkUpdateFieldsDto {
  @ApiPropertyOptional({ enum: CasePriority })
  @IsIn(Object.values(CasePriority))
  @IsOptional()
  priority?: CasePriority;

  @ApiPropertyOptional({ enum: CaseType })
  @IsIn(Object.values(CaseType))
  @IsOptional()
  type?: CaseType;
}

export class BulkUpdateCasesDto {
  @ApiProperty({ type: [String], description: 'Array of case IDs to update' })
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  caseIds!: string[];

  @ApiProperty({ type: BulkUpdateFieldsDto })
  @ValidateNested()
  @Type(() => BulkUpdateFieldsDto)
  fields!: BulkUpdateFieldsDto;
}

export class BulkMoveCasesDto {
  @ApiProperty({ type: [String], description: 'Array of case IDs to move' })
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  caseIds!: string[];

  @ApiProperty({ description: 'Target suite ID' })
  @IsString()
  @MinLength(1)
  targetSuiteId!: string;
}

export class BulkDeleteCasesDto {
  @ApiProperty({ type: [String], description: 'Array of case IDs to delete' })
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  caseIds!: string[];
}
