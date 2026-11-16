import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesService } from './publicaciones.service.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { ComentariosController } from './comentarios.controller.js';
import { EstadisticasController } from './estadisticas.controller.js';
import { EstadisticasService } from './estadisticas.service.js';
import { ServidorController } from './servidor.controller.js';
import { ServidorService } from './servidor.service.js';
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
  controllers: [PublicacionesController, ComentariosController, EstadisticasController, ServidorController],
  providers: [PublicacionesService, EstadisticasService, ServidorService],
})
export class PublicacionesModule {}
