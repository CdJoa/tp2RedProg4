import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../servicios/auth';

// Tiempo mínimo en pantalla para que el spinner se vea bien al iniciar o loguearse
const TIEMPO_MINIMO_MS = 1600;

@Component({
  selector: 'app-cargando',
  styleUrl: './cargando.css',
  templateUrl: './cargando.html',
})
export class Cargando implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const inicio = Date.now();
    const token = this.auth.token();

    // Espera lo que falte para cumplir el tiempo mínimo antes de redirigir
    const redirigirDespues = (fn: () => void) => {
      const restante = Math.max(0, TIEMPO_MINIMO_MS - (Date.now() - inicio));
      setTimeout(fn, restante);
    };

    if (!token) {
      this.auth.logout();
      this.auth.sesionValidada.set(true);
      redirigirDespues(() => this.router.navigateByUrl('/login', { replaceUrl: true }));
      return;
    }

    // Valida el token guardado contra POST /auth/autorizar
    this.auth.autorizar().subscribe({
      next: () => {
        const destino = this.route.snapshot.queryParamMap.get('returnUrl') || '/publicaciones';
        redirigirDespues(() => this.router.navigateByUrl(destino, { replaceUrl: true }));
      },
      error: () => {
        this.auth.logout();
        this.auth.sesionValidada.set(true);
        redirigirDespues(() => this.router.navigateByUrl('/login', { replaceUrl: true }));
      },
    });
  }
}

