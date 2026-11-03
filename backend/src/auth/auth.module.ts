import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { ArchivosModule } from '../archivos/archivos.module.js';
import { SessionAuth } from './session-auth.provider.js';
import { CredentialsService } from './credentials.service.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [UsuariosModule, ArchivosModule],      // ← en la guía: UsersModule
  controllers: [AuthController],
  providers: [SessionAuth, CredentialsService],
})
export class AuthModule {}
