import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent project ID' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Project category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Project phase', enum: ['survey', 'concept', 'planning', 'development', 'testing', 'mass_production'] })
  @IsOptional()
  @IsString()
  phase?: string;

  @ApiPropertyOptional({ description: 'Project status', enum: ['not_started', 'in_progress', 'completed', 'delayed'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Leader user ID' })
  @IsOptional()
  @IsString()
  leaderId?: string;

  @ApiPropertyOptional({ description: 'Planned start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Planned end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
