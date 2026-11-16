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
    // Baja lógica: un administrador lo deshabilitó
    if (usuario.activo === false) {
      throw new UnauthorizedException('Tu usuario está deshabilitado. No estás autorizado a ingresar');
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

  // Valida que el usuario del token siga existiendo y devuelve sus datos actualizados.
  async autorizar(usuarioId: string) {
    const usuario = await this.usuariosService.findById(usuarioId);
    if (!usuario) {
      throw new UnauthorizedException('El usuario no existe');
    }
    if (usuario.activo === false) {
      throw new UnauthorizedException('Tu usuario está deshabilitado');
    }
    return usuario;
  }

  // Firma un nuevo token con la misma payload (sin exp ni iat viejos) y 15m nuevos de validez.
  async refrescar(payload: {
    sub: string;
    email: string;
    nombreUsuario: string;
    perfil: string;
  }) {
    const usuario = await this.usuariosService.findById(payload.sub);
    if (!usuario || usuario.activo === false) {
      throw new UnauthorizedException('Tu usuario está deshabilitado');
    }
    const nuevoPayload = {
      sub: payload.sub,
      email: payload.email,
      nombreUsuario: payload.nombreUsuario,
      perfil: payload.perfil,
    };
    return {
      access_token: await this.jwtService.signAsync(nuevoPayload),
    };
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
