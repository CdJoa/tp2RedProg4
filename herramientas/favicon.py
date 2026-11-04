"""Genera el logo de Conecta2s: cuadrado azul redondeado con una cabecita
blanca con anteojos 3D (rojo/azul) y gorrito navideño.

No necesita librerías: dibuja con formas simples, suaviza los bordes con
supersampling y escribe los archivos PNG/ICO a mano.

Uso (desde la raíz del proyecto):
    python3 herramientas/favicon.py

Genera:
    frontend/public/favicon.ico  (16, 32, 48 y 64 px)
    frontend/public/logo.png     (128 px, el de la navbar)

Para cambiar el dibujo, editá las CAPAS (colores y posiciones van de 0 a 1).
"""
import os
import struct
import zlib

SS = 4  # supersampling por eje (suaviza los bordes)
PUBLIC = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public')


# ---------- Formas: cada una devuelve una función (x, y) -> ¿está adentro? ----------

def rect_redondeado(x0, y0, x1, y1, r):
    def dentro(x, y):
        if not (x0 <= x <= x1 and y0 <= y <= y1):
            return False
        cx = min(max(x, x0 + r), x1 - r)
        cy = min(max(y, y0 + r), y1 - r)
        return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
    return dentro


def circulo(cx, cy, r):
    return lambda x, y: (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def elipse(cx, cy, rx, ry):
    return lambda x, y: ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1


def poligono(puntos):
    def dentro(x, y):
        adentro = False
        j = len(puntos) - 1
        for i in range(len(puntos)):
            xi, yi = puntos[i]
            xj, yj = puntos[j]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                adentro = not adentro
            j = i
        return adentro
    return dentro


def sonrisa(x, y):
    return elipse(0.5, 0.74, 0.11, 0.065)(x, y) and not elipse(0.5, 0.72, 0.11, 0.065)(x, y) and y > 0.74


def color_fondo(x, y):
    # degradé vertical azul claro -> azul, con brillo en la mitad de arriba
    c0, c1 = (110, 190, 245), (22, 98, 178)
    base = tuple(c0[i] + (c1[i] - c0[i]) * y for i in range(3))
    if y < 0.48:
        base = tuple(v + (255 - v) * 0.22 for v in base)
    return (*base, 255)


# ---------- El dibujo: capas de atrás hacia adelante (forma, color RGBA) ----------
CAPAS = [
    (rect_redondeado(0.0, 0.0, 1.0, 1.0, 0.2), color_fondo),                                     # fondo azul
    (circulo(0.5, 0.62, 0.30), (10, 50, 100, 70)),                                               # sombra de la cabeza
    (circulo(0.5, 0.60, 0.28), (255, 255, 255, 255)),                                            # cabeza
    (poligono([(0.22, 0.42), (0.80, 0.42), (0.86, 0.10), (0.62, 0.16)]), (214, 30, 40, 255)),    # gorro rojo
    (rect_redondeado(0.18, 0.36, 0.82, 0.47, 0.05), (250, 250, 250, 255)),                       # ala del gorro
    (circulo(0.86, 0.12, 0.085), (250, 250, 250, 255)),                                          # pompón
    (rect_redondeado(0.20, 0.53, 0.80, 0.69, 0.03), (45, 45, 55, 255)),                          # marco anteojos
    (rect_redondeado(0.235, 0.56, 0.475, 0.665, 0.02), (230, 30, 40, 255)),                      # lente roja
    (rect_redondeado(0.525, 0.56, 0.765, 0.665, 0.02), (30, 70, 230, 255)),                      # lente azul
    (sonrisa, (60, 60, 70, 255)),                                                                # sonrisa
]


# ---------- Dibujo y archivos ----------

def mezclar(fondo, color):
    r, g, b, a = color
    fr, fg, fb, fa = fondo
    sa, fa = a / 255, fa / 255
    oa = sa + fa * (1 - sa)
    if oa == 0:
        return (0, 0, 0, 0)
    def canal(c, fc):
        return (c * sa + fc * fa * (1 - sa)) / oa
    return (canal(r, fr), canal(g, fg), canal(b, fb), oa * 255)


def dibujar(tam):
    pixeles = []
    for py in range(tam):
        fila = []
        for px in range(tam):
            acum = [0.0, 0.0, 0.0, 0.0]
            for sy in range(SS):
                for sx in range(SS):
                    x = (px + (sx + 0.5) / SS) / tam
                    y = (py + (sy + 0.5) / SS) / tam
                    c = (0, 0, 0, 0)
                    for forma, color in CAPAS:
                        if forma(x, y):
                            c = mezclar(c, color(x, y) if callable(color) else color)
                    a = c[3] / 255
                    for i in range(3):
                        acum[i] += c[i] * a
                    acum[3] += a
            n = SS * SS
            a = acum[3] / n
            fila.append(tuple(round(acum[i] / n / a) for i in range(3)) + (round(a * 255),) if a > 0 else (0, 0, 0, 0))
        pixeles.append(fila)
    return pixeles


def png(pixeles):
    alto, ancho = len(pixeles), len(pixeles[0])
    crudo = b''.join(b'\x00' + bytes(v for p in fila for v in p) for fila in pixeles)
    def bloque(tipo, datos):
        return struct.pack('>I', len(datos)) + tipo + datos + struct.pack('>I', zlib.crc32(tipo + datos) & 0xFFFFFFFF)
    return (b'\x89PNG\r\n\x1a\n'
            + bloque(b'IHDR', struct.pack('>IIBBBBB', ancho, alto, 8, 6, 0, 0, 0))
            + bloque(b'IDAT', zlib.compress(crudo, 9))
            + bloque(b'IEND', b''))


def ico(imagenes):
    # ICO con PNGs adentro (lo soportan Windows desde Vista y todos los navegadores)
    cabecera = struct.pack('<HHH', 0, 1, len(imagenes))
    offset = 6 + 16 * len(imagenes)
    entradas, datos = b'', b''
    for tam, data in imagenes:
        entradas += struct.pack('<BBBBHHII', tam % 256, tam % 256, 0, 0, 1, 32, len(data), offset)
        datos += data
        offset += len(data)
    return cabecera + entradas + datos


if __name__ == '__main__':
    destino_ico = os.path.join(PUBLIC, 'favicon.ico')
    destino_png = os.path.join(PUBLIC, 'logo.png')
    with open(destino_ico, 'wb') as f:
        f.write(ico([(t, png(dibujar(t))) for t in (16, 32, 48, 64)]))
    with open(destino_png, 'wb') as f:
        f.write(png(dibujar(128)))
    print('Generados:', os.path.normpath(destino_ico), 'y', os.path.normpath(destino_png))
