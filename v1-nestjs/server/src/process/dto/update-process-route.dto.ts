import { PartialType } from '@nestjs/swagger';
import { CreateProcessRouteDto } from './create-process-route.dto';

export class UpdateProcessRouteDto extends PartialType(CreateProcessRouteDto) {}
