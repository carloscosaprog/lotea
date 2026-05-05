import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (!usuario) throw new UnauthorizedException("Credenciales incorrectas");

    const valid = await bcrypt.compare(dto.contrasena, usuario.contrasena);
    if (!valid) throw new UnauthorizedException("Credenciales incorrectas");

    const payload = { sub: usuario.id_usuario, email: usuario.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id_usuario: usuario.id_usuario,
        email: usuario.email,
        nombre: usuario.nombre,
      },
    };
  }
}
