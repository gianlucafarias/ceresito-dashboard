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
 * Genera una imagen recortada.
 * @param {string} imageSrc - La URL (usualmente Data URL) de la imagen original.
 * @param {Area} pixelCrop - El área de recorte en píxeles obtenida de react-easy-crop.
 * @param {number} rotation - Rotación en grados (no implementado aquí, pero común añadirlo).
 * @returns {Promise<Blob | null>} - Promesa que resuelve con un Blob de la imagen recortada (JPEG por defecto) o null si falla.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * maxSize;

  // Establece el tamaño del canvas para acomodar la imagen rotada
  canvas.width = safeArea;
  canvas.height = safeArea;

  // Traslada al centro del canvas
  ctx.translate(safeArea / 2, safeArea / 2);
  // Rota alrededor del centro
  ctx.rotate((rotation * Math.PI) / 180);
  // Traslada de vuelta al origen para dibujar la imagen
  ctx.translate(-image.width / 2, -image.height / 2);

  // Dibuja la imagen rotada en el canvas
  ctx.drawImage(image, 0, 0);

  // Extrae los datos de la imagen del canvas "roto"
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // Establece el tamaño final del canvas al tamaño del recorte deseado
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Pega la imagen "rota" en el canvas final, ajustando por el área de recorte y la rotación
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y)
  );

  // Devuelve el contenido del canvas como un Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9); // Calidad 0.9 para JPEG
    // Podrías usar 'image/png' si prefieres PNG
  });
} 