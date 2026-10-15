// Browser and server share upload formats and limits; the server also checks bytes.
export const IMAGE_UPLOAD_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024
export const IMAGE_UPLOAD_ACCEPT = Object.keys(IMAGE_UPLOAD_TYPES).join(',')

export function imageUploadExtension(mimeType: string) {
  return Object.hasOwn(IMAGE_UPLOAD_TYPES, mimeType)
    ? IMAGE_UPLOAD_TYPES[mimeType as keyof typeof IMAGE_UPLOAD_TYPES]
    : undefined
}

export function isAllowedImageUpload(mimeType: string, size: number) {
  return imageUploadExtension(mimeType) !== undefined && size <= MAX_IMAGE_UPLOAD_BYTES
}
