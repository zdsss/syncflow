import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
