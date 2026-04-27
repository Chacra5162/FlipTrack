/**
 * ebay-auth — Supabase Edge Function for eBay OAuth + API proxy.
 *
 * Actions (x-ebay-action header or body.action):
 *   status     → check if the signed-in user has eBay connected
 *   authorize  → generate eBay OAuth URL + CSRF state
 *   callback   → exchange auth code for tokens; store; return username
 *   disconnect → delete auth record
 *   api        → proxy authenticated eBay REST or Trading API call
 *
 * Required secrets (Supabase Dashboard → Edge Functions → Secrets):
 *   EBAY_CLIENT_ID     — eBay app Client ID
 *   EBAY_CLIENT_SECRET — eBay app Client Secret
 *   EBAY_REDIRECT_URI  — OAuth redirect URI (your RU Name on eBay)
 *
 * Auto-provided by Supabase:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Database table (ebay_auth):
 *   user_id       UUID   PRIMARY KEY REFERENCES auth.users
 *   access_token  TEXT
 *   refresh_token TEXT
 *   expires_at    TIMESTAMPTZ
 *   ebay_username TEXT
 *   connected_at  TIMESTAMPTZ
 *   is_sandbox    BOOLEAN DEFAULT false
 *
 * Trading API reference: https://developer.ebay.com/devzone/xml/docs/reference/ebay/
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── CONFIG ────────────────────────────────────────────────────────────────

const EBAY_HOST_PROD    = 'https://api.ebay.com';
const EBAY_HOST_SANDBOX = 'https://api.sandbox.ebay.com';
const EBAY_AUTH_PROD    = 'https://auth.ebay.com/oauth2/authorize';
const EBAY_AUTH_SANDBOX = 'https://auth.sandbox.ebay.com/oauth2/authorize';
const EBAY_TOKEN_PATH   = '/identity/v1/oauth2/token';
const TRADING_COMPAT    = '1193';
const TRADING_SITE_ID   = '0'; // US

const EBAY_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
  'https://api.ebay.com/oauth/api_scope/buy.browse',
].join(' ');

// Allowlist of eBay API paths the proxy will forward
const ALLOWED_PATHS = [
  /^\/sell\/fulfillment\/v1\//,
  /^\/sell\/inventory\/v1\//,
  /^\/sell\/account\/v1\//,
  /^\/buy\/browse\/v1\//,
  /^\/commerce\/taxonomy\/v1\//,
  /^\/ws\/api\.dll$/,           // Trading API (XML)
];

// CORS headers on EVERY response — no exceptions
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ebay-action',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── MAIN HANDLER ─────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return err(401, 'Missing Authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return err(401, 'Invalid or expired session');

    const body  = await req.json().catch(() => ({}));
    const action = req.headers.get('x-ebay-action') || body.action || '';

    switch (action) {
      case 'status':     return await handleStatus(body, user.id, supabase);
      case 'authorize':  return await handleAuthorize(body, user.id, supabase);
      case 'callback':   return await handleCallback(body, user.id, supabase);
      case 'disconnect': return await handleDisconnect(body, user.id, supabase);
      case 'api':        return await handleApiProxy(body, user.id, supabase);
      default:           return err(400, `Unknown action: ${action}`);
    }
  } catch (e) {
    console.error('[ebay-auth] Unhandled error:', e);
    return err(500, String((e as any)?.message ?? e));
  }
});

// ── STATUS ────────────────────────────────────────────────────────────────

async function handleStatus(_body: any, userId: string, supabase: any) {
  const { data: auth } = await supabase
    .from('ebay_auth')
    .select('ebay_username, connected_at, is_sandbox, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!auth) return ok({ connected: false });

  return ok({
    connected:    true,
    ebay_username: auth.ebay_username ?? null,
    connected_at:  auth.connected_at  ?? null,
    is_sandbox:    auth.is_sandbox    ?? false,
  });
}

// ── AUTHORIZE ─────────────────────────────────────────────────────────────

async function handleAuthorize(body: any, _userId: string, _supabase: any) {
  const clientId   = Deno.env.get('EBAY_CLIENT_ID');
  const redirectUri = Deno.env.get('EBAY_REDIRECT_URI');
  if (!clientId || !redirectUri) return err(500, 'Server configuration error: eBay credentials not set');

  const isSandbox = Boolean(body.isSandbox);
  const state     = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         EBAY_SCOPES,
    state,
  });
  const authUrl = `${isSandbox ? EBAY_AUTH_SANDBOX : EBAY_AUTH_PROD}?${params}`;

  return ok({ state, authUrl });
}

// ── CALLBACK ──────────────────────────────────────────────────────────────

async function handleCallback(body: any, userId: string, supabase: any) {
  const { code, isSandbox } = body;
  if (!code) return err(400, 'Missing authorization code');

  const clientId    = Deno.env.get('EBAY_CLIENT_ID');
  const clientSecret = Deno.env.get('EBAY_CLIENT_SECRET');
  const redirectUri  = Deno.env.get('EBAY_REDIRECT_URI');
  if (!clientId || !clientSecret || !redirectUri) {
    return err(500, 'Server configuration error: eBay credentials not set');
  }

  const host  = isSandbox ? EBAY_HOST_SANDBOX : EBAY_HOST_PROD;
  const basic = btoa(`${clientId}:${clientSecret}`);

  // Exchange authorization code for tokens
  const tokenResp = await fetch(`${host}${EBAY_TOKEN_PATH}`, {
    method: 'POST',
    headers: {
      'Authorization':  `Basic ${basic}`,
      'Content-Type':   'application/x-www-form-urlencoded',
    },
    body: `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
  });

  const tokenData = await tokenResp.json().catch(() => ({}));
  if (!tokenResp.ok) {
    const msg = tokenData.error_description || tokenData.error || `HTTP ${tokenResp.status}`;
    console.error('[ebay-auth] Token exchange failed:', msg);
    return err(400, `Token exchange failed: ${msg}`);
  }

  const accessToken  = tokenData.access_token  as string;
  const refreshToken = tokenData.refresh_token as string;
  const expiresAt    = new Date(Date.now() + (tokenData.expires_in as number) * 1000).toISOString();

  // Fetch eBay username via Trading API GetUser
  let ebayUsername: string | null = null;
  try {
    const xmlReq = buildTradingXml('GetUser', { DetailLevel: 'ReturnAll' }, accessToken);
    const userResp = await fetch(`${host}/ws/api.dll`, {
      method: 'POST',
      headers: {
        'Content-Type':                    'text/xml; charset=utf-8',
        'X-EBAY-API-SITEID':               TRADING_SITE_ID,
        'X-EBAY-API-COMPATIBILITY-LEVEL':  TRADING_COMPAT,
        'X-EBAY-API-CALL-NAME':            'GetUser',
        'X-EBAY-API-IAF-TOKEN':            accessToken,
      },
      body: xmlReq,
    });
    const xmlText = await userResp.text();
    const parsed  = parseTradingXml(xmlText);
    ebayUsername  = parsed?.User?.UserID ?? null;
  } catch (e) {
    console.warn('[ebay-auth] Could not fetch username via Trading API:', (e as any)?.message);
  }

  const now = new Date().toISOString();
  const { error: upsertErr } = await supabase.from('ebay_auth').upsert({
    user_id:       userId,
    access_token:  accessToken,
    refresh_token: refreshToken,
    expires_at:    expiresAt,
    ebay_username: ebayUsername,
    connected_at:  now,
    is_sandbox:    Boolean(isSandbox),
  }, { onConflict: 'user_id' });

  if (upsertErr) {
    console.error('[ebay-auth] Upsert failed:', upsertErr);
    return err(500, 'Failed to store eBay credentials');
  }

  return ok({ success: true, ebay_username: ebayUsername });
}

// ── DISCONNECT ────────────────────────────────────────────────────────────

async function handleDisconnect(_body: any, userId: string, supabase: any) {
  await supabase.from('ebay_auth').delete().eq('user_id', userId);
  return ok({ success: true });
}

// ── API PROXY ─────────────────────────────────────────────────────────────

async function handleApiProxy(body: any, userId: string, supabase: any) {
  const { method, path, body: apiBody, isSandbox } = body;

  if (!ALLOWED_PATHS.some(rx => rx.test(path))) {
    return err(403, `API path not allowed: ${path}`);
  }

  // Fetch stored token
  const { data: auth, error: authErr } = await supabase
    .from('ebay_auth')
    .select('access_token, refresh_token, expires_at, is_sandbox')
    .eq('user_id', userId)
    .maybeSingle();

  if (authErr) {
    console.error('[ebay-auth] DB error fetching auth:', authErr);
    return err(500, 'Database error');
  }
  if (!auth) return err(401, 'eBay not connected');

  let token = auth.access_token as string;
  if (new Date(auth.expires_at as string) < new Date(Date.now() + 60_000)) {
    try {
      token = await refreshToken(auth.refresh_token as string, userId, isSandbox ?? auth.is_sandbox, supabase);
    } catch (e) {
      return err(401, `Token refresh failed: ${(e as any)?.message ?? e}`);
    }
  }

  const host = (isSandbox ?? auth.is_sandbox) ? EBAY_HOST_SANDBOX : EBAY_HOST_PROD;

  // ── Trading API (XML) ──────────────────────────────────────────────────
  if (path === '/ws/api.dll') {
    const callName = apiBody?._tradingCall;
    if (!callName) return err(400, 'Trading API call requires _tradingCall field');

    const xmlReq = buildTradingXml(callName, apiBody, token);
    let tradResp: Response;
    try {
      tradResp = await fetch(`${host}/ws/api.dll`, {
        method: 'POST',
        headers: {
          'Content-Type':                    'text/xml; charset=utf-8',
          'X-EBAY-API-SITEID':               TRADING_SITE_ID,
          'X-EBAY-API-COMPATIBILITY-LEVEL':  TRADING_COMPAT,
          'X-EBAY-API-CALL-NAME':            callName,
          'X-EBAY-API-IAF-TOKEN':            token,
        },
        body: xmlReq,
      });
    } catch (e) {
      return err(502, `Trading API network error: ${(e as any)?.message ?? e}`);
    }

    const xmlText = await tradResp.text();
    const parsed  = parseTradingXml(xmlText);
    const ack     = parsed?.Ack;

    if (ack === 'Failure' || !tradResp.ok) {
      const errMsg = parsed?.Errors?.LongMessage
        ?? parsed?.Errors?.[0]?.LongMessage
        ?? 'Trading API failure';
      return err(400, errMsg, { ebayErrors: parsed?.Errors, ebayStatus: tradResp.status, method, path });
    }

    return ok(parsed);
  }

  // ── REST API ───────────────────────────────────────────────────────────
  let restResp: Response;
  try {
    restResp = await fetch(`${host}${path}`, {
      method,
      headers: {
        'Authorization':           `Bearer ${token}`,
        'Content-Type':            'application/json',
        'Accept':                  'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      },
      body: apiBody ? JSON.stringify(apiBody) : undefined,
    });
  } catch (e) {
    return err(502, `eBay API network error: ${(e as any)?.message ?? e}`);
  }

  const ct = restResp.headers.get('content-type') ?? '';
  const data = ct.includes('json')
    ? await restResp.json().catch(() => ({}))
    : await restResp.text();

  if (!restResp.ok) {
    const errMsg = (data as any)?.errors?.[0]?.message
      ?? (data as any)?.message
      ?? `eBay ${restResp.status}`;
    return err(restResp.status, errMsg, {
      ebayErrors: (data as any)?.errors,
      ebayStatus: restResp.status,
      method, path,
    });
  }

  return ok(data);
}

// ── TOKEN REFRESH ─────────────────────────────────────────────────────────

async function refreshToken(
  refreshTok: string,
  userId: string,
  isSandbox: boolean,
  supabase: any,
): Promise<string> {
  const clientId    = Deno.env.get('EBAY_CLIENT_ID');
  const clientSecret = Deno.env.get('EBAY_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('eBay credentials not configured');

  const host  = isSandbox ? EBAY_HOST_SANDBOX : EBAY_HOST_PROD;
  const basic = btoa(`${clientId}:${clientSecret}`);

  const resp = await fetch(`${host}${EBAY_TOKEN_PATH}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshTok)}`,
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Token refresh failed: ${data.error_description || data.error || resp.status}`);
  }

  const newToken  = data.access_token as string;
  const expiresAt = new Date(Date.now() + (data.expires_in as number) * 1000).toISOString();

  await supabase.from('ebay_auth')
    .update({ access_token: newToken, expires_at: expiresAt })
    .eq('user_id', userId);

  return newToken;
}

// ── TRADING API XML HELPERS ───────────────────────────────────────────────

function buildTradingXml(callName: string, fields: Record<string, any>, token: string): string {
  const inner = toXml(fields);
  return `<?xml version="1.0" encoding="utf-8"?>
<${callName}Request xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials><eBayAuthToken>${escXml(token)}</eBayAuthToken></RequesterCredentials>
  ${inner}
</${callName}Request>`;
}

function toXml(obj: any, indent = '  '): string {
  if (obj === null || obj === undefined) return '';
  if (typeof obj !== 'object') return escXml(String(obj));
  if (Array.isArray(obj)) return obj.map(v => toXml(v, indent)).join('\n');
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_')) continue;
    if (v === null || v === undefined) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      parts.push(`${indent}<${k}>\n${toXml(v, indent + '  ')}\n${indent}</${k}>`);
    } else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === 'object') {
          parts.push(`${indent}<${k}>\n${toXml(item, indent + '  ')}\n${indent}</${k}>`);
        } else {
          parts.push(`${indent}<${k}>${escXml(String(item))}</${k}>`);
        }
      }
    } else {
      parts.push(`${indent}<${k}>${escXml(String(v))}</${k}>`);
    }
  }
  return parts.join('\n');
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/**
 * Minimal XML → JSON parser covering the structures returned by
 * GetMyeBaySelling, GetItem, GetBestOffers, GetUser.
 * Handles nested elements and same-name siblings (converted to arrays).
 */
function parseTradingXml(xml: string): any {
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
        if (remaining.trim() && Object.keys(children).length === 0) return remaining.trim();
        break;
      }
      const tag   = childMatch[1] || childMatch[2];
      const inner = childMatch[3] ?? '';
      const val   = inner.match(/<\w/) ? parseNode(`<${tag}>${inner}</${tag}>`) : inner.trim();
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

// ── RESPONSE HELPERS ──────────────────────────────────────────────────────

function ok(data: any): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function err(status: number, message: string, extra: Record<string, any> = {}): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
