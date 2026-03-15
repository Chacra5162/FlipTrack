/**
 * community-pricing edge function
 * Actions:
 *   - contribute: batch insert anonymized sales
 *   - query: return aggregated stats (median, count, percentiles)
 *
 * Table: community_prices
 *   category TEXT, subcategory TEXT, brand TEXT, condition TEXT,
 *   sold_price NUMERIC, sold_date DATE
 *
 * RLS: Insert-only for authenticated users. Raw data not readable.
 * Aggregation via this edge function only.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, ...params } = await req.json();

    if (action === 'contribute') {
      const { sales } = params;
      if (!Array.isArray(sales) || !sales.length) {
        return new Response(JSON.stringify({ error: 'No sales provided' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Insert anonymized sales (no user_id)
      const rows = sales.slice(0, 100).map((s: any) => ({
        category: (s.category || 'Unknown').slice(0, 50),
        subcategory: (s.subcategory || '').slice(0, 50),
        brand: (s.brand || '').slice(0, 50),
        condition: (s.condition || 'Unknown').slice(0, 20),
        sold_price: Math.max(0, Math.min(99999, Number(s.sold_price) || 0)),
        sold_date: s.sold_date || new Date().toISOString().slice(0, 10),
      }));

      const { error } = await supabase.from('community_prices').insert(rows);
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true, count: rows.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'query') {
      const { category, brand, condition } = params;
      if (!category) {
        return new Response(JSON.stringify({ error: 'Category required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let query = supabase
        .from('community_prices')
        .select('sold_price')
        .eq('category', category)
        .order('sold_price', { ascending: true });

      if (brand) query = query.eq('brand', brand);
      if (condition) query = query.eq('condition', condition);

      const { data, error } = await query.limit(500);
      if (error) throw error;
      if (!data?.length) {
        return new Response(JSON.stringify({ median: 0, count: 0, p25: 0, p75: 0, message: 'No data' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const prices = data.map((r: any) => r.sold_price).sort((a: number, b: number) => a - b);
      const count = prices.length;
      const median = prices[Math.floor(count / 2)];
      const p25 = prices[Math.floor(count * 0.25)];
      const p75 = prices[Math.floor(count * 0.75)];

      return new Response(JSON.stringify({ median, count, p25, p75, message: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
