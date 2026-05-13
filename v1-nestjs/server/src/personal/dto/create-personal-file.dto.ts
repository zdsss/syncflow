import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreatePersonalFileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsString()
  extension?: string;

  @IsNumber()
  size: number;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  @IsNotEmpty()
  uploaderId: string;
}
