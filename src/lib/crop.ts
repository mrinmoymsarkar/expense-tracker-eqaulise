export interface PixelCrop { x: number; y: number; width: number; height: number; }

// naturalWidth/naturalHeight differ from rendered size; caller must pre-scale to natural pixels.
export async function getCroppedImg(
  src: string,
  crop: PixelCrop,
  maxDim = 1280,
  quality = 0.85
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

  const scale = Math.min(1, maxDim / Math.max(crop.width, crop.height));
  const outW = Math.round(crop.width * scale);
  const outH = Math.round(crop.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, outW, outH);
  return canvas.toDataURL('image/jpeg', quality);
}
