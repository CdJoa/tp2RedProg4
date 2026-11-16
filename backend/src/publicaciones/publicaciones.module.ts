import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesService } from './publicaciones.service.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { ComentariosController } from './comentarios.controller.js';
import { Publicacion, PublicacionSchema } from './entities/publicacion.entity.js';
import { Comentario, ComentarioSchema } from './entities/comentario.entity.js';
import { ArchivosModule } from '../archivos/archivos.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
    ArchivosModule, // FileService para subir la imagen a Cloudinary
  ],
  controllers: [PublicacionesController, ComentariosController],
  providers: [PublicacionesService],
})
export class PublicacionesModule {}
