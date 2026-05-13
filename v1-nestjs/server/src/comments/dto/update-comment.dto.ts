import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiPropertyOptional({ description: 'Updated comment content' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;
}
