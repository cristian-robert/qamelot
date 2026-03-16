import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsDateString, IsEnum, ValidateIf } from 'class-validator';
import { MilestoneStatus } from '@app/shared';

export class UpdateMilestoneDto {
  @ApiPropertyOptional({ example: 'Updated Sprint Name', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description', maxLength: 500, nullable: true })
  @ValidateIf((o) => o.description !== null)
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z', nullable: true })
  @ValidateIf((o) => o.startDate !== null)
  @IsDateString()
  @IsOptional()
  startDate?: string | null;

  @ApiPropertyOptional({ example: '2026-04-30T00:00:00.000Z', nullable: true })
  @ValidateIf((o) => o.dueDate !== null)
  @IsDateString()
  @IsOptional()
  dueDate?: string | null;

  @ApiPropertyOptional({ enum: MilestoneStatus, example: MilestoneStatus.CLOSED })
  @IsEnum(MilestoneStatus)
  @IsOptional()
  status?: MilestoneStatus;
}
