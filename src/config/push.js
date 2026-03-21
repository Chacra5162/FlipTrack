/**
 * push.js — VAPID public key for Web Push subscriptions
 * Private key stored as Supabase secret VAPID_PRIVATE_KEY.
 * Generate keypair: npx web-push generate-vapid-keys
 */

// Replace with your actual VAPID public key after running: npx web-push generate-vapid-keys
export const VAPID_PUBLIC_KEY = localStorage.getItem('ft_vapid_public_key') || '';

/**
 * Set VAPID public key (called from settings or admin)
 */
export function setVapidPublicKey(key) {
  localStorage.setItem('ft_vapid_public_key', key);
}
