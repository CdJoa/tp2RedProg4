import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicacionesService } from '../servicios/publicaciones';
import { Publicacion as PublicacionModelo } from '../modelos/publicacion';
import { Comentario } from '../modelos/comentario';
import { Publicacion } from '../publicacion/publicacion';
import { ComentarioItem } from '../comentario-item/comentario-item';
import { mensajeDeError } from '../validadores/validadores';

// Cuántos comentarios trae cada pedido (primera carga y cada "Cargar más")
const COMENTARIOS_POR_PEDIDO = 5;

// Página publicación: la publicación en grande + todos sus comentarios (el "hilo")
@Component({
  imports: [ReactiveFormsModule, RouterLink, Publicacion, ComentarioItem],
  selector: 'app-pagina-publicacion',
  styleUrl: './pagina-publicacion.css',
  templateUrl: './pagina-publicacion.html',
})
export class PaginaPublicacion implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicacionesService = inject(PublicacionesService);

  // El id viene de la URL: /publicacion/:id
  private id = this.route.snapshot.paramMap.get('id')!;

  protected publicacion = signal<PublicacionModelo | null>(null);
  protected error = signal<string | null>(null);

  protected comentarios = signal<Comentario[]>([]);
  protected totalComentarios = signal(0);
  protected cargandoComentarios = signal(false);
  // Hay más para traer si todavía no mostramos todos
  protected hayMas = computed(() => this.comentarios().length < this.totalComentarios());

  // Formulario para comentar
  protected mensaje = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500)],
  });
  protected enviando = signal(false);
  protected errorComentario = signal<string | null>(null);

  ngOnInit() {
    this.publicacionesService.obtener(this.id).subscribe({
      next: (publicacion) => this.publicacion.set(publicacion),
      error: (err: HttpErrorResponse) =>
        this.error.set(mensajeDeError(err, 'No se pudo cargar la publicación')),
    });
    this.cargarMas();
  }

  // Trae los siguientes comentarios y los agrega al final, sin borrar los anteriores.
  // El offset es la cantidad que ya tenemos en pantalla.
  protected cargarMas() {
    if (this.cargandoComentarios()) return;
    this.cargandoComentarios.set(true);
    this.publicacionesService
      .listarComentarios(this.id, this.comentarios().length, COMENTARIOS_POR_PEDIDO)
      .subscribe({
        next: (respuesta) => {
          this.comentarios.update((actuales) => [...actuales, ...respuesta.comentarios]);
          this.totalComentarios.set(respuesta.total);
          this.cargandoComentarios.set(false);
        },
        error: () => this.cargandoComentarios.set(false),
      });
  }

  protected comentar() {
    const texto = this.mensaje.value.trim();
    if (!texto || this.mensaje.invalid || this.enviando()) return;

    this.enviando.set(true);
    this.errorComentario.set(null);
    this.publicacionesService.comentar(this.id, texto).subscribe({
      next: (nuevo) => {
        // El más reciente va arriba (mismo orden que devuelve el back)
        this.comentarios.update((actuales) => [nuevo, ...actuales]);
        this.totalComentarios.update((n) => n + 1);
        this.mensaje.reset();
        this.enviando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorComentario.set(mensajeDeError(err, 'No se pudo publicar el comentario'));
        this.enviando.set(false);
      },
    });
  }

  // Se eliminó un comentario: lo saca de la lista y baja el total
  protected alEliminarComentario(id: string) {
    this.comentarios.update((actuales) => actuales.filter((c) => c._id !== id));
    this.totalComentarios.update((n) => n - 1);
  }

  // Si borro la publicación desde acá, vuelvo al listado
  protected alEliminar() {
    this.router.navigateByUrl('/publicaciones');
  }
}
