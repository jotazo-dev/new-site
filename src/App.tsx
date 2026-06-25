import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/cart/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import { CustomerAuthProvider } from "@/hooks/useCustomerAuth";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ContaLayout } from "@/components/conta/ContaLayout";
const ContaLogin = lazy(() => import("@/pages/conta/ContaLogin"));
const ContaCadastro = lazy(() => import("@/pages/conta/ContaCadastro"));
const ContaEsqueciSenha = lazy(() => import("@/pages/conta/ContaEsqueciSenha"));
const ContaResetPassword = lazy(() => import("@/pages/conta/ContaResetPassword"));
const ContaHome = lazy(() => import("@/pages/conta/ContaHome"));
const ContaPerfil = lazy(() => import("@/pages/conta/ContaPerfil"));
const ContaPedidos = lazy(() => import("@/pages/conta/ContaPedidos"));
const ContaPedidoDetalhe = lazy(() => import("@/pages/conta/ContaPedidoDetalhe"));
const ContaFaturas = lazy(() => import("@/pages/conta/ContaFaturas"));
const PainelLayout = lazy(() => import("@/components/conta/painel/PainelLayout").then(m => ({ default: m.PainelLayout })));
const PainelHome = lazy(() => import("@/pages/conta/painel/PainelHome"));
const PainelConexao = lazy(() => import("@/pages/conta/painel/PainelPlaceholder").then(m => ({ default: m.ConexaoPlaceholder })));
const PainelPlano = lazy(() => import("@/pages/conta/painel/PainelPlaceholder").then(m => ({ default: m.PlanoPlaceholder })));
const PainelSuporte = lazy(() => import("@/pages/conta/painel/PainelPlaceholder").then(m => ({ default: m.SuportePlaceholder })));
const PainelFaturas = lazy(() => import("@/pages/conta/painel/PainelFaturas"));
const PainelPedidos = lazy(() => import("@/pages/conta/painel/PainelPedidos"));
const PainelPedidoDetalhe = lazy(() => import("@/pages/conta/painel/PainelPedidoDetalhe"));
const PainelPerfil = lazy(() => import("@/pages/conta/painel/PainelPerfil"));

// Public pages — eager-loaded for the home, lazy for the rest
import HomePage from "@/pages/Home";
const PlanosPage = lazy(() => import("@/pages/Planos"));
const ParaVocePage = lazy(() => import("@/pages/ParaVoce"));
const ParaEmpresasPage = lazy(() => import("@/pages/ParaEmpresas"));
const CoberturaPage = lazy(() => import("@/pages/Cobertura"));
const CoberturaCidadePage = lazy(() => import("@/pages/CoberturaCidade"));
const AtendimentoPage = lazy(() => import("@/pages/Atendimento"));
const SobrePage = lazy(() => import("@/pages/Sobre"));
const TesteVelocidadePage = lazy(() => import("@/pages/TesteVelocidade"));
const InternetGamerPage = lazy(() => import("@/pages/InternetGamer"));
const BlogPage = lazy(() => import("@/pages/Blog"));
const BlogPostPage = lazy(() => import("@/pages/BlogPost"));
const TransparenciaRedePage = lazy(() => import("@/pages/TransparenciaRede"));
const MonteSeuComboPage = lazy(() => import("@/pages/MonteSeuCombo"));
const PersonalizeSeuComboPage = lazy(() => import("@/pages/PersonalizeSeuCombo"));
const MeuComboPage = lazy(() => import("@/pages/MeuCombo"));
const CheckoutV2Page = lazy(() => import("@/pages/CheckoutV2"));
const CheckoutV2SucessoPage = lazy(() => import("@/pages/CheckoutV2Sucesso"));
const StreamingPage = lazy(() => import("@/pages/Streaming"));
const InternetMovelPage = lazy(() => import("@/pages/InternetMovel"));
const OuvidoriaPage = lazy(() => import("@/pages/Ouvidoria"));
const TrabalheConoscoPage = lazy(() => import("@/pages/TrabalheConosco"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PlanosChipPage = lazy(() => import("@/pages/PlanosChip"));
const PrivacidadePage = lazy(() => import("@/pages/Privacidade"));
const TermosPage = lazy(() => import("@/pages/Termos"));
const CookiesPage = lazy(() => import("@/pages/Cookies"));
const RegulamentoPage = lazy(() => import("@/pages/Regulamento"));
const HelpHomePage = lazy(() => import("@/pages/Ajuda/HelpHome"));
const HelpCategoryPage = lazy(() => import("@/pages/Ajuda/HelpCategory"));
const HelpArticlePage = lazy(() => import("@/pages/Ajuda/HelpArticle"));
const IndiquePage = lazy(() => import("@/pages/Indique"));
const BioPage = lazy(() => import("@/pages/Bio"));
const AgendaPage = lazy(() => import("@/pages/Agenda"));
const MinhaContaPage = lazy(() => import("@/pages/MinhaConta"));
const WebmailPage = lazy(() => import("@/pages/Webmail"));
const WebmailInstallPage = lazy(() => import("@/pages/WebmailInstall"));


// Admin shell + pages — centralized in lazyAdminPages with preload helpers
import {
  AdminLayoutLazy,
  AdminRouteGuardLazy,
  AdminDashboard,
  AdminPlanos,
  AdminPersonalizacao,
  AdminBlog,
  AdminAnuncios,
  AdminBannersTopo,
  AdminConfiguracoes,
  AdminIntegracoes,
  AdminCobertura,
  AdminPaginas,
  AdminUsuarios,
  AdminPerfil,
  AdminGeofeed,
  AdminAnalytics,
  AdminCRM,
  AdminClientes,
  AdminNovoCliente,
  AdminCurriculos,
  AdminVagas,
  AdminPainel,
  AdminInstagram,
  AdminMarketing,
  AdminEsim,
  AdminNovaLinha,
  AdminMvnoAtivacoes,
  AdminMvnoEmailTemplate,
  AdminPropostas,
  AdminBancoDados,
  AdminCheckoutPedidos,
  AdminVendas,
  AdminMapeamentoPlanos,
} from "@/admin/lazyAdminPages";
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — public CMS data rarely changes mid-session
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => <div className="min-h-screen" aria-hidden="true" />;

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <CustomerAuthProvider>
          <CartProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route element={<SiteLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/para-voce" element={<ParaVocePage />} />
                    <Route path="/para-empresas" element={<ParaEmpresasPage />} />
                    <Route path="/planos" element={<PlanosPage />} />
                    <Route path="/cobertura" element={<CoberturaPage />} />
                    <Route path="/cobertura/:cidade" element={<CoberturaCidadePage />} />
                    <Route path="/atendimento" element={<AtendimentoPage />} />
                    <Route path="/teste-de-velocidade" element={<TesteVelocidadePage />} />
                    <Route path="/internet-gamer" element={<InternetGamerPage />} />
                    <Route path="/sobre" element={<SobrePage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:slug" element={<BlogPostPage />} />
                    <Route path="/transparencia-rede" element={<TransparenciaRedePage />} />
                    <Route path="/monte-seu-combo" element={<MonteSeuComboPage />} />
                    <Route path="/personalize-seu-combo" element={<PersonalizeSeuComboPage />} />
                    <Route path="/meu-combo" element={<MeuComboPage />} />
                    <Route path="/checkoutv2" element={<CheckoutV2Page />} />
                    <Route path="/checkoutv2/sucesso/:orderId" element={<CheckoutV2SucessoPage />} />
                    <Route path="/streaming" element={<StreamingPage />} />
                    <Route path="/internet-movel" element={<InternetMovelPage />} />
                    <Route path="/ouvidoria" element={<OuvidoriaPage />} />
                    <Route path="/trabalhe-conosco" element={<TrabalheConoscoPage />} />
                    <Route path="/planos-chip" element={<PlanosChipPage />} />
                    <Route path="/privacidade" element={<PrivacidadePage />} />
                    <Route path="/termos" element={<TermosPage />} />
                    <Route path="/cookies" element={<CookiesPage />} />
                    <Route path="/regulamento" element={<RegulamentoPage />} />
                    <Route path="/ajuda" element={<HelpHomePage />} />
                    <Route path="/ajuda/:categoria" element={<HelpCategoryPage />} />
                    <Route path="/ajuda/:categoria/:artigo" element={<HelpArticlePage />} />
                    <Route path="/indique" element={<IndiquePage />} />
                  </Route>

                  {/* Standalone (sem header/footer) */}
                  <Route path="/bio" element={<BioPage />} />
                  <Route path="/agenda" element={<AgendaPage />} />
                  <Route path="/minhaconta" element={<MinhaContaPage />} />
                  <Route path="/minhaconta/" element={<MinhaContaPage />} />
                  <Route path="/webmail/install" element={<WebmailInstallPage />} />
                  <Route path="/webmail" element={<WebmailPage />} />
                  <Route path="/webmail/*" element={<WebmailPage />} />

                  {/* Conta do cliente (site) */}
                  <Route path="/conta/login" element={<ContaLogin />} />
                  <Route path="/conta/cadastro" element={<ContaCadastro />} />
                  <Route path="/conta/esqueci-senha" element={<ContaEsqueciSenha />} />
                  <Route path="/conta/reset-password" element={<ContaResetPassword />} />
                  <Route path="/conta" element={<ContaLayout />}>
                    <Route index element={<ContaHome />} />
                    <Route path="perfil" element={<ContaPerfil />} />
                    <Route path="pedidos" element={<ContaPedidos />} />
                    <Route path="pedidos/:id" element={<ContaPedidoDetalhe />} />
                    <Route path="faturas" element={<ContaFaturas />} />
                  </Route>

                  {/* Painel do cliente (novo) */}
                  <Route path="/conta/painel" element={<PainelLayout />}>
                    <Route index element={<PainelHome />} />
                    <Route path="faturas" element={<PainelFaturas />} />
                    <Route path="pedidos" element={<PainelPedidos />} />
                    <Route path="pedidos/:id" element={<PainelPedidoDetalhe />} />
                    <Route path="perfil" element={<PainelPerfil />} />
                    <Route path="conexao" element={<PainelConexao />} />
                    <Route path="plano" element={<PainelPlano />} />
                    <Route path="suporte" element={<PainelSuporte />} />
                  </Route>




                  {/* Admin */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminLayoutLazy.Component />}>
                    <Route index element={<AdminRouteGuardLazy.Component section="dashboard"><AdminDashboard.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="painel" element={<AdminRouteGuardLazy.Component section="painel"><AdminPainel.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="planos" element={<AdminRouteGuardLazy.Component section="planos"><AdminPlanos.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="planos-mapeamento" element={<AdminRouteGuardLazy.Component section="planos"><AdminMapeamentoPlanos.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="personalizacao" element={<AdminRouteGuardLazy.Component section="personalizacao"><AdminPersonalizacao.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="blog" element={<AdminRouteGuardLazy.Component section="blog"><AdminBlog.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="anuncios" element={<AdminRouteGuardLazy.Component section="anuncios"><AdminAnuncios.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="banners-topo" element={<AdminRouteGuardLazy.Component section="banners_topo"><AdminBannersTopo.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="paginas" element={<AdminRouteGuardLazy.Component section="paginas"><AdminPaginas.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="cobertura" element={<AdminRouteGuardLazy.Component section="cobertura"><AdminCobertura.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="usuarios" element={<AdminRouteGuardLazy.Component section="usuarios"><AdminUsuarios.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="perfil" element={<AdminPerfil.Component />} />
                    <Route path="geofeed" element={<AdminRouteGuardLazy.Component section="geofeed"><AdminGeofeed.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="analytics" element={<AdminRouteGuardLazy.Component section="analytics"><AdminAnalytics.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="crm" element={<AdminRouteGuardLazy.Component section="crm"><AdminCRM.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="clientes" element={<AdminRouteGuardLazy.Component section="clientes"><AdminClientes.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="pedido" element={<AdminRouteGuardLazy.Component section="clientes"><AdminNovoCliente.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="configuracoes" element={<AdminRouteGuardLazy.Component section="configuracoes"><AdminConfiguracoes.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="integracoes" element={<AdminRouteGuardLazy.Component section="configuracoes"><AdminIntegracoes.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="integracoes/rbx" element={<Navigate to="/admin/integracoes?tab=rbx" replace />} />
                    <Route path="integracoes/eai" element={<Navigate to="/admin/integracoes?tab=eai" replace />} />
                    <Route path="integracoes/algar" element={<Navigate to="/admin/integracoes?tab=algar" replace />} />
                    <Route path="curriculos" element={<AdminRouteGuardLazy.Component section="curriculos"><AdminCurriculos.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="vagas" element={<AdminRouteGuardLazy.Component section="vagas"><AdminVagas.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="instagram" element={<AdminRouteGuardLazy.Component section="instagram"><AdminInstagram.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="marketing" element={<AdminRouteGuardLazy.Component section="marketing"><AdminMarketing.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="mvno" element={<AdminRouteGuardLazy.Component section="esim"><AdminEsim.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="mvno/nova-linha" element={<AdminRouteGuardLazy.Component section="esim"><AdminNovaLinha.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="mvno/ativacoes" element={<AdminRouteGuardLazy.Component section="esim"><AdminMvnoAtivacoes.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="mvno/email-template" element={<AdminRouteGuardLazy.Component section="esim"><AdminMvnoEmailTemplate.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="esim" element={<Navigate to="/admin/mvno" replace />} />
                    <Route path="propostas" element={<AdminRouteGuardLazy.Component section="propostas"><AdminPropostas.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="banco-dados" element={<AdminRouteGuardLazy.Component section="banco_dados"><AdminBancoDados.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="checkout-pedidos" element={<AdminRouteGuardLazy.Component section="checkout_pedidos"><AdminCheckoutPedidos.Component /></AdminRouteGuardLazy.Component>} />
                    <Route path="vendas" element={<AdminRouteGuardLazy.Component section="vendas"><AdminVendas.Component /></AdminRouteGuardLazy.Component>} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
          </CustomerAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
