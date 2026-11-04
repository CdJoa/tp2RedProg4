import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';
import { mensajeDeError, passwordFuerte, sinEspaciosVacios } from '../../validadores/validadores';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  protected enviando = signal(false);
  protected errorServidor = signal<string | null>(null);
  protected verPassword = signal(false);

  protected form = this.fb.nonNullable.group({
    identificador: ['', [Validators.required, sinEspaciosVacios()]],
    password: ['', [Validators.required, Validators.minLength(8), passwordFuerte()]],
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
      return;
    }

    this.enviando.set(true);
    const { identificador, password } = this.form.getRawValue();

    this.auth.login({ identificador: identificador.trim(), password }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigate(['/home']);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorServidor.set(
          err.status === 401
            ? 'Usuario o contraseña incorrectos'
            : mensajeDeError(err, 'No se pudo iniciar sesión'),
        );
      },
    });
  }
}
