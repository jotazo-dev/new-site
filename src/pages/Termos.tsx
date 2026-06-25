import { FileText } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";

const LAST_UPDATED = "25 de abril de 2026";

const sections: LegalSection[] = [
  {
    id: "aceitacao",
    title: "Aceitação dos Termos",
    content: (
      <>
        <p>
          Estes Termos de Uso ("Termos") regulam o acesso e a utilização do site
          <strong> jotazo.com.br</strong>, do portal do cliente, dos aplicativos e dos serviços
          digitais oferecidos pela <strong>Jotazo Telecom</strong> ("Jotazo"). Ao navegar ou
          utilizar quaisquer destes serviços, você ("Usuário") declara ter lido, compreendido e
          concordado integralmente com estas condições.
        </p>
        <p>
          O Usuário deve ser civilmente capaz, nos termos do Código Civil Brasileiro (Lei nº 10.406/2002).
          Menores de idade só podem utilizar mediante autorização e supervisão de seus responsáveis legais.
        </p>
      </>
    ),
  },
  {
    id: "servicos",
    title: "Descrição dos Serviços",
    content: (
      <>
        <p>A Jotazo é prestadora de Serviço de Comunicação Multimídia (SCM) e oferece:</p>
        <ul>
          <li><strong>Internet banda larga via fibra óptica (FTTH/GPON)</strong> com diferentes velocidades.</li>
          <li><strong>Internet móvel 5G</strong>, em parceria com operadora autorizada (MVNO).</li>
          <li><strong>TV por assinatura</strong> e serviços de streaming agregados (SVA).</li>
          <li><strong>Combos</strong> com soluções convergentes para residências e empresas.</li>
          <li><strong>Soluções corporativas</strong> com SLA dedicado.</li>
        </ul>
        <p>
          As condições comerciais específicas (velocidade, preço, prazo de fidelização, área de
          cobertura) constam no contrato de prestação de serviço, que prevalece sobre estes Termos
          em caso de divergência.
        </p>
      </>
    ),
  },
  {
    id: "cadastro",
    title: "Cadastro e Conta do Usuário",
    content: (
      <>
        <p>
          Para contratar os serviços ou utilizar o portal do cliente, é necessário fornecer
          informações verdadeiras, completas e atualizadas. O Usuário é o único responsável por:
        </p>
        <ul>
          <li>Manter sigilo sobre login e senha;</li>
          <li>Notificar imediatamente acessos não autorizados;</li>
          <li>Manter o cadastro atualizado, especialmente endereço e contatos para faturamento;</li>
          <li>Toda atividade realizada com suas credenciais.</li>
        </ul>
        <p>
          A Jotazo poderá suspender ou cancelar contas que apresentem dados falsos, fraude
          documental ou tentativa de uso indevido.
        </p>
      </>
    ),
  },
  {
    id: "uso-aceitavel",
    title: "Política de Uso Aceitável",
    content: (
      <>
        <p>
          O Usuário concorda em utilizar a rede e os serviços de forma lícita, ética e respeitosa.
          É <strong>expressamente vedado</strong>:
        </p>
        <ul>
          <li>Praticar ou facilitar atividades ilegais, incluindo fraude, pirataria e violação de direitos autorais;</li>
          <li>Distribuir spam, phishing, malware, vírus ou conteúdo malicioso;</li>
          <li>Realizar ataques de negação de serviço (DoS/DDoS), varreduras de portas ou exploração de vulnerabilidades;</li>
          <li>Hospedar serviços que violem o contrato residencial em conexão de uso pessoal;</li>
          <li>Compartilhar a conexão fora do imóvel contratado ou revender o serviço sem autorização escrita;</li>
          <li>Acessar, divulgar ou armazenar conteúdo de pornografia infantil, racismo, terrorismo ou apologia a crimes;</li>
          <li>Utilizar a conexão para mineração de criptomoedas em escala que comprometa a rede;</li>
          <li>Burlar limites técnicos, sistemas de proteção ou medidores de tráfego.</li>
        </ul>
        <p>
          O descumprimento poderá ensejar suspensão imediata do serviço, rescisão contratual com
          aplicação de multa e comunicação às autoridades competentes, sem prejuízo das
          responsabilidades civis e criminais cabíveis.
        </p>
      </>
    ),
  },
  {
    id: "propriedade",
    title: "Propriedade Intelectual",
    content: (
      <p>
        Todo o conteúdo do site e dos aplicativos — incluindo marca, logotipo, layout,
        textos, imagens, vídeos, códigos-fonte e bases de dados — é de titularidade exclusiva da
        Jotazo Telecom ou de seus licenciantes, protegido pela Lei de Direitos Autorais (Lei nº 9.610/1998),
        Lei de Propriedade Industrial (Lei nº 9.279/1996) e Marco Civil da Internet. É vedada
        qualquer reprodução, distribuição ou modificação sem autorização prévia e por escrito.
      </p>
    ),
  },
  {
    id: "qualidade",
    title: "Qualidade do Serviço e Disponibilidade",
    content: (
      <>
        <p>
          Os serviços são prestados em regime de melhor esforço, observados os parâmetros de
          qualidade da <strong>Resolução Anatel nº 574/2011</strong>:
        </p>
        <ul>
          <li>Velocidade instantânea mínima: <strong>40%</strong> da velocidade contratada;</li>
          <li>Velocidade média mensal mínima: <strong>80%</strong> da velocidade contratada;</li>
          <li>Disponibilidade mensal mínima: <strong>95%</strong> (residencial) ou conforme SLA corporativo.</li>
        </ul>
        <p>
          Eventuais interrupções por manutenção programada serão comunicadas com antecedência.
          A Jotazo não se responsabiliza por indisponibilidades decorrentes de caso fortuito,
          força maior, falhas em equipamentos do Usuário, ações de terceiros ou serviços de
          backbone alheios ao seu controle direto.
        </p>
      </>
    ),
  },
  {
    id: "responsabilidade",
    title: "Limitação de Responsabilidade",
    content: (
      <>
        <p>A Jotazo se responsabiliza pelos serviços contratados, observada a legislação consumerista. Não responderá por:</p>
        <ul>
          <li>Perdas indiretas, lucros cessantes ou danos morais decorrentes de mau uso;</li>
          <li>Conteúdos de terceiros acessados pela rede;</li>
          <li>Equipamentos do Usuário (roteadores próprios, dispositivos com defeito);</li>
          <li>Falhas em serviços contratados de terceiros (streaming, jogos online, plataformas externas).</li>
        </ul>
      </>
    ),
  },
  {
    id: "rescisao",
    title: "Suspensão e Rescisão",
    content: (
      <>
        <p>O contrato pode ser rescindido:</p>
        <ul>
          <li><strong>Pelo Usuário</strong>, a qualquer tempo, mediante solicitação pelos canais oficiais. A solicitação será efetivada em até 24 horas (Lei do SAC). Havendo fidelização vigente, será cobrada multa proporcional, conforme contrato.</li>
          <li><strong>Pela Jotazo</strong>, em caso de inadimplência superior a 30 dias, descumprimento da Política de Uso Aceitável, fraude ou impossibilidade técnica de prestação.</li>
        </ul>
        <p>A devolução de equipamentos em comodato é obrigatória em até 30 dias após a rescisão, sob pena de cobrança do valor de mercado.</p>
      </>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações dos Termos",
    content: (
      <p>
        A Jotazo poderá atualizar estes Termos a qualquer momento. Alterações relevantes serão
        comunicadas com antecedência mínima de 30 dias por e-mail, portal do cliente ou aviso no
        site. O uso continuado após a vigência das mudanças configura aceitação tácita.
      </p>
    ),
  },
  {
    id: "lei-foro",
    title: "Lei Aplicável e Foro",
    content: (
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro
        da <strong>Comarca de Apiaí/SP</strong> para dirimir quaisquer controvérsias,
        ressalvado o direito do consumidor de optar pelo foro do seu domicílio (CDC, art. 101, I).
      </p>
    ),
  },
  {
    id: "contato",
    title: "Contato",
    content: (
      <>
        <p>Dúvidas sobre estes Termos podem ser encaminhadas a:</p>
        <ul>
          <li><strong>E-mail:</strong> contato@jotazo.com</li>
          <li><strong>Telefone/WhatsApp:</strong> 0800 721 0179</li>
          <li><strong>Ouvidoria:</strong> via <a href="/ouvidoria">página da Ouvidoria</a></li>
          <li><strong>Anatel:</strong> 1331 (telefonia) ou 1332 (acessibilidade)</li>
        </ul>
      </>
    ),
  },
];

export default function TermosPage() {
  return (
    <>
      <SEOHead
        path="/termos"
        title="Termos de Uso"
        description="Conheça as condições para utilização dos serviços, site e aplicativos da Jotazo Telecom: cadastro, uso aceitável da rede, qualidade do serviço, rescisão e foro."
      />
      <LegalPageLayout
        icon={FileText}
        eyebrow="Documento Legal"
        title="Termos de Uso"
        subtitle="Regras para utilização do site, do portal do cliente, dos aplicativos e dos serviços de telecomunicações da Jotazo, em conformidade com o Marco Civil da Internet, o Código de Defesa do Consumidor e a regulamentação Anatel."
        lastUpdated={LAST_UPDATED}
        sections={sections}
      />
    </>
  );
}
