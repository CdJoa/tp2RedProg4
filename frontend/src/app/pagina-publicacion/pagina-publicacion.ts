import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicacionesService } from '../servicios/publicaciones';
import { Auth } from '../servicios/auth';
import { Publicacion as PublicacionModelo } from '../modelos/publicacion';
import { Comentario } from '../modelos/comentario';
import { Publicacion } from '../publicacion/publicacion';
import { mensajeDeError } from '../validadores/validadores';

// Cuántos comentarios trae cada pedido (primera carga y cada "Cargar más")
const COMENTARIOS_POR_PEDIDO = 5;

// Página publicación: la publicación en grande + todos sus comentarios (el "hilo")
@Component({
  imports: [DatePipe, ReactiveFormsModule, RouterLink, Publicacion],
  selector: 'app-pagina-publicacion',
  styleUrl: './pagina-publicacion.css',
  templateUrl: './pagina-publicacion.html',
})
export class PaginaPublicacion implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicacionesService = inject(PublicacionesService);
  private auth = inject(Auth);

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

  // Edición: id del comentario que se está editando (null = ninguno)
  protected editandoId = signal<string | null>(null);
  protected textoEdicion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(500)],
  });
  protected guardandoEdicion = signal(false);
  protected errorEdicion = signal<string | null>(null);

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

  // ¿El comentario es mío? (sólo el autor ve el botón Editar)
  protected esMio(comentario: Comentario) {
    return comentario.usuario._id === this.auth.usuarioActual()?._id;
  }

  // Abre la edición: el texto actual pasa al textarea
  protected empezarEdicion(comentario: Comentario) {
    this.editandoId.set(comentario._id);
    this.textoEdicion.setValue(comentario.mensaje);
    this.errorEdicion.set(null);
  }

  protected cancelarEdicion() {
    this.editandoId.set(null);
    this.errorEdicion.set(null);
  }

  // PUT: el back cambia el mensaje y marca modificado: true
  protected guardarEdicion(comentario: Comentario) {
    const texto = this.textoEdicion.value.trim();
    if (!texto || this.textoEdicion.invalid || this.guardandoEdicion()) return;

    // Si no cambió nada, sólo cierra (no lo marca como editado)
    if (texto === comentario.mensaje) {
      this.cancelarEdicion();
      return;
    }

    this.guardandoEdicion.set(true);
    this.errorEdicion.set(null);
    this.publicacionesService.editarComentario(this.id, comentario._id, texto).subscribe({
      next: (editado) => {
        // Reemplaza el comentario en la lista, sin moverlo de lugar
        this.comentarios.update((actuales) =>
          actuales.map((c) => (c._id === editado._id ? editado : c)),
        );
        this.guardandoEdicion.set(false);
        this.editandoId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.errorEdicion.set(mensajeDeError(err, 'No se pudo editar el comentario'));
        this.guardandoEdicion.set(false);
      },
    });
  }

  // Si borro la publicación desde acá, vuelvo al listado
  protected alEliminar() {
    this.router.navigateByUrl('/publicaciones');
  }
}
