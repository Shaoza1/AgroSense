//import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.5";

// Deno.env vars
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { title, body: notifBody, user_id, ...rest } = body;
    if (!title || !notifBody) {
      return new Response(
        JSON.stringify({ error: "Missing title or body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Insert into pending_notifications
    const { error } = await supabase
      .from("pending_notifications")
      .insert([
        {
          title,
          body: notifBody,
          user_id,
          data: rest,
          status: "pending",
        },
      ]);

    if (error) {
      return new Response(
        JSON.stringify({ error: "Error inserting notification", details: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});