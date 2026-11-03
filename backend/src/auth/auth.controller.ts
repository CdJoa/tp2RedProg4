import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '@nestjs/authentication';
import { CredentialsService } from './credentials.service.js';
import { SignInDto } from './auth.dto.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
import { FileService } from '../archivos/file.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly credentials: CredentialsService,
    private readonly files: FileService,
  ) {}

  // POST /auth/registro  (multipart/form-data: campos del usuario + archivo "imagenPerfil")
  @Public()
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
    return this.credentials.register(datos); // 201 Created
  }

  // POST /auth/login  (JSON: { identificador, password })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() { identificador, password }: SignInDto) {
    const usuario = await this.credentials.verify(identificador, password);
    if (!usuario) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    return usuario;
  }
}
