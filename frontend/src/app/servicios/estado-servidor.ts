import { DestroyRef, Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface RespuestaEstado {
  online: boolean;
  desde: string | null; // fecha del último comunicado de mantenimiento
}

// Cada cuánto se vuelve a preguntar el estado (así todos se enteran del mantenimiento)
const CADA_MS = 30_000;

// Estado del servidor de juego: online o en mantenimiento.
// Lo usan la navbar, el login y la pestaña Mantenimiento del panel.
// GET /servidor/estado es público: funciona también sin sesión (en el login).
@Service()
export class EstadoServidor {
  private http = inject(HttpClient);

  readonly online = signal(true);
  readonly desde = signal<string | null>(null);

  constructor() {
    this.actualizar();
    const intervalo = setInterval(() => this.actualizar(), CADA_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalo));
  }

  // Pregunta al back. Se llama sola cada 30 s, y apenas el admin publica un aviso.
  actualizar() {
    this.http.get<RespuestaEstado>(`${environment.apiUrl}/servidor/estado`).subscribe({
      next: ({ online, desde }) => {
        this.online.set(online);
        this.desde.set(desde);
      },
      // Si falla (sin conexión), se deja el último estado conocido
      error: () => {},
    });
  }
}
