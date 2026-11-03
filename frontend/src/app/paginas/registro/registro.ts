import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth';
import {
  archivoImagen,
  camposIguales,
  edadMinima,
  mensajeDeError,
  passwordFuerte,
  sinEspaciosVacios,
} from '../../validadores/validadores';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  protected readonly maxDescripcion = 200;
  protected readonly maxImagenMB = 5;

  protected enviando = signal(false);
  protected errorServidor = signal<string | null>(null);
  protected verPassword = signal(false);
  protected preview = signal<string | null>(null);

  protected form = this.fb.group(
    {
      nombre: ['', [Validators.required, sinEspaciosVacios(), Validators.maxLength(50)]],
      apellido: ['', [Validators.required, sinEspaciosVacios(), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      nombreUsuario: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern(/^[a-zA-Z0-9_.]+$/),
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(8), passwordFuerte()]],
      repetirPassword: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required, edadMinima(13)]],
      descripcion: ['', [Validators.maxLength(this.maxDescripcion)]],
      imagenPerfil: [null as File | null, [archivoImagen(this.maxImagenMB)]],
    },
    { validators: camposIguales('password', 'repetirPassword') },
  );

  constructor() {
    // liberar la URL de la vista previa al salir de la página
    inject(DestroyRef).onDestroy(() => this.limpiarPreview());
  }

  protected get c() {
    return this.form.controls;
  }

  protected mostrarError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected passwordsNoCoinciden(): boolean {
    const repetir = this.c.repetirPassword;
    return this.form.hasError('noCoinciden') && (repetir.touched || repetir.dirty);
  }

  // Los <input type="file"> no se pueden enlazar con formControlName:
  // tomamos el archivo del evento y lo guardamos en el control a mano.
  protected seleccionarImagen(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    const control = this.c.imagenPerfil;

    control.setValue(archivo);
    control.markAsTouched();
    this.limpiarPreview();

    if (archivo && control.valid) {
      this.preview.set(URL.createObjectURL(archivo));
    }
  }

  protected quitarImagen(input: HTMLInputElement) {
    input.value = '';
    this.c.imagenPerfil.setValue(null);
    this.limpiarPreview();
  }

  protected enviar() {
    this.errorServidor.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    const v = this.form.getRawValue();

    this.auth
      .registrar({
        nombre: v.nombre!.trim(),
        apellido: v.apellido!.trim(),
        email: v.email!.trim(),
        nombreUsuario: v.nombreUsuario!.trim(),
        password: v.password!,
        fechaNacimiento: v.fechaNacimiento!,
        descripcion: v.descripcion?.trim() || undefined,
        imagenPerfil: v.imagenPerfil,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.router.navigate(['/login']);
        },
        error: (err: HttpErrorResponse) => {
          this.enviando.set(false);
          // 409: el back avisa qué campo está repetido ("Ya existe un usuario con ese email")
          this.errorServidor.set(mensajeDeError(err, 'No se pudo completar el registro'));
        },
      });
  }

  private limpiarPreview() {
    const url = this.preview();
    if (url) URL.revokeObjectURL(url);
    this.preview.set(null);
  }
}
