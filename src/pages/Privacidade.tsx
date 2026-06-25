import { Shield } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";

const LAST_UPDATED = "25 de abril de 2026";

const sections: LegalSection[] = [
  {
    id: "introducao",
    title: "Introdução e Controlador",
    content: (
      <>
        <p>
          A <strong>Jotazo Telecom</strong> ("Jotazo", "nós", "nosso") respeita a sua privacidade
          e está comprometida em proteger os dados pessoais que você nos confia. Esta Política de
          Privacidade descreve como coletamos, utilizamos, armazenamos, compartilhamos e
          protegemos as informações pessoais de clientes, visitantes do site e demais titulares,
          em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD)</strong>,
          o <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong>, o
          <strong> Decreto nº 8.771/2016</strong>, o <strong>Código de Defesa do Consumidor</strong> e
          a regulamentação aplicável da Anatel.
        </p>
        <p>
          O <strong>Controlador</strong> dos dados pessoais é a Jotazo Telecom, sediada em Apiaí/SP,
          conforme dados de contato disponíveis no rodapé deste site e em nosso{" "}
          <a href="/sobre">Quem Somos</a>.
        </p>
      </>
    ),
  },
  {
    id: "dados-coletados",
    title: "Dados Pessoais que Coletamos",
    content: (
      <>
        <p>Coletamos dados pessoais nas seguintes categorias:</p>
        <h3>a) Dados cadastrais e contratuais</h3>
        <ul>
          <li>Nome completo, CPF/CNPJ, RG, data de nascimento, estado civil e nacionalidade.</li>
          <li>Endereço de instalação, endereço de cobrança e CEP.</li>
          <li>E-mail, telefone fixo e celular.</li>
          <li>Dados de pagamento (instituição bancária, cartão tokenizado, chave Pix).</li>
        </ul>
        <h3>b) Dados de conexão e tráfego (Marco Civil)</h3>
        <ul>
          <li>Endereço IP atribuído, data, hora e fuso horário das conexões.</li>
          <li>Registros de aplicação quando aplicável (acesso ao portal do cliente, app).</li>
          <li>Dados técnicos de qualidade do serviço (latência, perda de pacotes, jitter).</li>
        </ul>
        <h3>c) Dados de navegação no site</h3>
        <ul>
          <li>Páginas visitadas, tempo de permanência, origem do tráfego (referrer).</li>
          <li>Tipo de dispositivo, navegador, sistema operacional e resolução de tela.</li>
          <li>Identificadores de cookies e pixels (consulte nossa <a href="/cookies">Política de Cookies</a>).</li>
        </ul>
        <h3>d) Dados de localização</h3>
        <ul>
          <li>CEP fornecido para verificação de cobertura.</li>
          <li>Localização aproximada por IP, utilizada para ofertas regionais.</li>
        </ul>
        <p>
          <strong>Não tratamos dados pessoais sensíveis</strong> (origem racial, convicção religiosa,
          dado biométrico, dado de saúde, vida sexual etc.) salvo quando estritamente necessário e
          mediante consentimento específico.
        </p>
      </>
    ),
  },
  {
    id: "finalidades",
    title: "Finalidades e Bases Legais do Tratamento",
    content: (
      <>
        <p>Tratamos seus dados pessoais para as seguintes finalidades, com as respectivas bases legais previstas no art. 7º da LGPD:</p>
        <ul>
          <li>
            <strong>Execução de contrato</strong> — viabilizar a contratação, instalação, ativação,
            cobrança, suporte técnico e cancelamento dos serviços de telecomunicações (art. 7º, V).
          </li>
          <li>
            <strong>Cumprimento de obrigação legal e regulatória</strong> — atender às exigências da
            Anatel (Resoluções 614/2013 e 632/2014), do Marco Civil da Internet (guarda de registros
            de conexão por 1 ano) e da legislação fiscal e de telecomunicações (art. 7º, II).
          </li>
          <li>
            <strong>Legítimo interesse</strong> — prevenção a fraudes, segurança da rede,
            análise de crédito, melhoria contínua dos serviços e marketing direto a clientes ativos
            sobre produtos similares (art. 7º, IX).
          </li>
          <li>
            <strong>Exercício regular de direitos</strong> — defesa em processos judiciais,
            administrativos ou arbitrais (art. 7º, VI).
          </li>
          <li>
            <strong>Consentimento</strong> — envio de comunicações de marketing para não-clientes,
            cookies não essenciais e pesquisas opcionais (art. 7º, I).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "compartilhamento",
    title: "Compartilhamento de Dados",
    content: (
      <>
        <p>Compartilhamos dados pessoais somente quando necessário, com:</p>
        <ul>
          <li>
            <strong>Operadores e prestadores de serviço</strong> — instaladores terceirizados,
            empresas de cobrança, gateways de pagamento, plataformas de e-mail e SMS, atendimento
            via WhatsApp Business e provedores de hospedagem em nuvem.
          </li>
          <li>
            <strong>Birôs de crédito</strong> — Serasa, Boa Vista e SPC, para análise prévia e
            negativação em caso de inadimplência, observados os prazos legais.
          </li>
          <li>
            <strong>Autoridades competentes</strong> — Polícia, Ministério Público e Judiciário,
            mediante requisição formal e nos limites da lei (Marco Civil, art. 22).
          </li>
          <li>
            <strong>Anatel e órgãos de defesa do consumidor</strong> — quando demandado em
            reclamações ou auditorias regulatórias.
          </li>
          <li>
            <strong>Plataformas de publicidade</strong> — Meta (Facebook/Instagram) e Google,
            para mensuração de campanhas, mediante consentimento de cookies.
          </li>
        </ul>
        <p>
          <strong>Não vendemos seus dados pessoais.</strong> Quando há transferência internacional
          (por exemplo, uso de servidores em nuvem fora do Brasil), garantimos que o destinatário
          ofereça grau de proteção adequado, conforme art. 33 da LGPD.
        </p>
      </>
    ),
  },
  {
    id: "retencao",
    title: "Prazos de Retenção",
    content: (
      <>
        <p>Mantemos seus dados pessoais apenas pelo tempo necessário às finalidades:</p>
        <ul>
          <li><strong>Registros de conexão (IP/data/hora):</strong> 1 ano após a conexão (Marco Civil, art. 13).</li>
          <li><strong>Registros de acesso a aplicações:</strong> 6 meses (Marco Civil, art. 15).</li>
          <li><strong>Dados cadastrais e contratuais:</strong> durante o contrato e por até 5 anos após o término, para fins de prescrição cível (CC, art. 206) e fiscais.</li>
          <li><strong>Documentos fiscais:</strong> 5 anos (CTN, art. 173).</li>
          <li><strong>Gravações de atendimento:</strong> 90 dias, salvo determinação em contrário.</li>
          <li><strong>Cookies:</strong> conforme tabela na <a href="/cookies">Política de Cookies</a>.</li>
        </ul>
        <p>
          Após esses prazos, os dados são anonimizados ou eliminados de forma segura, exceto quando
          a manutenção for autorizada por lei.
        </p>
      </>
    ),
  },
  {
    id: "direitos",
    title: "Direitos do Titular",
    content: (
      <>
        <p>Nos termos do art. 18 da LGPD, você pode, a qualquer tempo, solicitar:</p>
        <ul>
          <li>Confirmação da existência de tratamento;</li>
          <li>Acesso aos dados;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
          <li>Portabilidade a outro fornecedor;</li>
          <li>Eliminação de dados tratados com base em consentimento;</li>
          <li>Informação sobre entidades com as quais compartilhamos seus dados;</li>
          <li>Revogação do consentimento;</li>
          <li>Revisão de decisões automatizadas que afetem seus interesses.</li>
        </ul>
        <p>
          Para exercer seus direitos, envie e-mail para o nosso Encarregado de Dados (DPO):
          <strong> contato@jotazo.com</strong> ou pelo telefone/WhatsApp <strong>0800 721 0179</strong>. Responderemos em até 15 dias.
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "Segurança da Informação",
    content: (
      <>
        <p>
          Adotamos medidas técnicas e administrativas alinhadas às melhores práticas do setor de
          telecomunicações para proteger seus dados, incluindo:
        </p>
        <ul>
          <li>Criptografia em trânsito (TLS 1.2+) e em repouso para dados sensíveis;</li>
          <li>Controle de acesso baseado em perfis (least privilege) e duplo fator de autenticação;</li>
          <li>Monitoramento contínuo de rede com detecção de intrusão e mitigação de DDoS;</li>
          <li>Segregação de ambientes (produção, homologação e desenvolvimento);</li>
          <li>Programa de gestão de vulnerabilidades e testes periódicos;</li>
          <li>Treinamento contínuo dos colaboradores em segurança e privacidade;</li>
          <li>Plano formal de resposta a incidentes, com notificação à ANPD quando aplicável (art. 48 da LGPD).</li>
        </ul>
      </>
    ),
  },
  {
    id: "menores",
    title: "Crianças e Adolescentes",
    content: (
      <p>
        Nossos serviços são contratados por pessoas maiores de 18 anos. Não coletamos
        intencionalmente dados de crianças e adolescentes. Caso identifiquemos coleta indevida,
        eliminaremos os dados imediatamente. Se você é responsável legal e identifica esse
        cenário, contate-nos pelo canal do DPO.
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações desta Política",
    content: (
      <p>
        Esta Política pode ser atualizada para refletir mudanças legais, regulatórias ou
        operacionais. Em caso de alteração relevante, notificaremos por e-mail, no portal do
        cliente ou em destaque no site. A versão vigente é sempre a publicada nesta página, com a
        data de "Última atualização" indicada no topo.
      </p>
    ),
  },
  {
    id: "contato",
    title: "Contato e Encarregado (DPO)",
    content: (
      <>
        <p>
          Para questões relativas à privacidade e proteção de dados, entre em contato com nosso
          Encarregado:
        </p>
        <ul>
          <li><strong>E-mail:</strong> contato@jotazo.com</li>
          <li><strong>Telefone/WhatsApp:</strong> 0800 721 0179</li>
          <li><strong>Endereço:</strong> Apiaí/SP</li>
        </ul>
        <p>
          Caso entenda que sua solicitação não foi atendida adequadamente, você pode dirigir-se à
          <strong> Autoridade Nacional de Proteção de Dados (ANPD)</strong> em{" "}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer">www.gov.br/anpd</a>.
        </p>
      </>
    ),
  },
];

export default function PrivacidadePage() {
  return (
    <>
      <SEOHead
        path="/privacidade"
        title="Política de Privacidade"
        description="Saiba como a Jotazo Telecom coleta, usa, armazena e protege seus dados pessoais em conformidade com a LGPD, o Marco Civil da Internet e a regulamentação Anatel."
      />
      <LegalPageLayout
        icon={Shield}
        eyebrow="Documento Legal"
        title="Política de Privacidade"
        subtitle="Como tratamos, protegemos e respeitamos seus dados pessoais conforme a LGPD (Lei nº 13.709/2018), o Marco Civil da Internet e a regulamentação aplicável da Anatel."
        lastUpdated={LAST_UPDATED}
        sections={sections}
      />
    </>
  );
}
