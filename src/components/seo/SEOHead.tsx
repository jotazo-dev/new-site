import { Helmet } from "react-helmet-async";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useBaseUrl } from "@/hooks/useSiteSettings";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  type?: string;
  ogImage?: string;
  noindex?: boolean;
}

const DEFAULT_OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9d79e0ff-8db3-456b-bcec-5c1086ed70d5";

const BRAND_SUFFIX = "Jotazo Telecom";

export function SEOHead({ title, description, path, type = "website", ogImage: ogImageProp, noindex = false }: SEOHeadProps) {
  const baseUrl = useBaseUrl();
  const { data: pageSEO } = usePageSEO(path);

  const effectiveTitle = pageSEO?.meta_title || title;
  const effectiveDescription = pageSEO?.meta_description || description;
  const ogImage = ogImageProp || pageSEO?.og_image || DEFAULT_OG_IMAGE;

  const url = `${baseUrl}${path}`;

  // Avoid duplicating the brand suffix if it's already in the title
  const alreadyHasBrand = effectiveTitle.toLowerCase().includes(BRAND_SUFFIX.toLowerCase());
  const fullTitle = path === "/" || alreadyHasBrand ? effectiveTitle : `${effectiveTitle} | ${BRAND_SUFFIX}`;

  const robotsContent = noindex
    ? "noindex, follow"
    : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

  return (
    <Helmet>
      <html lang="pt-BR" />
      <title>{fullTitle}</title>
      <meta name="description" content={effectiveDescription} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="pt-BR" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={effectiveDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:site_name" content="Jotazo Telecom" />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={effectiveDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
