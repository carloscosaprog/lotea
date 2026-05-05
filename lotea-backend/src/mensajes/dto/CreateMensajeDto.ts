import { IsInt, IsString, MinLength } from 'class-validator';

export class CreateMensajeDto {
  @IsInt()
  id_receptor: number;

  @IsString()
  @MinLength(1)
  contenido: string;
}
