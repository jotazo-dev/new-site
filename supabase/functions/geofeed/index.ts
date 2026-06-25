// GEOFEED endpoint (RFC 8805) — public CSV listing IP prefixes with their geolocation
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function csvEscape(value: string): string {
  const v = (value ?? "").toString().trim();
  // Geofeed CSV must not contain commas/quotes in the location fields per RFC 8805,
  // but we sanitize defensively.
  return v.replace(/[",\r\n]/g, " ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const { data, error } = await supabase
      .from("geofeed_prefixes")
      .select("prefix, country, region, city, postal")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const now = new Date().toISOString();
    const lines: string[] = [
      "# Jotazo Telecom - IP Geolocation Feed (RFC 8805)",
      "# Format: prefix,country,region,city,postal",
      `# Generated: ${now}`,
      "# Contact: contato@jotazo.com.br",
      "",
    ];

    for (const row of data ?? []) {
      const prefix = csvEscape(row.prefix as string);
      if (!prefix) continue;
      lines.push(
        [
          prefix,
          csvEscape((row.country as string) || "BR"),
          csvEscape((row.region as string) || ""),
          csvEscape((row.city as string) || ""),
          csvEscape((row.postal as string) || ""),
        ].join(","),
      );
    }

    const body = lines.join("\n") + "\n";

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
        "Content-Disposition": 'inline; filename="geofeed.csv"',
      },
    });
  } catch (err) {
    console.error("[geofeed] error:", err);
    return new Response(
      `# Error generating geofeed: ${(err as Error).message}\n`,
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }
});
