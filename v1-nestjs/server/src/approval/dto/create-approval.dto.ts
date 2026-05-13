import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateApprovalDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  targetType: string;

  @IsString()
  @IsNotEmpty()
  applicantId: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
