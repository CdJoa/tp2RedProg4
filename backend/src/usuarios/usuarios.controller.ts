import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { AuthGuard } from '../guards/auth/auth.guard.js';
import { FileService } from '../archivos/file.service.js';


// Todas las rutas de /usuarios requieren un JWT válido (Authorization: Bearer)
@UseGuards(AuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly files: FileService,
  ) {}

  // PATCH /usuarios/foto  (multipart/form-data: archivo "imagenPerfil")
  // Cambia la foto de perfil del usuario del token (cada uno sólo la suya)
  @Patch('foto')
  @UseInterceptors(
    FileInterceptor('imagenPerfil', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('La imagen de perfil debe ser una imagen'), false);
        }
        cb(null, true);
      },
    }),
  )
  async cambiarFoto(
    @Req() req: { user: { sub: string } },
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    if (!imagen) {
      throw new BadRequestException('Debe enviar una imagen');
    }
    const url = await this.files.cloudinaryUploader(imagen, 'usuarios');
    return this.usuariosService.updateImagenPerfil(req.user.sub, url);
  }

  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuariosService.update(+id, updateUsuarioDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(+id);
  }
}
