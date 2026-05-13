export class CreateResponseUsuarioDto {
  id_usuario: number;
  nombre: string;
  email: string;
  avatar: string | null;
  fecha_registro: Date;
}
