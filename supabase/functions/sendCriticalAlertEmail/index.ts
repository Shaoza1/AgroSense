// @ts-expect-error: Deno supports remote imports, which TypeScript may not recognize
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const resendAPIKey = Deno.env.get("RESEND_API_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const body = await req.json();

    if (body.alert_level !== "critical") {
      return new Response(
        JSON.stringify({ status: "ignored", reason: "not critical" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = body.user_id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "user_id missing" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch user's email from Supabase Auth Admin API
    const res = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${userId}`,
      {
        headers: {
          apiKey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
        },
      }
    );
    if (!res.ok) {
      const errorText = await res.text();
      return new Response(
        JSON.stringify({ error: "Failed to fetch user from Auth Admin API", details: errorText }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const user = await res.json();
    // The user object should have email at the top level
    const email = user?.email;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "user email not found", user }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Compose the message
    const alertType = body.type === "weather" ? "Weather Alert" : "Pest Alert";
    const subject = `[CRITICAL] ${alertType}: ${body.title}`;
    const content = `
      <h2>🚨 Critical ${alertType} 🚨</h2>
      <p><strong>Title:</strong> ${body.title}</p>
      <p><strong>Description:</strong> ${body.description || "No details provided."}</p>
      <p><strong>Farm:</strong> ${body.farm_id ? body.farm_id : "General"}</p>
      <small>Sent automatically from your Agriculture Dashboard</small>
    `;

    // Send email via Resend
    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendAPIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: email,
        subject,
        html: content,
      }),
    });

    if (!resendResp.ok) {
      const errorText = await resendResp.text();
      return new Response(
        JSON.stringify({ error: "Email sending failed", details: errorText }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ status: "sent" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});