import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordHasher } from '@nestjs/authentication';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
  ) {}

  // Registro: UsuariosService.create ya hashea la contraseña y
  // devuelve 409 si el email o el nombre de usuario ya existen.
  async register(datos: CreateUsuarioDto) {
    const usuario = await this.usuariosService.create(datos);
    return this.generarRespuesta(usuario);
  }

  // Login con correo o nombre de usuario. 401 si los datos son incorrectos.
  async login(identificador: string, password: string) {
    const usuario = await this.usuariosService.findCredentials(identificador);
    // Si no existe el usuario, verify() compara contra un hash falso, así el
    // tiempo de respuesta no revela qué emails/usuarios están registrados.
    const valido = await this.passwordHasher.verify(password, usuario?.password);
    if (!valido || !usuario?.password) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    // Si cambiaron los parámetros del hash desde que se guardó, se actualiza
    // ahora que tenemos la contraseña en texto plano.
    if (this.passwordHasher.needsRehash(usuario.password)) {
      await this.usuariosService.updatePassword(
        usuario.id,
        await this.passwordHasher.hash(password),
      );
    }
    const { password: _, ...usuarioSinPassword } = usuario.toObject();
    return this.generarRespuesta(usuarioSinPassword);
  }

  // Firma el JWT y lo devuelve junto con todos los datos del usuario.
  private async generarRespuesta(usuario: {
    _id: unknown;
    email: string;
    nombreUsuario: string;
    perfil: string;
  }) {
    // Payload: quién es el usuario y su rol (lo pide el TP)
    const payload = {
      sub: String(usuario._id),
      email: usuario.email,
      nombreUsuario: usuario.nombreUsuario,
      perfil: usuario.perfil,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario,
    };
  }
}
