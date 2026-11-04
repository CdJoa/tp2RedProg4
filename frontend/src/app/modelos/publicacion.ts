// Una publicación como la devuelve GET /publicaciones
export interface Publicacion {
  _id: string;
  titulo: string;
  descripcion: string;
  imagen: string; // URL de Cloudinary, '' si no tiene
  meGusta: string[]; // ids de los usuarios que dieron me gusta
  cantidadMeGusta: number;
  createdAt: string;
  // El back hace populate: en vez del id viene el autor
  usuario: {
    _id: string;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    imagenPerfil: string;
  };
}

// Respuesta paginada de GET /publicaciones
export interface PaginaPublicaciones {
  publicaciones: Publicacion[];
  total: number; // cuántas hay en total (para saber cuántas páginas)
  offset: number;
  limit: number;
}
