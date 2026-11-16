import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PublicacionesService } from './publicaciones.service.js';
import { ComentarioDto } from './dto/comentario.dto.js';
import { AuthGuard } from '../guards/auth/auth.guard.js';

@UseGuards(AuthGuard)
@Controller('publicaciones/:id/comentarios')
export class ComentariosController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  // GET /publicaciones/:id/comentarios?offset=0&limit=5
  // Trae los comentarios de esa publicación, ordenados del más reciente al más antiguo
  @Get()
  listarComentarios(
    @Param('id') publicacionId: string,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.publicacionesService.listarComentarios(publicacionId, offset, limit);
  }

  // POST /publicaciones/:id/comentarios  (JSON: { mensaje })
  // Agrega un comentario a la publicación junto con el usuario del token y la fecha
  @Post()
  crearComentario(
    @Param('id') publicacionId: string,
    @Body() dto: ComentarioDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.publicacionesService.crearComentario(publicacionId, req.user.sub, dto.mensaje);
  }

  // PUT /publicaciones/:id/comentarios/:comentarioId  (JSON: { mensaje })
  // Modifica el mensaje del comentario (sólo su autor) y marca modificado: true
  @Put(':comentarioId')
  editarComentario(
    @Param('id') publicacionId: string,
    @Param('comentarioId') comentarioId: string,
    @Body() dto: ComentarioDto,
    @Req() req: { user: { sub: string } },
  ) {
    return this.publicacionesService.editarComentario(
      publicacionId,
      comentarioId,
      req.user.sub,
      dto.mensaje,
    );
  }
}

