/**
 * storage.js - Supabase Storage management for item images
 * Handles uploading, deleting, and migrating images to/from cloud storage.
 */

import { inv, save } from './store.js';
import { getCurrentUser, getSupabaseClient } from './auth.js';
import { SB_URL } from '../config/constants.js';

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
  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const mime = blob.type || 'image/jpeg';
  if (!ALLOWED_MIME.includes(mime)) throw new Error('Unsupported image type: ' + mime);
  const userId = _currentUser.id;
  const ext = mime.split('/')[1] || 'jpg';
  const filename = `${itemId}_${slotIdx}_${Date.now()}.${ext}`;
  const path = `${userId}/${filename}`;

  const { error } = await _sb.storage.from(IMG_BUCKET).upload(path, blob, {
    contentType: mime,
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
    // Storage delete failures are non-critical — orphaned files are cleaned up by bucket policies
  }
}

// ── HELPER: IS STORAGE URL? ───────────────────────────────────────────────
// Only treat URLs from our own Supabase storage as valid storage URLs
export const isStorageUrl = s => typeof s === 'string' && s.startsWith(SB_URL + '/storage/');

// ── THUMBNAIL URL — serve smaller images via Supabase Image Transformation ──
// Replaces /object/public/ with /object/public/ + render/image/... to request
// a resized version, drastically reducing bandwidth for list views.
export function thumbUrl(url, width = 150) {
  if (!url || !isStorageUrl(url)) return url || '';
  // Supabase transform: /render/image appended before /public/ path
  return url.replace(
    '/storage/v1/object/public/',
    `/storage/v1/render/image/public/`
  ) + `?width=${width}&resize=contain`;
}

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
