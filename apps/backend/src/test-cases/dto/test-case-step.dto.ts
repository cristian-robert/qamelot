import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class TestCaseStepDto {
  @ApiProperty({ example: 'Click the login button' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  action!: string;

  @ApiProperty({ example: 'Login form is displayed' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  expected!: string;
}
