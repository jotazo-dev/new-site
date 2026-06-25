import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, UserCheck, UserPlus } from "lucide-react";
import { findSubscriberByDocument, lookupCep, type AlgarSubscriber } from "../algarClient";
import { toast } from "sonner";

export type SubscriberDraft = {
  found: boolean;
  type: "individual" | "company";
  document: string;
  name: string;
  birthdate: string;
  email: string;
  contact_number: string;
  address: {
    zipCode: string;
    streetName: string;
    streetNumber: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  existing?: AlgarSubscriber | null;
};

const emptyDraft: SubscriberDraft = {
  found: false,
  type: "individual",
  document: "",
  name: "",
  birthdate: "",
  email: "",
  contact_number: "",
  address: {
    zipCode: "",
    streetName: "",
    streetNumber: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  },
};

function maskDoc(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function Step1Subscriber({
  value,
  onChange,
  onNext,
}: {
  value: SubscriberDraft;
  onChange: (v: SubscriberDraft) => void;
  onNext: () => void;
}) {
  const v = value || emptyDraft;
  const [searching, setSearching] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  async function searchDoc() {
    const doc = v.document.replace(/\D/g, "");
    if (doc.length !== 11 && doc.length !== 14) return toast.error("Informe um CPF/CNPJ válido");
    setSearching(true);
    const sub = await findSubscriberByDocument(doc);
    setSearching(false);
    if (sub) {
      const addr = (sub.address || {}) as Record<string, any>;
      const rawPhone = String(
        sub.contact_number || (sub as any).contactPhone || (sub as any).phone || ""
      ).replace(/\D/g, "");
      const phone = rawPhone.startsWith("55") && rawPhone.length > 11 ? rawPhone.slice(2) : rawPhone;

      let birth = String(sub.birth_date || sub.birthdate || (sub as any).birthDate || "");
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(birth)) {
        const [d, m, y] = birth.split("/");
        birth = `${y}-${m}-${d}`;
      } else if (birth.includes("T")) {
        birth = birth.split("T")[0];
      }

      onChange({
        ...v,
        found: true,
        existing: sub,
        type: (sub.type as any) || (doc.length === 11 ? "individual" : "company"),
        document: doc,
        name: sub.full_name || sub.name || (sub as any).fullName || v.name,
        birthdate: birth || v.birthdate,
        email: sub.email || v.email,
        contact_number: phone || v.contact_number,
        address: {
          zipCode: String(addr.zipCode || addr.zip_code || addr.cep || v.address.zipCode).replace(/\D/g, "").slice(0, 8),
          streetName: addr.streetName || addr.street_name || addr.street || addr.logradouro || v.address.streetName,
          streetNumber: String((addr.streetNumber ?? addr.street_number ?? addr.number ?? addr.numero) || v.address.streetNumber || ""),
          complement: addr.complement || addr.complemento || v.address.complement,
          neighborhood: addr.neighborhood || addr.bairro || v.address.neighborhood,
          city: addr.city || addr.cidade || addr.localidade || v.address.city,
          state: String(addr.state || addr.uf || addr.estado || v.address.state).toUpperCase().slice(0, 2),
        },
      });
      toast.success("Cliente encontrado — dados preenchidos automaticamente");
    } else {
      onChange({
        ...emptyDraft,
        found: false,
        existing: null,
        type: doc.length === 11 ? "individual" : "company",
        document: doc,
      });
      toast.info("Cliente não encontrado. Preencha o cadastro abaixo.");
    }
  }

  // Auto-search when the document is fully typed (CPF=11 or CNPJ=14 digits).
  const lastSearched = useRef<string>("");
  useEffect(() => {
    const doc = v.document.replace(/\D/g, "");
    if ((doc.length === 11 || doc.length === 14) && lastSearched.current !== doc && !searching) {
      lastSearched.current = doc;
      searchDoc();
    }
    if (doc.length < 11) {
      lastSearched.current = "";
      if (v.found || v.existing || v.name || v.email || v.contact_number || v.address.zipCode) {
        onChange({ ...emptyDraft, document: v.document });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.document]);

  async function fillCep(cep: string) {
    onChange({ ...v, address: { ...v.address, zipCode: cep } });
    const c = cep.replace(/\D/g, "");
    if (c.length !== 8) return;
    setCepLoading(true);
    const r = await lookupCep(c);
    setCepLoading(false);
    if (r) {
      onChange({
        ...v,
        address: {
          ...v.address,
          ...r,
          streetNumber: v.address.streetNumber,
          complement: v.address.complement,
        },
      });
    }
  }

  const canContinue =
    v.document.replace(/\D/g, "").length >= 11 &&
    v.name.trim().length > 0 &&
    v.address.zipCode.replace(/\D/g, "").length === 8 &&
    v.address.streetName &&
    v.address.streetNumber &&
    v.address.city &&
    v.address.state;

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <Label>CPF ou CNPJ *</Label>
        <div className="flex gap-2">
          <Input
            placeholder="000.000.000-00"
            value={maskDoc(v.document)}
            onChange={(e) => onChange({ ...v, document: e.target.value })}
            onBlur={() => v.document.replace(/\D/g, "").length >= 11 && searchDoc()}
          />
          <Button type="button" variant="outline" onClick={searchDoc} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        {searching && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Buscando informações...
          </Badge>
        )}
        {!searching && v.existing && (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <UserCheck className="h-3 w-3 mr-1" /> Cliente já cadastrado
          </Badge>
        )}
        {!searching && !v.existing && v.document.replace(/\D/g, "").length >= 11 && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <UserPlus className="h-3 w-3 mr-1" /> Novo cadastro
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Nome completo / Razão social *</Label>
          <Input value={v.name} onChange={(e) => onChange({ ...v, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>{v.type === "company" ? "Data de fundação" : "Data de nascimento"}</Label>
          <Input
            type="date"
            value={v.birthdate}
            onChange={(e) => onChange({ ...v, birthdate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Telefone de contato</Label>
          <Input
            placeholder="34999999999"
            value={v.contact_number}
            onChange={(e) => onChange({ ...v, contact_number: e.target.value })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>E-mail</Label>
          <Input
            type="email"
            value={v.email}
            onChange={(e) => onChange({ ...v, email: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t">
        <h4 className="text-sm font-semibold text-muted-foreground">Endereço</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>CEP *</Label>
            <div className="relative">
              <Input
                value={v.address.zipCode}
                onChange={(e) => fillCep(e.target.value)}
                placeholder="00000-000"
              />
              {cepLoading && (
                <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Rua *</Label>
            <Input
              value={v.address.streetName}
              onChange={(e) =>
                onChange({ ...v, address: { ...v.address, streetName: e.target.value } })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Número *</Label>
            <Input
              value={v.address.streetNumber}
              onChange={(e) =>
                onChange({ ...v, address: { ...v.address, streetNumber: e.target.value } })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Complemento</Label>
            <Input
              value={v.address.complement}
              onChange={(e) =>
                onChange({ ...v, address: { ...v.address, complement: e.target.value } })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Bairro *</Label>
            <Input
              value={v.address.neighborhood}
              onChange={(e) =>
                onChange({ ...v, address: { ...v.address, neighborhood: e.target.value } })
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Cidade *</Label>
            <Input
              value={v.address.city}
              onChange={(e) => onChange({ ...v, address: { ...v.address, city: e.target.value } })}
            />
          </div>
          <div className="space-y-2">
            <Label>UF *</Label>
            <Input
              maxLength={2}
              value={v.address.state}
              onChange={(e) =>
                onChange({ ...v, address: { ...v.address, state: e.target.value.toUpperCase() } })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t">
        <Button onClick={onNext} disabled={!canContinue}>
          Continuar
        </Button>
      </div>
    </Card>
  );
}

export { emptyDraft as emptySubscriberDraft };
