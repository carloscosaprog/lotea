import { IsString, MinLength } from 'class-validator';

export class CreateSolicitudLoteDto {
  @IsString()
  @MinLength(10)
  descripcion: string;
}
