import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  content: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  creatorId: string;
}
