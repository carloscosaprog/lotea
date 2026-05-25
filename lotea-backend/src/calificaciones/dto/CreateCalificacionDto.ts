import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateCalificacionDto {
  @Type(() => Number)
  @IsInt()
  id_pedido: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  puntuacion: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}
