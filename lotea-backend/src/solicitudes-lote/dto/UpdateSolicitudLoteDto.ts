import { PartialType } from '@nestjs/mapped-types';
import { CreateSolicitudLoteDto } from './CreateSolicitudLoteDto';

export class UpdateSolicitudLoteDto extends PartialType(CreateSolicitudLoteDto) {}
