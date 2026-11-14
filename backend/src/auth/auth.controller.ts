import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service.js';
import { SignInDto } from './auth.dto.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
import { FileService } from '../archivos/file.service.js';
import { AuthGuard } from '../guards/auth/auth.guard.js';

interface RequestConUsuario {
  user: {
    sub: string;
    email: string;
    nombreUsuario: string;
    perfil: string;
  };
}

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

  // POST /auth/autorizar  (Header Authorization: Bearer <token>)
  // Valida el token y devuelve los datos del usuario; 401 si es inválido o venció
  @UseGuards(AuthGuard)
  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  autorizar(@Req() req: RequestConUsuario) {
    return this.authService.autorizar(req.user.sub);
  }

  // POST /auth/refrescar  (Header Authorization: Bearer <token>)
  // Valida el token y devuelve un nuevo token con la misma payload y 15m de vencimiento
  @UseGuards(AuthGuard)
  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  refrescar(@Req() req: RequestConUsuario) {
    return this.authService.refrescar(req.user);
  }
}
