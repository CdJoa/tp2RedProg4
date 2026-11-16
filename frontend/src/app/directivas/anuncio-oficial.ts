import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

// Tipos de comunicado del staff: se eligen mirando el título de la publicación
const TIPOS = [
  // Va primero: "Mantenimiento finalizado" también dice "mantenimiento", pero es una buena noticia
  { palabras: ['finalizado', 'en línea'], icono: '✅', texto: 'Servidor en línea' },
  { palabras: ['parche', 'versión', 'version', 'update', 'hotfix'], icono: '🔧', texto: 'Notas del parche' },
  { palabras: ['evento', 'horda', 'helicóptero', 'helicoptero', 'torneo'], icono: '🚁', texto: 'Evento del servidor' },
  { palabras: ['mantenimiento', 'wipe', 'reinicio', 'caída', 'caida'], icono: '⚠️', texto: 'Aviso de mantenimiento' },
];
const GENERICO = { icono: '📢', texto: 'Comunicado oficial' };

// Convierte la tarjeta de una publicación en un "comunicado oficial del staff"
// cuando el autor es administrador. Si el autor es un usuario común, no hace nada.
//   <article [anuncioOficial]="publicacion().usuario.perfil" [anuncioTitulo]="publicacion().titulo">
// Agrega:
//   - la clase "anuncio-oficial" (borde mostaza, letra de máquina de escribir)
//   - una cinta arriba con franjas de peligro: "🔧 NOTAS DEL PARCHE · STAFF KNOX AVELLANEDA"
@Directive({
  selector: '[anuncioOficial]',
})
export class AnuncioOficial {
  // Perfil del autor: 'administrador' | 'usuario'
  anuncioOficial = input<string | undefined>();
  // Título de la publicación: según las palabras que tenga se elige el tipo de cinta
  anuncioTitulo = input('');

  private elemento = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  constructor() {
    effect((onCleanup) => {
      if (this.anuncioOficial() !== 'administrador') return;

      const el: HTMLElement = this.elemento.nativeElement;
      const tipo = this.tipoSegunTitulo(this.anuncioTitulo());

      // Cinta: <div class="cinta-oficial"><span>🔧 Notas del parche · Staff Knox Avellaneda</span></div>
      const cinta = this.renderer.createElement('div');
      const texto = this.renderer.createElement('span');
      this.renderer.addClass(cinta, 'cinta-oficial');
      this.renderer.appendChild(texto, this.renderer.createText(`${tipo.icono} ${tipo.texto} · Staff Knox Avellaneda`));
      this.renderer.appendChild(cinta, texto);
      this.renderer.insertBefore(el, cinta, el.firstChild);
      this.renderer.addClass(el, 'anuncio-oficial');

      // Si cambia el perfil o el título, se saca todo y el effect lo vuelve a armar
      onCleanup(() => {
        this.renderer.removeChild(el, cinta);
        this.renderer.removeClass(el, 'anuncio-oficial');
      });
    });
  }

  private tipoSegunTitulo(titulo: string) {
    const t = titulo.toLowerCase();
    return TIPOS.find((tipo) => tipo.palabras.some((p) => t.includes(p))) ?? GENERICO;
  }
}
