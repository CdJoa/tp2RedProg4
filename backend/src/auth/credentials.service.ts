import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  // Registro: UsuariosService.create ya hashea la contraseña y
  // devuelve 409 si el email o el nombre de usuario ya existen.
  async register(datos: CreateUsuarioDto) {
    return this.usuariosService.create(datos);
  }

  /** El usuario (sin password), o `null` si el identificador o la contraseña son incorrectos. */
  async verify(identificador: string, password: string) {
    const usuario = await this.usuariosService.findCredentials(identificador);
    // Si no existe el usuario, verify() compara contra un hash falso, así el
    // tiempo de respuesta no revela qué emails/usuarios están registrados.
    const valido = await this.passwordHasher.verify(password, usuario?.password);
    if (!valido || !usuario?.password) {
      return null;
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
    return usuarioSinPassword;
  }
}
