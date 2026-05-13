import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsObject } from 'class-validator';

export class CreateProcessStepDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>;
}
