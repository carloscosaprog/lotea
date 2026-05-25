import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './CreateUsuarioDto';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {}
