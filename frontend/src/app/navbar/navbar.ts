import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../servicios/auth';
import { TiempoRestantePipe } from '../pipes/tiempo-restante-pipe';
import { SERVIDOR } from '../servidor';
import { EstadoServidor } from '../servicios/estado-servidor';
import { EstadoServidorPipe } from '../pipes/estado-servidor-pipe';
import { LuzServidor } from '../directivas/luz-servidor';

@Component({
  imports: [RouterLink, RouterLinkActive, TiempoRestantePipe, EstadoServidorPipe, LuzServidor],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  protected servidor = SERVIDOR;
  // Online / en mantenimiento (se actualiza solo cada 30 s)
  protected estado = inject(EstadoServidor);
  protected auth = inject(Auth);
  private router = inject(Router);

  cerrarSesion() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
