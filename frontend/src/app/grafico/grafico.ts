import { Component, ElementRef, effect, input, viewChild } from '@angular/core';
import Chart, { ChartType } from 'chart.js/auto';

// Colores de la página (azules) + algunos de contraste para las tortas
const COLORES = [
  '#1f6fb8', '#6db3ec', '#0b3c6e', '#e0b44c', '#d9578a',
  '#45a3e8', '#8fd19e', '#9fd2f7', '#c42b1c', '#7a9ec7',
];

// Envuelve Chart.js: le pasás el tipo, las etiquetas y los valores, y dibuja el gráfico.
//   <app-grafico tipo="pie" [etiquetas]="['ana', 'joa']" [valores]="[3, 5]" serie="Publicaciones" />
// Cada vez que cambian los datos, lo vuelve a dibujar.
@Component({
  selector: 'app-grafico',
  template: '<div class="lienzo"><canvas #lienzo></canvas></div>',
  styles: ':host { display: block; } .lienzo { position: relative; height: 300px; }',
})
export class Grafico {
  tipo = input.required<Extract<ChartType, 'pie' | 'doughnut' | 'bar' | 'line'>>();
  etiquetas = input.required<string[]>();
  valores = input.required<number[]>();
  // Nombre de la serie (aparece en el tooltip / leyenda)
  serie = input('Cantidad');
  // Sólo barras: true = barras acostadas (las etiquetas largas se leen mejor)
  horizontal = input(false);
  // Color principal de barras/líneas (las tortas usan la paleta)
  color = input('#1f6fb8');

  private lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private grafico?: Chart;

  constructor() {
    // effect: se ejecuta al inicio y cada vez que cambia algún input que lee
    effect((onCleanup) => {
      const tipo = this.tipo();
      const esTorta = tipo === 'pie' || tipo === 'doughnut';
      const color = this.color();
      const horizontal = this.horizontal();

      this.grafico = new Chart(this.lienzo().nativeElement, {
        type: tipo,
        data: {
          labels: this.etiquetas(),
          datasets: [
            {
              label: this.serie(),
              data: this.valores(),
              // Torta: un color por porción. Barras/líneas: el azul de la página
              // (color + '26' = el mismo color con 15% de opacidad, para el relleno de la línea)
              backgroundColor: esTorta ? COLORES : tipo === 'line' ? color + '26' : color + 'cc',
              borderColor: esTorta ? '#ffffff' : color,
              borderWidth: esTorta ? 2 : tipo === 'line' ? 2.5 : 1,
              fill: tipo === 'line',
              tension: 0.3, // líneas un poco curvas
            },
          ],
        },
        options: {
          responsive: true,
          indexAxis: horizontal ? 'y' : 'x',
          maintainAspectRatio: false,
          plugins: {
            // En la torta la leyenda dice qué color es cada usuario; en barras/líneas sobra
            legend: { display: esTorta, position: 'right' },
          },
          // El eje de los números arranca en 0 y sólo muestra enteros
          scales: esTorta
            ? {}
            : { [horizontal ? 'x' : 'y']: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });

      // Antes de volver a dibujar (o al salir de la página) se destruye el anterior
      onCleanup(() => this.grafico?.destroy());
    });
  }
}
