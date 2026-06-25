import { Cookie } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";

const LAST_UPDATED = "25 de abril de 2026";

const sections: LegalSection[] = [
  {
    id: "o-que-sao",
    title: "O que são Cookies e Tecnologias Similares",
    content: (
      <>
        <p>
          <strong>Cookies</strong> são pequenos arquivos de texto armazenados no seu dispositivo
          (computador, celular, tablet) quando você visita um site. Eles permitem reconhecer o
          navegador, lembrar preferências e medir desempenho.
        </p>
        <p>Também utilizamos tecnologias similares:</p>
        <ul>
          <li><strong>Web beacons / pixels:</strong> imagens 1x1 que registram a visualização de páginas e e-mails;</li>
          <li><strong>Local Storage e Session Storage:</strong> armazenamento no próprio navegador;</li>
          <li><strong>SDKs de mensuração:</strong> em aplicativos móveis.</li>
        </ul>
        <p>
          Esta Política de Cookies complementa nossa <a href="/privacidade">Política de Privacidade</a>
          e está em conformidade com a LGPD e o Marco Civil da Internet.
        </p>
      </>
    ),
  },
  {
    id: "categorias",
    title: "Categorias de Cookies que Utilizamos",
    content: (
      <>
        <h3>1. Estritamente necessários (sempre ativos)</h3>
        <p>
          Indispensáveis ao funcionamento do site. Sem eles, recursos como login, carrinho de
          contratação e segurança não operam. <strong>Base legal:</strong> legítimo interesse e
          execução de contrato. Não exigem consentimento.
        </p>

        <h3>2. Funcionais</h3>
        <p>
          Memorizam preferências como idioma, região de cobertura informada e plano em
          configuração. Melhoram a experiência sem rastrear publicidade.
        </p>

        <h3>3. Desempenho e Analytics</h3>
        <p>
          Coletam estatísticas agregadas sobre páginas mais visitadas, origem do tráfego e tempo
          de permanência, para que possamos melhorar o site. Exemplos: Google Analytics 4, Hotjar.
        </p>

        <h3>4. Publicidade e Marketing</h3>
        <p>
          Permitem mensurar campanhas, exibir anúncios relevantes em outras plataformas e medir
          conversões. Exemplos: Meta Pixel (Facebook/Instagram), Google Ads, TikTok Pixel.
        </p>
      </>
    ),
  },
  {
    id: "lista-cookies",
    title: "Principais Cookies Utilizados",
    content: (
      <>
        <div className="not-prose overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-semibold">Cookie</th>
                <th className="p-3 font-semibold">Categoria</th>
                <th className="p-3 font-semibold">Finalidade</th>
                <th className="p-3 font-semibold">Retenção</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b">
                <td className="p-3 font-mono text-xs">jotazo_session</td>
                <td className="p-3">Necessário</td>
                <td className="p-3">Manter sessão e segurança</td>
                <td className="p-3">Sessão</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-mono text-xs">jotazo_cep</td>
                <td className="p-3">Funcional</td>
                <td className="p-3">Lembrar CEP de cobertura</td>
                <td className="p-3">30 dias</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-mono text-xs">jotazo_cart</td>
                <td className="p-3">Funcional</td>
                <td className="p-3">Plano em configuração</td>
                <td className="p-3">7 dias</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-mono text-xs">_ga, _ga_*</td>
                <td className="p-3">Analytics</td>
                <td className="p-3">Google Analytics 4</td>
                <td className="p-3">2 anos</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-mono text-xs">_fbp, fr</td>
                <td className="p-3">Publicidade</td>
                <td className="p-3">Meta Pixel</td>
                <td className="p-3">90 dias</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-mono text-xs">_gcl_au</td>
                <td className="p-3">Publicidade</td>
                <td className="p-3">Google Ads — atribuição</td>
                <td className="p-3">90 dias</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-xs">cookie_consent</td>
                <td className="p-3">Necessário</td>
                <td className="p-3">Registro do consentimento</td>
                <td className="p-3">12 meses</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs">
          Esta lista é representativa e pode ser atualizada conforme evolução do site. Cookies de
          terceiros são governados também pelas políticas de seus respectivos provedores.
        </p>
      </>
    ),
  },
  {
    id: "gerenciar",
    title: "Como Gerenciar suas Preferências",
    content: (
      <>
        <p>
          Você pode aceitar, recusar ou personalizar os cookies não essenciais a qualquer momento
          pelo banner de consentimento exibido na sua primeira visita ou no link
          <strong> "Configurações de Cookies"</strong> disponível neste site.
        </p>
        <p>
          Adicionalmente, é possível bloquear ou excluir cookies diretamente pelo navegador:
        </p>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/pt-BR/kb/protecao-aprimorada-contra-rastreamento-firefox-desktop" target="_blank" rel="noreferrer">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer">Apple Safari</a></li>
          <li><a href="https://support.microsoft.com/pt-br/microsoft-edge" target="_blank" rel="noreferrer">Microsoft Edge</a></li>
        </ul>
        <p>
          <strong>Atenção:</strong> bloquear cookies estritamente necessários pode comprometer
          funcionalidades essenciais do site, como o login no portal do cliente.
        </p>
      </>
    ),
  },
  {
    id: "do-not-track",
    title: "Sinais de Não Rastreamento (DNT)",
    content: (
      <p>
        Os navegadores oferecem o sinal "Do Not Track" (DNT). Como ainda não há um padrão global
        para interpretação desse sinal, a Jotazo prioriza a sua escolha registrada no nosso banner
        de consentimento, que prevalece sobre o DNT.
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "Atualizações desta Política",
    content: (
      <p>
        Esta Política poderá ser atualizada para refletir mudanças tecnológicas, regulatórias ou
        operacionais. A versão vigente é sempre a publicada nesta página, com a data de última
        atualização indicada no topo. Recomendamos consulta periódica.
      </p>
    ),
  },
  {
    id: "contato",
    title: "Contato",
    content: (
      <p>
        Em caso de dúvidas, entre em contato com nosso Encarregado (DPO):
        <strong> contato@jotazo.com</strong> ou pelo telefone/WhatsApp <strong>0800 721 0179</strong>. Para informações detalhadas sobre o tratamento dos
        dados coletados via cookies, consulte a <a href="/privacidade">Política de Privacidade</a>.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <>
      <SEOHead
        path="/cookies"
        title="Política de Cookies"
        description="Entenda quais cookies e tecnologias similares são utilizados pela Jotazo Telecom, suas finalidades, retenção e como você pode gerenciar suas preferências."
      />
      <LegalPageLayout
        icon={Cookie}
        eyebrow="Documento Legal"
        title="Política de Cookies"
        subtitle="Como utilizamos cookies, web beacons e tecnologias similares para garantir o funcionamento do site, melhorar a experiência e mensurar campanhas, sempre respeitando a LGPD e a sua privacidade."
        lastUpdated={LAST_UPDATED}
        sections={sections}
      />
    </>
  );
}
