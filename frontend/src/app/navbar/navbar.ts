import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../servicios/auth';
import { TiempoRestantePipe } from '../pipes/tiempo-restante-pipe';

@Component({
  imports: [RouterLink, RouterLinkActive, TiempoRestantePipe],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  protected auth = inject(Auth);
  private router = inject(Router);

  cerrarSesion() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
