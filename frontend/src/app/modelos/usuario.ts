export interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcion: string;
  imagenPerfil: string;
  perfil: 'usuario' | 'administrador';
  activo?: boolean; // false = deshabilitado por un admin (los viejos no lo tienen)
  createdAt: string;
  updatedAt: string;
}
