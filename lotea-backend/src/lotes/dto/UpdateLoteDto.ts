import { PartialType } from '@nestjs/mapped-types';
import { CreateLoteDto } from './CreateLoteDto';

export class UpdateLoteDto extends PartialType(CreateLoteDto) {}
