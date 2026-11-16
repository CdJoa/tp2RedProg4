import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

// Panel de administración (/dashboard): pestañas + la página elegida abajo.
// Las páginas son rutas hijas: /dashboard/usuarios y /dashboard/estadisticas
@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-panel',
  styleUrl: './panel.css',
  templateUrl: './panel.html',
})
export class Panel {}
