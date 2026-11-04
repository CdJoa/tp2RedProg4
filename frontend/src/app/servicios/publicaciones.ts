import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Publicacion } from '../modelos/publicacion';
import { environment } from '../../environments/environment';

@Service()
export class PublicacionesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  listar(): Observable<Publicacion[]> {
    return this.http.get<Publicacion[]>(`${this.apiUrl}/publicaciones`);
  }
}
