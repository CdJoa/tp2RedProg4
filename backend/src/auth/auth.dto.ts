import { IsNotEmpty, IsString } from 'class-validator';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';

// Registro: mismos campos y validaciones que la entidad Usuario
// (nombre, apellido, email, nombreUsuario, password, fechaNacimiento,
// descripcion, imagenPerfil). El perfil no se recibe: por defecto es 'usuario'.
export class SignUpDto extends CreateUsuarioDto {}

// Login: se puede ingresar con el correo o con el nombre de usuario (ambos únicos).
export class SignInDto {
  @IsString()
  @IsNotEmpty({ message: 'Debe ingresar su correo o nombre de usuario' })
  identificador: string;

  @IsString()
  @IsNotEmpty({ message: 'Debe ingresar la contraseña' })
  password: string;
}
