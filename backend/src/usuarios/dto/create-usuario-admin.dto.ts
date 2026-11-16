import { IsIn, IsOptional } from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto.js';

// Alta de usuario hecha por un administrador (POST /usuarios):
// los mismos datos que el registro + el perfil elegido.
// (En el registro público NO existe este campo, así nadie se hace admin solo)
export class CreateUsuarioAdminDto extends CreateUsuarioDto {
  @IsOptional()
  @IsIn(['usuario', 'administrador'], { message: "El perfil debe ser 'usuario' o 'administrador'" })
  perfil?: string;
}
