import { LogOut, User, MapPin, Wifi, FileText, ExternalLink, ShieldCheck, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AuthCustomer } from "@/hooks/useMinhaContaAuth";
import { useInvoicesList } from "@/hooks/useMinhaContaInvoices";
import { centsToReais } from "@/lib/money";

function parseEndereco(endereco: string) {
  if (!endereco || endereco === "Endereço não cadastrado") return null;
  const parts = endereco.split(" — ").map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts : null;
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-muted/50 rounded-xl border border-border overflow-hidden">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/40">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </header>
      <div className="p-4 space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
      <p className="text-sm font-medium break-words">{value || "Não informado"}</p>
    </div>
  );
}

export function PerfilView({ customer, onLogout }: { customer: AuthCustomer; onLogout: () => void }) {
  const { list, loading } = useInvoicesList();
  const enderecoLinhas = parseEndereco(customer.endereco);

  const latestWithPlan = (list || []).find((i) => !!i.plano);
  const planoNome = latestWithPlan?.plano || null;
  const planoValor = latestWithPlan ? centsToReais(latestWithPlan.amountCents) : null;

  const situacaoOk = /ativo|ativ|ok|liberado/i.test(customer.situacao || "");

  const contratos = [
    {
      label: "Contrato de prestação de serviços",
      desc: "Termos e condições gerais",
      href: "/docs/CONTRATO_JOTAZO.pdf",
      icon: ScrollText,
    },
    {
      label: "Política de privacidade",
      desc: "Como tratamos seus dados",
      href: "/privacidade",
      icon: ShieldCheck,
    },
    {
      label: "Regulamento de ofertas",
      desc: "Regras de promoções e benefícios",
      href: "/regulamento",
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header avatar */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary text-3xl font-bold ring-4 ring-primary/10">
          {customer.name.charAt(0)}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">{customer.name}</h2>
          <p className="text-xs text-muted-foreground">Código do cliente: <span className="font-mono">{customer.code}</span></p>
        </div>
      </div>

      {/* Dados pessoais */}
      <SectionCard icon={User} title="Dados pessoais">
        <Field label="Documento" value={customer.documentMasked} />
        <Field label="E-mail" value={customer.email} />
        <Field label="Telefone" value={customer.phone} />
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Situação</p>
          <Badge
            className={
              situacaoOk
                ? "bg-[#25D366]/15 text-[#1ea855] hover:bg-[#25D366]/15 border border-[#25D366]/30"
                : "bg-destructive/15 text-destructive hover:bg-destructive/15 border border-destructive/30"
            }
          >
            {customer.situacao || "Indisponível"}
          </Badge>
        </div>
      </SectionCard>

      {/* Endereço */}
      <SectionCard icon={MapPin} title="Endereço de instalação">
        {enderecoLinhas ? (
          <div className="space-y-1">
            {enderecoLinhas.map((linha, i) => (
              <p key={i} className="text-sm font-medium">{linha}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Endereço não cadastrado</p>
        )}
      </SectionCard>

      {/* Plano atual */}
      <SectionCard icon={Wifi} title="Plano atual">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando plano…</p>
        ) : planoNome ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-bold text-primary truncate">{planoNome}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Identificado pela sua fatura mais recente
              </p>
            </div>
            {planoValor && (
              <div className="text-right shrink-0">
                <p className="text-lg font-bold">R$ {planoValor}</p>
                <p className="text-[10px] text-muted-foreground uppercase">/mês</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Não foi possível identificar seu plano. Entre em contato com o suporte.
          </p>
        )}
      </SectionCard>

      {/* Contratos */}
      <SectionCard icon={FileText} title="Contratos e documentos">
        <div className="space-y-2 -mt-1">
          {contratos.map((c) => {
            const Icon = c.icon;
            const external = c.href.endsWith(".pdf");
            return (
              <a
                key={c.label}
                href={c.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/60 hover:bg-background hover:border-primary/40 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{c.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.desc}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              </a>
            );
          })}
        </div>
      </SectionCard>

      <Button
        variant="outline"
        onClick={onLogout}
        className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        <LogOut className="h-4 w-4 mr-2" /> Finalizar sessão
      </Button>
    </div>
  );
}
