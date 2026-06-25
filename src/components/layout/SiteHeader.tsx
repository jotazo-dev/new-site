import { Link, useNavigate } from "react-router-dom";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Menu, Search, ShoppingCart, X, Wifi, Smartphone, Play, Layers, MapPin, Headphones, Building, Home, Briefcase, Gift, Users, ChevronRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { LINKS } from "@/config/site";
import { useCart } from "@/cart/CartContext";
import { CartDrawerBody } from "@/components/shop/CartDrawerBody";
import { CitySelector } from "@/components/layout/CitySelector";
import { CustomerAuthMenu } from "@/components/layout/CustomerAuthMenu";
import { useSiteSettingsLoaded } from "@/hooks/useSiteSettings";

import logoJotazoFallback from "@/assets/jotazo-telecom-logo-jotazo-tv.webp";

const topNavItems = [
  { to: "/", label: "Início", icon: Home },
  { to: "/para-empresas", label: "Para Empresas", icon: Briefcase },
  { to: "/indique", label: "Indique & Ganhe", icon: Gift },
  { to: "/trabalhe-conosco", label: "Trabalhe Conosco", icon: Users },
];

const bottomNavItems = [
  { to: "/para-voce", label: "Internet", icon: Wifi },
  { to: "/internet-movel", label: "Móvel 5G", icon: Smartphone },
  { to: "/streaming", label: "Streaming", icon: Play },
  { to: "/planos?tab=combos", label: "Combos", icon: Layers },
  { to: "/cobertura", label: "Cobertura", icon: MapPin },
  { to: "/atendimento", label: "Atendimento", icon: Headphones },
  { to: "/sobre", label: "Sobre nós", icon: Building },
];

type HeaderHoverStyle = "soft" | "pill_blue" | "pill_orange" | "underline" | "glow";

type HoverContext = { isWhite: boolean; isBlueOrange: boolean; isWhiteBlueHover: boolean };

function getHoverClasses(style: HeaderHoverStyle, ctx: HoverContext): string {
  const { isWhite, isBlueOrange, isWhiteBlueHover } = ctx;

  // soft = legacy behavior per theme
  if (style === "soft") {
    if (isWhiteBlueHover) return "text-foreground/70 hover:bg-primary hover:text-primary-foreground";
    if (isWhite) return "text-foreground/70 hover:bg-primary/5 hover:text-accent";
    if (isBlueOrange) return "text-white/95 hover:bg-white/15 hover:text-white";
    return "text-primary-foreground/85 hover:bg-white/5 hover:text-accent";
  }

  const base = isWhite
    ? "text-foreground/70"
    : isBlueOrange
      ? "text-white/95"
      : "text-primary-foreground/85";

  if (style === "pill_blue") {
    return cn(base, "hover:bg-primary hover:text-primary-foreground");
  }
  if (style === "pill_orange") {
    return cn(base, "hover:bg-accent hover:text-accent-foreground");
  }
  if (style === "underline") {
    return cn(
      base,
      "relative hover:text-accent after:absolute after:left-2 after:right-2 after:bottom-0.5 after:h-0.5 after:bg-accent after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100",
    );
  }
  if (style === "glow") {
    return cn(
      base,
      "hover:text-accent hover:bg-accent/5 hover:[text-shadow:0_0_12px_hsl(var(--accent)/0.6)]",
    );
  }
  return base;
}

function getActiveClasses(style: HeaderHoverStyle, ctx: HoverContext): string {
  const { isWhite, isBlueOrange, isWhiteBlueHover } = ctx;

  if (style === "soft") {
    if (isWhiteBlueHover) return "bg-primary text-primary-foreground";
    if (isBlueOrange) return "text-white";
    return "text-accent";
  }
  if (style === "pill_blue") return "bg-primary text-primary-foreground";
  if (style === "pill_orange") return "bg-accent text-accent-foreground";
  if (style === "underline") {
    return "text-accent after:scale-x-100";
  }
  if (style === "glow") {
    return "text-accent bg-accent/5 [text-shadow:0_0_12px_hsl(var(--accent)/0.6)]";
  }
  return "";
}

export function SiteHeader() {
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Animate cart badge when count increases
  const prevCountRef = React.useRef(count);
  const [bumpKey, setBumpKey] = React.useState(0);
  React.useEffect(() => {
    if (count > prevCountRef.current) {
      setBumpKey((k) => k + 1);
    }
    prevCountRef.current = count;
  }, [count]);

  React.useEffect(() => {
    const handler = () => setCartOpen(true);
    window.addEventListener("cart:open", handler);
    return () => window.removeEventListener("cart:open", handler);
  }, []);

  const { settings, isLoading: settingsLoading } = useSiteSettingsLoaded();

  const headerTheme = (settings["header_theme"] as "blue" | "white" | "blue_orange" | "white_blue_hover" | "black_chip") || "blue";
  const hoverStyle = (settings["header_hover_style"] as HeaderHoverStyle) || "soft";
  const customLogoUrl = settings["logo_header_url"] || null;
  const whiteLogoUrl = settings["logo_header_white_url"] || null;
  const logoFit = settings["logo_header_fit"] || "contain";
  const logoSize = settings["logo_header_size"] ? parseInt(settings["logo_header_size"]) : null;
  const mobileMenuLogoUrl = settings["logo_mobile_menu_url"] || null;
  const mobileMenuLogoFit = settings["logo_mobile_menu_fit"] || "contain";
  const mobileMenuLogoSize = settings["logo_mobile_menu_size"] ? parseInt(settings["logo_mobile_menu_size"]) : 44;

  const isBlackChip = headerTheme === "black_chip";
  const bcVariantRaw = settings["black_chip_variant"] as "pure" | "accent" | "neon" | "glow" | undefined;
  const bcVariant: "pure" | "accent" | "neon" = bcVariantRaw === "pure" || bcVariantRaw === "accent" ? bcVariantRaw : "neon";
  const bcShowBadge = (settings["black_chip_badge"] ?? "true") !== "false";
  const bcGlowBorder = (settings["black_chip_glow_border"] ?? "true") !== "false";

  // Header always renders immediately with fallback defaults — no loading gate.
  // Settings from Supabase will hydrate in background without blocking UI.

  const isWhiteBlueHover = headerTheme === "white_blue_hover";
  const isWhite = !isBlackChip && (headerTheme === "white" || isWhiteBlueHover);
  const isBlueOrange = !isBlackChip && headerTheme === "blue_orange";
  const logoSrc = (isWhite || isBlackChip)
    ? (whiteLogoUrl || customLogoUrl || logoJotazoFallback)
    : (customLogoUrl || logoJotazoFallback);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    navigate(query ? `/planos?q=${encodeURIComponent(query)}` : "/planos");
    setSearchOpen(false);
    setQ("");
  };

  const handleSearchToggle = () => {
    setSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return next;
    });
  };

  const handleMobileNav = (to: string) => {
    setMobileOpen(false);
    navigate(to);
  };

  const logoImg = (
    <img
      src={logoSrc}
      alt="Jotazo TV"
      className={logoSize ? "w-auto" : "h-10 w-auto sm:h-11 md:h-12"}
      style={{
        ...(logoSize ? { height: `${logoSize}px` } : {}),
        objectFit: (logoFit || "contain") as React.CSSProperties["objectFit"],
      }}
      loading="eager"
      decoding="async"
    />
  );

  return (
    <header
      className={cn("sticky top-0 z-50 w-full shadow-sm", isWhite ? "text-foreground" : "text-primary-foreground")}
      {...(isBlackChip ? { "data-bc": bcVariant } : {})}
    >
      <AnnouncementBar />

      {/* Barra superior: Logo + Menu principal + Ações */}
      <div
        className={cn(
          isBlackChip
            ? cn("bc-surface", bcGlowBorder && "bc-glow-border")
            : isWhite
              ? "bg-white border-b border-border"
              : "bg-[linear-gradient(90deg,hsl(var(--primary))_0%,hsl(218,90%,32%)_55%,hsl(218,80%,38%)_100%)]"
        )}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            {logoImg}
            {isBlackChip && bcShowBadge && (
              <span className="bc-badge hidden sm:inline-flex">Black</span>
            )}
          </Link>

          {/* Menu principal — desktop */}
          <nav className="hidden lg:flex items-center flex-1 justify-evenly min-w-0">
            {topNavItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={cn("px-2 xl:px-3 py-1.5 text-sm xl:text-[15px] font-medium transition-colors whitespace-nowrap rounded-md", getHoverClasses(hoverStyle, { isWhite, isBlueOrange, isWhiteBlueHover }))}
                activeClassName={getActiveClasses(hoverStyle, { isWhite, isBlueOrange, isWhiteBlueHover })}
                end={it.to === "/"}
              >
                {it.label}
              </NavLink>
            ))}
            <CitySelector variant="header" isWhite={isWhite} />
          </nav>

          {/* Ações */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {/* Hamburger — mobile only */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Abrir menu"
                  className={cn("lg:hidden rounded-full", isWhite ? "text-foreground hover:bg-primary/10 hover:text-primary" : "text-primary-foreground hover:bg-background/10 hover:text-primary-foreground")}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex h-full w-[min(85vw,340px)] flex-col p-0 gap-0 [&>button:last-of-type]:hidden">
                <SheetHeader className="relative px-5 pt-6 pb-4 bg-[linear-gradient(90deg,hsl(var(--primary))_0%,hsl(218,90%,32%)_100%)] rounded-b-2xl">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <Link to="/" onClick={() => setMobileOpen(false)} className="inline-block mr-8">
                    <img
                      src={mobileMenuLogoUrl || logoSrc}
                      alt="Jotazo TV"
                      className="w-auto"
                      style={{
                        height: `${mobileMenuLogoSize ?? 44}px`,
                        objectFit: (mobileMenuLogoFit || "contain") as React.CSSProperties["objectFit"],
                      }}
                      loading="eager"
                    />
                  </Link>
                  <SheetClose className="absolute right-4 top-5 rounded-full p-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Fechar</span>
                  </SheetClose>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto scrollbar-none">
                  {/* Seção principal */}
                  <div className="px-3 pt-3 pb-1">
                    <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Navegação
                    </span>
                  </div>
                  <nav className="flex flex-col gap-0.5 px-3 pb-2">
                    {topNavItems.map((it) => {
                      const IconComponent = it.icon;
                      return (
                        <button
                          key={it.to}
                          onClick={() => handleMobileNav(it.to)}
                          className="group text-left px-3 py-3 text-[15px] font-medium text-foreground rounded-xl hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center gap-3"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <IconComponent className="h-[18px] w-[18px]" />
                          </span>
                          <span className="flex-1">{it.label}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </button>
                      );
                    })}
                  </nav>

                  <div className="px-5 pb-2">
                    <CitySelector variant="menu" />
                  </div>

                  <div className="mx-5 h-px bg-border/50" />

                  {/* Seção de serviços */}
                  <div className="px-3 pt-3 pb-1">
                    <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Serviços
                    </span>
                  </div>
                  <nav className="flex flex-col gap-0.5 px-3 pb-3">
                    {bottomNavItems.map((it) => {
                      const IconComponent = it.icon;
                      return (
                        <button
                          key={it.to}
                          onClick={() => handleMobileNav(it.to)}
                          className="group text-left px-3 py-3 text-[15px] font-medium text-foreground rounded-xl hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center gap-3"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <IconComponent className="h-[18px] w-[18px]" />
                          </span>
                          <span className="flex-1">{it.label}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* CTAs fixos no rodapé */}
                <div className="border-t border-border/50 bg-muted/30 px-5 py-4 flex flex-col gap-2.5">
                  <Link to="/conta/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full h-12 rounded-xl border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-all">
                      Área do cliente
                    </Button>
                  </Link>
                  <Button
                    onClick={() => handleMobileNav("/planos")}
                    className="w-full h-12 rounded-xl bg-accent text-accent-foreground font-semibold hover:bg-accent/90 shadow-md"
                  >
                    Assine já
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden md:flex items-center gap-2">
              <Link to="/conta/login" className="hidden lg:block">
                <Button
                  className="group relative overflow-hidden rounded-full bg-primary text-primary-foreground transition-colors duration-[600ms] ease-[cubic-bezier(0.65,0,0.35,1)] hover:bg-primary hover:text-primary-foreground"
                >
                  <span
                    className="absolute inset-0 -translate-x-[110%] -skew-x-12 bg-accent transition-transform duration-[600ms] ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-x-0"
                    aria-hidden="true"
                  />
                  <span className="relative z-10">Área do cliente</span>
                </Button>
              </Link>
              <Link to="/planos">
                <Button
                  className="group relative overflow-hidden rounded-full bg-accent text-accent-foreground transition-colors duration-[600ms] ease-[cubic-bezier(0.65,0,0.35,1)] hover:bg-accent hover:text-primary-foreground"
                >
                  <span
                    className="absolute inset-0 -translate-x-[110%] -skew-x-12 bg-primary transition-transform duration-[600ms] ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-x-0"
                    aria-hidden="true"
                  />
                  <span className="relative z-10">Assine já</span>
                </Button>
              </Link>
            </div>

            <CustomerAuthMenu isWhite={isWhite} />

            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Abrir carrinho"
                  className={cn("relative rounded-full", isWhite ? "text-foreground hover:bg-primary/10 hover:text-primary" : "text-primary-foreground hover:bg-background/10 hover:text-primary-foreground")}
                >
                  <ShoppingCart />
                  {count > 0 ? (
                    <span
                      key={bumpKey}
                      className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground animate-cart-bump"
                    >
                      {count}
                    </span>
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex h-full w-[min(92vw,440px)] !max-w-none flex-col gap-0 border-l border-border/60 bg-gradient-to-b from-background to-muted/30 p-0">
                <SheetHeader className="border-b border-border/60 bg-card/80 px-5 py-4 backdrop-blur">
                  <SheetTitle className="flex items-center gap-2 text-base">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Seu carrinho
                  </SheetTitle>
                </SheetHeader>
                <CartDrawerBody onNavigate={() => setCartOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Barra inferior: Categorias + Busca */}
      <div className={cn(isBlackChip ? cn("bc-surface", bcGlowBorder && "bc-glow-border") : isWhite ? "bg-white border-b border-border text-foreground" : isBlueOrange ? "bg-accent text-white" : "bg-primary text-primary-foreground/95")}>
        <div className="mx-auto w-full max-w-7xl px-4">
          <nav className="flex items-center gap-1 py-2.5">
            <div className="flex flex-1 min-w-0 items-center justify-evenly overflow-x-auto scrollbar-none">
{bottomNavItems.map((it) => {
                const IconComponent = it.icon;
                return (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    className={cn("shrink-0 px-2 lg:px-3 xl:px-4 py-2 text-sm xl:text-[15px] font-semibold transition-colors whitespace-nowrap rounded-md flex items-center gap-2", getHoverClasses(hoverStyle, { isWhite, isBlueOrange, isWhiteBlueHover }))}
                    activeClassName={getActiveClasses(hoverStyle, { isWhite, isBlueOrange, isWhiteBlueHover })}
                  >
                    <IconComponent className="h-4 w-4" />
                    {it.label}
                  </NavLink>
                );
              })}
            </div>

            {/* Busca expandível com animação fluida */}
            <div className="flex items-center gap-1 shrink-0">
              <div
                  className={cn(
                    "px-1 transition-[width,opacity,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                    searchOpen ? "overflow-visible w-40 sm:w-52 max-w-[40vw] opacity-100 scale-100" : "overflow-hidden w-0 px-0 opacity-0 scale-95"
                  )}
                >
                  <form onSubmit={onSearchSubmit} className="flex items-center">
                  <Input
                    ref={searchInputRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar planos..."
                    className={cn("h-9 w-full !rounded-full px-4 text-sm text-foreground placeholder:text-muted-foreground shadow-sm backdrop-blur-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none", isWhite ? "border border-border bg-white focus-visible:border-2 focus-visible:border-accent" : "border-background/20 bg-background/95 focus-visible:border-2 focus-visible:border-accent")}
                    aria-label="Buscar planos"
                  />
                </form>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={searchOpen ? () => { setSearchOpen(false); setQ(""); } : handleSearchToggle}
                aria-label={searchOpen ? "Fechar busca" : "Abrir busca"}
                className={cn("rounded-full h-8 w-8 hover:text-accent", isWhite ? "text-foreground/70 hover:bg-primary/5" : isBlueOrange ? "text-white hover:bg-white/15" : "text-primary-foreground/85 hover:bg-background/10")}
              >
                {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
