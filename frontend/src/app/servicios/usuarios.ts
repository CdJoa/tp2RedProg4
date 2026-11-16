import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { Usuario } from '../modelos/usuario';
import { environment } from '../../environments/environment';
import { RegistroDatos, armarFormDataUsuario } from './auth';

// Rutas de /usuarios que sólo puede usar un administrador (el token lo agrega el interceptor)
@Service()
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  // GET /usuarios
  listar() {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  // POST /usuarios (multipart/form-data): mismos datos que el registro + perfil.
  // A diferencia del registro, NO inicia sesión con el usuario nuevo.
  crear(datos: RegistroDatos, perfil: 'usuario' | 'administrador') {
    return armarFormDataUsuario(datos, perfil).pipe(
      switchMap((formData) => this.http.post<Usuario>(this.apiUrl, formData)),
    );
  }

  // DELETE /usuarios/:id  → baja lógica (ya no puede ingresar)
  deshabilitar(id: string) {
    return this.http.delete<Usuario>(`${this.apiUrl}/${id}`);
  }

  // POST /usuarios/:id/habilitar  → alta lógica
  habilitar(id: string) {
    return this.http.post<Usuario>(`${this.apiUrl}/${id}/habilitar`, {});
  }
}
