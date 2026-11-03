import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PasswordHasher } from '@nestjs/authentication';
import { UsuariosService } from './usuarios.service.js';
import { UsuariosController } from './usuarios.controller.js';
import { Usuario, UsuarioSchema } from './entities/usuario.entity.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
  ],
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    // De @nestjs/authentication sólo usamos el hasher (scrypt). Se registra
    // a mano porque ya no se importa AuthenticationModule (sesiones).
    { provide: PasswordHasher, useValue: new PasswordHasher() },
  ],
  exports: [UsuariosService, PasswordHasher],
})
export class UsuariosModule {}
