/**
 * send-push — Supabase Edge Function for VAPID Web Push delivery.
 * Sends push notifications to all subscriptions for a given user.
 *
 * Required Supabase secrets:
 *   VAPID_PUBLIC_KEY  — VAPID public key
 *   VAPID_PRIVATE_KEY — VAPID private key
 *   VAPID_SUBJECT     — mailto: or URL for VAPID (e.g. mailto:you@example.com)
 *
 * Request body: { userId, title, body, data? }
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:fliptrack@example.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { userId, title, body, data } = await req.json();

    if (!userId || !title) {
      return new Response(JSON.stringify({ error: "userId and title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all push subscriptions for this user
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, body, data: data || {} });

    // Send to each subscription using web-push VAPID
    let sent = 0;
    let failed = 0;
    const staleEndpoints: string[] = [];

    for (const sub of subs) {
      try {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };

        // Use Deno's native fetch to call the push endpoint
        const jwt = await createVapidJwt(sub.endpoint);
        const encrypted = await encryptPayload(payload, sub.p256dh, sub.auth);

        const res = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
            TTL: "86400",
          },
          body: encrypted,
        });

        if (res.status === 201 || res.status === 200) {
          sent++;
        } else if (res.status === 404 || res.status === 410) {
          // Subscription expired or invalid — clean up
          staleEndpoints.push(sub.endpoint);
          failed++;
        } else {
          failed++;
        }
      } catch (e) {
        console.error("Push send error:", e);
        failed++;
      }
    }

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);
    }

    return new Response(JSON.stringify({ sent, failed, cleaned: staleEndpoints.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-push error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── VAPID JWT and encryption helpers ──────────────────────────────────────
// Note: In production, use the `web-push` npm package or Deno equivalent.
// This is a simplified implementation — for full RFC 8291 compliance,
// consider deploying with a web-push library.

async function createVapidJwt(endpoint: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const payload = btoa(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 86400,
    sub: VAPID_SUBJECT,
  })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const data = new TextEncoder().encode(`${header}.${payload}`);
  const key = await importVapidKey(VAPID_PRIVATE_KEY);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, data);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${header}.${payload}.${sigB64}`;
}

async function importVapidKey(base64Key: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Key.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", raw, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

async function encryptPayload(payload: string, p256dh: string, auth: string): Promise<Uint8Array> {
  // Simplified — returns payload as-is for initial implementation.
  // Full RFC 8291 encryption should be implemented with proper ECDH + HKDF + AES-GCM.
  // For now, this serves as the function scaffold.
  return new TextEncoder().encode(payload);
}
