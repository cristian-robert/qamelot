import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class TestCaseStepDto {
  @ApiProperty({ example: 'Click the login button' })
  @IsString()
  @MinLength(1)
  action!: string;

  @ApiProperty({ example: 'Login form is displayed' })
  @IsString()
  @MinLength(1)
  expected!: string;
}
