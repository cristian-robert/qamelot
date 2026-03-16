import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ComparisonQueryDto {
  @ApiProperty({ description: 'ID of the first test run (baseline)' })
  @IsString()
  runIdA!: string;

  @ApiProperty({ description: 'ID of the second test run (comparison)' })
  @IsString()
  runIdB!: string;
}
