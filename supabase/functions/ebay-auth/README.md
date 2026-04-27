# ebay-auth Edge Function

Supabase Edge Function that proxies eBay API calls from the FlipTrack PWA.

## What's in this file

`index.ts` is a **template** with Trading API (XML) support added on top of the REST proxy you're already running in production. It shows:

- Allowlist now includes `/ws/api.dll`
- `buildTradingXml()` — converts JSON payload → Trading API XML
- `parseTradingXml()` — converts XML response → JSON
- `handleApiProxy()` with a Trading API branch that sets the right headers

**Do not replace your deployed function wholesale.** Your live version already has:
- OAuth flow handlers (`connect`, `disconnect`, `status`, CSRF state)
- Database schema details specific to your project
- Whatever error handling and logging you've already tuned

Merge the Trading API sections from this template into your deployed version, or use this as a reference to rewrite.

## Deploying

### Option 1 — Supabase CLI

```bash
cd /home/user/FlipTrack
supabase login
supabase link --project-ref gqructzvlkafclooybnc
supabase functions deploy ebay-auth
```

### Option 2 — Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/gqructzvlkafclooybnc/functions
2. Open `ebay-auth`
3. Paste the merged code, click **Deploy**

## What to verify after deploying

After deploying, run a sync in FlipTrack. You should see:

1. **No more "API path not allowed: /ws/api.dll" errors** in the browser console
2. Trading API calls succeed → `pullEBayListings()` uses `GetMyeBaySelling` directly, giving you the full listing inventory in one call
3. `_syncEBayAuctions()` starts working — auction end detection via `GetItem` runs on the normal sync cycle
4. `_syncEBayOffers()` starts working — best-offer notifications resume
5. `getEBayUsername()` resolves from `GetUser` instead of needing Fulfillment API fallback

The client already has the code paths built — the `_tradingApiBlocked` IDB flag just needs to be cleared. Users can do this by signing out/in, or you can add a one-time reset in the client.

## Environment variables required

Set these in Supabase dashboard → Edge Functions → Secrets:

| Var | Description |
|-----|-------------|
| `SUPABASE_URL` | Auto-provided |
| `SUPABASE_ANON_KEY` | Auto-provided |
| `EBAY_CLIENT_ID` | Your eBay app's Client ID |
| `EBAY_CLIENT_SECRET` | Your eBay app's Client Secret |
| `EBAY_RUNAME_PROD` | OAuth redirect URI / RU Name from eBay developer console |

## Database schema

The template assumes a `ebay_auth` table with `(user_id, access_token, refresh_token, expires_at)`. Adjust selectors if your schema differs.

## Trading API compatibility notes

- `X-EBAY-API-COMPATIBILITY-LEVEL` set to `1193`. Newer versions may require bumping.
- Site ID hardcoded to `0` (US). Change for other marketplaces.
- The simple XML parser in `parseTradingXml()` handles the common response shapes but breaks on mixed content. For production reliability, swap in [`fast-xml-parser`](https://deno.land/x/fast_xml_parser) from npm via esm.sh:

```ts
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4';
const parser = new XMLParser({ ignoreAttributes: true });
const parsed = parser.parse(xmlText);
```
