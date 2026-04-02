/**
 * Image Storage Utility
 * Manages image storage in IndexedDB with ID-based references and content deduplication.
 * IndexedDB provides much larger storage quota than localStorage (~hundreds of MB).
 */

import { useEffect, useState } from "react";

export interface StoredImage {
  id: string;
  base64Data: string;
  timestamp: number;
  type: string; // mime type
}

const DB_NAME = "sapom-images";
const DB_VERSION = 1;
const STORE_NAME = "images";
const IMAGE_HASH_INDEX_KEY = "stored_images_hash_index";

// ── Migration: purge legacy localStorage image data eagerly ───────────
// Runs once on module load so localStorage quota is freed before anything else.
localStorage.removeItem("stored_images");
localStorage.removeItem("stored_images_hash_index");

// ── IndexedDB helpers ──────────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

function idbGet(id: string): Promise<StoredImage | undefined> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result as StoredImage | undefined);
        req.onerror = () => reject(req.error);
      }),
  );
}

function idbPut(record: StoredImage): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
  );
}

function idbDelete(id: string): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
  );
}

function idbGetAll(): Promise<StoredImage[]> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as StoredImage[]);
        req.onerror = () => reject(req.error);
      }),
  );
}

// ── Hash index (small, stays in localStorage) ──────────────────────────

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

// ── Public API (async) ─────────────────────────────────────────────────

/**
 * Store an image with deduplication — returns existing ID if the same content is already stored.
 */
export async function storeImageDeduped(
  base64Data: string,
  type: string = "image/jpeg",
): Promise<string> {
  const hash = simpleHash(base64Data);
  const hashIndex = getHashIndex();
  if (hashIndex[hash]) {
    const existingId = hashIndex[hash];
    const existing = await idbGet(existingId);
    if (existing) {
      return existingId; // already stored, reuse
    }
    // was deleted; fall through to re-store
    delete hashIndex[hash];
    setHashIndex(hashIndex);
  }
  const imageId = await storeImage(base64Data, type);
  hashIndex[hash] = imageId;
  setHashIndex(hashIndex);
  return imageId;
}

/**
 * Store an image and return its ID
 */
export async function storeImage(
  base64Data: string,
  type: string = "image/jpeg",
): Promise<string> {
  const imageId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const storedImage: StoredImage = {
    id: imageId,
    base64Data,
    timestamp: Date.now(),
    type,
  };

  await idbPut(storedImage);
  return imageId;
}

/**
 * Retrieve an image by ID
 */
export async function getImage(imageId: string): Promise<string | null> {
  const record = await idbGet(imageId);
  return record?.base64Data || null;
}

/**
 * Delete an image by ID
 */
export async function deleteImage(imageId: string): Promise<void> {
  await idbDelete(imageId);
}

/**
 * Clean up old images (older than 30 days)
 */
export async function cleanupOldImages(): Promise<void> {
  const all = await idbGetAll();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const toDelete = all.filter((img) => img.timestamp <= thirtyDaysAgo);
  for (const img of toDelete) {
    await idbDelete(img.id);
  }
}

// ── React hook for consuming images ────────────────────────────────────

/**
 * React hook that asynchronously loads an image from IndexedDB.
 * Returns null while loading, then the base64 data string (or null if not found).
 */
export function useImage(imageId: string | undefined | null): string | null {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    if (!imageId) {
      setData(null);
      return;
    }
    let cancelled = false;
    getImage(imageId).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  return data;
}

/**
 * React hook that loads multiple images by ID from IndexedDB.
 * Returns a Map<imageId, base64Data>. Useful when a component needs
 * several images (e.g. revision before/after comparisons).
 */
export function useImageMap(
  ids: (string | undefined | null)[],
): Map<string, string> {
  const [map, setMap] = useState<Map<string, string>>(new Map());
  const key = ids.filter(Boolean).sort().join(",");

  useEffect(() => {
    const validIds = [...new Set(ids.filter(Boolean) as string[])];
    if (validIds.length === 0) {
      setMap(new Map());
      return;
    }
    let cancelled = false;
    Promise.all(
      validIds.map((id) => getImage(id).then((data) => [id, data] as const)),
    ).then((entries) => {
      if (!cancelled) {
        const m = new Map<string, string>();
        for (const [id, data] of entries) {
          if (data) m.set(id, data);
        }
        setMap(m);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return map;
}
