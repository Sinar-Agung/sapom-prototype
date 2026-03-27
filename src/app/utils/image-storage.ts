/**
 * Image Storage Utility
 * Manages image storage in localStorage with ID-based references and content deduplication
 */

export interface StoredImage {
  id: string;
  base64Data: string;
  timestamp: number;
  type: string; // mime type
}

const IMAGE_STORAGE_KEY = "stored_images";
const IMAGE_HASH_INDEX_KEY = "stored_images_hash_index";

/** Simple djb2 hash for content deduplication */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash.toString(36);
}

function getHashIndex(): Record<string, string> {
  const stored = localStorage.getItem(IMAGE_HASH_INDEX_KEY);
  return stored ? JSON.parse(stored) : {};
}

function setHashIndex(index: Record<string, string>): void {
  localStorage.setItem(IMAGE_HASH_INDEX_KEY, JSON.stringify(index));
}

/**
 * Store an image with deduplication — returns existing ID if the same content is already stored.
 */
export function storeImageDeduped(
  base64Data: string,
  type: string = "image/jpeg",
): string {
  const hash = simpleHash(base64Data);
  const hashIndex = getHashIndex();
  if (hashIndex[hash]) {
    const existingId = hashIndex[hash];
    const images = getStoredImages();
    if (images[existingId]) {
      return existingId; // already stored, reuse
    }
    // was deleted; fall through to re-store
    delete hashIndex[hash];
    setHashIndex(hashIndex);
  }
  const imageId = storeImage(base64Data, type);
  hashIndex[hash] = imageId;
  setHashIndex(hashIndex);
  return imageId;
}

/**
 * Store an image and return its ID
 */
export function storeImage(
  base64Data: string,
  type: string = "image/jpeg",
): string {
  const imageId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const storedImage: StoredImage = {
    id: imageId,
    base64Data,
    timestamp: Date.now(),
    type,
  };

  // Get existing images
  const existingImages = getStoredImages();
  existingImages[imageId] = storedImage;

  // Save back to localStorage
  localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(existingImages));

  return imageId;
}

/**
 * Retrieve an image by ID
 */
export function getImage(imageId: string): string | null {
  const images = getStoredImages();
  return images[imageId]?.base64Data || null;
}

/**
 * Get all stored images
 */
export function getStoredImages(): Record<string, StoredImage> {
  const stored = localStorage.getItem(IMAGE_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

/**
 * Delete an image by ID
 */
export function deleteImage(imageId: string): void {
  const images = getStoredImages();
  delete images[imageId];
  localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
}

/**
 * Clean up old images (older than 30 days)
 */
export function cleanupOldImages(): void {
  const images = getStoredImages();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const filtered = Object.entries(images)
    .filter(([_, img]) => img.timestamp > thirtyDaysAgo)
    .reduce(
      (acc, [id, img]) => {
        acc[id] = img;
        return acc;
      },
      {} as Record<string, StoredImage>,
    );

  localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(filtered));
}
