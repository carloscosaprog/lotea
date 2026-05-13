import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateImagenLoteDto {
  @IsInt()
  id_lote: number;

  @IsString()
  url: string;

  @IsOptional()
  @IsBoolean()
  es_principal?: boolean;
}
