import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CopyMoveTestCaseDto {
  @ApiProperty({ example: 'suite-2', description: 'Target suite ID' })
  @IsString()
  @MinLength(1)
  targetSuiteId!: string;
}
