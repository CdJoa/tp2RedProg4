import { Component, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicacionesService } from '../servicios/publicaciones';
import { archivoImagen, mensajeDeError, sinEspaciosVacios } from '../validadores/validadores';

// Formulario para crear una publicación (título, descripción e imagen opcional)
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-nueva-publicacion',
  styleUrl: './nueva-publicacion.css',
  templateUrl: './nueva-publicacion.html',
})
export class NuevaPublicacion {
  private fb = inject(FormBuilder);
  private publicacionesService = inject(PublicacionesService);

  // Avisa al padre que se creó, para que recargue la lista
  creada = output<void>();

  protected enviando = signal(false);
  protected errorServidor = signal<string | null>(null);

  protected form = this.fb.group({
    titulo: ['', [Validators.required, sinEspaciosVacios(), Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, sinEspaciosVacios(), Validators.maxLength(1000)]],
    imagen: [null as File | null, [archivoImagen(5)]],
  });

  protected get c() {
    return this.form.controls;
  }

  protected mostrarError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  // El input file no se enlaza con formControlName: se toma el archivo del evento
  protected seleccionarImagen(evento: Event) {
    const archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
    this.c.imagen.setValue(archivo);
    this.c.imagen.markAsTouched();
  }

  protected enviar(inputImagen: HTMLInputElement) {
    this.errorServidor.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    const { titulo, descripcion, imagen } = this.form.getRawValue();

    this.publicacionesService.crear(titulo!.trim(), descripcion!.trim(), imagen).subscribe({
      next: () => {
        this.enviando.set(false);
        this.form.reset();
        inputImagen.value = ''; // limpia el archivo elegido
        this.creada.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorServidor.set(mensajeDeError(err, 'No se pudo publicar'));
      },
    });
  }
}
