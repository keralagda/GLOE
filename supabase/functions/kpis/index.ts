import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:3000,http://localhost:5173")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? "http://localhost:3000",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  Vary: "Origin",
});

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const phase = url.searchParams.get("phase");
  const status = url.searchParams.get("status");
  const sortBy = url.searchParams.get("sort_by") ?? "created_at";
  const sortDir = url.searchParams.get("sort_dir") ?? "desc";
  const page = Math.max(Number(url.searchParams.get("page") ?? "1"), 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "25"), 1), 50);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  let listQuery = supabase
    .from("dispatch_list_view")
    .select("*", { count: "exact" })
    .order(sortBy, { ascending: sortDir !== "desc" })
    .range(from, to);

  if (phase) listQuery = listQuery.eq("phase", phase);
  if (status) listQuery = listQuery.eq("governance_status", status);

  const [listResult, kpiResult] = await Promise.all([
    listQuery,
    supabase.from("dispatch_kpi_view").select("*").maybeSingle(),
  ]);

  if (listResult.error || kpiResult.error) {
    const error = listResult.error ?? kpiResult.error;
    return Response.json({ error: error?.message ?? "Unknown error" }, { status: 500, headers: corsHeaders });
  }

  return Response.json(
    {
      channels: ["shipments:milestones"],
      kpis: kpiResult.data,
      list: {
        data: listResult.data ?? [],
        total_count: listResult.count ?? 0,
        page,
        limit,
      },
    },
    { headers: corsHeaders },
  );
});
