import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PublicacionesService } from './publicaciones.service.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto.js';
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

  @Get()
  findAll() {
    return this.publicacionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publicacionesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePublicacionDto: UpdatePublicacionDto) {
    return this.publicacionesService.update(+id, updatePublicacionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.publicacionesService.remove(+id);
  }
}
