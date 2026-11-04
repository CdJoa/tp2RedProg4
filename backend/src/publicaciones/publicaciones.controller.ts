import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PublicacionesService } from './publicaciones.service.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { AuthGuard } from '../guards/auth/auth.guard.js';
import { FileService } from '../archivos/file.service.js';

@Controller('publicaciones')
export class PublicacionesController {
  constructor(
    private readonly publicacionesService: PublicacionesService,
    private readonly files: FileService,
  ) {}

  // POST /publicaciones  (multipart/form-data: titulo, descripcion + archivo "imagen" opcional)
  // Requiere token
  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(
    // Lee el form-data y deja el archivo "imagen" disponible en @UploadedFile()
    FileInterceptor('imagen', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('El archivo debe ser una imagen'), false);
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @Body() createPublicacionDto: CreatePublicacionDto,
    @Req() req: { user: { sub: string } },
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    // Si mandó imagen, se sube a Cloudinary y se guarda la URL
    const urlImagen = imagen ? await this.files.cloudinaryUploader(imagen, 'publicaciones') : '';
    // El AuthGuard dejó el contenido del token en req.user; sub = id del usuario
    return this.publicacionesService.create(createPublicacionDto, req.user.sub, urlImagen);
  }

  // GET /publicaciones?orden=fecha|meGusta&direccion=desc|asc&usuario=<id>&offset=0&limit=10
  // Todos los parámetros son opcionales; si no vienen se usan los valores por defecto
  @Get()
  findAll(
    @Query('orden', new DefaultValuePipe('fecha')) orden: string,
    @Query('direccion', new DefaultValuePipe('desc')) direccion: string,
    @Query('usuario') usuario: string | undefined,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.publicacionesService.findAll(orden, direccion, usuario, offset, limit);
  }

  // DELETE /publicaciones/:id  → baja lógica (sólo el autor)
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.publicacionesService.remove(id, req.user.sub);
  }

  // POST /publicaciones/:id/me-gusta
  @UseGuards(AuthGuard)
  @Post(':id/me-gusta')
  @HttpCode(HttpStatus.OK)
  darMeGusta(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.publicacionesService.darMeGusta(id, req.user.sub);
  }

  // DELETE /publicaciones/:id/me-gusta
  @UseGuards(AuthGuard)
  @Delete(':id/me-gusta')
  quitarMeGusta(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.publicacionesService.quitarMeGusta(id, req.user.sub);
  }
}
