import { Area } from 'react-easy-crop';

/**
 * Crea un objeto Image a partir de una URL.
 * @param {string} url - La URL de la imagen.
 * @returns {Promise<HTMLImageElement>} - Promesa que resuelve con el elemento Image.
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // Necesario para evitar errores de CORS si la imagen no es Data URL
    // Aunque en nuestro caso usamos Data URL, es buena práctica incluirlo.
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Genera una imagen recortada (versión simplificada sin rotación para ahorrar memoria).
 * @param {string} imageSrc - La URL (usualmente Data URL) de la imagen original.
 * @param {Area} pixelCrop - El área de recorte en píxeles obtenida de react-easy-crop.
 * @returns {Promise<Blob | null>} - Promesa que resuelve con un Blob de la imagen recortada (JPEG por defecto) o null si falla.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('No se pudo obtener el contexto 2D del canvas');
    return null;
  }

  // Establecer el tamaño del canvas al tamaño del recorte deseado
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Dibujar solo la parte recortada de la imagen original en el canvas
  // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  ctx.drawImage(
    image,        // Imagen fuente
    pixelCrop.x,  // Coordenada X de inicio del recorte en la fuente
    pixelCrop.y,  // Coordenada Y de inicio del recorte en la fuente
    pixelCrop.width, // Ancho del recorte en la fuente
    pixelCrop.height, // Alto del recorte en la fuente
    0,            // Coordenada X de inicio del dibujo en el canvas destino
    0,            // Coordenada Y de inicio del dibujo en el canvas destino
    pixelCrop.width, // Ancho del dibujo en el canvas destino
    pixelCrop.height // Alto del dibujo en el canvas destino
  );

  // Devuelve el contenido del canvas como un Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('La creación del Blob falló.');
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.9); // Calidad 0.9 para JPEG
  });
} 