import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProcessRouteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  projectId: string;
}
