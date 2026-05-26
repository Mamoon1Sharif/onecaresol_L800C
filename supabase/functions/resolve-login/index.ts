// Resolves a (company_code, username) login pair to the synthetic auth email
// the user was signed up with, then returns it so the client can sign in.
//
// Supports two kinds of users:
//   1. Office / admin users stored in `company_users` (resolved via
//      `resolve_login_email` RPC — these already have an auth.users row).
//   2. Care givers stored in `care_givers`, identified by `login_code` +
//      `login_password`. For these we lazily provision an auth.users row
//      and a `company_users` row on first login, and keep the auth password
//      in sync with `login_password` on every subsequent login.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { company_code, username, password } = await req.json();
    if (typeof company_code !== "string" || typeof username !== "string" ||
        !company_code.trim() || !username.trim()) {
      return json({ error: "company_code and username are required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- 1. Try the existing office-user path first.
    const { data: officeEmail, error: officeErr } = await admin.rpc(
      "resolve_login_email",
      {
        _company_code: company_code.trim(),
        _username: username.trim(),
      },
    );
    if (officeErr) return json({ error: officeErr.message }, 500);
    if (officeEmail) return json({ email: officeEmail });

    // --- 2. Fall back to caregiver credentials.
    //   Look up company by code (case-insensitive).
    const { data: company, error: companyErr } = await admin
      .from("companies")
      .select("id, company_code, status")
      .ilike("company_code", company_code.trim())
      .eq("status", "Active")
      .maybeSingle();
    if (companyErr) return json({ error: companyErr.message }, 500);
    if (!company) return json({ error: "Invalid Company ID or username" }, 404);

    //   Find caregiver by login_code (case-insensitive) within that company.
    const { data: cg, error: cgErr } = await admin
      .from("care_givers")
      .select("id, name, login_code, login_password, status, company_id")
      .eq("company_id", company.id)
      .ilike("login_code", username.trim())
      .maybeSingle();
    if (cgErr) return json({ error: cgErr.message }, 500);
    if (!cg || !cg.login_code) {
      return json({ error: "Invalid Company ID or username" }, 404);
    }

    //   Verify the password matches what's stored on the caregiver record.
    if (typeof password !== "string" || !password ||
        (cg.login_password ?? "") !== password) {
      return json({ error: "Invalid username or password" }, 401);
    }

    //   Build a stable synthetic email for this caregiver.
    const safeCode = company.company_code.toLowerCase().replace(/[^a-z0-9]/g, "");
    const email = `cg_${cg.id}@${safeCode || "company"}.local`;

    //   Ensure an auth user exists with this email and matches the password.
    //   We look it up via the admin API. If absent, create it; if present,
    //   reset its password to the current login_password so edits stay in sync.
    let authUserId: string | null = null;

    //   Search auth users by email (list + filter; small tenants).
    const { data: existing, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) return json({ error: listErr.message }, 500);
    const match = existing?.users?.find(
      (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
    );

    if (match) {
      authUserId = match.id;
      // Keep password in sync with the caregiver record.
      const { error: updErr } = await admin.auth.admin.updateUserById(match.id, {
        password,
        email_confirm: true,
      });
      if (updErr) return json({ error: updErr.message }, 500);
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: cg.name,
          caregiver_id: cg.id,
          company_id: cg.company_id,
        },
      });
      if (createErr || !created?.user) {
        return json({ error: createErr?.message ?? "Failed to provision user" }, 500);
      }
      authUserId = created.user.id;
    }

    //   Ensure a company_users row exists so RLS (current_company_id) works.
    const { data: cuExisting, error: cuSelErr } = await admin
      .from("company_users")
      .select("id")
      .eq("user_id", authUserId)
      .eq("company_id", cg.company_id)
      .maybeSingle();
    if (cuSelErr) return json({ error: cuSelErr.message }, 500);

    if (!cuExisting) {
      const { error: cuInsErr } = await admin.from("company_users").insert({
        user_id: authUserId,
        company_id: cg.company_id,
        username: cg.login_code,
        display_name: cg.name,
        role: "caregiver",
        status: "Active",
      });
      if (cuInsErr) return json({ error: cuInsErr.message }, 500);
    }

    return json({ email });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
