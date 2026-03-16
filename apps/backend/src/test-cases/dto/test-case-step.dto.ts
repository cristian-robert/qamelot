import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

export class CreateTestCaseStepDto {
  @ApiProperty({ example: 'Click the login button' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description!: string;

  @ApiProperty({ example: 'Login form is displayed' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  expectedResult!: string;
}

export class UpdateTestCaseStepDto {
  @ApiPropertyOptional({ example: 'Click the submit button' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ example: 'Form is submitted successfully' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(5000)
  expectedResult?: string;
}

export class ReorderStepsDto {
  @ApiProperty({ example: ['step-1', 'step-3', 'step-2'], description: 'Ordered step IDs' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  stepIds!: string[];
}
