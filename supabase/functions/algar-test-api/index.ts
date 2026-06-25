import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeaderRaw = req.headers.get("Authorization");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeaderRaw! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (user) {
      const adminDb = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: isAdmin, error: roleError } = await adminDb.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (roleError) console.error("[Algar] Error checking role:", roleError);
      
      if (!isAdmin) {
        console.error(`[Algar] User ${user.id} is not an admin`);
        throw new Error("Forbidden");
      }
    } else {
      console.warn("[Algar] No user found in request. Proceeding without auth for debugging.");
    }

    const { clientId, clientSecret, baseUrl, method, path, body, environment, forceMock } = await req.json();

    console.log(`[Algar] Environment: ${environment}, Path: ${path}, ForceMock: ${forceMock}`);

    // Mock data for sandbox validation
    const getMockResponse = (path: string, method: string) => {
      const cleanPath = path.split('?')[0];
      
      if (cleanPath.includes('/v2/tns/available')) {
        return {
          ok: true,
          status: 200,
          data: {
            items: [
              { terminal: "34991234567", category: "PLATINUM", price: 50.00 },
              { terminal: "34991234568", category: "GOLD", price: 30.00 },
              { terminal: "34991234569", category: "STANDARD", price: 0.00 },
              { terminal: "34991234570", category: "STANDARD", price: 0.00 }
            ],
            count: 4
          }
        };
      }
      
      if (cleanPath.includes('/v2/mobilelines') && method === 'POST') {
        return {
          ok: true,
          status: 201,
          data: {
            id: "line_mock_123",
            status: "ACTIVATING",
            iccid: body?.simcard || "8955123456789012345",
            terminal: body?.terminal || "34991234567",
            created_at: new Date().toISOString()
          }
        };
      }

      if (cleanPath.includes('/v2/subscribers/')) {
        const doc = cleanPath.split('/').pop();
        return {
          ok: true,
          status: 200,
          data: {
            id: "sub_mock_" + doc,
            full_name: doc === "12345678901" ? "João da Silva (Mock)" : "Assinante Encontrado (Mock)",
            document: doc,
            birth_date: "1990-01-01",
            status: "ACTIVE",
            email: "contato@mock.com",
            contact_number: "5534999999999"
          }
        };
      }

      if (cleanPath.includes('/v2/subscribers')) {
        return {
          ok: true,
          status: 200,
          data: [
            {
              id: "sub_mock_456",
              name: "João da Silva (Mock)",
              document: "12345678901",
              status: "ACTIVE",
              email: "joao.mock@example.com",
              iccid: "8955123456789012345",
              msisdn: "34991234567",
              plan: "Linha Movel MultiRede 10 GB",
              operator: "Algar",
              card: {
                type: "esim",
                iccid: "8955123456789012345",
                imsi: "724321234567890",
                activationData: "LPA:1$datorabrazil.validspereachdpplus.com$7E89VQENPZOJ6L09FTTAGYMQYP1EBYLTHZU09PCSJ0IYUK80BQO4274MQA6QALMD",
                status: "active"
              },
              usage: { 
                current: 1.2, 
                total: 10, 
                days_left: 12, 
                total_days: 31,
                consumption_details: [
                  { type: "Data", used: "1.2GB", remaining: "8.8GB" },
                  { type: "Voice", used: "45min", remaining: "Ilimitado" },
                  { type: "SMS", used: "12", remaining: "Ilimitado" }
                ]
              },
              portabilityData: {
                status: "scheduled",
                requestDate: "2026-05-28T13:31:00Z",
                scheduledDate: "2026-06-15T14:00:00Z",
                portedNumber: "(11) 99999-1111",
                tempNumber: "(11) 98888-1111",
                bp: "ALGAR_PORT_001"
              },
              address: {
                zipcode: "38400000",
                street: "Av. Floriano Peixoto",
                number: "1000",
                complement: "Bloco A",
                neighborhood: "Centro",
                city: "Uberlândia",
                state: "MG"
              },
              device: {
                name: "iPhone 15 Pro",
                os: "iOS 17.4",
                tech: "5G",
                sim_type: "eSIM",
                imei: "350000000000001",
                sw_ver: "17.4.1",
                image: "https://images.unsplash.com/photo-1695653422715-991ec3a0db7a?w=100&q=80"
              },
              protocols: [
                { id: "PROT2026001", type: "Ativação", date: "2026-05-28T13:30:00Z", status: "Finalizado" }
              ]
            }
          ]
        };
      }

      if (cleanPath.includes('/usage')) {
        return {
          ok: true,
          status: 200,
          data: {
            data_usage: "1.2GB",
            voice_usage: "45min",
            sms_usage: "12",
            limit: "10GB",
            current_gb: 1.2,
            total_gb: 10,
            days_left: 12,
            total_days: 31,
            consumption_details: [
              { type: "Data", used: "1.2GB", remaining: "8.8GB" },
              { type: "Voice", used: "45min", remaining: "Ilimitado" },
              { type: "SMS", used: "12", remaining: "Ilimitado" }
            ]
          }
        };
      }

      if (cleanPath.includes('/lnp')) {
        return {
          ok: true,
          status: 202,
          data: {
            protocol: "LNP-MOCK-789",
            expected_date: new Date(Date.now() + 72 * 3600000).toISOString(),
            status: "PENDING"
          }
        };
      }

      return {
        ok: true,
        status: 200,
        data: { message: "Mock response for " + path, body_received: body }
      };
    };

    if (forceMock || (environment === "sandbox" && (!clientId || !clientSecret || clientId === "MOCK_ID"))) {
      console.log("[Algar] Returning mock data for sandbox environment");
      const mock = getMockResponse(path, method);
      return new Response(JSON.stringify({
        ...mock,
        step: "mock_request",
        durationMs: 50,
        url: `MOCK://${baseUrl}${path}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!clientId || !clientSecret || !baseUrl) {
      throw new Error("Missing credentials or base URL");
    }

    // 1. Get Token
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");
    
    // Determine the OAuth path based on the documentation: /auth/token
    // Some implementations use form-data, others JSON, others Basic Auth in header
    const oauthPathsToTry = ["/auth/token", "/token", "/v1/oauth2/token"];
    let tokenData = null;
    let lastStatus = 404;
    let lastErrorBody = "";

    for (const pathAttempt of oauthPathsToTry) {
      const oauthUrlAttempt = `${cleanBaseUrl}${pathAttempt}`;
      console.log(`[Algar] Trying token from: ${oauthUrlAttempt}`);
      
      try {
        // Try with Basic Auth + form-urlencoded first (Standard OAuth2)
        const authHeader = btoa(`${clientId}:${clientSecret}`);
        const tokenResponse = await fetch(oauthUrlAttempt, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
          },
          body: new URLSearchParams({ grant_type: "client_credentials" }),
        });

        lastStatus = tokenResponse.status;
        const responseText = await tokenResponse.text();
        lastErrorBody = responseText;
        
        if (tokenResponse.ok) {
          tokenData = JSON.parse(responseText);
          console.log(`[Algar] Successfully got token from ${pathAttempt}`);
          break;
        } else {
          console.warn(`[Algar] Token request to ${pathAttempt} failed with status ${tokenResponse.status}: ${responseText}`);
          
          // Fallback: Try with JSON body if Basic Auth fails with 400/401
          if (tokenResponse.status === 401 || tokenResponse.status === 400) {
             console.log(`[Algar] Retrying ${pathAttempt} with JSON body...`);
             const jsonTokenRes = await fetch(oauthUrlAttempt, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" })
             });
             if (jsonTokenRes.ok) {
                tokenData = await jsonTokenRes.json();
                console.log(`[Algar] Successfully got token from ${pathAttempt} (JSON fallback)`);
                break;
             }
          }
        }
      } catch (e) {
        console.warn(`[Algar] Failed to fetch from ${pathAttempt}: ${e.message}`);
      }
    }

    if (!tokenData || !tokenData.access_token) {
      console.error(`[Algar] Auth Failure. Last Status: ${lastStatus}, Body: ${lastErrorBody}`);
      
      // If auth fails in sandbox, we can still fall back to mock data
      if (environment === "sandbox") {
        console.log("[Algar] Auth failed in sandbox, falling back to mock data");
        const mock = getMockResponse(path, method);
        return new Response(JSON.stringify({
          ...mock,
          step: "mock_fallback",
          durationMs: 100,
          error: "Auth failed, using mock data",
          url: `MOCK_FALLBACK://${baseUrl}${path}`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      return new Response(JSON.stringify({ 
        ok: false, 
        step: "auth", 
        status: lastStatus, 
        error: "Could not obtain access token. Check credentials and base URL.",
        details: lastErrorBody
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = tokenData.access_token;

    // 2. Call Endpoint
    const targetUrl = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
    console.log(`[Algar] Calling endpoint: ${method} ${targetUrl}`);

    const startTime = Date.now();
    try {
      const apiResponse = await fetch(targetUrl, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: method !== "GET" && body ? JSON.stringify(body) : undefined,
      });
      const endTime = Date.now();

      const apiResponseText = await apiResponse.text();
      let apiResponseJson;
      try {
        apiResponseJson = JSON.parse(apiResponseText);
      } catch {
        apiResponseJson = apiResponseText;
      }

      // If call returns 404 or other error in sandbox, we can fall back to mock
      if (!apiResponse.ok && environment === "sandbox") {
        console.log(`[Algar] API call failed (${apiResponse.status}) in sandbox, falling back to mock`);
        const mock = getMockResponse(path, method);
        return new Response(JSON.stringify({
          ...mock,
          step: "mock_fallback_request",
          durationMs: endTime - startTime,
          original_status: apiResponse.status,
          original_error: apiResponseJson,
          url: targetUrl
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Log the first few characters of the response for debugging production data structure
      const responseSnippet = apiResponseText.substring(0, 500);
      console.log(`[Algar] API Response (${apiResponse.status}): ${responseSnippet}${apiResponseText.length > 500 ? '...' : ''}`);

      return new Response(JSON.stringify({
        ok: apiResponse.ok,
        step: "request",
        status: apiResponse.status,
        durationMs: endTime - startTime,
        data: apiResponseJson,
        url: targetUrl
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (apiError) {
      if (environment === "sandbox") {
        console.log(`[Algar] API call crashed in sandbox, falling back to mock: ${apiError.message}`);
        const mock = getMockResponse(path, method);
        return new Response(JSON.stringify({
          ...mock,
          step: "mock_fallback_crash",
          error: apiError.message,
          url: targetUrl
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      throw apiError;
    }

  } catch (error) {
    console.error(`[Algar] Unexpected error:`, error.message);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});