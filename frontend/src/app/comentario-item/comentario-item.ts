import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../servicios/auth';
import { PublicacionesService } from '../servicios/publicaciones';
import { Comentario } from '../modelos/comentario';
import { mensajeDeError } from '../validadores/validadores';

// Un comentario (con el lápiz para editarlo si es mío).
// Lo usan la vista previa de la tarjeta y la página publicación.
@Component({
  imports: [DatePipe, ReactiveFormsModule],
  selector: 'app-comentario-item',
  styleUrl: './comentario-item.css',
  templateUrl: './comentario-item.html',
})
export class ComentarioItem {
  private auth = inject(Auth);
  private publicacionesService = inject(PublicacionesService);

  comentario = input.required<Comentario>();
  // true en la vista previa de la tarjeta: más chico y sólo el @usuario
  compacto = input(false);
  // Avisa al padre que se eliminó, para que lo saque de la lista
  eliminado = output<string>();

  // Copia local: arranca con lo que llega del padre y se reemplaza al editar
  protected actual = linkedSignal(() => this.comentario());

  // Sólo el autor ve el lápiz (el back igual responde 403 si no lo es)
  protected esMio = computed(() => this.actual().usuario._id === this.auth.usuarioActual()?._id);
  // Eliminar: el autor o un administrador (el back controla lo mismo)
  protected puedeEliminar = computed(() => this.esMio() || this.auth.esAdmin());

  // Modal de confirmación para eliminar
  protected confirmandoEliminar = signal(false);
  protected eliminando = signal(false);
  protected errorEliminar = signal<string | null>(null);

  protected editando = signal(false);
  protected texto = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500)],
  });
  protected guardando = signal(false);
  protected error = signal<string | null>(null);

  // Abre la edición: el texto actual pasa al textarea
  protected empezarEdicion() {
    this.texto.setValue(this.actual().mensaje);
    this.error.set(null);
    this.editando.set(true);
  }

  protected cancelar() {
    this.editando.set(false);
    this.error.set(null);
  }

  // PUT: el back cambia el mensaje y marca modificado: true
  protected guardar() {
    const nuevo = this.texto.value.trim();
    if (!nuevo || this.texto.invalid || this.guardando()) return;

    // Si no cambió nada, sólo cierra (no lo marca como editado)
    if (nuevo === this.actual().mensaje) {
      this.cancelar();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    const { _id, publicacion } = this.actual();
    this.publicacionesService.editarComentario(publicacion, _id, nuevo).subscribe({
      next: (editado) => {
        this.actual.set(editado);
        this.guardando.set(false);
        this.editando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudo editar el comentario'));
        this.guardando.set(false);
      },
    });
  }

  // DELETE: baja lógica del comentario
  protected confirmarEliminar() {
    if (this.eliminando()) return;
    this.eliminando.set(true);
    this.errorEliminar.set(null);
    const { _id, publicacion } = this.actual();
    this.publicacionesService.eliminarComentario(publicacion, _id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.confirmandoEliminar.set(false);
        this.eliminado.emit(_id);
      },
      error: (err: HttpErrorResponse) => {
        this.eliminando.set(false);
        this.errorEliminar.set(mensajeDeError(err, 'No se pudo eliminar el comentario'));
      },
    });
  }
}
