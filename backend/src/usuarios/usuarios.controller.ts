import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioAdminDto } from './dto/create-usuario-admin.dto.js';
import { AuthGuard } from '../guards/auth/auth.guard.js';
import { AdminGuard } from '../guards/admin/admin.guard.js';
import { FileService } from '../archivos/file.service.js';

// Sólo acepta imágenes de hasta 5 MB (foto de perfil)
const interceptorImagen = FileInterceptor('imagenPerfil', {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequestException('La imagen de perfil debe ser una imagen'), false);
    }
    cb(null, true);
  },
});

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
  @UseInterceptors(interceptorImagen)
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

  // ---------- Sólo administradores ----------

  // GET /usuarios  → listado de usuarios
  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  // POST /usuarios  (multipart/form-data: mismos campos que el registro + "perfil" + archivo "imagenPerfil")
  // Alta de un usuario nuevo, eligiendo si es 'usuario' o 'administrador'
  @UseGuards(AdminGuard)
  @Post()
  @UseInterceptors(interceptorImagen)
  async create(@Body() datos: CreateUsuarioAdminDto, @UploadedFile() imagen?: Express.Multer.File) {
    if (imagen) {
      datos.imagenPerfil = await this.files.cloudinaryUploader(imagen, 'usuarios');
    }
    return this.usuariosService.create(datos); // 201 Created
  }

  // DELETE /usuarios/:id  → baja lógica (deshabilita: ya no puede ingresar)
  @UseGuards(AdminGuard)
  @Delete(':id')
  deshabilitar(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    // Un admin no puede deshabilitarse a sí mismo (se quedaría afuera)
    if (id === req.user.sub) {
      throw new BadRequestException('No podés deshabilitar tu propio usuario');
    }
    return this.usuariosService.cambiarActivo(id, false);
  }

  // POST /usuarios/:id/habilitar  → alta lógica (vuelve a poder ingresar)
  @UseGuards(AdminGuard)
  @Post(':id/habilitar')
  @HttpCode(HttpStatus.OK)
  habilitar(@Param('id') id: string) {
    return this.usuariosService.cambiarActivo(id, true);
  }
}
