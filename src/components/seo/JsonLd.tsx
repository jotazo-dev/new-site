import { Helmet } from "react-helmet-async";
import { useBaseUrl, useSiteSettings } from "@/hooks/useSiteSettings";

const DEFAULT_LOGO =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9d79e0ff-8db3-456b-bcec-5c1086ed70d5";

// Organization + LocalBusiness
export function OrganizationJsonLd() {
  const baseUrl = useBaseUrl();
  const settings = useSiteSettings();

  const phone = settings["whatsapp_number"] || settings["phone"] || "";
  const email = settings["contact_email"] || "";
  const instagram = settings["instagram_url"] || "";
  const facebook = settings["facebook_url"] || "";
  const youtube = settings["youtube_url"] || "";
  const linkedin = settings["linkedin_url"] || "";
  const tiktok = settings["tiktok_url"] || "";
  const logo = settings["logo_url"] || DEFAULT_LOGO;

  const street = settings["address_street"] || "";
  const city = settings["address_city"] || "Apiaí";
  const region = settings["address_region"] || "SP";
  const postal = settings["address_postal_code"] || "";

  const sameAs = [instagram, facebook, youtube, linkedin, tiktok].filter(Boolean);

  const areaServed = [
    "Apiaí",
    "Registro",
    "Pariquera-Açu",
    "Jacupiranga",
    "Cajati",
    "Cananéia",
    "Iguape",
    "Ilha Comprida",
    "Eldorado",
    "Sete Barras",
    "Juquiá",
    "Miracatu",
    "Ribeira",
    "Itapirapuã Paulista",
    "Barra do Chapéu",
    "Itaóca",
  ];

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "TelecommunicationsBusiness"],
    "@id": `${baseUrl}/#organization`,
    name: "Jotazo Telecom",
    legalName: "Jotazo Telecom",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: logo,
    },
    image: logo,
    description:
      "Provedor de internet fibra óptica, internet móvel 5G e TV por assinatura em Apiaí/SP e região do Vale do Ribeira.",
    priceRange: "$$",
    currenciesAccepted: "BRL",
    paymentAccepted: "Boleto, Pix, Cartão de Crédito, Débito Automático",
    address: {
      "@type": "PostalAddress",
      ...(street ? { streetAddress: street } : {}),
      addressLocality: city,
      addressRegion: region,
      ...(postal ? { postalCode: postal } : {}),
      addressCountry: "BR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -24.5103,
      longitude: -48.8439,
    },
    areaServed: areaServed.map((name) => ({
      "@type": "City",
      name,
      containedInPlace: { "@type": "State", name: "São Paulo" },
    })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "08:00",
        closes: "12:00",
      },
    ],
    sameAs,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços Jotazo Telecom",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Internet Fibra Óptica",
          url: `${baseUrl}/para-voce`,
        },
        {
          "@type": "OfferCatalog",
          name: "Internet Móvel 5G",
          url: `${baseUrl}/internet-movel`,
        },
        {
          "@type": "OfferCatalog",
          name: "TV por Assinatura e Streaming",
          url: `${baseUrl}/streaming`,
        },
        {
          "@type": "OfferCatalog",
          name: "Planos para Empresas",
          url: `${baseUrl}/para-empresas`,
        },
      ],
    },
  };

  if (phone) {
    schema.telephone = phone;
    schema.contactPoint = [
      {
        "@type": "ContactPoint",
        telephone: phone,
        contactType: "customer service",
        areaServed: "BR",
        availableLanguage: ["Portuguese"],
        contactOption: "TollFree",
      },
      {
        "@type": "ContactPoint",
        telephone: phone,
        contactType: "technical support",
        areaServed: "BR",
        availableLanguage: ["Portuguese"],
      },
    ];
  }
  if (email) schema.email = email;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

// WebSite (used on home — enables sitelinks search box in Google)
export function WebSiteJsonLd() {
  const baseUrl = useBaseUrl();

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "Jotazo Telecom",
    inLanguage: "pt-BR",
    publisher: { "@id": `${baseUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", ".answer-first"],
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Breadcrumb
interface BreadcrumbItem {
  name: string;
  href: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const baseUrl = useBaseUrl();

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${baseUrl}${item.href}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// FAQ Page
interface FAQItem {
  question: string;
  answer: string;
}

export function FAQPageJsonLd({ faqs }: { faqs: FAQItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Article
interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  datePublished: string;
  dateModified?: string;
}

export function ArticleJsonLd({ title, description, url, imageUrl, datePublished, dateModified }: ArticleJsonLdProps) {
  const baseUrl = useBaseUrl();
  const settings = useSiteSettings();
  const logo = settings["logo_url"] || DEFAULT_LOGO;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${baseUrl}${url}`,
    ...(imageUrl ? { image: imageUrl } : {}),
    datePublished,
    dateModified: dateModified || datePublished,
    author: { "@type": "Organization", name: "Jotazo Telecom", url: baseUrl },
    publisher: {
      "@type": "Organization",
      name: "Jotazo Telecom",
      logo: { "@type": "ImageObject", url: logo },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${baseUrl}${url}` },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// ItemList (e.g. plans listing)
interface ItemListEntry {
  name: string;
  url: string;
  priceCents?: number;
}

export function ItemListJsonLd({ name, items }: { name: string; items: ItemListEntry[] }) {
  const baseUrl = useBaseUrl();

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: `${baseUrl}${it.url}`,
      ...(typeof it.priceCents === "number"
        ? {
            offers: {
              "@type": "Offer",
              price: (it.priceCents / 100).toFixed(2),
              priceCurrency: "BRL",
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Product (used for individual plans)
interface ProductJsonLdProps {
  name: string;
  description: string;
  url: string;
  priceCents: number;
  category?: string;
  image?: string;
  brand?: string;
}

export function ProductJsonLd({ name, description, url, priceCents, category, image, brand = "Jotazo Telecom" }: ProductJsonLdProps) {
  const baseUrl = useBaseUrl();
  const settings = useSiteSettings();
  const logo = settings["logo_url"] || DEFAULT_LOGO;

  // priceValidUntil = today + 90 days
  const validUntil = new Date(Date.now() + 90 * 86400 * 1000).toISOString().split("T")[0];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url: `${baseUrl}${url}`,
    image: image || logo,
    ...(category ? { category } : {}),
    brand: { "@type": "Brand", name: brand },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}${url}`,
      priceCurrency: "BRL",
      price: (priceCents / 100).toFixed(2),
      priceValidUntil: validUntil,
      availability: "https://schema.org/InStock",
      seller: { "@id": `${baseUrl}/#organization` },
      areaServed: "BR",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Service (used on category landing pages)
interface ServiceJsonLdProps {
  name: string;
  description: string;
  serviceType: string;
  url: string;
  areaServed?: string[];
}

export function ServiceJsonLd({ name, description, serviceType, url, areaServed }: ServiceJsonLdProps) {
  const baseUrl = useBaseUrl();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType,
    url: `${baseUrl}${url}`,
    provider: { "@id": `${baseUrl}/#organization` },
    ...(areaServed && areaServed.length
      ? {
          areaServed: areaServed.map((n) => ({
            "@type": "City",
            name: n,
            containedInPlace: { "@type": "State", name: "São Paulo" },
          })),
        }
      : {}),
    audience: { "@type": "Audience", audienceType: "Consumidores e empresas" },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
