import { IsInt, Min } from 'class-validator';

export class CreateParticipacionDto {
  @IsInt()
  @Min(1)
  cantidad_aportada: number;
}
