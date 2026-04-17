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

function createRlsClient(authorization: string) {
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = request.headers.get("authorization");
    if (!authorization) {
      return Response.json({ error: "Authorization header is required." }, { status: 401, headers: corsHeaders });
    }

    const supabase = createRlsClient(authorization);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return Response.json({ error: "Authenticated customer session required." }, { status: 401, headers: corsHeaders });
    }

    const profileResult = await supabase
      .from("user_profiles")
      .select("role, customer_account_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (profileResult.error || !profileResult.data) {
      return Response.json({ error: "User profile not found." }, { status: 403, headers: corsHeaders });
    }
    if (profileResult.data.role !== "customer") {
      return Response.json({ error: "Customer role required for this endpoint." }, { status: 403, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const phase = url.searchParams.get("phase");
    const status = url.searchParams.get("status");
    const page = Math.max(Number(url.searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "25"), 1), 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let listQuery = supabase
      .from("customer_exec_dispatch_view")
      .select("*", { count: "exact" })
      .eq("customer_account_id", profileResult.data.customer_account_id)
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (phase) listQuery = listQuery.eq("phase", phase);
    if (status) listQuery = listQuery.eq("governance_status", status);

    const [metricsResult, listResult] = await Promise.all([
      supabase
        .from("customer_exec_metrics_view")
        .select("*")
        .eq("customer_account_id", profileResult.data.customer_account_id)
        .maybeSingle(),
      listQuery,
    ]);

    if (metricsResult.error || listResult.error) {
      const error = metricsResult.error ?? listResult.error;
      return Response.json({ error: error?.message ?? "Unable to load customer metrics." }, { status: 500, headers: corsHeaders });
    }

    return Response.json(
      {
        metrics: metricsResult.data ?? {
          customer_account_id: profileResult.data.customer_account_id,
          shipment_count: 0,
          average_lead_time_efficiency: null,
          total_sell_amount: 0,
        },
        shipments: {
          data: listResult.data ?? [],
          total_count: listResult.count ?? 0,
          page,
          limit,
        },
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown customer metrics error" },
      { status: 500, headers: corsHeaders },
    );
  }
});
