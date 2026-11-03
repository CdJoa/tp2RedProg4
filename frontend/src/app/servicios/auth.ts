import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Usuario } from '../modelos/usuario';

export interface RegistroDatos {
  nombre: string;
  apellido: string;
  email: string;
  nombreUsuario: string;
  password: string;
  fechaNacimiento: string;
  descripcion?: string;
}

export interface LoginDatos {
  usuario: string; // email o nombre de usuario
  password: string;
}

@Service()
export class Auth {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000';

  // usuario logueado (se guarda en localStorage para no perderlo al recargar)
  usuarioActual = signal<Usuario | null>(this.leerUsuarioGuardado());

  registrar(datos: RegistroDatos): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, datos);
  }

  login(datos: LoginDatos): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/auth/login`, datos).pipe(
      tap((usuario) => {
        localStorage.setItem('usuario', JSON.stringify(usuario));
        this.usuarioActual.set(usuario);
      }),
    );
  }

  logout() {
    localStorage.removeItem('usuario');
    this.usuarioActual.set(null);
  }

  private leerUsuarioGuardado(): Usuario | null {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  }
}
