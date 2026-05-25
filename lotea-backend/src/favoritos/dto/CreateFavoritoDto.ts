import { IsInt } from 'class-validator';

export class CreateFavoritoDto {
  @IsInt()
  id_lote: number;
}
