import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth, RegistroDatos } from '../servicios/auth';
import { UsuariosService } from '../servicios/usuarios';
import { Usuario } from '../modelos/usuario';
import {
  archivoImagen,
  camposIguales,
  fechaNacimientoValida,
  mensajeDeError,
  passwordFuerte,
  sinEspaciosVacios,
} from '../validadores/validadores';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);

  // Modo admin (dashboard/usuarios): el mismo formulario, pero
  // - muestra los radio buttons para elegir el perfil
  // - crea el usuario con POST /usuarios (NO inicia sesión con él)
  // - avisa al padre con (creado) en vez de navegar
  modoAdmin = input(false);
  creado = output<Usuario>();

  protected readonly maxDescripcion = 200;
  protected readonly maxImagenMB = 5;

  // Opciones de los selects de fecha
  protected readonly dias = Array.from({ length: 31 }, (_, i) => i + 1);
  protected readonly meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  protected readonly anios = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

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
      fechaNacimiento: this.fb.group(
        { dia: [''], mes: [''], anio: [''] },
        { validators: fechaNacimientoValida(13) },
      ),
      descripcion: ['', [Validators.maxLength(this.maxDescripcion)]],
      imagenPerfil: [null as File | null, [archivoImagen(this.maxImagenMB)]],
      // Sólo se usa en modo admin (radio buttons)
      perfil: ['usuario' as 'usuario' | 'administrador'],
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

  // El error de fecha aparece recién cuando se tocaron los tres selects (o al enviar)
  protected mostrarErrorFecha(): boolean {
    const f = this.c.fechaNacimiento;
    const tocados = Object.values(f.controls).every((c) => c.touched);
    return f.invalid && tocados;
  }

  // El back espera la fecha como 'YYYY-MM-DD'
  private fechaIso(): string {
    const { dia, mes, anio } = this.c.fechaNacimiento.getRawValue();
    return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
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
    const datos: RegistroDatos = {
      nombre: v.nombre!.trim(),
      apellido: v.apellido!.trim(),
      email: v.email!.trim(),
      nombreUsuario: v.nombreUsuario!.trim(),
      password: v.password!,
      fechaNacimiento: this.fechaIso(),
      descripcion: v.descripcion?.trim() || undefined,
      imagenPerfil: v.imagenPerfil,
    };

    if (this.modoAdmin()) {
      this.crearComoAdmin(datos, v.perfil ?? 'usuario');
      return;
    }

    this.auth.registrar(datos).subscribe({
      next: () => {
        this.enviando.set(false);
        // Pasa por la pantalla de cargando (spinner + /auth/autorizar) antes de ir a publicaciones
        this.router.navigate(['/cargando']);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        // 409: el back avisa qué campo está repetido ("Ya existe un usuario con ese email")
        this.errorServidor.set(mensajeDeError(err, 'No se pudo completar el registro'));
      },
    });
  }

  // Alta hecha por un administrador: POST /usuarios con el perfil elegido
  private crearComoAdmin(datos: RegistroDatos, perfil: 'usuario' | 'administrador') {
    this.usuariosService.crear(datos, perfil).subscribe({
      next: (usuario) => {
        this.enviando.set(false);
        // Deja el formulario vacío para cargar otro
        this.form.reset({ perfil: 'usuario' });
        this.limpiarPreview();
        this.creado.emit(usuario);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorServidor.set(mensajeDeError(err, 'No se pudo crear el usuario'));
      },
    });
  }

  private limpiarPreview() {
    const url = this.preview();
    if (url) URL.revokeObjectURL(url);
    this.preview.set(null);
  }
}
