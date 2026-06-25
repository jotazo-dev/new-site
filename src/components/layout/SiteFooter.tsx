import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BRAND } from "@/config/site";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

import logoJotazoFallback from "@/assets/jotazo-telecom-logo-jotazo.png";
import logoAnatel from "@/assets/jotazo-anatel.webp";
import logoAbrint from "@/assets/premio-abrint-teleco-2026.webp";

type FooterTheme = "white" | "blue" | "blue_orange" | "white_blue_hover" | "black_chip";

const footerLinks = {
  paraVoce: [
    { label: "Planos Fibra", to: "/planos?cat=fibra" },
    { label: "Planos Móvel 5G", href: "https://jotazo.com.br/internet-movel" },
    { label: "TV por Assinatura", to: "/planos?cat=tv" },
    { label: "Combos", to: "/planos?cat=combo" },
    { label: "Monte seu Combo", to: "/monte-seu-combo" },
    { label: "Cobertura", to: "/cobertura" },
    { label: "Indique e Ganhe", to: "/indique" },
  ],
  paraEmpresas: [
    { label: "Soluções Empresariais", to: "/para-empresas" },
    { label: "Internet Dedicada", to: "/para-empresas" },
    { label: "Link Corporativo", to: "/para-empresas" },
  ],
  atendimento: [
    { label: "Central de Ajuda", to: "/ajuda" },
    { label: "Fale Conosco", to: "/atendimento" },
    { label: "Material da Marca", href: "https://drive.google.com/drive/folders/1m_AWFGQC2XgWII4To9LHBWuDh_1gGPBY?usp=sharing" },
  ],
  institucional: [
    { label: "Sobre a Jotazo", to: "/sobre" },
    { label: "Trabalhe Conosco", to: "/trabalhe-conosco" },
    { label: "Transparência de Rede", to: "/transparencia-rede" },
    { label: "Ouvidoria", to: "/ouvidoria" },
    { label: "Contrato", href: "/docs/CONTRATO_JOTAZO.pdf" },
    { label: "Regulamento", to: "/regulamento" },
  ],
};

function getLinkClasses(theme: FooterTheme) {
  switch (theme) {
    case "blue":
      return "text-sm text-primary-foreground/75 transition-colors hover:text-accent";
    case "blue_orange":
      return "text-sm text-primary-foreground/75 transition-colors hover:text-accent";
    case "white_blue_hover":
      return "inline-block text-sm text-muted-foreground rounded-md px-2 py-1 -mx-2 transition-colors hover:text-accent";
    default:
      return "text-sm text-muted-foreground transition-colors hover:text-accent";
  }
}

function FooterLinkGroup({
  title,
  links,
  theme,
  customColor,
  customHover,
}: {
  title: string;
  links: { label: string; to?: string; href?: string }[];
  theme: FooterTheme;
  customColor?: string;
  customHover?: string;
}) {
  const isDark = theme === "blue" || theme === "blue_orange";
  const linkClasses = customColor ? "text-sm transition-colors" : getLinkClasses(theme);

  const handleEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (customHover) e.currentTarget.style.color = customHover;
  };
  const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (customColor) e.currentTarget.style.color = customColor;
  };
  const style = customColor ? { color: customColor } : undefined;

  return (
    <div>
      <h3 className={cn("text-sm font-semibold", isDark ? "text-white" : "text-foreground")}>{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.href ? (
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={linkClasses}
                style={style}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
              >
                {link.label}
              </a>
            ) : (
              <Link
                to={link.to!}
                className={linkClasses}
                style={style}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const settings = useSiteSettings();

  const theme = ((settings["footer_theme"] as FooterTheme) ||
    (typeof window !== "undefined" ? (localStorage.getItem("footer_theme_cache") as FooterTheme) : null) ||
    "white") as FooterTheme;

  const customLinkColor = (settings["footer_link_color"] as string) || undefined;
  const customLinkHover = (settings["footer_link_hover_color"] as string) || undefined;

  const isBlue = theme === "blue";
  const isBlueOrange = theme === "blue_orange";
  const isWhiteBlueHover = theme === "white_blue_hover";
  const isBlackChip = theme === "black_chip";
  const isDark = isBlue || isBlueOrange || isBlackChip;
  const bcVariantRaw = settings["black_chip_variant"] as "pure" | "accent" | "neon" | "glow" | undefined;
  const bcVariant: "pure" | "accent" | "neon" = bcVariantRaw === "pure" || bcVariantRaw === "accent" ? bcVariantRaw : "neon";

  const customLogoUrl = settings["logo_footer_url"] || null;
  const logoFit = settings["logo_footer_fit"] || "contain";
  const logoSize = settings["logo_footer_size"] ? parseInt(settings["logo_footer_size"]) : null;

  const logoSrc = customLogoUrl || logoJotazoFallback;

  const phone = settings.phone || "(85) 0000-0000";
  const email = settings.email || "atendimento@jotazo.com.br";
  const address = settings.address || "Fortaleza, Ceará";
  const rawHours = settings.hours || "Seg–Sex: 8h às 18h | Sáb: 8h às 12h";
  let hoursList: string[] = [];
  try {
    const parsed = JSON.parse(rawHours);
    if (Array.isArray(parsed)) hoursList = parsed.filter((s) => typeof s === "string" && s.trim());
  } catch {}
  if (hoursList.length === 0) hoursList = [rawHours];
  const cnpj = settings.cnpj || "00.000.000/0001-00";

  const socialLinks = [
    { icon: Facebook, href: settings.facebook_url || "#", label: "Facebook" },
    { icon: Instagram, href: settings.instagram_url || "#", label: "Instagram" },
  ];

  // Theme-driven classes
  const footerBg = isBlackChip ? "bc-surface" : isDark ? "bg-primary" : "bg-card";
  const footerBorder = isDark ? "" : "border-t";
  const descriptionColor = isDark ? "text-white/70" : "text-muted-foreground";
  const contactTextColor = isDark ? "text-white/80" : "text-muted-foreground";
  const iconColor = isDark ? "text-accent" : "text-primary";
  const separatorClass = isDark ? "bg-white/10" : "";
  const bottomWrapperBg = isBlueOrange ? "bg-accent text-white" : "";
  const copyrightColor = isBlueOrange
    ? "text-white/90"
    : isDark
    ? "text-primary-foreground/70"
    : "text-muted-foreground";
  const legalLinkClass = isBlueOrange
    ? "text-white/90 transition-colors hover:text-accent"
    : isDark
    ? "text-primary-foreground/75 transition-colors hover:text-accent"
    : isWhiteBlueHover
    ? "inline-block text-muted-foreground rounded-md px-2 py-0.5 -mx-1 transition-colors hover:text-accent"
    : "text-muted-foreground transition-colors hover:text-accent";

  const socialBtnClass = isBlueOrange
    ? "flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white transition-colors hover:bg-white hover:text-accent"
    : isDark
    ? "flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-primary-foreground transition-colors hover:bg-white hover:text-primary"
    : isWhiteBlueHover
    ? "flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-primary hover:border-primary hover:text-primary-foreground"
    : "flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary";

  return (
    <footer className={cn(footerBorder, footerBg)} {...(isBlackChip ? { "data-bc": bcVariant } : {})}>
      {/* Seção principal */}
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-4">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Logo e descrição */}
          <div className="sm:col-span-2">
            <img
              src={logoSrc}
              alt={BRAND.name}
              className="w-auto"
              style={{
                height: logoSize ? `${logoSize}px` : "4rem",
                objectFit: (logoFit || "contain") as React.CSSProperties["objectFit"],
              }}
              loading="lazy"
              decoding="async"
            />
            <p className={cn("mt-4 max-w-xs text-sm leading-relaxed", descriptionColor)}>
              Internet fibra óptica, móvel 5G e TV com a qualidade e o atendimento que você merece.
              Conectando você com velocidade de verdade.
            </p>

            {/* Contato rápido */}
            <div className="mt-6 space-y-3">
              <div className={cn("flex items-center gap-2.5 text-sm", contactTextColor)}>
                <Phone className={cn("h-4 w-4 shrink-0", iconColor)} />
                <span>{phone}</span>
              </div>
              <div className={cn("flex items-center gap-2.5 text-sm", contactTextColor)}>
                <Mail className={cn("h-4 w-4 shrink-0", iconColor)} />
                <span>{email}</span>
              </div>
              <div className={cn("flex items-center gap-2.5 text-sm", contactTextColor)}>
                <MapPin className={cn("h-4 w-4 shrink-0", iconColor)} />
                <span>{address}</span>
              </div>
              <div className={cn("flex items-start gap-2.5 text-sm", contactTextColor)}>
                <Clock className={cn("h-4 w-4 shrink-0 mt-0.5", iconColor)} />
                <div className="flex flex-col">
                  {hoursList.map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <FooterLinkGroup title="Para Você" links={footerLinks.paraVoce} theme={theme} customColor={customLinkColor} customHover={customLinkHover} />
          <FooterLinkGroup title="Para Empresas" links={footerLinks.paraEmpresas} theme={theme} customColor={customLinkColor} customHover={customLinkHover} />
          <FooterLinkGroup title="Atendimento" links={footerLinks.atendimento} theme={theme} customColor={customLinkColor} customHover={customLinkHover} />
          <div className="flex flex-col">
            <FooterLinkGroup title="Institucional" links={footerLinks.institucional} theme={theme} customColor={customLinkColor} customHover={customLinkHover} />
            <div className="mt-6 flex flex-col items-start gap-3">
              <img
                src={logoAnatel}
                alt="Anatel - Agência Nacional de Telecomunicações"
                className={cn("w-3/5 md:w-4/5 h-auto object-contain", isDark && "bg-white/95 rounded-md p-1.5")}
                loading="lazy"
                decoding="async"
              />
              <img
                src={logoAbrint}
                alt="Prêmio Abrint Teleco 2026 - 4ª Edição"
                className="w-3/5 md:w-4/5 h-auto object-contain rounded-2xl"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator className={separatorClass} />

      {/* Barra inferior */}
      <div className={bottomWrapperBg}>
        <div className="mx-auto max-w-7xl px-6 py-6 md:px-4">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            {/* Redes sociais */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className={socialBtnClass}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            {/* Copyright */}
            <p className={cn("text-center text-xs", copyrightColor)}>
              © {year} {BRAND.name}. Todos os direitos reservados. CNPJ: {cnpj}
            </p>

            {/* Links legais */}
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <Link to="/webmail" className={legalLinkClass}>Webmail</Link>
              <Link to="/privacidade" className={legalLinkClass}>Privacidade</Link>
              <Link to="/termos" className={legalLinkClass}>Termos</Link>
              <Link to="/cookies" className={legalLinkClass}>Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
