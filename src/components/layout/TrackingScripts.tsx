import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

function generateEventId() {
  return `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
}

export function TrackingScripts() {
  const settings = useSiteSettings();
  const [ready, setReady] = useState(false);

  // Defer all third-party tracking until the browser is idle to free up
  // the main thread during the critical render path.
  useEffect(() => {
    const w = window as any;
    const schedule = w.requestIdleCallback
      ? (cb: () => void) => w.requestIdleCallback(cb, { timeout: 2500 })
      : (cb: () => void) => setTimeout(cb, 1500);
    const id = schedule(() => setReady(true));
    return () => {
      if (w.cancelIdleCallback && typeof id === "number") w.cancelIdleCallback(id);
      else if (typeof id === "number") clearTimeout(id);
    };
  }, []);

  const metaPixelId = ready && settings["meta_pixel_active"] === "true" ? settings["meta_pixel_id"] : "";
  const ga4Id = ready && settings["ga4_active"] === "true" ? settings["ga4_measurement_id"] : "";
  const gtmId = ready && settings["gtm_active"] === "true" ? settings["gtm_container_id"] : "";
  const capiToken = ready && settings["meta_pixel_active"] === "true" ? settings["meta_capi_token"] : "";
  const capiSent = useRef(false);

  const { data: customScripts = [] } = useQuery({
    queryKey: ["custom_scripts_public"],
    enabled: ready,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_scripts")
        .select("id, position, content, active")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const headScripts = customScripts.filter((s: any) => s.position === "head");
  const bodyScripts = customScripts.filter((s: any) => s.position === "body");

  // Send server-side PageView via CAPI edge function
  useEffect(() => {
    if (!metaPixelId || !capiToken || capiSent.current) return;
    capiSent.current = true;

    const eventId = generateEventId();

    // Inject event_id into browser pixel PageView for deduplication
    try {
      const w = window as any;
      if (w.fbq) {
        w.fbq("track", "PageView", {}, { eventID: eventId });
      }
    } catch {}

    // Send to CAPI edge function
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (projectId) {
      fetch(
        `https://${projectId}.supabase.co/functions/v1/meta-capi`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_name: "PageView",
            event_id: eventId,
            event_source_url: window.location.href,
            user_data: {
              client_user_agent: navigator.userAgent,
            },
          }),
        }
      ).catch(() => {});
    }
  }, [metaPixelId, capiToken]);

  return (
    <>
      <Helmet>
        {/* Google Tag Manager */}
        {gtmId && (
          <script>{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}</script>
        )}

        {/* Google Analytics (GA4) */}
        {ga4Id && (
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} />
        )}
        {ga4Id && (
          <script>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`}</script>
        )}

        {/* Meta Pixel */}
        {metaPixelId && (
          <script>{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}</script>
        )}

        {/* Custom scripts — head */}
        {headScripts.map((s: any) => (
          <script key={s.id}>{s.content}</script>
        ))}
      </Helmet>

      {/* Meta Pixel noscript fallback — must be in body, not head */}
      {metaPixelId && (
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      )}

      {/* GTM noscript fallback */}
      {gtmId && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="GTM"
          />
        </noscript>
      )}

      {/* Custom scripts — body */}
      {bodyScripts.map((s: any) => (
        <InlineScript key={s.id} content={s.content} />
      ))}
    </>
  );
}

/** Renders raw HTML (including <script> tags) into the body */
function InlineScript({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = content;
    // Execute script tags
    const scripts = ref.current.querySelectorAll("script");
    scripts.forEach((orig) => {
      const s = document.createElement("script");
      Array.from(orig.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      s.textContent = orig.textContent;
      orig.parentNode?.replaceChild(s, orig);
    });
  }, [content]);
  return <div ref={ref} style={{ display: "none" }} />;
}
