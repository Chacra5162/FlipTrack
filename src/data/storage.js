/**
 * storage.js - Supabase Storage management for item images
 * Handles uploading, deleting, and migrating images to/from cloud storage.
 */

import { inv, save } from './store.js';
import { getCurrentUser, getSupabaseClient } from './auth.js';

// ── STORAGE CONFIGURATION ──────────────────────────────────────────────────
const IMG_BUCKET = 'item-images';

// ── BASE64 → BLOB (robust, works on all browsers including mobile Safari) ──
function dataUrlToBlob(dataUrl) {
  try {
    const [header, b64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch (e) {
    throw new Error('Failed to convert image: ' + e.message);
  }
}

// ── UPLOAD IMAGE TO STORAGE ───────────────────────────────────────────────
export async function uploadImageToStorage(dataUrl, itemId, slotIdx) {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();

  if (!_sb || !_currentUser) throw new Error('Not authenticated');

  const blob = dataUrlToBlob(dataUrl);
  const userId = _currentUser.id;
  const filename = `${itemId}_${slotIdx}_${Date.now()}.jpg`;
  const path = `${userId}/${filename}`;

  const { error } = await _sb.storage.from(IMG_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true
  });

  if (error) throw new Error(error.message);

  const urlResult = _sb.storage.from(IMG_BUCKET).getPublicUrl(path);
  const publicUrl = urlResult?.data?.publicUrl;
  if (!publicUrl) throw new Error('Failed to get public URL for uploaded image');
  return publicUrl;
}

// ── DELETE IMAGE FROM STORAGE ──────────────────────────────────────────────
export async function deleteImageFromStorage(url) {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();

  if (!_sb || !_currentUser || !url || !url.includes('/storage/')) return;

  try {
    const marker = `/object/public/${IMG_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = decodeURIComponent(url.slice(idx + marker.length));
    await _sb.storage.from(IMG_BUCKET).remove([path]);
  } catch(e) {
    console.warn('FlipTrack: storage delete failed:', e.message);
  }
}

// ── HELPER: IS STORAGE URL? ───────────────────────────────────────────────
export const isStorageUrl = s => typeof s === 'string' && s.startsWith('http');

// ── MIGRATE BASE64 IMAGES TO STORAGE ───────────────────────────────────────
export async function migrateImagesToStorage() {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();

  if (!_sb || !_currentUser) return;

  let migrated = 0;
  for (const item of inv) {
    const imgs = getItemImages(item);
    const needsMigration = imgs.some(img => img && !isStorageUrl(img));
    if (!needsMigration) continue;

    // Upload all images for this item in parallel
    const newImgs = await Promise.all(imgs.map(async (img, idx) => {
      if (!img || isStorageUrl(img)) return img;
      try {
        const url = await uploadImageToStorage(img, item.id, idx);
        migrated++;
        return url;
      } catch(e) {
        console.warn('FlipTrack: migration upload failed for', item.id, e.message);
        return img; // keep base64 on failure
      }
    }));

    item.images = newImgs;
    item.image = newImgs[0] || null;
  }

  if (migrated > 0) {
    save();
    if (window.renderInv) window.renderInv();
    console.log(`FlipTrack: Migrated ${migrated} photo${migrated > 1 ? 's' : ''} to cloud storage`);
  }
  return migrated;
}

// ── HELPER: GET ITEM IMAGES ────────────────────────────────────────────────
function getItemImages(item) {
  if (item.images && Array.isArray(item.images)) return item.images;
  if (item.image) return [item.image];
  return [];
}
