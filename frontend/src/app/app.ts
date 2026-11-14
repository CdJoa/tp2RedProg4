import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { Auth } from './servicios/auth';
import { TiempoRestantePipe } from './pipes/tiempo-restante-pipe';

@Component({
  imports: [RouterOutlet, Navbar, TiempoRestantePipe],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
  protected readonly auth = inject(Auth);

  protected extenderSesion() {
    this.auth.refrescar().subscribe();
  }

  protected noExtenderSesion() {
    this.auth.cerrarModalSesion();
  }
}
