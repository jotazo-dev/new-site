import { corsHeaders, json, authSession } from "../_shared/webmail.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await authSession(req);
  if (!auth) return json({ error: "unauthorized" }, 401);
  const sb = auth.sb;
  const accountId = auth.account.id;

  let body: any = {};
  try { body = await req.json(); } catch {}
  const action = String(body?.action || "list");

  try {
    switch (action) {
      case "list": {
        const [{ data: contacts }, { data: labels }, { data: links }, { data: cats }] = await Promise.all([
          sb.from("webmail_contacts").select("*").eq("account_id", accountId).order("name", { ascending: true }),
          sb.from("webmail_contact_labels").select("*").eq("account_id", accountId).order("sort_order", { ascending: true }).order("name", { ascending: true }),
          sb.from("webmail_contact_label_links").select("contact_id,label_id"),
          sb.from("webmail_contact_categories").select("*").eq("account_id", accountId).order("sort_order", { ascending: true }).order("name", { ascending: true }),
        ]);
        const linkMap: Record<string, string[]> = {};
        for (const l of links || []) {
          (linkMap[l.contact_id] ||= []).push(l.label_id);
        }
        const withLabels = (contacts || []).map((c: any) => ({ ...c, label_ids: linkMap[c.id] || [] }));
        const catNames = new Set<string>((cats || []).map((c: any) => c.name));
        for (const c of (contacts || [])) { if (c.category) catNames.add(c.category); }
        const categories = Array.from(catNames).sort((a, b) => a.localeCompare(b, "pt-BR"));
        return json({ contacts: withLabels, labels: labels || [], categories, categoryItems: cats || [] });
      }


      case "upsert": {
        const c = body?.contact || {};
        const labelIds: string[] = Array.isArray(body?.label_ids) ? body.label_ids : [];
        const payload = {
          account_id: accountId,
          name: String(c.name || "").trim().slice(0, 200),
          email: String(c.email || "").trim().toLowerCase().slice(0, 255),
          phone: String(c.phone || "").trim().slice(0, 40),
          company: String(c.company || "").trim().slice(0, 200),
          notes: String(c.notes || "").slice(0, 5000),
          category: String(c.category || "").trim().slice(0, 60),
          favorite: !!c.favorite,
        };
        if (!payload.name && !payload.email) return json({ error: "name or email required" }, 400);

        let contactId = c.id;
        if (contactId) {
          const { error } = await sb.from("webmail_contacts").update(payload).eq("id", contactId).eq("account_id", accountId);
          if (error) return json({ error: error.message }, 400);
        } else {
          const { data, error } = await sb.from("webmail_contacts").insert(payload).select("id").single();
          if (error) return json({ error: error.message }, 400);
          contactId = data.id;
        }

        // sync label links
        await sb.from("webmail_contact_label_links").delete().eq("contact_id", contactId);
        if (labelIds.length) {
          const rows = labelIds.map((label_id) => ({ contact_id: contactId, label_id }));
          await sb.from("webmail_contact_label_links").insert(rows);
        }
        return json({ ok: true, id: contactId });
      }

      case "delete": {
        const ids: string[] = Array.isArray(body?.ids) ? body.ids : (body?.id ? [body.id] : []);
        if (!ids.length) return json({ error: "no ids" }, 400);
        const { error } = await sb.from("webmail_contacts").delete().in("id", ids).eq("account_id", accountId);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "label.upsert": {
        const l = body?.label || {};
        const payload = {
          account_id: accountId,
          name: String(l.name || "").trim().slice(0, 60),
          color: String(l.color || "#3b82f6").slice(0, 20),
          sort_order: Number(l.sort_order) || 0,
        };
        if (!payload.name) return json({ error: "name required" }, 400);
        if (l.id) {
          const { error } = await sb.from("webmail_contact_labels").update(payload).eq("id", l.id).eq("account_id", accountId);
          if (error) return json({ error: error.message }, 400);
          return json({ ok: true, id: l.id });
        }
        const { data, error } = await sb.from("webmail_contact_labels").insert(payload).select("*").single();
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, label: data });
      }

      case "label.delete": {
        const id = body?.id;
        if (!id) return json({ error: "no id" }, 400);
        const { error } = await sb.from("webmail_contact_labels").delete().eq("id", id).eq("account_id", accountId);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "category.upsert": {
        const cat = body?.category || {};
        const name = String(cat.name || "").trim().slice(0, 60);
        const color = String(cat.color || "#64748b").slice(0, 20);
        const sort_order = Number(cat.sort_order) || 0;
        if (!name) return json({ error: "name required" }, 400);

        if (cat.id) {
          // detect rename to propagate to contacts
          const { data: prev } = await sb.from("webmail_contact_categories").select("name").eq("id", cat.id).eq("account_id", accountId).maybeSingle();
          const { error } = await sb.from("webmail_contact_categories").update({ name, color, sort_order }).eq("id", cat.id).eq("account_id", accountId);
          if (error) return json({ error: error.message }, 400);
          if (prev?.name && prev.name !== name) {
            await sb.from("webmail_contacts").update({ category: name }).eq("account_id", accountId).eq("category", prev.name);
          }
          return json({ ok: true, id: cat.id });
        }
        const { data, error } = await sb.from("webmail_contact_categories").insert({ account_id: accountId, name, color, sort_order }).select("*").single();
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, category: data });
      }

      case "category.delete": {
        const id = body?.id;
        if (!id) return json({ error: "no id" }, 400);
        const { data: prev } = await sb.from("webmail_contact_categories").select("name").eq("id", id).eq("account_id", accountId).maybeSingle();
        const { error } = await sb.from("webmail_contact_categories").delete().eq("id", id).eq("account_id", accountId);
        if (error) return json({ error: error.message }, 400);
        if (prev?.name) {
          await sb.from("webmail_contacts").update({ category: "" }).eq("account_id", accountId).eq("category", prev.name);
        }
        return json({ ok: true });
      }

      default:
        return json({ error: "unknown action" }, 400);
    }

  } catch (e: any) {
    return json({ error: e?.message || "erro" }, 500);
  }
});
