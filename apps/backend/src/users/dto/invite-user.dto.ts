import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '@app/shared';

export class InviteUserDto {
  @ApiProperty({ example: 'bob@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Bob Smith' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ enum: Role, example: Role.TESTER })
  @IsEnum(Role)
  role!: Role;
}
