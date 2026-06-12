function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Downscale + JPEG-encode a receipt photo before sending it to the AI —
// phone camera images are 3-5MB, which is slow to upload and wastes quota.
export async function fileToCompressedDataUri(
  file: File,
  maxDim = 1280,
  quality = 0.8
): Promise<string> {
  const dataUri = await readAsDataUri(file);
  try {
    const img = await loadImage(dataUri);
    const scale = maxDim / Math.max(img.width, img.height);
    if (scale >= 1 && file.size < 500_000) return dataUri;

    const w = Math.round(img.width * Math.min(scale, 1));
    const h = Math.round(img.height * Math.min(scale, 1));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUri;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return dataUri;
  }
}
