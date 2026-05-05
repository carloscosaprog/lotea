import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoriaDto } from './CreateCategoriaDto';
export class UpdateCategoriaDto extends PartialType(CreateCategoriaDto) {}
