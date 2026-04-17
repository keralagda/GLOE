import ExcelJS from "npm:exceljs@4.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ExportFilters = {
  phase?: string;
  status?: string;
  origin?: string;
  destination?: string;
  carrier?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
};

type ExportPayload = {
  filters?: ExportFilters;
  export_type?: "standard" | "forensic";
  requester_email?: string;
  process_async?: boolean;
  export_request_id?: string;
};

type RequestContext = {
  userId: string;
  role: string;
  customerAccountId: string | null;
  requesterEmail: string | null;
};

const SYNC_THRESHOLD = 500;
const BATCH_SIZE = 1000;
const EXPORT_BUCKET = Deno.env.get("EXPORTS_BUCKET") ?? "exports";
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:3000,http://localhost:5173")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? "http://localhost:3000",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

const createAdminClient = () =>
  createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: { persistSession: false },
  });

const createRlsClient = (authorization: string) =>
  createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  });

function applyStandardFilters(query: any, filters: ExportFilters = {}) {
  if (filters.phase) query = query.eq("phase", filters.phase);
  if (filters.status) query = query.eq("governance_status", filters.status);
  if (filters.origin) query = query.eq("origin_code", filters.origin);
  if (filters.destination) query = query.eq("destination_code", filters.destination);
  if (filters.carrier) query = query.eq("carrier_name", filters.carrier);
  return query.order(filters.sort_by ?? "created_at", { ascending: (filters.sort_dir ?? "desc") !== "desc" });
}

async function getRequestContext(request: Request, adminClient: ReturnType<typeof createAdminClient>): Promise<RequestContext> {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    throw new Error("Authorization header is required.");
  }

  const rlsClient = createRlsClient(authorization);
  const userResult = await rlsClient.auth.getUser();
  if (userResult.error || !userResult.data.user) {
    throw new Error("Authenticated session required.");
  }

  const profileResult = await adminClient
    .from("user_profiles")
    .select("role, customer_account_id")
    .eq("user_id", userResult.data.user.id)
    .maybeSingle();
  if (profileResult.error || !profileResult.data) {
    throw new Error("User profile not found.");
  }

  return {
    userId: userResult.data.user.id,
    role: profileResult.data.role,
    customerAccountId: profileResult.data.customer_account_id,
    requesterEmail: userResult.data.user.email ?? null,
  };
}

async function fetchStandardRows(
  adminClient: ReturnType<typeof createAdminClient>,
  context: RequestContext,
  filters: ExportFilters,
  from: number,
  to: number,
) {
  if (context.role === "customer") {
    let query = adminClient
      .from("customer_exec_dispatch_view")
      .select("*", { count: "exact" })
      .eq("customer_account_id", context.customerAccountId)
      .range(from, to);
    query = applyStandardFilters(query, filters);
    return await query;
  }

  return await applyStandardFilters(
    adminClient.from("dispatch_list_view").select("*", { count: "exact" }),
    filters,
  ).range(from, to);
}

async function fetchStandardAuditRows(
  adminClient: ReturnType<typeof createAdminClient>,
  context: RequestContext,
  dispatchIds: string[],
) {
  if (!dispatchIds.length) return [];
  const rows: Record<string, unknown>[] = [];
  const viewName = context.role === "customer" ? "customer_audit_export_view" : "export_audit_trail_view";

  for (let index = 0; index < dispatchIds.length; index += 250) {
    const batch = dispatchIds.slice(index, index + 250);
    const result = await adminClient
      .from(viewName)
      .select("*")
      .in("dispatch_id", batch)
      .order(context.role === "customer" ? "audit_timestamp" : "audit_timestamp", { ascending: false });
    if (result.error) throw result.error;
    rows.push(...(result.data ?? []));
  }
  return rows;
}

async function fetchForensicRows(adminClient: ReturnType<typeof createAdminClient>, from: number, to: number) {
  const [security, permissions, lineage] = await Promise.all([
    adminClient.from("forensic_security_view").select("*").order("created_at", { ascending: false }).range(from, to),
    adminClient.from("forensic_permissions_view").select("*").order("created_at", { ascending: false }).range(from, to),
    adminClient.from("forensic_data_lineage_view").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to),
  ]);
  if (security.error || permissions.error || lineage.error) {
    throw security.error ?? permissions.error ?? lineage.error;
  }
  return {
    securityRows: security.data ?? [],
    permissionRows: permissions.data ?? [],
    lineageRows: lineage.data ?? [],
    totalCount: lineage.count ?? 0,
  };
}

function createStandardWorkbook(masterRows: Record<string, unknown>[], auditRows: Record<string, unknown>[]) {
  const workbook = new ExcelJS.Workbook();
  const masterSheet = workbook.addWorksheet("Shipments");
  masterSheet.columns = [
    { header: "dispatch_id", key: "dispatch_id", width: 38 },
    { header: "identifier", key: "identifier", width: 22 },
    { header: "status", key: "governance_status", width: 20 },
    { header: "phase", key: "phase", width: 20 },
    { header: "origin_code", key: "origin_code", width: 18 },
    { header: "destination_code", key: "destination_code", width: 18 },
    { header: "carrier_name", key: "carrier_name", width: 22 },
    { header: "current_milestone_name", key: "current_milestone_name", width: 24 },
    { header: "lead_time_efficiency", key: "lead_time_efficiency", width: 18 },
    { header: "customer_sell_total", key: "customer_sell_total", width: 18 },
    { header: "created_at", key: "created_at", width: 26 },
    { header: "updated_at", key: "updated_at", width: 26 },
  ];
  masterRows.forEach((row) =>
    masterSheet.addRow({
      ...row,
      dispatch_id: row.dispatch_id ?? row.id,
    }),
  );

  const auditSheet = workbook.addWorksheet("Audit Trail");
  auditSheet.columns = [
    { header: "dispatch_id", key: "dispatch_id", width: 38 },
    { header: "identifier", key: "identifier", width: 22 },
    { header: "approval_request_id", key: "approval_request_id", width: 38 },
    { header: "request_type", key: "request_type", width: 16 },
    { header: "approval_status", key: "approval_status", width: 18 },
    { header: "required_roles", key: "required_roles", width: 24 },
    { header: "four_eyes", key: "four_eyes", width: 14 },
    { header: "role", key: "role", width: 18 },
    { header: "user_id", key: "user_id", width: 38 },
    { header: "approval_timestamp", key: "approval_timestamp", width: 26 },
    { header: "approval_comment", key: "approval_comment", width: 32 },
    { header: "request_reason", key: "request_reason", width: 32 },
    { header: "decision_reason", key: "decision_reason", width: 32 },
    { header: "audit_reason", key: "audit_reason", width: 30 },
    { header: "audit_timestamp", key: "audit_timestamp", width: 26 },
  ];
  auditRows.forEach((row) =>
    auditSheet.addRow({
      ...row,
      required_roles: JSON.stringify(row.required_roles ?? []),
    }),
  );

  [masterSheet, auditSheet].forEach((sheet) => {
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  });
  return workbook;
}

function createForensicWorkbook(
  securityRows: Record<string, unknown>[],
  permissionRows: Record<string, unknown>[],
  lineageRows: Record<string, unknown>[],
) {
  const workbook = new ExcelJS.Workbook();
  const securitySheet = workbook.addWorksheet("Security");
  securitySheet.columns = [
    { header: "id", key: "id", width: 38 },
    { header: "user_id", key: "user_id", width: 38 },
    { header: "event_type", key: "event_type", width: 22 },
    { header: "status", key: "status", width: 18 },
    { header: "details", key: "details", width: 40 },
    { header: "created_at", key: "created_at", width: 26 },
  ];
  securityRows.forEach((row) => securitySheet.addRow({ ...row, details: JSON.stringify(row.details ?? {}) }));

  const permissionsSheet = workbook.addWorksheet("Permissions");
  permissionsSheet.columns = [
    { header: "id", key: "id", width: 38 },
    { header: "actor_id", key: "actor_id", width: 38 },
    { header: "target_user_id", key: "target_user_id", width: 38 },
    { header: "action_type", key: "action_type", width: 22 },
    { header: "details", key: "details", width: 40 },
    { header: "created_at", key: "created_at", width: 26 },
  ];
  permissionRows.forEach((row) => permissionsSheet.addRow({ ...row, details: JSON.stringify(row.details ?? {}) }));

  const lineageSheet = workbook.addWorksheet("Data Lineage");
  lineageSheet.columns = [
    { header: "audit_log_id", key: "audit_log_id", width: 38 },
    { header: "dispatch_id", key: "dispatch_id", width: 38 },
    { header: "identifier", key: "identifier", width: 22 },
    { header: "milestone_name", key: "milestone_name", width: 24 },
    { header: "override_type", key: "override_type", width: 20 },
    { header: "reason", key: "reason", width: 32 },
    { header: "snapshot", key: "snapshot", width: 40 },
    { header: "updater_id", key: "updater_id", width: 38 },
    { header: "created_at", key: "created_at", width: 26 },
  ];
  lineageRows.forEach((row) => lineageSheet.addRow({ ...row, snapshot: JSON.stringify(row.snapshot ?? {}) }));

  [securitySheet, permissionsSheet, lineageSheet].forEach((sheet) => {
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  });
  return workbook;
}

async function queueExport(
  adminClient: ReturnType<typeof createAdminClient>,
  context: RequestContext,
  filters: ExportFilters,
  exportType: "standard" | "forensic",
  totalCount: number,
) {
  const insertResult = await adminClient
    .from("export_requests")
    .insert({
      requested_by: context.userId,
      requester_email: context.requesterEmail,
      filters,
      total_count: totalCount,
      status: "queued",
      export_type: exportType,
    })
    .select("id, status, total_count, export_type")
    .single();
  if (insertResult.error) throw insertResult.error;

  const webhookUrl = Deno.env.get("TRIGGERDEV_WEBHOOK_URL");
  const webhookToken = Deno.env.get("TRIGGERDEV_API_KEY");
  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {}),
      },
      body: JSON.stringify({ export_request_id: insertResult.data.id, process_async: true }),
    });
  }
  return insertResult.data;
}

async function processQueuedExport(adminClient: ReturnType<typeof createAdminClient>, exportRequestId: string) {
  const requestResult = await adminClient.from("export_requests").select("*").eq("id", exportRequestId).single();
  if (requestResult.error) throw requestResult.error;

  const exportRequest = requestResult.data;
  const profileResult = await adminClient
    .from("user_profiles")
    .select("role, customer_account_id")
    .eq("user_id", exportRequest.requested_by)
    .maybeSingle();
  if (profileResult.error || !profileResult.data) throw profileResult.error ?? new Error("Requester profile missing.");

  const context: RequestContext = {
    userId: exportRequest.requested_by,
    role: profileResult.data.role,
    customerAccountId: profileResult.data.customer_account_id,
    requesterEmail: exportRequest.requester_email,
  };

  await adminClient.from("export_requests").update({ status: "processing" }).eq("id", exportRequestId);

  let workbook: ExcelJS.Workbook;
  let totalCount = exportRequest.total_count ?? 0;

  if (exportRequest.export_type === "forensic") {
    const forensic = await fetchForensicRows(adminClient, 0, Math.max(totalCount, BATCH_SIZE) - 1);
    workbook = createForensicWorkbook(forensic.securityRows, forensic.permissionRows, forensic.lineageRows);
    totalCount = forensic.totalCount;
  } else {
    const masterRows: Record<string, unknown>[] = [];
    for (let from = 0; ; from += BATCH_SIZE) {
      const pageResult = await fetchStandardRows(adminClient, context, exportRequest.filters ?? {}, from, from + BATCH_SIZE - 1);
      if (pageResult.error) throw pageResult.error;
      const rows = pageResult.data ?? [];
      totalCount = pageResult.count ?? totalCount;
      masterRows.push(...rows);
      if (rows.length < BATCH_SIZE) break;
    }
    const auditRows = await fetchStandardAuditRows(adminClient, context, masterRows.map((row) => String(row.dispatch_id ?? row.id)));
    workbook = createStandardWorkbook(masterRows, auditRows);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const path = `${exportRequest.export_type}/${exportRequestId}.xlsx`;
  const uploadResult = await adminClient.storage.from(EXPORT_BUCKET).upload(path, new Uint8Array(buffer), {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    upsert: true,
  });
  if (uploadResult.error) throw uploadResult.error;

  const signedUrlResult = await adminClient.storage.from(EXPORT_BUCKET).createSignedUrl(path, 60 * 60 * 24);
  if (signedUrlResult.error) throw signedUrlResult.error;

  await adminClient
    .from("export_requests")
    .update({
      status: "completed",
      total_count: totalCount,
      storage_path: path,
      signed_url: signedUrlResult.data.signedUrl,
      completed_at: new Date().toISOString(),
    })
    .eq("id", exportRequestId);

  return {
    id: exportRequestId,
    export_type: exportRequest.export_type,
    status: "completed",
    total_count: totalCount,
    signed_url: signedUrlResult.data.signedUrl,
  };
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as ExportPayload;
    const adminClient = createAdminClient();

    if (payload.process_async && payload.export_request_id) {
      const result = await processQueuedExport(adminClient, payload.export_request_id);
      return Response.json(result, { headers: corsHeaders });
    }

    const context = await getRequestContext(request, adminClient);
    const exportType = payload.export_type ?? "standard";
    if (exportType === "forensic" && context.role !== "admin") {
      return Response.json({ error: "Admin role required for forensic exports." }, { status: 403, headers: corsHeaders });
    }

    if (exportType === "forensic") {
      const forensic = await fetchForensicRows(adminClient, 0, SYNC_THRESHOLD - 1);
      if (forensic.totalCount > SYNC_THRESHOLD) {
        const queued = await queueExport(adminClient, context, payload.filters ?? {}, exportType, forensic.totalCount);
        return Response.json({ mode: "async", export_request: queued }, { status: 202, headers: corsHeaders });
      }
      const workbook = createForensicWorkbook(forensic.securityRows, forensic.permissionRows, forensic.lineageRows);
      const buffer = await workbook.xlsx.writeBuffer();
      return new Response(new Uint8Array(buffer), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="forensic-audit.xlsx"',
        },
      });
    }

    const firstPage = await fetchStandardRows(adminClient, context, payload.filters ?? {}, 0, SYNC_THRESHOLD - 1);
    if (firstPage.error) throw firstPage.error;
    const totalCount = firstPage.count ?? 0;

    if (totalCount > SYNC_THRESHOLD) {
      const queued = await queueExport(adminClient, context, payload.filters ?? {}, exportType, totalCount);
      return Response.json({ mode: "async", export_request: queued }, { status: 202, headers: corsHeaders });
    }

    const masterRows = firstPage.data ?? [];
    const auditRows = await fetchStandardAuditRows(adminClient, context, masterRows.map((row) => String(row.dispatch_id ?? row.id)));
    const workbook = createStandardWorkbook(masterRows, auditRows);
    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(new Uint8Array(buffer), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="freight-export.xlsx"',
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown export error" },
      { status: 500, headers: corsHeaders },
    );
  }
});
