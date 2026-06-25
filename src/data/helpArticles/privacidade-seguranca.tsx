import { HelpCallout } from "@/components/help/HelpCallout";
import type { HelpArticle } from "../helpCenter";

const UPDATED = "abril de 2026";

export const privacidadeSegurancaArticles: HelpArticle[] = [
  {
    slug: "proteger-wifi",
    title: "Como proteger sua rede Wi-Fi de invasores",
    description:
      "Configurações essenciais de segurança que muita gente negligencia.",
    keywords: ["wifi seguro", "senha forte", "proteção", "wpa"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <h2 id="senha">1. Use senha forte</h2>
        <p>
          Mínimo de <strong>12 caracteres</strong>, misturando maiúsculas, minúsculas, números e
          símbolos. Nunca use o nome do bairro, a data de nascimento ou nomes próprios.
        </p>

        <h2 id="wpa">2. Use WPA3 ou WPA2</h2>
        <p>
          No painel do roteador, verifique se a criptografia está em <strong>WPA3-Personal</strong>
          (mais moderna) ou <strong>WPA2-AES</strong>. Nunca use WEP ou "aberta".
        </p>

        <h2 id="ssid">3. Renomeie o SSID</h2>
        <p>
          Não deixe nomes que identifiquem a operadora ou o modelo do roteador (ex: "JOTAZO_2G").
          Isso ajuda invasores a buscarem vulnerabilidades específicas.
        </p>

        <h2 id="wps">4. Desative o WPS</h2>
        <p>
          O WPS (botão com PIN para conectar fácil) tem vulnerabilidades conhecidas. Desabilite no
          painel do roteador.
        </p>

        <h2 id="convidados">5. Crie rede de convidados</h2>
        <p>
          Para visitas e dispositivos IoT (lâmpadas, câmeras), use uma <strong>rede separada</strong>.
          Se um deles for comprometido, sua rede principal fica protegida.
        </p>

        <HelpCallout variant="success">
          Roteadores Jotazo já vêm com WPA2/WPA3, WPS desabilitado e rede de convidados pronta para
          ativar pelo app.
        </HelpCallout>
      </>
    ),
    related: [
      { categorySlug: "privacidade-seguranca", articleSlug: "trocar-senha-wifi" },
    ],
  },
  {
    slug: "trocar-senha-wifi",
    title: "Como trocar a senha do Wi-Fi pelo app/portal",
    description:
      "Troque sua senha em segundos sem precisar acessar o painel do roteador.",
    keywords: ["trocar senha", "wifi", "senha"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="app">Pelo app Jotazo</h2>
        <ol>
          <li>Abra o app e faça login;</li>
          <li>Vá em <strong>Wi-Fi → Alterar senha</strong>;</li>
          <li>Digite a nova senha (siga as recomendações de força);</li>
          <li>Confirme. Em alguns segundos, a nova senha está ativa.</li>
        </ol>

        <h2 id="portal">Pelo Portal do Cliente</h2>
        <ol>
          <li>Acesse o portal e faça login;</li>
          <li>Vá em <strong>Internet → Configurações Wi-Fi</strong>;</li>
          <li>Edite o SSID (nome da rede) e/ou senha;</li>
          <li>Salve e reconecte os dispositivos.</li>
        </ol>

        <HelpCallout variant="warning">
          Após trocar, todos os dispositivos serão desconectados e precisarão de nova senha.
          Tenha em mãos quem precisa se reconectar.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "golpes-phishing",
    title: "Como reconhecer golpes e phishing em nome da Jotazo",
    description:
      "Criminosos usam o nome de operadoras para enganar clientes. Saiba se proteger.",
    keywords: ["golpe", "phishing", "fraude"],
    updatedAt: UPDATED,
    popular: true,
    body: (
      <>
        <h2 id="sinais">Sinais de golpe</h2>
        <ul>
          <li>Mensagem com <strong>"última oportunidade"</strong> ou "vamos cortar seu serviço hoje";</li>
          <li>Link encurtado (bit.ly, tinyurl) pedindo dados;</li>
          <li>Pedido de senha do Wi-Fi, do banco ou código SMS;</li>
          <li>Boleto vindo por SMS ou e-mail não solicitado;</li>
          <li>Ligações pedindo confirmação de "instalador" sem agendamento prévio.</li>
        </ul>

        <h2 id="proteja-se">Como se proteger</h2>
        <HelpCallout variant="danger" title="Regras de ouro">
          <ul>
            <li>A Jotazo <strong>nunca</strong> pede senha por telefone, e-mail ou WhatsApp;</li>
            <li>A Jotazo <strong>nunca</strong> pede pagamento por Pix avulso ou em CPF de terceiros;</li>
            <li>O número oficial da Jotazo é <strong>(11) 92004-7488</strong> e o 0800 é <strong>0800 721 0179</strong>;</li>
            <li>Boletos legítimos vêm com nosso CNPJ.</li>
          </ul>
        </HelpCallout>

        <h2 id="suspeita">Suspeitou? O que fazer</h2>
        <ol>
          <li>Não clique em links nem responda;</li>
          <li>Tire print da mensagem;</li>
          <li>Encaminhe para nosso WhatsApp oficial perguntando se é verdade;</li>
          <li>Bloqueie o número.</li>
        </ol>
      </>
    ),
  },
  {
    slug: "lgpd-direitos",
    title: "LGPD: seus direitos como titular de dados",
    description:
      "Os 9 direitos garantidos pela Lei Geral de Proteção de Dados e como exercê-los na Jotazo.",
    keywords: ["lgpd", "direitos", "dpo", "privacidade"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          A LGPD (Lei nº 13.709/2018) garante a você o controle sobre seus dados pessoais.
          Conheça seus direitos e como exercê-los.
        </p>

        <h2 id="direitos">Seus 9 direitos</h2>
        <ul>
          <li>Confirmação da existência de tratamento;</li>
          <li>Acesso aos dados que temos sobre você;</li>
          <li>Correção de dados incompletos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>Portabilidade a outro fornecedor;</li>
          <li>Eliminação de dados tratados com base em consentimento;</li>
          <li>Informação sobre com quem compartilhamos;</li>
          <li>Revogação do consentimento;</li>
          <li>Revisão de decisões automatizadas.</li>
        </ul>

        <h2 id="como">Como exercer</h2>
        <p>
          Envie sua solicitação para nosso Encarregado:
          <strong> contato@jotazo.com</strong> ou pelo WhatsApp <strong>0800 721 0179</strong>.
          Respondemos em até 15 dias.
        </p>

        <HelpCallout variant="info">
          Veja a <a href="/privacidade">Política de Privacidade completa</a> com todos os
          detalhes sobre coleta, finalidades e retenção de dados.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "reclamar-anatel",
    title: "Como abrir reclamação na Anatel",
    description:
      "Quando e como acionar a agência reguladora — geralmente acelera a resolução.",
    keywords: ["anatel", "reclamação", "1331"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="quando">Quando acionar</h2>
        <p>
          Acione a Anatel após esgotar nossos canais (atendimento + Ouvidoria). Se em 5 dias úteis
          o problema não foi resolvido, é hora de registrar.
        </p>

        <h2 id="canais">Canais oficiais</h2>
        <ul>
          <li><strong>Telefone:</strong> 1331 (telefonia em geral) ou 1332 (acessibilidade);</li>
          <li><strong>App Anatel Consumidor</strong> (Android e iOS);</li>
          <li><strong>Site:</strong> <a href="https://www.gov.br/anatel" target="_blank" rel="noreferrer">gov.br/anatel</a>;</li>
          <li><strong>Carta:</strong> Setor Bancário Sul, Quadra 02, Bloco H, Brasília/DF.</li>
        </ul>

        <h2 id="prazo">Prazo de resposta</h2>
        <p>
          Após o registro, temos <strong>até 5 dias úteis</strong> para resposta. Em casos
          complexos, pode ser estendido para 10 dias com justificativa.
        </p>

        <HelpCallout variant="tip">
          Tenha em mãos seu CPF, número de protocolo do nosso atendimento e descrição clara do
          problema. Isso acelera a análise.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "ouvidoria",
    title: "Ouvidoria Jotazo: quando acionar",
    description:
      "A Ouvidoria é a última instância interna de recurso, antes da Anatel ou do Procon.",
    keywords: ["ouvidoria", "recurso", "reclamação"],
    updatedAt: UPDATED,
    body: (
      <>
        <h2 id="diferenca">Atendimento vs Ouvidoria</h2>
        <p>
          O <strong>Atendimento</strong> é a primeira linha (suporte técnico e comercial). A
          <strong> Ouvidoria</strong> é uma instância independente que revisa casos não
          resolvidos. Ela funciona como auditoria interna.
        </p>

        <h2 id="quando">Quando acionar</h2>
        <ul>
          <li>O problema não foi resolvido após reclamação inicial;</li>
          <li>Você não concorda com a resposta recebida;</li>
          <li>Há descumprimento de prazo prometido;</li>
          <li>Cobrança indevida não estornada.</li>
        </ul>

        <h2 id="como">Como acionar</h2>
        <p>
          Acesse <a href="/ouvidoria">jotazo.com.br/ouvidoria</a> e preencha o formulário.
          Resposta em até <strong>10 dias úteis</strong>.
        </p>

        <HelpCallout variant="info">
          Tenha sempre o número de protocolo do atendimento original. Sem ele, o caso volta para
          a primeira linha.
        </HelpCallout>
      </>
    ),
  },
  {
    slug: "neutralidade-rede",
    title: "Neutralidade de rede: o que significa para você",
    description:
      "Princípio que garante que todo tráfego seja tratado igualmente — sem privilégios.",
    keywords: ["neutralidade", "marco civil", "tráfego"],
    updatedAt: UPDATED,
    body: (
      <>
        <p>
          O Marco Civil da Internet (Lei 12.965/2014) determina que provedores tratem todo o
          tráfego de forma <strong>isonômica</strong>. Isso significa que não privilegiamos um
          serviço em detrimento de outro.
        </p>

        <h2 id="o-que-nao-fazemos">O que NÃO fazemos</h2>
        <ul>
          <li>Não bloqueamos serviços específicos (WhatsApp, YouTube, jogos, VPNs);</li>
          <li>Não cobramos a mais por usar streamings ou serviços de terceiros;</li>
          <li>Não reduzimos a velocidade de protocolos específicos;</li>
          <li>Não vendemos dados de navegação a terceiros para publicidade.</li>
        </ul>

        <h2 id="excecoes">Exceções legais</h2>
        <p>
          Existem exceções técnicas previstas em lei, como gerenciamento para evitar congestão e
          garantia de serviços de emergência. Sempre comunicadas com transparência.
        </p>

        <HelpCallout variant="success">
          Você pode usar qualquer serviço, qualquer hora, da forma que quiser, dentro do plano
          contratado. É o seu direito como consumidor.
        </HelpCallout>
      </>
    ),
  },
];
