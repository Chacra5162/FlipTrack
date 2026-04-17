// ebay-auth — Supabase Edge Function proxying eBay API calls for FlipTrack.
//
// This is a TEMPLATE. Your deployed version in Supabase already handles OAuth
// token exchange, refresh, and REST proxying. This file adds Trading API
// (legacy XML) support. Merge the Trading API section into your existing
// function — don't replace wholesale without comparing.
//
// Trading API reference: https://developer.ebay.com/devzone/xml/docs/reference/ebay/
// Headers required:
//   X-EBAY-API-SITEID: 0 (US)
//   X-EBAY-API-COMPATIBILITY-LEVEL: 1193 (or newer)
//   X-EBAY-API-CALL-NAME: <verb, e.g. GetMyeBaySelling>
//   X-EBAY-API-IAF-TOKEN: <OAuth access_token>
//   Content-Type: text/xml; charset=utf-8

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── CONFIG ────────────────────────────────────────────────────────────────
const EBAY_API_HOST_PROD = 'https://api.ebay.com';
const EBAY_API_HOST_SANDBOX = 'https://api.sandbox.ebay.com';
const TRADING_COMPAT_LEVEL = '1193';
const TRADING_SITE_ID = '0'; // US

// Allowlist of API paths (Trading API added: /ws/api.dll)
const ALLOWED_PATHS = [
  /^\/sell\/fulfillment\/v1\//,
  /^\/sell\/inventory\/v1\//,
  /^\/sell\/account\/v1\//,
  /^\/buy\/browse\/v1\//,
  /^\/ws\/api\.dll$/, // Trading API
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ebay-action',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── UTILITIES ─────────────────────────────────────────────────────────────

/** Build Trading API XML request from a JSON payload.
 * Input shape: { _tradingCall: 'GetMyeBaySelling', ...fields }
 * Output: valid eBay Trading API XML envelope
 */
function buildTradingXml(callName: string, fields: Record<string, any>, token: string): string {
  const inner = toXml(fields);
  return `<?xml version="1.0" encoding="utf-8"?>
<${callName}Request xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials><eBayAuthToken>${escapeXml(token)}</eBayAuthToken></RequesterCredentials>
  ${inner}
</${callName}Request>`;
}

/** Recursively convert JSON → XML for Trading API request bodies. */
function toXml(obj: any, indent = '  '): string {
  if (obj === null || obj === undefined) return '';
  if (typeof obj !== 'object') return escapeXml(String(obj));
  if (Array.isArray(obj)) return obj.map(v => toXml(v, indent)).join('\n');
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_')) continue; // skip meta keys like _tradingCall
    if (v === null || v === undefined) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      parts.push(`${indent}<${k}>\n${toXml(v, indent + '  ')}\n${indent}</${k}>`);
    } else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === 'object') {
          parts.push(`${indent}<${k}>\n${toXml(item, indent + '  ')}\n${indent}</${k}>`);
        } else {
          parts.push(`${indent}<${k}>${escapeXml(String(item))}</${k}>`);
        }
      }
    } else {
      parts.push(`${indent}<${k}>${escapeXml(String(v))}</${k}>`);
    }
  }
  return parts.join('\n');
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** Parse Trading API XML response to JSON. Very small parser — covers
 * the structures used by GetMyeBaySelling / GetItem / GetBestOffers / GetUser.
 * For complex cases, use a proper XML library like fast-xml-parser. */
function parseTradingXml(xml: string): any {
  // Strip XML prolog and namespace declarations for simpler matching
  xml = xml.replace(/<\?xml[^?]*\?>/, '').replace(/ xmlns="[^"]*"/g, '');

  function parseNode(str: string): any {
    const m = str.match(/^<(\w+)([^>]*)>([\s\S]*)<\/\1>$/);
    if (!m) return str.trim();
    const [, , , body] = m;
    const children: Record<string, any> = {};
    let remaining = body.trim();
    const tagRe = /<(\w+)(?:\s[^>]*)?\/>|<(\w+)(?:\s[^>]*)?>([\s\S]*?)<\/\2>/;
    while (remaining.length) {
      const childMatch = remaining.match(tagRe);
      if (!childMatch) {
        // Text content with no more children
        if (remaining.trim() && Object.keys(children).length === 0) return remaining.trim();
        break;
      }
      const tag = childMatch[1] || childMatch[2];
      const inner = childMatch[3] ?? '';
      const val = inner.match(/<\w/) ? parseNode(`<${tag}>${inner}</${tag}>`) : inner.trim();
      if (tag in children) {
        if (!Array.isArray(children[tag])) children[tag] = [children[tag]];
        children[tag].push(val);
      } else {
        children[tag] = val;
      }
      remaining = remaining.slice(childMatch.index! + childMatch[0].length).trim();
    }
    return children;
  }

  const rootMatch = xml.match(/<(\w+Response)[^>]*>([\s\S]*)<\/\1>/);
  if (!rootMatch) return { raw: xml };
  return parseNode(`<${rootMatch[1]}>${rootMatch[2]}</${rootMatch[1]}>`);
}

// ── REQUEST HANDLER ───────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    // Auth the incoming request — user must be a signed-in Supabase user.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonError(401, 'Missing Authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return jsonError(401, 'Invalid session');

    const body = await req.json();
    const action = req.headers.get('x-ebay-action') || body.action;

    // ... existing OAuth + token-refresh handlers stay here (connect, disconnect,
    // status, refresh, etc.) — not duplicated in this template to avoid overwriting.

    if (action === 'api') {
      return await handleApiProxy(body, user.id, supabase);
    }

    return jsonError(400, `Unknown action: ${action}`);
  } catch (e) {
    console.error('[ebay-auth] Unhandled error:', e);
    return jsonError(500, e.message);
  }
});

// ── API PROXY ─────────────────────────────────────────────────────────────

async function handleApiProxy(body: any, userId: string, supabase: any) {
  const { method, path, body: apiBody, isSandbox } = body;

  // Validate path against allowlist
  if (!ALLOWED_PATHS.some(rx => rx.test(path))) {
    return jsonError(403, `API path not allowed: ${path}`);
  }

  // Fetch user's eBay access token (implementation depends on your schema).
  const { data: auth } = await supabase
    .from('ebay_auth')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single();
  if (!auth) return jsonError(401, 'eBay not connected');

  let token = auth.access_token;
  if (new Date(auth.expires_at) < new Date(Date.now() + 60000)) {
    token = await refreshToken(auth.refresh_token, userId, supabase);
  }

  const host = isSandbox ? EBAY_API_HOST_SANDBOX : EBAY_API_HOST_PROD;

  // ── Trading API path ──
  if (path === '/ws/api.dll') {
    const callName = apiBody?._tradingCall;
    if (!callName) return jsonError(400, 'Trading API call requires _tradingCall field');

    const xmlRequest = buildTradingXml(callName, apiBody, token);
    const resp = await fetch(`${host}/ws/api.dll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'X-EBAY-API-SITEID': TRADING_SITE_ID,
        'X-EBAY-API-COMPATIBILITY-LEVEL': TRADING_COMPAT_LEVEL,
        'X-EBAY-API-CALL-NAME': callName,
        'X-EBAY-API-IAF-TOKEN': token,
      },
      body: xmlRequest,
    });

    const xmlText = await resp.text();
    const parsed = parseTradingXml(xmlText);

    // Trading API returns Ack = 'Success' or 'Failure' inside the response
    const ack = parsed?.Ack;
    if (ack === 'Failure' || !resp.ok) {
      const errMsg = parsed?.Errors?.LongMessage || parsed?.Errors?.[0]?.LongMessage || 'Trading API failure';
      return jsonError(400, errMsg, { ebayErrors: parsed?.Errors, ebayStatus: resp.status, method, path });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // ── REST API path (unchanged from your existing implementation) ──
  const url = `${host}${path}`;
  const resp = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
    },
    body: apiBody ? JSON.stringify(apiBody) : undefined,
  });

  const data = resp.headers.get('content-type')?.includes('json')
    ? await resp.json().catch(() => ({}))
    : await resp.text();

  if (!resp.ok) {
    const errMsg = data?.errors?.[0]?.message || data?.message || `eBay ${resp.status}`;
    return jsonError(resp.status, errMsg, {
      ebayErrors: data?.errors,
      ebayStatus: resp.status,
      method, path,
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function refreshToken(refreshToken: string, userId: string, supabase: any): Promise<string> {
  const clientId = Deno.env.get('EBAY_CLIENT_ID')!;
  const clientSecret = Deno.env.get('EBAY_CLIENT_SECRET')!;
  const basic = btoa(`${clientId}:${clientSecret}`);

  const resp = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(`Token refresh failed: ${data.error_description || resp.status}`);

  const newToken = data.access_token;
  const expiresAt = new Date(Date.now() + (data.expires_in * 1000)).toISOString();
  await supabase.from('ebay_auth')
    .update({ access_token: newToken, expires_at: expiresAt })
    .eq('user_id', userId);

  return newToken;
}

function jsonError(status: number, message: string, extra: Record<string, any> = {}): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
