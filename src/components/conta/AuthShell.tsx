import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import logo from "@/assets/logo-agenda-login.png";

export function AuthShell({
  title,
  subtitle,
  children,
  pageTitle,
  bgImage,
  bgImageSecondary,
  activeSecondary,
  brandingTitle,
  brandingSubtitle,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  pageTitle: string;
  bgImage?: string;
  bgImageSecondary?: string;
  activeSecondary?: boolean;
  brandingTitle?: React.ReactNode;
  brandingSubtitle?: React.ReactNode;
}) {
  const hasImage = !!bgImage || !!bgImageSecondary;
  const showSecondary = activeSecondary && !!bgImageSecondary;

  return (
    <>
      <Helmet>
        <title>{pageTitle} — Jotazo</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left - brand panel (sticky on desktop so right column scroll doesn't stretch it) */}
        <div
          className={`relative flex-1 overflow-hidden flex min-h-[280px] sm:min-h-[360px] lg:min-h-screen lg:h-screen lg:sticky lg:top-0 p-6 sm:p-10 lg:p-16 items-end justify-start ${
            hasImage ? "" : "bg-gradient-to-br from-primary via-primary/90 to-accent items-center justify-center"
          }`}
        >
          {/* Background layers with smooth cross-fade */}
          {bgImage && (
            <div
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out ${
                showSecondary ? "opacity-0" : "opacity-100"
              }`}
              style={{ backgroundImage: `url(${bgImage})` }}
            />
          )}
          {bgImageSecondary && (
            <div
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out ${
                showSecondary ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url(${bgImageSecondary})` }}
            />
          )}

          {/* Dark overlay for text contrast (image variant) — stronger on mobile */}
          {hasImage && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25 lg:from-black/75 lg:via-black/40 lg:to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-tl from-primary/30 to-transparent" />
            </>
          )}
          {/* Decorative glows */}
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="relative max-w-md text-primary-foreground">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight drop-shadow-lg">
              {brandingTitle ?? "Sua conta Jotazo, internet e serviços em um só lugar."}
            </h1>
            <p className="mt-3 sm:mt-4 lg:mt-6 text-sm sm:text-base md:text-lg text-primary-foreground/90 drop-shadow-md">
              {brandingSubtitle ?? "Acompanhe pedidos, faturas, suporte e ofertas exclusivas para clientes."}
            </p>
          </div>
        </div>

        {/* Right - form panel */}
        <div className="flex-1 bg-background flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <Link to="/" className="inline-block mb-8">
              <img src={logo} alt="Jotazo" className="h-20 md:h-24 w-auto" />
            </Link>
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{title}</h2>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
