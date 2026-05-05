import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLoteDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsInt()
  @Min(0)
  cantidad: number;

  @IsOptional()
  @IsInt()
  id_categoria?: number;
}
