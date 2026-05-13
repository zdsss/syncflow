import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Project ID' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({ description: 'Task type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Task priority', enum: ['urgent', 'high', 'medium', 'low'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Task status', enum: ['not_started', 'in_progress', 'on_hold', 'completed', 'overdue'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Assignee user ID' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Participant user IDs', type: [String] })
  @IsOptional()
  @IsString({ each: true })
  participantIds?: string[];

  @ApiPropertyOptional({ description: 'Planned start date' })
  @IsOptional()
  @IsDateString()
  planStart?: string;

  @ApiPropertyOptional({ description: 'Planned end date' })
  @IsOptional()
  @IsDateString()
  planEnd?: string;

  @ApiPropertyOptional({ description: 'Progress percentage (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({ description: 'Planned hours' })
  @IsOptional()
  @IsInt()
  @Min(0)
  plannedHours?: number;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is milestone task' })
  @IsOptional()
  milestone?: boolean;

  @ApiPropertyOptional({ description: 'Task dependencies', type: [String] })
  @IsOptional()
  dependencies?: string[];

  @ApiPropertyOptional({ description: 'Reminder strategy' })
  @IsOptional()
  @IsString()
  reminderStrategy?: string;

  @ApiPropertyOptional({ description: 'Archive location' })
  @IsOptional()
  @IsString()
  archiveLocation?: string;

  @ApiPropertyOptional({ description: 'Task tags', type: [String] })
  @IsOptional()
  tags?: string[];
}
