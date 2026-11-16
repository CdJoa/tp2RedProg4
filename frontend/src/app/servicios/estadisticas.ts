import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface PublicacionesPorUsuario {
  usuarioId: string;
  nombreUsuario: string;
  cantidad: number;
}

// Cantidades por día (comentarios o usuarios registrados)
export interface PorDia {
  total: number;
  dias: { fecha: string; cantidad: number }[]; // fecha: 'YYYY-MM-DD'
}

export interface ComentariosPorPublicacion {
  publicacionId: string;
  titulo: string;
  cantidad: number;
}

// GET /estadisticas/... (sólo admin). desde/hasta: 'YYYY-MM-DD'
@Service()
export class EstadisticasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/estadisticas`;

  private params(desde: string, hasta: string) {
    return new HttpParams().set('desde', desde).set('hasta', hasta);
  }

  publicacionesPorUsuario(desde: string, hasta: string) {
    return this.http.get<PublicacionesPorUsuario[]>(`${this.apiUrl}/publicaciones-por-usuario`, {
      params: this.params(desde, hasta),
    });
  }

  comentarios(desde: string, hasta: string) {
    return this.http.get<PorDia>(`${this.apiUrl}/comentarios`, {
      params: this.params(desde, hasta),
    });
  }

  // Usuarios registrados por día
  usuarios(desde: string, hasta: string) {
    return this.http.get<PorDia>(`${this.apiUrl}/usuarios`, { params: this.params(desde, hasta) });
  }

  comentariosPorPublicacion(desde: string, hasta: string) {
    return this.http.get<ComentariosPorPublicacion[]>(`${this.apiUrl}/comentarios-por-publicacion`, {
      params: this.params(desde, hasta),
    });
  }
}
