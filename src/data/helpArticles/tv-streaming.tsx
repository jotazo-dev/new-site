import { HelpCallout } from "@/components/help/HelpCallout";
import type { HelpArticle } from "../helpCenter";

const UPDATED = "abril de 2026";

export const tvStreamingArticles: HelpArticle[] = [
  {
    slug: "como-funciona-iptv",
    title: "Como funciona a TV via IPTV/streaming",
    description:
      "Por que a Jotazo entrega TV pela internet em vez de antena ou cabo coaxial.",
    keywords: ["iptv", "streaming", "tv", "como funciona"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          A TV Jotazo é entregue por <strong>IPTV</strong> (TV sobre IP), o que significa que o
          sinal de cada canal trafega pela mesma rede de fibra que leva sua internet. Isso traz
          qualidade superior, mais funcionalidades e menos equipamentos em casa.
        </p>

        <h2 id="vantagens">Vantagens em relação à TV tradicional</h2>
        <ul>
          <li>Imagem em <strong>Full HD e 4K</strong> sem chuviscos;</li>
          <li>Funções modernas: pausar, voltar, gravar e timeshift;</li>
          <li>Multi-tela: assistir em vários dispositivos com a mesma assinatura;</li>
          <li>Apps de streaming integrados ao mesmo controle;</li>
          <li>Atualizações automáticas, sem precisar de técnico.</li>
        </ul>

        <h2 id="requisitos">Requisitos mínimos de internet</h2>
        <table>
          <thead>
            <tr><th>Qualidade</th><th>Largura de banda recomendada</th></tr>
          </thead>
          <tbody>
            <tr><td>HD</td><td>10 Mbps por dispositivo</td></tr>
            <tr><td>Full HD</td><td>15 Mbps por dispositivo</td></tr>
            <tr><td>4K UHD</td><td>25–50 Mbps por dispositivo</td></tr>
          </tbody>
        </table>

        <HelpCallout variant="info">
          Em planos Jotazo a partir de 100 Mega você assiste vários streams simultâneos sem
          comprometer a navegação.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "tv-streaming", articleSlug: "configurar-decodificador" },
      { categorySlug: "tv-streaming", articleSlug: "streamings-inclusos" },
    ],
  },
  {
    slug: "configurar-decodificador",
    title: "Configuração inicial do decodificador / app de TV",
    description:
      "Passo a passo para deixar sua TV funcionando em poucos minutos.",
    keywords: ["decodificador", "configurar", "tv box", "primeiro acesso"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <h2 id="conexoes">1. Conexões físicas</h2>
        <ol>
          <li>Conecte o decodificador na tomada;</li>
          <li>Ligue o cabo HDMI do decodificador na sua TV;</li>
          <li>Conecte o cabo de rede no decodificador (recomendado) ou conecte ao Wi-Fi;</li>
          <li>Ligue a TV e selecione a entrada HDMI correta.</li>
        </ol>

        <h2 id="ativacao">2. Ativação</h2>
        <ol>
          <li>O equipamento mostra um <strong>código de ativação</strong> na tela;</li>
          <li>Esse código já está vinculado à sua conta;</li>
          <li>Em poucos segundos a tela inicial é carregada;</li>
          <li>Pronto, sua TV já está disponível!</li>
        </ol>

        <h2 id="app">App de TV no celular ou Smart TV</h2>
        <p>
          Você também pode assistir TV pelo aplicativo Jotazo TV em smartphones, tablets, Smart
          TVs e dispositivos como Chromecast, Fire TV e Apple TV. Faça login com seu CPF e a
          senha do Portal do Cliente.
        </p>

        <HelpCallout variant="tip">
          Em Smart TVs, busque pelo app "Jotazo TV" na loja oficial da TV. Funciona em LG (webOS),
          Samsung (Tizen), Android TV e Roku.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "lista-canais",
    title: "Lista de canais por plano",
    description:
      "Veja quais canais estão inclusos em cada plano e como adicionar pacotes premium.",
    keywords: ["canais", "lista", "grade", "plano tv"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          A grade Jotazo é organizada em três pacotes principais. Cada plano contém todos os
          canais do anterior, mais os exclusivos.
        </p>

        <h2 id="essencial">Pacote Essencial</h2>
        <p>
          Inclui canais abertos em alta definição (Globo, Record, SBT, Band, RedeTV), notícias
          (GloboNews, CNN, BandNews), variedades, infantis e gastronomia. Ideal para o público
          que busca o básico com qualidade.
        </p>

        <h2 id="completo">Pacote Completo</h2>
        <p>
          Tudo do Essencial, mais canais de filmes (Telecine, Megapix), séries (FX, Universal),
          esportes (SporTV, ESPN, TNT Sports) e documentários (NatGeo, Discovery, History).
        </p>

        <h2 id="premium">Pacote Premium</h2>
        <p>
          Tudo do Completo, mais canais premium como <strong>HBO Max</strong>, <strong>Telecine
          Premium</strong>, <strong>Combate</strong> e canais 4K UHD.
        </p>

        <HelpCallout variant="info" title="Veja a grade completa">
          A lista atualizada e detalhada de canais está disponível no
          <a href="/streaming"> nosso catálogo de streaming</a>, com filtros por gênero e categoria.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "gravar-timeshift",
    title: "Como gravar programas e usar timeshift",
    description:
      "Não perca mais nada: aprenda a gravar, agendar e voltar programas ao vivo.",
    keywords: ["gravar", "timeshift", "ndvr", "gravação"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="gravar">Gravar um programa</h2>
        <ol>
          <li>Com o programa selecionado na grade, pressione o botão <strong>REC</strong> (vermelho) do controle;</li>
          <li>Escolha entre gravar apenas este episódio ou toda a temporada;</li>
          <li>As gravações ficam salvas em <strong>"Minhas Gravações"</strong> por até 30 dias.</li>
        </ol>

        <h2 id="agendar">Agendar gravação</h2>
        <p>
          Navegue pelo guia (EPG) com as setas, selecione o programa futuro e clique em
          <strong> Agendar Gravação</strong>. Você pode programar até 100 gravações simultâneas.
        </p>

        <h2 id="timeshift">Timeshift</h2>
        <p>
          Permite <strong>pausar a TV ao vivo</strong> e voltar até 2 horas no mesmo canal.
          Basta apertar PAUSE durante a transmissão. Útil quando o telefone toca no melhor
          momento.
        </p>

        <h2 id="catchup">Catch-up TV</h2>
        <p>
          Reveja programas dos últimos 7 dias direto no guia, sem precisar ter gravado. Disponível
          na maioria dos canais nacionais.
        </p>
      </>
    ),
  },
  {
    slug: "streamings-inclusos",
    title: "Streamings inclusos no plano de TV",
    description:
      "Saiba quais serviços de streaming acompanham os planos Jotazo e como ativar cada um.",
    keywords: ["netflix", "hbo", "globoplay", "paramount", "streaming"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <p>
          Dependendo do seu plano, você ganha acesso aos principais serviços de streaming sem
          custo adicional. Veja como ativar cada um.
        </p>

        <h2 id="ativar">Como ativar</h2>
        <ol>
          <li>Acesse o Portal do Cliente;</li>
          <li>Vá em <strong>Meus Serviços → Streaming</strong>;</li>
          <li>Clique em "Ativar" no streaming desejado;</li>
          <li>Você recebe um e-mail com o link de cadastro/ativação;</li>
          <li>Crie sua conta com o e-mail vinculado e comece a assistir.</li>
        </ol>

        <h2 id="quais">Streamings disponíveis</h2>
        <ul>
          <li><strong>Netflix</strong> — plano Básico ou Padrão, conforme combo;</li>
          <li><strong>HBO Max</strong> — plano Mobile, Padrão ou Premium;</li>
          <li><strong>Globoplay</strong> — Plus ou Premium;</li>
          <li><strong>Paramount+</strong> — Mensal;</li>
          <li><strong>Disney+</strong> — Mensal;</li>
          <li><strong>Deezer Premium</strong> — Música ilimitada.</li>
        </ul>

        <HelpCallout variant="warning" title="Perdi acesso a um streaming">
          Verifique se sua mensalidade está em dia. Streamings são suspensos automaticamente após
          30 dias de inadimplência, junto com os demais serviços.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "multi-tela",
    title: "Multi-tela: assistir em vários dispositivos",
    description:
      "Quantas telas simultâneas seu plano permite e como gerenciar dispositivos.",
    keywords: ["multi tela", "simultâneo", "dispositivos"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          A Jotazo TV permite assistir em até 4 dispositivos ao mesmo tempo, dependendo do plano:
        </p>
        <ul>
          <li><strong>Essencial:</strong> 2 telas simultâneas;</li>
          <li><strong>Completo:</strong> 3 telas simultâneas;</li>
          <li><strong>Premium:</strong> 4 telas simultâneas.</li>
        </ul>

        <h2 id="gerenciar">Gerenciar dispositivos</h2>
        <p>
          No Portal do Cliente, em <strong>TV → Dispositivos vinculados</strong>, você pode ver
          todos os aparelhos conectados, dar nomes (TV da Sala, Celular João etc.) e
          desconectar remotamente.
        </p>

        <HelpCallout variant="tip">
          Se um dispositivo for perdido ou roubado, desconecte-o imediatamente pelo portal para
          evitar uso indevido.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "controle-parental",
    title: "Controle parental: bloqueio por idade e PIN",
    description:
      "Proteja sua família configurando bloqueios por classificação etária e canais específicos.",
    keywords: ["controle parental", "pin", "criança", "bloqueio"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="ativar">Como ativar</h2>
        <ol>
          <li>No menu da TV, vá em <strong>Configurações → Controle Parental</strong>;</li>
          <li>Crie um <strong>PIN de 4 dígitos</strong>;</li>
          <li>Defina a classificação máxima permitida (L, 10, 12, 14, 16, 18);</li>
          <li>Marque canais específicos para sempre exigir PIN.</li>
        </ol>

        <h2 id="esqueci-pin">Esqueci meu PIN</h2>
        <p>
          Acesse o Portal do Cliente em <strong>TV → Controle Parental → Resetar PIN</strong>.
          Você define um novo PIN imediatamente.
        </p>

        <HelpCallout variant="warning" title="Lembre-se">
          O PIN é solicitado também ao acessar a opção "Compras" e gravações marcadas como
          impróprias. Não compartilhe com crianças.
        </HelpCallout>
      </>
    ),
  },
];
