import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  async create(@Body() body: CreateCommentDto) {
    const comment = await this.commentsService.create(body);
    return { code: 0, data: comment };
  }

  @Get()
  @ApiOperation({ summary: 'Get comments by entity' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  @ApiQuery({ name: 'entityType', required: true, description: 'Entity type: task / project / file' })
  @ApiQuery({ name: 'entityId', required: true, description: 'Entity ID' })
  async findByEntity(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    const comments = await this.commentsService.findByEntity(entityType, entityId);
    return { code: 0, data: comments };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async update(@Param('id') id: string, @Body() body: UpdateCommentDto) {
    const comment = await this.commentsService.update(id, body.content!);
    return { code: 0, data: comment };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async remove(@Param('id') id: string) {
    const comment = await this.commentsService.remove(id);
    return { code: 0, data: comment };
  }
}
