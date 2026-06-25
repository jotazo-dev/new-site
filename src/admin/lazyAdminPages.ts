import { lazy } from "react";

// Centralized lazy admin imports with prefetch helpers.
// Each entry exposes the lazy component AND a `preload` function so that
// hovering a sidebar link can warm the chunk before the click happens.

type LazyEntry<T extends React.ComponentType<any>> = {
  Component: React.LazyExoticComponent<T>;
  preload: () => Promise<unknown>;
};

function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyEntry<T> {
  let promise: Promise<{ default: T }> | null = null;
  const load = () => (promise ??= factory());
  const Component = lazy(load);
  return { Component, preload: load };
}

export const AdminLayoutLazy = lazyWithPreload(() =>
  import("@/components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout }))
);
export const AdminRouteGuardLazy = lazyWithPreload(() =>
  import("@/components/admin/AdminRouteGuard").then((m) => ({ default: m.AdminRouteGuard }))
);

export const AdminDashboard = lazyWithPreload(() => import("@/pages/admin/AdminDashboard"));
export const AdminPainel = lazyWithPreload(() => import("@/pages/admin/AdminPainel"));
export const AdminCRM = lazyWithPreload(() => import("@/pages/admin/AdminCRM"));
export const AdminClientes = lazyWithPreload(() => import("@/pages/admin/AdminClientes"));
export const AdminNovoCliente = lazyWithPreload(() => import("@/pages/admin/AdminNovoCliente"));
export const AdminPlanos = lazyWithPreload(() => import("@/pages/admin/AdminPlanos"));
export const AdminAnalytics = lazyWithPreload(() => import("@/pages/admin/AdminAnalytics"));
export const AdminBlog = lazyWithPreload(() => import("@/pages/admin/AdminBlog"));
export const AdminAnuncios = lazyWithPreload(() => import("@/pages/admin/AdminAnuncios"));
export const AdminBannersTopo = lazyWithPreload(() => import("@/pages/admin/AdminBannersTopo"));
export const AdminPaginas = lazyWithPreload(() => import("@/pages/admin/AdminPaginas"));
export const AdminCobertura = lazyWithPreload(() => import("@/pages/admin/AdminCobertura"));
export const AdminUsuarios = lazyWithPreload(() => import("@/pages/admin/AdminUsuarios"));
export const AdminPerfil = lazyWithPreload(() => import("@/pages/admin/AdminPerfil"));
export const AdminGeofeed = lazyWithPreload(() => import("@/pages/admin/AdminGeofeed"));
export const AdminVagas = lazyWithPreload(() => import("@/pages/admin/AdminVagas"));
export const AdminCurriculos = lazyWithPreload(() => import("@/pages/admin/AdminCurriculos"));
export const AdminPersonalizacao = lazyWithPreload(() => import("@/pages/admin/AdminPersonalizacao"));
export const AdminConfiguracoes = lazyWithPreload(() => import("@/pages/admin/AdminConfiguracoes"));
export const AdminIntegracoes = lazyWithPreload(() => import("@/pages/admin/AdminIntegracoes"));
export const AdminInstagram = lazyWithPreload(() => import("@/pages/admin/AdminInstagram"));
export const AdminMarketing = lazyWithPreload(() => import("@/pages/admin/AdminMarketing"));
export const AdminEsim = lazyWithPreload(() => import("@/pages/admin/AdminEsim"));
export const AdminNovaLinha = lazyWithPreload(() => import("@/pages/admin/AdminNovaLinha"));
export const AdminMvnoAtivacoes = lazyWithPreload(() => import("@/pages/admin/AdminMvnoAtivacoes"));
export const AdminMvnoEmailTemplate = lazyWithPreload(() => import("@/pages/admin/AdminMvnoEmailTemplate"));
export const AdminPropostas = lazyWithPreload(() => import("@/pages/admin/AdminPropostas"));
export const AdminBancoDados = lazyWithPreload(() => import("@/pages/admin/AdminBancoDados"));
export const AdminCheckoutPedidos = lazyWithPreload(() => import("@/pages/admin/AdminCheckoutPedidos"));
export const AdminVendas = lazyWithPreload(() => import("@/pages/admin/AdminVendas"));
export const AdminMapeamentoPlanos = lazyWithPreload(() => import("@/pages/admin/AdminMapeamentoPlanos"));

// Map by URL path so the sidebar can preload by hover.
export const ADMIN_PAGE_PRELOAD: Record<string, () => Promise<unknown>> = {
  "/admin": AdminDashboard.preload,
  "/admin/vendas": AdminVendas.preload,
  "/admin/painel": AdminPainel.preload,
  "/admin/crm": AdminCRM.preload,
  "/admin/clientes": AdminClientes.preload,
  "/admin/planos": AdminPlanos.preload,
  "/admin/analytics": AdminAnalytics.preload,
  "/admin/blog": AdminBlog.preload,
  "/admin/anuncios": AdminAnuncios.preload,
  "/admin/banners-topo": AdminBannersTopo.preload,
  "/admin/paginas": AdminPaginas.preload,
  "/admin/cobertura": AdminCobertura.preload,
  "/admin/usuarios": AdminUsuarios.preload,
  "/admin/perfil": AdminPerfil.preload,
  "/admin/geofeed": AdminGeofeed.preload,
  "/admin/vagas": AdminVagas.preload,
  "/admin/curriculos": AdminCurriculos.preload,
  "/admin/personalizacao": AdminPersonalizacao.preload,
  "/admin/configuracoes": AdminConfiguracoes.preload,
  "/admin/integracoes": AdminIntegracoes.preload,
  "/admin/integracoes/rbx": AdminIntegracoes.preload,
  "/admin/integracoes/eai": AdminIntegracoes.preload,
  "/admin/integracoes/algar": AdminIntegracoes.preload,
  "/admin/instagram": AdminInstagram.preload,
  "/admin/marketing": AdminMarketing.preload,
  "/admin/mvno": AdminEsim.preload,
  "/admin/mvno/nova-linha": AdminNovaLinha.preload,
  "/admin/propostas": AdminPropostas.preload,
  "/admin/banco-dados": AdminBancoDados.preload,
  "/admin/planos-mapeamento": AdminMapeamentoPlanos.preload,
};
