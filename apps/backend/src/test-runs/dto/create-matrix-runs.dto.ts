import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsArray, ArrayMinSize } from 'class-validator';

export class CreateMatrixRunsDto {
  @ApiProperty({ example: 'Smoke Test Run', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'user-123', description: 'User ID to assign the runs to' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  assignedToId?: string;

  @ApiProperty({
    example: ['case-1', 'case-2'],
    description: 'Test case IDs to include in each run',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  caseIds!: string[];

  @ApiProperty({
    example: [['item-chrome', 'item-windows'], ['item-firefox', 'item-macos']],
    description: 'Config item ID combinations — each inner array is one run config',
  })
  @IsArray()
  @ArrayMinSize(1)
  configItemIds!: string[][];
}
