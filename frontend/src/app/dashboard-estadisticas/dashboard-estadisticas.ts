import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NgTemplateOutlet } from '@angular/common';
import { Observable } from 'rxjs';
import { EstadisticasService, PorDia } from '../servicios/estadisticas';
import { Grafico } from '../grafico/grafico';
import { mensajeDeError } from '../validadores/validadores';

// Fecha local en formato 'YYYY-MM-DD' (lo que usan los <input type="date"> y el back)
function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// Un gráfico con su propio lapso de tiempo (la consigna pide poder elegirlo en cada uno).
// Guarda las fechas, los datos que llegaron y el estado de carga.
class Bloque<T> {
  desde = signal(aIso(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))); // por defecto: últimos 30 días
  hasta = signal(aIso(new Date()));
  datos = signal<T | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);

  constructor(private pedir: (desde: string, hasta: string) => Observable<T>) {}

  // Se llama al entrar y cada vez que se cambia una fecha
  cargar() {
    if (!this.desde() || !this.hasta()) return;
    if (this.desde() > this.hasta()) {
      this.error.set("La fecha 'desde' no puede ser posterior a 'hasta'");
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.pedir(this.desde(), this.hasta()).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar los datos'));
        this.cargando.set(false);
      },
    });
  }

  cambiarDesde(valor: string) {
    this.desde.set(valor);
    this.cargar();
  }

  cambiarHasta(valor: string) {
    this.hasta.set(valor);
    this.cargar();
  }
}

// Un punto por cada día del lapso (los días sin datos valen 0), con etiquetas dd/MM
function serieDiaria(datos: PorDia | null, desde: string, hasta: string) {
  const etiquetas: string[] = [];
  const valores: number[] = [];
  if (!datos) return { etiquetas, valores };

  const porFecha = new Map(datos.dias.map((d) => [d.fecha, d.cantidad]));
  const dia = new Date(`${desde}T00:00:00`);
  const fin = new Date(`${hasta}T00:00:00`);
  while (dia <= fin) {
    const iso = aIso(dia);
    etiquetas.push(`${iso.slice(8, 10)}/${iso.slice(5, 7)}`);
    valores.push(porFecha.get(iso) ?? 0);
    dia.setDate(dia.getDate() + 1);
  }
  return { etiquetas, valores };
}

// Dashboard/estadísticas (sólo administradores): gráficos de distinto tipo
@Component({
  imports: [Grafico, NgTemplateOutlet],
  selector: 'app-dashboard-estadisticas',
  styleUrl: './dashboard-estadisticas.css',
  templateUrl: './dashboard-estadisticas.html',
})
export class DashboardEstadisticas implements OnInit {
  private estadisticas = inject(EstadisticasService);

  // 1) Publicaciones por usuario → torta
  protected publicaciones = new Bloque((d, h) => this.estadisticas.publicacionesPorUsuario(d, h));
  // 2) Comentarios en el lapso (por día) → líneas
  protected comentarios = new Bloque((d, h) => this.estadisticas.comentarios(d, h));
  // 3) Comentarios por publicación → barras horizontales
  protected porPublicacion = new Bloque((d, h) => this.estadisticas.comentariosPorPublicacion(d, h));
  // 4) Usuarios registrados por día → barras verticales
  protected usuarios = new Bloque((d, h) => this.estadisticas.usuarios(d, h));

  // Los arrays para los gráficos se arman con computed: así sólo cambian cuando llegan datos
  // nuevos (si se armaran en el template, el gráfico se redibujaría a cada rato)
  protected publicacionesEtiquetas = computed(() =>
    (this.publicaciones.datos() ?? []).map((p) => '@' + p.nombreUsuario),
  );
  protected publicacionesValores = computed(() => (this.publicaciones.datos() ?? []).map((p) => p.cantidad));
  protected totalPublicaciones = computed(() => this.publicacionesValores().reduce((a, b) => a + b, 0));

  // Línea: comentarios de cada día del lapso
  private serieComentarios = computed(() =>
    serieDiaria(this.comentarios.datos(), this.comentarios.desde(), this.comentarios.hasta()),
  );
  protected comentariosEtiquetas = computed(() => this.serieComentarios().etiquetas);
  protected comentariosValores = computed(() => this.serieComentarios().valores);

  // Barras: título de la publicación (cortado si es muy largo)
  protected porPublicacionEtiquetas = computed(() =>
    (this.porPublicacion.datos() ?? []).map((p) => (p.titulo.length > 22 ? p.titulo.slice(0, 20) + '…' : p.titulo)),
  );
  protected porPublicacionValores = computed(() => (this.porPublicacion.datos() ?? []).map((p) => p.cantidad));

  // Barras: usuarios registrados cada día del lapso
  private serieUsuarios = computed(() =>
    serieDiaria(this.usuarios.datos(), this.usuarios.desde(), this.usuarios.hasta()),
  );
  protected usuariosEtiquetas = computed(() => this.serieUsuarios().etiquetas);
  protected usuariosValores = computed(() => this.serieUsuarios().valores);

  ngOnInit() {
    this.publicaciones.cargar();
    this.comentarios.cargar();
    this.porPublicacion.cargar();
    this.usuarios.cargar();
  }
}
