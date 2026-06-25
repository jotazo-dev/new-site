import { BookOpen } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";

const LAST_UPDATED = "25 de abril de 2026";

const sections: LegalSection[] = [
  {
    id: "objeto",
    title: "Objeto e Definições",
    content: (
      <>
        <p>
          Este Regulamento disciplina a prestação dos serviços de telecomunicações pela
          <strong> Jotazo Telecom</strong>, em observância à Lei Geral de Telecomunicações
          (Lei nº 9.472/1997), ao Regulamento de Proteção e Defesa dos Direitos dos Assinantes
          (<strong>Resolução Anatel nº 632/2014</strong>), ao Regulamento do Serviço de Comunicação
          Multimídia (<strong>Resolução Anatel nº 614/2013</strong>), à
          <strong> Resolução Anatel nº 574/2011</strong> (qualidade da banda larga fixa), ao
          <strong> Código de Defesa do Consumidor</strong> e à <strong>Lei do SAC</strong> (Decreto nº 11.034/2022).
        </p>
        <p>Para efeitos deste documento:</p>
        <ul>
          <li><strong>Assinante:</strong> pessoa física ou jurídica que contrata os serviços.</li>
          <li><strong>Velocidade contratada:</strong> taxa nominal de transmissão indicada no plano.</li>
          <li><strong>Velocidade instantânea:</strong> medição pontual.</li>
          <li><strong>Velocidade média:</strong> aferição mensal calculada conforme metodologia Anatel.</li>
          <li><strong>SCM:</strong> Serviço de Comunicação Multimídia (banda larga fixa).</li>
          <li><strong>SeAC:</strong> Serviço de Acesso Condicionado (TV por assinatura).</li>
        </ul>
      </>
    ),
  },
  {
    id: "modalidades",
    title: "Modalidades de Serviço",
    content: (
      <>
        <p>A Jotazo presta as seguintes modalidades:</p>
        <ul>
          <li><strong>Banda Larga Fixa (SCM)</strong> via fibra óptica FTTH/GPON, com velocidades simétricas e diferentes faixas comerciais.</li>
          <li><strong>Internet Móvel 5G</strong>, na qualidade de operadora MVNO autorizada.</li>
          <li><strong>TV por Assinatura (SeAC)</strong> via IPTV ou streaming, conforme plano.</li>
          <li><strong>Combos convergentes</strong> de internet, TV e telefonia.</li>
          <li><strong>Soluções corporativas</strong> com SLA dedicado, IP fixo e suporte prioritário.</li>
        </ul>
      </>
    ),
  },
  {
    id: "qualidade",
    title: "Padrões de Qualidade",
    content: (
      <>
        <p>Conforme a <strong>Resolução Anatel nº 574/2011</strong>, garantimos:</p>
        <ul>
          <li><strong>Velocidade instantânea:</strong> mínimo de <strong>40%</strong> da velocidade contratada;</li>
          <li><strong>Velocidade média mensal:</strong> mínimo de <strong>80%</strong> da velocidade contratada;</li>
          <li><strong>Latência mensal média:</strong> conforme parâmetros do plano;</li>
          <li><strong>Disponibilidade mensal:</strong> mínimo de <strong>95%</strong> para planos residenciais; SLA específico para planos corporativos.</li>
        </ul>
        <p>
          O Assinante pode aferir a velocidade pelo nosso <a href="/teste-de-velocidade">Teste de Velocidade</a>
          ou pela ferramenta oficial <strong>Brasil Banda Larga (Anatel)</strong>.
        </p>
      </>
    ),
  },
  {
    id: "instalacao",
    title: "Instalação e Ativação",
    content: (
      <>
        <p>
          Após contratação aprovada, a instalação será realizada em até <strong>7 (sete) dias úteis</strong>,
          conforme a Resolução 632/2014, salvo impedimento técnico ou de obra civil.
        </p>
        <ul>
          <li>O Assinante deve disponibilizar acesso ao imóvel e ponto de energia adequado.</li>
          <li>O equipamento (ONU/ONT, modem, decodificador) é cedido em <strong>comodato</strong> e deve ser devolvido em até 30 dias após o término do contrato.</li>
          <li>Danos causados por mau uso, surto elétrico não protegido ou violação do equipamento serão de responsabilidade do Assinante.</li>
        </ul>
      </>
    ),
  },
  {
    id: "reparo",
    title: "Suporte Técnico e Reparo",
    content: (
      <>
        <p>Atendimento técnico disponível 24h por telefone e chat. Os prazos máximos de reparo são:</p>
        <ul>
          <li><strong>Residencial:</strong> 24 horas a partir da abertura do chamado;</li>
          <li><strong>Corporativo:</strong> conforme SLA contratado (4h, 8h ou 12h).</li>
        </ul>
        <p>
          Em caso de indisponibilidade superior a 30 minutos contínuos, será concedido
          <strong> desconto proporcional</strong> na fatura, observada a regulamentação Anatel
          (art. 65 da Resolução 632/2014).
        </p>
      </>
    ),
  },
  {
    id: "fidelizacao",
    title: "Fidelização e Multa",
    content: (
      <>
        <p>
          Quando houver subsídio em equipamentos, instalação ou tarifa, o plano poderá prever
          fidelização de até <strong>12 meses</strong>. A rescisão antecipada implica multa
          calculada de forma <strong>proporcional ao período remanescente</strong>, conforme art. 57
          da Resolução 632/2014.
        </p>
        <p>
          Não há multa por rescisão sem fidelização vigente, mudança para localidade sem cobertura
          ou descumprimento contratual pela Jotazo (após confirmação por reclamação na Anatel).
        </p>
      </>
    ),
  },
  {
    id: "faturamento",
    title: "Faturamento e Pagamento",
    content: (
      <>
        <ul>
          <li>Cobrança mensal por boleto bancário, débito automático, cartão de crédito ou Pix.</li>
          <li>Vencimento conforme escolha do Assinante, dentre as datas disponíveis.</li>
          <li>Fatura detalhada disponível no portal do cliente em PDF e e-mail, com no mínimo 5 dias de antecedência.</li>
          <li>Atraso superior a <strong>30 dias</strong> autoriza suspensão parcial; após 75 dias, suspensão total e negativação.</li>
          <li>Encargos por atraso: <strong>juros de 1% ao mês</strong> e <strong>multa de 2%</strong> sobre o valor em aberto (CDC, art. 52).</li>
          <li>O Assinante pode contestar valores em até 90 dias a partir do vencimento (Resolução 632, art. 84).</li>
        </ul>
      </>
    ),
  },
  {
    id: "cancelamento",
    title: "Cancelamento",
    content: (
      <>
        <p>
          O cancelamento pode ser solicitado a qualquer tempo, gratuitamente, pelos canais oficiais
          (telefone, site, app, WhatsApp ou loja). A solicitação será efetivada em até
          <strong> 24 horas</strong> (Lei do SAC), com geração de <strong>número de protocolo</strong>.
        </p>
        <p>
          Não cobraremos por serviços após a solicitação. Eventual saldo credor será restituído em
          até 30 dias.
        </p>
      </>
    ),
  },
  {
    id: "direitos",
    title: "Direitos do Assinante",
    content: (
      <>
        <p>São garantidos ao Assinante, sem prejuízo de outros previstos em lei:</p>
        <ul>
          <li>Acesso ao serviço contratado, com qualidade conforme regulamento;</li>
          <li>Tratamento não discriminatório do tráfego (Marco Civil — princípio da neutralidade de rede);</li>
          <li>Privacidade e sigilo das comunicações;</li>
          <li>Atendimento gratuito 24/7 para reclamações de defeito;</li>
          <li>Resposta em até 5 dias úteis para reclamações registradas;</li>
          <li>Bloqueio gratuito de serviços não solicitados;</li>
          <li>Recebimento de fatura clara e detalhada;</li>
          <li>Cancelamento simples e em prazo igual ao da contratação.</li>
        </ul>
      </>
    ),
  },
  {
    id: "atendimento",
    title: "Canais de Atendimento e Ouvidoria",
    content: (
      <>
        <p>O atendimento segue o seguinte fluxo:</p>
        <ol>
          <li><strong>Central de Atendimento:</strong> primeiro contato, com geração de protocolo.</li>
          <li><strong>SAC:</strong> 24h, gratuito (Lei do SAC).</li>
          <li><strong>Ouvidoria Jotazo:</strong> recurso interno, prazo de resposta de 10 dias úteis. Acesse pela <a href="/ouvidoria">página da Ouvidoria</a>.</li>
          <li><strong>Anatel:</strong> ligue <strong>1331</strong> (telefonia) ou <strong>1332</strong> (acessibilidade), ou registre em <a href="https://www.gov.br/anatel" target="_blank" rel="noreferrer">gov.br/anatel</a>.</li>
          <li><strong>Procon e consumidor.gov.br:</strong> opções adicionais ao consumidor.</li>
        </ol>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações do Regulamento",
    content: (
      <p>
        Alterações nas condições gerais serão comunicadas com antecedência mínima de 30 dias.
        Mudanças prejudiciais ao Assinante autorizam a rescisão sem multa, ainda que dentro do
        período de fidelização (Resolução 632/2014, art. 58).
      </p>
    ),
  },
  {
    id: "disposicoes",
    title: "Disposições Finais",
    content: (
      <p>
        Este Regulamento integra o contrato de prestação de serviços. Em caso de divergência,
        prevalecem as cláusulas contratuais específicas e a regulamentação da Anatel. Foro eleito:
        <strong> Comarca de Apiaí/SP</strong>, ressalvado o direito do consumidor (CDC, art. 101, I).
      </p>
    ),
  },
];

export default function RegulamentoPage() {
  return (
    <>
      <SEOHead
        path="/regulamento"
        title="Regulamento de Serviços"
        description="Condições técnicas e comerciais dos serviços de telecomunicações da Jotazo: qualidade, instalação, reparo, fidelização, faturamento, cancelamento e direitos do assinante conforme regulamentação Anatel."
      />
      <LegalPageLayout
        icon={BookOpen}
        eyebrow="Documento Legal"
        title="Regulamento de Serviços"
        subtitle="Regras técnicas e comerciais para a prestação dos serviços de internet fibra, móvel 5G e TV por assinatura, em conformidade com as Resoluções Anatel 614/2013, 632/2014 e 574/2011, o CDC e a Lei do SAC."
        lastUpdated={LAST_UPDATED}
        sections={sections}
      />
    </>
  );
}
