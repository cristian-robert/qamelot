import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '@app/shared';

export class UpdateRoleDto {
  @ApiProperty({ enum: Role, example: Role.LEAD })
  @IsEnum(Role)
  role!: Role;
}
