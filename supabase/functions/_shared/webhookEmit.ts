// Helper para edge functions emitirem eventos de webhook via RPC
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

export async function emitWebhookEvent(event: string, data: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await admin.rpc("emit_webhook_event", {
      _event: event,
      _data: data ?? {},
    });
    if (error) {
      console.error("[emitWebhookEvent] error", event, error.message);
    }
  } catch (e) {
    console.error("[emitWebhookEvent] threw", event, e);
  }
}
