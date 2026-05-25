import { IsInt, Min } from 'class-validator';

export class CreateGrupoCompraDto {
  @IsInt()
  id_lote: number;

  @IsInt()
  @Min(1)
  cantidad_objetivo: number;
}
