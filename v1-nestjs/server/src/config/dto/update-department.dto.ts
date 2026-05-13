import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
