// Achica la foto antes de enviarla: ~1024 px bastan para reconocer la comida y la subida es rápida
// también con datos móviles.
const MAX_SIZE = 1024
const QUALITY = 0.8

/** JPEG en base64 (para la API) y como data URL (para verla). */
export async function resizePhoto(file: Blob) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(1, MAX_SIZE / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.naturalWidth * scale)
    canvas.height = Math.round(image.naturalHeight * scale)
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
    const preview = canvas.toDataURL('image/jpeg', QUALITY)
    return { preview, base64: preview.slice(preview.indexOf(',') + 1) }
  } finally {
    URL.revokeObjectURL(url)
  }
}
