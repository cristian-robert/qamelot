import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class SharedStepItemDto {
  @ApiProperty({ example: 'Navigate to the login page' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description!: string;

  @ApiProperty({ example: 'Login page is displayed with username and password fields' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  expectedResult!: string;
}
