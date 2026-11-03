import { IsString, IsNotEmpty, IsOptional, IsEmail, IsDateString, MinLength, MaxLength, Matches } from 'class-validator';


export class CreateUsuarioDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    apellido: string;

    @IsEmail({}, { message: 'El correo no es válido' })
    email: string;

    @IsString()
    @IsNotEmpty()
    nombreUsuario: string;

    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(/(?=.*[A-Z])(?=.*\d)/, {
        message: 'La contraseña debe tener al menos una mayúscula y un número',
    })
    password: string;

    @IsDateString({}, { message: 'La fecha de nacimiento no es válida' })
    fechaNacimiento: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    descripcion?: string;

    @IsOptional()
    @IsString()
    imagenPerfil?: string;
}
