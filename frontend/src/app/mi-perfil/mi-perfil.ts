import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Auth } from '../servicios/auth';
import { PublicacionesService } from '../servicios/publicaciones';
import { Publicacion as PublicacionModelo } from '../modelos/publicacion';
import { Publicacion } from '../publicacion/publicacion';
import { mensajeDeError } from '../validadores/validadores';

@Component({
  imports: [DatePipe, Publicacion],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil implements OnInit {
  protected auth = inject(Auth);
  private publicacionesService = inject(PublicacionesService);

  protected misPublicaciones = signal<PublicacionModelo[]>([]);
  // true si la foto de perfil no se pudo cargar
  protected fotoFallo = signal(false);
  protected subiendoFoto = signal(false);
  protected errorFoto = signal<string | null>(null);

  ngOnInit() {
    this.cargarMisPublicaciones();
  }

  // Se eligió un archivo en el selector: lo valida y lo sube
  protected cambiarFoto(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo después
    if (!archivo) return;

    this.errorFoto.set(null);
    if (!archivo.type.startsWith('image/')) {
      this.errorFoto.set('El archivo debe ser una imagen');
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.errorFoto.set('La imagen no puede superar los 5 MB');
      return;
    }

    this.subiendoFoto.set(true);
    this.auth.cambiarFoto(archivo).subscribe({
      next: () => {
        this.subiendoFoto.set(false);
        this.fotoFallo.set(false); // la nueva foto se vuelve a intentar mostrar
        this.cargarMisPublicaciones(); // así mis publicaciones muestran la foto nueva
      },
      error: (err: HttpErrorResponse) => {
        this.subiendoFoto.set(false);
        this.errorFoto.set(mensajeDeError(err, 'No se pudo cambiar la foto'));
      },
    });
  }

  // Mis últimas 3: filtra por mi id, ordena por fecha y trae 3
  protected cargarMisPublicaciones() {
    const usuario = this.auth.usuarioActual();
    if (!usuario) return;
    this.publicacionesService.listar('fecha', 0, 3, usuario._id).subscribe({
      next: (respuesta) => this.misPublicaciones.set(respuesta.publicaciones),
    });
  }
}
