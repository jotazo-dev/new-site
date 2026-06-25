// Runner para ativação Algar em lote (também usado para single-line).
// Cada linha é processada sequencialmente; falhas não interrompem o lote.
import { algarCall, activateMobileLine } from "@/components/admin/esim/algar/algarClient";
import { supabase } from "@/integrations/supabase/client";

export type AlgarLineDraft = {
  tn: string;
  iccid: string;
  simType: "sim" | "esim";
  note?: string;
};

export type BatchSharedMeta = {
  docType: "cpf" | "cnpj";
  form: {
    name: string;
    document: string;
    email: string;
    phone: string;
    birthDate: string; // ISO yyyy-mm-dd (já convertido)
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    representativeDocument?: string;
    representativeName?: string;
    representativeBirthDate?: string; // ISO
  };
  productSku: string;
  productName?: string | null;
  cycle: number;
  locale: string;
  notes?: string;
  subscriberRef: string;
};

export type BatchItemStatus =
  | "pending"
  | "activating"
  | "saving"
  | "confirming"
  | "emailing"
  | "done"
  | "failed";

export type BatchItem = {
  index: number;
  line: AlgarLineDraft;
  status: BatchItemStatus;
  subMsg?: string;
  error?: string;
  activationId?: string;
  activationCode?: string;
  qrPayload?: string;
  emailStatus?: "sent" | "failed" | "skipped";
  emailError?: string;
};

type UpdateFn = (index: number, patch: Partial<BatchItem>) => void;

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

function buildServiceBody(meta: BatchSharedMeta, ref: string, note?: string) {
  const phoneFull = (() => {
    let p = onlyDigits(meta.form.phone);
    if (p.length === 10 || p.length === 11) p = "55" + p;
    return p;
  })();
  const rootBirthdate =
    meta.docType === "cpf"
      ? meta.form.birthDate
      : meta.form.representativeBirthDate || meta.form.birthDate;
  const body: any = {
    subscriber: {
      ref: meta.subscriberRef || `USR_${onlyDigits(meta.form.document)}`,
      type: meta.docType === "cpf" ? "individual" : "company",
      document: onlyDigits(meta.form.document),
      name: meta.form.name,
      birthdate: rootBirthdate,
      email: meta.form.email.trim(),
      contact_number: phoneFull,
    },
    address: {
      zipCode: onlyDigits(meta.form.zipCode),
      streetName: meta.form.street,
      streetNumber: String(meta.form.number),
      complement: meta.form.complement || undefined,
      neighborhood: meta.form.neighborhood,
      city: meta.form.city,
      state: meta.form.state,
    },
    products: [meta.productSku],
    cycle: meta.cycle,
    ref,
    description: (note?.trim() || meta.notes?.trim()) || "Ativação via /admin/mvno/nova-linha",
  };
  if (meta.docType === "cnpj") {
    body.representative = {
      type: "individual",
      document: onlyDigits(meta.form.representativeDocument || ""),
      name: meta.form.representativeName,
      birthdate: meta.form.representativeBirthDate || "",
    };
  }
  return body;
}

async function persistFailure(
  meta: BatchSharedMeta,
  line: AlgarLineDraft,
  step: string,
  status: number | undefined,
  requestBody: any,
  response: any,
) {
  try {
    // Evita duplicidade: se já existe um registro com mesmo provider+TN em estado "failed",
    // atualiza incrementando o contador de tentativas. Caso contrário, insere novo.
    const tnKey = (line.tn || "").trim();
    let existing: { id: string; raw_response: any; notes: string | null } | null = null;
    if (tnKey) {
      const { data } = await supabase
        .from("mvno_activations")
        .select("id, raw_response, notes")
        .eq("provider", "algar")
        .eq("tn", tnKey)
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      existing = (data as any) || null;
    }

    const prevAttempts: any[] = Array.isArray(existing?.raw_response?.attempts)
      ? existing!.raw_response.attempts
      : existing?.raw_response
        ? [existing.raw_response]
        : [];
    const newAttempt = { step, status, at: new Date().toISOString(), requestBody, response };
    const attempts = [...prevAttempts, newAttempt].slice(-10); // mantém últimas 10
    const failedAttempts = attempts.length;

    const payload: any = {
      provider: "algar",
      tn: tnKey || "",
      iccid: line.iccid || null,
      sim_type: line.simType || null,
      product_sku: meta.productSku || null,
      product_name: meta.productName || null,
      cycle: meta.cycle || null,
      locale: meta.locale || null,
      subscriber_doc: onlyDigits(meta.form.document),
      subscriber_name: meta.form.name,
      subscriber_email: meta.form.email || null,
      subscriber_phone: meta.form.phone || null,
      notes: `[FAILED x${failedAttempts} ${step} ${status ?? "?"}] ${line.note?.trim() || meta.notes || ""}`.slice(0, 500),
      raw_response: { step, status, requestBody, response, failedAttempts, attempts } as any,
      status: "failed",
      email_status: "skipped",
    };

    if (existing) {
      await supabase.from("mvno_activations").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("mvno_activations").insert(payload);
    }
  } catch (e) {
    console.error("[ALGAR-BATCH] persist failure error", e);
  }
}


export async function runAlgarBatch(
  items: BatchItem[],
  meta: BatchSharedMeta,
  onUpdate: UpdateFn,
  indices?: number[],
) {
  const toRun = indices ?? items.map((it) => it.index);
  for (const idx of toRun) {
    const item = items.find((it) => it.index === idx);
    if (!item) continue;
    const line = item.line;
    const ref = `APP_${Date.now()}_${idx}`;
    onUpdate(idx, { status: "activating", subMsg: "Enviando para Algar...", error: undefined });

    let serviceBody: any;
    let activatePayload: any;
    try {
      serviceBody = buildServiceBody(meta, ref, line.note);
      activatePayload = {
        tn: line.tn,
        card: { type: line.simType, iccid: line.iccid },
        service: serviceBody,
      };
      const act = await activateMobileLine(activatePayload as any);
      if (!act?.ok) {
        const errMsg = String(
          act?.error || (act?.data && JSON.stringify(act.data)) || act?.raw || "Falha desconhecida",
        ).slice(0, 240);
        await persistFailure(meta, line, "/v2/mobilelines", act?.status, activatePayload, {
          error: act?.error,
          data: act?.data,
          raw: act?.raw,
        });
        onUpdate(idx, { status: "failed", subMsg: undefined, error: `(${act?.status ?? "?"}) ${errMsg}` });
        continue;
      }

      const ad: any = act.data?.data ?? act.data ?? {};
      const card: any = ad.card || ad.sim || ad.mobileline?.card || {};
      const lineRef = ad.ref || ad.id || ad.mobileline?.ref || ad.mobileline?.id || ad.service?.id || "";
      const activationCode =
        card.activationData || ad.activation_code || ad.activationCode || ad.lpa ||
        ad.mobileline?.activation_code || "";
      const qrPayload = ad.qr_code || ad.qrCode || card.activationData || activationCode || "";

      onUpdate(idx, { status: "saving", subMsg: "Salvando registro...", activationCode, qrPayload });

      // Se já existe(m) registro(s) "failed" para esta TN (ou ICCID) deste provider,
      // reaproveita o mais recente em vez de inserir um novo — assim a retentativa que
      // dá certo "promove" o próprio registro falhado, sem duplicar a linha na listagem.
      let existingFailedId: string | undefined;
      try {
        const tnKey = (line.tn || "").trim();
        const iccidKey = (line.iccid || "").trim();
        if (tnKey || iccidKey) {
          let q = supabase
            .from("mvno_activations")
            .select("id")
            .eq("provider", "algar")
            .eq("status", "failed")
            .order("created_at", { ascending: false })
            .limit(1);
          if (tnKey && iccidKey) q = q.or(`tn.eq.${tnKey},iccid.eq.${iccidKey}`);
          else if (tnKey) q = q.eq("tn", tnKey);
          else q = q.eq("iccid", iccidKey);
          const { data: prev } = await q.maybeSingle();
          existingFailedId = (prev as any)?.id;
        }
      } catch (e) {
        console.warn("[ALGAR-BATCH] lookup previous failed", e);
      }

      const recordPayload = {
        provider: "algar" as const,
        tn: line.tn,
        iccid: line.iccid || null,
        sim_type: line.simType,
        product_sku: meta.productSku,
        product_name: meta.productName || null,
        cycle: meta.cycle,
        locale: meta.locale,
        subscriber_doc: onlyDigits(meta.form.document),
        subscriber_name: meta.form.name,
        subscriber_email: meta.form.email || null,
        subscriber_phone: meta.form.phone || null,
        notes: line.note?.trim() || meta.notes || null,
        raw_response: ad,
        activation_code: activationCode || null,
        qr_payload: qrPayload || null,
        status: "pending",
        email_status: meta.form.email ? "not_sent" : "skipped",
      };

      let activationId: string | undefined;
      if (existingFailedId) {
        const { data: upd, error: updErr } = await supabase
          .from("mvno_activations")
          .update(recordPayload)
          .eq("id", existingFailedId)
          .select("id")
          .single();
        if (updErr) console.error("[ALGAR-BATCH] mvno_activations update (retry success)", updErr);
        activationId = (upd as any)?.id || existingFailedId;
      } else {
        const { data: rec, error: recErr } = await supabase
          .from("mvno_activations")
          .insert(recordPayload)
          .select("id")
          .single();
        if (recErr) console.error("[ALGAR-BATCH] mvno_activations insert", recErr);
        activationId = rec?.id as string | undefined;
      }


      if (lineRef && activationId) {
        onUpdate(idx, { status: "confirming", subMsg: "Confirmando ativação..." });
        try {
          const confirm = await algarCall<any>(`/v2/mobilelines/${lineRef}`);
          if (confirm?.ok) {
            await supabase
              .from("mvno_activations")
              .update({ status: "confirmed", raw_response: confirm.data ?? ad })
              .eq("id", activationId);
          }
        } catch (e) {
          console.warn("[ALGAR-BATCH] confirm failed", e);
        }
      }

      let emailStatus: "sent" | "failed" | "skipped" = "skipped";
      let emailError: string | undefined;
      if (meta.form.email && activationId) {
        onUpdate(idx, { status: "emailing", subMsg: "Enviando e-mail..." });
        try {
          const { data: mailData, error: mailErr } = await supabase.functions.invoke(
            "send-mvno-activation-email",
            {
              body: {
                activationId,
                provider: "algar",
                tn: line.tn,
                iccid: line.iccid,
                simType: line.simType,
                productName: meta.productName,
                productSku: meta.productSku,
                cycle: meta.cycle,
                locale: meta.locale,
                subscriberName: meta.form.name,
                subscriberDoc: meta.form.document,
                subscriberEmail: meta.form.email,
                subscriberPhone: meta.form.phone,
                notes: line.note?.trim() || meta.notes,
                activationCode,
                qrPayload,
              },
            },
          );
          if (mailErr || (mailData as any)?.ok === false) {
            emailStatus = "failed";
            emailError = (mailErr?.message || (mailData as any)?.userMessage || "Falha ao enviar").slice(0, 200);
          } else {
            emailStatus = "sent";
          }
        } catch (e: any) {
          emailStatus = "failed";
          emailError = (e?.message || "Falha ao enviar").slice(0, 200);
        }
      }

      onUpdate(idx, {
        status: "done",
        subMsg: undefined,
        activationId,
        activationCode,
        qrPayload,
        emailStatus,
        emailError,
      });
    } catch (err: any) {
      const errMsg = (err?.message || "Erro inesperado").slice(0, 240);
      try {
        await persistFailure(meta, line, "/v2/mobilelines", undefined, activatePayload ?? null, { error: errMsg });
      } catch {}
      onUpdate(idx, { status: "failed", subMsg: undefined, error: errMsg });
    }
  }
}
