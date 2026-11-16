import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../servicios/auth';
import { sinEspaciosVacios } from '../validadores/validadores';
import { ErrorLoginPipe } from '../pipes/error-login-pipe';
import { Zumbido } from '../directivas/zumbido';

@Component({
  imports: [ReactiveFormsModule, RouterLink, ErrorLoginPipe, Zumbido],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected enviando = signal(false);
  // El error tal cual lo devuelve el back: el pipe errorLogin arma el mensaje
  protected errorServidor = signal<HttpErrorResponse | null>(null);
  // Cada intento fallido suma 1: la directiva zumbido hace temblar el formulario
  protected intentosFallidos = signal(0);
  // Llega con ?vencida=true cuando se cerró la sesión porque venció el token
  protected sesionVencida = this.route.snapshot.queryParamMap.has('vencida');
  protected verPassword = signal(false);

  protected form = this.fb.nonNullable.group({
    identificador: ['', [Validators.required, sinEspaciosVacios()]],
    password: ['', Validators.required],
  });

  // Muestra errores sólo después de que el usuario tocó el campo (o intentó enviar)
  protected mostrarError(campo: 'identificador' | 'password'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  protected enviar() {
    this.errorServidor.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.intentosFallidos.update((n) => n + 1); // campos vacíos: también tiembla
      return;
    }

    this.enviando.set(true);
    const { identificador, password } = this.form.getRawValue();

    this.auth.login({ identificador: identificador.trim(), password }).subscribe({
      next: () => {
        this.enviando.set(false);
        // Pasa por la pantalla de cargando (spinner + /auth/autorizar) antes de ir al destino
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigate(['/cargando'], {
          queryParams: returnUrl ? { returnUrl } : undefined,
        });
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        // 401: datos incorrectos · 403: cuenta deshabilitada (el pipe elige el mensaje)
        this.errorServidor.set(err);
        this.intentosFallidos.update((n) => n + 1);
      },
    });
  }
}
