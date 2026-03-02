/**
 * storage.js - Supabase Storage management for item images
 * Handles uploading, deleting, and migrating images to/from cloud storage.
 */

import { inv, save } from './store.js';
import { getCurrentUser, getSupabaseClient } from './auth.js';

// ── STORAGE CONFIGURATION ──────────────────────────────────────────────────
const IMG_BUCKET = 'item-images';

// ── UPLOAD IMAGE TO STORAGE ───────────────────────────────────────────────
export async function uploadImageToStorage(dataUrl, itemId, slotIdx) {
  const _sb = getSupabaseClient();
  const _currentUser = getCurrentUser();

  if (!_sb || !_currentUser) throw new Error('Not authenticated');

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const userId = _currentUser.id;
  const filename = `${itemId}_${slotIdx}_${Date.now()}.jpg`;
  const path = `${userId}/${filename}`;

  const { error } = await _sb.storage.from(IMG_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true
  });

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = _sb.storage.from(IMG_BUCKET).getPublicUrl(path);
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
    let changed = false;
    const newImgs = [];

    for (let idx = 0; idx < imgs.length; idx++) {
      const img = imgs[idx];
      if (!img || isStorageUrl(img)) {
        newImgs.push(img);
        continue;
      }

      try {
        const url = await uploadImageToStorage(img, item.id, idx);
        newImgs.push(url);
        changed = true;
        migrated++;
      } catch(e) {
        newImgs.push(img); // keep base64 on failure
        console.warn('FlipTrack: migration upload failed for', item.id, e.message);
      }
    }

    if (changed) {
      item.images = newImgs;
      item.image = newImgs[0] || null;
    }
  }

  if (migrated > 0) {
    save();
    // Would call renderInv() here
    // Would call toast(`Migrated ${migrated} photo${migrated > 1 ? 's' : ''} to cloud storage ✓`)
  }
}

// ── HELPER: GET ITEM IMAGES ────────────────────────────────────────────────
function getItemImages(item) {
  if (item.images && Array.isArray(item.images)) return item.images;
  if (item.image) return [item.image];
  return [];
}
