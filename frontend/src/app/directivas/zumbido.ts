import { DOCUMENT, Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

// Zumbido estilo MSN Messenger: tiembla, suena y (en el celular) vibra.
//   <form [zumbido]="intentosFallidos()" [zumbidoPantalla]="true">
// Cada vez que el valor CAMBIA a algo distinto de 0/null/false, se dispara.
// (Por eso conviene pasarle un contador: cada fallo nuevo suma 1 y vuelve a zumbar)
@Directive({
  selector: '[zumbido]',
})
export class Zumbido {
  zumbido = input<unknown>();
  // true: tiembla toda la pantalla (como la ventana del MSN). false: sólo este elemento
  zumbidoPantalla = input(false);
  // Sonido "bzzz" generado con Web Audio (no usa archivos de audio)
  zumbidoSonido = input(true);

  private elemento = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private documento = inject(DOCUMENT);

  constructor() {
    effect(() => {
      if (this.zumbido()) {
        this.temblar();
        if (this.zumbidoSonido()) this.sonar();
        // Celulares: vibración real (los navegadores que no la soportan la ignoran)
        navigator.vibrate?.([120, 60, 120, 60, 200]);
      }
    });
  }

  private temblar() {
    const el: HTMLElement = this.zumbidoPantalla() ? this.documento.body : this.elemento.nativeElement;
    // Si ya estaba temblando, reinicia la animación:
    // se saca la clase, se fuerza al navegador a "repintar" y se vuelve a poner
    this.renderer.removeClass(el, 'zumbando');
    void el.offsetWidth;
    this.renderer.addClass(el, 'zumbando');

    // Al terminar la animación (definida en styles.css) se saca la clase
    const quitar = this.renderer.listen(el, 'animationend', () => {
      this.renderer.removeClass(el, 'zumbando');
      quitar();
    });
  }

  // "Bzzz": un tono grave que sube y baja rápido (como un zumbido), durante 0,6 s
  private sonar() {
    try {
      const audio = new AudioContext();
      const ahora = audio.currentTime;
      const duracion = 0.6;

      // Tono base: onda "diente de sierra", suena áspera como un zumbido
      const tono = audio.createOscillator();
      tono.type = 'sawtooth';
      tono.frequency.setValueAtTime(140, ahora);

      // Un segundo oscilador mueve la frecuencia del primero: eso hace el "bzz-bzz-bzz"
      const vibrato = audio.createOscillator();
      vibrato.frequency.setValueAtTime(28, ahora);
      const intensidadVibrato = audio.createGain();
      intensidadVibrato.gain.setValueAtTime(60, ahora);
      vibrato.connect(intensidadVibrato).connect(tono.frequency);

      // Volumen: entra rápido y se apaga al final (sin "clic")
      const volumen = audio.createGain();
      volumen.gain.setValueAtTime(0, ahora);
      volumen.gain.linearRampToValueAtTime(0.18, ahora + 0.03);
      volumen.gain.setValueAtTime(0.18, ahora + duracion - 0.12);
      volumen.gain.linearRampToValueAtTime(0, ahora + duracion);

      tono.connect(volumen).connect(audio.destination);
      tono.start(ahora);
      vibrato.start(ahora);
      tono.stop(ahora + duracion);
      vibrato.stop(ahora + duracion);
      tono.onended = () => audio.close();
    } catch {
      // Navegador sin Web Audio: zumba sin sonido
    }
  }
}
