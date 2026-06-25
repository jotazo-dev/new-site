import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { algarCall, findSubscriberByDocument, invalidateMobilelinesCache } from "./algarClient";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AlgarCustomerDialogProps {
  onSuccess: () => void;
}

type DocumentType = "cpf" | "cnpj";

const getField = (obj: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
};

export function AlgarCustomerDialog({ onSuccess }: AlgarCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [searchingCpf, setSearchingCpf] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>("cpf");
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "found_algar" | "manual_cnpj_enriched" | "manual_new"
  >("idle");
  const emptyForm = {
    name: "",
    document: "",
    birthDate: "",
    email: "",
    phone: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  const resetDialog = () => {
    setFormData(emptyForm);
    setDocumentType("cpf");
    setSearchStatus("idle");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetDialog();
    setOpen(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Apply masks
    let maskedValue = value;
    if (name === "document") {
      maskedValue = value.replace(/\D/g, "").slice(0, documentType === "cpf" ? 11 : 14);
      setSearchStatus("idle");
    } else if (name === "zipCode") {
      maskedValue = value.replace(/\D/g, "").slice(0, 8);
    } else if (name === "phone") {
      maskedValue = value.replace(/\D/g, "").slice(0, 11);
    }

    setFormData((prev) => ({ ...prev, [name]: maskedValue }));
  };

  const handleDocumentTypeChange = (value: DocumentType) => {
    setDocumentType(value);
    setSearchStatus("idle");
    setFormData((prev) => ({ ...prev, document: "", birthDate: "" }));
  };

  // Auto-search CEP
  useEffect(() => {
    const searchCep = async () => {
      const cleanCep = formData.zipCode.replace(/\D/g, "");
      if (cleanCep.length === 8) {
        setSearchingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await response.json();
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              street: data.logradouro || "",
              neighborhood: data.bairro || "",
              city: data.localidade || "",
              state: data.uf || "",
            }));
            toast.success("Endereço preenchido automaticamente");
          }
        } catch (error) {
          console.error("Erro ao buscar CEP", error);
        } finally {
          setSearchingCep(false);
        }
      }
    };
    searchCep();
  }, [formData.zipCode]);

  // Search CPF/CNPJ only in the mobile lines returned by the connected Jotazo Algar integration.
  const checkCpf = async () => {
    const cleanDoc = formData.document.replace(/\D/g, "");
    const expectedLength = documentType === "cpf" ? 11 : 14;
    if (cleanDoc.length !== expectedLength) {
      toast.error(`Digite um ${documentType.toUpperCase()} válido (${expectedLength} números)`);
      return;
    }

    setSearchingCpf(true);
    setSearchStatus("idle");
    try {
      // Uses the shared cached index in algarClient (single full sweep, parallel pages, 5min TTL).
      const match = await findSubscriberByDocument(cleanDoc);

      if (match) {
        const sub = match as unknown as Record<string, unknown>;
        const addr = (match.address || {}) as Record<string, unknown>;
        const rawPhone = getField(sub, "contact_number", "contactPhone", "phone");
        let cleanPhone = String(rawPhone).replace(/\D/g, "");
        if (cleanPhone.startsWith("55") && cleanPhone.length > 11) cleanPhone = cleanPhone.slice(2);
        cleanPhone = cleanPhone.slice(0, 11);

        const rawBirth = getField(sub, "birth_date", "birthdate", "birthDate");
        let birth = String(rawBirth);
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(birth)) {
          const [d, m, y] = birth.split("/");
          birth = `${y}-${m}-${d}`;
        } else if (birth.includes("T")) {
          birth = birth.split("T")[0];
        }

        setFormData((prev) => ({
          ...prev,
          name: getField(sub, "full_name", "name") || prev.name,
          email: getField(sub, "email") || prev.email,
          phone: cleanPhone || prev.phone,
          birthDate: birth || prev.birthDate,
          zipCode: String(getField(addr, "zipCode", "zip_code") || prev.zipCode).replace(/\D/g, "").slice(0, 8),
          street: getField(addr, "streetName", "street") || prev.street,
          number: getField(addr, "streetNumber", "number") || prev.number,
          complement: getField(addr, "complement") || prev.complement,
          neighborhood: getField(addr, "neighborhood") || prev.neighborhood,
          city: getField(addr, "city") || prev.city,
          state: (getField(addr, "state") || prev.state).toUpperCase().slice(0, 2),
        }));
        setSearchStatus("found_algar");
        toast.success(`Cliente já cadastrado na base Jotazo: ${getField(sub, "full_name", "name") || "sem nome"}`);
        return;
      }


      setFormData({ ...emptyForm, document: formData.document });
      setSearchStatus("manual_new");
      toast.info(
        `${documentType.toUpperCase()} não encontrado nas linhas Algar da Jotazo. Preencha os dados manualmente.`,
        { duration: 5000 }
      );
    } catch (error) {
      console.error("Erro ao buscar documento", error);
      toast.error("Erro ao consultar as linhas Algar da Jotazo");
    } finally {
      setSearchingCpf(false);
    }
  };

  const statusBanner = (() => {
    switch (searchStatus) {
      case "found_algar":
        return {
          className: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
          text: formData.name
            ? `Cliente encontrado na base: ${formData.name}. Confira os dados e prossiga.`
            : "Cliente encontrado na base. Confira os dados e prossiga.",
        };
      case "manual_cnpj_enriched":
        return {
          className: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
          text: "CNPJ novo. Dados públicos preenchidos via BrasilAPI — complete o restante.",
        };
      case "manual_new":
        return {
          className: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
          text:
            "Documento ainda não existe na base. Preencha os dados manualmente para criar o cadastro.",
        };
      default:
        return null;
    }
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchStatus === "found_algar") {
      toast.error("Este assinante já existe na base Jotazo. Cadastro bloqueado.");
      return;
    }
    setLoading(true);

    try {
      // Ensure phone has 55 prefix
      let finalPhone = formData.phone.replace(/\D/g, "");
      if (finalPhone.length === 11 || finalPhone.length === 10) {
        finalPhone = "55" + finalPhone;
      }

      const res = await algarCall("/v2/subscribers", {
        method: "POST",
        body: {
          full_name: formData.name,
          document: formData.document.replace(/\D/g, ""),
          type: documentType === "cpf" ? "individual" : "company",
          birth_date: formData.birthDate,
          email: formData.email,
          contact_number: finalPhone,
          address: {
            zip_code: formData.zipCode.replace(/\D/g, ""),
            street: formData.street,
            number: formData.number,
            complement: formData.complement,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
          },
        },
      });

      if (res && res.ok) {
        toast.success("Assinante cadastrado com sucesso!");
        invalidateMobilelinesCache();
        setOpen(false);
        resetDialog();
        onSuccess();
      } else {
        toast.error(res?.error || "Falha ao cadastrar assinante");
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Erro ao conectar com API Algar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Novo Assinante
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Assinante Algar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Tipo de cadastro *</Label>
              <RadioGroup
                value={documentType}
                onValueChange={(value) => handleDocumentTypeChange(value as DocumentType)}
                className="grid grid-cols-2 gap-2"
              >
                <label className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${documentType === "cpf" ? "border-primary bg-primary/5" : "border-input"}`}>
                  <RadioGroupItem value="cpf" id="doc-cpf" />
                  CPF
                </label>
                <label className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${documentType === "cnpj" ? "border-primary bg-primary/5" : "border-input"}`}>
                  <RadioGroupItem value="cnpj" id="doc-cnpj" />
                  CNPJ
                </label>
              </RadioGroup>
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="document">{documentType === "cpf" ? "CPF *" : "CNPJ *"}</Label>
              <div className="flex gap-2">
                <Input
                  id="document"
                  name="document"
                  value={formData.document}
                  onChange={handleInputChange}
                  placeholder={documentType === "cpf" ? "00000000000" : "00000000000000"}
                  required
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={checkCpf}
                  disabled={searchingCpf || formData.document.length < (documentType === "cpf" ? 11 : 14)}
                  title="Buscar dados do cliente"
                >
                  {searchingCpf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {statusBanner && (
                <div className={`mt-2 rounded-md border px-3 py-2 text-xs ${statusBanner.className}`}>
                  {statusBanner.text}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{documentType === "cpf" ? "Nome Completo *" : "Razão Social *"}</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={documentType === "cpf" ? "Ex: João Silva" : "Ex: Empresa LTDA"}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">{documentType === "cpf" ? "Data de Nascimento *" : "Data de Abertura *"}</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Celular (com DDD) *</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Ex: 11999999999"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3">Endereço</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP *</Label>
                <div className="relative">
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="00000000"
                    required
                  />
                  {searchingCep && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="street">Logradouro *</Label>
                <Input
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="Rua, Avenida..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  name="complement"
                  value={formData.complement}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">UF *</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  maxLength={2}
                  placeholder="SP"
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={loading || searchStatus === "found_algar"}
              title={searchStatus === "found_algar" ? "Assinante já existe na base Jotazo" : undefined}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalizar Cadastro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
