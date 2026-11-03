import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service.js';
import { SignInDto } from './auth.dto.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
import { FileService } from '../archivos/file.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly files: FileService,
  ) {}

  // POST /auth/registro  (multipart/form-data: campos del usuario + archivo "imagenPerfil")
  @Post('registro')
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
  async registro(
    @Body() datos: CreateUsuarioDto,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    if (imagen) {
      datos.imagenPerfil = await this.files.cloudinaryUploader(imagen);
    }
    return this.authService.register(datos); // 201 Created: { access_token, usuario }
  }

  // POST /auth/login  (JSON: { identificador, password })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() { identificador, password }: SignInDto) {
    return this.authService.login(identificador, password); // 200: { access_token, usuario } o 401
  }
}
