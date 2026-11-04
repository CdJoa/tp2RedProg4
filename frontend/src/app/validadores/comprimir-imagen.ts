// En Vercel, los pedidos de más de ~1 MB se cortan con un 503 antes de llegar
// al back. Por eso, antes de subir una imagen se la achica en el navegador:
// se dibuja en un <canvas> con un tamaño máximo y se guarda como JPEG.
// Una foto de celular de 4 MB queda en unos pocos cientos de KB.

const LADO_MAXIMO = 1280; // px: el lado más largo de la imagen
const CALIDAD = 0.8; // calidad del JPEG (0 a 1)
export const MAXIMO_A_SUBIR = 1024 * 1024; // 1 MB: lo que se manda como máximo

export async function comprimirImagen(archivo: File): Promise<File> {
  // Los GIF se dejan como están (al pasarlos por el canvas pierden la animación)
  if (archivo.type === 'image/gif') {
    return archivo;
  }

  const imagen = await createImageBitmap(archivo);

  // Escala manteniendo la proporción, sin agrandar las imágenes chicas
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const ancho = Math.round(imagen.width * escala);
  const alto = Math.round(imagen.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'white'; // fondo blanco: el JPEG no tiene transparencia
  ctx.fillRect(0, 0, ancho, alto);
  ctx.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', CALIDAD));
  if (!blob || blob.size >= archivo.size) {
    return archivo; // si no se pudo o no achicó, se usa la original
  }

  const nombre = archivo.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], nombre, { type: 'image/jpeg' });
}
