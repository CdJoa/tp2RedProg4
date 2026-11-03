import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, SessionCookieProvider } from '@nestjs/authentication';
import type { SessionRecord } from '@nestjs/authentication';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';

@Injectable()
export class SessionAuth extends SessionCookieProvider<Usuario> {
  constructor(
    private readonly usuariosService: UsuariosService,   // ← en la guía: UsersRepository
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this);
  }

  validate(session: SessionRecord) {
    return this.usuariosService.findById(session.userId);  // ← en la guía: users.findById
  }
}
