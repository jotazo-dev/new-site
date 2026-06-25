import { useEffect, useMemo, useState, FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import DOMPurify from "isomorphic-dompurify";
import {
  Mail, MailOpen, Inbox, Send, FileText, Trash2, Star, Archive, RefreshCw,
  PenSquare, LogOut, Search, Paperclip, X, Reply, Forward, AlertCircle, Loader2,
  Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Menu, User, Download, Smartphone,
  Users, Settings, MoreVertical, Filter,

} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { webmailApi, getAccount, setSession, clearSession, getToken } from "@/lib/webmail";
import jotazoLogo from "@/assets/jotazo-brasil-5g.webp";
import jotazoLogoWhite from "@/assets/jotazo-logo-white.png";
import webmailAppIcon from "@/assets/webmail-app-icon.png";
import webmailRailLogo from "@/assets/webmail-rail-logo.png";
import webmailMobileLogo from "@/assets/webmail-mobile-logo.png";
import jotazoBrasil5gLogo from "@/assets/jotazo-brasil-5g-full.webp";
import { WHATSAPP } from "@/config/site";
import { registerWebmailSW } from "@/webmail/registerSW";
import { WebmailUpdatePrompt } from "@/webmail/WebmailUpdatePrompt";
import { WebmailInstallBanner } from "@/webmail/WebmailInstallBanner";
import { WebmailInstallCard } from "@/webmail/WebmailInstallCard";
import { Link } from "react-router-dom";
import ContactsView from "@/components/webmail/ContactsView";
import ComposerInline, { newDraft, loadDrafts, saveDrafts, type ComposerDraft } from "@/components/webmail/ComposerInline";

/* -------------------- Toast helpers -------------------- */
function friendlyError(e: any, fallback = "Algo deu errado. Tente novamente."): string {
  const raw = String(e?.message || e || "").toLowerCase();
  if (!raw) return fallback;

  const rules: Array<[RegExp, string]> = [
    // Auth / sessão
    [/invalid credentials|invalid login|authentication failed|login failed|bad username|bad password/, "Usuário ou senha inválidos."],
    [/unauthorized|\b401\b|jwt|token expired|session (expired|invalid)/, "Sessão expirada. Faça login novamente."],
    [/\b403\b|forbidden|permission denied|not authorized|access denied/, "Sem permissão para esta ação."],

    // Rate limit / disponibilidade do servidor
    [/\b429\b|rate ?limit|too many requests/, "Muitas tentativas. Aguarde alguns segundos e tente novamente."],
    [/\b50[234]\b|bad gateway|service unavailable|gateway timeout|functionsfetcherror|failed to send a request|non-?2xx/, "Servidor temporariamente indisponível. Tente novamente em instantes."],
    [/cors|aborted|abortcontroller/, "Requisição interrompida. Tente novamente."],

    // Rede / conexão
    [/timeout|timed out|etimedout/, "Tempo esgotado. Verifique sua conexão."],
    [/failed to fetch|networkerror|network (request|error)|offline/, "Sem conexão com o servidor."],
    [/connection refused|econnrefused|econnreset|socket hang up/, "Servidor recusou a conexão."],
    [/tls|ssl|certificate|self-?signed/, "Falha na conexão segura com o servidor."],
    [/dns|no mx|getaddrinfo|enotfound/, "Domínio do destinatário não encontrado."],

    // Tamanho / quota
    [/payload too large|\b413\b|message too large/, "Anexo ou mensagem muito grande."],
    [/over ?quota|mailbox full|disk full|5\.2\.2|insufficient (system )?storage/, "Caixa de e-mail cheia."],

    // IMAP - pastas e mensagens
    [/mailbox already exists|alreadyexists/, "Já existe uma pasta com esse nome."],
    [/mailbox does not exist|nonexistent|trycreate|no such mailbox/, "Pasta não encontrada no servidor."],
    [/mailbox is locked|mailbox in use/, "Pasta em uso. Tente novamente em instantes."],
    [/read[- ]?only/, "Esta pasta é somente leitura."],
    [/cannot move|copy failed|move failed/, "Não foi possível mover a mensagem."],
    [/not found|\b404\b|uid not found|no matching messages/, "Mensagem não encontrada. Pode ter sido movida ou excluída."],

    // SMTP - envio
    [/\b421\b|try again later|temporarily/, "Servidor SMTP temporariamente indisponível. Tente novamente."],
    [/\b45[02]\b/, "Servidor sem espaço temporariamente. Tente novamente."],
    [/\b550\b|mailbox unavailable|user unknown|no such user|recipient (rejected|address rejected)|address rejected/, "Destinatário inválido ou inexistente."],
    [/\b551\b|relay(ing)? denied|relay access denied|\brelay\b/, "Servidor não permite envio para este destinatário."],
    [/\b552\b|message size exceeds|5\.3\.4/, "Mensagem excede o tamanho permitido."],
    [/\b553\b|sender address rejected|from address rejected/, "Endereço de remetente rejeitado."],
    [/\b554\b|transaction failed|spam|blocked|blacklist|policy/, "Mensagem rejeitada pelo servidor (possível spam)."],

    // Genéricos (mais amplos por último)
    [/\bauth\b/, "Usuário ou senha inválidos."],
  ];

  for (const [re, msg] of rules) if (re.test(raw)) return msg;
  return e?.message || fallback;
}

const ACTION_LABELS: Record<string, { loading: string; success: string }> = {
  delete: { loading: "Excluindo…", success: "Mensagem excluída" },
  move: { loading: "Movendo…", success: "Mensagem movida" },
  mark_read: { loading: "Marcando…", success: "Marcada como lida" },
  mark_unread: { loading: "Marcando…", success: "Marcada como não lida" },
  flag: { loading: "Sinalizando…", success: "Sinalizada" },
  unflag: { loading: "Removendo sinal…", success: "Sinal removido" },
};

type Addr = { address?: string; name?: string };
type ListItem = {
  uid: number;
  flags: string[];
  from: Addr[];
  to: Addr[];
  subject: string;
  date: string;
  hasAttachments: boolean;
  size: number;
};
type FolderItem = { path: string; name: string; specialUse: string | null };

const FOLDER_ALIASES: Record<string, { label: string; icon: any }> = {
  "\\Inbox": { label: "Caixa de entrada", icon: Inbox },
  "\\Sent": { label: "Enviados", icon: Send },
  "\\Drafts": { label: "Rascunhos", icon: FileText },
  "\\Trash": { label: "Lixeira", icon: Trash2 },
  "\\Junk": { label: "Spam", icon: AlertCircle },
  "\\Archive": { label: "Arquivo", icon: Archive },
};

function folderMeta(f: FolderItem) {
  const a = f.specialUse ? FOLDER_ALIASES[f.specialUse] : null;
  if (a) return a;
  const name = f.name.toLowerCase();
  if (name === "inbox") return FOLDER_ALIASES["\\Inbox"];
  if (name.includes("sent")) return FOLDER_ALIASES["\\Sent"];
  if (name.includes("draft")) return FOLDER_ALIASES["\\Drafts"];
  if (name.includes("trash") || name.includes("lixeira")) return FOLDER_ALIASES["\\Trash"];
  if (name.includes("spam") || name.includes("junk")) return FOLDER_ALIASES["\\Junk"];
  return { label: f.name, icon: Mail };
}

function fmtAddr(a: Addr[]): string {
  if (!a?.length) return "";
  return a.map((x) => x.name || x.address || "").filter(Boolean).join(", ");
}

function fmtDate(d?: string): string {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("pt-BR", sameYear ? { day: "2-digit", month: "short" } : { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Webmail() {
  const [account, setAccount] = useState(getAccount());

  useEffect(() => {
    registerWebmailSW();
  }, []);

  return (
    <>
      <Helmet>
        <title>Webmail Jotazo</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/webmail.webmanifest" />
        <meta name="theme-color" content="#00358f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Webmail Jotazo" />
        <link rel="icon" type="image/png" sizes="32x32" href="/webmail-icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/webmail-icon-16.png" />
        <link rel="shortcut icon" href="/webmail-icon-192.png" />
        <link rel="apple-touch-icon" href="/webmail-apple-touch-180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/webmail-icon-152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/webmail-icon-167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/webmail-icon-180.png" />
      </Helmet>
      <WebmailUpdatePrompt />
      {!account || !getToken() ? (
        <LoginScreen onSuccess={(acc) => setAccount(acc)} />
      ) : (
        <MailClient onLogout={() => { clearSession(); setAccount(null); }} accountEmail={account.email} />
      )}
    </>
  );
}

/* -------------------- Login -------------------- */

function LoginScreen({ onSuccess }: { onSuccess: (acc: { id: string; email: string }) => void }) {
  const [username, setUsername] = useState("");
  const email = username ? `${username}@jotazo.com` : "";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [imapHost] = useState("mail.jotazo.com");
  const [smtpHost] = useState("mail.jotazo.com");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  function isValidEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function handleUsernameChange(val: string) {
    // accept only the local-part: strip any @ and whitespace
    const clean = val.replace(/[@\s]/g, "");
    setUsername(clean);
    if (clean && !/^[A-Za-z0-9._%+-]+$/.test(clean)) {
      setEmailError("Use apenas letras, números e . _ - + %");
    } else {
      setEmailError("");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!username || !isValidEmail(email)) {
      setEmailError("Informe seu usuário antes de @jotazo.com");
      return;
    }
    setLoading(true);
    try {
      const r = await webmailApi.login({ email, password, imap_host: imapHost, smtp_host: smtpHost });
      setSession(r.token, r.account, rememberMe);
      onSuccess(r.account);
      toast.success("Conectado!", { description: r.account });
    } catch (e: any) {
      toast.error("Não foi possível entrar", { description: friendlyError(e, "Verifique suas credenciais.") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left — Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(220,80%,25%)] to-[hsl(240,60%,15%)]" />
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[hsl(var(--primary)/0.5)] blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full bg-[hsl(220,90%,50%)/0.35] blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-[hsl(var(--accent)/0.25)] blur-3xl animate-pulse [animation-delay:2s]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-md px-12 text-white space-y-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-xs font-medium text-white/80">Webmail Corporativo Jotazo</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Sua caixa de entrada,
              <br />
              <span className="bg-gradient-to-r from-white via-blue-200 to-blue-300 bg-clip-text text-transparent">
                mais rápida e segura.
              </span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed">
              Acesse seu e-mail Jotazo de qualquer lugar com criptografia de ponta, busca instantânea e atalhos produtivos.
            </p>
          </div>

        </div>
      </div>

      {/* Right — Form (mobile = full screen app splash) */}
      <div
        className="flex w-full lg:w-1/2 items-center justify-center relative bg-background overflow-hidden lg:bg-background"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Mobile splash background (hidden on desktop) */}
        <div className="lg:hidden absolute inset-0 -z-0"
          style={{
            background:
              "radial-gradient(at 20% 10%, hsl(220 90% 50% / 0.35) 0, transparent 50%)," +
              "radial-gradient(at 80% 90%, hsl(25 95% 55% / 0.18) 0, transparent 50%)," +
              "linear-gradient(135deg, #001a4d 0%, #00358f 60%, #0a1e5c 100%)",
          }}
        />
        <div className="hidden lg:block absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(var(--primary)/0.04)] blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-sm px-6 py-10 lg:px-8 lg:py-12">
          <div className="lg:hidden rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl p-6 shadow-2xl shadow-black/40">
            <LoginFormInner
              email={username} password={password} showPassword={showPassword}
              rememberMe={rememberMe} loading={loading} emailError={emailError}
              onEmailChange={handleUsernameChange}
              onPasswordChange={setPassword}
              onTogglePassword={() => setShowPassword((v) => !v)}
              onRememberChange={setRememberMe}
              onForgot={() => setForgotOpen(true)}
              onSubmit={submit}
              variant="mobile"
            />
          </div>
          <div className="hidden lg:block">
            <LoginFormInner
              email={username} password={password} showPassword={showPassword}
              rememberMe={rememberMe} loading={loading} emailError={emailError}
              onEmailChange={handleUsernameChange}
              onPasswordChange={setPassword}
              onTogglePassword={() => setShowPassword((v) => !v)}
              onRememberChange={setRememberMe}
              onForgot={() => setForgotOpen(true)}
              onSubmit={submit}
              variant="desktop"
            />
          </div>

          {/* Install CTA (mobile only, hides if already installed) */}
          <WebmailInstallCard />
        </div>
      </div>

      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} initialEmail={email} />
    </div>
  );
}

/* -------------------- Reusable login form -------------------- */
function LoginFormInner(props: {
  email: string; password: string; showPassword: boolean; rememberMe: boolean;
  loading: boolean; emailError: string;
  onEmailChange: (v: string) => void; onPasswordChange: (v: string) => void;
  onTogglePassword: () => void; onRememberChange: (v: boolean) => void;
  onForgot: () => void; onSubmit: (e: FormEvent) => void;
  variant: "mobile" | "desktop";
}) {
  const isMobile = props.variant === "mobile";
  const labelCls = isMobile
    ? "text-[11px] font-medium text-white/70 uppercase tracking-wider"
    : "text-xs font-medium text-muted-foreground uppercase tracking-wider";
  const inputCls = isMobile
    ? "pl-10 h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
    : "pl-10 h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50";
  const iconCls = isMobile ? "text-white/50" : "text-muted-foreground/50";

  return (
    <>
      <div className="flex flex-col items-center text-center mb-6">
        <div className={isMobile ? "mb-4" : "mb-5"}>
          <img
            src={isMobile ? jotazoLogoWhite : jotazoLogo}
            alt="Jotazo Brasil 5G"
            className={isMobile ? "h-14 w-auto object-contain" : "h-14 w-auto object-contain"}
          />
        </div>
        <h2 className={isMobile ? "text-xl font-bold text-white" : "text-2xl font-bold tracking-tight text-foreground"}>
          Bem-vindo de volta
        </h2>
        <p className={isMobile ? "text-xs text-white/70 mt-1" : "text-sm text-muted-foreground mt-1"}>
          Acesse seu e-mail corporativo Jotazo
        </p>
      </div>

      <form onSubmit={props.onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className={labelCls}>E-mail</label>
          <div className="relative">
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconCls}`} />
            <Input
              type="text"
              inputMode="email"
              autoComplete="username"
              required
              autoFocus
              value={props.email}
              onChange={(e) => props.onEmailChange(e.target.value)}
              placeholder="seunome"
              className={`${inputCls} pr-[110px] ${props.emailError ? "border-red-500 focus:border-red-500" : ""}`}
            />
            <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm select-none ${isMobile ? "text-white/60" : "text-muted-foreground"}`}>
              @jotazo.com
            </span>
          </div>
          {props.emailError && (
            <p className={isMobile ? "text-xs text-red-300 mt-1" : "text-xs text-red-500 mt-1"}>{props.emailError}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className={labelCls}>Senha</label>
          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconCls}`} />
            <Input
              type={props.showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={props.password}
              onChange={(e) => props.onPasswordChange(e.target.value)}
              placeholder="••••••••"
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={props.onTogglePassword}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isMobile ? "text-white/60 hover:text-white" : "text-muted-foreground/60 hover:text-foreground"}`}
              tabIndex={-1}
              aria-label={props.showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {props.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={props.rememberMe}
              onChange={(e) => props.onRememberChange(e.target.checked)}
              className={isMobile
                ? "w-4 h-4 rounded border-white/30 bg-white/10 text-primary focus:ring-white/30 accent-white"
                : "w-4 h-4 rounded border-border/50 bg-muted/50 text-primary focus:ring-primary/50 accent-primary"}
            />
            <span className={isMobile ? "text-xs text-white/80" : "text-xs text-muted-foreground"}>Manter conectado</span>
          </label>
          <button
            type="button"
            onClick={props.onForgot}
            className={isMobile ? "text-xs text-white hover:text-white/80" : "text-xs text-primary hover:text-primary/80 transition-colors"}
          >
            Esqueci minha senha
          </button>
        </div>

        <Button
          type="submit"
          disabled={props.loading}
          className={isMobile
            ? "w-full h-12 rounded-xl text-sm font-semibold bg-white text-[#00358f] hover:bg-white/90 shadow-2xl shadow-black/30 group"
            : "w-full h-12 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all group"}
        >
          {props.loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Conectando…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Entrar
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </Button>

        <p className={isMobile ? "text-[11px] text-white/60 text-center pt-2" : "text-xs text-muted-foreground/70 text-center pt-2"}>
          Conexão segura. Sua privacidade em primeiro lugar.
        </p>
      </form>
    </>
  );
}

/* -------------------- Forgot password dialog -------------------- */

function ForgotPasswordDialog({
  open,
  onOpenChange,
  initialEmail,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail || "");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(initialEmail || "");
      setError("");
    }
  }, [open, initialEmail]);

  function validate(val: string): string {
    const v = val.trim().toLowerCase();
    if (!v) return "Informe seu e-mail Jotazo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Formato de e-mail inválido.";
    if (!v.endsWith("@jotazo.com")) return "Use um e-mail @jotazo.com para recuperar a senha.";
    return "";
  }

  function handleChange(val: string) {
    setEmail(val);
    if (error) setError(validate(val));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err = validate(email);
    if (err) {
      setError(err);
      return;
    }
    setSending(true);
    const msg = encodeURIComponent(
      `Olá! Preciso redefinir a senha do meu webmail Jotazo.\n\nE-mail: ${email.trim().toLowerCase()}\n\nPor favor, me ajudem com o processo de recuperação.`,
    );
    const waNumber = WHATSAPP.number.replace(/\D/g, "");
    window.open(`https://api.whatsapp.com/send?phone=${waNumber}&text=${msg}`, "_blank", "noopener,noreferrer");
    toast.info("Abrindo WhatsApp", { description: "Você será redirecionado para o suporte." });
    setSending(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recuperar senha</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Informe seu e-mail corporativo. Vamos abrir uma conversa no WhatsApp do nosso suporte para concluir a redefinição com segurança.
          </p>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="seunome@jotazo.com"
                className={`pl-10 h-11 rounded-xl bg-muted/50 border-border/50 ${error ? "border-red-500 focus:border-red-500" : "focus:border-primary/50"}`}
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={sending} className="bg-[#25D366] hover:bg-[#25D366]/90 text-white">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Falar com suporte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Mail Client -------------------- */

function MailClient({ accountEmail, onLogout }: { accountEmail: string; onLogout: () => void }) {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>("INBOX");
  const [messages, setMessages] = useState<ListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<ComposerDraft[]>(() => loadDrafts());
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  function openComposer(init?: Partial<ComposerDraft>) {
    const d = newDraft(init);
    setDrafts((list) => { const next = [d, ...list]; saveDrafts(next); return next; });
    setActiveDraftId(d.id);
  }
  function updateDraft(d: ComposerDraft) {
    setDrafts((list) => list.map((x) => x.id === d.id ? d : x));
  }
  function closeDraft(id: string) {
    setDrafts((list) => list.filter((x) => x.id !== id));
    if (activeDraftId === id) setActiveDraftId(null);
  }
  const activeDraft = drafts.find((d) => d.id === activeDraftId) || null;
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [inboxUnseen, setInboxUnseen] = useState(0);
  const [unseenByFolder, setUnseenByFolder] = useState<Record<string, number>>({});
  const [foldersOpen, setFoldersOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeView, setActiveView] = useState<"mail" | "contacts" | "settings">("mail");
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // Resizable column widths (desktop)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const v = Number(localStorage.getItem("wm:sidebarWidth"));
    return v >= 180 && v <= 480 ? v : 240;
  });
  const [listWidth, setListWidth] = useState<number>(() => {
    const v = Number(localStorage.getItem("wm:listWidth"));
    return v >= 280 && v <= 700 ? v : 380;
  });
  useEffect(() => { localStorage.setItem("wm:sidebarWidth", String(sidebarWidth)); }, [sidebarWidth]);
  useEffect(() => { localStorage.setItem("wm:listWidth", String(listWidth)); }, [listWidth]);

  function startResize(e: React.MouseEvent, target: "sidebar" | "list") {
    e.preventDefault();
    const startX = e.clientX;
    const startW = target === "sidebar" ? sidebarWidth : listWidth;
    const min = target === "sidebar" ? 180 : 280;
    const max = target === "sidebar" ? 480 : 700;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      const next = Math.min(max, Math.max(min, startW + (ev.clientX - startX)));
      if (target === "sidebar") setSidebarWidth(next); else setListWidth(next);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  useEffect(() => { loadFolders(); }, []);
  useEffect(() => { loadList(currentFolder); setSelectedUid(null); }, [currentFolder]);

  function switchFolder(path: string) {
    if (path === currentFolder) return;
    setSelectedUid(null);
    setCurrentFolder(path);
  }

  // Polling 30s for current folder
  useEffect(() => {
    const i = setInterval(() => loadList(currentFolder, true), 30000);
    return () => clearInterval(i);
  }, [currentFolder]);

  async function loadFolders() {
    try {
      const r = await webmailApi.folders();
      setFolders(r.folders);
      setUnseenByFolder(r.unseenByFolder || {});
      setInboxUnseen(r.inboxUnseen || 0);
    } catch (e: any) {
      if (e.message?.includes("unauthorized")) { clearSession(); location.reload(); return; }
      toast.error("Não foi possível carregar as pastas", { description: friendlyError(e) });
    }
  }

  async function loadList(folder: string, silent = false) {
    if (!silent) setLoadingList(true);
    try {
      const r = await webmailApi.list(folder, { limit: 50 });
      setMessages(r.messages);
      // Re-sync unseen counts after loading a folder
      loadFolders();
    } catch (e: any) {
      if (!silent) toast.error("Não foi possível carregar as mensagens", { description: friendlyError(e) });
    } finally {
      if (!silent) setLoadingList(false);
    }
  }

  async function doLogout() {
    try { await webmailApi.logout(); } catch {}
    clearSession();
    onLogout();
  }

  async function actOn(action: string, uids: number[], target?: string) {
    const labels = ACTION_LABELS[action];
    const tId = labels ? toast.loading(labels.loading) : undefined;
    try {
      await webmailApi.action({ folder: currentFolder, uids, action, target });
      setMessages((m) => m.filter((x) => !uids.includes(x.uid) || (action !== "delete" && action !== "move")));
      if (selectedUid && uids.includes(selectedUid)) setSelectedUid(null);
      loadFolders();
      if (labels && tId !== undefined) {
        const desc = uids.length > 1 ? `${uids.length} mensagens` : undefined;
        toast.success(labels.success, { id: tId, description: desc });
      } else if (tId !== undefined) {
        toast.dismiss(tId);
      }
    } catch (e: any) {
      if (tId !== undefined) toast.dismiss(tId);
      toast.error("Ação falhou", { description: friendlyError(e) });
    }
  }

  function bumpUnseen(folder: string, delta: number) {
    setUnseenByFolder((m) => ({ ...m, [folder]: Math.max(0, (m[folder] || 0) + delta) }));
    if (folder === "INBOX") setInboxUnseen((n) => Math.max(0, n + delta));
  }

  function selectMessage(uid: number) {
    setSelectedUid(uid);
    const msg = messages.find((m) => m.uid === uid);
    if (!msg || msg.flags.includes("\\Seen")) return;
    // Optimistic: mark as seen locally
    setMessages((list) =>
      list.map((m) => (m.uid === uid ? { ...m, flags: [...m.flags, "\\Seen"] } : m)),
    );
    bumpUnseen(currentFolder, -1);
    webmailApi.action({ folder: currentFolder, uids: [uid], action: "mark_read" })
      .then(() => loadFolders())
      .catch(() => {
        // Revert on failure
        setMessages((list) =>
          list.map((m) => (m.uid === uid ? { ...m, flags: m.flags.filter((f) => f !== "\\Seen") } : m)),
        );
        bumpUnseen(currentFolder, 1);
      });
  }

  async function toggleRead(uid: number, currentlyUnread: boolean) {
    const action = currentlyUnread ? "mark_read" : "mark_unread";
    // Optimistic flag update
    setMessages((list) =>
      list.map((m) => {
        if (m.uid !== uid) return m;
        const flags = currentlyUnread
          ? Array.from(new Set([...m.flags, "\\Seen"]))
          : m.flags.filter((f) => f !== "\\Seen");
        return { ...m, flags };
      }),
    );
    bumpUnseen(currentFolder, currentlyUnread ? -1 : 1);
    try {
      await webmailApi.action({ folder: currentFolder, uids: [uid], action });
      loadFolders();
    } catch (e: any) {
      // Revert
      setMessages((list) =>
        list.map((m) => {
          if (m.uid !== uid) return m;
          const flags = currentlyUnread
            ? m.flags.filter((f) => f !== "\\Seen")
            : Array.from(new Set([...m.flags, "\\Seen"]));
          return { ...m, flags };
        }),
      );
      bumpUnseen(currentFolder, currentlyUnread ? 1 : -1);
      toast.error("Não foi possível atualizar", { description: friendlyError(e) });
    }
  }

  const filteredMessages = useMemo(() => {
    let list = messages;
    if (unreadOnly) list = list.filter((m) => !m.flags.includes("\\Seen"));
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter((m) =>
      m.subject.toLowerCase().includes(q) ||
      fmtAddr(m.from).toLowerCase().includes(q),
    );
  }, [messages, query, unreadOnly]);

  const unreadCount = useMemo(() => {
    const server = unseenByFolder[currentFolder];
    if (typeof server === "number") return server;
    return messages.reduce((n, m) => n + (m.flags.includes("\\Seen") ? 0 : 1), 0);
  }, [messages, unseenByFolder, currentFolder]);
  const currentFolderLabel = useMemo(
    () => folderMeta(folders.find(f => f.path === currentFolder) || { path: currentFolder, name: currentFolder, specialUse: null }).label,
    [folders, currentFolder],
  );

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (e.key === "c") { openComposer(); }
      if (e.key === "/") { e.preventDefault(); document.getElementById("wm-search")?.focus(); }
      if (e.key === "r" && selectedUid) handleReply();
      if (e.key === "e" && selectedUid) actOn("delete", [selectedUid]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedUid]);

  async function handleReply() {
    if (!selectedUid) return;
    try {
      const m = await webmailApi.message(currentFolder, selectedUid);
      openComposer({
        to: m.from?.[0]?.address || "",
        subject: m.subject?.startsWith("Re:") ? m.subject : "Re: " + m.subject,
        inReplyTo: m.messageId,
        references: ([...(m.references || []), m.messageId].filter(Boolean) as string[]).join(" "),
        html: `<p></p><br><br><blockquote style="border-left:2px solid #ccc;padding-left:12px;color:#666">${m.html || m.text || ""}</blockquote>`,
      });
    } catch (e: any) { toast.error("Não foi possível responder", { description: friendlyError(e) }); }
  }

  return (
    <div
      className="h-[100dvh] flex flex-col lg:flex-row bg-background overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      {/* ===== DESKTOP LEFT RAIL (full height) ===== */}
      <nav
        className="hidden lg:flex shrink-0 flex-col items-center gap-1 py-3 text-white w-[72px]"
        style={{
          background: "linear-gradient(180deg, #001a4d 0%, #00358f 60%, #0a1e5c 100%)",
        }}
      >
        <div className="w-14 h-14 grid place-items-center shrink-0 mb-2">
          <img src={webmailRailLogo} alt="Jotazo" className="w-full h-full object-contain" />
        </div>
        <div className="h-px w-8 bg-white/15 my-1" />
        <RailBtn
          icon={Mail}
          label="Email"
          active={activeView === "mail"}
          onClick={() => setActiveView("mail")}
        />
        <RailBtn
          icon={Users}
          label="Contatos"
          active={activeView === "contacts"}
          onClick={() => setActiveView("contacts")}
        />
        <RailBtn
          icon={Settings}
          label="Config"
          active={activeView === "settings"}
          onClick={() => setActiveView("settings")}
        />
        <div className="mt-auto w-full flex justify-center">
          <RailBtn icon={LogOut} label="Sair" onClick={doLogout} />
        </div>
      </nav>

      {/* ===== RIGHT COLUMN (header + body) ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* Desktop top bar is split per-column (rendered inside body below) */}

      {/* ===== MOBILE APP HEADER ===== */}
      <header
        className="lg:hidden relative shrink-0 text-white"
        style={{
          background:
            "linear-gradient(135deg, #001a4d 0%, #00358f 60%, #0a1e5c 100%)",
        }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[hsl(220_90%_50%/0.5)] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-[hsl(25_95%_55%/0.3)] blur-3xl pointer-events-none" />
        <div className="relative px-4 pt-3 pb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setFoldersOpen(true)}
              className="w-10 h-10 grid place-items-center rounded-xl bg-white/10 backdrop-blur"
              aria-label="Pastas"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center min-w-0 flex-1 px-2">
              <img src={webmailMobileLogo} alt="Jotazo" className="h-7 w-auto object-contain mb-1" />
              <p className="text-base font-bold leading-tight truncate max-w-full">
                {activeView === "contacts"
                  ? "Contatos"
                  : activeView === "settings"
                    ? "Configurações"
                    : folderMeta(folders.find(f => f.path === currentFolder) || { path: currentFolder, name: currentFolder, specialUse: null }).label}
              </p>
              <p className="text-[11px] text-white/70 leading-tight truncate max-w-full">{accountEmail}</p>
            </div>
            <button
              onClick={() => { loadList(currentFolder); loadFolders(); }}
              className="w-10 h-10 grid place-items-center rounded-xl bg-white/10 backdrop-blur shrink-0"
              aria-label="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {activeView === "mail" && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                <Input
                  id="wm-search-mobile"
                  placeholder="Buscar nas mensagens…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-white/15 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                />
              </div>
              {inboxUnseen > 0 && currentFolder === "INBOX" && (
                <span className="text-xs bg-[hsl(25_95%_55%)] text-white rounded-full px-2 py-0.5 font-semibold shrink-0">{inboxUnseen} novos</span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop sidebar */}
        <aside
          className={`${activeView === "mail" ? "hidden lg:flex" : "hidden"} border-r shrink-0 flex-col relative`}
          style={{ width: isDesktop ? sidebarWidth : undefined }}
        >
          {/* Header row aligned with topbar */}
          <div className="h-14 border-b flex items-center gap-2 px-3 shrink-0">
            <span className="flex-1 truncate text-sm font-semibold text-center">Webmail Jotazo</span>
          </div>
          <div className="p-3 flex flex-col gap-1 flex-1 min-h-0">
          <Button onClick={() => openComposer()} className="mb-3 gap-2">
            <PenSquare className="w-4 h-4" /> Escrever
          </Button>
          <ScrollArea className="flex-1">
            {folders.length === 0 && <p className="text-xs text-muted-foreground">Carregando pastas…</p>}
            {folders.map((f) => {
              const meta = folderMeta(f);
              const Icon = meta.icon;
              const active = currentFolder === f.path;
              const showUnseen = f.specialUse === "\\Inbox" || f.name.toLowerCase() === "inbox";
              const folderUnseen = unseenByFolder[f.path] ?? (showUnseen ? inboxUnseen : 0);
              return (
                <button
                  key={f.path}
                  onClick={() => switchFolder(f.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition ${
                    active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{meta.label}</span>
                  {folderUnseen > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-2">{folderUnseen > 99 ? "99+" : folderUnseen}</span>
                  )}
                </button>
              );
            })}
          </ScrollArea>
          </div>
          {/* Resize handle */}
          <div
            onMouseDown={(e) => startResize(e, "sidebar")}
            className="hidden lg:block absolute top-0 right-0 h-full w-1.5 -mr-[3px] cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10"
            title="Arraste para redimensionar"
          />
        </aside>

        {/* Mobile folders sheet */}
        <Sheet open={foldersOpen} onOpenChange={setFoldersOpen}>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetHeader className="px-4 pt-6 pb-4 border-b shrink-0">
              <img src={jotazoBrasil5gLogo} alt="Jotazo Brasil 5G" className="h-16 w-auto object-contain mb-3" />
              <SheetTitle className="text-left">Pastas</SheetTitle>
            </SheetHeader>
            <div className="px-3 pt-4 shrink-0">
              <Button onClick={() => { openComposer(); setFoldersOpen(false); }} className="w-full gap-2">
                <PenSquare className="w-4 h-4" /> Escrever
              </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0 px-3 mt-3">
              <div className="space-y-1 pb-3">
                {folders.map((f) => {
                  const meta = folderMeta(f);
                  const Icon = meta.icon;
                  const active = currentFolder === f.path;
                  const showUnseen = f.specialUse === "\\Inbox" || f.name.toLowerCase() === "inbox";
                  const folderUnseen = unseenByFolder[f.path] ?? (showUnseen ? inboxUnseen : 0);
                  return (
                    <button
                      key={f.path}
                      onClick={() => { switchFolder(f.path); setFoldersOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition ${
                        active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{meta.label}</span>
                      {folderUnseen > 0 && (
                        <span className="text-xs bg-primary text-primary-foreground rounded-full px-2">{folderUnseen > 99 ? "99+" : folderUnseen}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="px-3 py-3 border-t shrink-0">
              <button
                onClick={() => { doLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Right column wrapper (desktop): topbar + list + reader */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Desktop top bar for right column */}
          <header className="hidden lg:grid grid-cols-[1fr_auto_1fr] h-14 border-b items-center gap-3 px-4 shrink-0">
            <div />
            {activeView === "mail" ? (
              <div className="w-[520px] relative justify-self-center">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="wm-search" placeholder="Buscar (pressione / )" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 h-9" />
              </div>
            ) : <div />}
            <div className="flex items-center gap-3 justify-self-end">
              <Button variant="ghost" size="sm" onClick={() => { loadList(currentFolder); loadFolders(); }} title="Atualizar">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 pl-2 pr-1 h-9 rounded-full border hover:bg-muted transition"
                    aria-label="Conta"
                  >
                    <span className="hidden xl:inline text-xs text-muted-foreground max-w-[200px] truncate">{accountEmail}</span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] font-semibold bg-[hsl(25_95%_55%)] text-white rounded-full px-1.5 min-w-[20px] h-5 grid place-items-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-semibold">
                      {(accountEmail?.[0] || "?").toUpperCase()}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate" title={accountEmail}>{accountEmail}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { loadList(currentFolder); loadFolders(); }}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveView("settings")}>
                    <Settings className="w-4 h-4 mr-2" /> Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={doLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden min-h-0">
        {activeView === "contacts" ? (
          <ContactsView onCompose={(to) => { openComposer({ to }); setActiveView("mail"); }} />
        ) : activeView === "settings" ? (
          <PlaceholderView view="settings" />
        ) : (
          <>
        {/* Message list */}
        <div
          className={`flex-1 lg:flex-none lg:border-r flex-col relative ${selectedUid ? "hidden lg:flex" : "flex"}`}
          style={{
            width: isDesktop ? listWidth : undefined,
            paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)",
          }}
        >
          {/* Resize handle */}
          <div
            onMouseDown={(e) => startResize(e, "list")}
            className="hidden lg:block absolute top-0 right-0 h-full w-1.5 -mr-[3px] cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10"
            title="Arraste para redimensionar"
          />
          <div className="hidden lg:flex items-center justify-between px-4 h-10 border-b shrink-0 bg-muted/30 gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">{currentFolderLabel}</span>
            <div className="flex items-center gap-2 shrink-0">
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold bg-[hsl(25_95%_55%)] text-white rounded-full px-2 py-0.5">
                  {unreadCount} {unreadCount === 1 ? "não lida" : "não lidas"}
                </span>
              )}
              <button
                type="button"
                onClick={() => setUnreadOnly((v) => !v)}
                title={unreadOnly ? "Mostrar todos" : "Mostrar só não lidos"}
                className={`flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 border transition ${
                  unreadOnly
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                <Filter className="w-3 h-3" />
                Não lidos
              </button>
            </div>
          </div>
          {/* Mobile filter chips */}
          <div className="lg:hidden px-3 pt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUnreadOnly(false)}
              className={`text-xs font-medium rounded-full px-3 py-1.5 border transition ${
                !unreadOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setUnreadOnly(true)}
              className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 border transition ${
                unreadOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border"
              }`}
            >
              Não lidas
              {unreadCount > 0 && (
                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${
                  unreadOnly ? "bg-white/25 text-primary-foreground" : "bg-[hsl(25_95%_55%)] text-white"
                }`}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>
          {loadingList ? (
            <div className="flex-1 grid place-items-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex-1 grid place-items-center text-muted-foreground text-sm p-8 text-center">
              Nenhuma mensagem
            </div>
          ) : (
            <ScrollArea className="flex-1">
              {/* Mobile: card list. Desktop: row list */}
              <div className="lg:hidden px-3 pt-3 space-y-2">
                {filteredMessages.map((m) => {
                  const unread = !m.flags.includes("\\Seen");
                  const fromName = fmtAddr(m.from) || "(sem remetente)";
                  const initial = (fromName[0] || "?").toUpperCase();
                  const IconMail = unread ? Mail : MailOpen;
                  return (
                    <div
                      key={m.uid}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectMessage(m.uid)}
                      onKeyDown={(e) => { if (e.key === "Enter") selectMessage(m.uid); }}
                      className={`w-full text-left rounded-2xl p-3 flex gap-3 border transition active:scale-[0.99] cursor-pointer ${
                        unread
                          ? "bg-card border-primary/15 shadow-sm"
                          : "bg-muted/30 border-transparent"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full grid place-items-center font-bold shrink-0 ${
                        unread ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleRead(m.uid, unread); }}
                            title={unread ? "Marcar como lido" : "Marcar como não lido"}
                            className={`shrink-0 grid place-items-center rounded-md p-1 -ml-1 transition ${
                              unread ? "text-[hsl(25_95%_55%)]" : "text-muted-foreground"
                            } hover:bg-muted`}
                          >
                            <IconMail className="w-4 h-4" />
                          </button>
                          <span className={`text-sm truncate flex-1 ${unread ? "font-semibold" : ""}`}>{fromName}</span>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[11px] text-muted-foreground">{fmtDate(m.date)}</span>
                            {unread && <span className="w-2 h-2 rounded-full bg-[hsl(25_95%_55%)]" />}
                          </div>
                        </div>
                        <div className={`text-sm truncate ${unread ? "font-medium" : "text-muted-foreground"}`}>
                          {m.subject || "(sem assunto)"}
                        </div>
                        {m.hasAttachments && (
                          <div className="flex items-center gap-2 mt-1">
                            <Paperclip className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden lg:block">
                {filteredMessages.map((m) => {
                  const unread = !m.flags.includes("\\Seen");
                  const active = selectedUid === m.uid;
                  const IconMail = unread ? Mail : MailOpen;
                  return (
                    <div
                      key={m.uid}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectMessage(m.uid)}
                      onKeyDown={(e) => { if (e.key === "Enter") selectMessage(m.uid); }}
                      className={`w-full text-left px-4 py-3 border-b transition hover:bg-muted/50 cursor-pointer ${
                        active ? "bg-primary/5 border-l-2 border-l-primary" : ""
                      } ${unread ? "bg-background" : "bg-muted/20"}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleRead(m.uid, unread); }}
                            title={unread ? "Marcar como lido" : "Marcar como não lido"}
                            className={`shrink-0 grid place-items-center rounded-md p-1 -ml-1 transition ${
                              unread ? "text-[hsl(25_95%_55%)]" : "text-muted-foreground"
                            } hover:bg-muted`}
                          >
                            <IconMail className="w-4 h-4" />
                          </button>
                          <span className={`text-sm truncate ${unread ? "font-semibold" : ""}`}>
                            {fmtAddr(m.from) || "(sem remetente)"}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span className="text-xs text-muted-foreground">{fmtDate(m.date)}</span>
                          {unread && <span className="w-2 h-2 rounded-full bg-[hsl(25_95%_55%)]" />}
                        </div>
                      </div>
                      <div className={`text-sm truncate pl-7 ${unread ? "font-medium" : "text-muted-foreground"}`}>
                        {m.subject || "(sem assunto)"}
                      </div>
                      {m.hasAttachments && <Paperclip className="w-3 h-3 inline text-muted-foreground mt-1 ml-7" />}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Reader: desktop inline, mobile fullscreen overlay */}
        <main
          className={`${selectedUid ? "fixed inset-0 z-40 bg-background flex" : "hidden"} lg:static lg:z-auto lg:flex lg:flex-1 lg:overflow-hidden`}
          style={selectedUid ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
        >
          {selectedUid ? (
            <MessageReader
              folder={currentFolder}
              uid={selectedUid}
              onClose={() => setSelectedUid(null)}
              onAction={actOn}
              onReply={handleReply}
              onForward={async () => {
                const m = await webmailApi.message(currentFolder, selectedUid);
                openComposer({
                  subject: m.subject?.startsWith("Fwd:") ? m.subject : "Fwd: " + m.subject,
                  html: `<p></p><br><br>--- Mensagem encaminhada ---<br>${m.html || m.text || ""}`,
                });
              }}
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-muted-foreground">
              <div className="text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Selecione uma mensagem para ler</p>
              </div>
            </div>
          )}
        </main>
          </>
        )}
          </div>
        </div>
      </div>

      {/* Mobile FAB — Compose */}
      {!selectedUid && (
        <button
          onClick={() => openComposer()}
          aria-label="Escrever e-mail"
          className="lg:hidden fixed right-4 z-30 w-14 h-14 rounded-full grid place-items-center text-white shadow-2xl shadow-[hsl(25_95%_55%/0.5)] active:scale-95 transition"
          style={{
            bottom: `calc(env(safe-area-inset-bottom) + 80px)`,
            background: "linear-gradient(135deg, hsl(25 95% 55%), hsl(20 95% 50%))",
          }}
        >
          <PenSquare className="w-6 h-6" />
        </button>
      )}

      {/* Mobile bottom tab bar */}
      {!selectedUid && (
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="grid grid-cols-4 h-16">
            <TabBtn
              icon={Inbox}
              label="Caixa"
              active={activeView === "mail" && currentFolder === "INBOX"}
              onClick={() => { setActiveView("mail"); switchFolder("INBOX"); }}
            />
            <TabBtn
              icon={Search}
              label="Buscar"
              active={false}
              onClick={() => {
                setActiveView("mail");
                setTimeout(() => document.getElementById("wm-search-mobile")?.focus(), 50);
              }}
            />
            <TabBtn
              icon={Menu}
              label="Pastas"
              active={foldersOpen}
              onClick={() => { setActiveView("mail"); setFoldersOpen(true); }}
            />
            <TabBtn
              icon={Users}
              label="Contatos"
              active={activeView === "contacts"}
              onClick={() => setActiveView("contacts")}
            />
          </div>
        </nav>
      )}

      <WebmailInstallBanner />

      {/* Composer drafts tabs + inline editor */}
      {drafts.length > 0 && (
        <div className="fixed bottom-0 right-0 z-40 flex items-end gap-1 px-2" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {drafts.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveDraftId(d.id === activeDraftId ? null : d.id)}
              className={`text-xs px-3 py-1.5 rounded-t-md border border-b-0 max-w-[200px] truncate flex items-center gap-2 ${d.id === activeDraftId ? "bg-background border-primary" : "bg-muted hover:bg-accent"}`}
              title={d.subject || "Sem assunto"}
            >
              <PenSquare className="w-3 h-3" />
              <span className="truncate">{d.subject || "Sem assunto"}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); if (confirm("Fechar este rascunho? Será salvo localmente.")) closeDraft(d.id); }}
                className="opacity-60 hover:opacity-100"
              >×</span>
            </button>
          ))}
        </div>
      )}
      {activeDraft && (
        <div className="fixed inset-0 lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[min(900px,95vw)] z-50 bg-background border-l shadow-2xl flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <ComposerInline
            key={activeDraft.id}
            draft={activeDraft}
            onChange={updateDraft}
            onClose={() => setActiveDraftId(null)}
            onSent={() => closeDraft(activeDraft.id)}
          />
        </div>
      )}
      </div>
    </div>
  );
}

function TabBtn({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 transition ${
        active ? "text-[hsl(25_95%_55%)]" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function RailBtn({
  icon: Icon, label, active, onClick,
}: { icon: any; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`group relative w-14 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition ${
        active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-[10px] font-medium leading-none truncate max-w-full">{label}</span>
      
    </button>
  );
}

function PlaceholderView({ view }: { view: "contacts" | "settings" }) {
  const cfg =
    view === "contacts"
      ? { icon: Users, title: "Contatos", desc: "Em breve: lista de contatos sincronizada com seu webmail." }
      : { icon: Settings, title: "Configurações", desc: "Em breve: assinatura, filtros, encaminhamento e preferências da conta." };
  const Icon = cfg.icon;
  return (
    <div className="flex-1 grid place-items-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl grid place-items-center bg-primary/10 text-primary">
          <Icon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">{cfg.title}</h2>
        <p className="text-sm text-muted-foreground">{cfg.desc}</p>
      </div>
    </div>
  );
}

/* -------------------- Reader -------------------- */

function MessageReader({ folder, uid, onClose, onAction, onReply, onForward }: {
  folder: string; uid: number; onClose: () => void;
  onAction: (action: string, uids: number[]) => void;
  onReply: () => void; onForward: () => void;
}) {
  const [msg, setMsg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true); setMsg(null);
    webmailApi.message(folder, uid)
      .then(setMsg)
      .catch((e) => toast.error("Não foi possível abrir a mensagem", { description: friendlyError(e) }))
      .finally(() => setLoading(false));
  }, [folder, uid]);

  const cleanHtml = useMemo(() => {
    if (!msg?.html) return null;
    return DOMPurify.sanitize(msg.html, { USE_PROFILES: { html: true }, ADD_ATTR: ["target"] });
  }, [msg]);

  if (loading) return <div className="h-full grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!msg) return null;

  return (
    <div className="h-full w-full flex-1 min-w-0 flex flex-col">
      <div className="border-b px-6 py-3 flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onReply}><Reply className="w-4 h-4 mr-1" />Responder</Button>
        <Button variant="ghost" size="sm" onClick={onForward}><Forward className="w-4 h-4 mr-1" />Encaminhar</Button>
        <Button variant="ghost" size="sm" onClick={() => onAction("delete", [uid])}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="w-full p-6">
          <h1 className="text-2xl font-bold mb-3">{msg.subject || "(sem assunto)"}</h1>
          <div className="flex items-start gap-3 mb-4 pb-4 border-b">
            <div className="w-10 h-10 rounded-full bg-primary/10 grid place-items-center text-primary font-bold shrink-0">
              {(fmtAddr(msg.from)[0] || "?").toUpperCase()}
            </div>
            <div className="flex-1 text-sm">
              <div className="font-semibold">{fmtAddr(msg.from)}</div>
              <div className="text-muted-foreground">Para: {fmtAddr(msg.to)}</div>
              {msg.cc?.length > 0 && <div className="text-muted-foreground">Cc: {fmtAddr(msg.cc)}</div>}
            </div>
            <div className="text-xs text-muted-foreground">{new Date(msg.date).toLocaleString("pt-BR")}</div>
          </div>
          {cleanHtml ? (
            <div className="prose prose-sm max-w-none webmail-content" dangerouslySetInnerHTML={{ __html: cleanHtml }} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm">{msg.text}</pre>
          )}
          {msg.attachments?.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="text-sm font-semibold mb-2">Anexos ({msg.attachments.length})</div>
              <div className="flex flex-wrap gap-2">
                {msg.attachments.map((a: any, i: number) => (
                  <a
                    key={i}
                    href={a.content ? `data:${a.contentType};base64,${a.content}` : "#"}
                    download={a.filename}
                    className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span>{a.filename}</span>
                    <span className="text-xs text-muted-foreground">({Math.round(a.size / 1024)} KB)</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

